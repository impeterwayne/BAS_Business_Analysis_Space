const DEFAULT_SYNCTHING_FOLDER_ID = 'bas-projects';
const SYNCTHING_MANIFEST_REL_PATH = '.bas/project-sync.json';

const PORTABLE_PROJECT_FIELDS = [
  'figmaUrl',
  'firebaseUrl',
  'planeUrl',
  'legacyPrdUrl',
  'legacyChecklistUrl',
  'checklistScope',
];

const LOCAL_COMPETITOR_FIELDS = [
  'apkPath',
  'apkName',
  'apkSize',
  'apkAddedAt',
  'jadxSourcePath',
  'jadxStatus',
];

function normalizeSyncMode(mode) {
  return mode === 'selected' ? 'selected' : 'all';
}

function decodeBasicXmlEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeGuiAddress(rawAddress) {
  const addr = String(rawAddress || '').trim();
  if (!addr || addr.startsWith('/')) return '';

  // Match IPv4/wildcard/IPv6 bind addresses like 0.0.0.0:8384, :8384, [::]:8384, *:8384
  const wildcardMatch = addr.match(/^(?:0\.0\.0\.0|\*|\[::\]|\[0:0:0:0:0:0:0:0\])?:(\d+)$/);
  if (wildcardMatch) {
    return `127.0.0.1:${wildcardMatch[1]}`;
  }
  const hostWildcardMatch = addr.match(/^(?:0\.0\.0\.0|\*|\[::\]):(\d+)$/);
  if (hostWildcardMatch) {
    return `127.0.0.1:${hostWildcardMatch[1]}`;
  }
  return addr;
}

function parseSyncthingConfigXml(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') return null;

  const guiMatch = xmlContent.match(/<gui\b([^>]*)>([\s\S]*?)<\/gui>/i);
  if (!guiMatch) return null;

  const guiAttrs = guiMatch[1] || '';
  const guiBody = guiMatch[2] || '';

  const tlsMatch = guiAttrs.match(/\btls\s*=\s*["']([^"']*)["']/i);
  const tls = Boolean(tlsMatch && tlsMatch[1].trim().toLowerCase() === 'true');

  const addressMatch = guiBody.match(/<address>([\s\S]*?)<\/address>/i);
  const apiKeyMatch = guiBody.match(/<apikey>([\s\S]*?)<\/apikey>/i);

  const address = addressMatch ? decodeBasicXmlEntities(addressMatch[1]).trim() : '';
  const apiKey = apiKeyMatch ? decodeBasicXmlEntities(apiKeyMatch[1]).trim() : '';

  if (!apiKey) return null;

  const normalizedAddress = normalizeGuiAddress(address);
  const protocol = tls ? 'https' : 'http';
  const apiUrl = normalizedAddress ? `${protocol}://${normalizedAddress}` : '';

  return {
    address,
    apiKey,
    tls,
    apiUrl,
  };
}

function extractLabeledPathValue(stdout, labelRegex) {
  const lines = String(stdout || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(labelRegex);
    if (!match) continue;
    const inlineValue = (match[1] || '').trim();
    if (inlineValue) return inlineValue;
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim();
      if (!nextLine) break;
      if (/^[A-Za-z0-9 /_-]+:\s*$/.test(nextLine)) break;
      return nextLine;
    }
  }
  return null;
}

function parseSyncthingPathsOutput(stdout) {
  if (!stdout || typeof stdout !== 'string') {
    return { configFile: null, defaultSyncDir: null };
  }
  const configFile = extractLabeledPathValue(stdout, /^\s*Configuration file:\s*(.*)$/i);
  const defaultSyncDir = extractLabeledPathValue(stdout, /^\s*Default sync folder directory:\s*(.*)$/i);
  return {
    configFile: configFile || null,
    defaultSyncDir: defaultSyncDir || null,
  };
}

function parseSyncthingVersionOutput(stdout) {
  if (!stdout || typeof stdout !== 'string') return null;
  const match = stdout.match(/syncthing\s+(v[^\s]+)/i);
  return match ? match[1] : null;
}

function normalizeSlashPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '';
  let p = rawPath.trim().replace(/\\/g, '/');
  if (!p) return '';
  // Strip trailing slashes except root '/' or 'C:/'
  while (p.length > 1 && p.endsWith('/') && !/^[A-Za-z]:\/$/.test(p)) {
    p = p.slice(0, -1);
  }
  return p;
}

function getProjectFolderInSyncRoot(syncRootPath, projectPath, { caseInsensitive = false } = {}) {
  const normRoot = normalizeSlashPath(syncRootPath);
  const normProj = normalizeSlashPath(projectPath);
  if (!normRoot || !normProj) return null;

  const cmpRoot = caseInsensitive ? normRoot.toLowerCase() : normRoot;
  const cmpProj = caseInsensitive ? normProj.toLowerCase() : normProj;

  if (cmpProj === cmpRoot) return null;

  const rootWithSlash = cmpRoot.endsWith('/') ? cmpRoot : `${cmpRoot}/`;
  if (!cmpProj.startsWith(rootWithSlash)) return null;

  const remainderOriginal = normProj.slice(normRoot.endsWith('/') ? normRoot.length : normRoot.length + 1);
  if (!remainderOriginal || remainderOriginal.includes('/') || remainderOriginal === '.' || remainderOriginal === '..') {
    return null;
  }
  return remainderOriginal;
}

