---
description: Read a Figma design (figma-mcp-android) into a BA design analysis, then write SRS content (use cases with UI specification, diagrams, user stories) from it
---

Turn a Figma design into BA deliverables.

**Input**: `/ba-figma <figma url | node ids> [feature-slug] [then spec | then stories] [diff <previous analysis>]`
Examples: `/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-456 dang-nhap-otp`,
`/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-400 thanh-toan then spec`,
`/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-400 thanh-toan diff docs/BA/figma/thanh-toan/thanh-toan_figma_20260901_v1.md`

**You are the orchestrator for this command** — act as `ba-lead` (`.agents/agents/ba-lead.md`). You do not
call Figma tools or write the deliverables: you dispatch `figma-analyst` and `ba-spec-writer` with
`invoke_subagent`, and verify. Keep `ba-figma` and `ba-global-rules` in force throughout.

Paths below use `<dir>` = `docs/BA/figma/<feature-slug>/`.

**Steps**

1. **Resolve inputs (no Figma calls yet).**
   - Link or node ids; if none, fall back to the Figma row of `.agents/config/ba-project-config.md` and ask
     which frames. Convert node ids (`102-456` → `102:456`).
   - Feature slug (ASCII, kebab-case) and its real name with diacritics. Ask if missing.
   - Remind the user once: Figma Desktop must have the file open and the **figma-mcp-android plugin running**.
   - Existing specs: list `docs/project-srs.md` (or legacy `docs/project-fsd.md`) and earlier analyses under `<dir>` (a rerun
     writes the next `v[N]`; `diff` needs the previous one).

2. **Analyse — one `figma-analyst` dispatch per flow.** The bridge serves one Figma Desktop session, so do not
   run two analysts at once. The brief carries the six sections (TASK, EXPECTED OUTCOME, MUST DO, MUST NOT DO,
   CONTEXT, SKILLS) and names: the link and node ids, the frames in scope, the feature slug and name, `<dir>`
   with the absolute workspace root (forward slashes) for `save_screenshots`, the existing SRS / use case paths
   to check against, and `diff` with the previous analysis when given.
   If the analyst returns a proposed split instead of a full analysis, show it to the user and dispatch the
   next part only after they agree.

3. **Verify the analysis yourself.** Read the file with `view_file` and check:
   - Every reference image in §2 exists (`list_dir <dir>screens/`).
   - Every interactive element has its element image in `<dir>elements/` (large containers excepted).
   - §6 has a row for loading, empty, error, disabled and success per screen, with `not designed` where absent.
   - §10 candidates carry sources and grades; §11 is not empty on a real flow.
   - No colours / fonts / spacing tables crept in.
   Route defects back to `figma-analyst`, quoting them. At three failed attempts, bring it to the user.

4. **PO gate (mandatory).** Dispatch `ba-brainstormer` (`product-decision`, batch mode) with the analysis, the
   Feature Checklist rows and the APK evidence of the feature (if any). It sends the PO **one table in chat**:
   conflicts between Figma and the reference app logic plus hidden rules (with APK values), or — without APK
   evidence — everything still needed to define the rules and the User Flow. **Wait** for the PO's answers and
   ask again for any empty row. No Use Case is written before this step is complete, even with `then spec`.

5. **Write (on `then spec` or the user's go-ahead) — one `ba-spec-writer` dispatch.**
   - `then spec` → `specs analyze` into `docs/project-srs.md`: one Use Case per user goal (`use-case-writer`),
     each with Trigger / Pre / Post, the screen grid from `<dir>screens/`, element tables with images from
     `<dir>elements/`, a User Flow (`user-flow`), flows, one-rule-per-row Business Rules and, for a large
     feature, an Activity Diagram. Then run the diagram render script.
   - `then stories` → `ba-templates` `user-stories`, from the PO-confirmed behaviour only.
   - Nothing unconfirmed goes into the SRS; there is no Open Questions section.

6. **Report** in chat: Use Cases written, diagrams rendered, self-check result, and the next step
   (`/ba-review` quick audit, or `/ba-export` when the user wants Word). Do not auto-advance.
