import path from 'path';
import fs from 'fs';
import os from 'os';
import { app } from 'electron';
import { getManagedMobilerunPython } from './mobilerunSetup';
import { venvExecutable } from '../platform';

// mobilerun is registered per workspace as an Antigravity plugin: .agents/plugins/mobilerun/ with a
// plugin.json marker and an mcp_config.json. Antigravity discovers plugins under the workspace's .agents/,
// so the server only starts in BA workspaces. The global file (~/.gemini/config/mcp_config.json, or
// ~/.gemini/antigravity/mcp_config.json on older builds) is only read to offer removing an old entry.
export const MOBILERUN_SERVER_NAME = 'mobilerun';
const MOBILERUN_PLUGIN_DIR = path.join('.agents', 'plugins', 'mobilerun');

export interface MobilerunMcpStatus {
  registered: boolean;
  configPath: string;
  pythonPath: string | null;
  globalRegistered: boolean;
  globalConfigPath: string;
  error?: string;
}

export function getAntigravityMcpConfigPath(homeDir: string = os.homedir()): string {
  const geminiDir = path.join(homeDir, '.gemini');
  const currentDir = path.join(geminiDir, 'config');
  if (fs.existsSync(currentDir)) return path.join(currentDir, 'mcp_config.json');
  return path.join(geminiDir, 'antigravity', 'mcp_config.json');
}

export function getWorkspaceMobilerunConfigPath(worktreePath: string): string {
  return path.join(worktreePath, MOBILERUN_PLUGIN_DIR, 'mcp_config.json');
}

export function resolveMobilerunPython(customPath?: string): string | null {
  const appPath = app.getAppPath();
  const candidates = [
    customPath,
    path.join(appPath, 'mobilerun-mcp'),
    path.join(path.dirname(appPath), 'mobilerun-mcp'),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const python = venvExecutable(path.join(dir, '.venv'), 'python');
    if (fs.existsSync(python)) return fs.realpathSync(python);
  }
  // The copy BA Space installs (Mobilerun setup) when no developer checkout is present.
  return getManagedMobilerunPython();
}

function readMcpConfig(configPath: string): any {
  if (!fs.existsSync(configPath)) return { mcpServers: {} };
  const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
  if (!raw.trim()) return { mcpServers: {} };
  // Throws on invalid JSON on purpose: never overwrite a config we could not parse.
  const config = JSON.parse(raw);
  if (!config.mcpServers || typeof config.mcpServers !== 'object') config.mcpServers = {};
  return config;
}

function writeMcpConfig(configPath: string, config: any) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  if (fs.existsSync(configPath)) fs.copyFileSync(configPath, `${configPath}.bak`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

function isGloballyRegistered(globalConfigPath: string): boolean {
  try {
    return !!readMcpConfig(globalConfigPath).mcpServers[MOBILERUN_SERVER_NAME];
  } catch (_) {
    return false;
  }
}

export function getMobilerunMcpStatus(worktreePath: string, customPath?: string): MobilerunMcpStatus {
  const configPath = getWorkspaceMobilerunConfigPath(worktreePath);
  const globalConfigPath = getAntigravityMcpConfigPath();
  const pythonPath = resolveMobilerunPython(customPath);
  const globalRegistered = isGloballyRegistered(globalConfigPath);
  try {
    const registered = !!readMcpConfig(configPath).mcpServers[MOBILERUN_SERVER_NAME];
    return { registered, configPath, pythonPath, globalRegistered, globalConfigPath };
  } catch (err: any) {
    return { registered: false, configPath, pythonPath, globalRegistered, globalConfigPath, error: `Invalid JSON in ${configPath}: ${err.message}` };
  }
}

export function registerMobilerunMcp(worktreePath: string, customPath?: string) {
  const configPath = getWorkspaceMobilerunConfigPath(worktreePath);
  const globalRegistered = isGloballyRegistered(getAntigravityMcpConfigPath());
  try {
    const pythonPath = resolveMobilerunPython(customPath);
    if (!pythonPath) {
      return { success: false, error: 'mobilerun-mcp is not installed. Run Mobilerun setup (Python + mobilerun) from the BAKit toolkit screen first.' };
    }
    const pluginDir = path.dirname(configPath);
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify({
      name: 'mobilerun',
      description: 'BAKit: drives a connected Android device for competitor app analysis (mobilerun MCP).',
    }, null, 2) + '\n', 'utf8');
    // Keep any other server or setting the user added to this plugin's config.
    const config = readMcpConfig(configPath);
    config.mcpServers[MOBILERUN_SERVER_NAME] = {
      ...(config.mcpServers[MOBILERUN_SERVER_NAME] || {}),
      command: pythonPath.replace(/\\/g, '/'),
      args: ['-m', 'mobilerun_mcp.server'],
    };
    writeMcpConfig(configPath, config);
    return { success: true, configPath, globalRegistered };
  } catch (err: any) {
    return { success: false, error: err.message, configPath, globalRegistered };
  }
}