function sanitizeEnabledProjects(enabledProjects) {
  if (!Array.isArray(enabledProjects)) return [];
  const seen = new Set();
  const result = [];
  for (const item of enabledProjects) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed === '.' || trimmed === '..' || trimmed.includes('..')) {
      continue;
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function generateStignoreBas({ mode = 'all', enabledProjects = [] } = {}) {
  const normalizedMode = normalizeSyncMode(mode);
  const lines = [
    '// Managed by BA Space — do not edit manually',
    '/*/docs/.obsidian/workspace*.json',
    '/*/docs/.obsidian/cache',
    '**/.DS_Store',
    '**/Thumbs.db',
    '!/.stignore-bas',
  ];

  if (normalizedMode === 'all') {
    lines.push(
      '!/*/docs',
      '!/*/docs/**',
      '!/*/.bas',
      '!/*/.bas/**',
      '/*/*'
    );
  } else {
    const projects = sanitizeEnabledProjects(enabledProjects);
    for (const proj of projects) {
      lines.push(
        `!/${proj}/docs`,
        `!/${proj}/docs/**`,
        `!/${proj}/.bas`,
        `!/${proj}/.bas/**`,
        `/${proj}/*`,
        `!/${proj}`
      );
    }
    lines.push('*');
  }

  return `${lines.join('\n')}\n`;
}

function ensureStignoreInclude(existingContent = '') {
  const content = typeof existingContent === 'string' ? existingContent : '';
  const lines = content.split(/\r?\n/);
  if (lines.some((line) => /^\s*#include\s+\.stignore-bas\s*$/.test(line))) {
    return content;
  }
  if (!content.trim()) {
    return '#include .stignore-bas\n';
  }
  const trailingNewline = content.endsWith('\n') ? '' : '\n';
  return `${content}${trailingNewline}#include .stignore-bas\n`;
}

function normalizePortableCompetitor(comp) {
  if (!comp || typeof comp !== 'object') return null;
  const name = typeof comp.name === 'string' ? comp.name.trim() : '';
  if (!name) return null;
  return {
    id: typeof comp.id === 'string' && comp.id.trim() ? comp.id.trim() : '',
    name,
    url: typeof comp.url === 'string' ? comp.url.trim() : '',
    iconUrl: typeof comp.iconUrl === 'string' ? comp.iconUrl.trim() : '',
    packageName: typeof comp.packageName === 'string' ? comp.packageName.trim() : '',
    platform: typeof comp.platform === 'string' && comp.platform.trim() ? comp.platform.trim() : 'Android',
    notes: typeof comp.notes === 'string' ? comp.notes.trim() : '',
    analysisMode: comp.analysisMode === 'hybrid' ? 'hybrid' : 'code-only',
    addedAt: typeof comp.addedAt === 'number' && Number.isFinite(comp.addedAt) ? comp.addedAt : 0,
  };
}

function normalizePortableProjectSection(project) {
  const p = project && typeof project === 'object' ? project : {};
  return {
    name: typeof p.name === 'string' ? p.name.trim() : '',
    figmaUrl: typeof p.figmaUrl === 'string' ? p.figmaUrl.trim() : '',
    firebaseUrl: typeof p.firebaseUrl === 'string' ? p.firebaseUrl.trim() : '',
    planeUrl: typeof p.planeUrl === 'string' ? p.planeUrl.trim() : '',
    legacyPrdUrl: typeof p.legacyPrdUrl === 'string' ? p.legacyPrdUrl.trim() : '',
    legacyChecklistUrl: typeof p.legacyChecklistUrl === 'string' ? p.legacyChecklistUrl.trim() : '',
    checklistScope: typeof p.checklistScope === 'string' ? p.checklistScope.trim() : '',
  };
}

function buildPortableProjectManifest(project, { now = () => Date.now() } = {}) {
  const competitors = Array.isArray(project?.competitors)
    ? project.competitors.map(normalizePortableCompetitor).filter(Boolean)
    : [];

  return {
    schemaVersion: 1,
    updatedAt: now(),
    project: normalizePortableProjectSection(project),
    competitors,
  };
}

function portableManifestEquals(a, b) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const projA = normalizePortableProjectSection(a.project);
  const projB = normalizePortableProjectSection(b.project);
  if (JSON.stringify(projA) !== JSON.stringify(projB)) return false;

  const compsA = Array.isArray(a.competitors) ? a.competitors.map(normalizePortableCompetitor).filter(Boolean) : [];
  const compsB = Array.isArray(b.competitors) ? b.competitors.map(normalizePortableCompetitor).filter(Boolean) : [];
  return JSON.stringify(compsA) === JSON.stringify(compsB);
}

function mergePortableProjectManifest(localProject, manifest) {
  const base = localProject && typeof localProject === 'object' ? { ...localProject } : {};
  if (!manifest || typeof manifest !== 'object') {
    return { project: base, changed: false, competitorsChanged: false };
  }

  let changed = false;
  let competitorsChanged = false;

  const remoteProject = manifest.project && typeof manifest.project === 'object' ? manifest.project : {};
  if (typeof remoteProject.name === 'string' && remoteProject.name.trim() && remoteProject.name.trim() !== (base.name || '')) {
    base.name = remoteProject.name.trim();
    changed = true;
  }

  for (const field of PORTABLE_PROJECT_FIELDS) {
    if (remoteProject[field] !== undefined) {
      const nextVal = typeof remoteProject[field] === 'string' ? remoteProject[field].trim() : '';
      const prevVal = typeof base[field] === 'string' ? base[field].trim() : '';
      if (nextVal !== prevVal) {
        base[field] = nextVal;
        changed = true;
      }
    }
  }

  const localCompetitors = Array.isArray(localProject?.competitors) ? localProject.competitors : [];
  if (Array.isArray(manifest.competitors)) {
    const byId = new Map();
    const byPackage = new Map();
    for (const c of localCompetitors) {
      if (!c || typeof c !== 'object') continue;
      if (c.id) byId.set(c.id, c);
      if (typeof c.packageName === 'string' && c.packageName.trim()) {
        byPackage.set(c.packageName.trim().toLowerCase(), c);
      }
    }

    const mergedCompetitors = [];
    for (const rawRemote of manifest.competitors) {
      const remoteComp = normalizePortableCompetitor(rawRemote);
      if (!remoteComp) continue;

      const matchedLocal =
        (remoteComp.id && byId.get(remoteComp.id)) ||
        (remoteComp.packageName && byPackage.get(remoteComp.packageName.toLowerCase())) ||
        null;

      const mergedComp = {
        ...remoteComp,
        id: remoteComp.id || matchedLocal?.id || '',
        addedAt: remoteComp.addedAt || matchedLocal?.addedAt || 0,
      };

      if (matchedLocal) {
        for (const localField of LOCAL_COMPETITOR_FIELDS) {
          if (matchedLocal[localField] !== undefined && matchedLocal[localField] !== '') {
            mergedComp[localField] = matchedLocal[localField];
          }
        }
      }

      mergedCompetitors.push(mergedComp);
    }

    const prevPortable = localCompetitors.map(normalizePortableCompetitor).filter(Boolean);
    const nextPortable = mergedCompetitors.map(normalizePortableCompetitor).filter(Boolean);
    if (JSON.stringify(prevPortable) !== JSON.stringify(nextPortable)) {
      competitorsChanged = true;
      changed = true;
    }

    base.competitors = mergedCompetitors;
  }

  return {
    project: base,
    changed,
    competitorsChanged,
  };
}

const SYNC_CONFLICT_STAMP_RE = /\.sync-conflict-(\d{8}-\d{6})(?:-([^./\\]+))?/i;
const SYNC_CONFLICT_ANY_RE = /\.sync-conflict-([^/\\]+)/i;

function isSyncConflictFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const base = filePath.replace(/\\/g, '/').split('/').pop() || '';
  return SYNC_CONFLICT_ANY_RE.test(base);
}

