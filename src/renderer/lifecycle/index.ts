function initializeRendererLifecycle({
  loadWorkspaceSidebarCollapsed,
  setWorkspaceSidebarCollapsed,
  loadWorkspaces,
}) {
  document.addEventListener('DOMContentLoaded', () => {
    setWorkspaceSidebarCollapsed(loadWorkspaceSidebarCollapsed(), { persist: false });
    loadWorkspaces();
  });
}

module.exports = {
  initializeRendererLifecycle,
};
