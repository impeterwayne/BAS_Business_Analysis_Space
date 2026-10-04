/* ═══════════════════════════════════════════════════════
   Coding Space — Renderer (Embedded Terminal + Sidebar)
   ═══════════════════════════════════════════════════════ */

const { Terminal } = require('@xterm/xterm');
const { FitAddon } = require('@xterm/addon-fit');
const { WebLinksAddon } = require('@xterm/addon-web-links');
const { WebglAddon } = require('@xterm/addon-webgl');
const {
  getAvailableWorktreeBranches,
  isInvalidGitBranchName,
  getSuggestedWorktreePath,
  getWorktreeBasePath: getDomainWorktreeBasePath,
  getOfficialWorktreeBasePath,
  classifyWorktreeLocation: getDomainClassifyWorktreeLocation,
  canCreateNestedWorktree: getDomainCanCreateNestedWorktree,
  buildWorktreeTree: getDomainBuildWorktreeTree,
  parseFigmaUrl,
  formatDisplayUrl,
  parseBenchmarkFlows,
  formatFlowSlug,
  buildBenchmarkSlashCommand,
} = require('../domain');

const { initializeRendererLifecycle } = require('./lifecycle');
const { openCreateBranchModal } = require('./modals/createBranchModal');
const { openAddWorktreeModal, openAddSubWorktreeModal, openMergeWorktreeModal, openForceRemoveWorktreeModal } = require('./modals/worktreeModals');
const { openCompetitorModal } = require('./modals/competitorModal');
const { createModalHelpers } = require('./ui/modalHelpers');
const { createModalPrimitives } = require('./ui/modalPrimitives');
const { DeviceManagerScreen } = require('./screens/deviceManagerScreen');

type TerminalBehavior = {
  forceMouseMode: boolean;
};

type ToolTab = {
  key: string;
  action: string;
  command: string;
  label: string;
  iconKey: string;
  prewarm: boolean;
  launchArgs: string[];
  title: string;
  warningBadge?: string;
  behavior: TerminalBehavior;
};

// ── Windows Terminal color scheme ──────────────────────
const WT_THEME = {
  background: '#0c0c0c',
  foreground: '#cccccc',
  cursor: '#cccccc',
  cursorAccent: '#0c0c0c',
  selectionBackground: 'rgba(255,255,255,0.18)',
  selectionForeground: '#ffffff',
  black: '#0c0c0c',
  red: '#c50f1f',
  green: '#13a10e',
  yellow: '#c19c00',
  blue: '#0037da',
  magenta: '#881798',
  cyan: '#3a96dd',
  white: '#cccccc',
  brightBlack: '#767676',
  brightRed: '#e74856',
  brightGreen: '#16c60c',
  brightYellow: '#f9f1a5',
  brightBlue: '#3b78ff',
  brightMagenta: '#b4009e',
  brightCyan: '#61d6d6',
  brightWhite: '#f2f2f2',
};

// ── State ──────────────────────────────────────────────
const state: {
  projects: any[];
  settings: {
    subworktreeBranchParents?: Record<string, string>;
    vscodePath?: string;
    androidStudioPath?: string;
    antigravityPath?: string;
    antigravityAgentPath?: string;
    figmaPath?: string;
    figmaUrl?: string;
    obsidianPath?: string;
    obsidianVault?: string;
    scrcpyPath?: string;
    autoRefreshCurrentProject?: boolean;
    autoRefreshInterval?: number;
    symlinkTargets?: Array<{ name: string; targetPath: string }>;
  };
  useExternalWt: boolean;
  workspaceSidebarCollapsed: boolean;
  tabSidebarCollapsed: boolean;
  expandedProjects: Set<string>;
  terminals: Map<string, any>;
  activeTerminalId: string | null;
  activeWorktreePath: string | null;
  worktreeActiveTerminal: Map<string, string>;
  terminalCounter: number;
  prewarm: { opencode: any };
  prewarmInProgress: { opencode: boolean };
  prewarmSuspendedWorktrees: Set<string>;
  selectedProjectPath: string | null;
} = {
  projects: [],
  settings: {
    subworktreeBranchParents: {},
  },
  useExternalWt: false,
  workspaceSidebarCollapsed: false,
  tabSidebarCollapsed: false,
  expandedProjects: new Set(),
  terminals: new Map(),   // id -> { term, fitAddon, paneEl, name, cwd, worktreePath, cleanup }
  activeTerminalId: null,
  activeWorktreePath: null, // which worktree's tabs are currently shown
  worktreeActiveTerminal: new Map(), // worktreePath -> last active terminal id
  terminalCounter: 0,
  // Prewarmed tool sessions: { id, term, fitAddon, paneEl, cleanup, cwd, worktreePath, ready }
  prewarm: {
    opencode: null,
  },
  prewarmInProgress: {
    opencode: false,
  },
  prewarmSuspendedWorktrees: new Set(),
  selectedProjectPath: null,
};

// ── DOM Refs ───────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const dom = {
  btnMinimize: $('#btn-minimize'),
  btnMaximize: $('#btn-maximize'),
  btnClose: $('#btn-close'),
  btnSettings: $('#btn-settings'),
  settingsScreen: $('#settings-screen'),
  btnCloseSettings: $('#btn-close-settings'),
  btnAddProject: $('#btn-add-project'),
  btnAddFirst: $('#btn-add-first'),
  btnRefreshAll: $('#btn-refresh-all'),
  settingsAutoRefresh: $('#settings-auto-refresh'),
  settingsAutoRefreshInterval: $('#settings-auto-refresh-interval'),
  toggleExternalWt: $('#toggle-external-wt'),
  projectsContainer: $('#projects-container'),
  loadingState: $('#loading-state'),
  emptyState: $('#empty-state'),
  toastContainer: $('#toast-container'),
  modalOverlay: $('#modal-overlay'),
  modal: $('#modal'),
  modalTitle: $('#modal-title'),
  modalBody: $('#modal-body'),
  modalFooter: $('#modal-footer'),
  modalCloseBtn: $('#modal-close-btn'),
  terminalArea: $('#terminal-area'),
  terminalWelcome: $('#terminal-welcome'),
  terminalContainer: $('#terminal-container'),
  terminalTabs: $('#terminal-tabs'),
  btnTerminalScreen: $('#btn-terminal-screen'),
  terminalScreen: $('#terminal-screen'),
  btnCloseTerminalScreen: $('#btn-close-terminal-screen'),
  btnTerminalScreenNew: $('#btn-terminal-screen-new'),
  btnTerminalScreenScrcpy: $('#btn-terminal-screen-scrcpy'),
  terminalScreenActiveName: $('#terminal-screen-active-name'),
  terminalEmptyState: $('#terminal-empty-state'),
  btnTerminalEmptyNew: $('#btn-terminal-empty-new'),
  btnTerminalEmptyScrcpy: $('#btn-terminal-empty-scrcpy'),
  tabListScroll: $('#tab-list-scroll'),
  tabNewBtn: $('#tab-new-btn'),
  tabCollapseBtn: $('#tab-collapse-btn'),
  btnVsCode: $('#btn-vscode'),
  btnExplorer: $('#btn-explorer'),
  btnAndroidStudio: $('#btn-android-studio'),
  btnAntigravity: $('#btn-antigravity'),
  btnAntigravityAgent: $('#btn-antigravity-agent'),
  btnScrcpyCapture: $('#btn-scrcpy-capture'),
  btnFigma: $('#btn-figma'),
  btnObsidian: $('#btn-obsidian'),
  dashboardEmptyState: $('#dashboard-empty-state'),
  btnDashboardAddFirst: $('#btn-dashboard-add-first'),
  dashboardViewer: $('#dashboard-viewer'),
  dashProjectName: $('#dash-project-name'),
  dashBranchBadge: $('#dash-branch-badge'),
  dashProjectPath: $('#dash-project-path'),
  dashBtnCopyPath: $('#dash-btn-copy-path'),
  dashBtnRevealPath: $('#dash-btn-reveal-path'),
  dashChipDevice: $('#dash-chip-device'),
  dashChipDeviceDot: $('#dash-chip-device-dot'),
  dashDeviceText: $('#dash-device-text'),
  dashChipWorktree: $('#dash-chip-worktree'),
  dashWtText: $('#dash-wt-text'),
  dashChipBakit: $('#dash-chip-bakit'),
  dashBakitText: $('#dash-bakit-text'),
  dashFigmaStatusPill: $('#dash-figma-status-pill'),
  dashFigmaActions: $('#dash-figma-actions'),
  dashFigmaBody: $('#dash-figma-body'),
  dashBtnOpenFigma: $('#dash-btn-open-figma'),
  dashBtnBrowserFigma: $('#dash-btn-browser-figma'),
  dashApkBadge: $('#dash-apk-badge'),
  dashBtnAddApk: $('#dash-btn-add-apk'),
  dashBtnRefreshAdb: $('#dash-btn-refresh-adb'),
  dashApkDropzone: $('#dash-apk-dropzone'),
  dashLinkBrowseApk: $('#dash-link-browse-apk'),
  dashApkList: $('#dash-apk-list'),
  dashCompBadge: $('#dash-comp-badge'),
  dashBtnAddCompetitor: $('#dash-btn-add-competitor'),
  dashBtnSyncConfig: $('#dash-btn-sync-config'),
  dashCompetitorList: $('#dash-competitor-list'),
  dashBtnViewGrid: $('#dash-btn-view-grid'),
  dashBtnViewList: $('#dash-btn-view-list'),
  titlebarCrumbProject: $('#titlebar-crumb-project'),
  titlebarCrumbBranch: $('#titlebar-crumb-branch'),
  welcomeStatusName: $('#welcome-status-name'),
  btnManageSymlinks: $('#btn-manage-symlinks'),
  btnToggleWorkspaceSidebar: $('#btn-toggle-workspace-sidebar'),
  sidebarResizeHandle: $('#sidebar-resize-handle'),
  sidebar: $('#sidebar'),
  workspaceSidebar: $('#workspace-sidebar'),
  tabResizeHandle: $('#tab-resize-handle'),
  settingsAntigravityPath: $('#settings-antigravity-path'),
  settingsAntigravityAgentPath: $('#settings-antigravity-agent-path'),
  settingsAndroidStudioPath: $('#settings-android-studio-path'),
  settingsVsCodePath: $('#settings-vscode-path'),
  settingsFigmaPath: $('#settings-figma-path'),
  settingsFigmaUrl: $('#settings-figma-url'),
  settingsObsidianPath: $('#settings-obsidian-path'),
  settingsObsidianVault: $('#settings-obsidian-vault'),
  settingsScrcpyPath: $('#settings-scrcpy-path'),
  btnBrowseAntigravity: $('#btn-browse-antigravity'),
  btnBrowseAntigravityAgent: $('#btn-browse-antigravity-agent'),
  btnBrowseAndroidStudio: $('#btn-browse-android-studio'),
  btnBrowseVsCode: $('#btn-browse-vscode'),
  btnBrowseFigma: $('#btn-browse-figma'),
  btnBrowseObsidian: $('#btn-browse-obsidian'),
  btnBrowseObsidianVault: $('#btn-browse-obsidian-vault'),
  btnBrowseScrcpy: $('#btn-browse-scrcpy'),
  btnAgentToolkitApplyAll: $('#btn-agent-toolkit-apply-all'),
  symlinkScreen: $('#symlink-screen'),
  btnCloseSymlinkScreen: $('#btn-close-symlink-screen'),
  symlinkScreenActiveName: $('#symlink-screen-active-name'),
  symlinkScreenActivePath: $('#symlink-screen-active-path'),
  symlinkScreenListContainer: $('#symlink-screen-list-container'),
  symlinkScreenNewPath: $('#symlink-screen-new-path'),
  symlinkScreenNewName: $('#symlink-screen-new-name'),
  btnBrowseSymlinkScreen: $('#btn-browse-symlink-screen-folder'),
  btnAddSymlinkScreenTarget: $('#btn-symlink-screen-add'),
  symlinkScreenNameGroup: $('#symlink-screen-name-group'),
  btnAgentToolkit: $('#btn-agent-toolkit'),
  agentToolkitScreen: $('#agent-toolkit-screen'),
  btnCloseAgentToolkitScreen: $('#btn-close-agent-toolkit-screen'),
  agentToolkitActiveName: $('#agent-toolkit-active-name'),
  agentToolkitActivePath: $('#agent-toolkit-active-path'),
  agentToolkitListContainer: $('#agent-toolkit-list-container'),
  btnDeviceManager: $('#btn-device-manager'),
  deviceManagerScreen: $('#device-manager-screen'),
  btnCloseDeviceManagerScreen: $('#btn-close-device-manager-screen'),
};

const WORKSPACE_SIDEBAR_COLLAPSED_KEY = 'codingspace.workspaceSidebarCollapsed';
const TAB_SIDEBAR_COLLAPSED_KEY = 'codingspace.tabSidebarCollapsed';

// ── Window Controls ────────────────────────────────────
dom.btnMinimize.addEventListener('click', () => window.api.minimize());
dom.btnMaximize.addEventListener('click', () => window.api.maximize());
dom.btnClose.addEventListener('click', () => window.api.close());

// ── Option Toggles ─────────────────────────────────────
dom.toggleExternalWt.addEventListener('change', (e) => {
  state.useExternalWt = e.target.checked;
});

dom.btnToggleWorkspaceSidebar.addEventListener('click', () => {
  setWorkspaceSidebarCollapsed(!state.workspaceSidebarCollapsed);
});

dom.btnSettings.addEventListener('click', showSettingsScreen);
dom.btnCloseSettings.addEventListener('click', hideSettingsScreen);

// ── Integrations Settings Actions ─────────────────────
function setupBrowseButton(btn, input) {
  if (!btn || !input) return;
  btn.addEventListener('click', async () => {
    const path = await window.api.selectExecutable();
    if (path) {
      input.value = path;
      await saveSettingsFromUI();
    }
  });
}

setupBrowseButton(dom.btnBrowseAntigravity, dom.settingsAntigravityPath);
setupBrowseButton(dom.btnBrowseAntigravityAgent, dom.settingsAntigravityAgentPath);
setupBrowseButton(dom.btnBrowseAndroidStudio, dom.settingsAndroidStudioPath);
setupBrowseButton(dom.btnBrowseVsCode, dom.settingsVsCodePath);
setupBrowseButton(dom.btnBrowseFigma, dom.settingsFigmaPath);
setupBrowseButton(dom.btnBrowseObsidian, dom.settingsObsidianPath);
setupBrowseButton(dom.btnBrowseScrcpy, dom.settingsScrcpyPath);

if (dom.btnBrowseObsidianVault && dom.settingsObsidianVault) {
  dom.btnBrowseObsidianVault.addEventListener('click', async () => {
    const selected = await window.api.selectDirectory('Select Obsidian Vault Folder');
    if (selected) {
      dom.settingsObsidianVault.value = selected;
      await saveSettingsFromUI();
    }
  });
}

const settingsInputs = [
  dom.settingsAntigravityPath,
  dom.settingsAntigravityAgentPath,
  dom.settingsAndroidStudioPath,
  dom.settingsVsCodePath,
  dom.settingsFigmaPath,
  dom.settingsFigmaUrl,
  dom.settingsObsidianPath,
  dom.settingsObsidianVault,
  dom.settingsScrcpyPath,
];
for (const input of settingsInputs) {
  if (input) {
    input.addEventListener('change', saveSettingsFromUI);
    input.addEventListener('blur', saveSettingsFromUI);
  }
}

if (dom.settingsAutoRefresh) {
  dom.settingsAutoRefresh.addEventListener('change', async () => {
    await saveSettingsFromUI();
    if (dom.btnRefreshAll) {
      dom.btnRefreshAll.style.display = dom.settingsAutoRefresh.checked ? 'none' : '';
    }
    startAutoRefreshLoop();
  });
}
if (dom.settingsAutoRefreshInterval) {
  dom.settingsAutoRefreshInterval.addEventListener('change', async () => {
    await saveSettingsFromUI();
    startAutoRefreshLoop();
  });
  dom.settingsAutoRefreshInterval.addEventListener('input', async () => {
    await saveSettingsFromUI();
    startAutoRefreshLoop();
  });
}

// ── Add Project ────────────────────────────────────────
dom.btnAddProject.addEventListener('click', addProject);
dom.btnAddFirst.addEventListener('click', addProject);

async function addProject() {
  const result = await window.api.addProject();
  if (!result) return;
  if (result.error) { showToast(result.error, 'error'); return; }
  state.expandedProjects.add(result.path);
  showToast(`Added project: ${result.name}`, 'success');
  await loadWorkspaces();
}

// ── Refresh All ────────────────────────────────────────
dom.btnRefreshAll.addEventListener('click', async () => {
  showToast('Refreshing...', 'info');
  for (const p of state.projects) await window.api.refreshWorktrees(p.path);
  await loadWorkspaces();
  showToast('All projects refreshed', 'success');
});

// ── Sidebar Resize ─────────────────────────────────────
(function initSidebarResize() {
  let isResizing = false;
  dom.sidebarResizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    dom.sidebarResizeHandle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    dom.sidebar.style.width = Math.min(500, Math.max(200, e.clientX)) + 'px';
    fitActiveTerminal();
  });
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      dom.sidebarResizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      fitActiveTerminal();
    }
  });
})();

// ── Tab Sidebar Resize ─────────────────────────────────
(function initTabSidebarResize() {
  let isResizing = false;
  
  dom.tabResizeHandle.addEventListener('mousedown', (e) => {
    if (state.tabSidebarCollapsed) return; // Do not resize if collapsed
    isResizing = true;
    dom.tabResizeHandle.classList.add('active');
    dom.terminalTabs.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const parentEl = dom.terminalTabs?.parentElement;
    const parentLeft = parentEl ? parentEl.getBoundingClientRect().left : dom.sidebar.getBoundingClientRect().width;
    const computedWidth = Math.min(350, Math.max(140, e.clientX - parentLeft));
    document.documentElement.style.setProperty('--tab-sidebar-width', computedWidth + 'px');
    fitActiveTerminal();
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      dom.tabResizeHandle.classList.remove('active');
      dom.terminalTabs.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      fitActiveTerminal();
    }
  });
})();

// ── Icons (loaded from SVG files) ──────────────────────

/** Read an SVG file from the icons/ folder via synchronous XHR */
function loadIcon(name) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `icons/${name}.svg`, false); // synchronous
    xhr.send();
    if (xhr.status === 200 || xhr.status === 0) { // status 0 for file:// protocol
      return xhr.responseText.trim();
    }
    console.warn(`Failed to load icon: ${name} (status ${xhr.status})`);
    return '';
  } catch (e) {
    console.warn(`Failed to load icon: ${name}`, e.message);
    return '';
  }
}

let svgIdCounter = 0;
function iconSvg(rawSvg, size = 12) {
  svgIdCounter++;
  const suffix = `_dyn_${svgIdCounter}`;
  
  // Find all id="..." declarations
  const idRegex = /id="([^"]+)"/g;
  const ids = [];
  let match;
  while ((match = idRegex.exec(rawSvg)) !== null) {
    ids.push(match[1]);
  }
  
  let processed = rawSvg;
  // Replace each ID and its url(#id) references
  for (const id of ids) {
    const newId = `${id}${suffix}`;
    // Replace id="id" with id="id_dyn_X"
    processed = processed.replace(new RegExp(`id="${id}"`, 'g'), `id="${newId}"`);
    // Replace url(#id) with url(#id_dyn_X)
    processed = processed.replace(new RegExp(`url\\(#${id}\\)`, 'g'), `url(#${newId})`);
    // Replace url("#id") with url("#id_dyn_X")
    processed = processed.replace(new RegExp(`url\\("#${id}"\\)`, 'g'), `url(#${newId})`);
  }
  
  return processed.replace(/^<svg/, `<svg width="${size}" height="${size}"`);
}

// Load all SVG icons once at startup
const iconRaw = {
  terminal: loadIcon('terminal'),
  code: loadIcon('code'),
  codex: loadIcon('codex'),
  folder: loadIcon('folder'),
  gitBranch: loadIcon('git-branch'),
  trash: loadIcon('trash'),
  plus: loadIcon('plus'),
  download: loadIcon('download'),
  gitFork: loadIcon('git-fork'),
  chevron: loadIcon('chevron'),
  settings: loadIcon('settings'),
  close: loadIcon('close'),
  opencode: loadIcon('opencode'),
  claude: loadIcon('claude'),
  'windows-terminal': loadIcon('windows-terminal'),
  android: loadIcon('android'),
  antigravity: loadIcon('antigravity'),
  'more-vertical': loadIcon('more-vertical'),
  copy: loadIcon('copy'),
  link: loadIcon('link'),
  'agent-toolkit': loadIcon('agent-toolkit'),
  screen: loadIcon('screen'),
  capture: loadIcon('capture'),
  device: loadIcon('device'),
  figma: loadIcon('figma'),
  task: loadIcon('task'),
  refresh: loadIcon('refresh'),
  check: loadIcon('check'),
};

