const {
  getCompetitorInitials,
  parseBenchmarkFlows,
  formatBytes,
  cleanApkAppName,
  extractPlayStorePackageName,
  inferAppNameFromPackage,
} = require('../../domain');

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
  analysisMode?: 'hybrid' | 'code-only';
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

  // Enlarge modal dialog width for competitor workbench and flow management
  dom.modal.classList.add('competitor-modal');

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

  let currentJadxSourcePath = competitor?.jadxSourcePath || '';
  let currentJadxStatus = competitor?.jadxStatus || '';
  let currentAnalysisMode = competitor?.analysisMode || 'hybrid';
  let isLocalDecoding = false;
  let activeDecodeProgress: { stage: string; percent: number; detail: string; elapsedSec: number } | null = null;

  dom.modalBody.innerHTML = `
    <!-- Play Store / App Link (Auto-detects App Name, Package ID, and Icon) -->
    <div class="form-group" style="margin-bottom: 14px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Play Store / App Link</span>
        <span id="comp-detect-status" style="font-size: 11px; font-weight: normal; color: var(--text-muted); transition: all var(--transition-fast);"></span>
      </label>
      <div style="display: flex; gap: 8px;">
        <input class="form-input" id="comp-input-url" placeholder="https://play.google.com/store/apps/details?id=..." value="${escapeHtml(defaultUrl)}" autocomplete="off" spellcheck="false" style="flex: 1; height: 38px;" />
        <button type="button" class="btn-secondary btn-small" id="comp-btn-detect" title="Detect app name, package ID, and icon from Play Store link" style="white-space: nowrap; padding: 0 12px; height: 38px; display: inline-flex; align-items: center; gap: 6px;">
          ${icons.refresh || ''}
          <span>Detect</span>
        </button>
      </div>
      <span class="form-hint">Paste a Google Play link to automatically detect the App Name, Package ID, and Icon.</span>
    </div>

    <!-- App Identity: Name & Avatar -->
    <div class="form-group" style="margin-bottom: 14px;">
      <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Competitor App Name <strong style="color:var(--red);">*</strong></span>
        <span id="comp-detected-badge" style="display: none; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; transition: all var(--transition-fast);">Auto-detected</span>
      </label>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div id="comp-modal-icon-preview" class="dash-comp-avatar" style="width: 40px; height: 40px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <img id="comp-modal-icon-img" src="${escapeHtml(defaultIconUrl)}" style="width: 100%; height: 100%; object-fit: cover; display: ${defaultIconUrl ? 'block' : 'none'}; border-radius: inherit;" alt="" />
          <span id="comp-modal-avatar-initials" style="display: ${defaultIconUrl ? 'none' : 'block'}; font-weight: 700; font-size: 14px; color: var(--text-muted);">${escapeHtml(getCompetitorInitials(defaultName))}</span>
        </div>
        <input class="form-input" id="comp-input-name" placeholder="e.g. MoMo, Shopee, VNPAY *" value="${escapeHtml(defaultName)}" autocomplete="off" spellcheck="false" style="flex: 1; height: 38px; font-weight: 600;" />
      </div>
    </div>

    <!-- Package Name / App ID -->
    <div class="form-group" style="margin-bottom: 14px;">
      <label class="form-label">Package Name / App ID</label>
      <input class="form-input" id="comp-input-pkg" placeholder="e.g. com.mservice.momotransfer" value="${escapeHtml(defaultPkg)}" autocomplete="off" spellcheck="false" style="height: 36px; font-family: var(--font-mono); font-size: 12px;" />
    </div>

    <!-- Group 3: Linked Android Build & Decompiled Code -->
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="comp-modal-section-title">
        <span>Linked Android Build (APK & Decompiled Code)</span>
        <span class="form-hint" style="margin: 0; font-size: 11px; text-transform: none; letter-spacing: normal;">Local .apk or .xapk for device testing & JADX source</span>
      </label>
      <div id="comp-modal-apk-container" class="comp-modal-apk-zone">
        <!-- Injected dynamically by renderApkSection() -->
      </div>
    </div>

    <!-- Group 4: Target User Flows -->
    <div class="form-group" style="margin-bottom: 6px;">
      <label class="comp-modal-section-title">
        <span>Target User Flows</span>
        <span id="comp-modal-flow-count" class="comp-modal-count-pill">
          ${flowList.length} flow${flowList.length === 1 ? '' : 's'}
        </span>
      </label>
      <div class="form-hint" style="margin-top: -3px; margin-bottom: 8px; font-size: 11px;">
        Key user journeys to explore, audit, and benchmark.
      </div>

      <div class="comp-modal-flow-container">
        <!-- Interactive flow chips -->
        <div id="comp-modal-flow-chips" class="comp-modal-flow-chips"></div>

        <!-- Add flow input group -->
        <div class="comp-modal-add-flow-group" style="display: flex; gap: 8px; margin-top: 6px;">
          <input class="form-input" id="comp-input-new-flow" placeholder="Type a flow name and press Enter, or paste comma-separated flows..." autocomplete="off" spellcheck="false" style="flex: 1; height: 36px; font-size: 12px;" />
          <button type="button" class="btn-secondary btn-small" id="comp-btn-add-flow" title="Add flow to list" style="white-space: nowrap; height: 36px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px;">
            ${icons.plus || '+'}
            <span>Add Flow</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Group 5: Benchmark Execution Mode -->
    <div class="form-group" style="margin-bottom: 6px; margin-top: 14px;">
      <label class="comp-modal-section-title">
        <span>Benchmark Analysis Mode</span>
        <span class="form-hint" style="margin: 0; font-size: 11px; text-transform: none; letter-spacing: normal;">Default for generated /ba-competitor slash commands</span>
      </label>
      <div style="display: flex; gap: 10px; margin-top: 6px;">
        <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; cursor: pointer; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); flex: 1;">
          <input type="radio" name="comp-analysis-mode" value="hybrid" ${currentAnalysisMode !== 'code-only' ? 'checked' : ''} style="cursor: pointer; margin-top: 2px;" />
          <div>
            <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              ${icons.mobile || icons.android || ''}
              <span>Live Device (mobilerun)</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; line-height: 1.3;">Drives app on Android device, captures screens &amp; UI trees</div>
          </div>
        </label>
        <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; cursor: pointer; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); flex: 1;">
          <input type="radio" name="comp-analysis-mode" value="code-only" ${currentAnalysisMode === 'code-only' ? 'checked' : ''} style="cursor: pointer; margin-top: 2px;" />
          <div>
            <div style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              ${icons.code || ''}
              <span>Static Code-Only</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; line-height: 1.3;">Decompiled source analysis only (--code-only, no device)</div>
          </div>
        </label>
      </div>
    </div>
  `;

  const urlInput = dom.modalBody.querySelector('#comp-input-url') as HTMLInputElement;
  const nameInput = dom.modalBody.querySelector('#comp-input-name') as HTMLInputElement;
  const pkgInput = dom.modalBody.querySelector('#comp-input-pkg') as HTMLInputElement;
  const flowChipsEl = dom.modalBody.querySelector('#comp-modal-flow-chips') as HTMLElement;
  const flowCountBadge = dom.modalBody.querySelector('#comp-modal-flow-count') as HTMLElement;
  const newFlowInput = dom.modalBody.querySelector('#comp-input-new-flow') as HTMLInputElement;
  const addFlowBtn = dom.modalBody.querySelector('#comp-btn-add-flow') as HTMLButtonElement;
  const detectBtn = dom.modalBody.querySelector('#comp-btn-detect') as HTMLButtonElement;
  const detectStatus = dom.modalBody.querySelector('#comp-detect-status') as HTMLElement;
  const detectedBadge = dom.modalBody.querySelector('#comp-detected-badge') as HTMLElement;
  const modalIconImg = dom.modalBody.querySelector('#comp-modal-icon-img') as HTMLImageElement;
  const modalInitials = dom.modalBody.querySelector('#comp-modal-avatar-initials') as HTMLElement;
  const apkContainerEl = dom.modalBody.querySelector('#comp-modal-apk-container') as HTMLElement;

  function updateFlowCount() {
    if (flowCountBadge) {
      flowCountBadge.textContent = `${flowList.length} flow${flowList.length === 1 ? '' : 's'}`;
    }
  }

  function renderFlowList() {
    updateFlowCount();

    // Render interactive chips
    if (flowList.length === 0) {
      flowChipsEl.innerHTML = `
        <span class="comp-modal-flow-empty-hint">
          No target flows added yet. Enter flow names below to track them.
        </span>
      `;
      return;
    }

    flowChipsEl.innerHTML = flowList.map((flow, idx) => `
      <div class="comp-modal-flow-chip" data-index="${idx}">
        <span class="comp-modal-flow-chip-num">#${idx + 1}</span>
        <span class="comp-modal-flow-chip-text" title="${escapeHtml(flow)}">${escapeHtml(flow)}</span>
        <button type="button" class="comp-modal-flow-chip-del" data-action="remove-flow" data-index="${idx}" title="Remove flow" aria-label="Remove flow">
          ${icons.close || '×'}
        </button>
      </div>
    `).join('');

    flowChipsEl.querySelectorAll('[data-action="remove-flow"]').forEach((btnEl: Element) => {
      btnEl.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
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
      if (!flowList.some((f) => f.toLowerCase() === clean.toLowerCase())) {
        flowList.push(clean);
        addedCount++;
      }
    }
    renderFlowList();
    if (addedCount > 0) {
      flowChipsEl.scrollTop = flowChipsEl.scrollHeight;
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

  // Fast paste handler: paste multiple comma-separated or newline-separated flows directly
  newFlowInput.addEventListener('paste', (e: ClipboardEvent) => {
    const pastedText = e.clipboardData?.getData('text');
    if (pastedText && (pastedText.includes(',') || pastedText.includes('\n') || pastedText.includes(';') || pastedText.includes('|'))) {
      e.preventDefault();
      addFlows(pastedText);
      newFlowInput.value = '';
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
      const isDecoding = isLocalDecoding || (activeDecodeProgress !== null && activeDecodeProgress.stage !== 'completed' && activeDecodeProgress.stage !== 'failed');

      apkContainerEl.innerHTML = `
        <div class="comp-modal-workbench">
          <!-- APK Build Row (ALWAYS active & Launchable) -->
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
              <button type="button" class="dash-comp-btn-action launch" id="comp-modal-btn-launch-apk" title="Launch app on connected Android device via ADB (works even while decoding)">
                ${icons.play || ''}
                <span>Launch</span>
              </button>
              <button type="button" class="btn-secondary btn-small" id="comp-modal-btn-change-apk" title="Select a different APK file">
                <span>Change</span>
              </button>
              <button type="button" class="dash-icon-btn danger" id="comp-modal-btn-clear-apk" title="Remove linked APK">
                ${icons.trash || icons.close || '×'}
              </button>
            </div>
          </div>

          <!-- Decompiled JADX Source Row -->
          <div class="comp-modal-artifact-row decode-row ${isDecoding ? 'decoding' : ''}">
            ${isDecoding ? `
              <div class="comp-modal-artifact-main">
                <div class="comp-modal-artifact-badge decode decoding" title="Decompiling APK sources with ReaKit JADX">
                  <span class="spinner" style="width:13px; height:13px; border-width:2px; border-color: #a78bfa transparent #a78bfa #a78bfa;"></span>
                </div>
                <div class="comp-modal-artifact-info">
                  <div class="comp-modal-artifact-name-row">
                    <span class="comp-modal-decode-title decoding">Decoding Source (JADX)</span>
                    <span class="comp-modal-pill-status decoding" id="comp-modal-decode-percent">${activeDecodeProgress?.percent || 12}%</span>
                    <span class="comp-modal-pill-mono" id="comp-modal-decode-elapsed">${activeDecodeProgress?.elapsedSec || 0}s</span>
                  </div>
                  <div class="comp-modal-progress-wrap">
                    <div class="comp-modal-progress-bar">
                      <div class="comp-modal-progress-fill" id="comp-modal-progress-fill" style="width: ${activeDecodeProgress?.percent || 12}%;"></div>
                    </div>
                  </div>
                  <span class="comp-modal-artifact-hint" id="comp-modal-decode-detail">${escapeHtml(activeDecodeProgress?.detail || 'Decompiling bytecode to Java/Kotlin...')}</span>
                </div>
              </div>
            ` : isDecoded ? `
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
                  <span class="comp-modal-artifact-hint">Extract Java/Kotlin sources & layouts with ReaKit JADX</span>
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

      // Launch button — ALWAYS enabled and clickable!
      apkContainerEl.querySelector('#comp-modal-btn-launch-apk')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLElement;
        const origHtml = btn.innerHTML;
        btn.setAttribute('disabled', 'true');
        btn.innerHTML = `<span class="spinner" style="width:11px; height:11px; border-width:2px;"></span> Launching...`;
        const appTitle = nameInput.value.trim() || 'app';
        showToast(`Launching ${appTitle} on Android device...`, 'info');
        try {
          const res = await window.api.launchApp({
            packageName: pkgInput.value.trim() || competitor?.packageName,
            apkPath: currentApkPath,
          });
          if (res?.success) {
            showToast(`Successfully launched ${appTitle}!`, 'success');
            if (res.packageName && !pkgInput.value.trim()) {
              pkgInput.value = res.packageName;
            }
          } else {
            showToast(`Launch failed: ${res?.error || 'Check device connection'}`, 'error');
          }
        } catch (err: any) {
          showToast(`Launch error: ${err.message}`, 'error');
        } finally {
          btn.removeAttribute('disabled');
          btn.innerHTML = origHtml;
        }
      });

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

      const handleDecode = async () => {
        if (!currentApkPath || !project?.path) return;
        isLocalDecoding = true;
        activeDecodeProgress = {
          stage: 'preparing',
          percent: 8,
          detail: 'Preparing JADX environment...',
          elapsedSec: 0,
        };
        renderApkSection();
        showToast('Decoding APK with ReaKit (JADX)... Progress will show below.', 'info');

        try {
          const res = await window.api.decompileCompetitorJadx({
            projectPath: project.path,
            competitorId: competitor?.id || 'temp',
            packageName: pkgInput.value.trim() || competitor?.packageName,
            apkPath: currentApkPath,
          });
          if (res?.success && res.jadxSourcePath) {
            currentJadxStatus = 'ready';
            currentJadxSourcePath = res.jadxSourcePath;
            showToast('APK successfully decoded with JADX!', 'success');
          } else {
            showToast(`Decode failed: ${res?.error || 'Unknown error'}`, 'error');
          }
        } catch (err: any) {
          showToast(`Decode error: ${err?.message || String(err)}`, 'error');
        } finally {
          isLocalDecoding = false;
          activeDecodeProgress = null;
          renderApkSection();
        }
      };

      apkContainerEl.querySelector('#comp-modal-btn-decode')?.addEventListener('click', (e) => {
        e.preventDefault();
        void handleDecode();
      });

      apkContainerEl.querySelector('#comp-modal-btn-redecode')?.addEventListener('click', (e) => {
        e.preventDefault();
        void handleDecode();
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

  // Listen to decode progress events in real-time
  const onDecodeProgress = (e: any) => {
    const data = e.detail;
    const targetCompId = competitor?.id || 'temp';
    if (!data || data.competitorId !== targetCompId) return;

    activeDecodeProgress = data;

    if (data.stage === 'completed') {
      isLocalDecoding = false;
      activeDecodeProgress = null;
      void checkAndSyncReakitStatus();
      return;
    }

    if (data.stage === 'failed') {
      isLocalDecoding = false;
      activeDecodeProgress = null;
      renderApkSection();
      return;
    }

    // Direct DOM updates for ultra-smooth 60fps progress bar without redraw
    const fillEl = apkContainerEl.querySelector('#comp-modal-progress-fill') as HTMLElement;
    const percentEl = apkContainerEl.querySelector('#comp-modal-decode-percent') as HTMLElement;
    const elapsedEl = apkContainerEl.querySelector('#comp-modal-decode-elapsed') as HTMLElement;
    const detailEl = apkContainerEl.querySelector('#comp-modal-decode-detail') as HTMLElement;

    if (fillEl && percentEl) {
      fillEl.style.width = `${data.percent}%`;
      percentEl.textContent = `${data.percent}%`;
      if (elapsedEl) elapsedEl.textContent = `${data.elapsedSec || 0}s`;
      if (detailEl && data.detail) detailEl.textContent = data.detail;
    } else {
      renderApkSection();
    }
  };

  window.addEventListener('competitor-decode-progress', onDecodeProgress);

  renderApkSection();

  let userEditedName = false;
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

    // 1. Instant client-side package extraction from URL
    const quickPkg = extractPlayStorePackageName(rawUrl);
    if (quickPkg) {
      if (!pkgInput.value.trim() || force || !userEditedName) {
        pkgInput.value = quickPkg;
        if (!currentApkPath) renderApkSection();
        void checkAndSyncReakitStatus();
      }
      const quickInferred = inferAppNameFromPackage(quickPkg);
      if (quickInferred && (!nameInput.value.trim() || force || !userEditedName)) {
        nameInput.value = quickInferred;
        if (!currentIconUrl) {
          modalInitials.textContent = getCompetitorInitials(quickInferred);
        }
      }
    }

    detectStatus.textContent = 'Detecting app...';
    detectStatus.style.color = 'var(--text-muted)';
    detectBtn.disabled = true;

    try {
      const res = await window.api.detectCompetitorApp(rawUrl);
      if (res && res.success && (res.appName || res.iconUrl || res.packageName)) {
        if (res.appName && (!nameInput.value.trim() || force || !userEditedName)) {
          nameInput.value = res.appName;
          userEditedName = false;
        }
        if (res.packageName && (!pkgInput.value.trim() || force || !userEditedName)) {
          pkgInput.value = res.packageName;
          if (!currentApkPath) renderApkSection();
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
    } catch (err: any) {
      if (force) {
        detectStatus.textContent = 'Error detecting app';
        detectStatus.style.color = 'var(--red)';
        showToast(`Detection error: ${err?.message || 'Network error'}`, 'error');
      }
    } finally {
      detectBtn.disabled = false;
    }
  }

  detectBtn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    void runDetection(true);
  });

  urlInput.addEventListener('paste', () => {
    setTimeout(() => {
      void runDetection(true);
    }, 40);
  });

  let debounceTimer: any = null;
  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    // Instant extraction on every keystroke
    const quickPkg = extractPlayStorePackageName(val);
    if (quickPkg && (!pkgInput.value.trim() || !userEditedName)) {
      pkgInput.value = quickPkg;
      const inferred = inferAppNameFromPackage(quickPkg);
      if (inferred && (!nameInput.value.trim() || !userEditedName)) {
        nameInput.value = inferred;
        if (!currentIconUrl) modalInitials.textContent = getCompetitorInitials(inferred);
      }
      if (!currentApkPath) renderApkSection();
      void checkAndSyncReakitStatus();
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (val && (val.includes('play.google.com') || val.includes('id='))) {
        void runDetection(false);
      }
    }, 400);
  });

  const { 'modal-cancel': cancelBtn, 'modal-confirm': confirmBtn } = configureModalFooter([
    { id: 'modal-cancel', label: 'Cancel' },
    { id: 'modal-confirm', label: isEditing ? 'Save Changes' : `${icons.plus || '+'} Add Competitor`, kind: 'primary' },
  ]);
  const defaultConfirmLabel = confirmBtn.innerHTML;

  showModal();
  focusModalInputLater(isEditing ? nameInput : (defaultUrl ? nameInput : urlInput));

  const closeModal = () => {
    window.removeEventListener('competitor-decode-progress', onDecodeProgress);
    hideModal();
  };

  cancelBtn.addEventListener('click', closeModal);

  confirmBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Please enter a competitor app name', 'error');
      nameInput.focus();
      return;
    }

    const currentFlows: string[] = [...flowList];
    const pendingNew = newFlowInput.value.trim();
    if (pendingNew) {
      const parsedPending = parseBenchmarkFlows(pendingNew);
      const toAdd = parsedPending.length > 0 ? parsedPending : [pendingNew];
      for (const p of toAdd) {
        if (!currentFlows.some((f) => f.toLowerCase() === p.toLowerCase())) {
          currentFlows.push(p);
        }
      }
    }

    const selectedMode = (dom.modalBody.querySelector('input[name="comp-analysis-mode"]:checked') as HTMLInputElement)?.value === 'code-only' ? 'code-only' : 'hybrid';

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
      analysisMode: selectedMode,
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
      closeModal();
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
