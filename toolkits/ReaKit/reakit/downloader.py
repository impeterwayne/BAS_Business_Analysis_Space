import os
import subprocess
from pathlib import Path
from reakit.config import ConfigManager, CORE_DIR
from reakit.workspace import WorkspaceManager
from reakit.utils import extract_package_name, log_info, log_success, log_warn, log_error

class Downloader:
    def __init__(self, config_mgr: ConfigManager | None = None, apkd_path: Path | str | None = None):
        self.config_mgr = config_mgr or ConfigManager()
        self.workspace_mgr = WorkspaceManager(self.config_mgr)
        self.apkd_path = Path(apkd_path) if apkd_path else self._find_apkd()

    def _find_apkd(self) -> Path:
        apkd_name = "apkd.exe" if os.name == "nt" else "apkd"
        candidates = [
            CORE_DIR / "apkdgo" / "bin" / apkd_name,
            CORE_DIR / "apkdgo" / "apkd" / apkd_name,
            CORE_DIR / "apkdgo" / apkd_name,
        ]
        for cand in candidates:
            if cand.is_file():
                return cand
        return Path(apkd_name)

    def download_package(
        self,
        target: str,
        output_dir: Path | str | None = None,
        source: str | None = None,
        extra_args: list[str] | None = None,
    ) -> bool:
        """Downloads a single package using apkd."""
        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            log_error(f"Could not resolve package name from '{target}'")
            return False

        # Initialize workspace structure
        self.workspace_mgr.init_target(pkg, source_link=target if target.startswith("http") else None)
        
        # Determine output directory
        if not output_dir:
            paths = self.config_mgr.get_app_paths(pkg)
            out_path = paths["apks"]
        else:
            out_path = Path(output_dir)

        out_path.mkdir(parents=True, exist_ok=True)
        log_info(f"Downloading package '{pkg}' to {out_path.resolve()}...")

        # apkd already falls back across every source it queries; a pinned
        # source narrows that to one, so widen back out if it fails.
        if self._run_apkd(pkg, out_path, source, extra_args):
            return True
        if source:
            log_warn(f"Source '{source}' failed for {pkg}; retrying with all sources...")
            return self._run_apkd(pkg, out_path, None, extra_args)
        return False

    def _run_apkd(
        self,
        pkg: str,
        out_path: Path,
        source: str | None,
        extra_args: list[str] | None,
    ) -> bool:
        cmd = [str(self.apkd_path.resolve()), "-p", pkg, "-O", str(out_path.resolve())]
        if source:
            cmd.extend(["-s", source])
        if extra_args:
            cmd.extend(extra_args)

        cwd = str(self.apkd_path.parent.resolve()) if self.apkd_path.is_file() else None
        try:
            res = subprocess.run(cmd, cwd=cwd)
            downloaded_files = [
                f for f in out_path.iterdir()
                if f.is_file() and f.suffix in (".apk", ".xapk", ".apks")
            ]
            if res.returncode == 0 and downloaded_files:
                log_success(f"Successfully downloaded {pkg} ({len(downloaded_files)} package(s) present in {out_path.name})")
                return True
            else:
                if not downloaded_files:
                    log_error(f"Download failed for {pkg}: No APK/XAPK packages were saved in {out_path.resolve()}")
                else:
                    log_error(f"Download process failed for {pkg} (exit code {res.returncode})")
                return False
        except FileNotFoundError:
            log_error(f"apkd executable not found at '{self.apkd_path}'. Please check core/apkdgo/apkd.exe")
            return False
        except Exception as e:
            log_error(f"Unexpected error during download: {e}")
            return False

    def download_targets(
        self,
        targets_file: Path | str | None = None,
        link: str | None = None,
        source: str | None = None,
    ) -> int:
        """Downloads all packages from a targets file, link, or workspace config."""
        if link:
            success = self.download_package(link, source=source)
            return 1 if success else 0

        targets = self.config_mgr.targets
        if targets_file:
            lines = self.config_mgr.read_targets_file(targets_file)
        else:
            lines = [t.get("sourceLink") or t.get("packageName") for t in targets if t.get("packageName")]

        if not lines:
            log_warn("No targets found to download.")
            log_info("Tip: Run 'rea dl <package_or_url>' or 'rea target add <package_or_url>'.")
            return 0

        success_count = 0
        for line in lines:
            if self.download_package(line, source=source):
                success_count += 1

        log_info(f"Completed downloads: {success_count}/{len(lines)} successful.")
        return success_count
