#!/usr/bin/env node
// Downloads the Python and Java runtimes BA Space ships with, so ReaKit (Python), jadx (Java) and the
// BAKit scripts run on a machine with neither installed. electron-builder copies runtimes/<os>-<arch>
// into resources/runtimes (extraResources in package.json); src/main/runtimes.ts finds them there.
//
//   node scripts/fetch-runtimes.mjs              every target this OS builds (macOS: arm64 and x64)
//   node scripts/fetch-runtimes.mjs win-x64 ...  only these targets
//
// Archives are pinned and checked against their SHA-256. A target whose marker matches is skipped.
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'runtimes');

const PBS = 'https://github.com/astral-sh/python-build-standalone/releases/download/20261003';
const TEMURIN = 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1';

// Keys follow electron-builder's ${os}-${arch}.
const TARGETS = {
  'win-x64': {
    python: { url: `${PBS}/cpython-3.12.15%2B20261003-x86_64-pc-windows-msvc-install_only_stripped.tar.gz`, sha256: '6fba7f2ae506facf41d457ea8293c7497910a675c69a4e954875169410a50402' },
    java: { url: `${TEMURIN}/OpenJDK21U-jre_x64_windows_hotspot_21.0.12.1_1.zip`, sha256: 'd35f31e712f0fcf6ac5a093edc90204fbff22f720ba3950bd09d331d5e621636' },
  },
  'mac-arm64': {
    python: { url: `${PBS}/cpython-3.12.15%2B20261003-aarch64-apple-darwin-install_only_stripped.tar.gz`, sha256: 'ad8d0c637c0a36b967b310e2c07254f4d2ca8cabaa7699e55ed6290aceb481a2' },
    java: { url: `${TEMURIN}/OpenJDK21U-jre_aarch64_mac_hotspot_21.0.12.1_1.tar.gz`, sha256: 'dec50fc6f9fcd4fe3ae8cabf5a5fa68f6afc48841f7698e468e9aa5d54beed84' },
  },
  'mac-x64': {
    python: { url: `${PBS}/cpython-3.12.15%2B20261003-x86_64-apple-darwin-install_only_stripped.tar.gz`, sha256: '562c30864ece2cb1d3e0ad66a1acd498611a47e5a10ce81b99158bef1ccbd355' },
    java: { url: `${TEMURIN}/OpenJDK21U-jre_x64_mac_hotspot_21.0.12.1_1.tar.gz`, sha256: '6717ec641fd9ce0bb209ca083ee23b42202ac68cb6fcc5753496e0e4a0f41989' },
  },
  'linux-x64': {
    python: { url: `${PBS}/cpython-3.12.15%2B20261003-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz`, sha256: '731af898886c5f821890dc901eca3c651cca8e51fa7308c159d12a1194aeac91' },
    java: { url: `${TEMURIN}/OpenJDK21U-jre_x64_linux_hotspot_21.0.12.1_1.tar.gz`, sha256: '2413149700df0f7d440500a84a8f764c535f21e5a5e87d38328b64eec2c5b500' },
  },
};

const HOST_TARGETS = { win32: ['win-x64'], darwin: ['mac-arm64', 'mac-x64'], linux: ['linux-x64'] };

// Windows' own bsdtar reads .zip as well as .tar.gz; a Git Bash tar earlier on PATH reads neither zip nor C:\ paths.
const TAR = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';

async function download(url, file, sha256) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const hash = createHash('sha256');
  const body = Readable.fromWeb(res.body);
  body.on('data', (chunk) => hash.update(chunk));
  await pipeline(body, createWriteStream(file));
  const actual = hash.digest('hex');
  if (actual !== sha256) throw new Error(`${path.basename(file)}: SHA-256 ${actual}, expected ${sha256}`);
}

// Unpacks archive and moves its single top-level folder to dest.
async function extract(archive, dest) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ba-runtime-'));
  try {
    execFileSync(TAR, ['-xf', archive, '-C', tmp], { stdio: 'inherit' });
    const [top] = await fs.readdir(tmp);
    await fs.rm(dest, { recursive: true, force: true });
    await fs.cp(path.join(tmp, top), dest, { recursive: true, verbatimSymlinks: true });
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

async function fetchTarget(key) {
  const spec = TARGETS[key];
  if (!spec) throw new Error(`Unknown target ${key}; expected one of ${Object.keys(TARGETS).join(', ')}`);
  const dir = path.join(ROOT, key);
  const marker = path.join(dir, '.fetched');
  const want = `${spec.python.sha256}\n${spec.java.sha256}\n`;
  if ((await fs.readFile(marker, 'utf8').catch(() => '')) === want) {
    console.log(`${key}: up to date`);
    return;
  }
  await fs.mkdir(dir, { recursive: true });
  const downloads = await fs.mkdtemp(path.join(os.tmpdir(), 'ba-runtime-dl-'));
  try {
    for (const name of ['python', 'java']) {
      const { url, sha256 } = spec[name];
      const archive = path.join(downloads, decodeURIComponent(path.basename(url)));
      console.log(`${key}: ${name} <- ${url}`);
      await download(url, archive, sha256);
      await extract(archive, path.join(dir, name));
    }
  } finally {
    await fs.rm(downloads, { recursive: true, force: true });
  }
  // python-build-standalone names it python3 on macOS/Linux; the BAKit skills call `python`.
  if (!key.startsWith('win-')) {
    const link = path.join(dir, 'python', 'bin', 'python');
    if (!(await fs.lstat(link).catch(() => null))) await fs.symlink('python3', link);
  }
  await fs.writeFile(marker, want);
  console.log(`${key}: done`);
}

const requested = process.argv.slice(2);
const keys = requested.length ? requested : HOST_TARGETS[process.platform] || [];
for (const key of keys) await fetchTarget(key);