// Pre-sized icon strings matching original inline sizes
const icons = {
  terminal: iconSvg(iconRaw.terminal, 12),
  code: iconSvg(iconRaw.code, 12),
  folder: iconSvg(iconRaw.folder, 12),
  gitBranch: iconSvg(iconRaw.gitBranch, 10),
  trash: iconSvg(iconRaw.trash, 12),
  plus: iconSvg(iconRaw.plus, 12),
  download: iconSvg(iconRaw.download, 12),
  gitFork: iconSvg(iconRaw.gitFork, 14),
  chevron: iconSvg(iconRaw.chevron, 10),
  settings: iconSvg(iconRaw.settings, 12),
  close: iconSvg(iconRaw.close, 8),
  get opencode() { return iconSvg(iconRaw.opencode, 12); },
  claude: iconSvg(iconRaw.claude, 12),
  'windows-terminal': iconSvg(iconRaw['windows-terminal'], 12),
  android: iconSvg(iconRaw.android, 12),
  device: iconSvg(iconRaw.device, 14),
  refresh: iconSvg(iconRaw.refresh, 12),
  check: iconSvg(iconRaw.check, 12),
  get antigravity() { return iconSvg(iconRaw.antigravity, 12); },
  moreVertical: iconSvg(iconRaw['more-vertical'], 12),
  copy: iconSvg(iconRaw.copy, 12),
  link: iconSvg(iconRaw.link, 12),
  codex: iconSvg(iconRaw.codex, 12),
  agentToolkit: iconSvg(iconRaw['agent-toolkit'], 16),
  screen: iconSvg(iconRaw.screen, 14),
  capture: iconSvg(iconRaw.capture, 14),
  figma: iconSvg(iconRaw.figma, 14),
  task: iconSvg(iconRaw.task, 14),
  edit: iconSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>', 12),
};

const FIGMA_COLORED_LOGO = `<svg width="18" height="27" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
  <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
  <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
  <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
  <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
</svg>`;

const EDIT_PENCIL_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

const TOOL_TABS: Record<string, ToolTab> = {
  agy: {
    key: 'agy',
    action: 'new-agy',
    command: 'agy',
    label: 'Antigravity CLI',
    iconKey: 'antigravity',
    prewarm: false,
    launchArgs: [],
    title: 'Open Antigravity CLI in a new terminal tab',
    behavior: {
      forceMouseMode: false,
    },
  },

  opencode: {
    key: 'opencode',
    action: 'new-opencode',
    command: 'opencode',
    label: 'OpenCode',
    iconKey: 'opencode',
    prewarm: false,
    launchArgs: [],
    title: 'Open OpenCode in a new terminal tab',
    behavior: {
      forceMouseMode: true,
    },
  },

  codexYolo: {
    key: 'codexYolo',
    action: 'new-codex-yolo',
    command: 'codex',
    label: 'Codex (YOLO)',
    iconKey: 'codex',
    prewarm: false,
    launchArgs: ['--dangerously-bypass-approvals-and-sandbox'],
    title: 'Open Codex without approvals or sandboxing. Only use this in isolated/sandboxed environments.',
    warningBadge: 'danger',
    behavior: {
      forceMouseMode: false,
    },
  },

  claudeDangerous: {
    key: 'claudeDangerous',
    action: 'new-claude-dangerous',
    command: 'claude',
    label: 'Claude (skip permissions)',
    iconKey: 'claude',
    prewarm: false,
    launchArgs: ['--dangerously-skip-permissions'],
    title: 'Open Claude with --dangerously-skip-permissions. Only use this in isolated/sandboxed environments.',
    warningBadge: 'danger',
    behavior: {
      forceMouseMode: false,
    },
  },
};

const PREWARM_TOOLS = Object.fromEntries(
  Object.values(TOOL_TABS)
    .filter((tool) => tool.prewarm)
    .map((tool) => [tool.key, tool])
);

function getToolTabByAction(action) {
  return Object.values(TOOL_TABS).find((tool) => tool.action === action) || null;
}

function getToolTabByKey(toolKey) {
  return TOOL_TABS[toolKey] || null;
}

async function resolveToolLaunchOrThrow(command, launchArgs = []) {
  const resolved = await window.api.resolveToolLaunch({ command, args: launchArgs });
  if (!resolved?.success || !resolved.shellCommand) {
    throw new Error(resolved?.error || `Failed to resolve launch command for ${command}`);
  }
  return resolved.shellCommand;
}

/** @param {ToolTab} tool */
function buildToolTabLabel(tool, wtName) {
  return `${tool.label}: ${wtName}`;
}

