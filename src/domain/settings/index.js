const { DEFAULT_SYNCTHING_FOLDER_ID, normalizeSyncMode } = require('../syncthing');

function normalizeStringList(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  for (const item of values) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function normalizeSettings(settings) {
  const nextSettings = settings && typeof settings === 'object' ? settings : {};
  const rawApiUrl = typeof nextSettings.syncthingApiUrl === 'string' ? nextSettings.syncthingApiUrl.trim() : '';
  const syncthingFolderId = typeof nextSettings.syncthingFolderId === 'string' && nextSettings.syncthingFolderId.trim()
    ? nextSettings.syncthingFolderId.trim()
    : DEFAULT_SYNCTHING_FOLDER_ID;

  return {
    vscodePath: typeof nextSettings.vscodePath === 'string' ? nextSettings.vscodePath.trim() : '',
    androidStudioPath: typeof nextSettings.androidStudioPath === 'string' ? nextSettings.androidStudioPath.trim() : '',
    antigravityPath: typeof nextSettings.antigravityPath === 'string' ? nextSettings.antigravityPath.trim() : '',
    antigravityAgentPath: typeof nextSettings.antigravityAgentPath === 'string' ? nextSettings.antigravityAgentPath.trim() : '',
    claudeDesktopPath: typeof nextSettings.claudeDesktopPath === 'string' ? nextSettings.claudeDesktopPath.trim() : '',
    figmaPath: typeof nextSettings.figmaPath === 'string' ? nextSettings.figmaPath.trim() : '',
    figmaUrl: typeof nextSettings.figmaUrl === 'string' ? nextSettings.figmaUrl.trim() : 'https://www.figma.com',
    obsidianPath: typeof nextSettings.obsidianPath === 'string' ? nextSettings.obsidianPath.trim() : '',
    obsidianVault: typeof nextSettings.obsidianVault === 'string' ? nextSettings.obsidianVault.trim() : '',
    scrcpyPath: typeof nextSettings.scrcpyPath === 'string' ? nextSettings.scrcpyPath.trim() : '',
    reakitPath: typeof nextSettings.reakitPath === 'string' ? nextSettings.reakitPath.trim() : '',
    symlinkTargets: Array.isArray(nextSettings.symlinkTargets)
      ? nextSettings.symlinkTargets
          .filter((t) => t && typeof t === 'object' && typeof t.name === 'string' && typeof t.targetPath === 'string')
          .map((t) => ({ name: t.name.trim(), targetPath: t.targetPath.trim() }))
      : [],
    syncthingPath: typeof nextSettings.syncthingPath === 'string' ? nextSettings.syncthingPath.trim() : '',
    syncthingApiUrl: rawApiUrl.replace(/\/+$/, ''),
    syncthingRootPath: typeof nextSettings.syncthingRootPath === 'string' ? nextSettings.syncthingRootPath.trim() : '',
    syncthingFolderId,
    syncthingSyncMode: normalizeSyncMode(nextSettings.syncthingSyncMode),
    syncthingDeviceIds: normalizeStringList(nextSettings.syncthingDeviceIds),
    syncthingEnabledProjects: normalizeStringList(nextSettings.syncthingEnabledProjects),
    autoCheckUpdates: typeof nextSettings.autoCheckUpdates === 'boolean' ? nextSettings.autoCheckUpdates : true,
  };
}

function normalizeWorkspaceConfig(config) {
  const nextConfig = config && typeof config === 'object' ? config : {};
  return {
    projects: Array.isArray(nextConfig.projects) ? nextConfig.projects : [],
    settings: normalizeSettings(nextConfig.settings),
  };
}

module.exports = {
  normalizeSettings,
  normalizeWorkspaceConfig,
};
