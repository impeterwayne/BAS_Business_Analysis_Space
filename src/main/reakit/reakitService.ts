import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isWin, findOnPath, buildCmdLaunch, localDataDir } from '../platform';
import { pythonCommand, withBundledRuntimes } from '../runtimes';

// Decoded APKs go here when ReaKit is the copy bundled with the installed app: its resources folder can sit
// under Program Files, which a normal user cannot write to, and an update replaces it.
const USER_WORKSPACE_ROOT = path.join(localDataDir(), 'BA Space', 'reakit', 'workspaces');

function isBundledReaDir(reaDir: string): boolean {
  if (!app.isPackaged || !process.resourcesPath) return false;
  const rel = path.relative(process.resourcesPath, reaDir);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

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
        stdout += chunk.toString('utf-8');
      });

      proc.stderr?.on('data', (chunk) => {
        stderr += chunk.toString('utf-8');
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

export function findWorkspaceRoots(projectPath?: string, customPath?: string): string[] {
  const roots: string[] = [];
  if (projectPath && fs.existsSync(projectPath)) {
    roots.push(path.join(projectPath, 'workspaces'));
    roots.push(path.join(projectPath, '.reakit', 'workspaces'));
  }
  roots.push(USER_WORKSPACE_ROOT);
  const exeInfo = resolveReaExecutable(customPath);
  if (exeInfo.reaDir && fs.existsSync(exeInfo.reaDir)) {
    roots.push(path.join(exeInfo.reaDir, 'workspaces'));
  }
  roots.push('D:\\Quest\\BA_Space\\toolkits\\ReaKit\\workspaces');
  roots.push('D:\\Quest\\ReaKit\\workspaces');
  roots.push('D:\\Quest\\BA_Space\\workspaces');
  return [...new Set(roots.filter(r => fs.existsSync(r)))];
}

export function resolveWorkspaceRoot(projectPath?: string, customPath?: string): string {
  // Downloads and decodes for a project live in its own workspaces folder; callers create it on first use
  if (projectPath && fs.existsSync(projectPath)) {
    return path.join(projectPath, 'workspaces');
  }
  // Otherwise default to ReaKit's workspaces directory
  const exeInfo = resolveReaExecutable(customPath);
  if (exeInfo.reaDir && isBundledReaDir(exeInfo.reaDir)) return USER_WORKSPACE_ROOT;
  if (exeInfo.reaDir) {
    const reaWs = path.join(exeInfo.reaDir, 'workspaces');
    if (fs.existsSync(reaWs)) return reaWs;
    return reaWs;
  }
  if (fs.existsSync('D:\\Quest\\BA_Space\\toolkits\\ReaKit\\workspaces')) {
    return 'D:\\Quest\\BA_Space\\toolkits\\ReaKit\\workspaces';
  }
  if (fs.existsSync('D:\\Quest\\ReaKit\\workspaces')) {
    return 'D:\\Quest\\ReaKit\\workspaces';
  }
  return 'D:\\Quest\\BA_Space\\toolkits\\ReaKit\\workspaces';
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
  const roots = findWorkspaceRoots(options.projectPath, options.customPath);

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

  const workspaceRoot = resolveWorkspaceRoot(options.projectPath, options.customPath);
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

  const workspaceRoot = resolveWorkspaceRoot(options.projectPath, options.customPath);
  const targetPkg = pkg || (rawApkPath ? path.basename(rawApkPath).replace(/\.(apk|xapk|apks)$/i, '') : 'target');
  const targetDir = path.join(workspaceRoot, targetPkg);
  const apksDir = path.join(targetDir, 'apks');

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

  const res = await executeReaCommand({
    args,
    cwd: workspaceRoot,
    customPath: options.customPath,
    timeout: 600000, // 10 min timeout
  });

  const jadxDir = path.join(targetDir, 'jadx_src');
  if (fs.existsSync(jadxDir)) {
    try {
      const items = fs.readdirSync(jadxDir);
      if (items.length > 0) {
        return {
          success: true,
          jadxSourcePath: jadxDir,
          stdout: res.stdout,
          stderr: res.stderr,
        };
      }
    } catch (_) {}
  }

  return {
    success: false,
    error: (res.stderr || res.stdout || 'JADX decompilation failed to generate source files').trim(),
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
  ipcMain.handle('competitor:decompile-jadx', async (_: any, { projectPath, competitorId, packageName, apkPath }: {
    projectPath: string;
    competitorId: string;
    packageName?: string;
    apkPath?: string;
  }) => {
    try {
      const settings = workspaceService.getSettings();
      const result = await decompileCompetitorJadx({
        projectPath,
        packageName,
        apkPath,
        customPath: settings.reakitPath,
      });

      if (result.success && result.jadxSourcePath) {
        workspaceService.updateProjectCompetitor(projectPath, {
          id: competitorId,
          jadxSourcePath: result.jadxSourcePath,
          jadxStatus: 'ready',
        });
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
