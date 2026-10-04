# Workspace Setup & Management Guide

This guide covers the directory schema, automated workspace provisioning, and target lifecycle management in **REA_Kit**.

To maintain a clean separation of work, each target Android application is allocated an isolated workspace directory containing downloaded packages, decompiled Java sources, notes, and runtime databases.

---

## Isolated Workspace Schema

The workspace layout is provisioned dynamically based on `config/workspace_config.json`. When initialized, each target directory follows a standardized schema:

```text
workspaces/<package_name>/
├── apks/                                      # Downloaded APK, XAPK, or APKS split archives
├── jadx_src/                                  # Decompiled Java Gradle project (JADX)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/
│   │       └── resources/
│   ├── build.gradle
│   └── settings.gradle
├── native/                                    # Extracted native .so libraries & Ghidra projects
│   ├── arm64-v8a/                             # Per-ABI native shared libraries
│   ├── ghidra_project/                        # Persistent Ghidra analysis database
│   └── native_manifest.json                   # ELF fingerprints, packer detection, JNI exports
├── docs/                                      # Local analyst notes, flow diagrams, and threat models
├── runtime/                                   # Extracted sandbox files (ADB)
│   ├── internal/                              # /data/data/<package_name> (databases, shared_prefs)
│   └── external/                              # /sdcard/Android/data/<package_name>
└── target_info.txt                            # Target metadata, source URL, and timestamp
```

---

## Workspace Initialization via CLI (`rea init`)

The `rea init` command reads targets from your configuration file or accepts target identifiers on the command line to create the full directory hierarchy.

### Command Syntax

```bash
rea init [target] [options]
```

### Options

| Flag | Long Option | Description | Default |
|---|---|---|---|
| | `[target]` | Package name or Google Play URL (positional) | None |
| `-t` | `--target <pkg_or_url>` | Single package name or link to initialize | None |
| `-i` | `--input <file>` | Path to custom plain text targets file | None |
| `-w` | `--workspace <dir>` | Custom workspace root directory path | `./workspaces` |
| `-c` | `--config <file>` | Path to workspace configuration file | `config/workspace_config.json` |

---

### Practical Examples

#### 1. Initialize All Targets in Configuration
Initializes directories for all applications defined in `workspace_config.json`:
```bash
rea init
```

#### 2. Initialize a Specific Target Package
```bash
rea init com.zodiac.horoscope.palmreader.scanpalmistry
```

#### 3. Initialize from a Google Play Store URL
```bash
rea init "https://play.google.com/store/apps/details?id=com.zodiac.horoscope.palmreader.scanpalmistry"
```

---

## Target Management (`rea target`)

You can inspect, add, and remove targets dynamically using the `rea target` subcommand:

### 1. List Configured Targets & Workspace Status
Inspect all configured targets and see if they have downloaded APKs, decompiled code, or extracted runtime files:
```bash
rea target list
```

*Example Output:*
```text
REA_Kit Project Context:
  * Active Config:  config\workspace_config.json
  * Workspace Root: workspaces

Configured Target Applications (2):
  1. com.zodiac.horoscope.palmreader.scanpalmistry (Alias: Scanpalmistry) (https://play.google.com/store/apps/details?id=com.zodiac.horoscope.palmreader.scanpalmistry)
  2. ru.vk.store (Alias: VKStore) [Source: rustore]

Workspace Directory Status (2):
  * com.zodiac.horoscope.palmreader.scanpalmistry: 1 APK(s), Decompiled, 4 runtime files (workspaces\com.zodiac.horoscope.palmreader.scanpalmistry)
  * org.lichess.mobileV2: 1 APK(s), Decompiled, 0 runtime files (workspaces\org.lichess.mobileV2)
```

### 2. Add a New Target Application
Add targets using package IDs or direct Play Store links (with optional custom aliases and download source providers):
```bash
# Add via Google Play Store URL
rea target add "https://play.google.com/store/apps/details?id=com.example.app"

# Add with custom alias and source repository
rea target add com.example.app --alias "CustomApp" --source "apkpure"
```

### 3. Remove a Target Application
Remove a target from your active configuration by package name or alias:
```bash
rea target remove com.example.app
```
