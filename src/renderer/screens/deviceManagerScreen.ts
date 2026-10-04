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
  screenshot: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
  dump: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  combine: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
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
  private isStreaming = false;
  private streamUrl: string | null = null;
  private streamWidth = 1080;
  private streamHeight = 2400;
  private streamDeviceName = '';

  constructor(ctx: DeviceManagerContext) {
    this.dom = ctx.dom;
    this.showToast = ctx.showToast;
    this.getActiveWorktreePath = ctx.getActiveWorktreePath;
    this.refreshDashboardDeviceChip = ctx.refreshDashboardDeviceChip;
    this.bindEvents();
    this.setupTouchInteraction();
  }

  private bindEvents(): void {
    // Live Stream Toggle button in Remote header
    const btnStreamToggle = document.getElementById('btn-dm-stream-toggle');
    if (btnStreamToggle) {
      btnStreamToggle.addEventListener('click', () => {
        this.toggleLiveStream();
      });
    }

    // Live Stream Start button in Idle viewport placeholder
    const btnIdleStart = document.getElementById('btn-dm-phone-idle-start');
    if (btnIdleStart) {
      btnIdleStart.addEventListener('click', () => {
        this.startLiveStream();
      });
    }

    // Back to Device List from Remote Screen
    const btnBackToList = document.getElementById('btn-dm-back-to-list');
    if (btnBackToList) {
      btnBackToList.addEventListener('click', () => {
        this.closeRemoteScreen(true);
      });
    }

    // Close Remote Screen button
    const btnCloseRemote = document.getElementById('btn-close-device-remote-screen');
    if (btnCloseRemote) {
      btnCloseRemote.addEventListener('click', () => {
        this.closeRemoteScreen(true);
      });
    }

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

        if (action === 'capture-screenshot') {
          await this.captureActiveDevice('screenshot');
          return;
        }
        if (action === 'capture-dump') {
          await this.captureActiveDevice('dump');
          return;
        }
        if (action === 'capture-combine' || action === 'capture-now') {
          await this.captureActiveDevice('both');
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

    // Capture action buttons (Active device)
    const captureBtns = document.querySelectorAll('.dm-capture-btn');
    captureBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const action = target.getAttribute('data-action');
        if (action === 'capture-screenshot') {
          await this.captureActiveDevice('screenshot');
        } else if (action === 'capture-dump') {
          await this.captureActiveDevice('dump');
        } else if (action === 'capture-combine') {
          await this.captureActiveDevice('both');
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
          case 'stream':
          case 'open-remote':
            await this.openRemoteScreen(serial);
            break;
          case 'mirror':
            await this.mirrorDevice(serial);
            break;
          case 'capture-screenshot':
            await this.captureDevice(serial, 'screenshot');
            break;
          case 'capture-dump':
            await this.captureDevice(serial, 'dump');
            break;
          case 'capture-combine':
          case 'capture':
            await this.captureDevice(serial, 'both');
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

    // Quick text input injection & fast actions
    const quickInput = document.getElementById('dm-quick-text-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('btn-dm-quick-text-send');
    const pasteBtn = document.getElementById('btn-dm-quick-text-paste');
    const clearBtn = document.getElementById('btn-dm-quick-text-clear');

    const updateClearBtn = () => {
      if (clearBtn && quickInput) {
        clearBtn.classList.toggle('hidden', !quickInput.value);
      }
    };

    quickInput?.addEventListener('input', updateClearBtn);
    clearBtn?.addEventListener('click', () => {
      if (quickInput) {
        quickInput.value = '';
        updateClearBtn();
        quickInput.focus();
      }
    });

    const sendQuickText = async () => {
      if (!this.activeSerial) {
        this.showToast('No active device selected', 'error');
        return;
      }
      const text = quickInput?.value || '';
      if (!text) return;
      try {
        await (window as any).api.deviceStreamText({ serial: this.activeSerial, text });
        this.showToast('Injected text to device', 'success');
        if (quickInput) {
          quickInput.value = '';
          updateClearBtn();
        }
      } catch (err: any) {
        this.showToast(`Failed to inject text: ${err?.message || err}`, 'error');
      }
    };

    sendBtn?.addEventListener('click', sendQuickText);
    quickInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendQuickText();
      }
    });

    // Instant 1-Click Paste & Send
    pasteBtn?.addEventListener('click', async () => {
      if (!this.activeSerial) {
        this.showToast('No active device selected', 'error');
        return;
      }
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          await (window as any).api.deviceStreamText({ serial: this.activeSerial, text });
          this.showToast(`Pasted and sent ${text.length} characters to device`, 'success');
        } else {
          this.showToast('Clipboard is empty', 'info');
        }
      } catch (err: any) {
        this.showToast('Clipboard access denied or empty', 'error');
      }
    });

    // Stream action buttons (Notification, rotate, etc.)
    const actionBtns = document.querySelectorAll('[data-stream-action]');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-stream-action');
        if (!action || !this.activeSerial) return;
        try {
          await (window as any).api.deviceStreamAction({ serial: this.activeSerial, action });
        } catch (err: any) {
          this.showToast(`Action failed: ${err?.message || err}`, 'error');
        }
      });
    });
  }

  public async show(): Promise<void> {
    const remoteScreen = document.getElementById('device-remote-screen');
    if (remoteScreen) {
      remoteScreen.classList.add('hidden');
    }
    const screen = document.getElementById('device-manager-screen');
    if (screen) {
      screen.classList.remove('hidden');
    }
    await this.refreshDevices();
  }

  public async openRemoteScreen(serial?: string): Promise<void> {
    const targetSerial = serial || this.activeSerial || (this.devices.length ? this.devices[0].serial : null);
    if (!targetSerial) {
      this.showToast('No active device available to control', 'error');
      return;
    }

    this.activeSerial = targetSerial;
    this.devices.forEach((d) => {
      d.isActive = d.serial === this.activeSerial;
    });
    this.render();

    // Hide Device Manager List Screen
    const dmScreen = document.getElementById('device-manager-screen');
    if (dmScreen) {
      dmScreen.classList.add('hidden');
    }

    // Show Dedicated Live Remote Screen
    const remoteScreen = document.getElementById('device-remote-screen');
    if (remoteScreen) {
      remoteScreen.classList.remove('hidden');
    }

    // Automatically connect and start live mirror at FHD 60FPS
    await this.startLiveStream(targetSerial);
  }

  public async closeRemoteScreen(backToManager = true): Promise<void> {
    await this.stopLiveStream(true);
    const remoteScreen = document.getElementById('device-remote-screen');
    if (remoteScreen) {
      remoteScreen.classList.add('hidden');
    }
    if (backToManager) {
      await this.show();
    }
  }

  public hide(): void {
    const dmScreen = document.getElementById('device-manager-screen');
    if (dmScreen) {
      dmScreen.classList.add('hidden');
    }
    const remoteScreen = document.getElementById('device-remote-screen');
    if (remoteScreen) {
      remoteScreen.classList.add('hidden');
    }
    // Cleanly stop live stream when navigating away to conserve resources
    if (this.isStreaming) {
      this.stopLiveStream(true);
    }
  }

  public isRemoteScreenVisible(): boolean {
    const remoteScreen = document.getElementById('device-remote-screen');
    return !!remoteScreen && !remoteScreen.classList.contains('hidden');
  }

  public async toggleLiveStream(): Promise<void> {
    if (this.isStreaming) {
      await this.stopLiveStream();
    } else {
      await this.startLiveStream();
    }
  }

  public async startLiveStream(serial?: string): Promise<void> {
    const targetSerial = serial || this.activeSerial;
    if (!targetSerial) {
      this.showToast('No active device selected for live mirror', 'error');
      return;
    }

    if (this.isStreaming && targetSerial === this.activeSerial) {
      return;
    }

    if (this.isStreaming && targetSerial !== this.activeSerial) {
      await this.stopLiveStream(true);
    }

    this.activeSerial = targetSerial;
    this.devices.forEach((d) => {
      d.isActive = d.serial === this.activeSerial;
    });
    this.render();

    this.setStreamUIState('loading');
    this.showToast(`Starting FHD 60FPS screen mirror for ${targetSerial}...`, 'info');

    try {
      const res = await (window as any).api.deviceStreamStart({
        serial: targetSerial,
        maxSize: 0, // 0 = native / Full HD
        maxFps: 60,
        quality: 3,
      });

      if (res?.success && res.streamUrl) {
        this.isStreaming = true;
        this.streamUrl = res.streamUrl;
        this.streamWidth = res.width || 1080;
        this.streamHeight = res.height || 2400;
        this.streamDeviceName = res.deviceName || '';
        this.updateAdaptiveViewport(this.streamWidth, this.streamHeight);
        this.setStreamUIState('active');
        this.showToast('In-App Live Screen Mirror active', 'success');
      } else {
        this.setStreamUIState('idle');
        this.showToast(`Live mirror failed: ${res?.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      this.setStreamUIState('idle');
      this.showToast(`Live mirror error: ${err?.message || err}`, 'error');
    }
  }

  public async stopLiveStream(silent = false): Promise<void> {
    if (!this.isStreaming && !this.streamUrl) return;

    try {
      await (window as any).api.deviceStreamStop({ serial: this.activeSerial || undefined });
    } catch (_) {}

    this.isStreaming = false;
    this.streamUrl = null;
    this.setStreamUIState('idle');

    if (!silent) {
      this.showToast('In-App Live Screen Mirror stopped', 'info');
    }
  }

  public updateAdaptiveViewport(width: number, height: number): void {
    const frame = document.getElementById('dm-phone-frame');
    if (!frame || !width || !height) return;

    this.streamWidth = width;
    this.streamHeight = height;

    frame.style.setProperty('--device-aspect', `${width} / ${height}`);
    frame.style.aspectRatio = `${width} / ${height}`;

    if (width > height) {
      frame.classList.add('is-landscape');
    } else {
      frame.classList.remove('is-landscape');
    }

    const resTag = document.getElementById('dm-stream-res-tag');
    if (resTag && this.isStreaming) {
      resTag.textContent = `${width}×${height} • 60fps`;
    }
  }

  private setStreamUIState(state: 'idle' | 'loading' | 'active'): void {
    const idleEl = document.getElementById('dm-stream-idle-state');
    const loadingEl = document.getElementById('dm-stream-loading-state');
    const activeEl = document.getElementById('dm-stream-active-state');
    const feed = document.getElementById('dm-live-stream-feed') as HTMLImageElement | null;
    const badge = document.getElementById('dm-stream-status-badge');
    const badgeText = document.getElementById('dm-stream-status-text');
    const toggleBtn = document.getElementById('btn-dm-stream-toggle');
    const toggleText = document.getElementById('btn-dm-stream-toggle-text');
    const playIcon = toggleBtn?.querySelector('.dm-stream-play-icon');
    const stopIcon = toggleBtn?.querySelector('.dm-stream-stop-icon');
    const resTag = document.getElementById('dm-stream-res-tag');

    if (state === 'idle') {
      idleEl?.classList.remove('hidden');
      loadingEl?.classList.add('hidden');
      activeEl?.classList.add('hidden');
      if (feed) {
        feed.onerror = null;
        feed.onload = null;
        feed.src = '';
      }

      badge?.classList.remove('is-live');
      badge?.classList.add('is-standby');
      if (badgeText) badgeText.textContent = 'Standby';

      toggleBtn?.classList.remove('is-streaming');
      if (toggleText) toggleText.textContent = 'Start Mirror';
      playIcon?.classList.remove('hidden');
      stopIcon?.classList.add('hidden');

      if (resTag) {
        resTag.textContent = 'FHD 60fps';
      }

      const frame = document.getElementById('dm-phone-frame');
      if (frame) {
        frame.style.removeProperty('--device-aspect');
        frame.style.removeProperty('aspect-ratio');
        frame.classList.remove('is-landscape');
      }
    } else if (state === 'loading') {
      idleEl?.classList.add('hidden');
      loadingEl?.classList.remove('hidden');
      activeEl?.classList.add('hidden');

      badge?.classList.remove('is-live');
      badge?.classList.add('is-standby');
      if (badgeText) badgeText.textContent = 'Connecting';

      toggleBtn?.classList.add('is-streaming');
      if (toggleText) toggleText.textContent = 'Connecting...';
      playIcon?.classList.add('hidden');
      stopIcon?.classList.remove('hidden');
    } else if (state === 'active') {
      idleEl?.classList.add('hidden');
      loadingEl?.classList.add('hidden');
      activeEl?.classList.remove('hidden');

      if (feed && this.streamUrl) {
        feed.onerror = (e) => {
          console.error('[DeviceStream] Feed load error:', e);
          if (this.isStreaming && this.streamUrl) {
            setTimeout(() => {
              if (this.isStreaming && feed) {
                feed.src = `${this.streamUrl}?retry=${Date.now()}`;
              }
            }, 800);
          }
        };
        feed.onload = () => {
          if (feed.naturalWidth && feed.naturalHeight) {
            this.updateAdaptiveViewport(feed.naturalWidth, feed.naturalHeight);
          }
        };
        feed.src = `${this.streamUrl}?t=${Date.now()}`;
      }

      badge?.classList.remove('is-standby');
      badge?.classList.add('is-live');
      if (badgeText) badgeText.textContent = 'LIVE';

      toggleBtn?.classList.add('is-streaming');
      if (toggleText) toggleText.textContent = 'Stop Mirror';
      playIcon?.classList.add('hidden');
      stopIcon?.classList.remove('hidden');

      if (resTag) {
        resTag.textContent = `${this.streamWidth}×${this.streamHeight} • 60fps`;
      }
    }
  }

  private setupTouchInteraction(): void {
    const feed = document.getElementById('dm-live-stream-feed') as HTMLImageElement | null;
    const rippleContainer = document.getElementById('dm-touch-ripple-container');
    if (!feed) return;

    let isPointerDown = false;
    let startDevX = 0;
    let startDevY = 0;
    let lastDevX = 0;
    let lastDevY = 0;
    let startTime = 0;
    let hasMoved = false;

    const mapCoords = (e: MouseEvent): { x: number; y: number } | null => {
      const rect = feed.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const elemW = rect.width;
      const elemH = rect.height;
      const natW = feed.naturalWidth || this.streamWidth || 1080;
      const natH = feed.naturalHeight || this.streamHeight || 2400;

      const elemAspect = elemW / elemH;
      const natAspect = natW / natH;

      let renderW = elemW;
      let renderH = elemH;
      let offsetX = 0;
      let offsetY = 0;

      if (elemAspect > natAspect) {
        renderH = elemH;
        renderW = elemH * natAspect;
        offsetX = (elemW - renderW) / 2;
      } else {
        renderW = elemW;
        renderH = elemW / natAspect;
        offsetY = (elemH - renderH) / 2;
      }

      const relX = clickX - offsetX;
      const relY = clickY - offsetY;

      if (relX < 0 || relX > renderW || relY < 0 || relY > renderH) {
        return null;
      }

      const normX = Math.max(0, Math.min(1, relX / renderW));
      const normY = Math.max(0, Math.min(1, relY / renderH));

      return {
        x: Math.round(normX * natW),
        y: Math.round(normY * natH),
      };
    };

    const showRipple = (e: MouseEvent) => {
      if (!rippleContainer) return;
      const rect = feed.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rip = document.createElement('div');
      rip.className = 'dm-touch-ripple';
      rip.style.left = `${x}px`;
      rip.style.top = `${y}px`;
      rippleContainer.appendChild(rip);
      setTimeout(() => rip.remove(), 400);
    };

    feed.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Only primary button for tap/swipe
      if (!this.isStreaming || !this.activeSerial) return;
      const coords = mapCoords(e);
      if (!coords) return;

      isPointerDown = true;
      startDevX = coords.x;
      startDevY = coords.y;
      lastDevX = coords.x;
      lastDevY = coords.y;
      startTime = Date.now();
      hasMoved = false;

      showRipple(e);
      try {
        feed.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    feed.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const coords = mapCoords(e);
      if (!coords) return;

      const dist = Math.hypot(coords.x - startDevX, coords.y - startDevY);
      if (dist > 15) {
        hasMoved = true;
      }
      lastDevX = coords.x;
      lastDevY = coords.y;
    });

    const onPointerUp = async (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      try {
        feed.releasePointerCapture(e.pointerId);
      } catch (_) {}

      const duration = Date.now() - startTime;
      const dist = Math.hypot(lastDevX - startDevX, lastDevY - startDevY);

      if (!hasMoved || (dist < 20 && duration < 350)) {
        // Tap
        try {
          await (window as any).api.deviceStreamTouch({
            serial: this.activeSerial,
            type: 'tap',
            x: startDevX,
            y: startDevY,
          });
        } catch (_) {}
      } else {
        // Swipe
        try {
          await (window as any).api.deviceStreamTouch({
            serial: this.activeSerial,
            type: 'swipe',
            x: startDevX,
            y: startDevY,
            endX: lastDevX,
            endY: lastDevY,
            durationMs: Math.max(120, Math.min(500, duration)),
          });
        } catch (_) {}
      }
    };

    feed.addEventListener('pointerup', onPointerUp);
    feed.addEventListener('pointercancel', () => {
      isPointerDown = false;
    });

    // Right-click = Android BACK
    feed.addEventListener('contextmenu', async (e) => {
      e.preventDefault();
      if (!this.isStreaming || !this.activeSerial) return;
      try {
        await (window as any).api.deviceStreamKey({
          serial: this.activeSerial,
          keycode: 4, // KEYCODE_BACK
        });
      } catch (_) {}
    });

    // Middle-click = Android HOME
    feed.addEventListener('auxclick', async (e) => {
      if (e.button === 1) {
        e.preventDefault();
        if (!this.isStreaming || !this.activeSerial) return;
        try {
          await (window as any).api.deviceStreamKey({
            serial: this.activeSerial,
            keycode: 3, // KEYCODE_HOME
          });
        } catch (_) {}
      }
    });

    // Mouse wheel = Vertical scroll
    feed.addEventListener(
      'wheel',
      async (e) => {
        if (!this.isStreaming || !this.activeSerial) return;
        e.preventDefault();
        const coords = mapCoords(e) || {
          x: Math.round((this.streamWidth || 1080) / 2),
          y: Math.round((this.streamHeight || 2400) / 2),
        };
        try {
          await (window as any).api.deviceStreamScroll({
            serial: this.activeSerial,
            x: coords.x,
            y: coords.y,
            hScroll: e.deltaX,
            vScroll: -e.deltaY,
          });
        } catch (_) {}
      },
      { passive: false }
    );

    // Direct keyboard typing when hovering or focused on feed wrapper
    const wrapper = document.getElementById('dm-feed-wrapper');
    wrapper?.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (!this.isStreaming || !this.activeSerial) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 67 }); // KEYCODE_DEL
      } else if (e.key === 'Enter') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 66 }); // KEYCODE_ENTER
      } else if (e.key === 'Escape') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 4 }); // KEYCODE_BACK
      } else if (e.key === 'Tab') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 61 }); // KEYCODE_TAB
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 19 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 20 });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 21 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        await (window as any).api.deviceStreamKey({ serial: this.activeSerial, keycode: 22 });
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        await (window as any).api.deviceStreamText({ serial: this.activeSerial, text: e.key });
      }
    });
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
      if (this.isStreaming && this.activeSerial !== serial) {
        await this.stopLiveStream(true);
      }
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

  private async captureDevice(serial: string, mode: 'screenshot' | 'dump' | 'both' = 'both'): Promise<void> {
    const worktreePath = this.getActiveWorktreePath();
    if (!worktreePath) {
      this.showToast('Please select an active project/worktree first to store capture evidence.', 'error');
      return;
    }

    const label = mode === 'screenshot' ? 'screenshot' : mode === 'dump' ? 'UI hierarchy dump' : 'screenshot & UI dump';
    this.showToast(`Capturing ${label} for ${serial}...`, 'info');
    try {
      const res = await (window as any).api.deviceCaptureUi({
        serial,
        worktreePath,
        mode,
      });

      if (res?.success) {
        if (mode === 'screenshot') {
          this.showToast(`Screenshot saved: ${res.relativeScreenshot}`, 'success');
        } else if (mode === 'dump') {
          this.showToast(`UI hierarchy dump saved: ${res.relativeDump}`, 'success');
        } else {
          this.showToast(`Evidence saved: ${res.relativeScreenshot} & ${res.relativeDump}`, 'success');
        }
      } else {
        this.showToast(`Capture failed: ${res?.error || 'Make sure device is responsive'}`, 'error');
      }
    } catch (err: any) {
      this.showToast(`Capture failed: ${err?.message || err}`, 'error');
    }
  }

  private async captureActiveDevice(mode: 'screenshot' | 'dump' | 'both' = 'both'): Promise<void> {
    if (!this.activeSerial) {
      this.showToast('No active device selected for capture', 'error');
      return;
    }
    await this.captureDevice(this.activeSerial, mode);
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

    // Update active device chip in Remote Controls card
    const targetChip = document.getElementById('dm-active-target-chip');
    const targetName = document.getElementById('dm-active-target-name');
    if (targetChip && targetName) {
      if (activeDev) {
        targetName.textContent = activeDev.marketName || activeDev.model || activeDev.serial;
        targetChip.classList.add('is-active');
        targetChip.title = `Active Target: ${activeDev.serial} (${activeDev.marketName || activeDev.model})`;
      } else {
        targetName.textContent = 'No Device';
        targetChip.classList.remove('is-active');
        targetChip.title = 'No active device selected';
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
                <button type="button" class="btn-primary btn-small" data-action="stream" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Launch live screen mirror & fast controls">
                  ${SVG_ICONS.screen}
                  <span>Control & Live Mirror</span>
                </button>
                <button type="button" class="btn-secondary btn-small" data-action="mirror" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Launch external Scrcpy pop-out window">
                  <span>Pop-out</span>
                </button>
                <button type="button" class="btn-secondary btn-small" data-action="capture-screenshot" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Capture screenshot only (.png)">
                  ${SVG_ICONS.screenshot}
                  <span>Screenshot</span>
                </button>
                <button type="button" class="btn-secondary btn-small" data-action="capture-dump" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Dump UI hierarchy XML only (.xml)">
                  ${SVG_ICONS.dump}
                  <span>Dump UI</span>
                </button>
                <button type="button" class="btn-secondary btn-small" data-action="capture-combine" data-serial="${this.escape(dev.serial)}" ${!isOnline ? 'disabled' : ''} title="Combined: Screenshot and UI hierarchy dump (.png + .xml)">
                  ${SVG_ICONS.combine}
                  <span>Combine</span>
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
