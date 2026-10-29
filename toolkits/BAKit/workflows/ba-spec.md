---
description: Write or update the single-file SRS docs/project-srs.md (specs skill) — init, analyze "feature" (after the Figma section + PO answers), update
---

Run the `specs` skill.

**Input**: `/ba-spec init` · `/ba-spec analyze "<feature or Figma section>"` · `/ba-spec update`

1. Load `.agents/skills/specs/SKILL.md` and the reference workflow for the operation.
2. `analyze` always starts from a Figma section link sent by the PO: read it (`/ba-figma`), run the PO gate
   (`product-decision` batch table in chat), **wait for every answer**, then write.
3. Writing: `ba-spec-writer` with `use-case-writer` (scoping, style, self-check) and `user-flow` (one User Flow per
   Use Case); Activity Diagram only for a large feature.
4. After any diagram change: `python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md`.
5. Report in chat. No Word export unless the user asks (`/ba-export`).
