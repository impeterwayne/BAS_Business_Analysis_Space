const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseAdbDevicesOutput,
  parseDeviceEnrichment,
  isPackageInstalledInOutput,
  parseAaptBadging,
  parseResolveActivityOutput,
} = require('./index');

test('parseAdbDevicesOutput parses multiple devices with different connection types', () => {
  const sample = `List of devices attached
33081JEHN03270         device product:lynx model:Pixel_7a device:lynx transport_id:1
emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emulator64_x86_64 transport_id:2
192.168.1.158:5555     device product:dm3q model:SM_S918B device:dm3q transport_id:3
TEST_UNAUTH            unauthorized transport_id:4
`;

  const devices = parseAdbDevicesOutput(sample);
  assert.equal(devices.length, 4);

  // USB physical phone
  assert.equal(devices[0].serial, '33081JEHN03270');
  assert.equal(devices[0].state, 'device');
  assert.equal(devices[0].model, 'Pixel 7a');
  assert.equal(devices[0].connectionType, 'usb');
  assert.equal(devices[0].transportId, '1');

  // Emulator
  assert.equal(devices[1].serial, 'emulator-5554');
  assert.equal(devices[1].connectionType, 'emulator');

  // Wireless Wi-Fi
  assert.equal(devices[2].serial, '192.168.1.158:5555');
  assert.equal(devices[2].connectionType, 'wifi');
  assert.equal(devices[2].model, 'SM S918B');

  // Unauthorized
  assert.equal(devices[3].serial, 'TEST_UNAUTH');
  assert.equal(devices[3].state, 'unauthorized');
});

test('parseDeviceEnrichment extracts properties, battery, and screen information correctly', () => {
  const sample = `Google
---BASPLIT---
Pixel 7a
---BASPLIT---
14
---BASPLIT---
34
---BASPLIT---
Physical size: 1080x2400
---BASPLIT---
Physical density: 420
---BASPLIT---
Current Battery Service state:
  AC powered: false
  USB powered: true
  status: 2
  level: 82
---BASPLIT---
46: wlan0: inet 192.168.1.158/24 brd 192.168.1.255
---BASPLIT---
package:/data/app/com.mobilerun.portal-base.apk`;

  const enriched = parseDeviceEnrichment(sample);
  assert.equal(enriched.manufacturer, 'Google');
  assert.equal(enriched.model, 'Pixel 7a');
  assert.equal(enriched.androidVersion, '14');
  assert.equal(enriched.sdkVersion, '34');
  assert.equal(enriched.screenResolution, '1080x2400');
  assert.equal(enriched.screenDensity, '420 dpi');
  assert.equal(enriched.batteryLevel, 82);
  assert.equal(enriched.isCharging, true);
  assert.equal(enriched.batteryStatus, 'Charging');
  assert.equal(enriched.ipAddress, '192.168.1.158');
  assert.equal(enriched.mobilerunPortalInstalled, true);
});

test('isPackageInstalledInOutput correctly matches exact package name and rejects partial matches', () => {
  const pmOutput = `
package:com.example.app.other
package:com.mservice.momotransfer
package:com.example.app
package:com.example.apple
`;
  assert.equal(isPackageInstalledInOutput(pmOutput, 'com.mservice.momotransfer'), true);
  assert.equal(isPackageInstalledInOutput(pmOutput, 'com.example.app'), true);
  assert.equal(isPackageInstalledInOutput(pmOutput, 'com.mservice.momo'), false);
  assert.equal(isPackageInstalledInOutput(pmOutput, 'com.example'), false);
  assert.equal(isPackageInstalledInOutput('', 'com.example.app'), false);
  assert.equal(isPackageInstalledInOutput(null, 'com.example.app'), false);
  assert.equal(isPackageInstalledInOutput(pmOutput, ''), false);
});

test('parseAaptBadging extracts package name and launchable activity from aapt dump badging output', () => {
  const sample = `package: name='com.shopee.vn' versionCode='32001' versionName='3.20.1' compileSdkVersion='34'
sdkVersion:'26'
targetSdkVersion:'34'
uses-permission: name='android.permission.INTERNET'
application-label:'Shopee'
launchable-activity: name='com.shopee.app.ui.home.HomeActivity'  label='Shopee' icon='res/mipmap-xxhdpi/ic_launcher.png'
`;

  const parsed = parseAaptBadging(sample);
  assert.equal(parsed.packageName, 'com.shopee.vn');
  assert.equal(parsed.launchActivity, 'com.shopee.app.ui.home.HomeActivity');

  const empty = parseAaptBadging('');
  assert.equal(empty.packageName, '');
  assert.equal(empty.launchActivity, '');
});

test('parseResolveActivityOutput extracts component name from cmd package resolve-activity output', () => {
  const sample = `priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=true
com.android.settings/.Settings
`;
  assert.equal(parseResolveActivityOutput(sample), 'com.android.settings/.Settings');
  assert.equal(parseResolveActivityOutput(''), '');
  assert.equal(parseResolveActivityOutput(null), '');
});

