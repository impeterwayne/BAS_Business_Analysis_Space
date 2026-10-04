const fs = require('fs');
const path = require('path');
const { extractPlayStorePackageName, inferAppNameFromPackage, parseBenchmarkFlows } = require('../domain/project');

function buildFallbackWorktrees(projectPath) {
  return [{
    path: projectPath,
    name: path.basename(projectPath),
    id: Buffer.from(projectPath).toString('base64url'),
    branch: 'none',
  }];
}

function resolveProjectWorktrees(projectPath, getWorktrees) {
  const worktrees = getWorktrees(projectPath);
  return worktrees && worktrees.length > 0 ? worktrees : buildFallbackWorktrees(projectPath);
}

function createWorkspaceService({ configStore, getWorktrees, now = () => Date.now() }) {
  function getWorkspaceConfig() {
    return configStore.getConfig();
  }

  function enrichCompetitorFromDisk(projectPath, comp) {
    let changed = false;
    if (!comp) return changed;

    // 1. Detect JADX source directory
    if (comp.jadxStatus !== 'ready' || !comp.jadxSourcePath) {
      const candidateJadx = [
        comp.jadxSourcePath,
        comp.apkPath ? path.join(path.dirname(path.dirname(comp.apkPath)), 'jadx_src') : '',
        comp.apkPath ? path.join(path.dirname(comp.apkPath), '..', 'jadx_src') : '',
        comp.apkPath ? path.join(path.dirname(comp.apkPath), 'jadx_src') : '',
        projectPath && comp.packageName ? path.join(projectPath, 'workspaces', comp.packageName, 'jadx_src') : '',
        projectPath && comp.packageName ? path.join(projectPath, '.reakit', 'workspaces', comp.packageName, 'jadx_src') : '',
        projectPath && comp.packageName ? path.join(projectPath, comp.packageName, 'jadx_src') : '',
      ].filter(Boolean);

      for (const jDir of candidateJadx) {
        try {
          if (fs.existsSync(jDir)) {
            const items = fs.readdirSync(jDir);
            if (items.length > 0) {
              comp.jadxStatus = 'ready';
              comp.jadxSourcePath = jDir;
              changed = true;
              break;
            }
          }
        } catch (_) {}
      }
    }

    // 2. Detect APK if missing
    if (!comp.apkPath && projectPath && comp.packageName) {
      const candidateApkDirs = [
        path.join(projectPath, 'workspaces', comp.packageName, 'apks'),
        path.join(projectPath, '.reakit', 'workspaces', comp.packageName, 'apks'),
        path.join(projectPath, comp.packageName, 'apks'),
      ];
      for (const aDir of candidateApkDirs) {
        try {
          if (fs.existsSync(aDir)) {
            const apkFiles = fs.readdirSync(aDir).filter((f) => /\.(apk|xapk|apks)$/i.test(f));
            if (apkFiles.length > 0) {
              const primary = apkFiles.find((f) => !f.toLowerCase().includes('config') && f.endsWith('.apk')) || apkFiles[0];
              const fullApkPath = path.join(aDir, primary);
              const stats = fs.statSync(fullApkPath);
              comp.apkPath = fullApkPath;
              comp.apkName = primary;
              comp.apkSize = stats.size;
              comp.apkAddedAt = comp.apkAddedAt || now();
              changed = true;
              break;
            }
          }
        } catch (_) {}
      }
    }

    return changed;
  }

  function getWorkspaces() {
    const config = getWorkspaceConfig();
    let hasChanges = false;
    for (const project of (config.projects || [])) {
      if (Array.isArray(project.competitors)) {
        for (const comp of project.competitors) {
          if (enrichCompetitorFromDisk(project.path, comp)) {
            hasChanges = true;
          }
        }
      }
    }
    if (hasChanges) {
      configStore.saveConfig();
    }
    return [...config.projects].sort((a, b) => {
      const timeA = a.addedAt || 0;
      const timeB = b.addedAt || 0;
      return timeB - timeA;
    });
  }

  function getSettings() {
    return configStore.normalizeSettings(getWorkspaceConfig().settings);
  }

  function updateSettings(nextSettings) {
    const workspaceConfig = getWorkspaceConfig();
    workspaceConfig.settings = configStore.normalizeSettings(nextSettings);
    configStore.saveConfig();
    return workspaceConfig.settings;
  }

  function addProject(projectPath) {
    const workspaceConfig = getWorkspaceConfig();
    if (workspaceConfig.projects.find((project) => project.path === projectPath)) {
      return { error: 'Project already added' };
    }

    const project = {
      path: projectPath,
      name: path.basename(projectPath),
      worktrees: resolveProjectWorktrees(projectPath, getWorktrees),
      addedAt: now(),
    };

    workspaceConfig.projects.push(project);
    configStore.saveConfig();
    return project;
  }

  function removeProject(projectPath) {
    const workspaceConfig = getWorkspaceConfig();
    workspaceConfig.projects = workspaceConfig.projects.filter((project) => project.path !== projectPath);
    configStore.saveConfig();
    return true;
  }

  function refreshWorktrees(projectPath) {
    const worktrees = resolveProjectWorktrees(projectPath, getWorktrees);
    const project = getWorkspaceConfig().projects.find((entry) => entry.path === projectPath);
    if (project) {
      project.worktrees = worktrees;
      configStore.saveConfig();
    }
    return worktrees;
  }

  function updateProjectMetadata(projectPath, metadata) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    if (metadata.name !== undefined && typeof metadata.name === 'string') {
      project.name = metadata.name.trim();
    }
    if (metadata.figmaUrl !== undefined) {
      project.figmaUrl = String(metadata.figmaUrl || '').trim();
    }
    if (Array.isArray(metadata.apkFiles)) {
      project.apkFiles = metadata.apkFiles;
    }
    if (Array.isArray(metadata.competitors)) {
      project.competitors = metadata.competitors;
    }
    configStore.saveConfig();
    return { success: true, project };
  }

  function addProjectApk(projectPath, apk) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.apkFiles)) project.apkFiles = [];
    const apkEntry = {
      id: 'apk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: apk.name || path.basename(apk.path),
      path: apk.path,
      size: typeof apk.size === 'number' ? apk.size : 0,
      addedAt: now(),
    };
    const existingIndex = project.apkFiles.findIndex((a) => a.path === apkEntry.path);
    if (existingIndex >= 0) {
      project.apkFiles[existingIndex] = { ...project.apkFiles[existingIndex], ...apkEntry };
    } else {
      project.apkFiles.unshift(apkEntry);
    }
    configStore.saveConfig();
    return { success: true, project, apk: apkEntry };
  }

  function removeProjectApk(projectPath, apkId) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.apkFiles)) project.apkFiles = [];
    project.apkFiles = project.apkFiles.filter((a) => a.id !== apkId && a.path !== apkId);
    configStore.saveConfig();
    return { success: true, project };
  }

  function addProjectCompetitor(projectPath, competitor) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.competitors)) project.competitors = [];
    const compUrl = (competitor.url || '').trim();
    const pkgName = (competitor.packageName || '').trim() || extractPlayStorePackageName(compUrl);
    const name = (competitor.name || '').trim() || inferAppNameFromPackage(pkgName) || 'Android Competitor';
    const compEntry = {
      id: competitor.id || ('comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      name,
      url: compUrl,
      iconUrl: (competitor.iconUrl || '').trim(),
      packageName: pkgName,
      platform: 'Android',
      apkPath: typeof competitor.apkPath === 'string' ? competitor.apkPath.trim() : '',
      apkName: typeof competitor.apkName === 'string' ? competitor.apkName.trim() : (competitor.apkPath ? path.basename(competitor.apkPath) : ''),
      apkSize: typeof competitor.apkSize === 'number' && competitor.apkSize >= 0 ? competitor.apkSize : 0,
      jadxSourcePath: typeof competitor.jadxSourcePath === 'string' ? competitor.jadxSourcePath.trim() : '',
      jadxStatus: typeof competitor.jadxStatus === 'string' ? competitor.jadxStatus.trim() : '',
      notes: (competitor.notes || '').trim(),
      addedAt: competitor.addedAt || now(),
    };
    project.competitors.push(compEntry);
    configStore.saveConfig();
    return { success: true, project, competitor: compEntry };
  }

  function updateProjectCompetitor(projectPath, competitor) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.competitors)) project.competitors = [];
    let index = project.competitors.findIndex((c) => c.id === competitor.id);
    if (index === -1 && competitor.packageName) {
      index = project.competitors.findIndex((c) => c.packageName === competitor.packageName);
    }
    if (index === -1) return { success: false, error: 'Competitor not found' };
    const existing = project.competitors[index];
    const compUrl = competitor.url !== undefined ? competitor.url.trim() : (existing.url || '');
    const pkgName = competitor.packageName !== undefined ? competitor.packageName.trim() : (existing.packageName || extractPlayStorePackageName(compUrl));
    project.competitors[index] = {
      ...existing,
      name: (competitor.name !== undefined ? competitor.name : existing.name).trim(),
      url: compUrl,
      iconUrl: competitor.iconUrl !== undefined ? (competitor.iconUrl || '').trim() : (existing.iconUrl || ''),
      packageName: pkgName,
      platform: 'Android',
      apkPath: competitor.apkPath !== undefined ? (competitor.apkPath ? competitor.apkPath.trim() : '') : (existing.apkPath || ''),
      apkName: competitor.apkName !== undefined ? (competitor.apkName ? competitor.apkName.trim() : '') : (existing.apkName || ''),
      apkSize: competitor.apkSize !== undefined ? competitor.apkSize : (existing.apkSize || 0),
      jadxSourcePath: competitor.jadxSourcePath !== undefined ? (typeof competitor.jadxSourcePath === 'string' ? competitor.jadxSourcePath.trim() : '') : (existing.jadxSourcePath || ''),
      jadxStatus: competitor.jadxStatus !== undefined ? (typeof competitor.jadxStatus === 'string' ? competitor.jadxStatus.trim() : '') : (existing.jadxStatus || ''),
      notes: (competitor.notes !== undefined ? competitor.notes : existing.notes).trim(),
    };
    enrichCompetitorFromDisk(projectPath, project.competitors[index]);
    configStore.saveConfig();
    return { success: true, project, competitor: project.competitors[index] };
  }

  function linkCompetitorApk(projectPath, competitorId, apk) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.competitors)) project.competitors = [];
    const comp = project.competitors.find((c) => c.id === competitorId);
    if (!comp) return { success: false, error: 'Competitor not found' };

    comp.apkPath = (apk?.path || '').trim();
    comp.apkName = (apk?.name || (comp.apkPath ? path.basename(comp.apkPath) : '')).trim();
    comp.apkSize = typeof apk?.size === 'number' && apk.size >= 0 ? apk.size : 0;
    comp.apkAddedAt = now();

    enrichCompetitorFromDisk(projectPath, comp);

    configStore.saveConfig();
    return { success: true, project, competitor: comp };
  }

  function unlinkCompetitorApk(projectPath, competitorId) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.competitors)) project.competitors = [];
    const comp = project.competitors.find((c) => c.id === competitorId);
    if (!comp) return { success: false, error: 'Competitor not found' };

    delete comp.apkPath;
    delete comp.apkName;
    delete comp.apkSize;
    delete comp.apkAddedAt;

    configStore.saveConfig();
    return { success: true, project, competitor: comp };
  }

  function removeProjectCompetitor(projectPath, competitorId) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    if (!Array.isArray(project.competitors)) project.competitors = [];
    project.competitors = project.competitors.filter((c) => c.id !== competitorId);
    configStore.saveConfig();
    return { success: true, project };
  }

  function syncBaProjectConfig(projectPath, worktreePath) {
    const workspaceConfig = getWorkspaceConfig();
    const project = workspaceConfig.projects.find((entry) => entry.path === projectPath);
    if (!project) return { success: false, error: 'Project not found' };
    const targetDir = worktreePath || projectPath;
    const configDir = path.join(targetDir, '.agents', 'config');
    const configFilePath = path.join(configDir, 'ba-project-config.md');

    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let content = '';
      if (fs.existsSync(configFilePath)) {
        content = fs.readFileSync(configFilePath, 'utf-8');
      } else {
        content = `# BA Project Configuration\n\n| Field | Value |\n| :--- | :--- |\n| Project | ${project.name} |\n| Deliverable language | Vietnamese |\n\n## 1. Project Overview\n\n> **Description:** Requirements and benchmarks\n\n## 2. Links & Resources\n\n| Resource | URL | Note / Access |\n| :--- | :--- | :--- |\n| Figma | \`https://figma.com\` | Design mockups, design system |\n\n## 5. Competitor Apps\n\n| App | Package | Platform | Flows of interest | Account to use | Decoded source | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      }

      // Update Figma URL if provided
      if (project.figmaUrl) {
        if (/\| Figma \|.*\|.*\|/i.test(content)) {
          content = content.replace(/\| Figma \|.*\|.*\|/i, `| Figma | \`${project.figmaUrl}\` | Design mockups, design system |`);
        } else if (/## 2\. Links & Resources/i.test(content)) {
          content = content.replace(/(## 2\. Links & Resources[\s\S]*?\| :--- \| :--- \| :--- \|\r?\n)/i, `$1| Figma | \`${project.figmaUrl}\` | Design mockups, design system |\n`);
        }
      }

      // Update Competitor Apps table
      if (Array.isArray(project.competitors) && project.competitors.length > 0) {
        const compRows = project.competitors.map((c) => {
          const parsed = parseBenchmarkFlows(c.notes);
          const flowsStr = parsed.length > 0
            ? parsed.join(', ')
            : (c.notes ? c.notes.replace(/[\r\n|]+/g, ' ').trim() : 'onboarding, main flow');
          const noteParts = [];
          if (c.url) noteParts.push(c.url);
          if (c.apkName) noteParts.push(`APK: ${c.apkName}`);
          const notesStr = noteParts.join(' | ');
          const decoded = c.jadxStatus === 'ready' && c.jadxSourcePath ? `\`${c.jadxSourcePath}\`` : 'none';
          return `| ${c.name || 'App'} | \`${c.packageName || ''}\` | Android | ${flowsStr} | guest | ${decoded} | ${notesStr} |`;
        }).join('\n');

        const compTable = `| App | Package | Platform | Flows of interest | Account to use | Decoded source | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n${compRows}`;

        if (/## 5\. Competitor Apps[\s\S]*?(?=##|\Z)/i.test(content)) {
          content = content.replace(/## 5\. Competitor Apps[\s\S]*?(?=##|\Z)/i, `## 5. Competitor Apps\n\nUsed by \`competitor-app-analysis\` / \`/ba-competitor\`. One row per app to benchmark.\n\n${compTable}\n\n`);
        } else {
          content += `\n\n## 5. Competitor Apps\n\n${compTable}\n`;
        }
      }

      fs.writeFileSync(configFilePath, content, 'utf-8');
      return { success: true, path: configFilePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return {
    getWorkspaces,
    getSettings,
    updateSettings,
    addProject,
    removeProject,
    refreshWorktrees,
    updateProjectMetadata,
    addProjectApk,
    removeProjectApk,
    addProjectCompetitor,
    updateProjectCompetitor,
    removeProjectCompetitor,
    linkCompetitorApk,
    unlinkCompetitorApk,
    syncBaProjectConfig,
  };
}

module.exports = {
  createWorkspaceService,
};
