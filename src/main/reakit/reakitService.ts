import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isWin, findOnPath, buildCmdLaunch } from '../platform';
import { pythonCommand, withBundledRuntimes } from '../runtimes';

export interface ReaExecutableInfo {
  file: string;
  argsPrefix: string[];
  reaDir?: string;
  sourceType: 'executable' | 'script' | 'batch' | 'fallback';
}

export interface ReaStatusResult {
  hasApk: boolean;
  apkPath?: string;
  apkName?: string;
  apkSize?: number;
  hasJadx: boolean;
  jadxSourcePath?: string;
  jadxFileCount?: number;
}

export function resolveReaExecutable(customPath?: string): ReaExecutableInfo {
  // 1. If explicit custom path is specified
  if (customPath && typeof customPath === 'string' && customPath.trim()) {
    const trimmed = customPath.trim();
    if (fs.existsSync(trimmed)) {
      const stats = fs.statSync(trimmed);
      if (stats.isFile()) {
        const ext = path.extname(trimmed).toLowerCase();
        if (ext === '.py') {
          return { file: pythonCommand(), argsPrefix: [trimmed], reaDir: path.dirname(trimmed), sourceType: 'script' };
        }
        if (isWin && (ext === '.bat' || ext === '.cmd')) {
          return { file: trimmed, argsPrefix: [], reaDir: path.dirname(trimmed), sourceType: 'batch' };
        }
        return { file: trimmed, argsPrefix: [], reaDir: path.dirname(trimmed), sourceType: 'executable' };
      }
      if (stats.isDirectory()) {
        const batPath = path.join(trimmed, 'rea.bat');
        const pyPath = path.join(trimmed, 'rea.py');
        if (fs.existsSync(pyPath)) {
          return { file: pythonCommand(), argsPrefix: [pyPath], reaDir: trimmed, sourceType: 'script' };
        }
        if (isWin && fs.existsSync(batPath)) {
          return { file: batPath, argsPrefix: [], reaDir: trimmed, sourceType: 'batch' };
        }
      }
    }
  }

  // 2. Check bundled or local ReaKit submodule/directory
  const candidateDirs = [
    path.join(app.getAppPath ? app.getAppPath() : process.cwd(), 'toolkits', 'ReaKit'),
    path.join(process.resourcesPath || '', 'toolkits', 'ReaKit'),
    'D:\\Quest\\BA_Space\\toolkits\\ReaKit',
    path.join(app.getAppPath ? app.getAppPath() : process.cwd(), 'ReaKit'),
    path.join(process.resourcesPath || '', 'ReaKit'),
    'D:\\Quest\\ReaKit',
    path.resolve(process.cwd(), '..', 'ReaKit'),
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      const batPath = path.join(dir, 'rea.bat');
      const pyPath = path.join(dir, 'rea.py');
      // rea.bat only runs `python rea.py`; going straight to Python keeps cmd.exe out, which expands %NAME% even
      // inside a quoted folder name.
      if (fs.existsSync(pyPath)) {
        return { file: pythonCommand(), argsPrefix: [pyPath], reaDir: dir, sourceType: 'script' };
      }
      if (isWin && fs.existsSync(batPath)) {
        return { file: batPath, argsPrefix: [], reaDir: dir, sourceType: 'batch' };
      }
    }
  }

  // 3. Check PATH for a global rea binary
  const exe = findOnPath('rea');
  if (exe) {
    const ext = path.extname(exe).toLowerCase();
    if (isWin && (ext === '.bat' || ext === '.cmd')) {
      return { file: exe, argsPrefix: [], reaDir: path.dirname(exe), sourceType: 'batch' };
    }
    return { file: exe, argsPrefix: [], reaDir: path.dirname(exe), sourceType: 'executable' };
  }

  // 4. Default fallback to global 'rea'
  return { file: 'rea', argsPrefix: [], sourceType: 'fallback' };
}

