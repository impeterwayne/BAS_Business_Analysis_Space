export interface DeviceManagerContext {
  dom: any;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  getActiveWorktreePath: () => string | null;
  refreshDashboardDeviceChip?: () => Promise<void>;
  icons?: Record<string, string>;
}

const SVG_ICONS = {
  device: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3" ry="3"></rect><line x1="10" y1="5" x2="14" y2="5"></line><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
  deviceWifi: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3" ry="3"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line><path d="M10 8a3 3 0 0 1 4 0"></path><path d="M8 5a6 6 0 0 1 8 0"></path></svg>`,
  screen: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  capture: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
  copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
};

export class DeviceManagerScreen {
  private dom: any;
  private showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  private getActiveWorktreePath: () => string | null;
  private refreshDashboardDeviceChip?: () => Promise<void>;
  private devices: any[] = [];
  private activeSerial: string | null = null;
  private isRefreshing = false;

  constructor(ctx: DeviceManagerContext) {
    this.dom = ctx.dom;
    this.showToast = ctx.showToast;
    this.getActiveWorktreePath = ctx.getActiveWorktreePath;
    this.refreshDashboardDeviceChip = ctx.refreshDashboardDeviceChip;
    this.bindEvents();
  }

  private bindEvents(): void {
    // Top Refresh button
    const btnRefresh = document.getElementById('btn-dm-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.refreshDevices(true);
      });
    }

    // Restart ADB server button
    const btnRestartAdb = document.getElementById('btn-dm-restart-adb');
    if (btnRestartAdb) {
      btnRestartAdb.addEventListener('click', async () => {
        this.showToast('Restarting ADB server...', 'info');
        try {
          const res = await (window as any).api.deviceRestartServer();
          if (res?.success) {
            this.showToast('ADB server restarted successfully', 'success');
            await this.refreshDevices();
          } else {
            this.showToast(`Restart failed: ${res?.error || 'Unknown error'}`, 'error');
          }
        } catch (err: any) {
          this.showToast(`Error: ${err?.message || err}`, 'error');
        }
      });
    }

    // Launch Mirror from Presets
    const btnLaunchMirror = document.getElementById('btn-dm-launch-mirror');
    if (btnLaunchMirror) {
      btnLaunchMirror.addEventListener('click', async () => {
        const stayAwake = (document.getElementById('dm-mirror-stay-awake') as HTMLInputElement)?.checked ?? true;
        const turnScreenOff = (document.getElementById('dm-mirror-screen-off') as HTMLInputElement)?.checked ?? false;
        const alwaysOnTop = (document.getElementById('dm-mirror-always-on-top') as HTMLInputElement)?.checked ?? false;
        const maxSizeEl = document.getElementById('dm-mirror-max-size') as HTMLSelectElement | null;
        const maxSize = maxSizeEl ? parseInt(maxSizeEl.value, 10) || 0 : 0;

        this.showToast('Launching Screen Mirror...', 'info');
        try {
          const res = await (window as any).api.deviceMirror({
            serial: this.activeSerial || undefined,
            stayAwake,
            turnScreenOff,
            alwaysOnTop,
            maxSize: maxSize > 0 ? maxSize : undefined,
          });

          if (res && !res.success) {
            this.showToast(`Mirror failed: ${res.error || 'Check scrcpy installation'}`, 'error');
          }
        } catch (err: any) {
          this.showToast(`Mirror error: ${err?.message || err}`, 'error');
        }
      });
    }

    // Hardware key buttons
    const keyButtons = document.querySelectorAll('.dm-key-btn');
    keyButtons.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const action = target.getAttribute('data-action');
        const keycode = target.getAttribute('data-key');

        if (action === 'capture-now') {
          await this.captureActiveDevice();
          return;
        }

        if (keycode) {
          if (!this.activeSerial) {
            this.showToast('No active device selected', 'error');
            return;
          }

          try {
            const res = await (window as any).api.deviceSendKey({
              serial: this.activeSerial,
              keycode: parseInt(keycode, 10),
            });
            if (res && !res.success) {
              this.showToast(`Key event failed: ${res.error}`, 'error');
            }
          } catch (err: any) {
            this.showToast(`Error sending key: ${err?.message || err}`, 'error');
          }
        }
      });
    });

    // Delegation for device roster actions
    const listContainer = document.getElementById('dm-device-list');
    if (listContainer) {
      listContainer.addEventListener('click', async (e) => {
        const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
        if (!target) return;

        const action = target.getAttribute('data-action');
        const serial = target.getAttribute('data-serial') || '';

        if (!serial) return;

        switch (action) {
          case 'set-active':
            await this.setActiveDevice(serial);
            break;
          case 'mirror':
            await this.mirrorDevice(serial);
            break;
          case 'capture':
            await this.captureDevice(serial);
            break;
          case 'reboot':
            await this.rebootDevice(serial);
            break;
          case 'setup-portal':
            await this.setupMobilerunPortal(serial);
            break;
          case 'copy-serial':
            await navigator.clipboard.writeText(serial);
            this.showToast(`Copied serial ${serial} to clipboard`, 'success');
            break;
        }
      });
    }
  }

  public async show(): Promise<void> {
    const screen = document.getElementById('device-manager-screen');
    if (screen) {
      screen.classList.remove('hidden');
    }
    await this.refreshDevices();
  }

  public hide(): void {
    const screen = document.getElementById('device-manager-screen');
    if (screen) {
      screen.classList.add('hidden');
    }
  }

  public async refreshDevices(manual = false): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      const res = await (window as any).api.deviceList();
      if (res?.success && Array.isArray(res.devices)) {
        this.devices = res.devices;
        const activeDev = this.devices.find((d) => d.isActive);
        this.activeSerial = activeDev ? activeDev.serial : (this.devices.length ? this.devices[0].serial : null);
      } else {
        this.devices = [];
        this.activeSerial = null;
      }

      this.render();

      if (this.refreshDashboardDeviceChip) {
        await this.refreshDashboardDeviceChip();
      }

      if (manual) {
        this.showToast(`Device list updated (${this.devices.length} detected)`, 'info');
      }
    } catch (err: any) {
      this.devices = [];
      this.activeSerial = null;
      this.render();
      if (manual) {
        this.showToast(`Failed to scan devices: ${err?.message || err}`, 'error');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  private async setActiveDevice(serial: string): Promise<void> {
    try {
      const res = await (window as any).api.deviceSetActive(serial);
      if (res?.success) {
        this.activeSerial = res.activeSerial;
        this.devices.forEach((d) => {
          d.isActive = d.serial === this.activeSerial;
        });
        this.render();
        this.showToast(`Active target set to ${serial}`, 'success');
        if (this.refreshDashboardDeviceChip) {
          await this.refreshDashboardDeviceChip();
        }
      }
    } catch (err: any) {
      this.showToast(`Failed to set active device: ${err?.message || err}`, 'error');
    }
  }

  private async mirrorDevice(serial: string): Promise<void> {
    this.showToast(`Launching screen mirror for ${serial}...`, 'info');
    try {
      const stayAwake = (document.getElementById('dm-mirror-stay-awake') as HTMLInputElement)?.checked ?? true;
      const turnScreenOff = (document.getElementById('dm-mirror-screen-off') as HTMLInputElement)?.checked ?? false;
      const alwaysOnTop = (document.getElementById('dm-mirror-always-on-top') as HTMLInputElement)?.checked ?? false;
      const maxSizeEl = document.getElementById('dm-mirror-max-size') as HTMLSelectElement | null;
      const maxSize = maxSizeEl ? parseInt(maxSizeEl.value, 10) || 0 : 0;

      const res = await (window as any).api.deviceMirror({
        serial,
        stayAwake,
        turnScreenOff,
        alwaysOnTop,
        maxSize: maxSize > 0 ? maxSize : undefined,
      });

      if (res && !res.success) {
        this.showToast(`Mirror failed: ${res.error}`, 'error');
      }
    } catch (err: any) {
      this.showToast(`Mirror failed: ${err?.message || err}`, 'error');
    }
  }

  private async captureDevice(serial: string): Promise<void> {
    const worktreePath = this.getActiveWorktreePath();
    if (!worktreePath) {
      this.showToast('Please select an active project/worktree first to store capture evidence.', 'error');
      return;
    }

    this.showToast(`Capturing screenshot & UI hierarchy for ${serial}...`, 'info');
    try {
      const res = await (window as any).api.deviceCaptureUi({
        serial,
        worktreePath,
      });

      if (res?.success) {
        this.showToast(`Captured evidence saved to ${res.relativeScreenshot}`, 'success');
      } else {
        this.showToast(`Capture failed: ${res?.error || 'Make sure device is responsive'}`, 'error');
      }
    } catch (err: any) {
      this.showToast(`Capture failed: ${err?.message || err}`, 'error');
    }
  }

  private async captureActiveDevice(): Promise<void> {
    if (!this.activeSerial) {
      this.showToast('No active device selected for capture', 'error');
      return;
    }
    await this.captureDevice(this.activeSerial);
  }

  private async rebootDevice(serial: string): Promise<void> {
    if (!confirm(`Are you sure you want to reboot device ${serial}?`)) {
      return;
    }

    this.showToast(`Rebooting ${serial}...`, 'info');
    try {
      const res = await (window as any).api.deviceReboot({ serial });
      if (res?.success) {
        this.showToast(`Device ${serial} reboot triggered`, 'success');
        await this.refreshDevices();
      } else {
        this.showToast(`Reboot failed: ${res?.error}`, 'error');
      }
    } catch (err: any) {
      this.showToast(`Error: ${err?.message || err}`, 'error');
    }
  }

  private async setupMobilerunPortal(serial: string): Promise<void> {
    this.showToast(`Setting up Mobilerun Portal on ${serial}...`, 'info');
    try {
      const res = await (window as any).api.deviceSetupMobilerun({ serial });
      if (res?.success) {
        this.showToast(`Mobilerun Portal configured on ${serial}`, 'success');
        await this.refreshDevices();
      } else {
        this.showToast(`Mobilerun setup: ${res?.error || 'Failed'}`, 'error');
      }
    } catch (err: any) {
      this.showToast(`Setup error: ${err?.message || err}`, 'error');
    }
  }

  private render(): void {
    // Update metric indicators
    const statTotal = document.getElementById('dm-stat-total');
    const statActive = document.getElementById('dm-stat-active');
    const rosterBadge = document.getElementById('dm-roster-badge');

    const totalCount = this.devices.length;
    const activeDev = this.devices.find((d) => d.isActive);

    if (statTotal) statTotal.textContent = String(totalCount);
    if (rosterBadge) rosterBadge.textContent = `${totalCount} ${totalCount === 1 ? 'Device' : 'Devices'}`;

    if (statActive) {
      if (activeDev) {
        statActive.textContent = `${activeDev.marketName || activeDev.model} (${activeDev.serial})`;
        statActive.classList.add('active-highlight');
      } else {
        statActive.textContent = 'None Selected';
        statActive.classList.remove('active-highlight');
      }
    }

    // Render Device list or Empty State
    const listEl = document.getElementById('dm-device-list');
    const emptyEl = document.getElementById('dm-empty-state');

    if (!listEl) return;

    if (totalCount === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    listEl.innerHTML = this.devices
      .map((dev) => {
        const isOnline = dev.state === 'device';
        const isUnauthorized = dev.state === 'unauthorized';
        const isOffline = dev.state === 'offline';
        const isWifi = dev.connectionType === 'wifi';
        const isEmulator = dev.connectionType === 'emulator';

        let statusClass = 'offline';
        let statusLabel = 'Offline';
        if (isOnline) {
          statusClass = 'online';
          statusLabel = 'Online';
        } else if (isUnauthorized) {
          statusClass = 'unauthorized';
          statusLabel = 'Unauthorized';
        }

        // Specs badges
        const specsHtml: string[] = [];

        if (dev.androidVersion) {
          specsHtml.push(`
            <span class="dm-spec-pill" title="Android OS Version">
              <span>Android ${this.escape(dev.androidVersion)}</span>
              ${dev.sdkVersion ? `<span style="opacity: 0.6;">(API ${this.escape(dev.sdkVersion)})</span>` : ''}
            </span>
          `);
        }

        if (dev.screenResolution) {
          specsHtml.push(`
            <span class="dm-spec-pill" title="Screen Resolution & Density">
              <span>${this.escape(dev.screenResolution)}</span>
              ${dev.screenDensity ? `<span style="opacity: 0.6;">@ ${this.escape(dev.screenDensity)}</span>` : ''}
            </span>
          `);
        }

        if (dev.batteryLevel !== null) {
          const chargingIcon = dev.isCharging ? '⚡' : '';
          specsHtml.push(`
            <span class="dm-spec-pill" title="Battery status: ${this.escape(dev.batteryStatus)}">
              <span>🔋 ${dev.batteryLevel}% ${chargingIcon}</span>
            </span>
          `);
        }

        // Connection type pill
        let connLabel = 'USB';
        if (isWifi) connLabel = `Wi-Fi (${dev.ipAddress || dev.serial})`;
        else if (isEmulator) connLabel = 'Emulator (AVD)';
        specsHtml.push(`
          <span class="dm-spec-pill accent-tint" title="Connection mode">
            <span>${this.escape(connLabel)}</span>
          </span>
        `);

        // Mobilerun portal status
        if (dev.mobilerunPortalInstalled) {
          specsHtml.push(`
            <span class="dm-spec-pill portal-ready" title="Mobilerun Portal is installed and available for AI agent competitor flows">
              <span>✓ Mobilerun Portal Ready</span>
            </span>
          `);
        }

        return `
          <div class="dm-device-card ${dev.isActive ? 'is-active' : ''}" data-serial="${this.escape(dev.serial)}">
            <div class="dm-device-header">
              <div class="dm-device-title-wrap">
                <div class="dm-device-icon ${dev.isActive ? 'active' : ''}">
                  ${isWifi ? SVG_ICONS.deviceWifi : SVG_ICONS.device}
                </div>
                <div>
                  <h4 class="dm-device-name">
                    <span>${this.escape(dev.marketName || dev.model || 'Android Device')}</span>
                    ${dev.isActive ? `<span class="dm-active-pill">Active Target</span>` : ''}
                  </h4>
                  <div class="dm-device-serial">
                    <span>Serial: ${this.escape(dev.serial)}</span>
                    <button type="button" class="dash-icon-btn" data-action="copy-serial" data-serial="${this.escape(dev.serial)}" title="Copy serial to clipboard">
                      ${SVG_ICONS.copy}
                    </button>
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="dm-status-badge ${statusClass}">
                  ● ${statusLabel}
                </span>
                ${
                  !dev.isActive && isOnline
                    ? `
                  <button type="button" class="btn-secondary btn-small" data-action="set-active" data-serial="${this.escape(dev.serial)}" title="Set as default device for screen mirror and UI capture">
                    <span>Select Target</span>
                  </button>
                `
                    : ''
                }
              </div>
            </div>

            <!-- Specs row -->
            <div class="dm-device-specs">
              ${specsHtml.join('')}
            </div>

            <!-- Action Toolbar on card -->
            <div class="dm-device-footer">
              <div class="dm-card-actions">
                <button type="button" class="btn-primary btn-small" data-action="mirror" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Launch Scrcpy desktop screen mirror">
                  ${SVG_ICONS.screen}
                  <span>Mirror Screen</span>
                </button>
                <button type="button" class="btn-secondary btn-small" data-action="capture" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Capture high-res screenshot and UI dump to project evidence">
                  ${SVG_ICONS.capture}
                  <span>Capture UI</span>
                </button>
                ${
                  !dev.mobilerunPortalInstalled && isOnline
                    ? `
                  <button type="button" class="btn-secondary btn-small" data-action="setup-portal" data-serial="${this.escape(dev.serial)}" title="Setup Mobilerun Portal for AI competitor analysis">
                    <span>Setup Portal</span>
                  </button>
                `
                    : ''
                }
              </div>

              <div>
                <button type="button" class="btn-secondary btn-small" data-action="reboot" data-serial="${this.escape(dev.serial)}" title="Reboot Android device" style="color: var(--text-tertiary);">
                  <span>Reboot</span>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  private escape(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
