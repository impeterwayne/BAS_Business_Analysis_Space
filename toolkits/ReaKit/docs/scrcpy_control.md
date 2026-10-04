# Android Device Control & Automation Guide

**REA_Kit** integrates [`@impeterwayne/scrcpy-cli`](https://github.com/impeterwayne/scrcpy_cli) as a core module to enable low-latency, agent-friendly Android device automation and real-time screen mirroring.

---

## Architecture: Fast Daemon vs. ADB Fallback

```mermaid
graph LR
    User[User / Agent / Pipeline] -->|rea scrcpy / rea control| CLI[scrcpy-cli Engine]
    CLI -->|Daemon Running| Socket[scrcpy Control Socket :27183]
    Socket -->|Sub-millisecond Latency| Server[scrcpy-server on Device]
    CLI -->|Daemon Inactive| ADB[Direct ADB Shell Execution]
    ADB --> OS[Android OS]
```

1. **Daemon Mode (Recommended):** Keeps a persistent `scrcpy-server` connection open via TCP socket forwarding. Touch events, text entry, key injection, screenshots, and UI dumps execute in single-digit milliseconds without spawning separate ADB processes.
2. **Direct ADB Fallback:** If the background daemon is not running, commands automatically fall back to standard ADB shell executions.

---

## Daemon Lifecycle

```bash
# Start background daemon for default device
rea scrcpy daemon start

# Check daemon running status
rea scrcpy daemon status

# Run daemon in foreground (useful for debugging)
rea scrcpy daemon run

# Stop background daemon
rea scrcpy daemon stop
```

### Targeting Specific Devices
```bash
rea scrcpy -s emulator-5554 daemon start
```

---

## Action Commands Reference

### 1. Touch & Gestures
```bash
# Tap coordinate (x, y)
rea scrcpy tap 540 1200

# Swipe from (x1, y1) to (x2, y2) with duration in ms
rea scrcpy swipe 540 1600 540 400 300

# Scroll at coordinate (x, y) by (dx, dy)
rea scrcpy scroll 540 1200 0 -200
```

### 2. Text Input & Keycodes
```bash
# Type text into focused input field
rea scrcpy write "Search query text"

# Press named Android keys
rea scrcpy key HOME
rea scrcpy key BACK
rea scrcpy key ENTER
rea scrcpy key VOLUME_UP
rea scrcpy key POWER

# Press numeric Android keycode
rea scrcpy key 3
```

### 3. Screen Capture & UI Inspection
```bash
# Capture screenshot (saves to screenshot.png by default)
rea scrcpy screenshot app_screen.png

# Dump UI hierarchy XML (saves to ui-dump.xml by default)
rea scrcpy ui-dump layout.xml
```

### 4. Clipboard Operations
```bash
# Read device clipboard
rea scrcpy clipboard-get

# Set device clipboard
rea scrcpy clipboard-set "Sample auth token"
```

### 5. Application Management
```bash
# Launch application
rea scrcpy app-start com.zodiac.horoscope.palmreader.scanpalmistry

# Force-stop application
rea scrcpy app-stop com.zodiac.horoscope.palmreader.scanpalmistry

# List installed packages
rea scrcpy app-list
```

### 6. Device Diagnostics
```bash
# Display model, Android version, SDK, and resolution
rea scrcpy device-info

# List all connected ADB devices
rea scrcpy device-list
```

---

## Interactive Screen Mirroring (`rea mirror` / `rea screen`)

To launch a desktop screen mirroring window with full mouse and keyboard interaction:

```bash
# Launch interactive mirror on default device
rea mirror

# Mirror specific device serial with custom max resolution & frame rate
rea mirror -s emulator-5554 -m 1280 --fps 60

# Pass extra scrcpy flags
rea mirror -- --stay-awake --turn-screen-off
```

### Mirror Options

| Flag | Long Option | Description |
|---|---|---|
| `-s` | `--serial <serial>` | Specific Android device serial |
| `-m` | `--max-size <size>` | Limit video width and height (e.g. `1280`) |
| | `--fps <fps>` | Limit video frame rate (e.g. `60`) |
