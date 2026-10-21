# Init Workflow — /specs init

Create the initial **SRS, Use Cases with embedded UI Specifications, and editable Mermaid diagrams** from confirmed
target context and the available reference evidence. Supports **Single-File Mobile SRS Mode** (`docs/ba/srs/{app}_srs_v1.md`, default for mobile apps and Word `.docx` handoff) and **Modular Living SRS Mode** (`docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`). A codebase is not required.

## Steps

### 1. Establish Project Context

- Follow **Project Type Resolution** in `specs/SKILL.md` (`mobile` default, or `web-frontend`, `api-backend`, `fullstack-web`).
- Read `.agents/config/ba-project-config.md` (or `.agents/config/project-config.md`) for project name, platform(s) and deliverable language.
- Identify product goal, target users, known feature scope, design status and reference apps.
- Choose output mode:
  - **Single-File Mobile SRS Mode** (default for mobile or when `docs/ba/` is used or Word `.docx` export is needed): `docs/ba/srs/{app}_srs_v1.md` using `references/templates/srs-template.md` and `references/templates/use-case-template.md`.
  - **Modular SRS Mode** (when `docs/project-srs.md` is requested or for multi-module web/enterprise systems): `docs/project-srs.md` + `docs/usecases/{module}/` + `docs/diagrams/{module}/` using `.agents/skills/ba-templates/templates/srs.md` and `use-case.md`.

### 2. Collect Available Sources

Read, when present (paths in `specs/SKILL.md` → Accepted Inputs):

1. Product Decision Summaries / Rule Confirmation Tables in `docs/BA/decisions/` or `docs/ba/product-decisions/`, and feature briefs in `docs/BA/briefs/`.
2. Feature Checklist in `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` or `docs/ba/feature-checklist/{app}_feature-checklist_v{N}.md`.
3. APK evidence: `*_profile*`, `*_screens*` and every relevant `*_flow-*` file in `docs/BA/competitor/{app-slug}/` or `docs/inputs/apk/`, plus comparison reports (`GAP-*`, `FR-CAND-*`).
4. Figma design analyses `docs/BA/figma/{feature}/` (`screens/*.png`) or design images in `docs/inputs/design/`.
5. PRD, extracted requirements, research notes (`docs/BA/research/` or `docs/inputs/research/`).
6. Any existing SRS, use cases or diagrams.

### 3. Check Decision Readiness

- If a decisions file has verdict `NOT READY FOR SRS`, or hidden rules not visible in Design have not been confirmed by the PO yet, **stop and run (or route to) `product-decision`** to present the single **Batch Rule Confirmation Table (`Bảng xác nhận rule`)** first, or ask whether to continue with a partial draft whose status is `Blocked by P0`.
- Classify features as **In Scope**, **Out of Scope** or **TBD** from the confirmed decisions.
- Exclude confirmed `REMOVE` behaviors from functional requirements.
- List conflicts among decisions, design and reference behavior as `P0/P1/P2` Open Questions. Never fill a `TBD` with an assumption.

### 4. Scope & Map Features, Screens & Use Cases

Apply `.agents/skills/use-case-writer/references/scoping-rules.md`:
- Build a feature-to-UC mapping by **user goal** (1 primary user, 1 goal, 1 session; passes the coffee-break test), not one use case per screen.
- Name every Use Case with `Động từ + Đối tượng` (active verb + object).
- Record the target screens and the relevant reference flows for each use case.

### 5. Author the SRS, Use Cases & Diagrams (`ba-spec-writer`)

1. **In Single-File Mobile SRS Mode (`docs/ba/srs/{app}_srs_v1.md`)**:
   - Follow `references/templates/srs-template.md` for the overall document and `references/templates/use-case-template.md` for each Use Case written **in full** inside Section 6.
   - Add `<a id="uc-{mod}-{nnn}"></a>` before each Use Case heading and `<a id="uf-{mod}-{nnn}"></a>` / `<a id="act-{mod}-{nnn}"></a>` before each diagram heading so internal links (`#uc-...`, `#uf-...`) convert into Word bookmarks during `srs-export`.
   - Place the **Design image block (`![{Screen ID} — {Screen name}](<relative-path>.png)`) at the top of each screen subsection** inside UI Specification, before Main Flow.
   - Write User Flow diagrams (`UF-*`) in Section 5 for main journeys, and Activity Diagrams (`ACT-*`) in Section 6 **for large/complex features** (3+ screens, multiple conditional branches, or IAP/Permissions). Keep every `mermaid` block simple (`flowchart TD`, ≤ 8–12 nodes, short labels) and split complex flows into smaller blocks.
2. **In Modular Living SRS Mode (`docs/project-srs.md`)**:
   - Follow `.agents/skills/ba-templates/templates/srs.md` for `docs/project-srs.md`, `.agents/skills/ba-templates/templates/use-case.md` for `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md`, and write editable Mermaid diagrams under `docs/diagrams/{module}/{diagram-id}.md`.

### 6. Self-Check, Quick Audit & Word Export

1. Run all **16 checks (`K1–K16`)** in `.agents/skills/use-case-writer/references/self-check.md` and fix any violation before saving.
2. Run `BA-audit-SRS` (Quick Mode) to verify the 5 handoff gates (`docs/ba/audit/{app}_srs-audit_v1.md` or `docs/BA/SRS-report/srs/`).
3. When Quick Audit is **Ready** or **Conditionally Ready** (and in Single-File Mobile SRS Mode), run `srs-export`:
   ```bash
   python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/{app}_srs_v1.md
   ```
   to produce `docs/ba/srs-word/{app}_srs_v1.docx` for testers.

### 7. Output Summary

Report:
- SRS path (and Word `.docx` path if exported); modules and Use Cases created.
- User Flow, Activity and optional Sequence diagrams created.
- Quick Audit verdict, Open Questions (`P0/P1/P2`), and any remaining conflicts.
