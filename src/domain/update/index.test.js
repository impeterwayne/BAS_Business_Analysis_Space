const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_GITHUB_REPO,
  parseRepoFromPackageJson,
  parseSemver,
  compareVersions,
  isNewerVersion,
  isInstallableReleaseAsset,
  selectReleaseAsset,
  parseHumanFileSize,
  extractTagFromReleaseUrl,
  parseExpandedAssetsHtml,
  parseReleasesAtomEntry,
  parseGitHubRelease,
  formatReleaseNotesHtml,
} = require('./index');

test('parseSemver parses standard, v-prefixed, prerelease, and build metadata versions', () => {
  assert.deepStrictEqual(parseSemver('v1.8.2'), {
    major: 1,
    minor: 8,
    patch: 2,
    prerelease: [],
    normalized: '1.8.2',
  });
  assert.deepStrictEqual(parseSemver(' 2.0.0-beta.1+build42 '), {
    major: 2,
    minor: 0,
    patch: 0,
    prerelease: ['beta', '1'],
    normalized: '2.0.0-beta.1',
  });
  assert.strictEqual(parseSemver('not-a-version'), null);
  assert.strictEqual(parseSemver(''), null);
});

test('compareVersions and isNewerVersion follow SemVer 2.0.0 rules', () => {
  assert.strictEqual(compareVersions('1.8.2', 'v1.8.2'), 0);
  assert.strictEqual(compareVersions('1.9.0', '1.8.9'), 1);
  assert.strictEqual(compareVersions('2.0.0', '1.99.99'), 1);
  assert.strictEqual(compareVersions('1.8.2', '1.8.3'), -1);

  assert.strictEqual(compareVersions('1.9.0', '1.9.0-beta.1'), 1);
  assert.strictEqual(compareVersions('1.9.0-beta.2', '1.9.0-beta.1'), 1);
  assert.strictEqual(compareVersions('1.9.0-beta.10', '1.9.0-beta.2'), 1);
  assert.strictEqual(compareVersions('1.9.0-1', '1.9.0-alpha'), -1);

  assert.strictEqual(isNewerVersion('v1.8.3', '1.8.2'), true);
  assert.strictEqual(isNewerVersion('v1.8.2', '1.8.2'), false);
  assert.strictEqual(isNewerVersion('v1.8.1', '1.8.2'), false);
  assert.strictEqual(isNewerVersion('invalid', '1.8.2'), false);
});

test('isInstallableReleaseAsset filters metadata and preserves installers', () => {
  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-Setup.exe'), true);
  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-Portable.exe'), true);
  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-mac-arm64.dmg'), true);
  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-linux-x64.AppImage'), true);
  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-linux-x64.tar.gz'), true);

  assert.strictEqual(isInstallableReleaseAsset('BA.Space-1.8.3-Setup.exe.blockmap'), false);
  assert.strictEqual(isInstallableReleaseAsset('latest.yml'), false);
  assert.strictEqual(isInstallableReleaseAsset('latest-mac.yml'), false);
  assert.strictEqual(isInstallableReleaseAsset('latest-linux.yml'), false);
  assert.strictEqual(isInstallableReleaseAsset('RELEASES'), false);
  assert.strictEqual(isInstallableReleaseAsset('checksums.sha256'), false);
  assert.strictEqual(isInstallableReleaseAsset(''), false);
});

test('selectReleaseAsset picks the best installer for Windows, macOS, and Linux', () => {
  const assets = [
    { name: 'latest.yml', size: 100 },
    { name: 'BA.Space-1.8.3-Setup.exe.blockmap', size: 200 },
    { name: 'BA.Space-1.8.3-Portable.exe', size: 8000 },
    { name: 'BA.Space-1.8.3-Setup.exe', size: 9000 },
    { name: 'BA.Space-1.8.3-mac-arm64.dmg', size: 9500 },
    { name: 'BA.Space-1.8.3-mac-arm64.zip', size: 9200 },
    { name: 'BA.Space-1.8.3-mac-x64.dmg', size: 9600 },
    { name: 'BA.Space-1.8.3-linux-x64.tar.gz', size: 8500 },
    { name: 'BA.Space-1.8.3-linux-x64.AppImage', size: 9800 },
  ];

  const win = selectReleaseAsset(assets, 'win32', 'x64');
  assert.strictEqual(win.recommended.name, 'BA.Space-1.8.3-Setup.exe');
  assert.strictEqual(win.all.some((a) => a.name === 'latest.yml'), false);
  assert.strictEqual(win.all.some((a) => a.name.endsWith('.blockmap')), false);

  const macArm = selectReleaseAsset(assets, 'darwin', 'arm64');
  assert.strictEqual(macArm.recommended.name, 'BA.Space-1.8.3-mac-arm64.dmg');

  const macX64 = selectReleaseAsset(assets, 'darwin', 'x64');
  assert.strictEqual(macX64.recommended.name, 'BA.Space-1.8.3-mac-x64.dmg');

  const linux = selectReleaseAsset(assets, 'linux', 'x64');
  assert.strictEqual(linux.recommended.name, 'BA.Space-1.8.3-linux-x64.AppImage');
});

