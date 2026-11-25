const fs = require('fs');
const path = require('path');
const { normalizeSettings, normalizeWorkspaceConfig } = require('../domain/settings');

function createWorkspaceConfigStore({ configPath }) {
  let workspaceConfig = normalizeWorkspaceConfig(undefined);

  function getConfig() {
    return workspaceConfig;
  }

  function loadConfig() {
    try {
      if (fs.existsSync(configPath)) {
        workspaceConfig = normalizeWorkspaceConfig(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    workspaceConfig = normalizeWorkspaceConfig(workspaceConfig);
    return workspaceConfig;
  }

  function saveConfig() {
    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(workspaceConfig, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }

    return workspaceConfig;
  }

  return {
    getConfig,
    loadConfig,
    saveConfig,
    normalizeSettings,
    normalizeWorkspaceConfig,
  };
}

module.exports = {
  createWorkspaceConfigStore,
  normalizeSettings,
  normalizeWorkspaceConfig,
};
