# BAKit — Antigravity BA Toolkit

BA agents, skills, rules, slash workflows and a template catalog for an **Antigravity** workspace, plus
registration of two MCP servers: **mobilerun**, so the agent can drive a competitor app on a connected Android
device, and **figma-mcp-android**, so it can read the design open in Figma Desktop — and turn what it sees into
BA documents (PRD / SRS: FSD, use cases, user stories).

Deliverables are written in Vietnamese; skill, rule and workflow files are in English.

## What gets deployed

| Toolkit folder | Deployed to | Contents |
| :--- | :--- | :--- |
| `agents/` | `.agents/agents/` | `ba-lead` (orchestrator, main agent), `code-scout`, `competitor-analyst`, `evidence-verifier`, `figma-analyst`, `ba-researcher`, `ba-brainstormer`, `ba-spec-writer` |
| `agents-md/` | `AGENTS.md` (marked block) | Delegation rule: the main session plans and dispatches subagents with `invoke_subagent` |
| `skills/` | `.agents/skills/` | `ba-templates` (template catalog), `apk-code-index` (jadx index + `apk_index.py`), `competitor-app-analysis`, `mobilerun`, `figma-ba-analysis`, `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`, `mermaidjs-v11`, `problem-solving`, `sequential-thinking` |
| `rules/` | `.agents/rules/` | Always-on: `ba-global-rules`, `ba-workflow`, `ba-naming-convention`, `ba-device-automation`, `ba-figma`, `ba-markdown-formatting` |
| `workflows/` | `.agents/workflows/` | `/ba-competitor`, `/ba-figma`, `/ba-template`, `/ba-spec`, `/ba-review`, `/ba-testcases`, `/ba-device-check` |
| `config/` | `.agents/config/` | `ba-project-config.md` — created once, never overwritten or removed; fill it in and commit it |
| `mcp/` | `.agents/plugins/mobilerun/`, `.agents/plugins/figma/` (workspace plugins) | `mobilerun` and `figma-mcp-android` server entries (see below) |

## Install

**From BA Space:** Agent Toolkit → **BAKit** group → tick the components (or *Apply All*). Tick
**Mobilerun MCP (workspace plugin)** and/or **Figma MCP (workspace plugin)** to register the servers for this
worktree.

**Without BA Space** (PowerShell):

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
`%USERPROFILE%\.gemini\config\mcp_config.json`, which applies to every workspace. If an older BAKit put
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

It is the server AndroidHarnessAGY uses: a read-only bridge to the document open in **Figma Desktop**, no Figma
API token. Prerequisites: Node.js 18+ (`npx`), Figma Desktop, and the bridge plugin imported once
(Plugins → Development → Import plugin from manifest) and **running in the file** you want analysed. The server
listens on `127.0.0.1:1994` for the plugin, so only one copy can run: if an enabled global entry
(`~/.gemini/config/mcp_config.json`, or `~/.gemini/antigravity/` when `config/` does not exist) already launches figma-mcp-android, BA Space and
the installer leave the workspace alone and the global one is used; BA Space never edits that global entry.

## How `/ba-figma` delegates

`/ba-figma <figma url> <feature-slug> [then spec | then stories] [diff <previous analysis>]`

| Step | Agent | Output |
| :--- | :--- | :--- |
| 1. Analyse (one flow at a time) | `figma-analyst` (skill `figma-ba-analysis`) | `docs/BA/figma/<feature>/<feature>_figma_<date>_v<N>.md` + `screens/*.png` |
| 2. Verify + confirm | `ba-lead` with the user | `FR-DSN-*` / `BR-CAND-*` confirmed or struck, questions answered |
| 3. Specify | `ba-spec-writer` (`specs analyze` or `user-stories`) | FSD screens / flows / rules / data, use cases, user stories |

The analysis (template `figma-analysis` in `ba-templates`) is BA-oriented, not a dev spec: screen inventory with
reference images, screen flow from prototype reactions, elements, input fields and visible validation, designed
**and not designed** states, every string, displayed data, designer annotations, candidate requirements and open
questions. Visual tokens (colours, spacing, fonts) are left to developers.

## How `/ba-competitor` delegates

The main Antigravity session acts as `ba-lead` and never does the work itself. `/ba-competitor` supports two execution branches:

