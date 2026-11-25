const { formatReleaseNotesHtml, formatBytes } = require('../../domain');

function escHtml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatReleaseDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusPillMeta(status: AppUpdateStatus): { label: string; cls: string } {
  switch (status) {
    case 'checking':
      return { label: 'Checking...', cls: 'is-checking' };
    case 'available':
      return { label: 'Update Available', cls: 'is-available' };
    case 'downloading':
      return { label: 'Downloading', cls: 'is-downloading' };
    case 'downloaded':
      return { label: 'Ready to Install', cls: 'is-downloaded' };
    case 'up-to-date':
      return { label: 'Up to Date', cls: 'is-uptodate' };
    case 'error':
      return { label: 'Error', cls: 'is-error' };
    default:
      return { label: 'Idle', cls: '' };
  }
}

function getInstallButtonLabel(assetName: string, platform: string): string {
  if (platform === 'win32' && /setup/i.test(assetName) && /\.exe$/i.test(assetName)) {
    return 'Install & Quit';
  }
  if (platform === 'darwin') {
    return 'Open Installer';
  }
  if (platform === 'linux' && /\.appimage$/i.test(assetName)) {
    return 'Run New AppImage';
  }
  return 'Reveal File';
}

function formatProgressCaption(progress: AppUpdateProgress | null): string {
  if (!progress) return 'Starting download...';
  const downloaded = formatBytes(progress.downloadedBytes || 0);
  const total = progress.totalBytes > 0 ? formatBytes(progress.totalBytes) : '?';
  const speed = progress.bytesPerSecond > 0 ? ` • ${formatBytes(progress.bytesPerSecond)}/s` : '';
  const pct = progress.totalBytes > 0 ? `${progress.percent}%` : '';
  return [pct, `${downloaded} / ${total}`].filter(Boolean).join(' — ') + speed;
}

