// Joins with the separator the install root already uses (backslash on Windows, slash on macOS/Linux).
const joinPath = (base, leaf) => `${base}${String(base).includes('\\') ? '\\' : '/'}${leaf}`;

// Checks for Python and mobilerun and installs what is missing (app-managed venvs, see main/bakit/mobilerunSetup).
// onReady runs once everything is in place, either already or after an install from this modal.
async function openMobilerunSetupModal({ dom, configureModalFooter, showModal, hideModal, showToast, esc, api, intro = '', onReady = null, onDismiss = null }) {
  dom.modalTitle.textContent = 'Mobilerun Setup';
  dom.modalBody.innerHTML = `
    ${intro ? `<p class="form-hint" style="margin-top:0;">${esc(intro)}</p>` : ''}
    <div id="mobilerun-setup-checks" style="display:flex; flex-direction:column; gap:6px;">
      <div style="display:flex; align-items:center; gap:8px; color:var(--text-secondary); font-size:12px;"><span class="spinner"></span> Checking Python and mobilerun...</div>
    </div>
    <pre id="mobilerun-setup-log" style="display:none; margin-top:12px; max-height:220px; overflow:auto; padding:8px 10px; font-size:11px; line-height:1.45; white-space:pre-wrap; word-break:break-all; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); color:var(--text-secondary);"></pre>
    <p class="form-hint" id="mobilerun-setup-hint"></p>
  `;
  const { 'modal-cancel': closeBtn, 'modal-confirm': installBtn } = configureModalFooter([
    { id: 'modal-cancel', label: 'Not now' },
    { id: 'modal-confirm', label: 'Install', kind: 'primary' },
  ]);
  const checksEl = dom.modalBody.querySelector('#mobilerun-setup-checks');
  const logEl = dom.modalBody.querySelector('#mobilerun-setup-log');
  const hintEl = dom.modalBody.querySelector('#mobilerun-setup-hint');
  installBtn.disabled = true;

  let closed = false;
  let unsubscribe = null;
  const close = () => {
    closed = true;
    if (unsubscribe) unsubscribe();
    hideModal();
  };
  closeBtn.addEventListener('click', () => {
    if (onDismiss) onDismiss();
    close();
  });

  const row = (ok, label, detail) => `
    <div style="display:flex; align-items:flex-start; gap:8px; padding:6px 10px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
      <span style="flex-shrink:0; width:14px; font-weight:700; color:${ok ? 'var(--green)' : 'var(--orange)'};">${ok ? '✓' : '•'}</span>
      <div style="min-width:0;">
        <div style="font-size:12px; font-weight:600; color:var(--text-default);">${esc(label)}</div>
        <div style="font-size:11px; color:var(--text-tertiary); word-break:break-all;">${esc(detail)}</div>
      </div>
    </div>`;

  const render = (status) => {
    const ready = !!status.mcpPython && !status.mcpOutdated && !!status.cliPath;
    const mcpDetail = !status.mcpPython
      ? `Not installed: the bundled server goes to ${joinPath(status.installRoot, 'mcp')}`
      : status.mcpOutdated ? `Update available from this BA Space build · ${status.mcpPython}` : status.mcpPython;
    checksEl.innerHTML = [
      row(!!status.python, 'Python 3.11 - 3.13', status.python ? `${status.python.version} · ${status.python.path}` : 'Not found: Python 3.13 will be installed with winget (current user).'),
      row(!!status.mcpPython && !status.mcpOutdated, 'mobilerun-mcp (MCP server)', mcpDetail),
      row(!!status.cliPath, 'mobilerun CLI (Portal setup)', status.cliPath || `Not installed: goes to ${joinPath(status.installRoot, 'cli')}`),
    ].join('');
    hintEl.textContent = ready
      ? 'Everything is installed. You can register the Mobilerun MCP in a worktree from the BAKit toolkit screen.'
      : 'The first install downloads Python packages (about 1.2 GB on disk) and takes a few minutes.';
    installBtn.style.display = ready ? 'none' : '';
    if (!status.installing) installBtn.textContent = status.mcpPython && status.mcpOutdated ? 'Update' : 'Install';
    installBtn.disabled = ready || status.installing;
    if (status.installing) installBtn.innerHTML = '<span class="spinner"></span> Installing...';
    closeBtn.textContent = ready ? 'Close' : 'Not now';
    return ready;
  };

  installBtn.addEventListener('click', async () => {
    installBtn.disabled = true;
    installBtn.innerHTML = '<span class="spinner"></span> Installing...';
    closeBtn.textContent = 'Hide';
    logEl.style.display = '';
    logEl.textContent = '';
    unsubscribe = api.onMobilerunSetupLog((line) => {
      logEl.textContent += `${line}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    });
    const res = await api.installMobilerun();
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (!res.success) {
      showToast(`Mobilerun setup failed: ${res.error}`, 'error');
      if (closed) return;
      installBtn.disabled = false;
      installBtn.textContent = 'Retry';
      closeBtn.textContent = 'Close';
      return;
    }
    showToast('Python and mobilerun are installed.', 'success');
    if (onReady) await onReady();
    if (closed) return;
    render(await api.getMobilerunSetupStatus());
  });

  showModal();
  const ready = render(await api.getMobilerunSetupStatus());
  if (ready && onReady && !closed) {
    close();
    await onReady();
  }
}

module.exports = {
  openMobilerunSetupModal,
};
