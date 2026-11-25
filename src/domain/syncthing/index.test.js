const { test } = require('node:test');
const assert = require('assert');
const {
  DEFAULT_SYNCTHING_FOLDER_ID,
  SYNCTHING_MANIFEST_REL_PATH,
  normalizeSyncMode,
  parseSyncthingConfigXml,
  parseSyncthingPathsOutput,
  parseSyncthingVersionOutput,
  getProjectFolderInSyncRoot,
  generateStignoreBas,
  ensureStignoreInclude,
  buildPortableProjectManifest,
  portableManifestEquals,
  mergePortableProjectManifest,
  isSyncConflictFile,
  parseSyncConflictFile,
  findSyncConflicts,
} = require('./index');

test('parseSyncthingConfigXml extracts HTTP and TLS HTTPS API URLs and normalizes wildcard addresses', () => {
  const httpXml = `
    <configuration version="37">
      <gui enabled="true" tls="false" debugging="false">
        <address>127.0.0.1:8384</address>
        <apikey>abc123key</apikey>
      </gui>
    </configuration>
  `;
  assert.deepStrictEqual(parseSyncthingConfigXml(httpXml), {
    address: '127.0.0.1:8384',
    apiKey: 'abc123key',
    tls: false,
    apiUrl: 'http://127.0.0.1:8384',
  });

  const wildcardTlsXml = `
    <configuration>
      <gui enabled="true" tls="true">
        <address>0.0.0.0:8385</address>
        <apikey>secret&amp;key</apikey>
      </gui>
    </configuration>
  `;
  assert.deepStrictEqual(parseSyncthingConfigXml(wildcardTlsXml), {
    address: '0.0.0.0:8385',
    apiKey: 'secret&key',
    tls: true,
    apiUrl: 'https://127.0.0.1:8385',
  });

  const ipv6WildcardXml = `
    <configuration>
      <gui tls="false">
        <address>[::]:8384</address>
        <apikey>xyz</apikey>
      </gui>
    </configuration>
  `;
  assert.strictEqual(parseSyncthingConfigXml(ipv6WildcardXml).apiUrl, 'http://127.0.0.1:8384');

  assert.strictEqual(parseSyncthingConfigXml('<configuration></configuration>'), null);
  assert.strictEqual(parseSyncthingConfigXml('<configuration><gui><address>127.0.0.1:8384</address></gui></configuration>'), null);
  assert.strictEqual(parseSyncthingConfigXml(null), null);
});

test('parseSyncthingPathsOutput and parseSyncthingVersionOutput handle Syncthing v2 output', () => {
  const v2Paths = `Configuration file:\n\t/home/peter/.local/state/syncthing/config.xml\n\nDefault sync folder directory:\n\t/home/peter/Sync\n`;
  assert.deepStrictEqual(parseSyncthingPathsOutput(v2Paths), {
    configFile: '/home/peter/.local/state/syncthing/config.xml',
    defaultSyncDir: '/home/peter/Sync',
  });

  const v1Paths = `Configuration file: C:\\Users\\peter\\AppData\\Local\\Syncthing\\config.xml\nDefault sync folder directory: C:\\Users\\peter\\Sync\n`;
  assert.deepStrictEqual(parseSyncthingPathsOutput(v1Paths), {
    configFile: 'C:\\Users\\peter\\AppData\\Local\\Syncthing\\config.xml',
    defaultSyncDir: 'C:\\Users\\peter\\Sync',
  });

  assert.strictEqual(
    parseSyncthingVersionOutput('syncthing v2.1.7 "Hafnium Hornet" (go1.27.3 linux-amd64)'),
    'v2.1.7'
  );
  assert.strictEqual(parseSyncthingVersionOutput('not syncthing'), null);
});

