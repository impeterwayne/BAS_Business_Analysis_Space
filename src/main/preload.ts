const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 'win32' | 'darwin' | 'linux': the renderer adapts window chrome and labels to it.
  platform: process.platform,

  // ── Window controls ──
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // ── Workspace management ──
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  selectExecutable: () => ipcRenderer.invoke('select-executable'),
  detectIntegrationPaths: () => ipcRenderer.invoke('detect-integration-paths'),
  addProject: () => ipcRenderer.invoke('add-project'),
  removeProject: (path) => ipcRenderer.invoke('remove-project', path),

  // ── Launch actions ──
  openInExplorer: (path) => ipcRenderer.invoke('open-in-explorer', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openInAndroidStudio: (path) => ipcRenderer.invoke('open-in-android-studio', path),
  openInVsCode: (path) => ipcRenderer.invoke('open-in-vscode', path),
  openInEditor: (path) => ipcRenderer.invoke('open-in-vscode', path),
  openInAntigravity: (path) => ipcRenderer.invoke('open-in-antigravity', path),
  openInAntigravityAgent: (path) => ipcRenderer.invoke('open-in-antigravity-agent', path),
  openInClaudeDesktop: (path) => ipcRenderer.invoke('open-in-claude-desktop', path),
  openInFigma: (pathOrUrl) => ipcRenderer.invoke('open-in-figma', pathOrUrl),
  openInObsidian: (pathOrVault) => ipcRenderer.invoke('open-in-obsidian', pathOrVault),
  scrcpyMirror: (serial) => ipcRenderer.invoke('scrcpy:mirror', serial),
  scrcpyCaptureUi: (opts) => ipcRenderer.invoke('scrcpy:capture-ui', opts),
  scrcpyDeviceList: () => ipcRenderer.invoke('scrcpy:device-list'),

  // ── Symlink operations ──
  selectDirectory: (title) => ipcRenderer.invoke('select-directory', title),
  checkSymlinkStatus: (opts) => ipcRenderer.invoke('symlink:check-status', opts),
  createSymlink: (opts) => ipcRenderer.invoke('symlink:create', opts),
  deleteSymlink: (opts) => ipcRenderer.invoke('symlink:delete', opts),
  scanSymlinks: (opts) => ipcRenderer.invoke('symlink:scan', opts),

  // ── Directory & Toolkit operations ──
  createDirectory: (path) => ipcRenderer.invoke('dir:create', { dirPath: path }),
  pathExists: (path) => ipcRenderer.invoke('path:exists', path),
  checkToolkitStatus: (opts) => ipcRenderer.invoke('toolkit:check-status', opts),
  deployToolkit: (opts) => ipcRenderer.invoke('toolkit:deploy', opts),
  removeToolkit: (opts) => ipcRenderer.invoke('toolkit:remove', opts),
  getDefaultToolkitSources: () => ipcRenderer.invoke('toolkit:get-default-sources'),

  // ── BAKit: mobilerun MCP (workspace plugin .agents/plugins/mobilerun) ──
  getMobilerunMcpStatus: (opts) => ipcRenderer.invoke('bakit:mcp-status', opts),
  registerMobilerunMcp: (opts) => ipcRenderer.invoke('bakit:mcp-register', opts),
  unregisterMobilerunMcp: (opts) => ipcRenderer.invoke('bakit:mcp-unregister', opts),
  unregisterGlobalMobilerunMcp: () => ipcRenderer.invoke('bakit:mcp-unregister-global'),
  // ── BAKit: Python + mobilerun install (app-managed venvs) ──
  getMobilerunSetupStatus: () => ipcRenderer.invoke('mobilerun-setup:status'),
  installMobilerun: () => ipcRenderer.invoke('mobilerun-setup:install'),
  onMobilerunSetupLog: (callback) => {
    const listener = (_, line) => callback(line);
    ipcRenderer.on('mobilerun-setup:log', listener);
    return () => ipcRenderer.removeListener('mobilerun-setup:log', listener);
  },
  // ── BAKit: figma-mcp-android (workspace plugin .agents/plugins/figma) ──
  getFigmaMcpStatus: (opts) => ipcRenderer.invoke('bakit:figma-mcp-status', opts),
  registerFigmaMcp: (opts) => ipcRenderer.invoke('bakit:figma-mcp-register', opts),
  unregisterFigmaMcp: (opts) => ipcRenderer.invoke('bakit:figma-mcp-unregister', opts),
  // ── BAKit: delegation block in the project's AGENTS.md ──
  getAgentsMdBlockStatus: (opts) => ipcRenderer.invoke('bakit:agents-md-status', opts),
  applyAgentsMdBlock: (opts) => ipcRenderer.invoke('bakit:agents-md-apply', opts),
  removeAgentsMdBlock: (opts) => ipcRenderer.invoke('bakit:agents-md-remove', opts),

  // ── Project Metadata, Assets & ADB ──
  updateProjectMetadata: (projectPath: string, metadata: any) => ipcRenderer.invoke('project:update-metadata', { projectPath, metadata }),
  addProjectApk: (projectPath: string, apk: any) => ipcRenderer.invoke('project:add-apk', { projectPath, apk }),
  removeProjectApk: (projectPath: string, apkId: string) => ipcRenderer.invoke('project:remove-apk', { projectPath, apkId }),
  addProjectCompetitor: (projectPath: string, competitor: any) => ipcRenderer.invoke('project:add-competitor', { projectPath, competitor }),
  updateProjectCompetitor: (projectPath: string, competitor: any) => ipcRenderer.invoke('project:update-competitor', { projectPath, competitor }),
  removeProjectCompetitor: (projectPath: string, competitorId: string) => ipcRenderer.invoke('project:remove-competitor', { projectPath, competitorId }),
  linkCompetitorApk: (projectPath: string, competitorId: string, apk: any) =>
    ipcRenderer.invoke('project:link-competitor-apk', { projectPath, competitorId, apk }),
  unlinkCompetitorApk: (projectPath: string, competitorId: string) =>
    ipcRenderer.invoke('project:unlink-competitor-apk', { projectPath, competitorId }),
  detectCompetitorApp: (url: string) => ipcRenderer.invoke('competitor:detect-app', { url }),
  fetchCompetitorIcon: (opts: { projectPath?: string; competitorId?: string; url?: string; packageName?: string }) =>
    ipcRenderer.invoke('competitor:fetch-icon', opts),
  syncBaProjectConfig: (opts: { projectPath: string }) => ipcRenderer.invoke('project:sync-ba-config', opts),
  selectApkFile: () => ipcRenderer.invoke('select-apk-file'),
  getFileInfo: (filePath: string) => ipcRenderer.invoke('get-file-info', filePath),
  installApk: (opts: { apkPath: string; serial?: string }) => ipcRenderer.invoke('adb:install-apk', opts),
  launchApp: (opts: { serial?: string; packageName?: string; apkPath?: string }) => ipcRenderer.invoke('adb:launch-app', opts),

  // ── ReaKit / JADX Competitor Flow ──
  downloadCompetitorApk: (opts: { projectPath: string; competitorId: string; packageName: string }) =>
    ipcRenderer.invoke('competitor:download-apk', opts),
  decompileCompetitorJadx: (opts: { projectPath: string; competitorId: string; packageName?: string; apkPath?: string }) =>
    ipcRenderer.invoke('competitor:decompile-jadx', opts),
  openJadxSource: (opts: { jadxSourcePath?: string; projectPath?: string; packageName?: string }) =>
    ipcRenderer.invoke('competitor:open-jadx-source', opts),
  getCompetitorReakitStatus: (opts: { projectPath?: string; competitorId?: string; packageName?: string; apkPath?: string; jadxSourcePath?: string }) =>
    ipcRenderer.invoke('competitor:get-reakit-status', opts),
  onCompetitorDecodeProgress: (callback: (data: { competitorId: string; stage: string; percent: number; detail: string; elapsedSec: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('competitor:decode-progress', handler);
    return () => {
      ipcRenderer.removeListener('competitor:decode-progress', handler);
    };
  },

  // ── Device Manager ──
  deviceList: () => ipcRenderer.invoke('device:list'),
  deviceGetActive: () => ipcRenderer.invoke('device:get-active'),
  deviceSetActive: (serial) => ipcRenderer.invoke('device:set-active', serial),
  deviceConnectWireless: (opts) => ipcRenderer.invoke('device:connect-wireless', opts),
  deviceDisconnectWireless: (opts) => ipcRenderer.invoke('device:disconnect-wireless', opts),
  deviceEnableTcpip: (opts) => ipcRenderer.invoke('device:enable-tcpip', opts),
  deviceReboot: (opts) => ipcRenderer.invoke('device:reboot', opts),
  deviceRestartServer: () => ipcRenderer.invoke('device:restart-server'),
  deviceMirror: (options) => ipcRenderer.invoke('device:mirror', options),
  deviceCaptureUi: (options) => ipcRenderer.invoke('device:capture-ui', options),
  deviceInstallApk: (opts) => ipcRenderer.invoke('device:install-apk', opts),
  deviceLaunchApp: (opts: { serial?: string; packageName?: string; apkPath?: string }) => ipcRenderer.invoke('device:launch-app', opts),
  deviceSendKey: (opts) => ipcRenderer.invoke('device:send-key', opts),
  deviceSetupMobilerun: (opts) => ipcRenderer.invoke('device:setup-mobilerun', opts),
  deviceStreamStart: (opts) => ipcRenderer.invoke('device:stream-start', opts),
  deviceStreamStop: (opts) => ipcRenderer.invoke('device:stream-stop', opts),
  deviceStreamStatus: (opts) => ipcRenderer.invoke('device:stream-status', opts),
  deviceStreamTouch: (opts) => ipcRenderer.invoke('device:stream-touch', opts),
  deviceStreamKey: (opts) => ipcRenderer.invoke('device:stream-key', opts),
  deviceStreamText: (opts) => ipcRenderer.invoke('device:stream-text', opts),
  deviceStreamScroll: (opts) => ipcRenderer.invoke('device:stream-scroll', opts),
  deviceStreamAction: (opts) => ipcRenderer.invoke('device:stream-action', opts),

  // ── Syncthing Project Sync ──
  syncthingGetState: () => ipcRenderer.invoke('syncthing:get-state'),
  syncthingConfigureRoot: (opts) => ipcRenderer.invoke('syncthing:configure-root', opts),
  syncthingToggleProject: (opts) => ipcRenderer.invoke('syncthing:toggle-project', opts),
  syncthingRescan: (opts) => ipcRenderer.invoke('syncthing:rescan', opts),
  syncthingStartDaemon: () => ipcRenderer.invoke('syncthing:start-daemon'),
  syncthingOpenWebUi: () => ipcRenderer.invoke('syncthing:open-web-ui'),
  syncthingResolveConflict: (opts) => ipcRenderer.invoke('syncthing:resolve-conflict', opts),
  syncthingImportDiscoveredProject: (opts) => ipcRenderer.invoke('syncthing:import-discovered-project', opts),
  onSyncthingUpdated: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('syncthing:updated', handler);
    return () => {
      ipcRenderer.removeListener('syncthing:updated', handler);
    };
  },

  // ── App Updates ──
  getUpdateState: () => ipcRenderer.invoke('update:get-state'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: (opts) => ipcRenderer.invoke('update:download', opts),
  cancelUpdateDownload: () => ipcRenderer.invoke('update:cancel-download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  revealUpdateFile: () => ipcRenderer.invoke('update:reveal-file'),
  openReleasePage: () => ipcRenderer.invoke('update:open-release-page'),
  onUpdateStateChanged: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('update:state-changed', handler);
    return () => {
      ipcRenderer.removeListener('update:state-changed', handler);
    };
  },
});

