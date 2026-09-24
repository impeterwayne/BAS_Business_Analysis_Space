import { spawn, execSync, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface ReaExecutableInfo {
  file: string;
  argsPrefix: string[];
  reaDir?: string;
  sourceType: 'executable' | 'script' | 'batch' | 'fallback';
}

export interface ReaComponentStatus {
  name: string;
  status: 'READY' | 'WARN' | 'ERROR' | 'UNKNOWN';
  details: string;
}

export interface ReaDiagnosticsResult {
  success: boolean;
  output: string;
  components: ReaComponentStatus[];
  devices: string[];
  error?: string;
}

export interface ReaTargetInfo {
  packageName: string;
  alias?: string;
  existsOnDisk: boolean;
  targetDir?: string;
}

export interface ReaTargetStatus {
  exists: boolean;
  targetDir: string;
  apks: { count: number; files: string[]; sizeBytes: number };
  jadx: { exists: boolean; hasSource: boolean; fileCount: number };
  runtime: { exists: boolean; files: string[]; count: number };
  native: { exists: boolean; soFiles: string[]; archs: string[] };
  traffic: { exists: boolean; count: number };
  docs: { exists: boolean; files: string[] };
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
          return { file: 'python', argsPrefix: [trimmed], reaDir: path.dirname(trimmed), sourceType: 'script' };
        }
        if (ext === '.bat' || ext === '.cmd') {
          return { file: 'cmd.exe', argsPrefix: ['/d', '/c', trimmed], reaDir: path.dirname(trimmed), sourceType: 'batch' };
        }
        return { file: trimmed, argsPrefix: [], reaDir: path.dirname(trimmed), sourceType: 'executable' };
      }
      if (stats.isDirectory()) {
        const batPath = path.join(trimmed, 'rea.bat');
        const pyPath = path.join(trimmed, 'rea.py');
        if (fs.existsSync(batPath)) {
          return { file: 'cmd.exe', argsPrefix: ['/d', '/c', batPath], reaDir: trimmed, sourceType: 'batch' };
        }
        if (fs.existsSync(pyPath)) {
          return { file: 'python', argsPrefix: [pyPath], reaDir: trimmed, sourceType: 'script' };
        }
      }
    }
  }

  // 2. Check bundled or local ReaKit submodule/directory
  const candidateDirs = [
    path.join(app.getAppPath ? app.getAppPath() : process.cwd(), 'ReaKit'),
    path.join(process.resourcesPath || '', 'toolkits', 'ReaKit'),
    path.join(process.resourcesPath || '', 'ReaKit'),
    'D:\\Quest\\BA_Space\\ReaKit',
    path.resolve(process.cwd(), 'ReaKit'),
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      const batPath = path.join(dir, 'rea.bat');
      const pyPath = path.join(dir, 'rea.py');
      if (fs.existsSync(batPath)) {
        return { file: 'cmd.exe', argsPrefix: ['/d', '/c', batPath], reaDir: dir, sourceType: 'batch' };
      }
      if (fs.existsSync(pyPath)) {
        return { file: 'python', argsPrefix: [pyPath], reaDir: dir, sourceType: 'script' };
      }
    }
  }

  // 3. Check where.exe for global rea binary
  if (process.platform === 'win32') {
    try {
      const output = execFileSync('where.exe', ['rea'], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const matches = output.split(/\r?\n/).filter(Boolean);
      const exe = matches.find(m => /\.exe$/i.test(m)) || matches.find(m => /\.(cmd|bat)$/i.test(m)) || matches[0];
      if (exe) {
        const ext = path.extname(exe).toLowerCase();
        if (ext === '.bat' || ext === '.cmd') {
          return { file: 'cmd.exe', argsPrefix: ['/d', '/c', exe], reaDir: path.dirname(exe), sourceType: 'batch' };
        }
        return { file: exe, argsPrefix: [], reaDir: path.dirname(exe), sourceType: 'executable' };
      }
    } catch (_) {
      // not on PATH
    }
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
      const fullArgs = [...exeInfo.argsPrefix, ...options.args];
      const workingDir = options.cwd || exeInfo.reaDir || process.cwd();

      const proc = spawn(exeInfo.file, fullArgs, {
        cwd: workingDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
        },
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

export async function getReaDiagnostics(customPath?: string): Promise<ReaDiagnosticsResult> {
  const res = await executeReaCommand({
    args: ['env'],
    customPath,
    timeout: 30000,
  });

  const output = res.stdout || res.stderr;
  const components: ReaComponentStatus[] = [];
  const devices: string[] = [];

  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const [rawName, rawStatus, ...detailsParts] = parts;
        const name = rawName.trim();
        const statusStr = rawStatus.trim().toUpperCase();
        if (name && !name.toLowerCase().includes('component') && !name.startsWith('---')) {
          let status: 'READY' | 'WARN' | 'ERROR' | 'UNKNOWN' = 'UNKNOWN';
          if (statusStr.includes('READY')) status = 'READY';
          else if (statusStr.includes('WARN')) status = 'WARN';
          else if (statusStr.includes('ERROR') || statusStr.includes('FAIL')) status = 'ERROR';
          components.push({
            name,
            status,
            details: detailsParts.join(' | ').trim(),
          });
        }
      }
    } else if (line.includes('device') && !line.includes('No connected') && !line.includes('List of devices')) {
      const trimmed = line.trim();
      if (/^[a-zA-Z0-9._:-]+\s+device/i.test(trimmed)) {
        devices.push(trimmed.split(/\s+/)[0]);
      }
    }
  }

  return {
    success: res.success || components.length > 0,
    output,
    components,
    devices,
    error: res.success ? undefined : res.stderr,
  };
}

