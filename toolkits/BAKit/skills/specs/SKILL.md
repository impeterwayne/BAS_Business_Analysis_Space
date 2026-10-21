---
name: specs
description: "Create, analyze and maintain the Software Requirements Specification (SRS) for the app: supports Single-File Mobile SRS mode (docs/ba/srs/{app}_srs_v{N}.md with all Use Cases and Mermaid diagrams inline, ready for srs-export to Word .docx) as well as Modular Living SRS mode (docs/project-srs.md + docs/usecases/ + docs/diagrams/). Built from the Feature Checklist, APK evidence, Figma/Design images and confirmed Product Decisions. Operations: init, analyze 'feature', update."
argument-hint: "init|analyze 'description'|update"
---

# Business Analysis — SRS Specifications

Create and maintain the **Software Requirements Specification (SRS)** and its use cases. The default process
is evidence-first:

**Feature Checklist + APK evidence + Design / Figma analysis + confirmed Product Decisions → SRS + Use Cases + Diagrams (→ Quick Audit → Word `.docx` via `srs-export`)**

A codebase is optional corroboration, never a prerequisite. `ba-spec-writer` owns requirement analysis and
integration; this skill routes the work, fixes the structure and manages the resulting files.

**Documentation only. Do not implement code.**

## Output Modes (Single-File Mobile SRS vs Modular SRS)

1. **Single-File Mobile SRS Mode (Default for Mobile Apps & Word `.docx` Handoff):**
   - Writes **one self-contained Vietnamese Markdown file**: `docs/ba/srs/{app}_srs_v{N}.md` (using `references/templates/srs-template.md` and `references/templates/use-case-template.md`).
   - All Use Cases are written **in full** inside Section 6 (no separate `docs/usecases/` files needed), and all Mermaid diagrams are written **inline** inside the SRS with `<a id="..."></a>` anchors (`<a id="uc-..."></a>`, `<a id="uf-..."></a>`, `<a id="act-..."></a>`) so `srs-export` converts them directly into native Word bookmarks and embedded diagram images in `docs/ba/srs-word/{app}_srs_v{N}.docx`.
   - Versioning: never overwrite an existing `v{N}` file; write `v{N+1}` when updating.
2. **Modular Living SRS Mode (When `docs/project-srs.md` exists or requested for multi-module Web/Enterprise projects):**
   - Master SRS at `docs/project-srs.md` (template `.agents/skills/ba-templates/templates/srs.md`), per-UC files in `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` (`.agents/skills/ba-templates/templates/use-case.md`), and diagram files in `docs/diagrams/{module}/{diagram-id}.md`.

## Default (No Arguments)

If invoked without an operation, list the operations below and ask the user in chat to pick one:

| Operation | Description |
| :--- | :--- |
| `init` | Create the SRS (`docs/ba/srs/{app}_srs_v1.md` or `docs/project-srs.md`) with full Use Cases and diagrams |
| `analyze` | Specify one feature, or add/revise its Use Cases and diagrams in the SRS |
| `update` | Reconcile the SRS with confirmed requirement or design changes (`v{N+1}`) |

## Subcommands

| Subcommand | Reference | Purpose |
| :--- | :--- | :--- |
| `/specs init` | `references/init-workflow.md` | Create the initial SRS + full Use Cases + required diagrams |
| `/specs analyze "feature"` | `references/analyze-workflow.md` | Analyze one feature and add/update its FRs, Use Cases and diagrams |
| `/specs update` | `references/update-workflow.md` | Apply confirmed changes while preserving unaffected requirements |

## Routing

Read the first word of the user's input after the command:

- `init` → load `references/init-workflow.md`
- `analyze` → load `references/analyze-workflow.md`, pass the remaining text as the feature description
- `update` → load `references/update-workflow.md`
- empty/unclear → ask the user to choose an operation

## Project Type Resolution

