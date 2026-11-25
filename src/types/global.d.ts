declare global {
  interface MobilerunSetupStatus {
    python: { path: string; version: string } | null;
    mcpPython: string | null;
    mcpOutdated: boolean;
    bundledWheelId: string | null;
    cliPath: string | null;
    installing: boolean;
    installRoot: string;
  }

  interface SyncthingDevice {
    deviceID: string;
    name: string;
    connected: boolean;
    paused: boolean;
    selected: boolean;
    address: string;
  }

  interface SyncthingConflict {
    projectPath: string;
    projectName: string;
    relativePath: string;
    originalRelativePath: string;
    fullPath: string;
    timestamp: string;
    devicePrefix: string;
    isManifestConflict: boolean;
  }

  type ProjectSyncBadgeState =
    | 'synced'
    | 'syncing'
    | 'paused'
    | 'conflict'
    | 'outside-root'
    | 'offline'
    | 'unconfigured';

  interface SyncthingProjectStatus {
    projectPath: string;
    projectName: string;
    folderName: string | null;
    inSyncRoot: boolean;
    enabled: boolean;
    state: ProjectSyncBadgeState;
    completion: number;
    conflicts: SyncthingConflict[];
    manifestConflicts: SyncthingConflict[];
  }

  interface SyncthingDiscoveredProject {
    path: string;
    folderName: string;
    name: string;
    hasManifest: boolean;
    hasDocs: boolean;
    competitorCount: number;
  }

  interface SyncthingState {
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
    devices: SyncthingDevice[];
    projects: Record<string, SyncthingProjectStatus>;
    discoveredProjects: SyncthingDiscoveredProject[];
    totalConflicts: number;
    lastError: string | null;
  }

  interface SyncthingMergedProjectEvent {
    projectPath: string;
    name: string;
    competitorsChanged: boolean;
  }

  interface SyncthingUpdatedEvent {
    state: SyncthingState;
    mergedProjects?: SyncthingMergedProjectEvent[];
  }

  interface AppReleaseAsset {
    id: number;
    name: string;
    size: number;
    sizeApproximate?: boolean;
    downloadUrl: string;
    contentType: string;
  }

  interface AppReleaseInfo {
    tagName: string;
    version: string;
    name: string;
    body: string;
    htmlUrl: string;
    publishedAt: string;
    assets: AppReleaseAsset[];
    recommendedAsset: AppReleaseAsset | null;
    updateAvailable: boolean;
  }

  interface AppUpdateProgress {
    downloadedBytes: number;
    totalBytes: number;
    percent: number;
    bytesPerSecond: number;
  }

  type AppUpdateStatus =
    | 'idle'
    | 'checking'
    | 'up-to-date'
    | 'available'
    | 'downloading'
    | 'downloaded'
    | 'error';

  interface AppUpdateState {
    status: AppUpdateStatus;
    currentVersion: string;
    repoOwner: string;
    repoRepo: string;
    lastCheckedAt: string | null;
    release: AppReleaseInfo | null;
    selectedAssetName: string | null;
    downloadProgress: AppUpdateProgress | null;
    downloadedFilePath: string | null;
    error: string | null;
  }

  interface Window {
    api: {
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      getWorkspaces: () => Promise<any[]>;
      addProject: () => Promise<any>;
      removeProject: (path: string) => Promise<any>;
      openInExplorer: (path: string) => Promise<any>;
      openExternal: (url: string) => Promise<any>;
      openInAndroidStudio: (path: string) => Promise<any>;
      openInVsCode: (path: string) => Promise<any>;
      openInEditor: (path: string) => Promise<any>;
      openInAntigravity: (path: string) => Promise<any>;
      openInAntigravityAgent: (path: string) => Promise<any>;
      openInClaudeDesktop: (path: string) => Promise<{ success: boolean; method?: string; path?: string; error?: string }>;
      openInFigma: (pathOrUrl?: string) => Promise<any>;
      openInObsidian: (pathOrVault?: string) => Promise<any>;
      scrcpyMirror: (serial?: string) => Promise<any>;
      scrcpyCaptureUi: (opts: { projectPath: string; prefix?: string; serial?: string; mode?: 'screenshot' | 'dump' | 'both' }) => Promise<{
        success: boolean;
        mode?: 'screenshot' | 'dump' | 'both';
        screenshotPath?: string;
        dumpPath?: string;
        relativeScreenshot?: string;
        relativeDump?: string;
        error?: string;
      }>;
      scrcpyDeviceList: () => Promise<{ success: boolean; devices: string[]; raw?: string; error?: string }>;
      getSettings: () => Promise<{
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        claudeDesktopPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        syncthingPath?: string;
        syncthingApiUrl?: string;
        syncthingRootPath?: string;
        syncthingFolderId?: string;
        syncthingSyncMode?: 'selected' | 'all';
        syncthingDeviceIds?: string[];
        syncthingEnabledProjects?: string[];
        autoCheckUpdates?: boolean;
      }>;
      updateSettings: (settings: {
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        claudeDesktopPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        syncthingPath?: string;
        syncthingApiUrl?: string;
        syncthingRootPath?: string;
        syncthingFolderId?: string;
        syncthingSyncMode?: 'selected' | 'all';
        syncthingDeviceIds?: string[];
        syncthingEnabledProjects?: string[];
        autoCheckUpdates?: boolean;
      }) => Promise<{
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        claudeDesktopPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        syncthingPath?: string;
        syncthingApiUrl?: string;
        syncthingRootPath?: string;
        syncthingFolderId?: string;
        syncthingSyncMode?: 'selected' | 'all';
        syncthingDeviceIds?: string[];
        syncthingEnabledProjects?: string[];
        autoCheckUpdates?: boolean;
      }>;
      selectExecutable: () => Promise<string | null>;
      detectIntegrationPaths: () => Promise<{
        vscodePath?: string | null;
        antigravityPath: string | null;
        antigravityAgentPath: string | null;
        claudeDesktopPath?: string | null;
        androidStudioPath: string | null;
        scrcpyPath?: string | null;
        figmaPath?: string | null;
        obsidianPath?: string | null;
        obsidianVault?: string | null;
        reakitPath?: string | null;
        syncthingPath?: string | null;
      }>;
      selectDirectory: (title: string) => Promise<string | null>;
      checkSymlinkStatus: (opts: { projectPath: string; name: string; targetPath: string }) => Promise<any>;
      createSymlink: (opts: { projectPath: string; name: string; targetPath: string }) => Promise<any>;
      deleteSymlink: (opts: { projectPath: string; name: string }) => Promise<any>;
      scanSymlinks: (opts: { projectPath: string }) => Promise<any[]>;
      createDirectory: (path: string) => Promise<any>;
      pathExists: (path: string) => Promise<boolean>;
      checkToolkitStatus: (opts: { projectPath: string; name: string; sourcePath?: string }) => Promise<{ exists: boolean }>;
      deployToolkit: (opts: { projectPath: string; name: string; sourcePath: string; preserveExisting?: boolean }) => Promise<{ success: boolean; error?: string }>;
      removeToolkit: (opts: { projectPath: string; name: string; sourcePath?: string }) => Promise<{ success: boolean; error?: string }>;
      getDefaultToolkitSources: () => Promise<{ bakitPath: string }>;

      // ── BAKit: mobilerun MCP as a workspace plugin (.agents/plugins/mobilerun) ──
      getMobilerunMcpStatus: (opts: { projectPath: string }) => Promise<{ registered: boolean; configPath: string; pythonPath: string | null; globalRegistered: boolean; globalConfigPath: string; error?: string }>;
      registerMobilerunMcp: (opts: { projectPath: string }) => Promise<{ success: boolean; configPath?: string; globalRegistered?: boolean; error?: string }>;
      unregisterMobilerunMcp: (opts: { projectPath: string }) => Promise<{ success: boolean; configPath?: string; error?: string }>;
      unregisterGlobalMobilerunMcp: () => Promise<{ success: boolean; configPath?: string; error?: string }>;

      // ── BAKit: Python + mobilerun install (app-managed venvs under %LOCALAPPDATA%/BA Space/mobilerun) ──
      getMobilerunSetupStatus: () => Promise<MobilerunSetupStatus>;
      installMobilerun: () => Promise<{ success: boolean; status?: MobilerunSetupStatus; error?: string }>;
      onMobilerunSetupLog: (callback: (line: string) => void) => () => void;

      // ── BAKit: figma-mcp-android as a workspace plugin (.agents/plugins/figma) ──
      getFigmaMcpStatus: (opts: { projectPath: string }) => Promise<{ registered: boolean; configPath: string; globalRegistered: boolean; globalConfigPath: string | null; error?: string }>;
      registerFigmaMcp: (opts: { projectPath: string }) => Promise<{ success: boolean; skipped?: boolean; configPath?: string; globalConfigPath?: string | null; error?: string }>;
      unregisterFigmaMcp: (opts: { projectPath: string }) => Promise<{ success: boolean; configPath?: string; globalConfigPath?: string | null; error?: string }>;

      // ── BAKit: delegation block in the project's AGENTS.md ──
      getAgentsMdBlockStatus: (opts: { projectPath: string; sourcePath: string }) => Promise<{ installed: boolean; current: boolean; sourceExists: boolean; agentsMdPath: string }>;
      applyAgentsMdBlock: (opts: { projectPath: string; sourcePath: string }) => Promise<{ success: boolean; created?: boolean; agentsMdPath?: string; error?: string }>;
      removeAgentsMdBlock: (opts: { projectPath: string }) => Promise<{ success: boolean; deleted?: boolean; agentsMdPath?: string; error?: string }>;

      // ── Project Metadata, Assets & ADB ──
      updateProjectMetadata: (projectPath: string, metadata: {
        name?: string;
        figmaUrl?: string;
        firebaseUrl?: string;
        planeUrl?: string;
        legacyPrdUrl?: string;
        legacyChecklistUrl?: string;
        checklistScope?: string;
        apkFiles?: any[];
        competitors?: any[];
      }) => Promise<{ success: boolean; project?: any; error?: string }>;
      addProjectApk: (projectPath: string, apk: { name?: string; path: string; size?: number }) => Promise<{ success: boolean; project?: any; apk?: any; error?: string }>;
      removeProjectApk: (projectPath: string, apkId: string) => Promise<{ success: boolean; project?: any; error?: string }>;
      addProjectCompetitor: (projectPath: string, competitor: {
        id?: string;
        name: string;
        url?: string;
        packageName?: string;
        iconUrl?: string;
        platform?: 'Android';
        apkPath?: string;
        apkName?: string;
        apkSize?: number;
        jadxSourcePath?: string;
        jadxStatus?: string;
        notes?: string;
      }) => Promise<{ success: boolean; project?: any; competitor?: any; error?: string }>;
      updateProjectCompetitor: (projectPath: string, competitor: {
        id: string;
        name?: string;
        url?: string;
        packageName?: string;
        iconUrl?: string;
        platform?: 'Android';
        apkPath?: string;
        apkName?: string;
        apkSize?: number;
        jadxSourcePath?: string;
        jadxStatus?: string;
        notes?: string;
      }) => Promise<{ success: boolean; project?: any; competitor?: any; error?: string }>;
      removeProjectCompetitor: (projectPath: string, competitorId: string) => Promise<{ success: boolean; project?: any; error?: string }>;
      linkCompetitorApk: (projectPath: string, competitorId: string, apk: { name?: string; path: string; size?: number }) => Promise<{ success: boolean; project?: any; competitor?: any; error?: string }>;
      unlinkCompetitorApk: (projectPath: string, competitorId: string) => Promise<{ success: boolean; project?: any; competitor?: any; error?: string }>;
      detectCompetitorApp: (url: string) => Promise<{
        success: boolean;
        appName?: string;
        packageName?: string;
        iconUrl?: string;
        url?: string;
        inferred?: boolean;
        error?: string;
      }>;
      fetchCompetitorIcon: (opts: {
        projectPath?: string;
        competitorId?: string;
        url?: string;
        packageName?: string;
      }) => Promise<{ success: boolean; iconUrl?: string; error?: string }>;
      syncBaProjectConfig: (opts: { projectPath: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
      selectApkFile: () => Promise<{ name: string; path: string; size: number } | null>;
      getFileInfo: (filePath: string) => Promise<{ name: string; path: string; size: number; isFile: boolean } | null>;
      installApk: (opts: { apkPath: string; serial?: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
      launchApp: (opts: { serial?: string; packageName?: string; apkPath?: string }) => Promise<{ success: boolean; packageName?: string; output?: string; error?: string }>;

      // ── ReaKit / JADX Competitor Flow ──
      downloadCompetitorApk: (opts: {
        projectPath: string;
        competitorId: string;
        packageName: string;
      }) => Promise<{ success: boolean; apkPath?: string; apkName?: string; apkSize?: number; error?: string }>;
      decompileCompetitorJadx: (opts: {
        projectPath: string;
        competitorId: string;
        packageName?: string;
        apkPath?: string;
      }) => Promise<{ success: boolean; jadxSourcePath?: string; error?: string }>;
      openJadxSource: (opts: {
        jadxSourcePath?: string;
        projectPath?: string;
        packageName?: string;
      }) => Promise<{ success: boolean; path?: string; error?: string }>;
      getCompetitorReakitStatus: (opts: {
        projectPath?: string;
        competitorId?: string;
        packageName?: string;
        apkPath?: string;
        jadxSourcePath?: string;
      }) => Promise<{
        hasApk: boolean;
        apkPath?: string;
        apkName?: string;
        apkSize?: number;
        hasJadx: boolean;
        jadxSourcePath?: string;
        jadxFileCount?: number;
      }>;
      onCompetitorDecodeProgress: (callback: (data: { competitorId: string; stage: string; percent: number; detail: string; elapsedSec: number }) => void) => () => void;

      // ── Device Manager ──
      deviceList: () => Promise<{
        success: boolean;
        devices: Array<{
          serial: string;
          state: 'device' | 'unauthorized' | 'offline' | 'bootloader' | 'authorizing' | 'unknown';
          model: string;
          manufacturer: string;
          product: string;
          marketName: string;
          androidVersion: string;
          sdkVersion: string;
          screenResolution: string;
          screenDensity: string;
          batteryLevel: number | null;
          batteryStatus: string;
          isCharging: boolean;
          ipAddress: string | null;
          connectionType: 'usb' | 'wifi' | 'emulator';
          transportId?: string;
          mobilerunPortalInstalled: boolean;
          isActive: boolean;
        }>;
        error?: string;
      }>;
      deviceGetActive: () => Promise<string | null>;
      deviceSetActive: (serial: string | null) => Promise<{ success: boolean; activeSerial: string | null }>;
      deviceConnectWireless: (opts: { ip: string; port?: number }) => Promise<{ success: boolean; output: string; error?: string }>;
      deviceDisconnectWireless: (opts: { serial: string }) => Promise<{ success: boolean; output: string; error?: string }>;
      deviceEnableTcpip: (opts: { serial: string; port?: number }) => Promise<{ success: boolean; output: string; error?: string }>;
      deviceReboot: (opts: { serial: string; mode?: string }) => Promise<{ success: boolean; error?: string }>;
      deviceRestartServer: () => Promise<{ success: boolean; output: string; error?: string }>;
      deviceMirror: (options?: {
        serial?: string;
        stayAwake?: boolean;
        turnScreenOff?: boolean;
        alwaysOnTop?: boolean;
        maxSize?: number;
        maxFps?: number;
      }) => Promise<{ success: boolean; error?: string }>;
      deviceCaptureUi: (options: {
        serial?: string;
        projectPath: string;
        prefix?: string;
        mode?: 'screenshot' | 'dump' | 'both';
      }) => Promise<{
        success: boolean;
        mode?: 'screenshot' | 'dump' | 'both';
        screenshotPath?: string;
        dumpPath?: string;
        relativeScreenshot?: string;
        relativeDump?: string;
        error?: string;
      }>;
      deviceInstallApk: (opts: { serial?: string; apkPath: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
      deviceLaunchApp: (opts: { serial?: string; packageName?: string; apkPath?: string }) => Promise<{ success: boolean; packageName?: string; output?: string; error?: string }>;
      deviceSendKey: (opts: { serial: string; keycode: string | number }) => Promise<{ success: boolean; error?: string }>;
      deviceSetupMobilerun: (opts: { serial: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
      deviceStreamStart: (opts?: { serial?: string; maxSize?: number; maxFps?: number; quality?: number }) => Promise<{
        success: boolean;
        streamUrl?: string;
        width?: number;
        height?: number;
        deviceName?: string;
        error?: string;
      }>;
      deviceStreamStop: (opts?: { serial?: string }) => Promise<{ success: boolean; error?: string }>;
      deviceStreamStatus: (opts?: { serial?: string }) => Promise<{
        isStreaming: boolean;
        serial: string;
        streamUrl: string;
        width: number;
        height: number;
        deviceName: string;
      } | null>;
      deviceStreamTouch: (opts: {
        serial?: string;
        type: 'down' | 'move' | 'up' | 'tap' | 'swipe';
        x: number;
        y: number;
        endX?: number;
        endY?: number;
        durationMs?: number;
      }) => Promise<{ success: boolean; error?: string }>;
      deviceStreamKey: (opts: { serial?: string; keycode: number }) => Promise<{ success: boolean; error?: string }>;
      deviceStreamText: (opts: { serial?: string; text: string }) => Promise<{ success: boolean; error?: string }>;
      deviceStreamScroll: (opts: {
        serial?: string;
        x: number;
        y: number;
        hScroll: number;
        vScroll: number;
      }) => Promise<{ success: boolean; error?: string }>;
      deviceStreamAction: (opts: {
        serial?: string;
        action: 'notification' | 'settings' | 'collapse' | 'rotate' | 'wake' | 'power';
      }) => Promise<{ success: boolean; error?: string }>;

      // ── Syncthing Project Sync ──
      syncthingGetState: () => Promise<SyncthingState>;
      syncthingConfigureRoot: (opts: {
        rootPath?: string;
        folderId?: string;
        syncMode?: 'selected' | 'all';
        deviceIds?: string[];
        syncthingPath?: string;
        syncthingApiUrl?: string;
      }) => Promise<{ success: boolean; state?: SyncthingState; error?: string }>;
      syncthingToggleProject: (opts: { projectPath: string; enabled: boolean }) => Promise<{ success: boolean; state?: SyncthingState; error?: string }>;
      syncthingRescan: (opts?: { projectPath?: string }) => Promise<{ success: boolean; state?: SyncthingState; error?: string }>;
      syncthingStartDaemon: () => Promise<{ success: boolean; state?: SyncthingState; error?: string }>;
      syncthingOpenWebUi: () => Promise<{ success: boolean; error?: string }>;
      syncthingResolveConflict: (opts: {
        projectPath: string;
        conflictRelativePath: string;
        resolution: 'keep-mine' | 'use-remote' | 'reveal';
      }) => Promise<{ success: boolean; state?: SyncthingState; error?: string }>;
      syncthingImportDiscoveredProject: (opts: { projectPath: string }) => Promise<{ success: boolean; project?: any; state?: SyncthingState; error?: string }>;
      onSyncthingUpdated: (callback: (payload: SyncthingUpdatedEvent) => void) => () => void;

      // ── App Updates ──
      getUpdateState: () => Promise<AppUpdateState>;
      checkForUpdates: () => Promise<AppUpdateState>;
      downloadUpdate: (opts?: { assetName?: string }) => Promise<{ success: boolean; state: AppUpdateState; filePath?: string; error?: string }>;
      cancelUpdateDownload: () => Promise<{ success: boolean; state: AppUpdateState }>;
      installUpdate: () => Promise<{ success: boolean; action?: 'launched-and-quitting' | 'opened' | 'revealed'; error?: string }>;
      revealUpdateFile: () => Promise<{ success: boolean; error?: string }>;
      openReleasePage: () => Promise<{ success: boolean; error?: string }>;
      onUpdateStateChanged: (callback: (state: AppUpdateState) => void) => () => void;
    };
  }
}


export {};