export function executeReaCommand(options: {
  args: string[];
  cwd?: string;
  customPath?: string;
  timeout?: number;
  onLine?: (line: string, isStderr: boolean) => void;
}): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    try {
      const exeInfo = resolveReaExecutable(options.customPath);
      const workingDir = options.cwd || exeInfo.reaDir || process.cwd();
      const launch = exeInfo.sourceType === 'batch'
        ? buildCmdLaunch(exeInfo.file, options.args)
        : { file: exeInfo.file, args: [...exeInfo.argsPrefix, ...options.args], windowsVerbatimArguments: false };

      const proc = spawn(launch.file, launch.args, {
        cwd: workingDir,
        windowsVerbatimArguments: launch.windowsVerbatimArguments,
        env: withBundledRuntimes({
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
        }),
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let stdoutBuf = '';
      let stderrBuf = '';

      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch (_) {}
        resolve({
          success: false,
          stdout,
          stderr: stderr + '\n[Execution timed out]',
          exitCode: -1,
        });
      }, options.timeout || 180000);

      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString('utf-8');
        stdout += text;
        if (options.onLine) {
          stdoutBuf += text;
          const parts = stdoutBuf.split(/\r?\n/);
          stdoutBuf = parts.pop() || '';
          for (const line of parts) {
            if (line.trim()) options.onLine(line, false);
          }
        }
      });

      proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString('utf-8');
        stderr += text;
        if (options.onLine) {
          stderrBuf += text;
          const parts = stderrBuf.split(/\r?\n/);
          stderrBuf = parts.pop() || '';
          for (const line of parts) {
            if (line.trim()) options.onLine(line, true);
          }
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr: stderr + `\n${err.message}`,
          exitCode: 1,
        });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (options.onLine) {
          if (stdoutBuf.trim()) options.onLine(stdoutBuf, false);
          if (stderrBuf.trim()) options.onLine(stderrBuf, true);
        }
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      });
    } catch (e: any) {
      resolve({
        success: false,
        stdout: '',
        stderr: e?.message || 'Failed to start ReaKit process',
        exitCode: 1,
      });
    }
  });
}

export function findWorkspaceRoots(projectPath?: string): string[] {
  if (!projectPath || !fs.existsSync(projectPath)) return [];
  const roots = [path.join(projectPath, 'workspaces'), path.join(projectPath, '.reakit', 'workspaces')];
  return roots.filter(r => fs.existsSync(r));
}

// Downloads and decodes always land in the project's own workspaces folder, never in the ReaKit install
// folder; callers create it on first use.
export function resolveWorkspaceRoot(projectPath?: string): string | null {
  if (!projectPath || !fs.existsSync(projectPath)) return null;
  return path.join(projectPath, 'workspaces');
}

