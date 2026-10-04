const { getCompetitorInitials, parseBenchmarkFlows } = require('../../domain');

type CompetitorData = {
  id?: string;
  name: string;
  url?: string;
  packageName?: string;
  iconUrl?: string;
  platform?: 'Android';
  notes?: string;
};

type OpenCompetitorModalOptions = {
  project: any;
  competitor?: CompetitorData | null;
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
  dom.modalTitle.textContent = isEditing ? 'Edit Competitor App' : 'Add Competitor App';

  const defaultName = competitor?.name || '';
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

  let userEditedName = Boolean(defaultName);
  nameInput.addEventListener('input', () => {
    userEditedName = true;
    detectedBadge.style.display = 'none';
    if (!currentIconUrl) {
      modalInitials.textContent = getCompetitorInitials(nameInput.value);
    }
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
