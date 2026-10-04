const assert = require('assert');
const {
  extractPlayStorePackageName,
  formatBytes,
  normalizeProjectMetadata,
  parseFigmaUrl,
  formatDisplayUrl,
} = require('./index');

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

test('extractPlayStorePackageName parses package name from Google Play Store URL', () => {
  assert.strictEqual(
    extractPlayStorePackageName('https://play.google.com/store/apps/details?id=com.mservice.momotransaction'),
    'com.mservice.momotransaction'
  );
  assert.strictEqual(
    extractPlayStorePackageName('https://play.google.com/store/apps/details?id=com.shopee.vn&hl=vi'),
    'com.shopee.vn'
  );
  assert.strictEqual(
    extractPlayStorePackageName('https://example.com/not-play-store'),
    ''
  );
  assert.strictEqual(
    extractPlayStorePackageName(''),
    ''
  );
});

test('formatBytes formats file sizes correctly', () => {
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(1024), '1 KB');
  assert.strictEqual(formatBytes(1048576), '1 MB');
  assert.strictEqual(formatBytes(47448064), '45.3 MB');
});

test('normalizeProjectMetadata validates and normalizes figmaUrl, apkFiles, and competitors', () => {
  const normalized = normalizeProjectMetadata({
    figmaUrl: '  https://www.figma.com/design/test/Design  ',
    apkFiles: [
      { name: 'app-release.apk', path: 'D:\\builds\\app-release.apk', size: 50000000 },
      { name: '', path: '   ' }, // invalid, should be filtered
    ],
    competitors: [
      {
        name: 'MoMo',
        url: 'https://play.google.com/store/apps/details?id=com.mservice.momotransaction',
        packageName: '',
        platform: 'Android',
        notes: 'Payment & Onboarding',
      },
      { name: '   ' }, // invalid, should be filtered
    ],
  });

  assert.strictEqual(normalized.figmaUrl, 'https://www.figma.com/design/test/Design');
  assert.strictEqual(normalized.apkFiles.length, 1);
  assert.strictEqual(normalized.apkFiles[0].name, 'app-release.apk');
  assert.strictEqual(normalized.apkFiles[0].path, 'D:\\builds\\app-release.apk');
  assert.strictEqual(normalized.competitors.length, 1);
  assert.strictEqual(normalized.competitors[0].name, 'MoMo');
  assert.strictEqual(normalized.competitors[0].packageName, 'com.mservice.momotransaction');
  assert.strictEqual(normalized.competitors[0].platform, 'Android');
});

test('parseFigmaUrl extracts file type, key, title and node-id', () => {
  const design = parseFigmaUrl('https://www.figma.com/design/Abc123Key/Shopping-Cart-App?node-id=10%3A20');
  assert.strictEqual(design.type, 'Design File');
  assert.strictEqual(design.fileKey, 'Abc123Key');
  assert.strictEqual(design.fileName, 'Shopping Cart App');
  assert.strictEqual(design.nodeId, '10:20');

  const proto = parseFigmaUrl('https://www.figma.com/proto/ProtoKey99/Checkout_Flow');
  assert.strictEqual(proto.type, 'Prototype');
  assert.strictEqual(proto.fileKey, 'ProtoKey99');
  assert.strictEqual(proto.fileName, 'Checkout Flow');

  const board = parseFigmaUrl('https://www.figma.com/board/Board77/User-Journey-Map');
  assert.strictEqual(board.type, 'FigJam Board');
  assert.strictEqual(board.fileKey, 'Board77');
  assert.strictEqual(board.fileName, 'User Journey Map');

  const invalid = parseFigmaUrl('not-a-valid-url');
  assert.strictEqual(invalid.type, 'Figma Link');
  assert.strictEqual(invalid.fileName, '');

  assert.strictEqual(parseFigmaUrl(''), null);
  assert.strictEqual(parseFigmaUrl(null), null);
});

test('formatDisplayUrl formats host and clean path', () => {
  assert.strictEqual(
    formatDisplayUrl('https://www.figma.com/design/Abc123Key/Shop'),
    'figma.com/design/Abc123Key/Shop'
  );
  assert.strictEqual(formatDisplayUrl(''), '');
});

