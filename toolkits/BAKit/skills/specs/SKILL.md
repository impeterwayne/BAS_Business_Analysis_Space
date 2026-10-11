---
name: specs
description: "Create, analyze and maintain the Software Requirements Specification (SRS): use cases with embedded UI specifications, business rules, and editable User Flow / Activity / Sequence diagrams, built from the feature checklist, competitor APK evidence, Figma analysis and confirmed product decisions. Legacy FSD kept on request. Operations: init, analyze 'feature', update."
argument-hint: "init|analyze 'description'|update"
---

# Business Analysis — SRS Specifications

Create and maintain the **Software Requirements Specification (SRS)** and its use cases. The default process
is evidence-first:

**Feature Checklist + APK evidence + Figma analysis + confirmed Product Decisions → SRS + Use Cases + Diagrams**

A codebase is optional corroboration, never a prerequisite. `ba-spec-writer` owns requirement analysis and
integration; this skill routes the work, fixes the structure and manages the resulting files.

**Documentation only. Do not implement code.**

## Default (No Arguments)

If invoked without an operation, list the operations below and ask the user in chat to pick one:

| Operation | Description |
| :--- | :--- |
| `init` | Create the SRS with its linked use cases and required diagrams |
| `analyze` | Specify one feature, or revise its use cases and diagrams |
| `update` | Reconcile the SRS with confirmed requirement or design changes |

## Subcommands

| Subcommand | Reference | Purpose |
| :--- | :--- | :--- |
| `/specs init` | `references/init-workflow.md` | Create the initial SRS + mapped use cases + required diagrams |
| `/specs analyze "feature"` | `references/analyze-workflow.md` | Analyze one feature and add/update its FRs, use cases and diagrams |
| `/specs update` | `references/update-workflow.md` | Apply confirmed changes while preserving unaffected requirements |

## Routing

Read the first word of the user's input after the command:

- `init` → load `references/init-workflow.md`
- `analyze` → load `references/analyze-workflow.md`, pass the remaining text as the feature description
- `update` → load `references/update-workflow.md`
- empty/unclear → ask the user to choose an operation

## Project Type Resolution

1. Read `Project type` from `.agents/config/ba-project-config.md`. If it is set, use it.
2. Otherwise infer it from repository markers:

| Marker | Type |
| :--- | :--- |
| `AndroidManifest.xml`, `build.gradle(.kts)` with an Android plugin, `pubspec.yaml`, `ios/` + `*.xcodeproj` | `mobile` |
| `package.json` with a UI framework (react, vue, angular, svelte, next) and a server (express, nest, next API routes) | `fullstack-web` |
| `package.json` with a UI framework only | `web-frontend` |
| Server code only (express, nest, fastapi, django, spring, go `net/http`) | `api-backend` |

3. If nothing matches (for example a documents-only BA workspace), ask the user and suggest saving
   the answer in `ba-project-config.md`.

The project type only filters the `<!-- SECTION: ... -->` blocks of the `srs`, `use-case` and `fsd` templates
(keep the matching blocks, delete the markers): for example `api-backend` drops the use case UI Specification and
keeps the SRS API Contracts. It never makes a codebase a requirement source, and a missing codebase never blocks the
workflow.

## Shared Context

### Accepted Inputs (use what exists, log what is missing)