export function getCompetitorReakitStatus(options: {
  projectPath?: string;
  packageName?: string;
  apkPath?: string;
  jadxSourcePath?: string;
  customPath?: string;
}): ReaStatusResult {
  const result: ReaStatusResult = {
    hasApk: false,
    hasJadx: false,
  };

  const pkg = options.packageName?.trim();
  const roots = findWorkspaceRoots(options.projectPath);

  // If apkPath is inside a workspaces folder, also include its workspace root
  if (options.apkPath) {
    try {
      const apksParent = path.dirname(options.apkPath);
      if (path.basename(apksParent).toLowerCase() === 'apks') {
        const pkgDir = path.dirname(apksParent);
        const wsRoot = path.dirname(pkgDir);
        if (fs.existsSync(wsRoot)) {
          roots.push(wsRoot);
        }
      }
    } catch (_) {}
  }

  let targetDir = '';
  if (pkg) {
    for (const root of roots) {
      const candidate = path.join(root, pkg);
      if (fs.existsSync(candidate)) {
        targetDir = candidate;
        break;
      }
    }
  }

  // Fallback targetDir from apkPath structure
  if (!targetDir && options.apkPath) {
    try {
      const apksParent = path.dirname(options.apkPath);
      if (path.basename(apksParent).toLowerCase() === 'apks') {
        const pkgDir = path.dirname(apksParent);
        if (fs.existsSync(pkgDir)) {
          targetDir = pkgDir;
        }
      }
    } catch (_) {}
  }

  // 1. Check APK status
  if (options.apkPath && fs.existsSync(options.apkPath)) {
    try {
      const stats = fs.statSync(options.apkPath);
      result.hasApk = true;
      result.apkPath = options.apkPath;
      result.apkName = path.basename(options.apkPath);
      result.apkSize = stats.size;
    } catch (_) {}
  } else if (targetDir) {
    const apksDir = path.join(targetDir, 'apks');
    if (fs.existsSync(apksDir)) {
      try {
        const files = fs.readdirSync(apksDir).filter(f => /\.(apk|xapk|apks)$/i.test(f));
        if (files.length > 0) {
          const primary = files.find(f => !f.toLowerCase().includes('config') && f.endsWith('.apk')) || files[0];
          const fullPath = path.join(apksDir, primary);
          const stats = fs.statSync(fullPath);
          result.hasApk = true;
          result.apkPath = fullPath;
          result.apkName = primary;
          result.apkSize = stats.size;
        }
      } catch (_) {}
    }
  }

  // 2. Check JADX status
  // 2a. Direct explicit path check
  if (options.jadxSourcePath && fs.existsSync(options.jadxSourcePath)) {
    try {
      const items = fs.readdirSync(options.jadxSourcePath);
      if (items.length > 0) {
        result.hasJadx = true;
        result.jadxSourcePath = options.jadxSourcePath;
        result.jadxFileCount = items.length;
      }
    } catch (_) {}
  }

  // 2b. Check adjacent to apkPath
  if (!result.hasJadx && options.apkPath) {
    const candidateJadx = [
      path.join(path.dirname(path.dirname(options.apkPath)), 'jadx_src'),
      path.join(path.dirname(options.apkPath), '..', 'jadx_src'),
      path.join(path.dirname(options.apkPath), 'jadx_src'),
    ];
    for (const c of candidateJadx) {
      try {
        if (fs.existsSync(c)) {
          const items = fs.readdirSync(c);
          if (items.length > 0) {
            result.hasJadx = true;
            result.jadxSourcePath = c;
            result.jadxFileCount = items.length;
            break;
          }
        }
      } catch (_) {}
    }
  }

  // 2c. Check targetDir
  if (!result.hasJadx && targetDir) {
    const jadxDir = path.join(targetDir, 'jadx_src');
    if (fs.existsSync(jadxDir)) {
      try {
        const items = fs.readdirSync(jadxDir);
        if (items.length > 0) {
          result.hasJadx = true;
          result.jadxSourcePath = jadxDir;
          result.jadxFileCount = items.length;
        }
      } catch (_) {}
    }
  }

  // 2d. Fallback scan across all known workspace roots
  if (!result.hasJadx && pkg) {
    for (const root of roots) {
      const jadxDir = path.join(root, pkg, 'jadx_src');
      if (fs.existsSync(jadxDir)) {
        try {
          const items = fs.readdirSync(jadxDir);
          if (items.length > 0) {
            result.hasJadx = true;
            result.jadxSourcePath = jadxDir;
            result.jadxFileCount = items.length;
            break;
          }
        } catch (_) {}
      }
    }
  }

  return result;
}

