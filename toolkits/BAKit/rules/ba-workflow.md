---
trigger: always_on
---

# BA Workflow

How the BAKit agents and skills chain from an idea (or a competitor app) to a
Word `.docx` and Dev/QA handoff.

The workflow is **evidence-led and decision-aware**: reference-app evidence, a Feature Checklist, the target
Figma / Design images and confirmed Product Decisions become an **SRS** (use cases with embedded UI specifications,
business rules, diagrams) that passes an audit and exports to Word (`.docx`) before Dev/QA handoff. It works for a new app with no codebase.
Behaviour seen in a reference app is never a target requirement until a decision says so.

## Toolchain

| Phase | Lead agent | Skills |
| :--- | :--- | :--- |
| 0. Competitor discovery (optional) | `ba-lead` → `code-scout`, `competitor-analyst`, `evidence-verifier` | `apk-code-index`, `competitor-app-analysis`, `mobilerun`, `ba-templates`, `apk-feature-extractor` |
| 0. Design discovery (optional) | `ba-lead` → `ba-figma` | `figma-ba-analysis`, `ba-templates` (`figma-analysis`) |
| 1. Research & problem breakdown | `ba-researcher` | `problem-solving`, `sequential-thinking`, `document-extraction` |
| 2. Product decisions & ideation (conditional) | `ba-brainstormer` | `product-decision` (Batch Rule Confirmation Table `Bảng xác nhận rule`), `brainstorm-features`, `apk-feature-extractor` (PO research checklist), `ba-templates` (`product-decision`, `feature-brief`) |
| 3. SRS specification & modeling | `ba-spec-writer` | `specs` (Single-File Mobile SRS `docs/ba/srs/{app}_srs_v{N}.md` or Modular SRS `docs/project-srs.md`), `use-case-writer` (scoping + 16-item self-check `K1–K16`), `user-story-ac-writer`, `minipower`, `mermaidjs-v11`, `drawio-ai-kit`, `bpmn-generator`, `ba-templates` (`srs`, `use-case`) |
| 4. SRS audit, Word `.docx` export & QA handoff | `ba-spec-writer` | `BA-audit-SRS` (Quick Mode & Full Mode), `srs-export` (`.md` → `.docx`), `BA-audit-QnA`, `global-impact-analyzer`, `global-executor`, `ba-consistency-inspector`, `test-cases`, `qc-*` suite |

`ba-lead` routes a request to the right phase and keeps the decision trail between phases.

## Phases

### Phase 0 — Competitor discovery

Use when the request involves another app ("how does X do it", "benchmark", "survey the competitor").
Operates in two branches depending on device availability or user flags (`/ba-competitor`):

1. **Branch 1: Hybrid Mode (Code + Device Walk via `mobilerun`)**
   When a device is connected: `code-scout` agents index and inspect the decoded code in parallel first, and `ba-lead` turns their notes into an exploration plan. Then `competitor-analyst` drives the app on the connected device with the `mobilerun` MCP server, capturing screenshots and UI trees. Deliverables are synthesized and checked by `evidence-verifier`.

2. **Branch 2: Static Mode (Code-Only without `mobilerun`)**
   Triggered via `--code-only`, `--no-device`, or when no device is connected: `code-scout` agents extract screen maps, layouts, field validation rules, error strings (`strings.xml`), and API contracts directly from decoded source (`jadx_src`). `competitor-analyst` synthesizes full BA docs (screen inventory, flow analysis with Mermaid diagrams, profile, and comparison) using `[Code]` (cites `file:line`) and `[Inferred]` evidence grades. Zero device interaction or `mobilerun` required.

When decoded APK evidence documents (`profile`, `screens`, `flow` docs) are available, `apk-feature-extractor` (v1.3.0) normalizes them into the company's structured **Feature Checklist** (`docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v1.md` or `docs/ba/feature-checklist/{app}_feature-checklist_v1.md`, `/ba-checklist`), keeping English feature/screen/UI names without parenthesized Vietnamese translations, leaving `Mô tả tính năng` blank for `Onboarding`, and leaving `Link tham khảo` blank.

### Phase 0 — Design discovery

Use when a Figma design exists for the feature (a figma.com link, "write the SRS from the design") or design images are placed in `docs/inputs/design/`.
`ba-figma` reads the design through the `figma-mcp-android` MCP server (Figma Desktop plugin bridge) and
writes a design analysis under `docs/BA/figma/<feature>/`: screens with reference images, flow, fields and
visible validation, designed and missing states, copy, data, annotations, `FR-DSN-*` / `BR-CAND-*` candidates
and open questions.

### Phase 1 — Research & discovery (conditional)

For complex, new or tangled requests, do not analyse immediately.
- `problem-solving` breaks a large problem into manageable parts.
- `sequential-thinking` checks feasibility step by step and surfaces contradictions in the request.
- `document-extraction` turns URLs (Confluence, Jira, Google Docs) into Markdown sources.

