import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isWin, isMac, exeName, PYTHON_COMMAND } from './platform';

// Python, Java, and Android/scrcpy tools shipped with the app (scripts/fetch-runtimes.mjs + toolkits/ReaKit),
// so ReaKit, jadx, adb, scrcpy and the BAKit scripts run without the user installing them separately.
// Packaged: resources/runtimes & resources/toolkits. Dev: runtimes/<os>-<arch> & toolkits/ in the repo.
// When a bundled runtime is missing, everything falls back to what is on PATH.

const RUNTIME_KEY = `${isWin ? 'win' : isMac ? 'mac' : 'linux'}-${process.arch}`;

let cachedRoot: string | null | undefined;
let cachedScrcpyDir: string | null | undefined;

function runtimesRoot(): string | null {
  if (cachedRoot !== undefined) return cachedRoot;
  const candidates = [
    process.resourcesPath && path.join(process.resourcesPath, 'runtimes'),
    path.join(app.getAppPath(), 'runtimes', RUNTIME_KEY),
  ].filter(Boolean) as string[];
  cachedRoot = candidates.find((dir) => fs.existsSync(dir)) ?? null;
  return cachedRoot;
}

function existing(file: string | null | undefined): string | null {
  return file && fs.existsSync(file) ? file : null;
}

// Folder holding the bundled scrcpy + adb + scrcpy-server binaries (in toolkits/ReaKit or runtimes).
export function bundledScrcpyDir(): string | null {
  if (cachedScrcpyDir !== undefined) return cachedScrcpyDir;
  const root = runtimesRoot();
  const appPath = app.getAppPath ? app.getAppPath() : process.cwd();
  const candidates = [
    root && path.join(root, 'scrcpy'),
    root && path.join(root, 'platform-tools'),
    process.resourcesPath && path.join(process.resourcesPath, 'toolkits', 'ReaKit', 'core', 'scrcpy_cli', 'vendor', 'scrcpy'),
    path.join(appPath, 'toolkits', 'ReaKit', 'core', 'scrcpy_cli', 'vendor', 'scrcpy'),
    path.resolve(process.cwd(), 'toolkits', 'ReaKit', 'core', 'scrcpy_cli', 'vendor', 'scrcpy'),
  ].filter(Boolean) as string[];
  cachedScrcpyDir = candidates.find((dir) => fs.existsSync(dir)) ?? null;
  return cachedScrcpyDir;
}

export function bundledAdb(): string | null {
  const dir = bundledScrcpyDir();
  return existing(dir && path.join(dir, exeName('adb')));
}

export function bundledScrcpy(): string | null {
  const dir = bundledScrcpyDir();
  return existing(dir && path.join(dir, exeName('scrcpy')));
}

export function bundledScrcpyServer(): string | null {
  const dir = bundledScrcpyDir();
  return existing(dir && path.join(dir, 'scrcpy-server')) || existing(dir && path.join(dir, 'scrcpy-server.jar'));
}

// Folder holding the python executable.
function bundledPythonBinDir(): string | null {
  const root = runtimesRoot();
  if (!root) return null;
  return isWin ? path.join(root, 'python') : path.join(root, 'python', 'bin');
}

export function bundledPython(): string | null {
  const dir = bundledPythonBinDir();
  return existing(dir && path.join(dir, isWin ? 'python.exe' : 'python3'));
}

// JAVA_HOME of the bundled JRE (the macOS build nests it in Contents/Home).
export function bundledJavaHome(): string | null {
  const root = runtimesRoot();
  if (!root) return null;
  const home = isMac ? path.join(root, 'java', 'Contents', 'Home') : path.join(root, 'java');
  return existing(path.join(home, 'bin', isWin ? 'java.exe' : 'java')) ? home : null;
}

// What to spawn for a Python script: the bundled interpreter, else python/python3 from PATH.
export function pythonCommand(): string {
  return bundledPython() || PYTHON_COMMAND;
}

// Copy of env with the bundled Python, Java, and ADB/scrcpy first on PATH and JAVA_HOME / ADB_PATH /
// SCRCPY_SERVER_PATH pointing at the bundled tools, so terminal commands, ReaKit, jadx and mobilerun use them.
export function withBundledRuntimes(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...env };
  const javaHome = bundledJavaHome();
  const pythonDir = bundledPython() ? bundledPythonBinDir() : null;
  const scrcpyDir = bundledScrcpyDir();
  const adbPath = bundledAdb();
  const scrcpyServer = bundledScrcpyServer();

  const dirs = [
    pythonDir,
    pythonDir && isWin ? path.join(pythonDir, 'Scripts') : null,
    javaHome && path.join(javaHome, 'bin'),
    scrcpyDir,
  ].filter(Boolean) as string[];

  if (dirs.length) {
    // Windows env keys are case-insensitive but a plain object is not: reuse whichever spelling is there (Path).
    const pathKey = Object.keys(out).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
    out[pathKey] = [...dirs, out[pathKey]].filter(Boolean).join(path.delimiter);
  }

  if (javaHome) out.JAVA_HOME = javaHome;
  if (adbPath) {
    const existingAdb = out.ADB_PATH || out.ADB;
    const isStaleOrReakit = !existingAdb || !fs.existsSync(existingAdb) || /reakit/i.test(existingAdb);
    if (isStaleOrReakit) {
      out.ADB_PATH = adbPath;
      out.ADB = adbPath;
    }
  }
  if (scrcpyServer) {
    const existingServer = out.SCRCPY_SERVER_PATH;
    const isStaleOrReakit = !existingServer || !fs.existsSync(existingServer) || /reakit/i.test(existingServer);
    if (isStaleOrReakit) {
      out.SCRCPY_SERVER_PATH = scrcpyServer;
      if (!out.SCRCPY_SERVER_VERSION) out.SCRCPY_SERVER_VERSION = '4.1';
    }
  }
  return out;
}
