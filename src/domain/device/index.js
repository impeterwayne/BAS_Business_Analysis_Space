function parseAdbDevicesOutput(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') return [];

  const lines = rawOutput.split(/\r?\n/).slice(1);
  const devices = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('*')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    const serial = parts[0];
    const rawState = parts[1].toLowerCase();

    let state = 'unknown';
    if (rawState === 'device') state = 'device';
    else if (rawState === 'unauthorized') state = 'unauthorized';
    else if (rawState === 'offline') state = 'offline';
    else if (rawState === 'bootloader') state = 'bootloader';
    else if (rawState === 'authorizing') state = 'authorizing';

    let product = '';
    let model = '';
    let transportId = '';

    for (let i = 2; i < parts.length; i++) {
      const item = parts[i];
      if (item.startsWith('product:')) product = item.substring('product:'.length);
      else if (item.startsWith('model:')) model = item.substring('model:'.length);
      else if (item.startsWith('transport_id:')) transportId = item.substring('transport_id:'.length);
    }

    let connectionType = 'usb';
    if (serial.startsWith('emulator-')) {
      connectionType = 'emulator';
    } else if (serial.includes(':')) {
      connectionType = 'wifi';
    }

    devices.push({
      serial,
      state,
      product,
      model: model.replace(/_/g, ' ') || product || serial,
      transportId,
      connectionType,
    });
  }

  return devices;
}

function parseDeviceEnrichment(output) {
  const result = {
    manufacturer: '',
    model: '',
    androidVersion: '',
    sdkVersion: '',
    screenResolution: '',
    screenDensity: '',
    batteryLevel: null,
    batteryStatus: 'Unknown',
    isCharging: false,
    ipAddress: null,
    mobilerunPortalInstalled: false,
  };

  if (!output || typeof output !== 'string') return result;

  const sections = output.split('---BASPLIT---').map((s) => s.trim());
  if (sections.length < 2) return result;

  result.manufacturer = sections[0] || '';
  if (sections[1]) result.model = sections[1].replace(/_/g, ' ');
  if (sections[2]) result.androidVersion = sections[2];
  if (sections[3]) result.sdkVersion = sections[3];

  if (sections[4]) {
    const sizeMatch = sections[4].match(/Physical size:\s*(\d+x\d+)/i) || sections[4].match(/(\d+x\d+)/);
    if (sizeMatch) result.screenResolution = sizeMatch[1];
  }

  if (sections[5]) {
    const densMatch = sections[5].match(/Physical density:\s*(\d+)/i) || sections[5].match(/(\d+)/);
    if (densMatch) result.screenDensity = `${densMatch[1]} dpi`;
  }

  if (sections[6]) {
    const batteryRaw = sections[6];
    const levelMatch = batteryRaw.match(/level:\s*(\d+)/i);
    if (levelMatch) result.batteryLevel = parseInt(levelMatch[1], 10);

    const statusMatch = batteryRaw.match(/status:\s*(\d+)/i);
    const acPowered = /AC powered:\s*true/i.test(batteryRaw);
    const usbPowered = /USB powered:\s*true/i.test(batteryRaw);
    const wirelessPowered = /Wireless powered:\s*true/i.test(batteryRaw);

    result.isCharging = acPowered || usbPowered || wirelessPowered || (statusMatch ? statusMatch[1] === '2' : false);
    if (result.isCharging) {
      result.batteryStatus = 'Charging';
    } else if (result.batteryLevel === 100) {
      result.batteryStatus = 'Full';
    } else {
      result.batteryStatus = 'Discharging';
    }
  }

  if (sections[7]) {
    const ipMatch = sections[7].match(/inet\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
    if (ipMatch) result.ipAddress = ipMatch[1];
  }

  if (sections[8] && sections[8].includes('com.mobilerun.portal')) {
    result.mobilerunPortalInstalled = true;
  }

  return result;
}

function isPackageInstalledInOutput(rawOutput, packageName) {
  if (!rawOutput || typeof rawOutput !== 'string' || !packageName || typeof packageName !== 'string') return false;
  const target = packageName.trim();
  if (!target) return false;
  const lines = rawOutput.split(/\r?\n/).map((l) => l.trim());
  return lines.some((line) => line === `package:${target}`);
}

function parseAaptBadging(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') return { packageName: '', launchActivity: '' };
  const pkgMatch = rawOutput.match(/package:\s*name=['"]([^'"]+)['"]/i);
  const actMatch = rawOutput.match(/launchable-activity:\s*name=['"]([^'"]+)['"]/i);
  return {
    packageName: pkgMatch ? pkgMatch[1] : '',
    launchActivity: actMatch ? actMatch[1] : '',
  };
}

function parseResolveActivityOutput(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') return '';
  const lines = rawOutput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const compLine = lines.find((l) => l.includes('/') && !l.startsWith('priority='));
  return compLine || '';
}

module.exports = {
  parseAdbDevicesOutput,
  parseDeviceEnrichment,
  isPackageInstalledInOutput,
  parseAaptBadging,
  parseResolveActivityOutput,
};

