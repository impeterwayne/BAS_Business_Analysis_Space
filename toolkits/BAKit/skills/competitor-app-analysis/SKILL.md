---
name: competitor-app-analysis
description: >-
  Explores a competitor (opponent) Android app on a connected device through the `mobilerun` MCP server,
  captures a screenshot and accessibility tree at every screen, and writes BA deliverables from templates:
  app profile, screen inventory, per-flow analysis, and a feature comparison / gap analysis with candidate
  requirements. When the APK has been decoded with jadx, it follows an exploration plan built from the
  `apk-code-index` notes and records which code predictions the device confirmed. Use when the user asks to
  analyse, benchmark, survey, or document a competitor app, or runs /ba-competitor.
---

# Competitor App Analysis

You produce an evidence-backed picture of what a competitor app does, then turn it into requirements input
for our product. The screen is the ground truth: every observed claim cites a screenshot or UI tree you
captured. When the APK was decoded (ReaKit `jadx_src/`), the code tells you where to look — which screens
exist, how to reach them, which rules and hidden branches to check — and the device tells you what is true.
You operate the app; you never modify, patch or repackage it.

Tools: the `mobilerun` MCP server (see the `mobilerun` skill for the full tool list) plus file writes.
Templates: `ba-templates` catalog keys `competitor-profile`, `competitor-screens`, `competitor-flow`,
`comparison-gap`. Code side: the `apk-code-index` skill.

In the `/ba-competitor` pipeline the work is split: `code-scout` agents write `code-index/` notes, `ba-lead`
writes `exploration-plan.md`, `competitor-analyst` runs Phase 1 once per flow (WALK) and Phase 2 once at the
end (SYNTHESIZE), and `evidence-verifier` checks the result. Run alone, do all phases yourself in order.

## Inputs (ask for anything missing before touching the device)

| Input | Example | Required |
| :--- | :--- | :--- |
| App | `"MoMo"` or `com.mservice.momotransfer` | Yes |
| Flows in scope | onboarding, login, transfer money, search | Yes (default: onboarding + primary navigation) |
| Account | guest / test account provided by user | Yes — never create a real account yourself |
| Our product reference | `docs/project-fsd.md`, a Figma link, or "none" | Only for the comparison step |
| Decoded source | ReaKit `…/<package>/jadx_src` | No — without it the survey is black-box |

Also read `.agents/config/ba-project-config.md` → **Competitor Apps** table; it may already hold the
package, device serial and account notes.

## Output Layout

```
docs/BA/competitor/
  {app-slug}/
    screens/{flow}-{NN}-{slug}.png         screenshot per state
    screens/{flow}-{NN}-{slug}.tree.txt    accessibility tree per state
    code-index/_meta.md, screens.md, …       apk_index.py build output (apk-code-index)
    code-index/flow-{flow}.md               code-scout notes with a Verify-on-device checklist
    exploration-plan.md                     per flow: entry, expected screens, checklist, results
    {app-slug}_profile_{YYYYMMDD}_v1.md
    {app-slug}_screens_{YYYYMMDD}_v1.md
    {app-slug}_flow-{flow}_{YYYYMMDD}_v1.md
  {topic}_comparison_{YYYYMMDD}_v1.md      when comparing against our product / other apps
```

`{app-slug}` is lowercase-kebab (for example `momo`). Versions follow `ba-naming-convention`: never overwrite,
write `v2` instead.

## Procedure

### Phase 0 — Pre-flight

1. `ping_device` then `get_device_status`. Confirm the screen is `awake` and note the serial and
   resolution. If the device is unreachable, stop and tell the user to run `/ba-device-check`.
2. Resolve the package: `lookup_app(app_name=...)`. If several candidates match, ask the user.
3. Record the app version with a shell command:
   `adb -s <serial> shell dumpsys package <package> | findstr versionName` (Windows) — or `grep` on POSIX.
4. Create `docs/BA/competitor/{app-slug}/screens/`.
5. `set_plan(steps=[one step per flow], goal="Survey <app> flows", deliverable="BA competitor docs")`.

### Phase 1 — Explore and capture (per flow)

1. `mark_step(index=i, status="in_progress")`. Read the flow's section of `exploration-plan.md` when there is
   one. Enter the flow the way it says: `open_deeplink(uri=…, package_name=…)` or
   `start_app(app_id=…, activity=…)` for a deep link or exported activity, otherwise `open_and_settle` (or
   `launch_app`) and navigate. A direct entry that fails is itself a finding; fall back to the UI.
2. **At every new state, capture before you act:**
   - `screenshot_path` → copy the returned file to `screens/{flow}-{NN}-{slug}.png` with a shell copy
     (`Copy-Item <path> <dest>` on Windows).
   - `get_ui_tree` → write the `tree` text to `screens/{flow}-{NN}-{slug}.tree.txt`.
   - Number states in visit order (`01`, `02`, …). `{slug}` names the screen in 1–3 kebab words.
3. **Read the screen:** `read_screen` for text and layout; `perceive_screen` when you need to see icons,
   visual state, or `read_screen` ends with ESCALATE. Use `detail="full"` only for icon-only controls the
   tree does not label, and treat its red boxes as guesses.
