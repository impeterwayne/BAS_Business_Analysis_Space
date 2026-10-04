function extractPlayStorePackageName(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  try {
    if (trimmed.includes('://')) {
      const parsed = new URL(trimmed);
      const idParam = parsed.searchParams.get('id');
      if (idParam) return idParam.trim();
    }
  } catch {
    // ignore URL parse errors
  }

  const match = trimmed.match(/[?&]id=([a-zA-Z0-9_.]+)/);
  if (match) return match[1].trim();

  // If the user pasted a raw Android package name directly (e.g. com.shopee.vn)
  if (/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

function cleanStoreAppName(rawTitle, fallbackName = '') {
  if (!rawTitle || typeof rawTitle !== 'string') return fallbackName || '';

  let cleaned = rawTitle
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Strip Google Play store branding suffixes
  cleaned = cleaned.replace(
    /\s*[-–—|]\s*(?:Apps on Google Play|Ứng dụng trên Google Play|Google Play Store|Google Play|Apps bei Google Play|Applications sur Google Play|Aplicaciones en Google Play).*$/i,
    ''
  );

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Strip promotional / date prefixes like "10.10 ", "11.11 ", "12.12 "
  cleaned = cleaned.replace(/^\d+[\.\/]\d+\s+[-–—]?\s*/i, '');

  // If title has a separator (-, :, |, –), check if the tagline is localized/non-English
  // e.g. "MoMo-Trợ Thủ Tài Chính với AI" -> "MoMo"
  // e.g. "Shopee: Mua Sắm Online" -> "Shopee"
  const sepMatch = cleaned.match(/^([^-:–—|]+)\s*[-:–—|]\s*(.+)$/);
  if (sepMatch) {
    const mainPart = sepMatch[1].trim();
    const tagPart = sepMatch[2].trim();
    const hasDiacritics = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(tagPart);
    if (hasDiacritics) {
      cleaned = mainPart;
    }
  }

  // If there are still Vietnamese diacritics in the name (e.g. "Shopee Thương Hiệu")
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(cleaned)) {
    if (fallbackName && !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(fallbackName)) {
      return fallbackName;
    }
    const words = cleaned.split(/\s+/);
    const latinWords = words.filter(w => !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(w));
    if (latinWords.length > 0) {
      cleaned = latinWords.join(' ');
    }
  }

  return cleaned || fallbackName || '';
}

const KNOWN_PACKAGES = {
  'com.mservice.momotransaction': 'MoMo',
  'com.mservice.momotransfer': 'MoMo',
  'com.zing.zalo': 'Zalo',
  'com.shopee.vn': 'Shopee',
  'com.vnpay.mpos': 'VNPAY',
  'org.telegram.messenger': 'Telegram',
  'com.spotify.music': 'Spotify',
  'com.whatsapp': 'WhatsApp',
  'com.grabtaxi.passenger': 'Grab',
  'com.facebook.katana': 'Facebook',
  'com.google.android.youtube': 'YouTube',
  'com.instagram.android': 'Instagram',
  'com.tiki.app.home': 'Tiki',
  'com.lazada.android': 'Lazada',
};

function inferAppNameFromPackage(packageName) {
  if (!packageName || typeof packageName !== 'string') return '';
  const pkg = packageName.trim().toLowerCase();
  if (KNOWN_PACKAGES[pkg]) return KNOWN_PACKAGES[pkg];

  const parts = pkg.split('.').filter(Boolean);
  const ignored = new Set([
    'com', 'org', 'net', 'vn', 'io', 'co', 'app', 'apps',
    'android', 'mobile', 'client', 'release', 'free', 'lite',
    'beta', 'debug', 'passenger', 'music', 'messenger', 'home',
  ]);
  const candidates = parts.filter(p => !ignored.has(p));
  const target = candidates.length > 0 ? candidates[0] : (parts[parts.length - 1] || '');

  if (!target) return '';
  return target
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
}

function cleanHtmlUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractAppIconFromHtml(html, baseUrl = '') {
  if (!html || typeof html !== 'string') return '';

  let iconUrl = '';

  // 1. Google Play specific: Icon image img tag with alt="Icon image" or itemprop="image"
  const iconImgMatch =
    html.match(/<img[^>]+(?:alt=["']Icon image["']|itemprop=["']image["'])[^>]+src=["']([^"']+)["']/i) ||
    html.match(/<img[^>]+src=["']([^"']+)["'][^>]+(?:alt=["']Icon image["']|itemprop=["']image["'])/i);
  if (iconImgMatch && iconImgMatch[1]) {
    iconUrl = cleanHtmlUrl(iconImgMatch[1]);
  }

  // 2. OpenGraph og:image meta tag (Standard on Google Play & Apple App Store for app icon)
  if (!iconUrl) {
    const ogImgMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImgMatch && ogImgMatch[1]) {
      iconUrl = cleanHtmlUrl(ogImgMatch[1]);
    }
  }

  // 3. Twitter image meta tag
  if (!iconUrl) {
    const twitterImgMatch =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twitterImgMatch && twitterImgMatch[1]) {
      iconUrl = cleanHtmlUrl(twitterImgMatch[1]);
    }
  }

  // 4. Apple touch icon or shortcut icon
  if (!iconUrl) {
    const linkIconMatch =
      html.match(/<link[^>]+rel=["'](?:apple-touch-icon(?:-precomposed)?|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:apple-touch-icon(?:-precomposed)?|icon|shortcut icon)["']/i);
    if (linkIconMatch && linkIconMatch[1]) {
      iconUrl = cleanHtmlUrl(linkIconMatch[1]);
    }
  }

  if (iconUrl) {
    if (baseUrl && (iconUrl.startsWith('/') || !iconUrl.includes('://'))) {
      try {
        iconUrl = new URL(iconUrl, baseUrl).href;
      } catch {}
    }
    return iconUrl;
  }

  return '';
}

function getDomainFavicon(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    const raw = urlStr.trim();
    const parsed = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host && !host.includes('google.com')) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
    }
  } catch {}
  return '';
}

function getCompetitorInitials(name) {
  if (!name || typeof name !== 'string') return 'CP';
  const expanded = String(name).replace(/([a-z])([A-Z])/g, '$1 $2');
  const clean = expanded.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (clean[0] || 'C').toUpperCase();
}

function extractAppInfoFromHtml(html, defaultPackageName = '', fallbackName = '', baseUrl = '') {
  if (!html || typeof html !== 'string') {
    return { appName: fallbackName, packageName: defaultPackageName, iconUrl: '' };
  }

  let appName = '';

  // 1. Google Play modern markup uses <h1> with the app title
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    appName = cleanStoreAppName(h1Match[1], fallbackName);
  }

  // 2. OpenGraph og:title meta tag
  if (!appName) {
    const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogMatch && ogMatch[1]) {
      appName = cleanStoreAppName(ogMatch[1], fallbackName);
    }
  }

  // 3. Twitter title meta tag
  if (!appName) {
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i);
    if (twitterMatch && twitterMatch[1]) {
      appName = cleanStoreAppName(twitterMatch[1], fallbackName);
    }
  }

  // 4. HTML <title> tag
  if (!appName) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      appName = cleanStoreAppName(titleMatch[1], fallbackName);
    }
  }

  let packageName = defaultPackageName;
  if (!packageName) {
    const pkgMatch = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9_.]+)/i) ||
                     html.match(/data-item-id=["']([a-zA-Z0-9_.]+)["']/i);
    if (pkgMatch && pkgMatch[1]) {
      packageName = pkgMatch[1];
    }
  }

  const iconUrl = extractAppIconFromHtml(html, baseUrl);

  return { appName: appName || fallbackName, packageName, iconUrl };
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
            iconUrl: typeof c.iconUrl === 'string' ? c.iconUrl.trim() : '',
            packageName: (typeof c.packageName === 'string' && c.packageName.trim())
              ? c.packageName.trim()
              : extractPlayStorePackageName(c.url),
            platform: 'Android',
            apkPath: typeof c.apkPath === 'string' ? c.apkPath.trim() : '',
            apkName: typeof c.apkName === 'string' ? c.apkName.trim() : (c.apkPath ? c.apkPath.split(/[\\/]/).pop() || '' : ''),
            apkSize: typeof c.apkSize === 'number' && c.apkSize >= 0 ? c.apkSize : 0,
            jadxSourcePath: typeof c.jadxSourcePath === 'string' ? c.jadxSourcePath.trim() : '',
            jadxStatus: typeof c.jadxStatus === 'string' ? c.jadxStatus.trim() : '',
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

function parseBenchmarkFlows(notes) {
  if (!notes || typeof notes !== 'string') return [];
  const lines = notes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const flows = [];

  for (const line of lines) {
    // Strip leading markdown bullets, numbers, dashes, quotes: e.g. "- ", "* ", "1. ", "• ", "> "
    const cleaned = line.replace(/^[\s*\-•\d\.\)\>\:\#]+/, '').trim();
    if (!cleaned) continue;

    // Split by comma, semicolon, or pipe if present
    if (cleaned.includes(',') || cleaned.includes(';') || cleaned.includes('|')) {
      const parts = cleaned.split(/[,;|]/).map((p) => p.trim()).filter(Boolean);
      flows.push(...parts);
    } else {
      flows.push(cleaned);
    }
  }

  // Deduplicate case-insensitively while preserving original casing
  const seen = new Set();
  const result = [];
  for (const f of flows) {
    const key = f.toLowerCase();
    if (!seen.has(key) && f.length > 0) {
      seen.add(key);
      result.push(f);
    }
  }
  return result;
}

function formatFlowSlug(flow) {
  if (!flow || typeof flow !== 'string') return '';
  // Fold Vietnamese diacritics first ("Chuyển tiền" -> "chuyen-tien"); \w alone would drop the letters.
  return flow
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-');
}

// flow: one flow name or an array of them (one run over several flows shares one plan and one profile).
// The decoded-source path is not part of the command (Antigravity drops a quoted path from slash-command
// input); /ba-competitor reads it from the Decoded source column of ba-project-config.md instead.
function buildBenchmarkSlashCommand(target, flow) {
  const pkg = (target || 'app').trim();
  const slug = (Array.isArray(flow) ? flow : [flow]).map(formatFlowSlug).filter(Boolean).join(' ');
  return `/ba-competitor ${pkg}${slug ? ` ${slug}` : ''}`;
}

function cleanApkAppName(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  let base = fileName.trim().split(/[\\/]/).pop() || '';
  base = base.replace(/\.(apk|xapk|apks)$/i, '').trim();
  if (!base) return '';

  const pkgMatch = base.match(/^([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]+)+)/);
  if (pkgMatch) {
    const inferred = inferAppNameFromPackage(pkgMatch[1]);
    if (inferred) return inferred;
  }

  // Remove common build artifact suffixes
  base = base.replace(/[-_](release|debug|universal|signed|unsigned|aligned|arm64|v7a|x86(_64)?)/gi, '');

  // Replace underscores and dashes with spaces
  base = base.replace(/[-_]+/g, ' ').trim();

  // Capitalize words if all lowercase or uppercase
  if (base.toLowerCase() === base || base.toUpperCase() === base) {
    base = base
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return base;
}

module.exports = {
  extractPlayStorePackageName,
  cleanStoreAppName,
  inferAppNameFromPackage,
  cleanApkAppName,
  extractAppInfoFromHtml,
  cleanHtmlUrl,
  extractAppIconFromHtml,
  getDomainFavicon,
  getCompetitorInitials,
  formatBytes,
  normalizeProjectMetadata,
  parseFigmaUrl,
  formatDisplayUrl,
  parseBenchmarkFlows,
  formatFlowSlug,
  buildBenchmarkSlashCommand,
};

