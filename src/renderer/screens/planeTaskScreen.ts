import {
  fetchProjectStates,
  fetchProjectIssues,
  fetchProjectDetails,
  fetchWorkspaceProjects,
  fetchIssueLinks,
  DEFAULT_PLANE_CONFIG,
  resolvePlaneProjectId,
  filterPlaneProjects,
  cleanHTML,
  formatPriority,
  formatDate,
  generateTaskListMD,
  categorizeIssues,
  getIssueCategory,
  isOnTestingState,
  getIssueKey,
  getIssueWebUrl,
  extractDescriptionUrls,
  sanitizeDescriptionHTML,
  scrapeLightshotImageURL,
  scrapeStreamableMediaURLs,
  PlaneIssue,
  PlaneIssueLink,
  PlaneState,
  PlaneProject,
  PlaneConfig,
  EvidenceMedia,
} from '../services/planeService';

type ToastType = 'info' | 'success' | 'error' | 'warning';

type PlaneSettings = {
  planeApiKey?: string;
  planeBaseUrl?: string;
  planeWorkspaceSlug?: string;
  projectPlaneIds?: Record<string, string>;
  [key: string]: any;
};

export interface PlaneTaskScreenContext {
  dom: any;
  icons: Record<string, string>;
  getProjects: () => any[];
  getSettings: () => PlaneSettings;
  updateSettings: (settings: PlaneSettings) => Promise<void>;
  getActiveWorktreePath: () => string | null;
  showToast: (message: string, type?: ToastType) => void;
  showModal: () => void;
  hideModal: () => void;
  configureModalFooter: (actions: Array<{ id: string; label: string; kind?: string }>) => Record<string, HTMLElement | null>;
  openSettings: () => void;
  // Hide every other center screen before this one is shown.
  hideOtherScreens: () => void;
  onHidden: () => void;
}

interface PlaneTasksStore {
  rawIssues: PlaneIssue[];
  stateMap: Map<string, PlaneState>;
  projectInfo: PlaneProject | null;
  filterCategory: string;
  searchQuery: string;
  sortBy: string;
  loadedProjectId: string;
  projects: PlaneProject[];
  projectsKey: string;
}

const PRIORITY_RANK: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
const TABLE_COLUMNS = 7;

const EXTERNAL_LINK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

function esc(str: any) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function joinPath(base: string, ...segments: string[]) {
  const sep = base.includes('\\') || !base.includes('/') ? '\\' : '/';
  return [
    String(base).replace(/[\\/]+$/, ''),
    ...segments.map((segment) => String(segment).replace(/^[\\/]+|[\\/]+$/g, '').replace(/[\\/]+/g, sep)),
  ].join(sep);
}

function getStatusBadgeClass(issue: PlaneIssue) {
  const statusText = (issue.stateName || '').toLowerCase();
  const statusGroup = (issue.stateGroup || '').toLowerCase();
  if (isOnTestingState(statusText)) return 'badge-testing';
  if (statusGroup === 'completed' || statusText === 'done') return 'badge-success';
  if (statusGroup === 'started' || statusText === 'in progress') return 'badge-info';
  if (statusGroup === 'unstarted' || statusText === 'todo') return 'badge-warning';
  if (statusGroup === 'backlog') return 'badge-danger';
  return 'badge-neutral';
}

function linkHost(url: string) {
  try {
    return new URL(url).host;
  } catch (_) {
    return url;
  }
}

