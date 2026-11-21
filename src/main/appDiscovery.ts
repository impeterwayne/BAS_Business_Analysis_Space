import path from 'path';
import fs from 'fs';
import os from 'os';
import { isWin, isMac, localDataDir, findOnPath } from './platform';

// Finds apps installed somewhere a fixed path list cannot predict: portable archives unpacked under ~/Tools,
// ~/Downloads or /opt, folders renamed or nested by the archive ("Antigravity/Antigravity-x64/antigravity"),
// and anything a .desktop file points at.

const home = os.homedir();

export interface DiscoverSpec {
  // Which install folder (or .app bundle / .desktop file) names belong to the app.
  match: (name: string) => boolean;
  // Executables to try inside a matched folder, best first.
  executables: string[];
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch (_) {
    return false;
  }
}

function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch (_) {
    return false;
  }
}

function mtime(p: string): number {
  try {
    return fs.statSync(p).mtimeMs;
  } catch (_) {
    return 0;
  }
}

function subdirs(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() || (e.isSymbolicLink() && isDir(path.join(dir, e.name))))
      .map((e) => e.name);
  } catch (_) {
    return [];
  }
}

// Folders people unpack or install apps into, per OS.
export function installParentDirs(): string[] {
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const userDirs = [
    path.join(home, 'Tools'),
    path.join(home, 'tools'),
    path.join(home, 'Applications'),
    path.join(home, 'Apps'),
    path.join(home, 'apps'),
    path.join(home, 'Programs'),
    path.join(home, 'opt'),
    path.join(home, 'Downloads'),
    home,
  ];
  if (isWin) {
    return [path.join(localDataDir(), 'Programs'), localDataDir(), programFiles, programFilesX86, ...userDirs];
  }
  if (isMac) return ['/Applications', ...userDirs];
  return [localDataDir(), '/opt', '/usr/share', '/usr/local/share', '/usr/lib', ...userDirs];
}

// Executable inside an install root: the root itself on macOS (.app, launched with `open -a`), otherwise the
// first listed executable, looking one folder deeper for archives that wrap the app in a platform-named folder.
function executableIn(root: string, spec: DiscoverSpec): string | null {
  if (isMac) {
    if (root.toLowerCase().endsWith('.app')) return root;
    const bundle = subdirs(root).find((name) => name.toLowerCase().endsWith('.app') && spec.match(name));
    return bundle ? path.join(root, bundle) : null;
  }
  for (const dir of [root, ...subdirs(root).map((name) => path.join(root, name))]) {
    for (const rel of spec.executables) {
      const exe = path.join(dir, rel);
      if (isFile(exe)) return exe;
    }
  }
  return null;
}

function scanInstallDirs(spec: DiscoverSpec): string[] {
  const hits: Array<{ exe: string; time: number }> = [];
  for (const parent of [...new Set(installParentDirs())]) {
    for (const name of subdirs(parent)) {
      if (!spec.match(name)) continue;
      const root = path.join(parent, name);
      const exe = executableIn(root, spec);
      if (exe) hits.push({ exe, time: mtime(root) });
    }
  }
  // Newest install first: an updated copy usually sits next to the old one.
  return hits.sort((a, b) => b.time - a.time).map((h) => h.exe);
}

function desktopEntryDirs(): string[] {
  const dataHome = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
  const dataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share').split(':').filter(Boolean);
  return [
    path.join(dataHome, 'applications'),
    ...dataDirs.map((d) => path.join(d, 'applications')),
    '/var/lib/flatpak/exports/share/applications',
    path.join(home, '.local', 'share', 'flatpak', 'exports', 'share', 'applications'),
    '/var/lib/snapd/desktop/applications',
  ];
}

// The program an Exec= line runs, with field codes (%F, %U) and env/quoting stripped.
export function execProgram(execLine: string): string | null {
  const tokens = execLine.match(/"(?:[^"\\]|\\.)*"|\S+/g) || [];
  for (let token of tokens) {
    token = token.replace(/^"(.*)"$/, '$1').replace(/\\(.)/g, '$1');
    if (token === 'env' || /^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue;
    return token || null;
  }
  return null;
}

function scanDesktopEntries(spec: DiscoverSpec): string[] {
  if (isWin || isMac) return [];
  const found: string[] = [];
  for (const dir of [...new Set(desktopEntryDirs())]) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith('.desktop'));
    } catch (_) {
      continue;
    }
    for (const file of files) {
      let content = '';
      try {
        content = fs.readFileSync(path.join(dir, file), 'utf8');
      } catch (_) {
        continue;
      }
      const name = content.match(/^Name=(.*)$/m)?.[1]?.trim() || '';
      if (!spec.match(file.replace(/\.desktop$/, '')) && !spec.match(name)) continue;
      const execLine = content.match(/^Exec=(.*)$/m)?.[1];
      const program = execLine ? execProgram(execLine) : null;
      if (!program) continue;
      const exe = path.isAbsolute(program) ? program : findOnPath(program);
      if (exe && isFile(exe)) found.push(exe);
    }
  }
  return found;
}

// Every install of the app found on disk, best guess first.
export function discoverInstalls(spec: DiscoverSpec): string[] {
  return [...new Set([...scanInstallDirs(spec), ...scanDesktopEntries(spec)])];
}

// ── Antigravity ──────────────────────────────────────
// Two separate apps share the name: the IDE ("Antigravity IDE", `antigravity-ide`) and the Agent Manager
// ("Antigravity", `antigravity`). The Antigravity CLI is a third, terminal-only tool and must never match.

const isAntigravityIde = (name: string) => /antigravity[\s._-]*ide/i.test(name);
const isAntigravityAgent = (name: string) =>
  /antigravity/i.test(name) && !isAntigravityIde(name) && !/\bcli\b|[-_]cli/i.test(name);

export const ANTIGRAVITY_IDE: DiscoverSpec = {
  match: isAntigravityIde,
  executables: isWin
    ? ['Antigravity IDE.exe', 'antigravity-ide.exe', path.join('bin', 'antigravity-ide.cmd')]
    : isMac
      ? []
      : [path.join('bin', 'antigravity-ide'), 'antigravity-ide'],
};

export const ANTIGRAVITY_AGENT: DiscoverSpec = {
  match: isAntigravityAgent,
  executables: isWin ? ['Antigravity.exe', 'antigravity.exe'] : isMac ? [] : ['antigravity'],
};
