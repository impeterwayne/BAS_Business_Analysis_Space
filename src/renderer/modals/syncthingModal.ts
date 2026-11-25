function escHtml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSyncStateLabel(status: SyncthingProjectStatus | null): string {
  if (!status) return 'Not Configured';
  switch (status.state) {
    case 'synced':
      return 'Synced';
    case 'syncing':
      return `Syncing ${status.completion}%`;
    case 'paused':
      return 'Paused';
    case 'conflict':
      return `Conflict (${status.conflicts.length})`;
    case 'outside-root':
      return 'Outside Sync Root';
    case 'offline':
      return 'Offline';
    default:
      return 'Not Configured';
  }
}

export function openSyncthingModal({
  project,
  syncthingState,
  dom,
  configureModalFooter,
  showModal,
  hideModal,
  showToast,
  onStateChanged,
  onOpenSettings,
}: {
  project: any;
  syncthingState: SyncthingState | null;
  dom: any;
  configureModalFooter: (actions: Array<{ id: string; label: string; kind?: 'primary' | 'secondary'; danger?: boolean }>) => Record<string, HTMLElement>;
  showModal: () => void;
  hideModal: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  onStateChanged: (nextState: SyncthingState | undefined) => void;
  onOpenSettings: () => void;
}) {
  if (!project) return;
  dom.modal.classList.add('syncthing-modal');
  dom.modalTitle.textContent = `Project Sync — ${project.name || 'Project'}`;

  let currentSyncState = syncthingState;

  const renderBody = () => {
    const projStatus = currentSyncState?.projects?.[project.path] || null;
    const syncMode = currentSyncState?.syncMode || 'all';
    const conflicts = projStatus?.conflicts || [];
    const isConnected = Boolean(currentSyncState?.running);
    const inSyncRoot = Boolean(projStatus?.inSyncRoot);
    const rootPath = currentSyncState?.rootPath || '';

    const stateLabel = getSyncStateLabel(projStatus);
    const stateClass = projStatus?.state || 'unconfigured';

    dom.modalBody.innerHTML = `
      <div class="syncthing-modal-summary">
        <div class="syncthing-modal-status-row">
          <span class="dash-sync-pill is-${escHtml(stateClass)}">
            <span class="dash-sync-dot"></span>
            <span>${escHtml(stateLabel)}</span>
          </span>
          <span class="syncthing-modal-daemon-tag">
            ${isConnected ? 'Syncthing Online' : (currentSyncState?.installed ? 'Syncthing Offline' : 'Syncthing Not Found')}
          </span>
        </div>
        <div class="syncthing-modal-meta">
          <div><strong>Project Path:</strong> <span class="mono-text">${escHtml(project.path)}</span></div>
          <div><strong>Sync Root:</strong> <span class="mono-text">${rootPath ? escHtml(rootPath) : 'Not configured'}</span></div>
          ${projStatus?.folderName ? `<div><strong>Folder in Root:</strong> <span class="mono-text">${escHtml(projStatus.folderName)}/ (docs, .bas)</span></div>` : ''}
        </div>
        ${!rootPath ? `
          <div class="syncthing-modal-notice">
            Configure a Projects Parent Folder in Settings → Project Sync to enable syncing for <code>docs/</code> and <code>.bas/</code>.
          </div>
        ` : (!inSyncRoot ? `
          <div class="syncthing-modal-notice">
            This project is outside your configured Sync Root folder. Move it directly under <span class="mono-text">${escHtml(rootPath)}</span> to sync it.
          </div>
        ` : '')}
      </div>

      ${inSyncRoot ? `
        <div class="syncthing-modal-toggle-row">
          <div>
            <div class="syncthing-modal-toggle-title">Sync docs &amp; competitor config</div>
            <div class="syncthing-modal-toggle-sub">
              ${syncMode === 'all'
                ? 'Sync Scope is set to "All Projects" in Settings.'
                : 'Allowlist mode: syncs docs/ and .bas/project-sync.json for this project.'}
            </div>
          </div>
          <label class="switch-toggle">
            <input type="checkbox" id="syncthing-modal-project-toggle" ${projStatus?.enabled ? 'checked' : ''} ${syncMode === 'all' ? 'disabled' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>
      ` : ''}

      <div class="syncthing-modal-actions-row">
        <button type="button" class="btn-secondary btn-small" id="btn-syncthing-modal-rescan" ${!isConnected || !inSyncRoot ? 'disabled' : ''}>
          Rescan Now
        </button>
        ${!isConnected ? `
          <button type="button" class="btn-secondary btn-small" id="btn-syncthing-modal-start">
            Start Syncthing
          </button>
        ` : `
          <button type="button" class="btn-secondary btn-small" id="btn-syncthing-modal-webui">
            Open Web UI
          </button>
        `}
        <button type="button" class="btn-secondary btn-small" id="btn-syncthing-modal-settings">
          Sync Settings
        </button>
      </div>

      <div class="syncthing-modal-conflicts">
        <div class="syncthing-modal-section-title">
          Sync Conflicts (${conflicts.length})
        </div>
        ${conflicts.length === 0 ? `
          <div class="syncthing-modal-no-conflicts">No sync conflict files detected in <code>docs/</code> or <code>.bas/</code>.</div>
        ` : `
          <div class="syncthing-conflict-list">
            ${conflicts.map((c, idx) => `
              <div class="syncthing-conflict-item" data-idx="${idx}">
                <div class="syncthing-conflict-info">
                  <div class="syncthing-conflict-path">${escHtml(c.relativePath)}</div>
                  <div class="syncthing-conflict-sub">
                    Original: <span class="mono-text">${escHtml(c.originalRelativePath)}</span>
                    ${c.timestamp ? ` • ${escHtml(c.timestamp)}` : ''}
                  </div>
                </div>
                <div class="syncthing-conflict-actions">
                  <button type="button" class="btn-secondary btn-small" data-action="keep-mine" data-path="${escHtml(c.relativePath)}">Keep Mine</button>
                  <button type="button" class="btn-primary btn-small" data-action="use-remote" data-path="${escHtml(c.relativePath)}">Use Remote</button>
                  <button type="button" class="btn-secondary btn-small" data-action="reveal" data-path="${escHtml(c.relativePath)}">Reveal</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    const toggleEl = dom.modalBody.querySelector('#syncthing-modal-project-toggle') as HTMLInputElement | null;
    if (toggleEl) {
      toggleEl.addEventListener('change', async () => {
        const desired = toggleEl.checked;
        toggleEl.disabled = true;
        const res = await window.api.syncthingToggleProject({ projectPath: project.path, enabled: desired });
        if (res.state) {
          currentSyncState = res.state;
          onStateChanged(res.state);
        }
        if (res.success) {
          showToast(desired ? `Enabled sync for ${project.name}` : `Paused sync for ${project.name}`, 'success');
        } else {
          showToast(res.error || 'Failed to update project sync', 'error');
        }
        renderBody();
      });
    }

    const rescanBtn = dom.modalBody.querySelector('#btn-syncthing-modal-rescan') as HTMLButtonElement | null;
    if (rescanBtn) {
      rescanBtn.addEventListener('click', async () => {
        rescanBtn.disabled = true;
        const res = await window.api.syncthingRescan({ projectPath: project.path });
        if (res.state) {
          currentSyncState = res.state;
          onStateChanged(res.state);
        }
        if (res.success) {
          showToast('Triggered Syncthing rescan', 'info');
        } else {
          showToast(res.error || 'Failed to rescan', 'error');
        }
        renderBody();
      });
    }

    const startBtn = dom.modalBody.querySelector('#btn-syncthing-modal-start') as HTMLButtonElement | null;
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
        const res = await window.api.syncthingStartDaemon();
        if (res.state) {
          currentSyncState = res.state;
          onStateChanged(res.state);
        }
        if (res.success) {
          showToast('Syncthing started', 'success');
        } else {
          showToast(res.error || 'Failed to start Syncthing', 'error');
        }
        renderBody();
      });
    }

    const webUiBtn = dom.modalBody.querySelector('#btn-syncthing-modal-webui') as HTMLButtonElement | null;
    if (webUiBtn) {
      webUiBtn.addEventListener('click', async () => {
        const res = await window.api.syncthingOpenWebUi();
        if (!res?.success) {
          showToast(res?.error || 'Could not open Syncthing Web UI', 'error');
        }
      });
    }

    const settingsBtn = dom.modalBody.querySelector('#btn-syncthing-modal-settings') as HTMLButtonElement | null;
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        hideModal();
        onOpenSettings();
      });
    }

    dom.modalBody.querySelectorAll('.syncthing-conflict-actions button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = (btn as HTMLElement).dataset.action as 'keep-mine' | 'use-remote' | 'reveal';
        const conflictPath = (btn as HTMLElement).dataset.path || '';
        if (!action || !conflictPath) return;
        (btn as HTMLButtonElement).disabled = true;
        const res = await window.api.syncthingResolveConflict({
          projectPath: project.path,
          conflictRelativePath: conflictPath,
          resolution: action,
        });
        if (res.state) {
          currentSyncState = res.state;
          onStateChanged(res.state);
        }
        if (res.success) {
          if (action !== 'reveal') {
            showToast(action === 'use-remote' ? 'Applied remote file version' : 'Kept local file and removed conflict', 'success');
          }
        } else {
          showToast(res.error || 'Failed to resolve conflict', 'error');
        }
        renderBody();
      });
    });
  };

  const footer = configureModalFooter([
    { id: 'syncthing-modal-close', label: 'Close', kind: 'primary' },
  ]);
  footer['syncthing-modal-close']?.addEventListener('click', hideModal);

  renderBody();
  showModal();
}
