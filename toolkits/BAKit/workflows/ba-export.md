---
description: Export docs/project-srs.md to Word (docs/project-srs.docx) — only when the user asks (srs-export)
---

Export the SRS to Word.

**Input**: `/ba-export [--reference-doc <company-template.docx>]`

1. Load `.agents/skills/srs-export/SKILL.md`.
2. If some Figma sections still wait for PO answers, say so and ask whether to export anyway.
3. Run `python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md`, then
   `python .agents/skills/srs-export/scripts/export_docx.py docs/project-srs.md`.
4. Report the Word path, diagrams embedded, and any warning (missing image, diagram left as code).
