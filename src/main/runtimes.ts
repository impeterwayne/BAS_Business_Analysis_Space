import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isWin, isMac, PYTHON_COMMAND } from './platform';

// Python and Java shipped with the app (scripts/fetch-runtimes.mjs), so ReaKit, jadx and the BAKit scripts
// run without the user installing either. Packaged: resources/runtimes. Dev: runtimes/<os>-<arch> in the repo.
// When a runtime is missing (dev without a fetch), everything falls back to what is on PATH.

const RUNTIME_KEY = `${isWin ? 'win' : isMac ? 'mac' : 'linux'}-${process.arch}`;

let cachedRoot: string | null | undefined;

function runtimesRoot(): string | null {
  if (cachedRoot !== undefined) return cachedRoot;
  const candidates = [
    process.resourcesPath && path.join(process.resourcesPath, 'runtimes'),
    path.join(app.getAppPath(), 'runtimes', RUNTIME_KEY),
  ].filter(Boolean) as string[];
  cachedRoot = candidates.find((dir) => fs.existsSync(dir)) ?? null;
  return cachedRoot;
}

function existing(file: string | null): string | null {
  return file && fs.existsSync(file) ? file : null;
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

// Copy of env with the bundled Python and Java first on PATH and JAVA_HOME pointing at the bundled JRE,
// so `python`, `java` and tools that read JAVA_HOME (jadx.bat) use them.
export function withBundledRuntimes(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...env };
  const javaHome = bundledJavaHome();
  const pythonDir = bundledPython() ? bundledPythonBinDir() : null;
  const dirs = [
    pythonDir,
    pythonDir && isWin ? path.join(pythonDir, 'Scripts') : null,
    javaHome && path.join(javaHome, 'bin'),
  ].filter(Boolean) as string[];
  if (!dirs.length) return out;

  // Windows env keys are case-insensitive but a plain object is not: reuse whichever spelling is there (Path).
  const pathKey = Object.keys(out).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
  out[pathKey] = [...dirs, out[pathKey]].filter(Boolean).join(path.delimiter);
  if (javaHome) out.JAVA_HOME = javaHome;
  return out;
}
