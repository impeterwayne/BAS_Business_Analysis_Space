const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { createWorkspaceConfigStore } = require('../application/workspaceConfigStore');
const { createWorkspaceService } = require('../application/workspaceService');
const { registerWorkspaceIpc } = require('./ipc/workspaceIpc');
const { registerBakitIpc, resolveMobilerunPython } = require('./bakit/bakitService');
const { registerMobilerunSetupIpc } = require('./bakit/mobilerunSetup');
const { registerReakitIpc } = require('./reakit/reakitService');
const { DeviceService } = require('./device/deviceService');
const { DeviceStreamService } = require('./device/deviceStreamService');
const { registerDeviceIpc } = require('./ipc/deviceIpc');
const { SyncthingService } = require('./syncthing/syncthingService');
const { registerSyncthingIpc } = require('./ipc/syncthingIpc');
const { UpdateService } = require('./update/updateService');
const { registerUpdateIpc } = require('./ipc/updateIpc');
const { parseRepoFromPackageJson } = require('../domain');
const pkg = require('../../package.json');
const {
  isWin, isMac, findOnPath, findAllOnPath, firstExisting, buildLaunch, fixUnixPath, localDataDir, roamingConfigDir, unixBinDirs,
} = require('./platform');
const { discoverInstalls, ANTIGRAVITY_IDE, ANTIGRAVITY_AGENT } = require('./appDiscovery');

// Finder/Dock launches on macOS (and desktop-file launches on Linux) start with a bare PATH.
fixUnixPath();

// ── State ──────────────────────────────────────────────
const configPath = path.join(app.getPath('userData'), 'workspaces.json');
const workspaceConfigStore = createWorkspaceConfigStore({ configPath });
const workspaceService = createWorkspaceService({
  configStore: workspaceConfigStore,
});
const deviceService = new DeviceService(() => workspaceService.getSettings());
const deviceStreamService = new DeviceStreamService(deviceService);
let mainWindow = null;
const syncthingService = new SyncthingService({
  workspaceService,
  shell,
  onStateUpdated: (payload: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('syncthing:updated', payload);
    }
  },
});
workspaceService.setOnProjectChanged((projectPath: string) => {
  syncthingService.onLocalProjectChanged(projectPath);
});
const updateRepo = parseRepoFromPackageJson(pkg);
const updateService = new UpdateService({
  currentVersion: app.getVersion(),
  repoOwner: updateRepo.owner,
  repoRepo: updateRepo.repo,
  updatesDir: path.join(app.getPath('userData'), 'updates'),
  shell,
  app,
  onStateChanged: (payload: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update:state-changed', payload);
    }
  },
});

function normalizeFsPath(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  return process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath;
}

// ── External links ─────────────────────────────────────
// Only http/https reach the OS handler; other schemes (file:, javascript:, custom
// protocols) are ignored so untrusted links can't launch arbitrary apps.
function openExternalUrl(url) {
  if (typeof url !== 'string') return { success: false, error: 'Invalid URL' };
  if (!/^https?:\/\//iu.test(url)) return { success: false, error: 'Unsupported URL scheme' };
  shell.openExternal(url).catch((err) => {
    console.error('Failed to open external link:', err);
  });
  return { success: true };
}

// toolkits/ ships as an extraResource in the packaged app and sits in the repo in development.
function getToolkitsDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'toolkits')
    : path.join(app.getAppPath(), 'toolkits');
}

// Bundled .obsidian snapshot (scripts/sync-obsidian-config.mjs), seeded into workspaces opened in Obsidian.
function getObsidianConfigTemplateDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'obsidian-config')
    : path.join(app.getAppPath(), 'resources', 'obsidian-config');
}

// ── Window ─────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    // macOS keeps its native traffic lights inset into the custom titlebar; Windows/Linux draw their own buttons.
    frame: isMac,
    backgroundColor: '#08080d',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac ? { trafficLightPosition: { x: 14, y: 14 } } : {}),
    icon: path.join(__dirname, isWin ? '../../build/icon.ico' : '../../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Intercept window.open calls (e.g. target="_blank" links).
  // Never let about:blank or external links spawn an Electron child window.
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

// macOS application menu. Electron's default one puts Close (Cmd+W) in the Window menu, which closes the only
// window and quits the app. This one has no close role.
function installMacAppMenu() {
  const viewSubmenu = [
    ...(app.isPackaged ? [] : [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }]),
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    { label: 'View', submenu: viewSubmenu },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]));
}

