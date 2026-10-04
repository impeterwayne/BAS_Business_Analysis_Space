import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFileSync } from 'child_process';

// Cross-platform helpers: everything that differs between Windows, macOS and Linux goes through here.
export const isWin = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';

const home = os.homedir();

// Per-user application data: %LOCALAPPDATA%, ~/Library/Application Support, or $XDG_DATA_HOME.
export function localDataDir(): string {
  if (isWin) return process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  if (isMac) return path.join(home, 'Library', 'Application Support');
  return process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
}

// Per-user config dir other apps keep their settings in: %APPDATA%, ~/Library/Application Support, or $XDG_CONFIG_HOME.
export function roamingConfigDir(): string {
  if (isWin) return process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  if (isMac) return path.join(home, 'Library', 'Application Support');
  return process.env.XDG_CONFIG_HOME || path.join(home, '.config');
}

// Executable inside a Python venv: .venv\Scripts\name.exe on Windows, .venv/bin/name elsewhere.
export function venvExecutable(venvDir: string, name: string): string {
  return isWin ? path.join(venvDir, 'Scripts', `${name}.exe`) : path.join(venvDir, 'bin', name);
}

// Adds .exe on Windows only.
export function exeName(name: string): string {
  return isWin ? `${name}.exe` : name;
}

// Python launcher name: `python` on Windows, `python3` on macOS/Linux (where `python` is often missing or Python 2).
export const PYTHON_COMMAND = isWin ? 'python' : 'python3';

// Every match for command on PATH (where.exe / which -a). Never uses a shell.
export function findAllOnPath(command: string): string[] {
  try {
    const output = execFileSync(isWin ? 'where.exe' : 'which', isWin ? [command] : ['-a', command], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true,
    }).trim();
    return output.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch (_) {
    return [];
  }
}

// First usable match for command on PATH. On Windows .cmd/.bat shims win over .exe when preferScripts is set
// (npm-installed CLIs), otherwise .exe wins.
export function findOnPath(command: string, { preferScripts = false } = {}): string | null {
  const matches = findAllOnPath(command);
  if (!matches.length) return null;
  if (!isWin) return matches.find((m) => fs.existsSync(m)) || null;
  const scripts = matches.find((m) => /\.(cmd|bat)$/i.test(m));
  const exes = matches.find((m) => /\.exe$/i.test(m));
  const resolved = (preferScripts ? scripts || exes : exes || scripts) || matches[0];
  return resolved && fs.existsSync(resolved) ? resolved : null;
}

export function firstExisting(candidates: Array<string | null | undefined | false>): string | null {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

// Android SDK locations per OS, plus ANDROID_HOME / ANDROID_SDK_ROOT.
export function androidSdkDirs(): string[] {
  const dirs = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];
  if (isWin) dirs.push(path.join(localDataDir(), 'Android', 'Sdk'));
  else if (isMac) dirs.push(path.join(home, 'Library', 'Android', 'sdk'));
  else dirs.push(path.join(home, 'Android', 'Sdk'), path.join(home, 'Android', 'sdk'));
  return dirs.filter(Boolean) as string[];
}

// Package-manager bin dirs that a GUI-launched app may not have on PATH (Homebrew, /usr/local, snap, ~/.local/bin).
export function unixBinDirs(): string[] {
  if (isWin) return [];
  return ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/snap/bin', path.join(home, '.local', 'bin')];
}

// Turns an executable path into what spawn needs: .cmd/.bat go through cmd.exe on Windows,
// .app bundles go through `open -a` on macOS. Everything else is spawned directly.
export function buildLaunch(exe: string, args: string[] = []): { file: string; args: string[] } {
  const ext = path.extname(exe).toLowerCase();
  if (isWin && (ext === '.cmd' || ext === '.bat')) {
    return { file: 'cmd.exe', args: ['/d', '/c', exe, ...args] };
  }
  if (isMac && ext === '.app') {
    return { file: 'open', args: ['-a', exe, ...args] };
  }
  return { file: exe, args };
}

// macOS and Linux GUI launches (Finder, Dock, desktop files) get a minimal PATH that misses Homebrew,
// nvm, pyenv and friends. Pull the PATH the user's login shell builds so adb, scrcpy, node, python and
// the AI CLIs resolve the same way they do in a terminal.
export function fixUnixPath(): void {
  if (isWin) return;
  const shellPath = process.env.SHELL || (isMac ? '/bin/zsh' : '/bin/bash');
  const marker = '__BA_SPACE_PATH__';
  let resolved = '';
  try {
    const output = execFileSync(shellPath, ['-ilc', `printf '${marker}%s${marker}' "$PATH"`], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
    const match = output.match(new RegExp(`${marker}(.*)${marker}`));
    resolved = match ? match[1] : '';
  } catch (_) {
    // Fall back to the static list below.
  }
  const parts = [
    ...resolved.split(':'),
    ...(process.env.PATH || '').split(':'),
    ...unixBinDirs(),
  ].filter(Boolean);
  process.env.PATH = [...new Set(parts)].join(':');
}
