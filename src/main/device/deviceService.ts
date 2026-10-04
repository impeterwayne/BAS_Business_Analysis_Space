import { exec, execSync, execFileSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
const { parseAdbDevicesOutput, parseDeviceEnrichment } = require('../../domain/device');

export interface DeviceInfo {
  serial: string;
  state: 'device' | 'unauthorized' | 'offline' | 'bootloader' | 'authorizing' | 'unknown';
  model: string;
  manufacturer: string;
  product: string;
  marketName: string;
  androidVersion: string;
  sdkVersion: string;
  screenResolution: string;
  screenDensity: string;
  batteryLevel: number | null;
  batteryStatus: string;
  isCharging: boolean;
  ipAddress: string | null;
  connectionType: 'usb' | 'wifi' | 'emulator';
  transportId?: string;
  mobilerunPortalInstalled: boolean;
  isActive: boolean;
}

export interface MirrorOptions {
  serial?: string;
  stayAwake?: boolean;
  turnScreenOff?: boolean;
  alwaysOnTop?: boolean;
  maxSize?: number;
  maxFps?: number;
}

export interface CaptureUiOptions {
  serial?: string;
  worktreePath: string;
  prefix?: string;
}

export class DeviceService {
  private activeSerial: string | null = null;
  private cachedAdbPath: string | null = null;
  private cachedScrcpyPath: string | null = null;

  constructor(private getSettings: () => any) {}

  public getAdbPath(): string {
    if (this.cachedAdbPath && (this.cachedAdbPath === 'adb' || fs.existsSync(this.cachedAdbPath))) {
      return this.cachedAdbPath;
    }

    const possiblePaths = [
      // Android SDK platform-tools in user home
      path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
      process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe') : null,
      process.env.ANDROID_SDK_ROOT ? path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb.exe') : null,
      // Common scrcpy bundled adb
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'adb.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'scrcpy', 'adb.exe'),
    ].filter(Boolean) as string[];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.cachedAdbPath = p;
        return p;
      }
    }

    if (process.platform === 'win32') {
      try {
        const output = execFileSync('where.exe', ['adb'], {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        const matches = output.split(/\r?\n/).filter(Boolean);
        const resolved = matches.find((m) => /\.exe$/i.test(m)) || matches[0];
        if (resolved && fs.existsSync(resolved)) {
          this.cachedAdbPath = resolved;
          return resolved;
        }
      } catch (_) {}
    } else {
      try {
        const output = execSync('which adb', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (output && fs.existsSync(output)) {
          this.cachedAdbPath = output;
          return output;
        }
      } catch (_) {}
    }

    this.cachedAdbPath = 'adb';
    return 'adb';
  }

  public getScrcpyExecutable(): string | null {
    if (this.cachedScrcpyPath && (this.cachedScrcpyPath === 'scrcpy' || fs.existsSync(this.cachedScrcpyPath))) {
      return this.cachedScrcpyPath;
    }

    const settings = this.getSettings ? this.getSettings() : {};
    if (settings?.scrcpyPath && fs.existsSync(settings.scrcpyPath)) {
      this.cachedScrcpyPath = settings.scrcpyPath;
      return settings.scrcpyPath;
    }

    const possiblePaths = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'scrcpy.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'scrcpy', 'scrcpy.exe'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.cachedScrcpyPath = p;
        return p;
      }
    }

    if (process.platform === 'win32') {
      try {
        const output = execFileSync('where.exe', ['scrcpy'], {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        const matches = output.split(/\r?\n/).filter(Boolean);
        const resolved = matches.find((m) => /\.exe$/i.test(m)) || matches[0];
        if (resolved && fs.existsSync(resolved)) {
          this.cachedScrcpyPath = resolved;
          return resolved;
        }
      } catch (_) {}
    } else {
      try {
        const output = execSync('which scrcpy', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (output && fs.existsSync(output)) {
          this.cachedScrcpyPath = output;
          return output;
        }
      } catch (_) {}
    }

    // Check if plain 'scrcpy' is accessible directly
    try {
      execSync('scrcpy -v', { encoding: 'utf-8', timeout: 2000, windowsHide: true });
      this.cachedScrcpyPath = 'scrcpy';
      return 'scrcpy';
    } catch {
      // not found
    }

    return null;
  }

  public getActiveSerial(): string | null {
    return this.activeSerial;
  }

  public setActiveSerial(serial: string | null): void {
    this.activeSerial = serial ? serial.trim() : null;
  }

  public async listDevices(): Promise<DeviceInfo[]> {
    const adb = this.getAdbPath();
    let rawOutput = '';

    try {
      rawOutput = execSync(`"${adb}" devices -l`, {
        encoding: 'utf-8',
        timeout: 6000,
        windowsHide: true,
      });
    } catch (err: any) {
      // Fallback try simple adb devices or return empty
      try {
        rawOutput = execSync(`adb devices -l`, {
          encoding: 'utf-8',
          timeout: 6000,
          windowsHide: true,
        });
      } catch {
        return [];
      }
    }

    const baseDevices = parseAdbDevicesOutput(rawOutput);
    const devices: DeviceInfo[] = [];

    for (const base of baseDevices) {
      const info: DeviceInfo = {
        serial: base.serial,
        state: base.state,
        product: base.product,
        model: base.model,
        manufacturer: '',
        marketName: base.model,
        androidVersion: '',
        sdkVersion: '',
        screenResolution: '',
        screenDensity: '',
        batteryLevel: null,
        batteryStatus: 'Unknown',
        isCharging: false,
        ipAddress: base.connectionType === 'wifi' ? base.serial.split(':')[0] : null,
        connectionType: base.connectionType,
        transportId: base.transportId,
        mobilerunPortalInstalled: false,
        isActive: false,
      };

      if (info.state === 'device') {
        try {
          this.enrichDeviceInfo(info, adb);
        } catch {
          // Keep base info if querying device details fails
        }
      }

      devices.push(info);
    }

    // Determine and set active device
    if (devices.length > 0) {
      let activeIndex = devices.findIndex((d) => d.serial === this.activeSerial);
      if (activeIndex === -1) {
        // Find first online device
        activeIndex = devices.findIndex((d) => d.state === 'device');
        if (activeIndex === -1) activeIndex = 0;
        this.activeSerial = devices[activeIndex].serial;
      }
      devices[activeIndex].isActive = true;
    } else {
      this.activeSerial = null;
    }

    return devices;
  }

  private enrichDeviceInfo(info: DeviceInfo, adb: string): void {
    const cmd = `"${adb}" -s "${info.serial}" shell "getprop ro.product.manufacturer; echo ---BASPLIT---; getprop ro.product.model; echo ---BASPLIT---; getprop ro.build.version.release; echo ---BASPLIT---; getprop ro.build.version.sdk; echo ---BASPLIT---; wm size; echo ---BASPLIT---; wm density; echo ---BASPLIT---; dumpsys battery; echo ---BASPLIT---; ip -f inet addr show wlan0; echo ---BASPLIT---; pm path com.mobilerun.portal"`;

    try {
      const output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 4000,
        windowsHide: true,
      });

      const enriched = parseDeviceEnrichment(output);
      if (enriched.manufacturer) info.manufacturer = enriched.manufacturer;
      if (enriched.model) {
        info.model = enriched.model;
        info.marketName = enriched.manufacturer ? `${enriched.manufacturer} ${enriched.model}` : enriched.model;
      }
      if (enriched.androidVersion) info.androidVersion = enriched.androidVersion;
      if (enriched.sdkVersion) info.sdkVersion = enriched.sdkVersion;
      if (enriched.screenResolution) info.screenResolution = enriched.screenResolution;
      if (enriched.screenDensity) info.screenDensity = enriched.screenDensity;
      if (enriched.batteryLevel !== null) info.batteryLevel = enriched.batteryLevel;
      if (enriched.batteryStatus) info.batteryStatus = enriched.batteryStatus;
      info.isCharging = enriched.isCharging;
      if (enriched.ipAddress) info.ipAddress = enriched.ipAddress;
      if (enriched.mobilerunPortalInstalled) info.mobilerunPortalInstalled = true;
    } catch {
      // Ignore enrichment errors
    }
  }

  public async connectWireless(ipAddress: string, port = 5555): Promise<{ success: boolean; output: string; error?: string }> {
    const adb = this.getAdbPath();
    let target = ipAddress.trim();
    if (!target) {
      return { success: false, output: '', error: 'IP address is required.' };
    }
    if (!target.includes(':')) {
      target = `${target}:${port}`;
    }

    return new Promise((resolve) => {
      exec(`"${adb}" connect ${target}`, { timeout: 15000 }, (err, stdout, stderr) => {
        const out = (stdout || stderr || '').trim();
        if (err || out.toLowerCase().includes('failed') || out.toLowerCase().includes('unable')) {
          resolve({
            success: false,
            output: out,
            error: out || err?.message || 'Connection failed',
          });
        } else {
          resolve({
            success: true,
            output: out || `Connected to ${target}`,
          });
        }
      });
    });
  }

  public async disconnectWireless(serial: string): Promise<{ success: boolean; output: string; error?: string }> {
    const adb = this.getAdbPath();
    const target = serial.trim();

    return new Promise((resolve) => {
      exec(`"${adb}" disconnect ${target}`, { timeout: 10000 }, (err, stdout, stderr) => {
        const out = (stdout || stderr || '').trim();
        if (err) {
          resolve({
            success: false,
            output: out,
            error: out || err.message,
          });
        } else {
          resolve({
            success: true,
            output: out || `Disconnected ${target}`,
          });
        }
      });
    });
  }

  public async enableTcpip(serial: string, port = 5555): Promise<{ success: boolean; output: string; error?: string }> {
    const adb = this.getAdbPath();
    const targetSerial = serial ? `-s "${serial.trim()}"` : '';

    return new Promise((resolve) => {
      exec(`"${adb}" ${targetSerial} tcpip ${port}`, { timeout: 12000 }, (err, stdout, stderr) => {
        const out = (stdout || stderr || '').trim();
        if (err) {
          resolve({
            success: false,
            output: out,
            error: out || err.message,
          });
        } else {
          resolve({
            success: true,
            output: out || `Device restarted in TCP/IP mode on port ${port}`,
          });
        }
      });
    });
  }

  public async rebootDevice(serial: string, mode?: string): Promise<{ success: boolean; error?: string }> {
    const adb = this.getAdbPath();
    const targetSerial = serial ? `-s "${serial.trim()}"` : '';
    const rebootMode = mode && ['recovery', 'bootloader', 'fastboot'].includes(mode) ? ` ${mode}` : '';

    return new Promise((resolve) => {
      exec(`"${adb}" ${targetSerial} reboot${rebootMode}`, { timeout: 15000 }, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: (stderr || stdout || err.message).trim() });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  public async restartAdbServer(): Promise<{ success: boolean; output: string; error?: string }> {
    const adb = this.getAdbPath();

    return new Promise((resolve) => {
      exec(`"${adb}" kill-server`, { timeout: 10000 }, () => {
        setTimeout(() => {
          exec(`"${adb}" start-server`, { timeout: 15000 }, (err, stdout, stderr) => {
            if (err) {
              resolve({
                success: false,
                output: '',
                error: (stderr || stdout || err.message).trim(),
              });
            } else {
              resolve({
                success: true,
                output: 'ADB server restarted successfully',
              });
            }
          });
        }, 500);
      });
    });
  }

  public async launchMirror(options: MirrorOptions = {}): Promise<{ success: boolean; error?: string }> {
    try {
      const exe = this.getScrcpyExecutable();
      if (!exe) {
        return {
          success: false,
          error: 'scrcpy executable not found. Please install scrcpy or configure its path in Settings.',
        };
      }

      let serial = options.serial || this.activeSerial;
      if (!serial) {
        try {
          const devices = await this.listDevices();
          const online = devices.find((d) => d.state === 'device');
          if (online) {
            serial = online.serial;
          }
        } catch {
          // ignore
        }
      }

      const args: string[] = [];

      if (serial) {
        args.push('-s', serial);
      }
      if (options.stayAwake) {
        args.push('--stay-awake');
      }
      if (options.turnScreenOff) {
        args.push('--turn-screen-off');
      }
      if (options.alwaysOnTop) {
        args.push('--always-on-top');
      }
      if (options.maxSize && options.maxSize > 0) {
        args.push('-m', String(options.maxSize));
      }
      if (options.maxFps && options.maxFps > 0) {
        args.push('--max-fps', String(options.maxFps));
      }

      const windowTitle = serial ? `BA Space Mirror - ${serial}` : 'BA Space Screen Mirror';
      args.push(`--window-title=${windowTitle}`);

      const scrcpyCwd = (exe && fs.existsSync(exe)) ? path.dirname(exe) : undefined;
      const child = spawn(exe, args, {
        shell: false,
        detached: true,
        stdio: 'ignore',
        cwd: scrcpyCwd,
        windowsHide: false,
      });

      child.on('error', (err) => {
        console.error('[DeviceService] scrcpy process spawn error:', err);
      });
      child.unref();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  public async captureUi(options: CaptureUiOptions): Promise<any> {
    const { worktreePath, prefix } = options;
    const serial = options.serial || this.activeSerial;

    if (!worktreePath || !fs.existsSync(worktreePath)) {
      return { success: false, error: 'Invalid or missing worktree path' };
    }

    const evidenceDir = path.join(worktreePath, 'docs', 'spec', 'evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });

    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filePrefix = prefix && typeof prefix === 'string' ? prefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'screen';

    const screenshotFilename = `${filePrefix}_${timestamp}.png`;
    const dumpFilename = `${filePrefix}_${timestamp}.xml`;
    const screenshotPath = path.join(evidenceDir, screenshotFilename);
    const dumpPath = path.join(evidenceDir, dumpFilename);

    const serialFlag = serial ? `-s "${serial}"` : '';
    const adb = this.getAdbPath();

    // Try scrcpy-cli first, fallback to adb
    try {
      execSync(`scrcpy-cli ${serialFlag} screenshot "${screenshotPath}"`, {
        encoding: 'utf-8',
        timeout: 15000,
        windowsHide: true,
      });
      execSync(`scrcpy-cli ${serialFlag} ui-dump "${dumpPath}"`, {
        encoding: 'utf-8',
        timeout: 15000,
        windowsHide: true,
      });
    } catch {
      // Fallback to direct adb screencap and uiautomator
      try {
        execSync(`"${adb}" ${serialFlag} exec-out screencap -p > "${screenshotPath}"`, {
          timeout: 15000,
          shell: 'cmd.exe',
          windowsHide: true,
        });
        execSync(`"${adb}" ${serialFlag} exec-out uiautomator dump /dev/tty > "${dumpPath}"`, {
          timeout: 15000,
          shell: 'cmd.exe',
          windowsHide: true,
        });
      } catch (fallbackErr: any) {
        return { success: false, error: fallbackErr?.message || 'Screenshot or UI dump failed' };
      }
    }

    return {
      success: true,
      screenshotPath,
      dumpPath,
      relativeScreenshot: path.join('docs', 'spec', 'evidence', screenshotFilename),
      relativeDump: path.join('docs', 'spec', 'evidence', dumpFilename),
    };
  }

  public async installApk(serial: string | undefined, apkPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const targetSerial = serial || this.activeSerial;
    const adb = this.getAdbPath();

    if (!apkPath || !fs.existsSync(apkPath)) {
      return { success: false, error: `APK file not found: ${apkPath}` };
    }

    const serialArg = targetSerial ? `-s "${targetSerial}" ` : '';
    const cmd = `"${adb}" ${serialArg}install -r "${apkPath}"`;

    return new Promise((resolve) => {
      exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
        const out = (stdout || '').trim();
        const errOut = (stderr || '').trim();
        if (err || out.toLowerCase().includes('failure') || errOut.toLowerCase().includes('failure')) {
          resolve({
            success: false,
            error: errOut || out || err?.message || 'APK Installation failed',
          });
        } else {
          resolve({
            success: true,
            output: out || 'Success',
          });
        }
      });
    });
  }

  public async sendKey(serial: string, keycode: string | number): Promise<{ success: boolean; error?: string }> {
    const targetSerial = serial || this.activeSerial;
    const adb = this.getAdbPath();
    const serialArg = targetSerial ? `-s "${targetSerial}" ` : '';

    return new Promise((resolve) => {
      exec(`"${adb}" ${serialArg}shell input keyevent ${keycode}`, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: (stderr || stdout || err.message).trim() });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  public async setupMobilerunPortal(serial: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const targetSerial = serial || this.activeSerial;
    const serialArg = targetSerial ? `-d "${targetSerial}"` : '';

    // Search for uv or python mobilerun CLI
    const candidateCommands = [
      `mobilerun setup ${serialArg}`,
      `uv run mobilerun setup ${serialArg}`,
    ];

    for (const cmd of candidateCommands) {
      try {
        const output = execSync(cmd, {
          encoding: 'utf-8',
          timeout: 30000,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
          windowsHide: true,
        });
        return { success: true, output: output.trim() };
      } catch {
        // try next
      }
    }

    return {
      success: false,
      error: 'Mobilerun CLI not found or setup failed. Ensure mobilerun is installed in python/uv environment.',
    };
  }
}