function buildToolSessionName(tool, wtName) {
  const safeName = wtName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeToolName = tool.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${safeName}_${safeToolName}_${Date.now()}`;
}

const DEFAULT_TERMINAL_BEHAVIOR: TerminalBehavior = {
  forceMouseMode: false,
};

function normalizeTerminalBehavior(behavior: Partial<TerminalBehavior> = {}): TerminalBehavior {
  return {
    forceMouseMode: Boolean(behavior.forceMouseMode),
  };
}

function applyTerminalBehavior(term, behavior: TerminalBehavior) {
  if (behavior.forceMouseMode) {
    forceTerminalMouseMode(term);
  }

  return () => {};
}

// OSC 8 hyperlinks (emitted by Claude Code, gh, npm, vite…) bypass the web-links addon —
// xterm handles them itself, and its default handler confirm()s then calls window.open(),
// which the main process denies, so the link goes nowhere. Route it through the same IPC.
const TERMINAL_LINK_HANDLER = {
  activate: (_event, text) => {
    void window.api.openExternal(text);
  },
};

function loadRendererAddons(term, fitAddon) {
  term.options.linkHandler = TERMINAL_LINK_HANDLER;
  term.loadAddon(fitAddon);
  // The addon's default handler does window.open() then sets location.href, which Electron
  // turns into an in-app window instead of the OS browser — hand the URL to the main process.
  term.loadAddon(new WebLinksAddon((_event, uri) => {
    void window.api.openExternal(uri);
  }));
  try {
    term.loadAddon(new WebglAddon());
  } catch (error) {
    console.warn('Failed to enable WebGL renderer:', error?.message || error);
  }
}

function menuItemHTML({ action, icon, label, title = '', badges = [], danger = false, iconClass = 'terminal-icon' }) {
  const className = `tab-dropdown-item${danger ? ' danger' : ''}`;
  const badgeHtml = badges.filter(Boolean).join('');
  const appliedIconClass = danger ? 'danger-icon' : iconClass;
  return `
    <button class="${className}" data-action="${action}"${title ? ` title="${esc(title)}"` : ''}>
      <span class="tab-dropdown-icon ${appliedIconClass}">${icon}</span>
      <span>${label}</span>
      ${badgeHtml}
    </button>
  `;
}

function menuDividerHTML() {
  return '<div class="tab-dropdown-divider"></div>';
}

function renderToolDropdownItems() {
  return (Object.values(TOOL_TABS) as ToolTab[])
    .map((tool) => {
      const warningBadge = tool.warningBadge
        ? `<span class="tab-dropdown-badge danger-badge">${tool.warningBadge}</span>`
        : '';
      return menuItemHTML({
        action: tool.action,
        icon: icons[tool.iconKey] || icons.terminal,
        label: tool.label,
        title: tool.title || tool.label,
        badges: [warningBadge],
        iconClass: `${tool.iconKey}-icon`,
      });
    })
    .join('');
}

/**
 * @param {{ id: string, className: string, anchorRect?: DOMRect | null, x?: number, y?: number, html: string, outsideClickHandler: (e: MouseEvent) => void }} options
 */
function showPositionedMenu(options) {
  const { id, className, anchorRect = null, x = 0, y = 0, html, outsideClickHandler } = options;
  const menu = document.createElement('div');
  menu.className = className;
  menu.id = id;
  menu.innerHTML = html;

  if (anchorRect) {
    menu.style.left = `${anchorRect.right + 4}px`;
    menu.style.top = `${anchorRect.top}px`;
  } else {
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  document.body.appendChild(menu);

  if (!anchorRect) {
    const rect = menu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 8);
    const top = Math.min(y, window.innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  }

  menu.offsetHeight;
  menu.classList.add('visible');

  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 0);

  return menu;
}

function bindMenuActions(menu, handlers, onFinally) {
  menu.addEventListener('click', async (e) => {
    const item = e.target.closest('.tab-dropdown-item');
    if (!item) return;

    const action = item.dataset.action;
    if (!action) return;

    if (onFinally) onFinally();
    const handler = handlers[action];
    if (handler) await handler();
  });
}

function bindWorktreeQuickAction(buttonEl, openFn, toastMessage) {
  buttonEl.addEventListener('click', () => {
    const wtPath = getRequiredActiveWorktreePath();
    if (!wtPath) return;
    openFn(wtPath);
    showToast(toastMessage, 'info');
  });
}

function sidebarActionButtonHTML({ action, path, title, icon, danger = false }) {
  return `<button class="sidebar-icon-btn${danger ? ' danger' : ''}" data-action="${action}" data-path="${esc(path)}" title="${title}">${icon}</button>`;
}

function sidebarEmptyStateHTML() {
  return '<div style="padding:10px 16px 10px 44px;color:var(--text-muted);font-size:11px;">No worktrees</div>';
}

const {
  configureModalFooter,
  focusModalInputLater,
  bindModalEnterSubmit,
  withAsyncButtonState,
} = createModalHelpers(dom);

const { showModal, hideModal, showToast, initializeModalPrimitives } = createModalPrimitives(dom);
initializeModalPrimitives();

// ── Utilities ──────────────────────────────────────────
function esc(str: any) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function syncWorktreePathInput(pathInput, baseDir, projectName) {
  return (branch) => {
    pathInput.value = getSuggestedWorktreePath(baseDir, projectName, branch);
  };
}

async function refreshProjectWorkspaces(projectPath) {
  await window.api.refreshWorktrees(projectPath);
  await loadWorkspaces();
}

function createWorktreeSubmitHandler({ project, combo, pathInput, button, buttonLabel, sourceWorktreePath, onSuccess }) {
  return async () => {
    const { branch: selectedBranch, isNew } = combo.getSelected();
    if (!selectedBranch) { showToast('Please select or create a branch', 'error'); return; }
    const wtPath = pathInput.value;
    if (!wtPath) { showToast('Please specify a worktree path', 'error'); return; }
    if (isNew && isInvalidGitBranchName(selectedBranch)) {
      showToast('Invalid branch name', 'error');
      return;
    }

    const result = await withAsyncButtonState(button, 'Creating...', async () => window.api.addWorktree({
      projectPath: project.path,
      sourceWorktreePath,
      branchName: selectedBranch,
      wtPath,
      createBranch: isNew,
    }), buttonLabel);

    if (result.success) {
      if (onSuccess) await onSuccess(selectedBranch);
      showToast(`Worktree created: ${selectedBranch}`, 'success');
      hideModal();
      await refreshProjectWorkspaces(project.path);
      return;
    }

    showToast(`Failed: ${result.error}`, 'error');
  };
}

// ═══════════════════════════════════════════════════════
// EMBEDDED TERMINAL MANAGEMENT
// ═══════════════════════════════════════════════════════

const FORCED_MOUSE_MODE_SEQUENCE = '\x1b[?1002h\x1b[?1006h';

function forceTerminalMouseMode(term) {
  term.write(FORCED_MOUSE_MODE_SEQUENCE);
}

async function createTerminal(cwd, name, { worktreePath = '', iconKey = 'terminal', behavior = DEFAULT_TERMINAL_BEHAVIOR } = {}) {
  const id = `term-${++state.terminalCounter}`;
  const wtPath = worktreePath || cwd; // associate terminal with this worktree

  // Create xterm instance with Windows Terminal theme
  const term = new Terminal({
    theme: WT_THEME,
    fontFamily: "'Cascadia Mono', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    allowProposedApi: true,
    scrollback: 10000,
    tabStopWidth: 4,
  });

  const fitAddon = new FitAddon();
  loadRendererAddons(term, fitAddon);

  // Create pane element
  const paneEl = document.createElement('div');
  paneEl.className = 'terminal-pane';
  paneEl.id = `pane-${id}`;
  dom.terminalContainer.appendChild(paneEl);

  // Open xterm in pane
  term.open(paneEl);
  const terminalBehavior = normalizeTerminalBehavior(behavior);
  const cleanupBehavior = applyTerminalBehavior(term, terminalBehavior);

  // Fit after DOM settles

  requestAnimationFrame(() => {
    fitAddon.fit();
  });

  // Create PTY on backend
  const result = await window.api.ptyCreate({ cwd, id });
  if (!result.success) {
    showToast(`Failed to create terminal: ${result.error}`, 'error');
    paneEl.remove();
    term.dispose();
    return null;
  }

  // Wire data: PTY -> xterm
  const cleanupData = window.api.onPtyData(({ id: dataId, data }) => {
    if (dataId === id) term.write(data);
  });

  // Wire data: xterm -> PTY
  const onDataDisposable = term.onData((data) => {
    window.api.ptyWrite(id, data);
  });

  // Handle resize
  const onResizeDisposable = term.onResize(({ cols, rows }) => {
    window.api.ptyResize(id, cols, rows);
  });

  // Handle exit
  const cleanupExit = window.api.onPtyExit(({ id: exitId }) => {
    if (exitId === id) {
      closeTerminal(id);
    }
  });

  // Store terminal info (with worktree association)
  state.terminals.set(id, {
    term, fitAddon, paneEl, name, cwd, worktreePath: wtPath, iconKey, behavior: terminalBehavior,
    cleanup: () => {
      cleanupBehavior();
      cleanupData();
      cleanupExit();
      onDataDisposable.dispose();
      onResizeDisposable.dispose();
    },
  });

  // Switch worktree context to this terminal's worktree, then create tab
  state.activeWorktreePath = wtPath;
  rebuildTabsForWorktree(wtPath);

  // Switch to this terminal
  switchToTerminal(id);

  // Fit and send initial size
  setTimeout(() => {
    fitAddon.fit();
    window.api.ptyResize(id, term.cols, term.rows);
  }, 100);

  return id;
}

/**
 * Create a terminal that directly spawns a tool command as the PTY process.
 * Unlike createTerminal() which spawns a shell, this makes the tool the direct
 * process — giving it proper terminal allocation (fixes opencode not
 * spawning when typed into a shell).
 */
async function createDirectToolTerminal(cwd, name, options: { command?: string; launchArgs?: string[]; worktreePath?: string; iconKey?: string; behavior?: Partial<TerminalBehavior> } = {}) {
  const { command, launchArgs = [], worktreePath = '', iconKey = 'terminal', behavior = DEFAULT_TERMINAL_BEHAVIOR } = options;
  if (!command) {
    showToast('Missing tool command', 'error');
    return null;
  }
  const id = `term-${++state.terminalCounter}`;
  const wtPath = worktreePath || cwd;

  const term = new Terminal({
    theme: WT_THEME,
    fontFamily: "'Cascadia Mono', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    allowProposedApi: true,
    scrollback: 10000,
    tabStopWidth: 4,
  });

  const fitAddon = new FitAddon();
  loadRendererAddons(term, fitAddon);

  const paneEl = document.createElement('div');
  paneEl.className = 'terminal-pane';
  paneEl.id = `pane-${id}`;
  dom.terminalContainer.appendChild(paneEl);

  term.open(paneEl);
  const terminalBehavior = normalizeTerminalBehavior(behavior);
  const cleanupBehavior = applyTerminalBehavior(term, terminalBehavior);
  requestAnimationFrame(() => fitAddon.fit());

  const result = await window.api.ptyCreate({ cwd, id });
  if (!result.success) {
    showToast(`Failed to launch ${command}: ${result.error}`, 'error');
    paneEl.remove();
    term.dispose();
    return null;
  }

  let launchCommand;
  try {
    launchCommand = await resolveToolLaunchOrThrow(command, launchArgs);
  } catch (error) {
    showToast(`Failed to launch ${command}: ${error.message}`, 'error');
    window.api.ptyKill(id);
    paneEl.remove();
    term.dispose();
    return null;
  }

  const cleanupData = window.api.onPtyData(({ id: dataId, data }) => {
    if (dataId === id) term.write(data);
  });

  const onDataDisposable = term.onData((data) => {
    window.api.ptyWrite(id, data);
  });

  const onResizeDisposable = term.onResize(({ cols, rows }) => {
    window.api.ptyResize(id, cols, rows);
  });

  const cleanupExit = window.api.onPtyExit(({ id: exitId }) => {
    if (exitId === id) closeTerminal(id);
  });

  state.terminals.set(id, {
    term, fitAddon, paneEl, name, cwd, worktreePath: wtPath, iconKey, behavior: terminalBehavior,
    cleanup: () => {
      cleanupBehavior();
      cleanupData();
      cleanupExit();
      onDataDisposable.dispose();
      onResizeDisposable.dispose();
    },
  });

  state.activeWorktreePath = wtPath;
  rebuildTabsForWorktree(wtPath);
  switchToTerminal(id);

  setTimeout(() => {
    fitAddon.fit();
    window.api.ptyResize(id, term.cols, term.rows);
    setTimeout(() => {
      window.api.ptyWrite(id, `${launchCommand}\r`);
    }, 500);
  }, 100);

  return id;
}

function attachPtyToTerminal(id, term, fitAddon, paneEl, cleanupExtra = () => {}) {
  const cleanupData = window.api.onPtyData(({ id: dataId, data }) => {
    if (dataId === id) term.write(data);
  });

  const onDataDisposable = term.onData((data) => {
    window.api.ptyWrite(id, data);
  });

  const onResizeDisposable = term.onResize(({ cols, rows }) => {
    window.api.ptyResize(id, cols, rows);
  });

  const cleanupExit = window.api.onPtyExit(({ id: exitId }) => {
    if (exitId === id) closeTerminal(id);
  });

  return () => {
    cleanupExtra();
    cleanupData();
    cleanupExit();
    onDataDisposable.dispose();
    onResizeDisposable.dispose();
  };
}


// ═══════════════════════════════════════════════════════
// PREWARM SYSTEM — Background tool sessions
// ═══════════════════════════════════════════════════════

/**
 * Create a prewarmed background PTY for a tool session.
 * No xterm or DOM pane is created here; only the backend session is warmed.
 */
async function createPrewarmedTerminal(toolKey) {
  const tool = getToolTabByKey(toolKey);
  if (!tool) return;

  // Don't prewarm if already in progress or already warmed
  if (state.prewarmInProgress[toolKey] || state.prewarm[toolKey]) return;

  // Need an active worktree to prewarm against
  const wtPath = state.activeWorktreePath;
  if (!wtPath || state.prewarmSuspendedWorktrees.has(wtPath)) return;

  state.prewarmInProgress[toolKey] = true;

  const id = `term-${++state.terminalCounter}`;

  const result = await window.api.ptyCreate({ cwd: wtPath, id });
  if (!result.success) {
    console.warn(`[prewarm] Failed to create PTY for ${toolKey}:`, result.error);
    state.prewarmInProgress[toolKey] = false;
    return;
  }

  let launchCommand;
  try {
    launchCommand = await resolveToolLaunchOrThrow(tool.command, tool.launchArgs);
  } catch (error) {
    console.warn(`[prewarm] Failed to resolve launch command for ${toolKey}:`, error);
    window.api.ptyKill(id);
    state.prewarmInProgress[toolKey] = false;
    return;
  }

  let exitCleanup = () => {};
  const cleanup = () => {
    exitCleanup();
  };

  exitCleanup = window.api.onPtyExit(({ id: exitId }) => {
    if (exitId !== id) return;
    if (state.prewarm[toolKey]?.id !== id) return;
    cleanupPrewarm(toolKey);
    if (state.prewarmSuspendedWorktrees.has(wtPath)) return;
    setTimeout(() => {
      if (state.prewarmSuspendedWorktrees.has(wtPath)) return;
      createPrewarmedTerminal(toolKey);
    }, 1000);
  });

  // Send initial resize + launch the tool command
  setTimeout(() => {
    window.api.ptyResize(id, 120, 30);
    setTimeout(() => {
      window.api.ptyWrite(id, `${launchCommand}\r`);
    }, 500);
  }, 100);

  // Store as prewarmed backend session only
  state.prewarm[toolKey] = {
    id,
    cleanup,
    cwd: wtPath,
    worktreePath: wtPath,
    launchCommand,
  };
  state.prewarmInProgress[toolKey] = false;

  console.log(`[prewarm] ${tool.label} session ready (${id}) for ${wtPath}`);
}

/** Get worktree display name for a path */
function getWorktreeNameForPath(wtPath) {
  for (const p of state.projects) {
    const wt = (p.worktrees || []).find((w) => w.path === wtPath);
    if (wt) return wt.name;
  }
  return 'Terminal';
}

/** Clean up a prewarmed session without promoting it */
function cleanupPrewarm(toolKey) {
  const pw = state.prewarm[toolKey];
  if (!pw) return;

  pw.cleanup();
  window.api.ptyKill(pw.id);
  state.prewarm[toolKey] = null;
}

/**
 * Promote a prewarmed terminal into a visible tab.
 * Returns true if promotion succeeded, false if no prewarm available.
 */
function promotePrewarmedTerminal(toolKey) {
  const pw = state.prewarm[toolKey];
  if (!pw) return false;

  const tool = getToolTabByKey(toolKey);
  const { wtPath, wtName } = getActiveWorktreeInfo();

  // Check if the prewarmed session matches the current worktree
  if (pw.worktreePath !== wtPath) {
    // Mismatch — discard and fall through to normal creation
    cleanupPrewarm(toolKey);
    return false;
  }

  const id = pw.id;
  const tabLabel = buildToolTabLabel(tool, wtName);
  const terminalBehavior = normalizeTerminalBehavior(tool.behavior);

  const term = new Terminal({
    theme: WT_THEME,
    fontFamily: "'Cascadia Mono', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.2,
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    allowProposedApi: true,
    scrollback: 10000,
    tabStopWidth: 4,
  });
  const fitAddon = new FitAddon();
  loadRendererAddons(term, fitAddon);

  const paneEl = document.createElement('div');
  paneEl.className = 'terminal-pane';
  paneEl.id = `pane-${id}`;
  dom.terminalContainer.appendChild(paneEl);
  term.open(paneEl);
  const cleanupBehavior = applyTerminalBehavior(term, terminalBehavior);

  const cleanup = attachPtyToTerminal(id, term, fitAddon, paneEl, cleanupBehavior);

  // Register in the terminals map
  state.terminals.set(id, {
    term,
    fitAddon,
    paneEl,
    name: tabLabel,
    cwd: pw.cwd,
    worktreePath: pw.worktreePath,
    iconKey: tool.iconKey,
    behavior: terminalBehavior,
    cleanup,
  });

  // Clear the prewarm slot
  state.prewarm[toolKey] = null;

  // Switch worktree context and create tab
  state.activeWorktreePath = wtPath;
  rebuildTabsForWorktree(wtPath);
  switchToTerminal(id);

  // Fit the promoted terminal
  setTimeout(() => {
    fitAddon.fit();
    window.api.ptyResize(id, term.cols, term.rows);
  }, 50);

  console.log(`[prewarm] Promoted ${tool.label} session (${id})`);

  // Prewarm the next one
  setTimeout(() => createPrewarmedTerminal(toolKey), 500);

  return true;
}

/** Prewarm all tool sessions for the current worktree */
function prewarmAllTools() {
  if (!state.activeWorktreePath) return;
  for (const toolKey of Object.keys(PREWARM_TOOLS)) {
    createPrewarmedTerminal(toolKey);
  }
}

/** Discard and re-prewarm when the active worktree changes */
function reprewarmForWorktree() {
  for (const toolKey of Object.keys(PREWARM_TOOLS)) {
    // Discard existing prewarm if it doesn't match
    const pw = state.prewarm[toolKey];
    if (pw && pw.worktreePath !== state.activeWorktreePath) {
      cleanupPrewarm(toolKey);
    }
    createPrewarmedTerminal(toolKey);
  }
}

/** Get all terminal IDs belonging to a given worktree path */
function getTerminalsForWorktree(wtPath) {
  const ids = [];
  for (const [id, info] of state.terminals) {
    if (info.worktreePath === wtPath) ids.push(id);
  }
  return ids;
}

async function closeWorktreeOwnedSessions(wtPath) {
  state.prewarmSuspendedWorktrees.add(wtPath);

  const terminalIds = [...getTerminalsForWorktree(wtPath)];
  for (const id of terminalIds) {
    closeTerminal(id);
  }

  for (const toolKey of Object.keys(PREWARM_TOOLS)) {
    if (state.prewarm[toolKey]?.worktreePath === wtPath) {
      cleanupPrewarm(toolKey);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function releaseWorktreeOwnedSessions(wtPath) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  state.prewarmSuspendedWorktrees.delete(wtPath);
}

/** Rebuild the tab bar to show only terminals for the given worktree */
function rebuildTabsForWorktree(wtPath) {
  // Remove all existing tab buttons from the scrollable list
  dom.tabListScroll.querySelectorAll('.terminal-tab').forEach((t) => t.remove());

  // Insert tabs for this worktree
  const ids = getTerminalsForWorktree(wtPath);
  for (const id of ids) {
    const info = state.terminals.get(id);
    if (info) insertTab(id, info.name);
  }
}

/** Insert a single tab button into the vertical tab list */
function insertTab(id, name) {
  const info = state.terminals.get(id);
  const iconKey = info?.iconKey || 'terminal';
  const iconMarkup = icons[iconKey] || icons.terminal;
  const iconClass = `${iconKey}-icon`;
  const tab = document.createElement('button');
  tab.className = 'terminal-tab';
  tab.dataset.termId = id;
  tab.innerHTML = `
    <span class="terminal-tab-icon ${iconClass}">${iconMarkup}</span>
    <span class="terminal-tab-name">${esc(name)}</span>
    <button class="terminal-tab-close" data-close-term="${id}" title="Close">${icons.close}</button>
  `;
  // Append to the scrollable tab list
  dom.tabListScroll.appendChild(tab);

  // Switch on click
  tab.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof Element && target.closest('.terminal-tab-close')) return;
    switchToTerminal(id);
  });

  // Close on X click
  tab.querySelector('.terminal-tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTerminal(id);
  });
}

function isTerminalScreenVisible() {
  return dom.terminalScreen ? !dom.terminalScreen.classList.contains('hidden') : false;
}

async function showTerminalScreen() {
  // Exit other screens
  dom.settingsScreen?.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');

  if (dom.terminalScreen) {
    dom.terminalScreen.classList.remove('hidden');
  }
  if (dom.btnTerminalScreen) {
    dom.btnTerminalScreen.classList.add('active');
  }
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');

  const activeWorktreePath = state.activeWorktreePath;
  const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'active workspace';
  if (dom.terminalScreenActiveName) {
    dom.terminalScreenActiveName.textContent = activeWorktreeName;
  }

  // Check if active worktree has terminals
  const wtTerminals = getTerminalsForWorktree(activeWorktreePath);
  if (wtTerminals.length > 0) {
    if (dom.terminalEmptyState) dom.terminalEmptyState.classList.add('hidden');
    const savedId = state.worktreeActiveTerminal.get(activeWorktreePath);
    if (savedId && state.terminals.has(savedId)) {
      switchToTerminal(savedId);
    } else {
      switchToTerminal(wtTerminals[wtTerminals.length - 1]);
    }
  } else if (activeWorktreePath) {
    // If no terminal exists for this worktree yet, auto-create the initial shell
    await createTerminal(activeWorktreePath, activeWorktreeName, {
      worktreePath: activeWorktreePath,
    });
  } else if (state.projects && state.projects.length > 0) {
    const p = state.projects.find((proj) => proj.path === state.selectedProjectPath) || state.projects[0];
    const wt = (p.worktrees && p.worktrees[0]) ? p.worktrees[0].path : p.path;
    await createTerminal(wt, p.name);
  } else {
    if (dom.terminalEmptyState) dom.terminalEmptyState.classList.remove('hidden');
  }

  fitActiveTerminal();
}

function hideTerminalScreen() {
  if (dom.terminalScreen) {
    dom.terminalScreen.classList.add('hidden');
  }
  if (dom.btnTerminalScreen) {
    dom.btnTerminalScreen.classList.remove('active');
  }
  startAutoRefreshLoop();
}

/** Switch the active worktree context */
function switchWorktreeContext(wtPath) {
  // Exit other screens if active
  dom.settingsScreen.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');

  if (state.activeWorktreePath === wtPath) {
    rebuildTabsForWorktree(wtPath);
    updateSidebarActiveState();
    return;
  }

  // Save current active terminal for the old worktree
  if (state.activeWorktreePath && state.activeTerminalId) {
    state.worktreeActiveTerminal.set(state.activeWorktreePath, state.activeTerminalId);
  }

  state.activeWorktreePath = wtPath;

  // Set selected project based on active worktree path
  const project = state.projects?.find((p) => (p.worktrees || []).some((wt) => wt.path === wtPath));
  if (project && state.selectedProjectPath !== project.path) {
    state.selectedProjectPath = project.path;
    renderSidebar(); // Redraw sidebar to show the selected project
  }

  rebuildTabsForWorktree(wtPath);

  // If the terminal screen is currently visible, update terminal view
  if (isTerminalScreenVisible()) {
    const activeWorktreeName = wtPath ? wtPath.split(/[\\/]/).pop() : 'active workspace';
    if (dom.terminalScreenActiveName) dom.terminalScreenActiveName.textContent = activeWorktreeName;

    const savedId = state.worktreeActiveTerminal.get(wtPath);
    const wtTerminals = getTerminalsForWorktree(wtPath);

    if (savedId && state.terminals.has(savedId)) {
      switchToTerminal(savedId);
    } else if (wtTerminals.length > 0) {
      switchToTerminal(wtTerminals[wtTerminals.length - 1]);
    } else {
      // No terminals for this worktree
      state.activeTerminalId = null;
      dom.terminalContainer.querySelectorAll('.terminal-pane').forEach((p) => {
        p.classList.remove('active');
      });
      dom.tabListScroll.querySelectorAll('.terminal-tab').forEach((t) => {
        t.classList.remove('active');
      });
      if (dom.terminalEmptyState) dom.terminalEmptyState.classList.remove('hidden');
    }
  }

  updateSidebarActiveState();

  // If other screens are open, update them
  if (dom.symlinkScreen && !dom.symlinkScreen.classList.contains('hidden')) {
    void showSymlinkScreen();
  }
  if (dom.agentToolkitScreen && !dom.agentToolkitScreen.classList.contains('hidden')) {
    void showAgentToolkitScreen();
  }

  // Re-prewarm tool sessions for the new worktree
  reprewarmForWorktree();
}

async function openProjectWorkspaceAndTerminal(projectPath) {
  const project = state.projects.find((p) => p.path === projectPath);
  if (!project || !project.worktrees || project.worktrees.length === 0) return;

  // Determine the target worktree
  let targetWt = project.worktrees.find((w) => w.path === state.activeWorktreePath);
  if (!targetWt) {
    targetWt = project.worktrees.find((w) => getTerminalsForWorktree(w.path).length > 0);
  }
  if (!targetWt) {
    targetWt = project.worktrees.find((w) => state.worktreeActiveTerminal.has(w.path));
  }
  if (!targetWt) {
    targetWt = project.worktrees[0];
  }

  if (targetWt) {
    switchWorktreeContext(targetWt.path);
  }
}

function switchToTerminal(id) {
  // Exit other screens if active
  dom.settingsScreen.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');

  const termInfo = state.terminals.get(id);
  if (!termInfo) return;

  state.activeTerminalId = id;

  // If the terminal belongs to a different worktree, switch context first
  if (termInfo.worktreePath !== state.activeWorktreePath) {
    state.activeWorktreePath = termInfo.worktreePath;
    rebuildTabsForWorktree(termInfo.worktreePath);

    // Set selected project based on active worktree path
    const project = state.projects?.find((p) => (p.worktrees || []).some((wt) => wt.path === termInfo.worktreePath));
    if (project && state.selectedProjectPath !== project.path) {
      state.selectedProjectPath = project.path;
      renderSidebar(); // Redraw sidebar to show the selected project
    }
  }

  // Remember this as the last active terminal for its worktree
  state.worktreeActiveTerminal.set(termInfo.worktreePath, id);

  // Update tab active state
  dom.tabListScroll.querySelectorAll('.terminal-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.termId === id);
  });

  // Update pane visibility — show only panes for current worktree context
  dom.terminalContainer.querySelectorAll('.terminal-pane').forEach((p) => {
    p.classList.remove('active');
  });
  termInfo.paneEl.classList.add('active');

  // Hide empty state if present
  if (dom.terminalEmptyState) dom.terminalEmptyState.classList.add('hidden');

  // Focus and fit
  requestAnimationFrame(() => {
    termInfo.fitAddon.fit();
    termInfo.term.focus();
  });

  // Update sidebar active state
  updateSidebarActiveState();
}

function closeTerminal(id) {
  const termInfo = state.terminals.get(id);
  if (!termInfo) return;

  const wtPath = termInfo.worktreePath;

  // Cleanup listeners
  termInfo.cleanup();
  termInfo.term.dispose();
  termInfo.paneEl.remove();

  // Kill PTY
  window.api.ptyKill(id);

  // Remove tab from tab bar
  const tab = dom.tabListScroll.querySelector(`[data-term-id="${id}"]`);
  if (tab) tab.remove();

  state.terminals.delete(id);

  // Clean up worktree active tracking
  if (state.worktreeActiveTerminal.get(wtPath) === id) {
    state.worktreeActiveTerminal.delete(wtPath);
  }

  // Switch to another terminal within the SAME worktree, or show empty state
  if (state.activeTerminalId === id) {
    const remaining = getTerminalsForWorktree(wtPath);
    if (remaining.length > 0) {
      switchToTerminal(remaining[remaining.length - 1]);
    } else {
      state.activeTerminalId = null;
      if (dom.terminalEmptyState) dom.terminalEmptyState.classList.remove('hidden');
    }
  }
}

function fitActiveTerminal() {
  if (state.activeTerminalId) {
    const termInfo = state.terminals.get(state.activeTerminalId);
    if (termInfo) {
      requestAnimationFrame(() => termInfo.fitAddon.fit());
    }
  }
}

function getRequiredActiveWorktreePath() {
  if (!state.activeWorktreePath) {
    showToast('Select a worktree first', 'info');
    return null;
  }

  return state.activeWorktreePath;
}

function loadWorkspaceSidebarCollapsed() {
  try {
    const val = localStorage.getItem(WORKSPACE_SIDEBAR_COLLAPSED_KEY);
    return val === null ? true : val === 'true';
  } catch (error) {
    console.warn('Failed to read workspace sidebar preference:', error.message);
    return true;
  }
}

function saveWorkspaceSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(WORKSPACE_SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch (error) {
    console.warn('Failed to save workspace sidebar preference:', error.message);
  }
}

function setWorkspaceSidebarCollapsed(collapsed, { persist = true } = {}) {
  state.workspaceSidebarCollapsed = collapsed;

  if (
    collapsed &&
    dom.workspaceSidebar.contains(document.activeElement) &&
    document.activeElement !== dom.btnToggleWorkspaceSidebar
  ) {
    dom.btnToggleWorkspaceSidebar.focus();
  }

  dom.workspaceSidebar.classList.toggle('workspace-sidebar-collapsed', collapsed);
  dom.btnToggleWorkspaceSidebar.setAttribute('aria-expanded', String(!collapsed));

  const label = collapsed ? 'Expand workspace sidebar' : 'Collapse workspace sidebar';
  dom.btnToggleWorkspaceSidebar.setAttribute('aria-label', label);
  dom.btnToggleWorkspaceSidebar.title = label;

  if (persist) {
    saveWorkspaceSidebarCollapsed(collapsed);
  }

  fitActiveTerminal();

  let transitionHandled = false;
  const handleTransitionEnd = (event) => {
    if (event.target !== dom.workspaceSidebar || event.propertyName !== 'width') {
      return;
    }

    transitionHandled = true;
    dom.workspaceSidebar.removeEventListener('transitionend', handleTransitionEnd);
    fitActiveTerminal();
  };

  dom.workspaceSidebar.addEventListener('transitionend', handleTransitionEnd);

  window.setTimeout(() => {
    dom.workspaceSidebar.removeEventListener('transitionend', handleTransitionEnd);
    if (!transitionHandled) {
      fitActiveTerminal();
    }
  }, 360);
}

// Resize all terminals on window resize
window.addEventListener('resize', () => fitActiveTerminal());

// Right click context menu for selection copy
window.addEventListener('contextmenu', (e) => {
  let selectedText = '';
  
  // 1. Check if the target is within a terminal pane
  const terminalPane = (e.target as HTMLElement).closest('.terminal-pane');
  if (terminalPane) {
    const paneId = terminalPane.id; // e.g. "pane-term-1"
    const termId = paneId.replace('pane-', '');
    const termInfo = state.terminals.get(termId);
    if (termInfo && termInfo.term && termInfo.term.hasSelection()) {
      selectedText = termInfo.term.getSelection();
    }
  }
  
  // 2. If no terminal selection, check standard DOM selection
  if (!selectedText) {
    const domSelection = window.getSelection() ? window.getSelection().toString() : '';
    if (domSelection) {
      selectedText = domSelection;
    }
  }

  // 3. If there is selected text, show context menu
  if (selectedText) {
    e.preventDefault();
    e.stopPropagation();
    showSelectionContextMenu(e.clientX, e.clientY, selectedText);
  }
});

// ── Tab Sidebar Collapse Toggle ────────────────────────
function loadTabSidebarCollapsed() {
  try {
    const val = localStorage.getItem(TAB_SIDEBAR_COLLAPSED_KEY);
    return val === 'true';
  } catch (error) {
    return false;
  }
}

function saveTabSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(TAB_SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch (error) {
    console.warn('Failed to save tab sidebar preference:', error.message);
  }
}

function setTabSidebarCollapsed(collapsed, { persist = true } = {}) {
  state.tabSidebarCollapsed = collapsed;
  dom.terminalTabs.classList.toggle('collapsed', collapsed);
  dom.tabCollapseBtn.title = collapsed ? 'Expand tabs' : 'Collapse tabs';
  if (persist) saveTabSidebarCollapsed(collapsed);
  fitActiveTerminal();
  // Fit again after the transition finishes
  setTimeout(() => fitActiveTerminal(), 280);
}

dom.tabCollapseBtn.addEventListener('click', () => {
  setTabSidebarCollapsed(!state.tabSidebarCollapsed);
});

// ── New Tab Dropdown ───────────────────────────────────
function getActiveWorktreeInfo() {
  const wtPath = state.activeWorktreePath;
  if (!wtPath) {
    const fallbackPath = state.projects[0]?.worktrees?.[0]?.path || '.';
    return { wtPath: fallbackPath, wtName: 'Terminal' };
  }
  let wtName = 'Terminal';
  for (const p of state.projects) {
    const wt = (p.worktrees || []).find((w) => w.path === wtPath);
    if (wt) { wtName = wt.name; break; }
  }
  return { wtPath, wtName };
}

function createNewTerminalTab() {
  const { wtPath, wtName } = getActiveWorktreeInfo();
  if (state.useExternalWt) {
    window.api.openWindowsTerminal({
      cwd: wtPath,
    });
    return;
  }

  const count = getTerminalsForWorktree(wtPath).length + 1;
  createTerminal(wtPath, `${wtName} (${count})`, {
    worktreePath: wtPath,
    iconKey: state.useExternalWt ? 'windows-terminal' : 'terminal',
  });
}

function createToolTab(toolKey) {
  const tool = getToolTabByKey(toolKey);
  if (!tool) {
    showToast(`Unknown tool: ${toolKey}`, 'error');
    return;
  }

  const { wtPath, wtName } = getActiveWorktreeInfo();

  if (state.useExternalWt) {
    void window.api.openWindowsTerminal({
      cwd: wtPath,
      launchCommand: tool.command,
      launchArgs: tool.launchArgs,
    });
    return;
  }

  if (tool.prewarm && promotePrewarmedTerminal(tool.key)) {
    return;
  }

  const tabLabel = buildToolTabLabel(tool, wtName);
  createDirectToolTerminal(wtPath, tabLabel, {
    command: tool.command,
    launchArgs: tool.launchArgs,
    worktreePath: wtPath,
    iconKey: tool.iconKey,
    behavior: tool.behavior,
  });
}

async function launchScrcpyCliTerminal() {
  if (!isTerminalScreenVisible()) {
    await showTerminalScreen();
  }
  const { wtPath, wtName } = getActiveWorktreeInfo();
  if (state.useExternalWt) {
    void window.api.openWindowsTerminal({
      cwd: wtPath,
      launchCommand: 'scrcpy-cli',
      launchArgs: [],
    });
    return;
  }
  await createDirectToolTerminal(wtPath, `Scrcpy CLI: ${wtName}`, {
    command: 'scrcpy-cli',
    launchArgs: [],
    worktreePath: wtPath,
    iconKey: 'screen',
    behavior: { forceMouseMode: false },
  });
}

function showTabDropdown() {
  hideTabDropdown();
  hideProjectOptionsMenu();
  hideWorktreeContextMenu();
  hideSelectionContextMenu();

  const dropdown = showPositionedMenu({
    id: 'tab-dropdown',
    className: 'tab-dropdown',
    anchorRect: dom.tabNewBtn.getBoundingClientRect(),
    html: `
      ${menuItemHTML({
        action: 'new-terminal',
        icon: state.useExternalWt ? icons['windows-terminal'] : icons.terminal,
        label: state.useExternalWt ? 'Windows Terminal' : 'Terminal',
        iconClass: state.useExternalWt ? 'windows-terminal-icon' : 'terminal-icon',
      })}
      ${renderToolDropdownItems()}
    `,
    outsideClickHandler: handleDropdownOutsideClick,
  });

  bindMenuActions(dropdown, {
    'new-terminal': () => createNewTerminalTab(),
    ...Object.fromEntries(
      Object.values(TOOL_TABS).map((tool) => [tool.action, () => createToolTab(tool.key)])
    ),
  }, hideTabDropdown);
}

function hideTabDropdown() {
  const existing = document.getElementById('tab-dropdown');
  if (existing) existing.remove();
  document.removeEventListener('click', handleDropdownOutsideClick);
}

function handleDropdownOutsideClick(e) {
  const dropdown = document.getElementById('tab-dropdown');
  if (dropdown && !dropdown.contains(e.target) && !dom.tabNewBtn.contains(e.target)) {
    hideTabDropdown();
  }
}

function showWorktreeContextMenu(project, wt, x, y) {
  hideWorktreeContextMenu();
  hideProjectOptionsMenu();
  hideTabDropdown();
  hideSelectionContextMenu();
  const canAddSubWorktree = getDomainCanCreateNestedWorktree(project, wt);
  const canDeleteBranch = Boolean(wt.branch) && !wt.detached && !wt.bare;

  const menu = showPositionedMenu({
    id: 'worktree-context-menu',
    className: 'worktree-context-menu tab-dropdown',
    x,
    y,
    html: `
      ${menuItemHTML({ action: 'open-terminal', icon: icons.terminal, label: 'Open in Terminal' })}
      ${menuDividerHTML()}
      ${canAddSubWorktree ? `${menuItemHTML({ action: 'add-sub-worktree', icon: icons.plus, label: 'Add nested worktree' })}${menuDividerHTML()}` : ''}
      ${menuItemHTML({ action: 'merge-to-local-branch', icon: icons.gitBranch, label: 'Merge to local branch' })}
      ${menuDividerHTML()}
      ${menuItemHTML({ action: 'force-remove-worktree', icon: icons.trash, label: 'Force remove worktree', title: canDeleteBranch ? `Force remove worktree. Modal can delete branch ${wt.branch}.` : 'Force remove worktree. Branch deletion unavailable for this worktree.', danger: true })}
    `,
    outsideClickHandler: handleWorktreeContextMenuOutsideClick,
  });

  bindMenuActions(menu, {
    'open-terminal': () => {
      switchWorktreeContext(wt.path);
      showTerminalScreen();
    },
    'add-sub-worktree': () => showAddSubWorktreeModal(project, wt),
    'merge-to-local-branch': () => showMergeWorktreeModal(project, wt),
    'force-remove-worktree': () => showForceRemoveWorktreeModal(project, wt),
  }, hideWorktreeContextMenu);
}

function hideWorktreeContextMenu() {
  const existing = document.getElementById('worktree-context-menu');
  if (existing) existing.remove();
  document.removeEventListener('click', handleWorktreeContextMenuOutsideClick);
}

function handleWorktreeContextMenuOutsideClick(e) {
  const menu = document.getElementById('worktree-context-menu');
  if (menu && !menu.contains(e.target)) {
    hideWorktreeContextMenu();
  }
}

function showProjectOptionsMenu(project, x, y) {
  hideProjectOptionsMenu();
  hideWorktreeContextMenu();
  hideTabDropdown();
  hideSelectionContextMenu();

  const menu = showPositionedMenu({
    id: 'project-options-menu',
    className: 'project-options-menu tab-dropdown',
    x,
    y,
    html: `
      ${menuItemHTML({ action: 'add-wt', icon: icons.plus, label: 'Add worktree' })}
      ${menuItemHTML({ action: 'create-branch', icon: icons.gitBranch, label: 'Create branch' })}
      ${menuItemHTML({ action: 'fetch', icon: icons.download, label: 'Fetch' })}
      ${menuDividerHTML()}
      ${menuItemHTML({ action: 'remove', icon: icons.trash, label: 'Remove project', danger: true })}
    `,
    outsideClickHandler: handleProjectOptionsMenuOutsideClick,
  });

  bindMenuActions(menu, {
    'create-branch': () => showCreateBranchModal(project),
    'add-wt': () => showAddWorktreeModal(project),
    'fetch': async () => {
      showToast('Fetching...', 'info');
      const result = await window.api.gitFetch(project.path);
      showToast(result.success ? 'Fetch complete' : `Fetch failed: ${result.error}`, result.success ? 'success' : 'error');
      if (result.success) await loadWorkspaces();
    },
    'remove': async () => {
      await window.api.removeProject(project.path);
      showToast(`Removed: ${project.name}`, 'info');
      await loadWorkspaces();
    },
  }, hideProjectOptionsMenu);
}

function hideProjectOptionsMenu() {
  const existing = document.getElementById('project-options-menu');
  if (existing) existing.remove();
  document.removeEventListener('click', handleProjectOptionsMenuOutsideClick);
}

function handleProjectOptionsMenuOutsideClick(e) {
  const menu = document.getElementById('project-options-menu');
  if (menu && !menu.contains(e.target)) {
    hideProjectOptionsMenu();
  }
}

function showSelectionContextMenu(x, y, text) {
  hideWorktreeContextMenu();
  hideProjectOptionsMenu();
  hideTabDropdown();
  hideSelectionContextMenu();

  const menu = showPositionedMenu({
    id: 'selection-context-menu',
    className: 'selection-context-menu tab-dropdown',
    x,
    y,
    html: menuItemHTML({ action: 'copy-selection', icon: icons.copy, label: 'Copy' }),
    outsideClickHandler: handleSelectionContextMenuOutsideClick,
  });

  bindMenuActions(menu, {
    'copy-selection': async () => {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'info');
    }
  }, hideSelectionContextMenu);
}

function hideSelectionContextMenu() {
  const existing = document.getElementById('selection-context-menu');
  if (existing) existing.remove();
  document.removeEventListener('click', handleSelectionContextMenuOutsideClick);
}

function handleSelectionContextMenuOutsideClick(e) {
  const menu = document.getElementById('selection-context-menu');
  if (menu && !menu.contains(e.target)) {
    hideSelectionContextMenu();
  }
}

// New tab button — show dropdown menu
dom.tabNewBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const existing = document.getElementById('tab-dropdown');
  if (existing) {
    hideTabDropdown();
  } else {
    showTabDropdown();
  }
});

// Tab bar external tool buttons
bindWorktreeQuickAction(dom.btnAntigravity, (wtPath) => window.api.openInAntigravity(wtPath), 'Opening Antigravity...');
bindWorktreeQuickAction(dom.btnAntigravityAgent, (wtPath) => window.api.openInAntigravityAgent(wtPath), 'Opening Agent Manager...');


if (dom.btnScrcpyCapture) {
  dom.btnScrcpyCapture.addEventListener('click', async () => {
    const activeWorktreePath = getRequiredActiveWorktreePath();
    if (!activeWorktreePath) return;
    showToast('Capturing screenshot and UI hierarchy...', 'info');
    const res = await window.api.scrcpyCaptureUi({ worktreePath: activeWorktreePath });
    if (res?.success) {
      showToast(`UI evidence captured: ${res.relativeScreenshot}`, 'success');
    } else {
      showToast(`UI Capture failed: ${res?.error || 'Make sure device is connected'}`, 'error');
    }
  });
}

if (dom.btnFigma) {
  dom.btnFigma.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    const figmaUrl = (activeProject?.figmaUrl || '').trim();
    if (figmaUrl) {
      showToast(`Opening Figma for ${activeProject?.name || 'project'}...`, 'info');
      const res = await window.api.openInFigma(figmaUrl);
      if (res && !res.success && res.error) {
        showToast(`Failed to open Figma: ${res.error}`, 'error');
      }
    } else {
      showToast('Opening Figma Desktop...', 'info');
      const res = await window.api.openInFigma();
      if (res && !res.success && res.error) {
        showToast(`Failed to open Figma: ${res.error}`, 'error');
      }
    }
  });
}

if (dom.btnObsidian) {
  dom.btnObsidian.addEventListener('click', async () => {
    const wtPath = state.activeWorktreePath;
    showToast('Opening Obsidian...', 'info');
    const res = await window.api.openInObsidian(wtPath || undefined);
    if (res && !res.success && res.error) {
      showToast(`Failed to open Obsidian: ${res.error}`, 'error');
    }
  });
}

bindWorktreeQuickAction(dom.btnVsCode, (wtPath) => window.api.openInEditor(wtPath), 'Opening Spec Editor...');
bindWorktreeQuickAction(dom.btnExplorer, (wtPath) => window.api.openInExplorer(wtPath), 'Opening Explorer...');

// ═══════════════════════════════════════════════════════
// DASHBOARD PROJECT & BA ASSET VIEWER
// ═══════════════════════════════════════════════════════

function getActiveProjectAndWorktree() {
  const activeWtPath = state.activeWorktreePath;
  let activeProject: any = null;
  let activeWt: any = null;

  if (activeWtPath && state.projects) {
    for (const p of state.projects) {
      const found = (p.worktrees || []).find((w: any) => w.path === activeWtPath);
      if (found) {
        activeProject = p;
        activeWt = found;
        break;
      }
    }
  }

  if (!activeProject && state.projects && state.projects.length > 0) {
    activeProject = state.projects.find((p: any) => p.path === state.selectedProjectPath) || state.projects[0];
    if (activeProject?.worktrees && activeProject.worktrees.length > 0) {
      activeWt = activeProject.worktrees[0];
    }
  }

  return { activeProject, activeWt };
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function checkDashboardAdbDevice() {
  if (!dom.dashDeviceText || !dom.dashChipDeviceDot) return;
  try {
    const res = await window.api.deviceList();
    if (res?.success && res.devices?.length) {
      const active = res.devices.find((d: any) => d.isActive) || res.devices[0];
      dom.dashChipDeviceDot.className = 'dash-chip-dot online';
      const label = active.marketName || active.model || active.serial;
      dom.dashDeviceText.textContent = `ADB: ${label} (${res.devices.length} connected)`;
      if (dom.dashChipDevice) {
        dom.dashChipDevice.title = `Active device: ${label} (${active.serial})\nTotal connected: ${res.devices.length}\nClick to open Device Manager`;
      }
    } else {
      dom.dashChipDeviceDot.className = 'dash-chip-dot';
      dom.dashDeviceText.textContent = 'ADB: No devices connected';
      if (dom.dashChipDevice) {
        dom.dashChipDevice.title = 'No Android devices connected. Click to open Device Manager';
      }
    }
  } catch {
    dom.dashChipDeviceDot.className = 'dash-chip-dot';
    dom.dashDeviceText.textContent = 'ADB: Offline';
  }
}

function updateSidebarFigmaButton(activeProject?: any) {
  if (!dom.btnFigma) return;
  if (!activeProject) {
    const res = getActiveProjectAndWorktree();
    activeProject = res.activeProject;
  }
  const figmaUrl = (activeProject?.figmaUrl || '').trim();
  const figmaBadge = document.getElementById('btn-figma-badge');

  if (figmaUrl) {
    const name = activeProject?.name || 'Project';
    dom.btnFigma.title = `Open Figma: ${name}\n${figmaUrl}`;
    dom.btnFigma.classList.add('has-link');
    if (figmaBadge) {
      figmaBadge.textContent = 'Linked';
      figmaBadge.className = 'workspace-tool-pill connected';
      figmaBadge.style.display = 'inline-flex';
    }
  } else {
    dom.btnFigma.title = 'Open Figma Desktop (No link configured for active project)';
    dom.btnFigma.classList.remove('has-link');
    if (figmaBadge) {
      figmaBadge.style.display = 'none';
    }
  }
}

function renderDashboardFigma(activeProject: any) {
  updateSidebarFigmaButton(activeProject);
  if (!dom.dashFigmaBody) return;
  const figmaUrl = (activeProject.figmaUrl || '').trim();

  if (figmaUrl) {
    if (dom.dashFigmaStatusPill) {
      dom.dashFigmaStatusPill.textContent = 'Linked';
      dom.dashFigmaStatusPill.className = 'dash-status-pill connected';
    }
    if (dom.dashBtnOpenFigma) dom.dashBtnOpenFigma.style.display = 'inline-flex';
    if (dom.dashBtnBrowserFigma) dom.dashBtnBrowserFigma.style.display = 'inline-flex';

    const parsed = parseFigmaUrl(figmaUrl);
    const displayName = parsed?.fileName || `${activeProject.name || 'Project'} Design`;
    const displayUrl = formatDisplayUrl(figmaUrl);
    const typeLabel = parsed?.type || 'Design File';
    let typeClass = '';
    if (typeLabel === 'Prototype') typeClass = 'prototype';
    else if (typeLabel === 'FigJam Board') typeClass = 'board';

    dom.dashFigmaBody.innerHTML = `
      <div class="dash-figma-showcase">
        <div class="dash-figma-accent-bar"></div>
        <div class="dash-figma-top-bar">
          <div class="dash-figma-tag-group">
            <span class="dash-figma-type-pill ${typeClass}">
              <span class="dash-figma-pulse-dot"></span>
              ${esc(typeLabel)}
            </span>
            ${parsed?.nodeId ? `<span class="dash-figma-sub-pill">Node: ${esc(parsed.nodeId)}</span>` : ''}
          </div>
          <div class="dash-figma-top-actions">
            <button type="button" class="dash-figma-icon-btn" id="dash-btn-copy-figma" title="Copy Figma Link" aria-label="Copy Figma Link">
              ${icons.copy || ''}
            </button>
            <button type="button" class="dash-figma-icon-btn" id="dash-btn-edit-inline-figma" title="Edit Figma Link" aria-label="Edit Figma Link">
              ${EDIT_PENCIL_SVG}
            </button>
            <button type="button" class="dash-figma-icon-btn danger" id="dash-btn-clear-figma" title="Clear Figma Link" aria-label="Clear Figma Link">
              ${icons.trash || ''}
            </button>
          </div>
        </div>

        <div class="dash-figma-main-info">
          <div class="dash-figma-brand-emblem" title="Figma Design">
            ${FIGMA_COLORED_LOGO}
          </div>
          <div class="dash-figma-meta">
            <h4 class="dash-figma-title" title="${esc(displayName)}">${esc(displayName)}</h4>
            <a href="${esc(figmaUrl)}" class="dash-figma-url-pill" id="dash-figma-url-anchor" title="${esc(figmaUrl)}" target="_blank">
              <span class="dash-figma-url-text">${esc(displayUrl)}</span>
              ${icons.link || ''}
            </a>
          </div>
        </div>

        <div class="dash-figma-action-footer">
          <button type="button" class="btn-figma-launch" id="dash-btn-card-open-figma" title="Launch Figma Desktop App">
            ${icons.figma || '<img src="icons/figma.svg" width="12" height="12" />'}
            <span>Open in Figma</span>
          </button>
          <button type="button" class="btn-figma-browser" id="dash-btn-card-browser-figma" title="Open Figma link in browser">
            ${icons.link || ''}
            <span>Browser</span>
          </button>
        </div>
      </div>
    `;

    const cardOpenBtn = dom.dashFigmaBody.querySelector('#dash-btn-card-open-figma');
    cardOpenBtn?.addEventListener('click', async () => {
      showToast('Opening Figma...', 'info');
      await window.api.openInFigma(figmaUrl);
    });

    const cardBrowserBtn = dom.dashFigmaBody.querySelector('#dash-btn-card-browser-figma');
    cardBrowserBtn?.addEventListener('click', async () => {
      await window.api.openExternal(figmaUrl);
    });

    const copyBtn = dom.dashFigmaBody.querySelector('#dash-btn-copy-figma');
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(figmaUrl);
      showToast('Figma URL copied to clipboard', 'info');
    });

    const urlAnchor = dom.dashFigmaBody.querySelector('#dash-figma-url-anchor');
    urlAnchor?.addEventListener('click', (e: Event) => {
      e.preventDefault();
      void window.api.openExternal(figmaUrl);
    });

    const editBtn = dom.dashFigmaBody.querySelector('#dash-btn-edit-inline-figma');
    editBtn?.addEventListener('click', () => {
      renderFigmaInlineEdit(activeProject, figmaUrl);
    });

    const clearBtn = dom.dashFigmaBody.querySelector('#dash-btn-clear-figma');
    clearBtn?.addEventListener('click', async () => {
      const res = await window.api.updateProjectMetadata(activeProject.path, { figmaUrl: '' });
      if (res?.success) {
        showToast('Figma link cleared', 'info');
        activeProject.figmaUrl = '';
        renderDashboardFigma(activeProject);
      } else {
        showToast(`Failed to clear: ${res?.error || 'Unknown error'}`, 'error');
      }
    });
  } else {
    if (dom.dashFigmaStatusPill) {
      dom.dashFigmaStatusPill.textContent = 'Not Linked';
      dom.dashFigmaStatusPill.className = 'dash-status-pill';
    }
    if (dom.dashBtnOpenFigma) dom.dashBtnOpenFigma.style.display = 'none';
    if (dom.dashBtnBrowserFigma) dom.dashBtnBrowserFigma.style.display = 'none';

    dom.dashFigmaBody.innerHTML = `
      <div class="dash-figma-empty-showcase">
        <div class="dash-figma-empty-icon-wrap">
          <div class="dash-figma-empty-icon" title="Figma">
            ${FIGMA_COLORED_LOGO}
          </div>
        </div>
        <div class="dash-figma-empty-content">
          <div class="dash-figma-input-wrapper">
            <input type="text" class="dash-figma-input" id="dash-figma-quick-input" placeholder="Paste Figma design or prototype link..." autocomplete="off" spellcheck="false" />
            <button type="button" class="btn-figma-link-submit" id="dash-figma-quick-save">Link</button>
          </div>
        </div>
      </div>
    `;

    const quickInput = dom.dashFigmaBody.querySelector('#dash-figma-quick-input') as HTMLInputElement;
    const quickSave = dom.dashFigmaBody.querySelector('#dash-figma-quick-save') as HTMLButtonElement;

    quickSave?.addEventListener('click', async () => {
      const url = quickInput?.value.trim();
      if (!url) {
        showToast('Please enter a Figma URL', 'error');
        return;
      }
      const res = await window.api.updateProjectMetadata(activeProject.path, { figmaUrl: url });
      if (res?.success) {
        showToast('Figma link saved', 'success');
        activeProject.figmaUrl = url;
        renderDashboardFigma(activeProject);
      } else {
        showToast(`Failed to save: ${res?.error || 'Unknown error'}`, 'error');
      }
    });

    quickInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        quickSave?.click();
      }
    });
  }
}

function renderFigmaInlineEdit(activeProject: any, currentUrl: string) {
  if (!dom.dashFigmaBody) return;
  dom.dashFigmaBody.innerHTML = `
    <div class="dash-figma-edit-showcase">
      <div class="dash-figma-edit-header">
        ${icons.figma || ''}
        <span>Edit Figma Link</span>
      </div>
      <div class="dash-figma-input-wrapper">
        <input type="text" class="dash-figma-input" id="dash-figma-edit-input" value="${esc(currentUrl)}" placeholder="https://www.figma.com/design/..." autocomplete="off" spellcheck="false" />
        <button type="button" class="btn-figma-link-submit" id="dash-figma-edit-save">Save</button>
        <button type="button" class="btn-secondary btn-small" id="dash-figma-edit-cancel">Cancel</button>
      </div>
    </div>
  `;

  const editInput = dom.dashFigmaBody.querySelector('#dash-figma-edit-input') as HTMLInputElement;
  const editSave = dom.dashFigmaBody.querySelector('#dash-figma-edit-save') as HTMLButtonElement;
  const editCancel = dom.dashFigmaBody.querySelector('#dash-figma-edit-cancel') as HTMLButtonElement;

  editInput?.focus();
  editInput?.select();

  editSave?.addEventListener('click', async () => {
    const url = editInput?.value.trim();
    const res = await window.api.updateProjectMetadata(activeProject.path, { figmaUrl: url });
    if (res?.success) {
      showToast(url ? 'Figma link updated' : 'Figma link cleared', 'success');
      activeProject.figmaUrl = url;
      renderDashboardFigma(activeProject);
    } else {
      showToast(`Failed to update: ${res?.error || 'Unknown error'}`, 'error');
    }
  });

  editCancel?.addEventListener('click', () => {
    renderDashboardFigma(activeProject);
  });

  editInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      editSave?.click();
    } else if (e.key === 'Escape') {
      editCancel?.click();
    }
  });
}

function renderDashboardApk(activeProject: any) {
  if (!dom.dashApkList) return;
  const apkFiles = Array.isArray(activeProject.apkFiles) ? activeProject.apkFiles : [];

  if (dom.dashApkBadge) {
    dom.dashApkBadge.textContent = `${apkFiles.length} APK${apkFiles.length === 1 ? '' : 's'}`;
  }

  if (apkFiles.length === 0) {
    dom.dashApkList.innerHTML = `
      <div style="text-align: center; padding: 14px 12px; color: var(--text-muted); font-size: 12px;">
        No APK builds linked yet.
      </div>
    `;
    return;
  }

  dom.dashApkList.innerHTML = apkFiles.map((apk: any) => `
    <div class="dash-apk-item" data-apk-id="${esc(apk.id)}">
      <div class="dash-apk-item-left">
        <div class="dash-apk-file-icon">
          ${icons.device || '<img src="icons/device.svg" width="16" height="16" />'}
        </div>
        <div class="dash-apk-meta-group">
          <div class="dash-apk-name-row">
            <span class="dash-apk-title" title="${esc(apk.name)}">${esc(apk.name)}</span>
            <span class="dash-apk-size-pill">${formatBytes(apk.size)}</span>
          </div>
          <span class="dash-apk-path" title="${esc(apk.path)}">${esc(apk.path)}</span>
        </div>
      </div>
      <div class="dash-apk-item-actions">
        <button type="button" class="btn-apk-install" data-action="install-apk" data-path="${esc(apk.path)}" data-name="${esc(apk.name)}" title="Install this APK to connected Android device via adb">
          ${icons.download || ''}
          <span>Install to Device</span>
        </button>
        <button type="button" class="dash-icon-btn" data-action="reveal-apk" data-path="${esc(apk.path)}" title="Reveal in File Explorer">
          ${icons.folder || ''}
        </button>
        <button type="button" class="dash-icon-btn" data-action="remove-apk" data-id="${esc(apk.id)}" title="Remove APK from project">
          ${icons.trash || ''}
        </button>
      </div>
    </div>
  `).join('');

  dom.dashApkList.querySelectorAll('[data-action="install-apk"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const apkPath = target.dataset.path;
      const apkName = target.dataset.name || 'APK';
      if (!apkPath) return;

      const originalHtml = target.innerHTML;
      target.setAttribute('disabled', 'true');
      target.innerHTML = `<span class="spinner" style="width:12px; height:12px; border-width:2px;"></span> Installing...`;
      showToast(`Installing ${apkName} on Android device...`, 'info');

      try {
        const res = await window.api.installApk({ apkPath });
        if (res.success) {
          showToast(`Successfully installed ${apkName}!`, 'success');
        } else {
          showToast(`Install failed: ${res.error || 'Check device connection'}`, 'error');
        }
      } catch (err: any) {
        showToast(`Install error: ${err.message}`, 'error');
      } finally {
        target.removeAttribute('disabled');
        target.innerHTML = originalHtml;
      }
    });
  });

  dom.dashApkList.querySelectorAll('[data-action="reveal-apk"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const apkPath = target.dataset.path;
      if (apkPath) {
        void window.api.openInExplorer(apkPath);
      }
    });
  });

  dom.dashApkList.querySelectorAll('[data-action="remove-apk"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const apkId = target.dataset.id;
      if (!apkId) return;

      const res = await window.api.removeProjectApk(activeProject.path, apkId);
      if (res?.success) {
        showToast('APK removed from project', 'info');
        activeProject.apkFiles = (activeProject.apkFiles || []).filter((a: any) => a.id !== apkId);
        renderDashboardApk(activeProject);
      } else {
        showToast(`Failed: ${res?.error || 'Unknown error'}`, 'error');
      }
    });
  });
}

const COMPETITOR_THEMES = [
  { bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(14, 165, 233, 0.06))', border: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' },
  { bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(139, 92, 246, 0.06))', border: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' },
  { bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(5, 150, 105, 0.06))', border: 'rgba(16, 185, 129, 0.35)', color: '#34d399' },
  { bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.06))', border: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24' },
  { bg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16), rgba(225, 29, 72, 0.06))', border: 'rgba(244, 63, 94, 0.35)', color: '#fb7185' },
  { bg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(13, 148, 136, 0.06))', border: 'rgba(20, 184, 166, 0.35)', color: '#2dd4bf' },
];

function getCompetitorTheme(name: string) {
  let hash = 0;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COMPETITOR_THEMES.length;
  return COMPETITOR_THEMES[idx];
}

function getCompetitorInitials(name: string): string {
  if (!name) return 'CP';
  // Split camelCase boundaries (e.g. MoMo -> Mo Mo, YouTube -> You Tube)
  const expanded = String(name).replace(/([a-z])([A-Z])/g, '$1 $2');
  const clean = expanded.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (clean[0] || 'C').toUpperCase();
}

function formatCompetitorUrlLabel(rawUrl: string): { label: string; full: string } {
  if (!rawUrl) return { label: '', full: '' };
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.hostname.includes('play.google.com')) {
      return { label: 'Google Play', full: rawUrl };
    }
    if (parsed.hostname.includes('apple.com')) {
      return { label: 'App Store', full: rawUrl };
    }
    const cleanHost = parsed.hostname.replace(/^www\./, '');
    return { label: cleanHost, full: rawUrl };
  } catch {
    return { label: 'Store Link', full: rawUrl };
  }
}

function extractCompetitorFlows(notes: string): string {
  if (!notes) return 'onboarding';
  const clean = notes.replace(/[,\n\r;|\/]/g, ' ').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return 'onboarding';
  return words.slice(0, 2).join(' ').toLowerCase();
}

function renderDashboardCompetitors(activeProject: any, activeWt: any) {
  if (!dom.dashCompetitorList) return;
  const competitors = Array.isArray(activeProject.competitors) ? activeProject.competitors : [];

  if (dom.dashCompBadge) {
    dom.dashCompBadge.textContent = `${competitors.length} Competitor${competitors.length === 1 ? '' : 's'}`;
  }

  if (competitors.length === 0) {
    dom.dashCompetitorList.innerHTML = `
      <div class="dash-comp-empty">
        <div class="dash-comp-empty-icon">
          ${icons.agentToolkit || '<img src="icons/agent-toolkit.svg" width="22" height="22" />'}
        </div>
        <div class="dash-comp-empty-title">No Competitor Apps Configured</div>
        <div class="dash-comp-empty-desc">
          Add rival Android apps to benchmark user flows and run automated agent audits with <code>/ba-competitor</code>.
        </div>
        <button type="button" class="btn-primary btn-small dash-comp-empty-btn" id="dash-btn-empty-add-comp">
          ${icons.plus || '+'}
          <span>Add Competitor App</span>
        </button>
      </div>
    `;

    const emptyAddBtn = dom.dashCompetitorList.querySelector('#dash-btn-empty-add-comp');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        if (dom.dashBtnAddCompetitor) dom.dashBtnAddCompetitor.click();
      });
    }
    return;
  }

  dom.dashCompetitorList.innerHTML = competitors.map((comp: any) => {
    const theme = getCompetitorTheme(comp.name);
    const initials = getCompetitorInitials(comp.name);
    const urlInfo = formatCompetitorUrlLabel(comp.url);
    const target = comp.packageName || comp.name;
    const shortPkg = comp.packageName ? (comp.packageName.split('.').pop() || comp.name) : comp.name;
    const hasIcon = Boolean(comp.iconUrl);
    const flows = parseBenchmarkFlows(comp.notes);
    const allFlowsSlugs = flows.map(formatFlowSlug).filter(Boolean).join(' ');

    return `
      <div class="dash-comp-card" data-comp-id="${esc(comp.id)}">
        <div class="dash-comp-card-main">
          <div class="dash-comp-card-header">
            <div class="dash-comp-header-left">
              <div class="dash-comp-avatar" style="background: ${theme.bg}; border-color: ${theme.border}; color: ${theme.color};">
                <img src="${hasIcon ? esc(comp.iconUrl) : ''}" class="dash-comp-avatar-img" alt="${esc(comp.name)}" loading="lazy" style="${hasIcon ? '' : 'display: none;'}" />
                <span class="dash-comp-avatar-text" style="${hasIcon ? 'display: none;' : ''}">${initials}</span>
              </div>
              <div class="dash-comp-identity">
                <div class="dash-comp-name-row">
                  <h4 class="dash-comp-name" title="${esc(comp.name)}">${esc(comp.name)}</h4>
                </div>
                ${comp.url ? `
                  <div class="dash-comp-sub-row">
                    <a href="${esc(comp.url)}" class="dash-comp-link-chip" data-action="open-url" data-url="${esc(comp.url)}" title="Open ${esc(urlInfo.label)} in browser">
                      <span class="dash-comp-link-icon">${icons.link || ''}</span>
                      <span>${esc(urlInfo.label)}</span>
                      <span class="dash-comp-link-arrow">↗</span>
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="dash-comp-top-actions">
              <button type="button" class="dash-comp-icon-btn" data-action="edit-comp" data-id="${esc(comp.id)}" title="Edit competitor details">
                ${icons.edit}
              </button>
              <button type="button" class="dash-comp-icon-btn danger" data-action="delete-comp" data-id="${esc(comp.id)}" title="Delete competitor">
                ${icons.trash || ''}
              </button>
            </div>
          </div>

          ${comp.packageName ? `
            <div class="dash-comp-pkg-row">
              <button type="button" class="dash-comp-pkg-chip" data-action="copy-pkg" data-pkg="${esc(comp.packageName)}" title="Click to copy package ID">
                <span class="dash-comp-pkg-prefix">pkg:</span>
                <code class="dash-comp-pkg-code">${esc(comp.packageName)}</code>
                <span class="dash-comp-pkg-copy-hint">
                  <span class="dash-comp-pkg-copy-icon">${icons.copy || ''}</span>
                  <span class="dash-comp-pkg-copy-text">Copy</span>
                </span>
              </button>
            </div>
          ` : ''}
        </div>

        <div class="dash-comp-bench-section">
          <div class="dash-comp-bench-header">
            <div class="dash-comp-bench-header-left">
              <span class="dash-comp-bench-title">Benchmark Flows</span>
              ${flows.length > 0 ? `<span class="dash-comp-bench-count">${flows.length}</span>` : ''}
            </div>
          </div>

          ${flows.length > 0 ? `
            <div class="dash-comp-bench-list">
              ${flows.map((flow: string, index: number) => {
                const slashCmd = buildBenchmarkSlashCommand(target, flow);
                return `
                  <div class="dash-comp-bench-item" data-action="copy-bench-cmd" data-cmd="${esc(slashCmd)}" title="Click to copy: ${esc(slashCmd)}">
                    <div class="dash-comp-bench-item-header">
                      <div class="dash-comp-bench-item-left">
                        <span class="dash-comp-bench-index">${index + 1}</span>
                        <span class="dash-comp-bench-name" title="${esc(flow)}">${esc(flow)}</span>
                      </div>
                      <span class="dash-comp-bench-icon-state">${icons.copy || ''}</span>
                    </div>
                    <div class="dash-comp-bench-cmd-wrap">
                      <code class="dash-comp-bench-code">${esc(slashCmd)}</code>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <button type="button" class="dash-comp-bench-empty" data-action="edit-comp" data-id="${esc(comp.id)}" title="Click to add benchmark flows">
              <span class="dash-comp-bench-empty-icon">+</span>
              <span class="dash-comp-bench-empty-text">Add benchmark flows (e.g. Onboarding, KYC, Payment)</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  dom.dashCompetitorList.querySelectorAll('.dash-comp-avatar-img').forEach((imgEl: Element) => {
    imgEl.addEventListener('error', () => {
      const htmlImg = imgEl as HTMLElement;
      htmlImg.style.display = 'none';
      const fallbackText = htmlImg.parentElement?.querySelector('.dash-comp-avatar-text') as HTMLElement;
      if (fallbackText) fallbackText.style.display = 'block';
    });
  });

  // Auto-fetch missing icons for any competitor that has url or packageName
  competitors.forEach((comp: any) => {
    if (!comp.iconUrl && (comp.url || comp.packageName)) {
      window.api?.fetchCompetitorIcon?.({
        projectPath: activeProject?.path,
        competitorId: comp.id,
        url: comp.url,
        packageName: comp.packageName,
      }).then((res: any) => {
        if (res && res.success && res.iconUrl) {
          comp.iconUrl = res.iconUrl;
          const card = dom.dashCompetitorList.querySelector(`[data-comp-id="${comp.id}"]`);
          if (card) {
            const avatar = card.querySelector('.dash-comp-avatar');
            const img = avatar?.querySelector('.dash-comp-avatar-img') as HTMLImageElement;
            const text = avatar?.querySelector('.dash-comp-avatar-text') as HTMLElement;
            if (img && text) {
              img.src = res.iconUrl;
              img.style.display = 'block';
              text.style.display = 'none';
            }
          }
        }
      }).catch(() => {});
    }
  });

  dom.dashCompetitorList.querySelectorAll('[data-action="open-url"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = (e.currentTarget as HTMLElement).dataset.url;
      if (url) void window.api.openExternal(url);
    });
  });

  dom.dashCompetitorList.querySelectorAll('[data-action="copy-pkg"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const pkg = target.dataset.pkg;
      if (pkg) {
        navigator.clipboard.writeText(pkg);
        showToast(`Copied package ID: ${pkg}`, 'info');
        target.classList.add('copied');
        const hintText = target.querySelector('.dash-comp-pkg-copy-text');
        const origText = hintText?.textContent;
        if (hintText) hintText.textContent = 'Copied!';
        setTimeout(() => {
          target.classList.remove('copied');
          if (hintText && origText) hintText.textContent = origText;
        }, 1400);
      }
    });
  });

  dom.dashCompetitorList.querySelectorAll('[data-action="copy-bench-cmd"]').forEach((el: Element) => {
    el.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const cmd = target.dataset.cmd;
      if (!cmd) return;

      void navigator.clipboard.writeText(cmd);
      showToast(`Copied command: ${cmd} — paste into Antigravity!`, 'success');

      target.classList.add('copied');
      const iconState = target.querySelector('.dash-comp-bench-icon-state') as HTMLElement;
      const origHtml = iconState?.innerHTML;
      if (iconState) {
        iconState.innerHTML = `<span class="dash-bench-copied-text">✓ Copied</span>`;
      }
      setTimeout(() => {
        target.classList.remove('copied');
        if (iconState && origHtml) {
          iconState.innerHTML = origHtml;
        }
      }, 1400);
    });
  });

  dom.dashCompetitorList.querySelectorAll('[data-action="edit-comp"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.id;
      const comp = competitors.find((c: any) => c.id === id);
      if (comp) {
        openCompetitorModal({
          project: activeProject,
          competitor: comp,
          dom,
          icons,
          configureModalFooter,
          showModal,
          hideModal,
          showToast,
          focusModalInputLater,
          bindModalEnterSubmit,
          withAsyncButtonState,
          onSuccess: (updated: any) => {
            activeProject.competitors = updated.competitors;
            renderDashboardCompetitors(activeProject, activeWt);
          },
        });
      }
    });
  });

  dom.dashCompetitorList.querySelectorAll('[data-action="delete-comp"]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (!id) return;
      const res = await window.api.removeProjectCompetitor(activeProject.path, id);
      if (res?.success) {
        showToast('Competitor removed', 'info');
        activeProject.competitors = (activeProject.competitors || []).filter((c: any) => c.id !== id);
        renderDashboardCompetitors(activeProject, activeWt);
      } else {
        showToast(`Failed: ${res?.error || 'Unknown error'}`, 'error');
      }
    });
  });
}

function renderDashboardViewer() {
  const { activeProject, activeWt } = getActiveProjectAndWorktree();

  if (!dom.dashboardViewer || !dom.dashboardEmptyState) return;

  if (!activeProject) {
    updateSidebarFigmaButton(null);
    dom.dashboardEmptyState.style.display = 'flex';
    dom.dashboardViewer.style.display = 'none';
    return;
  }

  dom.dashboardEmptyState.style.display = 'none';
  dom.dashboardViewer.style.display = 'flex';

  if (dom.dashProjectName) dom.dashProjectName.textContent = activeProject.name;
  if (dom.dashBranchBadge) {
    dom.dashBranchBadge.textContent = activeWt ? (activeWt.branch || activeWt.name) : 'main';
  }
  const currentPath = activeWt ? activeWt.path : activeProject.path;
  if (dom.dashProjectPath) {
    dom.dashProjectPath.textContent = currentPath;
    dom.dashProjectPath.title = currentPath;
  }
  if (dom.dashWtText) {
    const wtCount = (activeProject.worktrees || []).length;
    dom.dashWtText.textContent = `${wtCount} Worktree${wtCount === 1 ? '' : 's'}`;
  }

  void checkDashboardAdbDevice();
  renderDashboardFigma(activeProject);
  renderDashboardApk(activeProject);
  renderDashboardCompetitors(activeProject, activeWt);
}

// ── Dashboard Event Listeners ──
if (dom.btnDashboardAddFirst) {
  dom.btnDashboardAddFirst.addEventListener('click', () => {
    if (dom.btnAddProject) dom.btnAddProject.click();
  });
}

if (dom.dashBtnCopyPath) {
  dom.dashBtnCopyPath.addEventListener('click', () => {
    const { activeProject, activeWt } = getActiveProjectAndWorktree();
    const currentPath = activeWt ? activeWt.path : activeProject?.path;
    if (currentPath) {
      navigator.clipboard.writeText(currentPath);
      showToast('Project path copied to clipboard', 'info');
    }
  });
}

if (dom.dashBtnRevealPath) {
  dom.dashBtnRevealPath.addEventListener('click', () => {
    const { activeProject, activeWt } = getActiveProjectAndWorktree();
    const currentPath = activeWt ? activeWt.path : activeProject?.path;
    if (currentPath) {
      void window.api.openInExplorer(currentPath);
    }
  });
}

if (dom.dashBtnRefreshAdb) {
  dom.dashBtnRefreshAdb.addEventListener('click', async () => {
    showToast('Checking ADB devices...', 'info');
    await checkDashboardAdbDevice();
  });
}

if (dom.dashChipDevice) {
  dom.dashChipDevice.style.cursor = 'pointer';
  dom.dashChipDevice.addEventListener('click', () => {
    void showDeviceManagerScreen();
  });
}

if (dom.dashChipWorktree) {
  dom.dashChipWorktree.style.cursor = 'pointer';
  dom.dashChipWorktree.addEventListener('click', () => {
    if (dom.workspaceSidebar && dom.workspaceSidebar.classList.contains('workspace-sidebar-collapsed')) {
      dom.btnToggleWorkspaceSidebar?.click();
    }
  });
}

if (dom.dashChipBakit) {
  dom.dashChipBakit.style.cursor = 'pointer';
  dom.dashChipBakit.addEventListener('click', () => {
    if (dom.btnAgentToolkit) {
      dom.btnAgentToolkit.click();
    }
  });
}

function applyDashboardViewMode(mode: 'grid' | 'list') {
  if (!dom.dashboardViewer) return;
  if (mode === 'grid') {
    dom.dashboardViewer.classList.add('dash-grid-mode');
    dom.dashboardViewer.classList.remove('dash-list-mode');
    dom.dashBtnViewGrid?.classList.add('active');
    dom.dashBtnViewList?.classList.remove('active');
  } else {
    dom.dashboardViewer.classList.add('dash-list-mode');
    dom.dashboardViewer.classList.remove('dash-grid-mode');
    dom.dashBtnViewList?.classList.add('active');
    dom.dashBtnViewGrid?.classList.remove('active');
  }
  try {
    localStorage.setItem('baspace_dashboard_view_mode', mode);
  } catch {}
}

const initialDashViewMode = (localStorage.getItem('baspace_dashboard_view_mode') || 'grid') as 'grid' | 'list';
applyDashboardViewMode(initialDashViewMode);

if (dom.dashBtnViewGrid) {
  dom.dashBtnViewGrid.addEventListener('click', () => {
    applyDashboardViewMode('grid');
  });
}

if (dom.dashBtnViewList) {
  dom.dashBtnViewList.addEventListener('click', () => {
    applyDashboardViewMode('list');
  });
}

if (dom.dashBtnAddApk) {
  dom.dashBtnAddApk.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (!activeProject) {
      showToast('Please select a project first', 'error');
      return;
    }
    const apkFile = await window.api.selectApkFile();
    if (apkFile) {
      const res = await window.api.addProjectApk(activeProject.path, apkFile);
      if (res?.success) {
        showToast(`Linked APK: ${apkFile.name}`, 'success');
        activeProject.apkFiles = res.project.apkFiles;
        renderDashboardApk(activeProject);
      } else {
        showToast(`Failed to link APK: ${res?.error || 'Unknown error'}`, 'error');
      }
    }
  });
}

if (dom.dashLinkBrowseApk) {
  dom.dashLinkBrowseApk.addEventListener('click', () => {
    if (dom.dashBtnAddApk) dom.dashBtnAddApk.click();
  });
}

if (dom.dashApkDropzone) {
  dom.dashApkDropzone.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    dom.dashApkDropzone.classList.add('dragover');
  });
  dom.dashApkDropzone.addEventListener('dragleave', () => {
    dom.dashApkDropzone.classList.remove('dragover');
  });
  dom.dashApkDropzone.addEventListener('drop', async (e: DragEvent) => {
    e.preventDefault();
    dom.dashApkDropzone.classList.remove('dragover');
    const { activeProject } = getActiveProjectAndWorktree();
    if (!activeProject) {
      showToast('Please select a project first', 'error');
      return;
    }

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i] as any;
      const filePath = file.path;
      if (!filePath) continue;
      if (!filePath.toLowerCase().endsWith('.apk')) {
        showToast(`Skipped non-APK: ${file.name}`, 'info');
        continue;
      }
      const res = await window.api.addProjectApk(activeProject.path, {
        name: file.name,
        path: filePath,
        size: file.size,
      });
      if (res?.success) {
        activeProject.apkFiles = res.project.apkFiles;
        showToast(`Added APK: ${file.name}`, 'success');
      }
    }
    renderDashboardApk(activeProject);
  });
}

if (dom.dashBtnOpenFigma) {
  dom.dashBtnOpenFigma.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    showToast('Opening Figma...', 'info');
    await window.api.openInFigma(activeProject?.figmaUrl || undefined);
  });
}

if (dom.dashBtnBrowserFigma) {
  dom.dashBtnBrowserFigma.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (activeProject?.figmaUrl) {
      await window.api.openExternal(activeProject.figmaUrl);
    }
  });
}

if (dom.dashBtnAddCompetitor) {
  dom.dashBtnAddCompetitor.addEventListener('click', () => {
    const { activeProject, activeWt } = getActiveProjectAndWorktree();
    if (!activeProject) {
      showToast('Please select a project first', 'error');
      return;
    }
    openCompetitorModal({
      project: activeProject,
      dom,
      icons,
      configureModalFooter,
      showModal,
      hideModal,
      showToast,
      focusModalInputLater,
      bindModalEnterSubmit,
      withAsyncButtonState,
      onSuccess: (updated: any) => {
        activeProject.competitors = updated.competitors;
        renderDashboardCompetitors(activeProject, activeWt);
      },
    });
  });
}

if (dom.dashBtnSyncConfig) {
  dom.dashBtnSyncConfig.addEventListener('click', async () => {
    const { activeProject, activeWt } = getActiveProjectAndWorktree();
    if (!activeProject) {
      showToast('Please select a project first', 'error');
      return;
    }
    showToast('Syncing to .agents/config/ba-project-config.md...', 'info');
    const res = await window.api.syncBaProjectConfig({
      projectPath: activeProject.path,
      worktreePath: activeWt?.path,
    });
    if (res?.success) {
      showToast('Successfully synced to ba-project-config.md!', 'success');
    } else {
      showToast(`Sync failed: ${res?.error || 'Unknown error'}`, 'error');
    }
  });
}

// Terminal screen controls
if (dom.btnTerminalScreen) {
  dom.btnTerminalScreen.addEventListener('click', () => {
    if (isTerminalScreenVisible()) {
      hideTerminalScreen();
    } else {
      void showTerminalScreen();
    }
  });
}
if (dom.btnCloseTerminalScreen) {
  dom.btnCloseTerminalScreen.addEventListener('click', hideTerminalScreen);
}
if (dom.btnTerminalScreenNew) {
  dom.btnTerminalScreenNew.addEventListener('click', () => {
    createNewTerminalTab();
  });
}
if (dom.btnTerminalScreenScrcpy) {
  dom.btnTerminalScreenScrcpy.addEventListener('click', () => {
    void launchScrcpyCliTerminal();
  });
}
if (dom.btnTerminalEmptyNew) {
  dom.btnTerminalEmptyNew.addEventListener('click', () => {
    createNewTerminalTab();
  });
}
if (dom.btnTerminalEmptyScrcpy) {
  dom.btnTerminalEmptyScrcpy.addEventListener('click', () => {
    void launchScrcpyCliTerminal();
  });
}

if (dom.btnManageSymlinks) {
  dom.btnManageSymlinks.addEventListener('click', () => {
    const activeWorktreePath = getRequiredActiveWorktreePath();
    if (!activeWorktreePath) return;
    showSymlinkScreen();
  });
}

// SIDEBAR
// ═══════════════════════════════════════════════════════

async function loadWorkspaces() {
  if (!state.projects || state.projects.length === 0) {
    dom.projectsContainer.innerHTML = '';
    dom.projectsContainer.style.display = 'none';
    dom.emptyState.style.display = 'none';
    dom.loadingState.style.display = '';
  }

  state.settings = (await window.api.getSettings()) || {};
  if (dom.btnRefreshAll) {
    dom.btnRefreshAll.style.display = state.settings.autoRefreshCurrentProject ? 'none' : '';
  }
  state.projects = (await window.api.getWorkspaces()) || [];
  
  dom.loadingState.style.display = 'none';
  dom.projectsContainer.style.display = '';

  if (state.expandedProjects.size === 0) {
    state.projects.forEach((p) => state.expandedProjects.add(p.path));
  }
  renderSidebar();

  // Automatically select and open the first project on startup
  if (!state.activeWorktreePath && state.projects.length > 0) {
    const targetProjPath = state.selectedProjectPath || state.projects[0].path;
    await openProjectWorkspaceAndTerminal(targetProjPath);
  }
}

function renderSidebar() {
  if (!state.projects.length) {
    dom.projectsContainer.innerHTML = '';
    dom.projectsContainer.style.display = 'none';
    dom.emptyState.style.display = '';
    return;
  }
  dom.emptyState.style.display = 'none';
  dom.projectsContainer.style.display = '';

  // Ensure a project is selected
  if (state.projects.length > 0 && (!state.selectedProjectPath || !state.projects.some(p => p.path === state.selectedProjectPath))) {
    const activeProject = state.projects.find((p) =>
      (p.worktrees || []).some((wt) => wt.path === state.activeWorktreePath)
    );
    state.selectedProjectPath = activeProject ? activeProject.path : state.projects[0].path;
  }

  const selectedProject = state.projects.find(p => p.path === state.selectedProjectPath) || state.projects[0];

  // Render left navigation column
  const navHtml = state.projects.map((project) => {
    const isSelected = project.path === state.selectedProjectPath;
    return `
      <div class="project-nav-item ${isSelected ? 'selected' : ''}" data-project-path="${esc(project.path)}" title="${esc(project.name)}">
        <div class="sidebar-project-icon">${esc(getWorkspaceInitials(project.name))}</div>
      </div>
    `;
  }).join('');

  // Render right details column
  const detailHtml = selectedProject ? sidebarSelectedProjectHTML(selectedProject) : '';

  dom.projectsContainer.innerHTML = `
    <div class="projects-nav-col">
      ${navHtml}
    </div>
    <div class="projects-detail-col">
      ${detailHtml}
    </div>
  `;

  // Attach event listeners
  // 1. Navigation items
  dom.projectsContainer.querySelectorAll('.project-nav-item').forEach((navEl) => {
    if (navEl instanceof HTMLElement) {
      navEl.addEventListener('click', async () => {
        const projectPath = navEl.dataset.projectPath || null;
        if (!projectPath) return;
        state.selectedProjectPath = projectPath;
        renderSidebar();
        await openProjectWorkspaceAndTerminal(projectPath);
      });
      navEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const p = state.projects.find(proj => proj.path === navEl.dataset.projectPath);
        if (p) showProjectOptionsMenu(p, e.clientX, e.clientY);
      });
    }
  });

  // 2. Project details events
  if (selectedProject) {
    attachSelectedProjectEvents(selectedProject);
    (selectedProject.worktrees || []).forEach((wt) => loadGitInfo(wt));
  }
  
  updateSidebarActiveState();
}

function getWorkspaceInitials(name: string) {
  if (!name) return '';
  const first = name.charAt(0);
  const nextUpper = name.substring(1).match(/[A-Z]/);
  if (nextUpper) {
    return first + nextUpper[0];
  }
  return name.substring(0, 2);
}

function sidebarSelectedProjectHTML(project) {
  const expanded = state.expandedProjects.has(project.path);
  const wtItems = getDomainBuildWorktreeTree(project, state.settings)
    .map((node) => sidebarWtItemHTML(project, node)).join('');
  const optionsButton = sidebarActionButtonHTML({
    action: 'project-options',
    path: project.path,
    title: 'Options',
    icon: icons.moreVertical,
  });

  return `
    <div class="sidebar-project-header" data-action="toggle-project" data-path="${esc(project.path)}">
      <div class="sidebar-project-left">
        <span class="sidebar-project-chevron ${expanded ? 'expanded' : ''}">${icons.chevron}</span>
        <span class="sidebar-project-name" title="${esc(project.path)}">${esc(project.name)}</span>
      </div>
      <div class="sidebar-project-actions">
        ${optionsButton}
      </div>
    </div>
    <div class="sidebar-wt-list ${expanded ? '' : 'collapsed'}" data-wt-list="${esc(project.path)}"
         style="${expanded ? '' : 'max-height:0'}">
      ${wtItems || sidebarEmptyStateHTML()}
    </div>
  `;
}

function sidebarWtItemHTML(project, node, depth = 0) {
  const { wt, children } = node;
  const dotClass = wt.bare ? 'bare' : 'loading';
  const childHtml = children.map((child) => sidebarWtItemHTML(project, child, depth + 1)).join('');
  return `
    <div class="sidebar-wt-node depth-${depth}">
      <div class="sidebar-wt-item" data-wt-path="${esc(wt.path)}" data-wt-name="${esc(wt.name)}" data-wt-id="${esc(wt.id)}" data-project-path="${esc(project.path)}" style="margin-left:${depth * 16}px;">
        <span class="sidebar-wt-dot ${dotClass}" id="wt-dot-${esc(wt.id)}"></span>
        <div class="sidebar-wt-info">
          <div class="sidebar-wt-name">${esc(wt.name)}</div>
          <div class="sidebar-wt-branch">${esc(wt.branch || (wt.detached ? 'HEAD detached' : wt.bare ? 'bare' : '...'))}</div>
        </div>
        <div class="sidebar-wt-actions">
        </div>
      </div>
      ${childHtml ? `<div class="sidebar-wt-children">${childHtml}</div>` : ''}
    </div>
  `;
}

function updateSidebarActiveState() {
  document.querySelectorAll('.sidebar-wt-item').forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    el.classList.toggle('active', el.dataset.wtPath === state.activeWorktreePath);
  });

  const activeWtPath = state.activeWorktreePath;
  let activeProject: any = null;
  let activeWt: any = null;

  if (activeWtPath && state.projects) {
    for (const p of state.projects) {
      const found = (p.worktrees || []).find((w: any) => w.path === activeWtPath);
      if (found) {
        activeProject = p;
        activeWt = found;
        break;
      }
    }
  }

  const titlebarProject = dom.titlebarCrumbProject || document.getElementById('titlebar-crumb-project');
  const titlebarBranch = dom.titlebarCrumbBranch || document.getElementById('titlebar-crumb-branch');
  const welcomeStatusName = dom.welcomeStatusName || document.getElementById('welcome-status-name');

  if (activeProject && activeWt) {
    if (titlebarProject) titlebarProject.textContent = activeProject.name;
    if (titlebarBranch) titlebarBranch.textContent = `${activeWt.name} (${activeWt.branch || 'detached'})`;
    if (welcomeStatusName) welcomeStatusName.textContent = `${activeProject.name} — ${activeWt.name} (${activeWt.branch || 'main'})`;
  } else if (state.projects && state.projects.length > 0) {
    const selP = state.projects.find((p: any) => p.path === state.selectedProjectPath) || state.projects[0];
    if (titlebarProject) titlebarProject.textContent = selP.name;
    if (titlebarBranch) titlebarBranch.textContent = 'Workspace';
    if (welcomeStatusName) welcomeStatusName.textContent = `${selP.name} — Select a worktree to begin`;
  } else {
    if (titlebarProject) titlebarProject.textContent = 'BA Space';
    if (titlebarBranch) titlebarBranch.textContent = 'Ready';
    if (welcomeStatusName) welcomeStatusName.textContent = 'Add or select a project to get started';
  }

  renderDashboardViewer();
}

function attachSelectedProjectEvents(project) {
  const container = dom.projectsContainer.querySelector('.projects-detail-col');
  if (!container) return;

  // Toggle project header
  const header = container.querySelector('[data-action="toggle-project"]');
  if (header instanceof HTMLElement) {
    header.addEventListener('click', (e) => {
      const target = e.target;
      if (target instanceof Element && target.closest('.sidebar-project-actions')) return;
      const p = header.dataset.path;
      const chevron = header.querySelector('.sidebar-project-chevron');
      const wtList = container.querySelector(`[data-wt-list="${CSS.escape(p || '')}"]`);
      if (chevron instanceof HTMLElement && wtList instanceof HTMLElement) {
        if (state.expandedProjects.has(p || '')) {
          state.expandedProjects.delete(p || '');
          chevron.classList.remove('expanded');
          wtList.classList.add('collapsed');
          wtList.style.maxHeight = '0';
        } else {
          state.expandedProjects.add(p || '');
          chevron.classList.add('expanded');
          wtList.classList.remove('collapsed');
          wtList.style.maxHeight = `${wtList.scrollHeight}px`;
        }
      }
    });

    header.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showProjectOptionsMenu(project, e.clientX, e.clientY);
    });
  }

  // Options button
  container.querySelector('[data-action="project-options"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showProjectOptionsMenu(project, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
  });

  // Worktree items → open terminal or switch to worktree context
  container.querySelectorAll('.sidebar-wt-item').forEach((wtEl) => {
    if (!(wtEl instanceof HTMLElement)) return;
    wtEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wt = (project.worktrees || []).find((item) => item.path === wtEl.dataset.wtPath);
      if (!wt) return;
      showWorktreeContextMenu(project, wt, e.clientX, e.clientY);
    });

    wtEl.addEventListener('click', (e) => {
      const target = e.target;
      if (target instanceof Element && target.closest('.sidebar-wt-actions')) return;
      const wtPath = wtEl.dataset.wtPath || '';
      if (wtPath) {
        switchWorktreeContext(wtPath);
      }
    });

    wtEl.querySelector('[data-action="vscode"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      if (currentTarget instanceof HTMLElement) window.api.openInEditor(currentTarget.dataset.path || '');
      showToast('Opening VS Code...', 'info');
    });

    wtEl.querySelector('[data-action="android-studio"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      if (currentTarget instanceof HTMLElement) window.api.openInAndroidStudio(currentTarget.dataset.path || '');
      showToast('Opening Android Studio...', 'info');
    });

    wtEl.querySelector('[data-action="antigravity"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      if (currentTarget instanceof HTMLElement) window.api.openInAntigravity(currentTarget.dataset.path || '');
      showToast('Opening Antigravity...', 'info');
    });

    wtEl.querySelector('[data-action="obsidian"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      if (currentTarget instanceof HTMLElement) window.api.openInObsidian(currentTarget.dataset.path || '');
      showToast('Opening Obsidian...', 'info');
    });

    wtEl.querySelector('[data-action="explorer"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      if (currentTarget instanceof HTMLElement) window.api.openInExplorer(currentTarget.dataset.path || '');
    });
  });
}

// ── Load Git Info ──────────────────────────────────────
async function loadGitInfo(wt) {
  if (wt.bare) return;
  try {
    const info = await window.api.getGitInfo(wt.path);
    const dotEl = document.getElementById(`wt-dot-${wt.id}`);
    if (dotEl) dotEl.className = `sidebar-wt-dot ${info.modifiedCount > 0 ? 'modified' : 'clean'}`;
  } catch (_) {}
}

// ── Searchable Branch Dropdown (reusable) ──────────────
function setupBranchCombo({ containerEl, branches, onSelect, placeholder = 'Search branches...', showCreateOption = false }) {
  const branchInput = containerEl.querySelector('.branch-combo-input');
  const branchDropdown = containerEl.querySelector('.branch-combo-dropdown');
  const branchSelected = containerEl.querySelector('.branch-combo-selected');
  const branchChipLabel = containerEl.querySelector('.branch-chip-label');
  const branchChipBadge = containerEl.querySelector('.branch-chip-badge');
  const branchChipRemove = containerEl.querySelector('.branch-chip-remove');

  branchInput.placeholder = placeholder;
  let selectedBranch = '';
  let isCreateNew = false;

  function select(name, createNew) {
    selectedBranch = name;
    isCreateNew = createNew;
    branchChipLabel.textContent = name;
    if (createNew) {
      branchChipBadge.textContent = 'new';
      branchChipBadge.className = 'branch-chip-badge new';
    } else {
      branchChipBadge.textContent = '';
      branchChipBadge.className = 'branch-chip-badge existing';
      branchChipBadge.style.display = 'none';
    }
    branchSelected.style.display = '';
    branchInput.style.display = 'none';
    branchInput.value = '';
    hideDropdown();
    if (onSelect) onSelect(name, createNew);
  }

  function clear() {
    selectedBranch = '';
    isCreateNew = false;
    branchSelected.style.display = 'none';
    branchInput.style.display = '';
    branchInput.value = '';
    branchInput.focus();
    if (onSelect) onSelect('', false);
  }

  function renderDropdown(query) {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? branches.filter((b) => b.toLowerCase().includes(q))
      : branches;
    const exactMatch = branches.some((b) => b.toLowerCase() === q);
    const showCreate = showCreateOption && q.length > 0 && !exactMatch;

    let html = '';

    if (showCreate) {
      html += `
        <button class="branch-dropdown-item create-item" data-action="create" data-branch="${esc(query.trim())}" type="button">
          <span class="branch-dropdown-icon create">${icons.plus}</span>
          <span>Create new branch: <strong>${esc(query.trim())}</strong></span>
        </button>
      `;
      if (filtered.length > 0) {
        html += `<div class="branch-dropdown-divider"></div>`;
      }
    }

    if (filtered.length > 0) {
      for (const b of filtered.slice(0, 20)) {
        const idx = b.toLowerCase().indexOf(q);
        let label;
        if (q && idx >= 0) {
          label = esc(b.substring(0, idx))
            + `<mark>${esc(b.substring(idx, idx + q.length))}</mark>`
            + esc(b.substring(idx + q.length));
        } else {
          label = esc(b);
        }
        html += `
          <button class="branch-dropdown-item" data-action="select" data-branch="${esc(b)}" type="button">
            <span class="branch-dropdown-icon">${icons.gitBranch}</span>
            <span>${label}</span>
          </button>
        `;
      }
      if (filtered.length > 20) {
        html += `<div class="branch-dropdown-more">${filtered.length - 20} more...</div>`;
      }
    } else if (!showCreate) {
      html += `<div class="branch-dropdown-empty">No branches found</div>`;
    }

    branchDropdown.innerHTML = html;
    branchDropdown.classList.add('visible');

    branchDropdown.querySelectorAll('.branch-dropdown-item').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const action = item.dataset.action;
        const branch = item.dataset.branch;
        select(branch, action === 'create');
      });
    });
  }

  function hideDropdown() {
    branchDropdown.classList.remove('visible');
  }

  branchInput.addEventListener('input', () => renderDropdown(branchInput.value));
  branchInput.addEventListener('focus', () => renderDropdown(branchInput.value));
  branchInput.addEventListener('blur', () => setTimeout(() => hideDropdown(), 150));
  branchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideDropdown(); branchInput.blur(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = branchDropdown.querySelector('.branch-dropdown-item');
      if (first) first.click();
    }
  });
  branchChipRemove.addEventListener('click', clear);

  return {
    getSelected: () => ({ branch: selectedBranch, isNew: isCreateNew }),
    focus: () => branchInput.focus(),
  };
}

/** Generate the branch combo HTML (reusable in both modals) */
function branchComboHTML() {
  return `
    <div class="branch-combo">
      <div class="branch-combo-selected" style="display:none;">
        <span class="branch-chip">
          <span class="branch-chip-icon">${icons.gitBranch}</span>
          <span class="branch-chip-label"></span>
          <span class="branch-chip-badge"></span>
          <button class="branch-chip-remove" type="button">${icons.close}</button>
        </span>
      </div>
      <input class="form-input branch-combo-input" autocomplete="off" spellcheck="false" />
      <div class="branch-combo-dropdown"></div>
    </div>
  `;
}

// ── Create Branch Modal ────────────────────────────────
async function showCreateBranchModal(project) {
  return openCreateBranchModal({
    project,
    dom,
    icons,
    configureModalFooter,
    showModal,
    focusModalInputLater,
    hideModal,
    showToast,
    isInvalidGitBranchName,
    withAsyncButtonState,
    bindModalEnterSubmit,
    api: window.api,
  });
}

async function saveSettingsFromUI() {
  const cleanVal = (val: string) => {
    const trimmed = val.trim();
    if (trimmed === 'detecting...' || trimmed === 'not detected') {
      return '';
    }
    return trimmed;
  };
  const intervalVal = parseInt(dom.settingsAutoRefreshInterval ? dom.settingsAutoRefreshInterval.value : '10', 10);
  const nextSettings = {
    ...state.settings,
    antigravityPath: dom.settingsAntigravityPath ? cleanVal(dom.settingsAntigravityPath.value) : '',
    antigravityAgentPath: dom.settingsAntigravityAgentPath ? cleanVal(dom.settingsAntigravityAgentPath.value) : '',
    androidStudioPath: dom.settingsAndroidStudioPath ? cleanVal(dom.settingsAndroidStudioPath.value) : '',
    vscodePath: dom.settingsVsCodePath ? cleanVal(dom.settingsVsCodePath.value) : '',
    figmaPath: dom.settingsFigmaPath ? cleanVal(dom.settingsFigmaPath.value) : '',
    figmaUrl: dom.settingsFigmaUrl ? dom.settingsFigmaUrl.value.trim() : (state.settings?.figmaUrl || 'https://www.figma.com'),
    obsidianPath: dom.settingsObsidianPath ? cleanVal(dom.settingsObsidianPath.value) : '',
    obsidianVault: dom.settingsObsidianVault ? dom.settingsObsidianVault.value.trim() : (state.settings?.obsidianVault || ''),
    scrcpyPath: dom.settingsScrcpyPath ? cleanVal(dom.settingsScrcpyPath.value) : '',
    autoRefreshCurrentProject: dom.settingsAutoRefresh ? dom.settingsAutoRefresh.checked : true,
    autoRefreshInterval: isNaN(intervalVal) || intervalVal < 1 ? 10 : intervalVal,
  };
  state.settings = await window.api.updateSettings(nextSettings);
}

async function showSettingsScreen() {
  if (state.settings) {
    if (dom.settingsAntigravityPath) dom.settingsAntigravityPath.value = state.settings.antigravityPath || 'detecting...';
    if (dom.settingsAntigravityAgentPath) dom.settingsAntigravityAgentPath.value = state.settings.antigravityAgentPath || 'detecting...';
    if (dom.settingsAndroidStudioPath) dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || 'detecting...';
    if (dom.settingsVsCodePath) dom.settingsVsCodePath.value = state.settings.vscodePath || 'detecting...';
    if (dom.settingsFigmaPath) dom.settingsFigmaPath.value = state.settings.figmaPath || '';
    if (dom.settingsFigmaUrl) dom.settingsFigmaUrl.value = state.settings.figmaUrl || 'https://www.figma.com';
    if (dom.settingsObsidianPath) dom.settingsObsidianPath.value = state.settings.obsidianPath || 'detecting...';
    if (dom.settingsObsidianVault) dom.settingsObsidianVault.value = state.settings.obsidianVault || '';
    if (dom.settingsScrcpyPath) dom.settingsScrcpyPath.value = state.settings.scrcpyPath || 'detecting...';
    if (dom.settingsAutoRefresh) dom.settingsAutoRefresh.checked = !!state.settings.autoRefreshCurrentProject;
    if (dom.settingsAutoRefreshInterval) dom.settingsAutoRefreshInterval.value = String(state.settings.autoRefreshInterval || 10);
  }

  if (dom.terminalScreen) dom.terminalScreen.classList.add('hidden');
  if (dom.btnTerminalScreen) dom.btnTerminalScreen.classList.remove('active');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  dom.settingsScreen.classList.remove('hidden');

  try {
    const detected = await window.api.detectIntegrationPaths();
    if (state.settings) {
      if (dom.settingsAntigravityPath) {
        dom.settingsAntigravityPath.value = state.settings.antigravityPath || detected.antigravityPath || 'not detected';
      }
      if (dom.settingsAntigravityAgentPath) {
        dom.settingsAntigravityAgentPath.value = state.settings.antigravityAgentPath || detected.antigravityAgentPath || 'not detected';
      }
      if (dom.settingsAndroidStudioPath) {
        dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || detected.androidStudioPath || 'not detected';
      }
      if (dom.settingsVsCodePath) {
        dom.settingsVsCodePath.value = state.settings.vscodePath || detected.vscodePath || 'not detected';
      }
      if (dom.settingsScrcpyPath) {
        dom.settingsScrcpyPath.value = state.settings.scrcpyPath || detected.scrcpyPath || 'not detected';
      }
      if (dom.settingsFigmaPath) {
        dom.settingsFigmaPath.value = state.settings.figmaPath || detected.figmaPath || '';
      }
      if (dom.settingsObsidianPath) {
        dom.settingsObsidianPath.value = state.settings.obsidianPath || detected.obsidianPath || 'not detected';
      }
      if (dom.settingsObsidianVault) {
        dom.settingsObsidianVault.value = state.settings.obsidianVault || detected.obsidianVault || '';
      }
    }
  } catch (err) {
    console.error('Failed to detect integration paths:', err);
    if (state.settings) {
      if (dom.settingsAntigravityPath) {
        dom.settingsAntigravityPath.value = state.settings.antigravityPath || 'not detected';
      }
      if (dom.settingsAntigravityAgentPath) {
        dom.settingsAntigravityAgentPath.value = state.settings.antigravityAgentPath || 'not detected';
      }
      if (dom.settingsAndroidStudioPath) {
        dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || 'not detected';
      }
      if (dom.settingsVsCodePath) {
        dom.settingsVsCodePath.value = state.settings.vscodePath || 'not detected';
      }
      if (dom.settingsScrcpyPath) {
        dom.settingsScrcpyPath.value = state.settings.scrcpyPath || 'not detected';
      }
      if (dom.settingsFigmaPath) {
        dom.settingsFigmaPath.value = state.settings.figmaPath || '';
      }
      if (dom.settingsObsidianPath) {
        dom.settingsObsidianPath.value = state.settings.obsidianPath || 'not detected';
      }
      if (dom.settingsObsidianVault) {
        dom.settingsObsidianVault.value = state.settings.obsidianVault || '';
      }
    }
  }
}


async function hideSettingsScreen() {
  await saveSettingsFromUI();
  dom.settingsScreen.classList.add('hidden');
  fitActiveTerminal();
  startAutoRefreshLoop();
}

// ── Symlink Screen ─────────────────────────────────────
async function showSymlinkScreen() {
  const activeWorktreePath = state.activeWorktreePath;
  const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'No active project';

  if (dom.symlinkScreenActiveName) dom.symlinkScreenActiveName.textContent = activeWorktreeName;
  if (dom.symlinkScreenActivePath) dom.symlinkScreenActivePath.textContent = activeWorktreePath || 'Please select a worktree first.';

  if (dom.terminalScreen) dom.terminalScreen.classList.add('hidden');
  if (dom.btnTerminalScreen) dom.btnTerminalScreen.classList.remove('active');
  dom.settingsScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.remove('hidden');

  if (dom.symlinkScreenNewPath) dom.symlinkScreenNewPath.value = '';
  if (dom.symlinkScreenNewName) dom.symlinkScreenNewName.value = '';
  if (dom.symlinkScreenNameGroup) dom.symlinkScreenNameGroup.classList.add('hidden');

  let targets = state.settings?.symlinkTargets || [];
  if (activeWorktreePath) {
    try {
      const scanned = await window.api.scanSymlinks({ worktreePath: activeWorktreePath });
      if (scanned && scanned.length > 0) {
        let changed = false;
        const updated = [...targets];

        for (const scannedItem of scanned) {
          const existingIndex = updated.findIndex((t) => t.name.toLowerCase() === scannedItem.name.toLowerCase());
          if (existingIndex === -1) {
            updated.push(scannedItem);
            changed = true;
          } else if (updated[existingIndex].targetPath !== scannedItem.targetPath) {
            updated[existingIndex].targetPath = scannedItem.targetPath;
            changed = true;
          }
        }

        if (changed) {
          state.settings = await window.api.updateSettings({
            ...state.settings,
            symlinkTargets: updated,
          });
          targets = state.settings.symlinkTargets;
        }
      }
    } catch (e) {
      console.warn('Failed to scan and merge symlinks:', e.message);
    }
  }

  await renderSymlinkScreenList(targets);
}

function hideSymlinkScreen() {
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  fitActiveTerminal();
  startAutoRefreshLoop();
}

async function renderSymlinkScreenList(symlinkTargets) {
  const listContainer = dom.symlinkScreenListContainer;
  if (!listContainer) return;

  if (!symlinkTargets || symlinkTargets.length === 0) {
    listContainer.innerHTML = `
      <div class="symlink-empty-state">
        <div class="symlink-empty-icon" style="font-size:24px;">🔗</div>
        <div style="font-weight:600; margin-top:4px;">No managed symlinks yet</div>
        <p class="form-hint" style="margin:4px 0 0; font-size:11px;">Add a target folder on the right to link it to your active project.</p>
      </div>
    `;
    return;
  }

  const activeWorktreePath = state.activeWorktreePath;
  if (!activeWorktreePath) {
    listContainer.innerHTML = `
      <div class="symlink-empty-state">
        <div style="font-weight:600; color: var(--danger-default);">No Active Worktree</div>
        <p class="form-hint" style="margin:4px 0 0; font-size:11px;">Open a worktree or project first to select/unselect symlinks.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:16px; align-items:center; gap:8px;"><span class="spinner"></span> Checking status...</div>`;

  try {
    const statuses = await Promise.all(
      symlinkTargets.map(async (t) => {
        try {
          const status = await window.api.checkSymlinkStatus({
            worktreePath: activeWorktreePath,
            name: t.name,
            targetPath: t.targetPath,
          });
          return { ...t, status };
        } catch (e) {
          return { ...t, status: { exists: false, pointsToTarget: false, error: e.message } };
        }
      })
    );

    listContainer.innerHTML = `
      <div class="symlink-list">
        ${statuses.map((t) => {
          let statusBadge = '';
          let checked = '';
          let itemClass = '';
          let titleText = `Target: ${t.targetPath}`;

          if (t.status.exists) {
            if (t.status.pointsToTarget) {
              statusBadge = `<span class="symlink-status-badge symlink-status-linked">Linked</span>`;
              checked = 'checked';
            } else if (t.status.isRealDirectory) {
              statusBadge = `<span class="symlink-status-badge" style="background: rgba(239, 68, 68, 0.15); color: rgb(248, 113, 113);" title="A real folder exists at this name, not a link.">Folder Conflict</span>`;
              itemClass = 'conflict';
            } else {
              statusBadge = `<span class="symlink-status-badge" style="background: rgba(245, 158, 11, 0.15); color: rgb(251, 191, 36);" title="Points to: ${t.status.currentTarget}">Different Target</span>`;
              itemClass = 'different';
            }
          } else {
            statusBadge = `<span class="symlink-status-badge symlink-status-unlinked">Not Linked</span>`;
          }

          return `
            <div class="symlink-item ${itemClass}">
              <label class="symlink-label" title="${titleText}">
                <input type="checkbox" class="symlink-checkbox" data-name="${t.name}" data-target="${t.targetPath}" ${checked} />
                <div class="symlink-info">
                  <span class="symlink-name">${t.name}</span>
                  <span class="symlink-target-path">${t.targetPath}</span>
                </div>
              </label>
              <div style="display:flex; align-items:center; gap:8px;">
                ${statusBadge}
                <button type="button" class="btn-icon symlink-delete-btn" data-name="${t.name}" title="Remove from list">
                  ${icons.trash}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind checkbox toggle events
    listContainer.querySelectorAll('.symlink-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e) => {
        const target = e.target;
        const name = target.dataset.name;
        const targetPath = target.dataset.target;
        const isChecked = target.checked;

        target.disabled = true;
        try {
          if (isChecked) {
            showToast(`Creating symlink for ${name}...`, 'info');
            const res = await window.api.createSymlink({ worktreePath: activeWorktreePath, name, targetPath });
            if (res.success) {
              showToast(`Linked ${name} successfully!`, 'success');
            } else {
              showToast(`Link failed: ${res.error}`, 'error');
              target.checked = false;
            }
          } else {
            showToast(`Removing symlink for ${name}...`, 'info');
            const res = await window.api.deleteSymlink({ worktreePath: activeWorktreePath, name });
            if (res.success) {
              showToast(`Removed link for ${name}!`, 'success');
            } else {
              showToast(`Removal failed: ${res.error}`, 'error');
              target.checked = true;
            }
          }
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
          target.checked = !isChecked;
        } finally {
          target.disabled = false;
          renderSymlinkScreenList(symlinkTargets);
        }
      });
    });

    // Bind delete target events
    listContainer.querySelectorAll('.symlink-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const name = btn.dataset.name;
        if (activeWorktreePath) {
          try {
            showToast(`Removing symlink for ${name}...`, 'info');
            const res = await window.api.deleteSymlink({ worktreePath: activeWorktreePath, name });
            if (res && !res.success) {
              showToast(`Failed to remove link for ${name}: ${res.error}`, 'error');
            } else {
              showToast(`Removed link for ${name}!`, 'success');
            }
          } catch (err) {
            console.error('Failed to delete symlink:', err);
          }
        }
        const updated = symlinkTargets.filter((t) => t.name !== name);
        state.settings = await window.api.updateSettings({
          ...state.settings,
          symlinkTargets: updated,
        });
        await renderSymlinkScreenList(state.settings.symlinkTargets);
      });
    });

  } catch (err) {
    listContainer.innerHTML = `<div style="color:var(--danger-default); padding:16px;">Failed to load status: ${err.message}</div>`;
  }
}

