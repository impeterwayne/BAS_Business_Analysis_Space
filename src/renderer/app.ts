/* ═══════════════════════════════════════════════════════
   BA Space — Renderer (Workspace + Sidebar)
   ═══════════════════════════════════════════════════════ */

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
  parseFirebaseUrl,
  parsePlaneUrl,
  parseDocUrl,
  formatDisplayUrl,
  parseTargetFlows,
  buildBenchmarkSlashCommand,
  buildTargetFlowSlashCommand,
  buildChecklistSlashCommand,
  buildFeatureExtractorSlashCommand,
  cleanApkAppName,
} = require('../domain');

const { initializeRendererLifecycle } = require('./lifecycle');
const { openCreateBranchModal } = require('./modals/createBranchModal');
const { openAddWorktreeModal, openAddSubWorktreeModal, openMergeWorktreeModal, openForceRemoveWorktreeModal } = require('./modals/worktreeModals');
const { openCompetitorModal } = require('./modals/competitorModal');
const { openMobilerunSetupModal } = require('./modals/mobilerunSetupModal');
const { createModalHelpers } = require('./ui/modalHelpers');
const { createModalPrimitives } = require('./ui/modalPrimitives');
const { DeviceManagerScreen } = require('./screens/deviceManagerScreen');

// ── State ──────────────────────────────────────────────
const state: {
  projects: any[];
  settings: {
    subworktreeBranchParents?: Record<string, string>;
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
    autoRefreshCurrentProject?: boolean;
    autoRefreshInterval?: number;
    symlinkTargets?: Array<{ name: string; targetPath: string }>;
  };
  workspaceSidebarCollapsed: boolean;
  expandedProjects: Set<string>;
  activeWorktreePath: string | null;
  selectedProjectPath: string | null;
} = {
  projects: [],
  settings: {
    subworktreeBranchParents: {},
    autoRefreshCurrentProject: false,
    autoRefreshInterval: 10,
  },
  workspaceSidebarCollapsed: false,
  expandedProjects: new Set(),
  activeWorktreePath: null,
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
  btnVsCode: $('#btn-vscode'),
  btnExplorer: $('#btn-explorer'),
  btnAndroidStudio: $('#btn-android-studio'),
  btnAntigravity: $('#btn-antigravity'),
  btnAntigravityAgent: $('#btn-antigravity-agent'),
  btnFigma: $('#btn-figma'),
  btnProjectResources: $('#btn-project-resources'),
  btnResourcesBadge: $('#btn-resources-badge'),
  projectResourcesScreen: $('#project-resources-screen'),
  btnCloseProjectResourcesScreen: $('#btn-close-project-resources-screen'),
  btnSyncResourcesConfig: $('#btn-sync-resources-config'),
  resourcesViewToggle: $('#resources-view-toggle'),
  resourcesBtnViewGrid: $('#resources-btn-view-grid'),
  resourcesBtnViewList: $('#resources-btn-view-list'),
  resourcesSectionsContainer: $('.resources-sections-container') as HTMLElement | null,
  resourcesProjectName: $('#resources-project-name'),
  resourcesBranchBadge: $('#resources-branch-badge'),
  resourcesProjectPath: $('#resources-project-path'),
  btnObsidian: $('#btn-obsidian'),
  dashboardEmptyState: $('#dashboard-empty-state'),
  btnDashboardAddFirst: $('#btn-dashboard-add-first'),
  btnDashboardEmptySettings: $('#btn-dashboard-empty-settings'),
  dashboardViewer: $('#dashboard-viewer'),
  dashProjectName: $('#dash-project-name'),
  dashBranchBadge: $('#dash-branch-badge'),
  dashProjectPath: $('#dash-project-path'),
  dashBtnCopyPath: $('#dash-btn-copy-path'),
  dashBtnRevealPath: $('#dash-btn-reveal-path'),
  dashBtnRefreshProject: $('#dash-btn-refresh-project'),
  dashFigmaStatusPill: $('#dash-figma-status-pill'),
  dashFigmaActions: $('#dash-figma-actions'),
  dashFigmaBody: $('#dash-figma-body'),
  dashBtnOpenFigma: $('#dash-btn-open-figma'),
  dashBtnBrowserFigma: $('#dash-btn-browser-figma'),
  dashFirebaseStatusPill: $('#dash-firebase-status-pill'),
  dashFirebaseBody: $('#dash-firebase-body'),
  dashBtnBrowserFirebase: $('#dash-btn-browser-firebase'),
  dashPlaneStatusPill: $('#dash-plane-status-pill'),
  dashPlaneBody: $('#dash-plane-body'),
  dashBtnBrowserPlane: $('#dash-btn-browser-plane'),
  dashLegacyDocsStatusPill: $('#dash-legacy-docs-status-pill'),
  dashLegacyDocsActions: $('#dash-legacy-docs-actions'),
  dashLegacyDocsBody: $('#dash-legacy-docs-body'),
  dashBtnBrowserPrd: $('#dash-btn-browser-prd'),
  dashBtnBrowserChecklist: $('#dash-btn-browser-checklist'),
  dashSectionAgentToolkit: $('#dash-section-agent-toolkit'),
  dashToolkitHeader: $('#dash-toolkit-header'),
  dashToolkitBody: $('#dash-toolkit-body') as HTMLElement | null,
  dashToolkitStatusPill: $('#dash-toolkit-status-pill'),
  dashToolkitCountBadge: $('#dash-toolkit-count-badge'),
  dashSectionCompetitors: $('#dash-section-competitors'),
  dashBtnImportCompApk: $('#dash-btn-import-comp-apk'),
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
  settingsAntigravityPath: $('#settings-antigravity-path'),
  settingsAntigravityAgentPath: $('#settings-antigravity-agent-path'),
  settingsClaudeDesktopPath: $('#settings-claude-desktop-path') as HTMLInputElement | null,
  settingsVsCodePath: $('#settings-vscode-path') as HTMLInputElement | null,
  settingsAndroidStudioPath: $('#settings-android-studio-path'),
  settingsFigmaPath: $('#settings-figma-path'),
  settingsFigmaUrl: $('#settings-figma-url'),
  settingsObsidianPath: $('#settings-obsidian-path'),
  settingsObsidianVault: $('#settings-obsidian-vault'),
  settingsScrcpyPath: $('#settings-scrcpy-path'),
  settingsReaKitPath: $('#settings-reakit-path') as HTMLInputElement | null,
  btnBrowseAntigravity: $('#btn-browse-antigravity'),
  btnBrowseAntigravityAgent: $('#btn-browse-antigravity-agent'),
  btnBrowseClaudeDesktop: $('#btn-browse-claude-desktop'),
  btnBrowseVsCode: $('#btn-browse-vscode'),
  btnBrowseAndroidStudio: $('#btn-browse-android-studio'),
  btnBrowseFigma: $('#btn-browse-figma'),
  btnBrowseObsidian: $('#btn-browse-obsidian'),
  btnBrowseObsidianVault: $('#btn-browse-obsidian-vault'),
  btnBrowseScrcpy: $('#btn-browse-scrcpy'),
  btnBrowseReaKit: $('#btn-browse-reakit') as HTMLButtonElement | null,
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
  agentToolkitListContainer: $('#agent-toolkit-list-container'),
  btnDeviceManager: $('#btn-device-manager'),
  deviceManagerScreen: $('#device-manager-screen'),
  btnCloseDeviceManagerScreen: $('#btn-close-device-manager-screen'),
  deviceRemoteScreen: $('#device-remote-screen'),
  btnCloseDeviceRemoteScreen: $('#btn-close-device-remote-screen'),
  btnBackToDeviceList: $('#btn-dm-back-to-list'),
  btnClaudeDesktop: $('#btn-claude-desktop'),
};

const WORKSPACE_SIDEBAR_COLLAPSED_KEY = 'codingspace.workspaceSidebarCollapsed';

// ── Window Controls ────────────────────────────────────
// platform-darwin hides the custom buttons (native traffic lights are shown) and makes room for them.
document.body.classList.add(`platform-${window.api.platform}`);
const isMac = window.api.platform === 'darwin';
const FILE_MANAGER_LABEL = isMac ? 'Finder' : 'Explorer';
// macOS: swap Windows-only wording and path examples in the static markup.
if (isMac) {
  dom.dashBtnRevealPath?.setAttribute('title', 'Reveal in Finder');
  if (dom.btnExplorer) {
    dom.btnExplorer.setAttribute('title', 'Open in Finder');
    dom.btnExplorer.setAttribute('aria-label', 'Open in Finder');
    const explorerLabel = dom.btnExplorer.querySelector('.workspace-tool-text');
    if (explorerLabel) explorerLabel.textContent = 'Finder';
  }
  const macPlaceholders: Array<[Element | null, string]> = [
    [dom.settingsAntigravityPath, 'e.g. /Applications/Antigravity IDE.app'],
    [dom.settingsAntigravityAgentPath, 'e.g. /Applications/Antigravity.app'],
    [dom.settingsVsCodePath, 'e.g. code or /Applications/Visual Studio Code.app'],
    [dom.settingsClaudeDesktopPath, 'e.g. /Applications/Claude.app'],
    [dom.settingsFigmaPath, 'e.g. /Applications/Figma.app'],
    [dom.settingsObsidianPath, 'e.g. /Applications/Obsidian.app'],
    [dom.settingsScrcpyPath, 'e.g. scrcpy or /opt/homebrew/bin/scrcpy'],
  ];
  for (const [input, placeholder] of macPlaceholders) input?.setAttribute('placeholder', placeholder);
}

dom.btnMinimize.addEventListener('click', () => window.api.minimize());
dom.btnMaximize.addEventListener('click', () => window.api.maximize());
dom.btnClose.addEventListener('click', () => window.api.close());

// ── Option Toggles ─────────────────────────────────────
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
setupBrowseButton(dom.btnBrowseClaudeDesktop, dom.settingsClaudeDesktopPath);
setupBrowseButton(dom.btnBrowseVsCode, dom.settingsVsCodePath);
setupBrowseButton(dom.btnBrowseAndroidStudio, dom.settingsAndroidStudioPath);
setupBrowseButton(dom.btnBrowseFigma, dom.settingsFigmaPath);
setupBrowseButton(dom.btnBrowseObsidian, dom.settingsObsidianPath);
setupBrowseButton(dom.btnBrowseScrcpy, dom.settingsScrcpyPath);

if (dom.btnBrowseReaKit && dom.settingsReaKitPath) {
  dom.btnBrowseReaKit.addEventListener('click', async () => {
    const selected = await window.api.selectDirectory('Select ReaKit Directory');
    if (selected) {
      dom.settingsReaKitPath.value = selected;
      await saveSettingsFromUI();
    }
  });
}

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
  dom.settingsClaudeDesktopPath,
  dom.settingsAndroidStudioPath,
  dom.settingsFigmaPath,
  dom.settingsFigmaUrl,
  dom.settingsObsidianPath,
  dom.settingsObsidianVault,
  dom.settingsScrcpyPath,
  dom.settingsReaKitPath,
];
for (const input of settingsInputs) {
  if (input) {
    input.addEventListener('change', saveSettingsFromUI);
    input.addEventListener('blur', saveSettingsFromUI);
  }
}


// ── Add Project ────────────────────────────────────────
dom.btnAddProject.addEventListener('click', addProject);
dom.btnAddFirst.addEventListener('click', addProject);

async function addProject() {
  const result = await window.api.addProject();
  if (!result) return;
  if (result.error) {
    if (result.path) {
      state.expandedProjects.add(result.path);
      state.selectedProjectPath = result.path;
      if (state.workspaceSidebarCollapsed) {
        setWorkspaceSidebarCollapsed(false);
      }
      renderSidebar();
      await openProjectWorkspace(result.path);
      scrollSelectedProjectIntoView(result.path);
    }
    showToast(result.error, result.path ? 'info' : 'error');
    return;
  }
  state.expandedProjects.add(result.path);
  state.selectedProjectPath = result.path;
  if (state.workspaceSidebarCollapsed) {
    setWorkspaceSidebarCollapsed(false);
  }
  showToast(`Added project: ${result.name}`, 'success');
  await loadWorkspaces();
  await openProjectWorkspace(result.path);
  scrollSelectedProjectIntoView(result.path);
}

// ── Refresh All Projects ───────────────────────────────
if (dom.btnRefreshAll) {
  dom.btnRefreshAll.addEventListener('click', async () => {
    const icon = dom.btnRefreshAll.querySelector('img, svg');
    if (icon) icon.classList.add('spinning');
    showToast('Refreshing workspaces...', 'info');
    try {
      for (const p of state.projects) await window.api.refreshWorktrees(p.path);
      await loadWorkspaces();
      showToast('All projects refreshed', 'success');
    } catch (err) {
      showToast('Failed to refresh workspaces', 'error');
    } finally {
      if (icon) icon.classList.remove('spinning');
    }
  });
}

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
  });
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      dom.sidebarResizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
  firebase: loadIcon('firebase'),
  task: loadIcon('task'),
  refresh: loadIcon('refresh'),
  check: loadIcon('check'),
  apk: loadIcon('apk'),
  decode: loadIcon('decode'),
  reakit: loadIcon('reakit'),
  play: loadIcon('play'),
};