test('parseRepoFromPackageJson reads publish config, repository URL, or default', () => {
  assert.deepStrictEqual(
    parseRepoFromPackageJson({
      build: { publish: [{ provider: 'github', owner: 'acme', repo: 'app-repo' }] },
    }),
    { owner: 'acme', repo: 'app-repo' }
  );

  assert.deepStrictEqual(
    parseRepoFromPackageJson({
      repository: { type: 'git', url: 'https://github.com/foo/bar.git' },
    }),
    { owner: 'foo', repo: 'bar' }
  );

  assert.deepStrictEqual(parseRepoFromPackageJson({}), DEFAULT_GITHUB_REPO);
});

test('parseGitHubRelease extracts metadata, selects recommended asset, and detects updates', () => {
  const raw = {
    tag_name: 'v1.9.0',
    name: 'Release 1.9.0',
    body: '### Highlights\n- Added **auto updater**\n- See [docs](https://example.com)',
    html_url: 'https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases/tag/v1.9.0',
    published_at: '2026-11-25T10:00:00Z',
    assets: [
      { id: 1, name: 'latest-linux.yml', size: 123, browser_download_url: 'https://github.com/x/y/releases/download/v1.9.0/latest-linux.yml' },
      { id: 2, name: 'BA.Space-1.9.0-linux-x64.AppImage', size: 102400, browser_download_url: 'https://github.com/x/y/releases/download/v1.9.0/BA.Space-1.9.0-linux-x64.AppImage' },
    ],
  };

  const parsed = parseGitHubRelease(raw, '1.8.2', 'linux', 'x64');
  assert.strictEqual(parsed.tagName, 'v1.9.0');
  assert.strictEqual(parsed.version, '1.9.0');
  assert.strictEqual(parsed.updateAvailable, true);
  assert.strictEqual(parsed.assets.length, 1);
  assert.strictEqual(parsed.recommendedAsset.name, 'BA.Space-1.9.0-linux-x64.AppImage');

  const current = parseGitHubRelease(raw, '1.9.0', 'linux', 'x64');
  assert.strictEqual(current.updateAvailable, false);
});