// ── Bind Symlink Screen Listeners ───────────────────────
if (dom.btnCloseSymlinkScreen) {
  dom.btnCloseSymlinkScreen.addEventListener('click', hideSymlinkScreen);
}

const handleSymlinkScreenBrowse = async () => {
  try {
    const selectedDir = await window.api.selectDirectory('Select Folder to Symlink');
    if (selectedDir) {
      if (dom.symlinkScreenNewPath) dom.symlinkScreenNewPath.value = selectedDir;
      if (dom.symlinkScreenNewName) {
        const leaf = selectedDir.split(/[\\/]/).filter(Boolean).pop() || '';
        dom.symlinkScreenNewName.value = leaf;
      }
      if (dom.symlinkScreenNameGroup) dom.symlinkScreenNameGroup.classList.remove('hidden');
    }
  } catch (err) {
    showToast(`Browse failed: ${err.message}`, 'error');
  }
};

if (dom.symlinkScreenNewPath) {
  dom.symlinkScreenNewPath.addEventListener('click', handleSymlinkScreenBrowse);
}
if (dom.btnBrowseSymlinkScreen) {
  dom.btnBrowseSymlinkScreen.addEventListener('click', handleSymlinkScreenBrowse);
}

if (dom.btnAddSymlinkScreenTarget) {
  dom.btnAddSymlinkScreenTarget.addEventListener('click', async () => {
    const pathVal = dom.symlinkScreenNewPath ? dom.symlinkScreenNewPath.value.trim() : '';
    let nameVal = dom.symlinkScreenNewName ? dom.symlinkScreenNewName.value.trim() : '';

    if (!pathVal) {
      showToast('Please select a target folder first', 'error');
      return;
    }
    if (!nameVal) {
      nameVal = pathVal.split(/[\\/]/).filter(Boolean).pop() || '';
    }
    if (!nameVal) {
      showToast('Please enter a name for the symlink', 'error');
      return;
    }

    const currentTargets = state.settings.symlinkTargets || [];
    if (currentTargets.some((t) => t.name.toLowerCase() === nameVal.toLowerCase())) {
      showToast(`A symlink target named "${nameVal}" already exists in the list`, 'error');
      return;
    }

    const updated = [...currentTargets, { name: nameVal, targetPath: pathVal }];
    state.settings = await window.api.updateSettings({
      ...state.settings,
      symlinkTargets: updated,
    });

    const activeWorktreePath = state.activeWorktreePath;
    let linkSuccess = false;
    if (activeWorktreePath) {
      try {
        showToast(`Creating symlink for ${nameVal}...`, 'info');
        const res = await window.api.createSymlink({
          worktreePath: activeWorktreePath,
          name: nameVal,
          targetPath: pathVal,
        });
        if (res.success) {
          linkSuccess = true;
          showToast(`Linked ${nameVal} successfully!`, 'success');
        } else {
          showToast(`Link failed: ${res.error}`, 'error');
        }
      } catch (err) {
        showToast(`Link failed: ${err.message}`, 'error');
      }
    }

    await renderSymlinkScreenList(state.settings.symlinkTargets);

    if (dom.symlinkScreenNewPath) dom.symlinkScreenNewPath.value = '';
    if (dom.symlinkScreenNewName) dom.symlinkScreenNewName.value = '';
    if (dom.symlinkScreenNameGroup) dom.symlinkScreenNameGroup.classList.add('hidden');
    
    if (linkSuccess) {
      showToast(`Added and linked "${nameVal}" successfully!`, 'success');
    } else {
      showToast(`Added "${nameVal}" to managed symlinks`, 'success');
    }
  });
}

