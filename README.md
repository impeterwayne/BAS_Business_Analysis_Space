# BA Space

BA Space is an AI-augmented Business Analyst workspace and requirement orchestration platform built with Electron, TypeScript, and xterm.js. Tailored specifically for Business Analysts, Product Managers, and Solution Architects, BA Space bridges the gap between requirements, live application screens, Figma specifications, and AI Agent harnesses.

---

## Key Features

### 1. Live Device Inspection & UI Capture
- **Real-Time Mirroring (`scrcpy-cli`)**: Launch low-latency Android device screen mirroring with a single click.
- **Black-box UI Capture**: Capture both high-resolution screenshots and XML UI hierarchy dumps (`uiautomator dump`) directly from connected devices for rapid UX documentation and agent visual context.

### 2. BAKit — Antigravity BA Toolkit
- **BA Agent Roster**: `ba-lead`, `competitor-analyst`, `ba-researcher`, `ba-brainstormer`, `ba-spec-writer`.
- **Template Catalog**: FSD, use case, user stories, feature brief, test cases, readiness review, competitor analysis and gap analysis — deliverables in Vietnamese.
- **Competitor App Analysis**: drives a competitor Android app through the `mobilerun` MCP server (registered in Antigravity's global MCP config) and writes evidence-backed BA documents.
- **Batch Toolkit Deployment**: One-click "Apply Selected Toolkits" to provision worktrees with BAKit and ReaKit harnesses.

### 3. ReaKit — APK Downloader & Decompiler
- **Online APK Acquisition**: Download APK and split XAPK packages from store repositories (apkcombo, fdroid, rustore, nashstore) directly into the active workspace.
- **Direct Workspace Decompilation**: Decompile Java/Kotlin source code using bundled JADX into your workspace root, `jadx_src/`, or target subfolder.
- **Local APK Support**: Select and decompile local `.apk` or `.xapk` files with one click.
- **Workspace-Aware Inspection**: Automatically scans the active workspace for APK files and decompiled sources with instant "Open in Editor" and "Launch JADX GUI" actions.

### 4. BA Quick Launchers & External Integrations
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
  - [`src/renderer/index.html`](file:///D:/Quest/BA_Space/src/renderer/index.html): Semantic layout, sidebar launchers, ReaKit studio, and settings modal.
  - [`src/renderer/app.ts`](file:///D:/Quest/BA_Space/src/renderer/app.ts): Workspace state, xterm.js terminals, BAKit & ReaKit toolkit management, device mirror/capture handlers.
  - [`src/renderer/styles.css`](file:///D:/Quest/BA_Space/src/renderer/styles.css): High-contrast dark theme optimized for analytical density and multi-tab workflows.
- **Domain & Services**:
  - [`src/application/workspaceService.ts`](file:///D:/Quest/BA_Space/src/application/workspaceService.ts): Git worktree manipulation and repository state.
  - [`src/application/workspaceConfigStore.ts`](file:///D:/Quest/BA_Space/src/application/workspaceConfigStore.ts): Workspace settings persistence, tool paths (Figma, Scrcpy, Antigravity, ReaKit), and symlink rules.
  - [`src/domain/settings/index.js`](file:///D:/Quest/BA_Space/src/domain/settings/index.js): Settings normalization and defaults.
- **Bundled Toolkits**:
  - `toolkits/BAKit/`: BA agents, skills, template catalog, rules, slash workflows, and mobilerun MCP registration.