Skip when a current Feature Checklist and enough supporting evidence already exist; do not regenerate them.

### Phase 2 — Product decisions & ideation (conditional)

`ba-brainstormer` picks the skill from the inputs:

- **Reference evidence exists** (competitor docs, checklist, Figma analysis / design screenshots) → `product-decision`. It compares
  checklist, Design/Figma, APK evidence, approved requirements and PO notes; surfaces all hidden rules not visible in Design; and presents **one single Batch Rule Confirmation Table ("Bảng xác nhận rule")** (`Mã | Tính năng | Rule cần chốt | Giá trị trong APK | Đề xuất của AI | Ưu tiên | PO chốt`) so the PO can confirm in one pass (`OK` = keep APK value, `A/B/C` = pick AI option, or custom value). Records each answer as `KEEP`,
  `MODIFY`, `REMOVE`, `NEW` or `TBD` in a Product Decision Summary (`docs/BA/decisions/` or `docs/ba/product-decisions/`) with verdict **READY FOR SRS** or **NOT READY FOR SRS**.
- **PO research notes exist without an APK** → `ba-brainstormer` Section 5A builds the 12-column Feature Checklist first, then runs `product-decision`.
- **A new idea with no reference** → `brainstorm-features`: Socratic questions, 2–3 approaches with
  trade-offs, the chosen one recorded in a `feature-brief` under `docs/BA/briefs/`.

Skip when scope, Design/Figma and already-confirmed decisions are clear enough to specify (`product-decision` then
answers `Brainstorm not required — requirement sufficiently defined.`). Never re-confirm an approved decision
without a material new conflict.

### Phase 3 — SRS specification & modeling

Starts from a READY FOR SRS summary, an approved feature brief, or an explicit user decision.

1. `specs` (`/ba-spec init | analyze | update`) writes the SRS:
   - **Single-File Mobile SRS Mode (default for mobile apps & Word `.docx` handoff):** writes one self-contained file `docs/ba/srs/{app}_srs_v{N}.md` with all Use Cases in full inside Section 6 and all Mermaid diagrams inline with `<a id="..."></a>` anchors.
   - **Modular Living SRS Mode:** writes `docs/project-srs.md`, per-UC files in `docs/usecases/{module}/`, and diagram files in `docs/diagrams/{module}/`.
2. Target scope comes from the checklist and the Product Decisions: in scope, out of scope, unresolved.
3. Requirements are organised by **use case** (user goal, scoped via `use-case-writer/references/scoping-rules.md`), not one use case per screen. Each use case
   embeds its **UI Specification before the flows, with the Design image block (`![{Screen ID} — {Screen name}](<relative-path>.png)`) at the top of each screen subsection**, then main,
   alternative and exception flows, business rules, navigation, acceptance criteria, diagram references and open questions.
4. **Hybrid diagram policy — simple & split for easy viewing** (`mermaidjs-v11`):
   - **Keep diagrams simple and cut into multiple smaller diagrams**: each `mermaid` block holds at most 8–12 nodes with short labels (3–6 words), vertical `flowchart TD`.
   - **User Flow (`UF-*`) — required**: main journeys and screen navigation.
   - **Activity Diagram (`ACT-*`) — required for complex features**: required when a feature has 3+ screens, multiple conditional branches, or payment/IAP/permission logic.
   - **Sequence Diagram (`SEQ-*`) — conditional**: only for complex or asynchronous app / backend / SDK / third-party interactions (≤ 4 participants, ≤ 10–12 messages per block).
5. Run the **16-item Use Case self-check (`use-case-writer/references/self-check.md`, `K1–K16`)** before saving.

### Phase 4 — SRS audit, Word `.docx` export & Dev/QA handoff

1. After producing or updating the SRS, `BA-audit-SRS` runs **Quick Mode** by default (checking the 5 handoff gates: Feature Coverage, UI Spec & Design Images, Decision Alignment, Required Diagrams, and Open P0s / `K1–K16`) and saves a concise 1-table report (`docs/ba/audit/{app}_srs-audit_v{N}.md` or `docs/BA/SRS-report/srs/`). Full scored mode (0–100 + `BA-audit-QnA` question backlog) is available on request (`full`).
2. When the audit verdict is **Ready** or **Conditionally Ready** (in Single-File Mobile SRS Mode), `srs-export` converts `docs/ba/srs/{app}_srs_v{N}.md` into a formatted Word document `docs/ba/srs-word/{app}_srs_v{N}.docx` with embedded design images and rendered Mermaid diagrams for testers.
3. **Ready for Dev/QA Handoff** only after the audit passes with no blocking P0 left.
4. `test-cases` is optional and downstream: test cases / acceptance criteria from the approved use cases, exported as CSV/JSON.

## Source of truth

1. **Confirmed Product Decisions and approved PO requirements** define target behaviour.
2. **Approved Design / Figma** defines the target UI where it is visibly specified, not invisible validations or
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
