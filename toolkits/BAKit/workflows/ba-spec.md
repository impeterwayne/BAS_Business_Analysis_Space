---
description: Create or update the FSD and use cases (specs skill) - init, analyze "feature", update
---

Run the `specs` skill.

**Input**: `/ba-spec init` · `/ba-spec analyze "<feature or path to feature brief>"` · `/ba-spec update`

**Steps**

1. Load `.agents/skills/specs/SKILL.md` and route by the first word (`init`, `analyze`, `update`). If none is given, list the three operations and ask.
2. Before `analyze`, check that Phase 2 of `ba-workflow` produced a decision (a feature brief under `docs/BA/briefs/`, or an explicit user decision). If not, ask whether to brainstorm first.
3. Use the templates `ba-templates/templates/fsd.md` and `ba-templates/templates/use-case.md`. Draw the required Mermaid diagrams with `mermaidjs-v11`.
4. Promote competitor candidates (`FR-CAND-*`) only when the user confirms them; keep the source trace.
5. Report the files created or updated, the version bump, and open questions. Do not continue to review or test cases unless asked.
