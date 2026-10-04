const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { execSync, execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const pty = require('node-pty');
const { getWorktrees: readWorktrees, getGitInfo: readGitInfo } = require('./git/gitInfo');
const { createWorkspaceConfigStore } = require('../application/workspaceConfigStore');
const { createWorkspaceService } = require('../application/workspaceService');
const { registerWorkspaceIpc } = require('./ipc/workspaceIpc');
const { registerBakitIpc } = require('./bakit/bakitService');
const { registerReakitIpc } = require('./reakit/reakitService');
const { DeviceService } = require('./device/deviceService');
const { registerDeviceIpc } = require('./ipc/deviceIpc');
const { installPtyShutdownLifecycle, killPtyProcess } = require('./process/ptyLifecycle');

// ── State ──────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'workspaces.json');
const workspaceConfigStore = createWorkspaceConfigStore({ configPath });
const workspaceService = createWorkspaceService({
  configStore: workspaceConfigStore,
  getWorktrees: (projectPath) => readWorktrees(projectPath, execSync, path, Buffer),
});
const deviceService = new DeviceService(() => workspaceService.getSettings());
let mainWindow = null;
const ptyProcesses = new Map(); // id -> pty process

// ── Git Helpers ────────────────────────────────────────
function getGitInfo(dirPath) {
  return readGitInfo(dirPath, execSync);
}

function shellQuoteWindowsArg(value) {
  const normalized = String(value);
  if (!/[\s"]/u.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildShellCommand(commandOrPath, args = []) {
  return [commandOrPath, ...args].map(shellQuoteWindowsArg).join(' ');
}

function resolveToolLaunch(command, extraArgs = []) {
  const launchArgs = Array.isArray(extraArgs) ? extraArgs.map((arg) => String(arg)) : [];

  if (process.platform !== 'win32') {
    return {
      file: command,
      args: launchArgs,
      shellCommand: buildShellCommand(command, launchArgs),
    };
  }

  try {
    const output = execFileSync('where.exe', [command], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    const matches = output.split(/\r?\n/).filter(Boolean);
    const resolvedPath = matches.find((match) => /\.(cmd|bat)$/i.test(match))
      || matches.find((match) => /\.exe$/i.test(match))
      || matches[0];
    if (!resolvedPath) {
      throw new Error(`Tool not found on PATH: ${command}`);
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext === '.cmd' || ext === '.bat') {
      return {
        file: 'cmd.exe',
        args: ['/d', '/c', resolvedPath, ...launchArgs],
        shellCommand: buildShellCommand(resolvedPath, launchArgs),
      };
    }

    return {
      file: resolvedPath,
      args: launchArgs,
      shellCommand: buildShellCommand(resolvedPath, launchArgs),
    };
  } catch (error) {
    throw new Error(error?.message || `Tool not found on PATH: ${command}`);
  }
}

function getRecentCommits(dirPath, count = 5) {
  try {
    const output = execSync(`git log -${count} --format="%h|%s|%cr|%an"`, {
      cwd: dirPath,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    return output.split('\n').filter(Boolean).map((line) => {
      const [hash, message, date, author] = line.split('|');
      return { hash, message, date, author };
    });
  } catch (_) {
    return [];
  }
}

function normalizeWorktreePath(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  return process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath;
}

function findWorktree(projectPath, wtPath) {
  const normalizedWtPath = normalizeWorktreePath(wtPath);
  return readWorktrees(projectPath, execSync, path, Buffer)
    .find((worktree) => worktree.path && normalizeWorktreePath(worktree.path) === normalizedWtPath);
}

function isLocalBranch(projectPath, branchName) {
  if (!branchName) {
    return false;
  }

  try {
    execFileSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
      cwd: projectPath,
      stdio: 'ignore',
      timeout: 10000,
    });
    return true;
  } catch (_) {
    return false;
  }
}

function isLockRelatedRemoveError(error) {
  const message = `${error?.stderr || ''}\n${error?.message || ''}`.toLowerCase();
  return message.includes('permission denied')
    || message.includes('access is denied')
    || message.includes('device or resource busy')
    || message.includes('used by another process')
    || message.includes('file is being used by another process');
}

function closePtyById(id) {
  const proc = ptyProcesses.get(id);
  if (!proc) {
    return false;
  }

  killPtyProcess(proc, execSync);
  ptyProcesses.delete(id);
  return true;
}

function removeWorktreeWithOptionalBranchDelete({ projectPath, wtPath, force = false, deleteBranch = false }) {
  if (!projectPath || !wtPath) {
    return { success: false, error: 'Project path and worktree path are required' };
  }

  if (normalizeWorktreePath(projectPath) === normalizeWorktreePath(wtPath)) {
    return { success: false, error: 'Cannot remove the primary project worktree' };
  }

  const worktree = findWorktree(projectPath, wtPath);
  if (!worktree) {
    return { success: false, error: 'Worktree path was not found in this repository' };
  }

  if (deleteBranch) {
    if (!worktree.branch || worktree.detached || worktree.bare) {
      return { success: false, error: 'Cannot delete branch: worktree does not have a local branch' };
    }
    if (!isLocalBranch(projectPath, worktree.branch)) {
      return { success: false, error: 'Cannot delete branch: only local branches can be deleted' };
    }
  }

  let removeOutput = '';
  try {
    const removeArgs = ['worktree', 'remove'];
    if (force) removeArgs.push('--force');
    removeArgs.push(wtPath);
    removeOutput = execFileSync('git', removeArgs, {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 30000,
    }) || '';
  } catch (e) {
    const errorMessage = e.stderr || e.message;
    if (isLockRelatedRemoveError(e)) {
      return {
        success: false,
        error: `${errorMessage}\nClose terminals, editors, Explorer windows, or other apps using this worktree, then retry. Admin rights usually do not fix active file locks.`,
      };
    }
    return { success: false, error: errorMessage };
  }

  if (!deleteBranch) {
    return { success: true, output: removeOutput.trim() };
  }

  try {
    const branchOutput = execFileSync('git', ['branch', '--delete', worktree.branch], {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 30000,
    }) || '';
    const output = [removeOutput, branchOutput].filter(Boolean).join('\n').trim();
    return { success: true, output, branchDeleted: true };
  } catch (e) {
    const branchDeleteError = e.stderr || e.message;
    return {
      success: false,
      error: `Worktree removed but branch deletion failed: ${branchDeleteError}`,
      output: removeOutput.trim(),
      removedWorktree: true,
      branchDeleted: false,
    };
  }
}

// ── Detect default shell ───────────────────────────────
function getDefaultShell() {
  if (process.platform === 'win32') {
    // Prefer PowerShell 7+ if available, then pwsh, then powershell
    const pwshPaths = [
      'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      'C:\\Program Files\\PowerShell\\pwsh.exe',
    ];
    for (const p of pwshPaths) {
      if (fs.existsSync(p)) return p;
    }
    // Check if pwsh is on PATH
    try {
      execSync('where pwsh', { encoding: 'utf-8', timeout: 3000 });
      return 'pwsh.exe';
    } catch (_) {}
    return 'powershell.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

// ── External links ─────────────────────────────────────
// Only http/https reach the OS handler; other schemes (file:, javascript:, custom
// protocols) are ignored so terminal output can't launch arbitrary apps.
function openExternalUrl(url) {
  if (typeof url !== 'string') return { success: false, error: 'Invalid URL' };
  if (!/^https?:\/\//iu.test(url)) return { success: false, error: 'Unsupported URL scheme' };
  shell.openExternal(url).catch((err) => {
    console.error('Failed to open external link:', err);
  });
  return { success: true };
}

// ── Window ─────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#08080d',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Intercept window.open calls (e.g. from xterm web-links addon or target="_blank" links).
  // Note: some callers (xterm's WebLinksAddon) call window.open() with no URL and then assign
  // location.href, so `url` here can be about:blank — never let that spawn a child window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  // Intercept standard navigation in the main window (e.g. clicks on normal HTTP/HTTPS links)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault();
      openExternalUrl(url);
    }
  });

  mainWindow.loadFile(path.join(app.getAppPath(), 'src', 'renderer', 'index.html'));
  return mainWindow;
}

// ── App lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  workspaceConfigStore.loadConfig();
  createWindow();
  registerWorkspaceIpc({
    ipcMain,
    dialog,
    mainWindow,
    workspaceService,
    deviceService,
  });

  registerBakitIpc({ ipcMain });
  registerDeviceIpc({ ipcMain, deviceService });
  registerReakitIpc({ ipcMain, workspaceService, shell });

  ipcMain.handle('get-git-info', (_, dirPath) => getGitInfo(dirPath));
  ipcMain.handle('get-recent-commits', (_, dirPath) => getRecentCommits(dirPath));

  ipcMain.handle('symlink:check-status', (_, { worktreePath, name, targetPath }) => {
    const linkPath = path.join(worktreePath, name);
    try {
      const stats = fs.lstatSync(linkPath);
      let currentTarget = null;
      let isLink = stats.isSymbolicLink();
      
      if (isLink) {
        currentTarget = fs.readlinkSync(linkPath);
      } else if (stats.isDirectory()) {
        try {
          currentTarget = fs.readlinkSync(linkPath);
          isLink = true;
        } catch (e) {}
      }
      
      if (isLink && currentTarget) {
        const resolvedCurrent = path.resolve(worktreePath, currentTarget).toLowerCase();
        const resolvedTarget = path.resolve(targetPath).toLowerCase();
        if (resolvedCurrent === resolvedTarget) {
          return { exists: true, pointsToTarget: true };
        } else {
          return { exists: true, pointsToTarget: false, currentTarget: resolvedCurrent };
        }
      } else {
        return { exists: true, isRealDirectory: !isLink && stats.isDirectory(), pointsToTarget: false };
      }
    } catch (e) {
      return { exists: false, pointsToTarget: false };
    }
  });

  ipcMain.handle('symlink:create', (_, { worktreePath, name, targetPath }) => {
    const linkPath = path.join(worktreePath, name);
    try {
      try {
        const stats = fs.lstatSync(linkPath);
        let isLink = stats.isSymbolicLink();
        if (!isLink && stats.isDirectory()) {
          try {
            fs.readlinkSync(linkPath);
            isLink = true;
          } catch (e) {}
        }
        
        if (isLink) {
          fs.unlinkSync(linkPath);
        } else {
          return { success: false, error: `A real file or folder already exists at "${name}". Please delete or rename it first.` };
        }
      } catch (e) {}
      
      const type = process.platform === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(targetPath, linkPath, type);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('symlink:delete', (_, { worktreePath, name }) => {
    const linkPath = path.join(worktreePath, name);
    try {
      const stats = fs.lstatSync(linkPath);
      let isLink = stats.isSymbolicLink();
      if (!isLink && stats.isDirectory()) {
        try {
          fs.readlinkSync(linkPath);
          isLink = true;
        } catch (e) {}
      }
      
      if (isLink) {
        fs.unlinkSync(linkPath);
        return { success: true };
      } else {
        return { success: false, error: `Refusing to delete: "${name}" is a real file or folder, not a symlink.` };
      }
    } catch (e) {
      return { success: true };
    }
  });

  ipcMain.handle('symlink:scan', (_, { worktreePath }) => {
    if (!worktreePath) return [];
    try {
      const files = fs.readdirSync(worktreePath);
      const discovered = [];
      for (const file of files) {
        const linkPath = path.join(worktreePath, file);
        try {
          const stats = fs.lstatSync(linkPath);
          let isLink = stats.isSymbolicLink();
          let target = null;
          if (isLink) {
            target = fs.readlinkSync(linkPath);
          } else if (stats.isDirectory()) {
            try {
              target = fs.readlinkSync(linkPath);
              isLink = true;
            } catch (e) {}
          }
          
          if (isLink && target) {
            discovered.push({
              name: file,
              targetPath: path.resolve(worktreePath, target),
            });
          }
        } catch (e) {}
      }
      return discovered;
    } catch (err) {
      console.error('Failed to scan symlinks:', err);
      return [];
    }
  });

  ipcMain.handle('git:update-exclude', (_, { worktreePath, patterns, action }) => {
    try {
      let excludePath;
      try {
        const gitExcludeRel = execSync('git rev-parse --git-path info/exclude', {
          cwd: worktreePath,
          encoding: 'utf-8',
          timeout: 3000,
        }).trim();
        excludePath = path.resolve(worktreePath, gitExcludeRel);
      } catch (e) {
        excludePath = path.join(worktreePath, '.git', 'info', 'exclude');
      }

      const infoDir = path.dirname(excludePath);
      
      let lines = [];
      if (fs.existsSync(excludePath)) {
        lines = fs.readFileSync(excludePath, 'utf-8')
          .split(/\r?\n/)
          .map(l => l.trim());
      }

      if (action === 'add') {
        if (!fs.existsSync(infoDir)) {
          fs.mkdirSync(infoDir, { recursive: true });
        }
        
        let changed = false;
        const newLines = [...lines];
        
        const header = '# Agent toolkit (auto-added by coding-space)';
        if (!newLines.includes(header) && !newLines.includes('# SkillHub toolkit (auto-added by coding-space)')) {
          if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
            newLines.push('');
          }
          newLines.push(header);
          changed = true;
        }
        
        for (const pattern of patterns) {
          if (!newLines.includes(pattern)) {
            newLines.push(pattern);
            changed = true;
          }
        }
        
        if (changed) {
          fs.writeFileSync(excludePath, newLines.join('\n') + '\n', 'utf-8');
        }
      } else if (action === 'remove') {
        if (fs.existsSync(excludePath)) {
          let changed = false;
          const filteredLines = lines.filter(line => {
            if (patterns.includes(line)) {
              changed = true;
              return false;
            }
            if (line === '# SkillHub toolkit (auto-added by coding-space)' || line === '# Agent toolkit (auto-added by coding-space)') {
              changed = true;
              return false;
            }
            return true;
          });
          
          const finalLines = [];
          for (let i = 0; i < filteredLines.length; i++) {
            if (filteredLines[i] === '' && (i === 0 || filteredLines[i-1] === '')) {
              changed = true;
              continue;
            }
            finalLines.push(filteredLines[i]);
          }
          
          if (changed) {
            fs.writeFileSync(excludePath, finalLines.join('\n') + '\n', 'utf-8');
          }
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('dir:create', (_, { dirPath }) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('path:exists', (_, targetPath) => {
    return fs.existsSync(targetPath);
  });

  ipcMain.handle('project:write-file', (_, { worktreePath, filename, content }) => {
    try {
      if (!worktreePath || !filename) {
        throw new Error('Worktree path and filename are required.');
      }
      const targetFilePath = path.join(worktreePath, filename);
      const parentDir = path.dirname(targetFilePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, content, 'utf-8');
      return { success: true, filePath: targetFilePath };
    } catch (err) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('project:download-file', async (_, { url, targetFilePath }) => {
    try {
      if (!url || !targetFilePath) {
        throw new Error('URL and targetFilePath are required.');
      }
      if (fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).size > 0) {
        return { success: true, cached: true, filePath: targetFilePath };
      }
      const parentDir = path.dirname(targetFilePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetFilePath, buffer);
      return { success: true, cached: false, filePath: targetFilePath };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Directory recursive copy helper
  function copyFolderSync(from, to) {
    if (!fs.existsSync(from)) return;
    const stat = fs.statSync(from);
    if (stat.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      const entries = fs.readdirSync(from, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);
        copyFolderSync(srcPath, destPath);
      }
    } else {
      const parentDir = path.dirname(to);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.copyFileSync(from, to);
    }
  }

  // File/directory attribute reset helper for read-only files
  function clearReadOnlyAttributes(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    try {
      const stat = fs.statSync(targetPath);
      fs.chmodSync(targetPath, 0o666);
      if (stat.isDirectory()) {
        const items = fs.readdirSync(targetPath);
        for (const item of items) {
          clearReadOnlyAttributes(path.join(targetPath, item));
        }
      }
    } catch (e) {
      // Ignore errors resetting attributes
    }
  }

  // Safe recursive remove helper
  function safeRmSync(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        clearReadOnlyAttributes(targetPath);
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } catch (retryErr) {
          throw retryErr;
        }
      } else {
        throw err;
      }
    }
  }

  ipcMain.handle('toolkit:get-default-sources', () => {
    const toolkitsDir = app.isPackaged
      ? path.join(process.resourcesPath, 'toolkits')
      : path.join(app.getAppPath(), 'toolkits');
    return {
      bakitPath: path.join(toolkitsDir, 'BAKit'),
    };
  });

  ipcMain.handle('toolkit:check-status', (_, { worktreePath, name, sourcePath }) => {
    const targetPath = path.join(worktreePath, name);
    try {
      if (sourcePath && fs.existsSync(sourcePath)) {
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
          if (!fs.existsSync(targetPath)) {
            return { exists: false };
          }
          const items = fs.readdirSync(sourcePath);
          if (items.length === 0) {
            return { exists: fs.existsSync(targetPath) };
          }
          for (const item of items) {
            const itemDest = path.join(targetPath, item);
            if (!fs.existsSync(itemDest)) {
              return { exists: false };
            }
          }
          return { exists: true };
        } else {
          return { exists: fs.existsSync(targetPath) };
        }
      } else {
        const exists = fs.existsSync(targetPath);
        return { exists };
      }
    } catch (e) {
      return { exists: false };
    }
  });

  // preserveExisting: keep items already present in the worktree (user-edited files such as a filled-in project config).
  ipcMain.handle('toolkit:deploy', (_, { worktreePath, name, sourcePath, preserveExisting }) => {
    const destPath = path.join(worktreePath, name);
    try {
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: `Source path does not exist: ${sourcePath}` };
      }
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        const items = fs.readdirSync(sourcePath);
        for (const item of items) {
          const itemSrc = path.join(sourcePath, item);
          const itemDest = path.join(destPath, item);
          if (fs.existsSync(itemDest)) {
            if (preserveExisting) continue;
            safeRmSync(itemDest);
          }
          copyFolderSync(itemSrc, itemDest);
        }
      } else {
        if (!fs.existsSync(path.dirname(destPath))) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
        }
        if (fs.existsSync(destPath)) {
          safeRmSync(destPath);
        }
        fs.copyFileSync(sourcePath, destPath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('toolkit:remove', (_, { worktreePath, name, sourcePath }) => {
    const destPath = path.join(worktreePath, name);
    try {
      if (sourcePath && fs.existsSync(sourcePath)) {
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
          if (fs.existsSync(destPath)) {
            const items = fs.readdirSync(sourcePath);
            for (const item of items) {
              const itemDest = path.join(destPath, item);
              if (fs.existsSync(itemDest)) {
                safeRmSync(itemDest);
              }
            }
            try {
              if (fs.readdirSync(destPath).length === 0) {
                safeRmSync(destPath);
              }
            } catch (e) {
              // Ignore failure to remove empty directory
            }
          }
        } else {
          if (fs.existsSync(destPath)) {
            safeRmSync(destPath);
          }
        }
      } else {
        if (fs.existsSync(destPath)) {
          safeRmSync(destPath);
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });


  // ── PTY / Embedded Terminal ──────────────────────────

  ipcMain.handle('pty:create', (_, { cwd, id }) => {
    try {
      const shellPath = getDefaultShell();
      const shellArgs = shellPath.includes('pwsh') || shellPath.includes('powershell')
        ? ['-NoLogo']
        : [];

      const ptyProc = pty.spawn(shellPath, shellArgs, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: cwd || os.homedir(),
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      ptyProcesses.set(id, ptyProc);

      ptyProc.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:data', { id, data });
        }
      });

      ptyProc.onExit(({ exitCode }) => {
        ptyProcesses.delete(id);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:exit', { id, exitCode });
        }
      });

      return { success: true, pid: ptyProc.pid };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('pty:create-tool', (_, { cwd, id, command, args = [] }) => {
    try {
      const { file: toolPath, args: toolArgs } = resolveToolLaunch(command, args);

      const ptyProc = pty.spawn(toolPath, toolArgs, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: cwd || os.homedir(),
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      ptyProcesses.set(id, ptyProc);

      ptyProc.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:data', { id, data });
        }
      });

      ptyProc.onExit(({ exitCode }) => {
        ptyProcesses.delete(id);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:exit', { id, exitCode });
        }
      });

      return { success: true, pid: ptyProc.pid };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('tool:resolve-launch', (_, { command, args = [] }) => {
    try {
      const { shellCommand } = resolveToolLaunch(command, args);
      return { success: true, shellCommand };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.on('pty:write', (_, { id, data }) => {
    const proc = ptyProcesses.get(id);
    if (proc) proc.write(data);
  });

  ipcMain.on('pty:resize', (_, { id, cols, rows }) => {
    const proc = ptyProcesses.get(id);
    if (proc) {
      try {
        proc.resize(cols, rows);
      } catch (_) {}
    }
  });

  ipcMain.handle('pty:kill', (_, { id }) => {
    closePtyById(id);
    return { success: true };
  });

  // ── Launch Actions (kept for external terminal) ──────

  ipcMain.handle('open-wt', (_, { cwd, launchCommand, launchArgs = [] }) => {
    try {
      const args = launchCommand
        ? ['new-tab', '-d', cwd, 'cmd.exe', '/d', '/k', resolveToolLaunch(launchCommand, launchArgs).shellCommand]
        : ['new-tab', '-d', cwd];
      spawn('wt.exe', args, { detached: true, stdio: 'ignore', shell: true });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-in-editor', (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.vscodePath || findVsCodeExecutable();
      const ext = path.extname(exe).toLowerCase();
      let spawnFile;
      let spawnArgs;
      if (ext === '.cmd' || ext === '.bat') {
        spawnFile = 'cmd.exe';
        spawnArgs = ['/d', '/c', exe, dirPath];
      } else {
        spawnFile = exe;
        spawnArgs = [dirPath];
      }
      const useShell = !path.isAbsolute(exe);
      spawn(spawnFile, spawnArgs, { cwd: dirPath, shell: useShell, detached: true, stdio: 'ignore' });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-external', (_, url) => openExternalUrl(url));

  ipcMain.handle('open-in-explorer', (_, dirPath) => {
    void shell.openPath(dirPath);
    return { success: true };
  });

  // ── Launch tool actions ──────────────────────────────

  ipcMain.handle('open-in-android-studio', (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.androidStudioPath || findAndroidStudioExecutable();
      const ext = path.extname(exe).toLowerCase();
      let spawnFile;
      let spawnArgs;
      if (ext === '.cmd' || ext === '.bat') {
        spawnFile = 'cmd.exe';
        spawnArgs = ['/d', '/c', exe, dirPath];
      } else {
        spawnFile = exe;
        spawnArgs = [dirPath];
      }
      const useShell = !path.isAbsolute(exe);
      spawn(spawnFile, spawnArgs, { cwd: dirPath, shell: useShell, detached: true, stdio: 'ignore' });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  function detectPath(command, possiblePaths) {
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    if (process.platform === 'win32') {
      try {
        const output = execFileSync('where.exe', [command], {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        const matches = output.split(/\r?\n/).filter(Boolean);
        const resolvedPath = matches.find((match) => /\.(cmd|bat)$/i.test(match))
          || matches.find((match) => /\.exe$/i.test(match))
          || matches[0];
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          return resolvedPath;
        }
      } catch (_) {}
    } else {
      try {
        const output = execSync(`which ${command}`, {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (output && fs.existsSync(output)) {
          return output;
        }
      } catch (_) {}
    }
    return null;
  }

  ipcMain.handle('detect-integration-paths', () => {
    return {
      antigravityPath: detectPath('antigravity-ide', [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'bin', 'antigravity-ide.cmd'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Antigravity IDE', 'Antigravity IDE.exe'),
      ]),
      antigravityAgentPath: detectPath('antigravity', [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity', 'Antigravity.exe'),
      ]),
      androidStudioPath: detectPath('studio64', [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      ]),
      vscodePath: detectPath('code', [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'Code.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft VS Code', 'Code.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft VS Code', 'bin', 'code.cmd'),
      ]),
      scrcpyPath: detectPath('scrcpy', [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'scrcpy.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'scrcpy', 'scrcpy.exe'),
      ]),
      figmaPath: detectPath('figma', [
        path.join(os.homedir(), 'AppData', 'Local', 'Figma', 'Figma.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Figma', 'Figma.exe'),
      ]),
      obsidianPath: detectPath('obsidian', [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Obsidian', 'Obsidian.exe'),
        path.join(os.homedir(), 'AppData', 'Local', 'Obsidian', 'Obsidian.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Obsidian', 'Obsidian.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Obsidian', 'Obsidian.exe'),
      ]),
      obsidianVault: findDefaultObsidianVault(),
      reakitPath: detectPath('rea', [
        path.join(process.cwd(), 'toolkits', 'ReaKit'),
        path.join(process.resourcesPath || '', 'toolkits', 'ReaKit'),
        'D:\\Quest\\BA_Space\\toolkits\\ReaKit',
        'D:\\Quest\\ReaKit',
        path.join(process.cwd(), '..', 'ReaKit'),
        path.join(process.cwd(), 'ReaKit'),
      ]),
    };
  });


  function findAntigravityExecutable() {
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity IDE', 'bin', 'antigravity-ide.cmd'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Antigravity IDE', 'Antigravity IDE.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('antigravity-ide').file;
    } catch (_) {
      return 'antigravity-ide';
    }
  }

  function findAntigravityAgentExecutable() {
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity', 'Antigravity.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('antigravity').file;
    } catch (_) {
      return 'antigravity';
    }
  }

  function findAndroidStudioExecutable() {
    const possiblePaths = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('studio64').file;
    } catch (_) {
      return 'studio64';
    }
  }

  function findVsCodeExecutable() {
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft VS Code', 'bin', 'code.cmd'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft VS Code', 'bin', 'code.cmd'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('code').file;
    } catch (_) {
      return 'code';
    }
  }

  function findFigmaExecutable(): string | null {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const possiblePaths = [
      path.join(localAppData, 'Figma', 'Figma.exe'),
      path.join(localAppData, 'Programs', 'Figma', 'Figma.exe'),
      path.join(programFiles, 'Figma', 'Figma.exe'),
      path.join(programFilesX86, 'Figma', 'Figma.exe'),
      // macOS
      '/Applications/Figma.app/Contents/MacOS/Figma',
      path.join(os.homedir(), 'Applications', 'Figma.app', 'Contents', 'MacOS', 'Figma'),
      // Linux
      '/usr/bin/figma-linux',
      '/usr/local/bin/figma-linux',
      '/snap/bin/figma-linux',
      '/usr/bin/figma',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    // Check versioned directories in AppData/Local/Figma (e.g. app-126.9.11/Figma.exe)
    const figmaBase = path.join(localAppData, 'Figma');
    if (fs.existsSync(figmaBase)) {
      try {
        const subdirs = fs.readdirSync(figmaBase).filter((name) => name.startsWith('app-')).sort().reverse();
        for (const dir of subdirs) {
          const candidate = path.join(figmaBase, dir, 'Figma.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      } catch {
        // ignore read error
      }
    }

    try {
      return resolveToolLaunch('figma').file;
    } catch (_) {
      return null;
    }
  }

  function findScrcpyExecutable() {
    const possiblePaths = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'scrcpy.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'scrcpy', 'scrcpy.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('scrcpy').file;
    } catch (_) {
      return null;
    }
  }

  function getObsidianVaultsFromConfig(): Array<{ id: string; path: string; name: string; open?: boolean }> {
    try {
      const configPath = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'obsidian',
        'obsidian.json'
      );
      if (!fs.existsSync(configPath)) return [];
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!parsed || typeof parsed.vaults !== 'object') return [];
      return Object.entries(parsed.vaults).map(([id, item]: [string, any]) => ({
        id,
        path: item.path,
        name: path.basename(item.path),
        open: !!item.open,
      }));
    } catch (_) {
      return [];
    }
  }

  function findDefaultObsidianVault(): string | null {
    const vaults = getObsidianVaultsFromConfig();
    if (vaults.length === 0) return null;
    const openVault = vaults.find((v) => v.open);
    return openVault ? openVault.name : vaults[0].name;
  }

  function findObsidianExecutable() {
    const possiblePaths = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Obsidian', 'Obsidian.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Obsidian', 'Obsidian.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Obsidian', 'Obsidian.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Obsidian', 'Obsidian.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    try {
      return resolveToolLaunch('obsidian').file;
    } catch (_) {
      return 'obsidian';
    }
  }

  function ensureObsidianVaultRegistered(folderPath: string): { registered: boolean; vaultName: string } {
    const vaultName = path.basename(folderPath);
    try {
      const configPath = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'obsidian',
        'obsidian.json'
      );
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let parsed: any = { vaults: {} };
      if (fs.existsSync(configPath)) {
        try {
          parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) || { vaults: {} };
        } catch {
          parsed = { vaults: {} };
        }
      }
      if (!parsed.vaults || typeof parsed.vaults !== 'object') {
        parsed.vaults = {};
      }

      const normalized = path.normalize(folderPath).toLowerCase();
      for (const item of Object.values(parsed.vaults) as any[]) {
        if (item && item.path && path.normalize(item.path).toLowerCase() === normalized) {
          return { registered: true, vaultName: path.basename(item.path) };
        }
      }

      const vaultId = crypto.createHash('md5').update(folderPath).digest('hex').slice(0, 16);
      parsed.vaults[vaultId] = {
        path: path.normalize(folderPath),
        ts: Date.now(),
        open: true,
      };

      fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8');
      return { registered: true, vaultName };
    } catch (e) {
      console.error('Failed to register Obsidian vault:', e);
      return { registered: false, vaultName };
    }
  }

  ipcMain.handle('open-in-antigravity', (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.antigravityPath || findAntigravityExecutable();
      const ext = path.extname(exe).toLowerCase();
      
      let spawnFile;
      let spawnArgs;
      
      if (ext === '.cmd' || ext === '.bat') {
        spawnFile = 'cmd.exe';
        spawnArgs = ['/d', '/c', exe, dirPath];
      } else {
        spawnFile = exe;
        spawnArgs = [dirPath];
      }

      // Launch Antigravity IDE in the worktree directory safely (no shell-escaping issues)
      spawn(spawnFile, spawnArgs, { cwd: dirPath, shell: false, detached: true, stdio: 'ignore' });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-in-antigravity-agent', (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.antigravityAgentPath || findAntigravityAgentExecutable();
      const ext = path.extname(exe).toLowerCase();
      
      let spawnFile;
      let spawnArgs;
      
      if (ext === '.cmd' || ext === '.bat') {
        spawnFile = 'cmd.exe';
        spawnArgs = ['/d', '/c', exe];
      } else {
        spawnFile = exe;
        spawnArgs = [];
      }

      // Launch Antigravity Agent Manager independently
      const cwd = path.isAbsolute(exe) ? path.dirname(exe) : undefined;
      spawn(spawnFile, spawnArgs, { cwd, shell: false, detached: true, stdio: 'ignore' });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-in-figma', async (_, pathOrUrl) => {
    try {
      const settings = workspaceService.getSettings();
      const target = (typeof pathOrUrl === 'string' && pathOrUrl.trim())
        ? pathOrUrl.trim()
        : (settings.figmaUrl || '');

      // 1. Search for Figma Desktop executable first!
      const exe = settings.figmaPath || findFigmaExecutable();
      if (exe && fs.existsSync(exe)) {
        const args = target ? [target] : [];
        const child = spawn(exe, args, { detached: true, stdio: 'ignore' });
        child.unref();
        return { success: true, method: 'desktop', path: exe };
      }

      // 2. Try figma:// protocol URL if target is a web Figma URL and OS has registered handler
      if (target && /^https?:\/\/(?:[\w-]+\.)?figma\.com\//i.test(target)) {
        const protoUrl = target.replace(/^https?:\/\/(?:[\w-]+\.)?figma\.com\//i, 'figma://');
        try {
          await shell.openExternal(protoUrl);
          return { success: true, method: 'protocol' };
        } catch {
          // Protocol launch failed, fall through to browser
        }
      }

      // 3. Fallback: open in browser only if desktop app is not found
      const fallbackUrl = target && /^https?:\/\//i.test(target) ? target : 'https://www.figma.com';
      await shell.openExternal(fallbackUrl);
      return { success: true, method: 'browser' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-in-obsidian', async (_, dirPathOrVault) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.obsidianPath || findObsidianExecutable();
      const configuredVault = (settings.obsidianVault || '').trim();

      let targetVaultNameOrPath = '';

      if (typeof dirPathOrVault === 'string' && dirPathOrVault.trim()) {
        const candidate = dirPathOrVault.trim();
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          if (configuredVault && !fs.existsSync(path.join(candidate, '.obsidian'))) {
            targetVaultNameOrPath = configuredVault;
          } else {
            ensureObsidianVaultRegistered(candidate);
            targetVaultNameOrPath = candidate;
          }
        } else {
          targetVaultNameOrPath = candidate;
        }
      } else if (configuredVault) {
        targetVaultNameOrPath = configuredVault;
      } else {
        const defaultVault = findDefaultObsidianVault();
        if (defaultVault) {
          targetVaultNameOrPath = defaultVault;
        }
      }

      if (targetVaultNameOrPath) {
        let uri = '';
        if (path.isAbsolute(targetVaultNameOrPath) || /^[a-zA-Z]:[\\/]/.test(targetVaultNameOrPath)) {
          uri = `obsidian://open?path=${encodeURIComponent(targetVaultNameOrPath)}`;
        } else {
          uri = `obsidian://open?vault=${encodeURIComponent(targetVaultNameOrPath)}`;
        }

        try {
          await shell.openExternal(uri);
          return { success: true };
        } catch (_) {}
      }

      if (exe && (fs.existsSync(exe) || !path.isAbsolute(exe))) {
        const ext = path.extname(exe).toLowerCase();
        let spawnFile;
        let spawnArgs: string[] = [];

        if (ext === '.cmd' || ext === '.bat') {
          spawnFile = 'cmd.exe';
          spawnArgs = ['/d', '/c', exe];
        } else {
          spawnFile = exe;
        }

        if (targetVaultNameOrPath) {
          if (path.isAbsolute(targetVaultNameOrPath) || /^[a-zA-Z]:[\\/]/.test(targetVaultNameOrPath)) {
            spawnArgs.push(`obsidian://open?path=${encodeURIComponent(targetVaultNameOrPath)}`);
          } else {
            spawnArgs.push(`obsidian://open?vault=${encodeURIComponent(targetVaultNameOrPath)}`);
          }
        }

        spawn(spawnFile, spawnArgs, {
          shell: !path.isAbsolute(exe),
          detached: true,
          stdio: 'ignore'
        });
        return { success: true };
      }

      await shell.openExternal('obsidian://open');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || String(e) };
    }
  });

  ipcMain.handle('scrcpy:mirror', async (_, arg) => {
    const options = typeof arg === 'string' ? { serial: arg } : (arg || {});
    return await deviceService.launchMirror(options);
  });

  ipcMain.handle('scrcpy:device-list', async () => {
    try {
      const devices = await deviceService.listDevices();
      return { success: true, devices: devices.map((d: any) => d.serial), raw: '' };
    } catch (e: any) {
      return { success: false, devices: [], error: e?.message || String(e) };
    }
  });

  ipcMain.handle('scrcpy:capture-ui', async (_, opts: { worktreePath?: string; prefix?: string; serial?: string } = {}) => {
    return deviceService.captureUi({ worktreePath: opts.worktreePath, prefix: opts.prefix, serial: opts.serial });
  });

  // ── Quick git commands ───────────────────────────────

  ipcMain.handle('git-pull', async (_, dirPath) => {
    try {
      const output = execSync('git pull', {
        cwd: dirPath,
        encoding: 'utf-8',
        timeout: 30000,
      });
      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.stderr || e.message };
    }
  });

  ipcMain.handle('git-fetch', async (_, dirPath) => {
    try {
      const output = execSync('git fetch --all', {
        cwd: dirPath,
        encoding: 'utf-8',
        timeout: 30000,
      });
      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.stderr || e.message };
    }
  });

  ipcMain.handle('add-worktree', async (_, { projectPath, sourceWorktreePath, branchName, wtPath, createBranch }) => {
    try {
      let cmd;
      if (createBranch) {
        // git worktree add -b <new-branch> <path>
        cmd = `git worktree add -b "${branchName}" "${wtPath}"`;
      } else {
        cmd = `git worktree add "${wtPath}" ${branchName}`;
      }
      const output = execSync(cmd, {
        cwd: sourceWorktreePath || projectPath,
        encoding: 'utf-8',
        timeout: 30000,
      });
      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.stderr || e.message };
    }
  });

  ipcMain.handle('remove-worktree', async (_, { projectPath, wtPath, deleteBranch = false }) => {
    return removeWorktreeWithOptionalBranchDelete({ projectPath, wtPath, deleteBranch, force: false });
  });

  ipcMain.handle('force-remove-worktree', async (_, { projectPath, wtPath, deleteBranch = false }) => {
    return removeWorktreeWithOptionalBranchDelete({ projectPath, wtPath, deleteBranch, force: true });
  });

  ipcMain.handle('get-branches', async (_, projectPath) => {
    try {
      const output = execSync('git branch -a --format="%(refname:short)"', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 10000,
      });
      return output.trim().split('\n').filter(Boolean);
    } catch (_) {
      return [];
    }
  });

  ipcMain.handle('create-branch', async (_, { projectPath, branchName }) => {
    try {
      const output = execSync(`git branch "${branchName}"`, {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 10000,
      });
      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.stderr || e.message };
    }
  });

  ipcMain.handle('merge-worktree-to-branch', async (_, { projectPath, sourceBranch, targetBranch }) => {
    try {
      if (!projectPath || !sourceBranch || !targetBranch) {
        return { success: false, error: 'Project path, source branch, and target branch are required' };
      }
      if (targetBranch.startsWith('origin/')) {
        return { success: false, error: 'Please choose a local target branch' };
      }
      if (sourceBranch === targetBranch) {
        return { success: false, error: 'Source and target branches must be different' };
      }

      const statusOutput = execSync('git status --porcelain', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      if (statusOutput) {
        return { success: false, error: 'Target worktree has uncommitted changes. Commit or stash them before merging.' };
      }

      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();

      let output = '';
      try {
        output += execSync(`git checkout "${targetBranch}"`, {
          cwd: projectPath,
          encoding: 'utf-8',
          timeout: 30000,
        });
        output += execSync(`git merge "${sourceBranch}"`, {
          cwd: projectPath,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } finally {
        if (currentBranch && currentBranch !== targetBranch) {
          try {
            execSync(`git checkout "${currentBranch}"`, {
              cwd: projectPath,
              encoding: 'utf-8',
              timeout: 30000,
            });
          } catch (_) {}
        }
      }

      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.stderr || e.message };
    }
  });
});

installPtyShutdownLifecycle(app, ptyProcesses, execSync);