function parseSyncConflictFile(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/');
  const base = parts.pop() || '';
  if (!SYNC_CONFLICT_ANY_RE.test(base)) return null;

  let timestamp = '';
  let devicePrefix = '';
  let originalBase = base;

  const stampMatch = base.match(SYNC_CONFLICT_STAMP_RE);
  if (stampMatch) {
    timestamp = stampMatch[1] || '';
    devicePrefix = stampMatch[2] || '';
    originalBase = base.replace(SYNC_CONFLICT_STAMP_RE, '');
  } else {
    const anyMatch = base.match(SYNC_CONFLICT_ANY_RE);
    if (anyMatch) {
      // Handle non-timestamped conflict suffix before extension
      const dotIdx = base.lastIndexOf('.');
      const conflictIdx = base.indexOf('.sync-conflict-');
      if (dotIdx > conflictIdx) {
        originalBase = base.slice(0, conflictIdx) + base.slice(dotIdx);
      } else {
        originalBase = base.slice(0, conflictIdx);
      }
    }
  }

  const originalRelativePath = [...parts, originalBase].filter(Boolean).join('/');
  return {
    relativePath: normalized,
    originalRelativePath,
    timestamp,
    devicePrefix,
    isManifestConflict: originalRelativePath === SYNCTHING_MANIFEST_REL_PATH,
  };
}

function findSyncConflicts(relativePaths) {
  if (!Array.isArray(relativePaths)) return [];
  return relativePaths
    .map(parseSyncConflictFile)
    .filter(Boolean)
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

module.exports = {
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
};