export async function downloadCompetitorApk(options: {
  projectPath?: string;
  packageName: string;
  customPath?: string;
}): Promise<{
  success: boolean;
  apkPath?: string;
  apkName?: string;
  apkSize?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  const pkg = options.packageName?.trim();
  if (!pkg) {
    return { success: false, error: 'Package name is required for download' };
  }

  const workspaceRoot = resolveWorkspaceRoot(options.projectPath);
  if (!workspaceRoot) {
    return { success: false, error: 'Open a project first: APKs are downloaded into the project folder' };
  }
  try {
    if (!fs.existsSync(workspaceRoot)) {
      fs.mkdirSync(workspaceRoot, { recursive: true });
    }
  } catch (_) {}

  const args = ['download', '--target', pkg, '--workspace', workspaceRoot];
  const res = await executeReaCommand({
    args,
    cwd: workspaceRoot,
    customPath: options.customPath,
    timeout: 300000, // 5 min timeout
  });

  // Verify downloaded APK in target apks folder
  const apksDir = path.join(workspaceRoot, pkg, 'apks');
  if (fs.existsSync(apksDir)) {
    try {
      const files = fs.readdirSync(apksDir).filter(f => /\.(apk|xapk|apks)$/i.test(f));
      if (files.length > 0) {
        const primary = files.find(f => !f.toLowerCase().includes('config') && f.endsWith('.apk')) || files[0];
        const fullApkPath = path.join(apksDir, primary);
        const stats = fs.statSync(fullApkPath);
        return {
          success: true,
          apkPath: fullApkPath,
          apkName: primary,
          apkSize: stats.size,
          stdout: res.stdout,
          stderr: res.stderr,
        };
      }
    } catch (_) {}
  }

  return {
    success: false,
    error: (res.stderr || res.stdout || 'Download finished, but no APK package was found on disk').trim(),
    stdout: res.stdout,
    stderr: res.stderr,
  };
}