export function createPlaneTaskScreen(ctx: PlaneTaskScreenContext) {
  const { dom, icons } = ctx;
  const $ = (id: string) => document.getElementById(id);
  const el = {
    screen: $('plane-task-screen'),
    btnClose: $('btn-close-plane-task-screen'),
    btnRefresh: $('btn-refresh-plane-tasks'),
    btnExport: $('btn-export-plane-tasks'),
    activeWorktreeName: $('plane-active-worktree-name'),
    searchInput: $('plane-search-input') as HTMLInputElement | null,
    sortSelect: $('plane-sort-select') as HTMLSelectElement | null,
    tbody: $('plane-tasks-tbody'),
    tableLoading: $('plane-table-loading'),
    statusBadge: $('plane-status-badge'),
    projectSearch: $('plane-project-search') as HTMLInputElement | null,
    projectDropdown: $('plane-project-dropdown'),
  };

  const store: PlaneTasksStore = {
    rawIssues: [],
    stateMap: new Map(),
    projectInfo: null,
    loadedProjectId: '',
    projects: [],
    projectsKey: '',
    filterCategory: 'all',
    searchQuery: '',
    sortBy: 'priority-desc',
  };

  let projectActiveIndex = 0;
  let detailRequestId = 0;

  // Paths that share one Plane project: the active worktree, the repo root and every sibling worktree.
  function getCandidatePaths(wtPath: string | null): string[] {
    if (!wtPath) return [];
    const project = ctx.getProjects()?.find((p) => (p.worktrees || []).some((wt: any) => wt.path === wtPath));
    const worktreePaths = (project?.worktrees || []).filter((wt: any) => !wt.bare && wt.path).map((wt: any) => wt.path);
    return [...new Set([wtPath, project?.path, ...worktreePaths].filter(Boolean))] as string[];
  }

  function getConfig(): PlaneConfig {
    const settings = ctx.getSettings() || {};
    return {
      baseUrl: settings.planeBaseUrl || DEFAULT_PLANE_CONFIG.baseUrl,
      apiKey: settings.planeApiKey || DEFAULT_PLANE_CONFIG.apiKey,
      workspaceSlug: settings.planeWorkspaceSlug || DEFAULT_PLANE_CONFIG.workspaceSlug,
      projectId: resolvePlaneProjectId(settings.projectPlaneIds, getCandidatePaths(ctx.getActiveWorktreePath())),
    };
  }

  function defaultIdentifier() {
    return store.projectInfo?.identifier || '';
  }

  function setStatus(text: string, kind: 'success' | 'warning' | 'info' | 'danger') {
    if (!el.statusBadge) return;
    el.statusBadge.textContent = text;
    el.statusBadge.className = `plane-badge badge-${kind}`;
  }

  function renderTableMessage(html: string) {
    if (!el.tbody) return;
    el.tbody.innerHTML = `
      <tr>
        <td colspan="${TABLE_COLUMNS}" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
          <div>${html}</div>
        </td>
      </tr>
    `;
  }

  function resetTasks() {
    store.rawIssues = [];
    store.stateMap = new Map();
    store.projectInfo = null;
    store.loadedProjectId = '';
    updateCategoryCounts();
  }

  // API key first, then the project picked from the workspace list.
  function showSetupRequired(cfg: PlaneConfig) {
    if (!cfg.apiKey) {
      setStatus('API Key Required ⚠️', 'warning');
      renderTableMessage('Add your Plane API key in <a href="#" data-action="open-settings">Settings → Plane Integration</a> (create one in Plane → Profile settings → API tokens).');
      el.tbody?.querySelector('[data-action="open-settings"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        ctx.openSettings();
      });
    } else {
      setStatus('Project Required ⚠️', 'warning');
      renderTableMessage('Search for the Plane project of this repo in the <strong>"Plane Project"</strong> box above.');
    }
  }

  function projectLabel(p: PlaneProject) {
    return p.identifier ? `${p.identifier} — ${p.name}` : p.name;
  }

  // Shows the linked project in the search box while it isn't being typed into.
  function syncProjectSearch(placeholder: string, disabled: boolean) {
    const input = el.projectSearch;
    if (!input) return;
    const { projectId } = getConfig();
    const linked = store.projects.find((p) => p.id === projectId);
    input.placeholder = placeholder;
    input.disabled = disabled;
    input.value = linked ? projectLabel(linked) : projectId ? `${projectId} (saved)` : '';
  }

  function renderProjectDropdown() {
    const input = el.projectSearch;
    const dropdown = el.projectDropdown;
    if (!input || !dropdown) return;
    const { projectId } = getConfig();
    const matches = filterPlaneProjects(store.projects, input.value);
    projectActiveIndex = Math.min(projectActiveIndex, Math.max(matches.length - 1, 0));

    dropdown.innerHTML = matches.length
      ? matches.map((p, i) => `
          <button type="button" class="branch-dropdown-item plane-project-option${i === projectActiveIndex ? ' active' : ''}${p.id === projectId ? ' selected' : ''}" data-project-id="${esc(p.id)}">
            <span class="branch-dropdown-icon">${p.id === projectId ? '✓' : ''}</span>
            ${p.identifier ? `<span class="plane-project-option-ident">${esc(p.identifier)}</span>` : ''}
            <span class="plane-project-option-name">${esc(p.name)}</span>
          </button>
        `).join('')
      : `<div class="branch-dropdown-empty">${store.projects.length ? 'No matching projects' : 'No projects in this workspace'}</div>`;
    dropdown.classList.add('visible');

    dropdown.querySelectorAll<HTMLElement>('.plane-project-option').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectProject(item.dataset.projectId || '');
      });
    });
    dropdown.querySelector('.plane-project-option.active')?.scrollIntoView({ block: 'nearest' });
  }

  function hideProjectDropdown() {
    el.projectDropdown?.classList.remove('visible');
  }

  // One entry per repo root and worktree so every worktree of the repo resolves to the same project.
  async function saveActiveProjectId(projectId: string) {
    const paths = getCandidatePaths(ctx.getActiveWorktreePath());
    const settings = ctx.getSettings() || {};
    const nextProjectIds = { ...(settings.projectPlaneIds || {}) };
    for (const p of paths) {
      if (projectId) nextProjectIds[p] = projectId;
      else delete nextProjectIds[p];
    }
    await ctx.updateSettings({ ...settings, projectPlaneIds: nextProjectIds });
  }

  async function selectProject(projectId: string) {
    if (!ctx.getActiveWorktreePath()) {
      ctx.showToast('Please select an active project worktree first', 'error');
      return;
    }
    hideProjectDropdown();
    el.projectSearch?.blur();
    if (!projectId || projectId === getConfig().projectId) {
      syncProjectSearch('Search projects by name or identifier…', false);
      return;
    }
    await saveActiveProjectId(projectId);
    syncProjectSearch('Search projects by name or identifier…', false);
    resetTasks();
    const project = store.projects.find((p) => p.id === projectId);
    ctx.showToast(`Linked ${project?.name || 'Plane project'} to this repo. Fetching tasks...`, 'success');
    await fetchAndRenderTasks();
  }

  async function loadProjectOptions(force = false) {
    const cfg = getConfig();
    if (!cfg.apiKey) {
      syncProjectSearch('Set your Plane API key first…', true);
      return;
    }

    const key = `${cfg.baseUrl}|${cfg.workspaceSlug}|${cfg.apiKey}`;
    if (force || store.projectsKey !== key) {
      syncProjectSearch('Loading projects…', true);
      try {
        store.projects = await fetchWorkspaceProjects(cfg);
        store.projectsKey = key;
      } catch (err: any) {
        store.projects = [];
        store.projectsKey = '';
        syncProjectSearch('Failed to load projects', true);
        setStatus('Connection Failed 🔴', 'danger');
        ctx.showToast(`Failed to load Plane projects: ${err?.message || String(err)}`, 'error');
        return;
      }
    }

    syncProjectSearch('Search projects by name or identifier…', false);
  }

  async function fetchAndRenderTasks() {
    const cfg = getConfig();
    if (!cfg.apiKey || !cfg.projectId) {
      showSetupRequired(cfg);
      return false;
    }

    el.tableLoading?.classList.remove('hidden');
    setStatus('Fetching... ⏳', 'info');

    try {
      const [stateMap, issues, projectInfo] = await Promise.all([
        fetchProjectStates(cfg),
        fetchProjectIssues(cfg),
        fetchProjectDetails(cfg).catch(() => null),
      ]);

      store.stateMap = stateMap;
      store.rawIssues = issues;
      store.projectInfo = projectInfo;
      store.loadedProjectId = cfg.projectId;

      for (const issue of issues) {
        const s = stateMap.get(issue.state);
        if (s) {
          issue.stateName = s.name;
          issue.stateGroup = s.group;
        }
      }

      setStatus('Connected 🟢', 'success');
      updateCategoryCounts();
      renderTasksTable();
      return true;
    } catch (err: any) {
      console.error('Failed to fetch Plane tasks:', err);
      setStatus('Connection Failed 🔴', 'danger');
      ctx.showToast(`Failed to fetch Plane tasks: ${err?.message || String(err)}`, 'error');
      return false;
    } finally {
      el.tableLoading?.classList.add('hidden');
    }
  }

  function updateCategoryCounts() {
    const { backlog, todo, inProgress, onTesting, done, cancelled } = categorizeIssues(store.rawIssues, store.stateMap);
    const setVal = (id: string, count: number) => {
      const node = document.getElementById(id);
      if (node) node.textContent = String(count);
    };
    setVal('count-all', store.rawIssues.length);
    setVal('count-backlog', backlog.length);
    setVal('count-todo', todo.length);
    setVal('count-in-progress', inProgress.length);
    setVal('count-on-testing', onTesting.length);
    setVal('count-done', done.length);
    setVal('count-cancelled', cancelled.length);
  }

  function getFilteredAndSortedIssues(): PlaneIssue[] {
    let issues = [...store.rawIssues];

    if (store.filterCategory !== 'all') {
      issues = issues.filter((issue) => getIssueCategory(issue) === store.filterCategory);
    }

    const q = store.searchQuery.toLowerCase().trim();
    if (q) {
      issues = issues.filter((issue) => {
        const key = getIssueKey(issue, defaultIdentifier()).toLowerCase();
        return key.includes(q)
          || String(issue.sequence_id).includes(q)
          || (issue.name || '').toLowerCase().includes(q)
          || cleanHTML(issue.description_html).toLowerCase().includes(q);
      });
    }

    const rank = (issue: PlaneIssue) => PRIORITY_RANK[(issue.priority || 'none').toLowerCase()] || 0;
    issues.sort((a, b) => {
      switch (store.sortBy) {
        case 'priority-desc': return rank(b) - rank(a);
        case 'priority-asc': return rank(a) - rank(b);
        case 'id-asc': return a.sequence_id - b.sequence_id;
        case 'id-desc': return b.sequence_id - a.sequence_id;
        case 'title-asc': return a.name.localeCompare(b.name);
        case 'updated-desc': return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        default: return 0;
      }
    });

    return issues;
  }

  function renderTasksTable() {
    const tbody = el.tbody;
    if (!tbody) return;

    const filtered = getFilteredAndSortedIssues();
    if (filtered.length === 0) {
      renderTableMessage('No tasks found matching current filters.');
      return;
    }

    tbody.innerHTML = filtered.map((issue) => {
      const startDate = issue.start_date || '-';
      const updatedDate = issue.updated_at ? issue.updated_at.substring(0, 10) : '-';
      const desc = cleanHTML(issue.description_html);

      return `
        <tr class="plane-task-row" data-issue-id="${esc(issue.id)}" title="View task details">
          <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-secondary);">
            ${esc(getIssueKey(issue, defaultIdentifier()))}
          </td>
          <td>
            <div style="font-weight: 500; color: var(--text-default); line-height: 1.3;">${esc(issue.name)}</div>
            ${desc ? `<div style="font-size: 11px; color: var(--text-tertiary); max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${esc(desc)}</div>` : ''}
          </td>
          <td>
            <span class="plane-badge ${getStatusBadgeClass(issue)}">${esc(issue.stateName || 'Unknown')}</span>
          </td>
          <td>
            <span style="font-size: 12px;">${formatPriority(issue.priority)}</span>
          </td>
          <td style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">${esc(startDate)}</td>
          <td style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">${esc(updatedDate)}</td>
          <td>
            <button type="button" class="plane-task-link-btn" data-action="open-in-plane" title="Open in Plane" aria-label="Open in Plane">${EXTERNAL_LINK_SVG}</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function findIssue(issueId: string) {
    return store.rawIssues.find((issue) => issue.id === issueId);
  }

  function openExternal(url: string) {
    if (!/^https?:\/\//i.test(url)) return;
    window.api.openExternal(url);
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      ctx.showToast(message, 'info');
    } catch (_) {
      ctx.showToast('Could not copy to clipboard', 'error');
    }
  }

  // ── Task Detail ─────────────────────────────────────
  function renderLinkRows(links: Array<{ url: string; title?: string; source: string }>) {
    return links.map((link) => `
      <a class="plane-detail-link" href="${esc(link.url)}" title="${esc(link.url)}">
        <span class="plane-detail-link-icon">${icons.link || ''}</span>
        <span class="plane-detail-link-text">
          <span class="plane-detail-link-title">${esc(link.title || linkHost(link.url))}</span>
          <span class="plane-detail-link-url">${esc(link.url)}</span>
        </span>
        <span class="plane-detail-link-source">${esc(link.source)}</span>
      </a>
    `).join('');
  }

  function openTaskDetail(issue: PlaneIssue) {
    const requestId = ++detailRequestId;
    const cfg = getConfig();
    const key = getIssueKey(issue, defaultIdentifier());
    const webUrl = getIssueWebUrl(cfg, issue, defaultIdentifier());
    const descriptionHtml = sanitizeDescriptionHTML(issue.description_html, cfg.baseUrl);
    const descriptionLinks = extractDescriptionUrls(issue.description_html).map((url) => ({ url, source: 'Description' }));

    const meta = [
      ['Status', `<span class="plane-badge ${getStatusBadgeClass(issue)}">${esc(issue.stateName || 'Unknown')}</span>`],
      ['Priority', `<span style="font-family: var(--font-sans);">${formatPriority(issue.priority)}</span>`],
      ['Start Date', esc(formatDate(issue.start_date))],
      ['Due Date', esc(formatDate(issue.target_date))],
      ['Created', esc(issue.created_at ? issue.created_at.substring(0, 10) : '-')],
      ['Updated', esc(issue.updated_at ? issue.updated_at.substring(0, 10) : '-')],
    ];

    dom.modalTitle.innerHTML = `<span class="plane-detail-title"><span class="plane-detail-key">${esc(key)}</span><span>Task Details</span></span>`;
    dom.modalBody.innerHTML = `
      <div class="plane-detail" id="plane-detail-root" style="display: flex; flex-direction: column; gap: 18px;">
        <div class="plane-detail-name">${esc(issue.name)}</div>

        <div class="plane-detail-meta">
          ${meta.map(([label, value]) => `
            <div class="plane-detail-meta-item">
              <span class="plane-detail-meta-label">${label}</span>
              <span class="plane-detail-meta-value">${value}</span>
            </div>
          `).join('')}
        </div>

        <div class="plane-detail-section">
          <span class="plane-detail-section-title">Plane Link</span>
          <div class="plane-detail-weblink">
            <span class="plane-detail-link-icon">${EXTERNAL_LINK_SVG}</span>
            <a href="${esc(webUrl)}" title="${esc(webUrl)}">${esc(webUrl)}</a>
            <button type="button" class="plane-task-link-btn" data-action="copy-web-url" title="Copy link" aria-label="Copy link">${icons.copy || 'Copy'}</button>
          </div>
        </div>

        <div class="plane-detail-section">
          <span class="plane-detail-section-title">Links</span>
          <div class="plane-detail-links" id="plane-detail-links">
            ${renderLinkRows(descriptionLinks)}
            <div class="plane-detail-muted" id="plane-detail-links-status">Loading attached links…</div>
          </div>
        </div>

        <div class="plane-detail-section">
          <span class="plane-detail-section-title">Description</span>
          <div class="plane-detail-description">
            ${descriptionHtml || '<span class="plane-detail-muted">No description.</span>'}
          </div>
        </div>
      </div>
    `;

    const root = dom.modalBody.querySelector('#plane-detail-root') as HTMLElement | null;
    // Every link in the detail view (description included) opens in the system browser, never in-app.
    root?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-action="copy-web-url"]')) {
        e.preventDefault();
        void copyText(webUrl, `${key} link copied`);
        return;
      }
      const anchor = target.closest('a');
      if (anchor) {
        e.preventDefault();
        openExternal(anchor.getAttribute('href') || '');
      }
    });

    dom.modal?.classList.add('plane-task-modal');
    const footer = ctx.configureModalFooter([
      { id: 'plane-detail-btn-copy', label: `${icons.copy || ''} Copy Link`, kind: 'secondary' },
      { id: 'plane-detail-btn-open', label: `${EXTERNAL_LINK_SVG} Open in Plane`, kind: 'primary' },
    ]);
    footer['plane-detail-btn-copy']?.addEventListener('click', () => copyText(webUrl, `${key} link copied`));
    footer['plane-detail-btn-open']?.addEventListener('click', () => openExternal(webUrl));
    ctx.showModal();

    void fetchIssueLinks(cfg, issue.id)
      .then((attached) => renderDetailLinks(requestId, attached, descriptionLinks))
      .catch((err) => {
        console.warn('Failed to fetch Plane issue links:', err);
        renderDetailLinks(requestId, [], descriptionLinks, 'Could not load attached links from Plane.');
      });
  }

  function renderDetailLinks(
    requestId: number,
    attached: PlaneIssueLink[],
    descriptionLinks: Array<{ url: string; source: string }>,
    errorMessage = ''
  ) {
    // The modal may have been closed or reused for another task while links were loading.
    const container = document.getElementById('plane-detail-links');
    if (requestId !== detailRequestId || !container) return;

    const seen = new Set<string>();
    const links = [
      ...attached.map((l) => ({ url: l.url.trim(), title: l.title, source: 'Attached' })),
      ...descriptionLinks,
    ].filter((l) => !seen.has(l.url) && seen.add(l.url));

    const status = errorMessage || (links.length === 0 ? 'No links on this task.' : '');
    container.innerHTML = renderLinkRows(links)
      + (status ? `<div class="plane-detail-muted">${esc(status)}</div>` : '');
  }

  // ── Export ──────────────────────────────────────────
  // plane/ lives as a real folder in the project's main worktree and is symlinked into every other worktree.
  function getWorktreeLayout(wtPath: string) {
    const project = ctx.getProjects()?.find((p) => (p.worktrees || []).some((wt: any) => wt.path === wtPath));
    const worktrees = (project?.worktrees || []).filter((wt: any) => !wt.bare && wt.path);
    const mainPath = worktrees[0]?.path || wtPath;
    return {
      mainPath,
      planeRoot: joinPath(mainPath, 'plane'),
      linkedPaths: worktrees.map((wt: any) => wt.path).filter((p: string) => p !== mainPath),
    };
  }

  async function linkPlaneIntoWorktrees(planeRoot: string, worktreePaths: string[]) {
    const failures: { path: string; error: string }[] = [];
    for (const worktreePath of worktreePaths) {
      const res = await window.api.createSymlink({ worktreePath, name: 'plane', targetPath: planeRoot });
      if (!res?.success) failures.push({ path: worktreePath, error: res?.error || 'Unknown error' });
    }
    return failures;
  }

  const EXPORT_SECTIONS: Array<{ category: string; key: keyof ReturnType<typeof categorizeIssues>; badge: string; label: string; title: string; checked: boolean }> = [
    { category: 'backlog', key: 'backlog', badge: 'badge-danger', label: 'Backlog', title: 'Backlog Tasks', checked: true },
    { category: 'todo', key: 'todo', badge: 'badge-warning', label: 'Todo', title: 'Todo Tasks', checked: true },
    { category: 'in_progress', key: 'inProgress', badge: 'badge-info', label: 'In Progress', title: 'In Progress Tasks', checked: false },
    { category: 'on_testing', key: 'onTesting', badge: 'badge-testing', label: 'On Testing', title: 'On Testing Tasks', checked: false },
    { category: 'done', key: 'done', badge: 'badge-success', label: 'Done', title: 'Done Tasks', checked: false },
    { category: 'cancelled', key: 'cancelled', badge: 'badge-neutral', label: 'Cancelled', title: 'Cancelled Tasks', checked: false },
    { category: 'other', key: 'other', badge: 'badge-neutral', label: 'Other', title: 'Other / Draft Tasks', checked: false },
  ];

  function openExportModal() {
    const activeWorktreePath = ctx.getActiveWorktreePath();
    if (!activeWorktreePath) {
      ctx.showToast('No active project worktree selected!', 'error');
      return;
    }
    if (store.rawIssues.length === 0) {
      ctx.showToast('No tasks available to export. Fetch tasks first!', 'warning');
      return;
    }

    const categorized = categorizeIssues(store.rawIssues, store.stateMap);
    const sections = EXPORT_SECTIONS.filter((s) => s.category !== 'other' || categorized.other.length > 0);

    dom.modalTitle.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px;"><span style="color: var(--accent-light, #fff); display: inline-flex;">${icons.download}</span><span>Export Task List</span></span>`;
    dom.modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; letter-spacing: 0.04em; display: block; margin-bottom: 10px;">Select Sections to Include</span>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${sections.map((s) => `
              <label class="export-category-item">
                <div class="export-category-left">
                  <input type="checkbox" class="export-section-checkbox" data-category="${s.category}"${s.checked ? ' checked' : ''} />
                  <span class="plane-badge ${s.badge}">${s.label}</span>
                  <span class="export-category-title">${s.title}</span>
                </div>
                <span class="export-category-count">${categorized[s.key].length}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="export-summary-box">
          <div class="export-summary-target">
            <span class="export-summary-icon">${icons.folder}</span>
            <span class="export-summary-label">Target File:</span>
            <code class="export-summary-code">plane/TASK_LIST.md</code>
          </div>
          <div class="export-summary-count" id="export-task-count-text">0 tasks will be exported.</div>
        </div>
      </div>
    `;
    dom.modal?.classList.add('export-options-modal');
    ctx.showModal();

    const getSelectedIssues = () => {
      const checked = new Set<string>();
      dom.modalBody.querySelectorAll('.export-section-checkbox').forEach((cb: HTMLInputElement) => {
        if (cb.checked && cb.dataset.category) checked.add(cb.dataset.category);
      });
      const current = categorizeIssues(store.rawIssues, store.stateMap);
      const issues = EXPORT_SECTIONS.filter((s) => checked.has(s.category)).flatMap((s) => current[s.key]);
      return { checked, issues };
    };

    const updateSummary = () => {
      const { checked, issues } = getSelectedIssues();
      const countText = dom.modalBody.querySelector('#export-task-count-text');
      if (countText) countText.textContent = `${issues.length} tasks from ${checked.size} section(s) will be exported.`;
    };
    dom.modalBody.querySelectorAll('.export-section-checkbox').forEach((cb: Element) => cb.addEventListener('change', updateSummary));
    updateSummary();

    const footer = ctx.configureModalFooter([
      { id: 'export-btn-cancel', label: 'Cancel', kind: 'secondary' },
      { id: 'export-btn-submit', label: `${icons.download} Export`, kind: 'primary' },
    ]);
    footer['export-btn-cancel']?.addEventListener('click', () => ctx.hideModal());
    footer['export-btn-submit']?.addEventListener('click', () => {
      const { checked, issues } = getSelectedIssues();
      if (checked.size === 0) {
        ctx.showToast('Please select at least one section to export!', 'warning');
        return;
      }
      void runExport(activeWorktreePath, issues);
    });
  }

  async function runExport(activeWorktreePath: string, issuesToExport: PlaneIssue[]) {
    dom.modal?.classList.remove('export-options-modal');
    dom.modal?.classList.add('export-modal');
    dom.modalTitle.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px;"><span style="color: var(--accent-light, #fff); display: inline-flex;">${icons.download}</span><span>Exporting Tasks...</span></span>`;
    dom.modalBody.innerHTML = `
      <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
        Exporting <strong>${issuesToExport.length} tasks</strong> & downloading evidence media to <code>plane/TASK_LIST.md</code>...
      </div>
      <div class="export-progress-container">
        <div class="export-progress-status-row">
          <span id="export-status-label">Initializing Plane Export...</span>
          <span id="export-percent-label">0%</span>
        </div>
        <div class="export-progress-bar-track">
          <div id="export-progress-bar" class="export-progress-bar-fill" style="width: 0%;"></div>
        </div>
        <div id="export-log-terminal" class="export-log-terminal"></div>
      </div>
    `;

    const progressFooter = ctx.configureModalFooter([
      { id: 'export-btn-running', label: 'Exporting & Downloading...', kind: 'secondary' },
    ]);
    if (progressFooter['export-btn-running']) (progressFooter['export-btn-running'] as HTMLButtonElement).disabled = true;

    const statusLabel = dom.modalBody.querySelector('#export-status-label');
    const percentLabel = dom.modalBody.querySelector('#export-percent-label');
    const progressBar = dom.modalBody.querySelector('#export-progress-bar') as HTMLElement | null;
    const logTerminal = dom.modalBody.querySelector('#export-log-terminal') as HTMLElement | null;

    const appendLog = async (msg: string, level: 'info' | 'screenshot' | 'video' | 'cache' | 'success' | 'error' = 'info', percent?: number) => {
      if (percent !== undefined) {
        const pct = Math.min(100, Math.max(0, percent));
        if (percentLabel) percentLabel.textContent = `${Math.round(pct)}%`;
        if (progressBar) progressBar.style.width = `${pct}%`;
      }
      if (statusLabel) statusLabel.textContent = msg;
      if (logTerminal) {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        const entry = document.createElement('div');
        entry.className = `export-log-entry ${level}`;
        entry.innerHTML = `<span style="opacity: 0.5;">[${timeStr}]</span> ${esc(msg)}`;
        logTerminal.appendChild(entry);
        logTerminal.scrollTop = logTerminal.scrollHeight;
      }
      await new Promise((r) => setTimeout(r, 20));
    };

    const titleWith = (icon: string, color: string, text: string) =>
      `<span style="display: inline-flex; align-items: center; gap: 8px;"><span style="color: ${color}; display: inline-flex;">${icon}</span><span>${text}</span></span>`;

    try {
      const { mainPath, planeRoot, linkedPaths } = getWorktreeLayout(activeWorktreePath);
      await appendLog(`[INIT] Initializing plane/ export directory in main worktree: ${mainPath}`, 'info', 5);

      await appendLog('[METADATA] Saving plane/raw/ metadata backups...', 'info', 10);
      await window.api.writeProjectFile({ worktreePath: mainPath, filename: 'plane/raw/issues.json', content: JSON.stringify(store.rawIssues, null, 2) });
      await window.api.writeProjectFile({ worktreePath: mainPath, filename: 'plane/raw/states.json', content: JSON.stringify(Array.from(store.stateMap.values()), null, 2) });

      await appendLog('[SCAN] Parsing and downloading evidence media (Lightshot screenshots & Streamable MP4 videos)...', 'info', 15);

      const mediaMap = new Map<number, EvidenceMedia[]>();
      let screenshotCount = 0;
      let videoCount = 0;

      for (let i = 0; i < issuesToExport.length; i++) {
        const task = issuesToExport[i];
        const desc = task.description_html || '';
        const key = getIssueKey(task, defaultIdentifier());
        const taskID = key.startsWith('#') ? `TASK-${task.sequence_id}` : key;
        const taskMediaList: EvidenceMedia[] = [];

        for (const webUrl of desc.match(/https?:\/\/prnt\.sc\/([a-zA-Z0-9_-]+)/g) || []) {
          const mediaId = webUrl.split('/').pop()!;
          if (taskMediaList.some((m) => m.mediaId === mediaId)) continue;

          await appendLog(`[FETCH] Lightshot screenshot for ${taskID}: ${mediaId}...`, 'screenshot');
          const imgUrl = await scrapeLightshotImageURL(webUrl);
          if (!imgUrl) continue;
          const dlRes = await window.api.downloadFile({ url: imgUrl, targetFilePath: joinPath(planeRoot, 'evidence', taskID, `${mediaId}.png`) });
          if (dlRes?.success) {
            await appendLog(dlRes.cached ? `[CACHE] Cached screenshot: ${mediaId}.png` : `[DOWNLOAD] Downloaded screenshot: ${mediaId}.png`, dlRes.cached ? 'cache' : 'success');
            taskMediaList.push({ type: 'image', webUrl, mediaId, localPath: `./evidence/${taskID}/${mediaId}.png` });
            screenshotCount++;
          }
        }

        for (const webUrl of desc.match(/https?:\/\/streamable\.com\/([a-zA-Z0-9_-]+)/g) || []) {
          const mediaId = webUrl.split('/').pop()!;
          if (taskMediaList.some((m) => m.mediaId === mediaId)) continue;

          await appendLog(`[FETCH] Streamable full MP4 video for ${taskID}: ${mediaId}...`, 'video');
          const { videoUrl, posterUrl } = await scrapeStreamableMediaURLs(mediaId, webUrl);
          if (posterUrl) {
            await window.api.downloadFile({ url: posterUrl, targetFilePath: joinPath(planeRoot, 'evidence', taskID, `${mediaId}_poster.jpg`) });
          }
          if (!videoUrl) continue;
          const dlRes = await window.api.downloadFile({ url: videoUrl, targetFilePath: joinPath(planeRoot, 'evidence', taskID, `${mediaId}.mp4`) });
          if (dlRes?.success) {
            await appendLog(dlRes.cached ? `[CACHE] Cached full video: ${mediaId}.mp4` : `[DOWNLOAD] Downloaded full MP4 video: ${mediaId}.mp4`, dlRes.cached ? 'cache' : 'success');
            taskMediaList.push({
              type: 'video',
              webUrl,
              mediaId,
              localPath: `./evidence/${taskID}/${mediaId}.mp4`,
              posterPath: `./evidence/${taskID}/${mediaId}_poster.jpg`,
            });
            videoCount++;
          }
        }

        if (taskMediaList.length > 0) mediaMap.set(task.sequence_id, taskMediaList);

        if ((i + 1) % 2 === 0 || i === issuesToExport.length - 1) {
          await appendLog(`Processed evidence for ${i + 1}/${issuesToExport.length} tasks...`, 'info', 15 + Math.round(((i + 1) / issuesToExport.length) * 70));
        }
      }

      await appendLog(`[SUMMARY] Downloaded ${screenshotCount} screenshot(s), ${videoCount} full MP4 video(s).`, 'info', 88);
      await appendLog('[MARKDOWN] Generating Markdown task checklist with Plane links...', 'info', 92);
      const mdContent = generateTaskListMD(getConfig(), issuesToExport, store.stateMap, mediaMap, store.projectInfo);

      await appendLog('[SAVE] Writing plane/TASK_LIST.md...', 'info', 96);
      const writeRes = await window.api.writeProjectFile({ worktreePath: mainPath, filename: 'plane/TASK_LIST.md', content: mdContent });
      if (!writeRes?.success) throw new Error(writeRes?.error || 'Failed to write plane/TASK_LIST.md');

      if (linkedPaths.length > 0) {
        await appendLog(`[SYMLINK] Symlinking plane/ into ${linkedPaths.length} other worktree(s)...`, 'info', 98);
        for (const f of await linkPlaneIntoWorktrees(planeRoot, linkedPaths)) {
          await appendLog(`[WARN] Could not link plane/ in ${f.path}: ${f.error}`, 'error');
        }
      }

      await appendLog('[COMPLETE] All tasks & offline media references written to plane/TASK_LIST.md', 'success', 100);
      dom.modalTitle.innerHTML = titleWith(icons.download, 'var(--accent-light, #fff)', 'Export Complete');
      const doneFooter = ctx.configureModalFooter([
        { id: 'export-btn-open-dir', label: `${icons.folder} Open Folder`, kind: 'secondary' },
        { id: 'export-btn-done', label: 'Done', kind: 'primary' },
      ]);
      doneFooter['export-btn-open-dir']?.addEventListener('click', () => window.api.openInExplorer(planeRoot));
      doneFooter['export-btn-done']?.addEventListener('click', () => ctx.hideModal());
    } catch (err: any) {
      await appendLog(`[ERROR] Export Error: ${err?.message || String(err)}`, 'error', 100);
      dom.modalTitle.innerHTML = titleWith(icons.close, 'var(--danger-default, #f87171)', 'Export Failed');
      const errFooter = ctx.configureModalFooter([{ id: 'export-btn-close', label: 'Close', kind: 'secondary' }]);
      errFooter['export-btn-close']?.addEventListener('click', () => ctx.hideModal());
    }
  }

  // ── Show / Hide ─────────────────────────────────────
  function isVisible() {
    return !!el.screen && !el.screen.classList.contains('hidden');
  }

  async function show() {
    const activeWorktreePath = ctx.getActiveWorktreePath();
    const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : '';
    if (el.activeWorktreeName) el.activeWorktreeName.textContent = activeWorktreeName || 'No active project';

    ctx.hideOtherScreens();
    el.screen?.classList.remove('hidden');
    dom.btnPlaneTasks?.classList.add('active');

    await loadProjectOptions();

    const cfg = getConfig();
    if (!cfg.apiKey || !cfg.projectId) {
      resetTasks();
      showSetupRequired(cfg);
      return;
    }

    if (store.loadedProjectId !== cfg.projectId || store.rawIssues.length === 0) {
      await fetchAndRenderTasks();
    } else {
      renderTasksTable();
    }
  }

  function hide() {
    el.screen?.classList.add('hidden');
    dom.btnPlaneTasks?.classList.remove('active');
    hideProjectDropdown();
    ctx.onHidden();
  }

  // Hides without the onHidden side effects, for when another screen takes over.
  function conceal() {
    el.screen?.classList.add('hidden');
    dom.btnPlaneTasks?.classList.remove('active');
    hideProjectDropdown();
  }

  // ── Event Bindings ──────────────────────────────────
  dom.btnPlaneTasks?.addEventListener('click', () => {
    if (isVisible()) hide();
    else void show();
  });
  el.btnClose?.addEventListener('click', hide);

  if (el.projectSearch) {
    const input = el.projectSearch;
    // Focus clears the box to show the full list; blur puts the linked project's label back.
    input.addEventListener('focus', () => {
      input.value = '';
      projectActiveIndex = 0;
      renderProjectDropdown();
    });
    input.addEventListener('input', () => {
      projectActiveIndex = 0;
      renderProjectDropdown();
    });
    input.addEventListener('blur', () => {
      hideProjectDropdown();
      syncProjectSearch(input.placeholder, input.disabled);
    });
    input.addEventListener('keydown', (e) => {
      const items = el.projectDropdown?.querySelectorAll<HTMLElement>('.plane-project-option') || [];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        projectActiveIndex = (projectActiveIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        renderProjectDropdown();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[projectActiveIndex];
        if (item) void selectProject(item.dataset.projectId || '');
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        input.blur();
      }
    });
  }

  el.btnRefresh?.addEventListener('click', async () => {
    const cfg = getConfig();
    if (cfg.apiKey) await loadProjectOptions(true);
    if (await fetchAndRenderTasks()) ctx.showToast('Plane tasks updated!', 'success');
  });

  el.btnExport?.addEventListener('click', openExportModal);

  document.querySelectorAll<HTMLElement>('.plane-filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.plane-filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      store.filterCategory = pill.dataset.category || 'all';
      renderTasksTable();
    });
  });

  el.searchInput?.addEventListener('input', () => {
    store.searchQuery = el.searchInput?.value || '';
    renderTasksTable();
  });

  el.sortSelect?.addEventListener('change', () => {
    store.sortBy = el.sortSelect?.value || 'priority-desc';
    renderTasksTable();
  });

  // Row click opens the detail view; the row's link button jumps straight to Plane.
  el.tbody?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>('tr.plane-task-row');
    const issue = row ? findIssue(row.dataset.issueId || '') : undefined;
    if (!issue) return;
    if (target.closest('[data-action="open-in-plane"]')) {
      e.stopPropagation();
      openExternal(getIssueWebUrl(getConfig(), issue, defaultIdentifier()));
      return;
    }
    openTaskDetail(issue);
  });

  return { show, hide, conceal, isVisible };
}
