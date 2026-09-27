import { spawn, execSync, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, dialog } from 'electron';

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
  worktreePath?: string;
  targetDir: string;
  apks: {
    count: number;
    files: string[];
    items?: Array<{ name: string; path: string; size: number }>;
    sizeBytes: number;
    dir?: string;
  };
  jadx: {
    exists: boolean;
    hasSource: boolean;
    fileCount: number;
    sourceDir?: string;
  };
  runtime: { exists: boolean; files: string[]; count: number };
  native: { exists: boolean; soFiles: string[]; archs: string[] };
  traffic: { exists: boolean; count: number };
  docs: { exists: boolean; files: string[] };
}

export interface ReaToolchainInfo {
  exeInfo: ReaExecutableInfo;
  reaDir: string;
  apkdPath?: string;
  jadxPath?: string;
  jadxGuiPath?: string;
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
    'D:\\Quest\\ReaKit',
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

export function resolveToolchain(customPath?: string): ReaToolchainInfo {
  const exeInfo = resolveReaExecutable(customPath);
  const reaDir = exeInfo.reaDir || 'D:\\Quest\\BA_Space\\ReaKit';

  const candidateApkd = [
    path.join(reaDir, 'core', 'apkdgo', 'apkd.exe'),
    path.join(reaDir, 'core', 'apkdgo', 'bin', 'apkd.exe'),
    'D:\\Quest\\ReaKit\\core\\apkdgo\\apkd.exe',
  ];
  const apkdPath = candidateApkd.find(p => fs.existsSync(p));

  const candidateJadx = [
    path.join(reaDir, 'core', 'jadx', 'bin', process.platform === 'win32' ? 'jadx.bat' : 'jadx'),
    'D:\\Tools\\jadx-cli\\bin\\jadx.bat',
    'D:\\Quest\\ReaKit\\core\\jadx\\bin\\jadx.bat',
  ];
  const jadxPath = candidateJadx.find(p => fs.existsSync(p));

  const candidateJadxGui = [
    path.join(reaDir, 'core', 'jadx', 'bin', process.platform === 'win32' ? 'jadx-gui.bat' : 'jadx-gui'),
    'D:\\Tools\\jadx-cli\\bin\\jadx-gui.bat',
    'D:\\Quest\\ReaKit\\core\\jadx\\bin\\jadx-gui.bat',
  ];
  const jadxGuiPath = candidateJadxGui.find(p => fs.existsSync(p));

  return {
    exeInfo,
    reaDir,
    apkdPath,
    jadxPath,
    jadxGuiPath,
  };
}

export function parsePackageTarget(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('id=')) {
    const match = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);
    if (match) return match[1];
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const parts = trimmed.split('/');
    const last = parts[parts.length - 1];
    if (last && last.includes('.')) return last.split('?')[0];
  }
  return trimmed.replace(/\.apk$/i, '');
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

