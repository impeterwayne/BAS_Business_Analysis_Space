const assert = require('assert');
const {
  extractPlayStorePackageName,
  cleanStoreAppName,
  inferAppNameFromPackage,
  extractAppInfoFromHtml,
  extractAppIconFromHtml,
  getDomainFavicon,
  getCompetitorInitials,
  formatBytes,
  cleanApkAppName,
  normalizeProjectMetadata,
  parseFigmaUrl,
  parseFirebaseUrl,
  parseDocUrl,
  formatDisplayUrl,
  parseBenchmarkFlows,
  formatFlowSlug,
  buildBenchmarkSlashCommand,
  buildChecklistSlashCommand,
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

test('extractPlayStorePackageName parses package name from various URLs and inputs', () => {
  assert.strictEqual(
    extractPlayStorePackageName('https://play.google.com/store/apps/details?id=com.mservice.momotransaction'),
    'com.mservice.momotransaction'
  );
  assert.strictEqual(
    extractPlayStorePackageName('https://play.google.com/store/apps/details?id=com.shopee.vn&hl=vi'),
    'com.shopee.vn'
  );
  assert.strictEqual(
    extractPlayStorePackageName('market://details?id=com.zing.zalo'),
    'com.zing.zalo'
  );
  assert.strictEqual(
    extractPlayStorePackageName('com.spotify.music'),
    'com.spotify.music'
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

test('cleanStoreAppName strips Google Play suffixes, localized taglines and ensures English app name', () => {
  assert.strictEqual(
    cleanStoreAppName('Shopee: Mua S&#7855;m Online - Apps on Google Play'),
    'Shopee'
  );
  assert.strictEqual(
    cleanStoreAppName('10.10 Shopee Thương Hiệu - Apps on Google Play', 'Shopee'),
    'Shopee'
  );
  assert.strictEqual(
    cleanStoreAppName('MoMo-Trợ Thủ Tài Chính với AI - Ứng dụng trên Google Play'),
    'MoMo'
  );
  assert.strictEqual(
    cleanStoreAppName('Spotify – Nhạc và podcast | Google Play'),
    'Spotify'
  );
  assert.strictEqual(
    cleanStoreAppName('Spotify: Music and Podcasts - Apps on Google Play'),
    'Spotify: Music and Podcasts'
  );
  assert.strictEqual(
    cleanStoreAppName('<b>Telegram</b> - Google Play Store'),
    'Telegram'
  );
});

test('inferAppNameFromPackage correctly infers known and unknown package names', () => {
  assert.strictEqual(inferAppNameFromPackage('com.shopee.vn'), 'Shopee');
  assert.strictEqual(inferAppNameFromPackage('com.mservice.momotransfer'), 'MoMo');
  assert.strictEqual(inferAppNameFromPackage('com.zing.zalo'), 'Zalo');
  assert.strictEqual(inferAppNameFromPackage('org.telegram.messenger'), 'Telegram');
  assert.strictEqual(inferAppNameFromPackage('vn.com.techcombank.mobile'), 'Techcombank');
  assert.strictEqual(inferAppNameFromPackage('com.super_wallet.client'), 'Super Wallet');
});

test('extractAppInfoFromHtml parses title and package from HTML in English', () => {
  const htmlWithH1 = `
    <html>
      <head><title>Shopee: Mua Sắm Online - Apps on Google Play</title></head>
      <body>
        <h1><span>Shopee: Mua Sắm Online</span></h1>
        <a href="/store/apps/details?id=com.shopee.vn">Link</a>
      </body>
    </html>
  `;
  const info1 = extractAppInfoFromHtml(htmlWithH1, '', 'Shopee');
  assert.strictEqual(info1.appName, 'Shopee');
  assert.strictEqual(info1.packageName, 'com.shopee.vn');

  const htmlWithOg = `
    <html>
      <head>
        <meta property="og:title" content="MoMo-Trợ Thủ Tài Chính với AI - Ứng dụng trên Google Play">
      </head>
      <body></body>
    </html>
  `;
  const info2 = extractAppInfoFromHtml(htmlWithOg, 'com.mservice.momotransfer', 'MoMo');
  assert.strictEqual(info2.appName, 'MoMo');
  assert.strictEqual(info2.packageName, 'com.mservice.momotransfer');

  const htmlWithEnglish = `
    <html>
      <head><title>Telegram - Apps on Google Play</title></head>
      <body>
        <h1><span>Telegram</span></h1>
      </body>
    </html>
  `;
  const info3 = extractAppInfoFromHtml(htmlWithEnglish, 'org.telegram.messenger');
  assert.strictEqual(info3.appName, 'Telegram');
});

test('formatBytes formats file sizes correctly', () => {
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(1024), '1 KB');
  assert.strictEqual(formatBytes(1048576), '1 MB');
  assert.strictEqual(formatBytes(47448064), '45.3 MB');
});

test('cleanApkAppName extracts clean readable app names from apk filenames and packages', () => {
  assert.strictEqual(cleanApkAppName('com.mservice.momotransaction.apk'), 'MoMo');
  assert.strictEqual(cleanApkAppName('vn.vnpay.wallet_v12.0.apk'), 'Vnpay');
  assert.strictEqual(cleanApkAppName('grab-release.apk'), 'Grab');
  assert.strictEqual(cleanApkAppName('D:\\builds\\Shopee_v2.3_arm64.apk'), 'Shopee v2.3');
  assert.strictEqual(cleanApkAppName('tikivn-universal-signed.apk'), 'Tikivn');
  assert.strictEqual(cleanApkAppName('com.supercell.clashofclans.xapk'), 'Supercell');
  assert.strictEqual(cleanApkAppName('D:\\Downloads\\Free_Fire_MAX_v2.100.xapk'), 'Free Fire MAX v2.100');
  assert.strictEqual(cleanApkAppName(''), '');
});

test('normalizeProjectMetadata validates and normalizes figmaUrl, apkFiles, and competitors strictly as Android with APK support', () => {
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
        platform: 'iOS', // Should be forced to Android!
        apkPath: 'D:\\builds\\momo-v4.apk',
        apkName: 'momo-v4.apk',
        apkSize: 45000000,
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
  assert.strictEqual(normalized.competitors[0].apkPath, 'D:\\builds\\momo-v4.apk');
  assert.strictEqual(normalized.competitors[0].apkName, 'momo-v4.apk');
  assert.strictEqual(normalized.competitors[0].apkSize, 45000000);
  assert.strictEqual(normalized.competitors[0].jadxSourcePath, '');
  assert.strictEqual(normalized.competitors[0].jadxStatus, '');
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

test('normalizeProjectMetadata trims firebaseUrl and defaults it to empty', () => {
  assert.strictEqual(
    normalizeProjectMetadata({ firebaseUrl: '  https://console.firebase.google.com/project/my-app/overview  ' }).firebaseUrl,
    'https://console.firebase.google.com/project/my-app/overview'
  );
  assert.strictEqual(normalizeProjectMetadata({}).firebaseUrl, '');
  assert.strictEqual(normalizeProjectMetadata({ firebaseUrl: 42 }).firebaseUrl, '');
});

test('parseFirebaseUrl extracts project id and console section', () => {
  const overview = parseFirebaseUrl('https://console.firebase.google.com/project/shop-app-prod/overview');
  assert.strictEqual(overview.isConsole, true);
  assert.strictEqual(overview.projectId, 'shop-app-prod');
  assert.strictEqual(overview.section, 'Overview');

  const crashlytics = parseFirebaseUrl('https://console.firebase.google.com/u/0/project/shop-app-dev/crashlytics/app/android:com.shop/issues');
  assert.strictEqual(crashlytics.projectId, 'shop-app-dev');
  assert.strictEqual(crashlytics.section, 'Crashlytics');

  const root = parseFirebaseUrl('https://console.firebase.google.com/');
  assert.strictEqual(root.projectId, '');
  assert.strictEqual(root.section, 'Console');

  const external = parseFirebaseUrl('https://firebase.google.com/docs');
  assert.strictEqual(external.isConsole, false);

  assert.strictEqual(parseFirebaseUrl('not-a-valid-url'), null);
  assert.strictEqual(parseFirebaseUrl(''), null);
  assert.strictEqual(parseFirebaseUrl(null), null);
});

test('normalizeProjectMetadata trims legacyPrdUrl and legacyChecklistUrl and defaults them to empty', () => {
  const normalized = normalizeProjectMetadata({
    legacyPrdUrl: '  https://docs.google.com/document/d/123/edit  ',
    legacyChecklistUrl: '  https://docs.google.com/spreadsheets/d/456/edit  ',
  });
  assert.strictEqual(normalized.legacyPrdUrl, 'https://docs.google.com/document/d/123/edit');
  assert.strictEqual(normalized.legacyChecklistUrl, 'https://docs.google.com/spreadsheets/d/456/edit');
  assert.strictEqual(normalizeProjectMetadata({}).legacyPrdUrl, '');
  assert.strictEqual(normalizeProjectMetadata({}).legacyChecklistUrl, '');
});

test('parseDocUrl parses Google Docs, Google Sheets, Notion, Confluence, and generic URLs', () => {
  const gdoc = parseDocUrl('https://docs.google.com/document/d/123/edit');
  assert.strictEqual(gdoc.service, 'Google Docs');
  assert.strictEqual(gdoc.host, 'docs.google.com');

  const gsheets = parseDocUrl('https://docs.google.com/spreadsheets/d/456/edit');
  assert.strictEqual(gsheets.service, 'Google Sheets');

  const notion = parseDocUrl('https://www.notion.so/workspace/Checklist-123');
  assert.strictEqual(notion.service, 'Notion');

  const confluence = parseDocUrl('https://company.atlassian.net/wiki/spaces/PRD/pages/1');
  assert.strictEqual(confluence.service, 'Confluence');

  const generic = parseDocUrl('wiki.internal.org/doc/page');
  assert.strictEqual(generic.service, 'wiki.internal.org');

  assert.strictEqual(parseDocUrl(''), null);
  assert.strictEqual(parseDocUrl(null), null);
});

test('formatDisplayUrl formats host and clean path', () => {
  assert.strictEqual(
    formatDisplayUrl('https://www.figma.com/design/Abc123Key/Shop'),
    'figma.com/design/Abc123Key/Shop'
  );
  assert.strictEqual(formatDisplayUrl(''), '');
});

test('extractAppIconFromHtml extracts icon from Google Play img tag, og:image, twitter:image, or link icon', () => {
  const gplayImgHtml = `
    <html>
      <body>
        <img class="T75of nm4vBd arM4bb" src="https://play-lh.googleusercontent.com/testIcon=w240-h480-rw" alt="Icon image" itemprop="image">
      </body>
    </html>
  `;
  assert.strictEqual(
    extractAppIconFromHtml(gplayImgHtml),
    'https://play-lh.googleusercontent.com/testIcon=w240-h480-rw'
  );

  const ogImgHtml = `
    <html>
      <head>
        <meta property="og:image" content="https://play-lh.googleusercontent.com/ogTest=s0-br30&amp;test=1">
      </head>
      <body></body>
    </html>
  `;
  assert.strictEqual(
    extractAppIconFromHtml(ogImgHtml),
    'https://play-lh.googleusercontent.com/ogTest=s0-br30&test=1'
  );

  const appleTouchHtml = `
    <html>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-180.png">
      </head>
    </html>
  `;
  assert.strictEqual(
    extractAppIconFromHtml(appleTouchHtml, 'https://shopee.vn/app'),
    'https://shopee.vn/icons/apple-touch-180.png'
  );
});

test('getCompetitorInitials produces 2-letter uppercase initials with camelCase splitting', () => {
  assert.strictEqual(getCompetitorInitials('MoMo'), 'MM');
  assert.strictEqual(getCompetitorInitials('Shopee'), 'SH');
  assert.strictEqual(getCompetitorInitials('Beauty Camera Sweet Makeup App'), 'BC');
  assert.strictEqual(getCompetitorInitials('YouTube'), 'YT');
  assert.strictEqual(getCompetitorInitials('V'), 'V');
  assert.strictEqual(getCompetitorInitials(''), 'CP');
});

test('getDomainFavicon extracts Google favicon service URL for non-Google domains', () => {
  assert.strictEqual(
    getDomainFavicon('https://shopee.vn/detail'),
    'https://www.google.com/s2/favicons?domain=shopee.vn&sz=128'
  );
  assert.strictEqual(
    getDomainFavicon('https://play.google.com/store/apps/details?id=com.spotify'),
    ''
  );
  assert.strictEqual(getDomainFavicon(''), '');
});

test('parseBenchmarkFlows parses comma, newline, and bullet separated benchmark flows', () => {
  assert.deepStrictEqual(
    parseBenchmarkFlows('Onboarding KYC, QR payment flow, voucher redemption'),
    ['Onboarding KYC', 'QR payment flow', 'voucher redemption']
  );

  const multiline = `
    1. User Registration & KYC
    2. QR Scan & Payment
    3. Money Transfer
  `;
  assert.deepStrictEqual(
    parseBenchmarkFlows(multiline),
    ['User Registration & KYC', 'QR Scan & Payment', 'Money Transfer']
  );

  const bullets = `
    - Biometric Authentication
    * Checkout & Coupons
    • Order History
  `;
  assert.deepStrictEqual(
    parseBenchmarkFlows(bullets),
    ['Biometric Authentication', 'Checkout & Coupons', 'Order History']
  );

  assert.deepStrictEqual(
    parseBenchmarkFlows('Login; Home Feed | Search Product'),
    ['Login', 'Home Feed', 'Search Product']
  );

  assert.deepStrictEqual(parseBenchmarkFlows(''), []);
  assert.deepStrictEqual(parseBenchmarkFlows(null), []);
});

test('formatFlowSlug formats benchmark flow name into clean command parameter slug', () => {
  assert.strictEqual(formatFlowSlug('Onboarding KYC'), 'onboarding-kyc');
  assert.strictEqual(formatFlowSlug('QR Scan & Payment!'), 'qr-scan-payment');
  assert.strictEqual(formatFlowSlug('money_transfer'), 'money-transfer');
  assert.strictEqual(formatFlowSlug('Chuyển tiền'), 'chuyen-tien');
  assert.strictEqual(formatFlowSlug('Đăng nhập OTP'), 'dang-nhap-otp');
  assert.strictEqual(formatFlowSlug(''), '');
});

test('buildBenchmarkSlashCommand generates correct /ba-competitor slash command', () => {
  assert.strictEqual(
    buildBenchmarkSlashCommand('MoMo', 'Onboarding KYC'),
    '/ba-competitor MoMo onboarding-kyc'
  );
  assert.strictEqual(
    buildBenchmarkSlashCommand('com.vnpay.wallet', 'QR Payment'),
    '/ba-competitor com.vnpay.wallet qr-payment'
  );
  assert.strictEqual(
    buildBenchmarkSlashCommand('Shopee', ''),
    '/ba-competitor Shopee'
  );
  assert.strictEqual(
    buildBenchmarkSlashCommand('vn.momo', ['Chuyển tiền', 'Onboarding KYC']),
    '/ba-competitor vn.momo chuyen-tien onboarding-kyc'
  );
  assert.strictEqual(
    buildBenchmarkSlashCommand('MoMo', 'Onboarding KYC', { codeOnly: true }),
    '/ba-competitor MoMo onboarding-kyc --code-only'
  );
  assert.strictEqual(
    buildBenchmarkSlashCommand('Shopee', '', { noDevice: true }),
    '/ba-competitor Shopee --code-only'
  );
});

test('buildChecklistSlashCommand generates correct /ba-checklist slash command for apk-feature-extractor', () => {
  assert.strictEqual(
    buildChecklistSlashCommand('MoMo'),
    '/ba-checklist MoMo'
  );
  assert.strictEqual(
    buildChecklistSlashCommand('com.vnpay.wallet'),
    '/ba-checklist com.vnpay.wallet'
  );
  assert.strictEqual(
    buildChecklistSlashCommand(''),
    '/ba-checklist app'
  );
});

