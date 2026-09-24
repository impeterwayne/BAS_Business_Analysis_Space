---
name: device-control
description: Drive a connected Android device or emulator with `scrcpy-cli` — tap, swipe, type, launch apps, dump the UI hierarchy, take screenshots. Use when you need to put an app into a specific state to inspect it, automate a UI flow, or read what's on screen. The daemon is managed for you.
---

# Device control with `scrcpy-cli`

`scrcpy-cli <args>` gives low-latency, screen-free control of a device via a persistent
control-socket daemon (falls back to plain ADB shell calls when the daemon isn't running).
Use it to drive an app into the state you need to observe.

## The daemon is managed for you

The `device-daemon` hook starts and stops the `scrcpy-cli` daemon per session. **Do not run
`daemon start` / `daemon stop`** — just issue actions.

## Common actions

```bash
scrcpy-cli device-list                 # confirm a device is attached (-s <serial> to pick one)
scrcpy-cli app-start com.target.app    # launch the target
scrcpy-cli app-stop com.target.app
scrcpy-cli tap <x> <y>
scrcpy-cli swipe <x1> <y1> <x2> <y2> [ms]
scrcpy-cli write "text to type"
scrcpy-cli key <keycode>               # e.g. KEYCODE_ENTER, BACK
scrcpy-cli scroll <x> <y> <dx> <dy>
scrcpy-cli screenshot shot.png         # capture the screen
scrcpy-cli ui-dump layout.xml          # UI hierarchy XML -> coordinates for the next tap
scrcpy-cli clipboard-get | clipboard-set <text>
```

For an interactive mirror window instead of headless control: `scrcpy-cli mirror`.

## Workflow

1. `scrcpy-cli device-list` — confirm the device, note the serial if more than one.
2. `scrcpy-cli ui-dump layout.xml` — read node bounds to compute exact tap coordinates rather
   than guessing pixels.
3. Drive the flow (`app-start`, `tap`, `write`, ...), capturing a screenshot + dump at each state.

## Discipline

- Screenshots and UI dumps are scratch — keep the ones that matter under `docs/spec/screens/`.
- Device automation is for the target you were authorized to analyse; don't wander to other apps.

Full reference: `docs/scrcpy_control.md`.
