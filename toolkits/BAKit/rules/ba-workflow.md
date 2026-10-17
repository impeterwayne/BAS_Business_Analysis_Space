---
trigger: always_on
---

# BA Workflow

How the BAKit agents and skills chain from an idea (or a competitor app) to a
QA handoff. Adapted from the BA_Flow 4-phase workflow, with competitor and design (Figma) discovery in front.

The workflow is **evidence-led and decision-aware**: reference-app evidence, a Feature Checklist, the target
Figma design and confirmed Product Decisions become an **SRS** (use cases with embedded UI specifications,
business rules, diagrams) that passes an audit before Dev/QA handoff. It works for a new app with no codebase.
Behaviour seen in a reference app is never a target requirement until a decision says so.

## Toolchain

| Phase | Lead agent | Skills |
| :--- | :--- | :--- |
| 0. Competitor discovery (optional) | `ba-lead` → `code-scout`, `competitor-analyst`, `evidence-verifier` | `apk-code-index`, `competitor-app-analysis`, `mobilerun`, `ba-templates`, `apk-feature-extractor` |
| 0. Design discovery (optional) | `ba-lead` → `ba-figma` | `figma-ba-analysis`, `ba-templates` (`figma-analysis`) |
| 1. Research & problem breakdown | `ba-researcher` | `problem-solving`, `sequential-thinking`, `document-extraction` |
| 2. Product decisions & ideation (conditional) | `ba-brainstormer` | `product-decision`, `brainstorm-features`, `ba-templates` (`product-decision`, `feature-brief`) |
| 3. SRS specification & modeling | `ba-spec-writer` | `specs`, `use-case-writer`, `user-story-ac-writer`, `minipower`, `mermaidjs-v11`, `drawio-ai-kit`, `bpmn-generator`, `ba-templates` (`srs`, `use-case`) |
| 4. SRS audit & Dev/QA handoff | `ba-spec-writer` | `BA-audit-SRS`, `BA-audit-QnA`, `global-impact-analyzer`, `global-executor`, `ba-consistency-inspector`, `test-cases`, `qc-*` suite |

`ba-lead` routes a request to the right phase and keeps the decision trail between phases.

## Phases

### Phase 0 — Competitor discovery

Use when the request involves another app ("how does X do it", "benchmark", "survey the competitor").
Operates in two branches depending on device availability or user flags (`/ba-competitor`):

1. **Branch 1: Hybrid Mode (Code + Device Walk via `mobilerun`)**
   When a device is connected: `code-scout` agents index and inspect the decoded code in parallel first, and `ba-lead` turns their notes into an exploration plan. Then `competitor-analyst` drives the app on the connected device with the `mobilerun` MCP server, capturing screenshots and UI trees. Deliverables are synthesized and checked by `evidence-verifier`.

2. **Branch 2: Static Mode (Code-Only without `mobilerun`)**
   Triggered via `--code-only`, `--no-device`, or when no device is connected: `code-scout` agents extract screen maps, layouts, field validation rules, error strings (`strings.xml`), and API contracts directly from decoded source (`jadx_src`). `competitor-analyst` synthesizes full BA docs (screen inventory, flow analysis with Mermaid diagrams, profile, and comparison) using `[Code]` (cites `file:line`) and `[Inferred]` evidence grades. Zero device interaction or `mobilerun` required.

When decoded APK evidence documents (`profile`, `screens`, `flow` docs) are available, `apk-feature-extractor` normalizes them into the company's structured **Feature Checklist** (`{app-slug}_checklist_{YYYYMMDD}_v1.md`, `/ba-checklist`), mapping reference feature groups and sub-features without guessing estimates or priorities.

When our product reference is available, both branches produce the comparison / gap report; its `GAP-*` and `FR-CAND-*` items become inputs to Phase 2.

Keep the detailed evidence (`screens`, `flow-*`) as a separate Phase 3 input: the checklist is a high-level
inventory, not a substitute for the flows. Never promote an `[Inferred]` item to a confirmed target rule.

### Phase 0 — Design discovery

Use when a Figma design exists for the feature (a figma.com link, "write the SRS from the design").
`ba-figma` reads the design through the `figma-mcp-android` MCP server (Figma Desktop plugin bridge) and
writes a design analysis under `docs/BA/figma/<feature>/`: screens with reference images, flow, fields and
visible validation, designed and missing states, copy, data, annotations, `FR-DSN-*` / `BR-CAND-*` candidates
and open questions. When the design already reflects an agreed scope, the user may take it straight to
Phase 3 (`/ba-figma … then spec`); otherwise its candidates and questions feed Phase 2.

### Phase 1 — Research & discovery (conditional)

For complex, new or tangled requests, do not analyse immediately.
- `problem-solving` breaks a large problem into manageable parts.
- `sequential-thinking` checks feasibility step by step and surfaces contradictions in the request.
- `document-extraction` turns URLs (Confluence, Jira, Google Docs) into Markdown sources.

Skip when a current Feature Checklist and enough supporting evidence already exist; do not regenerate them.

### Phase 2 — Product decisions & ideation (conditional)

`ba-brainstormer` picks the skill from the inputs:

