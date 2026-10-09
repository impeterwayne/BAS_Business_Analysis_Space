---
description: Analyse a competitor Android app from its decoded code (jadx) and on the device (mobilerun) with parallel subagents, and write evidence-backed BA competitor docs
---

Analyse a competitor (opponent) app and turn it into BA deliverables.

Supports two execution branches:
- **Branch 1: Hybrid / Device-Verified (with `mobilerun`)** — Explores on a connected device, captures screenshots/UI trees, verifies code findings live.
- **Branch 2: Static / Code-Only (without `mobilerun`)** — Explores decoded source code (`jadx_src`) without a device, extracting screens, validations, rules, and APIs into BA docs with `[Code]` and `[Inferred]` citations.

**Input**: `/ba-competitor <app name or package> [flows…] [--code <jadx_src path>] [--code-only | --no-device] [compare <our reference>]`
Examples:
- `/ba-competitor com.mservice.momotransfer chuyen-tien` (Auto-detects device: uses `mobilerun` if device is connected, falls back to code-only if no device)
- `/ba-competitor com.mservice.momotransfer chuyen-tien --code-only` (Forces static code-only analysis without touching any device or `mobilerun`)
- `/ba-competitor MoMo onboarding login compare docs/project-fsd.md --no-device`
- `/ba-competitor com.mservice.momotransfer chuyen-tien --code D:/RE/workspaces/com.mservice.momotransfer/jadx_src`

(`--code` is optional: the jadx root normally comes from the config; write it with forward slashes, no quotes).

**You are the orchestrator for this command** — act as `ba-lead` (`.agents/agents/ba-lead.md`). You do not
drive the device, read decoded code in bulk, or write deliverables: you dispatch subagents with
`invoke_subagent`, write the exploration plan (if walking a device), and verify. Keep `ba-device-automation` and `ba-global-rules` in
force throughout.

Paths below use `<dir>` = `docs/BA/competitor/<app-slug>/`.

---

**Steps**

1. **Resolve inputs & select execution branch.**
   - App, package, flows (default: onboarding + primary navigation), account to use. Check `.agents/config/ba-project-config.md` → Competitor Apps for the package, flows, account and **Decoded source** path.
   - jadx root: `--code` if it carries a path, else the config's Decoded source, else none. Confirm it exists with `list_dir` on its parent.
   - **Branch Selection**:
     - If `--code-only` or `--no-device` is passed → **Branch 2 (Static / Code-Only)**. Requires decoded source.
     - Otherwise, check for device readiness (`ping_device` or `adb devices`). If connected and awake → **Branch 1 (Hybrid with `mobilerun`)**. If no device is connected, notify the user and seamlessly fall back to **Branch 2 (Static / Code-Only)**.
   - **Write every path you pass to a subagent with forward slashes** (`D:/RE/…/jadx_src`).

---

### Branch 1: Hybrid / Device-Verified (with `mobilerun`)

2. **Wave A — code scouts (skip if there is no jadx root).**
   - **A0, only when `<dir>code-index/_meta.md` is missing — one scout, alone.** Dispatch a single `code-scout` to build the index (`apk-code-index` §1) and write `code-index/screen-map.md`. Wait for it.
   - **A1 — in parallel, one `invoke_subagent` call, at most 3 scouts:**
     - `code-scout` **screen map + features**: write `code-index/screen-map.md`. Skip when already exists for same app version.
     - `code-scout` **flow `<flow>`**: write `code-index/flow-<flow>.md` with the **Verify on device** checklist.
   - Wait for every scout before step 3.

3. **Wave B — write the exploration plan yourself.** Read every scout note, then write `<dir>exploration-plan.md` (Entry points, expected screens, verify on device checklist, expected walls).

4. **Wave C — device walks (one flow per dispatch, strictly one at a time).** Dispatch `competitor-analyst` in WALK mode for each flow using `mobilerun`. Captures screens (`screens/`), records observed facts, and notes walls/barriers.

5. **Wave D — synthesize.** Dispatch `competitor-analyst` in SYNTHESIZE mode: screen inventory from captures, app profile with tech stack, flow docs, and comparison/gap report if `compare` was provided.

6. **Wave E — verify.** Dispatch `evidence-verifier` alone with document list, captures, code index, and plan. Checks `[Observed]`, `[Code]`, and `[Inferred]` claims.

---

### Branch 2: Static / Code-Only (without `mobilerun`)

2. **Wave A — deep code scouts (requires decoded source `jadx_src`).**
   - **A0 (Index)**: Build index (`apk_index.py build`) if `code-index/_meta.md` does not exist yet.
   - **A1 — in parallel, one `invoke_subagent` call with 2–3 scouts:**
     - `code-scout` **screen map + layouts**: write `code-index/screen-map.md` analyzing activities, fragments, nav graphs, Compose routes, and associated layout XMLs (`res/layout/*.xml`).
     - `code-scout` **flow `<flow>` deep-code**: write `code-index/flow-<flow>.md` detailing step-by-step logic, input fields, validation rules (min/max/regex), string resources (`res/values/strings.xml`), error handlers, and Retrofit/Ktor endpoints.
   - Wait for every scout before synthesis.

3. **Wave B — static deliverable synthesis (no device, no mobilerun).**
   - Dispatch `competitor-analyst` in SYNTHESIZE mode (or `code-scout`) with `mode="code-only"`:
     - **Screen Inventory** (`{app-slug}_screens_{YYYYMMDD}_v1.md`): derived from layout XMLs, view binding, and component IDs; cites layout `file:line` instead of screenshot files.
     - **Flow Analysis** (`{app-slug}_flow-{flow}_{YYYYMMDD}_v1.md`): derived from Activity/Fragment transitions, Intent extras, validation methods, and error strings. Generates a Mermaid state transition diagram and a Code Rules table with `[Code]` citations.
     - **App Profile** (`{app-slug}_profile_{YYYYMMDD}_v1.md`): overview, tech stack from `tech.md`, permissions, and complete feature map (`CF-*`).
     - **Comparison / Gap** (`{topic}_comparison_{YYYYMMDD}_v1.md`): when `compare` was provided, evaluates code capabilities against our reference.

4. **Wave C — verify.** Dispatch `evidence-verifier` alone:
   - Verifies that all facts carry valid `[Code]` citations (`path:line`) that exist under `jadx_src/`.
   - Strictly enforces **grade honesty**: confirms that NO `[Observed]` claims exist in code-only mode (all claims must be `[Code]` or `[Inferred]`).
   - Checks that no credentials or secrets are leaked.

---

**Reporting & Guardrails**

7. **Report in Vietnamese:**
   - Active branch (Hybrid with `mobilerun` vs Static Code-Only).
   - Deliverables written under `docs/BA/competitor/<app-slug>/`.
   - Verification verdict (`PASS` / `PASS WITH GAPS`).
   - Summary of flows, rules, and candidate requirements (`FR-CAND-*` / `GAP-*`).
   - Suggested next step (`ba-brainstormer` for Phase 2 ideation on top `GAP-*` items).

**Guardrails**
- In Branch 1: Never create real accounts, pay, transfer, post, or delete on live device without explicit approval.
- In Branch 2: Never attempt to call `mobilerun` tools or ping devices; all claims must be grounded in decompiled code.
- Every statement in a document is graded and cited: a capture under `screens/` (`[Observed]`) or a `path:line` in code (`[Code]`).
