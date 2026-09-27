import path from 'path';
import fs from 'fs';
import os from 'os';
import { app } from 'electron';

// Antigravity loads MCP servers from one global file per machine, not from the workspace.
// Current builds read ~/.gemini/config/mcp_config.json; older ones ~/.gemini/antigravity/mcp_config.json.
export const MOBILERUN_SERVER_NAME = 'mobilerun';

export interface AntigravityMcpStatus {
  registered: boolean;
  configPath: string;
  entry?: any;
  pythonPath: string | null;
  error?: string;
}

export function getAntigravityMcpConfigPath(homeDir: string = os.homedir()): string {
  const geminiDir = path.join(homeDir, '.gemini');
  const currentDir = path.join(geminiDir, 'config');
  if (fs.existsSync(currentDir)) return path.join(currentDir, 'mcp_config.json');
  return path.join(geminiDir, 'antigravity', 'mcp_config.json');
}

export function resolveMobilerunPython(customPath?: string): string | null {
  const appPath = app.getAppPath();
  const candidates = [
    customPath,
    path.join(appPath, 'mobilerun-mcp'),
    path.join(path.dirname(appPath), 'mobilerun-mcp'),
    'D:\\Quest\\mobilerun-mcp',
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const python = path.join(dir, '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(python)) return fs.realpathSync(python);
  }
  return null;
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

export function getMobilerunMcpStatus(customPath?: string): AntigravityMcpStatus {
  const configPath = getAntigravityMcpConfigPath();
  const pythonPath = resolveMobilerunPython(customPath);
  try {
    const entry = readMcpConfig(configPath).mcpServers[MOBILERUN_SERVER_NAME];
    return { registered: !!entry, configPath, entry, pythonPath };
  } catch (err: any) {
    return { registered: false, configPath, pythonPath, error: `Invalid JSON in ${configPath}: ${err.message}` };
  }
}

export function registerMobilerunMcp(customPath?: string) {
  const configPath = getAntigravityMcpConfigPath();
  try {
    const config = readMcpConfig(configPath);
    if (config.mcpServers[MOBILERUN_SERVER_NAME]) {
      return { success: true, alreadyRegistered: true, configPath };
    }
    const pythonPath = resolveMobilerunPython(customPath);
    if (!pythonPath) {
      return { success: false, error: 'mobilerun-mcp not found: expected <mobilerun-mcp>\\.venv\\Scripts\\python.exe next to BA Space or at D:\\Quest\\mobilerun-mcp.' };
    }
    config.mcpServers[MOBILERUN_SERVER_NAME] = {
      command: pythonPath.replace(/\\/g, '/'),
      args: ['-m', 'mobilerun_mcp.server'],
    };
    writeMcpConfig(configPath, config);
    return { success: true, alreadyRegistered: false, configPath };
  } catch (err: any) {
    return { success: false, error: err.message, configPath };
  }
}

export function unregisterMobilerunMcp() {
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

export function registerBakitIpc({ ipcMain }: { ipcMain: any }) {
  ipcMain.handle('bakit:mcp-status', () => getMobilerunMcpStatus());
  ipcMain.handle('bakit:mcp-register', () => registerMobilerunMcp());
  ipcMain.handle('bakit:mcp-unregister', () => unregisterMobilerunMcp());
}