export function getTargetStatus(worktreePath: string, packageName?: string, customPath?: string): ReaTargetStatus {
  const result: ReaTargetStatus = {
    exists: false,
    worktreePath: worktreePath || '',
    targetDir: worktreePath || '',
    apks: { count: 0, files: [], items: [], sizeBytes: 0 },
    jadx: { exists: false, hasSource: false, fileCount: 0 },
    runtime: { exists: false, files: [], count: 0 },
    native: { exists: false, soFiles: [], archs: [] },
    traffic: { exists: false, count: 0 },
    docs: { exists: false, files: [] },
  };

  if (!worktreePath && !packageName) return result;

  const pkg = packageName ? parsePackageTarget(packageName) : '';
  const searchRoots: string[] = [];

  if (worktreePath && fs.existsSync(worktreePath)) {
    result.exists = true;
    searchRoots.push(worktreePath);
    if (pkg) {
      searchRoots.push(path.join(worktreePath, pkg));
      searchRoots.push(path.join(worktreePath, 'workspaces', pkg));
    }
  }

  const extraRoots = findWorkspaceRoots(worktreePath, customPath);
  for (const r of extraRoots) {
    if (pkg) {
      const cand = path.join(r, pkg);
      if (fs.existsSync(cand)) searchRoots.push(cand);
    }
  }

  // 1. Scan for APKs
  const discoveredApkItems: Array<{ name: string; path: string; size: number }> = [];
  const apkCandidateDirs: string[] = [];

  for (const r of searchRoots) {
    apkCandidateDirs.push(path.join(r, 'apks'));
    apkCandidateDirs.push(r);
  }

  const seenFiles = new Set<string>();
  for (const dir of apkCandidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          if (/\.(apk|xapk|apks)$/i.test(entry)) {
            const fullPath = path.join(dir, entry);
            if (!seenFiles.has(fullPath)) {
              seenFiles.add(fullPath);
              let size = 0;
              try { size = fs.statSync(fullPath).size; } catch (_) {}
              discoveredApkItems.push({
                name: entry,
                path: fullPath,
                size,
              });
            }
          }
        }
      } catch (_) {}
    }
  }

  result.apks.items = discoveredApkItems;
  result.apks.files = discoveredApkItems.map(i => i.name);
  result.apks.count = discoveredApkItems.length;
  result.apks.sizeBytes = discoveredApkItems.reduce((acc, curr) => acc + curr.size, 0);
  if (discoveredApkItems.length > 0) {
    result.apks.dir = path.dirname(discoveredApkItems[0].path);
  }

  // 2. Scan for Decompiled JADX Source Code
  const jadxCandidateDirs: string[] = [];
  for (const r of searchRoots) {
    jadxCandidateDirs.push(path.join(r, 'jadx_src'));
    jadxCandidateDirs.push(path.join(r, 'sources'));
    jadxCandidateDirs.push(path.join(r, 'src'));
    // Also consider root itself if build.gradle or app/src exists
    if (fs.existsSync(path.join(r, 'build.gradle')) || fs.existsSync(path.join(r, 'app', 'src'))) {
      jadxCandidateDirs.push(r);
    }
  }

  for (const dir of jadxCandidateDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      let fileCount = 0;
      let hasSource = false;

      const walk = (d: string, depth = 0) => {
        if (depth > 6) return;
        try {
          const items = fs.readdirSync(d);
          for (const item of items) {
            const full = path.join(d, item);
            try {
              const stat = fs.statSync(full);
              if (stat.isDirectory()) {
                if (item === 'sources' || item === 'src' || item === 'java' || item === 'kotlin' || item === 'app') {
                  hasSource = true;
                }
                walk(full, depth + 1);
              } else if (/\.(java|kt|xml|gradle)$/i.test(item)) {
                fileCount++;
                hasSource = true;
              }
            } catch (_) {}
          }
        } catch (_) {}
      };

      walk(dir);

      if (fileCount > 0 || hasSource) {
        result.jadx.exists = true;
        result.jadx.hasSource = true;
        result.jadx.fileCount = fileCount;
        result.jadx.sourceDir = dir;
        break;
      }
    }
  }

  return result;
}

export async function downloadApk(options: {
  target: string;
  source?: string;
  outputDir?: string;
  worktreePath: string;
  customPath?: string;
}): Promise<{ success: boolean; stdout: string; stderr: string; downloadedFiles: string[]; outputDir: string }> {
  const pkg = parsePackageTarget(options.target);
  if (!pkg) {
    return {
      success: false,
      stdout: '',
      stderr: 'Invalid target package name or Play Store URL.',
      downloadedFiles: [],
      outputDir: '',
    };
  }

  const outputDir = options.outputDir || path.join(options.worktreePath, 'apks');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tools = resolveToolchain(options.customPath);
  const source = options.source || 'apkcombo';
  let stdout = '';
  let stderr = '';
  let success = false;

  if (tools.apkdPath) {
    const res = await new Promise<{ success: boolean; stdout: string; stderr: string }>((resolve) => {
      try {
        const proc = spawn(tools.apkdPath!, ['-p', pkg, '-O', outputDir, '-s', source], {
          cwd: path.dirname(tools.apkdPath!),
          env: process.env,
          shell: false,
        });
        let out = '';
        let err = '';
        proc.stdout?.on('data', (c) => { out += c.toString('utf-8'); });
        proc.stderr?.on('data', (c) => { err += c.toString('utf-8'); });
        proc.on('close', (code) => {
          resolve({ success: code === 0, stdout: out, stderr: err });
        });
        proc.on('error', (e) => {
          resolve({ success: false, stdout: out, stderr: err + `\n${e.message}` });
        });
      } catch (err: any) {
        resolve({ success: false, stdout: '', stderr: err?.message || 'Failed to spawn apkd' });
      }
    });
    stdout = res.stdout;
    stderr = res.stderr;
    success = res.success;
  } else {
    // Fallback to rea dl
    const res = await executeReaCommand({
      args: ['dl', pkg, '-s', source, '-w', options.worktreePath],
      cwd: options.worktreePath,
      customPath: options.customPath,
    });
    stdout = res.stdout;
    stderr = res.stderr;
    success = res.success;
  }

  // Find all downloaded apk/xapk files in outputDir
  const downloadedFiles: string[] = [];
  if (fs.existsSync(outputDir)) {
    try {
      const files = fs.readdirSync(outputDir).filter(f => /\.(apk|xapk|apks)$/i.test(f));
      for (const f of files) {
        downloadedFiles.push(path.join(outputDir, f));
      }
    } catch (_) {}
  }

  if (downloadedFiles.length > 0) {
    success = true;
  }

  return {
    success,
    stdout,
    stderr,
    downloadedFiles,
    outputDir,
  };
}

