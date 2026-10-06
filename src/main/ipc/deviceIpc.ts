import { IpcMain } from 'electron';
import { DeviceService } from '../device/deviceService';
import { DeviceStreamService } from '../device/deviceStreamService';

interface RegisterDeviceIpcOptions {
  ipcMain: IpcMain;
  deviceService: DeviceService;
  deviceStreamService: DeviceStreamService;
}

export function registerDeviceIpc({ ipcMain, deviceService, deviceStreamService }: RegisterDeviceIpcOptions): void {
  ipcMain.handle('device:list', async () => {
    try {
      const devices = await deviceService.listDevices();
      return { success: true, devices };
    } catch (err: any) {
      return { success: false, devices: [], error: err?.message || String(err) };
    }
  });

  ipcMain.handle('device:get-active', () => {
    return deviceService.getActiveSerial();
  });

  ipcMain.handle('device:set-active', (_, serial: string | null) => {
    deviceService.setActiveSerial(serial);
    return { success: true, activeSerial: deviceService.getActiveSerial() };
  });

  ipcMain.handle('device:connect-wireless', async (_, { ip, port }: { ip: string; port?: number }) => {
    return deviceService.connectWireless(ip, port);
  });

  ipcMain.handle('device:disconnect-wireless', async (_, { serial }: { serial: string }) => {
    return deviceService.disconnectWireless(serial);
  });

  ipcMain.handle('device:enable-tcpip', async (_, { serial, port }: { serial: string; port?: number }) => {
    return deviceService.enableTcpip(serial, port);
  });

  ipcMain.handle('device:reboot', async (_, { serial, mode }: { serial: string; mode?: string }) => {
    return deviceService.rebootDevice(serial, mode);
  });

  ipcMain.handle('device:restart-server', async () => {
    return deviceService.restartAdbServer();
  });

  ipcMain.handle('device:mirror', async (_, options) => {
    return await deviceService.launchMirror(options);
  });

  ipcMain.handle('device:capture-ui', async (_, options) => {
    return deviceService.captureUi(options);
  });

  ipcMain.handle('device:install-apk', async (_, { serial, apkPath }: { serial?: string; apkPath: string }) => {
    return deviceService.installApk(serial, apkPath);
  });

  ipcMain.handle('device:launch-app', async (_, { serial, packageName, apkPath }: { serial?: string; packageName?: string; apkPath?: string }) => {
    return deviceService.launchApp(serial, packageName, apkPath);
  });

  ipcMain.handle('device:send-key', async (_, { serial, keycode }: { serial: string; keycode: string | number }) => {
    return deviceService.sendKey(serial, keycode);
  });

  ipcMain.handle('device:setup-mobilerun', async (_, { serial }: { serial: string }) => {
    return deviceService.setupMobilerunPortal(serial);
  });

  ipcMain.handle('device:stream-start', async (_, options) => {
    return deviceStreamService.startStream(options);
  });

  ipcMain.handle('device:stream-stop', async (_, options) => {
    return deviceStreamService.stopStream(options?.serial);
  });

  ipcMain.handle('device:stream-status', async (_, options) => {
    return deviceStreamService.getStreamInfo(options?.serial);
  });

  ipcMain.handle('device:stream-touch', async (_, options) => {
    return deviceStreamService.injectTouch(options);
  });

  ipcMain.handle('device:stream-key', async (_, { serial, keycode }: { serial?: string; keycode: number }) => {
    return deviceStreamService.injectKey(serial, keycode);
  });

  ipcMain.handle('device:stream-text', async (_, { serial, text }: { serial?: string; text: string }) => {
    return deviceStreamService.injectText(serial, text);
  });

  ipcMain.handle('device:stream-scroll', async (_, options) => {
    return deviceStreamService.injectScroll(options);
  });

  ipcMain.handle('device:stream-action', async (_, { serial, action }: { serial?: string; action: any }) => {
    return deviceStreamService.injectAction(serial, action);
  });
}