// Pre-sized icon strings matching original inline sizes
const icons = {
  code: iconSvg(iconRaw.code, 12),
  folder: iconSvg(iconRaw.folder, 12),
  gitBranch: iconSvg(iconRaw.gitBranch, 10),
  trash: iconSvg(iconRaw.trash, 12),
  plus: iconSvg(iconRaw.plus, 12),
  download: iconSvg(iconRaw.download, 12),
  play: iconSvg(iconRaw.play || '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>', 11),
  gitFork: iconSvg(iconRaw.gitFork, 14),
  chevron: iconSvg(iconRaw.chevron, 10),
  settings: iconSvg(iconRaw.settings, 12),
  close: iconSvg(iconRaw.close, 8),
  get opencode() { return iconSvg(iconRaw.opencode, 12); },
  claude: iconSvg(iconRaw.claude, 12),
  android: iconSvg(iconRaw.android, 12),
  apk: iconSvg(iconRaw.apk, 12),
  decode: iconSvg(iconRaw.decode, 12),
  reakit: iconSvg(iconRaw.reakit, 12),
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
  firebase: iconSvg(iconRaw.firebase, 14),
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

const FIREBASE_COLORED_LOGO = `<svg width="22" height="28" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 24 4.6 1.4a.6.6 0 0 1 1.12-.2L9.6 8.4Z" fill="#FFA000"/>
  <path d="M12.7 11.3 9.6 5.4 1 24Z" fill="#F57F17"/>
  <path d="M1 24 15.5 7.7a.6.6 0 0 1 1 .3L23 24l-9.9 5.6a2.2 2.2 0 0 1-2.2 0Z" fill="#FFCA28"/>
</svg>`;

const PLANE_COLORED_LOGO = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.5 2.5 10 14" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21.5 2.5 14.5 21.5 10 14 2.5 9.5 21.5 2.5Z" fill="#3F76FF" fill-opacity="0.22" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const EDIT_PENCIL_SVG =`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

function menuItemHTML({ action, icon, label, title = '', badges = [], danger = false, iconClass = 'menu-icon' }) {
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
  buttonEl.addEventListener('click', async () => {
    const wtPath = getRequiredActiveWorktreePath();
    if (!wtPath) return;
    showToast(toastMessage, 'info');
    const res = await openFn(wtPath);
    if (res && res.success === false) {
      showToast(res.error || 'Failed to launch application', 'error');
    }
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
// Safe for text and for attribute values: quotes are escaped too, so a value containing `"` cannot end
// the attribute early (it used to cut copied commands off at the first quote).
function esc(str: any) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
// WORKTREE CONTEXT & WORKSPACE SWITCHING
// ═══════════════════════════════════════════════════════

/** Switch the active worktree context */
function switchWorktreeContext(wtPath) {
  // Exit other screens if active
  dom.settingsScreen.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');

  if (state.activeWorktreePath === wtPath) {
    updateSidebarActiveState();
    return;
  }

  state.activeWorktreePath = wtPath;

  // Set selected project based on active worktree path
  const project = state.projects?.find((p) => (p.worktrees || []).some((wt) => wt.path === wtPath));
  if (project && state.selectedProjectPath !== project.path) {
    state.selectedProjectPath = project.path;
    renderSidebar(); // Redraw sidebar to show the selected project
  }

  updateSidebarActiveState();

  // If other screens are open, update them
  if (dom.symlinkScreen && !dom.symlinkScreen.classList.contains('hidden')) {
    void showSymlinkScreen();
  }
}

async function openProjectWorkspace(projectPath) {
  const project = state.projects.find((p) => p.path === projectPath);
  if (!project || !project.worktrees || project.worktrees.length === 0) return;

  const targetWt =
    project.worktrees.find((w) => w.path === state.activeWorktreePath) ||
    project.worktrees[0];

  if (targetWt) {
    switchWorktreeContext(targetWt.path);
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
}

// Right click context menu for selection copy
window.addEventListener('contextmenu', (e) => {
  const selectedText = window.getSelection() ? window.getSelection().toString() : '';

  if (selectedText) {
    e.preventDefault();
    e.stopPropagation();
    showSelectionContextMenu(e.clientX, e.clientY, selectedText);
  }
});

function showWorktreeContextMenu(project, wt, x, y) {
  hideWorktreeContextMenu();
  hideProjectOptionsMenu();
  hideSelectionContextMenu();
  const canAddSubWorktree = getDomainCanCreateNestedWorktree(project, wt);
  const canDeleteBranch = Boolean(wt.branch) && !wt.detached && !wt.bare;

  const menu = showPositionedMenu({
    id: 'worktree-context-menu',
    className: 'worktree-context-menu tab-dropdown',
    x,
    y,
    html: `
      ${canAddSubWorktree ? `${menuItemHTML({ action: 'add-sub-worktree', icon: icons.plus, label: 'Add nested worktree' })}${menuDividerHTML()}` : ''}
      ${menuItemHTML({ action: 'merge-to-local-branch', icon: icons.gitBranch, label: 'Merge to local branch' })}
      ${menuDividerHTML()}
      ${menuItemHTML({ action: 'force-remove-worktree', icon: icons.trash, label: 'Force remove worktree', title: canDeleteBranch ? `Force remove worktree. Modal can delete branch ${wt.branch}.` : 'Force remove worktree. Branch deletion unavailable for this worktree.', danger: true })}
    `,
    outsideClickHandler: handleWorktreeContextMenuOutsideClick,
  });

  bindMenuActions(menu, {
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
  hideSelectionContextMenu();

  const menu = showPositionedMenu({
    id: 'project-options-menu',
    className: 'project-options-menu tab-dropdown',
    x,
    y,
    html: `
      ${menuItemHTML({ action: 'refresh-project', icon: icons.refresh, label: 'Refresh project' })}
      ${menuItemHTML({ action: 'add-wt', icon: icons.plus, label: 'Add worktree' })}
      ${menuItemHTML({ action: 'create-branch', icon: icons.gitBranch, label: 'Create branch' })}
      ${menuItemHTML({ action: 'fetch', icon: icons.download, label: 'Fetch' })}
      ${menuDividerHTML()}
      ${menuItemHTML({ action: 'remove', icon: icons.trash, label: 'Remove project', danger: true })}
    `,
    outsideClickHandler: handleProjectOptionsMenuOutsideClick,
  });

  bindMenuActions(menu, {
    'refresh-project': async () => {
      showToast(`Refreshing ${project.name}...`, 'info');
      try {
        await refreshProjectWorkspaces(project.path);
        showToast(`Refreshed ${project.name}`, 'success');
      } catch (err) {
        showToast(`Failed to refresh ${project.name}`, 'error');
      }
    },
    'create-branch': () => showCreateBranchModal(project),
    'add-wt': () => showAddWorktreeModal(project),
    'fetch': async () => {
      showToast('Fetching...', 'info');
      const result = await window.api.gitFetch(project.path);
      showToast(result.success ? 'Fetch complete' : `Fetch failed: ${result.error}`, result.success ? 'success' : 'error');
      if (result.success) await loadWorkspaces();
    },
    'remove': async () => {
      const removedWtPaths = new Set((project.worktrees || []).map((w: any) => w.path));
      await window.api.removeProject(project.path);
      if (state.selectedProjectPath === project.path) {
        state.selectedProjectPath = null;
      }
      if (state.activeWorktreePath && (state.activeWorktreePath === project.path || removedWtPaths.has(state.activeWorktreePath))) {
        state.activeWorktreePath = null;
      }
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

// Workspace external tool buttons
bindWorktreeQuickAction(dom.btnAntigravity, (wtPath) => window.api.openInAntigravity(wtPath), 'Opening Antigravity...');
bindWorktreeQuickAction(dom.btnAntigravityAgent, (wtPath) => window.api.openInAntigravityAgent(wtPath), 'Opening Agent Manager...');
bindWorktreeQuickAction(dom.btnVsCode, (wtPath) => window.api.openInVsCode(wtPath), 'Opening VS Code...');
dom.btnClaudeDesktop?.addEventListener('click', async () => {
  const wtPath = getRequiredActiveWorktreePath();
  if (!wtPath) return;
  showToast('Opening Claude Desktop (Code mode)...', 'info');
  const res = await window.api.openInClaudeDesktop(wtPath);
  if (!res?.success) showToast(res?.error || 'Failed to open Claude Desktop', 'error');
});



if (dom.btnProjectResources) {
  dom.btnProjectResources.addEventListener('click', () => {
    if (dom.projectResourcesScreen && !dom.projectResourcesScreen.classList.contains('hidden')) {
      hideProjectResourcesScreen();
    } else {
      void showProjectResourcesScreen();
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

bindWorktreeQuickAction(dom.btnExplorer, (wtPath) => window.api.openInExplorer(wtPath), `Opening ${FILE_MANAGER_LABEL}...`);

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

function updateSidebarResourcesButton(activeProject?: any) {
  if (!dom.btnProjectResources) return;
  if (!activeProject) {
    const res = getActiveProjectAndWorktree();
    activeProject = res.activeProject;
  }
  const figmaUrl = (activeProject?.figmaUrl || '').trim();
  const firebaseUrl = (activeProject?.firebaseUrl || '').trim();
  const planeUrl = (activeProject?.planeUrl || '').trim();
  const prdUrl = (activeProject?.legacyPrdUrl || '').trim();
  const checklistUrl = (activeProject?.legacyChecklistUrl || '').trim();

  let linkedCount = 0;
  if (figmaUrl) linkedCount++;
  if (firebaseUrl) linkedCount++;
  if (planeUrl) linkedCount++;
  if (prdUrl) linkedCount++;
  if (checklistUrl) linkedCount++;

  const btn = dom.btnProjectResources;
  const badge = dom.btnResourcesBadge;

  if (linkedCount > 0) {
    const name = activeProject?.name || 'Project';
    btn.title = `Project Resources: ${name} (${linkedCount}/5 linked)\nFigma: ${figmaUrl || 'None'}\nFirebase: ${firebaseUrl || 'None'}\nPlane: ${planeUrl || 'None'}\nPRD: ${prdUrl || 'None'}\nChecklist: ${checklistUrl || 'None'}`;
    btn.classList.add('has-link');
    if (badge) {
      badge.textContent = linkedCount === 5 ? 'All Linked' : `${linkedCount}/5 Linked`;
      badge.className = 'workspace-tool-pill connected';
      badge.style.display = 'inline-flex';
    }
  } else {
    btn.title = 'Project Resources (Figma, Firebase, Plane, Legacy Docs)';
    btn.classList.remove('has-link');
    if (badge) {
      badge.style.display = 'none';
    }
  }
}

function renderDashboardFigma(activeProject: any) {
  updateSidebarFigmaButton(activeProject);
  updateSidebarResourcesButton(activeProject);
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

async function saveProjectFirebaseUrl(activeProject: any, url: string, successMsg: string) {
  const res = await window.api.updateProjectMetadata(activeProject.path, { firebaseUrl: url });
  if (res?.success) {
    showToast(successMsg, url ? 'success' : 'info');
    activeProject.firebaseUrl = url;
    renderDashboardFirebase(activeProject);
    updateSidebarResourcesButton(activeProject);
  } else {
    showToast(`Failed to save: ${res?.error || 'Unknown error'}`, 'error');
  }
}

function renderDashboardFirebase(activeProject: any) {
  if (!dom.dashFirebaseBody) return;
  const firebaseUrl = (activeProject.firebaseUrl || '').trim();

  if (!firebaseUrl) {
    if (dom.dashFirebaseStatusPill) {
      dom.dashFirebaseStatusPill.textContent = 'Not Linked';
      dom.dashFirebaseStatusPill.className = 'dash-status-pill';
    }
    if (dom.dashBtnBrowserFirebase) dom.dashBtnBrowserFirebase.style.display = 'none';

    dom.dashFirebaseBody.innerHTML = `
      <div class="dash-figma-empty-showcase firebase">
        <div class="dash-figma-empty-icon-wrap">
          <div class="dash-figma-empty-icon" title="Firebase">
            ${FIREBASE_COLORED_LOGO}
          </div>
        </div>
        <div class="dash-figma-empty-content">
          <div class="dash-figma-input-wrapper">
            <input type="text" class="dash-figma-input" id="dash-firebase-quick-input" placeholder="Paste Firebase console link (console.firebase.google.com/project/...)" autocomplete="off" spellcheck="false" />
            <button type="button" class="btn-figma-link-submit firebase" id="dash-firebase-quick-save">Link</button>
          </div>
        </div>
      </div>
    `;

    const quickInput = dom.dashFirebaseBody.querySelector('#dash-firebase-quick-input') as HTMLInputElement;
    const quickSave = dom.dashFirebaseBody.querySelector('#dash-firebase-quick-save') as HTMLButtonElement;
    quickSave?.addEventListener('click', () => {
      const url = quickInput?.value.trim();
      if (!url) {
        showToast('Please enter a Firebase console URL', 'error');
        return;
      }
      if (!parseFirebaseUrl(url)) {
        showToast('That does not look like a valid URL', 'error');
        return;
      }
      void saveProjectFirebaseUrl(activeProject, url, 'Firebase link saved');
    });
    quickInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') quickSave?.click();
    });
    return;
  }

  if (dom.dashFirebaseStatusPill) {
    dom.dashFirebaseStatusPill.textContent = 'Linked';
    dom.dashFirebaseStatusPill.className = 'dash-status-pill connected';
  }
  if (dom.dashBtnBrowserFirebase) dom.dashBtnBrowserFirebase.style.display = 'inline-flex';

  const parsed = parseFirebaseUrl(firebaseUrl);
  const displayName = parsed?.projectId || `${activeProject.name || 'Project'} Firebase`;
  const displayUrl = formatDisplayUrl(firebaseUrl);

  dom.dashFirebaseBody.innerHTML = `
    <div class="dash-figma-showcase firebase">
      <div class="dash-figma-accent-bar"></div>
      <div class="dash-figma-top-bar">
        <div class="dash-figma-tag-group">
          <span class="dash-figma-type-pill firebase">
            <span class="dash-figma-pulse-dot"></span>
            ${esc(parsed?.section || 'Console')}
          </span>
          ${parsed && !parsed.isConsole ? '<span class="dash-figma-sub-pill">External link</span>' : ''}
        </div>
        <div class="dash-figma-top-actions">
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-copy-firebase" title="Copy Firebase Link" aria-label="Copy Firebase Link">
            ${icons.copy || ''}
          </button>
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-edit-inline-firebase" title="Edit Firebase Link" aria-label="Edit Firebase Link">
            ${EDIT_PENCIL_SVG}
          </button>
          <button type="button" class="dash-figma-icon-btn danger" id="dash-btn-clear-firebase" title="Clear Firebase Link" aria-label="Clear Firebase Link">
            ${icons.trash || ''}
          </button>
        </div>
      </div>

      <div class="dash-figma-main-info">
        <div class="dash-figma-brand-emblem" title="Firebase">
          ${FIREBASE_COLORED_LOGO}
        </div>
        <div class="dash-figma-meta">
          <h4 class="dash-figma-title" title="${esc(displayName)}">${esc(displayName)}</h4>
          <a href="${esc(firebaseUrl)}" class="dash-figma-url-pill" id="dash-firebase-url-anchor" title="${esc(firebaseUrl)}" target="_blank">
            <span class="dash-figma-url-text">${esc(displayUrl)}</span>
            ${icons.link || ''}
          </a>
        </div>
      </div>

      <div class="dash-figma-action-footer">
        <button type="button" class="btn-figma-launch firebase" id="dash-btn-card-open-firebase" title="Open Firebase console in browser">
          ${icons.firebase || ''}
          <span>Open Console</span>
        </button>
      </div>
    </div>
  `;

  const openConsole = () => { void window.api.openExternal(firebaseUrl); };
  dom.dashFirebaseBody.querySelector('#dash-btn-card-open-firebase')?.addEventListener('click', openConsole);
  dom.dashFirebaseBody.querySelector('#dash-firebase-url-anchor')?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    openConsole();
  });
  dom.dashFirebaseBody.querySelector('#dash-btn-copy-firebase')?.addEventListener('click', () => {
    navigator.clipboard.writeText(firebaseUrl);
    showToast('Firebase URL copied to clipboard', 'info');
  });
  dom.dashFirebaseBody.querySelector('#dash-btn-edit-inline-firebase')?.addEventListener('click', () => {
    renderFirebaseInlineEdit(activeProject, firebaseUrl);
  });
  dom.dashFirebaseBody.querySelector('#dash-btn-clear-firebase')?.addEventListener('click', () => {
    void saveProjectFirebaseUrl(activeProject, '', 'Firebase link cleared');
  });
}

function renderFirebaseInlineEdit(activeProject: any, currentUrl: string) {
  if (!dom.dashFirebaseBody) return;
  dom.dashFirebaseBody.innerHTML = `
    <div class="dash-figma-edit-showcase">
      <div class="dash-figma-edit-header">
        ${icons.firebase || ''}
        <span>Edit Firebase Link</span>
      </div>
      <div class="dash-figma-input-wrapper">
        <input type="text" class="dash-figma-input" id="dash-firebase-edit-input" value="${esc(currentUrl)}" placeholder="https://console.firebase.google.com/project/..." autocomplete="off" spellcheck="false" />
        <button type="button" class="btn-figma-link-submit firebase" id="dash-firebase-edit-save">Save</button>
        <button type="button" class="btn-secondary btn-small" id="dash-firebase-edit-cancel">Cancel</button>
      </div>
    </div>
  `;

  const editInput = dom.dashFirebaseBody.querySelector('#dash-firebase-edit-input') as HTMLInputElement;
  const editSave = dom.dashFirebaseBody.querySelector('#dash-firebase-edit-save') as HTMLButtonElement;
  const editCancel = dom.dashFirebaseBody.querySelector('#dash-firebase-edit-cancel') as HTMLButtonElement;

  editInput?.focus();
  editInput?.select();

  editSave?.addEventListener('click', () => {
    const url = editInput?.value.trim() || '';
    if (url && !parseFirebaseUrl(url)) {
      showToast('That does not look like a valid URL', 'error');
      return;
    }
    void saveProjectFirebaseUrl(activeProject, url, url ? 'Firebase link updated' : 'Firebase link cleared');
  });
  editCancel?.addEventListener('click', () => {
    renderDashboardFirebase(activeProject);
  });
  editInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') editSave?.click();
    else if (e.key === 'Escape') editCancel?.click();
  });
}

async function saveProjectPlaneUrl(activeProject: any, url: string, successMsg: string) {
  const res = await window.api.updateProjectMetadata(activeProject.path, { planeUrl: url });
  if (res?.success) {
    showToast(successMsg, url ? 'success' : 'info');
    activeProject.planeUrl = url;
    renderDashboardPlane(activeProject);
    updateSidebarResourcesButton(activeProject);
  } else {
    showToast(`Failed to save: ${res?.error || 'Unknown error'}`, 'error');
  }
}

function renderDashboardPlane(activeProject: any) {
  if (!dom.dashPlaneBody) return;
  const planeUrl = (activeProject.planeUrl || '').trim();

  if (!planeUrl) {
    if (dom.dashPlaneStatusPill) {
      dom.dashPlaneStatusPill.textContent = 'Not Linked';
      dom.dashPlaneStatusPill.className = 'dash-status-pill';
    }
    if (dom.dashBtnBrowserPlane) dom.dashBtnBrowserPlane.style.display = 'none';

    dom.dashPlaneBody.innerHTML = `
      <div class="dash-figma-empty-showcase plane">
        <div class="dash-figma-empty-icon-wrap">
          <div class="dash-figma-empty-icon" title="Plane">
            ${PLANE_COLORED_LOGO}
          </div>
        </div>
        <div class="dash-figma-empty-content">
          <div class="dash-figma-input-wrapper">
            <input type="text" class="dash-figma-input" id="dash-plane-quick-input" placeholder="Paste Plane project link (e.g. https://plane.itgproduct.com/...)" autocomplete="off" spellcheck="false" />
            <button type="button" class="btn-figma-link-submit plane" id="dash-plane-quick-save">Link</button>
          </div>
        </div>
      </div>
    `;

    const quickInput = dom.dashPlaneBody.querySelector('#dash-plane-quick-input') as HTMLInputElement;
    const quickSave = dom.dashPlaneBody.querySelector('#dash-plane-quick-save') as HTMLButtonElement;
    quickSave?.addEventListener('click', () => {
      const rawUrl = quickInput?.value.trim();
      if (!rawUrl) {
        showToast('Please enter a Plane project URL', 'error');
        return;
      }
      const parsed = parsePlaneUrl(rawUrl);
      if (!parsed) {
        showToast('That does not look like a valid URL', 'error');
        return;
      }
      void saveProjectPlaneUrl(activeProject, parsed.url, 'Plane project link saved');
    });
    quickInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') quickSave?.click();
    });
    return;
  }

  if (dom.dashPlaneStatusPill) {
    dom.dashPlaneStatusPill.textContent = 'Linked';
    dom.dashPlaneStatusPill.className = 'dash-status-pill connected';
  }
  if (dom.dashBtnBrowserPlane) dom.dashBtnBrowserPlane.style.display = 'inline-flex';

  const parsed = parsePlaneUrl(planeUrl);
  const displayName = parsed?.workspace
    ? `${activeProject.name || 'Project'} (${parsed.workspace})`
    : `${activeProject.name || 'Project'} Plane`;
  const displayUrl = formatDisplayUrl(planeUrl);

  dom.dashPlaneBody.innerHTML = `
    <div class="dash-figma-showcase plane">
      <div class="dash-figma-accent-bar"></div>
      <div class="dash-figma-top-bar">
        <div class="dash-figma-tag-group">
          <span class="dash-figma-type-pill plane">
            <span class="dash-figma-pulse-dot"></span>
            ${esc(parsed?.section || 'Project')}
          </span>
          ${parsed?.host ? `<span class="dash-figma-sub-pill">${esc(parsed.host)}</span>` : ''}
        </div>
        <div class="dash-figma-top-actions">
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-copy-plane" title="Copy Plane Link" aria-label="Copy Plane Link">
            ${icons.copy || ''}
          </button>
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-edit-inline-plane" title="Edit Plane Link" aria-label="Edit Plane Link">
            ${EDIT_PENCIL_SVG}
          </button>
          <button type="button" class="dash-figma-icon-btn danger" id="dash-btn-clear-plane" title="Clear Plane Link" aria-label="Clear Plane Link">
            ${icons.trash || ''}
          </button>
        </div>
      </div>

      <div class="dash-figma-main-info">
        <div class="dash-figma-brand-emblem" title="Plane">
          ${PLANE_COLORED_LOGO}
        </div>
        <div class="dash-figma-meta">
          <h4 class="dash-figma-title" title="${esc(displayName)}">${esc(displayName)}</h4>
          <a href="${esc(planeUrl)}" class="dash-figma-url-pill" id="dash-plane-url-anchor" title="${esc(planeUrl)}" target="_blank">
            <span class="dash-figma-url-text">${esc(displayUrl)}</span>
            ${icons.link || ''}
          </a>
        </div>
      </div>

      <div class="dash-figma-action-footer">
        <button type="button" class="btn-figma-launch plane" id="dash-btn-card-open-plane" title="Open Plane project in browser">
          ${icons.task || ''}
          <span>Open Plane</span>
        </button>
      </div>
    </div>
  `;

  const openPlane = () => { void window.api.openExternal(planeUrl); };
  dom.dashPlaneBody.querySelector('#dash-btn-card-open-plane')?.addEventListener('click', openPlane);
  dom.dashPlaneBody.querySelector('#dash-plane-url-anchor')?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    openPlane();
  });
  dom.dashPlaneBody.querySelector('#dash-btn-copy-plane')?.addEventListener('click', () => {
    navigator.clipboard.writeText(planeUrl);
    showToast('Plane URL copied to clipboard', 'info');
  });
  dom.dashPlaneBody.querySelector('#dash-btn-edit-inline-plane')?.addEventListener('click', () => {
    renderPlaneInlineEdit(activeProject, planeUrl);
  });
  dom.dashPlaneBody.querySelector('#dash-btn-clear-plane')?.addEventListener('click', () => {
    void saveProjectPlaneUrl(activeProject, '', 'Plane link cleared');
  });
}

function renderPlaneInlineEdit(activeProject: any, currentUrl: string) {
  if (!dom.dashPlaneBody) return;
  dom.dashPlaneBody.innerHTML = `
    <div class="dash-figma-edit-showcase">
      <div class="dash-figma-edit-header">
        ${icons.task || ''}
        <span>Edit Plane Project Link</span>
      </div>
      <div class="dash-figma-input-wrapper">
        <input type="text" class="dash-figma-input" id="dash-plane-edit-input" value="${esc(currentUrl)}" placeholder="https://plane.itgproduct.com/..." autocomplete="off" spellcheck="false" />
        <button type="button" class="btn-figma-link-submit plane" id="dash-plane-edit-save">Save</button>
        <button type="button" class="btn-secondary btn-small" id="dash-plane-edit-cancel">Cancel</button>
      </div>
    </div>
  `;

  const editInput = dom.dashPlaneBody.querySelector('#dash-plane-edit-input') as HTMLInputElement;
  const editSave = dom.dashPlaneBody.querySelector('#dash-plane-edit-save') as HTMLButtonElement;
  const editCancel = dom.dashPlaneBody.querySelector('#dash-plane-edit-cancel') as HTMLButtonElement;

  editInput?.focus();
  editInput?.select();

  editSave?.addEventListener('click', () => {
    const rawUrl = editInput?.value.trim() || '';
    if (rawUrl) {
      const parsed = parsePlaneUrl(rawUrl);
      if (!parsed) {
        showToast('That does not look like a valid URL', 'error');
        return;
      }
      void saveProjectPlaneUrl(activeProject, parsed.url, 'Plane project link updated');
      return;
    }
    void saveProjectPlaneUrl(activeProject, '', 'Plane link cleared');
  });
  editCancel?.addEventListener('click', () => {
    renderDashboardPlane(activeProject);
  });
  editInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') editSave?.click();
    else if (e.key === 'Escape') editCancel?.click();
  });
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

const PRD_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;

const CHECKLIST_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

function normalizeDocInputUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isValidHttpDocUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function saveProjectLegacyPrdUrl(activeProject: any, url: string, successMsg: string) {
  const res = await window.api.updateProjectMetadata(activeProject.path, { legacyPrdUrl: url });
  if (res?.success) {
    showToast(successMsg, url ? 'success' : 'info');
    activeProject.legacyPrdUrl = url;
    renderDashboardLegacyDocs(activeProject);
  } else {
    showToast(`Failed to save: ${res?.error || 'Unknown error'}`, 'error');
  }
}

async function saveProjectLegacyChecklistUrl(activeProject: any, url: string, successMsg: string) {
  const res = await window.api.updateProjectMetadata(activeProject.path, { legacyChecklistUrl: url });
  if (res?.success) {
    showToast(successMsg, url ? 'success' : 'info');
    activeProject.legacyChecklistUrl = url;
    renderDashboardLegacyDocs(activeProject);
  } else {
    showToast(`Failed to save: ${res?.error || 'Unknown error'}`, 'error');
  }
}

function renderLegacyPrdSlot(activeProject: any, isEditing = false) {
  const slot = dom.dashLegacyDocsBody?.querySelector('#dash-legacy-prd-slot');
  if (!slot) return;
  const prdUrl = (activeProject.legacyPrdUrl || '').trim();

  if (isEditing) {
    slot.innerHTML = `
      <div class="dash-legacy-edit-card prd">
        <div class="dash-legacy-edit-header prd">
          ${PRD_ICON_SVG}
          <span>Edit PRD Link</span>
        </div>
        <div class="dash-legacy-input-wrapper">
          <input type="text" class="dash-legacy-input" id="dash-legacy-prd-edit-input" value="${esc(prdUrl)}" placeholder="https://docs.google.com/document/... or Confluence link" autocomplete="off" spellcheck="false" />
          <button type="button" class="btn-legacy-submit prd" id="dash-legacy-prd-edit-save">Save</button>
          <button type="button" class="btn-secondary btn-small" id="dash-legacy-prd-edit-cancel">Cancel</button>
        </div>
      </div>
    `;

    const editInput = slot.querySelector('#dash-legacy-prd-edit-input') as HTMLInputElement;
    const editSave = slot.querySelector('#dash-legacy-prd-edit-save') as HTMLButtonElement;
    const editCancel = slot.querySelector('#dash-legacy-prd-edit-cancel') as HTMLButtonElement;

    editInput?.focus();
    editInput?.select();

    editSave?.addEventListener('click', () => {
      const raw = editInput?.value.trim() || '';
      if (!raw) {
        void saveProjectLegacyPrdUrl(activeProject, '', 'PRD link cleared');
        return;
      }
      const normalized = normalizeDocInputUrl(raw);
      if (!isValidHttpDocUrl(normalized)) {
        showToast('Please enter a valid URL', 'error');
        return;
      }
      void saveProjectLegacyPrdUrl(activeProject, normalized, 'PRD link updated');
    });

    editCancel?.addEventListener('click', () => {
      renderLegacyPrdSlot(activeProject, false);
    });

    editInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') editSave?.click();
      else if (e.key === 'Escape') editCancel?.click();
    });
    return;
  }

  if (!prdUrl) {
    slot.innerHTML = `
      <div class="dash-legacy-empty-card prd">
        <div class="dash-legacy-empty-icon prd" title="PRD">
          ${PRD_ICON_SVG}
        </div>
        <div class="dash-legacy-empty-content">
          <div class="dash-legacy-empty-label">
            <span>PRD</span>
            <span class="dash-legacy-empty-subtext">(Product Requirement Document)</span>
          </div>
          <div class="dash-legacy-input-wrapper">
            <input type="text" class="dash-legacy-input" id="dash-legacy-prd-input" placeholder="Paste PRD link (Google Docs, Confluence, Notion...)" autocomplete="off" spellcheck="false" />
            <button type="button" class="btn-legacy-submit prd" id="dash-legacy-prd-save">Link</button>
          </div>
        </div>
      </div>
    `;

    const input = slot.querySelector('#dash-legacy-prd-input') as HTMLInputElement;
    const saveBtn = slot.querySelector('#dash-legacy-prd-save') as HTMLButtonElement;

    saveBtn?.addEventListener('click', () => {
      const raw = input?.value.trim();
      if (!raw) {
        showToast('Please enter a PRD link', 'error');
        return;
      }
      const normalized = normalizeDocInputUrl(raw);
      if (!isValidHttpDocUrl(normalized)) {
        showToast('Please enter a valid URL', 'error');
        return;
      }
      void saveProjectLegacyPrdUrl(activeProject, normalized, 'PRD link saved');
    });

    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') saveBtn?.click();
    });
    return;
  }

  const parsed = parseDocUrl(prdUrl);
  const displayName = parsed?.service ? `${parsed.service} PRD` : 'Product Requirement Document';
  const displayUrl = formatDisplayUrl(prdUrl);

  slot.innerHTML = `
    <div class="dash-legacy-item-card prd">
      <div class="dash-legacy-accent-bar"></div>
      <div class="dash-legacy-top-bar">
        <div class="dash-legacy-tag-group">
          <span class="dash-legacy-type-pill prd">
            <span class="dash-legacy-pulse-dot"></span>
            PRD
          </span>
          ${parsed?.service ? `<span class="dash-figma-sub-pill">${esc(parsed.service)}</span>` : ''}
        </div>
        <div class="dash-figma-top-actions">
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-copy-prd" title="Copy PRD Link" aria-label="Copy PRD Link">
            ${icons.copy || ''}
          </button>
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-edit-prd" title="Edit PRD Link" aria-label="Edit PRD Link">
            ${EDIT_PENCIL_SVG}
          </button>
          <button type="button" class="dash-figma-icon-btn danger" id="dash-btn-clear-prd" title="Clear PRD Link" aria-label="Clear PRD Link">
            ${icons.trash || ''}
          </button>
        </div>
      </div>

      <div class="dash-legacy-main-info">
        <div class="dash-legacy-emblem prd" title="PRD">
          ${PRD_ICON_SVG}
        </div>
        <div class="dash-legacy-meta">
          <h4 class="dash-legacy-title" title="${esc(displayName)}">${esc(displayName)}</h4>
          <a href="${esc(prdUrl)}" class="dash-figma-url-pill" id="dash-prd-url-anchor" title="${esc(prdUrl)}" target="_blank">
            <span class="dash-figma-url-text">${esc(displayUrl)}</span>
            ${icons.link || ''}
          </a>
        </div>
      </div>

      <div class="dash-legacy-action-footer">
        <button type="button" class="btn-legacy-doc-launch" id="dash-btn-card-open-prd" title="Open PRD in browser">
          ${icons.link || ''}
          <span>Open in Browser</span>
        </button>
      </div>
    </div>
  `;

  const openPrd = () => { void window.api.openExternal(prdUrl); };
  slot.querySelector('#dash-btn-card-open-prd')?.addEventListener('click', openPrd);
  slot.querySelector('#dash-prd-url-anchor')?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    openPrd();
  });
  slot.querySelector('#dash-btn-copy-prd')?.addEventListener('click', () => {
    navigator.clipboard.writeText(prdUrl);
    showToast('PRD URL copied to clipboard', 'info');
  });
  slot.querySelector('#dash-btn-edit-prd')?.addEventListener('click', () => {
    renderLegacyPrdSlot(activeProject, true);
  });
  slot.querySelector('#dash-btn-clear-prd')?.addEventListener('click', () => {
    void saveProjectLegacyPrdUrl(activeProject, '', 'PRD link cleared');
  });
}

