import type { IpcMain } from 'electron';
import type { UpdateService } from '../update/updateService';

interface RegisterUpdateIpcOptions {
  ipcMain: IpcMain;
  updateService: UpdateService;
}

export function registerUpdateIpc({ ipcMain, updateService }: RegisterUpdateIpcOptions): void {
  ipcMain.handle('update:get-state', () => {
    return updateService.getState();
  });

  ipcMain.handle('update:check', async () => {
    return updateService.checkForUpdates();
  });

  ipcMain.handle('update:download', async (_, opts) => {
    return updateService.downloadUpdate(opts || {});
  });

  ipcMain.handle('update:cancel-download', () => {
    return updateService.cancelDownload();
  });

  ipcMain.handle('update:install', async () => {
    return updateService.installUpdate();
  });

  ipcMain.handle('update:reveal-file', () => {
    return updateService.revealDownloadedFile();
  });

  ipcMain.handle('update:open-release-page', () => {
    return updateService.openReleasePage();
  });
}