// ── Add Worktree Modal ─────────────────────────────────
async function showAddWorktreeModal(project) {
  return openAddWorktreeModal({
    project,
    dom,
    api: window.api,
    getAvailableWorktreeBranches,
    getOfficialWorktreeBasePath,
    branchComboHTML,
    setupBranchCombo,
    syncWorktreePathInput,
    configureModalFooter,
    showModal,
    focusModalInputLater,
    hideModal,
    createWorktreeSubmitHandler,
  });
}

async function showAddSubWorktreeModal(project, sourceWorktree) {
  return openAddSubWorktreeModal({
    project,
    sourceWorktree,
    dom,
    state,
    api: window.api,
    canCreateNestedWorktree: (projectArg, wtArg) => getDomainCanCreateNestedWorktree(projectArg, wtArg),
    showToast,
    getAvailableWorktreeBranches,
    getWorktreeBasePath: (projectArg) => getDomainWorktreeBasePath(projectArg),
    esc,
    branchComboHTML,
    setupBranchCombo,
    syncWorktreePathInput,
    configureModalFooter,
    showModal,
    focusModalInputLater,
    hideModal,
    createWorktreeSubmitHandler,
  });
}

async function showMergeWorktreeModal(project, wt) {
  return openMergeWorktreeModal({
    project,
    wt,
    dom,
    api: window.api,
    showToast,
    esc,
    branchComboHTML,
    setupBranchCombo,
    configureModalFooter,
    showModal,
    focusModalInputLater,
    hideModal,
    withAsyncButtonState,
    refreshProjectWorkspaces,
    icons,
  });
}

