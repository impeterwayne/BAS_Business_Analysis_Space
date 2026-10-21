---
name: figma-ba-analysis
description: >-
  Reads a Figma design through the `figma-mcp-android` MCP server (Figma Desktop plugin bridge) and turns it
  into BA input for a PRD / SRS: screen inventory with reference images, screen flow from prototype
  reactions, UI elements, input fields and visible validation, states that are and are not designed, all
  copy and messages, displayed data, designer annotations, candidate requirements (FR-DSN-*) and open
  questions. Writes the `figma-analysis` template from `ba-templates`. Use whenever a figma.com URL or a
  Figma node-id is given, when the user asks for an SRS, use case or user stories "from the design", or
  runs /ba-figma.
---

# Figma BA Analysis

You read a design so that the spec writer never has to open Figma. Your output is one analysis file plus the
reference images beside it; `ba-spec-writer` turns it into the UI Specification of SRS use cases, and into user stories.

The design is **evidence, not a decision**. A screen shows what the designer drew, not what the business
agreed. Everything you extract is graded (`[Design]`, `[Annotation]`, `[Prototype]`, `[Inferred]`), and every
requirement you derive is a candidate (`FR-DSN-*`, `BR-CAND-*`) until the user confirms it.

Tools: the `figma-mcp-android` MCP server ([references/figma-mcp-tools.md](./references/figma-mcp-tools.md))
plus file writes. Template: `ba-templates` key `figma-analysis`
(`.agents/skills/ba-templates/templates/figma-design-analysis.md`) — keep every heading and column.

## Orchestration Pipeline (when run by `ba-lead`)

**Input**: `/ba-figma <figma url | node ids> [feature-slug] [then spec | then stories] [diff <previous analysis>]`
(or `/figma-ba-analysis …`)
Examples:
- `/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-456 dang-nhap-otp`
- `/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-400 thanh-toan then spec`
- `/ba-figma https://www.figma.com/design/AbC123/App?node-id=102-400 thanh-toan diff docs/BA/figma/thanh-toan/thanh-toan_figma_20260901_v1.md`

When invoked in the main session (`ba-lead`), you do not call Figma tools or write deliverables directly — you dispatch `ba-figma` and `ba-spec-writer` with `invoke_subagent`, and verify. When already running inside `ba-figma`, execute the Analyst Workflow below directly.

1. **Resolve inputs (no Figma calls yet).**
   - Link or node ids; if none, fall back to the Figma row of `.agents/config/ba-project-config.md` and ask which frames. Convert node ids (`102-456` → `102:456`).
   - Feature slug (ASCII, kebab-case) and its real name with diacritics. Ask if missing.
   - Remind the user once: Figma Desktop must have the file open and the **figma-mcp-android plugin running**.
   - Existing specs: list `docs/project-srs.md` (or legacy `docs/project-fsd.md`), `docs/usecases/`, and earlier analyses under `docs/BA/figma/<feature-slug>/` (a rerun writes the next `v[N]`; `diff` needs the previous one).
2. **Analyse — one `ba-figma` dispatch per flow.** The bridge serves one Figma Desktop session, so do not run two analysts at once. The brief carries the six sections (`TASK`, `EXPECTED OUTCOME`, `MUST DO`, `MUST NOT DO`, `CONTEXT`, `SKILLS`) and names: the link and node ids, the frames in scope, the feature slug and name, `docs/BA/figma/<feature-slug>/` with the absolute workspace root (forward slashes) for `save_screenshots`, the existing SRS / use case paths to check against, and `diff` with the previous analysis when given. If the analyst returns a proposed split instead of a full analysis, show it to the user and dispatch the next part only after they agree.
3. **Verify the analysis.** Read the file with `view_file` and check:
   - Every reference image in §2 exists (`list_dir docs/BA/figma/<feature-slug>/screens/`) and is embedded with Markdown image syntax (`![...](screens/{NN}-{slug}.png)`) in §2, §4 and §6 so it displays a preview rather than a plain backticked path.
   - §6 has a row for loading, empty, error, disabled and success per screen, with `not designed` where absent.
   - §10 candidates carry sources and grades; §11 is not empty on a real flow.
   - No colours / fonts / spacing tables crept in.
   Route defects back to `ba-figma`, quoting them. At three failed attempts, bring it to the user.
