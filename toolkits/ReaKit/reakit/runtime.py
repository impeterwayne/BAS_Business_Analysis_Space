import os
import shlex
import subprocess
from pathlib import Path
from reakit.config import ConfigManager
from reakit.utils import (
    extract_package_name,
    get_safe_relative_parts,
    ensure_dir,
    log_info,
    log_success,
    log_warn,
    log_error,
)

class RuntimeExtractor:
    def __init__(self, config_mgr: ConfigManager | None = None):
        self.config_mgr = config_mgr or ConfigManager()

    def _run_cmd(self, cmd: list[str] | str) -> tuple[str, str, int]:
        """Runs a subprocess command and returns (stdout, stderr, returncode)."""
        if isinstance(cmd, list):
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        else:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
        return res.stdout.strip(), res.stderr.strip(), res.returncode

    def _pull_file(self, package_name: str, remote_path: str, local_path: Path, access_mode: str) -> bool:
        """Pulls a single remote file using the determined privilege access mode."""
        if access_mode == "native_root":
            pull_cmd = ["adb", "exec-out", "cat", remote_path]
        elif access_mode == "su":
            pull_cmd = ["adb", "exec-out", "su", "-c", f"cat {shlex.quote(remote_path)}"]
        elif access_mode == "shell":
            pull_cmd = ["adb", "exec-out", "cat", remote_path]
        else:
            pull_cmd = ["adb", "exec-out", "run-as", package_name, "cat", remote_path]

        ensure_dir(local_path.parent)
        with open(local_path, "wb") as f:
            res = subprocess.run(pull_cmd, stdout=f, stderr=subprocess.PIPE)
            return res.returncode == 0

    def _extract_tree(
        self,
        package_name: str,
        label: str,
        base_dir: str,
        output_dir: Path,
        file_list: str,
        access_mode: str,
    ) -> int:
        files = [line.strip() for line in file_list.splitlines() if line.strip() and "Permission denied" not in line]
        log_info(f"Found {len(files)} {label} files to extract.")

        pulled_count = 0
        for remote_path in files:
            safe_parts = get_safe_relative_parts(remote_path, base_dir)
            if not safe_parts:
                continue

            local_path = output_dir.joinpath(*safe_parts)
            if self._pull_file(package_name, remote_path, local_path, access_mode):
                log_success(f"Pulled {label}: {remote_path} -> {local_path}")
                pulled_count += 1
            else:
                log_error(f"Failed to pull {label}: {remote_path}")
                if local_path.exists() and local_path.stat().st_size == 0:
                    local_path.unlink()

        return pulled_count

    def extract_package(self, target: str) -> bool:
        """Pulls internal and external runtime data for an Android application."""
        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            log_error(f"Could not resolve package name from '{target}'")
            return False

        paths = self.config_mgr.get_app_paths(pkg)
        internal_out = paths["runtime_internal"]
        external_out = paths["runtime_external"]
        ensure_dir(internal_out)
        ensure_dir(external_out)

        log_info(f"Target Package: {pkg}")
        log_info(f"Internal output directory: {internal_out}")
        log_info(f"External output directory: {external_out}")

        # Check adb connection
        _, _, ret = self._run_cmd(["adb", "devices"])
        if ret != 0:
            log_error("ADB not found or not working. Make sure ADB is running and in PATH.")
            return False

        base_dir = f"/data/data/{pkg}"

        # Elevate ADB daemon
        log_info("Elevating ADB daemon to root...")
        self._run_cmd(["adb", "root"])

        is_native_root = False
        is_su = False

        # 1. Check native root
        stdout, stderr, ret = self._run_cmd(["adb", "shell", "find", base_dir, "-type", "f"])
        if not stderr and ret == 0 and stdout:
            log_success("Native 'adb root' access confirmed.")
            is_native_root = True
        else:
            # 2. Check Magisk su
            su_cmd = f"su -c 'find {base_dir} -type f'"
            stdout, stderr, ret = self._run_cmd(f'adb shell "{su_cmd}"')
            if ret == 0 and stdout and "Permission denied" not in stderr:
                log_success("Magisk 'su' access confirmed.")
                is_su = True
            else:
                # 3. Fallback to run-as
                log_info("Root unavailable. Attempting 'run-as' fallback...")
                stdout, stderr, ret = self._run_cmd(["adb", "shell", "run-as", pkg, "find", base_dir, "-type", "f"])

        if not stdout or "is not debuggable" in stderr or "Permission denied" in stderr:
            log_warn("Sandbox access blocked. Ensure app is installed, device is rooted, or app is debuggable.")
            if stderr:
                log_error(f"ADB error: {stderr}")
            return False

        internal_mode = "native_root" if is_native_root else ("su" if is_su else "run_as")
        self._extract_tree(pkg, "internal", base_dir, internal_out, stdout, internal_mode)

        # External storage directories
        external_base_dirs = [
            f"/sdcard/Android/data/{pkg}",
            f"/storage/emulated/0/Android/data/{pkg}",
        ]
        for ext_dir in external_base_dirs:
            ext_stdout, ext_stderr, ext_ret = self._run_cmd(["adb", "shell", "find", ext_dir, "-type", "f"])
            if ext_ret == 0 and ext_stdout and "No such file or directory" not in ext_stderr:
                log_info(f"External runtime files detected under {ext_dir}")
                self._extract_tree(pkg, "external", ext_dir, external_out, ext_stdout, "shell")
                break

        log_success(f"Runtime data extraction complete for {pkg}!")
        return True
