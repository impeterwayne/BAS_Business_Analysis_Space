import { exec, execFile, execSync, execFileSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getManagedMobilerunCli } from '../bakit/mobilerunSetup';
import { isWin, exeName, androidSdkDirs, findOnPath, localDataDir, unixBinDirs } from '../platform';
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

export type CaptureMode = 'screenshot' | 'dump' | 'both';

export interface CaptureUiOptions {
  serial?: string;
  worktreePath: string;
  prefix?: string;
  mode?: CaptureMode;
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
      // Android SDK platform-tools (per-OS default location, ANDROID_HOME, ANDROID_SDK_ROOT)
      ...androidSdkDirs().map((sdk) => path.join(sdk, 'platform-tools', exeName('adb'))),
      // Common scrcpy bundled adb (Windows) / package-manager installs (macOS, Linux)
      ...(isWin
        ? [
          path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'adb.exe'),
          path.join(localDataDir(), 'Programs', 'scrcpy', 'adb.exe'),
        ]
        : unixBinDirs().map((dir) => path.join(dir, 'adb'))),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.cachedAdbPath = p;
        return p;
      }
    }

    const onPath = findOnPath('adb');
    if (onPath) {
      this.cachedAdbPath = onPath;
      return onPath;
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

    const possiblePaths = isWin
      ? [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'scrcpy', 'scrcpy.exe'),
        path.join(localDataDir(), 'Programs', 'scrcpy', 'scrcpy.exe'),
      ]
      : unixBinDirs().map((dir) => path.join(dir, 'scrcpy'));

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.cachedScrcpyPath = p;
        return p;
      }
    }

    const onPath = findOnPath('scrcpy');
    if (onPath) {
      this.cachedScrcpyPath = onPath;
      return onPath;
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
    const { worktreePath, prefix, mode = 'both' } = options;
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

    const doScreenshot = mode === 'screenshot' || mode === 'both';
    const doDump = mode === 'dump' || mode === 'both';

    let screenshotSuccess = false;
    let dumpSuccess = false;
    let lastError = '';

    if (doScreenshot) {
      try {
        execSync(`scrcpy-cli ${serialFlag} screenshot "${screenshotPath}"`, {
          encoding: 'utf-8',
          timeout: 15000,
          windowsHide: true,
        });
        screenshotSuccess = fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 0;
      } catch {
        // Fallback to direct adb screencap (PNG bytes on stdout, written here so no shell redirect is needed)
        try {
          const png = execFileSync(adb, [...(serial ? ['-s', serial] : []), 'exec-out', 'screencap', '-p'], {
            timeout: 15000,
            maxBuffer: 64 * 1024 * 1024,
            windowsHide: true,
          });
          fs.writeFileSync(screenshotPath, png);
          screenshotSuccess = fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 0;
        } catch (err: any) {
          lastError = err?.message || 'Screenshot capture failed';
        }
      }
    }

    if (doDump) {
      try {
        execSync(`scrcpy-cli ${serialFlag} ui-dump "${dumpPath}"`, {
          encoding: 'utf-8',
          timeout: 15000,
          windowsHide: true,
        });
        dumpSuccess = fs.existsSync(dumpPath) && fs.statSync(dumpPath).size > 0;
      } catch {
        // Fallback to direct adb uiautomator dump
        try {
          const rawDump = execSync(`"${adb}" ${serialFlag} exec-out uiautomator dump /dev/tty`, {
            timeout: 15000,
            windowsHide: true,
            encoding: 'utf-8',
          });

          const xmlStart = rawDump.indexOf('<?xml');
          const xmlEnd = rawDump.lastIndexOf('</hierarchy>');
          if (xmlStart !== -1 && xmlEnd !== -1) {
            const cleanedXml = rawDump.slice(xmlStart, xmlEnd + '</hierarchy>'.length).trim();
            fs.writeFileSync(dumpPath, cleanedXml, 'utf-8');
            dumpSuccess = true;
          } else {
            // Alternative adb dump to sdcard then pull
            execSync(`"${adb}" ${serialFlag} shell uiautomator dump /sdcard/window_dump.xml`, { timeout: 15000, windowsHide: true });
            execSync(`"${adb}" ${serialFlag} pull /sdcard/window_dump.xml "${dumpPath}"`, { timeout: 15000, windowsHide: true });
            dumpSuccess = fs.existsSync(dumpPath) && fs.statSync(dumpPath).size > 0;
          }
        } catch (fallbackErr: any) {
          lastError = fallbackErr?.message || 'UI hierarchy dump failed';
        }
      }
    }

    if (doScreenshot && !screenshotSuccess && doDump && !dumpSuccess) {
      return { success: false, error: lastError || 'Screenshot and UI dump failed' };
    }
    if (doScreenshot && !screenshotSuccess && !doDump) {
      return { success: false, error: lastError || 'Screenshot capture failed' };
    }
    if (doDump && !dumpSuccess && !doScreenshot) {
      return { success: false, error: lastError || 'UI hierarchy dump failed' };
    }

    return {
      success: true,
      mode,
      screenshotPath: screenshotSuccess ? screenshotPath : undefined,
      dumpPath: dumpSuccess ? dumpPath : undefined,
      relativeScreenshot: screenshotSuccess ? path.join('docs', 'spec', 'evidence', screenshotFilename) : undefined,
      relativeDump: dumpSuccess ? path.join('docs', 'spec', 'evidence', dumpFilename) : undefined,
    };
  }

  public async installApk(serial: string | undefined, apkPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const targetSerial = serial || this.activeSerial;
    const adb = this.getAdbPath();

    if (!apkPath || !fs.existsSync(apkPath)) {
      return { success: false, error: `APK/XAPK file not found: ${apkPath}` };
    }

    const ext = path.extname(apkPath).toLowerCase();
    if (ext === '.xapk' || ext === '.apks') {
      return this.installXapk(targetSerial, apkPath);
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

  public async installXapk(serial: string | undefined, xapkPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const targetSerial = serial || this.activeSerial;
    const adb = this.getAdbPath();
    const serialArg = targetSerial ? `-s "${targetSerial}" ` : '';

    if (!xapkPath || !fs.existsSync(xapkPath)) {
      return { success: false, error: `XAPK file not found: ${xapkPath}` };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baspace_xapk_'));

    try {
      // 1. Extract XAPK / APKS archive into temporary directory
      const extracted = await this.extractArchive(xapkPath, tempDir);
      if (!extracted) {
        return { success: false, error: 'Failed to extract XAPK archive. Ensure the archive is not corrupted.' };
      }

      // 2. Discover all .apk and .obb files
      const allApkFiles = this.findFilesRecursively(tempDir, '.apk');
      const allObbFiles = this.findFilesRecursively(tempDir, '.obb');

      if (allApkFiles.length === 0) {
        return { success: false, error: 'No APK packages found inside XAPK archive' };
      }

      // 3. Read manifest.json if present
      let manifest: any = null;
      const manifestPath = path.join(tempDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        } catch (_) {}
      }

      // 4. Query device CPU architecture to avoid conflicting ABI splits
      let deviceAbis: string[] = [];
      try {
        const primaryAbi = execSync(`"${adb}" ${serialArg}shell getprop ro.product.cpu.abi`, { encoding: 'utf-8', timeout: 5000 }).trim();
        const abiList = execSync(`"${adb}" ${serialArg}shell getprop ro.product.cpu.abilist`, { encoding: 'utf-8', timeout: 5000 }).trim();
        deviceAbis = [...new Set([primaryAbi, ...abiList.split(',')].map(a => a.trim().toLowerCase()).filter(Boolean))];
      } catch (_) {}

      // 5. Filter split APKs to only compatible splits for this device
      const apksToInstall = this.filterCompatibleApks(allApkFiles, deviceAbis);
      if (apksToInstall.length === 0) {
        return { success: false, error: 'No compatible APK splits found for connected device architecture' };
      }

      // 6. Install APK(s) via ADB
      let installResult: { success: boolean; output?: string; error?: string };
      if (apksToInstall.length === 1) {
        installResult = await new Promise((resolve) => {
          exec(`"${adb}" ${serialArg}install -r "${apksToInstall[0]}"`, { timeout: 180000 }, (err, stdout, stderr) => {
            const out = (stdout || '').trim();
            const errOut = (stderr || '').trim();
            if (err || out.toLowerCase().includes('failure') || errOut.toLowerCase().includes('failure')) {
              resolve({ success: false, error: errOut || out || err?.message || 'Installation failed' });
            } else {
              resolve({ success: true, output: out || 'Success' });
            }
          });
        });
      } else {
        // Multi-APK split installation (adb install-multiple -r -d -t ...)
        const quotedApks = apksToInstall.map((a) => `"${a}"`).join(' ');
        installResult = await new Promise((resolve) => {
          exec(`"${adb}" ${serialArg}install-multiple -r -d -t ${quotedApks}`, { timeout: 240000 }, (err, stdout, stderr) => {
            const out = (stdout || '').trim();
            const errOut = (stderr || '').trim();
            if (err || out.toLowerCase().includes('failure') || errOut.toLowerCase().includes('failure')) {
              resolve({ success: false, error: errOut || out || err?.message || 'Split APK installation failed' });
            } else {
              resolve({ success: true, output: out || 'Success' });
            }
          });
        });
      }

      if (!installResult.success) {
        return installResult;
      }

      // 7. Push OBB expansion files if present
      let obbInstalledCount = 0;
      if (allObbFiles.length > 0) {
        const packageName = manifest?.package_name || this.detectPackageNameFromObb(allObbFiles[0]) || '';
        if (packageName) {
          const deviceObbDir = `/sdcard/Android/obb/${packageName}`;
          try {
            execSync(`"${adb}" ${serialArg}shell mkdir -p "${deviceObbDir}"`, { timeout: 10000 });
          } catch (_) {}

          for (const obbPath of allObbFiles) {
            const obbFileName = path.basename(obbPath);
            try {
              execSync(`"${adb}" ${serialArg}push "${obbPath}" "${deviceObbDir}/${obbFileName}"`, { timeout: 300000 });
              obbInstalledCount++;
            } catch (err: any) {
              console.warn(`[DeviceService] Failed to push OBB: ${obbFileName}`, err?.message);
            }
          }
        }
      }

      const summaryParts = [
        `Installed XAPK (${apksToInstall.length} split APK${apksToInstall.length === 1 ? '' : 's'})`,
      ];
      if (obbInstalledCount > 0) {
        summaryParts.push(`with ${obbInstalledCount} OBB file${obbInstalledCount === 1 ? '' : 's'}`);
      }

      return {
        success: true,
        output: summaryParts.join(' '),
      };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    } finally {
      // 8. Clean up temporary directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  private async extractArchive(archivePath: string, destDir: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 1. Try native tar first (available on Win 10+, macOS, Linux)
      exec(`tar -xf "${archivePath}" -C "${destDir}"`, { timeout: 90000 }, (tarErr) => {
        if (!tarErr) {
          resolve(true);
          return;
        }

        // 2. Fallback on Windows: PowerShell Expand-Archive
        if (isWin) {
          const psSrc = archivePath.replace(/'/g, "''");
          const psDst = destDir.replace(/'/g, "''");
          const psCmd = `powershell -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '${psSrc}' -DestinationPath '${psDst}' -Force"`;
          exec(psCmd, { timeout: 180000 }, (psErr) => {
            resolve(!psErr);
          });
        } else {
          // GNU tar (most Linux distros) cannot read zip-based archives (.xapk/.apks); unzip can.
          execFile('unzip', ['-o', '-q', archivePath, '-d', destDir], { timeout: 180000 }, (unzipErr) => {
            resolve(!unzipErr);
          });
        }
      });
    });
  }

  private findFilesRecursively(dir: string, ext: string): string[] {
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.findFilesRecursively(fullPath, ext));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(ext.toLowerCase())) {
          results.push(fullPath);
        }
      }
    } catch (_) {}
    return results;
  }

  private filterCompatibleApks(allApks: string[], deviceAbis: string[]): string[] {
    const ABI_PATTERNS = [
      { key: 'arm64_v8a', patterns: [/arm64[-_]v8a/i, /arm64/i, /aarch64/i] },
      { key: 'armeabi_v7a', patterns: [/armeabi[-_]v7a/i, /armeabi/i, /armv7/i] },
      { key: 'x86_64', patterns: [/x86_64/i, /x64/i] },
      { key: 'x86', patterns: [/(^|[^a-zA-Z0-9])x86([^a-zA-Z0-9]|$)/i] },
    ];

    const abiTaggedApks = new Map<string, { apk: string; abi: string }>();
    const nonAbiApks: string[] = [];

    for (const apk of allApks) {
      const filename = path.basename(apk).toLowerCase();
      let matchedAbi: string | null = null;
      for (const item of ABI_PATTERNS) {
        if (item.patterns.some((p) => p.test(filename))) {
          matchedAbi = item.key;
          break;
        }
      }
      if (matchedAbi) {
        abiTaggedApks.set(apk, { apk, abi: matchedAbi });
      } else {
        nonAbiApks.push(apk);
      }
    }

    if (abiTaggedApks.size <= 1) {
      return allApks;
    }

    let preferredAbi = 'arm64_v8a';
    const normalizedDeviceAbis = deviceAbis.map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (normalizedDeviceAbis.length > 0) {
      for (const devAbi of normalizedDeviceAbis) {
        if (devAbi.includes('arm64') || devAbi.includes('aarch64')) {
          preferredAbi = 'arm64_v8a';
          break;
        }
        if (devAbi.includes('x8664') || devAbi.includes('x64')) {
          preferredAbi = 'x86_64';
          break;
        }
        if (devAbi.includes('v7') || devAbi.includes('arm')) {
          preferredAbi = 'armeabi_v7a';
          break;
        }
        if (devAbi.includes('x86')) {
          preferredAbi = 'x86';
          break;
        }
      }
    }

    const availableAbis = [...abiTaggedApks.values()].map((v) => v.abi);
    let selectedAbi = preferredAbi;
    if (!availableAbis.includes(selectedAbi)) {
      if (selectedAbi === 'arm64_v8a' && availableAbis.includes('armeabi_v7a')) {
        selectedAbi = 'armeabi_v7a';
      } else if (selectedAbi === 'x86_64' && availableAbis.includes('x86')) {
        selectedAbi = 'x86';
      } else {
        selectedAbi = availableAbis[0];
      }
    }

    const selectedAbiApks: string[] = [];
    for (const [apk, info] of abiTaggedApks.entries()) {
      if (info.abi === selectedAbi) {
        selectedAbiApks.push(apk);
      }
    }

    return [...nonAbiApks, ...selectedAbiApks];
  }

  private detectPackageNameFromObb(obbPath: string): string {
    const fileName = path.basename(obbPath);
    const match = fileName.match(/^(?:main|patch)\.\d+\.([a-zA-Z0-9_.]+)\.obb$/i);
    if (match && match[1]) {
      return match[1];
    }
    const parent = path.basename(path.dirname(obbPath));
    if (parent && parent.includes('.') && parent.toLowerCase() !== 'obb') {
      return parent;
    }
    return '';
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

    // The CLI BA Space installs (Mobilerun setup) first, then one on PATH or in a uv project.
    const managedCli = getManagedMobilerunCli();
    const candidateCommands = [
      ...(managedCli ? [`"${managedCli}" setup ${serialArg}`] : []),
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
      error: 'Mobilerun CLI not found or setup failed. Run Mobilerun setup from the BAKit toolkit screen to install it.',
    };
  }
}
