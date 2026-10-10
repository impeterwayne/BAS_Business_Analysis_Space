import os
import shutil
import zipfile
import subprocess
from pathlib import Path
from reakit.config import ConfigManager, CORE_DIR
from reakit.utils import log_info, log_success, log_warn, log_error

# Same JVM options jadx.bat passes, for when the jar is launched directly.
JADX_DEFAULT_JVM_OPTS = [
    "-XX:+IgnoreUnrecognizedVMOptions",
    "-Xms256M",
    "-XX:MaxRAMPercentage=70.0",
    "-XX:ParallelGCThreads=3",
    "-Djdk.util.zip.disableZip64ExtraFieldValidation=true",
    "--enable-native-access=ALL-UNNAMED",
]


def _short_path(path: Path) -> str:
    """The 8.3 short form of an existing Windows path, or "" when the volume has short names turned off."""
    if os.name != "nt":
        return ""
    import ctypes
    buf = ctypes.create_unicode_buffer(32768)
    n = ctypes.windll.kernel32.GetShortPathNameW(str(path), buf, len(buf))
    return buf.value if 0 < n < len(buf) else ""


def _long_path(path: Path) -> Path:
    """path in the \\\\?\\ form on Windows, so Python reaches files past the 260-character limit.

    JADX output mirrors the app's Java packages and runs past 260 characters once the project folder is deep;
    without the prefix Python only gets there when Windows' LongPathsEnabled is on. Never hand this form to java.exe.
    """
    if os.name != "nt":
        return path
    s = os.path.abspath(path)
    if s.startswith("\\\\?\\"):
        return Path(s)
    if s.startswith("\\\\"):  # UNC share: \\server\share -> \\?\UNC\server\share
        return Path("\\\\?\\UNC\\" + s[2:])
    return Path("\\\\?\\" + s)


def _count_sources(out_path: Path) -> int:
    """Number of .java and .kt files JADX wrote, however deep they sit."""
    count = 0
    for _, _, files in os.walk(_long_path(out_path)):
        count += sum(1 for f in files if f.endswith((".java", ".kt")))
    return count


def _java_safe_path(path: Path, cwd: Path) -> str | None:
    """A spelling of path that survives java.exe on Windows, or None.

    java.exe decodes its arguments with the ANSI code page, so C:\\Users\\Nguyễn\\... arrives as Nguy?n and the
    file is not found. Any ASCII spelling works: the absolute path, the path relative to the working directory
    (the non-ASCII part is often the shared parent), or the 8.3 short name.
    """
    forms = [str(path)]
    try:
        forms.append(os.path.relpath(path, cwd))
    except ValueError:  # on another drive
        pass
    forms.append(_short_path(path))
    return next((f for f in forms if f and f.isascii()), None)


