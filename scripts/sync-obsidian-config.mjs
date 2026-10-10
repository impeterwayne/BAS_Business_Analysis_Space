// Snapshots an Obsidian vault's .obsidian config into resources/obsidian-config, which ships with the app
// and is seeded into workspaces opened in Obsidian.
// Usage: node scripts/sync-obsidian-config.mjs [vault-path]   (defaults to the vault Obsidian has open)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'resources', 'obsidian-config');

// Layout, daily-notes folders and sync-conflict copies are vault-specific; only portable settings are kept.
const SETTINGS_FILES = ['app.json', 'appearance.json', 'core-plugins.json', 'graph.json', 'hotkeys.json', 'types.json'];
const PLUGIN_FILES = ['manifest.json', 'main.js', 'styles.css', 'data.json'];
const EXCLUDED_PLUGINS = new Set(['obsidian-herdr-agy']);

function obsidianJsonPath() {
  if (process.platform === 'win32') return path.join(process.env.APPDATA || '', 'obsidian', 'obsidian.json');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'obsidian', 'obsidian.json');
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'obsidian', 'obsidian.json');
}

function resolveVault() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  const vaults = Object.values(JSON.parse(fs.readFileSync(obsidianJsonPath(), 'utf-8')).vaults || {});
  const vault = vaults.find((v) => v.open) || vaults[0];
  if (!vault) throw new Error('No Obsidian vault found; pass a vault path.');
  return vault.path;
}

const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : fallback);
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const vault = resolveVault();
const src = path.join(vault, '.obsidian');
if (!fs.existsSync(src)) throw new Error(`No .obsidian folder in ${vault}`);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const name of SETTINGS_FILES) {
  if (fs.existsSync(path.join(src, name))) fs.copyFileSync(path.join(src, name), path.join(outDir, name));
}

// Startup "open daily note" depends on the source vault's daily-notes folder;
// workspaces are code repos, so non-markdown files stay out of the file explorer.
const appJson = readJson(path.join(outDir, 'app.json'), null);
if (appJson) {
  if (appJson.openBehavior === 'daily') delete appJson.openBehavior;
  appJson.showUnsupportedFiles = false;
  writeJson(path.join(outDir, 'app.json'), appJson);
}

// Only enabled plugins that are actually installed; their code plus settings, nothing else.
const plugins = [];
for (const id of readJson(path.join(src, 'community-plugins.json'), [])) {
  if (EXCLUDED_PLUGINS.has(id)) continue;
  const pluginDir = path.join(src, 'plugins', id);
  if (!fs.existsSync(path.join(pluginDir, 'manifest.json')) || !fs.existsSync(path.join(pluginDir, 'main.js'))) continue;
  fs.mkdirSync(path.join(outDir, 'plugins', id), { recursive: true });
  for (const name of PLUGIN_FILES) {
    if (fs.existsSync(path.join(pluginDir, name))) fs.copyFileSync(path.join(pluginDir, name), path.join(outDir, 'plugins', id, name));
  }
  plugins.push(id);
}
writeJson(path.join(outDir, 'community-plugins.json'), plugins);

const appearance = readJson(path.join(outDir, 'appearance.json'), null);
if (appearance) {
  const snippets = (appearance.enabledCssSnippets || []).filter((name) => fs.existsSync(path.join(src, 'snippets', `${name}.css`)));
  for (const name of snippets) {
    fs.mkdirSync(path.join(outDir, 'snippets'), { recursive: true });
    fs.copyFileSync(path.join(src, 'snippets', `${name}.css`), path.join(outDir, 'snippets', `${name}.css`));
  }
  appearance.enabledCssSnippets = snippets;
  if (appearance.cssTheme && fs.existsSync(path.join(src, 'themes', appearance.cssTheme))) {
    fs.cpSync(path.join(src, 'themes', appearance.cssTheme), path.join(outDir, 'themes', appearance.cssTheme), { recursive: true });
  }
  writeJson(path.join(outDir, 'appearance.json'), appearance);
}

console.log(`Bundled Obsidian config from ${vault}`);
console.log(`  plugins: ${plugins.join(', ') || '(none)'}`);
console.log(`  -> ${path.relative(root, outDir)}`);
