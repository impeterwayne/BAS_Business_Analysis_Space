---
trigger: always_on
---

# BA Workflow

How the BAKit agents, skills and slash-command workflows chain from an idea (or a competitor app) to a
QA handoff. Adapted from the BA_Flow 4-phase workflow, with competitor and design (Figma) discovery in front.

## Toolchain

| Phase | Lead agent | Skills | Slash command |
| :--- | :--- | :--- | :--- |
| 0. Competitor discovery (optional) | `ba-lead` → `code-scout`, `competitor-analyst`, `evidence-verifier` | `apk-code-index`, `competitor-app-analysis`, `mobilerun`, `ba-templates` | `/ba-competitor` |
| 0. Design discovery (optional) | `ba-lead` → `figma-analyst` | `figma-ba-analysis`, `ba-templates` (`figma-analysis`) | `/ba-figma` |
| 1. Research & problem breakdown | `ba-researcher` | `problem-solving`, `sequential-thinking`, `document-extraction` | — |
| 2. Ideation & trade-offs | `ba-brainstormer` | `brainstorm-features`, `ba-templates` (`feature-brief`) | — |
| 3. Modeling & specification | `ba-spec-writer` | `mermaidjs-v11`, `specs`, `ba-templates` | `/ba-spec`, `/ba-template` |
| 4. Readiness & QA handoff | `ba-spec-writer` | `BA-audit-SRS`, `BA-audit-QnA`, `test-cases` | `/ba-review`, `/ba-testcases` |

`ba-lead` routes a request to the right phase and keeps the decision trail between phases.

## Phases

### Phase 0 — Competitor discovery

Use when the request involves another app ("how does X do it", "benchmark", "survey the competitor").
Operates in two branches depending on device availability or user flags (`/ba-competitor`):

1. **Branch 1: Hybrid Mode (Code + Device Walk via `mobilerun`)**
   When a device is connected: `code-scout` agents index and inspect the decoded code in parallel first, and `ba-lead` turns their notes into an exploration plan. Then `competitor-analyst` drives the app on the connected device with the `mobilerun` MCP server, capturing screenshots and UI trees. Deliverables are synthesized and checked by `evidence-verifier`.

2. **Branch 2: Static Mode (Code-Only without `mobilerun`)**
   Triggered via `--code-only`, `--no-device`, or when no device is connected: `code-scout` agents extract screen maps, layouts, field validation rules, error strings (`strings.xml`), and API contracts directly from decoded source (`jadx_src`). `competitor-analyst` synthesizes full BA docs (screen inventory, flow analysis with Mermaid diagrams, profile, and comparison) using `[Code]` (cites `file:line`) and `[Inferred]` evidence grades. Zero device interaction or `mobilerun` required.

When our product reference is available, both branches produce the comparison / gap report; its `GAP-*` and `FR-CAND-*` items become inputs to Phase 2.

### Phase 0 — Design discovery

Use when a Figma design exists for the feature (a figma.com link, "write the SRS from the design").
`figma-analyst` reads the design through the `figma-mcp-android` MCP server (Figma Desktop plugin bridge) and
writes a design analysis under `docs/BA/figma/<feature>/`: screens with reference images, flow, fields and
visible validation, designed and missing states, copy, data, annotations, `FR-DSN-*` / `BR-CAND-*` candidates
and open questions. When the design already reflects an agreed scope, the user may take it straight to
Phase 3 (`/ba-figma … then spec`); otherwise its candidates and questions feed Phase 2.

### Phase 1 — Research & discovery

For complex, new or tangled requests, do not analyse immediately.
- `problem-solving` breaks a large problem into manageable parts.
- `sequential-thinking` checks feasibility step by step and surfaces contradictions in the request.
- `document-extraction` turns URLs (Confluence, Jira, Google Docs) into Markdown sources.

### Phase 2 — Ideation & trade-off analysis

- `brainstorm-features` asks Socratic questions to surface edge cases and risks, proposes 2–3 approaches
  with trade-offs, and records the chosen one in a `feature-brief`.

### Phase 3 — Modeling & specification

Only after the user has chosen an approach in Phase 2.
- `mermaidjs-v11` is mandatory for the chosen solution: a flowchart for the user journey, and a sequence
  diagram when several systems interact.
- `specs` writes or updates the FSD and use cases (preconditions, main, alternative and exception flows
  carried over from Phase 2).
- `ba-templates` writes any other deliverable (user stories, etc.).

### Phase 4 — Readiness & QA handoff

- `BA-audit-SRS` scores readiness and auto-chains `BA-audit-QnA` to open a question backlog.
- `test-cases` generates test cases / acceptance criteria from the approved use cases and exports CSV/JSON.

## Hard constraints

1. **No skipping.** Go in order: break down (Phase 1) → brainstorm (Phase 2) → specify (Phase 3) → hand off
   (Phase 4). Phase 0 may run first or feed Phase 2 at any time. A small, already-clear request may start at
   Phase 3 only if the user says so.
2. **Continuous context.** Each phase reads the previous phase's output files and decision records; it
   never redoes them.
3. **User controls transitions.** Do not auto-advance between phases; confirm with the user.
