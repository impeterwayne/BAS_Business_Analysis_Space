---
description: Analyse a competitor Android app from its decoded code (jadx) and on the device (mobilerun) with parallel subagents, and write evidence-backed BA competitor docs
---

Analyse a competitor (opponent) app and turn it into BA deliverables.

**Input**: `/ba-competitor <app name or package> [flows…] [--code <jadx_src path>] [compare <our reference>]`
Examples: `/ba-competitor com.mservice.momotransfer chuyen-tien`,
`/ba-competitor MoMo onboarding login compare docs/project-fsd.md`,
`/ba-competitor com.mservice.momotransfer chuyen-tien --code D:/RE/workspaces/com.mservice.momotransfer/jadx_src`
(`--code` is optional: the jadx root normally comes from the config; write it with forward slashes, no quotes).

**You are the orchestrator for this command** — act as `ba-lead` (`.agents/agents/ba-lead.md`). You do not
drive the device, read decoded code in bulk, or write deliverables: you dispatch subagents with
`invoke_subagent`, write the exploration plan, and verify. Keep `ba-device-automation` and `ba-global-rules` in
force throughout.

Paths below use `<dir>` = `docs/BA/competitor/<app-slug>/`.

**Steps**

1. **Resolve inputs (no tools beyond reading).**
   - App, package, flows (default: onboarding + primary navigation), account to use (guest, or a test account
     the user provides). Check `.agents/config/ba-project-config.md` → Competitor Apps for the package, flows,
     account and **Decoded source** path.
   - jadx root: `--code` if it carries a path, else the config's Decoded source, else none. Confirm it exists
     with `list_dir` on its parent.
   - Ask for anything missing. Do not touch the device yet.
   - **Write every path you pass to a subagent with forward slashes** (`D:/RE/…/jadx_src`): backslashes in a
     dispatch prompt get mangled when the subagent copies them into tool arguments.

2. **Wave A — code scouts (skip if there is no jadx root).**
   - **A0, only when `<dir>code-index/_meta.md` is missing — one scout, alone.** Dispatch a single `code-scout`
     to build the index (`apk-code-index` §1) and write `code-index/screen-map.md`. Wait for it. Never start the
     flow scouts before the index exists: a scout that opens a file another scout has not written yet fails.
   - **A1 — in parallel, one `invoke_subagent` call, at most 3 scouts:**
   - `code-scout` **screen map + features** (when A0 did not run): write `code-index/screen-map.md` (main
     navigation, tabs, feature areas, entry points, cross-platform warning if any). Skip it when
     `screen-map.md` already exists for the same app version.
   - `code-scout` **flow `<flow>`** — one per flow in scope (if more than 2 flows, batch the rest into a second
     call after the first returns): write `code-index/flow-<flow>.md` with the **Verify on device** checklist.
     Skip a flow whose note already exists for the same app version, unless the user asks to redo it.

   Flow arguments arrive as ASCII slugs (`chuyen-tien`). Restore the real flow name from the config's
   Competitor Apps row ("Chuyển tiền") and give the scouts keywords with diacritics, without them, and in English.

   Each prompt carries the six sections (TASK, EXPECTED OUTCOME, MUST DO, MUST NOT DO, CONTEXT, SKILLS) and
   names the jadx root, app-slug, package, flow keywords in Vietnamese and English, and the output path.
   **Wait for every scout** before step 3.

3. **Wave B — write the exploration plan yourself.** Read every scout note, then write
   `<dir>exploration-plan.md`:

   ```markdown
   # Exploration plan — <app> (<package> v<version>), <YYYY-MM-DD>
   Account: guest | test account from <owner>. Code index: code-index/_meta.md (or "none — black box").

   ## Flow <flow>
   Entry: open_deeplink("<uri>") | start_app(activity="<exported activity>") | from home: <path>
   Expected screens: 1 <Screen> → 2 <Screen> → …   (from code-index/flow-<flow>.md)
   Verify on device:
   - [ ] <item from the scout checklist> — code: <path:line>
   Walls expected: <login / OTP / paywall / outward action at step N>
   Results: (filled by competitor-analyst)
   ```

   If the plan already exists (an earlier run on other flows), add or replace only the sections for this run's
   flows and keep every other section and its `Results:` as they are.

   Order flows so the cheapest entry and the fewest walls go first. Show the plan to the user in Vietnamese
   (short) and continue unless they object.

4. **Wave C — device walks, one flow per dispatch, strictly one at a time.** Dispatch `competitor-analyst` in
   WALK mode for the first flow; wait; read its flow doc and plan results; then the next flow. The first WALK
   also does pre-flight (`ping_device`, `get_device_status`, `lookup_app`, record version, create
   `<dir>screens/`); if the device is unreachable, stop and suggest `/ba-device-check`. The last WALK closes the
   session (`stop_app` without `clear_data`, `end_session`).

5. **Wave D — synthesize.** Dispatch `competitor-analyst` in SYNTHESIZE mode: screen inventory, app profile
   (with the tech section from `code-index/tech.md`), a code-only features section, and — only if `compare` was
   given — the comparison / gap report. It covers **every** flow doc in `<dir>`, not only this run's, so a
   profile written after a single-flow run still describes the whole survey; the new files are the next `v[N]`.

6. **Wave E — verify.** Dispatch `evidence-verifier` alone with the document list, `<dir>screens/`,
   `<dir>code-index/` and the plan. On `FAIL`, re-dispatch only the owner of each defect, quoting it, then verify
   again. Three failed rounds on the same defect → stop and ask the user.

7. **Report in Vietnamese:** files written, the verdict, screens per flow, plan items observed / not reached /
   contradicted, where exploration stopped and why, open questions, and the suggested next step (usually
   `ba-brainstormer` on the top `GAP-*` items).

**Guardrails**
- Never create real accounts, pay, transfer, post or delete without explicit approval for that action.
- Never type real personal data; never write credentials, OTPs or secret values from code into any file.
- Never run two device walks at once, and never dispatch a walker in the same call as a scout.
- Every statement in a document is graded and cited: a capture under `screens/` or a `path:line` in the code.
