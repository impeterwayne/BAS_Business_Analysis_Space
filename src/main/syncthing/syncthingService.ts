import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  isWin,
  isMac,
  findOnPath,
  firstExisting,
  localDataDir,
  roamingConfigDir,
  buildLaunch,
} from '../platform';

const execFileAsync = promisify(execFile);

const {
  DEFAULT_SYNCTHING_FOLDER_ID,
  SYNCTHING_MANIFEST_REL_PATH,
  normalizeSyncMode,
  parseSyncthingConfigXml,
  parseSyncthingPathsOutput,
  parseSyncthingVersionOutput,
  getProjectFolderInSyncRoot,
  generateStignoreBas,
  ensureStignoreInclude,
  buildPortableProjectManifest,
  portableManifestEquals,
  mergePortableProjectManifest,
  parseSyncConflictFile,
  findSyncConflicts,
} = require('../../domain/syncthing');

export interface SyncthingInstallationInfo {
  installed: boolean;
  binaryPath: string | null;
  version: string | null;
  configPath: string | null;
  defaultSyncDir: string | null;
  apiUrl: string;
  hasApiKey: boolean;
}

export interface SyncthingDeviceState {
  deviceID: string;
  name: string;
  connected: boolean;
  paused: boolean;
  selected: boolean;
  address: string;
}

export interface SyncthingConflictItem {
  projectPath: string;
  projectName: string;
  relativePath: string;
  originalRelativePath: string;
  fullPath: string;
  timestamp: string;
  devicePrefix: string;
  isManifestConflict: boolean;
}

export type ProjectSyncBadgeState =
  | 'synced'
  | 'syncing'
  | 'paused'
  | 'conflict'
  | 'outside-root'
  | 'offline'
  | 'unconfigured';

export interface SyncthingProjectStatus {
  projectPath: string;
  projectName: string;
  folderName: string | null;
  inSyncRoot: boolean;
  enabled: boolean;
  state: ProjectSyncBadgeState;
  completion: number;
  conflicts: SyncthingConflictItem[];
  manifestConflicts: SyncthingConflictItem[];
}

export interface SyncthingDiscoveredProject {
  path: string;
  folderName: string;
  name: string;
  hasManifest: boolean;
  hasDocs: boolean;
  competitorCount: number;
}

export interface SyncthingState {
  installed: boolean;
  running: boolean;
  binaryPath: string | null;
  version: string | null;
  configPath: string | null;
  apiUrl: string;
  myDeviceId: string;
  rootPath: string;
  folderId: string;
  syncMode: 'selected' | 'all';
  folderRegistered: boolean;
  folderState: string;
  folderCompletion: number;
  needBytes: number;
  needItems: number;
  devices: SyncthingDeviceState[];
  projects: Record<string, SyncthingProjectStatus>;
  discoveredProjects: SyncthingDiscoveredProject[];
  totalConflicts: number;
  lastError: string | null;
}

interface SyncthingServiceOptions {
  workspaceService: any;
  shell: any;
  onStateUpdated?: (payload: { state: SyncthingState; mergedProjects: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> }) => void;
}

function sameFsPath(a: string, b: string): boolean {
  const na = path.normalize(path.resolve(a));
  const nb = path.normalize(path.resolve(b));
  return isWin ? na.toLowerCase() === nb.toLowerCase() : na === nb;
}

export class SyncthingService {
  private workspaceService: any;
  private shell: any;
  private onStateUpdated?: SyncthingServiceOptions['onStateUpdated'];
  private runningLoop = false;
  private loopAbortController: AbortController | null = null;
  private backoffResolve: (() => void) | null = null;
  private lastEventId = 0;

  constructor({ workspaceService, shell, onStateUpdated }: SyncthingServiceOptions) {
    this.workspaceService = workspaceService;
    this.shell = shell;
    this.onStateUpdated = onStateUpdated;
  }

  private getSettings() {
    return this.workspaceService.getSettings();
  }

  private syncthingCandidates(): string[] {
    if (isWin) {
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      return [
        path.join(programFiles, 'Syncthing', 'syncthing.exe'),
        path.join(localDataDir(), 'Programs', 'Syncthing', 'syncthing.exe'),
        path.join(localDataDir(), 'SyncTrayzor', 'syncthing.exe'),
      ];
    }
    if (isMac) {
      return [
        '/opt/homebrew/bin/syncthing',
        '/usr/local/bin/syncthing',
        '/Applications/Syncthing.app/Contents/Resources/syncthing/syncthing',
      ];
    }
    return [
      '/usr/bin/syncthing',
      '/usr/local/bin/syncthing',
      path.join(os.homedir(), '.local', 'bin', 'syncthing'),
      '/snap/bin/syncthing',
    ];
  }

  private defaultConfigXmlCandidates(): string[] {
    if (isWin) {
      return [
        path.join(localDataDir(), 'Syncthing', 'config.xml'),
        path.join(roamingConfigDir(), 'Syncthing', 'config.xml'),
      ];
    }
    if (isMac) {
      return [
        path.join(os.homedir(), 'Library', 'Application Support', 'Syncthing', 'config.xml'),
      ];
    }
    return [
      path.join(localDataDir(), 'syncthing', 'config.xml'),
      path.join(roamingConfigDir(), 'syncthing', 'config.xml'),
    ];
  }