export async function decompileApk(options: {
  apkPath?: string;
  packageName?: string;
  outputDir?: string;
  worktreePath: string;
  heap?: string;
  threads?: string | number;
  exportGradle?: boolean;
  deobf?: boolean;
  showBadCode?: boolean;
  customPath?: string;
}): Promise<{ success: boolean; stdout: string; stderr: string; outputDir: string; fileCount: number }> {
  let targetApk = options.apkPath;

  // If no apkPath specified, search in workspace
  if (!targetApk || !fs.existsSync(targetApk)) {
    const searchDirs = [
      path.join(options.worktreePath, 'apks'),
      options.worktreePath,
    ];
    if (options.packageName) {
      searchDirs.push(path.join(options.worktreePath, options.packageName, 'apks'));
      searchDirs.push(path.join(options.worktreePath, 'workspaces', options.packageName, 'apks'));
    }
    for (const d of searchDirs) {
      if (fs.existsSync(d)) {
        try {
          const files = fs.readdirSync(d).filter(f => /\.(apk|xapk|apks)$/i.test(f));
          if (files.length > 0) {
            targetApk = path.join(d, files[0]);
            break;
          }
        } catch (_) {}
      }
    }
  }

  if (!targetApk || !fs.existsSync(targetApk)) {
    return {
      success: false,
      stdout: '',
      stderr: 'No APK package found to decompile. Please download an APK or select a local APK file first.',
      outputDir: '',
      fileCount: 0,
    };
  }

  const outputDir = options.outputDir || path.join(options.worktreePath, 'jadx_src');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tools = resolveToolchain(options.customPath);
  let stdout = '';
  let stderr = '';
  let success = false;

  if (tools.jadxPath) {
    const threadCount = options.threads && options.threads !== 'auto'
      ? String(options.threads)
      : String(os.cpus().length || 8);
    const heapMemory = options.heap || '8g';

    const args = [
      '-d', outputDir,
      '-j', threadCount,
    ];
    if (options.exportGradle !== false) args.push('--export-gradle');
    if (options.deobf !== false) {
      args.push('--deobf');
      args.push('--deobf-res-name-source', 'auto');
      args.push('--use-source-name-as-class-name-alias', 'if-better');
    }
    if (options.showBadCode !== false) args.push('--show-bad-code');

    // Handle split APK archives (.xapk, .apks, .zip)
    const ext = path.extname(targetApk).toLowerCase();
    const inputFiles: string[] = [];

    if (ext === '.xapk' || ext === '.apks' || ext === '.zip') {
      const extractDir = path.join(path.dirname(targetApk), `${path.basename(targetApk)}_extracted`);
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
        try {
          execSync(`powershell.exe -NoProfile -Command "Expand-Archive -LiteralPath '${targetApk}' -DestinationPath '${extractDir}' -Force"`, {
            stdio: 'ignore',
            timeout: 60000,
          });
        } catch (_) {}
      }
      if (fs.existsSync(extractDir)) {
        const walk = (d: string) => {
          for (const item of fs.readdirSync(d)) {
            const full = path.join(d, item);
            if (fs.statSync(full).isDirectory()) walk(full);
            else if (item.endsWith('.apk')) inputFiles.push(full);
          }
        };
        walk(extractDir);
      }
    }

    if (inputFiles.length === 0) {
      inputFiles.push(targetApk);
    }

    args.push(...inputFiles);

    const jadxEnv = {
      ...process.env,
      JADX_OPTS: `-Xmx${heapMemory} -Xms2g -XX:+UseG1GC`,
      JADX_ZIP_MAX_ENTRIES_COUNT: '1000000',
      JADX_DISABLE_ZIP_SECURITY: 'true',
      JADX_DISABLE_XML_SECURITY: 'true',
    };

    const res = await new Promise<{ success: boolean; stdout: string; stderr: string }>((resolve) => {
      try {
        const proc = spawn(tools.jadxPath!, args, {
          cwd: outputDir,
          env: jadxEnv,
          shell: false,
        });
        let out = '';
        let err = '';
        proc.stdout?.on('data', (c) => { out += c.toString('utf-8'); });
        proc.stderr?.on('data', (c) => { err += c.toString('utf-8'); });
        proc.on('close', (code) => {
          resolve({ success: code === 0, stdout: out, stderr: err });
        });
        proc.on('error', (e) => {
          resolve({ success: false, stdout: out, stderr: err + `\n${e.message}` });
        });
      } catch (e: any) {
        resolve({ success: false, stdout: '', stderr: e?.message || 'Failed to start JADX process' });
      }
    });

    stdout = res.stdout;
    stderr = res.stderr;
    success = res.success;
  } else {
    // Fallback to rea decode
    const targetArg = options.packageName || targetApk;
    const res = await executeReaCommand({
      args: ['decode', targetArg, '--heap', options.heap || '8g', '-w', options.worktreePath],
      cwd: options.worktreePath,
      customPath: options.customPath,
    });
    stdout = res.stdout;
    stderr = res.stderr;
    success = res.success;
  }

  // Count decompiled source files
  let fileCount = 0;
  if (fs.existsSync(outputDir)) {
    const countFiles = (d: string) => {
      try {
        for (const item of fs.readdirSync(d)) {
          const full = path.join(d, item);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            countFiles(full);
          } else if (/\.(java|kt|xml)$/i.test(item)) {
            fileCount++;
          }
        }
      } catch (_) {}
    };
    countFiles(outputDir);
  }

  if (fileCount > 0) {
    success = true;
  }

  return {
    success,
    stdout,
    stderr,
    outputDir,
    fileCount,
  };
}