export function unregisterMobilerunMcp(worktreePath: string) {
  const pluginDir = path.join(worktreePath, MOBILERUN_PLUGIN_DIR);
  try {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    const pluginsDir = path.dirname(pluginDir);
    if (fs.existsSync(pluginsDir) && fs.readdirSync(pluginsDir).length === 0) fs.rmdirSync(pluginsDir);
    return { success: true, configPath: path.join(pluginDir, 'mcp_config.json') };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Removes the entry an earlier BAKit wrote to the global config, so the server does not start everywhere.
export function unregisterGlobalMobilerunMcp() {
  const configPath = getAntigravityMcpConfigPath();
  try {
    const config = readMcpConfig(configPath);
    if (!config.mcpServers[MOBILERUN_SERVER_NAME]) return { success: true, configPath };
    delete config.mcpServers[MOBILERUN_SERVER_NAME];
    writeMcpConfig(configPath, config);
    return { success: true, configPath };
  } catch (err: any) {
    return { success: false, error: err.message, configPath };
  }
}

// figma-mcp-android (Figma Desktop plugin bridge, launched with npx) is registered the same way, as the
// workspace plugin .agents/plugins/figma/. The server binds 127.0.0.1:1994 for the Figma plugin, so a
// second copy cannot run next to one from a global config: when an enabled global entry exists (the user
// may keep it there for AndroidHarnessAGY), the workspace plugin is not added and the global one is used.
export const FIGMA_SERVER_NAME = 'figma-mcp-android';
const FIGMA_PACKAGE = '@impeterwayne/figma-mcp-android@latest';
const FIGMA_PLUGIN_DIR = path.join('.agents', 'plugins', 'figma');

export interface FigmaMcpStatus {
  registered: boolean;
  configPath: string;
  globalRegistered: boolean;
  globalConfigPath: string | null;
  error?: string;
}

export function getWorkspaceFigmaConfigPath(worktreePath: string): string {
  return path.join(worktreePath, FIGMA_PLUGIN_DIR, 'mcp_config.json');
}

// Only the global file Antigravity reads counts (same resolution as mobilerun). Any enabled entry that
// launches figma-mcp-android counts, whatever its key.
function findGlobalFigmaConfig(): string | null {
  const configPath = getAntigravityMcpConfigPath();
  try {
    const servers = readMcpConfig(configPath).mcpServers;
    const found = Object.entries(servers).some(([name, entry]: [string, any]) => {
      if (!entry || entry.disabled) return false;
      const launch = [entry.command, ...(Array.isArray(entry.args) ? entry.args : [])].join(' ');
      return name === FIGMA_SERVER_NAME || launch.includes('figma-mcp-android');
    });
    return found ? configPath : null;
  } catch (_) {
    // An unreadable global config is not ours to judge; treat it as having no entry.
    return null;
  }
}

export function getFigmaMcpStatus(worktreePath: string): FigmaMcpStatus {
  const configPath = getWorkspaceFigmaConfigPath(worktreePath);
  const globalConfigPath = findGlobalFigmaConfig();
  const globalRegistered = !!globalConfigPath;
  try {
    const registered = !!readMcpConfig(configPath).mcpServers[FIGMA_SERVER_NAME];
    return { registered, configPath, globalRegistered, globalConfigPath };
  } catch (err: any) {
    return { registered: false, configPath, globalRegistered, globalConfigPath, error: `Invalid JSON in ${configPath}: ${err.message}` };
  }
}

export function registerFigmaMcp(worktreePath: string) {
  const configPath = getWorkspaceFigmaConfigPath(worktreePath);
  const globalConfigPath = findGlobalFigmaConfig();
  if (globalConfigPath) return { success: true, skipped: true, configPath, globalConfigPath };
  try {
    const pluginDir = path.dirname(configPath);
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify({
      name: 'figma',
      description: 'BAKit: reads the Figma design open in Figma Desktop (figma-mcp-android plugin bridge) for BA analysis.',
    }, null, 2) + '\n', 'utf8');
    // npx is a .cmd shim on Windows, which a bare spawn cannot start.
    const launch = process.platform === 'win32'
      ? { command: 'cmd', args: ['/c', 'npx', '-y', FIGMA_PACKAGE] }
      : { command: 'npx', args: ['-y', FIGMA_PACKAGE] };
    const config = readMcpConfig(configPath);
    config.mcpServers[FIGMA_SERVER_NAME] = { ...(config.mcpServers[FIGMA_SERVER_NAME] || {}), ...launch };
    writeMcpConfig(configPath, config);
    return { success: true, skipped: false, configPath, globalConfigPath: null };
  } catch (err: any) {
    return { success: false, error: err.message, configPath };
  }
}

export function unregisterFigmaMcp(worktreePath: string) {
  const pluginDir = path.join(worktreePath, FIGMA_PLUGIN_DIR);
  try {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    const pluginsDir = path.dirname(pluginDir);
    if (fs.existsSync(pluginsDir) && fs.readdirSync(pluginsDir).length === 0) fs.rmdirSync(pluginsDir);
    return { success: true, configPath: path.join(pluginDir, 'mcp_config.json'), globalConfigPath: findGlobalFigmaConfig() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// The delegation rule goes into the worktree's AGENTS.md as a marked block: Antigravity always reads
// AGENTS.md, while rule files load unreliably. Content outside the markers belongs to the user.
const AGENTS_MD_START = '<!-- bakit:orchestrate:start -->';
const AGENTS_MD_END = '<!-- bakit:orchestrate:end -->';
const AGENTS_MD_BLOCK_RE = /<!-- bakit:orchestrate:start -->[\s\S]*?<!-- bakit:orchestrate:end -->\r?\n?/;

export function getAgentsMdBlockStatus(worktreePath: string, sourcePath: string) {
  const agentsMdPath = path.join(worktreePath, 'AGENTS.md');
  const sourceExists = fs.existsSync(sourcePath);
  if (!fs.existsSync(agentsMdPath)) return { installed: false, current: false, sourceExists, agentsMdPath };
  const content = fs.readFileSync(agentsMdPath, 'utf8');
  const match = content.match(AGENTS_MD_BLOCK_RE);
  if (!match) return { installed: false, current: false, sourceExists, agentsMdPath };
  const current = sourceExists && match[0].includes(fs.readFileSync(sourcePath, 'utf8').trim());
  return { installed: true, current, sourceExists, agentsMdPath };
}

export function applyAgentsMdBlock(worktreePath: string, sourcePath: string) {
  const agentsMdPath = path.join(worktreePath, 'AGENTS.md');
  try {
    if (!fs.existsSync(sourcePath)) return { success: false, error: `Source not found: ${sourcePath}` };
    const block = `${AGENTS_MD_START}\n${fs.readFileSync(sourcePath, 'utf8').trim()}\n${AGENTS_MD_END}\n`;
    const created = !fs.existsSync(agentsMdPath);
    const existing = created ? '' : fs.readFileSync(agentsMdPath, 'utf8');
    const next = AGENTS_MD_BLOCK_RE.test(existing)
      ? existing.replace(AGENTS_MD_BLOCK_RE, block)
      : (existing.trim() ? `${block}\n${existing}` : block);
    fs.writeFileSync(agentsMdPath, next, 'utf8');
    return { success: true, created, agentsMdPath };
  } catch (err: any) {
    return { success: false, error: err.message, agentsMdPath };
  }
}

export function removeAgentsMdBlock(worktreePath: string) {
  const agentsMdPath = path.join(worktreePath, 'AGENTS.md');
  try {
    if (!fs.existsSync(agentsMdPath)) return { success: true, deleted: false, agentsMdPath };
    const rest = fs.readFileSync(agentsMdPath, 'utf8').replace(AGENTS_MD_BLOCK_RE, '').replace(/^\s+/, '');
    if (!rest.trim()) {
      fs.rmSync(agentsMdPath, { force: true });
      return { success: true, deleted: true, agentsMdPath };
    }
    fs.writeFileSync(agentsMdPath, rest, 'utf8');
    return { success: true, deleted: false, agentsMdPath };
  } catch (err: any) {
    return { success: false, error: err.message, agentsMdPath };
  }
}

export function registerBakitIpc({ ipcMain }: { ipcMain: any }) {
  ipcMain.handle('bakit:mcp-status', (_: any, { worktreePath }: { worktreePath: string }) => getMobilerunMcpStatus(worktreePath));
  ipcMain.handle('bakit:mcp-register', (_: any, { worktreePath }: { worktreePath: string }) => registerMobilerunMcp(worktreePath));
  ipcMain.handle('bakit:mcp-unregister', (_: any, { worktreePath }: { worktreePath: string }) => unregisterMobilerunMcp(worktreePath));
  ipcMain.handle('bakit:mcp-unregister-global', () => unregisterGlobalMobilerunMcp());
  ipcMain.handle('bakit:figma-mcp-status', (_: any, { worktreePath }: { worktreePath: string }) => getFigmaMcpStatus(worktreePath));
  ipcMain.handle('bakit:figma-mcp-register', (_: any, { worktreePath }: { worktreePath: string }) => registerFigmaMcp(worktreePath));
  ipcMain.handle('bakit:figma-mcp-unregister', (_: any, { worktreePath }: { worktreePath: string }) => unregisterFigmaMcp(worktreePath));
  ipcMain.handle('bakit:agents-md-status', (_: any, { worktreePath, sourcePath }: { worktreePath: string; sourcePath: string }) =>
    getAgentsMdBlockStatus(worktreePath, sourcePath));
  ipcMain.handle('bakit:agents-md-apply', (_: any, { worktreePath, sourcePath }: { worktreePath: string; sourcePath: string }) =>
    applyAgentsMdBlock(worktreePath, sourcePath));
  ipcMain.handle('bakit:agents-md-remove', (_: any, { worktreePath }: { worktreePath: string }) =>
    removeAgentsMdBlock(worktreePath));
}
