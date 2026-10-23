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
| `skills/` | `.agents/skills/` | **42 skills**: `ba-templates` (template catalog), `ba-checklist` (target product Feature Checklist `/ba-checklist`), `apk-code-index` (jadx index + `apk_index.py`), `apk-feature-extractor` (v1.3.0 competitor feature extraction `/apk-feature-extractor`), `competitor-app-analysis`, `mobilerun`, `figma-ba-analysis`, `product-decision` (v1.1.0 with Batch Rule Confirmation Table `Bảng xác nhận rule`), `specs` (Single-File Mobile SRS & Modular SRS), `srs-export` (Markdown SRS → Word `.docx` with rendered Mermaid diagrams & embedded screenshots), `use-case-writer` (scoping rules + 16-item self-check `K1–K16` + 13-field Wiegers), `user-story-ac-writer`, `minipower` (18-DOC SDLC pack), `test-cases`, `BA-audit-SRS` (Quick Mode & Full Mode), `BA-audit-QnA`, `global-impact-analyzer`, `global-executor`, `ba-consistency-inspector`, `ba-shared-validation-rules`, `ba-architect`, `ba-auditor`, `ba-challenger`, `qc-ask-ba`, `qc-scenario-design`, `qc-tc-design`, `qc-tc-summary`, `qc-uc-review`, `brainstorm-features`, `document-extraction`, `docx`, `pdf`, `mermaidjs-v11`, `bpmn-generator`, `drawio-ai-kit`, `drawio-bpmn`, `drawio-aws`, `drawio-azure`, `drawio-gcp`, `drawio-databricks`, `problem-solving`, `sequential-thinking` |
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
| 1. Analyse (one flow at a time) | `ba-figma` (skill `figma-ba-analysis`) | `docs/BA/figma/<feature>/<feature>_figma_<date>_v<N>.md` + `screens/*.png` |
| 2. Verify + confirm | `ba-lead` with the user | `FR-DSN-*` / `BR-CAND-*` confirmed or struck, questions answered |
| 3. Specify | `ba-spec-writer` (`specs analyze` or `user-stories`) | SRS use cases with the UI Specification, flows, rules and diagrams; user stories |

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
| D. Write | `competitor-analyst` SYNTHESIZE | profile (with tech + code-only features), screens, competitor feature extraction (`apk-feature-extractor`), comparison |
| E. Verify | `evidence-verifier` | `<verdict>`; defects go back to their owner |

### Branch 2: Static / Code-Only (without `mobilerun`)
*Activated by `--code-only`, `--no-device`, or auto-fallback when no device is connected.*
| Wave | Agent(s) | Output under `docs/BA/competitor/<app-slug>/` |
| :--- | :--- | :--- |
| A. Deep Code Analysis (parallel) | 2-3 × `code-scout` in one `invoke_subagent` call | `code-index/` (layouts, rules, validations, error strings) |
| B. Write Deliverables | `competitor-analyst` SYNTHESIZE (mode="code-only") | profile, screen inventory, flow analyses, competitor feature extraction (`apk-feature-extractor`), comparison |
| C. Verify | `evidence-verifier` | `<verdict>`; audits `[Code]` path:line citations |

Decode the APK first in BA Space (Competitor → Decode, ReaKit jadx). Copying a benchmark command also syncs
the project config, whose Competitor Apps table carries the jadx path in its **Decoded source** column; the
command itself stays short: `/ba-competitor <package> <flows> [--code-only]`. Standalone competitor feature extraction can also be triggered via `/apk-feature-extractor <package>`. If no index exists yet, one scout builds it
alone before the parallel scouts start.