function renderLegacyChecklistSlot(activeProject: any, isEditing = false) {
  const slot = dom.dashLegacyDocsBody?.querySelector('#dash-legacy-checklist-slot');
  if (!slot) return;
  const checklistUrl = (activeProject.legacyChecklistUrl || '').trim();

  if (isEditing) {
    slot.innerHTML = `
      <div class="dash-legacy-edit-card checklist">
        <div class="dash-legacy-edit-header checklist">
          ${CHECKLIST_ICON_SVG}
          <span>Edit Checklist Link</span>
        </div>
        <div class="dash-legacy-input-wrapper">
          <input type="text" class="dash-legacy-input" id="dash-legacy-checklist-edit-input" value="${esc(checklistUrl)}" placeholder="https://docs.google.com/spreadsheets/... or Notion link" autocomplete="off" spellcheck="false" />
          <button type="button" class="btn-legacy-submit checklist" id="dash-legacy-checklist-edit-save">Save</button>
          <button type="button" class="btn-secondary btn-small" id="dash-legacy-checklist-edit-cancel">Cancel</button>
        </div>
      </div>
    `;

    const editInput = slot.querySelector('#dash-legacy-checklist-edit-input') as HTMLInputElement;
    const editSave = slot.querySelector('#dash-legacy-checklist-edit-save') as HTMLButtonElement;
    const editCancel = slot.querySelector('#dash-legacy-checklist-edit-cancel') as HTMLButtonElement;

    editInput?.focus();
    editInput?.select();

    editSave?.addEventListener('click', () => {
      const raw = editInput?.value.trim() || '';
      if (!raw) {
        void saveProjectLegacyChecklistUrl(activeProject, '', 'Checklist link cleared');
        return;
      }
      const normalized = normalizeDocInputUrl(raw);
      if (!isValidHttpDocUrl(normalized)) {
        showToast('Please enter a valid URL', 'error');
        return;
      }
      void saveProjectLegacyChecklistUrl(activeProject, normalized, 'Checklist link updated');
    });

    editCancel?.addEventListener('click', () => {
      renderLegacyChecklistSlot(activeProject, false);
    });

    editInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') editSave?.click();
      else if (e.key === 'Escape') editCancel?.click();
    });
    return;
  }

  const productChecklistCmd = buildChecklistSlashCommand();

  if (!checklistUrl) {
    slot.innerHTML = `
      <div class="dash-legacy-empty-card checklist">
        <div class="dash-legacy-empty-icon checklist" title="Checklist">
          ${CHECKLIST_ICON_SVG}
        </div>
        <div class="dash-legacy-empty-content">
          <div class="dash-legacy-empty-label" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
            <div>
              <span>Checklist</span>
              <span class="dash-legacy-empty-subtext">(Product Feature &amp; QA Checklist)</span>
            </div>
            <button type="button" class="btn-secondary btn-small" id="dash-legacy-checklist-copy-cmd" title="Copy ${esc(productChecklistCmd)} to generate our product's Feature Checklist in docs/BA/checklist/">
              ${icons.copy || ''}
              <span>${esc(productChecklistCmd)}</span>
            </button>
          </div>
          <div class="dash-legacy-input-wrapper">
            <input type="text" class="dash-legacy-input" id="dash-legacy-checklist-input" placeholder="Paste Checklist link (Google Sheets, Notion, Excel...)" autocomplete="off" spellcheck="false" />
            <button type="button" class="btn-legacy-submit checklist" id="dash-legacy-checklist-save">Link</button>
          </div>
        </div>
      </div>
    `;

    const input = slot.querySelector('#dash-legacy-checklist-input') as HTMLInputElement;
    const saveBtn = slot.querySelector('#dash-legacy-checklist-save') as HTMLButtonElement;
    const copyCmdBtn = slot.querySelector('#dash-legacy-checklist-copy-cmd') as HTMLButtonElement;

    copyCmdBtn?.addEventListener('click', () => {
      void navigator.clipboard.writeText(productChecklistCmd);
      showToast(`Copied command: ${productChecklistCmd} — paste into Antigravity!`, 'success');
      const { activeWt } = getActiveProjectAndWorktree();
      if (activeProject?.path) {
        void window.api.syncBaProjectConfig({ projectPath: activeProject.path, worktreePath: activeWt?.path });
      }
    });

    saveBtn?.addEventListener('click', () => {
      const raw = input?.value.trim();
      if (!raw) {
        showToast('Please enter a Checklist link', 'error');
        return;
      }
      const normalized = normalizeDocInputUrl(raw);
      if (!isValidHttpDocUrl(normalized)) {
        showToast('Please enter a valid URL', 'error');
        return;
      }
      void saveProjectLegacyChecklistUrl(activeProject, normalized, 'Checklist link saved');
    });

    input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') saveBtn?.click();
    });
    return;
  }

  const parsed = parseDocUrl(checklistUrl);
  const displayName = parsed?.service ? `${parsed.service} Checklist` : 'Product Feature Checklist';
  const displayUrl = formatDisplayUrl(checklistUrl);

  slot.innerHTML = `
    <div class="dash-legacy-item-card checklist">
      <div class="dash-legacy-accent-bar"></div>
      <div class="dash-legacy-top-bar">
        <div class="dash-legacy-tag-group">
          <span class="dash-legacy-type-pill checklist">
            <span class="dash-legacy-pulse-dot"></span>
            Checklist
          </span>
          ${parsed?.service ? `<span class="dash-figma-sub-pill">${esc(parsed.service)}</span>` : ''}
        </div>
        <div class="dash-figma-top-actions">
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-copy-checklist" title="Copy Checklist Link" aria-label="Copy Checklist Link">
            ${icons.copy || ''}
          </button>
          <button type="button" class="dash-figma-icon-btn" id="dash-btn-edit-checklist" title="Edit Checklist Link" aria-label="Edit Checklist Link">
            ${EDIT_PENCIL_SVG}
          </button>
          <button type="button" class="dash-figma-icon-btn danger" id="dash-btn-clear-checklist" title="Clear Checklist Link" aria-label="Clear Checklist Link">
            ${icons.trash || ''}
          </button>
        </div>
      </div>

      <div class="dash-legacy-main-info">
        <div class="dash-legacy-emblem checklist" title="Checklist">
          ${CHECKLIST_ICON_SVG}
        </div>
        <div class="dash-legacy-meta">
          <h4 class="dash-legacy-title" title="${esc(displayName)}">${esc(displayName)}</h4>
          <a href="${esc(checklistUrl)}" class="dash-figma-url-pill" id="dash-checklist-url-anchor" title="${esc(checklistUrl)}" target="_blank">
            <span class="dash-figma-url-text">${esc(displayUrl)}</span>
            ${icons.link || ''}
          </a>
        </div>
      </div>

      <div class="dash-legacy-action-footer" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="btn-legacy-doc-launch" id="dash-btn-card-open-checklist" title="Open Checklist in browser">
          ${icons.link || ''}
          <span>Open in Browser</span>
        </button>
        <button type="button" class="btn-secondary btn-small" id="dash-btn-card-copy-checklist-cmd" title="Copy ${esc(productChecklistCmd)} to generate or update our product's Feature Checklist">
          ${icons.copy || ''}
          <span>${esc(productChecklistCmd)}</span>
        </button>
      </div>
    </div>
  `;

  const openChecklist = () => { void window.api.openExternal(checklistUrl); };
  slot.querySelector('#dash-btn-card-open-checklist')?.addEventListener('click', openChecklist);
  slot.querySelector('#dash-btn-card-copy-checklist-cmd')?.addEventListener('click', () => {
    void navigator.clipboard.writeText(productChecklistCmd);
    showToast(`Copied command: ${productChecklistCmd} — paste into Antigravity!`, 'success');
    const { activeWt } = getActiveProjectAndWorktree();
    if (activeProject?.path) {
      void window.api.syncBaProjectConfig({ projectPath: activeProject.path, worktreePath: activeWt?.path });
    }
  });
  slot.querySelector('#dash-checklist-url-anchor')?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    openChecklist();
  });
  slot.querySelector('#dash-btn-copy-checklist')?.addEventListener('click', () => {
    navigator.clipboard.writeText(checklistUrl);
    showToast('Checklist URL copied to clipboard', 'info');
  });
  slot.querySelector('#dash-btn-edit-checklist')?.addEventListener('click', () => {
    renderLegacyChecklistSlot(activeProject, true);
  });
  slot.querySelector('#dash-btn-clear-checklist')?.addEventListener('click', () => {
    void saveProjectLegacyChecklistUrl(activeProject, '', 'Checklist link cleared');
  });
}