test('getProjectFolderInSyncRoot accepts direct children only', () => {
  assert.strictEqual(getProjectFolderInSyncRoot('/home/user/BAS', '/home/user/BAS/WalletApp'), 'WalletApp');
  assert.strictEqual(getProjectFolderInSyncRoot('/home/user/BAS/', '/home/user/BAS/WalletApp/'), 'WalletApp');
  assert.strictEqual(
    getProjectFolderInSyncRoot('D:\\BAS_Projects', 'd:\\bas_projects\\WalletApp', { caseInsensitive: true }),
    'WalletApp'
  );
  assert.strictEqual(getProjectFolderInSyncRoot('/home/user/BAS', '/home/user/BAS'), null);
  assert.strictEqual(getProjectFolderInSyncRoot('/home/user/BAS', '/home/user/BAS/nested/WalletApp'), null);
  assert.strictEqual(getProjectFolderInSyncRoot('/home/user/BAS', '/home/user/Other/WalletApp'), null);
});

test('generateStignoreBas generates selected allowlist and all wildcard rules cleanly', () => {
  assert.strictEqual(normalizeSyncMode('all'), 'all');
  assert.strictEqual(normalizeSyncMode('selected'), 'selected');
  assert.strictEqual(normalizeSyncMode('invalid'), 'all');
  assert.strictEqual(normalizeSyncMode(undefined), 'all');

  const selected = generateStignoreBas({
    mode: 'selected',
    enabledProjects: ['Zeta', 'Alpha', 'Alpha', '../bad', 'sub/dir'],
  });
  const expectedSelected = [
    '// Managed by BA Space — do not edit manually',
    '/*/docs/.obsidian/workspace*.json',
    '/*/docs/.obsidian/cache',
    '**/.DS_Store',
    '**/Thumbs.db',
    '!/.stignore-bas',
    '!/Alpha/docs',
    '!/Alpha/docs/**',
    '!/Alpha/.bas',
    '!/Alpha/.bas/**',
    '/Alpha/*',
    '!/Alpha',
    '!/Zeta/docs',
    '!/Zeta/docs/**',
    '!/Zeta/.bas',
    '!/Zeta/.bas/**',
    '/Zeta/*',
    '!/Zeta',
    '*',
    '',
  ].join('\n');
  assert.strictEqual(selected, expectedSelected);

  const selectedEmpty = generateStignoreBas({ mode: 'selected', enabledProjects: [] });
  assert.ok(selectedEmpty.endsWith('!/.stignore-bas\n*\n'));

  const allMode = generateStignoreBas({ mode: 'all', enabledProjects: ['Alpha'] });
  const expectedAll = [
    '// Managed by BA Space — do not edit manually',
    '/*/docs/.obsidian/workspace*.json',
    '/*/docs/.obsidian/cache',
    '**/.DS_Store',
    '**/Thumbs.db',
    '!/.stignore-bas',
    '!/*/docs',
    '!/*/docs/**',
    '!/*/.bas',
    '!/*/.bas/**',
    '/*/*',
    '',
  ].join('\n');
  assert.strictEqual(allMode, expectedAll);

  const defaultMode = generateStignoreBas();
  assert.strictEqual(defaultMode, expectedAll);
});

test('ensureStignoreInclude adds include idempotently while preserving custom lines', () => {
  assert.strictEqual(ensureStignoreInclude(''), '#include .stignore-bas\n');
  const custom = '// my custom ignore\n*.tmp';
  assert.strictEqual(ensureStignoreInclude(custom), '// my custom ignore\n*.tmp\n#include .stignore-bas\n');
  const already = '// custom\n#include .stignore-bas\n*.log\n';
  assert.strictEqual(ensureStignoreInclude(already), already);
});