1. Read `Project type` from `.agents/config/ba-project-config.md` (or `.agents/config/project-config.md`). Default is `mobile`.
2. Otherwise infer it from repository markers (`AndroidManifest.xml`, `build.gradle(.kts)`, `pubspec.yaml`, `ios/` → `mobile`; `package.json` UI + server → `fullstack-web`; UI only → `web-frontend`; server only → `api-backend`).

## Shared Context

### Accepted Inputs (use what exists, log what is missing)

| Input | Location | Role | Limitation |
| :--- | :--- | :--- | :--- |
| Product Decision Summary / Rule Confirmation Table | `docs/BA/decisions/{feature-slug}_decisions_*.md` or `docs/ba/product-decisions/{app}_rule-confirmation_v{N}.md` (`PD-{NNN}`) | Confirmed `KEEP / MODIFY / REMOVE / NEW` target behavior; verdict `READY FOR SRS` / `NOT READY FOR SRS` | `TBD` items stay open |
| Feature brief | `docs/BA/briefs/` (`brainstorm-features`) | The chosen approach and its agreed edge cases | Options not chosen are not requirements |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` or `docs/ba/feature-checklist/{app}_feature-checklist_v{N}.md` | Scope inventory: feature groups, features, sub-features, PO notes | Not a detailed specification |
| APK evidence | `docs/BA/competitor/{app-slug}/` or `docs/inputs/apk/` — `*_profile*`, `*_screens*`, `*_flow-*` | Reference-app behavior graded observed / `[Code]` / `[Inferred]` | Reference only, never target approval |
| Comparison / gap report | `docs/BA/competitor/{topic}_comparison_*.md` (`GAP-*`, `FR-CAND-*`) | Candidate requirements | Promoted only when confirmed |
| Figma analysis / Design images | `docs/BA/figma/{feature}/` (`*_figma_*.md`, `screens/*.png`) or `docs/inputs/design/` | Target screens, components, visible states, navigation, copy | A mockup does not define hidden business logic |
| PRD / research / approved requirements | `docs/BA/research/` or `docs/inputs/research/` | Goals, constraints, supplementary evidence | Recommendations are not approvals |
| Existing SRS | `docs/ba/srs/{app}_srs_v{N}.md` or `docs/project-srs.md` | Approved rules and change impact | Preserve unaffected content |

Candidates (`FR-CAND-*`, `FR-DSN-*`, `BR-CAND-*`) are promoted into `FR-*` / `BR-*` only when a Product
Decision, the brief, or the user confirms them. Keep the candidate ID in the `Nguồn (Source)` column.

### Templates

| Mode | Template Path | Use |
| :--- | :--- | :--- |
| **Single-File Mobile SRS** | `references/templates/srs-template.md` | Single-file SRS (`docs/ba/srs/{app}_srs_v{N}.md`) |
| **Single-File Mobile UC** | `references/templates/use-case-template.md` | Structure for each Use Case inside Section 6 of the single-file SRS |
| **Modular Master SRS** | `.agents/skills/ba-templates/templates/srs.md` | Master SRS (`docs/project-srs.md`) |
| **Modular Use Case** | `.agents/skills/ba-templates/templates/use-case.md` | Standalone Use Case (`docs/usecases/{module}/...`) |
| **Legacy FSD** | `.agents/skills/ba-templates/templates/fsd.md` | Legacy only (`docs/project-fsd.md`) |

### Writing Quality for Use Cases

Apply `.agents/skills/use-case-writer/SKILL.md` whenever writing or updating Use Cases:
- Scope Use Cases with `use-case-writer/references/scoping-rules.md` (1 user — 1 goal — 1 session; coffee-break test).
- Follow `use-case-writer/references/writing-style.md` (Vietnamese prose, English UI/screen/feature terms without parenthesized Vietnamese translations, active voice, 1 action per step, no `if/else` in Main Flow).
- Run the 16-item self-check (`use-case-writer/references/self-check.md`, `K1–K16`) before saving.

## Requirements & Source-of-Truth Rules

For target requirements, the order of authority is:

1. **Confirmed Product Decisions** (`PD-*`), the approved brief and explicit user decisions.
2. **Approved Design / Figma** — only for UI the design visibly defines; never infer hidden business logic from appearance.
3. **APK evidence** — reference only: use observed / `[Code]` / `[Inferred]` facts to understand the reference
   app and to ask questions; do not silently inherit its values, limits, validations, permissions, monetization
   or implementation details. Never promote `[Inferred]` into a requirement.
4. **Feature Checklist** — scope and high-level description, not a complete specification.
5. **Research** — supplementary; a recommendation is not an approval.

## Use Case Contract

Every Use Case (whether inline in Section 6 of `docs/ba/srs/{app}_srs_v{N}.md` or in `docs/usecases/`) includes:

1. Overview: actor, goal, trigger / entry point, preconditions, postconditions, related FRs and screens.
2. **UI Specification inside the Use Case, BEFORE Main Flow**, with the **Design image block placed at the very top of each screen subsection** (`![{Screen ID} — {Screen name}](<relative-path>.png)`) — never a plain backticked path without preview — followed by the UI component table (`UI ID | Thành phần | Nội dung hiển thị | Thao tác & Phản hồi của App | Trạng thái / Kiểm tra dữ liệu`). If no design image exists yet, write `Chưa có thiết kế (Design Pending)` and open a `Q-{NNN}`.
3. Main Flow as `Bước | Hành động của User | Phản hồi của App | Màn hình / Trạng thái`.
4. Alternative Flows (`AF-01`); Exception / Error / Edge Cases (`EF-01`).
5. Business Rules (`BR-{NNN}`), Navigation / Result, Acceptance Criteria (`AC-01`), Related Diagrams (`#uf-...`, `#act-...`), Open Questions (`Q-{NNN}`) and Evidence references.

Group use cases by **user goal**, not one per screen.

## Diagram Policy — Hybrid Coverage, Simple & Split for Easy Viewing

- **Keep every diagram simple and split into multiple small diagrams:**
  - Each `mermaid` block MUST stay small and readable: **at most 8–12 nodes**, **at most 2–3 branches** per decision node, and concise labels (**3–6 words**).
  - Flowcharts are vertical: `flowchart TD`, never `LR` (`ba-markdown-formatting` §5).
- **User Flow (`UF-{MOD}-{NNN}`) — REQUIRED:** covers the main in-scope journeys: entry points, user actions, screens, navigation and exits (placed in Section 5 of the single-file SRS with `<a id="uf-..."></a>`).
- **Activity Diagram (`ACT-{MOD}-{NNN}`) — REQUIRED for large/complex features:** required when a feature has **3+ screens**, **multiple conditional branches**, or **payment / IAP / permission** logic; optional for simple 1–2 screen linear features. Separate the happy path from complex exception/retry sub-flows into distinct small `mermaid` blocks when combined nodes exceed 10–12.
- **Sequence Diagram (`SEQ-{MOD}-{NNN}`) — CONDITIONAL:** only for complex ordered interactions among app, backend, SDK or third parties (≤ 4 participants, ≤ 10–12 messages).

## Quality Gate, Audit & Word Export Handoff

Before finishing the SRS:

1. Run the 16-item Use Case self-check (`use-case-writer/references/self-check.md`, `K1–K16`).
2. Verify every in-scope checklist feature maps to an FR / Use Case, every supplied design image is embedded with `![...](...)`, confirmed `PD-*` decisions are reflected, and no `P0` is silently closed.
3. In Single-File Mobile SRS mode, run `BA-audit-SRS` (Quick Mode) to verify handoff blockers, and when `Ready` or `Conditionally Ready`, run `srs-export` (`python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/{app}_srs_v{N}.md`) to generate the Word file `docs/ba/srs-word/{app}_srs_v{N}.docx` for testers.