function renderDashboardLegacyDocs(activeProject: any) {
  if (!dom.dashLegacyDocsBody) return;
  const prdUrl = (activeProject.legacyPrdUrl || '').trim();
  const checklistUrl = (activeProject.legacyChecklistUrl || '').trim();
  const linkedCount = (prdUrl ? 1 : 0) + (checklistUrl ? 1 : 0);

  if (dom.dashLegacyDocsStatusPill) {
    if (linkedCount === 2) {
      dom.dashLegacyDocsStatusPill.textContent = '2/2 Linked';
      dom.dashLegacyDocsStatusPill.className = 'dash-status-pill connected';
    } else if (linkedCount === 1) {
      dom.dashLegacyDocsStatusPill.textContent = '1/2 Linked';
      dom.dashLegacyDocsStatusPill.className = 'dash-status-pill partial';
    } else {
      dom.dashLegacyDocsStatusPill.textContent = 'Not Linked';
      dom.dashLegacyDocsStatusPill.className = 'dash-status-pill';
    }
  }

  if (dom.dashBtnBrowserPrd) {
    dom.dashBtnBrowserPrd.style.display = prdUrl ? 'inline-flex' : 'none';
  }
  if (dom.dashBtnBrowserChecklist) {
    dom.dashBtnBrowserChecklist.style.display = checklistUrl ? 'inline-flex' : 'none';
  }

  dom.dashLegacyDocsBody.innerHTML = `
    <div class="dash-legacy-docs-list">
      <div id="dash-legacy-prd-slot"></div>
      <div id="dash-legacy-checklist-slot"></div>
    </div>
  `;

  renderLegacyPrdSlot(activeProject, false);
  renderLegacyChecklistSlot(activeProject, false);
}

const COMPETITOR_THEMES = [
  { bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(14, 165, 233, 0.06))', border: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' },
  { bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))', border: 'rgba(255, 255, 255, 0.18)', color: 'var(--text-primary)' },
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

const reakitBusy = new Map<string, string>(); // compId -> 'downloading' | 'decompiling'
const competitorDecodeProgress = new Map<string, { stage: string; percent: number; detail: string; elapsedSec: number }>();
const inFlightReakitChecks = new Set<string>();

function updateCompetitorCardDecodeProgress(compId: string) {
  if (!dom.dashCompetitorList) return;
  const card = dom.dashCompetitorList.querySelector(`.dash-comp-card[data-comp-id="${compId}"]`);
  if (!card) return;
  const progress = competitorDecodeProgress.get(compId);
  if (!progress) return;

  const fillEl = card.querySelector('.dash-comp-progress-fill') as HTMLElement;
  const percentPill = card.querySelector('.dash-comp-pill-status.decoding') as HTMLElement;
  const elapsedPill = card.querySelector('.dash-comp-decode-elapsed') as HTMLElement;
  const hintEl = card.querySelector('.decode-progress-hint') as HTMLElement;

  if (fillEl && percentPill) {
    fillEl.style.width = `${progress.percent}%`;
    percentPill.textContent = `${progress.percent}%`;
    if (elapsedPill) elapsedPill.textContent = `${progress.elapsedSec || 0}s`;
    if (hintEl && progress.detail) hintEl.textContent = progress.detail;
  } else {
    // If card was rendered in idle/ready state, inject the decoding progress UI directly into decode-row
    const decodeRow = card.querySelector('.dash-comp-artifact-row.decode-row') as HTMLElement;
    if (decodeRow) {
      decodeRow.className = 'dash-comp-artifact-row decode-row decoding';
      decodeRow.innerHTML = `
        <div class="dash-comp-artifact-main decode-progress-main">
          <div class="dash-comp-artifact-badge decode decoding" title="Decompiling APK sources with ReaKit JADX">
            <span class="spinner" style="width:13px; height:13px; border-width:2px; border-color: #38bdf8 transparent #38bdf8 #38bdf8;"></span>
          </div>
          <div class="dash-comp-artifact-info">
            <div class="dash-comp-artifact-name-row">
              <span class="dash-comp-decode-status-text decoding">Decoding Source (JADX)</span>
              <span class="dash-comp-pill-status decoding">${progress.percent}%</span>
              <span class="dash-comp-decode-elapsed">${progress.elapsedSec || 0}s</span>
            </div>
            <div class="dash-comp-progress-wrap">
              <div class="dash-comp-progress-bar">
                <div class="dash-comp-progress-fill" style="width: ${progress.percent}%;"></div>
              </div>
            </div>
            <span class="dash-comp-artifact-hint decode-progress-hint">${esc(progress.detail || 'Decompiling bytecode to Java/Kotlin...')}</span>
          </div>
        </div>
      `;
    }
  }
}

