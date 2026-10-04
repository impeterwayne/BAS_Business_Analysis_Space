# BAKit — Antigravity BA Toolkit

BA agents, skills, rules, slash workflows and a template catalog for an **Antigravity** workspace, plus
registration of the **mobilerun MCP server** so the agent can drive a competitor app on a connected Android
device and turn what it sees into BA documents.

Deliverables are written in Vietnamese; skill, rule and workflow files are in English.

## What gets deployed

| Toolkit folder | Deployed to | Contents |
| :--- | :--- | :--- |
| `agents/` | `.agents/agents/` | `ba-lead` (orchestrator, main agent), `code-scout`, `competitor-analyst`, `evidence-verifier`, `ba-researcher`, `ba-brainstormer`, `ba-spec-writer` |
| `agents-md/` | `AGENTS.md` (marked block) | Delegation rule: the main session plans and dispatches subagents with `invoke_subagent` |
| `skills/` | `.agents/skills/` | `ba-templates` (template catalog), `apk-code-index` (jadx index + `apk_index.py`), `competitor-app-analysis`, `mobilerun`, `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`, `mermaidjs-v11`, `problem-solving`, `sequential-thinking` |
| `rules/` | `.agents/rules/` | Always-on: `ba-global-rules`, `ba-workflow`, `ba-naming-convention`, `ba-device-automation`, `ba-markdown-formatting` |
| `workflows/` | `.agents/workflows/` | `/ba-competitor`, `/ba-template`, `/ba-spec`, `/ba-review`, `/ba-testcases`, `/ba-device-check` |
| `config/` | `.agents/config/` | `ba-project-config.md` — created once, never overwritten or removed; fill it in and commit it |
| `mcp/` | `.agents/plugins/mobilerun/` (workspace plugin) | `mobilerun` server entry (see below) |

## Install

**From BA Space:** Agent Toolkit → **BAKit** group → tick the components (or *Apply All*). Tick
**Mobilerun MCP (workspace plugin)** to register the server for this worktree.

**Without BA Space** (PowerShell):

```powershell
# toolkit files into a workspace, and register mobilerun for that workspace
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterMcp

# only (re)register the MCP server, pinning a device when several are attached
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -McpOnly -Device R58RB1XWAKJ -Force
```

Restart the Antigravity agent after registering the MCP server.

## mobilerun MCP: workspace scope

mobilerun is registered **per workspace**, as an Antigravity plugin, so it only starts in BA workspaces:

```
<worktree>/.agents/plugins/mobilerun/
  plugin.json        plugin marker (name, description)
  mcp_config.json    { "mcpServers": { "mobilerun": { "command": "<python>", "args": ["-m", "mobilerun_mcp.server"] } } }
```

Antigravity discovers plugins under the workspace's `.agents/` and launches the MCP servers they declare. A bare
`.agents/mcp_config.json` is not read; the only other MCP location is the global
`%USERPROFILE%\.gemini\config\mcp_config.json`, which applies to every workspace. If an older BAKit put
`mobilerun` there, BA Space offers to remove it when you tick the plugin, and the PowerShell installer warns.

The server is found at `<mobilerun-mcp>\.venv\Scripts\python.exe`, looked up next to BA Space
(`BA_Space\mobilerun-mcp`, symlinks resolved) and at `D:\Quest\mobilerun-mcp`. The `command` is an absolute
path on this machine: re-tick the component (or rerun the installer) on another machine. Pin a device per
workspace with `"env": { "MOBILERUN_DEVICE": "<serial>" }` in that `mcp_config.json`.

Device prerequisites: `adb` on PATH, USB debugging authorised, and the Mobilerun Portal accessibility
service enabled (`mobilerun setup -d <serial>`). Run `/ba-device-check` in Antigravity to verify.

## How `/ba-competitor` delegates

The main Antigravity session acts as `ba-lead` and never does the work itself. The delegation rule sits in
the worktree's `AGENTS.md` between `<!-- bakit:orchestrate:start -->` and `<!-- bakit:orchestrate:end -->`
because Antigravity always reads `AGENTS.md` while rule files load unreliably; anything outside the markers
is yours and is kept on update and removal.

| Wave | Agent(s) | Output under `docs/BA/competitor/<app-slug>/` |
| :--- | :--- | :--- |
| A. Code (parallel, needs a decoded APK) | 2-3 × `code-scout` in one `invoke_subagent` call | `code-index/` (`apk_index.py build` + per-flow notes) |
| B. Plan | `ba-lead` | `exploration-plan.md` (entry deep link / activity, expected screens, checklist) |
| C. Device (one flow at a time) | `competitor-analyst` WALK | `screens/`, `<slug>_flow-<flow>_…md` |
| D. Write | `competitor-analyst` SYNTHESIZE | profile (with tech + code-only features), screens, comparison |
| E. Verify | `evidence-verifier` | `<verdict>`; defects go back to their owner |

Decode the APK first in BA Space (Competitor → Decode, ReaKit jadx). Copying a benchmark command also syncs
the project config, whose Competitor Apps table carries the jadx path in its **Decoded source** column; the
command itself stays `/ba-competitor <package> <flows>` because Antigravity drops a quoted path from
slash-command input. If no index exists yet, one scout builds it alone before the parallel scouts start.

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

## Provenance

- `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`,
  `mermaidjs-v11`, `problem-solving`, `sequential-thinking`, and the markdown formatting rule come from
  `D:\Quest\BA_Flow\.agents`. They were adapted for Antigravity: no Claude-Code-only tools
  (`AskUserQuestion`, `$ARGUMENTS`), a project-type step instead of the missing `detect-project-type.sh`,
  and template paths pointing at `ba-templates`.
- `mobilerun` skill: copied from `D:\Quest\mobilerun-mcp\.agents\skills\mobilerun`.
- Templates in `ba-templates/templates/` were rewritten with bilingual headings from the BA_Flow `specs` /
  `test-cases` templates, plus new competitor-analysis templates.
- Not included from BA_Flow: `ba-architect`, `ba-auditor`, `ba-challenger`, `Document-skills`,
  `global-impact-analyzer`, `requirement-analysis`, `rules/business_rules.md`, `rules/collaboration_rules.md`
  (tied to one client project and its data), the `qc-*` skills (QC-team duplicates of the BA audits), and
  `docx` / `pdf` (Anthropic-licensed, not redistributable).
