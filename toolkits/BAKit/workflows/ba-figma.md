---
description: Read a Figma design (figma-mcp-android) into a BA design analysis, then write PRD / SRS content (FSD, use cases, user stories) from it
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
   - Existing specs: list `docs/project-fsd.md`, `docs/usecases/`, and earlier analyses under `<dir>` (a rerun
     writes the next `v[N]`; `diff` needs the previous one).

2. **Analyse — one `figma-analyst` dispatch per flow.** The bridge serves one Figma Desktop session, so do not
   run two analysts at once. The brief carries the six sections (TASK, EXPECTED OUTCOME, MUST DO, MUST NOT DO,
   CONTEXT, SKILLS) and names: the link and node ids, the frames in scope, the feature slug and name, `<dir>`
   with the absolute workspace root (forward slashes) for `save_screenshots`, the existing FSD / use case paths
   to check against, and `diff` with the previous analysis when given.
   If the analyst returns a proposed split instead of a full analysis, show it to the user and dispatch the
   next part only after they agree.

3. **Verify the analysis yourself.** Read the file with `view_file` and check:
   - Every reference image in §2 exists (`list_dir <dir>screens/`).
   - §6 has a row for loading, empty, error, disabled and success per screen, with `not designed` where absent.
   - §10 candidates carry sources and grades; §11 is not empty on a real flow.
   - No colours / fonts / spacing tables crept in.
   Route defects back to `figma-analyst`, quoting them. At three failed attempts, bring it to the user.

4. **Report and stop.** Files written, screens covered, the candidate requirements (`FR-DSN-*`, `BR-CAND-*`)
   and open questions. Ask the user to **confirm or strike the candidates** and answer what they can. Do not
   continue without that answer unless the command said `then spec` / `then stories`, and even then only promote
   candidates the user has not struck.

5. **Write the deliverable (only on `then …` or the user's go-ahead) — one `ba-spec-writer` dispatch.**
   - `then spec` → `specs analyze` with the analysis as input: FSD §1 requirements, §2 Screen Descriptions
     (one per screen, citing the reference image), §3 Screen Flows (from analysis §3), §5 Data Models (from §8),
     §6 Business Rules (from confirmed `BR-CAND-*`), and one use case per user goal, whose alternative and
     exception flows come from the analysis §6 states and §5 validation.
   - `then stories` → `ba-templates` `user-stories`, one story per confirmed `FR-DSN-*`, Given/When/Then from
     §4 actions and §5 / §6.
   - Confirmed candidates become `FR-{MOD}-{NNN}` / `BR-{NNN}`; keep `FR-DSN-*` in the `Nguồn (Source)` column.
     Unconfirmed ones stay out and are listed as open questions.
   - Open questions from §11 go into each use case's Open Questions section.

6. **Report**: deliverables written, version bumps, what was left out and why, and the next step
   (`/ba-review <UC folder>` for readiness). Do not auto-advance.
