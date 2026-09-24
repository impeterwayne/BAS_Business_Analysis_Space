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
      openInEditor: (path: string) => Promise<any>;
      openInExplorer: (path: string) => Promise<any>;
      openExternal: (url: string) => Promise<any>;
      openInAndroidStudio: (path: string) => Promise<any>;
      openInAntigravity: (path: string) => Promise<any>;
      openInAntigravityAgent: (path: string) => Promise<any>;
      openInFigma: (pathOrUrl?: string) => Promise<any>;
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
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        scrcpyPath?: string;
        pokitSourcePath?: string;
        openspecSourcePath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        planeApiKey?: string;
        planeBaseUrl?: string;
        planeWorkspaceSlug?: string;
        projectPlaneIds?: Record<string, string>;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        reakitPath?: string;
        reakitDefaultSource?: string;
        reakitHeapSize?: string;
        reakitHarnessProfile?: string;
      }>;
      updateSettings: (settings: {
        subworktreeBranchParents?: Record<string, string>;
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        scrcpyPath?: string;
        pokitSourcePath?: string;
        openspecSourcePath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        planeApiKey?: string;
        planeBaseUrl?: string;
        planeWorkspaceSlug?: string;
        projectPlaneIds?: Record<string, string>;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        reakitPath?: string;
        reakitDefaultSource?: string;
        reakitHeapSize?: string;
        reakitHarnessProfile?: string;
      }) => Promise<{
        subworktreeBranchParents?: Record<string, string>;
        vscodePath?: string;
        androidStudioPath?: string;
        antigravityPath?: string;
        antigravityAgentPath?: string;
        figmaPath?: string;
        figmaUrl?: string;
        scrcpyPath?: string;
        pokitSourcePath?: string;
        openspecSourcePath?: string;
        autoRefreshCurrentProject?: boolean;
        autoRefreshInterval?: number;
        planeApiKey?: string;
        planeBaseUrl?: string;
        planeWorkspaceSlug?: string;
        projectPlaneIds?: Record<string, string>;
        symlinkTargets?: Array<{ name: string; targetPath: string }>;
        reakitPath?: string;
        reakitDefaultSource?: string;
        reakitHeapSize?: string;
        reakitHarnessProfile?: string;
      }>;
      selectExecutable: () => Promise<string | null>;
      detectIntegrationPaths: () => Promise<{
        antigravityPath: string | null;
        antigravityAgentPath: string | null;
        androidStudioPath: string | null;
        vscodePath: string | null;
        scrcpyPath?: string | null;
        figmaPath?: string | null;
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
      deployToolkit: (opts: { worktreePath: string; name: string; sourcePath: string }) => Promise<{ success: boolean; error?: string }>;
      removeToolkit: (opts: { worktreePath: string; name: string; sourcePath?: string }) => Promise<{ success: boolean; error?: string }>;
      getDefaultToolkitSources: () => Promise<{ openspecPath: string; pokitPath: string; bmadPath: string; reakitPath?: string }>;
      writeProjectFile: (opts: { projectPath: string; relativeFilePath: string; content: string }) => Promise<any>;
      downloadFile: (opts: { url: string; destinationPath: string }) => Promise<any>;

      // ── ReaKit Operations ──
      reakitRunCommand: (opts: { args: string[]; cwd?: string }) => Promise<{
        success: boolean;
        stdout: string;
        stderr: string;
        exitCode: number;
      }>;
      reakitGetEnv: () => Promise<{
        success: boolean;
        output: string;
        components: Array<{ name: string; status: 'READY' | 'WARN' | 'ERROR' | 'UNKNOWN'; details: string }>;
        devices: string[];
        error?: string;
      }>;
      reakitGetTargets: (opts?: { worktreePath?: string }) => Promise<Array<{
        packageName: string;
        alias?: string;
        existsOnDisk: boolean;
        targetDir?: string;
      }>>;
      reakitGetTargetStatus: (opts: { worktreePath: string; packageName: string }) => Promise<{
        exists: boolean;
        targetDir: string;
        apks: { count: number; files: string[]; sizeBytes: number };
        jadx: { exists: boolean; hasSource: boolean; fileCount: number };
        runtime: { exists: boolean; files: string[]; count: number };
        native: { exists: boolean; soFiles: string[]; archs: string[] };
        traffic: { exists: boolean; count: number };
        docs: { exists: boolean; files: string[] };
      }>;
      reakitLaunchJadxGui: (opts?: { target?: string; worktreePath?: string }) => Promise<{ success: boolean; error?: string }>;
      reakitLaunchMirror: (opts?: { serial?: string; maxSize?: number; fps?: number }) => Promise<{ success: boolean; error?: string }>;
      reakitHarnessAction: (opts: { action: string; targetPath: string; profile?: string }) => Promise<{
        success: boolean;
        stdout: string;
        stderr: string;
        exitCode: number;
      }>;
      reakitSaveTarget: (opts: { worktreePath: string; packageName: string; alias?: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}


export {};
