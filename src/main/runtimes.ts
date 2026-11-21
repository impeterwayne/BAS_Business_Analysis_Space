import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isWin, isMac, exeName, PYTHON_COMMAND, findOnPath } from './platform';

// Python, Java, Node.js, and Android/scrcpy tools shipped with the app (scripts/fetch-runtimes.mjs + toolkits/ReaKit),
// so ReaKit, jadx, adb, scrcpy, the BAKit scripts and the npx MCP servers run without the user installing them.
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
  // Node goes last, as a fallback: a developer's own node/nvm keeps winning in the terminals.
  const nodeDir = bundledNodeDir();
  const fallbackDirs = nodeDir ? [nodeBinDir(nodeDir)] : [];

  if (dirs.length || fallbackDirs.length) {
    // Windows env keys are case-insensitive but a plain object is not: reuse whichever spelling is there (Path).
    const pathKey = Object.keys(out).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
    out[pathKey] = [...dirs, out[pathKey], ...fallbackDirs].filter(Boolean).join(path.delimiter);
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

// ── Node.js ──────────────────────────────────────────
// Layout of the nodejs.org archives: node.exe + node_modules\npm at the top on Windows, bin/ + lib/node_modules/npm
// elsewhere.

function nodeBinDir(nodeDir: string): string {
  return isWin ? nodeDir : path.join(nodeDir, 'bin');
}

function nodeExecutable(nodeDir: string): string {
  return path.join(nodeBinDir(nodeDir), exeName('node'));
}

function npxCli(nodeDir: string): string {
  return isWin
    ? path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npx-cli.js')
    : path.join(nodeDir, 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js');
}

function bundledNodeDir(): string | null {
  const root = runtimesRoot();
  const dir = root && path.join(root, 'node');
  return dir && fs.existsSync(nodeExecutable(dir)) && fs.existsSync(npxCli(dir)) ? dir : null;
}

function readVersion(nodeDir: string): string {
  try {
    return fs.readFileSync(path.join(nodeDir, '.version'), 'utf8').trim();
  } catch (_) {
    return '';
  }
}

// MCP configs are read by Antigravity long after BA Space wrote them, so they need a Node path that outlives this
// run. The packaged resources folder does not: the AppImage mounts at a new /tmp/.mount_* each launch, the Windows
// portable exe unpacks to a new temp folder, and a macOS user can move the app. So a packaged app copies its Node to
// <userData>/runtimes/node once (again when the bundled version changes) and configs point there.
function stableNodeDir(): string | null {
  const src = bundledNodeDir();
  if (!src || !app.isPackaged) return src;
  const runtimesDir = path.join(app.getPath('userData'), 'runtimes');
  const dest = path.join(runtimesDir, 'node');
  const destReady = fs.existsSync(nodeExecutable(dest)) && fs.existsSync(npxCli(dest));
  if (destReady && readVersion(dest) === readVersion(src)) return dest;

  // Swap by rename, so a copy an MCP server is running from (locked on Windows) is never left half-deleted.
  const staging = path.join(runtimesDir, 'node.new');
  const old = path.join(runtimesDir, 'node.old');
  try {
    fs.rmSync(staging, { recursive: true, force: true });
    fs.rmSync(old, { recursive: true, force: true });
    fs.mkdirSync(runtimesDir, { recursive: true });
    fs.cpSync(src, staging, { recursive: true, verbatimSymlinks: true });
    if (fs.existsSync(dest)) fs.renameSync(dest, old);
    fs.renameSync(staging, dest);
    fs.rmSync(old, { recursive: true, force: true });
    return dest;
  } catch (_) {
    fs.rmSync(staging, { recursive: true, force: true });
    // An older copy that is still in place keeps working.
    return destReady ? dest : null;
  }
}

export interface NpxLaunch {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// How to run `npx <args>`: the bundled Node (stable copy) when there is one, else npx from PATH.
// npx-cli.js is run by node directly (no npx shell script / .cmd shim to resolve), and PATH gets node's folder
// because the packages npx starts are `#!/usr/bin/env node` scripts (or .cmd shims calling `node`).
export function npxLaunch(npxArgs: string[]): NpxLaunch {
  const nodeDir = stableNodeDir();
  if (nodeDir) {
    const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
    const PATH = [nodeBinDir(nodeDir), process.env[pathKey]].filter(Boolean).join(path.delimiter);
    return { command: nodeExecutable(nodeDir), args: [npxCli(nodeDir), ...npxArgs], env: { PATH } };
  }
  // npx is a .cmd shim on Windows, which a bare spawn cannot start. On macOS/Linux use the absolute path, since an
  // MCP host started from Finder/Dock may not have Homebrew or nvm on PATH.
  if (isWin) return { command: 'cmd', args: ['/c', 'npx', ...npxArgs] };
  return { command: findOnPath('npx') || 'npx', args: npxArgs };
}