| Input | BAKit location | Role | Limitation |
| :--- | :--- | :--- | :--- |
| Product Decision Summary | `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` (`product-decision`, IDs `PD-{NNN}`) | Confirmed `KEEP / MODIFY / REMOVE / NEW` target behavior; verdict `READY FOR SRS` / `NOT READY FOR SRS` | `TBD` items stay open |
| Feature brief | `docs/BA/briefs/` (`brainstorm-features`) | The chosen approach and its agreed edge cases | Options not chosen are not requirements |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` | Scope inventory: feature groups, features, sub-features, PO notes | Not a detailed specification |
| APK evidence | `docs/BA/competitor/{app-slug}/` — `*_profile_*`, `*_screens_*`, `*_flow-{flow}_*`, screenshots in `screens/` | Reference-app behavior graded observed / `[Code]` / `[Inferred]` | Reference only, never target approval |
| Comparison / gap report | `docs/BA/competitor/{topic}_comparison_*.md` (`GAP-*`, `FR-CAND-*`) | Candidate requirements | Promoted only when confirmed |
| Figma design analysis | `docs/BA/figma/{feature}/{feature}_figma_*.md`, images in `screens/` (`FR-DSN-*`, `BR-CAND-*`) | Target screens, components, visible states, navigation, copy | A mockup does not define hidden business logic |
| PRD / research / approved requirements | `docs/project-overview-pdr.md`, `docs/BA/research/`, `docs/BA/*_extracted_*` | Goals, constraints, supplementary evidence | Recommendations are not approvals |
| Existing SRS / use cases / diagrams | `docs/project-srs.md`, `docs/usecases/`, `docs/diagrams/` | Approved rules and change impact | Preserve unaffected content |
| Codebase | the repository, if any | Optional corroboration | Never a prerequisite, never an automatic product decision |

Candidates (`FR-CAND-*`, `FR-DSN-*`, `BR-CAND-*`) are promoted into `FR-*` / `BR-*` only when a Product
Decision, the brief, or the user confirms them. Keep the candidate ID in the `Nguồn (Source)` column.

### Templates (only in the `ba-templates` catalog)

| Key | Path | Use |
| :--- | :--- | :--- |
| `srs` | `.agents/skills/ba-templates/templates/srs.md` | Master SRS — default deliverable |
| `use-case` | `.agents/skills/ba-templates/templates/use-case.md` | Every use case, SRS or legacy FSD |
| `fsd` | `.agents/skills/ba-templates/templates/fsd.md` | **Legacy only** (see below) |

Do not keep template copies inside this skill.

### Agents & Supporting Skills

- Author: `ba-spec-writer`. When this skill runs outside it (for example in `ba-lead`), dispatch
  `ba-spec-writer` with `invoke_subagent`; when it already runs inside `ba-spec-writer`, do the work directly.
- Unresolved product decisions: the `product-decision` skill, run by `ba-brainstormer`.
- Diagrams: `mermaidjs-v11`. Audit: `BA-audit-SRS` (then `BA-audit-QnA`).

### Default Outputs

| Artifact | Path |
| :--- | :--- |
| Master SRS (living) | `docs/project-srs.md` |
| Use cases (living) | `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` |
| Editable diagram sources (living) | `docs/diagrams/{module}/{diagram-id}.md` (one diagram per file) |
| Screenshots / Figma images | The actual supplied paths only (`docs/BA/figma/{feature}/screens/…`, `docs/BA/competitor/{app-slug}/screens/…`); otherwise the Figma node link or `Design Pending` |

- IDs: `FR-{MOD}-{NNN}`, `UC-{MOD}-{NNN}`, `BR-{NNN}`, `UF-{MOD}-{NNN}` (User Flow), `ACT-{MOD}-{NNN}`
  (Activity), conditional `SEQ-{MOD}-{NNN}` (Sequence). Keep IDs stable across updates.
- A diagram file is named by its ID in lowercase, e.g. `docs/diagrams/img/uf-img-001.md`. It starts with the header table (title, diagram ID, type, module, created, last updated,
  author/agent, version), then one fenced `mermaid` block, then a `Use case liên quan (Covered use cases)` list.
- Living documents are updated in place: bump the header version and add a Change Log row.
- The master SRS links the use case and diagram files; it does not duplicate full use cases. When the user
  asks for a **single handoff document**, assemble one consolidated SRS that inlines the relevant use cases and
  diagrams without losing source links or traceability IDs.

## Requirements & Source-of-Truth Rules

For target requirements, the order of authority is:

1. **Confirmed Product Decisions** (`PD-*`), the approved brief and explicit user decisions.
2. **Approved Figma** — only for UI the design visibly defines; never infer hidden business logic from appearance.
3. **APK evidence** — reference only: use observed / `[Code]` / `[Inferred]` facts to understand the reference
   app and to ask questions; do not silently inherit its values, limits, validations, permissions, monetization
   or implementation details. Never promote `[Inferred]` into a requirement.
4. **Feature Checklist** — scope and high-level description, not a complete specification.
5. **Research** — supplementary; a recommendation is not an approval.

- A `KEEP` decision covers only the behavior it names, not every incidental detail of the reference app.
- A confirmed `REMOVE` is out of scope: never write it as a functional requirement.
- An unresolved conflict or `TBD` becomes an **Open Question** with `P0/P1/P2` impact; route product decisions
  to `product-decision` (`ba-brainstormer`).
- Never fabricate API endpoints, defaults, error handling, estimates, Figma links, screenshots, SDKs or decisions.

## Use Case Contract

Every use case follows `ba-templates/templates/use-case.md`:

1. Overview: actor, trigger / entry point, preconditions, postconditions, related FRs and screens.
2. **UI Specification inside the use case, before Main Flow**, with the authentic Figma frame link and/or
   reference image for each screen; one use case may document several screens.
3. Main Flow as `User Action → System Response → Screen / State`.
4. Alternative Flows; Exception / Error / Edge Cases.
5. Business Rules, Navigation / Result, Acceptance Criteria, Related Diagrams, Open Questions (`P0/P1/P2`) and
   evidence links.

Group use cases by **user goal**, not one per screen. Update an existing use case when it covers the same goal.

## Diagram Policy — Hybrid Coverage

- **User Flow — REQUIRED:** covers the main in-scope journeys: entry points, user actions, screens, navigation
  and exits, usually one per feature group. Every affected use case references the shared User Flow.
- **Activity Diagram — REQUIRED:** covers core business processes: validations, decisions, state changes,
  success / failure, cancel and retry. A shared Activity Diagram may cover several simple related use cases;
  independently complex logic gets its own. Do not create redundant diagrams.
- **Sequence Diagram — CONDITIONAL:** only for complex ordered interactions among app, backend, SDK or third
  parties, or asynchronous processing, where it clarifies a genuine requirement. Do not invent participants or
  architecture; if they are unknown and essential, raise an Open Question instead.
- A User Flow and an Activity Diagram are **not interchangeable**, even though both use Mermaid `flowchart`.
- Flowcharts are vertical: `flowchart TD`, never `LR` (`ba-markdown-formatting` §5).
- Every applicable use case references its covering diagram(s) in `Sơ đồ liên quan (Related Diagrams)`.

## Optional Sections

- **Permissions:** only when applicable and supported by a decision, the design or the brief. Do not copy the
  reference app's permission handling.
- **Ads / IAP:** only when adopted in target scope by a confirmed decision. Otherwise omit the section (say why
  in one line). Never infer monetization from the reference app; if the reference monetizes and adoption is
  unclear, raise an Open Question.
- **NFRs / dependencies:** only confirmed or evidenced details; never invent numeric targets.

## Legacy FSD

The FSD (`fsd` template, `docs/project-fsd.md`) is kept for backward compatibility. Use it only when the user
asks for an FSD, or when `docs/project-fsd.md` already exists and the user wants to keep it. If an FSD exists and
no SRS does, ask whether to keep the FSD or start an SRS. Legacy mode follows the same source-of-truth rules and
the same `use-case` template; it does not revert to codebase-first analysis.

## Quality Gate / Audit Handoff

Before marking the SRS `Ready for SRS Audit`, verify:

- Every confirmed in-scope checklist feature maps to an FR / use case or a documented shared rule.
- Relevant Figma screens and component states map to use cases.
- Confirmed Product Decisions are reflected; removed behaviors are excluded.
- Main / alternative / exception flows, business rules, persistence and navigation are coherent.
- Main journeys have User Flows; core business processes have Activity Diagrams.
- Sequence Diagrams exist only where warranted and use verified participants.
- Open Questions are explicit and no blocking `P0` remains unresolved.
- Cross-file links, IDs and Change Log rows are consistent; Markdown passes `ba-markdown-formatting`.

Then hand off to `BA-audit-SRS` (`/ba-review`) — only when the user asks. **Ready for audit is not approved
for development.**

## Important

- Preserve existing `docs/` artifacts and unrelated user edits on updates.
- Deliverables are Vietnamese with English terminology (`ba-global-rules`); on-screen labels and messages stay
  in their original language with English in parentheses.
- Do not create missing evidence or claim to have read files that were not supplied.
- **Do not** start implementing code. This skill produces documentation only.
