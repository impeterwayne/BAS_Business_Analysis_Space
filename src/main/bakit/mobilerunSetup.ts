import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { execFile, spawn } from 'child_process';
import { isWin, isMac, localDataDir, venvExecutable, findOnPath } from '../platform';

// BA Space installs mobilerun for the user instead of expecting a hand-built checkout:
//   <local data>/BA Space/mobilerun/mcp/.venv  mobilerun-mcp (the MCP server BAKit registers per workspace)
//   <local data>/BA Space/mobilerun/cli/.venv  mobilerun CLI (installs the Portal APK on the device)
// <local data> is %LOCALAPPDATA% on Windows, ~/Library/Application Support on macOS, ~/.local/share on Linux.
// The CLI gets its own venv because its dependency tree pins versions mobilerun-mcp does not accept.
// The folder name is fixed rather than app.getPath('userData'), which differs between dev and packaged builds.
export const MOBILERUN_SETUP_ROOT = path.join(localDataDir(), 'BA Space', 'mobilerun');
const MCP_DIR = path.join(MOBILERUN_SETUP_ROOT, 'mcp');
const CLI_DIR = path.join(MOBILERUN_SETUP_ROOT, 'cli');
// Holds the sha256 of the bundled wheel it was installed from. Written only after the package imports
// cleanly, so a half-finished install is not picked up; compared with the bundle to spot an app update.
const MCP_MARKER = path.join(MCP_DIR, '.installed');

// mobilerun-mcp ships with BA Space as a wheel in toolkits\BAKit\mcp\ (built from mobilerun-mcp\ by
// scripts\bundle-mobilerun-wheel.js on every packaged build); only its dependencies come from PyPI.
const BUNDLED_WHEEL_PATTERN = /^mobilerun_mcp-.+\.whl$/;
const MOBILERUN_CLI_PACKAGE = 'mobilerun';
const WINGET_PYTHON_ID = 'Python.Python.3.13';
// mobilerun-mcp requires-python = ">=3.11,<3.14".
const PY_MIN_MINOR = 11;
const PY_MAX_MINOR = 13;

export interface PythonInfo {
  path: string;
  version: string;
}

export interface MobilerunSetupStatus {
  python: PythonInfo | null;
  // The interpreter BAKit registers: a developer checkout when one exists, else the managed install.
  mcpPython: string | null;
  // The managed install was made from a different wheel than the one this build ships.
  mcpOutdated: boolean;
  // sha256 prefix of the bundled wheel, null when the wheel is missing from toolkits.
  bundledWheelId: string | null;
  cliPath: string | null;
  installing: boolean;
  installRoot: string;
}

type Log = (line: string) => void;

export interface MobilerunSetupContext {
  // The interpreter BAKit registers (bakitService.resolveMobilerunPython): a developer checkout wins.
  resolveMcpPython: () => string | null;
  // toolkits\BAKit\mcp in this build.
  wheelDir: string;
}

let installing = false;

function venvPython(dir: string): string {
  return venvExecutable(path.join(dir, '.venv'), 'python');
}

export function getManagedMobilerunPython(): string | null {
  const python = venvPython(MCP_DIR);
  return fs.existsSync(MCP_MARKER) && fs.existsSync(python) ? python : null;
}

export function getManagedMobilerunCli(): string | null {
  const exe = venvExecutable(path.join(CLI_DIR, '.venv'), 'mobilerun');
  return fs.existsSync(exe) ? exe : null;
}

function run(file: string, args: string[], timeout = 15000): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(file, args, { timeout, windowsHide: true, encoding: 'utf8' }, (err, stdout) => resolve(err ? null : stdout));
  });
}

async function probePython(file: string, args: string[] = []): Promise<PythonInfo | null> {
  const out = await run(file, [...args, '-c', 'import sys; print(sys.executable); print("%d.%d" % sys.version_info[:2])']);
  if (!out) return null;
  const [exe, version] = out.trim().split(/\r?\n/).map((s) => s.trim());
  const minor = Number((version || '').split('.')[1]);
  if (!exe || !version?.startsWith('3.') || minor < PY_MIN_MINOR || minor > PY_MAX_MINOR) return null;
  return { path: exe, version };
}