### Branch 1: Hybrid / Device-Verified (with `mobilerun`)
| Wave | Agent(s) | Output under `docs/BA/competitor/<app-slug>/` |
| :--- | :--- | :--- |
| A. Code (parallel, needs a decoded APK) | 2-3 × `code-scout` in one `invoke_subagent` call | `code-index/` (`apk_index.py build` + per-flow notes) |
| B. Plan | `ba-lead` | `exploration-plan.md` (entry deep link / activity, expected screens, checklist) |
| C. Device (one flow at a time) | `competitor-analyst` WALK | `screens/`, `<slug>_flow-<flow>_…md` |
| D. Write | `competitor-analyst` SYNTHESIZE | profile (with tech + code-only features), screens, comparison |
| E. Verify | `evidence-verifier` | `<verdict>`; defects go back to their owner |

### Branch 2: Static / Code-Only (without `mobilerun`)
*Activated by `--code-only`, `--no-device`, or auto-fallback when no device is connected.*
| Wave | Agent(s) | Output under `docs/BA/competitor/<app-slug>/` |
| :--- | :--- | :--- |
| A. Deep Code Analysis (parallel) | 2-3 × `code-scout` in one `invoke_subagent` call | `code-index/` (layouts, rules, validations, error strings) |
| B. Write Deliverables | `competitor-analyst` SYNTHESIZE (mode="code-only") | profile, screen inventory, flow analyses, comparison |
| C. Verify | `evidence-verifier` | `<verdict>`; audits `[Code]` path:line citations |

Decode the APK first in BA Space (Competitor → Decode, ReaKit jadx). Copying a benchmark command also syncs
the project config, whose Competitor Apps table carries the jadx path in its **Decoded source** column; the
command itself stays short: `/ba-competitor <package> <flows> [--code-only]`. If no index exists yet, one scout builds it
alone before the parallel scouts start.

`apk_index.py` needs Python 3.8+ on PATH (standard library only). Its ideas come from
[apk-reverse](https://github.com/newliver666/apk-reverse) (MIT): orient with an index, not the decompiled
export. The orchestration pattern (AGENTS.md block, six-part dispatch, scout barrier, verifier) comes from
AndroidHarnessAGY.

## Typical flow

1. Fill in `.agents/config/ba-project-config.md` (project type, competitor apps, environments).
2. Decode the competitor APK in BA Space, then `/ba-device-check` →
   `/ba-competitor <app> <flows>` (copied from BA Space) — code index, plan, evidence and competitor docs under
   `docs/BA/competitor/<app-slug>/`. Start a new Antigravity conversation after installing so `AGENTS.md`
   is loaded.
3. Ask `ba-lead` to brainstorm the top `GAP-*` items → feature brief in `docs/BA/briefs/`.
4. `/ba-spec analyze <brief>` → FSD + use cases; `/ba-template user-stories …` for backlog items.
5. `/ba-review <UC folder>` → readiness score + question backlog; `/ba-testcases generate <module>`.

With a design instead (or as well): open the file in Figma Desktop, run the figma-mcp-android plugin, then
`/ba-figma <figma url> <feature-slug>` → confirm the candidates → `/ba-figma … then spec` (or
`/ba-spec analyze docs/BA/figma/<feature>/<analysis>.md`).

## Provenance

- `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`,
  `mermaidjs-v11`, `problem-solving`, `sequential-thinking`, and the markdown formatting rule come from
  `D:\Quest\BA_Flow\.agents`. They were adapted for Antigravity: no Claude-Code-only tools
  (`AskUserQuestion`, `$ARGUMENTS`), a project-type step instead of the missing `detect-project-type.sh`,
  and template paths pointing at `ba-templates`.
- `mobilerun` skill: device automation skill for the 94 mobilerun MCP tools (`@impeterwayne/mobilerun-mcp`).
- `figma-ba-analysis`, `figma-analyst` and the `ba-figma` rule are adapted from AndroidHarnessAGY's
  `figma-design-analyzer` / `figma-analyzer` / `figma` rule (same MCP server and call budget), retargeted from a
  Compose / XML implementation spec to PRD / SRS input.
- Templates in `ba-templates/templates/` were rewritten with bilingual headings from the BA_Flow `specs` /
  `test-cases` templates, plus new competitor-analysis templates.
- Not included from BA_Flow: `ba-architect`, `ba-auditor`, `ba-challenger`, `Document-skills`,
  `global-impact-analyzer`, `requirement-analysis`, `rules/business_rules.md`, `rules/collaboration_rules.md`
  (tied to one client project and its data), the `qc-*` skills (QC-team duplicates of the BA audits), and
  `docx` / `pdf` (Anthropic-licensed, not redistributable).
