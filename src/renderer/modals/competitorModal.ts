type CompetitorData = {
  id?: string;
  name: string;
  url?: string;
  packageName?: string;
  platform?: 'Android' | 'iOS' | 'Web';
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
  const defaultPlatform = competitor?.platform || 'Android';
  const defaultNotes = competitor?.notes || '';

  dom.modalBody.innerHTML = `
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label" style="display:flex; justify-content:space-between;">
        <span>Competitor App Name <strong style="color:var(--red);">*</strong></span>
      </label>
      <input class="form-input" id="comp-input-name" placeholder="e.g. MoMo, Shopee, VNPAY" value="${escapeHtml(defaultName)}" autocomplete="off" spellcheck="false" />
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label">Play Store / App URL</label>
      <input class="form-input" id="comp-input-url" placeholder="https://play.google.com/store/apps/details?id=..." value="${escapeHtml(defaultUrl)}" autocomplete="off" spellcheck="false" />
      <span class="form-hint">Tip: Pasting a Google Play Store link auto-fills the Package Name.</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 140px; gap: 12px; margin-bottom: 12px;">
      <div class="form-group">
        <label class="form-label">Package Name / App ID</label>
        <input class="form-input" id="comp-input-pkg" placeholder="e.g. com.mservice.momotransaction" value="${escapeHtml(defaultPkg)}" autocomplete="off" spellcheck="false" />
      </div>
      <div class="form-group">
        <label class="form-label">Platform</label>
        <select class="form-input" id="comp-select-platform">
          <option value="Android" ${defaultPlatform === 'Android' ? 'selected' : ''}>Android</option>
          <option value="iOS" ${defaultPlatform === 'iOS' ? 'selected' : ''}>iOS</option>
          <option value="Web" ${defaultPlatform === 'Web' ? 'selected' : ''}>Web</option>
        </select>
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 8px;">
      <label class="form-label">Benchmark Flows & Notes</label>
      <textarea class="form-input" id="comp-input-notes" rows="3" placeholder="Key flows to benchmark (e.g. Onboarding KYC, QR payment flow, voucher redemption)..." style="resize: vertical; font-family: inherit;">${escapeHtml(defaultNotes)}</textarea>
      <span class="form-hint">These notes inform BAKit competitor analysis workflows (/ba-competitor).</span>
    </div>
  `;

  const nameInput = dom.modalBody.querySelector('#comp-input-name') as HTMLInputElement;
  const urlInput = dom.modalBody.querySelector('#comp-input-url') as HTMLInputElement;
  const pkgInput = dom.modalBody.querySelector('#comp-input-pkg') as HTMLInputElement;
  const platformSelect = dom.modalBody.querySelector('#comp-select-platform') as HTMLSelectElement;
  const notesInput = dom.modalBody.querySelector('#comp-input-notes') as HTMLTextAreaElement;

  // Auto-extract package name from Google Play Store URL
  urlInput.addEventListener('input', () => {
    const val = urlInput.value.trim();
    if (val && !pkgInput.value.trim()) {
      try {
        const parsed = new URL(val);
        const idParam = parsed.searchParams.get('id');
        if (idParam) {
          pkgInput.value = idParam;
        }
      } catch {
        // ignore invalid url
      }
    }
  });

  const { 'modal-cancel': cancelBtn, 'modal-confirm': confirmBtn } = configureModalFooter([
    { id: 'modal-cancel', label: 'Cancel' },
    { id: 'modal-confirm', label: isEditing ? 'Save Changes' : `${icons.plus || '+'} Add Competitor`, kind: 'primary' },
  ]);
  const defaultConfirmLabel = confirmBtn.innerHTML;

  showModal();
  focusModalInputLater(nameInput);

  cancelBtn.addEventListener('click', hideModal);

  confirmBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Please enter a competitor app name', 'error');
      nameInput.focus();
      return;
    }

    const compData: CompetitorData = {
      ...(competitor?.id ? { id: competitor.id } : {}),
      name,
      url: urlInput.value.trim(),
      packageName: pkgInput.value.trim(),
      platform: platformSelect.value as 'Android' | 'iOS' | 'Web',
      notes: notesInput.value.trim(),
    };

    const res = await withAsyncButtonState(
      confirmBtn,
      'Saving...',
      async () => {
        if (isEditing) {
          return await window.api.updateProjectCompetitor(project.path, compData);
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
