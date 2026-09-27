---
description: Check that the mobilerun MCP server, ADB and the Mobilerun Portal are ready for competitor app analysis
---

Health-check the device pipeline before `/ba-competitor`.

**Steps**

1. Call `ping_device`. If the `mobilerun` tools are not available at all, tell the user the MCP server is not registered: open BA Space → Agent Toolkit → BAKit → "Mobilerun MCP (Antigravity)", or run `toolkits/BAKit/scripts/install-bakit.ps1 -RegisterMcp`, then restart the Antigravity agent.
2. Call `get_device_status` and report: serial, screen size, power state (`awake`?), foreground app, battery.
3. If `ping_device` fails, call `doctor` and summarise its findings. Common fixes:
   - `device_unreachable` → `adb devices`; set `MOBILERUN_DEVICE` in the MCP config when several devices are attached.
   - `unauthorized` → accept the USB-debugging prompt on the phone.
   - Portal not enabled → Settings › Accessibility › Mobilerun Portal, or `mobilerun setup -d <serial>`.
4. Call `list_devices` when more than one device may be attached, and say which one the server targets.
5. Report a one-line verdict in Vietnamese: ready / not ready, and the fix if not ready. Do not open or operate any app.
