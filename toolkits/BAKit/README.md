# BAKit — Antigravity BA Toolkit

BA agents, skills, rules and a template catalog for an **Antigravity** workspace, plus
registration of two MCP servers: **mobilerun**, so the agent can drive a competitor app on a connected Android
device, and **figma-mcp-android**, so it can read the design open in Figma Desktop — and turn what it sees into
BA documents: Feature Checklists, Batch Rule Confirmation Tables / Product Decision Summaries, an SRS with use cases and diagrams, formatted Word `.docx` SRS exports for testers (`srs-export`), user stories, audits and test
cases.

Deliverables are written in Vietnamese; skill and rule files are in English.

## What gets deployed

| Toolkit folder | Deployed to | Contents |
| :--- | :--- | :--- |
| `agents/` | `.agents/agents/` | `ba-lead` (orchestrator, main agent), `code-scout`, `competitor-analyst`, `evidence-verifier`, `ba-figma`, `ba-researcher`, `ba-brainstormer`, `ba-spec-writer` |
| `agents-md/` | `AGENTS.md` (marked block) | Delegation rule: the main session plans and dispatches subagents with `invoke_subagent` |
| `skills/` | `.agents/skills/` | **41 skills**: `ba-templates` (template catalog), `apk-code-index` (jadx index + `apk_index.py`), `apk-feature-extractor` (v1.3.0 checklist normalization), `competitor-app-analysis`, `mobilerun`, `figma-ba-analysis`, `product-decision` (v1.1.0 with Batch Rule Confirmation Table `Bảng xác nhận rule`), `specs` (Single-File Mobile SRS & Modular SRS), `srs-export` (Markdown SRS → Word `.docx` with rendered Mermaid diagrams & embedded screenshots), `use-case-writer` (scoping rules + 16-item self-check `K1–K16` + 13-field Wiegers), `user-story-ac-writer`, `minipower` (18-DOC SDLC pack), `test-cases`, `BA-audit-SRS` (Quick Mode & Full Mode), `BA-audit-QnA`, `global-impact-analyzer`, `global-executor`, `ba-consistency-inspector`, `ba-shared-validation-rules`, `ba-architect`, `ba-auditor`, `ba-challenger`, `qc-ask-ba`, `qc-scenario-design`, `qc-tc-design`, `qc-tc-summary`, `qc-uc-review`, `brainstorm-features`, `document-extraction`, `docx`, `pdf`, `mermaidjs-v11`, `bpmn-generator`, `drawio-ai-kit`, `drawio-bpmn`, `drawio-aws`, `drawio-azure`, `drawio-gcp`, `drawio-databricks`, `problem-solving`, `sequential-thinking` |
| `rules/` | `.agents/rules/` | Always-on: `ba-global-rules`, `ba-workflow`, `ba-naming-convention`, `ba-device-automation`, `ba-figma`, `ba-markdown-formatting` |
| `config/` | `.agents/config/` | `ba-project-config.md` — created once, never overwritten or removed; fill it in and commit it |
| `mcp/` | `.agents/plugins/mobilerun/`, `.agents/plugins/figma/` (workspace plugins) | `mobilerun` and `figma-mcp-android` server entries (see below) |

## Install

**From BA Space:** Agent Toolkit → **BAKit** group → tick the components (or *Apply All*). Tick
**Mobilerun MCP (workspace plugin)** and/or **Figma MCP (workspace plugin)** to register the servers for this
worktree.

BA Space installs BAKit from this UI on Windows, macOS and Linux; use it on macOS/Linux.

**Without BA Space** (PowerShell, Windows only; there is no macOS/Linux script):

```powershell
# toolkit files into a workspace, and register mobilerun for that workspace
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterMcp

# only (re)register the MCP server, pinning a device when several are attached
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -McpOnly -Device R58RB1XWAKJ -Force

# register figma-mcp-android for that workspace
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -McpOnly -RegisterFigmaMcp
```

