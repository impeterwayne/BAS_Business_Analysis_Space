# Analyze Workflow — /specs analyze "feature description"

Analyze one **target feature**, create or update its Use Cases and diagrams, and synchronize the SRS without
rewriting unrelated modules. Works with both **Single-File Mobile SRS Mode** (`docs/ba/srs/{app}_srs_v{N}.md`) and **Modular Living SRS Mode** (`docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`).

## Arguments

Everything the user typed after `analyze` is the feature description.
Example: `/specs analyze "AI image generation: input photo validation and retry"`

The description may be a path to a Product Decision Summary / Rule Confirmation Table (`docs/BA/decisions/…` or `docs/ba/product-decisions/…`), a feature
brief (`docs/BA/briefs/…`) or a Figma design analysis (`docs/BA/figma/{feature}/{feature}_figma_*.md`).

## Steps

### 1. Detect Project Type & SRS Mode

- Follow **Project Type Resolution** in `specs/SKILL.md`.
- Check whether the workspace uses `docs/ba/srs/{app}_srs_v{N}.md` (Single-File Mobile SRS Mode) or `docs/project-srs.md` (Modular Mode). If neither exists yet, initialize using Single-File Mobile SRS Mode for mobile apps (or Modular Mode if requested).

### 2. Check the Decision Gate

Find what confirms the target behavior, in this order:

1. A Product Decision Summary / Rule Confirmation Table (`docs/BA/decisions/` or `docs/ba/product-decisions/`, latest `v{N}`).
2. A feature brief under `docs/BA/briefs/`.
3. An explicit decision from the user in this conversation.

- Verdict `NOT READY FOR SRS` or unconfirmed hidden rules → **stop**. Show the blocking `PD-*` / `P0` items and run/route to `product-decision` (`ba-brainstormer`) first.
- Verdict `READY FOR SRS` → continue; carry its `TBD` items forward as Open Questions (`Q-{NNN}`).

### 3. Read Current Documentation & Source Evidence

1. Read the latest SRS (`docs/ba/srs/{app}_srs_v{N}.md` or `docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`).
2. Read the decision file / brief (`KEEP / MODIFY / REMOVE / NEW`), Figma analysis / design screenshots (`docs/inputs/design/` or `docs/BA/figma/`), APK evidence (`*_screens*`, `*_flow-*`), and Feature Checklist.
3. Keep four buckets apart: **Reference evidence**, **Target design**, **Confirmed target behavior**, **Unresolved gaps**. Never promote `[Inferred]` evidence into requirements.

### 4. Scope & Author/Update Use Cases and Diagrams

1. Apply `.agents/skills/use-case-writer/references/scoping-rules.md` and `references/writing-style.md`.
2. Reuse/update an existing Use Case when it covers the same user goal; otherwise create a new Use Case with the next stable ID (`UC-{MOD}-{NNN}`).
3. Place the **UI Specification before Main Flow**, with the **Design image block (`![{Screen ID} — {Screen name}](<relative-path>.png)`) at the top of each screen subsection** so it renders as an inline preview.
4. Include Main Flow, Alternative Flows (`AF-*`), Exception / Error Flows (`EF-*`), Business Rules (`BR-*`), Navigation / Result, Acceptance Criteria (`AC-*`), Related Diagrams, Open Questions (`Q-*`) and Evidence links.
5. Update User Flow (`UF-*`) and Activity Diagrams (`ACT-*`, required for complex features with 3+ screens, multiple branches, or IAP/Permissions), keeping each `mermaid` block simple (`flowchart TD`, ≤ 8–12 nodes).
6. In **Single-File Mobile SRS Mode**, save as a new version `docs/ba/srs/{app}_srs_v{N+1}.md` (if `v{N}` was already audited/exported) or update the current draft, preserving `<a id="..."></a>` anchors and adding a Change Log row. In **Modular Mode**, update `docs/usecases/{module}/`, `docs/diagrams/{module}/`, and `docs/project-srs.md`.

### 5. Self-Check, Quick Audit & Word Export

1. Run the **16-item Use Case self-check (`K1–K16`)** in `.agents/skills/use-case-writer/references/self-check.md`.
2. Run `BA-audit-SRS` (Quick Mode) and, when `Ready` or `Conditionally Ready` in Single-File Mobile SRS Mode, export the updated Word `.docx` with `srs-export` (`python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/{app}_srs_v{N}.md`).