async function showForceRemoveWorktreeModal(project, wt) {
  return openForceRemoveWorktreeModal({
    project,
    wt,
    dom,
    api: window.api,
    showToast,
    esc,
    configureModalFooter,
    showModal,
    hideModal,
    withAsyncButtonState,
    refreshProjectWorkspaces,
    icons,
    closeWorktreeOwnedSessions,
    releaseWorktreeOwnedSessions,
  });
}

// ── Agent Toolkit Screen ───────────────────────────────────
async function showAgentToolkitScreen() {
  const activeWorktreePath = state.activeWorktreePath;
  const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'No active project';

  if (dom.agentToolkitActiveName) dom.agentToolkitActiveName.textContent = activeWorktreeName;
  if (dom.agentToolkitActivePath) dom.agentToolkitActivePath.textContent = activeWorktreePath || 'Please select a worktree first.';

  if (dom.terminalScreen) dom.terminalScreen.classList.add('hidden');
  if (dom.btnTerminalScreen) dom.btnTerminalScreen.classList.remove('active');
  dom.settingsScreen.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.remove('hidden');

  await refreshAgentToolkitStatus();
}

function hideAgentToolkitScreen() {
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');
  fitActiveTerminal();
  startAutoRefreshLoop();
}

// ── Device Manager Screen ──────────────────────────────────
const deviceManagerScreen = new DeviceManagerScreen({
  dom,
  showToast,
  getActiveWorktreePath: () => state.activeWorktreePath,
  refreshDashboardDeviceChip: checkDashboardAdbDevice,
  icons,
});

