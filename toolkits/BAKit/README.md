# BAKit — Antigravity BA Toolkit

BA agents, skills, rules, slash workflows and a template catalog for an **Antigravity** workspace, plus
registration of the **mobilerun MCP server** so the agent can drive a competitor app on a connected Android
device and turn what it sees into BA documents.

Deliverables are written in Vietnamese; skill, rule and workflow files are in English.

## What gets deployed

| Toolkit folder | Deployed to | Contents |
| :--- | :--- | :--- |
| `agents/` | `.agents/agents/` | `ba-lead` (router, main agent), `competitor-analyst`, `ba-researcher`, `ba-brainstormer`, `ba-spec-writer` |
| `skills/` | `.agents/skills/` | `ba-templates` (template catalog), `competitor-app-analysis`, `mobilerun`, `specs`, `test-cases`, `BA-audit-SRS`, `BA-audit-QnA`, `brainstorm-features`, `document-extraction`, `mermaidjs-v11`, `problem-solving`, `sequential-thinking` |
| `rules/` | `.agents/rules/` | Always-on: `ba-global-rules`, `ba-workflow`, `ba-naming-convention`, `ba-device-automation`, `ba-markdown-formatting` |
| `workflows/` | `.agents/workflows/` | `/ba-competitor`, `/ba-template`, `/ba-spec`, `/ba-review`, `/ba-testcases`, `/ba-device-check` |
| `config/` | `.agents/config/` | `ba-project-config.md` — created once, never overwritten or removed; fill it in and commit it |
| `mcp/` | Antigravity global MCP config | `mobilerun` server entry (see below) |

## Install

**From BA Space:** Agent Toolkit → **BAKit** group → tick the components (or *Apply All*). Tick
**Mobilerun MCP (Antigravity)** to register the server.

**Without BA Space** (PowerShell):

```powershell
# toolkit files into a workspace, and register mobilerun
.\toolkits\BAKit\scripts\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterMcp

# only (re)register the MCP server, pinning a device when several are attached
.\toolkits\BAKit\scripts\install-bakit.ps1 -McpOnly -Device R58RB1XWAKJ -Force
```

Restart the Antigravity agent after registering the MCP server.

## mobilerun MCP: where it is registered

Antigravity loads MCP servers from **one global file per machine**, not from the workspace:

- `%USERPROFILE%\.gemini\config\mcp_config.json` (current builds)
- `%USERPROFILE%\.gemini\antigravity\mcp_config.json` (older builds, used when the folder above is missing)

BAKit merges a `mobilerun` entry into that file (other servers are kept, a `.bak` copy is written first,
and an existing `mobilerun` entry is left alone). The server is found at
`<mobilerun-mcp>\.venv\Scripts\python.exe`, looked up next to BA Space (`BA_Space\mobilerun-mcp`, symlinks
resolved) and at `D:\Quest\mobilerun-mcp`.

Device prerequisites: `adb` on PATH, USB debugging authorised, and the Mobilerun Portal accessibility
service enabled (`mobilerun setup -d <serial>`). Run `/ba-device-check` in Antigravity to verify.

## Typical flow

1. Fill in `.agents/config/ba-project-config.md` (project type, competitor apps, environments).
2. `/ba-device-check` → `/ba-competitor <app> <flows>` — evidence and competitor docs under
   `docs/BA/competitor/<app-slug>/`.
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