test('formatReleaseNotesHtml renders markdown safely and strips unsafe HTML/links', () => {
  const html = formatReleaseNotesHtml(
    '### What\'s New\n- Fixed `bug` and **crash**\n- <script>alert(1)</script>\n- Bad [xss](javascript:alert(1)) and [ok](https://github.com)'
  );
  assert.ok(html.includes('<h4 class="update-notes-h">What&#39;s New</h4>'));
  assert.ok(html.includes('<li>Fixed <code>bug</code> and <strong>crash</strong></li>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('<a href="https://github.com" target="_blank" rel="noopener noreferrer">ok</a>'));
});

test('parseHumanFileSize parses Bytes, KB, MB, and GB strings', () => {
  assert.strictEqual(parseHumanFileSize('394 Bytes'), 394);
  assert.strictEqual(parseHumanFileSize('512 B'), 512);
  assert.strictEqual(parseHumanFileSize('373 KB'), 373 * 1024);
  assert.strictEqual(parseHumanFileSize('380 MB'), 380 * 1024 * 1024);
  assert.strictEqual(parseHumanFileSize('1.5 GB'), Math.round(1.5 * 1024 * 1024 * 1024));
  assert.strictEqual(parseHumanFileSize('unknown'), 0);
});

test('extractTagFromReleaseUrl extracts decoded tag from GitHub release tag URLs', () => {
  assert.strictEqual(
    extractTagFromReleaseUrl('https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases/tag/v1.8.2'),
    'v1.8.2'
  );
  assert.strictEqual(
    extractTagFromReleaseUrl('https://github.com/org/repo/releases/tag/v2.0.0%2B1?foo=bar'),
    'v2.0.0+1'
  );
  assert.strictEqual(
    extractTagFromReleaseUrl('https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases'),
    ''
  );
});

test('parseExpandedAssetsHtml extracts asset download URLs and approximate sizes cleanly', () => {
  const html = `
    <ul>
      <li class="Box-row">
        <a href="/impeterwayne/BAS_Business_Analysis_Space/releases/download/v1.8.2/BA-Space-1.8.2-linux-x86_64.AppImage">AppImage</a>
        <span>380 MB</span>
      </li>
      <li class="Box-row">
        <a href="/impeterwayne/BAS_Business_Analysis_Space/releases/download/v1.8.2/BA-Space-1.8.2-Setup.exe">Setup</a>
        <span>302 MB</span>
      </li>
      <li class="Box-row">
        <a href="/impeterwayne/BAS_Business_Analysis_Space/releases/download/v1.8.2/BA-Space-1.8.2-Setup.exe.blockmap">blockmap</a>
        <span>324 KB</span>
      </li>
      <li class="Box-row">
        <a href="/impeterwayne/BAS_Business_Analysis_Space/releases/download/v1.8.2/latest.yml">latest.yml</a>
        <span>345 Bytes</span>
      </li>
    </ul>
  `;

  const assets = parseExpandedAssetsHtml(html, 'impeterwayne', 'BAS_Business_Analysis_Space', 'v1.8.2');
  assert.strictEqual(assets.length, 4);
  assert.strictEqual(assets[0].name, 'BA-Space-1.8.2-linux-x86_64.AppImage');
  assert.strictEqual(assets[0].size, 380 * 1024 * 1024);
  assert.strictEqual(assets[0].sizeApproximate, true);
  assert.strictEqual(
    assets[0].downloadUrl,
    'https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases/download/v1.8.2/BA-Space-1.8.2-linux-x86_64.AppImage'
  );

  const parsed = parseGitHubRelease(
    { tag_name: 'v1.8.2', name: '1.8.2', body: '', assets },
    '1.8.1',
    'linux',
    'x64'
  );
  assert.strictEqual(parsed.updateAvailable, true);
  assert.strictEqual(parsed.assets.length, 2);
  assert.strictEqual(parsed.recommendedAsset.name, 'BA-Space-1.8.2-linux-x86_64.AppImage');
  assert.strictEqual(parsed.recommendedAsset.sizeApproximate, true);
});

test('parseReleasesAtomEntry extracts title, date, and converts HTML content to safe markdown', () => {
  const atomXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>tag:github.com,2008:Repository/1/v1.8.2</id>
        <updated>2026-11-25T04:25:20Z</updated>
        <link rel="alternate" type="text/html" href="https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases/tag/v1.8.2"/>
        <title>1.8.2</title>
        <content>No content.</content>
      </entry>
      <entry>
        <id>tag:github.com,2008:Repository/1/v1.8.0</id>
        <updated>2026-11-22T00:20:41Z</updated>
        <link rel="alternate" type="text/html" href="https://github.com/impeterwayne/BAS_Business_Analysis_Space/releases/tag/v1.8.0"/>
        <title>Release 1.8.0</title>
        <content type="html">&lt;h2&gt;What&#39;s Changed&lt;/h2&gt;&lt;ul&gt;&lt;li&gt;&lt;strong&gt;Updater&lt;/strong&gt; (&lt;code&gt;app.ts&lt;/code&gt;) &lt;a href=&quot;https://github.com&quot;&gt;link&lt;/a&gt;&lt;/li&gt;&lt;/ul&gt;</content>
      </entry>
    </feed>
  `;

  const emptyEntry = parseReleasesAtomEntry(atomXml, 'v1.8.2');
  assert.deepStrictEqual(emptyEntry, {
    name: '1.8.2',
    publishedAt: '2026-11-25T04:25:20Z',
    body: '',
  });

  const richEntry = parseReleasesAtomEntry(atomXml, 'v1.8.0');
  assert.strictEqual(richEntry.name, 'Release 1.8.0');
  assert.strictEqual(richEntry.publishedAt, '2026-11-22T00:20:41Z');
  assert.ok(richEntry.body.includes('### What\'s Changed'));
  assert.ok(richEntry.body.includes('- **Updater** (`app.ts`) [link](https://github.com)'));

  const rendered = formatReleaseNotesHtml(richEntry.body);
  assert.ok(rendered.includes('<h4 class="update-notes-h">What&#39;s Changed</h4>'));
  assert.ok(rendered.includes('<li><strong>Updater</strong> (<code>app.ts</code>) <a href="https://github.com" target="_blank" rel="noopener noreferrer">link</a></li>'));
});