test('buildPortableProjectManifest strips machine-local fields and portableManifestEquals ignores timestamps', () => {
  const project = {
    name: 'WalletApp',
    path: '/home/user/BAS/WalletApp',
    addedAt: 1000,
    figmaUrl: ' https://www.figma.com/design/abc ',
    firebaseUrl: 'https://console.firebase.google.com/project/w',
    planeUrl: 'https://plane.example.com/ws/projects/1',
    legacyPrdUrl: 'https://docs.google.com/document/d/1',
    legacyChecklistUrl: 'https://docs.google.com/spreadsheets/d/2',
    checklistScope: 'onboarding, transfer',
    apkFiles: [{ id: 'apk1', path: '/tmp/app.apk', name: 'app.apk', size: 123 }],
    competitors: [
      {
        id: 'comp_1',
        name: 'MoMo',
        url: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer',
        iconUrl: 'https://example.com/icon.png',
        packageName: 'com.mservice.momotransfer',
        platform: 'Android',
        notes: 'transfer, qr',
        analysisMode: 'hybrid',
        addedAt: 2000,
        apkPath: '/local/momo.apk',
        apkName: 'momo.apk',
        apkSize: 555,
        apkAddedAt: 3000,
        jadxSourcePath: '/local/jadx_src',
        jadxStatus: 'ready',
      },
    ],
  };

  const manifest = buildPortableProjectManifest(project, { now: () => 9999 });
  assert.strictEqual(manifest.schemaVersion, 1);
  assert.strictEqual(manifest.updatedAt, 9999);
  assert.strictEqual('path' in manifest.project, false);
  assert.strictEqual('apkFiles' in manifest.project, false);
  assert.deepStrictEqual(manifest.project, {
    name: 'WalletApp',
    figmaUrl: 'https://www.figma.com/design/abc',
    firebaseUrl: 'https://console.firebase.google.com/project/w',
    planeUrl: 'https://plane.example.com/ws/projects/1',
    legacyPrdUrl: 'https://docs.google.com/document/d/1',
    legacyChecklistUrl: 'https://docs.google.com/spreadsheets/d/2',
    checklistScope: 'onboarding, transfer',
  });
  assert.deepStrictEqual(manifest.competitors, [
    {
      id: 'comp_1',
      name: 'MoMo',
      url: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer',
      iconUrl: 'https://example.com/icon.png',
      packageName: 'com.mservice.momotransfer',
      platform: 'Android',
      notes: 'transfer, qr',
      analysisMode: 'hybrid',
      addedAt: 2000,
    },
  ]);

  const laterManifest = buildPortableProjectManifest(project, { now: () => 123456 });
  assert.strictEqual(portableManifestEquals(manifest, laterManifest), true);
  assert.strictEqual(DEFAULT_SYNCTHING_FOLDER_ID, 'bas-projects');
  assert.strictEqual(SYNCTHING_MANIFEST_REL_PATH, '.bas/project-sync.json');
});