export async function decompileCompetitorJadx(options: {
  projectPath?: string;
  packageName?: string;
  apkPath?: string;
  customPath?: string;
  threads?: number;
  heap?: string;
  onProgress?: (progress: {
    stage: string;
    percent: number;
    detail: string;
    elapsedSec: number;
  }) => void;
}): Promise<{
  success: boolean;
  jadxSourcePath?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  const pkg = (options.packageName || '').trim();
  const rawApkPath = (options.apkPath || '').trim();

  if (!pkg && !rawApkPath) {
    return { success: false, error: 'Package name or APK path is required for decompilation' };
  }

  const workspaceRoot = resolveWorkspaceRoot(options.projectPath);
  if (!workspaceRoot) {
    return { success: false, error: 'Open a project first: APKs are decoded into the project folder' };
  }
  const targetPkg = pkg || (rawApkPath ? path.basename(rawApkPath).replace(/\.(apk|xapk|apks)$/i, '') : 'target');
  const targetDir = path.join(workspaceRoot, targetPkg);
  const apksDir = path.join(targetDir, 'apks');

  const startTime = Date.now();
  let currentPercent = 10;
  let currentStage = 'preparing';
  let currentDetail = 'Preparing workspace and APK build...';

  const reportProgress = (stage: string, percent: number, detail: string) => {
    currentStage = stage;
    currentPercent = Math.max(currentPercent, percent);
    currentDetail = detail;
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    options.onProgress?.({
      stage: currentStage,
      percent: currentPercent,
      detail: currentDetail,
      elapsedSec,
    });
  };

  reportProgress('preparing', 10, 'Preparing workspace and APK build...');

  try {
    if (!fs.existsSync(apksDir)) {
      fs.mkdirSync(apksDir, { recursive: true });
    }
  } catch (_) {}

  // If local APK path is supplied outside workspace, copy it into target apks directory
  if (rawApkPath && fs.existsSync(rawApkPath)) {
    const destApk = path.join(apksDir, path.basename(rawApkPath));
    if (!fs.existsSync(destApk)) {
      try {
        fs.copyFileSync(rawApkPath, destApk);
      } catch (_) {}
    }
  }

  const args = ['decode', '--target', targetPkg, '--workspace', workspaceRoot];
  if (options.threads && options.threads > 0) {
    args.push('--threads', String(options.threads));
  }
  if (options.heap && options.heap.trim()) {
    args.push('--heap', options.heap.trim());
  }

  // Active progress heartbeat while decompilation is running
  const progressTimer = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    if (currentStage === 'decompiling' || currentStage === 'analyzing') {
      if (currentPercent < 84) {
        currentPercent = Math.min(84, currentPercent + 2);
      }
    } else if (currentStage === 'writing') {
      if (currentPercent < 94) {
        currentPercent = Math.min(94, currentPercent + 1);
      }
    } else if (currentStage === 'preparing' || currentStage === 'starting') {
      if (currentPercent < 30) {
        currentPercent = Math.min(30, currentPercent + 3);
      }
    }
    options.onProgress?.({
      stage: currentStage,
      percent: currentPercent,
      detail: currentDetail,
      elapsedSec,
    });
  }, 1000);

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.includes('Extracting split archive')) {
      reportProgress('extracting', 18, 'Extracting split APK archives...');
    } else if (trimmed.includes('Running JADX on')) {
      reportProgress('starting', 25, 'Starting JADX decompiler...');
    } else if (trimmed.includes('loading ...') || trimmed.includes('INFO  - loading')) {
      reportProgress('loading', 35, 'Loading DEX bytecode & classes...');
    } else {
      const loadedMatch = trimmed.match(/Loaded classes:\s*(\d+)(?:,\s*methods:\s*(\d+))?/i);
      if (loadedMatch) {
        const cls = Number(loadedMatch[1]);
        const mth = loadedMatch[2] ? Number(loadedMatch[2]) : null;
        const msg = mth
          ? `Loaded ${cls.toLocaleString()} classes (${mth.toLocaleString()} methods)`
          : `Loaded ${cls.toLocaleString()} classes`;
        reportProgress('analyzing', 48, msg);
      } else if (trimmed.includes('processing ...') || trimmed.includes('INFO  - processing')) {
        reportProgress('decompiling', 56, 'Decompiling classes to Java/Kotlin...');
      } else if (trimmed.includes('writing ...') || trimmed.includes('INFO  - writing')) {
        reportProgress('writing', 86, 'Writing source files and layouts...');
      } else {
        const doneMatch = trimmed.match(/Decompilation complete for .*\(([\d,]+)\s*source files\)/i);
        if (doneMatch) {
          reportProgress('finalizing', 96, `Extracted ${doneMatch[1]} source files`);
        }
      }
    }
  };

  let res;
  try {
    res = await executeReaCommand({
      args,
      cwd: workspaceRoot,
      customPath: options.customPath,
      timeout: 600000, // 10 min timeout
      onLine: (line) => handleLine(line),
    });
  } finally {
    clearInterval(progressTimer);
  }

  const jadxDir = path.join(targetDir, 'jadx_src');
  if (fs.existsSync(jadxDir)) {
    try {
      const items = fs.readdirSync(jadxDir);
      if (items.length > 0) {
        reportProgress('completed', 100, 'Decompilation completed successfully!');
        return {
          success: true,
          jadxSourcePath: jadxDir,
          stdout: res.stdout,
          stderr: res.stderr,
        };
      }
    } catch (_) {}
  }

  const failError = (res.stderr || res.stdout || 'JADX decompilation failed to generate source files').trim();
  reportProgress('failed', 0, failError);

  return {
    success: false,
    error: failError,
    stdout: res.stdout,
    stderr: res.stderr,
  };
}

