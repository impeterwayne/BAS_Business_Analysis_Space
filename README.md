# BA Space

BA Space is an AI-augmented Business Analyst workspace and requirement orchestration platform built with Electron, TypeScript, and xterm.js. Tailored specifically for Business Analysts, Product Managers, and Solution Architects, BA Space bridges the gap between requirements, live application screens, Figma specifications, Plane project tasks, and AI Agent harnesses.

---

## Key Features

### 1. Plane Task & Requirement Management
- **Integrated Plane Board**: View, filter, and manage project tasks directly within BA Space.
- **Worktree-Task Binding**: Seamlessly link active Git worktrees and specification branches to Plane task IDs.
- **Workflow Transitions**: Update issue states, track progress, and coordinate requirements without leaving the workspace.

### 2. Live Device Inspection & UI Capture
- **Real-Time Mirroring (`scrcpy-cli`)**: Launch low-latency Android device screen mirroring with a single click.
- **Black-box UI Capture**: Capture both high-resolution screenshots and XML UI hierarchy dumps (`uiautomator dump`) directly from connected devices for rapid UX documentation and agent visual context.

### 3. POKit Business Analyst Agent Harness
- **BA Agent Roster**: Deploy specialized agents (`orchestrator`, `business-analyst`, `screen-analyst`) into any active worktree.
- **Skills & Tooling**: Equip agents with goal ledger tracking, ultrawork execution, and device control skills.
- **Automated Guard Hooks**: Deploy enforcement scripts and guardrails (`device_guard`, `scrcpy_daemon`, `stop_verifier`, `loop.py`) with automatic `.git/info/exclude` exclusion.

### 4. OpenSpec Specification Toolkit
- **Multi-Agent Specs**: Deploy specification workflows and slash commands for Antigravity, Claude, Codex, and OpenCode.
- **Batch Toolkit Deployment**: One-click "Apply All" to provision worktrees with both POKit BA Harness and OpenSpec toolkits.

### 5. BA Quick Launchers & External Integrations
- **Antigravity IDE & Agent Manager**: Jump straight into Antigravity with your current worktree context.
- **Figma Integration**: Launch Figma desktop app or navigate to custom project design URLs.
- **Spec Editor**: Open markdown specs, user stories, and acceptance criteria in your preferred editor (VS Code or custom spec editor).
- **Embedded & External Terminals**: Integrated xterm.js tabs with `scrcpy-cli` quick launch, alongside external Windows Terminal support.

---

## Getting Started

### Prerequisites
- **OS**: Windows 10/11
- **Node.js**: v20+ recommended
- **Git**: Installed and on system PATH
- **ADB & Scrcpy**: Required for device mirroring and UI capture features (`scrcpy` and `adb` available on PATH)

### Installation & Run

```bash
# Install dependencies
npm install

# Start development application
npm start
```

### Build & Package for Production

```bash
# Build TypeScript and bundled scripts
npm run build

# Fast unpacked distribution package
npm run pack

# Full Windows installer (NSIS) and portable executable
npm run make:win
```

All distribution artifacts are generated into the `release/` directory.

---

## Project Structure

- **Main Process**: [`src/main/main.ts`](file:///D:/Quest/BA_Space/src/main/main.ts) & [`src/main/ipc/workspaceIpc.ts`](file:///D:/Quest/BA_Space/src/main/ipc/workspaceIpc.ts)
  - Handles Electron lifecycle, window creation, PTY session management, external process spawning (Figma, Scrcpy, Antigravity, VS Code), and system dialogs.
- **Preload Bridge**: [`src/main/preload.ts`](file:///D:/Quest/BA_Space/src/main/preload.ts)
  - Exposes typed IPC methods to the renderer context.
- **Renderer Frontend**:
  - [`src/renderer/index.html`](file:///D:/Quest/BA_Space/src/renderer/index.html): Semantic layout, sidebar launchers, Plane task board, and settings modal.
  - [`src/renderer/app.ts`](file:///D:/Quest/BA_Space/src/renderer/app.ts): Workspace state, xterm.js terminals, Plane integration, POKit & OpenSpec toolkit management, device mirror/capture handlers.
  - [`src/renderer/styles.css`](file:///D:/Quest/BA_Space/src/renderer/styles.css): High-contrast dark theme optimized for analytical density and multi-tab workflows.
- **Domain & Services**:
  - [`src/application/workspaceService.ts`](file:///D:/Quest/BA_Space/src/application/workspaceService.ts): Git worktree manipulation and repository state.
  - [`src/application/workspaceConfigStore.ts`](file:///D:/Quest/BA_Space/src/application/workspaceConfigStore.ts): Workspace settings persistence, tool paths (Figma, Scrcpy, Antigravity, POKit), and symlink rules.
  - [`src/domain/settings/index.js`](file:///D:/Quest/BA_Space/src/domain/settings/index.js): Settings normalization and defaults.
- **Bundled Toolkits**:
  - `toolkits/POKit/`: BA Agent roster, ultrawork skills, hooks, and scripts.
  - `toolkits/openspec/`: OpenSpec core, workflows, and multi-agent skill packs.
