const { getCompetitorInitials, parseBenchmarkFlows, formatBytes, cleanApkAppName } = require('../../domain');

type CompetitorData = {
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
};

type OpenCompetitorModalOptions = {
  project: any;
  competitor?: CompetitorData | null;
  initialApk?: { name: string; path: string; size: number } | null;
  dom: any;
  icons: Record<string, string>;
  configureModalFooter: (actions: Array<{ id: string; label: string; kind?: 'primary' | 'secondary'; danger?: boolean }>) => Record<string, HTMLElement>;
  showModal: () => void;
  hideModal: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  focusModalInputLater: (el: HTMLElement) => void;
  bindModalEnterSubmit: (inputEl: HTMLElement, submitButton: HTMLElement) => void;
  withAsyncButtonState: (btn: HTMLElement, pending: string, action: () => Promise<any>, reset?: string) => Promise<any>;
  onSuccess: (project: any) => void;
};

export async function openCompetitorModal({
  project,
  competitor = null,
  initialApk = null,
  dom,
  icons,
  configureModalFooter,
  showModal,
  hideModal,
  showToast,
  focusModalInputLater,
  bindModalEnterSubmit,
  withAsyncButtonState,
  onSuccess,
}: OpenCompetitorModalOptions) {
  const isEditing = Boolean(competitor && competitor.id);
  dom.modalTitle.textContent = isEditing ? 'Edit Competitor App' : (initialApk ? 'Import Competitor APK' : 'Add Competitor App');

  let currentApkPath = competitor?.apkPath || initialApk?.path || '';
  let currentApkName = competitor?.apkName || initialApk?.name || (currentApkPath ? currentApkPath.split(/[\\/]/).pop() || '' : '');
  let currentApkSize = competitor?.apkSize !== undefined ? competitor.apkSize : (initialApk?.size || 0);

  const defaultName = competitor?.name || (initialApk?.name ? cleanApkAppName(initialApk.name) : '');
  const defaultUrl = competitor?.url || '';
  const defaultPkg = competitor?.packageName || '';
  const defaultNotes = competitor?.notes || '';
  const defaultIconUrl = competitor?.iconUrl || '';
  let currentIconUrl = defaultIconUrl;
  const flowList: string[] = parseBenchmarkFlows(defaultNotes);

  dom.modalBody.innerHTML = `
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Play Store / App Link</span>
        <span id="comp-detect-status" style="font-size: 11px; font-weight: normal; color: var(--text-muted); transition: all var(--transition-fast);"></span>
      </label>
      <div style="display: flex; gap: 8px;">
        <input class="form-input" id="comp-input-url" placeholder="https://play.google.com/store/apps/details?id=..." value="${escapeHtml(defaultUrl)}" autocomplete="off" spellcheck="false" style="flex: 1;" />
        <button type="button" class="btn-secondary btn-small" id="comp-btn-detect" title="Detect app name and package ID from link" style="white-space: nowrap; padding: 0 12px; height: 38px; display: inline-flex; align-items: center; gap: 6px;">
          ${icons.refresh || ''}
          <span>Detect</span>
        </button>
      </div>
      <span class="form-hint">Paste a Google Play link to automatically detect the App Name, Package ID, and Icon.</span>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Competitor App Name <strong style="color:var(--red);">*</strong></span>
        <span id="comp-detected-badge" style="display: none; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; transition: all var(--transition-fast);">Auto-detected</span>
      </label>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div id="comp-modal-icon-preview" class="dash-comp-avatar" style="width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); position: relative;">
          <img id="comp-modal-icon-img" src="${escapeHtml(defaultIconUrl)}" style="width: 100%; height: 100%; object-fit: cover; display: ${defaultIconUrl ? 'block' : 'none'}; border-radius: inherit;" alt="" />
          <span id="comp-modal-avatar-initials" style="display: ${defaultIconUrl ? 'none' : 'block'}; font-weight: 700; font-size: 13px; color: var(--text-muted);">${escapeHtml(getCompetitorInitials(defaultName))}</span>
        </div>
        <input class="form-input" id="comp-input-name" placeholder="e.g. MoMo, Shopee, VNPAY" value="${escapeHtml(defaultName)}" autocomplete="off" spellcheck="false" style="flex: 1;" />
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label">Package Name / App ID</label>
      <input class="form-input" id="comp-input-pkg" placeholder="e.g. com.mservice.momotransfer" value="${escapeHtml(defaultPkg)}" autocomplete="off" spellcheck="false" />
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Linked APK Build (Optional)</span>
        <span class="form-hint" style="margin: 0; font-size: 11px;">Local .apk or .xapk for direct testing & install</span>
      </label>
      <div id="comp-modal-apk-container" class="comp-modal-apk-zone">
        <!-- Injected dynamically by renderApkSection() -->
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 8px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Benchmark Flows</span>
        <span id="comp-modal-flow-count" style="font-size: 11px; font-weight: 600; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 9999px; padding: 1px 7px;">
          ${flowList.length} flow${flowList.length === 1 ? '' : 's'}
        </span>
      </label>

      <div class="comp-modal-flow-container">
        <div id="comp-modal-flow-list" class="comp-modal-flow-list"></div>

        <div class="comp-modal-add-flow-group" style="display: flex; gap: 8px; margin-top: 8px;">
          <input class="form-input" id="comp-input-new-flow" placeholder="Add a benchmark flow (e.g. Onboarding KYC)..." autocomplete="off" spellcheck="false" style="flex: 1; height: 36px;" />
          <button type="button" class="btn-secondary btn-small" id="comp-btn-add-flow" title="Add flow to list" style="white-space: nowrap; height: 36px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px;">
            ${icons.plus || '+'}
            <span>Add Flow</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const urlInput = dom.modalBody.querySelector('#comp-input-url') as HTMLInputElement;
  const nameInput = dom.modalBody.querySelector('#comp-input-name') as HTMLInputElement;
  const pkgInput = dom.modalBody.querySelector('#comp-input-pkg') as HTMLInputElement;
  const flowListEl = dom.modalBody.querySelector('#comp-modal-flow-list') as HTMLElement;
  const flowCountBadge = dom.modalBody.querySelector('#comp-modal-flow-count') as HTMLElement;
  const newFlowInput = dom.modalBody.querySelector('#comp-input-new-flow') as HTMLInputElement;
  const addFlowBtn = dom.modalBody.querySelector('#comp-btn-add-flow') as HTMLButtonElement;
  const detectBtn = dom.modalBody.querySelector('#comp-btn-detect') as HTMLButtonElement;
  const detectStatus = dom.modalBody.querySelector('#comp-detect-status') as HTMLElement;
  const detectedBadge = dom.modalBody.querySelector('#comp-detected-badge') as HTMLElement;
  const modalIconImg = dom.modalBody.querySelector('#comp-modal-icon-img') as HTMLImageElement;
  const modalInitials = dom.modalBody.querySelector('#comp-modal-avatar-initials') as HTMLElement;

  function updateFlowCount() {
    if (flowCountBadge) {
      flowCountBadge.textContent = `${flowList.length} flow${flowList.length === 1 ? '' : 's'}`;
    }
  }

  function renderFlowList() {
    updateFlowCount();
    if (flowList.length === 0) {
      flowListEl.innerHTML = `
        <div class="comp-modal-flow-empty">
          No benchmark flows added yet. Type a flow name above and click Add Flow.
        </div>
      `;
      return;
    }

    flowListEl.innerHTML = flowList.map((flow, idx) => `
      <div class="comp-modal-flow-item" data-index="${idx}">
        <span class="comp-modal-flow-num">${idx + 1}</span>
        <input class="form-input comp-flow-input" data-index="${idx}" value="${escapeHtml(flow)}" placeholder="Flow name (e.g. Onboarding KYC)" spellcheck="false" autocomplete="off" />
        <button type="button" class="comp-modal-flow-remove-btn" data-action="remove-flow" data-index="${idx}" title="Remove flow" aria-label="Remove flow">
          ${icons.close || '×'}
        </button>
      </div>
    `).join('');

    flowListEl.querySelectorAll('.comp-flow-input').forEach((inputEl: Element) => {
      inputEl.addEventListener('input', (e: Event) => {
        const target = e.currentTarget as HTMLInputElement;
        const idx = Number(target.dataset.index);
        if (!isNaN(idx) && flowList[idx] !== undefined) {
          flowList[idx] = target.value;
        }
      });
    });

    flowListEl.querySelectorAll('[data-action="remove-flow"]').forEach((btnEl: Element) => {
      btnEl.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const idx = Number(target.dataset.index);
        if (!isNaN(idx) && flowList[idx] !== undefined) {
          flowList.splice(idx, 1);
          renderFlowList();
        }
      });
    });
  }

  function addFlows(text: string) {
    if (!text || !text.trim()) return;
    const parsed = parseBenchmarkFlows(text);
    const toAdd = parsed.length > 0 ? parsed : [text.trim()];
    let addedCount = 0;
    for (const flow of toAdd) {
      const clean = flow.trim();
      if (!clean) continue;
      if (!flowList.some(f => f.toLowerCase() === clean.toLowerCase())) {
        flowList.push(clean);
        addedCount++;
      }
    }
    renderFlowList();
    if (addedCount > 0) {
      flowListEl.scrollTop = flowListEl.scrollHeight;
    }
  }

  addFlowBtn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    const val = newFlowInput.value.trim();
    if (val) {
      addFlows(val);
      newFlowInput.value = '';
      newFlowInput.focus();
    }
  });

  newFlowInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newFlowInput.value.trim();
      if (val) {
        addFlows(val);
        newFlowInput.value = '';
        newFlowInput.focus();
      }
    }
  });


  renderFlowList();

  function updateIconPreview(iconUrl?: string, appName?: string) {
    if (iconUrl) {
      modalIconImg.src = iconUrl;
      modalIconImg.style.display = 'block';
      modalInitials.style.display = 'none';
    } else {
      modalIconImg.style.display = 'none';
      modalInitials.textContent = getCompetitorInitials(appName || nameInput.value || '');
      modalInitials.style.display = 'block';
    }
  }

  let currentJadxSourcePath = competitor?.jadxSourcePath || '';
  let currentJadxStatus = competitor?.jadxStatus || '';

  const apkContainerEl = dom.modalBody.querySelector('#comp-modal-apk-container') as HTMLElement;

  async function checkAndSyncReakitStatus() {
    const pkg = pkgInput.value.trim() || competitor?.packageName || defaultPkg;
    if (!project?.path || (!pkg && !currentApkPath)) return;
    try {
      const status = await window.api.getCompetitorReakitStatus({
        projectPath: project.path,
        competitorId: competitor?.id,
        packageName: pkg,
        apkPath: currentApkPath,
        jadxSourcePath: currentJadxSourcePath,
      });
      let changed = false;
      if (status?.hasJadx) {
        currentJadxStatus = 'ready';
        currentJadxSourcePath = status.jadxSourcePath || currentJadxSourcePath;
        changed = true;
      }
      if (status?.hasApk && !currentApkPath && status.apkPath) {
        currentApkPath = status.apkPath;
        currentApkName = status.apkName || '';
        currentApkSize = status.apkSize || 0;
        changed = true;
      }
      if (changed) {
        renderApkSection();
      }
    } catch (_) {}
  }

  // Auto-detect on-disk ReaKit status on modal open
  if (project?.path && (defaultPkg || currentApkPath)) {
    void checkAndSyncReakitStatus();
  }

  function renderApkSection() {
    if (!apkContainerEl) return;
    if (currentApkPath) {
      const isDecoded = currentJadxStatus === 'ready' || Boolean(currentJadxSourcePath);
      apkContainerEl.innerHTML = `
        <div class="comp-modal-workbench">
          <div class="comp-modal-artifact-row apk-row">
            <div class="comp-modal-artifact-main">
              <div class="comp-modal-artifact-badge apk" title="Linked Android APK build">
                ${icons.apk || icons.android || ''}
              </div>
              <div class="comp-modal-artifact-info">
                <div class="comp-modal-artifact-name-row">
                  <span class="comp-modal-artifact-name" title="${escapeHtml(currentApkName || currentApkPath)}">${escapeHtml(currentApkName || 'app.apk')}</span>
                  <span class="comp-modal-pill-mono">${formatBytes(currentApkSize)}</span>
                </div>
                <span class="comp-modal-artifact-path" title="${escapeHtml(currentApkPath)}">${escapeHtml(currentApkPath)}</span>
              </div>
            </div>
            <div class="comp-modal-artifact-actions">
              <button type="button" class="btn-secondary btn-small" id="comp-modal-btn-change-apk" title="Select a different APK file">
                <span>Change</span>
              </button>
              <button type="button" class="dash-icon-btn danger" id="comp-modal-btn-clear-apk" title="Remove linked APK">
                ${icons.trash || icons.close || '×'}
              </button>
            </div>
          </div>

          <div class="comp-modal-artifact-row decode-row">
            ${isDecoded ? `
              <div class="comp-modal-artifact-main">
                <div class="comp-modal-artifact-badge decode ready" title="Decoded Java/Kotlin sources ready">
                  ${icons.decode || icons.code || ''}
                </div>
                <div class="comp-modal-artifact-info">
                  <div class="comp-modal-artifact-name-row">
                    <span class="comp-modal-decode-title ready">Decoded Source</span>
                    <span class="comp-modal-pill-status ready">JADX Ready</span>
                  </div>
                  <span class="comp-modal-artifact-path" title="${escapeHtml(currentJadxSourcePath || 'jadx_src')}">${escapeHtml(currentJadxSourcePath || 'jadx_src')}</span>
                </div>
              </div>
              <div class="comp-modal-artifact-actions">
                <button type="button" class="btn-secondary btn-small" id="comp-modal-btn-open-src" title="Open decompiled source folder in Explorer">
                  ${icons.folder || ''}
                  <span>Source</span>
                </button>
                <button type="button" class="dash-icon-btn" id="comp-modal-btn-redecode" title="Re-decode APK with ReaKit JADX">
                  ${icons.refresh || ''}
                </button>
              </div>
            ` : `
              <div class="comp-modal-artifact-main">
                <div class="comp-modal-artifact-badge decode idle" title="APK source not decoded yet">
                  ${icons.decode || icons.code || ''}
                </div>
                <div class="comp-modal-artifact-info">
                  <div class="comp-modal-artifact-name-row">
                    <span class="comp-modal-decode-title idle">Decoded Source</span>
                    <span class="comp-modal-pill-status idle">Not Decoded</span>
                  </div>
                  <span class="comp-modal-artifact-hint">Extract Java/Kotlin sources & layouts with ReaKit</span>
                </div>
              </div>
              <div class="comp-modal-artifact-actions">
                <button type="button" class="dash-comp-btn-action decode" id="comp-modal-btn-decode" title="Decode APK and extract Java/Kotlin sources with ReaKit JADX">
                  ${icons.decode || icons.code || ''}
                  <span>Decode (JADX)</span>
                </button>
              </div>
            `}
          </div>
        </div>
      `;

      apkContainerEl.querySelector('#comp-modal-btn-change-apk')?.addEventListener('click', async () => {
        const file = await window.api.selectApkFile();
        if (file) {
          currentApkPath = file.path;
          currentApkName = file.name;
          currentApkSize = file.size;
          if (!nameInput.value.trim()) {
            nameInput.value = cleanApkAppName(file.name);
            updateIconPreview(currentIconUrl, nameInput.value);
          }
          renderApkSection();
          void checkAndSyncReakitStatus();
        }
      });

      apkContainerEl.querySelector('#comp-modal-btn-clear-apk')?.addEventListener('click', () => {
        currentApkPath = '';
        currentApkName = '';
        currentApkSize = 0;
        renderApkSection();
      });

      apkContainerEl.querySelector('#comp-modal-btn-open-src')?.addEventListener('click', async () => {
        const res = await window.api.openJadxSource({
          jadxSourcePath: currentJadxSourcePath,
          projectPath: project.path,
          packageName: pkgInput.value.trim() || competitor?.packageName,
        });
        if (!res?.success) {
          showToast(res?.error || 'Failed to open source folder', 'error');
        }
      });

      const handleDecode = async (btnEl: HTMLElement | null) => {
        if (!btnEl) return;
        const origHtml = btnEl.innerHTML;
        btnEl.setAttribute('disabled', 'true');
        btnEl.innerHTML = `<span class="spinner" style="width:11px; height:11px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:4px;"></span> Decoding...`;
        showToast('Decoding APK with ReaKit (JADX)... This may take a minute.', 'info');
        try {
          const res = await window.api.decompileCompetitorJadx({
            projectPath: project.path,
            competitorId: competitor?.id,
            packageName: pkgInput.value.trim() || competitor?.packageName,
            apkPath: currentApkPath,
          });
          if (res?.success && res.jadxSourcePath) {
            currentJadxStatus = 'ready';
            currentJadxSourcePath = res.jadxSourcePath;
            showToast('APK successfully decoded with JADX!', 'success');
            renderApkSection();
          } else {
            showToast(`Decode failed: ${res?.error || 'Unknown error'}`, 'error');
          }
        } catch (err: any) {
          showToast(`Decode error: ${err?.message || String(err)}`, 'error');
        } finally {
          btnEl.removeAttribute('disabled');
          btnEl.innerHTML = origHtml;
        }
      };

      apkContainerEl.querySelector('#comp-modal-btn-decode')?.addEventListener('click', (e) => {
        e.preventDefault();
        void handleDecode(apkContainerEl.querySelector('#comp-modal-btn-decode') as HTMLElement);
      });

      apkContainerEl.querySelector('#comp-modal-btn-redecode')?.addEventListener('click', (e) => {
        e.preventDefault();
        void handleDecode(apkContainerEl.querySelector('#comp-modal-btn-redecode') as HTMLElement);
      });
    } else {
      const targetPkg = pkgInput.value.trim() || competitor?.packageName || '';
      apkContainerEl.innerHTML = `
        <div class="comp-modal-apk-empty" id="comp-modal-apk-dropzone">
          <div class="comp-modal-apk-empty-inner">
            <div class="comp-modal-apk-empty-icon">
              ${icons.apk || icons.android || ''}
            </div>
            <div class="comp-modal-apk-empty-text">
              <span>Drop <strong>.apk / .xapk</strong> here, or <button type="button" class="dash-inline-link" id="comp-modal-btn-browse-apk">browse file</button></span>
            </div>
          </div>
          ${targetPkg ? `
            <div class="comp-modal-apk-empty-actions">
              <button type="button" class="dash-comp-btn-reakit-download" id="comp-modal-btn-download-apk" title="Download APK for ${escapeHtml(targetPkg)} via ReaKit (apkd)">
                ${icons.download || ''}
                <span>Download APK (ReaKit)</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;

      const browseBtn = apkContainerEl.querySelector('#comp-modal-btn-browse-apk');
      browseBtn?.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        const file = await window.api.selectApkFile();
        if (file) {
          currentApkPath = file.path;
          currentApkName = file.name;
          currentApkSize = file.size;
          if (!nameInput.value.trim()) {
            nameInput.value = cleanApkAppName(file.name);
            updateIconPreview(currentIconUrl, nameInput.value);
          }
          renderApkSection();
          void checkAndSyncReakitStatus();
        }
      });

      const downloadBtn = apkContainerEl.querySelector('#comp-modal-btn-download-apk') as HTMLElement;
      if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e: Event) => {
          e.preventDefault();
          const pkg = pkgInput.value.trim() || competitor?.packageName || '';
          if (!pkg) {
            showToast('Please specify a package name first', 'info');
            return;
          }
          const origHtml = downloadBtn.innerHTML;
          downloadBtn.setAttribute('disabled', 'true');
          downloadBtn.innerHTML = `<span class="spinner" style="width:11px; height:11px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:4px;"></span> Downloading...`;
          showToast(`Downloading APK for ${pkg} via ReaKit...`, 'info');
          try {
            const res = await window.api.downloadCompetitorApk({
              projectPath: project.path,
              competitorId: competitor?.id || 'temp',
              packageName: pkg,
            });
            if (res?.success && res.apkPath) {
              currentApkPath = res.apkPath;
              currentApkName = res.apkName || '';
              currentApkSize = res.apkSize || 0;
              showToast('Downloaded APK successfully!', 'success');
              const status = await window.api.getCompetitorReakitStatus({
                projectPath: project.path,
                packageName: pkg,
                apkPath: res.apkPath,
              });
              if (status?.hasJadx) {
                currentJadxStatus = 'ready';
                currentJadxSourcePath = status.jadxSourcePath || '';
              }
              renderApkSection();
            } else {
              showToast(`Download failed: ${res?.error || 'Unknown error'}`, 'error');
            }
          } catch (err: any) {
            showToast(`Download error: ${err?.message || String(err)}`, 'error');
          } finally {
            downloadBtn.removeAttribute('disabled');
            downloadBtn.innerHTML = origHtml;
          }
        });
      }

      const dropzone = apkContainerEl.querySelector('#comp-modal-apk-dropzone') as HTMLElement;
      if (dropzone) {
        dropzone.addEventListener('dragover', (e: DragEvent) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', (e: DragEvent) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            const f = files[0] as any;
            if (f.path && /\.(apk|xapk|apks)$/i.test(f.path)) {
              currentApkPath = f.path;
              currentApkName = f.name;
              currentApkSize = f.size || 0;
              if (!nameInput.value.trim()) {
                nameInput.value = cleanApkAppName(f.name);
                updateIconPreview(currentIconUrl, nameInput.value);
              }
              renderApkSection();
              void checkAndSyncReakitStatus();
            } else {
              showToast('Please drop an .apk or .xapk file', 'info');
            }
          }
        });
      }
    }
  }

  renderApkSection();

  let userEditedName = Boolean(defaultName);
  nameInput.addEventListener('input', () => {
    userEditedName = true;
    detectedBadge.style.display = 'none';
    if (!currentIconUrl) {
      modalInitials.textContent = getCompetitorInitials(nameInput.value);
    }
  });

  pkgInput.addEventListener('input', () => {
    if (!currentApkPath) {
      renderApkSection();
    }
    void checkAndSyncReakitStatus();
  });

  async function runDetection(force = false) {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      if (force) {
        showToast('Please enter a Play Store link first', 'info');
        urlInput.focus();
      }
      return;
    }

    // 1. Quick client-side extraction of package ID if URL contains it
    try {
      const parsed = new URL(rawUrl);
      const id = parsed.searchParams.get('id');
      if (id && (!pkgInput.value.trim() || force)) {
        pkgInput.value = id.trim();
      }
    } catch {
      const match = rawUrl.match(/[?&]id=([a-zA-Z0-9_.]+)/);
      if (match && (!pkgInput.value.trim() || force)) {
        pkgInput.value = match[1].trim();
      }
    }

    // If user already typed their own name and this isn't a manual "Detect" click, don't overwrite
    if (userEditedName && !force && nameInput.value.trim()) {
      return;
    }

    detectStatus.textContent = 'Detecting app...';
    detectStatus.style.color = 'var(--text-muted)';
    detectBtn.disabled = true;

    try {
      const res = await window.api.detectCompetitorApp(rawUrl);
      if (res && res.success && (res.appName || res.iconUrl)) {
        if (res.appName) {
          nameInput.value = res.appName;
        }
        if (res.packageName && (!pkgInput.value.trim() || force)) {
          pkgInput.value = res.packageName;
          if (!currentApkPath) {
            renderApkSection();
          }
          void checkAndSyncReakitStatus();
        }
        if (res.iconUrl) {
          currentIconUrl = res.iconUrl;
          updateIconPreview(res.iconUrl, res.appName || nameInput.value);
        }
        detectedBadge.style.display = 'inline-block';
        if (res.inferred) {
          detectedBadge.textContent = 'Inferred from ID';
          detectedBadge.style.background = 'rgba(255, 183, 77, 0.15)';
          detectedBadge.style.color = '#ffb74d';
          detectedBadge.style.border = '1px solid rgba(255, 183, 77, 0.3)';
          detectStatus.textContent = 'Guessed from package ID';
          detectStatus.style.color = '#ffb74d';
        } else {
          detectedBadge.textContent = 'Detected from Store';
          detectedBadge.style.background = 'rgba(61, 220, 132, 0.15)';
          detectedBadge.style.color = '#3ddc84';
          detectedBadge.style.border = '1px solid rgba(61, 220, 132, 0.3)';
          detectStatus.textContent = 'App details detected';
          detectStatus.style.color = '#3ddc84';
        }
        if (force) {
          showToast(`Detected: ${res.appName || 'App details'}`, 'success');
        }
      } else if (force) {
        detectStatus.textContent = res?.error || 'Detection failed';
        detectStatus.style.color = 'var(--red)';
        showToast(res?.error || 'Could not detect app name from link', 'info');
      }
    } catch {
      if (force) {
        detectStatus.textContent = 'Error detecting app';
        detectStatus.style.color = 'var(--red)';
      }
    } finally {
      detectBtn.disabled = false;
    }
  }

  detectBtn.addEventListener('click', () => {
    void runDetection(true);
  });

  urlInput.addEventListener('paste', () => {
    setTimeout(() => {
      void runDetection(false);
    }, 40);
  });

  let debounceTimer: any = null;
  urlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void runDetection(false);
    }, 450);
  });

  const { 'modal-cancel': cancelBtn, 'modal-confirm': confirmBtn } = configureModalFooter([
    { id: 'modal-cancel', label: 'Cancel' },
    { id: 'modal-confirm', label: isEditing ? 'Save Changes' : `${icons.plus || '+'} Add Competitor`, kind: 'primary' },
  ]);
  const defaultConfirmLabel = confirmBtn.innerHTML;

  showModal();
  focusModalInputLater(defaultUrl ? nameInput : urlInput);

  cancelBtn.addEventListener('click', hideModal);

  confirmBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Please enter a competitor app name', 'error');
      nameInput.focus();
      return;
    }

    const currentFlows: string[] = [];
    flowListEl.querySelectorAll('.comp-flow-input').forEach((inputEl: Element) => {
      const val = (inputEl as HTMLInputElement).value.trim();
      if (val && !currentFlows.some(f => f.toLowerCase() === val.toLowerCase())) {
        currentFlows.push(val);
      }
    });

    const pendingNew = newFlowInput.value.trim();
    if (pendingNew) {
      const parsedPending = parseBenchmarkFlows(pendingNew);
      const toAdd = parsedPending.length > 0 ? parsedPending : [pendingNew];
      for (const p of toAdd) {
        if (!currentFlows.some(f => f.toLowerCase() === p.toLowerCase())) {
          currentFlows.push(p);
        }
      }
    }

    const compData: CompetitorData = {
      ...(competitor?.id ? { id: competitor.id } : {}),
      name,
      url: urlInput.value.trim(),
      packageName: pkgInput.value.trim(),
      iconUrl: currentIconUrl,
      platform: 'Android',
      apkPath: currentApkPath,
      apkName: currentApkName,
      apkSize: currentApkSize,
      jadxSourcePath: currentJadxSourcePath,
      jadxStatus: currentJadxStatus,
      notes: currentFlows.join('\n'),
    };

    const res = await withAsyncButtonState(
      confirmBtn,
      'Saving...',
      async () => {
        if (isEditing && competitor?.id) {
          return await window.api.updateProjectCompetitor(project.path, {
            ...compData,
            id: competitor.id,
          });
        } else {
          return await window.api.addProjectCompetitor(project.path, compData);
        }
      },
      defaultConfirmLabel
    );

    if (res?.success) {
      showToast(isEditing ? 'Competitor updated' : 'Competitor app added', 'success');
      hideModal();
      if (res.project) {
        onSuccess(res.project);
      }
    } else {
      showToast(`Failed: ${res?.error || 'Unknown error'}`, 'error');
    }
  });

  bindModalEnterSubmit(nameInput, confirmBtn);
  bindModalEnterSubmit(urlInput, confirmBtn);
  bindModalEnterSubmit(pkgInput, confirmBtn);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
