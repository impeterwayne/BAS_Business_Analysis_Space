const assert = require('assert');
const { normalizeSettings, normalizeWorkspaceConfig } = require('./index');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

const DEFAULT_SETTINGS = {
  vscodePath: '',
  androidStudioPath: '',
  antigravityPath: '',
  antigravityAgentPath: '',
  claudeDesktopPath: '',
  figmaPath: '',
  figmaUrl: 'https://www.figma.com',
  obsidianPath: '',
  obsidianVault: '',
  scrcpyPath: '',
  reakitPath: '',
  symlinkTargets: [],
  syncthingPath: '',
  syncthingApiUrl: '',
  syncthingRootPath: '',
  syncthingFolderId: 'bas-projects',
  syncthingSyncMode: 'all',
  syncthingDeviceIds: [],
  syncthingEnabledProjects: [],
  autoCheckUpdates: true,
};

test('normalizeSettings trims values and drops blank entries', () => {
  assert.deepStrictEqual(
    normalizeSettings({
      vscodePath: '   code  ',
      androidStudioPath: '  studio64  ',
      antigravityPath: '  antigravity-ide  ',
      antigravityAgentPath: '  antigravity  ',
      claudeDesktopPath: '  claude-desktop  ',
    }),
    {
      ...DEFAULT_SETTINGS,
      vscodePath: 'code',
      androidStudioPath: 'studio64',
      antigravityPath: 'antigravity-ide',
      antigravityAgentPath: 'antigravity',
      claudeDesktopPath: 'claude-desktop',
    }
  );
});

test('normalizeSettings falls back for non-object input', () => {
  assert.deepStrictEqual(normalizeSettings(null), DEFAULT_SETTINGS);
});

test('normalizeSettings normalizes Syncthing settings and deduplicates lists', () => {
  assert.deepStrictEqual(
    normalizeSettings({
      syncthingPath: '  /usr/bin/syncthing  ',
      syncthingApiUrl: '  http://127.0.0.1:8384/  ',
      syncthingRootPath: '  /home/peter/BAProjects  ',
      syncthingFolderId: '  custom-folder  ',
      syncthingSyncMode: 'selected',
      syncthingDeviceIds: [' DEV-1 ', '', 'DEV-1', 'DEV-2'],
      syncthingEnabledProjects: [' Wallet ', 'Wallet', '  ', 'PayApp'],
    }),
    {
      ...DEFAULT_SETTINGS,
      syncthingPath: '/usr/bin/syncthing',
      syncthingApiUrl: 'http://127.0.0.1:8384',
      syncthingRootPath: '/home/peter/BAProjects',
      syncthingFolderId: 'custom-folder',
      syncthingSyncMode: 'selected',
      syncthingDeviceIds: ['DEV-1', 'DEV-2'],
      syncthingEnabledProjects: ['Wallet', 'PayApp'],
    }
  );
});

test('normalizeSettings preserves explicit autoCheckUpdates boolean and defaults to true', () => {
  assert.strictEqual(normalizeSettings({ autoCheckUpdates: false }).autoCheckUpdates, false);
  assert.strictEqual(normalizeSettings({ autoCheckUpdates: true }).autoCheckUpdates, true);
  assert.strictEqual(normalizeSettings({ autoCheckUpdates: 'false' }).autoCheckUpdates, true);
});

test('normalizeWorkspaceConfig keeps projects array and normalizes settings', () => {
  const projects = [{ path: 'C:\\repo' }];
  const result = normalizeWorkspaceConfig({ projects, settings: {} });
  assert.strictEqual(result.projects, projects);
  assert.deepStrictEqual(result.settings, DEFAULT_SETTINGS);
});
