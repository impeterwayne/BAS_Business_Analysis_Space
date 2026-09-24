export interface ReakitStudioOptions {
  dom: any;
  state: any;
  icons: Record<string, string>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  createToolTab: (toolKey: string) => Promise<any>;
  fitActiveTerminal: () => void;
  startAutoRefreshLoop: () => void;
}

export function createReakitStudio(options: ReakitStudioOptions) {
  const { dom, state, icons, showToast, createToolTab, fitActiveTerminal, startAutoRefreshLoop } = options;

  let currentTarget = '';
  let isExecuting = false;

  function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  function appendLog(text: string, isError = false) {
    if (!dom.reakitConsoleOutput) return;
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] `;
    dom.reakitConsoleOutput.textContent += `\n${prefix}${text}`;
    dom.reakitConsoleOutput.scrollTop = dom.reakitConsoleOutput.scrollHeight;
  }

  function setExecuting(executing: boolean) {
    isExecuting = executing;
    if (dom.reakitConsoleSpinner) {
      if (executing) dom.reakitConsoleSpinner.classList.remove('hidden');
      else dom.reakitConsoleSpinner.classList.add('hidden');
    }
  }

  async function executeCommand(args: string[], options: { cwd?: string; refreshAfter?: boolean } = {}) {
    if (isExecuting) {
      showToast('A ReaKit command is already running.', 'warning');
      return;
    }

    const activeWorktreePath = state.activeWorktreePath;
    const workingDir = options.cwd || activeWorktreePath || process.cwd();

    setExecuting(true);
    appendLog(`> rea ${args.join(' ')}`);

    try {
      const res = await window.api.reakitRunCommand({
        args,
        cwd: workingDir,
      });

      if (res.stdout) appendLog(res.stdout.trim());
      if (res.stderr) appendLog(res.stderr.trim(), !res.success);

      if (res.success) {
        showToast(`Command executed successfully: rea ${args[0]}`, 'success');
      } else {
        showToast(`Command completed with exit code ${res.exitCode}`, 'error');
      }

      if (options.refreshAfter !== false && currentTarget) {
        await inspectTarget(currentTarget);
      }
    } catch (err: any) {
      appendLog(`Error: ${err?.message || err}`, true);
      showToast(err?.message || 'Command execution failed', 'error');
    } finally {
      setExecuting(false);
    }
  }

  async function loadKnownTargets() {
    const activeWorktreePath = state.activeWorktreePath;
    try {
      const targets = await window.api.reakitGetTargets({ worktreePath: activeWorktreePath });
      if (dom.reakitTargetSelect) {
        dom.reakitTargetSelect.innerHTML = '<option value="">(Select target)</option>';
        for (const t of targets) {
          const opt = document.createElement('option');
          opt.value = t.packageName;
          opt.textContent = t.alias ? `${t.alias} (${t.packageName})` : t.packageName;
          dom.reakitTargetSelect.appendChild(opt);
        }
      }

      // If we don't have an active target selected yet, select the first target found
      if (!currentTarget && targets.length > 0) {
        const first = targets[0];
        currentTarget = first.packageName;
        if (dom.reakitTargetInput) dom.reakitTargetInput.value = first.packageName;
        if (dom.reakitAliasInput) dom.reakitAliasInput.value = first.alias || '';
        if (dom.reakitTargetSelect) dom.reakitTargetSelect.value = first.packageName;
      }
    } catch (e) {
      console.error('Failed to load targets:', e);
    }
  }

  async function inspectTarget(packageName: string) {
    if (!packageName) return;
    const activeWorktreePath = state.activeWorktreePath;

    try {
      const status = await window.api.reakitGetTargetStatus({
        worktreePath: activeWorktreePath,
        packageName,
      });

      // 1. APKs
      if (dom.badgeApksStatus) {
        if (status.apks.count > 0) {
          dom.badgeApksStatus.textContent = `${status.apks.count} Ready 🟢`;
          dom.badgeApksStatus.className = 'reakit-badge badge-success';
        } else {
          dom.badgeApksStatus.textContent = 'Empty 🟡';
          dom.badgeApksStatus.className = 'reakit-badge badge-warning';
        }
      }
      if (dom.descApksStatus) {
        if (status.apks.count > 0) {
          dom.descApksStatus.textContent = status.apks.files.slice(0, 2).join(', ');
        } else {
          dom.descApksStatus.textContent = 'No APK packages downloaded yet.';
        }
      }
      if (dom.labelApksCount) {
        dom.labelApksCount.textContent = `${status.apks.count} files (${formatBytes(status.apks.sizeBytes)})`;
      }

      // 2. JADX
      if (dom.badgeJadxStatus) {
        if (status.jadx.exists && status.jadx.hasSource) {
          dom.badgeJadxStatus.textContent = 'Decompiled 🟢';
          dom.badgeJadxStatus.className = 'reakit-badge badge-success';
        } else {
          dom.badgeJadxStatus.textContent = 'Not Decompiled 🟡';
          dom.badgeJadxStatus.className = 'reakit-badge badge-warning';
        }
      }
      if (dom.descJadxStatus) {
        if (status.jadx.hasSource) {
          dom.descJadxStatus.textContent = 'Java Gradle project decompiled and ready for inspection.';
        } else {
          dom.descJadxStatus.textContent = 'Java Gradle source not yet decompiled.';
        }
      }

      // 3. Runtime
      if (dom.badgeRuntimeStatus) {
        if (status.runtime.exists && status.runtime.count > 0) {
          dom.badgeRuntimeStatus.textContent = `${status.runtime.count} Files 🟢`;
          dom.badgeRuntimeStatus.className = 'reakit-badge badge-success';
        } else {
          dom.badgeRuntimeStatus.textContent = 'Empty 🟡';
          dom.badgeRuntimeStatus.className = 'reakit-badge badge-warning';
        }
      }
      if (dom.descRuntimeStatus) {
        if (status.runtime.count > 0) {
          dom.descRuntimeStatus.textContent = `Extracted SQLite databases, shared preferences, caches.`;
        } else {
          dom.descRuntimeStatus.textContent = 'No sandbox runtime data extracted yet.';
        }
      }
      if (dom.labelRuntimeCount) {
        dom.labelRuntimeCount.textContent = `${status.runtime.count} files`;
      }

      // 4. Native
      if (dom.badgeNativeStatus) {
        if (status.native.exists && status.native.soFiles.length > 0) {
          dom.badgeNativeStatus.textContent = `${status.native.soFiles.length} .so 🟢`;
          dom.badgeNativeStatus.className = 'reakit-badge badge-success';
        } else {
          dom.badgeNativeStatus.textContent = 'None 🟡';
          dom.badgeNativeStatus.className = 'reakit-badge badge-warning';
        }
      }
      if (dom.descNativeStatus) {
        if (status.native.archs.length > 0) {
          dom.descNativeStatus.textContent = `Archs: ${status.native.archs.join(', ')} (${status.native.soFiles.length} libraries)`;
        } else {
          dom.descNativeStatus.textContent = 'No native .so libraries extracted yet.';
        }
      }
      if (dom.labelNativeCount) {
        dom.labelNativeCount.textContent = `${status.native.soFiles.length} .so files`;
      }

      // 5. Traffic
      if (dom.badgeTrafficStatus) {
        if (status.traffic.exists && status.traffic.count > 0) {
          dom.badgeTrafficStatus.textContent = `${status.traffic.count} Events 🟢`;
          dom.badgeTrafficStatus.className = 'reakit-badge badge-success';
        } else {
          dom.badgeTrafficStatus.textContent = 'None 🟡';
          dom.badgeTrafficStatus.className = 'reakit-badge badge-warning';
        }
      }
      if (dom.descTrafficStatus) {
        dom.descTrafficStatus.textContent = status.traffic.count > 0
          ? `${status.traffic.count} HTTP Toolkit captured exchange files.`
          : 'No API traffic captured yet.';
      }
      if (dom.labelTrafficCount) {
        dom.labelTrafficCount.textContent = `${status.traffic.count} events`;
      }
    } catch (e) {
      console.error('Failed to inspect target status:', e);
    }
  }

  async function checkDiagnostics() {
    if (dom.reakitEnvBadge) {
      dom.reakitEnvBadge.textContent = 'Checking ⏳';
      dom.reakitEnvBadge.className = 'reakit-badge badge-info';
    }

    try {
      const res = await window.api.reakitGetEnv();
      if (dom.reakitEnvBadge) {
        if (res.success) {
          dom.reakitEnvBadge.textContent = 'Ready 🟢';
          dom.reakitEnvBadge.className = 'reakit-badge badge-success';
        } else {
          dom.reakitEnvBadge.textContent = 'Issues ⚠️';
          dom.reakitEnvBadge.className = 'reakit-badge badge-warning';
        }
      }

      if (dom.reakitDeviceBadge) {
        if (res.devices && res.devices.length > 0) {
          dom.reakitDeviceBadge.textContent = `${res.devices.length} Device 📱`;
          dom.reakitDeviceBadge.className = 'reakit-badge badge-success';
        } else {
          dom.reakitDeviceBadge.textContent = 'No Device ⚠️';
          dom.reakitDeviceBadge.className = 'reakit-badge badge-warning';
        }
      }

      // Populate diagnostics table
      if (dom.reakitDiagnosticsTbody && res.components) {
        if (res.components.length === 0) {
          dom.reakitDiagnosticsTbody.innerHTML = `<tr><td colspan="3" style="padding: 16px; text-align: center; color: var(--text-tertiary);">No diagnostic components found.</td></tr>`;
        } else {
          dom.reakitDiagnosticsTbody.innerHTML = res.components.map((c: any) => {
            let badgeClass = 'badge-info';
            if (c.status === 'READY') badgeClass = 'badge-success';
            else if (c.status === 'WARN') badgeClass = 'badge-warning';
            else if (c.status === 'ERROR') badgeClass = 'badge-danger';
            return `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 8px 12px; font-weight: 600; color: var(--text-default);">${c.name}</td>
                <td style="padding: 8px 12px;"><span class="reakit-badge ${badgeClass}">${c.status}</span></td>
                <td style="padding: 8px 12px; font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">${c.details || '-'}</td>
              </tr>
            `;
          }).join('');
        }
      }

      // Populate device selector
      if (dom.reakitDeviceSelect && res.devices) {
        const currentVal = dom.reakitDeviceSelect.value;
        dom.reakitDeviceSelect.innerHTML = '<option value="">(Auto-detect connected device)</option>';
        for (const d of res.devices) {
          const opt = document.createElement('option');
          opt.value = d;
          opt.textContent = `${d} (Online)`;
          dom.reakitDeviceSelect.appendChild(opt);
        }
        if (currentVal) dom.reakitDeviceSelect.value = currentVal;
      }
    } catch (err: any) {
      if (dom.reakitEnvBadge) {
        dom.reakitEnvBadge.textContent = 'Error 🔴';
        dom.reakitEnvBadge.className = 'reakit-badge badge-danger';
      }
      console.error('Failed to get diagnostics:', err);
    }
  }

  function getSelectedTarget(): string {
    const inputVal = dom.reakitTargetInput?.value.trim() || '';
    if (inputVal) return inputVal;
    return dom.reakitTargetSelect?.value || '';
  }

  async function showReakitScreen() {
    const activeWorktreePath = state.activeWorktreePath;
    const activeWorktreeName = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'No active project';

    if (dom.reakitActiveWorktreeName) {
      dom.reakitActiveWorktreeName.textContent = activeWorktreeName || 'No active project';
    }

    // Hide other screens
    if (dom.settingsScreen) dom.settingsScreen.classList.add('hidden');
    if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
    if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');
    if (dom.planeTaskScreen) dom.planeTaskScreen.classList.add('hidden');

    if (dom.reakitScreen) dom.reakitScreen.classList.remove('hidden');

    await loadKnownTargets();
    if (currentTarget) {
      await inspectTarget(currentTarget);
    }
    await checkDiagnostics();
  }

  function hideReakitScreen() {
    if (dom.reakitScreen) dom.reakitScreen.classList.add('hidden');
    fitActiveTerminal();
    startAutoRefreshLoop();
  }

  function setupEventListeners() {
    // Top Close & Navigation
    if (dom.btnReakit) dom.btnReakit.addEventListener('click', showReakitScreen);
    if (dom.welcomeBtnReakit) dom.welcomeBtnReakit.addEventListener('click', showReakitScreen);
    if (dom.btnCloseReakitScreen) dom.btnCloseReakitScreen.addEventListener('click', hideReakitScreen);

    // Diagnostics / Terminal button in header
    if (dom.btnReakitRefreshEnv) {
      dom.btnReakitRefreshEnv.addEventListener('click', async () => {
        showToast('Running ReaKit diagnostics...', 'info');
        await checkDiagnostics();
        appendLog('Environment diagnostics refreshed.');
      });
    }

    if (dom.btnReakitOpenTerminal) {
      dom.btnReakitOpenTerminal.addEventListener('click', () => {
        createToolTab('rea');
      });
    }

    // Target inputs & actions
    if (dom.reakitTargetSelect) {
      dom.reakitTargetSelect.addEventListener('change', async () => {
        const val = dom.reakitTargetSelect.value;
        if (val) {
          currentTarget = val;
          if (dom.reakitTargetInput) dom.reakitTargetInput.value = val;
          await inspectTarget(val);
        }
      });
    }

    if (dom.reakitTargetInput) {
      dom.reakitTargetInput.addEventListener('change', async () => {
        const val = dom.reakitTargetInput.value.trim();
        if (val) {
          currentTarget = val;
          await inspectTarget(val);
        }
      });
    }

    if (dom.btnReakitSaveTarget) {
      dom.btnReakitSaveTarget.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const alias = dom.reakitAliasInput?.value.trim() || '';
        if (!pkg) {
          showToast('Please enter a target package name or Play Store URL.', 'warning');
          return;
        }
        const activeWorktreePath = state.activeWorktreePath;
        if (!activeWorktreePath) {
          showToast('No active worktree selected.', 'warning');
          return;
        }
        const res = await window.api.reakitSaveTarget({
          worktreePath: activeWorktreePath,
          packageName: pkg,
          alias,
        });
        if (res.success) {
          showToast(`Target "${pkg}" saved to workspace config.`, 'success');
          await loadKnownTargets();
          await inspectTarget(pkg);
        } else {
          showToast(res.error || 'Failed to save target.', 'error');
        }
      });
    }

    if (dom.btnReakitRefreshTarget) {
      dom.btnReakitRefreshTarget.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (pkg) {
          showToast(`Inspecting target: ${pkg}`, 'info');
          await inspectTarget(pkg);
        }
      });
    }

    if (dom.btnReakitOpenFolder) {
      dom.btnReakitOpenFolder.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const activeWorktreePath = state.activeWorktreePath;
        if (activeWorktreePath) {
          const targetDir = pkg ? `${activeWorktreePath}\\workspaces\\${pkg}` : `${activeWorktreePath}\\workspaces`;
          await window.api.openInExplorer(targetDir);
        }
      });
    }

    // Artifact Card Folder Buttons
    if (dom.btnReakitOpenApks) {
      dom.btnReakitOpenApks.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\apks`);
      });
    }

    if (dom.btnReakitOpenJadx) {
      dom.btnReakitOpenJadx.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\jadx_src`);
      });
    }

    if (dom.btnReakitOpenSourceCode) {
      dom.btnReakitOpenSourceCode.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInEditor(`${wt}\\workspaces\\${pkg}\\jadx_src`);
      });
    }

    if (dom.btnReakitOpenRuntime) {
      dom.btnReakitOpenRuntime.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\runtime`);
      });
    }

    if (dom.btnReakitOpenNative) {
      dom.btnReakitOpenNative.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\native`);
      });
    }

    if (dom.btnReakitOpenTraffic) {
      dom.btnReakitOpenTraffic.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\traffic`);
      });
    }

    // Tab Switching
    const tabPills = document.querySelectorAll('.reakit-tab-pill');
    tabPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        tabPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const tabKey = (pill as HTMLElement).dataset.tab;
        const allPanes = document.querySelectorAll('.reakit-tab-content');
        allPanes.forEach(pane => pane.classList.add('hidden'));

        const targetPane = document.getElementById(`reakit-pane-${tabKey}`);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // ── Static Pipeline Actions ──
    if (dom.btnReakitRunPipeline) {
      dom.btnReakitRunPipeline.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please enter a target package or Play Store URL first.', 'warning');
          return;
        }
        const heap = dom.reakitPipelineHeap?.value || '16g';
        const skipDecode = dom.reakitPipelineSkipDecode?.checked;
        const source = dom.reakitDlSource?.value || 'apkcombo';

        const args = ['pipeline', '-t', pkg, '-s', source, '--heap', heap];
        if (skipDecode) args.push('--skip-decode');

        await executeCommand(args);
      });
    }

    if (dom.btnReakitRunDl) {
      dom.btnReakitRunDl.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        const source = dom.reakitDlSource?.value || 'apkcombo';
        await executeCommand(['dl', pkg, '-s', source]);
      });
    }

    if (dom.btnReakitRunDecode) {
      dom.btnReakitRunDecode.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        const heap = dom.reakitPipelineHeap?.value || '8g';
        await executeCommand(['decode', pkg, '--heap', heap]);
      });
    }

    if (dom.btnReakitLaunchJadxGui) {
      dom.btnReakitLaunchJadxGui.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        showToast('Launching JADX GUI...', 'info');
        const res = await window.api.reakitLaunchJadxGui({
          target: pkg,
          worktreePath: state.activeWorktreePath,
        });
        if (res.success) {
          showToast('JADX GUI launched.', 'success');
        } else {
          showToast(res.error || 'Failed to launch JADX GUI.', 'error');
        }
      });
    }

    if (dom.btnReakitRunApktoolD) {
      dom.btnReakitRunApktoolD.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        await executeCommand(['apktool', 'd', `${pkg}.apk`]);
      });
    }

    if (dom.btnReakitRunApktoolB) {
      dom.btnReakitRunApktoolB.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        await executeCommand(['apktool', 'b', pkg]);
      });
    }

    // ── Device Automation Actions ──
    if (dom.btnReakitRefreshDevices) {
      dom.btnReakitRefreshDevices.addEventListener('click', async () => {
        showToast('Scanning devices...', 'info');
        await checkDiagnostics();
      });
    }

    if (dom.btnReakitMirror) {
      dom.btnReakitMirror.addEventListener('click', async () => {
        const serial = dom.reakitDeviceSelect?.value || undefined;
        showToast('Launching Screen Mirror...', 'info');
        const res = await window.api.reakitLaunchMirror({ serial });
        if (res.success) {
          showToast('Screen mirror window opened.', 'success');
        } else {
          showToast(res.error || 'Failed to open screen mirror.', 'error');
        }
      });
    }

    if (dom.btnReakitPullRuntime) {
      dom.btnReakitPullRuntime.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify target package for runtime extraction.', 'warning');
          return;
        }
        await executeCommand(['pull', pkg]);
      });
    }

    if (dom.btnReakitCaptureUi) {
      dom.btnReakitCaptureUi.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) {
          showToast('Please select a project worktree first.', 'warning');
          return;
        }
        const pkg = getSelectedTarget() || 'screen';
        showToast('Capturing screenshot and layout XML dump...', 'info');
        const res = await window.api.scrcpyCaptureUi({ worktreePath: wt, prefix: pkg });
        if (res.success) {
          showToast(`Captured evidence saved to docs/spec/evidence/`, 'success');
          appendLog(`Screenshot saved: ${res.relativeScreenshot}`);
          appendLog(`UI Hierarchy XML saved: ${res.relativeDump}`);
        } else {
          showToast(res.error || 'Failed to capture UI.', 'error');
        }
      });
    }

    if (dom.btnReakitTap) {
      dom.btnReakitTap.addEventListener('click', async () => {
        const x = dom.reakitTapX?.value || '540';
        const y = dom.reakitTapY?.value || '1200';
        await executeCommand(['scrcpy', 'tap', String(x), String(y)], { refreshAfter: false });
      });
    }

    if (dom.btnReakitTypeText) {
      dom.btnReakitTypeText.addEventListener('click', async () => {
        const txt = dom.reakitTextInput?.value || '';
        if (!txt) return;
        await executeCommand(['scrcpy', 'write', txt], { refreshAfter: false });
        if (dom.reakitTextInput) dom.reakitTextInput.value = '';
      });
    }

    if (dom.btnReakitKeyHome) {
      dom.btnReakitKeyHome.addEventListener('click', async () => {
        await executeCommand(['scrcpy', 'key', 'HOME'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitKeyBack) {
      dom.btnReakitKeyBack.addEventListener('click', async () => {
        await executeCommand(['scrcpy', 'key', 'BACK'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitKeyAppswitch) {
      dom.btnReakitKeyAppswitch.addEventListener('click', async () => {
        await executeCommand(['scrcpy', 'key', 'APP_SWITCH'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitDaemonStatus) {
      dom.btnReakitDaemonStatus.addEventListener('click', async () => {
        await executeCommand(['scrcpy', 'daemon', 'status'], { refreshAfter: false });
      });
    }

    // ── Native & Ghidra Actions ──
    if (dom.btnReakitNativeExtract) {
      dom.btnReakitNativeExtract.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        await executeCommand(['native', 'extract', pkg]);
      });
    }

    if (dom.btnReakitNativeDoctor) {
      dom.btnReakitNativeDoctor.addEventListener('click', async () => {
        await executeCommand(['native', 'doctor'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitNativeServe) {
      dom.btnReakitNativeServe.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg) {
          showToast('Please specify a target package first.', 'warning');
          return;
        }
        const lib = dom.reakitNativeLibInput?.value.trim();
        const args = ['native', 'serve', pkg];
        if (lib) args.push('--lib', lib);
        args.push('-d');
        await executeCommand(args, { refreshAfter: false });
      });
    }

    // ── Traffic Actions ──
    if (dom.btnReakitHttpStream) {
      dom.btnReakitHttpStream.addEventListener('click', async () => {
        createToolTab('rea');
      });
    }

    if (dom.btnReakitProxyOn) {
      dom.btnReakitProxyOn.addEventListener('click', async () => {
        await executeCommand(['http', 'proxy', 'on'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitProxyOff) {
      dom.btnReakitProxyOff.addEventListener('click', async () => {
        await executeCommand(['http', 'proxy', 'off'], { refreshAfter: false });
      });
    }

    if (dom.btnReakitExportCert) {
      dom.btnReakitExportCert.addEventListener('click', async () => {
        await executeCommand(['http', 'cert'], { refreshAfter: false });
      });
    }

    // ── Agentic Harness Actions ──
    if (dom.btnReakitHarnessInit) {
      dom.btnReakitHarnessInit.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) {
          showToast('Please select a project worktree first.', 'warning');
          return;
        }
        const profile = dom.reakitHarnessProfileSelect?.value || 'full';
        showToast(`Injecting ReaKit Reverse Engineering Harness (${profile})...`, 'info');
        setExecuting(true);
        appendLog(`> rea harness init "${wt}" --profile ${profile} --force`);

        try {
          const res = await window.api.reakitHarnessAction({
            action: 'init',
            targetPath: wt,
            profile,
          });
          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr, !res.success);
          if (res.success) {
            showToast('ReaKit Harness successfully injected into project!', 'success');
          } else {
            showToast('Harness injection completed with warnings.', 'warning');
          }
        } catch (e: any) {
          appendLog(`Error: ${e?.message || e}`, true);
        } finally {
          setExecuting(false);
        }
      });
    }

    if (dom.btnReakitHarnessStatus) {
      dom.btnReakitHarnessStatus.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) return;
        setExecuting(true);
        appendLog(`> rea harness status "${wt}"`);
        try {
          const res = await window.api.reakitHarnessAction({
            action: 'status',
            targetPath: wt,
          });
          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr);
        } finally {
          setExecuting(false);
        }
      });
    }

    if (dom.btnReakitHarnessUpdate) {
      dom.btnReakitHarnessUpdate.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) return;
        setExecuting(true);
        appendLog(`> rea harness update "${wt}"`);
        try {
          const res = await window.api.reakitHarnessAction({
            action: 'update',
            targetPath: wt,
          });
          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr);
          showToast('Harness updated.', 'info');
        } finally {
          setExecuting(false);
        }
      });
    }

    if (dom.btnReakitHarnessRemove) {
      dom.btnReakitHarnessRemove.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) return;
        setExecuting(true);
        appendLog(`> rea harness remove "${wt}"`);
        try {
          const res = await window.api.reakitHarnessAction({
            action: 'remove',
            targetPath: wt,
          });
          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr);
          showToast('Harness removed from project.', 'info');
        } finally {
          setExecuting(false);
        }
      });
    }

    // ── Diagnostics Actions ──
    if (dom.btnReakitDiagnosticsRun) {
      dom.btnReakitDiagnosticsRun.addEventListener('click', async () => {
        showToast('Running diagnostic checks...', 'info');
        await checkDiagnostics();
      });
    }

    if (dom.btnReakitDiagnosticsInstall) {
      dom.btnReakitDiagnosticsInstall.addEventListener('click', async () => {
        showToast('Running rea install environment configurator...', 'info');
        await executeCommand(['install']);
        await checkDiagnostics();
      });
    }

    // ── Console Actions ──
    if (dom.btnReakitCopyConsole) {
      dom.btnReakitCopyConsole.addEventListener('click', () => {
        const text = dom.reakitConsoleOutput?.textContent || '';
        navigator.clipboard.writeText(text);
        showToast('Console output copied to clipboard!', 'info');
      });
    }

    if (dom.btnReakitClearConsole) {
      dom.btnReakitClearConsole.addEventListener('click', () => {
        if (dom.reakitConsoleOutput) dom.reakitConsoleOutput.textContent = 'Console cleared.';
      });
    }
  }

  setupEventListeners();

  return {
    showReakitScreen,
    hideReakitScreen,
    checkDiagnostics,
    inspectTarget,
  };
}
