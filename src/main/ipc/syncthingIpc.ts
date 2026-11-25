import { IpcMain } from 'electron';
import { SyncthingService } from '../syncthing/syncthingService';

interface RegisterSyncthingIpcOptions {
  ipcMain: IpcMain;
  syncthingService: SyncthingService;
}

export function registerSyncthingIpc({ ipcMain, syncthingService }: RegisterSyncthingIpcOptions): void {
  ipcMain.handle('syncthing:get-state', async () => {
    return syncthingService.getState();
  });

  ipcMain.handle('syncthing:configure-root', async (_, opts) => {
    return syncthingService.configureRoot(opts || {});
  });

  ipcMain.handle('syncthing:toggle-project', async (_, opts) => {
    return syncthingService.toggleProject(opts || {});
  });

  ipcMain.handle('syncthing:rescan', async (_, opts) => {
    return syncthingService.rescan(opts || {});
  });

  ipcMain.handle('syncthing:start-daemon', async () => {
    return syncthingService.startDaemon();
  });

  ipcMain.handle('syncthing:open-web-ui', async () => {
    return syncthingService.openWebUi();
  });

  ipcMain.handle('syncthing:resolve-conflict', async (_, opts) => {
    return syncthingService.resolveConflict(opts || {});
  });

  ipcMain.handle('syncthing:import-discovered-project', async (_, opts) => {
    return syncthingService.importDiscoveredProject(opts || {});
  });
}
