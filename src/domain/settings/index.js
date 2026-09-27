function normalizeSettings(settings) {
  const nextSettings = settings && typeof settings === 'object' ? settings : {};
  const nextBranchParents = nextSettings.subworktreeBranchParents && typeof nextSettings.subworktreeBranchParents === 'object'
    ? /** @type {Record<string, string>} */ (nextSettings.subworktreeBranchParents)
    : {};

  return {
    subworktreeBranchParents: Object.fromEntries(
      Object.entries(nextBranchParents)
        .filter(([branch, parent]) => typeof branch === 'string' && branch.trim() && typeof parent === 'string' && parent.trim())
        .map(([branch, parent]) => [branch.trim(), String(parent).trim()])
    ),
    vscodePath: typeof nextSettings.vscodePath === 'string' ? nextSettings.vscodePath.trim() : '',
    androidStudioPath: typeof nextSettings.androidStudioPath === 'string' ? nextSettings.androidStudioPath.trim() : '',
    antigravityPath: typeof nextSettings.antigravityPath === 'string' ? nextSettings.antigravityPath.trim() : '',
    antigravityAgentPath: typeof nextSettings.antigravityAgentPath === 'string' ? nextSettings.antigravityAgentPath.trim() : '',
    figmaPath: typeof nextSettings.figmaPath === 'string' ? nextSettings.figmaPath.trim() : '',
    figmaUrl: typeof nextSettings.figmaUrl === 'string' ? nextSettings.figmaUrl.trim() : 'https://www.figma.com',
    obsidianPath: typeof nextSettings.obsidianPath === 'string' ? nextSettings.obsidianPath.trim() : '',
    obsidianVault: typeof nextSettings.obsidianVault === 'string' ? nextSettings.obsidianVault.trim() : '',
    scrcpyPath: typeof nextSettings.scrcpyPath === 'string' ? nextSettings.scrcpyPath.trim() : '',
    autoRefreshCurrentProject: typeof nextSettings.autoRefreshCurrentProject === 'boolean' ? nextSettings.autoRefreshCurrentProject : true,
    autoRefreshInterval: typeof nextSettings.autoRefreshInterval === 'number' && nextSettings.autoRefreshInterval >= 1 ? nextSettings.autoRefreshInterval : 10,
    reakitPath: typeof nextSettings.reakitPath === 'string' ? nextSettings.reakitPath.trim() : '',
    reakitDefaultSource: typeof nextSettings.reakitDefaultSource === 'string' && nextSettings.reakitDefaultSource.trim() ? nextSettings.reakitDefaultSource.trim() : 'apkcombo',
    reakitHeapSize: typeof nextSettings.reakitHeapSize === 'string' && nextSettings.reakitHeapSize.trim() ? nextSettings.reakitHeapSize.trim() : '8g',
    reakitHarnessProfile: typeof nextSettings.reakitHarnessProfile === 'string' && nextSettings.reakitHarnessProfile.trim() ? nextSettings.reakitHarnessProfile.trim() : 'full',
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