export function openUpdateModal({
  updateState,
  dom,
  configureModalFooter,
  showModal,
  hideModal,
  showToast,
  platform,
}: {
  updateState: AppUpdateState;
  dom: any;
  configureModalFooter: (actions: Array<{ id: string; label: string; kind?: 'primary' | 'secondary'; danger?: boolean }>) => Record<string, HTMLElement>;
  showModal: () => void;
  hideModal: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  platform: string;
}): { update: (nextState: AppUpdateState) => void } {
  dom.modal.classList.add('update-modal');
  dom.modalTitle.textContent = 'App Update';

  let currentState: AppUpdateState = updateState;
  let selectedAssetName =
    updateState.selectedAssetName
    || updateState.release?.recommendedAsset?.name
    || updateState.release?.assets[0]?.name
    || '';
  let lastRenderedStatus: AppUpdateStatus | null = null;
  let lastRenderedTag = '';

  const renderProgressInPlace = (nextState: AppUpdateState): boolean => {
    const fillEl = dom.modalBody.querySelector('#update-modal-progress-fill') as HTMLElement | null;
    const textEl = dom.modalBody.querySelector('#update-modal-progress-text') as HTMLElement | null;
    if (!fillEl || !textEl) return false;
    const pct = nextState.downloadProgress?.percent ?? 0;
    fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    textEl.textContent = formatProgressCaption(nextState.downloadProgress);
    return true;
  };

  const renderFooter = (state: AppUpdateState) => {
    const actions: Array<{ id: string; label: string; kind?: 'primary' | 'secondary' }> = [
      { id: 'update-modal-github', label: 'View on GitHub', kind: 'secondary' },
    ];

    if (state.status === 'downloading') {
      actions.push({ id: 'update-modal-cancel-dl', label: 'Cancel', kind: 'secondary' });
      actions.push({ id: 'update-modal-downloading', label: 'Downloading...', kind: 'primary' });
    } else if (state.status === 'downloaded' && state.downloadedFilePath) {
      actions.push({ id: 'update-modal-reveal', label: 'Show in Folder', kind: 'secondary' });
      const fileName = state.downloadedFilePath.split(/[\\/]/).pop() || selectedAssetName;
      actions.push({
        id: 'update-modal-install',
        label: getInstallButtonLabel(fileName, platform),
        kind: 'primary',
      });
    } else if (state.release?.updateAvailable) {
      actions.push({ id: 'update-modal-close', label: 'Close', kind: 'secondary' });
      actions.push({ id: 'update-modal-download', label: 'Download Update', kind: 'primary' });
    } else {
      actions.push({ id: 'update-modal-close', label: 'Close', kind: 'secondary' });
      actions.push({
        id: 'update-modal-check',
        label: state.status === 'checking' ? 'Checking...' : 'Check Again',
        kind: 'primary',
      });
    }

    const footerBtns = configureModalFooter(actions);

    footerBtns['update-modal-github']?.addEventListener('click', () => {
      void window.api.openReleasePage();
    });

    footerBtns['update-modal-close']?.addEventListener('click', hideModal);

    if (footerBtns['update-modal-downloading']) {
      (footerBtns['update-modal-downloading'] as HTMLButtonElement).disabled = true;
    }

    footerBtns['update-modal-cancel-dl']?.addEventListener('click', async () => {
      (footerBtns['update-modal-cancel-dl'] as HTMLButtonElement).disabled = true;
      await window.api.cancelUpdateDownload();
      showToast('Update download canceled', 'info');
    });

    footerBtns['update-modal-download']?.addEventListener('click', async () => {
      const btn = footerBtns['update-modal-download'] as HTMLButtonElement;
      btn.disabled = true;
      const res = await window.api.downloadUpdate({ assetName: selectedAssetName || undefined });
      if (!res.success && res.error && res.error !== 'Download canceled') {
        showToast(res.error, 'error');
      }
    });

    footerBtns['update-modal-reveal']?.addEventListener('click', async () => {
      const res = await window.api.revealUpdateFile();
      if (!res.success) {
        showToast(res.error || 'Could not reveal downloaded file', 'error');
      }
    });

    footerBtns['update-modal-install']?.addEventListener('click', async () => {
      const btn = footerBtns['update-modal-install'] as HTMLButtonElement;
      btn.disabled = true;
      const res = await window.api.installUpdate();
      if (!res.success) {
        btn.disabled = false;
        showToast(res.error || 'Failed to launch installer', 'error');
        return;
      }
      if (res.action === 'launched-and-quitting') {
        showToast('Launching installer and closing BA Space...', 'success');
      } else if (res.action === 'opened') {
        showToast('Opened update package', 'success');
      } else {
        showToast('Opened update file location', 'info');
      }
    });

    footerBtns['update-modal-check']?.addEventListener('click', async () => {
      const btn = footerBtns['update-modal-check'] as HTMLButtonElement;
      btn.disabled = true;
      await window.api.checkForUpdates();
    });
    if (state.status === 'checking' && footerBtns['update-modal-check']) {
      (footerBtns['update-modal-check'] as HTMLButtonElement).disabled = true;
    }
    if (!state.release?.assets?.length && footerBtns['update-modal-download']) {
      (footerBtns['update-modal-download'] as HTMLButtonElement).disabled = true;
    }
  };

  const render = (nextState: AppUpdateState) => {
    currentState = nextState;
    const release = nextState.release;
    const releaseTag = release?.tagName || '';

    if (
      lastRenderedStatus === 'downloading'
      && nextState.status === 'downloading'
      && lastRenderedTag === releaseTag
      && renderProgressInPlace(nextState)
    ) {
      return;
    }

    lastRenderedStatus = nextState.status;
    lastRenderedTag = releaseTag;

    if (release?.assets?.length) {
      const stillValid = release.assets.some((a) => a.name === selectedAssetName);
      if (!stillValid) {
        selectedAssetName =
          nextState.selectedAssetName
          || release.recommendedAsset?.name
          || release.assets[0]?.name
          || '';
      }
    } else {
      selectedAssetName = '';
    }

    const pillMeta = getStatusPillMeta(nextState.status);
    const publishedDate = release?.publishedAt ? formatReleaseDate(release.publishedAt) : '';
    const notesHtml = release
      ? formatReleaseNotesHtml(release.body, escHtml)
      : '<p class="update-notes-empty">No GitHub release metadata loaded yet.</p>';
    const downloadedFileName = nextState.downloadedFilePath
      ? nextState.downloadedFilePath.split(/[\\/]/).pop() || ''
      : '';
    const pct = nextState.downloadProgress?.percent ?? 0;

    dom.modalBody.innerHTML = `
      <div class="update-modal-banner">
        <div class="update-modal-banner-top">
          <div class="update-version-compare">
            <span class="update-version-chip">v${escHtml(nextState.currentVersion)}</span>
            ${release ? `
              <span class="update-version-arrow">→</span>
              <span class="update-version-chip ${release.updateAvailable ? 'is-latest' : ''}">v${escHtml(release.version)}</span>
            ` : ''}
          </div>
          <span class="update-status-pill ${escHtml(pillMeta.cls)}">${escHtml(pillMeta.label)}</span>
        </div>
        ${release ? `
          <div class="update-release-meta">
            <strong>${escHtml(release.name || release.tagName)}</strong>
            ${publishedDate ? `<span>• Released ${escHtml(publishedDate)}</span>` : ''}
          </div>
        ` : `
          <div class="update-release-meta">
            <span>GitHub repository: ${escHtml(nextState.repoOwner)}/${escHtml(nextState.repoRepo)}</span>
          </div>
        `}
      </div>

      ${nextState.status === 'error' && nextState.error ? `
        <div class="update-error-box">${escHtml(nextState.error)}</div>
      ` : ''}

      ${nextState.status === 'downloading' ? `
        <div class="update-progress-section">
          <div class="update-progress-track">
            <div class="update-progress-fill" id="update-modal-progress-fill" style="width: ${Math.max(0, Math.min(100, pct))}%"></div>
          </div>
          <div class="update-progress-caption" id="update-modal-progress-text">${escHtml(formatProgressCaption(nextState.downloadProgress))}</div>
        </div>
      ` : ''}

      ${nextState.status === 'downloaded' && nextState.downloadedFilePath ? `
        <div class="update-ready-box">
          <strong>Update downloaded and ready:</strong>
          <span class="mono-text">${escHtml(downloadedFileName)}</span>
        </div>
      ` : ''}

      ${release?.assets?.length ? `
        <div class="update-asset-row">
          <label class="form-label" for="update-asset-select">Installer package</label>
          <select id="update-asset-select" class="form-select" ${nextState.status === 'downloading' ? 'disabled' : ''}>
            ${release.assets.map((asset) => {
              const isRec = release.recommendedAsset?.name === asset.name;
              const isSel = selectedAssetName === asset.name;
              const sizeStr = asset.size > 0 ? ` (${formatBytes(asset.size)})` : '';
              const recStr = isRec ? ' — Recommended' : '';
              return `<option value="${escHtml(asset.name)}" ${isSel ? 'selected' : ''}>${escHtml(asset.name)}${escHtml(sizeStr)}${escHtml(recStr)}</option>`;
            }).join('')}
          </select>
        </div>
      ` : (release ? `
        <div class="update-notes-empty" style="margin-bottom:12px;">No installer packages attached to this release. Click <strong>View on GitHub</strong> to download manually.</div>
      ` : '')}

      <div class="update-notes-section">
        <div class="update-notes-label">What's New</div>
        <div class="update-notes-box">${notesHtml}</div>
      </div>
    `;

    const selectEl = dom.modalBody.querySelector('#update-asset-select') as HTMLSelectElement | null;
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        selectedAssetName = selectEl.value;
      });
    }

    dom.modalBody.querySelectorAll('.update-notes-box a').forEach((anchor: Element) => {
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const href = (anchor as HTMLAnchorElement).getAttribute('href');
        if (href && /^https?:\/\//i.test(href)) {
          void window.api.openExternal(href);
        }
      });
    });

    renderFooter(currentState);
  };

  render(updateState);
  showModal();

  return {
    update: render,
  };
}