function defaultPythonLocations(minor: number): string[] {
  if (isWin) {
    return [
      path.join(localDataDir(), 'Programs', 'Python', `Python3${minor}`, 'python.exe'),
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, `Python3${minor}`, 'python.exe'),
    ].filter(Boolean) as string[];
  }
  const bins = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', path.join(os.homedir(), '.local', 'bin')];
  const found = bins.map((dir) => path.join(dir, `python3.${minor}`));
  if (isMac) found.push(`/Library/Frameworks/Python.framework/Versions/3.${minor}/bin/python3`);
  return found;
}

// Checks the py launcher, PATH, then the default install folders: a Python that winget installed a moment
// ago is not on this process's PATH yet.
export async function findPython(): Promise<PythonInfo | null> {
  const minors = [];
  for (let m = PY_MAX_MINOR; m >= PY_MIN_MINOR; m--) minors.push(m);
  if (isWin) {
    for (const m of minors) {
      const found = await probePython('py', [`-3.${m}`]);
      if (found) return found;
    }
  }
  // Versioned names first: on macOS/Linux `python3` can be an older system Python next to a newer python3.13.
  const commands = isWin ? ['python', 'python3'] : [...minors.map((m) => `python3.${m}`), 'python3', 'python'];
  for (const cmd of commands) {
    const found = await probePython(cmd);
    if (found) return found;
  }
  for (const m of minors) {
    for (const exe of defaultPythonLocations(m)) {
      if (!fs.existsSync(exe)) continue;
      const found = await probePython(exe);
      if (found) return found;
    }
  }
  return null;
}

async function findCliOnPath(): Promise<string | null> {
  return findOnPath('mobilerun');
}

interface BundledWheel {
  path: string;
  hash: string;
}

function findBundledWheel(wheelDir: string): BundledWheel | null {
  let names: string[] = [];
  try {
    names = fs.readdirSync(wheelDir).filter((n) => BUNDLED_WHEEL_PATTERN.test(n));
  } catch (_) {
    return null;
  }
  if (!names.length) return null;
  // bundle-mobilerun-wheel.js keeps exactly one; if several slipped in, take the newest.
  const wheel = names
    .map((n) => path.join(wheelDir, n))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  const hash = crypto.createHash('sha256').update(fs.readFileSync(wheel)).digest('hex');
  return { path: wheel, hash };
}

function readMarker(): string {
  try {
    return fs.readFileSync(MCP_MARKER, 'utf8').trim();
  } catch (_) {
    return '';
  }
}

// Only the managed copy follows the bundle; a developer checkout is the developer's to update.
function isManagedOutdated(mcpPython: string | null, wheel: BundledWheel | null): boolean {
  return !!wheel && !!mcpPython && mcpPython === getManagedMobilerunPython() && readMarker() !== wheel.hash;
}

export async function getMobilerunSetupStatus(ctx?: MobilerunSetupContext): Promise<MobilerunSetupStatus> {
  return {
    python: { path: 'npx', version: 'latest' },
    mcpPython: 'npx',
    mcpOutdated: false,
    bundledWheelId: null,
    cliPath: 'npx',
    installing: false,
    installRoot: MOBILERUN_SETUP_ROOT,
  };
}

export async function installMobilerun(log: Log, ctx: MobilerunSetupContext): Promise<{ success: boolean; status?: MobilerunSetupStatus; error?: string }> {
  log('mobilerun is configured via npx (@impeterwayne/mobilerun-mcp@latest).');
  log('Done.');
  return { success: true, status: await getMobilerunSetupStatus(ctx) };
}

export function registerMobilerunSetupIpc({ ipcMain, ...ctx }: { ipcMain: any } & MobilerunSetupContext) {
  ipcMain.handle('mobilerun-setup:status', () => getMobilerunSetupStatus(ctx));
  ipcMain.handle('mobilerun-setup:install', (event: any) =>
    installMobilerun((line) => {
      if (!event.sender.isDestroyed()) event.sender.send('mobilerun-setup:log', line);
    }, ctx));
}
