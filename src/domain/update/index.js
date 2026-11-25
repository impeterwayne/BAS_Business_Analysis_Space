const DEFAULT_GITHUB_REPO = {
  owner: 'impeterwayne',
  repo: 'BAS_Business_Analysis_Space',
};

function parseRepoFromPackageJson(pkg) {
  if (pkg && typeof pkg === 'object') {
    const publishList = Array.isArray(pkg.build?.publish)
      ? pkg.build.publish
      : (pkg.build?.publish ? [pkg.build.publish] : []);
    for (const entry of publishList) {
      if (
        entry
        && entry.provider === 'github'
        && typeof entry.owner === 'string' && entry.owner.trim()
        && typeof entry.repo === 'string' && entry.repo.trim()
      ) {
        return {
          owner: entry.owner.trim(),
          repo: entry.repo.trim(),
        };
      }
    }

    const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    if (typeof repoUrl === 'string') {
      const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
      if (match) {
        return {
          owner: match[1].trim(),
          repo: match[2].trim(),
        };
      }
    }
  }
  return { ...DEFAULT_GITHUB_REPO };
}

function parseSemver(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/^v/i, '');
  if (!trimmed) return null;
  const withoutBuild = trimmed.split('+')[0];
  const match = withoutBuild.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const preRaw = match[4] || '';
  const prerelease = preRaw ? preRaw.split('.').filter(Boolean) : [];
  const normalized = `${major}.${minor}.${patch}${prerelease.length ? `-${prerelease.join('.')}` : ''}`;

  return {
    major,
    minor,
    patch,
    prerelease,
    normalized,
  };
}

function comparePrereleaseIdentifiers(a, b) {
  const aIsNum = /^\d+$/.test(a);
  const bIsNum = /^\d+$/.test(b);
  if (aIsNum && bIsNum) {
    const diff = Number(a) - Number(b);
    return diff < 0 ? -1 : diff > 0 ? 1 : 0;
  }
  if (aIsNum && !bIsNum) return -1;
  if (!aIsNum && bIsNum) return 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function compareVersions(a, b) {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA && !parsedB) return 0;
  if (!parsedA) return -1;
  if (!parsedB) return 1;

  for (const field of ['major', 'minor', 'patch']) {
    if (parsedA[field] !== parsedB[field]) {
      return parsedA[field] > parsedB[field] ? 1 : -1;
    }
  }

  const preA = parsedA.prerelease;
  const preB = parsedB.prerelease;
  if (preA.length === 0 && preB.length === 0) return 0;
  if (preA.length === 0) return 1;
  if (preB.length === 0) return -1;

  const maxLen = Math.max(preA.length, preB.length);
  for (let i = 0; i < maxLen; i++) {
    if (i >= preA.length) return -1;
    if (i >= preB.length) return 1;
    const cmp = comparePrereleaseIdentifiers(preA[i], preB[i]);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

function isNewerVersion(latest, current) {
  const parsedLatest = parseSemver(latest);
  const parsedCurrent = parseSemver(current);
  if (!parsedLatest || !parsedCurrent) return false;
  return compareVersions(parsedLatest.normalized, parsedCurrent.normalized) > 0;
}

function isInstallableReleaseAsset(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/\.(blockmap|sha256|sha512|sig|asc)$/i.test(trimmed)) return false;
  if (/^latest.*\.ya?ml$/i.test(trimmed)) return false;
  if (/^RELEASES$/i.test(trimmed)) return false;
  return true;
}

function detectAssetArch(lowerName) {
  if (/\buniversal\b|[._-]universal[._-]/i.test(lowerName)) return 'universal';
  if (/(?:^|[._-])(arm64|aarch64)(?:$|[._-])/i.test(lowerName)) return 'arm64';
  if (/(?:^|[._-])(x64|x86_64|amd64)(?:$|[._-])/i.test(lowerName)) return 'x64';
  return null;
}

function scoreAssetForPlatform(assetName, platform, arch) {
  const lower = String(assetName || '').toLowerCase();
  let score = 0;

  if (platform === 'win32') {
    if (lower.endsWith('.exe')) {
      if (lower.includes('setup')) score = 100;
      else if (!lower.includes('portable')) score = 80;
      else score = 60;
    } else if (lower.endsWith('.msi')) {
      score = 50;
    }
  } else if (platform === 'darwin') {
    if (lower.endsWith('.dmg')) score = 90;
    else if (lower.endsWith('.zip')) score = 75;
    else if (lower.endsWith('.pkg')) score = 65;
  } else if (platform === 'linux') {
    if (lower.endsWith('.appimage')) score = 95;
    else if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) score = 70;
    else if (lower.endsWith('.deb') || lower.endsWith('.rpm')) score = 60;
  }

  if (score <= 0) return 0;

  const assetArch = detectAssetArch(lower);
  if (assetArch === 'universal') {
    score += 5;
  } else if (assetArch && arch) {
    if (assetArch === arch) {
      score += 15;
    } else {
      score -= 50;
    }
  }

  return score;
}