export function findWorkspaceRoots(worktreePath?: string, customPath?: string): string[] {
  const roots: string[] = [];
  if (worktreePath && fs.existsSync(worktreePath)) {
    roots.push(path.join(worktreePath, 'workspaces'));
    roots.push(path.join(worktreePath, '.reakit', 'workspaces'));
    roots.push(worktreePath);
  }
  const exeInfo = resolveReaExecutable(customPath);
  if (exeInfo.reaDir && fs.existsSync(exeInfo.reaDir)) {
    roots.push(path.join(exeInfo.reaDir, 'workspaces'));
  }
  roots.push('D:\\Quest\\BA_Space\\workspaces');
  return [...new Set(roots.filter(r => fs.existsSync(r)))];
}

export function getTargets(worktreePath?: string, customPath?: string): ReaTargetInfo[] {
  const targetsMap = new Map<string, ReaTargetInfo>();

  // 1. Check workspace_config.json in possible locations
  const configCandidates = [
    worktreePath ? path.join(worktreePath, 'config', 'workspace_config.json') : null,
    worktreePath ? path.join(worktreePath, 'workspace_config.json') : null,
    worktreePath ? path.join(worktreePath, '.reakit', 'workspace_config.json') : null,
    'D:\\Quest\\BA_Space\\ReaKit\\config\\workspace_config.json',
  ].filter(Boolean) as string[];

  for (const cfgPath of configCandidates) {
    if (fs.existsSync(cfgPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
        if (Array.isArray(parsed.targets)) {
          for (const t of parsed.targets) {
            const pkg = t.packageName || t.package || t.name;
            if (pkg && typeof pkg === 'string') {
              targetsMap.set(pkg, {
                packageName: pkg,
                alias: t.alias || '',
                existsOnDisk: false,
              });
            }
          }
        }
      } catch (_) {}
    }
  }

  // 2. Scan folders in workspace roots
  const roots = findWorkspaceRoots(worktreePath, customPath);
  for (const root of roots) {
    try {
      const items = fs.readdirSync(root);
      for (const item of items) {
        const itemPath = path.join(root, item);
        if (fs.statSync(itemPath).isDirectory()) {
          const hasApks = fs.existsSync(path.join(itemPath, 'apks'));
          const hasJadx = fs.existsSync(path.join(itemPath, 'jadx_src'));
          const hasRuntime = fs.existsSync(path.join(itemPath, 'runtime'));
          const hasNative = fs.existsSync(path.join(itemPath, 'native'));
          if (hasApks || hasJadx || hasRuntime || hasNative || item.includes('.')) {
            const existing = targetsMap.get(item);
            if (existing) {
              existing.existsOnDisk = true;
              existing.targetDir = itemPath;
            } else {
              targetsMap.set(item, {
                packageName: item,
                alias: '',
                existsOnDisk: true,
                targetDir: itemPath,
              });
            }
          }
        }
      }
    } catch (_) {}
  }

  return Array.from(targetsMap.values());
}