class Decompiler:
    def __init__(self, config_mgr: ConfigManager | None = None, jadx_path: Path | str | None = None):
        self.config_mgr = config_mgr or ConfigManager()
        self.jadx_path = Path(jadx_path) if jadx_path else self._find_jadx()

    def _find_jadx(self) -> Path:
        jadx_name = "jadx.bat" if os.name == "nt" else "jadx"
        bundled = CORE_DIR / "jadx" / "bin" / jadx_name
        if bundled.exists():
            return bundled
        return Path(jadx_name)

    def _java_launcher(self, env: dict) -> tuple[str, Path] | None:
        """java.exe and the bundled jadx jar, when jadx.bat should be bypassed (Windows, bundled jadx).

        Going straight to java lets every path be passed in an ASCII form, and keeps cmd.exe from expanding
        %NAME% inside a quoted folder name. Without Java this returns None and jadx.bat reports it.
        """
        if os.name != "nt" or self.jadx_path.parent != CORE_DIR / "jadx" / "bin":
            return None
        jars = sorted((CORE_DIR / "jadx" / "lib").glob("jadx-*-all.jar"))
        java_home = env.get("JAVA_HOME", "").strip('"')
        java = Path(java_home) / "bin" / "java.exe" if java_home else None
        java = str(java) if java and java.exists() else shutil.which("java")
        if not jars or not java:
            return None
        return java, jars[-1]

    def _run_jadx(
        self,
        output_dir: Path,
        cpu_count: str,
        input_files: list[str],
        extra_flags: list[str] | None,
        env: dict,
    ) -> int:
        cwd = output_dir.parent
        launcher = self._java_launcher(env)
        if launcher is None:
            cmd = self._build_jadx_cmd([str(self.jadx_path)], str(output_dir), cpu_count, input_files, extra_flags)
            return subprocess.run(cmd, env=env).returncode

        java, jar = launcher
        paths = [jar, output_dir, *map(Path, input_files)]
        safe = [_java_safe_path(p, cwd) for p in paths]
        bad = [str(p) for p, s in zip(paths, safe) if s is None]
        if bad:
            log_error(
                "Java cannot open these paths because they contain non-English characters and Windows has no "
                f"short name for them: {', '.join(bad)}. Move the project (or BA Space) to a folder with only "
                "English letters."
            )
            return 1
        prefix = [java, *JADX_DEFAULT_JVM_OPTS, *env.get("JAVA_OPTS", "").split(), *env.get("JADX_OPTS", "").split(),
                  "-cp", safe[0], "jadx.cli.JadxCLI"]
        cmd = self._build_jadx_cmd(prefix, safe[1], cpu_count, safe[2:], extra_flags)
        return subprocess.run(cmd, env=env, cwd=cwd).returncode

    def _build_jadx_cmd(
        self,
        launcher: list[str],
        output_dir: str,
        cpu_count: str,
        input_files: list[str],
        extra_flags: list[str] | None = None,
    ) -> list[str]:
        cmd = [
            *launcher,
            "-d", output_dir,
            "-j", cpu_count,
            "--export-gradle",
            "--show-bad-code",
            "--deobf",
            "--deobf-res-name-source", "auto",
            "--use-source-name-as-class-name-alias", "if-better",
            "--use-kotlin-methods-for-var-names", "apply",
            "--use-headers-for-detect-resource-extensions",
            "-Pkotlin-metadata.class-alias=yes",
            "-Pkotlin-metadata.method-args=yes",
            "-Pkotlin-metadata.fields=yes",
            "-Pkotlin-metadata.companion=yes",
            "-Pkotlin-metadata.data-class=yes",
            "-Pkotlin-metadata.to-string=yes",
            "-Pkotlin-metadata.getters=yes",
            "-Pkotlin-smap.class-alias-source-dbg=yes",
            "-Pdex-input.verify-checksum=no",
            "--add-debug-lines",
            "--comments-level", "debug",
            "--respect-bytecode-access-modifiers",
            "--no-inline-anonymous",
            "--no-inline-methods",
            "--no-replace-consts",
        ]
        if extra_flags:
            cmd.extend(extra_flags)
        cmd.extend(input_files)
        return cmd

    def decompile_package(
        self,
        target: str,
        input_dir: Path | str | None = None,
        output_dir: Path | str | None = None,
        threads: int | None = None,
        heap_memory: str = "16g",
        extra_flags: list[str] | None = None,
    ) -> bool:
        """Decompiles a package APK or split APKs using JADX with max quality options."""
        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            log_error(f"Could not resolve package name from '{target}'")
            return False

        paths = self.config_mgr.get_app_paths(pkg)
        in_path = Path(input_dir) if input_dir else paths["apks"]
        out_path = Path(output_dir) if output_dir else paths["jadx"]

        if not in_path.exists():
            log_warn(f"APK directory not found for {pkg}: {in_path}")
            return False

        out_path.mkdir(parents=True, exist_ok=True)

        # JVM Heap Memory & Security limits Safeguard
        env = os.environ.copy()
        env["JADX_OPTS"] = f"-Xmx{heap_memory} -Xms2g -XX:+UseG1GC"
        env["JADX_ZIP_MAX_ENTRIES_COUNT"] = "1000000"
        env["JADX_DISABLE_ZIP_SECURITY"] = "true"
        env["JADX_DISABLE_XML_SECURITY"] = "true"

        cpu_count = str(threads or os.cpu_count() or 8)

        # Look for APK archives
        archive_items = list(in_path.iterdir())
        apks_found = False
        all_succeeded = True

        for item in archive_items:
            if item.is_file() and item.suffix == ".apk":
                apks_found = True
                log_info(f"Decoding standard APK {item.name} for {pkg} -> {out_path}...")
                log_info(f"Running JADX on {item.name} with {heap_memory} heap (threads: {cpu_count})...")
                returncode = self._run_jadx(out_path, cpu_count, [str(item)], extra_flags, env)
                src_count = _count_sources(out_path)
                if returncode == 0:
                    log_success(f"Decompilation complete for {item.name} ({src_count} source files)")
                elif src_count > 0:
                    log_success(f"Decompilation completed for {item.name} ({src_count} source files generated; obfuscation warnings handled via --show-bad-code)")
                else:
                    log_error(f"JADX exited with code {returncode} and produced no source files.")
                    all_succeeded = False

            elif item.is_file() and item.suffix in (".xapk", ".apks"):
                apks_found = True
                extract_dir = in_path / f"{item.name}_extracted"
                if not extract_dir.exists():
                    log_info(f"Extracting split archive {item.name}...")
                    try:
                        with zipfile.ZipFile(_long_path(item), "r") as zip_ref:
                            zip_ref.extractall(_long_path(extract_dir))
                    except zipfile.BadZipFile:
                        log_error(f"Corrupted or invalid zip archive: {item.name}")
                        all_succeeded = False
                        continue

                long_extract_dir = _long_path(extract_dir)
                # Plain spellings for java.exe, which gets them through _java_safe_path
                extracted_apks = [str(extract_dir / f.relative_to(long_extract_dir)) for f in long_extract_dir.rglob("*.apk")]
                if not extracted_apks:
                    log_warn(f"No .apk files found inside {item.name}")
                    all_succeeded = False
                    continue

                log_info(f"Decoding {item.name} ({len(extracted_apks)} split APKs) for {pkg} -> {out_path}...")
                log_info(f"Running JADX on split APKs with {heap_memory} heap (threads: {cpu_count})...")
                returncode = self._run_jadx(out_path, cpu_count, extracted_apks, extra_flags, env)
                src_count = _count_sources(out_path)
                if returncode == 0:
                    log_success(f"Decompilation complete for {item.name} ({src_count} source files)")
                elif src_count > 0:
                    log_success(f"Decompilation completed for {item.name} ({src_count} source files generated; obfuscation warnings handled via --show-bad-code)")
                else:
                    log_error(f"JADX exited with code {returncode} and produced no source files.")
                    all_succeeded = False

        if not apks_found:
            log_warn(f"No .apk, .xapk, or .apks files found in {in_path}")
            return False

        return all_succeeded

    def decompile_targets(
        self,
        targets_file: Path | str | None = None,
        link: str | None = None,
        threads: int | None = None,
        heap_memory: str = "8g",
    ) -> int:
        """Decompiles all targets from a file, link, or workspace config."""
        if link:
            success = self.decompile_package(link, threads=threads, heap_memory=heap_memory)
            return 1 if success else 0

        targets = self.config_mgr.targets
        if targets_file:
            lines = self.config_mgr.read_targets_file(targets_file)
        else:
            lines = [t.get("packageName") for t in targets if t.get("packageName")]

        if not lines:
            log_warn("No targets found to decompile.")
            log_info("Tip: Run 'rea decode <package_or_url>' or 'rea target add <package_or_url>'.")
            return 0

        success_count = 0
        for line in lines:
            if self.decompile_package(line, threads=threads, heap_memory=heap_memory):
                success_count += 1

        log_info(f"Completed decompilations: {success_count}/{len(lines)} successful.")
        return success_count

    def launch_gui(self, target: str | None = None):
        """Launches JADX GUI, optionally loading target APK."""
        gui_name = "jadx-gui.bat" if os.name == "nt" else "jadx-gui"
        gui_path = CORE_DIR / "jadx" / "bin" / gui_name
        if not gui_path.exists():
            gui_path = Path(gui_name)

        cmd = [str(gui_path)]
        if target:
            pkg = self.config_mgr.resolve_package_name(target)
            if pkg:
                paths = self.config_mgr.get_app_paths(pkg)
                apks = list(paths["apks"].glob("*.apk")) if paths["apks"].exists() else []
                if apks:
                    cmd.append(str(apks[0]))

        log_info(f"Launching JADX GUI: {' '.join(cmd)}")
        subprocess.Popen(cmd)

    def run_apktool(self, args: list[str]) -> int:
        """Runs bundled apktool with specified arguments."""
        apktool_jar = CORE_DIR / "apktool" / "apktool.jar"
        if not apktool_jar.exists():
            log_error("apktool.jar not found in core/apktool/")
            return 1
        cmd = ["java", "-jar", str(apktool_jar.resolve())] + args
        log_info(f"Running: {' '.join(cmd)}")
        res = subprocess.run(cmd)
        return res.returncode