// Global listener for competitor decode progress from backend
if (window.api.onCompetitorDecodeProgress) {
  window.api.onCompetitorDecodeProgress((data) => {
    if (!data?.competitorId) return;
    if (data.stage === 'completed' || data.stage === 'failed') {
      competitorDecodeProgress.delete(data.competitorId);
      reakitBusy.delete(data.competitorId);
      const { activeProject, activeWt } = getActiveProjectAndWorktree();
      if (activeProject) {
        const comp = (activeProject.competitors || []).find((c: any) => c.id === data.competitorId);
        if (comp && data.stage === 'completed') {
          comp.jadxStatus = 'ready';
        }
        renderDashboardCompetitors(activeProject, activeWt);
      }
    } else {
      competitorDecodeProgress.set(data.competitorId, data);
      reakitBusy.set(data.competitorId, 'decompiling');
      updateCompetitorCardDecodeProgress(data.competitorId);
    }
    window.dispatchEvent(new CustomEvent('competitor-decode-progress', { detail: data }));
  });
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
        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-primary btn-small dash-comp-empty-btn" id="dash-btn-empty-add-comp">
            ${icons.plus || '+'}
            <span>Add Competitor App</span>
          </button>
          <button type="button" class="btn-secondary btn-small dash-comp-empty-btn" id="dash-btn-empty-import-apk" title="Import competitor app from an APK file">
            ${icons.apk || icons.android}
            <span>Import APK</span>
          </button>
        </div>
      </div>
    `;

    const emptyAddBtn = dom.dashCompetitorList.querySelector('#dash-btn-empty-add-comp');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        if (dom.dashBtnAddCompetitor) dom.dashBtnAddCompetitor.click();
      });
    }
    const emptyImportBtn = dom.dashCompetitorList.querySelector('#dash-btn-empty-import-apk');
    if (emptyImportBtn) {
      emptyImportBtn.addEventListener('click', () => {
        void handleImportCompetitorApk();
      });
    }
    return;
  }

  dom.dashCompetitorList.innerHTML = competitors.map((comp: any) => {
    const busyState = reakitBusy.get(comp.id);
    const decodeProgress = competitorDecodeProgress.get(comp.id);
    const theme = getCompetitorTheme(comp.name);
    const initials = getCompetitorInitials(comp.name);
    const urlInfo = formatCompetitorUrlLabel(comp.url);
    const target = comp.packageName || comp.name;
    const isCodeOnly = comp.analysisMode !== 'hybrid';
    const competitorCmd = buildBenchmarkSlashCommand(target, '', { codeOnly: isCodeOnly });
    const featureExtractorCmd = buildFeatureExtractorSlashCommand(target, { codeOnly: isCodeOnly });
    const hasIcon = Boolean(comp.iconUrl);

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

          ${comp.apkPath ? `
            <div class="dash-comp-workbench">
              <div class="dash-comp-artifact-row apk-row">
                <div class="dash-comp-artifact-main">
                  <div class="dash-comp-artifact-badge apk" title="Linked Android APK build">
                    ${icons.apk || icons.android}
                  </div>
                  <div class="dash-comp-artifact-info">
                    <div class="dash-comp-artifact-name-row">
                      <span class="dash-comp-artifact-name" title="${esc(comp.apkName || comp.apkPath)}">${esc(comp.apkName || 'app.apk')}</span>
                      <span class="dash-comp-pill-mono">${formatBytes(comp.apkSize || 0)}</span>
                    </div>
                    <span class="dash-comp-artifact-path" title="${esc(comp.apkPath)}">${esc(comp.apkPath)}</span>
                  </div>
                </div>
                <div class="dash-comp-artifact-actions">
                  <button type="button" class="dash-comp-btn-action launch" data-action="comp-launch-app" data-comp-id="${esc(comp.id)}" data-pkg="${esc(comp.packageName || '')}" data-path="${esc(comp.apkPath)}" data-name="${esc(comp.name)}" title="Launch ${esc(comp.name)} on connected Android device via ADB (works even while decoding)">
                    ${icons.play || icons.device}
                    <span>Launch</span>
                  </button>
                  <button type="button" class="dash-comp-btn-action install" data-action="comp-install-apk" data-path="${esc(comp.apkPath)}" data-name="${esc(comp.name)}" title="Install ${esc(comp.name)} APK to connected Android device via ADB">
                    ${icons.download}
                    <span>Install</span>
                  </button>
                  <button type="button" class="dash-icon-btn" data-action="comp-reveal-apk" data-path="${esc(comp.apkPath)}" title="Reveal in ${isMac ? 'Finder' : 'File Explorer'}">
                    ${icons.folder}
                  </button>
                  <button type="button" class="dash-icon-btn danger" data-action="comp-unlink-apk" data-comp-id="${esc(comp.id)}" data-comp-name="${esc(comp.name)}" title="Unlink APK from ${esc(comp.name)}">
                    ${icons.trash}
                  </button>
                </div>
              </div>

              <div class="dash-comp-artifact-row decode-row ${busyState === 'decompiling' ? 'decoding' : ''}">
                ${busyState === 'decompiling' ? `
                  <div class="dash-comp-artifact-main decode-progress-main">
                    <div class="dash-comp-artifact-badge decode decoding" title="Decompiling APK sources with ReaKit JADX">
                      <span class="spinner" style="width:13px; height:13px; border-width:2px; border-color: #38bdf8 transparent #38bdf8 #38bdf8;"></span>
                    </div>
                    <div class="dash-comp-artifact-info">
                      <div class="dash-comp-artifact-name-row">
                        <span class="dash-comp-decode-status-text decoding">Decoding Source (JADX)</span>
                        <span class="dash-comp-pill-status decoding">${decodeProgress?.percent || 12}%</span>
                        <span class="dash-comp-decode-elapsed">${decodeProgress?.elapsedSec || 0}s</span>
                      </div>
                      <div class="dash-comp-progress-wrap">
                        <div class="dash-comp-progress-bar">
                          <div class="dash-comp-progress-fill" style="width: ${decodeProgress?.percent || 12}%;"></div>
                        </div>
                      </div>
                      <span class="dash-comp-artifact-hint decode-progress-hint">${esc(decodeProgress?.detail || 'Decompiling bytecode to Java/Kotlin...')}</span>
                    </div>
                  </div>
                ` : (comp.jadxStatus === 'ready' || comp.jadxSourcePath) ? `
                  <div class="dash-comp-artifact-main">
                    <div class="dash-comp-artifact-badge decode ready" title="Decoded Java/Kotlin sources ready">
                      ${icons.decode || icons.code}
                    </div>
                    <div class="dash-comp-artifact-info">
                      <div class="dash-comp-artifact-name-row">
                        <span class="dash-comp-decode-status-text ready">Decoded Source</span>
                        <span class="dash-comp-pill-status ready">JADX Ready</span>
                      </div>
                      <span class="dash-comp-artifact-path" title="${esc(comp.jadxSourcePath || 'jadx_src')}">${esc(comp.jadxSourcePath ? (comp.jadxSourcePath.split(/[\\/]/).slice(-2).join('/')) : 'jadx_src')}</span>
                    </div>
                  </div>
                  <div class="dash-comp-artifact-actions">
                    <button type="button" class="dash-comp-btn-action analyze" data-action="copy-bench-cmd" data-cmd="${esc(competitorCmd)}" title="Copy competitor analysis command (profile, screens, flows &amp; feature extraction): ${esc(competitorCmd)}">
                      ${icons.decode || icons.code || ''}
                      <span>Analyze</span>
                    </button>
                    <button type="button" class="dash-comp-btn-action source" data-action="comp-open-jadx-src" data-comp-id="${esc(comp.id)}" data-pkg="${esc(comp.packageName || '')}" data-jadx-path="${esc(comp.jadxSourcePath || '')}" title="Open decompiled source folder in ${FILE_MANAGER_LABEL}">
                      ${icons.folder}
                      <span>Source</span>
                    </button>
                    <button type="button" class="dash-icon-btn" data-action="comp-decompile-jadx" data-comp-id="${esc(comp.id)}" data-pkg="${esc(comp.packageName || '')}" data-comp-name="${esc(comp.name)}" data-path="${esc(comp.apkPath || '')}" title="Re-decode APK with ReaKit JADX">
                      ${icons.refresh}
                    </button>
                  </div>
                ` : `
                  <div class="dash-comp-artifact-main">
                    <div class="dash-comp-artifact-badge decode idle" title="APK source not decoded yet">
                      ${icons.decode || icons.code}
                    </div>
                    <div class="dash-comp-artifact-info">
                      <div class="dash-comp-artifact-name-row">
                        <span class="dash-comp-decode-status-text idle">Decoded Source</span>
                        <span class="dash-comp-pill-status idle">Not Decoded</span>
                      </div>
                      <span class="dash-comp-artifact-hint">Decompile Java/Kotlin &amp; layouts</span>
                    </div>
                  </div>
                  <div class="dash-comp-artifact-actions">
                    <button type="button" class="dash-comp-btn-action decode" data-action="comp-decompile-jadx" data-comp-id="${esc(comp.id)}" data-pkg="${esc(comp.packageName || '')}" data-comp-name="${esc(comp.name)}" data-path="${esc(comp.apkPath || '')}" title="Decode APK and extract Java/Kotlin sources with ReaKit JADX">
                      ${icons.decode || icons.code}
                      <span>Decode</span>
                    </button>
                  </div>
                `}
              </div>
            </div>
          ` : (busyState === 'downloading' ? `
            <div class="dash-comp-busy-banner">
              <div class="dash-comp-spinner"></div>
              <div class="dash-comp-busy-info">
                <span class="dash-comp-busy-title">Downloading APK...</span>
                <span class="dash-comp-busy-sub">Fetching Android package artifacts</span>
              </div>
            </div>
          ` : `
            <div class="dash-comp-no-apk-row">
              ${comp.packageName ? `
                <button type="button" class="dash-comp-btn-reakit-download" data-action="comp-reakit-download" data-comp-id="${esc(comp.id)}" data-comp-name="${esc(comp.name)}" data-pkg="${esc(comp.packageName)}" title="Download APK for ${esc(comp.packageName)}">
                  ${icons.download}
                  <span>Download APK</span>
                </button>
                <button type="button" class="dash-comp-link-apk-btn" data-action="comp-link-apk" data-comp-id="${esc(comp.id)}" data-comp-name="${esc(comp.name)}" title="Link an existing local APK file">
                  ${icons.apk || icons.android}
                  <span>Link APK</span>
                </button>
              ` : `
                <button type="button" class="dash-comp-link-apk-btn" data-action="comp-link-apk" data-comp-id="${esc(comp.id)}" data-comp-name="${esc(comp.name)}" title="Link an APK build to ${esc(comp.name)}">
                  ${icons.apk || icons.android}
                  <span>+ Link APK Build</span>
                </button>
              `}
            </div>
          `)}

          <div class="dash-comp-bench-section">
            <div class="dash-comp-bench-header">
              <div class="dash-comp-bench-header-left">
                <span class="dash-comp-bench-title" title="Extract reference app features with apk-feature-extractor">Feature Extraction</span>
                <span class="dash-comp-mcp-status ${isCodeOnly ? 'code-only' : 'hybrid'}" title="${isCodeOnly ? 'Mobilerun MCP disabled for this worktree to save agent tokens' : 'Mobilerun MCP active in workspace plugin'}">
                  ${isCodeOnly ? 'MCP Off' : 'MCP On'}
                </span>
              </div>
              <div class="dash-comp-bench-header-right">
                <div class="dash-comp-mode-toggle" title="Toggle Code-Only (--code-only static extraction) or Mobilerun (Live Device + Code)">
                  <button type="button" class="dash-comp-mode-btn ${isCodeOnly ? 'active' : ''}" data-action="set-comp-bench-mode" data-id="${esc(comp.id)}" data-mode="code-only" title="Mobilerun Off: Static decompiled code extraction without device (--code-only)">
                    ${icons.code || ''}
                    <span>Code-Only</span>
                  </button>
                  <button type="button" class="dash-comp-mode-btn ${isCodeOnly ? '' : 'active'}" data-action="set-comp-bench-mode" data-id="${esc(comp.id)}" data-mode="hybrid" title="Mobilerun On: Drives app on connected Android device + decoded code">
                    ${icons.android || ''}
                    <span>Mobilerun</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="dash-comp-cmd-item checklist" data-action="copy-bench-cmd" data-cmd="${esc(featureExtractorCmd)}" title="Extract competitor features (${isCodeOnly ? 'Mobilerun Off / Code-Only' : 'Mobilerun On / Device + Code'}) — Click to copy: ${esc(featureExtractorCmd)}">
              <div class="dash-comp-cmd-left">
                <span class="dash-comp-cmd-num checklist" title="Competitor Feature Extraction (apk-feature-extractor)">${icons.check || '✓'}</span>
                <code class="dash-comp-cmd-code">${esc(featureExtractorCmd)}</code>
              </div>
              <div class="dash-comp-cmd-right">
                <span class="dash-comp-cmd-tag checklist">apk-feature-extractor</span>
                <span class="dash-comp-cmd-copy-btn" title="Copy command">
                  <span class="dash-comp-bench-icon-state">${icons.copy || ''}</span>
                </span>
              </div>
            </div>
          </div>
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
      if ((e.target as HTMLElement).closest('[data-action="set-comp-bench-mode"], .dash-comp-mode-toggle')) return;
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const cmd = target.dataset.cmd;
      if (!cmd) return;

      void navigator.clipboard.writeText(cmd);
      showToast(`Copied command: ${cmd} — paste into Antigravity!`, 'success');

      // /ba-competitor and /apk-feature-extractor take the decoded-source path and mode from ba-project-config.md: refresh it now.
      const { activeProject, activeWt } = getActiveProjectAndWorktree();
      if (activeProject) {
        void window.api.syncBaProjectConfig({ projectPath: activeProject.path, worktreePath: activeWt?.path })
          .then((res: any) => {
            if (!res?.success) showToast(`Config sync failed: ${res?.error || 'Unknown error'}`, 'error');
          });
      }

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

  dom.dashCompetitorList.querySelectorAll('[data-action="set-comp-bench-mode"]').forEach((el: Element) => {
    el.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const id = target.dataset.id;
      const mode = target.dataset.mode || 'code-only';
      const comp = (activeProject?.competitors || []).find((c: any) => c.id === id);
      const currentMode = comp?.analysisMode || 'code-only';
      if (comp && currentMode !== mode) {
        comp.analysisMode = mode;
        if (activeProject?.path) {
          void window.api.updateProjectCompetitor(activeProject.path, comp);
        }

        const wtPath = activeWt?.path || state.activeWorktreePath;
        if (activeProject?.path) {
          void window.api.syncBaProjectConfig({ projectPath: activeProject.path, worktreePath: wtPath });
        }

        if (wtPath) {
          try {
            if (mode === 'code-only') {
              const anyOtherNeedsMobilerun = (activeProject?.competitors || []).some(
                (c: any) => c.id !== id && c.analysisMode === 'hybrid'
              );
              if (!anyOtherNeedsMobilerun) {
                const unreg = await window.api.unregisterMobilerunMcp({ worktreePath: wtPath });
                if (unreg?.success) {
                  showToast('Mobilerun Off (Code-Only): Disabled mobilerun MCP plugin for this worktree to save agent tokens.', 'info');
                  void refreshAgentToolkitStatus({ force: true });
                }
              } else {
                showToast('Mobilerun Off (--code-only) active for this app (other competitors still use Mobilerun).', 'info');
              }
            } else {
              const reg = await window.api.registerMobilerunMcp({ worktreePath: wtPath });
              if (reg?.success) {
                showToast('Mobilerun On: Enabled mobilerun MCP plugin in this worktree.', 'success');
                void refreshAgentToolkitStatus({ force: true });
              }
            }
          } catch (mcpErr: any) {
            console.warn('Failed to sync mobilerun MCP state:', mcpErr);
          }
        }

        renderDashboardCompetitors(activeProject, activeWt);
      }
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
          onSuccess: async (updated: any) => {
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

  // Launch competitor App on connected Android device
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-launch-app"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const apkPath = target.dataset.path || '';
      const pkg = target.dataset.pkg || '';
      const compName = target.dataset.name || 'Competitor';
      const compId = target.dataset.compId || '';

      const originalHtml = target.innerHTML;
      target.setAttribute('disabled', 'true');
      target.innerHTML = `<span class="spinner" style="width:11px; height:11px; border-width:2px;"></span> Launching...`;
      showToast(`Launching ${compName} on Android device...`, 'info');

      try {
        const res = await window.api.launchApp({
          packageName: pkg,
          apkPath,
        });
        if (res?.success) {
          showToast(`Successfully launched ${compName}!`, 'success');
          // If package was detected and wasn't in competitor metadata, update it
          if (res.packageName && !pkg && activeProject && compId) {
            const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
            if (comp && !comp.packageName) {
              comp.packageName = res.packageName;
              void window.api.updateProjectCompetitor(activeProject.path, {
                id: compId,
                packageName: res.packageName,
              });
              renderDashboardCompetitors(activeProject, activeWt);
            }
          }
        } else {
          showToast(`Launch failed: ${res?.error || 'Check device connection'}`, 'error');
        }
      } catch (err: any) {
        showToast(`Launch error: ${err.message}`, 'error');
      } finally {
        target.removeAttribute('disabled');
        target.innerHTML = originalHtml;
      }
    });
  });

  // Install competitor APK to connected Android device
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-install-apk"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const apkPath = target.dataset.path;
      const compName = target.dataset.name || 'Competitor';
      if (!apkPath) return;

      const originalHtml = target.innerHTML;
      target.setAttribute('disabled', 'true');
      target.innerHTML = `<span class="spinner" style="width:11px; height:11px; border-width:2px;"></span> Installing...`;
      showToast(`Installing ${compName} on Android device...`, 'info');

      try {
        const res = await window.api.installApk({ apkPath });
        if (res?.success) {
          showToast(`Successfully installed ${compName}!`, 'success');
        } else {
          showToast(`Install failed: ${res?.error || 'Check device connection'}`, 'error');
        }
      } catch (err: any) {
        showToast(`Install error: ${err.message}`, 'error');
      } finally {
        target.removeAttribute('disabled');
        target.innerHTML = originalHtml;
      }
    });
  });

  // Reveal competitor APK in File Explorer
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-reveal-apk"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const apkPath = target.dataset.path;
      if (apkPath) {
        void window.api.openInExplorer(apkPath);
      }
    });
  });

  // Unlink APK from competitor
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-unlink-apk"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const compId = target.dataset.compId;
      const compName = target.dataset.compName || 'Competitor';
      if (!compId) return;

      const res = await window.api.unlinkCompetitorApk(activeProject.path, compId);
      if (res?.success) {
        showToast(`Unlinked APK from ${compName}`, 'info');
        const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
        if (comp) {
          delete comp.apkPath;
          delete comp.apkName;
          delete comp.apkSize;
        }
        renderDashboardCompetitors(activeProject, activeWt);
      } else {
        showToast(`Failed to unlink APK: ${res?.error || 'Unknown error'}`, 'error');
      }
    });
  });

  // Link APK on competitor card
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-link-apk"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const compId = target.dataset.compId;
      const compName = target.dataset.compName || 'Competitor';
      if (!compId) return;

      const apkFile = await window.api.selectApkFile();
      if (apkFile) {
        const res = await window.api.linkCompetitorApk(activeProject.path, compId, apkFile);
        if (res?.success) {
          showToast(`Linked ${apkFile.name} to ${compName}!`, 'success');
          const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
          if (comp) {
            comp.apkPath = apkFile.path;
            comp.apkName = apkFile.name;
            comp.apkSize = apkFile.size;
            if (res.competitor?.jadxStatus === 'ready') {
              comp.jadxStatus = 'ready';
              comp.jadxSourcePath = res.competitor.jadxSourcePath;
            } else {
              void window.api.getCompetitorReakitStatus({
                projectPath: activeProject.path,
                competitorId: comp.id,
                packageName: comp.packageName,
                apkPath: apkFile.path,
              }).then((st: any) => {
                if (st?.hasJadx) {
                  comp.jadxStatus = 'ready';
                  comp.jadxSourcePath = st.jadxSourcePath;
                  renderDashboardCompetitors(activeProject, activeWt);
                }
              }).catch(() => {});
            }
          }
          renderDashboardCompetitors(activeProject, activeWt);
        } else {
          showToast(`Failed to link APK: ${res?.error || 'Unknown error'}`, 'error');
        }
      }
    });
  });

  // Download APK via ReaKit
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-reakit-download"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const compId = target.dataset.compId;
      const compName = target.dataset.compName || 'Competitor';
      const pkg = target.dataset.pkg;
      if (!compId || !pkg) return;

      if (reakitBusy.has(compId)) {
        showToast('Operation in progress for this competitor...', 'info');
        return;
      }

      reakitBusy.set(compId, 'downloading');
      renderDashboardCompetitors(activeProject, activeWt);
      showToast(`Downloading APK for ${compName}...`, 'info');

      try {
        const res = await window.api.downloadCompetitorApk({
          projectPath: activeProject.path,
          competitorId: compId,
          packageName: pkg,
        });

        if (res?.success && res.apkPath) {
          showToast(`Downloaded ${res.apkName || 'APK'} successfully!`, 'success');
          const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
          if (comp) {
            comp.apkPath = res.apkPath;
            comp.apkName = res.apkName;
            comp.apkSize = res.apkSize;
          }
          const status = await window.api.getCompetitorReakitStatus({
            projectPath: activeProject.path,
            packageName: pkg,
            apkPath: res.apkPath,
          });
          if (status?.hasJadx && comp) {
            comp.jadxStatus = 'ready';
            comp.jadxSourcePath = status.jadxSourcePath;
          }
        } else {
          showToast(`Download failed: ${res?.error || 'Unknown error'}`, 'error');
        }
      } catch (err: any) {
        showToast(`Download error: ${err?.message || String(err)}`, 'error');
      } finally {
        reakitBusy.delete(compId);
        renderDashboardCompetitors(activeProject, activeWt);
      }
    });
  });

  // Decompile APK with ReaKit JADX
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-decompile-jadx"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const compId = target.dataset.compId;
      const compName = target.dataset.compName || 'Competitor';
      const pkg = target.dataset.pkg;
      const apkPath = target.dataset.path;
      if (!compId) return;

      if (reakitBusy.has(compId)) {
        showToast('Operation in progress for this competitor...', 'info');
        return;
      }

      try {
        reakitBusy.set(compId, 'decompiling');
        competitorDecodeProgress.set(compId, {
          stage: 'preparing',
          percent: 8,
          detail: 'Preparing JADX environment...',
          elapsedSec: 0,
        });
        renderDashboardCompetitors(activeProject, activeWt);
        showToast(`Decoding ${compName} APK sources with ReaKit... Progress will show on card`, 'info');

        const res = await window.api.decompileCompetitorJadx({
          projectPath: activeProject.path,
          competitorId: compId,
          packageName: pkg,
          apkPath,
        });

        if (res?.success && res.jadxSourcePath) {
          showToast(`Successfully decoded ${compName} sources (JADX)!`, 'success');
          const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
          if (comp) {
            comp.jadxStatus = 'ready';
            comp.jadxSourcePath = res.jadxSourcePath;
          }
          void window.api.updateProjectCompetitor(activeProject.path, {
            id: compId,
            packageName: pkg,
            jadxSourcePath: res.jadxSourcePath,
            jadxStatus: 'ready',
          });
        } else {
          showToast(`Decode failed: ${res?.error || 'Unknown error'}`, 'error');
        }
      } catch (err: any) {
        showToast(`Decode error: ${err?.message || String(err)}`, 'error');
      } finally {
        reakitBusy.delete(compId);
        competitorDecodeProgress.delete(compId);
        renderDashboardCompetitors(activeProject, activeWt);
      }
    });
  });

  // Open JADX source folder in Explorer
  dom.dashCompetitorList.querySelectorAll('[data-action="comp-open-jadx-src"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const jadxPath = target.dataset.jadxPath;
      const pkg = target.dataset.pkg;
      const res = await window.api.openJadxSource({
        jadxSourcePath: jadxPath,
        projectPath: activeProject.path,
        packageName: pkg,
      });
      if (!res?.success) {
        showToast(res?.error || 'Failed to open JADX source folder', 'error');
      }
    });
  });

  // Drag and drop an APK onto a specific competitor card
  dom.dashCompetitorList.querySelectorAll('.dash-comp-card').forEach((cardEl: Element) => {
    const cardHtml = cardEl as HTMLElement;
    cardHtml.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cardHtml.classList.add('dragover');
    });
    cardHtml.addEventListener('dragleave', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cardHtml.classList.remove('dragover');
    });
    cardHtml.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cardHtml.classList.remove('dragover');
      const compId = cardHtml.dataset.compId;
      if (!compId) return;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0] as any;
      if (!file?.path || !/\.(apk|xapk|apks)$/i.test(file.path)) {
        showToast('Please drop an .apk or .xapk file', 'info');
        return;
      }

      const comp = (activeProject.competitors || []).find((c: any) => c.id === compId);
      const res = await window.api.linkCompetitorApk(activeProject.path, compId, {
        name: file.name,
        path: file.path,
        size: file.size || 0,
      });
      if (res?.success) {
        showToast(`Linked ${file.name} to ${comp?.name || 'competitor'}!`, 'success');
        if (comp) {
          comp.apkPath = file.path;
          comp.apkName = file.name;
          comp.apkSize = file.size || 0;
          if (res.competitor?.jadxStatus === 'ready') {
            comp.jadxStatus = 'ready';
            comp.jadxSourcePath = res.competitor.jadxSourcePath;
          } else {
            void window.api.getCompetitorReakitStatus({
              projectPath: activeProject.path,
              competitorId: comp.id,
              packageName: comp.packageName,
              apkPath: file.path,
            }).then((st: any) => {
              if (st?.hasJadx) {
                comp.jadxStatus = 'ready';
                comp.jadxSourcePath = st.jadxSourcePath;
                renderDashboardCompetitors(activeProject, activeWt);
              }
            }).catch(() => {});
          }
        }
        renderDashboardCompetitors(activeProject, activeWt);
      } else {
        showToast(`Failed to link APK: ${res?.error || 'Unknown error'}`, 'error');
      }
    });
  });

  // Auto-detect ReaKit status from disk for existing targets
  if (activeProject?.path) {
    (activeProject.competitors || []).forEach(async (comp: any) => {
      if (!comp.id || inFlightReakitChecks.has(comp.id)) return;
      if (comp.jadxStatus !== 'ready' || !comp.jadxSourcePath || !comp.apkPath) {
        inFlightReakitChecks.add(comp.id);
        try {
          const status = await window.api.getCompetitorReakitStatus({
            projectPath: activeProject.path,
            competitorId: comp.id,
            packageName: comp.packageName,
            apkPath: comp.apkPath,
            jadxSourcePath: comp.jadxSourcePath,
          });
          let changed = false;
          if (status.hasJadx && comp.jadxStatus !== 'ready') {
            comp.jadxStatus = 'ready';
            comp.jadxSourcePath = status.jadxSourcePath;
            changed = true;
          }
          if (status.hasApk && !comp.apkPath && status.apkPath) {
            comp.apkPath = status.apkPath;
            comp.apkName = status.apkName;
            comp.apkSize = status.apkSize;
            changed = true;
          }
          if (changed) {
            void window.api.updateProjectCompetitor(activeProject.path, {
              id: comp.id,
              packageName: comp.packageName,
              apkPath: comp.apkPath,
              apkName: comp.apkName,
              apkSize: comp.apkSize,
              jadxSourcePath: comp.jadxSourcePath,
              jadxStatus: comp.jadxStatus,
            });
            renderDashboardCompetitors(activeProject, activeWt);
          }
        } catch (_) {} finally {
          inFlightReakitChecks.delete(comp.id);
        }
      }
    });
  }
}

function hideProjectDependentScreens() {
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.deviceRemoteScreen) dom.deviceRemoteScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.add('hidden');
  if (dom.btnProjectResources) dom.btnProjectResources.classList.remove('active');
}

function renderDashboardViewer() {
  const hasProjects = Array.isArray(state.projects) && state.projects.length > 0;
  document.body.classList.toggle('no-projects-mode', !hasProjects);

  const { activeProject, activeWt } = getActiveProjectAndWorktree();

  if (!dom.dashboardViewer || !dom.dashboardEmptyState) return;

  if (!hasProjects || !activeProject) {
    hideProjectDependentScreens();
    lastAgentToolkitWorktreePath = null;
    updateSidebarFigmaButton(null);
    updateSidebarResourcesButton(null);
    dom.dashboardEmptyState.style.display = 'flex';
    dom.dashboardViewer.style.display = 'none';
    const settingsOpen = dom.settingsScreen && !dom.settingsScreen.classList.contains('hidden');
    const modalOpen = dom.modalOverlay && dom.modalOverlay.style.display !== 'none';
    if (!settingsOpen && !modalOpen && dom.btnDashboardAddFirst instanceof HTMLElement) {
      dom.btnDashboardAddFirst.focus({ preventScroll: true });
    }
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
  void refreshAgentToolkitStatus();
  renderDashboardCompetitors(activeProject, activeWt);
  renderProjectResourcesScreen();
}

// ── Dashboard Event Listeners ──
if (dom.btnDashboardAddFirst) {
  dom.btnDashboardAddFirst.addEventListener('click', () => {
    if (dom.btnAddProject) dom.btnAddProject.click();
  });
}

if (dom.btnDashboardEmptySettings) {
  dom.btnDashboardEmptySettings.addEventListener('click', () => {
    void showSettingsScreen();
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

if (dom.dashBtnRefreshProject) {
  dom.dashBtnRefreshProject.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    const proj = activeProject || (state.selectedProjectPath ? state.projects.find(p => p.path === state.selectedProjectPath) : (state.projects && state.projects[0] ? state.projects[0] : null));
    if (!proj) return;
    const icon = dom.dashBtnRefreshProject.querySelector('img, svg');
    if (icon) icon.classList.add('spinning');
    showToast(`Refreshing ${proj.name}...`, 'info');
    try {
      await refreshProjectWorkspaces(proj.path);
      showToast(`Refreshed ${proj.name}`, 'success');
    } catch (err) {
      showToast(`Failed to refresh ${proj.name}`, 'error');
    } finally {
      if (icon) icon.classList.remove('spinning');
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

// Competitors always render as a stacked list on the dashboard
applyDashboardViewMode('list');

if ((dom as any).dashBtnList) {
  // kept for backwards compatibility if needed
}

function applyResourcesViewMode(mode: 'grid' | 'list') {
  const screen = dom.projectResourcesScreen;
  const container = dom.resourcesSectionsContainer || (document.querySelector('.resources-sections-container') as HTMLElement | null);
  if (mode === 'grid') {
    screen?.classList.add('resources-grid-mode');
    screen?.classList.remove('resources-list-mode');
    container?.classList.add('resources-grid-mode');
    container?.classList.remove('resources-list-mode');
    dom.resourcesBtnViewGrid?.classList.add('active');
    dom.resourcesBtnViewList?.classList.remove('active');
  } else {
    screen?.classList.add('resources-list-mode');
    screen?.classList.remove('resources-grid-mode');
    container?.classList.add('resources-list-mode');
    container?.classList.remove('resources-grid-mode');
    dom.resourcesBtnViewList?.classList.add('active');
    dom.resourcesBtnViewGrid?.classList.remove('active');
  }
  try {
    localStorage.setItem('baspace_resources_view_mode', mode);
  } catch {}
}

const initialResourcesViewMode = (localStorage.getItem('baspace_resources_view_mode') || 'grid') as 'grid' | 'list';
applyResourcesViewMode(initialResourcesViewMode);

if (dom.resourcesBtnViewGrid) {
  dom.resourcesBtnViewGrid.addEventListener('click', () => {
    applyResourcesViewMode('grid');
  });
}

if (dom.resourcesBtnViewList) {
  dom.resourcesBtnViewList.addEventListener('click', () => {
    applyResourcesViewMode('list');
  });
}

async function handleImportCompetitorApk() {
  const { activeProject, activeWt } = getActiveProjectAndWorktree();
  if (!activeProject) {
    showToast('Please select a project first', 'error');
    return;
  }
  const apkFile = await window.api.selectApkFile();
  if (apkFile) {
    openCompetitorModal({
      project: activeProject,
      initialApk: apkFile,
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
}

if (dom.dashBtnImportCompApk) {
  dom.dashBtnImportCompApk.addEventListener('click', () => {
    void handleImportCompetitorApk();
  });
}

if (dom.dashSectionCompetitors) {
  dom.dashSectionCompetitors.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    dom.dashSectionCompetitors.classList.add('dragover');
  });
  dom.dashSectionCompetitors.addEventListener('dragleave', (e: DragEvent) => {
    if (!dom.dashSectionCompetitors.contains(e.relatedTarget as Node)) {
      dom.dashSectionCompetitors.classList.remove('dragover');
    }
  });
  dom.dashSectionCompetitors.addEventListener('drop', async (e: DragEvent) => {
    if (e.defaultPrevented && (e.target as HTMLElement).closest('.dash-comp-card')) {
      dom.dashSectionCompetitors.classList.remove('dragover');
      return;
    }
    e.preventDefault();
    dom.dashSectionCompetitors.classList.remove('dragover');

    const { activeProject, activeWt } = getActiveProjectAndWorktree();
    if (!activeProject) {
      showToast('Please select a project first', 'error');
      return;
    }

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0] as any;
    if (!file?.path || !/\.(apk|xapk|apks)$/i.test(file.path)) {
      showToast('Please drop an .apk or .xapk file', 'info');
      return;
    }

    openCompetitorModal({
      project: activeProject,
      initialApk: {
        name: file.name,
        path: file.path,
        size: file.size || 0,
      },
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

if (dom.dashBtnBrowserFirebase) {
  dom.dashBtnBrowserFirebase.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (activeProject?.firebaseUrl) {
      await window.api.openExternal(activeProject.firebaseUrl);
    }
  });
}

if (dom.dashBtnBrowserPlane) {
  dom.dashBtnBrowserPlane.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (activeProject?.planeUrl) {
      await window.api.openExternal(activeProject.planeUrl);
    }
  });
}

if (dom.dashBtnBrowserPrd) {
  dom.dashBtnBrowserPrd.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (activeProject?.legacyPrdUrl) {
      await window.api.openExternal(activeProject.legacyPrdUrl);
    }
  });
}

if (dom.dashBtnBrowserChecklist) {
  dom.dashBtnBrowserChecklist.addEventListener('click', async () => {
    const { activeProject } = getActiveProjectAndWorktree();
    if (activeProject?.legacyChecklistUrl) {
      await window.api.openExternal(activeProject.legacyChecklistUrl);
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
  state.projects = (await window.api.getWorkspaces()) || [];
  
  dom.loadingState.style.display = 'none';
  dom.projectsContainer.style.display = '';

  if (state.projects.length === 0) {
    state.selectedProjectPath = null;
    state.activeWorktreePath = null;
  }

  if (state.expandedProjects.size === 0) {
    state.projects.forEach((p) => state.expandedProjects.add(p.path));
  }
  renderSidebar();

  // Automatically select and open the first project on startup
  if (!state.activeWorktreePath && state.projects.length > 0) {
    const targetProjPath = state.selectedProjectPath || state.projects[0].path;
    await openProjectWorkspace(targetProjPath);
  }
}

function renderSidebar() {
  if (!state.projects.length) {
    dom.projectsContainer.innerHTML = '';
    dom.projectsContainer.style.display = 'none';
    dom.emptyState.style.display = '';
    state.selectedProjectPath = null;
    state.activeWorktreePath = null;
    updateSidebarActiveState();
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
        await openProjectWorkspace(projectPath);
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
  const refreshButton = sidebarActionButtonHTML({
    action: 'project-refresh',
    path: project.path,
    title: 'Refresh project',
    icon: icons.refresh,
  });
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
        ${refreshButton}
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

function scrollSelectedProjectIntoView(projectPath?: string) {
  const targetPath = projectPath || state.selectedProjectPath;
  if (!targetPath || !dom.projectsContainer) return;
  const navItem = dom.projectsContainer.querySelector(`.project-nav-item[data-project-path="${CSS.escape(targetPath)}"]`);
  if (navItem instanceof HTMLElement) {
    navItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  const detailCol = dom.projectsContainer.querySelector('.projects-detail-col');
  if (detailCol instanceof HTMLElement) {
    detailCol.scrollTop = 0;
  }
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

  // Refresh button
  container.querySelector('[data-action="project-refresh"]')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLElement;
    const icon = btn?.querySelector('svg, img');
    if (icon) icon.classList.add('spinning');
    showToast(`Refreshing ${project.name}...`, 'info');
    try {
      await refreshProjectWorkspaces(project.path);
      showToast(`Refreshed ${project.name}`, 'success');
    } catch (err) {
      showToast(`Failed to refresh ${project.name}`, 'error');
    } finally {
      if (icon) icon.classList.remove('spinning');
    }
  });

  // Options button
  container.querySelector('[data-action="project-options"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showProjectOptionsMenu(project, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
  });

  // Worktree items → switch to worktree context
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

    wtEl.querySelector('[data-action="android-studio"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      showToast('Opening Android Studio...', 'info');
      if (currentTarget instanceof HTMLElement) {
        const res = await window.api.openInAndroidStudio(currentTarget.dataset.path || '');
        if (res && res.success === false) showToast(res.error || 'Failed to open Android Studio', 'error');
      }
    });

    wtEl.querySelector('[data-action="antigravity"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentTarget = e.currentTarget;
      showToast('Opening Antigravity...', 'info');
      if (currentTarget instanceof HTMLElement) {
        const res = await window.api.openInAntigravity(currentTarget.dataset.path || '');
        if (res && res.success === false) showToast(res.error || 'Failed to open Antigravity IDE', 'error');
      }
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
  const nextSettings = {
    ...state.settings,
    antigravityPath: dom.settingsAntigravityPath ? cleanVal(dom.settingsAntigravityPath.value) : '',
    antigravityAgentPath: dom.settingsAntigravityAgentPath ? cleanVal(dom.settingsAntigravityAgentPath.value) : '',
    claudeDesktopPath: dom.settingsClaudeDesktopPath ? cleanVal(dom.settingsClaudeDesktopPath.value) : '',
    vscodePath: dom.settingsVsCodePath ? cleanVal(dom.settingsVsCodePath.value) : '',
    androidStudioPath: dom.settingsAndroidStudioPath ? cleanVal(dom.settingsAndroidStudioPath.value) : '',
    figmaPath: dom.settingsFigmaPath ? cleanVal(dom.settingsFigmaPath.value) : '',
    figmaUrl: dom.settingsFigmaUrl ? dom.settingsFigmaUrl.value.trim() : (state.settings?.figmaUrl || 'https://www.figma.com'),
    obsidianPath: dom.settingsObsidianPath ? cleanVal(dom.settingsObsidianPath.value) : '',
    obsidianVault: dom.settingsObsidianVault ? dom.settingsObsidianVault.value.trim() : (state.settings?.obsidianVault || ''),
    scrcpyPath: dom.settingsScrcpyPath ? cleanVal(dom.settingsScrcpyPath.value) : '',
    reakitPath: dom.settingsReaKitPath ? cleanVal(dom.settingsReaKitPath.value) : '',
    autoRefreshCurrentProject: state.settings?.autoRefreshCurrentProject ?? false,
    autoRefreshInterval: state.settings?.autoRefreshInterval ?? 10,
  };
  state.settings = await window.api.updateSettings(nextSettings);
}

async function showSettingsScreen() {
  if (state.settings) {
    if (dom.settingsAntigravityPath) dom.settingsAntigravityPath.value = state.settings.antigravityPath || 'detecting...';
    if (dom.settingsAntigravityAgentPath) dom.settingsAntigravityAgentPath.value = state.settings.antigravityAgentPath || 'detecting...';
    if (dom.settingsClaudeDesktopPath) dom.settingsClaudeDesktopPath.value = state.settings.claudeDesktopPath || 'detecting...';
    if (dom.settingsVsCodePath) dom.settingsVsCodePath.value = state.settings.vscodePath || 'detecting...';
    if (dom.settingsAndroidStudioPath) dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || 'detecting...';
    if (dom.settingsFigmaPath) dom.settingsFigmaPath.value = state.settings.figmaPath || '';
    if (dom.settingsFigmaUrl) dom.settingsFigmaUrl.value = state.settings.figmaUrl || 'https://www.figma.com';
    if (dom.settingsObsidianPath) dom.settingsObsidianPath.value = state.settings.obsidianPath || 'detecting...';
    if (dom.settingsObsidianVault) dom.settingsObsidianVault.value = state.settings.obsidianVault || '';
    if (dom.settingsScrcpyPath) dom.settingsScrcpyPath.value = state.settings.scrcpyPath || 'detecting...';
    if (dom.settingsReaKitPath) dom.settingsReaKitPath.value = state.settings.reakitPath || 'detecting...';
  }

  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.deviceRemoteScreen) dom.deviceRemoteScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.add('hidden');
  if (dom.btnProjectResources) dom.btnProjectResources.classList.remove('active');
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
      if (dom.settingsClaudeDesktopPath) {
        dom.settingsClaudeDesktopPath.value = state.settings.claudeDesktopPath || detected.claudeDesktopPath || 'not detected';
      }
      if (dom.settingsVsCodePath) {
        dom.settingsVsCodePath.value = state.settings.vscodePath || detected.vscodePath || 'not detected';
      }
      if (dom.settingsAndroidStudioPath) {
        dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || detected.androidStudioPath || 'not detected';
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
      if (dom.settingsReaKitPath) {
        dom.settingsReaKitPath.value = state.settings.reakitPath || detected.reakitPath || 'not detected';
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
      if (dom.settingsClaudeDesktopPath) {
        dom.settingsClaudeDesktopPath.value = state.settings.claudeDesktopPath || 'not detected';
      }
      if (dom.settingsVsCodePath) {
        dom.settingsVsCodePath.value = state.settings.vscodePath || 'not detected';
      }
      if (dom.settingsAndroidStudioPath) {
        dom.settingsAndroidStudioPath.value = state.settings.androidStudioPath || 'not detected';
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
      if (dom.settingsReaKitPath) {
        dom.settingsReaKitPath.value = state.settings.reakitPath || 'not detected';
      }
    }
  }
}


async function hideSettingsScreen() {
  await saveSettingsFromUI();
  dom.settingsScreen.classList.add('hidden');
  startAutoRefreshLoop();
}

// ── Symlink Screen ─────────────────────────────────────
async function showSymlinkScreen() {
  const activeWorktreePath = state.activeWorktreePath;
  const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'No active project';

  if (dom.symlinkScreenActiveName) dom.symlinkScreenActiveName.textContent = activeWorktreeName;
  if (dom.symlinkScreenActivePath) dom.symlinkScreenActivePath.textContent = activeWorktreePath || 'Please select a worktree first.';

  dom.settingsScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.deviceRemoteScreen) dom.deviceRemoteScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.add('hidden');
  if (dom.btnProjectResources) dom.btnProjectResources.classList.remove('active');
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
  });
}

// ── Dashboard Collapsible BA Agent Toolkit ─────────────────
const DASHBOARD_TOOLKIT_COLLAPSED_KEY = 'baspace_dashboard_toolkit_collapsed';

function loadDashboardToolkitCollapsed(): boolean {
  try {
    const val = localStorage.getItem(DASHBOARD_TOOLKIT_COLLAPSED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

function setDashboardToolkitCollapsed(collapsed: boolean, { persist = true } = {}) {
  if (!dom.dashSectionAgentToolkit) return;
  dom.dashSectionAgentToolkit.classList.toggle('collapsed', collapsed);
  if (dom.dashToolkitHeader) {
    dom.dashToolkitHeader.setAttribute('aria-expanded', String(!collapsed));
  }
  if (dom.dashToolkitBody) {
    dom.dashToolkitBody.inert = collapsed;
  }
  if (persist) {
    try {
      localStorage.setItem(DASHBOARD_TOOLKIT_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch {}
  }
}

if (dom.dashToolkitHeader) {
  dom.dashToolkitHeader.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('.dash-section-actions, button')) return;
    const isCollapsed = dom.dashSectionAgentToolkit?.classList.contains('collapsed') ?? true;
    setDashboardToolkitCollapsed(!isCollapsed);
  });

  dom.dashToolkitHeader.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('.dash-section-actions, button')) return;
    e.preventDefault();
    const isCollapsed = dom.dashSectionAgentToolkit?.classList.contains('collapsed') ?? true;
    setDashboardToolkitCollapsed(!isCollapsed);
  });
}

setDashboardToolkitCollapsed(loadDashboardToolkitCollapsed(), { persist: false });

// ── Device Manager Screen ──────────────────────────────────
const deviceManagerScreen = new DeviceManagerScreen({
  dom,
  showToast,
  getActiveWorktreePath: () => state.activeWorktreePath,
  icons,
});

async function toggleDashboardAgentToolkit() {
  const otherScreenOpen = Boolean(
    (dom.settingsScreen && !dom.settingsScreen.classList.contains('hidden')) ||
    deviceManagerScreen.isRemoteScreenVisible() ||
    (dom.symlinkScreen && !dom.symlinkScreen.classList.contains('hidden')) ||
    (dom.deviceManagerScreen && !dom.deviceManagerScreen.classList.contains('hidden')) ||
    (dom.deviceRemoteScreen && !dom.deviceRemoteScreen.classList.contains('hidden')) ||
    (dom.projectResourcesScreen && !dom.projectResourcesScreen.classList.contains('hidden'))
  );

  if (dom.settingsScreen && !dom.settingsScreen.classList.contains('hidden')) {
    await hideSettingsScreen();
  }
  if (deviceManagerScreen.isRemoteScreenVisible()) {
    await deviceManagerScreen.closeRemoteScreen(true);
  }
  hideProjectDependentScreens();

  const isCollapsed = dom.dashSectionAgentToolkit?.classList.contains('collapsed') ?? true;
  const nextCollapsed = otherScreenOpen ? false : !isCollapsed;
  setDashboardToolkitCollapsed(nextCollapsed);

  if (!nextCollapsed) {
    await refreshAgentToolkitStatus();
    dom.dashSectionAgentToolkit?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function showDeviceManagerScreen() {
  dom.settingsScreen?.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceRemoteScreen) dom.deviceRemoteScreen.classList.add('hidden');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.add('hidden');
  if (dom.btnProjectResources) dom.btnProjectResources.classList.remove('active');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.add('active');

  await deviceManagerScreen.show();
}

function hideDeviceManagerScreen() {
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');
  deviceManagerScreen.hide();
  startAutoRefreshLoop();
}

// ── Project Resources Screen (Figma, Firebase, Plane, Legacy Docs) ──
function renderProjectResourcesScreen() {
  const { activeProject, activeWt } = getActiveProjectAndWorktree();
  if (dom.resourcesProjectName) {
    dom.resourcesProjectName.textContent = activeProject ? activeProject.name : 'No active project';
  }
  if (dom.resourcesBranchBadge) {
    dom.resourcesBranchBadge.textContent = activeWt ? (activeWt.branch || activeWt.name) : 'main';
  }
  const currentPath = activeWt ? activeWt.path : (activeProject ? activeProject.path : 'Please select a project first.');
  if (dom.resourcesProjectPath) {
    dom.resourcesProjectPath.textContent = currentPath;
    dom.resourcesProjectPath.title = currentPath;
  }
  if (activeProject) {
    renderDashboardFigma(activeProject);
    renderDashboardFirebase(activeProject);
    renderDashboardPlane(activeProject);
    renderDashboardLegacyDocs(activeProject);
  }
  updateSidebarResourcesButton(activeProject);
}

function showProjectResourcesScreen() {
  dom.settingsScreen?.classList.add('hidden');
  if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
  if (dom.deviceManagerScreen) dom.deviceManagerScreen.classList.add('hidden');
  if (dom.deviceRemoteScreen) dom.deviceRemoteScreen.classList.add('hidden');
  if (dom.btnDeviceManager) dom.btnDeviceManager.classList.remove('active');

  if (dom.btnProjectResources) dom.btnProjectResources.classList.add('active');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.remove('hidden');

  renderProjectResourcesScreen();
}

function hideProjectResourcesScreen() {
  if (dom.btnProjectResources) dom.btnProjectResources.classList.remove('active');
  if (dom.projectResourcesScreen) dom.projectResourcesScreen.classList.add('hidden');
  startAutoRefreshLoop();
}

function openMobilerunSetup({ intro = '', onReady = null, onDismiss = null }: { intro?: string; onReady?: (() => Promise<void>) | null; onDismiss?: (() => void) | null } = {}) {
  return openMobilerunSetupModal({
    dom, configureModalFooter, showModal, hideModal, showToast, esc, api: window.api, intro, onReady, onDismiss,
  });
}

// Offer Mobilerun setup on launch when Python or mobilerun is missing, or when this build bundles a newer
// mobilerun-mcp than the installed one. "Not now" is remembered per bundled wheel, so it comes back once
// after an app update ships a new wheel; the BAKit toolkit screen offers it any time.
const MOBILERUN_SETUP_DISMISSED_KEY = 'baspace.mobilerunSetupDismissed';

async function checkMobilerunSetupOnLaunch() {
  // Zero-setup runner via npx (@impeterwayne/mobilerun-mcp@latest)
  return;
}

// Toolkit components to link/manage
const BAKIT_COMPONENTS = [
  {
    id: 'bakit_agents',
    toolkit: 'bakit',
    name: 'BA Agent Roster',
    folderName: '.agents/agents',
    sourceFolder: 'agents',
    description: 'Deploy ba-lead (orchestrator), code-scout, competitor-analyst, evidence-verifier, figma-analyst, ba-researcher, ba-brainstormer and ba-spec-writer agents.',
    gitExcludePatterns: [
      '.agents/agents/ba-lead.md',
      '.agents/agents/code-scout.md',
      '.agents/agents/competitor-analyst.md',
      '.agents/agents/evidence-verifier.md',
      '.agents/agents/figma-analyst.md',
      '.agents/agents/ba-researcher.md',
      '.agents/agents/ba-brainstormer.md',
      '.agents/agents/ba-spec-writer.md'
    ]
  },
  {
    id: 'bakit_skills',
    toolkit: 'bakit',
    name: 'BA Skills & Templates (specs, user-flow, checklist, competitor & Figma analysis, audits, QC, diagrams, Minipower, Office)',
    folderName: '.agents/skills',
    sourceFolder: 'skills',
    description: '44 skills: ba-templates, apk-feature-extractor (Markdown + Excel), research-feature-checklist, ba-checklist, apk-code-index, competitor-app-analysis, mobilerun, figma-ba-analysis, product-decision, specs (docs/project-srs.md), use-case-writer, user-flow (render_diagrams.py), srs-export, user-story-ac-writer, minipower (18 DOCs), BA-audit-SRS/QnA, global-impact-analyzer/executor, ba-architect/auditor/challenger/consistency/validation, test-cases, qc-* suite, drawio-ai-kit + drawio-*, bpmn-generator, mermaidjs-v11, docx, pdf, document-extraction, brainstorm-features, problem-solving, sequential-thinking.',
    gitExcludePatterns: [
      '.agents/skills/ba-templates/',
      '.agents/skills/ba-checklist/',
      '.agents/skills/research-feature-checklist/',
      '.agents/skills/apk-code-index/',
      '.agents/skills/apk-feature-extractor/',
      '.agents/skills/competitor-app-analysis/',
      '.agents/skills/mobilerun/',
      '.agents/skills/figma-ba-analysis/',
      '.agents/skills/specs/',
      '.agents/skills/srs-export/',
      '.agents/skills/use-case-writer/',
      '.agents/skills/user-flow/',
      '.agents/skills/user-story-ac-writer/',
      '.agents/skills/minipower/',
      '.agents/skills/test-cases/',
      '.agents/skills/BA-audit-SRS/',
      '.agents/skills/BA-audit-QnA/',
      '.agents/skills/global-impact-analyzer/',
      '.agents/skills/global-executor/',
      '.agents/skills/ba-consistency-inspector/',
      '.agents/skills/ba-shared-validation-rules/',
      '.agents/skills/ba-architect/',
      '.agents/skills/ba-auditor/',
      '.agents/skills/ba-challenger/',
      '.agents/skills/qc-ask-ba/',
      '.agents/skills/qc-scenario-design/',
      '.agents/skills/qc-tc-design/',
      '.agents/skills/qc-tc-summary/',
      '.agents/skills/qc-uc-review/',
      '.agents/skills/brainstorm-features/',
      '.agents/skills/product-decision/',
      '.agents/skills/document-extraction/',
      '.agents/skills/docx/',
      '.agents/skills/pdf/',
      '.agents/skills/mermaidjs-v11/',
      '.agents/skills/bpmn-generator/',
      '.agents/skills/drawio-ai-kit/',
      '.agents/skills/drawio-bpmn/',
      '.agents/skills/drawio-aws/',
      '.agents/skills/drawio-azure/',
      '.agents/skills/drawio-gcp/',
      '.agents/skills/drawio-databricks/',
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
      { name: '.agents/rules', source: 'rules', pattern: '.agents/rules/' },
      { name: '.agents/workflows', source: 'workflows', pattern: '.agents/workflows/' },
      // The project config is filled in per project: never overwrite it, never delete it.
      { name: '.agents/config', source: 'config', pattern: '.agents/config/', preserveExisting: true, keepOnRemove: true }
    ],
    description: 'Always-on BA rules (6-step PO workflow, Vietnamese deliverables, naming, device safety, Figma routing, markdown formatting), slash workflows (/ba-checklist, /ba-figma, /ba-spec, /ba-review, /ba-export, /ba-competitor), and project config (.agents/config/ba-project-config.md).',
    gitExcludePatterns: [
      '.agents/rules/ba-global-rules.md',
      '.agents/rules/ba-workflow.md',
      '.agents/rules/ba-naming-convention.md',
      '.agents/rules/ba-device-automation.md',
      '.agents/rules/ba-markdown-formatting.md',
      '.agents/rules/ba-figma.md',
      '.agents/workflows/apk-feature-extractor.md',
      '.agents/workflows/ba-checklist.md',
      '.agents/workflows/ba-competitor.md',
      '.agents/workflows/ba-export.md',
      '.agents/workflows/ba-figma.md',
      '.agents/workflows/ba-review.md',
      '.agents/workflows/ba-spec.md',
      '.agents/workflows/ba-template.md'
    ]
  },
  {
    id: 'bakit_agents_md',
    toolkit: 'bakit',
    kind: 'agentsmd',
    name: 'Delegation Rule (AGENTS.md)',
    sourceFile: 'agents-md/AGENTS.block.md',
    description: 'Adds a marked block to the worktree AGENTS.md so the main Antigravity session plans and dispatches subagents (invoke_subagent) instead of doing the work itself. Your own AGENTS.md content is kept.',
    gitExcludePatterns: []
  },
  {
    id: 'bakit_figma_mcp',
    toolkit: 'bakit',
    kind: 'mcp',
    name: 'Figma MCP (workspace plugin)',
    description: 'Adds figma-mcp-android (npx) as an Antigravity plugin in this worktree (.agents/plugins/figma) so /ba-figma can read the design open in Figma Desktop. Uses the bundled Node.js; needs the figma-mcp-android plugin running in Figma Desktop. Skipped when already registered globally.',
    gitExcludePatterns: []
  },
  {
    id: 'bakit_mobilerun_mcp',
    toolkit: 'bakit',
    kind: 'mcp',
    optional: true,
    name: 'Mobilerun MCP (workspace plugin)',
    description: 'Optional — only needed when driving a connected Android device (Mobilerun mode). Adds the mobilerun server as an Antigravity plugin in this worktree (.agents/plugins/mobilerun); not auto-enabled when applying the harness so Code-Only saves agent tokens.',
    gitExcludePatterns: []
  }
];

const TOOLKIT_COMPONENTS = [...BAKIT_COMPONENTS];
let agentToolkitRefreshSeq = 0;
let lastAgentToolkitWorktreePath: string | null = null;
let activeToolkitMutations = 0;

function updateDashboardToolkitBadges(statuses: Array<{ id: string; exists: boolean }> | null, loading = false) {
  if (loading) {
    if (dom.dashToolkitStatusPill) {
      dom.dashToolkitStatusPill.textContent = 'Checking...';
      dom.dashToolkitStatusPill.className = 'dash-status-pill';
    }
    if (dom.dashToolkitCountBadge) {
      dom.dashToolkitCountBadge.style.display = 'none';
    }
    return;
  }

  if (!statuses) {
    if (dom.dashToolkitStatusPill) {
      dom.dashToolkitStatusPill.textContent = 'Idle';
      dom.dashToolkitStatusPill.className = 'dash-status-pill';
    }
    if (dom.dashToolkitCountBadge) {
      dom.dashToolkitCountBadge.style.display = 'none';
    }
    return;
  }

  const totalCount = TOOLKIT_COMPONENTS.length;
  const activeCount = statuses.filter(s => s.exists).length;
  const bakitActive = BAKIT_COMPONENTS.some(b => b.kind !== 'mcp' && statuses.some(s => s.id === b.id && s.exists));

  if (dom.dashToolkitStatusPill) {
    if (activeCount === totalCount && totalCount > 0) {
      dom.dashToolkitStatusPill.textContent = 'All Active';
      dom.dashToolkitStatusPill.className = 'dash-status-pill connected';
    } else if (bakitActive) {
      dom.dashToolkitStatusPill.textContent = 'Harness Active';
      dom.dashToolkitStatusPill.className = 'dash-status-pill connected';
    } else if (activeCount > 0) {
      dom.dashToolkitStatusPill.textContent = 'Partial';
      dom.dashToolkitStatusPill.className = 'dash-status-pill partial';
    } else {
      dom.dashToolkitStatusPill.textContent = 'Idle';
      dom.dashToolkitStatusPill.className = 'dash-status-pill';
    }
  }

  if (dom.dashToolkitCountBadge) {
    dom.dashToolkitCountBadge.textContent = `${activeCount}/${totalCount} Active`;
    dom.dashToolkitCountBadge.style.display = 'inline-flex';
  }
}

async function refreshAgentToolkitStatus({ force = false } = {}) {
  if (activeToolkitMutations > 0 && !force) return;

  const { activeProject, activeWt } = getActiveProjectAndWorktree();
  const activeWorktreePath = activeWt ? activeWt.path : (activeProject ? activeProject.path : state.activeWorktreePath);
  const projectPath = activeProject ? activeProject.path : (state.selectedProjectPath || (state.projects[0] ? state.projects[0].path : null));

  const listContainer = dom.agentToolkitListContainer;
  if (!listContainer) return;

  if (!activeWorktreePath || !projectPath) {
    lastAgentToolkitWorktreePath = null;
    updateDashboardToolkitBadges(null);
    listContainer.innerHTML = `<div class="symlink-empty-state">No Active Worktree or Project path found.</div>`;
    return;
  }

  const refreshSeq = ++agentToolkitRefreshSeq;
  const switchedWorktree = lastAgentToolkitWorktreePath !== activeWorktreePath;
  lastAgentToolkitWorktreePath = activeWorktreePath;

  const pPath = projectPath.replace(/[\\/]+$/, '');
  const savedScrollTop = listContainer.scrollTop;

  if (switchedWorktree || !listContainer.innerHTML || listContainer.innerHTML.includes('No Active Worktree') || listContainer.innerHTML.includes('No active project')) {
    updateDashboardToolkitBadges(null, true);
    listContainer.innerHTML = `<div style="display:flex; justify-content:center; padding:16px; align-items:center; gap:8px;"><span class="spinner"></span> Checking status...</div>`;
  }

  // 1. Determine toolkit source directories
  const defaultSources = await window.api.getDefaultToolkitSources();

  let bakitPath = defaultSources.bakitPath;
  if (!(await window.api.pathExists(bakitPath)) && (await window.api.pathExists(pPath + '/toolkits/BAKit'))) {
    bakitPath = pPath + '/toolkits/BAKit';
  }

  const srcBaseFor = (_comp: any) => bakitPath;

  try {
    // Fetch statuses for all components
    const statuses = await Promise.all(TOOLKIT_COMPONENTS.map(async (comp: any) => {
      if (comp.kind === 'agentsmd') {
        try {
          const st = await window.api.getAgentsMdBlockStatus({
            worktreePath: activeWorktreePath,
            sourcePath: srcBaseFor(comp) + '/' + comp.sourceFile
          });
          return { id: comp.id, name: comp.name, sourceExists: st.sourceExists, exists: st.installed };
        } catch (e) {
          return { id: comp.id, name: comp.name, sourceExists: false, exists: false };
        }
      }
      if (comp.id === 'bakit_figma_mcp') {
        try {
          const mcp = await window.api.getFigmaMcpStatus({ worktreePath: activeWorktreePath });
          // A global entry serves this workspace too (and holds the plugin port), so it counts as active.
          return { id: comp.id, name: comp.name, sourceExists: true, exists: mcp.registered || mcp.globalRegistered };
        } catch (e) {
          return { id: comp.id, name: comp.name, sourceExists: false, exists: false };
        }
      }
      if (comp.kind === 'mcp') {
        try {
          const mcp = await window.api.getMobilerunMcpStatus({ worktreePath: activeWorktreePath });
          return { id: comp.id, name: comp.name, sourceExists: true, exists: mcp.registered };
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
            return await window.api.pathExists(srcBase + '/' + rel);
          }));
          sourceExists = folderChecks.every(v => v);
        } else {
          const rel = comp.sourceFolder || comp.folderName;
          sourceExists = await window.api.pathExists(srcBase + '/' + rel);
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
              sourcePath: srcBase + '/' + rel
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
            sourcePath: srcBase + '/' + rel
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

    if (refreshSeq !== agentToolkitRefreshSeq) return;
    if (activeToolkitMutations > 0 && !force) return;

    updateDashboardToolkitBadges(statuses);

    const getStatus = (id: string): any => statuses.find(s => s.id === id) || { exists: false, sourceExists: false };

    function renderComponentItem(compItem: any) {
      const stateItem = getStatus(compItem.id);
      let badgeHTML = '';
      let checked = '';
      let disabledAttr = '';
      let opacityStyle = '';

      if (stateItem.needsInstall) {
        badgeHTML = `<span class="symlink-status-badge symlink-status-unlinked" style="background: rgba(245, 166, 35, 0.12); color: rgb(245, 166, 35); border: 1px solid rgba(245, 166, 35, 0.3);" title="Python or mobilerun is not installed. Tick the box to install it.">Needs Setup</span>`;
        if (stateItem.exists) checked = 'checked';
      } else if (!stateItem.sourceExists) {
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
      if (compItem.id === 'bakit_figma_mcp') {
        compIcon = `<span style="display: inline-flex; align-items: center; justify-content: center; color: var(--accent-default); width: 16px; height: 16px;">${icons.figma}</span>`;
      } else if (compItem.kind === 'mcp') {
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
        <div class="symlink-item" style="border-radius: var(--radius-md); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-elevated); border: 1px solid var(--border-subtle); ${opacityStyle}">
          <label class="symlink-label" style="cursor: ${stateItem.sourceExists ? 'pointer' : 'not-allowed'}; display: flex; align-items: center; gap: 8px; width: 100%;">
            <input type="checkbox" class="agent-toolkit-checkbox" data-id="${compItem.id}" ${compItem.optional ? 'data-optional="true"' : ''} ${stateItem.needsInstall ? 'data-needs-install="true"' : ''} ${checked} ${disabledAttr} style="margin-right: 4px;" />
            ${compIcon}
            <div class="symlink-info">
              <span class="symlink-name" style="font-size: 13px; font-weight: 600; color: var(--text-default);">${compItem.name}${compItem.optional ? ' <span style="margin-left: 4px; font-size: 10px; font-weight: 500; padding: 1px 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); color: var(--text-tertiary); border: 1px solid var(--border-subtle); vertical-align: middle;">Optional</span>' : ''}</span>
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

    listContainer.innerHTML = `
      <div class="dash-toolkit-summary">
        <div class="dash-toolkit-summary-text">
          <strong>BAKit — Antigravity BA Toolkit</strong> · BA agents, template catalog, competitor app analysis over mobilerun MCP, and Figma design analysis over figma-mcp-android.
        </div>
      </div>
      <div class="dash-toolkit-items">
        ${bakitItemsHtml}
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
        activeToolkitMutations++;

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
          if (comp.kind === 'agentsmd') {
            if (isChecked) {
              const res = await window.api.applyAgentsMdBlock({
                worktreePath: activeWorktreePath,
                sourcePath: srcBase + '/' + comp.sourceFile
              });
              if (!res.success) throw new Error(res.error || 'Failed to update AGENTS.md');
              showToast(`Delegation rule written to ${res.agentsMdPath}. Start a new Antigravity conversation to load it.`, 'success');
            } else {
              const res = await window.api.removeAgentsMdBlock({ worktreePath: activeWorktreePath });
              if (!res.success) throw new Error(res.error || 'Failed to update AGENTS.md');
              showToast('Delegation rule removed from AGENTS.md.', 'success');
            }
            return;
          }

          if (comp.id === 'bakit_figma_mcp') {
            if (isChecked) {
              const res = await window.api.registerFigmaMcp({ worktreePath: activeWorktreePath });
              if (!res.success) throw new Error(res.error || 'Failed to register Figma MCP');
              if (res.skipped) {
                showToast(`figma-mcp-android is already registered globally in ${res.globalConfigPath}; this workspace uses it. No workspace plugin added.`, 'info');
              } else {
                showToast(`Registered figma-mcp-android in ${res.configPath}. Run the plugin in Figma Desktop and restart the Antigravity agent.`, 'success');
              }
            } else {
              const res = await window.api.unregisterFigmaMcp({ worktreePath: activeWorktreePath });
              if (!res.success) throw new Error(res.error || 'Failed to unregister Figma MCP');
              // The global entry is the user's (AndroidHarnessAGY may rely on it): point at it, never edit it.
              showToast(res.globalConfigPath
                ? `Workspace plugin removed. figma-mcp-android is still registered globally in ${res.globalConfigPath}; edit that file to stop it.`
                : `Removed figma-mcp-android from ${res.configPath}.`, res.globalConfigPath ? 'info' : 'success');
            }
            return;
          }

          if (comp.kind === 'mcp') {
            if (isChecked) {
              const res = await window.api.registerMobilerunMcp({ worktreePath: activeWorktreePath });
              if (!res.success) throw new Error(res.error || 'Failed to register mobilerun MCP');
              showToast(`Registered mobilerun in ${res.configPath}. Restart the Antigravity agent to load it.`, 'success');
              // An entry from an earlier BAKit in the global config would start mobilerun in every workspace.
              if (res.globalRegistered && window.confirm('mobilerun is also registered in Antigravity\'s global MCP config, so it starts in every workspace. Remove the global entry?')) {
                const g = await window.api.unregisterGlobalMobilerunMcp();
                if (!g.success) throw new Error(g.error || 'Failed to remove the global mobilerun entry');
                showToast(`Removed the global mobilerun entry from ${g.configPath}.`, 'success');
              }
            } else {
              const res = await window.api.unregisterMobilerunMcp({ worktreePath: activeWorktreePath });
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
                await safeDeploy(f.name, srcBase + '/' + rel, !!f.preserveExisting);
              }
            } else {
              const rel = comp.sourceFolder || comp.folderName;
              await safeDeploy(comp.folderName, srcBase + '/' + rel);
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
                await safeRemove(f.name, srcBase + '/' + rel);
              }
            } else {
              const rel = comp.sourceFolder || comp.folderName;
              await safeRemove(comp.folderName, srcBase + '/' + rel);
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
          activeToolkitMutations = Math.max(0, activeToolkitMutations - 1);
          if (activeToolkitMutations === 0) {
            await refreshAgentToolkitStatus({ force: true });
          }
        }
      });
    });

  } catch (err: any) {
    if (refreshSeq !== agentToolkitRefreshSeq) return;
    updateDashboardToolkitBadges(null);
    listContainer.innerHTML = `<div style="color:var(--danger-default); padding:16px;">Failed to load status: ${err.message}</div>`;
  }
}