4. **Work the plan's Verify-on-device checklist first**, then the frontier. Mark each item `observed`
   (capture), `not reached` (why) or `contradicted` (code says X, screen shows Y — cite both) and write the
   results into the plan's `Results:` line for the flow.
5. **Keep a coverage frontier.** For each screen, list its actionable elements and mark which you have
   tried. Prefer an untried element on the current screen over re-walking a recorded path. Go depth-first:
   finish a branch (or reach a dead end and `press_back`) before trying a sibling.
6. **Act one step at a time** with `tap_text`, `tap(som_id=...)` or `type_text`, and write down the action
   that caused each transition (`tap "Tiếp tục (Continue)" → 03`). Read `post_action_observation` to
   confirm the screen changed before the next step. `som_id`s are stale after any action.
7. Record verified facts with `record_finding(item=..., quote=<exact text on screen>)` — prices, limits,
   validation messages, plan names. Put interim facts in `mark_step(..., note=...)`; the pixels are gone
   next turn.
8. When the flow is exhausted or blocked, `mark_step(index=i, status="done" | "skipped" | "failed", note=why)`.

### Phase 2 — Write the documents

Fill templates exactly as `ba-templates` describes. The generation strategy adapts to the active branch:

#### Mode A: Device-Verified Mode (with captures from `mobilerun`)
1. **Screen inventory** (`competitor-screens`): one section per captured state, elements taken from the `.tree.txt` (resource-id, label), labels in original language with English in parentheses.
2. **Flow analysis** (`competitor-flow`), one file per flow: step table, Mermaid state diagram, observed rules, friction, coverage.
3. **App profile** (`competitor-profile`): overview, survey scope, feature map (`CF-NNN`), strengths, weaknesses, boundaries, open questions. Includes tech section from `code-index/tech.md` and code-only features section.
4. **Comparison / gap** (`comparison-gap`): feature matrix, `GAP-NNN` list, and `FR-CAND-NNN` candidate requirements.

#### Mode B: Static Code-Only Mode (without `mobilerun` / no device)
When running without a device (`--code-only` or `--no-device`):
1. **Screen inventory** (`competitor-screens`): derived from layout XMLs (`res/layout/*.xml`), Jetpack Compose composables, and activity/fragment view bindings. Elements list resource IDs, view classes, and `@string/...` text values. In metadata, set `Thiết bị (Device): None (Static Code Analysis — jadx_src)`.
2. **Flow analysis** (`competitor-flow`): steps derived from Activity/Fragment transitions, navigation actions (`NavController.navigate`, `startActivity`), and intent extras. State diagram drawn as Mermaid flowchart. Validation rules table extracted from validator classes, min/max limits, and error string resources. Every rule and step cites `[Code] path/to/Class.java:line`.
3. **App profile** (`competitor-profile`): generated from `_meta.md`, `tech.md`, `packages.md`, and `screens.md`. Feature catalog `CF-NNN` covers all discovered feature modules.
4. **Comparison / gap** (`comparison-gap`): compares competitor code capabilities directly against our reference. Every proposal is marked `[Code]` or `[Inferred]`.

Candidates (`FR-CAND-NNN`) are proposals; they enter the FSD only after the user confirms (then run `specs analyze`).

### Phase 3 — Close

1. `stop_app(app_id=<package>)` — never with `clear_data=true` unless the user asked (it wipes the login).
2. `end_session(outcome="success" | "partial" | "failure", goal_type="navigate", reason=...)`.
3. Report to the user in Vietnamese: files written, screens captured per flow, what was blocked and why,
   and open questions.

## Hard Rules

- **Three evidence grades, never blurred.** "The field rejected 11 digits with message X" is observed —
  `[Observed]`, cites a capture. "`PhoneValidator.java:41` rejects more than 10 digits" is code —
  `[Code]`, cites `path:line`. "The field validates phone numbers" is inference — label it
  `[Inferred]` and say what it rests on. A code fact never becomes observed until the device shows it.
- **No secrets from code.** API keys, tokens and credentials found in decoded code are named, never quoted.
- **No destructive or outward actions without an explicit yes:** registering accounts, sending messages,
  posting, payments, top-ups, transfers, subscriptions, deleting data, granting account-linking consent.
  Stop at the confirm button, capture it, record it as a boundary, and ask.
- **No real personal data.** Never type real names, phone numbers, ID numbers or card numbers. Use data the
  user gave you for testing; otherwise stop at the form and record its fields.
- **Credentials never touch files.** If the user types a password or OTP for you, do not write it to any
  document, note, or finding.
- **Do not guess past a wall.** Login you lack credentials for, OTP you cannot receive, paywall, region
  block: record the wall as the last state. An invented next screen poisons everything downstream.
- **Stay in the target app.** Do not wander into other apps or system settings beyond what the flow
  requires (a permission dialog is part of the flow; the Settings app is not).
- **Evidence is durable.** Keep captures for every state referenced in a document; delete captures of
  states you passed through and did not document.
