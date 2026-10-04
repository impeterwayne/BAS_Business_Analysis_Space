---
trigger: always_on
---

# BA Device Automation Rules (mobilerun MCP)

Apply whenever you call tools from the `mobilerun` MCP server.

## Target

- The device is auto-detected over ADB, or pinned with `MOBILERUN_DEVICE` in `.agents/plugins/mobilerun/mcp_config.json` (the workspace plugin).
- Confirm the device is reachable and awake (`ping_device`, `get_device_status`) before a flow.
- Operate only the app you were asked to analyse. System dialogs that belong to the flow (permissions)
  are fine; wandering into other apps or the Settings app is not.

## Perception is ground truth

- Never guess coordinates or layout. Observe with `read_screen` or `perceive_screen` before acting.
- `som_id`s belong to one observation; any action makes them stale. Re-observe instead of reusing them.
- After each action, read `post_action_observation` to confirm the change before the next step.
- If an action fails or is blocked, re-observe; do not repeat the same tap.

## Safety

- Do not perform payments, top-ups, transfers, purchases, subscriptions, sign-ups, posts, messages or
  deletions without the user's explicit approval for that specific action.
- Never type real personal data (names, phone numbers, national IDs, card numbers). Use only test data the
  user supplies.
- Never write passwords, OTPs or tokens to any file, note or `record_finding`.
- `stop_app(..., clear_data=true)` wipes the app's login and data: ask first.
- The raw `adb` MCP tool is disabled by default; use `run_command` only for read-only queries such as
  `dumpsys package` or copying a captured screenshot into `docs/`.