4. **Report and stop.** Files written, screens covered, the candidate requirements (`FR-DSN-*`, `BR-CAND-*`) and open questions. Ask the user to **confirm or strike the candidates** and answer what they can. Do not continue without that answer unless the command said `then spec` / `then stories`, and even then only promote candidates the user has not struck.
5. **Write the deliverable (only on `then …` or the user's go-ahead) — one `ba-spec-writer` dispatch.**
   - `then spec` → `specs analyze` with the analysis as input: SRS §6 functional requirements, §4 Business Rules (from confirmed `BR-CAND-*`), the §5 User Flow (from analysis §3), and one use case per user goal. Each use case carries a UI Specification subsection per screen it serves — citing the node link and **embedding the exported reference image with Markdown image syntax** `![{Screen ID} — {Screen name}](../../BA/figma/<feature-slug>/screens/{NN}-{slug}.png)` (relative from **both** Single-File SRS `docs/ba/srs/{app}_srs_v{N}.md` **and** Modular Use Cases `docs/usecases/<module>/`; or `BA/figma/<feature-slug>/screens/{NN}-{slug}.png` when embedded directly in `docs/project-srs.md` — never copy the shortened `screens/...` path from the Figma analysis file and never use a plain backticked path without preview) — and its alternative and exception flows come from the analysis §6 states and §5 validation. When the design conflicts with competitor evidence or a checklist, run `product-decision` (`ba-brainstormer`) first.
   - `then stories` → `user-story-ac-writer` / `ba-templates` `user-stories`, one story per confirmed `FR-DSN-*`, Given/When/Then from §4 actions and §5 / §6.
   - Confirmed candidates become `FR-{MOD}-{NNN}` / `BR-{NNN}`; keep `FR-DSN-*` in the `Nguồn (Source)` column. Unconfirmed ones stay out and are listed as open questions.
   - Open questions from §11 go into each use case's Open Questions section.
6. **Report**: deliverables written, version bumps, what was left out and why, and the next step (`BA-audit-SRS` on the SRS or the UC folder). Do not auto-advance.

## Inputs (ask for anything missing before calling Figma)

| Input | Example | Required |
| :--- | :--- | :--- |
| Figma link or node ids | `https://www.figma.com/design/AbC123/App?node-id=102-456` | Yes, or a selection in Figma |
| Feature / flow name | `dang-nhap-otp` (slug) and "Đăng nhập bằng OTP" | Yes |
| Frames in scope | all frames in section `102:400`, or a list | Yes when the link points at a page |
| Previous analysis (diff mode) | `docs/BA/figma/dang-nhap-otp/dang-nhap-otp_figma_20260901_v1.md` | Only for `diff` |
| Existing specs | `docs/project-srs.md` (or legacy `docs/project-fsd.md`), `docs/usecases/{module}/` | Read if present |

Also read `.agents/config/ba-project-config.md` (project type, language, Figma link).

## Output layout

```
docs/BA/figma/{feature-slug}/
  {feature-slug}_figma_{YYYYMMDD}_v{N}.md     the analysis (immutable; a rerun writes v{N+1})
  screens/{NN}-{slug}.png                     reference image per frame, scale 2
  screens/{NN}-{slug}-{state}.png             one per designed state worth showing
```

## Analyst Workflow (inside `ba-figma`)

### 1. Connect and locate

1. `get_metadata` (or `get_pages`) first. A connection error means Figma Desktop is not running the bridge
   plugin: stop and tell the user to open the file and run the plugin. Do not retry in a loop.
2. Check the open file matches the link (file name / key). If it does not, stop and ask — the bridge only sees
   the document open in Figma Desktop.
3. Convert node ids from the URL: `node-id=102-456` or `102%3A456` → `102:456`.
4. No node id? `get_selection` if the user selected frames, else `search_nodes` with the screen name and
   `nodeTypes: ['FRAME', 'SECTION', 'COMPONENT']`. Several matches → list them and ask.
5. List **every frame in scope** before going deeper (a flow is normal). Finding frame 6 after the analysis is
   written costs a second pass over all of them.

### 2. Bounded tree scan

<HARD-GATE>
NEVER call `get_document`. A whole file exhausts the context window and ends the task.
</HARD-GATE>

1. `get_design_context` with `depth: 2, detail: 'minimal'` per frame — the skeleton (header, content, footer).
2. `get_design_context` with `depth: 3, detail: 'compact', dedupe_components: true` on the containers that hold
   inputs, lists, dialogs and CTAs. Skip pure decoration.
3. `get_node` only for one node whose exact properties you need (a disabled variant, a helper text).

Log every call in §1 and name the branches you skipped. If the scope is too large for one pass (more than
~8 frames), analyse the first coherent sub-flow fully and propose the split — **a complete analysis of one
flow beats a shallow one of ten screens**, because the shallow one gets specified.

### 3. Reference images

`save_screenshots` for every frame in scope, `format: 'PNG'`, `scale: 2`, into
`docs/BA/figma/{feature-slug}/screens/`. Use **absolute paths with forward slashes** in `outputPath` (resolve the
workspace root first); the server does not run in the workspace. Confirm the files exist with `list_dir`
before you cite them. Embed every exported image using Markdown image syntax (`![{NN} — {Screen name}](screens/{NN}-{slug}.png)`) in §2, §4 and §6 so the image displays directly in preview instead of showing a plain/shortened code path. A cited image that is not on disk is a defect.

### 4. Extract, screen by screen

| What | Tool | Goes to |
| :--- | :--- | :--- |
| All text: labels, CTAs, placeholders, helper and error text, dialogs, toasts | `scan_text_nodes` `{nodeId, depth: 4}` | §4 Elements, §5, §7 |
| Interactive elements: buttons, fields, toggles, tabs, list items | `scan_nodes_by_types` `['INSTANCE', 'COMPONENT', 'FRAME']` + component names | §4 Elements |
| Navigation and triggers | `get_reactions` on every clickable node | §3 flow, §4 Actions |
| Designer notes, Dev Mode specs | `get_annotations` on each frame | §9, then override §4–§8 |
| Variants (disabled, error, selected, pressed) | `get_local_components`, then `get_nodes_info` on variant ids in one call | §6 |

Rules while extracting:
- Keep on-screen text **exactly** as designed (Vietnamese diacritics, punctuation), English in the next column.
- A text with a variable part (`Xin chào, Nam`) is **Dynamic**: name the data that feeds it in §7 and §8.
- Placeholder or lorem text is not a requirement: mark it `[Design] placeholder copy` and add a question.
- Visual styling (colours, spacing, fonts) is out of scope for a BA analysis. Record it only when it carries
  meaning (red text = error, greyed button = disabled, badge = count).

### 5. States sweep

For every screen, look for sibling frames or variants named `Loading`, `Empty`, `Error`, `Disabled`,
`Success`, `No internet`, `Permission`, `Dark`, and component variants with those states. Fill §6 with one row
per state **including the ones not designed** — each `not designed` row becomes an open question in §11. This
is the section most often skipped and the one that most often leaves a use case without its exception flows.

### 6. Derive candidates

From what you observed, write §8 (displayed data) and §10 (candidate requirements and rules):
- `FR-DSN-{NNN}` — a capability the screens imply ("user can resend OTP").
- `BR-CAND-{NN}` — a rule the design states or shows (button disabled until 10 digits, countdown 60 s).
- Each row cites screens and node ids, carries a grade, and says which deliverable it feeds (SRS section,
  UC, US). An `[Inferred]` row is allowed only with a matching question in §11.

Before claiming something is new, `grep_search` the existing SRS and use cases: "already FR-AUTH-002, design
matches" is the most useful line you can write, and "changed vs FR-AUTH-002" the second most.

### 7. Write and validate

1. Write `docs/BA/figma/{feature-slug}/{feature-slug}_figma_{YYYYMMDD}_v{N}.md` from the template, in
   Vietnamese per `ba-global-rules`; never overwrite an existing `v{N}`.
2. Draw §3 with `mermaidjs-v11` syntax (`flowchart TD`): `[Prototype]` edges solid, `[Inferred]` edges dashed. Keep every diagram **simple (≤ 8–12 nodes, short labels)** and **cut §3 into multiple smaller diagrams** (`3.1 Luồng chính`, `3.2 Nhánh phụ / Xử lý lỗi`, …) whenever there are multiple sub-flows or branches so each diagram is easy to view.
3. Validate Markdown per `ba-markdown-formatting`.

### Diff mode

Given a previous analysis: re-run steps 1–5 on the same frames, then fill §12 per element (**matches**,
**changed** old → new, **new**, **removed**) and list the SRS sections, use cases and stories each change
affects. Do not re-describe unchanged screens; point to the previous version instead.

## Completion checklist

- [ ] `get_document` never called; every MCP call and every skipped branch logged in §1.
- [ ] A reference PNG on disk for every frame in §2, embedded with `![...](screens/{NN}-{slug}.png)` in §2, §4 and §6 so it displays a preview (never a plain code path).
- [ ] Every element, string and rule carries a node id that was observed, not constructed.
- [ ] §5 lists only constraints the design shows; the rest are questions.
- [ ] §6 covers loading, empty, error, disabled and success for every screen — `not designed` where absent.
- [ ] §7 holds every string from `scan_text_nodes`, original text preserved.
- [ ] §10 candidates cite sources and target deliverables; none presented as confirmed.
- [ ] §11 questions are actionable and name who answers them.