test('mergePortableProjectManifest preserves local APK/JADX fields while applying remote updates', () => {
  const localProject = {
    name: 'WalletApp',
    path: '/home/user/BAS/WalletApp',
    addedAt: 1000,
    figmaUrl: 'https://www.figma.com/old',
    apkFiles: [{ id: 'local_apk', path: '/local/our.apk', name: 'our.apk', size: 100 }],
    competitors: [
      {
        id: 'comp_1',
        name: 'MoMo',
        url: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer',
        packageName: 'com.mservice.momotransfer',
        platform: 'Android',
        notes: 'old flow',
        analysisMode: 'code-only',
        addedAt: 2000,
        apkPath: '/local/momo.apk',
        apkName: 'momo.apk',
        apkSize: 999,
        apkAddedAt: 3000,
        jadxSourcePath: '/local/jadx_src',
        jadxStatus: 'ready',
      },
      {
        id: 'comp_old_id',
        name: 'ZaloPay',
        packageName: 'vn.com.vng.zalopay',
        platform: 'Android',
        notes: 'old',
        analysisMode: 'code-only',
        addedAt: 2100,
        apkPath: '/local/zalo.apk',
        jadxSourcePath: '/local/zalo_jadx',
        jadxStatus: 'ready',
      },
    ],
  };

  const remoteManifest = {
    schemaVersion: 1,
    updatedAt: 5000,
    project: {
      name: 'WalletApp',
      figmaUrl: 'https://www.figma.com/new',
      firebaseUrl: 'https://console.firebase.google.com/project/new',
      planeUrl: '',
      legacyPrdUrl: '',
      legacyChecklistUrl: '',
      checklistScope: 'payments',
    },
    competitors: [
      {
        id: 'comp_1',
        name: 'MoMo Updated',
        url: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer',
        iconUrl: 'https://example.com/momo.png',
        packageName: 'com.mservice.momotransfer',
        platform: 'Android',
        notes: 'qr, transfer',
        analysisMode: 'hybrid',
        addedAt: 2000,
      },
      {
        id: 'comp_new_id',
        name: 'ZaloPay',
        packageName: 'vn.com.vng.zalopay',
        platform: 'Android',
        notes: 'bill pay',
        analysisMode: 'code-only',
        addedAt: 2100,
      },
    ],
  };

  const merged = mergePortableProjectManifest(localProject, remoteManifest);
  assert.strictEqual(merged.changed, true);
  assert.strictEqual(merged.competitorsChanged, true);
  assert.strictEqual(merged.project.path, '/home/user/BAS/WalletApp');
  assert.strictEqual(merged.project.figmaUrl, 'https://www.figma.com/new');
  assert.strictEqual(merged.project.checklistScope, 'payments');
  assert.strictEqual(merged.project.apkFiles.length, 1);

  assert.strictEqual(merged.project.competitors[0].name, 'MoMo Updated');
  assert.strictEqual(merged.project.competitors[0].apkPath, '/local/momo.apk');
  assert.strictEqual(merged.project.competitors[0].jadxSourcePath, '/local/jadx_src');
  assert.strictEqual(merged.project.competitors[0].jadxStatus, 'ready');

  // Matched by packageName fallback
  assert.strictEqual(merged.project.competitors[1].apkPath, '/local/zalo.apk');
  assert.strictEqual(merged.project.competitors[1].jadxSourcePath, '/local/zalo_jadx');

  // Second merge with same manifest reports no change
  const secondMerge = mergePortableProjectManifest(merged.project, remoteManifest);
  assert.strictEqual(secondMerge.changed, false);
  assert.strictEqual(secondMerge.competitorsChanged, false);
});

test('findSyncConflicts and parseSyncConflictFile detect and parse Syncthing conflict files', () => {
  assert.strictEqual(isSyncConflictFile('docs/PRD.sync-conflict-20261125-140000-ABCD123.md'), true);
  assert.strictEqual(isSyncConflictFile('.bas/project-sync.sync-conflict-20261125-140000-XYZ.json'), true);
  assert.strictEqual(isSyncConflictFile('docs/PRD.md'), false);

  const conflicts = findSyncConflicts([
    'docs/PRD.md',
    'docs/PRD.sync-conflict-20261125-140000-ABCD123.md',
    '.bas\\project-sync.sync-conflict-20261125-140500-DEV2.json',
    '.bas/project-sync.json',
  ]);

  assert.deepStrictEqual(conflicts, [
    {
      relativePath: '.bas/project-sync.sync-conflict-20261125-140500-DEV2.json',
      originalRelativePath: '.bas/project-sync.json',
      timestamp: '20261125-140500',
      devicePrefix: 'DEV2',
      isManifestConflict: true,
    },
    {
      relativePath: 'docs/PRD.sync-conflict-20261125-140000-ABCD123.md',
      originalRelativePath: 'docs/PRD.md',
      timestamp: '20261125-140000',
      devicePrefix: 'ABCD123',
      isManifestConflict: false,
    },
  ]);

  assert.strictEqual(parseSyncConflictFile('docs/normal.md'), null);
});
