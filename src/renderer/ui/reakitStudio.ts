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
  let currentLocalApk = '';
  let isExecuting = false;
  let lastDiscoveredApkPath = '';
  let lastDiscoveredSourceDir = '';

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

  function getSelectedTarget(): string {
    const inputVal = dom.reakitTargetInput?.value.trim() || '';
    if (inputVal) return inputVal;
    return dom.reakitTargetSelect?.value || '';
  }

  function getResolvedDestDir(): string {
    const wt = state.activeWorktreePath || 'D:\\';
    const destType = dom.reakitDestSelect?.value || 'jadx_src';
    const target = getSelectedTarget();
    const pkg = target ? target.replace(/[^a-zA-Z0-9_.]/g, '_').split(/[\\/]/).pop() || 'target' : 'target';

    if (destType === 'root') {
      return wt;
    }
    if (destType === 'package') {
      return `${wt}\\${pkg}`;
    }
    return `${wt}\\jadx_src`;
  }

  function updateDestPreview() {
    if (dom.reakitDestPathPreview) {
      dom.reakitDestPathPreview.textContent = getResolvedDestDir();
    }
  }

  async function executeCommand(args: string[], options: { cwd?: string; refreshAfter?: boolean } = {}) {
    if (isExecuting) {
      showToast('A ReaKit operation is currently running.', 'warning');
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

      if (options.refreshAfter !== false && activeWorktreePath) {
        await inspectWorkspaceAndTarget();
      }
    } catch (err: any) {
      appendLog(`Execution error: ${err?.message || err}`, true);
      showToast(`Error: ${err?.message || err}`, 'error');
    } finally {
      setExecuting(false);
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

      if (!currentTarget && targets.length > 0) {
        const first = targets[0];
        currentTarget = first.packageName;
        if (dom.reakitTargetInput && !dom.reakitTargetInput.value) {
          dom.reakitTargetInput.value = first.packageName;
        }
        if (dom.reakitAliasInput && first.alias) {
          dom.reakitAliasInput.value = first.alias;
        }
        if (dom.reakitTargetSelect) {
          dom.reakitTargetSelect.value = first.packageName;
        }
      }
    } catch (e) {
      console.error('Failed to load targets:', e);
    }
  }

  async function inspectWorkspaceAndTarget(packageName?: string) {
    const activeWorktreePath = state.activeWorktreePath;
    const target = packageName || getSelectedTarget();

    // 1. Update Workspace Banner & Info
    if (dom.reakitActiveWorktreeName) {
      const name = activeWorktreePath ? activeWorktreePath.split(/[\\/]/).pop() : 'No active workspace';
      dom.reakitActiveWorktreeName.textContent = name || 'No active workspace';
    }

    if (dom.reakitActiveWorktreePath) {
      dom.reakitActiveWorktreePath.textContent = activeWorktreePath || 'Please select a project worktree from the sidebar.';
    }

    if (dom.reakitWsBranchBadge) {
      const project = state.projects?.find((p: any) => (p.worktrees || []).some((wt: any) => wt.path === activeWorktreePath));
      const wtInfo = project?.worktrees?.find((w: any) => w.path === activeWorktreePath);
      dom.reakitWsBranchBadge.textContent = wtInfo?.branch || 'worktree';
    }

    updateDestPreview();

    if (!activeWorktreePath) {
      if (dom.badgeApksStatus) {
        dom.badgeApksStatus.textContent = 'No Workspace';
        dom.badgeApksStatus.className = 'reakit-badge badge-warning';
      }
      if (dom.descApksStatus) {
        dom.descApksStatus.textContent = 'Select an active worktree to view artifacts.';
      }
      if (dom.badgeJadxStatus) {
        dom.badgeJadxStatus.textContent = 'No Workspace';
        dom.badgeJadxStatus.className = 'reakit-badge badge-warning';
      }
      if (dom.descJadxStatus) {
        dom.descJadxStatus.textContent = 'Select an active worktree to view artifacts.';
      }
      return;
    }

    try {
      const status = await window.api.reakitGetTargetStatus({
        worktreePath: activeWorktreePath,
        packageName: target,
      });

      // 1. APKs Tile
      if (status.apks.count > 0) {
        lastDiscoveredApkPath = status.apks.items?.[0]?.path || '';
        if (dom.badgeApksStatus) {
          dom.badgeApksStatus.textContent = `${status.apks.count} Ready 🟢`;
          dom.badgeApksStatus.className = 'reakit-badge badge-success';
        }
        if (dom.descApksStatus) {
          const names = status.apks.files.slice(0, 2).join(', ');
          const extra = status.apks.files.length > 2 ? ` (+${status.apks.files.length - 2} more)` : '';
          dom.descApksStatus.textContent = `${names}${extra}`;
        }
        if (dom.labelApksCount) {
          dom.labelApksCount.textContent = `${status.apks.count} file(s) (${formatBytes(status.apks.sizeBytes)})`;
        }
      } else {
        lastDiscoveredApkPath = '';
        if (dom.badgeApksStatus) {
          dom.badgeApksStatus.textContent = 'Empty 🟡';
          dom.badgeApksStatus.className = 'reakit-badge badge-warning';
        }
        if (dom.descApksStatus) {
          dom.descApksStatus.textContent = 'No APK package downloaded in active workspace.';
        }
        if (dom.labelApksCount) {
          dom.labelApksCount.textContent = '0 files';
        }
      }

      // 2. JADX Tile
      if (status.jadx.exists && status.jadx.hasSource) {
        lastDiscoveredSourceDir = status.jadx.sourceDir || `${activeWorktreePath}\\jadx_src`;
        const folderName = lastDiscoveredSourceDir.split(/[\\/]/).pop() || 'workspace';
        if (dom.badgeJadxStatus) {
          dom.badgeJadxStatus.textContent = 'Decompiled 🟢';
          dom.badgeJadxStatus.className = 'reakit-badge badge-success';
        }
        if (dom.descJadxStatus) {
          dom.descJadxStatus.textContent = `Java Gradle project ready in ${folderName}/ folder.`;
        }
        if (dom.labelJadxCount) {
          dom.labelJadxCount.textContent = `${status.jadx.fileCount} source files`;
        }
      } else {
        lastDiscoveredSourceDir = '';
        if (dom.badgeJadxStatus) {
          dom.badgeJadxStatus.textContent = 'Not Decompiled 🟡';
          dom.badgeJadxStatus.className = 'reakit-badge badge-warning';
        }
        if (dom.descJadxStatus) {
          dom.descJadxStatus.textContent = 'Java Gradle project not yet decompiled in workspace.';
        }
        if (dom.labelJadxCount) {
          dom.labelJadxCount.textContent = '0 sources';
        }
      }

      // 3. Runtime Sandbox Tile
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
        dom.descRuntimeStatus.textContent = status.runtime.count > 0
          ? `${status.runtime.count} extracted runtime DBs, XML prefs, & caches.`
          : 'App SQLite DBs, SharedPrefs & caches.';
      }
      if (dom.labelRuntimeCount) {
        dom.labelRuntimeCount.textContent = `${status.runtime.count} files`;
      }

      // 4. Native Binaries Tile
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
        if (status.native.archs && status.native.archs.length > 0) {
          dom.descNativeStatus.textContent = `Archs: ${status.native.archs.join(', ')} (${status.native.soFiles.length} libraries)`;
        } else {
          dom.descNativeStatus.textContent = 'No native .so libraries extracted yet.';
        }
      }
      if (dom.labelNativeCount) {
        dom.labelNativeCount.textContent = `${status.native.soFiles.length} .so files`;
      }

      // 5. Traffic Logs Tile
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
          ? `${status.traffic.count} HTTP Toolkit / mitmproxy captured exchange files.`
          : 'No API traffic captured yet.';
      }
      if (dom.labelTrafficCount) {
        dom.labelTrafficCount.textContent = `${status.traffic.count} events`;
      }
    } catch (e) {
      console.error('Failed to inspect workspace target status:', e);
    }
  }

  async function showReakitScreen() {
    if (dom.settingsScreen) dom.settingsScreen.classList.add('hidden');
    if (dom.symlinkScreen) dom.symlinkScreen.classList.add('hidden');
    if (dom.agentToolkitScreen) dom.agentToolkitScreen.classList.add('hidden');

    if (dom.reakitScreen) dom.reakitScreen.classList.remove('hidden');

    await loadKnownTargets();
    await inspectWorkspaceAndTarget();
    await checkDiagnostics();
  }

  function hideReakitScreen() {
    if (dom.reakitScreen) dom.reakitScreen.classList.add('hidden');
    fitActiveTerminal();
    startAutoRefreshLoop();
  }

  function setupEventListeners() {
    // Navigation / Screen toggles
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

    // Top Worktree Open Folder
    if (dom.btnReakitOpenWsFolder) {
      dom.btnReakitOpenWsFolder.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (wt) await window.api.openInExplorer(wt);
      });
    }

    // Target inputs & actions
    if (dom.reakitTargetInput) {
      dom.reakitTargetInput.addEventListener('input', () => {
        currentTarget = dom.reakitTargetInput.value.trim();
        updateDestPreview();
      });
      dom.reakitTargetInput.addEventListener('change', async () => {
        const val = dom.reakitTargetInput.value.trim();
        if (val) {
          currentTarget = val;
          await inspectWorkspaceAndTarget(val);
        }
      });
    }

    if (dom.reakitTargetSelect) {
      dom.reakitTargetSelect.addEventListener('change', async () => {
        const val = dom.reakitTargetSelect.value;
        if (val) {
          currentTarget = val;
          if (dom.reakitTargetInput) dom.reakitTargetInput.value = val;
          updateDestPreview();
          await inspectWorkspaceAndTarget(val);
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
          await inspectWorkspaceAndTarget(pkg);
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
          await inspectWorkspaceAndTarget(pkg);
        } else {
          await inspectWorkspaceAndTarget();
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

    if (dom.reakitDestSelect) {
      dom.reakitDestSelect.addEventListener('change', updateDestPreview);
    }

    // ── Local File Picker ──
    if (dom.btnReakitBrowseApk) {
      dom.btnReakitBrowseApk.addEventListener('click', async () => {
        try {
          const selected = await window.api.reakitSelectApkFile();
          if (selected) {
            currentLocalApk = selected;
            if (dom.reakitLocalApkPath) {
              dom.reakitLocalApkPath.value = selected;
            }
            if (dom.btnReakitClearLocalApk) {
              dom.btnReakitClearLocalApk.style.display = 'inline-flex';
            }
            appendLog(`Selected local package: ${selected}`);
            showToast('Local APK selected.', 'info');
          }
        } catch (err: any) {
          showToast(err?.message || 'Failed to select file', 'error');
        }
      });
    }

    if (dom.btnReakitClearLocalApk) {
      dom.btnReakitClearLocalApk.addEventListener('click', () => {
        currentLocalApk = '';
        if (dom.reakitLocalApkPath) dom.reakitLocalApkPath.value = '';
        if (dom.btnReakitClearLocalApk) dom.btnReakitClearLocalApk.style.display = 'none';
        appendLog('Cleared local APK file selection.');
      });
    }

    // ── Artifact Tile Actions ──
    if (dom.btnReakitOpenApks) {
      dom.btnReakitOpenApks.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        if (!wt) return;
        const dir = lastDiscoveredApkPath ? lastDiscoveredApkPath.replace(/[\\/][^\\/]+$/, '') : `${wt}\\apks`;
        await window.api.openInExplorer(dir);
      });
    }

    if (dom.btnReakitGuiFromTile) {
      dom.btnReakitGuiFromTile.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        const apk = lastDiscoveredApkPath || currentLocalApk || undefined;
        showToast('Opening APK in JADX GUI...', 'info');
        await window.api.reakitLaunchJadxGui({ apkPath: apk, worktreePath: wt });
      });
    }

    if (dom.btnReakitOpenSourceCode) {
      dom.btnReakitOpenSourceCode.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        const targetDir = lastDiscoveredSourceDir || `${wt}\\jadx_src`;
        if (targetDir) {
          await window.api.openInEditor(targetDir);
          showToast('Opened decompiled source in editor.', 'info');
        }
      });
    }

    if (dom.btnReakitOpenJadx) {
      dom.btnReakitOpenJadx.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        const targetDir = lastDiscoveredSourceDir || `${wt}\\jadx_src`;
        if (targetDir) {
          await window.api.openInExplorer(targetDir);
        }
      });
    }

    if (dom.btnReakitOpenRuntime) {
      dom.btnReakitOpenRuntime.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\runtime`);
        else if (wt) await window.api.openInExplorer(`${wt}\\runtime`);
      });
    }

    if (dom.btnReakitOpenNative) {
      dom.btnReakitOpenNative.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\native`);
        else if (wt) await window.api.openInExplorer(`${wt}\\native`);
      });
    }

    if (dom.btnReakitOpenTraffic) {
      dom.btnReakitOpenTraffic.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        const wt = state.activeWorktreePath;
        if (wt && pkg) await window.api.openInExplorer(`${wt}\\workspaces\\${pkg}\\traffic`);
        else if (wt) await window.api.openInExplorer(`${wt}\\traffic`);
      });
    }

    // ── Navigation Tab Switching ──
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

    // ── Tab 1: Static Pipeline Actions ──
    if (dom.btnReakitRunPipeline) {
      dom.btnReakitRunPipeline.addEventListener('click', async () => {
        if (isExecuting) {
          showToast('An operation is already in progress.', 'warning');
          return;
        }

        const wt = state.activeWorktreePath;
        if (!wt) {
          showToast('Please select or open an active workspace first.', 'warning');
          return;
        }

        const target = getSelectedTarget();
        const destDir = getResolvedDestDir();
        const heap = dom.reakitPipelineHeap?.value || '8g';
        const threads = dom.reakitPipelineThreads?.value || 'auto';
        const exportGradle = dom.reakitOptExportGradle ? dom.reakitOptExportGradle.checked : true;
        const deobf = dom.reakitOptDeobf ? dom.reakitOptDeobf.checked : true;
        const showBadCode = dom.reakitOptShowBadCode ? dom.reakitOptShowBadCode.checked : true;
        const skipDecode = dom.reakitPipelineSkipDecode ? dom.reakitPipelineSkipDecode.checked : false;
        const source = dom.reakitDlSource?.value || 'apkcombo';

        // Case A: Local APK file is selected
        if (currentLocalApk) {
          appendLog(`=== Starting Decompilation of Local File ===\nFile: ${currentLocalApk}\nOutput: ${destDir}`);
          setExecuting(true);
          showToast('Decompiling local APK to workspace...', 'info');

          try {
            const res = await window.api.reakitDecompileApk({
              apkPath: currentLocalApk,
              outputDir: destDir,
              worktreePath: wt,
              heap,
              threads,
              exportGradle,
              deobf,
              showBadCode,
            });

            if (res.stdout) appendLog(res.stdout);
            if (res.stderr) appendLog(res.stderr, !res.success);

            if (res.success) {
              showToast(`Decompilation finished! (${res.fileCount} source files)`, 'success');
              appendLog(`Decompilation completed successfully in ${destDir}`);
            } else {
              showToast('Decompilation completed with warnings or errors.', 'warning');
            }
          } catch (e: any) {
            appendLog(`Error: ${e?.message || e}`, true);
            showToast(e?.message || 'Decompilation failed', 'error');
          } finally {
            setExecuting(false);
            await inspectWorkspaceAndTarget(target);
          }
          return;
        }

        // Case B: Download and Decompile from Store
        if (!target) {
          showToast('Please enter a target package name or Play Store URL.', 'warning');
          return;
        }

        appendLog(`=== Starting Download & Decompile Pipeline ===\nTarget: ${target}\nSource Provider: ${source}\nDestination: ${destDir}\nHeap: ${heap}`);
        setExecuting(true);
        showToast(`Downloading & decompiling ${target}...`, 'info');

        try {
          if (skipDecode) {
            const res = await window.api.reakitDownloadApk({
              target,
              source,
              outputDir: `${wt}\\apks`,
              worktreePath: wt,
            });
            if (res.stdout) appendLog(res.stdout);
            if (res.stderr) appendLog(res.stderr, !res.success);
            if (res.success) {
              showToast(`APK downloaded to ${wt}\\apks`, 'success');
            }
          } else {
            const res = await window.api.reakitPipelineApk({
              target,
              source,
              outputDir: destDir,
              worktreePath: wt,
              heap,
              threads,
              exportGradle,
              deobf,
              showBadCode,
            });

            if (res.stdout) appendLog(res.stdout);
            if (res.stderr) appendLog(res.stderr, !res.success);

            if (res.success) {
              showToast(`Download & Decompile complete! (${res.fileCount} sources)`, 'success');
              appendLog(`Success: project decompiled to ${destDir}`);
              await window.api.reakitSaveTarget({ worktreePath: wt, packageName: target });
              await loadKnownTargets();
            } else {
              showToast('Pipeline completed with errors. See log.', 'error');
            }
          }
        } catch (e: any) {
          appendLog(`Pipeline error: ${e?.message || e}`, true);
          showToast(e?.message || 'Execution failed', 'error');
        } finally {
          setExecuting(false);
          await inspectWorkspaceAndTarget(target);
        }
      });
    }

    if (dom.btnReakitRunDl) {
      dom.btnReakitRunDl.addEventListener('click', async () => {
        if (isExecuting) {
          showToast('An operation is already in progress.', 'warning');
          return;
        }

        const wt = state.activeWorktreePath;
        if (!wt) {
          showToast('Please select an active workspace first.', 'warning');
          return;
        }

        const target = getSelectedTarget();
        if (!target) {
          showToast('Please specify a target package name or Play Store URL.', 'warning');
          return;
        }

        const source = dom.reakitDlSource?.value || 'apkcombo';
        const apksDir = `${wt}\\apks`;

        appendLog(`=== Downloading APK ===\nTarget: ${target}\nSource: ${source}\nOutput: ${apksDir}`);
        setExecuting(true);
        showToast(`Downloading APK for ${target}...`, 'info');

        try {
          const res = await window.api.reakitDownloadApk({
            target,
            source,
            outputDir: apksDir,
            worktreePath: wt,
          });

          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr, !res.success);

          if (res.success && res.downloadedFiles.length > 0) {
            showToast(`Downloaded ${res.downloadedFiles.length} APK package(s) successfully!`, 'success');
            appendLog(`Downloaded files:\n${res.downloadedFiles.join('\n')}`);
            await window.api.reakitSaveTarget({ worktreePath: wt, packageName: target });
            await loadKnownTargets();
          } else {
            showToast('Download completed without new APK files.', 'warning');
          }
        } catch (e: any) {
          appendLog(`Download error: ${e?.message || e}`, true);
          showToast(e?.message || 'Download failed', 'error');
        } finally {
          setExecuting(false);
          await inspectWorkspaceAndTarget(target);
        }
      });
    }

    if (dom.btnReakitRunDecode) {
      dom.btnReakitRunDecode.addEventListener('click', async () => {
        if (isExecuting) {
          showToast('An operation is already in progress.', 'warning');
          return;
        }

        const wt = state.activeWorktreePath;
        if (!wt) {
          showToast('Please select an active workspace first.', 'warning');
          return;
        }

        const target = getSelectedTarget();
        const apkFile = currentLocalApk || lastDiscoveredApkPath || undefined;
        const destDir = getResolvedDestDir();
        const heap = dom.reakitPipelineHeap?.value || '8g';
        const threads = dom.reakitPipelineThreads?.value || 'auto';
        const exportGradle = dom.reakitOptExportGradle ? dom.reakitOptExportGradle.checked : true;
        const deobf = dom.reakitOptDeobf ? dom.reakitOptDeobf.checked : true;
        const showBadCode = dom.reakitOptShowBadCode ? dom.reakitOptShowBadCode.checked : true;

        if (!apkFile && !target) {
          showToast('Please select a local APK file or specify target package to decompile.', 'warning');
          return;
        }

        appendLog(`=== Decompiling APK ===\nAPK: ${apkFile || target}\nOutput Destination: ${destDir}`);
        setExecuting(true);
        showToast('Decompiling APK to workspace...', 'info');

        try {
          const res = await window.api.reakitDecompileApk({
            apkPath: apkFile,
            packageName: target,
            outputDir: destDir,
            worktreePath: wt,
            heap,
            threads,
            exportGradle,
            deobf,
            showBadCode,
          });

          if (res.stdout) appendLog(res.stdout);
          if (res.stderr) appendLog(res.stderr, !res.success);

          if (res.success) {
            showToast(`Decompilation completed! (${res.fileCount} source files)`, 'success');
            appendLog(`Decompiled files ready at: ${destDir}`);
          } else {
            showToast(res.stderr || 'Decompilation completed with warnings.', 'warning');
          }
        } catch (e: any) {
          appendLog(`Decompilation error: ${e?.message || e}`, true);
          showToast(e?.message || 'Decompilation failed', 'error');
        } finally {
          setExecuting(false);
          await inspectWorkspaceAndTarget(target);
        }
      });
    }

    if (dom.btnReakitLaunchJadxGui) {
      dom.btnReakitLaunchJadxGui.addEventListener('click', async () => {
        const wt = state.activeWorktreePath;
        const target = getSelectedTarget();
        const apk = currentLocalApk || lastDiscoveredApkPath || undefined;

        showToast('Launching JADX GUI...', 'info');
        appendLog(`> Launching JADX GUI (target: ${apk || target || 'default'})...`);

        try {
          const res = await window.api.reakitLaunchJadxGui({
            target,
            apkPath: apk,
            worktreePath: wt,
          });
          if (res.success) {
            showToast('JADX GUI launched.', 'success');
          } else {
            showToast(res.error || 'Failed to launch JADX GUI', 'error');
          }
        } catch (e: any) {
          showToast(e?.message || 'Error launching JADX GUI', 'error');
        }
      });
    }

    if (dom.btnReakitRunApktoolD) {
      dom.btnReakitRunApktoolD.addEventListener('click', async () => {
        const pkg = getSelectedTarget();
        if (!pkg && !lastDiscoveredApkPath) {
          showToast('Please specify a target package or select an APK first.', 'warning');
          return;
        }
        const targetFile = lastDiscoveredApkPath || `${pkg}.apk`;
        await executeCommand(['apktool', 'd', targetFile]);
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

    // ── Tab 2: Device Automation Actions ──
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
          showToast('Captured evidence saved to docs/spec/evidence/', 'success');
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

    // ── Tab 3: Native & Ghidra Actions ──
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

    // ── Tab 4: Traffic Actions ──
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

    // ── Tab 5: Agentic Harness Actions ──
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

    // ── Tab 6: Diagnostics Actions ──
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

    // ── Console Log Actions ──
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
    inspectWorkspaceAndTarget,
  };
}