  public resolveBinaryPath(customPath?: string): string | null {
    const configured = (customPath !== undefined ? customPath : this.getSettings().syncthingPath || '').trim();
    if (configured) {
      if (path.isAbsolute(configured)) {
        if (fs.existsSync(configured)) return configured;
      } else {
        const onPath = findOnPath(configured);
        if (onPath) return onPath;
      }
    }
    return findOnPath('syncthing') || firstExisting(this.syncthingCandidates());
  }

  private async execSyncthing(binaryPath: string, args: string[], timeout = 4000): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync(binaryPath, args, {
        encoding: 'utf-8',
        timeout,
        windowsHide: true,
      });
      return typeof stdout === 'string' ? stdout : String(stdout || '');
    } catch {
      return null;
    }
  }

  private async detectInstallation(settingsOverride?: any): Promise<{
    info: SyncthingInstallationInfo;
    apiKey: string;
  }> {
    const settings = settingsOverride || this.getSettings();
    const binaryPath = this.resolveBinaryPath(settings.syncthingPath);

    let version: string | null = null;
    let configPath: string | null = null;
    let defaultSyncDir: string | null = null;

    if (binaryPath) {
      const [verOut, pathsOut] = await Promise.all([
        this.execSyncthing(binaryPath, ['--version']),
        this.execSyncthing(binaryPath, ['paths']).then((out) => out ?? this.execSyncthing(binaryPath, ['--paths'])),
      ]);
      if (verOut) {
        version = parseSyncthingVersionOutput(verOut);
      }
      if (pathsOut) {
        const parsedPaths = parseSyncthingPathsOutput(pathsOut);
        configPath = parsedPaths.configFile;
        defaultSyncDir = parsedPaths.defaultSyncDir;
      }
    }

    if (!configPath || !fs.existsSync(configPath)) {
      const fallbackConfig = firstExisting(this.defaultConfigXmlCandidates());
      if (fallbackConfig) configPath = fallbackConfig;
    }

    let parsedXml: { address: string; apiKey: string; tls: boolean; apiUrl: string } | null = null;
    if (configPath && fs.existsSync(configPath)) {
      try {
        const xml = fs.readFileSync(configPath, 'utf-8');
        parsedXml = parseSyncthingConfigXml(xml);
      } catch {
        parsedXml = null;
      }
    }

    const apiUrl = (settings.syncthingApiUrl || '').trim() || parsedXml?.apiUrl || '';
    const apiKey = parsedXml?.apiKey || '';

    return {
      info: {
        installed: Boolean(binaryPath || parsedXml),
        binaryPath,
        version,
        configPath,
        defaultSyncDir,
        apiUrl,
        hasApiKey: Boolean(apiKey),
      },
      apiKey,
    };
  }

  private async apiRequest<T = any>(
    apiUrl: string,
    apiKey: string,
    endpoint: string,
    options: { method?: string; body?: any; timeoutMs?: number; signal?: AbortSignal } = {}
  ): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
    if (!apiUrl || !apiKey) {
      return { ok: false, status: 0, data: null, error: 'Syncthing API URL or key unavailable' };
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 5000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timer);
        return { ok: false, status: 0, data: null, error: 'Aborted' };
      }
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const headers: Record<string, string> = {
        'X-API-Key': apiKey,
      };
      let body: string | undefined;
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.body);
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : (typeof data === 'string' && data ? data : `HTTP ${response.status}`),
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: err?.name === 'AbortError' ? 'Request aborted or timed out' : (err?.message || String(err)),
      };
    } finally {
      clearTimeout(timer);
      if (options.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  public writeIgnoreFiles(settingsOverride?: any): { success: boolean; error?: string } {
    const settings = settingsOverride || this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    if (!rootPath) {
      return { success: false, error: 'Sync root path is not configured' };
    }

    try {
      fs.mkdirSync(rootPath, { recursive: true });
      const stignorePath = path.join(rootPath, '.stignore');
      const existingStignore = fs.existsSync(stignorePath) ? fs.readFileSync(stignorePath, 'utf-8') : '';
      const nextStignore = ensureStignoreInclude(existingStignore);
      if (nextStignore !== existingStignore || !fs.existsSync(stignorePath)) {
        fs.writeFileSync(stignorePath, nextStignore, 'utf-8');
      }

      const stignoreBasPath = path.join(rootPath, '.stignore-bas');
      const nextStignoreBas = generateStignoreBas({
        mode: normalizeSyncMode(settings.syncthingSyncMode),
        enabledProjects: settings.syncthingEnabledProjects || [],
      });
      const existingBas = fs.existsSync(stignoreBasPath) ? fs.readFileSync(stignoreBasPath, 'utf-8') : '';
      if (nextStignoreBas !== existingBas || !fs.existsSync(stignoreBasPath)) {
        fs.writeFileSync(stignoreBasPath, nextStignoreBas, 'utf-8');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public getProjectSyncMembership(projectPath: string, settingsOverride?: any): {
    inSyncRoot: boolean;
    folderName: string | null;
    enabled: boolean;
  } {
    const settings = settingsOverride || this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    if (!rootPath || !projectPath) {
      return { inSyncRoot: false, folderName: null, enabled: false };
    }

    const folderName = getProjectFolderInSyncRoot(rootPath, projectPath, { caseInsensitive: isWin });
    if (!folderName) {
      return { inSyncRoot: false, folderName: null, enabled: false };
    }

    const syncMode = normalizeSyncMode(settings.syncthingSyncMode);
    if (syncMode === 'all') {
      return { inSyncRoot: true, folderName, enabled: true };
    }

    const enabledList: string[] = Array.isArray(settings.syncthingEnabledProjects)
      ? settings.syncthingEnabledProjects
      : [];
    const enabled = enabledList.some((item) => (isWin ? item.toLowerCase() === folderName.toLowerCase() : item === folderName));
    return { inSyncRoot: true, folderName, enabled };
  }

  public exportProjectManifest(projectPath: string): { exported: boolean; error?: string } {
    if (!projectPath) return { exported: false };
    const membership = this.getProjectSyncMembership(projectPath);
    if (!membership.enabled) return { exported: false };

    const projects = this.workspaceService.getWorkspaces();
    const project = projects.find((p: any) => p.path === projectPath);
    if (!project) return { exported: false };

    try {
      const manifestPath = path.join(projectPath, SYNCTHING_MANIFEST_REL_PATH);
      const nextManifest = buildPortableProjectManifest(project);

      if (fs.existsSync(manifestPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (portableManifestEquals(existing, nextManifest)) {
            return { exported: false };
          }
        } catch {
          // Overwrite malformed manifest
        }
      }

      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf-8');
      return { exported: true };
    } catch (err: any) {
      return { exported: false, error: err?.message || String(err) };
    }
  }

  public importProjectManifest(projectPath: string): {
    merged: boolean;
    competitorsChanged: boolean;
    project?: any;
  } {
    if (!projectPath) return { merged: false, competitorsChanged: false };
    const manifestPath = path.join(projectPath, SYNCTHING_MANIFEST_REL_PATH);
    if (!fs.existsSync(manifestPath)) {
      return { merged: false, competitorsChanged: false };
    }

    const projects = this.workspaceService.getWorkspaces();
    const localProject = projects.find((p: any) => p.path === projectPath);
    if (!localProject) {
      return { merged: false, competitorsChanged: false };
    }

    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      const { project: mergedProject, changed, competitorsChanged } = mergePortableProjectManifest(localProject, manifest);
      if (!changed) {
        return { merged: false, competitorsChanged: false, project: localProject };
      }

      const applied = this.workspaceService.applySyncedProjectUpdate(projectPath, mergedProject);
      if (!applied?.success) {
        return { merged: false, competitorsChanged: false };
      }
      return {
        merged: true,
        competitorsChanged,
        project: applied.project,
      };
    } catch (err) {
      console.warn(`Failed to import Syncthing manifest at ${manifestPath}:`, err);
      return { merged: false, competitorsChanged: false };
    }
  }

  public importAllSyncedProjects(): Array<{ projectPath: string; name: string; competitorsChanged: boolean }> {
    const settings = this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    if (!rootPath) return [];

    const projects = this.workspaceService.getWorkspaces();
    const mergedResults: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> = [];

    for (const project of projects) {
      if (!project?.path) continue;
      const membership = this.getProjectSyncMembership(project.path, settings);
      if (!membership.enabled) continue;

      const res = this.importProjectManifest(project.path);
      if (res.merged) {
        mergedResults.push({
          projectPath: project.path,
          name: res.project?.name || project.name || path.basename(project.path),
          competitorsChanged: res.competitorsChanged,
        });
      }
    }

    return mergedResults;
  }

  public onLocalProjectChanged(projectPath: string): void {
    const res = this.exportProjectManifest(projectPath);
    if (res.exported) {
      void this.rescan({ projectPath }).catch(() => {});
    }
  }

  public scanProjectConflicts(projectPath: string, projectName?: string): SyncthingConflictItem[] {
    if (!projectPath || !fs.existsSync(projectPath)) return [];

    const relPaths: string[] = [];
    const rootsToScan = ['docs', '.bas'];

    const walk = (dirPath: string, relBase: string, depth: number) => {
      if (depth > 8) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const rel = `${relBase}/${entry.name}`;
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walk(full, rel, depth + 1);
        } else if (entry.isFile()) {
          relPaths.push(rel);
        }
      }
    };

    for (const sub of rootsToScan) {
      const subDir = path.join(projectPath, sub);
      if (fs.existsSync(subDir)) {
        walk(subDir, sub, 0);
      }
    }

    const parsed = findSyncConflicts(relPaths);
    const displayName = projectName || path.basename(projectPath);
    return parsed.map((item: any) => ({
      projectPath,
      projectName: displayName,
      relativePath: item.relativePath,
      originalRelativePath: item.originalRelativePath,
      fullPath: path.join(projectPath, ...item.relativePath.split('/')),
      timestamp: item.timestamp,
      devicePrefix: item.devicePrefix,
      isManifestConflict: item.isManifestConflict,
    }));
  }

  public discoverSyncedProjects(settingsOverride?: any): SyncthingDiscoveredProject[] {
    const settings = settingsOverride || this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    if (!rootPath || !fs.existsSync(rootPath)) return [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(rootPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const existingProjects = this.workspaceService.getWorkspaces();
    const discovered: SyncthingDiscoveredProject[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(rootPath, entry.name);
      if (existingProjects.some((p: any) => p.path && sameFsPath(p.path, fullPath))) {
        continue;
      }

      const manifestPath = path.join(fullPath, SYNCTHING_MANIFEST_REL_PATH);
      const docsPath = path.join(fullPath, 'docs');
      const hasManifest = fs.existsSync(manifestPath);
      const hasDocs = fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory();
      if (!hasManifest && !hasDocs) continue;

      let name = entry.name;
      let competitorCount = 0;
      if (hasManifest) {
        try {
          const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (typeof parsed?.project?.name === 'string' && parsed.project.name.trim()) {
            name = parsed.project.name.trim();
          }
          if (Array.isArray(parsed?.competitors)) {
            competitorCount = parsed.competitors.length;
          }
        } catch {
          // Ignore malformed manifest during discovery preview
        }
      }

      discovered.push({
        path: fullPath,
        folderName: entry.name,
        name,
        hasManifest,
        hasDocs,
        competitorCount,
      });
    }

    return discovered.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getState(): Promise<SyncthingState> {
    const settings = this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    const folderId = (settings.syncthingFolderId || DEFAULT_SYNCTHING_FOLDER_ID).trim() || DEFAULT_SYNCTHING_FOLDER_ID;
    const syncMode = normalizeSyncMode(settings.syncthingSyncMode) as 'selected' | 'all';

    const { info, apiKey } = await this.detectInstallation(settings);
    let running = false;
    let myDeviceId = '';
    let folderRegistered = false;
    let folderState = 'unknown';
    let folderCompletion = 100;
    let needBytes = 0;
    let needItems = 0;
    let lastError: string | null = null;
    const devices: SyncthingDeviceState[] = [];

    if (info.apiUrl && apiKey) {
      const statusRes = await this.apiRequest(info.apiUrl, apiKey, '/rest/system/status', { timeoutMs: 2500 });
      if (statusRes.ok && statusRes.data?.myID) {
        running = true;
        myDeviceId = statusRes.data.myID;

        const [devicesRes, connectionsRes, folderConfigRes, dbStatusRes] = await Promise.all([
          this.apiRequest(info.apiUrl, apiKey, '/rest/config/devices'),
          this.apiRequest(info.apiUrl, apiKey, '/rest/system/connections'),
          this.apiRequest(info.apiUrl, apiKey, `/rest/config/folders/${encodeURIComponent(folderId)}`),
          this.apiRequest(info.apiUrl, apiKey, `/rest/db/status?folder=${encodeURIComponent(folderId)}`),
        ]);

        const connMap = connectionsRes.ok && connectionsRes.data?.connections ? connectionsRes.data.connections : {};
        const folderDevices: string[] = Array.isArray(folderConfigRes.data?.devices)
          ? folderConfigRes.data.devices.map((d: any) => d.deviceID).filter(Boolean)
          : [];
        const selectedSettingIds = new Set<string>(Array.isArray(settings.syncthingDeviceIds) ? settings.syncthingDeviceIds : []);

        if (devicesRes.ok && Array.isArray(devicesRes.data)) {
          for (const dev of devicesRes.data) {
            if (!dev?.deviceID || dev.deviceID === myDeviceId) continue;
            const conn = connMap[dev.deviceID] || {};
            devices.push({
              deviceID: dev.deviceID,
              name: dev.name || dev.deviceID.slice(0, 7),
              connected: Boolean(conn.connected),
              paused: Boolean(dev.paused || conn.paused),
              selected: folderConfigRes.ok ? folderDevices.includes(dev.deviceID) : selectedSettingIds.has(dev.deviceID),
              address: conn.address || '',
            });
          }
        }

        if (folderConfigRes.ok && folderConfigRes.data) {
          folderRegistered = true;
        }

        if (dbStatusRes.ok && dbStatusRes.data) {
          folderState = dbStatusRes.data.state || 'idle';
          const globalBytes = Number(dbStatusRes.data.globalBytes || 0);
          const inSyncBytes = Number(dbStatusRes.data.inSyncBytes || 0);
          needBytes = Number(dbStatusRes.data.needBytes || 0);
          needItems = Number(dbStatusRes.data.needTotalItems || 0);
          if (globalBytes > 0) {
            folderCompletion = Math.max(0, Math.min(100, Math.round((inSyncBytes / globalBytes) * 100)));
          } else {
            folderCompletion = needBytes === 0 && needItems === 0 ? 100 : 0;
          }
        }
      } else if (statusRes.error && info.installed) {
        lastError = statusRes.error;
      }
    }

    const workspaces = this.workspaceService.getWorkspaces();
    const projectStatuses: Record<string, SyncthingProjectStatus> = {};
    let totalConflicts = 0;

    for (const proj of workspaces) {
      if (!proj?.path) continue;
      const membership = this.getProjectSyncMembership(proj.path, settings);
      const conflicts = membership.inSyncRoot
        ? this.scanProjectConflicts(proj.path, proj.name)
        : [];
      const manifestConflicts = conflicts.filter((c) => c.isManifestConflict);
      totalConflicts += conflicts.length;

      let projState: ProjectSyncBadgeState = 'unconfigured';
      if (!rootPath) {
        projState = 'unconfigured';
      } else if (!membership.inSyncRoot) {
        projState = 'outside-root';
      } else if (conflicts.length > 0) {
        projState = 'conflict';
      } else if (!membership.enabled) {
        projState = 'paused';
      } else if (!running) {
        projState = 'offline';
      } else if (folderState === 'syncing' || folderState === 'sync-preparing' || folderState === 'scanning' || needBytes > 0 || needItems > 0) {
        projState = 'syncing';
      } else {
        projState = 'synced';
      }

      projectStatuses[proj.path] = {
        projectPath: proj.path,
        projectName: proj.name || path.basename(proj.path),
        folderName: membership.folderName,
        inSyncRoot: membership.inSyncRoot,
        enabled: membership.enabled,
        state: projState,
        completion: folderCompletion,
        conflicts,
        manifestConflicts,
      };
    }

    const discoveredProjects = this.discoverSyncedProjects(settings);

    return {
      installed: info.installed,
      running,
      binaryPath: info.binaryPath,
      version: info.version,
      configPath: info.configPath,
      apiUrl: info.apiUrl,
      myDeviceId,
      rootPath,
      folderId,
      syncMode,
      folderRegistered,
      folderState,
      folderCompletion,
      needBytes,
      needItems,
      devices,
      projects: projectStatuses,
      discoveredProjects,
      totalConflicts,
      lastError,
    };
  }

  private async emitStateUpdated(mergedProjects: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> = []): Promise<SyncthingState> {
    const state = await this.getState();
    if (this.onStateUpdated) {
      this.onStateUpdated({ state, mergedProjects });
    }
    return state;
  }

  public async configureRoot(opts: {
    rootPath?: string;
    folderId?: string;
    syncMode?: 'selected' | 'all';
    deviceIds?: string[];
    syncthingPath?: string;
    syncthingApiUrl?: string;
  } = {}): Promise<{ success: boolean; state?: SyncthingState; error?: string }> {
    try {
      const current = this.getSettings();
      const nextSettings = this.workspaceService.updateSettings({
        ...current,
        ...(opts.rootPath !== undefined ? { syncthingRootPath: opts.rootPath } : {}),
        ...(opts.folderId !== undefined ? { syncthingFolderId: opts.folderId } : {}),
        ...(opts.syncMode !== undefined ? { syncthingSyncMode: opts.syncMode } : {}),
        ...(opts.deviceIds !== undefined ? { syncthingDeviceIds: opts.deviceIds } : {}),
        ...(opts.syncthingPath !== undefined ? { syncthingPath: opts.syncthingPath } : {}),
        ...(opts.syncthingApiUrl !== undefined ? { syncthingApiUrl: opts.syncthingApiUrl } : {}),
      });

      const rootPath = (nextSettings.syncthingRootPath || '').trim();
      const folderId = nextSettings.syncthingFolderId || DEFAULT_SYNCTHING_FOLDER_ID;
      let mergedProjects: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> = [];

      if (rootPath) {
        const ignoreRes = this.writeIgnoreFiles(nextSettings);
        if (!ignoreRes.success) {
          const state = await this.emitStateUpdated();
          return { success: false, state, error: ignoreRes.error };
        }

        const { info, apiKey } = await this.detectInstallation(nextSettings);
        if (info.apiUrl && apiKey) {
          const statusRes = await this.apiRequest(info.apiUrl, apiKey, '/rest/system/status', { timeoutMs: 2500 });
          if (statusRes.ok && statusRes.data?.myID) {
            const myID = statusRes.data.myID;
            const existingFolderRes = await this.apiRequest(
              info.apiUrl,
              apiKey,
              `/rest/config/folders/${encodeURIComponent(folderId)}`
            );
            let folderPayload: any = existingFolderRes.ok && existingFolderRes.data ? { ...existingFolderRes.data } : null;
            if (!folderPayload) {
              const defaultsRes = await this.apiRequest(info.apiUrl, apiKey, '/rest/config/defaults/folder');
              folderPayload = defaultsRes.ok && defaultsRes.data ? { ...defaultsRes.data } : {};
            }

            const existingDevicesMap = new Map<string, any>();
            if (Array.isArray(folderPayload.devices)) {
              for (const d of folderPayload.devices) {
                if (d?.deviceID) existingDevicesMap.set(d.deviceID, d);
              }
            }

            const selectedIds = new Set<string>([
              myID,
              ...(Array.isArray(nextSettings.syncthingDeviceIds) ? nextSettings.syncthingDeviceIds : []),
            ]);
            const devicesList = Array.from(selectedIds).map((id) => {
              const prev = existingDevicesMap.get(id);
              return prev ? { ...prev, deviceID: id } : { deviceID: id, introducedBy: '' };
            });

            folderPayload.id = folderId;
            folderPayload.label = folderPayload.label || 'BA Space Projects';
            folderPayload.path = rootPath;
            folderPayload.type = 'sendreceive';
            folderPayload.fsWatcherEnabled = true;
            folderPayload.paused = false;
            folderPayload.devices = devicesList;

            const putRes = await this.apiRequest(
              info.apiUrl,
              apiKey,
              `/rest/config/folders/${encodeURIComponent(folderId)}`,
              { method: 'PUT', body: folderPayload }
            );
            if (!putRes.ok) {
              const state = await this.emitStateUpdated();
              return { success: false, state, error: putRes.error || 'Failed to configure Syncthing folder' };
            }
          }
        }

        // Import any remote manifests already on disk first, then export enabled local projects without manifests
        mergedProjects = this.importAllSyncedProjects();
        const projects = this.workspaceService.getWorkspaces();
        for (const p of projects) {
          if (!p?.path) continue;
          const membership = this.getProjectSyncMembership(p.path, nextSettings);
          if (membership.enabled && !fs.existsSync(path.join(p.path, SYNCTHING_MANIFEST_REL_PATH))) {
            this.exportProjectManifest(p.path);
          }
        }

        await this.rescanInternal(nextSettings);
      }

      const state = await this.emitStateUpdated(mergedProjects);
      return { success: true, state };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public async toggleProject({
    projectPath,
    enabled,
  }: {
    projectPath: string;
    enabled: boolean;
  }): Promise<{ success: boolean; state?: SyncthingState; error?: string }> {
    const settings = this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    if (!rootPath) {
      return { success: false, error: 'Configure a Projects Parent Folder in Settings → Project Sync first.' };
    }

    const folderName = getProjectFolderInSyncRoot(rootPath, projectPath, { caseInsensitive: isWin });
    if (!folderName) {
      return {
        success: false,
        error: 'Project folder must be a direct child of the configured Sync Root folder.',
      };
    }

    const currentList: string[] = Array.isArray(settings.syncthingEnabledProjects)
      ? settings.syncthingEnabledProjects
      : [];
    const filtered = currentList.filter((name) => (isWin ? name.toLowerCase() !== folderName.toLowerCase() : name !== folderName));
    if (enabled) {
      filtered.push(folderName);
    }

    const nextSettings = this.workspaceService.updateSettings({
      ...settings,
      syncthingEnabledProjects: filtered,
    });

    this.writeIgnoreFiles(nextSettings);

    const mergedProjects: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> = [];
    if (enabled) {
      const manifestPath = path.join(projectPath, SYNCTHING_MANIFEST_REL_PATH);
      if (fs.existsSync(manifestPath)) {
        const importRes = this.importProjectManifest(projectPath);
        if (importRes.merged) {
          mergedProjects.push({
            projectPath,
            name: importRes.project?.name || folderName,
            competitorsChanged: importRes.competitorsChanged,
          });
        }
      } else {
        this.exportProjectManifest(projectPath);
      }
    }

    await this.rescanInternal(nextSettings, folderName);
    const state = await this.emitStateUpdated(mergedProjects);
    return { success: true, state };
  }

  private async rescanInternal(settingsOverride?: any, subFolder?: string): Promise<{ ok: boolean; error?: string }> {
    const settings = settingsOverride || this.getSettings();
    const folderId = (settings.syncthingFolderId || DEFAULT_SYNCTHING_FOLDER_ID).trim() || DEFAULT_SYNCTHING_FOLDER_ID;
    const { info, apiKey } = await this.detectInstallation(settings);
    if (!info.apiUrl || !apiKey) {
      return { ok: false, error: 'Syncthing API unavailable' };
    }

    const subParam = subFolder ? `&sub=${encodeURIComponent(subFolder)}` : '';
    const res = await this.apiRequest(
      info.apiUrl,
      apiKey,
      `/rest/db/scan?folder=${encodeURIComponent(folderId)}${subParam}`,
      { method: 'POST', timeoutMs: 5000 }
    );
    return { ok: res.ok, error: res.error };
  }

  public async rescan({ projectPath }: { projectPath?: string } = {}): Promise<{ success: boolean; state?: SyncthingState; error?: string }> {
    const settings = this.getSettings();
    const rootPath = (settings.syncthingRootPath || '').trim();
    const subFolder = projectPath && rootPath
      ? getProjectFolderInSyncRoot(rootPath, projectPath, { caseInsensitive: isWin }) || undefined
      : undefined;

    const res = await this.rescanInternal(settings, subFolder);
    const mergedProjects = this.importAllSyncedProjects();
    const state = await this.emitStateUpdated(mergedProjects);
    return {
      success: res.ok,
      state,
      ...(res.ok ? {} : { error: res.error || 'Failed to trigger Syncthing scan' }),
    };
  }

  public async startDaemon(): Promise<{ success: boolean; state?: SyncthingState; error?: string }> {
    const settings = this.getSettings();
    const initial = await this.detectInstallation(settings);
    if (initial.info.apiUrl && initial.apiKey) {
      const check = await this.apiRequest(initial.info.apiUrl, initial.apiKey, '/rest/system/status', { timeoutMs: 1500 });
      if (check.ok) {
        const state = await this.emitStateUpdated();
        return { success: true, state };
      }
    }

    const exe = this.resolveBinaryPath(settings.syncthingPath);
    if (!exe) {
      return {
        success: false,
        error: 'Syncthing executable not found. Install Syncthing or set its path in Settings.',
      };
    }

    try {
      const launch = buildLaunch(exe, ['serve', '--no-browser']);
      await new Promise<void>((resolve, reject) => {
        const child = spawn(launch.file, launch.args, {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          windowsVerbatimArguments: launch.windowsVerbatimArguments,
        });
        child.once('error', reject);
        child.once('spawn', () => {
          child.on('error', () => {});
          child.unref();
          resolve();
        });
      });
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }

    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 400));
      const probe = await this.detectInstallation(settings);
      if (probe.info.apiUrl && probe.apiKey) {
        const statusRes = await this.apiRequest(probe.info.apiUrl, probe.apiKey, '/rest/system/status', { timeoutMs: 1200 });
        if (statusRes.ok) {
          this.wakeEventLoop();
          const state = await this.emitStateUpdated();
          return { success: true, state };
        }
      }
    }

    const state = await this.emitStateUpdated();
    return {
      success: state.running,
      state,
      ...(state.running ? {} : { error: 'Syncthing was launched, but its API did not respond within 6s.' }),
    };
  }

  public async openWebUi(): Promise<{ success: boolean; error?: string }> {
    const settings = this.getSettings();
    const { info } = await this.detectInstallation(settings);
    const url = info.apiUrl || 'http://127.0.0.1:8384';
    if (!/^https?:\/\//iu.test(url)) {
      return { success: false, error: `Invalid Syncthing Web UI URL: ${url}` };
    }
    try {
      await this.shell.openExternal(url);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public async resolveConflict({
    projectPath,
    conflictRelativePath,
    resolution,
  }: {
    projectPath: string;
    conflictRelativePath: string;
    resolution: 'keep-mine' | 'use-remote' | 'reveal';
  }): Promise<{ success: boolean; state?: SyncthingState; error?: string }> {
    if (!projectPath || !conflictRelativePath) {
      return { success: false, error: 'Missing project path or conflict file path' };
    }

    const parsed = parseSyncConflictFile(conflictRelativePath);
    if (!parsed) {
      return { success: false, error: 'Invalid Syncthing conflict file path' };
    }

    const resolvedRoot = path.resolve(projectPath);
    const fullPath = path.resolve(resolvedRoot, ...parsed.relativePath.split('/'));
    const originalFullPath = path.resolve(resolvedRoot, ...parsed.originalRelativePath.split('/'));

    const isInside = (target: string) => {
      const rel = path.relative(resolvedRoot, target);
      return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
    };

    if (!isInside(fullPath) || !isInside(originalFullPath)) {
      return { success: false, error: 'Refusing to access path outside project folder' };
    }

    if (!fs.existsSync(fullPath)) {
      const state = await this.emitStateUpdated();
      return { success: false, state, error: 'Conflict file no longer exists on disk' };
    }

    try {
      if (resolution === 'reveal') {
        this.shell.showItemInFolder(fullPath);
        return { success: true };
      }

      if (resolution === 'keep-mine') {
        fs.unlinkSync(fullPath);
        await this.rescanInternal(undefined, getProjectFolderInSyncRoot(this.getSettings().syncthingRootPath || '', projectPath, { caseInsensitive: isWin }) || undefined);
        const state = await this.emitStateUpdated();
        return { success: true, state };
      }

      if (resolution === 'use-remote') {
        fs.mkdirSync(path.dirname(originalFullPath), { recursive: true });
        fs.copyFileSync(fullPath, originalFullPath);
        fs.unlinkSync(fullPath);

        const mergedProjects: Array<{ projectPath: string; name: string; competitorsChanged: boolean }> = [];
        if (parsed.isManifestConflict) {
          const importRes = this.importProjectManifest(projectPath);
          if (importRes.merged) {
            mergedProjects.push({
              projectPath,
              name: importRes.project?.name || path.basename(projectPath),
              competitorsChanged: importRes.competitorsChanged,
            });
          }
        }

        await this.rescanInternal(undefined, getProjectFolderInSyncRoot(this.getSettings().syncthingRootPath || '', projectPath, { caseInsensitive: isWin }) || undefined);
        const state = await this.emitStateUpdated(mergedProjects);
        return { success: true, state };
      }

      return { success: false, error: `Unsupported resolution action: ${resolution}` };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public async importDiscoveredProject({
    projectPath,
  }: {
    projectPath: string;
  }): Promise<{ success: boolean; project?: any; state?: SyncthingState; error?: string }> {
    if (!projectPath || !fs.existsSync(projectPath)) {
      return { success: false, error: 'Project folder does not exist' };
    }

    const settings = this.getSettings();
    const folderName = getProjectFolderInSyncRoot(settings.syncthingRootPath || '', projectPath, { caseInsensitive: isWin });
    if (!folderName) {
      return { success: false, error: 'Folder is not inside the configured Sync Root' };
    }

    const added = this.workspaceService.addProject(projectPath);
    if (added?.error && !this.workspaceService.getWorkspaces().some((p: any) => p.path === projectPath)) {
      return { success: false, error: added.error };
    }

    if (normalizeSyncMode(settings.syncthingSyncMode) === 'selected') {
      const enabledList: string[] = Array.isArray(settings.syncthingEnabledProjects)
        ? settings.syncthingEnabledProjects
        : [];
      const alreadyEnabled = enabledList.some((n) => (isWin ? n.toLowerCase() === folderName.toLowerCase() : n === folderName));
      if (!alreadyEnabled) {
        const nextSettings = this.workspaceService.updateSettings({
          ...settings,
          syncthingEnabledProjects: [...enabledList, folderName],
        });
        this.writeIgnoreFiles(nextSettings);
      }
    }

    const importRes = this.importProjectManifest(projectPath);
    const mergedProjects = importRes.merged
      ? [{
          projectPath,
          name: importRes.project?.name || folderName,
          competitorsChanged: importRes.competitorsChanged,
        }]
      : [];

    await this.rescanInternal(undefined, folderName);
    const state = await this.emitStateUpdated(mergedProjects);
    const project = this.workspaceService.getWorkspaces().find((p: any) => p.path === projectPath) || added;
    return { success: true, project, state };
  }

  public start(): void {
    if (this.runningLoop) return;
    this.runningLoop = true;
    void this.eventPollLoop();
  }

  public stop(): void {
    this.runningLoop = false;
    if (this.loopAbortController) {
      this.loopAbortController.abort();
      this.loopAbortController = null;
    }
    if (this.backoffResolve) {
      this.backoffResolve();
      this.backoffResolve = null;
    }
  }

  private wakeEventLoop(): void {
    if (this.backoffResolve) {
      this.backoffResolve();
      this.backoffResolve = null;
    }
  }

  private sleepAbortable(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.backoffResolve = null;
        resolve();
      }, ms);
      this.backoffResolve = () => {
        clearTimeout(timer);
        this.backoffResolve = null;
        resolve();
      };
    });
  }

  private async eventPollLoop(): Promise<void> {
    while (this.runningLoop) {
      try {
        const settings = this.getSettings();
        const { info, apiKey } = await this.detectInstallation(settings);
        if (!info.apiUrl || !apiKey) {
          await this.sleepAbortable(5000);
          continue;
        }

        if (this.lastEventId === 0) {
          const probe = await this.apiRequest<any[]>(
            info.apiUrl,
            apiKey,
            '/rest/events?since=0&timeout=1',
            { timeoutMs: 3000 }
          );
          if (!probe.ok) {
            await this.sleepAbortable(5000);
            continue;
          }
          if (Array.isArray(probe.data) && probe.data.length > 0) {
            const maxId = probe.data[probe.data.length - 1]?.id;
            if (typeof maxId === 'number') this.lastEventId = maxId;
          }
        }

        const controller = new AbortController();
        this.loopAbortController = controller;
        const eventsRes = await this.apiRequest<any[]>(
          info.apiUrl,
          apiKey,
          `/rest/events?since=${this.lastEventId}&events=StateChanged,FolderCompletion,ItemFinished&timeout=50`,
          { timeoutMs: 55000, signal: controller.signal }
        );
        this.loopAbortController = null;

        if (!this.runningLoop) break;

        if (!eventsRes.ok) {
          await this.sleepAbortable(5000);
          continue;
        }

        const events = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        if (events.length === 0) continue;

        const maxId = events[events.length - 1]?.id;
        if (typeof maxId === 'number') this.lastEventId = maxId;

        const shouldImport = events.some((ev) => {
          if (ev?.type === 'ItemFinished') {
            const item = String(ev?.data?.item || '').replace(/\\/g, '/');
            return item.endsWith(SYNCTHING_MANIFEST_REL_PATH) || item.includes('.sync-conflict-');
          }
          if (ev?.type === 'StateChanged') {
            return ev?.data?.to === 'idle' || ev?.data?.to === 'syncing';
          }
          return ev?.type === 'FolderCompletion';
        });

        const mergedProjects = shouldImport ? this.importAllSyncedProjects() : [];
        await this.emitStateUpdated(mergedProjects);
      } catch {
        this.loopAbortController = null;
        if (this.runningLoop) {
          await this.sleepAbortable(5000);
        }
      }
    }
  }
}
