# REA_Kit CLI Reference Manual

The `rea` CLI provides a unified interface for every stage of Android reverse engineering, APK downloading, decompilation, runtime sandbox extraction, device automation, and environment configuration.

---

## Global Usage & Syntax

```bash
rea [command] [positional_arg] [options]
```

### Global Options

These options apply across all relevant subcommands:

| Flag | Long Option | Description |
|---|---|---|
| `-w` | `--workspace <dir>` | Custom workspace root directory path (Defaults to `./workspaces`). |
| `-c` | `--config <file>` | Path to workspace configuration file (Defaults to `config/workspace_config.json`). |

---

## Complete Commands Directory

| Command | Aliases | Description | Primary Example |
|---|---|---|---|
| [`rea init`](#1-rea-init) | | Provision workspace directories for targets | `rea init com.example.app` |
| [`rea download`](#2-rea-download--rea-dl) | `dl` | Download APK/XAPK packages via `apkd` | `rea dl com.example.app` |
| [`rea decode`](#3-rea-decode--rea-decompile) | `decompile` | Decompile APKs into Java Gradle projects via JADX | `rea decode com.example.app` |
| [`rea native`](./native_analysis.md) | `so`, `nat` | Extract `.so` libraries and analyze them via headless/GUI Ghidra (GhidraMCP) | `rea native serve com.example.app --lib libfoo -d` |
| [`rea http`](./http_toolkit.md) | `htk`, `traffic` | Listen to captured API traffic (bare `rea http` streams live) | `rea http -g "login\|token"` |
| [`rea pull`](#4-rea-pull--rea-runtime) | `runtime` | Extract app sandbox files via ADB (root/su/run-as) | `rea pull com.example.app` |
| [`rea pipeline`](#5-rea-pipeline--rea-all--rea-run) | `all`, `run` | Execute complete static pipeline (init -> dl -> decode) | `rea pipeline -t com.example.app` |
| [`rea scrcpy`](#6-rea-scrcpy--rea-control) | `control` | Low-latency device automation via `scrcpy-cli` | `rea scrcpy tap 500 1200` |
| [`rea mirror`](#7-rea-mirror--rea-screen) | `screen` | Launch desktop screen mirroring window | `rea mirror -s emulator-5554` |
| [`rea jadx-gui`](#8-rea-jadx-gui) | | Launch interactive graphical JADX decompiler | `rea jadx-gui -t com.example.app` |
| [`rea apktool`](#9-rea-apktool) | | Disassemble / reassemble APKs using APKTool | `rea apktool d app.apk -o out` |
| [`rea target`](#10-rea-target) | | Inspect, add, or remove target apps | `rea target list` |
| [`rea env`](#11-rea-env--rea-check) | `check` | Diagnostics report for prerequisites and connected devices | `rea env` |
| [`rea install`](#12-rea-install--rea-setup--rea-setup-path) | `setup`, `setup-path` | Install & configure environment, tools, and Windows PATH | `rea install` |

---

## Detailed Command Specifications

### 1. `rea init`
Provisions isolated target folders (`apks/`, `jadx_src/`, `docs/`, `runtime/`) and creates target metadata.

```bash
rea init [target] [options]
```

| Flag | Long Option | Description |
|---|---|---|
| | `[target]` | Optional positional package name or Google Play URL |
| `-t` | `--target <pkg_or_url>` | Target package name or Play Store URL |
| `-i` | `--input <file>` | Path to custom input text file containing package list |
| `-w` | `--workspace <dir>` | Custom workspace root directory path |
| `-c` | `--config <file>` | Path to `workspace_config.json` |

```bash
# Initialize all targets from config
rea init

# Initialize single target directly
rea init com.example.app
rea init "https://play.google.com/store/apps/details?id=com.example.app"
```

---

### 2. `rea download` (`rea dl`)
Downloads APK or Split APK (`.xapk`, `.apks`) archives from remote sources into `workspaces/<package>/apks/`.

```bash
rea download [target] [options]
```

| Flag | Long Option | Description |
|---|---|---|
| | `[target]` | Optional positional package name or Play Store URL |
| `-l` | `--link <url_or_pkg>` | Direct Play Store URL or package name |
| `-t` | `--target <pkg_or_alias>` | Target package name or configured alias |
| `-s` | `--source <provider>` | Pin a source (`apkpure`, `rustore`, `nashstore`); falls back to all sources if it fails |
| | `--targets <file>` | Path to custom targets text file |

```bash
# Download all targets configured in workspace_config.json
rea dl

# Download single package
rea dl com.zodiac.horoscope.palmreader.scanpalmistry

# Download from RuStore
rea dl ru.vk.store -s rustore
```

---

### 3. `rea decode` (`rea decompile`)
Decompiles APK/XAPK archives into a clean Java Gradle project using JADX with CPU multi-threading and JVM heap safeguards.

```bash
rea decode [target] [options]
```

| Flag | Long Option | Description | Default |
|---|---|---|---|
| | `[target]` | Optional positional package name or alias | Active target |
| `-t` | `--target <pkg_or_alias>` | Target package name or alias | Active target |
| `-l` | `--link <url_or_pkg>` | Direct URL or package name to decode | None |
| `-j` | `--threads <n>` | JADX worker threads | Auto-detected CPU cores |
| | `--heap <size>` | JVM Heap allocation memory | `8g` |

```bash
# Decompile active / all targets
rea decode

# Decompile specific target with 16 GB heap
rea decode com.example.app --heap 16g -j 8
```

---

### 4. `rea pull` (`rea runtime`)
Extracts internal app databases (SQLite), Shared Preferences (XML), and caches via ADB directly from the device sandbox.

```bash
rea pull [package_name] [options]
```

| Flag | Long Option | Description |
|---|---|---|
| | `[package_name]` | Target Android package name (positional) |
| `-p`, `-t` | `--package`, `--target` | Target package name |

```bash
# Pull runtime data for active target
rea pull

# Pull runtime data for specific package
rea pull com.zodiac.horoscope.palmreader.scanpalmistry
```

---

### 5. `rea pipeline` (`rea all`, `rea run`)
Executes the automated static pipeline workflow (init -> download -> decode) sequentially.

```bash
rea pipeline [target] [options]
```

| Flag | Long Option | Description |
|---|---|---|
| | `[target]` | Target package name or Play Store URL (positional) |
| `-t` | `--target <target>` | Target package name or Play Store URL |
| `-s` | `--source <provider>` | APK download source repository |
| `-j` | `--threads <count>` | Worker threads for JADX decompilation (default: CPU cores) |
| | `--heap <size>` | JVM Heap memory allocation (default: `16g`, e.g. `16g`, `8g`) |
| | `--skip-decode` | Skip the JADX decompilation phase |

```bash
rea pipeline -t https://play.google.com/store/apps/details?id=com.zodiac.horoscope.palmreader.scanpalmistry --heap 16g
```

---

### 6. `rea scrcpy` (`rea control`)
Automates Android devices with sub-millisecond latency using the bundled `scrcpy-cli` engine.

```bash
rea scrcpy [daemon|action] [args...]
```

```bash
# Daemon Management
rea scrcpy daemon start
rea scrcpy daemon status
rea scrcpy daemon stop

# Gestures & Input
rea scrcpy tap 540 1200
rea scrcpy swipe 540 1600 540 400 300
rea scrcpy write "Search term"
rea scrcpy key HOME

# Capture & UI Dump
rea scrcpy screenshot app_home.png
rea scrcpy ui-dump layout.xml
```

---

### 7. `rea mirror` (`rea screen`)
Launches a real-time interactive desktop screen mirroring window.

```bash
rea mirror [options]
```

| Flag | Long Option | Description |
|---|---|---|
| `-s` | `--serial <serial>` | Specific Android device serial |
| `-m` | `--max-size <size>` | Limit max video dimensions (e.g. `1280`) |
| | `--fps <fps>` | Limit video frame rate (e.g. `60`) |

```bash
rea mirror -s emulator-5554 -m 1280 --fps 60
```

---

### 8. `rea jadx-gui`
Launches the interactive graphical JADX decompiler with optional automatic APK loading.

```bash
# Open blank JADX GUI
rea jadx-gui

# Open JADX GUI and load target app's APK
rea jadx-gui com.example.app
```

---

### 9. `rea apktool`
Direct CLI wrapper for the bundled APKTool binary for smali and resource disassembly.

```bash
# Disassemble APK
rea apktool d app.apk -o smali_dir

# Reassemble APK
rea apktool b smali_dir -o rebuilt.apk
```

---

### 10. `rea target`
Inspects, registers, and removes target applications in `workspace_config.json`.

```bash
# List configured targets and workspace directory statuses
rea target list

# Add target from Google Play URL
rea target add "https://play.google.com/store/apps/details?id=com.example.app"

# Add target with custom alias and source
rea target add com.example.app --alias "CustomApp" --source "rustore"

# Remove target
rea target remove com.example.app
```

---

### 11. `rea env` (`rea check`)
Runs comprehensive diagnostic checks on Python, Java JDK, Node.js, bundled binaries, and connected ADB devices.

```bash
rea env
```

---

### 12. `rea install` (`rea setup`, `rea setup-path`)
Automated installer and environment configurator for REA_Kit across Linux, macOS, and Windows. Automatically registers PATH for all bundled tools (`rea`, `adb`, `scrcpy`, `jadx`, `apkd`, `apktool`, `scrcpy-cli`), configures runtime environment variables, bundles platform native binaries for `scrcpy` & `adb` (v4.1), compiles `apkd` via Go, downloads and configures **Ghidra 12.x** and **GhidraMCP**, and registers the `reakit` Python package.

```bash
# Standard complete installation across all platforms (Permanent)
./install.sh        # Linux / macOS
install.bat         # Windows
rea install         # CLI direct

# Custom installation flags
rea install --skip-ghidra # Skip automatic Ghidra release download
rea install --skip-pip    # Skip pip editable install
rea install --skip-npm    # Skip npm scrcpy-cli linking
rea install --session     # Configure PATH for current terminal session only
rea install --check       # Check installation & environment status
```