export function getTargetStatus(worktreePath: string, packageName: string, customPath?: string): ReaTargetStatus {
  const result: ReaTargetStatus = {
    exists: false,
    targetDir: '',
    apks: { count: 0, files: [], sizeBytes: 0 },
    jadx: { exists: false, hasSource: false, fileCount: 0 },
    runtime: { exists: false, files: [], count: 0 },
    native: { exists: false, soFiles: [], archs: [] },
    traffic: { exists: false, count: 0 },
    docs: { exists: false, files: [] },
  };

  if (!packageName) return result;

  const roots = findWorkspaceRoots(worktreePath, customPath);
  let resolvedDir = '';

  for (const root of roots) {
    const candidate = path.join(root, packageName);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      resolvedDir = candidate;
      break;
    }
  }

  // Fallback to expected default location even if not yet created
  if (!resolvedDir && worktreePath) {
    resolvedDir = path.join(worktreePath, 'workspaces', packageName);
  }

  result.targetDir = resolvedDir;
  if (!fs.existsSync(resolvedDir)) {
    return result;
  }

  result.exists = true;

  // 1. Check apks/
  const apksDir = path.join(resolvedDir, 'apks');
  if (fs.existsSync(apksDir)) {
    try {
      const files = fs.readdirSync(apksDir).filter(f => /\.(apk|xapk|apks)$/i.test(f));
      result.apks.files = files;
      result.apks.count = files.length;
      let total = 0;
      for (const f of files) {
        try {
          total += fs.statSync(path.join(apksDir, f)).size;
        } catch (_) {}
      }
      result.apks.sizeBytes = total;
    } catch (_) {}
  }

  // 2. Check jadx_src/
  const jadxDir = path.join(resolvedDir, 'jadx_src');
  if (fs.existsSync(jadxDir)) {
    result.jadx.exists = true;
    try {
      const items = fs.readdirSync(jadxDir);
      result.jadx.fileCount = items.length;
      result.jadx.hasSource = items.some(i => i === 'app' || i === 'sources' || i === 'src' || i === 'build.gradle');
    } catch (_) {}
  }

  // 3. Check runtime/
  const runtimeDir = path.join(resolvedDir, 'runtime');
  if (fs.existsSync(runtimeDir)) {
    result.runtime.exists = true;
    try {
      const walk = (d: string): string[] => {
        let res: string[] = [];
        for (const item of fs.readdirSync(d)) {
          const full = path.join(d, item);
          if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
          else res.push(item);
        }
        return res;
      };
      const files = walk(runtimeDir);
      result.runtime.files = files.slice(0, 50);
      result.runtime.count = files.length;
    } catch (_) {}
  }

  // 4. Check native/
  const nativeDir = path.join(resolvedDir, 'native');
  if (fs.existsSync(nativeDir)) {
    result.native.exists = true;
    try {
      const items = fs.readdirSync(nativeDir);
      const archs: string[] = [];
      const soFiles: string[] = [];
      for (const item of items) {
        const full = path.join(nativeDir, item);
        if (fs.statSync(full).isDirectory()) {
          archs.push(item);
          try {
            const sub = fs.readdirSync(full).filter(f => f.endsWith('.so'));
            soFiles.push(...sub);
          } catch (_) {}
        } else if (item.endsWith('.so')) {
          soFiles.push(item);
        }
      }
      result.native.archs = archs;
      result.native.soFiles = soFiles;
    } catch (_) {}
  }

  // 5. Check traffic/
  const trafficDir = path.join(resolvedDir, 'traffic');
  if (fs.existsSync(trafficDir)) {
    result.traffic.exists = true;
    try {
      result.traffic.count = fs.readdirSync(trafficDir).length;
    } catch (_) {}
  }

  // 6. Check docs/
  const docsDir = path.join(resolvedDir, 'docs');
  if (fs.existsSync(docsDir)) {
    result.docs.exists = true;
    try {
      result.docs.files = fs.readdirSync(docsDir);
    } catch (_) {}
  }

  return result;
}

