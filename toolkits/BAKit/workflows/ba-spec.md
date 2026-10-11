---
description: Create or update the SRS with use cases and diagrams (specs skill) - init, analyze "feature", update; legacy FSD on request
---

Run the `specs` skill.

**Input**: `/ba-spec init` · `/ba-spec analyze "<feature, decisions file, feature brief or Figma analysis path>"` · `/ba-spec update`

**Steps**

1. Load `.agents/skills/specs/SKILL.md` and route by the first word (`init`, `analyze`, `update`). If none is given, list the three operations and ask.
2. Before `analyze`, check that Phase 2 of `ba-workflow` produced a decision: a Product Decision Summary `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` with verdict `READY FOR SRS`, a feature brief under `docs/BA/briefs/`, or an explicit user decision. If the verdict is `NOT READY FOR SRS` or nothing is found, stop and ask whether to run `product-decision` / brainstorm first.
3. Use the templates `ba-templates/templates/srs.md` and `ba-templates/templates/use-case.md` (legacy `fsd.md` only when the user asks for an FSD or keeps an existing `docs/project-fsd.md`). Outputs: `docs/project-srs.md`, `docs/usecases/{module}/`, `docs/diagrams/{module}/`.
4. Apply the diagram policy with `mermaidjs-v11` (`flowchart TD`): User Flow for every main journey and Activity Diagram for every core process (required, shared where use cases are simple), Sequence Diagram only for complex multi-system interactions. Every use case links its covering diagrams.
5. Treat APK evidence as reference only. Promote candidates (`FR-CAND-*`, `FR-DSN-*`, `BR-CAND-*`) only when a decision or the user confirms them; keep the source trace.
6. Run the `specs` quality gate, then report the files created or updated, the version bump, open questions (P0/P1/P2) and the status (Draft / Ready for SRS Audit / Blocked by P0). Do not continue to `/ba-review` or test cases unless asked.
