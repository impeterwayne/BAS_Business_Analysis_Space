import os
import json
from pathlib import Path
from reakit.utils import extract_package_name, ensure_dir

KIT_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = KIT_DIR  # Alias for backward compatibility
CORE_DIR = KIT_DIR / "core"
DOCS_DIR = KIT_DIR / "docs"
KIT_CONFIG_DIR = KIT_DIR / "config"

DEFAULT_STRUCTURE = {
    "apks": "apks",
    "jadx": "jadx_src",
    "docs": "docs",
    "native": "native",
    "traffic": "traffic",
    "runtime": {
        "base": "runtime",
        "internal": "runtime/internal",
        "external": "runtime/external",
    },
}

USER_GLOBAL_CONFIG_PATH = Path.home() / ".reakit" / "config.json"
DEFAULT_CONFIG_PATH = None
DEFAULT_TARGETS_PATH = None

def find_config_file(explicit_path: Path | str | None = None) -> Path | None:
    """Discovers the active configuration file in CWD, user home, or explicit path."""
    if explicit_path:
        p = Path(explicit_path)
        return p if p.exists() or explicit_path else None

    # 1. Look in Current Working Directory
    cwd = Path.cwd()
    candidates = [
        cwd / "rea.config.json",
        cwd / "workspace_config.json",
        cwd / ".rea.json",
        cwd / "are.config.json",
        cwd / ".are.json",
        cwd / "config" / "workspace_config.json",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate

    # 2. Look in User Home Directory (~/.reakit/config.json or legacy ~/.arekit/config.json)
    if USER_GLOBAL_CONFIG_PATH.is_file():
        return USER_GLOBAL_CONFIG_PATH
    legacy_global = Path.home() / ".arekit" / "config.json"
    if legacy_global.is_file():
        return legacy_global

    return None

def find_targets_file(explicit_path: Path | str | None = None) -> Path | None:
    """Discovers the active targets file in CWD or explicit path."""
    if explicit_path:
        p = Path(explicit_path)
        return p if p.exists() or explicit_path else None

    # Check Current Working Directory
    cwd = Path.cwd()
    candidates = [
        cwd / "targets.txt",
        cwd / "config" / "targets.txt",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate

    return None

class ConfigManager:
    def __init__(
        self,
        config_path: Path | str | None = None,
        workspace_root: Path | str | None = None,
    ):
        self.explicit_config = config_path is not None
        self.config_path = Path(config_path) if self.explicit_config else find_config_file()
        self._workspace_root_override = Path(workspace_root) if workspace_root else None
        self.config_data = self._load_config()

    def _default_config(self) -> dict:
        return {
            "workspaceRoot": "workspaces",
            "defaultStructure": DEFAULT_STRUCTURE,
            "targets": [],
        }

    def _load_config(self) -> dict:
        if not self.config_path or not self.config_path.exists():
            return self._default_config()
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "defaultStructure" not in data:
                    data["defaultStructure"] = DEFAULT_STRUCTURE
                if "targets" not in data:
                    if "apps" in data:
                        data["targets"] = data.pop("apps")
                    else:
                        data["targets"] = []
                return data
        except Exception as e:
            print(f"[!] Error loading config {self.config_path}: {e}")
            return self._default_config()

    def save(self, target_path: Path | str | None = None):
        """Saves current config data back to disk."""
        save_path = Path(target_path) if target_path else self.config_path
        if not save_path:
            save_path = Path.cwd() / "workspace_config.json"
            self.config_path = save_path

        # Protect against mutating the kit repo template if executed elsewhere
        if save_path.resolve() == (KIT_CONFIG_DIR / "workspace_config.json").resolve() and Path.cwd().resolve() != KIT_DIR.resolve():
            save_path = Path.cwd() / "workspace_config.json"
            self.config_path = save_path

        ensure_dir(save_path.parent)
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(self.config_data, f, indent=2)

    @property
    def workspace_root(self) -> Path:
        # 1. Override from CLI / constructor
        if self._workspace_root_override:
            return self._workspace_root_override.resolve()

        # 2. Environment variable
        env_ws = os.environ.get("REA_WORKSPACE") or os.environ.get("ARE_WORKSPACE")
        if env_ws:
            return Path(env_ws).resolve()

        # 3. Config data workspaceRoot
        rel_root = self.config_data.get("workspaceRoot", "workspaces")
        root_path = Path(rel_root)
        if not root_path.is_absolute():
            if self.config_path and self.config_path.exists():
                # If config is in a 'config/' subfolder, treat its parent as project root
                if self.config_path.parent.name == "config":
                    base_dir = self.config_path.parent.parent
                else:
                    base_dir = self.config_path.parent
            else:
                base_dir = Path.cwd()
                root_path = base_dir / root_path
        return root_path.resolve()

    def set_workspace_root(self, path: Path | str):
        self._workspace_root_override = Path(path)

    @property
    def default_structure(self) -> dict:
        return self.config_data.get("defaultStructure", DEFAULT_STRUCTURE)

    @property
    def targets(self) -> list[dict]:
        """Returns a normalized list of target application dictionaries."""
        raw_targets = self.config_data.get("targets", [])
        normalized = []
        for item in raw_targets:
            if isinstance(item, str):
                pkg = extract_package_name(item) or item.strip()
                if pkg:
                    alias = pkg.split(".")[-1].capitalize()
                    entry = {"packageName": pkg, "alias": alias}
                    if item.startswith("http://") or item.startswith("https://"):
                        entry["sourceLink"] = item.strip()
                    normalized.append(entry)
            elif isinstance(item, dict):
                pkg = item.get("packageName") or item.get("package") or item.get("id")
                if pkg:
                    pkg_extracted = extract_package_name(str(pkg)) or str(pkg).strip()
                    alias = item.get("alias") or pkg_extracted.split(".")[-1].capitalize()
                    entry = dict(item)
                    entry["packageName"] = pkg_extracted
                    entry["alias"] = alias
                    normalized.append(entry)
        return normalized

    @property
    def apps(self) -> list[dict]:
        """Backward-compatible alias for self.targets."""
        return self.targets

    def get_app_lookup(self) -> dict[str, str]:
        """Maps package names and aliases to their canonical package name."""
        lookup = {}
        for app in self.targets:
            pkg = app.get("packageName")
            if not pkg:
                continue
            lookup[pkg.lower()] = pkg
            lookup[pkg] = pkg
            alias = app.get("alias")
            if alias:
                lookup[alias.lower()] = pkg
                lookup[alias] = pkg
        return lookup

    def resolve_package_name(self, input_str: str) -> str | None:
        """Resolves an alias, raw package name, or URL to a package name."""
        if not input_str:
            return None
        stripped = input_str.strip()
        lookup = self.get_app_lookup()

        if stripped in lookup:
            return lookup[stripped]
        if stripped.lower() in lookup:
            return lookup[stripped.lower()]

        extracted = extract_package_name(stripped)
        if extracted:
            if extracted in lookup:
                return lookup[extracted]
            if extracted.lower() in lookup:
                return lookup[extracted.lower()]
            return extracted

        return stripped if "." in stripped else None

    def get_app_paths(self, package_name: str) -> dict[str, Path]:
        """Returns standard directory paths for a specific app package."""
        app_root = self.workspace_root / package_name
        struct = self.default_structure
        apks_rel = struct.get("apks", "apks")
        jadx_rel = struct.get("jadx", "jadx_src")
        docs_rel = struct.get("docs", "docs")
        runtime_struct = struct.get("runtime", {})
        if isinstance(runtime_struct, dict):
            internal_rel = runtime_struct.get("internal", "runtime/internal")
            external_rel = runtime_struct.get("external", "runtime/external")
        else:
            internal_rel = "runtime/internal"
            external_rel = "runtime/external"

        native_struct = struct.get("native", "native")
        native_rel = native_struct.get("base", "native") if isinstance(native_struct, dict) else native_struct

        traffic_struct = struct.get("traffic", "traffic")
        traffic_rel = traffic_struct.get("base", "traffic") if isinstance(traffic_struct, dict) else traffic_struct

        return {
            "root": app_root,
            "apks": app_root / apks_rel,
            "jadx": app_root / jadx_rel,
            "docs": app_root / docs_rel,
            "native": app_root / native_rel,
            "traffic": app_root / traffic_rel,
            "ghidra_project": app_root / native_rel / "ghidra_project",
            "runtime_internal": app_root / internal_rel,
            "runtime_external": app_root / external_rel,
            "target_info": app_root / "target_info.txt",
        }

    def add_target(
        self,
        package_or_url: str,
        alias: str | None = None,
        source: str | None = None,
        auto_save: bool = True,
    ) -> bool:
        """Adds a target application to config if not already present."""
        if not package_or_url:
            return False

        stripped = package_or_url.strip()
        pkg = extract_package_name(stripped) or stripped

        # Check existing
        existing_pkgs = [t.get("packageName") for t in self.targets]
        if pkg in existing_pkgs:
            return False

        if not alias:
            alias = pkg.split(".")[-1].capitalize()

        entry = {"packageName": pkg, "alias": alias}
        if stripped.startswith("http://") or stripped.startswith("https://"):
            entry["sourceLink"] = stripped
        if source:
            entry["source"] = source

        raw_targets = self.config_data.get("targets", [])
        raw_targets.append(entry)
        self.config_data["targets"] = raw_targets
        if "apps" in self.config_data:
            del self.config_data["apps"]

        if auto_save:
            self.save()
        return True

    def add_app(self, package_name: str, alias: str | None = None, auto_save: bool = True) -> bool:
        """Backward-compatible alias for add_target."""
        return self.add_target(package_name, alias=alias, auto_save=auto_save)

    def remove_target(self, package_or_alias: str, auto_save: bool = True) -> bool:
        """Removes a target application from config."""
        if not package_or_alias:
            return False

        identifier = package_or_alias.strip()
        raw_targets = self.config_data.get("targets", [])
        initial_len = len(raw_targets)

        filtered = []
        for t in raw_targets:
            if isinstance(t, str):
                pkg = extract_package_name(t) or t.strip()
                if pkg != identifier and t != identifier:
                    filtered.append(t)
            elif isinstance(t, dict):
                pkg = t.get("packageName") or t.get("package")
                alias = t.get("alias")
                if pkg != identifier and alias != identifier:
                    filtered.append(t)

        if len(filtered) != initial_len:
            self.config_data["targets"] = filtered
            if "apps" in self.config_data:
                del self.config_data["apps"]
            if auto_save:
                self.save()
            return True
        return False

    def remove_app(self, package_name: str, auto_save: bool = True) -> bool:
        """Backward-compatible alias for remove_target."""
        return self.remove_target(package_name, auto_save=auto_save)

    def read_targets_file(self, file_path: Path | str | None = None) -> list[str]:
        """Reads target URLs / package lines from a targets text file or JSON config."""
        if file_path:
            p = Path(file_path)
            if p.is_file():
                if p.suffix.lower() == ".json":
                    mgr = ConfigManager(p)
                    return [t["packageName"] for t in mgr.targets if "packageName" in t]
                with open(p, "r", encoding="utf-8") as f:
                    return [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
        
        # Fallback to configured targets in JSON
        if self.targets:
            return [t.get("sourceLink") or t.get("packageName") for t in self.targets if t.get("packageName")]

        p = find_targets_file()
        if p and p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

        return []