// ── App lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  workspaceConfigStore.loadConfig();
  syncthingService.importAllSyncedProjects();
  if (isMac) installMacAppMenu();
  createWindow();
  registerWorkspaceIpc({
    ipcMain,
    dialog,
    mainWindow,
    workspaceService,
    deviceService,
  });

  registerBakitIpc({ ipcMain });
  registerMobilerunSetupIpc({
    ipcMain,
    resolveMcpPython: () => resolveMobilerunPython(),
    wheelDir: path.join(getToolkitsDir(), 'BAKit', 'mcp'),
  });
  registerDeviceIpc({ ipcMain, deviceService, deviceStreamService });
  registerReakitIpc({ ipcMain, workspaceService, shell });
  registerSyncthingIpc({ ipcMain, syncthingService });
  registerUpdateIpc({ ipcMain, updateService });
  syncthingService.start();

  ipcMain.handle('symlink:check-status', (_, { projectPath, name, targetPath }) => {
    const linkPath = path.join(projectPath, name);
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
        const resolvedCurrent = normalizeFsPath(path.resolve(projectPath, currentTarget));
        const resolvedTarget = normalizeFsPath(targetPath);
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

  ipcMain.handle('symlink:create', (_, { projectPath, name, targetPath }) => {
    const linkPath = path.join(projectPath, name);
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

  ipcMain.handle('symlink:delete', (_, { projectPath, name }) => {
    const linkPath = path.join(projectPath, name);
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

  ipcMain.handle('symlink:scan', (_, { projectPath }) => {
    if (!projectPath) return [];
    try {
      const files = fs.readdirSync(projectPath);
      const discovered = [];
      for (const file of files) {
        const linkPath = path.join(projectPath, file);
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
              targetPath: path.resolve(projectPath, target),
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
      // POSIX: lstat so symlinks are not followed out of the tree; directories need rwx (0o700) for their
      // entries to be listed and removed, files only need the user write bit.
      const stat = isWin ? fs.statSync(targetPath) : fs.lstatSync(targetPath);
      if (!isWin && stat.isSymbolicLink()) return;
      const mode = isWin ? 0o666 : (stat.mode & 0o7777) | (stat.isDirectory() ? 0o700 : 0o200);
      fs.chmodSync(targetPath, mode);
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
    return {
      bakitPath: path.join(getToolkitsDir(), 'BAKit'),
    };
  });

  ipcMain.handle('toolkit:check-status', (_, { projectPath, name, sourcePath }) => {
    const targetPath = path.join(projectPath, name);
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

  // preserveExisting: keep items already present in the project (user-edited files such as a filled-in project config).
  ipcMain.handle('toolkit:deploy', (_, { projectPath, name, sourcePath, preserveExisting }) => {
    const destPath = path.join(projectPath, name);
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

  ipcMain.handle('toolkit:remove', (_, { projectPath, name, sourcePath }) => {
    const destPath = path.join(projectPath, name);
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


  // ── Launch Actions ───────────────────────────────────

  ipcMain.handle('open-external', (_, url) => openExternalUrl(url));

  ipcMain.handle('open-in-explorer', async (_, dirPath) => {
    // A file is revealed (selected) in its folder; a directory is opened.
    try {
      if (fs.statSync(dirPath).isFile()) {
        shell.showItemInFolder(dirPath);
        return { success: true };
      }
    } catch (_) {
      // Missing path: let openPath report it.
    }
    const error = await shell.openPath(dirPath);
    return error ? { success: false, error } : { success: true };
  });

  // ── Launch tool actions ──────────────────────────────

  function spawnDetached(file: string, args: string[], options: Record<string, any> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(file, args, { ...options, detached: true, stdio: 'ignore' });
      child.once('error', reject);
      child.once('spawn', () => {
        child.on('error', () => {});
        child.unref();
        resolve();
      });
    });
  }

  ipcMain.handle('open-in-android-studio', async (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.androidStudioPath || findAndroidStudioExecutable();
      const { file: spawnFile, args: spawnArgs, windowsVerbatimArguments } = buildLaunch(exe, [dirPath]);
      const useShell = !path.isAbsolute(exe);
      await spawnDetached(spawnFile, spawnArgs, { cwd: dirPath, shell: useShell, windowsVerbatimArguments });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  async function openVsCode(dirPath: string) {
    try {
      const settings = workspaceService.getSettings();
      const exe = settings.vscodePath || findVsCodeExecutable();
      const { file: spawnFile, args: spawnArgs, windowsVerbatimArguments } = buildLaunch(exe, [dirPath]);
      const useShell = isWin && !path.isAbsolute(exe);
      await spawnDetached(spawnFile, spawnArgs, { cwd: dirPath, shell: useShell, windowsVerbatimArguments });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  ipcMain.handle('open-in-vscode', (_, dirPath) => openVsCode(dirPath));
  ipcMain.handle('open-in-editor', (_, dirPath) => openVsCode(dirPath));

  function detectPath(command, possiblePaths) {
    return firstExisting(possiblePaths) || findOnPath(command, { preferScripts: true });
  }

  // ── Per-OS install locations ─────────────────────────
  // Windows: exe/cmd paths. macOS: .app bundles (launched with `open -a`). Linux: binaries and launch scripts.
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const macApps = (name) => [path.join('/Applications', name), path.join(os.homedir(), 'Applications', name)];

  function antigravityCandidates() {
    if (isWin) {
      return [
        path.join(localDataDir(), 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
        path.join(localDataDir(), 'Programs', 'Antigravity IDE', 'bin', 'antigravity-ide.cmd'),
        path.join(programFiles, 'Antigravity IDE', 'Antigravity IDE.exe'),
      ];
    }
    if (isMac) return macApps('Antigravity IDE.app');
    return [
      path.join(localDataDir(), 'antigravity-ide', 'bin', 'antigravity-ide'),
      path.join(localDataDir(), 'antigravity-ide', 'antigravity-ide'),
      path.join(os.homedir(), '.local', 'bin', 'antigravity-ide'),
      '/usr/bin/antigravity-ide',
      '/usr/share/antigravity-ide/bin/antigravity-ide',
      '/usr/share/antigravity-ide/antigravity-ide',
      '/opt/Antigravity IDE/antigravity-ide',
    ];
  }

  // Fixed locations first, then whatever the folder / .desktop scan turns up (portable archives under ~/Tools etc.).
  function findAntigravityIde(): string | null {
    return firstExisting(antigravityCandidates())
      || firstExisting(discoverInstalls(ANTIGRAVITY_IDE))
      || findOnPath('antigravity-ide', { preferScripts: true })
      || findOnPath('agy-ide', { preferScripts: true });
  }

  // `antigravity` on PATH is often the Antigravity CLI (mise, npm), not the Agent Manager app: skip anything that
  // resolves into a CLI install or a version-manager shim.
  function isAntigravityCliPath(candidate: string): boolean {
    let real = candidate;
    try {
      real = fs.realpathSync(candidate);
    } catch (_) {
      // Keep the unresolved path.
    }
    return [candidate, real].some((p) => /antigravity[-_]cli|[\\/](mise|asdf)[\\/]|[\\/]node_modules[\\/]/i.test(p))
      || /^(mise|asdf)(\.exe)?$/i.test(path.basename(real));
  }

  function findAntigravityAgent(): string | null {
    const app = (p: string) => fs.existsSync(p) && !isAntigravityCliPath(p);
    return antigravityAgentCandidates().find(app)
      || discoverInstalls(ANTIGRAVITY_AGENT).find(app)
      || findAllOnPath('antigravity').find(app)
      || null;
  }

  // A saved path that no longer exists (app moved or updated) falls back to detection instead of failing with ENOENT.
  function usableConfiguredPath(configured: string | undefined): string | null {
    if (!configured) return null;
    if (!path.isAbsolute(configured)) return findOnPath(configured, { preferScripts: true }) ? configured : null;
    return fs.existsSync(configured) ? configured : null;
  }

  function antigravityAgentCandidates() {
    if (isWin) return [path.join(localDataDir(), 'Programs', 'antigravity', 'Antigravity.exe')];
    if (isMac) return macApps('Antigravity.app');
    return [
      path.join(os.homedir(), '.local', 'bin', 'antigravity'),
      path.join(localDataDir(), 'antigravity', 'antigravity'),
      path.join(os.homedir(), 'Tools', 'Antigravity', 'Antigravity-x64', 'antigravity'),
      '/usr/bin/antigravity',
      '/usr/share/antigravity/antigravity',
      '/opt/Antigravity/antigravity',
    ];
  }

  // `studio64` on Windows; JetBrains Toolbox and the Linux packages put `studio` / `android-studio` on PATH.
  const androidStudioCommand = isWin ? 'studio64' : 'studio';

  function androidStudioCandidates() {
    if (isWin) {
      return [
        path.join(programFiles, 'Android', 'Android Studio', 'bin', 'studio64.exe'),
        path.join(programFilesX86, 'Android', 'Android Studio', 'bin', 'studio64.exe'),
        path.join(localDataDir(), 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      ];
    }
    if (isMac) return macApps('Android Studio.app');
    return [
      '/opt/android-studio/bin/studio.sh',
      '/usr/local/android-studio/bin/studio.sh',
      path.join(os.homedir(), 'android-studio', 'bin', 'studio.sh'),
      '/snap/bin/android-studio',
      '/usr/bin/android-studio',
    ];
  }

  function scrcpyCandidates() {
    if (isWin) {
      return [
        path.join(programFiles, 'scrcpy', 'scrcpy.exe'),
        path.join(localDataDir(), 'Programs', 'scrcpy', 'scrcpy.exe'),
      ];
    }
    return unixBinDirs().map((dir) => path.join(dir, 'scrcpy'));
  }

  function figmaCandidates() {
    if (isWin) {
      return [
        path.join(localDataDir(), 'Figma', 'Figma.exe'),
        path.join(localDataDir(), 'Programs', 'Figma', 'Figma.exe'),
        path.join(programFiles, 'Figma', 'Figma.exe'),
        path.join(programFilesX86, 'Figma', 'Figma.exe'),
      ];
    }
    if (isMac) return macApps('Figma.app');
    return ['/usr/bin/figma-linux', '/usr/local/bin/figma-linux', '/snap/bin/figma-linux', '/usr/bin/figma', '/opt/figma-linux/figma-linux'];
  }

  function obsidianCandidates() {
    if (isWin) {
      return [
        path.join(localDataDir(), 'Programs', 'Obsidian', 'Obsidian.exe'),
        path.join(localDataDir(), 'Obsidian', 'Obsidian.exe'),
        path.join(programFiles, 'Obsidian', 'Obsidian.exe'),
        path.join(programFilesX86, 'Obsidian', 'Obsidian.exe'),
      ];
    }
    if (isMac) return macApps('Obsidian.app');
    return [
      '/usr/bin/obsidian',
      '/opt/Obsidian/obsidian',
      '/snap/bin/obsidian',
      '/var/lib/flatpak/exports/bin/md.obsidian.Obsidian',
      path.join(os.homedir(), '.local', 'share', 'flatpak', 'exports', 'bin', 'md.obsidian.Obsidian'),
    ];
  }

  function vscodeCandidates() {
    if (isWin) {
      return [
        path.join(localDataDir(), 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(localDataDir(), 'Programs', 'Microsoft VS Code', 'Code.exe'),
        path.join(programFiles, 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(programFiles, 'Microsoft VS Code', 'Code.exe'),
        path.join(programFilesX86, 'Microsoft VS Code', 'bin', 'code.cmd'),
        path.join(localDataDir(), 'Programs', 'Microsoft VS Code Insiders', 'bin', 'code-insiders.cmd'),
      ];
    }
    if (isMac) {
      return [
        ...macApps('Visual Studio Code.app'),
        ...macApps('Visual Studio Code - Insiders.app'),
        ...macApps('VSCodium.app'),
      ];
    }
    return [
      '/usr/bin/code',
      '/usr/local/bin/code',
      '/snap/bin/code',
      '/usr/bin/codium',
      '/usr/bin/code-insiders',
      '/var/lib/flatpak/exports/bin/com.visualstudio.code',
      path.join(os.homedir(), '.local', 'share', 'flatpak', 'exports', 'bin', 'com.visualstudio.code'),
    ];
  }

  ipcMain.handle('detect-integration-paths', () => {
    return {
      vscodePath: detectPath('code', vscodeCandidates()),
      antigravityPath: findAntigravityIde(),
      antigravityAgentPath: findAntigravityAgent(),
      claudeDesktopPath: findClaudeDesktopExecutable(),
      androidStudioPath: detectPath(androidStudioCommand, androidStudioCandidates()),
      scrcpyPath: detectPath('scrcpy', scrcpyCandidates()),
      figmaPath: findFigmaExecutable(),
      obsidianPath: detectPath('obsidian', obsidianCandidates()),
      obsidianVault: findDefaultObsidianVault(),
      reakitPath: detectPath('rea', [
        path.join(process.cwd(), 'toolkits', 'ReaKit'),
        path.join(process.resourcesPath || '', 'toolkits', 'ReaKit'),
        path.join(process.cwd(), '..', 'ReaKit'),
        path.join(process.cwd(), 'ReaKit'),
      ]),
      syncthingPath: syncthingService.resolveBinaryPath(),
    };
  });


  function findVsCodeExecutable() {
    return detectPath('code', vscodeCandidates()) || 'code';
  }

  function findAndroidStudioExecutable() {
    return detectPath(androidStudioCommand, androidStudioCandidates())
      || (isWin ? null : findOnPath('android-studio'))
      || androidStudioCommand;
  }

  function findFigmaExecutable(): string | null {
    const found = firstExisting(figmaCandidates());
    if (found) return found;

    // Check versioned directories in AppData/Local/Figma (e.g. app-126.9.11/Figma.exe)
    const figmaBase = path.join(localDataDir(), 'Figma');
    if (isWin && fs.existsSync(figmaBase)) {
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

    return findOnPath('figma') || findOnPath('figma-linux');
  }

  // Obsidian keeps its vault list in obsidian.json under %APPDATA%, ~/Library/Application Support or ~/.config.
  function getObsidianConfigPath() {
    return path.join(roamingConfigDir(), 'obsidian', 'obsidian.json');
  }

  // Windows paths compare case-insensitively; macOS/Linux paths are compared as-is.
  function samePath(a, b) {
    const na = path.normalize(a);
    const nb = path.normalize(b);
    return isWin ? na.toLowerCase() === nb.toLowerCase() : na === nb;
  }

  function getObsidianVaultsFromConfig(): Array<{ id: string; path: string; name: string; open?: boolean }> {
    try {
      const configPath = getObsidianConfigPath();
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
    return detectPath('obsidian', obsidianCandidates()) || 'obsidian';
  }

  function ensureObsidianVaultRegistered(folderPath: string, stalePaths?: string[]): { registered: boolean; vaultName: string } {
    const vaultName = path.basename(folderPath);
    try {
      const configPath = getObsidianConfigPath();
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

      // Remove stale entries pointing directly to repo root or docsDir
      if (Array.isArray(stalePaths) && stalePaths.length > 0) {
        for (const [id, item] of Object.entries(parsed.vaults) as [string, any][]) {
          if (item && item.path && stalePaths.some((p) => samePath(p, item.path))) {
            delete parsed.vaults[id];
          }
        }
      }

      for (const item of Object.values(parsed.vaults) as any[]) {
        if (item && item.path && samePath(item.path, folderPath)) {
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

  // Ensures an alias junction/symlink exists pointing to docsDir, named after the workspace
  // so Obsidian opens strictly the docs folder while displaying the workspace name instead of "docs".
  function ensureObsidianVaultLink(docsDir: string, vaultName: string, repoRoot: string): string {
    try {
      const key = crypto.createHash('md5').update(path.resolve(repoRoot).toLowerCase()).digest('hex').slice(0, 8);
      const vaultsBase = path.join(app.getPath('userData'), 'obsidian-vaults', key);
      if (!fs.existsSync(vaultsBase)) {
        fs.mkdirSync(vaultsBase, { recursive: true });
      }

      const linkPath = path.join(vaultsBase, vaultName);
      let needsCreate = true;

      if (fs.existsSync(linkPath)) {
        try {
          const stats = fs.lstatSync(linkPath);
          if (stats.isSymbolicLink() || (isWin && stats.isDirectory())) {
            let currentTarget = '';
            try {
              currentTarget = fs.readlinkSync(linkPath);
            } catch (_) {}
            if (currentTarget && samePath(currentTarget, docsDir)) {
              needsCreate = false;
            }
          }
        } catch (_) {}

        if (needsCreate) {
          try {
            fs.rmSync(linkPath, { recursive: true, force: true });
          } catch (_) {}
        }
      }

      if (needsCreate) {
        const type = isWin ? 'junction' : 'dir';
        fs.symlinkSync(docsDir, linkPath, type);
      }
      return linkPath;
    } catch (err) {
      console.error('Failed to create Obsidian vault link, falling back to docsDir:', err);
      return docsDir;
    }
  }

  // Resolves the workspace vault: targets strictly the docs/ folder and names vault after workspace
  function resolveObsidianWorkspaceVault(workspaceDir: string): { vaultPath: string; vaultName: string; repoRoot: string; docsDir: string } {
    const norm = path.resolve(workspaceDir);
    const isAlreadyDocs = path.basename(norm).toLowerCase() === 'docs';
    const repoRoot = isAlreadyDocs ? path.dirname(norm) : norm;
    const docsDir = isAlreadyDocs ? norm : path.join(repoRoot, 'docs');
    const vaultName = path.basename(repoRoot) || 'docs';

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    seedObsidianConfig(docsDir, repoRoot);
    const vaultPath = ensureObsidianVaultLink(docsDir, vaultName, repoRoot);
    return { vaultPath, vaultName, repoRoot, docsDir };
  }

  // A docs folder that already has its own .obsidian keeps it; otherwise it starts from the bundled config.
  function seedObsidianConfig(docsDir: string, repoRoot?: string) {
    const target = path.join(docsDir, '.obsidian');
    const template = getObsidianConfigTemplateDir();
    if (!fs.existsSync(target)) {
      const rootObsidian = repoRoot ? path.join(repoRoot, '.obsidian') : '';
      if (rootObsidian && fs.existsSync(rootObsidian)) {
        try {
          fs.cpSync(rootObsidian, target, { recursive: true });
        } catch (e) {
          console.error('Failed to copy root Obsidian config to docs:', e);
        }
      } else if (fs.existsSync(template)) {
        try {
          fs.cpSync(template, target, { recursive: true });
        } catch (e) {
          console.error('Failed to seed Obsidian config:', e);
        }
      }
    }
  }

  ipcMain.handle('open-in-antigravity', async (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = usableConfiguredPath(settings.antigravityPath) || findAntigravityIde();
      if (!exe) {
        return { success: false, error: 'Antigravity IDE not found. Install it, or set its path in Settings → Integrations.' };
      }
      const { file: spawnFile, args: spawnArgs, windowsVerbatimArguments } = buildLaunch(exe, [dirPath]);

      // Launch Antigravity IDE in the project directory safely (no shell-escaping issues)
      await spawnDetached(spawnFile, spawnArgs, { cwd: dirPath, shell: false, windowsVerbatimArguments });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('open-in-antigravity-agent', async (_, dirPath) => {
    try {
      const settings = workspaceService.getSettings();
      const exe = usableConfiguredPath(settings.antigravityAgentPath) || findAntigravityAgent();
      if (!exe) {
        return { success: false, error: 'Antigravity Agent Manager not found. Install it, or set its path in Settings → Integrations.' };
      }
      const { file: spawnFile, args: spawnArgs, windowsVerbatimArguments } = buildLaunch(exe, []);

      // Launch Antigravity Agent Manager independently
      const cwd = path.isAbsolute(exe) ? path.dirname(exe) : undefined;
      await spawnDetached(spawnFile, spawnArgs, { cwd, shell: false, windowsVerbatimArguments });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // App execution aliases under WindowsApps are reparse points that existsSync can report as missing.
  function claudeDesktopPathExists(candidate) {
    try {
      return fs.existsSync(candidate) || fs.lstatSync(candidate).isSymbolicLink() || fs.lstatSync(candidate).isFile();
    } catch (_) {
      return false;
    }
  }

  function getClaudeDesktopCandidatePaths() {
    if (isMac) return macApps('Claude.app');
    if (!isWin) return [];
    const localAppData = localDataDir();
    return [
      path.join(localAppData, 'AnthropicClaude', 'claude.exe'),
      path.join(localAppData, 'Programs', 'Claude', 'Claude.exe'),
      path.join(localAppData, 'Claude', 'Claude.exe'),
      path.join(localAppData, 'Microsoft', 'WindowsApps', 'claude-desktop.exe'),
      path.join(programFiles, 'Claude', 'Claude.exe'),
    ];
  }

  // `claude` on PATH is usually the Claude Code CLI, so only the desktop-specific command is looked up.
  function findClaudeDesktopExecutable() {
    return getClaudeDesktopCandidatePaths().find(claudeDesktopPathExists) || detectPath('claude-desktop', []);
  }

  ipcMain.handle('open-in-claude-desktop', async (_, dirPath) => {
    try {
      const customExe = workspaceService.getSettings().claudeDesktopPath;
      const folderUri = dirPath ? `claude://code/new?folder=${encodeURIComponent(dirPath)}` : 'claude://code/new';

      // Prefer the registered claude:// protocol: it opens Code mode on the folder in the running instance.
      if (!customExe) {
        try {
          await shell.openExternal(folderUri);
          return { success: true, method: 'protocol' };
        } catch (_) {
          // Fall through to launching the executable
        }
      }

      const exe = customExe || findClaudeDesktopExecutable();
      if (!exe) {
        return { success: false, error: 'Claude Desktop was not found. Set its path in Settings → Integrations.' };
      }
      const launch = buildLaunch(exe, [folderUri]);
      const child = spawn(launch.file, launch.args, {
        cwd: dirPath || undefined,
        shell: false,
        windowsVerbatimArguments: launch.windowsVerbatimArguments,
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', (err) => console.error('Failed to launch Claude Desktop:', err));
      child.unref();
      return { success: true, method: 'desktop', path: exe };
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
        const launch = buildLaunch(exe, target ? [target] : []);
        await spawnDetached(launch.file, launch.args, { windowsVerbatimArguments: launch.windowsVerbatimArguments });
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
          const { vaultPath, repoRoot, docsDir } = resolveObsidianWorkspaceVault(candidate);
          ensureObsidianVaultRegistered(vaultPath, [repoRoot, docsDir]);
          targetVaultNameOrPath = vaultPath;
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
        const uriArgs: string[] = [];
        if (targetVaultNameOrPath) {
          if (path.isAbsolute(targetVaultNameOrPath) || /^[a-zA-Z]:[\\/]/.test(targetVaultNameOrPath)) {
            uriArgs.push(`obsidian://open?path=${encodeURIComponent(targetVaultNameOrPath)}`);
          } else {
            uriArgs.push(`obsidian://open?vault=${encodeURIComponent(targetVaultNameOrPath)}`);
          }
        }

        const { file: spawnFile, args: spawnArgs, windowsVerbatimArguments } = buildLaunch(exe, uriArgs);
        await spawnDetached(spawnFile, spawnArgs, {
          shell: !path.isAbsolute(exe),
          windowsVerbatimArguments,
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

  ipcMain.handle('scrcpy:capture-ui', async (_, opts: { projectPath?: string; prefix?: string; serial?: string; mode?: 'screenshot' | 'dump' | 'both' } = {}) => {
    return deviceService.captureUi({ projectPath: opts.projectPath, prefix: opts.prefix, serial: opts.serial, mode: opts.mode });
  });
});

app.on('will-quit', () => {
  updateService.cancelDownload();
  syncthingService.stop();
  deviceStreamService.stopAllStreams();
});