export function launchJadxGui(options: {
  target?: string;
  worktreePath?: string;
  customPath?: string;
}): { success: boolean; error?: string } {
  try {
    const exeInfo = resolveReaExecutable(options.customPath);
    const args = [...exeInfo.argsPrefix, 'jadx-gui'];
    if (options.target && options.target.trim()) {
      args.push(options.target.trim());
    }
    const proc = spawn(exeInfo.file, args, {
      cwd: options.worktreePath || exeInfo.reaDir || process.cwd(),
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    proc.unref();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function launchMirror(options: {
  serial?: string;
  maxSize?: number;
  fps?: number;
  customPath?: string;
}): { success: boolean; error?: string } {
  try {
    const exeInfo = resolveReaExecutable(options.customPath);
    const args = [...exeInfo.argsPrefix, 'mirror'];
    if (options.serial && options.serial.trim()) {
      args.push('-s', options.serial.trim());
    }
    if (options.maxSize && options.maxSize > 0) {
      args.push('-m', String(options.maxSize));
    }
    if (options.fps && options.fps > 0) {
      args.push('--fps', String(options.fps));
    }
    const proc = spawn(exeInfo.file, args, {
      cwd: exeInfo.reaDir || process.cwd(),
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    proc.unref();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function registerReakitIpc({ ipcMain, workspaceService }: { ipcMain: any; workspaceService: any }) {
  ipcMain.handle('reakit:run-command', async (_: any, { args, cwd }: { args: string[]; cwd?: string }) => {
    const settings = workspaceService.getSettings();
    return executeReaCommand({
      args,
      cwd,
      customPath: settings.reakitPath,
    });
  });

  ipcMain.handle('reakit:get-env', async () => {
    const settings = workspaceService.getSettings();
    return getReaDiagnostics(settings.reakitPath);
  });

  ipcMain.handle('reakit:get-targets', async (_: any, { worktreePath }: { worktreePath?: string } = {}) => {
    const settings = workspaceService.getSettings();
    return getTargets(worktreePath, settings.reakitPath);
  });

  ipcMain.handle('reakit:get-target-status', async (_: any, { worktreePath, packageName }: { worktreePath: string; packageName: string }) => {
    const settings = workspaceService.getSettings();
    return getTargetStatus(worktreePath, packageName, settings.reakitPath);
  });

  ipcMain.handle('reakit:launch-jadx-gui', async (_: any, { target, worktreePath }: { target?: string; worktreePath?: string } = {}) => {
    const settings = workspaceService.getSettings();
    return launchJadxGui({ target, worktreePath, customPath: settings.reakitPath });
  });

  ipcMain.handle('reakit:launch-mirror', async (_: any, opts: { serial?: string; maxSize?: number; fps?: number } = {}) => {
    const settings = workspaceService.getSettings();
    return launchMirror({ ...opts, customPath: settings.reakitPath });
  });

  ipcMain.handle('reakit:harness-action', async (_: any, { action, targetPath, profile }: { action: string; targetPath: string; profile?: string }) => {
    const settings = workspaceService.getSettings();
    const args = ['harness', action, targetPath];
    if (action === 'init') {
      const chosenProfile = profile || settings.reakitHarnessProfile || 'full';
      args.push('--profile', chosenProfile);
      args.push('--force');
    }
    return executeReaCommand({
      args,
      cwd: targetPath,
      customPath: settings.reakitPath,
    });
  });

  ipcMain.handle('reakit:save-target', async (_: any, { worktreePath, packageName, alias }: { worktreePath: string; packageName: string; alias?: string }) => {
    try {
      if (!worktreePath || !packageName) {
        return { success: false, error: 'Missing worktreePath or packageName' };
      }
      const configDir = path.join(worktreePath, 'config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      const cfgPath = path.join(configDir, 'workspace_config.json');
      let configObj: any = {
        workspaceRoot: 'workspaces',
        targets: [],
      };
      if (fs.existsSync(cfgPath)) {
        try {
          configObj = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
          if (!Array.isArray(configObj.targets)) configObj.targets = [];
        } catch (_) {}
      }
      const existing = configObj.targets.find((t: any) => t.packageName === packageName || t.package === packageName);
      if (existing) {
        if (alias) existing.alias = alias;
      } else {
        configObj.targets.push({
          packageName,
          alias: alias || '',
        });
      }
      fs.writeFileSync(cfgPath, JSON.stringify(configObj, null, 2), 'utf-8');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