`apk_index.py` needs Python 3.8+ on PATH (standard library only), run as `python3` on macOS/Linux and `python` on
Windows. Its ideas come from
[apk-reverse](https://github.com/newliver666/apk-reverse) (MIT): orient with an index, not the decompiled
export. The orchestration pattern (AGENTS.md block, six-part dispatch, scout barrier, verifier) comes from
AndroidHarnessAGY.

## Typical flow (5-Step PO Mobile SRS + Word Export)

1. Fill in `.agents/config/ba-project-config.md` (project type, competitor apps, environments).
2. **Competitor Discovery & Feature Extraction (`apk-feature-extractor` v1.3.0):** Decode the competitor APK in BA Space → `/ba-competitor <app> <flows>` (or `/apk-feature-extractor <app>`) — code index, plan, evidence and competitor docs (`profile`, `screens`, `flow-*`, and `features` extraction) under `docs/BA/competitor/<app-slug>/`.
3. **Target Product Checklist & Batch Rule Confirmation (`ba-checklist` + `product-decision` v1.1.0):** Run `/ba-checklist [module-or-scope]` to synthesize our product's **Target Feature Checklist** (`docs/BA/checklist/<slug>_checklist_<YYYYMMDD>_v1.md`) from competitor extractions, Figma designs, PRD/briefs, and PO requirements (or generate from PO research notes via `ba-brainstormer` Section 5A when no APK exists). Then `ba-brainstormer` compares the checklist, Design/Figma, and APK evidence, and presents **one single Batch Rule Confirmation Table (`Bảng xác nhận rule`)** for all hidden rules not visible in Design. The PO replies in one shot (`OK` = keep APK value, `A/B/C` = pick AI option, or custom value) → Product Decision Summary with `READY FOR SRS` verdict.
4. **SRS Specification (`specs` + `use-case-writer`):** `ba-spec-writer` writes the single-file Vietnamese SRS (`docs/ba/srs/{app}_srs_v1.md` or modular `docs/project-srs.md`) with full Use Cases in Section 6, Design screenshots embedded at the top of each screen subsection, User Flow & Activity diagrams, and runs the 16-item self-check (`K1–K16`).
5. **Quick Audit & Word `.docx` Export (`BA-audit-SRS` + `srs-export`):** `BA-audit-SRS` checks the 5 handoff gates in Quick Mode (`docs/ba/audit/{app}_srs-audit_v1.md`), and `srs-export` generates `docs/ba/srs-word/{app}_srs_v1.docx` with rendered Mermaid diagrams and embedded screenshots for testers.

With a design instead (or as well): open the file in Figma Desktop, run the figma-mcp-android plugin, then
`/ba-figma <figma url> <feature-slug>` → confirm the candidates → `/ba-figma … then spec` (or
`/ba-spec analyze docs/BA/figma/<feature>/<analysis>.md`).

## Provenance

- `product-decision`, the SRS mode of `specs` (SRS / use case templates, hybrid diagram policy), the mobile SRS
  audit in `BA-audit-SRS` and the source-of-truth rules in `ba-workflow` come from the 2026-10 baskill update of
  the same kit, adapted the same way; its Product Decision Summary was given a template and a versioned file.
- `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`,
  `mermaidjs-v11`, `problem-solving`, `sequential-thinking`, `global-impact-analyzer`, `global-executor`,
  `ba-consistency-inspector`, `ba-shared-validation-rules`, `ba-architect`, `ba-auditor`, `ba-challenger`,
  `bpmn-generator`, `qc-ask-ba`, `qc-scenario-design`, `qc-tc-design`, `qc-tc-summary`, `qc-uc-review`,
  `docx`, `pdf`, and the markdown formatting rule come from `D:\Quest\BA_Flow\.agents` / `baskill`.
- `user-story-ac-writer` (INVEST + Gherkin AC), `use-case-writer` (Cockburn / Wiegers 13-field UC),
  `minipower` (18-DOC SDLC pack), and `drawio-ai-kit` (`drawio-bpmn`, `drawio-aws`, `drawio-azure`, `drawio-gcp`,
  `drawio-databricks` with bundled zero-dependency CLI) are ported from `baskill`.
- `mobilerun` skill: device automation skill for the 94 mobilerun MCP tools (`@impeterwayne/mobilerun-mcp`).
- `figma-ba-analysis`, `ba-figma` and the `ba-figma` rule are adapted from AndroidHarnessAGY's
  `figma-design-analyzer` / `figma-analyzer` / `figma` rule (same MCP server and call budget), retargeted from a
  Compose / XML implementation spec to PRD / SRS input.
- Templates in `ba-templates/templates/` were rewritten with bilingual headings from the BA_Flow `specs` /
  `test-cases` templates, plus new competitor-analysis templates.