if (dom.btnAgentToolkitApplyAll) {
  dom.btnAgentToolkitApplyAll.addEventListener('click', async (e: Event) => {
    e.stopPropagation();
    const listContainer = dom.agentToolkitListContainer;
    if (!listContainer) return;
    if (listContainer.querySelectorAll('.agent-toolkit-checkbox').length === 0) {
      await refreshAgentToolkitStatus({ force: true });
    }
    // Optional components (e.g. Mobilerun MCP) and items that need setup are opt-in and skipped when applying the harness.
    const unchecked = Array.from(listContainer.querySelectorAll('.agent-toolkit-checkbox:not(:checked):not(:disabled):not([data-needs-install]):not([data-optional="true"])')) as HTMLInputElement[];
    const targets = unchecked.length > 0
      ? unchecked
      : Array.from(listContainer.querySelectorAll('.agent-toolkit-checkbox:checked:not(:disabled):not([data-needs-install])')) as HTMLInputElement[];
    if (targets.length === 0) {
      showToast('All available toolkits are already active!', 'info');
      return;
    }
    showToast(unchecked.length > 0 ? `Activating ${targets.length} toolkits...` : `Syncing ${targets.length} active toolkits...`, 'info');
    for (const cb of targets) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    }
  });
}

if (dom.btnAgentToolkit) {
  dom.btnAgentToolkit.addEventListener('click', () => {
    const activeWorktreePath = getRequiredActiveWorktreePath();
    if (!activeWorktreePath) return;
    void toggleDashboardAgentToolkit();
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

if (dom.btnCloseProjectResourcesScreen) {
  dom.btnCloseProjectResourcesScreen.addEventListener('click', hideProjectResourcesScreen);
}

if (dom.btnSyncResourcesConfig) {
  dom.btnSyncResourcesConfig.addEventListener('click', async () => {
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






// ── Auto Refresh ───────────────────────────────────────
let autoRefreshIntervalId = null;

function startAutoRefreshLoop() {
  if (autoRefreshIntervalId) {
    clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
  }
  if (!state.settings?.autoRefreshCurrentProject) {
    return;
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
  loadWorkspaces,
});

startAutoRefreshLoop();
void checkMobilerunSetupOnLaunch().catch((err) => console.warn('Mobilerun setup check failed:', err));

// ── Global Keyboard Shortcuts ──────────────────────────
window.addEventListener('keydown', (e) => {
  // 1. Escape key closes open modals or screens
  if (e.key === 'Escape') {
    if (dom.modalOverlay && dom.modalOverlay.style.display !== 'none') {
      dom.modalCloseBtn?.click();
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
    if (deviceManagerScreen.isRemoteScreenVisible()) {
      void deviceManagerScreen.closeRemoteScreen(true);
      return;
    }
    if (dom.deviceManagerScreen && !dom.deviceManagerScreen.classList.contains('hidden')) {
      dom.btnCloseDeviceManagerScreen?.click();
      return;
    }
    if (dom.projectResourcesScreen && !dom.projectResourcesScreen.classList.contains('hidden')) {
      hideProjectResourcesScreen();
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
});

