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

test('normalizeSettings trims values and drops blank entries', () => {
  assert.deepStrictEqual(
    normalizeSettings({
      subworktreeBranchParents: {
        ' feature/foo ': ' main ',
        '': 'ignored',
        'child': '   ',
      },
      vscodePath: '   code  ',
      androidStudioPath: '  studio64  ',
      antigravityPath: '  antigravity-ide  ',
      antigravityAgentPath: '  antigravity  ',
    }),
    {
      subworktreeBranchParents: {
        'feature/foo': 'main',
      },
      vscodePath: 'code',
      androidStudioPath: 'studio64',
      antigravityPath: 'antigravity-ide',
      antigravityAgentPath: 'antigravity',
      figmaPath: '',
      figmaUrl: 'https://www.figma.com',
      scrcpyPath: '',
      pokitSourcePath: '',
      openspecSourcePath: '',
      autoRefreshCurrentProject: true,
      autoRefreshInterval: 10,
      planeApiKey: 'plane_api_68b11fbeb14c431cad3a1f87455b622a',
      planeBaseUrl: 'https://plane.itgproduct.com',
      planeWorkspaceSlug: 'product',
      projectPlaneIds: {},
      reakitPath: '',
      reakitDefaultSource: 'apkcombo',
      reakitHeapSize: '8g',
      reakitHarnessProfile: 'full',
    }
  );
});

test('normalizeSettings falls back for non-object input', () => {
  assert.deepStrictEqual(normalizeSettings(null), {
    subworktreeBranchParents: {},
    vscodePath: '',
    androidStudioPath: '',
    antigravityPath: '',
    antigravityAgentPath: '',
    figmaPath: '',
    figmaUrl: 'https://www.figma.com',
    scrcpyPath: '',
    pokitSourcePath: '',
    openspecSourcePath: '',
    autoRefreshCurrentProject: true,
    autoRefreshInterval: 10,
    planeApiKey: 'plane_api_68b11fbeb14c431cad3a1f87455b622a',
    planeBaseUrl: 'https://plane.itgproduct.com',
    planeWorkspaceSlug: 'product',
    projectPlaneIds: {},
    reakitPath: '',
    reakitDefaultSource: 'apkcombo',
    reakitHeapSize: '8g',
    reakitHarnessProfile: 'full',
  });
});

test('normalizeSettings trims and defaults ReaKit settings', () => {
  assert.strictEqual(
    normalizeSettings({ reakitPath: '  D:\\ReaKit  ' }).reakitPath,
    'D:\\ReaKit'
  );
  assert.strictEqual(
    normalizeSettings({ reakitDefaultSource: '  fdroid  ' }).reakitDefaultSource,
    'fdroid'
  );
  assert.strictEqual(
    normalizeSettings({ reakitHeapSize: '  16g  ' }).reakitHeapSize,
    '16g'
  );
  assert.strictEqual(
    normalizeSettings({ reakitHarnessProfile: '  native  ' }).reakitHarnessProfile,
    'native'
  );
  assert.strictEqual(
    normalizeSettings({ reakitDefaultSource: '' }).reakitDefaultSource,
    'apkcombo'
  );
});

test('normalizeSettings preserves autoRefreshCurrentProject boolean state', () => {
  assert.strictEqual(
    normalizeSettings({ autoRefreshCurrentProject: false }).autoRefreshCurrentProject,
    false
  );
  assert.strictEqual(
    normalizeSettings({ autoRefreshCurrentProject: true }).autoRefreshCurrentProject,
    true
  );
  assert.strictEqual(
    normalizeSettings({}).autoRefreshCurrentProject,
    true
  );
});

test('normalizeSettings validates and preserves autoRefreshInterval', () => {
  assert.strictEqual(
    normalizeSettings({ autoRefreshInterval: 5 }).autoRefreshInterval,
    5
  );
  assert.strictEqual(
    normalizeSettings({ autoRefreshInterval: 0 }).autoRefreshInterval,
    10
  );
  assert.strictEqual(
    normalizeSettings({ autoRefreshInterval: -5 }).autoRefreshInterval,
    10
  );
  assert.strictEqual(
    normalizeSettings({ autoRefreshInterval: 'not-a-number' }).autoRefreshInterval,
    10
  );
});

test('normalizeWorkspaceConfig keeps projects array and normalizes settings', () => {
  const projects = [{ path: 'C:\\repo' }];
  const result = normalizeWorkspaceConfig({ projects, settings: {} });
  assert.strictEqual(result.projects, projects);
  assert.deepStrictEqual(result.settings, {
    subworktreeBranchParents: {},
    vscodePath: '',
    androidStudioPath: '',
    antigravityPath: '',
    antigravityAgentPath: '',
    figmaPath: '',
    figmaUrl: 'https://www.figma.com',
    scrcpyPath: '',
    pokitSourcePath: '',
    openspecSourcePath: '',
    autoRefreshCurrentProject: true,
    autoRefreshInterval: 10,
    planeApiKey: 'plane_api_68b11fbeb14c431cad3a1f87455b622a',
    planeBaseUrl: 'https://plane.itgproduct.com',
    planeWorkspaceSlug: 'product',
    projectPlaneIds: {},
    reakitPath: '',
    reakitDefaultSource: 'apkcombo',
    reakitHeapSize: '8g',
    reakitHarnessProfile: 'full',
  });
});
