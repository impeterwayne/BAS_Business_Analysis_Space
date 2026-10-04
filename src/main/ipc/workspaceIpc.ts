const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function registerWorkspaceIpc({ ipcMain, dialog, mainWindow, workspaceService, deviceService }) {
  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow.close());

  ipcMain.handle('get-workspaces', () => workspaceService.getWorkspaces());
  ipcMain.handle('settings:get', () => workspaceService.getSettings());
  ipcMain.handle('settings:update', (_, nextSettings) => workspaceService.updateSettings(nextSettings));
  ipcMain.handle('select-executable', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Executables', extensions: ['exe', 'cmd', 'bat', 'sh', 'lnk'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Executable Path',
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('select-directory', async (_, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: title || 'Select Folder',
      defaultPath: 'D:\\',
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('add-project', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select a Git Project Root',
    });
    if (result.canceled || !result.filePaths.length) return null;

    return workspaceService.addProject(result.filePaths[0]);
  });

  ipcMain.handle('remove-project', (_, projectPath) => workspaceService.removeProject(projectPath));
  ipcMain.handle('refresh-worktrees', (_, projectPath) => workspaceService.refreshWorktrees(projectPath));

  // ── Project Metadata & Assets ──
  ipcMain.handle('project:update-metadata', (_, { projectPath, metadata }) =>
    workspaceService.updateProjectMetadata(projectPath, metadata)
  );

  ipcMain.handle('project:add-apk', (_, { projectPath, apk }) =>
    workspaceService.addProjectApk(projectPath, apk)
  );

  ipcMain.handle('project:remove-apk', (_, { projectPath, apkId }) =>
    workspaceService.removeProjectApk(projectPath, apkId)
  );

  ipcMain.handle('project:add-competitor', (_, { projectPath, competitor }) =>
    workspaceService.addProjectCompetitor(projectPath, competitor)
  );

  ipcMain.handle('project:update-competitor', (_, { projectPath, competitor }) =>
    workspaceService.updateProjectCompetitor(projectPath, competitor)
  );

  ipcMain.handle('project:remove-competitor', (_, { projectPath, competitorId }) =>
    workspaceService.removeProjectCompetitor(projectPath, competitorId)
  );

  ipcMain.handle('project:sync-ba-config', (_, { projectPath, worktreePath }) =>
    workspaceService.syncBaProjectConfig(projectPath, worktreePath)
  );

  ipcMain.handle('select-apk-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Android Package (*.apk)', extensions: ['apk'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Select APK File',
    });
    if (result.canceled || !result.filePaths.length) return null;
    const filePath = result.filePaths[0];
    try {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
      };
    } catch {
      return {
        path: filePath,
        name: path.basename(filePath),
        size: 0,
      };
    }
  });

  ipcMain.handle('get-file-info', async (_, filePath) => {
    if (!filePath || typeof filePath !== 'string') return null;
    try {
      if (!fs.existsSync(filePath)) return null;
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        isFile: stats.isFile(),
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('adb:install-apk', async (_, { apkPath, serial }) => {
    if (deviceService) {
      return deviceService.installApk(serial, apkPath);
    }
    return new Promise((resolve) => {
      if (!apkPath || !fs.existsSync(apkPath)) {
        resolve({ success: false, error: 'APK file not found: ' + apkPath });
        return;
      }
      const targetSerial = serial ? `-s "${serial}" ` : '';
      const cmd = `adb ${targetSerial}install -r "${apkPath}"`;
      exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) {
          resolve({
            success: false,
            error: (stderr || stdout || err.message || 'Installation failed').trim(),
          });
        } else {
          resolve({
            success: true,
            output: (stdout || 'Success').trim(),
          });
        }
      });
    });
  });
}

module.exports = {
  registerWorkspaceIpc,
};
