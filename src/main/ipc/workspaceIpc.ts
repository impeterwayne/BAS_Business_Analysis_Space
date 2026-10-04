const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { extractPlayStorePackageName, inferAppNameFromPackage, extractAppInfoFromHtml, getDomainFavicon } = require('../../domain/project');


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

  ipcMain.handle('project:link-competitor-apk', (_, { projectPath, competitorId, apk }) =>
    workspaceService.linkCompetitorApk(projectPath, competitorId, apk)
  );

  ipcMain.handle('project:unlink-competitor-apk', (_, { projectPath, competitorId }) =>
    workspaceService.unlinkCompetitorApk(projectPath, competitorId)
  );

  ipcMain.handle('project:sync-ba-config', (_, { projectPath, worktreePath }) =>
    workspaceService.syncBaProjectConfig(projectPath, worktreePath)
  );

  ipcMain.handle('competitor:detect-app', async (_, { url }) => {
    return detectCompetitorFromUrl(url);
  });

  ipcMain.handle('competitor:fetch-icon', async (_, { projectPath, competitorId, url, packageName }) => {
    const query = (url || packageName || '').trim();
    if (!query) {
      return { success: false, error: 'No URL or package name provided' };
    }

    try {
      const detected = await detectCompetitorFromUrl(query);
      if (detected && detected.success && detected.iconUrl) {
        if (projectPath && competitorId && workspaceService) {
          workspaceService.updateProjectCompetitor(projectPath, {
            id: competitorId,
            iconUrl: detected.iconUrl,
          });
        }
        return { success: true, iconUrl: detected.iconUrl };
      }
      return { success: false, error: detected?.error || 'Icon not found' };
    } catch (err) {
      return { success: false, error: err?.message || String(err) };
    }
  });


  ipcMain.handle('select-apk-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Android Packages (*.apk, *.xapk, *.apks)', extensions: ['apk', 'xapk', 'apks'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Select APK or XAPK File',
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

async function detectCompetitorFromUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { success: false, error: 'URL is required' };
  }
  const trimmed = inputUrl.trim();
  const pkg = extractPlayStorePackageName(trimmed);
  const inferred = inferAppNameFromPackage(pkg);

  let targetUrl = '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes('google.com')) {
        parsed.searchParams.set('hl', 'en');
        parsed.searchParams.set('gl', 'US');
        targetUrl = parsed.toString();
      } else {
        targetUrl = trimmed;
      }
    } catch {
      targetUrl = trimmed;
    }
  } else if (pkg) {
    targetUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}&hl=en&gl=US`;
  } else {
    targetUrl = `https://${trimmed}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);

    if (response.ok) {
      const html = await response.text();
      const extracted = extractAppInfoFromHtml(html, pkg, inferred, targetUrl);
      if (extracted.appName || extracted.iconUrl) {
        return {
          success: true,
          appName: extracted.appName || inferred,
          packageName: extracted.packageName || pkg,
          iconUrl: extracted.iconUrl || getDomainFavicon(targetUrl) || '',
          url: targetUrl,
        };
      }
    }
  } catch (_) {
    // Network or fetch failed, fallback below
  }

  const fallbackIcon = getDomainFavicon(targetUrl);
  // Graceful fallback: return inferred name from package name
  if (inferred || pkg) {
    return {
      success: true,
      appName: inferred,
      packageName: pkg,
      iconUrl: fallbackIcon || '',
      url: targetUrl,
      inferred: true,
    };
  }

  return {
    success: false,
    error: 'Could not detect app name from the provided link.',
  };
}

module.exports = {
  registerWorkspaceIpc,
  detectCompetitorFromUrl,
};
