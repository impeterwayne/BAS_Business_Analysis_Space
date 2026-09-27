---
description: Survey a competitor Android app on the connected device (mobilerun MCP) and write BA competitor docs from templates
---

Survey a competitor (opponent) app and turn it into BA deliverables.

**Input**: `/ba-competitor <app name or package> [flows…] [compare <our reference>]`
Examples: `/ba-competitor MoMo onboarding transfer`, `/ba-competitor com.vnpay.wallet login compare docs/project-fsd.md`

**Steps**

1. **Load the skill.** Follow `.agents/skills/competitor-app-analysis/SKILL.md` exactly. Keep `ba-device-automation` and `ba-global-rules` in force throughout.

2. **Confirm inputs before touching the device.** App, flows in scope (default: onboarding + primary navigation), and which account to use (guest, or a test account the user provides). Check `.agents/config/ba-project-config.md` → Competitor Apps for known packages and notes. Ask for anything missing.

3. **Pre-flight.** `ping_device`, `get_device_status`, `lookup_app`, record the app version, create `docs/BA/competitor/<app-slug>/screens/`, `set_plan` with one step per flow. If the device is unreachable, stop and suggest `/ba-device-check`.

4. **Explore and capture each flow.** Capture screenshot + UI tree at every new state before acting; keep a coverage frontier; one action per step; stop at walls and outward actions (payment, transfer, sign-up, post, delete) and ask.

5. **Write the documents** from `ba-templates`: screen inventory, one flow analysis per flow, the app profile, and — only if a comparison reference was given — the feature comparison & gap report.

6. **Close.** `stop_app` (no `clear_data`), `end_session`, then report in Vietnamese: files written, screens per flow, where exploration stopped and why, open questions, and suggested next step (usually `ba-brainstormer` on the top `GAP-*` items).

**Guardrails**
- Never create real accounts, pay, transfer, post or delete without explicit approval for that action.
- Never type real personal data; never write credentials into any file.
- Every statement in a document cites a capture under `screens/`.
