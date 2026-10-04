const fs = require('fs');
const path = require('path');

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

  function getWorkspaces() {
    return [...getWorkspaceConfig().projects].sort((a, b) => {
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
    const compEntry = {
      id: competitor.id || ('comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      name: (competitor.name || '').trim(),
      url: (competitor.url || '').trim(),
      packageName: (competitor.packageName || '').trim(),
      platform: competitor.platform || 'Android',
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
    const index = project.competitors.findIndex((c) => c.id === competitor.id);
    if (index === -1) return { success: false, error: 'Competitor not found' };
    project.competitors[index] = {
      ...project.competitors[index],
      name: (competitor.name !== undefined ? competitor.name : project.competitors[index].name).trim(),
      url: (competitor.url !== undefined ? competitor.url : project.competitors[index].url).trim(),
      packageName: (competitor.packageName !== undefined ? competitor.packageName : project.competitors[index].packageName).trim(),
      platform: competitor.platform !== undefined ? competitor.platform : project.competitors[index].platform,
      notes: (competitor.notes !== undefined ? competitor.notes : project.competitors[index].notes).trim(),
    };
    configStore.saveConfig();
    return { success: true, project, competitor: project.competitors[index] };
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
        content = `# BA Project Configuration\n\n| Field | Value |\n| :--- | :--- |\n| Project | ${project.name} |\n| Deliverable language | Vietnamese |\n\n## 1. Project Overview\n\n> **Description:** Requirements and benchmarks\n\n## 2. Links & Resources\n\n| Resource | URL | Note / Access |\n| :--- | :--- | :--- |\n| Figma | \`https://figma.com\` | Design mockups, design system |\n\n## 5. Competitor Apps\n\n| App | Package | Platform | Flows of interest | Account to use | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
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
          return `| ${c.name || 'App'} | \`${c.packageName || ''}\` | ${c.platform || 'Android'} | ${c.notes || 'onboarding, main flow'} | guest | ${c.url || ''} |`;
        }).join('\n');

        const compTable = `| App | Package | Platform | Flows of interest | Account to use | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n${compRows}`;

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
    syncBaProjectConfig,
  };
}

module.exports = {
  createWorkspaceService,
};
