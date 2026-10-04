function extractPlayStorePackageName(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.trim());
    return parsed.searchParams.get('id') || '';
  } catch {
    const match = url.match(/[?&]id=([a-zA-Z0-9_.]+)/);
    return match ? match[1] : '';
  }
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function normalizeProjectMetadata(metadata) {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  return {
    figmaUrl: typeof meta.figmaUrl === 'string' ? meta.figmaUrl.trim() : '',
    apkFiles: Array.isArray(meta.apkFiles)
      ? meta.apkFiles
          .filter(a => a && typeof a === 'object' && typeof a.path === 'string' && a.path.trim())
          .map(a => ({
            id: a.id || ('apk_' + Date.now()),
            name: (a.name || a.path.split(/[\\/]/).pop() || 'app.apk').trim(),
            path: a.path.trim(),
            size: typeof a.size === 'number' && a.size >= 0 ? a.size : 0,
            addedAt: typeof a.addedAt === 'number' ? a.addedAt : Date.now(),
          }))
      : [],
    competitors: Array.isArray(meta.competitors)
      ? meta.competitors
          .filter(c => c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim())
          .map(c => ({
            id: c.id || ('comp_' + Date.now()),
            name: c.name.trim(),
            url: typeof c.url === 'string' ? c.url.trim() : '',
            packageName: (typeof c.packageName === 'string' && c.packageName.trim())
              ? c.packageName.trim()
              : extractPlayStorePackageName(c.url),
            platform: c.platform === 'iOS' || c.platform === 'Web' ? c.platform : 'Android',
            notes: typeof c.notes === 'string' ? c.notes.trim() : '',
            addedAt: typeof c.addedAt === 'number' ? c.addedAt : Date.now(),
          }))
      : [],
  };
}

function parseFigmaUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split('/').filter(Boolean);
    let type = 'Design File';
    let fileKey = '';
    let fileName = '';

    if (parts.length >= 2) {
      const segment = parts[0].toLowerCase();
      fileKey = parts[1];
      if (segment === 'proto') {
        type = 'Prototype';
      } else if (segment === 'board') {
        type = 'FigJam Board';
      } else if (segment === 'design' || segment === 'file') {
        type = 'Design File';
      } else {
        type = 'Figma File';
      }

      if (parts.length >= 3 && parts[2]) {
        fileName = decodeURIComponent(parts[2]).replace(/[-_]+/g, ' ').trim();
      }
    }

    const nodeId = parsed.searchParams.get('node-id') || '';

    return {
      type,
      fileKey,
      fileName,
      nodeId,
      url: trimmed,
    };
  } catch {
    return {
      type: 'Figma Link',
      fileKey: '',
      fileName: '',
      nodeId: '',
      url: typeof url === 'string' ? url.trim() : '',
    };
  }
}

function formatDisplayUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    const u = new URL(urlStr.trim());
    const hostname = u.hostname.replace(/^www\./, '');
    const path = u.pathname.length > 28 ? u.pathname.substring(0, 28) + '…' : u.pathname;
    return `${hostname}${path}`;
  } catch {
    const str = urlStr.trim();
    return str.length > 36 ? str.substring(0, 36) + '…' : str;
  }
}

module.exports = {
  extractPlayStorePackageName,
  formatBytes,
  normalizeProjectMetadata,
  parseFigmaUrl,
  formatDisplayUrl,
};