function selectReleaseAsset(assets, platform = process.platform, arch = process.arch) {
  const list = Array.isArray(assets) ? assets : [];
  const installable = list.filter((asset) => asset && isInstallableReleaseAsset(asset.name));

  const scored = installable
    .map((asset, index) => ({
      asset,
      index,
      score: scoreAssetForPlatform(asset.name, platform, arch),
    }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  const recommended = scored.length > 0 && scored[0].score > 0 ? scored[0].asset : null;
  return {
    recommended,
    all: scored.map((entry) => entry.asset),
  };
}

function parseHumanFileSize(text) {
  if (typeof text !== 'string') return 0;
  const match = text.trim().match(/^(\d+(?:\.\d+)?)\s*(Bytes|B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return 0;
  const unit = match[2].toUpperCase();
  const powers = {
    B: 0,
    BYTES: 0,
    KB: 1,
    MB: 2,
    GB: 3,
  };
  const power = powers[unit];
  if (power === undefined) return 0;
  return Math.round(value * (1024 ** power));
}

function extractTagFromReleaseUrl(url) {
  if (typeof url !== 'string') return '';
  const match = url.trim().match(/^https?:\/\/github\.com\/[^/]+\/[^/]+\/releases\/tag\/([^/?#]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return match[1].trim();
  }
}

function parseExpandedAssetsHtml(html, repoOwner, repoRepo, tagName) {
  if (typeof html !== 'string' || !repoOwner || !repoRepo || !tagName) return [];
  const prefixRaw = `/${repoOwner}/${repoRepo}/releases/download/${tagName}/`.toLowerCase();
  const prefixEncoded = `/${repoOwner}/${repoRepo}/releases/download/${encodeURIComponent(tagName)}/`.toLowerCase();

  const liMatches = html.match(/<li\b[\s\S]*?<\/li>/gi) || [html];
  const seen = new Set();
  const assets = [];

  for (const block of liMatches) {
    const linkRegex = /href="([^"]+)"/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(block)) !== null) {
      const href = linkMatch[1].split('?')[0].split('#')[0];
      const hrefLower = href.toLowerCase();
      let rawFileName = '';
      if (hrefLower.startsWith(prefixEncoded)) {
        rawFileName = href.slice(prefixEncoded.length);
      } else if (hrefLower.startsWith(prefixRaw)) {
        rawFileName = href.slice(prefixRaw.length);
      } else {
        continue;
      }
      if (!rawFileName || rawFileName.includes('/')) continue;

      let name = rawFileName;
      try {
        name = decodeURIComponent(rawFileName);
      } catch {
        // Keep raw filename if malformed percent encoding
      }
      if (!name || seen.has(name)) continue;
      seen.add(name);

      let size = 0;
      const sizeTagMatch = block.match(/>\s*(\d+(?:\.\d+)?\s*(?:Bytes|B|KB|MB|GB))\s*</i)
        || block.match(/\b(\d+(?:\.\d+)?\s*(?:Bytes|B|KB|MB|GB))\b/i);
      if (sizeTagMatch) {
        size = parseHumanFileSize(sizeTagMatch[1]);
      }

      assets.push({
        id: 0,
        name,
        size,
        sizeApproximate: true,
        downloadUrl: `https://github.com${href}`,
        contentType: '',
      });
    }
  }

  return assets;
}

function decodeXmlEntities(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g, (full, dec, hex, named) => {
    if (dec) {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (hex) {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    switch (named) {
      case 'amp': return '&';
      case 'lt': return '<';
      case 'gt': return '>';
      case 'quot': return '"';
      case 'apos': return "'";
      case 'nbsp': return ' ';
      default: return full;
    }
  });
}

function htmlSnippetToMarkdown(html) {
  if (typeof html !== 'string') return '';
  let text = html.replace(/\r\n?/g, '\n');

  text = text.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, rawHref, inner) => {
    const href = decodeXmlEntities(rawHref).trim();
    const label = decodeXmlEntities(inner.replace(/<[^>]+>/g, '')).trim();
    if (/^https?:\/\//i.test(href) && label) {
      return `[${label}](${href})`;
    }
    return label || href;
  });

  text = text.replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => {
    const heading = inner.replace(/<[^>]+>/g, '').trim();
    return heading ? `\n### ${heading}\n` : '\n';
  });

  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    const code = inner.replace(/<[^>]+>/g, '').trim();
    return code ? `\`${code}\`` : '';
  });

  text = text.replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_, inner) => {
    const bold = inner.replace(/<[^>]+>/g, '').trim();
    return bold ? `**${bold}**` : '';
  });

  text = text.replace(/<li\b[^>]*>/gi, '\n- ');
  text = text.replace(/<\/li>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?(?:p|div|ul|ol|blockquote|pre)\b[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');

  text = decodeXmlEntities(text);
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function parseReleasesAtomEntry(xml, tagName) {
  if (typeof xml !== 'string' || !tagName) return null;
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const targetLower = tagName.trim().toLowerCase();

  for (const entry of entries) {
    const linkMatch = entry.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
    const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/i);
    const linkTag = linkMatch ? extractTagFromReleaseUrl(decodeXmlEntities(linkMatch[1])) : '';
    let idTag = '';
    if (idMatch) {
      const idParts = decodeXmlEntities(idMatch[1]).trim().split('/');
      idTag = idParts[idParts.length - 1] || '';
    }

    if (linkTag.toLowerCase() !== targetLower && idTag.toLowerCase() !== targetLower) {
      continue;
    }

    const titleMatch = entry.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const updatedMatch = entry.match(/<updated\b[^>]*>([\s\S]*?)<\/updated>/i);
    const contentMatch = entry.match(/<content\b([^>]*)>([\s\S]*?)<\/content>/i);

    const name = titleMatch ? decodeXmlEntities(titleMatch[1]).trim() : tagName;
    const publishedAt = updatedMatch ? decodeXmlEntities(updatedMatch[1]).trim() : '';

    let body = '';
    if (contentMatch) {
      const attrs = contentMatch[1] || '';
      const rawContent = decodeXmlEntities(contentMatch[2]).trim();
      if (rawContent && rawContent !== 'No content.') {
        if (/type\s*=\s*"html"/i.test(attrs)) {
          // Decode any inner HTML entities produced when HTML was escaped inside XML
          body = htmlSnippetToMarkdown(rawContent);
        } else {
          body = rawContent;
        }
      }
    }

    return {
      name: name || tagName,
      publishedAt,
      body,
    };
  }

  return null;
}

function parseGitHubRelease(rawRelease, currentVersion, platform = process.platform, arch = process.arch) {
  const release = rawRelease && typeof rawRelease === 'object' ? rawRelease : {};
  const tagName = typeof release.tag_name === 'string' ? release.tag_name.trim() : '';
  const parsedSemver = parseSemver(tagName);
  const version = parsedSemver ? parsedSemver.normalized : tagName.replace(/^v/i, '');
  const rawAssets = Array.isArray(release.assets) ? release.assets : [];

  const mappedAssets = rawAssets
    .filter((asset) => {
      if (!asset || typeof asset.name !== 'string') return false;
      const url = typeof asset.browser_download_url === 'string'
        ? asset.browser_download_url
        : asset.downloadUrl;
      return typeof url === 'string' && url.length > 0;
    })
    .map((asset) => ({
      id: Number(asset.id) || 0,
      name: asset.name,
      size: Number(asset.size) || 0,
      sizeApproximate: Boolean(asset.sizeApproximate),
      downloadUrl: typeof asset.browser_download_url === 'string'
        ? asset.browser_download_url
        : asset.downloadUrl,
      contentType: typeof asset.content_type === 'string'
        ? asset.content_type
        : (typeof asset.contentType === 'string' ? asset.contentType : ''),
    }));

  const { recommended, all } = selectReleaseAsset(mappedAssets, platform, arch);

  return {
    tagName,
    version,
    name: (typeof release.name === 'string' && release.name.trim()) ? release.name.trim() : tagName,
    body: typeof release.body === 'string' ? release.body : '',
    htmlUrl: typeof release.html_url === 'string' ? release.html_url : '',
    publishedAt: typeof release.published_at === 'string' ? release.published_at : '',
    assets: all,
    recommendedAsset: recommended,
    updateAvailable: isNewerVersion(version, currentVersion),
  };
}

function defaultEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInlineMarkdown(escapedLine) {
  let out = escapedLine;
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

function formatReleaseNotesHtml(markdown, escapeHtml = defaultEscapeHtml) {
  const raw = typeof markdown === 'string' ? markdown.trim() : '';
  if (!raw) return '<p class="update-notes-empty">No release notes provided.</p>';

  const escaped = escapeHtml(raw).replace(/\r\n?/g, '\n');
  const lines = escaped.split('\n');
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      closeList();
      html.push(`<h4 class="update-notes-h">${formatInlineMarkdown(headingMatch[1])}</h4>`);
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${formatInlineMarkdown(bulletMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return html.join('');
}

module.exports = {
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
};