Restart the Antigravity agent after registering the MCP server.

## mobilerun MCP: workspace scope

mobilerun is registered **per workspace**, as an Antigravity plugin, so it only starts in BA workspaces:

```
<worktree>/.agents/plugins/mobilerun/
  plugin.json        plugin marker (name, description)
  mcp_config.json    { "mcpServers": { "mobilerun": { "command": "npx", "args": ["-y", "@impeterwayne/mobilerun-mcp@latest"] } } }
```

Antigravity discovers plugins under the workspace's `.agents/` and launches the MCP servers they declare. A bare
`.agents/mcp_config.json` is not read; the only other MCP location is the global
`~/.gemini/config/mcp_config.json` (`%USERPROFILE%\.gemini\config\mcp_config.json` on Windows), which applies to every workspace. If an older BAKit put
`mobilerun` there, BA Space offers to remove it when you tick the plugin, and the PowerShell installer warns.

### Zero-Setup Mobilerun Runner (`npx`)

BA Space uses the `@impeterwayne/mobilerun-mcp@latest` npm package directly via `npx`. The runner manages its own isolated environment and dependencies automatically. No manual wheel building, Python installation, or local app data virtual environment setup is required.

Pin a device per workspace with `"env": { "MOBILERUN_DEVICE": "<serial>" }` in that `mcp_config.json`.

Device prerequisites: `adb` on PATH, USB debugging authorised, and the Mobilerun Portal accessibility
service enabled (`npx -y @impeterwayne/mobilerun-mcp@latest cli setup -d <serial>` or the "Setup Portal" button in Device Manager). Run `/ba-device-check` in Antigravity to verify.

## figma-mcp-android: workspace scope

Same plugin mechanism as mobilerun, at `<worktree>/.agents/plugins/figma/`:

```
mcp_config.json    { "mcpServers": { "figma-mcp-android": { "command": "cmd", "args": ["/c", "npx", "-y", "@impeterwayne/figma-mcp-android@latest"] } } }
```

That is the Windows form (`npx` is a `.cmd` shim there, which a bare spawn cannot start), and it is what
`mcp/figma.mcp.json` holds. On macOS/Linux the command is `npx` directly:
`{ "command": "npx", "args": ["-y", "@impeterwayne/figma-mcp-android@latest"] }`. BA Space writes the right
form for the platform it runs on.

## Typical flow (5-Step PO Mobile SRS + Word Export)

1. Fill in `.agents/config/ba-project-config.md` (project type, competitor apps, environments).
2. **Competitor & Feature Checklist (`apk-feature-extractor` v1.3.0):** Decode the competitor APK in BA Space → `/ba-competitor <app> <flows>` → `/ba-checklist` (or generate from PO research notes via `ba-brainstormer` Section 5A when no APK exists).
3. **Batch Rule Confirmation (`product-decision` v1.1.0):** `ba-brainstormer` compares the checklist, Design/Figma, and APK evidence, and presents **one single Batch Rule Confirmation Table (`Bảng xác nhận rule`)** for all hidden rules not visible in Design. The PO replies in one shot (`OK` = keep APK value, `A/B/C` = pick AI option, or custom value) → Product Decision Summary with `READY FOR SRS` verdict.
4. **SRS Specification (`specs` + `use-case-writer`):** `ba-spec-writer` writes the single-file Vietnamese SRS (`docs/ba/srs/{app}_srs_v1.md`) with full Use Cases in Section 6, Design screenshots embedded at the top of each screen subsection, User Flow & Activity diagrams, and runs the 16-item self-check (`K1–K16`).
5. **Quick Audit & Word `.docx` Export (`BA-audit-SRS` + `srs-export`):** `BA-audit-SRS` checks the 5 handoff gates in Quick Mode (`docs/ba/audit/{app}_srs-audit_v1.md`), and `srs-export` generates `docs/ba/srs-word/{app}_srs_v1.docx` with rendered Mermaid diagrams and embedded screenshots for testers.