- **Reference evidence exists** (competitor docs, checklist, Figma analysis) → `product-decision`. It compares
  checklist, Figma, APK evidence, approved requirements and PO notes; turns each real conflict or gap into a
  decision point with priority **P0** (blocking) / **P1** (important) / **P2** (optional); asks focused
  questions, offering options only when there are genuine alternatives; and records each answer as `KEEP`,
  `MODIFY`, `REMOVE`, `NEW` or `TBD` (unresolved, never a licence to invent). Output: a Product Decision
  Summary in `docs/BA/decisions/` with verdict **READY FOR SRS** or **NOT READY FOR SRS**.
- **A new idea with no reference** → `brainstorm-features`: Socratic questions, 2–3 approaches with
  trade-offs, the chosen one recorded in a `feature-brief` under `docs/BA/briefs/`.

Skip when scope, Figma and already-confirmed decisions are clear enough to specify (`product-decision` then
answers `Brainstorm not required — requirement sufficiently defined.`). Never re-confirm an approved decision
without a material new conflict.

### Phase 3 — SRS specification & modeling

Starts from a READY FOR SRS summary, an approved feature brief, or an explicit user decision.

1. `specs` (`/ba-spec init | analyze | update`) writes the living SRS `docs/project-srs.md` and its use cases.
   The legacy FSD (`docs/project-fsd.md`) is kept only where a project already uses it.
2. Target scope comes from the checklist and the Product Decisions: in scope, out of scope, unresolved.
3. `screens` / `flow-*` evidence supplies reference navigation, validations, states, limits and errors; adopt
   only what a decision confirms. Figma supplies the target screens, components and visible states; it never
   supplies hidden business rules or frames that do not exist.
4. Requirements are organised by **use case** (user goal), not one use case per screen. Each use case
   embeds its **UI Specification with Figma / screenshot references before the flows**, then main,
   alternative and exception flows, business rules, navigation, diagram references and open questions.
5. **Hybrid diagram policy** (`mermaidjs-v11`):
   - **User Flow — required**: main journeys and screen navigation, usually per feature group.
   - **Activity Diagram — required**: core business processes, decisions, validations, success/failure paths.
     One diagram may serve several simple use cases; independently complex logic gets its own.
   - **Sequence Diagram — conditional**: only for complex or asynchronous app / backend / SDK / third-party
     interactions.
   - A User Flow and an Activity Diagram are not interchangeable, even though both are Mermaid flowcharts.
     Every use case references the diagrams that cover it; no diagrams made only to fill a quota.
6. Permissions, Ads / IAP, NFRs and dependencies are written only when applicable and supported. Reference
   monetization is never inferred as target monetization.
7. Traceability Feature → FR → UC → screen / rule / diagram is maintained; missing facts become open
   questions, and a P0 is never marked resolved without a decision.
8. `ba-templates` writes any other deliverable (user stories, etc.).

### Phase 4 — SRS audit & Dev/QA handoff

1. After producing or materially updating the SRS, `BA-audit-SRS` audits the SRS **together with** its
   inputs (checklist, Figma, Product Decisions, APK evidence, use cases, diagrams) for coverage,
   consistency, testability and traceability, and auto-chains `BA-audit-QnA` to open a question backlog.
2. A simple use case does not fail for lacking a Sequence Diagram; absent Ads / IAP requirements are not a
   defect.
3. Unresolved product choices go back to Phase 2, affected requirements back to Phase 3.
4. **Ready for Dev/QA Handoff** only after the audit passes with no blocking P0 left.
5. `test-cases` is optional and downstream: test cases / acceptance criteria from the approved use cases,
   exported as CSV/JSON.

## Source of truth

1. **Confirmed Product Decisions and approved PO requirements** define target behaviour.
2. **Approved Figma** defines the target UI where it is visibly specified, not invisible validations or
   backend logic.
3. **APK evidence** explains reference behaviour and never silently overrides a decision. `[Inferred]`
   stays an inference.
4. **The Feature Checklist** defines scope and high-level descriptions, not every business rule.
5. **Research** offers evidence and options; it is not a decision by itself.
6. When sources conflict or an essential behaviour is undecided, record the conflict and route the question;
   never invent a value to close the document.
7. `/ba-spec update` preserves approved requirements and unaffected artifacts, and updates linked use cases,
   UI specifications, diagrams and references together.

## Hard constraints

1. **Conditional, not skipped silently.** Phases 1 and 2 run only when their trigger holds; when one is
   skipped, say why. SRS authoring (Phase 3) and the SRS audit (Phase 4) are never skipped for an SRS
   handoff. Phase 0 may run first or feed Phase 2 at any time.
2. **Continuous context.** Each phase reads the previous phase's output files and decision records
   (confirmed decisions, evidence, open questions, source references); it never redoes them.
3. **No reference-to-target assumption.** Never copy features, defaults, limits, navigation, ads, paywalls or
   implementation internals only because the reference app has them.
4. **No fabricated requirements.** No invented UI states, error handling, API contracts, numeric NFRs, effort
   estimates or Ads / IAP rules.
5. **Audit before handoff.** No Dev/QA readiness claim without `BA-audit-SRS`. Test cases are optional.
6. **User controls transitions.** Do not auto-advance between phases; confirm with the user.