async function showDeviceManagerScreen() {
  if (dom.terminalScreen) dom.terminalScreen.classList.add('hidden');
  if (dom.btnTerminalScreen) dom.btnTerminalScreen.classList.remove('active');
  dom.settingsScreen?.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.add('active');

  await deviceManagerScreen.show();
}

function hideDeviceManagerScreen() {
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  deviceManagerScreen.hide();
  fitActiveTerminal();
  startAutoRefreshLoop();
}

// Toolkit components to link/manage
const BAKIT_COMPONENTS = [
  {
    id: 'bakit_agents',
    toolkit: 'bakit',
    name: 'BA Agent Roster',
    folderName: '.agents\\agents',
    sourceFolder: 'agents',
    description: 'Deploy ba-lead, competitor-analyst, ba-researcher, ba-brainstormer, and ba-spec-writer agents.',
    gitExcludePatterns: [
      '.agents/agents/ba-lead.md',
      '.agents/agents/competitor-analyst.md',
      '.agents/agents/ba-researcher.md',
      '.agents/agents/ba-brainstormer.md',
      '.agents/agents/ba-spec-writer.md'
    ]
  },
  {
    id: 'bakit_skills',
    toolkit: 'bakit',
    name: 'BA Skills & Templates (specs, competitor analysis, audits, test cases)',
    folderName: '.agents\\skills',
    sourceFolder: 'skills',
    description: 'ba-templates catalog, competitor-app-analysis, mobilerun, specs, BA-audit-SRS/QnA, test-cases, brainstorm, mermaid.',
    gitExcludePatterns: [
      '.agents/skills/ba-templates/',
      '.agents/skills/competitor-app-analysis/',
      '.agents/skills/mobilerun/',
      '.agents/skills/specs/',
      '.agents/skills/test-cases/',
      '.agents/skills/BA-audit-SRS/',
      '.agents/skills/BA-audit-QnA/',
      '.agents/skills/brainstorm-features/',
      '.agents/skills/document-extraction/',
      '.agents/skills/mermaidjs-v11/',
      '.agents/skills/problem-solving/',
      '.agents/skills/sequential-thinking/'
    ]
  },
  {
    id: 'bakit_rules_workflows',
    toolkit: 'bakit',
    name: 'BA Rules, Slash Workflows & Project Config',
    isMulti: true,
    folders: [
      { name: '.agents\\rules', source: 'rules', pattern: '.agents/rules/' },
      { name: '.agents\\workflows', source: 'workflows', pattern: '.agents/workflows/' },
      // The project config is filled in per project: never overwrite it, never delete it.
      { name: '.agents\\config', source: 'config', pattern: '.agents/config/', preserveExisting: true, keepOnRemove: true }
    ],
    description: 'Always-on BA rules (Vietnamese deliverables, naming, device safety) and /ba-competitor, /ba-template, /ba-spec, /ba-review, /ba-testcases, /ba-device-check.',
    gitExcludePatterns: [
      '.agents/rules/ba-global-rules.md',
      '.agents/rules/ba-workflow.md',
      '.agents/rules/ba-naming-convention.md',
      '.agents/rules/ba-device-automation.md',
      '.agents/rules/ba-markdown-formatting.md',
      '.agents/workflows/ba-*.md'
    ]
  },
  {
    id: 'bakit_mobilerun_mcp',
    toolkit: 'bakit',
    kind: 'mcp',
    name: 'Mobilerun MCP (Antigravity)',
    description: "Registers the mobilerun server in Antigravity's global MCP config so agents can drive competitor apps on the connected Android device. Applies to every Antigravity workspace.",
    gitExcludePatterns: []
  }
];

