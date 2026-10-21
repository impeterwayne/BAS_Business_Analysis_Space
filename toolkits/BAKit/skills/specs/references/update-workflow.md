# Update Workflow — /specs update

Synchronize the existing **SRS, Use Cases, UI Specifications and diagrams** with confirmed changes. Works with both **Single-File Mobile SRS Mode** (`docs/ba/srs/{app}_srs_v{N}.md` → writes `v{N+1}`) and **Modular Living SRS Mode** (`docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`).

## Steps

### 1. Read Current Documents & Change Inputs

- Read the latest SRS (`docs/ba/srs/{app}_srs_v{N}.md` or `docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`). If no SRS exists, warn: "No SRS found. Run `/specs init` first."
- Review the latest available:
  - Product Decision Summaries / Rule Confirmation Tables (`docs/BA/decisions/` or `docs/ba/product-decisions/`, new `v{N}` files, changed `PD-*` items) and briefs.
  - Design / Figma updates (`docs/inputs/design/` or `docs/BA/figma/{feature}/`).
  - Feature Checklist changes and PO notes.
  - APK evidence when the change concerns reference-based behavior.

### 2. Create a Change Inventory & Assess Impact

Classify every affected item:

| Class | Meaning |
| :--- | :--- |
| `ADDED` | New confirmed requirement |
| `MODIFIED` | Confirmed change to an existing requirement |
| `REMOVED` | Confirmed removal only |
| `UNCHANGED` | Reviewed, no change |
| `CONFLICT` | Sources disagree |
| `TBD` | Not yet decided |

Check impact across Feature scope, Traceability matrix, UI components/images/states, Main/Alternative/Exception flows, Business Rules (`BR-*`), User Flows (`UF-*`), Activity Diagrams (`ACT-*`), Permissions, Ads/IAP, and Open Questions (`Q-*`).

### 3. Apply Controlled Updates

- **Single-File Mobile SRS Mode**: Copy `docs/ba/srs/{app}_srs_v{N}.md` to `docs/ba/srs/{app}_srs_v{N+1}.md` (never overwrite an already exported/audited version), apply the changes to the affected sections, preserve unaffected Use Cases and `<a id="..."></a>` anchors, bump the header version to `v{N+1}`, and append a Change Log row.
- **Modular Living SRS Mode**: Update only the affected files in `docs/usecases/{module}/`, `docs/diagrams/{module}/`, and `docs/project-srs.md`, bump versions, and append Change Log rows.
- Never delete a Use Case or its history: mark it `Deprecated / Out of Scope` only when the removal is confirmed.
- Keep every `mermaid` diagram block simple (`flowchart TD`, ≤ 8–12 nodes) and split complex flows into smaller sub-diagrams.

### 4. Self-Check, Quick Audit & Re-Export Word `.docx`

1. Run the **16-item Use Case self-check (`K1–K16`)** in `.agents/skills/use-case-writer/references/self-check.md` on all added/updated Use Cases.
2. Run `BA-audit-SRS` (Quick Mode) on the updated SRS (`docs/ba/audit/{app}_srs-audit_v{N+1}.md`).
3. When Quick Audit is **Ready** or **Conditionally Ready** in Single-File Mobile SRS Mode, run `srs-export`:
   ```bash
   python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/{app}_srs_v{N+1}.md
   ```
   to generate `docs/ba/srs-word/{app}_srs_v{N+1}.docx` for testers.
