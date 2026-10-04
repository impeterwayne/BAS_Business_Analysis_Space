# Workspace Configuration Schema Reference

This reference details the structure and schema of the centralized configuration file **`config/workspace_config.json`**. 

All commands in **REA_Kit** (`rea init`, `rea download`, `rea decode`, `rea pull`) read from this configuration to resolve targets, locate output paths, and provision workspaces.

---

## Configuration File Layout

A standard configuration file contains three primary keys:

```json
{
  "workspaceRoot": "workspaces",
  "defaultStructure": {
    "apks": "apks",
    "jadx": "jadx_src",
    "docs": "docs",
    "native": "native",
    "traffic": "traffic",
    "runtime": {
      "base": "runtime",
      "internal": "runtime/internal",
      "external": "runtime/external"
    }
  },
  "targets": [
    "com.target.example",
    "https://play.google.com/store/apps/details?id=com.zodiac.horoscope.palmreader.scanpalmistry",
    {
      "packageName": "org.lichess.mobileV2",
      "alias": "Lichess",
      "source": "apkpure",
      "sourceLink": "https://play.google.com/store/apps/details?id=org.lichess.mobileV2"
    }
  ]
}
```

---

## Schema Property Reference

### 1. `workspaceRoot` (String)
* **Description:** Base directory where target workspace folders are created.
* **Default:** `workspaces`
* **Resolution:** Resolves relative to the repository root directory or current working directory.

### 2. `defaultStructure` (Object)
Defines the standard internal directory schema created for every target package.

| Path Key | Typical Value | Purpose |
|---|---|---|
| `apks` | `"apks"` | Directory where downloaded `.apk`, `.xapk`, and `.apks` files are stored. |
| `jadx` | `"jadx_src"` | Directory where JADX generates the decompiled Java Gradle project. |
| `docs` | `"docs"` | Directory for local reverse engineering notes, flow diagrams, and vulnerability reports. |
| `native` | `"native"` | Extracted `lib/<abi>/*.so` libraries, `native_manifest.json`, and the shared Ghidra project (`rea native`). |
| `traffic` | `"traffic"` | Captured API traffic snapshots written by `rea http events --save`. |
| `runtime.base` | `"runtime"` | Base folder for extracted dynamic app storage data. |
| `runtime.internal` | `"runtime/internal"` | Local mirror for `/data/data/<package_name>/` (SQLite databases, Shared Preferences XML). |
| `runtime.external` | `"runtime/external"` | Local mirror for `/sdcard/Android/data/<package_name>/` external app storage. |

> [!TIP]
> `WorkspaceManager` walks nested dictionary structures recursively. You can add arbitrary custom directory keys (e.g. `"mitm": "mitm_intercepts"`) and `rea init` will automatically provision them across all app workspaces.

### 3. `targets` (Array of Strings or Objects)
Maintains the centralized list of targets, URLs, aliases, and download configurations.

* **String Entry:** Simple package name (e.g. `"com.example.app"`) or Play Store link (`"https://play.google.com/store/apps/details?id=com.example.app"`).
* **Object Entry:**
  * **`packageName` (String):** Canonical Android package identifier (e.g. `org.lichess.mobileV2`).
  * **`alias` (String, Optional):** Friendly, short directory alias (e.g. `Lichess`).
  * **`source` (String, Optional):** Preferred APK download provider (`apkpure`, `rustore`, `nashstore`).
  * **`sourceLink` (String, Optional):** Original Play Store link or reference URL.

### 4. External Tool Locations (Optional)

Only needed when a tool is installed somewhere REA_Kit does not look by default. Each also has an
environment-variable equivalent, which takes precedence.

| Key | Environment variable | Purpose |
|---|---|---|
| `ghidraHome` | `GHIDRA_HOME` | Ghidra installation directory for `rea native`. Relative paths resolve against the project root. |
| `ghidraGuiPort` | `GHIDRA_GUI_PORT` | Port the Ghidra GUI plugin serves on (default `8089`). |
| `ghidraHeadlessPort` | `GHIDRA_HEADLESS_PORT` | Port `rea native serve` listens on (default `8192`). |
| `httpToolkitHome` | `HTK_DESKTOP_RESOURCES` / `HTK_DESKTOP_EXE` | HTTP Toolkit installation directory for `rea http`. |

---

## Dynamic Target Management via CLI (`rea target`)

You can inspect and modify targets directly using the `rea` CLI without manually editing JSON:

```bash
# 1. List all configured targets & workspace statuses
rea target list

# 2. Add target via Google Play Store URL
rea target add "https://play.google.com/store/apps/details?id=com.zodiac.horoscope.palmreader.scanpalmistry&hl=en_US"

# 3. Add target with explicit alias and download source
rea target add "ru.vk.store" --alias "VKStore" --source "rustore"

# 4. Remove target by package name or alias
rea target remove com.example.app
```

---

## Supported Target URL & ID Formats

REA_Kit automatically resolves package names from any of the following input formats:

| Format Type | Example Input | Extracted Package Name |
|---|---|---|
| **Google Play URL** | `https://play.google.com/store/apps/details?id=com.example.app` | `com.example.app` |
| **Localized Play Store URL** | `https://play.google.com/store/apps/details?id=com.example.app&hl=en_US&gl=US` | `com.example.app` |
| **Market URI** | `market://details?id=com.example.app` | `com.example.app` |
| **Store Web Link** | `https://apkcombo.com/facebook-lite/com.facebook.lite/` | `com.facebook.lite` |
| **Direct APK File URL** | `https://example.com/downloads/com.test.app.apk` | `com.test.app` |
| **Raw Package ID** | `com.example.app` | `com.example.app` |