const TOOLKIT_COMPONENTS = [...BAKIT_COMPONENTS];

async function refreshAgentToolkitStatus() {
  const activeWorktreePath = state.activeWorktreePath;
  const projectPath = state.selectedProjectPath || (state.projects[0] ? state.projects[0].path : null);
  
  if (!activeWorktreePath || !projectPath) {
    if (dom.agentToolkitListContainer) {
      dom.agentToolkitListContainer.innerHTML = `<div class="symlink-empty-state">No Active Worktree or Project path found.</div>`;
    }
    return;
  }

  const cleanPath = (p: string) => p.replace(/\//g, '\\');
  const pPath = cleanPath(projectPath);

  // 1. Determine toolkit source directories
  const defaultSources = await window.api.getDefaultToolkitSources();

  let bakitPath = defaultSources.bakitPath;
  if (!(await window.api.pathExists(bakitPath)) && (await window.api.pathExists(pPath + '\\toolkits\\BAKit'))) {
    bakitPath = pPath + '\\toolkits\\BAKit';
  }

  const srcBaseFor = (_comp: any) => bakitPath;

  const listContainer = dom.agentToolkitListContainer;
  if (!listContainer) return;

  const savedScrollTop = listContainer.scrollTop;

  if (!listContainer.innerHTML || listContainer.innerHTML.includes('No Active Worktree') || listContainer.innerHTML.includes('No active project')) {
    listContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:16px; align-items:center; gap:8px;"><span class="spinner"></span> Checking status...</div>`;
  }

  try {
    // Fetch statuses for all components
    const statuses = await Promise.all(TOOLKIT_COMPONENTS.map(async (comp: any) => {
      if (comp.kind === 'mcp') {
        try {
          const mcp = await window.api.getMobilerunMcpStatus();
          return { id: comp.id, name: comp.name, sourceExists: mcp.registered || !!mcp.pythonPath, exists: mcp.registered };
        } catch (e) {
          return { id: comp.id, name: comp.name, sourceExists: false, exists: false };
        }
      }
      const srcBase = srcBaseFor(comp);
      
      let sourceExists = false;
      try {
        if (comp.isMulti) {
          const folderChecks = await Promise.all(comp.folders.map(async (f: any) => {
            const rel = f.source || f.name;
            return await window.api.pathExists(srcBase + '\\' + rel);
          }));
          sourceExists = folderChecks.every(v => v);
        } else {
          const rel = comp.sourceFolder || comp.folderName;
          sourceExists = await window.api.pathExists(srcBase + '\\' + rel);
        }
      } catch (err) {
        sourceExists = false;
      }

      let exists = false;
      if (comp.isMulti) {
        const subResults = await Promise.all(comp.folders.map(async (f: any) => {
          try {
            const rel = f.source || f.name;
            const status = await window.api.checkToolkitStatus({
              worktreePath: activeWorktreePath,
              name: f.name,
              sourcePath: srcBase + '\\' + rel
            });
            return status.exists;
          } catch (e) {
            return false;
          }
        }));
        exists = subResults.every(r => r);
      } else {
        try {
          const rel = comp.sourceFolder || comp.folderName;
          const status = await window.api.checkToolkitStatus({
            worktreePath: activeWorktreePath,
            name: comp.folderName,
            sourcePath: srcBase + '\\' + rel
          });
          exists = status.exists;
        } catch (e) {
          exists = false;
        }
      }

      return {
        id: comp.id,
        name: comp.name,
        sourceExists,
        exists
      };
    }));

    const getStatus = (id: string) => statuses.find(s => s.id === id) || { exists: false, sourceExists: false };

    function renderComponentItem(compItem: any) {
      const stateItem = getStatus(compItem.id);
      let badgeHTML = '';
      let checked = '';
      let disabledAttr = '';
      let opacityStyle = '';

      if (!stateItem.sourceExists) {
        badgeHTML = `<span class="symlink-status-badge symlink-status-unlinked" style="background: rgba(239, 68, 68, 0.15); color: rgb(248, 113, 113); border: 1px solid rgba(239, 68, 68, 0.25);">Source Missing</span>`;
        disabledAttr = 'disabled';
        opacityStyle = 'opacity: 0.65;';
      } else if (stateItem.exists) {
        badgeHTML = `<span class="symlink-status-badge symlink-status-linked" style="background: rgba(16, 185, 129, 0.15); color: rgb(52, 211, 153); border: 1px solid rgba(16, 185, 129, 0.25);">Active</span>`;
        checked = 'checked';
      } else {
        badgeHTML = `<span class="symlink-status-badge symlink-status-unlinked" style="background: rgba(255, 255, 255, 0.05); color: var(--text-tertiary); border: 1px solid var(--border-subtle);">Not Present</span>`;
      }

      let compIcon = '';
      if (compItem.kind === 'mcp') {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: var(--accent-default); width: 16px; height: 16px;">${icons.android}</span>`;
      } else if (compItem.id.includes('antigravity')) {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: var(--accent-default); width: 16px; height: 16px;">${icons.antigravity}</span>`;
      } else if (compItem.id.includes('claude')) {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: #d97706; width: 16px; height: 16px;">${icons.claude}</span>`;
      } else if (compItem.id.includes('codex')) {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: #2563eb; width: 16px; height: 16px;">${icons.codex}</span>`;
      } else if (compItem.id.includes('opencode')) {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: #4b5563; width: 16px; height: 16px;">${icons.opencode}</span>`;
      } else {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: var(--accent-default); width: 16px; height: 16px;">${icons.agentToolkit}</span>`;
      }

      return `
        <div class="symlink-item" style="margin-bottom: 8px; border-radius: var(--radius-md); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); border: 1px solid var(--border-subtle); ${opacityStyle}">
          <label class="symlink-label" style="cursor: ${stateItem.sourceExists ? 'pointer' : 'not-allowed'}; display: flex; align-items: center; gap: 8px; width: 100%;">
            <input type="checkbox" class="agent-toolkit-checkbox" data-id="${compItem.id}" ${checked} ${disabledAttr} style="margin-right: 4px; cursor: ${stateItem.sourceExists ? 'pointer' : 'not-allowed'};" />
            ${compIcon}
            <div>
              <span class="symlink-name" style="font-size: 13px; font-weight: 600; color: var(--text-default);">${compItem.name}</span>
              <div style="font-size: 11px; color: var(--text-tertiary);">${compItem.description || ''}</div>
            </div>
          </label>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink: 0;">
            ${badgeHTML}
          </div>
        </div>
      `;
    }

    // Generate BAKit HTML Group
    const bakitItemsHtml = BAKIT_COMPONENTS.map(b => renderComponentItem(b)).join('');
    const bakitActive = BAKIT_COMPONENTS.some(b => b.kind !== 'mcp' && getStatus(b.id).exists);
    const bakitBadge = bakitActive
      ? `<span class="symlink-status-badge symlink-status-linked" style="background: rgba(16, 185, 129, 0.15); color: rgb(52, 211, 153); font-size: 10px; padding: 2px 6px;">Harness Active</span>`
      : `<span class="symlink-status-badge symlink-status-unlinked" style="font-size: 10px; padding: 2px 6px;">Idle</span>`;

    const bakitHtml = `
      <div style="display: flex; flex-direction: column; align-items: stretch; gap: 12px; padding: 18px 20px; background: var(--bg-default); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="color: var(--accent-default); display: flex; align-items: center; font-size: 18px;">
              ${icons.agentToolkit}
            </div>
            <div class="symlink-info">
              <span class="symlink-name" style="font-size: 15px; font-weight: 700; color: var(--text-default);">BAKit — Antigravity BA Toolkit</span>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">BA agents, template catalog, and competitor app analysis over the mobilerun MCP server.</div>
            </div>
          </div>
          ${bakitBadge}
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--border-subtle); padding-top: 14px; margin-top: 6px;">
          ${bakitItemsHtml}
        </div>
      </div>
    `;

    listContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr; gap: 20px; width: 100%;">
        ${bakitHtml}
      </div>
    `;

    listContainer.scrollTop = savedScrollTop;

    listContainer.querySelectorAll('.agent-toolkit-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e: any) => {
        const target = e.target;
        const id = target.dataset.id;
        const isChecked = target.checked;
        const comp: any = TOOLKIT_COMPONENTS.find(c => c.id === id);

        if (!comp) return;
        target.disabled = true;

        const srcBase = srcBaseFor(comp);

        const safeDeploy = async (name: string, sourcePath: string, preserveExisting = false) => {
          const res = await window.api.deployToolkit({
            worktreePath: activeWorktreePath,
            name,
            sourcePath,
            preserveExisting
          });
          if (!res.success) throw new Error(res.error || `Failed to deploy ${name}`);
        };

        const safeRemove = async (name: string, sourcePath: string) => {
          const res = await window.api.removeToolkit({
            worktreePath: activeWorktreePath,
            name,
            sourcePath
          });
          if (!res.success) throw new Error(res.error || `Failed to remove ${name}`);
        };

        try {
          if (comp.kind === 'mcp') {
            if (isChecked) {
              const res = await window.api.registerMobilerunMcp();
              if (!res.success) throw new Error(res.error || 'Failed to register mobilerun MCP');
              showToast(res.alreadyRegistered
                ? `mobilerun is already registered in ${res.configPath}.`
                : `Registered mobilerun in ${res.configPath}. Restart the Antigravity agent to load it.`, 'success');
            } else {
              if (!window.confirm("Remove the mobilerun MCP server from Antigravity's global config? This affects every Antigravity workspace.")) {
                target.checked = true;
                return;
              }
              const res = await window.api.unregisterMobilerunMcp();
              if (!res.success) throw new Error(res.error || 'Failed to unregister mobilerun MCP');
              showToast(`Removed mobilerun from ${res.configPath}.`, 'success');
            }
            return;
          }

          if (isChecked) {
            showToast(`Activating ${comp.name}...`, 'info');
            
            if (comp.isMulti) {
              for (const f of comp.folders) {
                const rel = f.source || f.name;
                await safeDeploy(f.name, srcBase + '\\' + rel, !!f.preserveExisting);
              }
            } else {
              const rel = comp.sourceFolder || comp.folderName;
              await safeDeploy(comp.folderName, srcBase + '\\' + rel);
            }

            await window.api.updateGitExclude({
              worktreePath: activeWorktreePath,
              patterns: comp.gitExcludePatterns,
              action: 'add'
            });

            showToast(`Successfully activated ${comp.name}!`, 'success');
          } else {
            showToast(`Deactivating ${comp.name}...`, 'info');
            
            if (comp.isMulti) {
              for (const f of comp.folders) {
                if (f.keepOnRemove) continue;
                const rel = f.source || f.name;
                await safeRemove(f.name, srcBase + '\\' + rel);
              }
            } else {
              const rel = comp.sourceFolder || comp.folderName;
              await safeRemove(comp.folderName, srcBase + '\\' + rel);
            }

            await window.api.updateGitExclude({
              worktreePath: activeWorktreePath,
              patterns: comp.gitExcludePatterns,
              action: 'remove'
            });

            showToast(`Successfully deactivated ${comp.name}.`, 'success');
          }
        } catch (err) {
          showToast(`Error: ${(err as any).message}`, 'error');
          target.checked = !isChecked;
        } finally {
          target.disabled = false;
          await refreshAgentToolkitStatus();
        }
      });
    });

  } catch (err: any) {
    listContainer.innerHTML = `<div style="color:var(--danger-default); padding:16px;">Failed to load status: ${err.message}</div>`;
  }
}

if (dom.btnAgentToolkitApplyAll) {
  dom.btnAgentToolkitApplyAll.addEventListener('click', async () => {
    const listContainer = dom.agentToolkitListContainer;
    if (!listContainer) return;
    const checkboxes = Array.from(listContainer.querySelectorAll('.agent-toolkit-checkbox:not(:checked):not(:disabled)')) as HTMLInputElement[];
    if (checkboxes.length === 0) {
      showToast('All available toolkits are already active!', 'info');
      return;
    }
    showToast(`Activating ${checkboxes.length} toolkits...`, 'info');
    for (const cb of checkboxes) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    }
  });
}

if (dom.btnCloseAgentToolkitScreen) {
  dom.btnCloseAgentToolkitScreen.addEventListener('click', hideAgentToolkitScreen);
}

if (dom.btnAgentToolkit) {
  dom.btnAgentToolkit.addEventListener('click', () => {
    const activeWorktreePath = getRequiredActiveWorktreePath();
    if (!activeWorktreePath) return;
    showAgentToolkitScreen();
  });
}

if (dom.btnDeviceManager) {
  dom.btnDeviceManager.addEventListener('click', () => {
    void showDeviceManagerScreen();
  });
}

if (dom.btnCloseDeviceManagerScreen) {
  dom.btnCloseDeviceManagerScreen.addEventListener('click', hideDeviceManagerScreen);
}






// ── Auto Refresh ───────────────────────────────────────
let autoRefreshIntervalId = null;

function startAutoRefreshLoop() {
  if (autoRefreshIntervalId) {
    clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
  }
  const intervalSeconds = state.settings?.autoRefreshInterval || 10;
  const intervalMs = intervalSeconds * 1000;
  autoRefreshIntervalId = setInterval(async () => {
    if (state.settings?.autoRefreshCurrentProject && state.selectedProjectPath) {
      try {
        await window.api.refreshWorktrees(state.selectedProjectPath);
        await loadWorkspaces();
      } catch (err) {
        console.error('Auto refresh failed:', err);
      }
    }
  }, intervalMs);
}

// ── Initialize ─────────────────────────────────────────
initializeRendererLifecycle({
  loadWorkspaceSidebarCollapsed,
  setWorkspaceSidebarCollapsed,
  loadTabSidebarCollapsed,
  setTabSidebarCollapsed,
  loadWorkspaces,
  PREWARM_TOOLS,
  cleanupPrewarm,
  state,
  ptyKill: window.api.ptyKill,
});

startAutoRefreshLoop();

// ── Global Keyboard Shortcuts ──────────────────────────
window.addEventListener('keydown', (e) => {
  // 1. Escape key closes open modals or screens
  if (e.key === 'Escape') {
    if (dom.modalOverlay && dom.modalOverlay.style.display !== 'none') {
      dom.modalCloseBtn?.click();
      return;
    }
    if (dom.terminalScreen && !dom.terminalScreen.classList.contains('hidden')) {
      hideTerminalScreen();
      return;
    }
    if (dom.settingsScreen && !dom.settingsScreen.classList.contains('hidden')) {
      dom.btnCloseSettings?.click();
      return;
    }
    if (dom.symlinkScreen && !dom.symlinkScreen.classList.contains('hidden')) {
      dom.btnCloseSymlinkScreen?.click();
      return;
    }
    if (dom.agentToolkitScreen && !dom.agentToolkitScreen.classList.contains('hidden')) {
      dom.btnCloseAgentToolkitScreen?.click();
      return;
    }
    if (dom.deviceManagerScreen && !dom.deviceManagerScreen.classList.contains('hidden')) {
      dom.btnCloseDeviceManagerScreen?.click();
      return;
    }
  }

  // 2. Ctrl+, / Cmd+, opens/toggles Settings
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    if (dom.settingsScreen && dom.settingsScreen.classList.contains('hidden')) {
      showSettingsScreen();
    } else if (dom.settingsScreen) {
      hideSettingsScreen();
    }
    return;
  }

  // 3. Ctrl+N / Cmd+N opens terminal screen or creates a new tab
  if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
    e.preventDefault();
    if (!isTerminalScreenVisible()) {
      void showTerminalScreen();
    } else {
      createNewTerminalTab();
    }
    return;
  }
});