export async function pipelineApk(options: {
  target: string;
  source?: string;
  outputDir?: string;
  worktreePath: string;
  heap?: string;
  threads?: string | number;
  exportGradle?: boolean;
  deobf?: boolean;
  showBadCode?: boolean;
  customPath?: string;
}): Promise<{ success: boolean; stdout: string; stderr: string; downloadedFiles: string[]; outputDir: string; fileCount: number }> {
  const dlRes = await downloadApk({
    target: options.target,
    source: options.source,
    worktreePath: options.worktreePath,
    customPath: options.customPath,
  });

  let fullStdout = `[Download Step]\n${dlRes.stdout}\n`;
  let fullStderr = dlRes.stderr ? `[Download Step Stderr]\n${dlRes.stderr}\n` : '';

  if (!dlRes.success || dlRes.downloadedFiles.length === 0) {
    return {
      success: false,
      stdout: fullStdout,
      stderr: fullStderr + '\nDownload step completed without output APK files.',
      downloadedFiles: [],
      outputDir: '',
      fileCount: 0,
    };
  }

  const downloadedApk = dlRes.downloadedFiles[0];

  const decRes = await decompileApk({
    apkPath: downloadedApk,
    packageName: parsePackageTarget(options.target),
    outputDir: options.outputDir,
    worktreePath: options.worktreePath,
    heap: options.heap,
    threads: options.threads,
    exportGradle: options.exportGradle,
    deobf: options.deobf,
    showBadCode: options.showBadCode,
    customPath: options.customPath,
  });

  fullStdout += `\n[Decompilation Step]\n${decRes.stdout}\n`;
  if (decRes.stderr) {
    fullStderr += `\n[Decompilation Step Stderr]\n${decRes.stderr}\n`;
  }

  return {
    success: decRes.success,
    stdout: fullStdout,
    stderr: fullStderr,
    downloadedFiles: dlRes.downloadedFiles,
    outputDir: decRes.outputDir,
    fileCount: decRes.fileCount,
  };
}

