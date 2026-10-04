type OpenWindowsTerminalOptions = {
  cwd: string;
  sessionName?: string;
  launchCommand?: string;
  launchArgs?: string[];
};

type WorktreeRemovalOptions = {
  projectPath: string;
  wtPath: string;
  deleteBranch?: boolean;
};

type WorktreeRemovalResult = {
  success: boolean;
  output?: string;
  error?: string;
  branchDeleted?: boolean;
  removedWorktree?: boolean;
};

declare global {
  interface Window {
    api: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      getWorkspaces: () => Promise<any[]>;
      addProject: () => Promise<any>;
      removeProject: (path: string) => Promise<any>;
      refreshWorktrees: (path: string) => Promise<any>;
      getGitInfo: (path: string) => Promise<any>;
      getRecentCommits: (path: string) => Promise<any>;
      openWindowsTerminal: (opts: OpenWindowsTerminalOptions) => Promise<any>;
      openInExplorer: (path: string) => Promise<any>;
      openExternal: (url: string) => Promise<any>;
      openInAndroidStudio: (path: string) => Promise<any>;
      openInAntigravity: (path: string) => Promise<any>;
      openInAntigravityAgent: (path: string) => Promise<any>;
      openInFigma: (pathOrUrl?: string) => Promise<any>;
      openInObsidian: (pathOrVault?: string) => Promise<any>;
      scrcpyMirror: (serial?: string) => Promise<any>;
      scrcpyCaptureUi: (opts: { worktreePath: string; prefix?: string }) => Promise<{
        success: boolean;
        screenshotPath?: string;
        dumpPath?: string;
        relativeScreenshot?: string;
        relativeDump?: string;
        error?: string;
      }>;
      scrcpyDeviceList: () => Promise<{ success: boolean; devices: string[]; raw?: string; error?: string }>;
      ptyCreate: (opts: any) => Promise<any>;
      ptyCreateTool: (opts: any) => Promise<any>;
      resolveToolLaunch: (opts: { command: string; args?: string[] }) => Promise<any>;
      ptyWrite: (id: string, data: string) => void;
      ptyResize: (id: string, cols: number, rows: number) => void;
      ptyKill: (id: string) => Promise<any>;
      onPtyData: (callback: (payload: { id: string; data: string }) => void) => () => void;
      onPtyExit: (callback: (payload: { id: string; exitCode: number }) => void) => () => void;
      getSettings: () => Promise<{
        subworktreeBranchParents?: Record<string, string>;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
      }>;
      updateSettings: (settings: {
        subworktreeBranchParents?: Record<string, string>;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
      }) => Promise<{
        subworktreeBranchParents?: Record<string, string>;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        obsidianPath?: string;
        obsidianVault?: string;
        scrcpyPath?: string;
        reakitPath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
      }>;
      selectExecutable: () => Promise<string | null>;
      detectIntegrationPaths: () => Promise<{
        antigravityPath: string | null;
        antigravityAgentPath: string | null;
        androidStudioPath: string | null;
        scrcpyPath?: string | null;
        figmaPath?: string | null;
        obsidianPath?: string | null;
        obsidianVault?: string | null;
        reakitPath?: string | null;
      }>;
      gitPull: (path: string) => Promise<any>;
      gitFetch: (path: string) => Promise<any>;
      addWorktree: (opts: any) => Promise<any>;
      removeWorktree: (opts: WorktreeRemovalOptions) => Promise<WorktreeRemovalResult>;
      forceRemoveWorktree: (opts: WorktreeRemovalOptions) => Promise<WorktreeRemovalResult>;
      getBranches: (path: string) => Promise<string[]>;
      createBranch: (opts: any) => Promise<any>;
      mergeWorktreeToBranch: (opts: any) => Promise<any>;
      selectDirectory: (title: string) => Promise<string | null>;
      checkSymlinkStatus: (opts: { worktreePath: string; name: string; targetPath: string }) => Promise<any>;
      createSymlink: (opts: { worktreePath: string; name: string; targetPath: string }) => Promise<any>;
      deleteSymlink: (opts: { worktreePath: string; name: string }) => Promise<any>;
      scanSymlinks: (opts: { worktreePath: string }) => Promise<any[]>;
      updateGitExclude: (opts: { worktreePath: string; patterns: string[]; action: 'add' | 'remove' }) => Promise<any>;
      createDirectory: (path: string) => Promise<any>;
      pathExists: (path: string) => Promise<boolean>;
      checkToolkitStatus: (opts: { worktreePath: string; name: string; sourcePath?: string }) => Promise<{ exists: boolean }>;
      deployToolkit: (opts: { worktreePath: string; name: string; sourcePath: string; preserveExisting?: boolean }) => Promise<{ success: boolean; error?: string }>;
      removeToolkit: (opts: { worktreePath: string; name: string; sourcePath?: string }) => Promise<{ success: boolean; error?: string }>;
      getDefaultToolkitSources: () => Promise<{ bakitPath: string }>;

      // ── BAKit: mobilerun MCP as a workspace plugin (.agents/plugins/mobilerun) ──
      getMobilerunMcpStatus: (opts: { worktreePath: string }) => Promise<{ registered: boolean; configPath: string; pythonPath: string | null; globalRegistered: boolean; globalConfigPath: string; error?: string }>;
      registerMobilerunMcp: (opts: { worktreePath: string }) => Promise<{ success: boolean; configPath?: string; globalRegistered?: boolean; error?: string }>;
      unregisterMobilerunMcp: (opts: { worktreePath: string }) => Promise<{ success: boolean; configPath?: string; error?: string }>;
      unregisterGlobalMobilerunMcp: () => Promise<{ success: boolean; configPath?: string; error?: string }>;

      // ── BAKit: delegation block in the worktree's AGENTS.md ──
      getAgentsMdBlockStatus: (opts: { worktreePath: string; sourcePath: string }) => Promise<{ installed: boolean; current: boolean; sourceExists: boolean; agentsMdPath: string }>;
      applyAgentsMdBlock: (opts: { worktreePath: string; sourcePath: string }) => Promise<{ success: boolean; created?: boolean; agentsMdPath?: string; error?: string }>;
      removeAgentsMdBlock: (opts: { worktreePath: string }) => Promise<{ success: boolean; deleted?: boolean; agentsMdPath?: string; error?: string }>;
      writeProjectFile: (opts: { projectPath: string; relativeFilePath: string; content: string }) => Promise<any>;
      downloadFile: (opts: { url: string; destinationPath: string }) => Promise<any>;

      // ── Project Metadata, Assets & ADB ──
      updateProjectMetadata: (projectPath: string, metadata: {
        name?: string;
        figmaUrl?: string;
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
      syncBaProjectConfig: (opts: { projectPath: string; worktreePath?: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
      selectApkFile: () => Promise<{ name: string; path: string; size: number } | null>;
      getFileInfo: (filePath: string) => Promise<{ name: string; path: string; size: number; isFile: boolean } | null>;
      installApk: (opts: { apkPath: string; serial?: string }) => Promise<{ success: boolean; output?: string; error?: string }>;

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
      deviceCaptureUi: (options: { serial?: string; worktreePath: string; prefix?: string }) => Promise<any>;
      deviceInstallApk: (opts: { serial?: string; apkPath: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
      deviceSendKey: (opts: { serial: string; keycode: string | number }) => Promise<{ success: boolean; error?: string }>;
      deviceSetupMobilerun: (opts: { serial: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
    };
  }
}


export {};