export function registerReakitIpc({
  ipcMain,
  workspaceService,
  shell,
}: {
  ipcMain: any;
  workspaceService: any;
  shell: any;
}) {
  // Download APK via ReaKit
  ipcMain.handle('competitor:download-apk', async (_: any, { projectPath, competitorId, packageName }: {
    projectPath: string;
    competitorId: string;
    packageName: string;
  }) => {
    try {
      const settings = workspaceService.getSettings();
      const result = await downloadCompetitorApk({
        projectPath,
        packageName,
        customPath: settings.reakitPath,
      });

      if (result.success && result.apkPath) {
        workspaceService.linkCompetitorApk(projectPath, competitorId, {
          path: result.apkPath,
          name: result.apkName,
          size: result.apkSize,
        });
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Decompile / Extract JADX Source via ReaKit
  ipcMain.handle('competitor:decompile-jadx', async (event: any, { projectPath, competitorId, packageName, apkPath }: {
    projectPath: string;
    competitorId: string;
    packageName?: string;
    apkPath?: string;
  }) => {
    try {
      const settings = workspaceService.getSettings();
      const sendProgress = (p: { stage: string; percent: number; detail: string; elapsedSec: number }) => {
        try {
          const payload = { competitorId, ...p };
          if (event?.sender && !event.sender.isDestroyed()) {
            event.sender.send('competitor:decode-progress', payload);
          }
          const { BrowserWindow } = require('electron');
          BrowserWindow.getAllWindows().forEach((win: any) => {
            if (win && win.webContents && !win.webContents.isDestroyed() && win.webContents !== event?.sender) {
              win.webContents.send('competitor:decode-progress', payload);
            }
          });
        } catch (_) {}
      };

      sendProgress({ stage: 'preparing', percent: 8, detail: 'Preparing decompiler...', elapsedSec: 0 });

      const result = await decompileCompetitorJadx({
        projectPath,
        packageName,
        apkPath,
        customPath: settings.reakitPath,
        onProgress: sendProgress,
      });

      if (result.success && result.jadxSourcePath) {
        workspaceService.updateProjectCompetitor(projectPath, {
          id: competitorId,
          jadxSourcePath: result.jadxSourcePath,
          jadxStatus: 'ready',
        });
        sendProgress({ stage: 'completed', percent: 100, detail: 'Sources successfully extracted!', elapsedSec: 0 });
      } else {
        sendProgress({ stage: 'failed', percent: 0, detail: result.error || 'Decompilation failed', elapsedSec: 0 });
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Open JADX Source folder in Explorer
  ipcMain.handle('competitor:open-jadx-source', async (_: any, { jadxSourcePath, projectPath, packageName }: {
    jadxSourcePath?: string;
    projectPath?: string;
    packageName?: string;
  }) => {
    try {
      let resolvedPath = (jadxSourcePath || '').trim();
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        const settings = workspaceService.getSettings();
        const status = getCompetitorReakitStatus({
          projectPath,
          packageName,
          customPath: settings.reakitPath,
        });
        resolvedPath = status.jadxSourcePath || '';
      }

      if (resolvedPath && fs.existsSync(resolvedPath)) {
        await shell.openPath(resolvedPath);
        return { success: true, path: resolvedPath };
      }

      return { success: false, error: 'JADX source directory not found' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Get Competitor ReaKit / JADX on-disk status
  ipcMain.handle('competitor:get-reakit-status', async (_: any, { projectPath, competitorId, packageName, apkPath, jadxSourcePath }: {
    projectPath?: string;
    competitorId?: string;
    packageName?: string;
    apkPath?: string;
    jadxSourcePath?: string;
  }) => {
    const settings = workspaceService.getSettings();
    const status = getCompetitorReakitStatus({
      projectPath,
      packageName,
      apkPath,
      jadxSourcePath,
      customPath: settings.reakitPath,
    });

    if (projectPath && (competitorId || packageName)) {
      try {
        const updatePayload: any = {};
        if (competitorId) updatePayload.id = competitorId;
        if (packageName) updatePayload.packageName = packageName;
        let shouldUpdate = false;
        if (status.hasJadx && status.jadxSourcePath) {
          updatePayload.jadxStatus = 'ready';
          updatePayload.jadxSourcePath = status.jadxSourcePath;
          shouldUpdate = true;
        }
        if (status.hasApk && status.apkPath) {
          updatePayload.apkPath = status.apkPath;
          updatePayload.apkName = status.apkName;
          updatePayload.apkSize = status.apkSize;
          shouldUpdate = true;
        }
        if (shouldUpdate) {
          workspaceService.updateProjectCompetitor(projectPath, updatePayload);
        }
      } catch (_) {}
    }

    return status;
  });
}
