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

// mobilerun-mcp ships with BA Space as a wheel in toolkits\BAKit\mcp\ (built by
// toolkits\BAKit\scripts\bundle-mobilerun-wheel.ps1); only its dependencies come from PyPI.
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
  // bundle-mobilerun-wheel.ps1 keeps exactly one; if several slipped in, take the newest.
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

export async function getMobilerunSetupStatus(ctx: MobilerunSetupContext): Promise<MobilerunSetupStatus> {
  const [python, pathCli] = await Promise.all([findPython(), findCliOnPath()]);
  const mcpPython = ctx.resolveMcpPython();
  const wheel = findBundledWheel(ctx.wheelDir);
  return {
    python,
    mcpPython,
    mcpOutdated: isManagedOutdated(mcpPython, wheel),
    bundledWheelId: wheel ? wheel.hash.slice(0, 12) : null,
    cliPath: getManagedMobilerunCli() || pathCli,
    installing,
    installRoot: MOBILERUN_SETUP_ROOT,
  };
}

// Streams the command's output to log line by line; rejects on a non-zero exit.
function stream(file: string, args: string[], log: Log): Promise<void> {
  log(`> ${[file, ...args].map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PIP_DISABLE_PIP_VERSION_CHECK: '1' },
    });
    const forward = (chunk: Buffer) => {
      for (const line of chunk.toString('utf8').split(/\r?\n|\r/)) {
        if (line.trim()) log(line);
      }
    };
    child.stdout.on('data', forward);
    child.stderr.on('data', forward);
    child.on('error', (err) => reject(err));
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(file)} exited with code ${code}`))));
  });
}

async function installPython(log: Log): Promise<PythonInfo> {
  if (isMac) {
    if (!findOnPath('brew')) {
      throw new Error('Python 3.11-3.13 is not installed and Homebrew is not available. Install Python 3.13 from https://www.python.org/downloads/ (or `brew install python@3.13`) and retry.');
    }
    log('Installing Python 3.13 with Homebrew (python@3.13)...');
    await stream('brew', ['install', 'python@3.13'], log).catch((err) => log(`brew: ${err.message}`));
    const python = await findPython();
    if (!python) throw new Error('Python was not found after the Homebrew install. Install Python 3.13 from https://www.python.org/downloads/ and retry.');
    return python;
  }
  if (!isWin) {
    // Distro packages need root, so BA Space does not install them itself.
    throw new Error('Python 3.11-3.13 with venv support is not installed. Install it with your package manager (for example `sudo apt install python3.12 python3.12-venv` or `sudo dnf install python3.12`) and retry.');
  }
  if (!(await run('winget', ['--version']))) {
    throw new Error('Python 3.11-3.13 is not installed and winget is not available. Install Python 3.13 from https://www.python.org/downloads/ and retry.');
  }
  log(`Installing Python 3.13 with winget (${WINGET_PYTHON_ID}, current user)...`);
  // --scope user: no admin prompt; the installer goes to %LOCALAPPDATA%\Programs\Python.
  await stream('winget', [
    'install', '-e', '--id', WINGET_PYTHON_ID, '--scope', 'user', '--silent',
    '--accept-package-agreements', '--accept-source-agreements', '--disable-interactivity',
  ], log).catch((err) => log(`winget: ${err.message}`));
  const python = await findPython();
  if (!python) throw new Error('Python was not found after the winget install. Install Python 3.13 from https://www.python.org/downloads/ and retry.');
  return python;
}

async function installIntoVenv(python: string, dir: string, pkg: string, log: Log) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await stream(python, ['-m', 'venv', path.join(dir, '.venv')], log);
  await stream(venvPython(dir), ['-m', 'pip', 'install', pkg], log);
}

export async function installMobilerun(log: Log, ctx: MobilerunSetupContext): Promise<{ success: boolean; status?: MobilerunSetupStatus; error?: string }> {
  if (installing) return { success: false, error: 'An install is already running.' };
  installing = true;
  try {
    let python = await findPython();
    if (python) log(`Python ${python.version}: ${python.path}`);
    else python = await installPython(log);

    const mcpPython = ctx.resolveMcpPython();
    const wheel = findBundledWheel(ctx.wheelDir);
    if (mcpPython && !isManagedOutdated(mcpPython, wheel)) {
      log(`mobilerun-mcp found: ${mcpPython}`);
    } else {
      if (!wheel) {
        throw new Error(`The mobilerun-mcp wheel is missing from ${ctx.wheelDir}. Run toolkits/BAKit/scripts/bundle-mobilerun-wheel.ps1 and rebuild BA Space.`);
      }
      if (mcpPython) {
        log(`Updating mobilerun-mcp from the bundled ${path.basename(wheel.path)}...`);
        // Rebuilds keep the version number, so force the package itself, then add any new dependency.
        await stream(venvPython(MCP_DIR), ['-m', 'pip', 'install', '--force-reinstall', '--no-deps', wheel.path], log);
        await stream(venvPython(MCP_DIR), ['-m', 'pip', 'install', wheel.path], log);
      } else {
        log(`Installing mobilerun-mcp from the bundled ${path.basename(wheel.path)} (about 260 MB of dependencies)...`);
        await installIntoVenv(python.path, MCP_DIR, wheel.path, log);
      }
      await stream(venvPython(MCP_DIR), ['-c', 'import mobilerun_mcp'], log);
      fs.writeFileSync(MCP_MARKER, `${wheel.hash}\n`, 'utf8');
      log(`mobilerun-mcp installed: ${venvPython(MCP_DIR)}`);
    }

    const pathCli = getManagedMobilerunCli() || (await findCliOnPath());
    if (pathCli) {
      log(`mobilerun CLI found: ${pathCli}`);
    } else {
      log('Installing the mobilerun CLI, used to install the Portal app on the device (about 1 GB of dependencies)...');
      await installIntoVenv(python.path, CLI_DIR, MOBILERUN_CLI_PACKAGE, log);
      if (!getManagedMobilerunCli()) throw new Error('The mobilerun executable was not created by pip install mobilerun.');
      log(`mobilerun CLI installed: ${getManagedMobilerunCli()}`);
    }

    installing = false;
    log('Done.');
    return { success: true, status: await getMobilerunSetupStatus(ctx) };
  } catch (err: any) {
    log(`Error: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    installing = false;
  }
}

export function registerMobilerunSetupIpc({ ipcMain, ...ctx }: { ipcMain: any } & MobilerunSetupContext) {
  ipcMain.handle('mobilerun-setup:status', () => getMobilerunSetupStatus(ctx));
  ipcMain.handle('mobilerun-setup:install', (event: any) =>
    installMobilerun((line) => {
      if (!event.sender.isDestroyed()) event.sender.send('mobilerun-setup:log', line);
    }, ctx));
}
