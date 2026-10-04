import os
from pathlib import Path
from reakit.config import ConfigManager, find_targets_file
from reakit.utils import extract_package_name, ensure_dir, log_info, log_success, log_warn, log_dim

def extract_structure_paths(structure_dict: dict) -> list[str]:
    """Recursively extracts directory paths from a nested dictionary."""
    paths = []
    for key, value in structure_dict.items():
        if isinstance(value, str):
            paths.append(value)
        elif isinstance(value, dict):
            paths.extend(extract_structure_paths(value))
    return paths

class WorkspaceManager:
    def __init__(self, config_mgr: ConfigManager | None = None):
        self.config_mgr = config_mgr or ConfigManager()

    def init_target(self, package_name: str, alias: str | None = None, source_link: str | None = None) -> Path:
        """Initializes workspace directories for a single target application."""
        paths = self.config_mgr.get_app_paths(package_name)
        app_root = paths["root"]
        ensure_dir(app_root)

        # Save metadata file
        target_info = paths["target_info"]
        with open(target_info, "w", encoding="utf-8") as f:
            f.write(f"Package: {package_name}\n")
            if alias:
                f.write(f"Alias: {alias}\n")
            if source_link:
                f.write(f"Source URL: {source_link}\n")

        # Provision all subdirectories
        structure = self.config_mgr.default_structure
        subdirs = extract_structure_paths(structure)
        subdirs.sort(key=len)

        for subdir in subdirs:
            target_dir = app_root / subdir
            ensure_dir(target_dir)

        # Add to config if not present
        self.config_mgr.add_app(package_name, alias)
        return app_root

    def init_from_targets(self, targets_file: Path | str | None = None) -> list[str]:
        """Initializes workspaces from targets in a file or config."""
        lines = self.config_mgr.read_targets_file(targets_file)
        if not lines:
            target_source = targets_file or "active configuration"
            log_warn(f"No targets found in {target_source}")
            return []

        initialized = []
        for line in lines:
            pkg = extract_package_name(line) or line
            if pkg:
                alias = pkg.split(".")[-1].capitalize()
                app_path = self.init_target(pkg, alias=alias, source_link=line if line.startswith("http") else None)
                log_success(f"Initialized workspace for: {pkg} (Alias: {alias}) -> {app_path}")
                initialized.append(pkg)
            else:
                log_warn(f"Could not parse package name from target: {line}")
        return initialized

    def init_all(self, input_file: Path | str | None = None) -> list[str]:
        """Initializes all configured targets or targets from an input file / config."""
        if input_file:
            return self.init_from_targets(input_file)

        targets = self.config_mgr.targets
        if not targets:
            log_warn("No target applications configured in active configuration.")
            log_info(f"Target workspace root is: {self.config_mgr.workspace_root}")
            log_info("Tip: Run 'rea target add <package_or_url>' or 'rea init <package_or_url>'.")
            return []

        initialized = []
        for t in targets:
            pkg = t.get("packageName")
            if pkg:
                alias = t.get("alias")
                source_link = t.get("sourceLink")
                app_path = self.init_target(pkg, alias=alias, source_link=source_link)
                log_success(f"Initialized workspace for: {pkg} (Alias: {alias}) -> {app_path}")
                initialized.append(pkg)
        return initialized

    def list_workspaces(self) -> list[dict]:
        """Inspects and returns a summary of all existing workspace directories."""
        root = self.config_mgr.workspace_root
        if not root.exists():
            return []

        workspaces = []
        for item in root.iterdir():
            if item.is_dir():
                paths = self.config_mgr.get_app_paths(item.name)
                apk_count = len(list(paths["apks"].glob("*.apk"))) + len(list(paths["apks"].glob("*.xapk"))) + len(list(paths["apks"].glob("*.apks"))) if paths["apks"].exists() else 0
                decompiled = paths["jadx"].exists() and bool(list(paths["jadx"].iterdir()))
                runtime_files = sum(1 for _ in paths["runtime_internal"].rglob("*") if _.is_file()) if paths["runtime_internal"].exists() else 0
                native_libs = len(list(paths["native"].rglob("*.so"))) if paths["native"].exists() else 0
                workspaces.append({
                    "package": item.name,
                    "path": item,
                    "apks": apk_count,
                    "decompiled": decompiled,
                    "native_libs": native_libs,
                    "runtime_files": runtime_files,
                })
        return workspaces