export function launchJadxGui(options: {
  target?: string;
  apkPath?: string;
  worktreePath?: string;
  customPath?: string;
}): { success: boolean; error?: string } {
  try {
    const tools = resolveToolchain(options.customPath);
    let targetArg = options.apkPath || options.target || '';

    // If no target arg given but worktree has an APK, default to opening it
    if (!targetArg && options.worktreePath) {
      const status = getTargetStatus(options.worktreePath, undefined, options.customPath);
      if (status.apks.items && status.apks.items.length > 0) {
        targetArg = status.apks.items[0].path;
      }
    }

    if (tools.jadxGuiPath) {
      const args = targetArg ? [targetArg] : [];
      const proc = spawn(tools.jadxGuiPath, args, {
        cwd: options.worktreePath || tools.reaDir || process.cwd(),
        detached: true,
        stdio: 'ignore',
        shell: false,
      });
      proc.unref();
      return { success: true };
    }

    const exeInfo = resolveReaExecutable(options.customPath);
    const args = [...exeInfo.argsPrefix, 'jadx-gui'];
    if (targetArg) {
      args.push(targetArg);
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

export function registerReakitIpc({
  ipcMain,
  workspaceService,
  dialog: customDialog,
  mainWindow,
}: {
  ipcMain: any;
  workspaceService: any;
  dialog?: any;
  mainWindow?: any;
}) {
  const dlg = customDialog || dialog;

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

  ipcMain.handle('reakit:get-target-status', async (_: any, { worktreePath, packageName }: { worktreePath: string; packageName?: string }) => {
    const settings = workspaceService.getSettings();
    return getTargetStatus(worktreePath, packageName, settings.reakitPath);
  });

  ipcMain.handle('reakit:launch-jadx-gui', async (_: any, { target, apkPath, worktreePath }: { target?: string; apkPath?: string; worktreePath?: string } = {}) => {
    const settings = workspaceService.getSettings();
    return launchJadxGui({ target, apkPath, worktreePath, customPath: settings.reakitPath });
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

  // ── New APK Downloader & Decompiler Handlers ──
  ipcMain.handle('reakit:download-apk', async (_: any, opts: { target: string; source?: string; outputDir?: string; worktreePath: string }) => {
    const settings = workspaceService.getSettings();
    return downloadApk({
      ...opts,
      customPath: settings.reakitPath,
    });
  });

  ipcMain.handle('reakit:decompile-apk', async (_: any, opts: {
    apkPath?: string;
    packageName?: string;
    outputDir?: string;
    worktreePath: string;
    heap?: string;
    threads?: string | number;
    exportGradle?: boolean;
    deobf?: boolean;
    showBadCode?: boolean;
  }) => {
    const settings = workspaceService.getSettings();
    return decompileApk({
      ...opts,
      heap: opts.heap || settings.reakitHeapSize,
      customPath: settings.reakitPath,
    });
  });

  ipcMain.handle('reakit:pipeline-apk', async (_: any, opts: {
    target: string;
    source?: string;
    outputDir?: string;
    worktreePath: string;
    heap?: string;
    threads?: string | number;
    exportGradle?: boolean;
    deobf?: boolean;
    showBadCode?: boolean;
  }) => {
    const settings = workspaceService.getSettings();
    return pipelineApk({
      ...opts,
      source: opts.source || settings.reakitDefaultSource,
      heap: opts.heap || settings.reakitHeapSize,
      customPath: settings.reakitPath,
    });
  });

  ipcMain.handle('reakit:select-apk-file', async () => {
    if (!dlg) return null;
    const parentWin = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
    const result = await dlg.showOpenDialog(parentWin, {
      properties: ['openFile'],
      filters: [
        { name: 'Android Packages (*.apk, *.xapk, *.apks, *.zip)', extensions: ['apk', 'xapk', 'apks', 'zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Select APK or Split XAPK Package to Decompile',
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });
}
