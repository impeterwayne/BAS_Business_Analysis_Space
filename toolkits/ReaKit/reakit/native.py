"""Native (ELF / .so) extraction and Ghidra-driven analysis for REA_Kit.

This module covers the native half of an Android target:

* :class:`NativeExtractor` pulls ``lib/<abi>/*.so`` (and embedded ``assets``
  libraries) out of APK / XAPK / split archives and fingerprints each one with
  a dependency-free ELF parser.
* :class:`GhidraMcpServer` runs the GUI-free GhidraMCP backend
  (``com.xebyte.headless.GhidraMCPHeadlessServer``) from core/ghidra_mcp with a
  chosen ``.so`` loaded, exposing the REST API on the headless port (default 8192).
* :class:`GhidraMcpClient` turns that API into CLI commands, driven by the
  upstream endpoint spec, so every MCP tool is reachable from the shell - and
  the same server also backs the MCP bridge used by AI clients.
"""

import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import time
import zipfile
from pathlib import Path
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

from reakit.config import ConfigManager, CORE_DIR, KIT_DIR
from reakit.utils import (
    Colors,
    ensure_dir,
    log_dim,
    log_error,
    log_info,
    log_success,
    log_warn,
    sanitize_filename,
)

# Predefined ports: the Ghidra GUI plugin serves its fixed default (8089); the
# headless server uses a separate port so both can run at once without colliding.
DEFAULT_GUI_PORT = 8089
DEFAULT_HEADLESS_PORT = 8192
DEFAULT_MCP_URL = f"http://127.0.0.1:{DEFAULT_HEADLESS_PORT}"


def _config_port(config_mgr: "ConfigManager | None", key: str, env: str, fallback: int) -> int:
    """Resolves a port: env var > config value > fallback constant."""
    val = os.environ.get(env)
    if val and val.isdigit():
        return int(val)
    if config_mgr is not None:
        cfg = config_mgr.config_data.get(key)
        if isinstance(cfg, int):
            return cfg
        if isinstance(cfg, str) and cfg.isdigit():
            return int(cfg)
    return fallback


def gui_port(config_mgr: "ConfigManager | None" = None) -> int:
    """The port the Ghidra GUI plugin serves on (config: ghidraGuiPort)."""
    return _config_port(config_mgr, "ghidraGuiPort", "GHIDRA_GUI_PORT", DEFAULT_GUI_PORT)


def headless_port(config_mgr: "ConfigManager | None" = None) -> int:
    """The port `rea native serve` listens on (config: ghidraHeadlessPort)."""
    return _config_port(config_mgr, "ghidraHeadlessPort", "GHIDRA_HEADLESS_PORT", DEFAULT_HEADLESS_PORT)

# Android ABI directory names, in preference order for analysis.
ABI_PREFERENCE = (
    "arm64-v8a",
    "armeabi-v7a",
    "armeabi",
    "x86_64",
    "x86",
    "riscv64",
    "mips64",
    "mips",
)

# ---------------------------------------------------------------------------
# ELF parsing (stdlib only - REA_Kit ships with zero Python dependencies)
# ---------------------------------------------------------------------------

ET_TYPES = {0: "NONE", 1: "REL", 2: "EXEC", 3: "DYN", 4: "CORE"}

EM_MACHINES = {
    3: ("x86", "x86"),
    8: ("MIPS", "mips"),
    20: ("PowerPC", None),
    40: ("ARM", "armeabi-v7a"),
    62: ("x86-64", "x86_64"),
    183: ("AArch64", "arm64-v8a"),
    243: ("RISC-V", "riscv64"),
}

DT_NEEDED = 1
DT_SONAME = 14
DT_RPATH = 15
DT_RUNPATH = 29
DT_INIT_ARRAY = 25
DT_FLAGS_1 = 0x6FFFFFFB

STB_GLOBAL = 1
STB_WEAK = 2

# Native libraries that identify a commercial packer / protector.
KNOWN_PACKERS = {
    "libjiagu": "360 Jiagu",
    "libprotectclass": "Baidu protect",
    "libdexhelper": "SecNeo (DexHelper)",
    "libdexjni": "SecNeo",
    "libsecshell": "Bangcle SecShell",
    "libsecexe": "Bangcle",
    "libsecmain": "Bangcle",
    "libexecmain": "Bangcle",
    "libmobisec": "Ali MobiSec",
    "libsgmain": "Alibaba Security Guard",
    "libsgsecuritybody": "Alibaba Security Guard",
    "libnesec": "NetEase NEsec",
    "libnqshield": "NQ Shield",
    "libtup": "Tencent Legu",
    "libshella": "Tencent Legu",
    "libtosprotection": "Tencent Legu",
    "libtprt": "Tencent TPRT",
    "libvirbox": "Virbox Protector",
    "libapktoolplus_jiagu": "APKToolPlus Jiagu",
    "libwtsecure": "Alibaba WTSecure",
    "libkwscmm": "Kuaishou protector",
}

# Libraries that reveal the runtime / framework an app was built with.
# Matched on the exact file stem - generic names like libapp / libmain would
# otherwise mislabel unrelated libraries (e.g. TikTok's libapplog_rust.so).
NOTABLE_LIBS_EXACT = {
    "libapp": "Flutter AOT snapshot (Dart code lives here)",
    "libmonosgen-2.0": "Mono runtime (Unity/Xamarin)",
    "libxamarin-app": "Xamarin assembly store",
    "libgodot_android": "Godot engine",
    "libgojni": "Go (gomobile) runtime",
    "libnode": "Node.js runtime",
    "libjsc": "React Native (JavaScriptCore)",
    "libssl": "OpenSSL / BoringSSL",
    "libcrypto": "OpenSSL / BoringSSL",
    "libsqlcipher": "SQLCipher (encrypted database)",
    "libconceal": "Facebook Conceal (crypto)",
    "libfbjni": "Facebook JNI helper",
    "libyoga": "React Native / Litho layout engine",
}

# Matched as a name prefix - these stems are distinctive enough to be safe.
NOTABLE_LIBS_PREFIX = {
    "libflutter": "Flutter engine",
    "libreactnativejni": "React Native bridge",
    "libhermes": "React Native (Hermes VM)",
    "libil2cpp": "Unity IL2CPP (C# compiled to native)",
    "libunity": "Unity engine",
    "libcocos2d": "Cocos2d-x engine",
    "libtensorflowlite": "TensorFlow Lite",
    "libopencv_java": "OpenCV",
    "libfrida-gadget": "Frida gadget embedded (!)",
    "libmsaoaidsec": "MSA OAID device-id SDK",
    "libv8_libfull": "V8 JavaScript engine",
}

# Non-ELF payloads that ship with a .so extension (dynamic feature modules,
# packed containers, compressed blobs). Keyed by leading magic bytes.
MAGIC_GUESSES = (
    (b"PK\x03\x04", "ZIP/JAR/APK archive"),
    (b"dex\n", "DEX bytecode (dynamic feature module)"),
    (b"dey\n", "ODEX bytecode"),
    (b"\x03\x00\x08\x00", "optimized DEX"),
    (b"\x7fKOM", "packed container (ByteDance KOM)"),
    (b"UPX!", "UPX-packed executable"),
    (b"\x1f\x8b", "gzip stream"),
    (b"BZh", "bzip2 stream"),
    (b"\xfd7zXZ", "xz stream"),
    (b"\x28\xb5/\xfd", "zstd stream"),
    (b"\x04\x22M\x18", "lz4 stream"),
    (b"7z\xbc\xaf", "7-zip archive"),
    (b"MZ", "Windows PE image"),
    (b"\xcf\xfa\xed\xfe", "Mach-O image"),
    (b"AGDX", "Android graphics blob"),
)


class ElfError(Exception):
    """Raised when a file is not a parseable ELF object."""


class ElfFile:
    """Minimal ELF reader: header, sections, dynamic table and dynsym."""

    def __init__(self, data: bytes):
        self.data = data
        if len(data) < 52 or data[:4] != b"\x7fELF":
            raise ElfError("not an ELF file (bad magic)")

        ei_class = data[4]
        ei_data = data[5]
        if ei_class == 1:
            self.bits = 32
        elif ei_class == 2:
            self.bits = 64
        else:
            raise ElfError(f"unknown ELF class {ei_class}")
        self.endian = "<" if ei_data == 1 else ">"
        self.osabi = data[7]

        fmt = self.endian + ("HHIQQQIHHHHHH" if self.bits == 64 else "HHIIIIIHHHHHH")
        if 16 + struct.calcsize(fmt) > len(data):
            raise ElfError("truncated ELF header")
        (
            self.e_type,
            self.e_machine,
            _e_version,
            self.e_entry,
            self.e_phoff,
            self.e_shoff,
            self.e_flags,
            _e_ehsize,
            self.e_phentsize,
            self.e_phnum,
            self.e_shentsize,
            self.e_shnum,
            self.e_shstrndx,
        ) = struct.unpack_from(fmt, data, 16)

        self.sections = self._read_sections()
        self._section_index = {s["name"]: s for s in self.sections}

    # -- sections ---------------------------------------------------------
    def _read_sections(self) -> list[dict]:
        if not self.e_shoff or not self.e_shnum:
            return []
        fmt = self.endian + ("IIQQQQIIQQ" if self.bits == 64 else "IIIIIIIIII")
        struct_size = struct.calcsize(fmt)
        entry_size = self.e_shentsize or struct_size

        raw = []
        for i in range(self.e_shnum):
            off = self.e_shoff + i * entry_size
            if off + struct_size > len(self.data):
                break
            (
                sh_name,
                sh_type,
                sh_flags,
                sh_addr,
                sh_offset,
                sh_size,
                sh_link,
                sh_info,
                _align,
                sh_entsize,
            ) = struct.unpack_from(fmt, self.data, off)
            raw.append(
                {
                    "name_off": sh_name,
                    "type": sh_type,
                    "flags": sh_flags,
                    "addr": sh_addr,
                    "offset": sh_offset,
                    "size": sh_size,
                    "link": sh_link,
                    "info": sh_info,
                    "entsize": sh_entsize,
                }
            )

        strtab = b""
        if 0 <= self.e_shstrndx < len(raw):
            shstr = raw[self.e_shstrndx]
            strtab = self.data[shstr["offset"] : shstr["offset"] + shstr["size"]]

        for s in raw:
            s["name"] = self._cstr(strtab, s.pop("name_off"))
        return raw

    @staticmethod
    def _cstr(blob: bytes, offset: int) -> str:
        if offset < 0 or offset >= len(blob):
            return ""
        end = blob.find(b"\x00", offset)
        if end == -1:
            end = len(blob)
        return blob[offset:end].decode("utf-8", "replace")

    def section_data(self, name: str) -> bytes:
        s = self._section_index.get(name)
        if not s or s["type"] == 8:  # SHT_NOBITS
            return b""
        return self.data[s["offset"] : s["offset"] + s["size"]]

    def has_section(self, name: str) -> bool:
        return name in self._section_index

    # -- dynamic ----------------------------------------------------------
    def dynamic_entries(self) -> list[tuple[int, int]]:
        blob = self.section_data(".dynamic")
        if not blob:
            return []
        fmt = self.endian + ("qQ" if self.bits == 64 else "iI")
        step = struct.calcsize(fmt)
        entries = []
        for off in range(0, len(blob) - step + 1, step):
            tag, val = struct.unpack_from(fmt, blob, off)
            if tag == 0:  # DT_NULL
                break
            entries.append((tag, val))
        return entries

    # -- symbols ----------------------------------------------------------
    def symbols(self, sym_section: str = ".dynsym", str_section: str = ".dynstr") -> list[dict]:
        sym_blob = self.section_data(sym_section)
        str_blob = self.section_data(str_section)
        if not sym_blob:
            return []
        fmt = self.endian + ("IBBHQQ" if self.bits == 64 else "IIIBBH")
        step = struct.calcsize(fmt)
        out = []
        for off in range(0, len(sym_blob) - step + 1, step):
            vals = struct.unpack_from(fmt, sym_blob, off)
            if self.bits == 64:
                st_name, st_info, _other, st_shndx, st_value, st_size = vals
            else:
                st_name, st_value, st_size, st_info, _other, st_shndx = vals
            name = self._cstr(str_blob, st_name)
            if not name:
                continue
            out.append(
                {
                    "name": name,
                    "bind": st_info >> 4,
                    "type": st_info & 0xF,
                    "shndx": st_shndx,
                    "value": st_value,
                    "size": st_size,
                }
            )
        return out


def parse_elf(path: Path | str) -> dict:
    """Fingerprints an ELF shared object. Never raises - errors land in ``error``."""
    path = Path(path)
    info: dict = {"valid": False, "error": None}
    try:
        data = path.read_bytes()
    except OSError as exc:
        info["error"] = str(exc)
        return info
    return parse_elf_bytes(data)


def identify_payload(data: bytes) -> dict:
    """Describes a non-ELF blob by its magic bytes."""
    for magic, label in MAGIC_GUESSES:
        if data.startswith(magic):
            return {"payload": label, "magic": data[:4].hex()}
    return {"payload": None, "magic": data[:4].hex()}


def parse_elf_bytes(data: bytes) -> dict:
    """Same as :func:`parse_elf` but operates on an in-memory buffer."""
    info: dict = {"valid": False, "error": None}
    try:
        elf = ElfFile(data)
    except ElfError as exc:
        info["error"] = str(exc)
        info.update(identify_payload(data))
        return info
    except Exception as exc:  # pragma: no cover - defensive
        info["error"] = f"malformed ELF: {exc}"
        info.update(identify_payload(data))
        return info

    machine_name, abi_guess = EM_MACHINES.get(
        elf.e_machine, (f"unknown(0x{elf.e_machine:x})", None)
    )
    if elf.e_machine == 8 and elf.bits == 64:
        abi_guess = "mips64"

    needed: list[str] = []
    soname = None
    runpath: list[str] = []
    has_init_array = False
    dyn_flags1 = 0
    dynstr = elf.section_data(".dynstr")
    for tag, val in elf.dynamic_entries():
        if tag == DT_NEEDED:
            needed.append(ElfFile._cstr(dynstr, val))
        elif tag == DT_SONAME:
            soname = ElfFile._cstr(dynstr, val)
        elif tag in (DT_RPATH, DT_RUNPATH):
            runpath.append(ElfFile._cstr(dynstr, val))
        elif tag == DT_INIT_ARRAY:
            has_init_array = True
        elif tag == DT_FLAGS_1:
            dyn_flags1 = val

    dynsyms = elf.symbols()
    imports = sorted({s["name"] for s in dynsyms if s["shndx"] == 0})
    exports = sorted(
        {s["name"] for s in dynsyms if s["shndx"] != 0 and s["bind"] in (STB_GLOBAL, STB_WEAK)}
    )
    jni_exports = [n for n in exports if n.startswith("Java_")]

    text = next((s for s in elf.sections if s["name"] == ".text"), None)
    comment_blob = elf.section_data(".comment").decode("utf-8", "replace")
    compiler = " | ".join(part.strip() for part in comment_blob.split("\x00") if part.strip()) or None

    info.update(
        {
            "valid": True,
            "bits": elf.bits,
            "endian": "little" if elf.endian == "<" else "big",
            "type": ET_TYPES.get(elf.e_type, str(elf.e_type)),
            "machine": machine_name,
            "machine_id": elf.e_machine,
            "abi_guess": abi_guess,
            "entry": hex(elf.e_entry),
            "soname": soname,
            "needed": needed,
            "runpath": runpath,
            "section_count": len(elf.sections),
            "sections": [s["name"] for s in elf.sections if s["name"]],
            "text_size": text["size"] if text else 0,
            "stripped": not elf.has_section(".symtab"),
            "pie": bool(dyn_flags1 & 0x08000000) or elf.e_type == 3,
            "has_init_array": has_init_array,
            "dynsym_count": len(dynsyms),
            "import_count": len(imports),
            "export_count": len(exports),
            "imports": imports,
            "exports": exports,
            "jni_exports": jni_exports,
            "has_jni_onload": "JNI_OnLoad" in exports,
            "compiler": compiler,
        }
    )
    return info


def classify_library(lib_name: str, elf_info: dict | None = None) -> dict:
    """Maps a library file name and ELF shape onto known packers / frameworks."""
    stem = Path(lib_name).name
    if stem.endswith(".so"):
        stem = stem[:-3]
    key = stem.lower()

    packer = None
    framework = None
    for prefix, label in KNOWN_PACKERS.items():
        if key.startswith(prefix.lower()):
            packer = label
            break

    framework = NOTABLE_LIBS_EXACT.get(key)
    if not framework:
        for prefix, label in NOTABLE_LIBS_PREFIX.items():
            if key.startswith(prefix.lower()):
                framework = label
                break

    hints: list[str] = []
    if elf_info and elf_info.get("valid"):
        if elf_info.get("section_count", 0) == 0:
            hints.append("no section headers (likely packed or obfuscated)")
        if not elf_info.get("exports"):
            hints.append("no dynamic exports")
        if elf_info.get("has_init_array") and not elf_info.get("has_jni_onload"):
            hints.append("logic runs from .init_array constructors")
        for needed in elf_info.get("needed", []):
            nk = needed.lower()
            for prefix, label in KNOWN_PACKERS.items():
                if nk.startswith(prefix.lower()):
                    hints.append(f"depends on {needed} ({label})")
                    break
    return {"packer": packer, "framework": framework, "hints": hints}


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def human_size(num: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(num) < 1024.0 or unit == "GB":
            return f"{num:.0f}{unit}" if unit == "B" else f"{num:.1f}{unit}"
        num /= 1024.0
    return f"{num:.1f}GB"


# ---------------------------------------------------------------------------
# Extraction of .so payloads out of APK / XAPK / split archives
# ---------------------------------------------------------------------------

MANIFEST_NAME = "native_manifest.json"


class NativeExtractor:
    """Extracts and fingerprints native libraries from a target's packages."""

    def __init__(self, config_mgr: ConfigManager | None = None):
        self.config_mgr = config_mgr or ConfigManager()

    # -- archive discovery -------------------------------------------------
    def _collect_archives(self, apk_dir: Path) -> list[Path]:
        """Returns every APK to scan, expanding XAPK / APKS bundles as needed."""
        archives: list[Path] = []
        if not apk_dir.exists():
            return archives

        for item in sorted(apk_dir.iterdir()):
            if item.is_file() and item.suffix == ".apk":
                archives.append(item)
            elif item.is_file() and item.suffix in (".xapk", ".apks"):
                extract_dir = apk_dir / f"{item.name}_extracted"
                if not extract_dir.exists():
                    log_info(f"Extracting split archive {item.name}...")
                    try:
                        with zipfile.ZipFile(item, "r") as zf:
                            zf.extractall(extract_dir)
                    except zipfile.BadZipFile:
                        log_error(f"Corrupted or invalid zip archive: {item.name}")
                        continue
                archives.extend(sorted(extract_dir.rglob("*.apk")))

        # Already-extracted split dirs from a previous 'rea decode' run.
        for extracted in sorted(apk_dir.glob("*_extracted")):
            for apk in sorted(extracted.rglob("*.apk")):
                if apk not in archives:
                    archives.append(apk)
        return archives

    # -- extraction --------------------------------------------------------
    def extract_package(
        self,
        target: str,
        abis: list[str] | None = None,
        include_embedded: bool = True,
        force: bool = False,
        input_dir: Path | str | None = None,
        output_dir: Path | str | None = None,
        report_limit: int = 40,
    ) -> dict | None:
        """Extracts all native libraries for a target into ``native/<abi>/``."""
        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            log_error(f"Could not resolve package name from '{target}'")
            return None

        paths = self.config_mgr.get_app_paths(pkg)
        apk_dir = Path(input_dir) if input_dir else paths["apks"]
        native_dir = Path(output_dir) if output_dir else paths["native"]

        archives = self._collect_archives(apk_dir)
        if not archives:
            log_warn(f"No .apk / .xapk / .apks packages found in {apk_dir}")
            log_info(f"Tip: run 'rea download {pkg}' first.")
            return None

        ensure_dir(native_dir)
        wanted = {a.lower() for a in abis} if abis else None

        libraries: list[dict] = []
        seen_hashes: dict[str, str] = {}
        skipped_abis: set[str] = set()

        for apk in archives:
            try:
                zf = zipfile.ZipFile(apk, "r")
            except zipfile.BadZipFile:
                log_warn(f"Skipping unreadable archive: {apk.name}")
                continue

            with zf:
                for entry in zf.namelist():
                    if entry.endswith("/") or not self._is_native_entry(entry):
                        continue

                    parts = entry.split("/")
                    if parts[0] == "lib" and len(parts) >= 3:
                        abi = parts[1]
                        rel_dest = Path(abi) / Path(entry).name
                    else:
                        if not include_embedded:
                            continue
                        abi = "embedded"
                        safe_parts = [sanitize_filename(p) for p in parts]
                        rel_dest = Path("embedded") / Path(*safe_parts)

                    if wanted is not None and abi.lower() not in wanted and abi != "embedded":
                        skipped_abis.add(abi)
                        continue

                    dest = native_dir / rel_dest
                    ensure_dir(dest.parent)

                    if dest.exists() and not force:
                        digest = sha256_file(dest)
                    else:
                        try:
                            with zf.open(entry) as src, open(dest, "wb") as out:
                                shutil.copyfileobj(src, out)
                        except (KeyError, OSError) as exc:
                            log_warn(f"Failed extracting {entry} from {apk.name}: {exc}")
                            continue
                        digest = sha256_file(dest)

                    elf_info = parse_elf(dest)
                    tags = classify_library(dest.name, elf_info)
                    record = {
                        "name": dest.name,
                        "abi": abi,
                        "path": str(dest.relative_to(paths["root"])).replace("\\", "/"),
                        "abs_path": str(dest),
                        "source_apk": apk.name,
                        "entry": entry,
                        "size": dest.stat().st_size,
                        "sha256": digest,
                        "duplicate_of": seen_hashes.get(digest),
                        "packer": tags["packer"],
                        "framework": tags["framework"],
                        "hints": tags["hints"],
                        "elf": elf_info,
                    }
                    seen_hashes.setdefault(digest, record["path"])
                    libraries.append(record)

        if not libraries:
            log_warn(f"No .so libraries found inside {len(archives)} package(s) for {pkg}")
            if skipped_abis:
                log_info(f"ABIs present but filtered out: {', '.join(sorted(skipped_abis))}")
            return None

        manifest = {
            "package": pkg,
            "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "workspace": str(paths["root"]),
            "archives": [a.name for a in archives],
            "abis": sorted({lib["abi"] for lib in libraries}),
            "count": len(libraries),
            "libraries": sorted(libraries, key=lambda l: (l["abi"], l["name"])),
        }
        manifest_path = native_dir / MANIFEST_NAME
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

        log_success(
            f"Extracted {len(libraries)} native library file(s) for {pkg} -> {native_dir}"
        )
        self.print_manifest(manifest, limit=report_limit)
        log_dim(f"Manifest: {manifest_path}")
        return manifest

    @staticmethod
    def _is_native_entry(entry: str) -> bool:
        name = entry.lower()
        if name.endswith(".so"):
            return True
        # Packers frequently ship libraries under assets with a fake extension.
        return bool(re.search(r"\.so\.[0-9a-z.]+$", name))

    # -- reporting ---------------------------------------------------------
    @staticmethod
    def _lib_notes(lib: dict) -> str:
        elf = lib.get("elf") or {}
        notes = []
        if lib.get("packer"):
            notes.append(f"{Colors.RED}PACKER: {lib['packer']}{Colors.RESET}")
        if lib.get("framework"):
            notes.append(lib["framework"])
        if not elf.get("valid"):
            payload = elf.get("payload")
            notes.append(f"not ELF: {payload}" if payload else f"not ELF (magic {elf.get('magic', '?')})")
        elif elf.get("stripped"):
            notes.append("stripped")
        if lib.get("duplicate_of"):
            notes.append(f"dup of {lib['duplicate_of']}")
        return ", ".join(notes)

    @staticmethod
    def _interest(lib: dict) -> tuple:
        """Sort key: packers first, then JNI surface, then size."""
        elf = lib.get("elf") or {}
        return (
            0 if lib.get("packer") else 1,
            0 if elf.get("jni_exports") else 1,
            -lib.get("size", 0),
        )

    def print_manifest(self, manifest: dict, limit: int = 40):
        libs = manifest.get("libraries", [])
        if not libs:
            return

        by_abi: dict[str, int] = {}
        for lib in libs:
            by_abi[lib["abi"]] = by_abi.get(lib["abi"], 0) + 1
        abi_summary = ", ".join(f"{abi}: {count}" for abi, count in sorted(by_abi.items()))

        ordered = sorted(libs, key=self._interest)
        shown = ordered[:limit] if limit else ordered

        print(f"\n{Colors.BOLD}Native libraries ({len(libs)}){Colors.RESET}  [{abi_summary}]")
        if limit and len(libs) > limit:
            log_dim(f"showing the {len(shown)} most interesting - use --limit 0 for all")
        print("")
        header = f"  {'ABI':<13} {'Library':<34} {'Size':>8}  {'Arch':<9} {'Exp':>5} {'JNI':>4}  Notes"
        print(header)
        print("  " + "-" * (len(header) - 2))
        for lib in shown:
            elf = lib.get("elf") or {}
            print(
                f"  {lib['abi']:<13} {lib['name'][:34]:<34} {human_size(lib['size']):>8}  "
                f"{str(elf.get('machine') or '-')[:9]:<9} "
                f"{elf.get('export_count', 0):>5} {len(elf.get('jni_exports') or []):>4}  "
                + self._lib_notes(lib)
            )
        if limit and len(libs) > limit:
            log_dim(f"... {len(libs) - limit} more")
        print("")

        packers = sorted({l["packer"] for l in libs if l.get("packer")})
        frameworks = sorted({l["framework"] for l in libs if l.get("framework")})
        if packers:
            log_warn(f"Packer / protector detected: {', '.join(packers)}")
        if frameworks:
            log_info(f"Frameworks detected: {', '.join(frameworks)}")

        payloads = sorted({(l.get("elf") or {}).get("payload") for l in libs} - {None})
        non_elf = sum(1 for l in libs if not (l.get("elf") or {}).get("valid"))
        if non_elf:
            detail = f" ({', '.join(payloads)})" if payloads else ""
            log_info(f"{non_elf} file(s) with a .so name are not ELF{detail}")

        jni_libs = sorted({l["name"] for l in libs if (l.get("elf") or {}).get("jni_exports")})
        if jni_libs:
            preview = ", ".join(jni_libs[:12])
            more = f" (+{len(jni_libs) - 12} more)" if len(jni_libs) > 12 else ""
            log_info(f"{len(jni_libs)} library name(s) export Java_* JNI symbols: {preview}{more}")

    # -- lookups -----------------------------------------------------------
    def load_manifest(self, target: str) -> dict | None:
        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            return None
        manifest_path = self.config_mgr.get_app_paths(pkg)["native"] / MANIFEST_NAME
        if not manifest_path.exists():
            return None
        try:
            return json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            log_warn(f"Could not read native manifest: {exc}")
            return None

    def list_libraries(self, target: str) -> list[dict]:
        """Returns manifest entries, falling back to a directory scan."""
        manifest = self.load_manifest(target)
        if manifest:
            return manifest.get("libraries", [])

        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            return []
        native_dir = self.config_mgr.get_app_paths(pkg)["native"]
        if not native_dir.exists():
            return []
        libs = []
        for so in sorted(native_dir.rglob("*.so")):
            elf = parse_elf(so)
            tags = classify_library(so.name, elf)
            libs.append(
                {
                    "name": so.name,
                    "abi": so.parent.name,
                    "path": str(so),
                    "abs_path": str(so),
                    "size": so.stat().st_size,
                    "packer": tags["packer"],
                    "framework": tags["framework"],
                    "hints": tags["hints"],
                    "elf": elf,
                }
            )
        return libs

    def resolve_library(
        self, target: str, name: str | None = None, abi: str | None = None
    ) -> Path | None:
        """Resolves a library by (partial) name and ABI to an on-disk path."""
        libs = self.list_libraries(target)
        if not libs:
            return None

        candidates = libs
        if name:
            needle = name.lower()
            exact = [l for l in candidates if l["name"].lower() == needle]
            partial = [l for l in candidates if needle in l["name"].lower()]
            candidates = exact or partial
        if abi:
            abi_l = abi.lower()
            filtered = [l for l in candidates if l["abi"].lower() == abi_l]
            candidates = filtered or []
        else:
            for preferred in ABI_PREFERENCE:
                pref = [l for l in candidates if l["abi"].lower() == preferred]
                if pref:
                    candidates = pref
                    break

        if not candidates:
            return None
        # Largest library is usually the interesting one.
        candidates.sort(key=lambda l: l.get("size", 0), reverse=True)
        chosen = candidates[0]
        path = Path(chosen.get("abs_path") or chosen["path"])
        if not path.is_absolute():
            pkg = self.config_mgr.resolve_package_name(target)
            path = self.config_mgr.get_app_paths(pkg)["root"] / chosen["path"]
        return path if path.exists() else None


# Terminal reports used by the CLI subcommands
# ---------------------------------------------------------------------------


def show_info(so_path: Path) -> int:
    """Prints a full ELF fingerprint for one .so file."""
    elf = parse_elf(so_path)
    tags = classify_library(so_path.name, elf)
    print(f"\n{Colors.BOLD}{so_path.name}{Colors.RESET}  {Colors.DIM}{so_path}{Colors.RESET}\n")
    if not elf.get("valid"):
        log_error(f"Not a valid ELF file: {elf.get('error')}")
        return 1

    rows = [
        ("Size", human_size(so_path.stat().st_size)),
        ("SHA-256", sha256_file(so_path)),
        ("Class", f"ELF{elf['bits']} {elf['endian']}-endian, type {elf['type']}"),
        ("Machine", f"{elf['machine']} (ABI: {elf.get('abi_guess') or 'unknown'})"),
        ("Entry", elf["entry"]),
        ("SONAME", elf.get("soname") or "-"),
        ("Sections", str(elf["section_count"])),
        (".text size", human_size(elf["text_size"])),
        ("Symbols", f"{elf['dynsym_count']} dynamic ({elf['export_count']} exported, {elf['import_count']} imported)"),
        ("Stripped", "yes" if elf["stripped"] else "no (.symtab present)"),
        ("Compiler", elf.get("compiler") or "-"),
    ]
    for label, value in rows:
        print(f"  {label:<12}: {value}")

    if elf.get("needed"):
        print(f"\n  {Colors.BOLD}Needed libraries:{Colors.RESET} {', '.join(elf['needed'])}")
    if elf.get("runpath"):
        print(f"  {Colors.BOLD}RUNPATH:{Colors.RESET} {', '.join(elf['runpath'])}")
    if tags["framework"]:
        print(f"\n  {Colors.BOLD}Framework:{Colors.RESET} {tags['framework']}")
    if tags["packer"]:
        print(f"  {Colors.BOLD}{Colors.RED}Packer:{Colors.RESET} {tags['packer']}")
    for hint in tags["hints"]:
        log_warn(hint)

    jni = elf.get("jni_exports") or []
    if jni:
        print(f"\n  {Colors.BOLD}JNI exports ({len(jni)}):{Colors.RESET}")
        for name in jni[:40]:
            print(f"    {name}")
        if len(jni) > 40:
            log_dim(f"... {len(jni) - 40} more")
    if elf.get("has_jni_onload"):
        log_info("JNI_OnLoad present - natives may be registered dynamically via RegisterNatives.")
    print("")
    return 0




# ---------------------------------------------------------------------------
# Ghidra installation discovery
# ---------------------------------------------------------------------------

GHIDRA_MCP_REPO = CORE_DIR / "ghidra_mcp"
ENDPOINT_SPEC_PATH = GHIDRA_MCP_REPO / "tests" / "endpoints.json"
HEADLESS_MAIN_CLASS = "com.xebyte.headless.GhidraMCPHeadlessServer"

STATE_DIR = Path.home() / ".reakit"
SERVER_PID_FILE = STATE_DIR / "ghidra_mcp.pid"
SERVER_LOG_FILE = STATE_DIR / "ghidra_mcp.log"
SERVER_ARGFILE = STATE_DIR / "ghidra_mcp_args.txt"

def _is_ghidra_home(path: Path) -> bool:
    return (path / "Ghidra" / "application.properties").is_file() or bool(
        find_analyze_headless(path)
    )


def find_analyze_headless(ghidra_home: Path | str | None) -> Path | None:
    """Returns the analyzeHeadless launcher inside a Ghidra install, if present."""
    if not ghidra_home:
        return None
    home = Path(ghidra_home)
    names = ["analyzeHeadless.bat", "analyzeHeadless"] if os.name == "nt" else ["analyzeHeadless"]
    for name in names:
        for rel in (Path("support") / name, Path(name)):
            candidate = home / rel
            if candidate.exists():
                return candidate
    return None


def find_ghidra_home(config_mgr: ConfigManager | None = None) -> Path | None:
    """Finds a Ghidra installation via config, env vars, core/ bundle, or PATH."""
    candidates: list[Path] = []

    if config_mgr is not None:
        cfg_home = config_mgr.config_data.get("ghidraHome")
        if cfg_home:
            cfg_path = Path(cfg_home)
            if cfg_path.is_absolute():
                candidates.append(cfg_path)
            else:
                # Relative entries are relative to the project the config belongs to.
                bases = [KIT_DIR, Path.cwd()]
                if config_mgr.config_path:
                    parent = config_mgr.config_path.parent
                    bases.insert(0, parent.parent if parent.name == "config" else parent)
                candidates.extend(base / cfg_path for base in bases)

    for var in ("GHIDRA_HOME", "GHIDRA_INSTALL_DIR", "GHIDRA_DIR"):
        val = os.environ.get(var)
        if val:
            candidates.append(Path(val))

    candidates.append(CORE_DIR / "ghidra")

    on_path = shutil.which("analyzeHeadless.bat") or shutil.which("analyzeHeadless")
    if on_path:
        candidates.append(Path(on_path).resolve().parent.parent)

    search_roots = [CORE_DIR, Path.home(), KIT_DIR.parent]
    if os.name == "nt":
        search_roots += [Path("C:/"), Path("C:/Program Files"), Path("D:/")]
    else:
        search_roots += [Path("/opt"), Path("/usr/local")]
    for root in search_roots:
        try:
            if root.exists():
                candidates.extend(sorted((c for c in root.glob("ghidra*") if c.is_dir()), reverse=True))
        except OSError:
            continue

    for cand in candidates:
        if not cand:
            continue
        if _is_ghidra_home(cand):
            return cand.resolve()
        # Release zips unpack one level deep: core/ghidra/ghidra_12.1.3_PUBLIC
        try:
            for nested in sorted(cand.glob("ghidra_*"), reverse=True):
                if nested.is_dir() and _is_ghidra_home(nested):
                    return nested.resolve()
        except OSError:
            continue
    return None


def ghidra_version(ghidra_home: Path | str | None) -> str | None:
    if not ghidra_home:
        return None
    props = Path(ghidra_home) / "Ghidra" / "application.properties"
    try:
        for line in props.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("application.version="):
                return line.split("=", 1)[1].strip()
    except OSError:
        return None
    return None


GHIDRA_RELEASES_API = "https://api.github.com/repos/NationalSecurityAgency/ghidra/releases"


def fetch_ghidra(dest: Path | str | None = None, tag: str | None = None) -> Path | None:
    """Downloads a Ghidra release binary into core/ghidra and unzips it.

    Ghidra is distributed as a large release ZIP (not a source tree you can
    submodule), so - like the bundled jadx/apktool/JDK - it is fetched on demand
    and gitignored. The GhidraMCP plugin, by contrast, is a git submodule.
    """
    dest = Path(dest) if dest else (CORE_DIR / "ghidra")
    existing = find_ghidra_home(ConfigManager())
    if existing:
        log_info(f"Ghidra already present: {existing} (delete it to re-fetch)")
        return Path(existing)

    api = f"{GHIDRA_RELEASES_API}/tags/{tag}" if tag else f"{GHIDRA_RELEASES_API}/latest"
    log_info(f"Resolving Ghidra release from {api} ...")
    try:
        req = urlrequest.Request(api, headers={"Accept": "application/vnd.github+json"})
        with urlrequest.urlopen(req, timeout=60) as resp:
            release = json.loads(resp.read().decode("utf-8"))
    except (urlerror.URLError, json.JSONDecodeError) as exc:
        log_error(f"Could not query the Ghidra releases API: {exc}")
        return None

    asset = next(
        (a for a in release.get("assets", []) if a["name"].endswith(".zip") and "PUBLIC" in a["name"]),
        None,
    )
    if not asset:
        log_error("No Ghidra .zip asset found in that release.")
        return None

    ensure_dir(dest)
    archive = dest / asset["name"]
    size_mb = asset.get("size", 0) / 1e6
    log_info(f"Downloading {asset['name']} (~{size_mb:.0f} MB) -> {dest}")
    started = time.time()

    def _progress(block, block_size, total):
        if total > 0 and block % 200 == 0:
            done = block * block_size
            pct = min(100, done * 100 // total)
            print(f"\r  {pct:3d}%  {done/1e6:6.0f}/{total/1e6:.0f} MB", end="", flush=True)

    try:
        urlrequest.urlretrieve(asset["browser_download_url"], archive, reporthook=_progress)
        print()
    except (urlerror.URLError, OSError) as exc:
        print()
        log_error(f"Download failed: {exc}")
        return None

    log_info(f"Unzipping (this takes a minute) ...")
    try:
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(dest)
    except (zipfile.BadZipFile, OSError) as exc:
        log_error(f"Unzip failed: {exc}")
        return None
    finally:
        archive.unlink(missing_ok=True)

    home = find_ghidra_home(ConfigManager())
    if home:
        log_success(f"Ghidra ready in {time.time()-started:.0f}s: {home}")
        return Path(home)
    log_error("Unzipped, but no Ghidra install was detected under core/ghidra.")
    return None


# ---------------------------------------------------------------------------
# Java runtime selection (Ghidra 12.x + GhidraMCP target JDK 21)
# ---------------------------------------------------------------------------


def java_major(java_exe: Path | str) -> int | None:
    """Returns the major version of a java executable, or None if unknown."""
    try:
        res = subprocess.run(
            [str(java_exe), "-version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    match = re.search(r'version "?(\d+)', res.stdout or "")
    return int(match.group(1)) if match else None


def find_java(prefer_major: int = 21) -> tuple[Path | None, int | None]:
    """Finds a java executable on this machine, preferring the wanted major version."""
    exe_name = "java.exe" if os.name == "nt" else "java"
    candidates: list[Path] = []

    for var in ("REA_JAVA", "GHIDRA_JAVA_HOME", "JAVA_HOME"):
        val = os.environ.get(var)
        if val:
            candidate = Path(val)
            candidates.append(candidate if candidate.name == exe_name else candidate / "bin" / exe_name)

    on_path = shutil.which("java")
    if on_path:
        candidates.append(Path(on_path))

    # Common multi-JDK layouts, so a JDK 21 already on the box is preferred
    # over whatever happens to be first in PATH.
    roots = []
    if os.name == "nt":
        roots += [
            Path("C:/Program Files/Java"),
            Path("C:/Program Files/Eclipse Adoptium"),
            Path("C:/Program Files/Microsoft"),
            Path("C:/Program Files/Amazon Corretto"),
            Path("C:/Program Files/Zulu"),
            Path.home() / ".jdks",
            Path.home() / ".jbang" / "cache" / "jdks",
        ]
    else:
        roots += [
            Path("/usr/lib/jvm"),
            Path("/Library/Java/JavaVirtualMachines"),
            Path.home() / ".jdks",
            Path.home() / ".sdkman" / "candidates" / "java",
        ]
    for root in roots:
        try:
            if not root.is_dir():
                continue
            for child in sorted(root.iterdir(), reverse=True):
                for rel in (Path("bin") / exe_name, Path("Contents/Home/bin") / exe_name):
                    candidates.append(child / rel)
        except OSError:
            continue

    seen: set[str] = set()
    found: list[tuple[Path, int | None]] = []
    for cand in candidates:
        key = str(cand).lower()
        if key in seen or not cand.exists():
            continue
        seen.add(key)
        found.append((cand, java_major(cand)))
        if len(found) >= 12:  # probing java -version is not free
            break

    for cand, major in found:
        if major == prefer_major:
            return cand, major
    return found[0] if found else (None, None)


# ---------------------------------------------------------------------------
# Shared Ghidra project: batch-import .so files for GUI browsing + caching
# ---------------------------------------------------------------------------


def find_ghidra_run(ghidra_home: Path | str | None) -> Path | None:
    """Returns the ghidraRun GUI launcher inside a Ghidra install, if present."""
    if not ghidra_home:
        return None
    home = Path(ghidra_home)
    names = ["ghidraRun.bat", "ghidraRun"] if os.name == "nt" else ["ghidraRun"]
    for name in names:
        candidate = home / name
        if candidate.exists():
            return candidate
    return None


def sanitize_project_name(package: str) -> str:
    """Ghidra project names cannot contain path separators."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", package)


def _batch_by_length(files: list, budget: int = 6000) -> list[list]:
    """Splits file paths into batches whose joined length stays under `budget` chars.

    analyzeHeadless takes every file on one command line; a long list exceeds the
    OS command-line limit (~32KB on Windows), so imports are chunked.
    """
    batches: list[list] = []
    current: list = []
    length = 0
    for f in files:
        piece = len(str(f)) + 3  # path + quoting/space
        if current and length + piece > budget:
            batches.append(current)
            current, length = [], 0
        current.append(f)
        length += piece
    if current:
        batches.append(current)
    return batches


class GhidraProject:
    """Imports .so files into one shared Ghidra project (per-ABI folders).

    The resulting project is what the Ghidra GUI opens and what the headless
    GhidraMCP server reuses via ``--project`` - so analysis is done once and
    both front ends see the same, named programs.
    """

    def __init__(self, config_mgr: ConfigManager | None = None, ghidra_home: Path | str | None = None):
        self.config_mgr = config_mgr or ConfigManager()
        self.ghidra_home = Path(ghidra_home) if ghidra_home else find_ghidra_home(self.config_mgr)

    # -- locations ---------------------------------------------------------
    def project_dir(self, package: str) -> Path:
        return self.config_mgr.get_app_paths(package)["native"] / "ghidra_project"

    def project_name(self, package: str) -> str:
        return sanitize_project_name(package)

    def project_file(self, package: str) -> Path:
        return self.project_dir(package) / f"{self.project_name(package)}.gpr"

    def exists(self, package: str) -> bool:
        return self.project_file(package).is_file()

    # -- import ------------------------------------------------------------
    def import_libraries(
        self,
        target: str,
        lib: str | None = None,
        abi: str | None = None,
        all_abis: bool = False,
        jni_only: bool = False,
        analyze: bool = True,
        overwrite: bool = False,
        max_size_mb: int = 64,
        force: bool = False,
        cpu: int | None = None,
        analysis_timeout: int | None = None,
        heap: str | None = None,
    ) -> Path | None:
        """Imports matching libraries into the shared project; returns the .gpr path."""
        headless = find_analyze_headless(self.ghidra_home)
        if not headless:
            log_error("Ghidra not found - cannot import. Run 'rea native setup'.")
            print_ghidra_setup_help()
            return None

        pkg = self.config_mgr.resolve_package_name(target)
        if not pkg:
            log_error(f"Could not resolve package name from '{target}'")
            return None

        paths = self.config_mgr.get_app_paths(pkg)
        extractor = NativeExtractor(self.config_mgr)
        libs = extractor.list_libraries(pkg)
        if not libs:
            log_warn(f"No extracted native libraries for {pkg}.")
            log_info(f"Tip: run 'rea native extract {pkg}' first.")
            return None

        # Only real ELF shared objects can be imported.
        libs = [l for l in libs if (l.get("elf") or {}).get("valid")]
        if lib:
            needle = lib.lower()
            libs = [l for l in libs if needle in l["name"].lower()]
        if jni_only:
            libs = [l for l in libs if (l.get("elf") or {}).get("jni_exports")]
        if abi:
            libs = [l for l in libs if l["abi"].lower() == abi.lower()]
        elif not all_abis:
            # Default to a single preferred ABI so the GUI is not flooded.
            present = {l["abi"].lower() for l in libs}
            chosen_abi = next((a for a in ABI_PREFERENCE if a in present), None)
            if chosen_abi:
                libs = [l for l in libs if l["abi"].lower() == chosen_abi]
                log_info(f"Importing ABI '{chosen_abi}' (use --abi <x> or --all-abis to change)")

        if not libs:
            log_error("No ELF libraries matched the --lib / --abi filters.")
            return None

        # Size guard: analyzing huge libraries takes a very long time.
        if not force and max_size_mb > 0:
            budget = max_size_mb * 1024 * 1024
            skipped = [l for l in libs if l.get("size", 0) > budget]
            libs = [l for l in libs if l.get("size", 0) <= budget]
            for l in skipped:
                log_warn(
                    f"Skipping {l['abi']}/{l['name']} ({human_size(l['size'])}) - over the "
                    f"{max_size_mb}MB guard. Use --max-size-mb 0 or --force to include it."
                )
        if not libs:
            log_error("Every matching library is over the size guard; nothing imported.")
            return None

        project_dir = self.project_dir(pkg)
        project_name = self.project_name(pkg)
        ensure_dir(project_dir)

        # Group by ABI so each lands in its own project folder (avoids name clashes).
        by_abi: dict[str, list[dict]] = {}
        for l in libs:
            path = Path(l.get("abs_path") or l["path"])
            if not path.is_absolute():
                path = paths["root"] / l["path"]
            if path.exists():
                by_abi.setdefault(l["abi"], []).append(path)

        env = os.environ.copy()
        java_exe, _ = find_java(prefer_major=21)
        if java_exe:
            env["JAVA_HOME"] = str(java_exe.parent.parent)
        if heap:
            env["MAXMEM"] = heap

        total = sum(len(v) for v in by_abi.values())
        log_info(f"Importing {total} library file(s) into project '{project_name}' at {project_dir}")
        if analyze:
            log_info("Auto-analysis runs during import - this can take a while for large libraries.")

        ok = True
        for abi_name, files in sorted(by_abi.items()):
            # analyzeHeadless takes all files on the command line, but a long list
            # blows past the OS command-line limit (~32KB on Windows). Batch the
            # imports into the same project folder to stay well under it.
            batches = _batch_by_length(files, budget=6000)
            log_info(
                f"  {abi_name}: importing {len(files)} file(s)"
                + (f" in {len(batches)} batches" if len(batches) > 1 else "")
                + "..."
            )
            for bi, batch in enumerate(batches, 1):
                cmd = [
                    str(headless),
                    str(project_dir),
                    f"{project_name}/{abi_name}",
                    "-import",
                    *[str(f) for f in batch],
                ]
                if overwrite:
                    cmd.append("-overwrite")
                if not analyze:
                    cmd.append("-noanalysis")
                if cpu:
                    cmd += ["-max-cpu", str(cpu)]
                if analysis_timeout:
                    cmd += ["-analysisTimeoutPerFile", str(analysis_timeout)]

                if len(batches) > 1:
                    log_info(f"    batch {bi}/{len(batches)} ({len(batch)} file(s))")
                log_dim(f"$ analyzeHeadless {project_name}/{abi_name} -import <{len(batch)} files>")
                res = subprocess.run(cmd, env=env)
                if res.returncode != 0:
                    log_warn(f"analyzeHeadless returned {res.returncode} for {abi_name} batch {bi}.")
                    ok = False

        gpr = self.project_file(pkg)
        if gpr.is_file():
            log_success(f"Project ready: {gpr}")
            log_info(f"Open it in the GUI:   rea native gui {pkg}")
            log_info(f"Serve it headless:    rea native serve {pkg} --from-project")
            return gpr

        log_error("Import finished but no .gpr project file was produced.")
        return None if not ok else gpr

    # -- GUI ---------------------------------------------------------------
    def launch_gui(self, target: str | None = None, project_only: bool = False) -> int:
        """Launches the Ghidra GUI, opening the target's project when there is one."""
        gui = find_ghidra_run(self.ghidra_home)
        if not gui:
            log_error("Ghidra GUI launcher (ghidraRun) not found.")
            print_ghidra_setup_help()
            return 1

        cmd = [str(gui)]
        pkg = self.config_mgr.resolve_package_name(target) if target else None
        if pkg:
            gpr = self.project_file(pkg)
            if gpr.is_file():
                cmd.append(str(gpr))
                log_info(f"Opening project for {pkg}: {gpr}")
            elif project_only:
                log_error(f"No Ghidra project for {pkg}. Run 'rea native import {pkg}' first.")
                return 1
            else:
                log_warn(f"No imported project for {pkg} yet.")
                log_info(f"Create one with: rea native import {pkg}")
                log_info("Launching the Ghidra project manager instead...")

        env = os.environ.copy()
        java_exe, _ = find_java(prefer_major=21)
        if java_exe:
            env["JAVA_HOME"] = str(java_exe.parent.parent)

        log_info(f"Launching Ghidra GUI: {' '.join(cmd)}")
        log_dim(
            "In the GUI, enable the MCP plugin once via File > Configure > Miscellaneous > "
            f"GhidraMCPPlugin; it then serves http://127.0.0.1:{gui_port(self.config_mgr)} for the bridge and CLI."
        )
        # ghidraRun refuses to start if it inherits a redirected stdin, so detach
        # the child from this process's console/pipes and let it run on its own.
        creationflags = 0
        if os.name == "nt":
            creationflags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0) | getattr(
                subprocess, "DETACHED_PROCESS", 0
            )
        try:
            subprocess.Popen(
                cmd,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creationflags,
                start_new_session=(os.name != "nt"),
            )
        except OSError as exc:
            log_error(f"Could not launch Ghidra GUI: {exc}")
            return 1
        log_success("Ghidra GUI launched (opens in its own window).")
        return 0


def ghidra_user_extensions_dir(ghidra_home: Path | str | None) -> Path | None:
    """Returns the per-user Ghidra Extensions dir the GUI auto-loads on startup.

    Windows:  %APPDATA%/ghidra/ghidra_<version>_PUBLIC/Extensions
    Others:   ~/.ghidra/.ghidra_<version>_PUBLIC/Extensions
    Matches an existing versioned dir when one is present.
    """
    version = ghidra_version(ghidra_home) or ""
    if os.name == "nt":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming")) / "ghidra"
        prefix = "ghidra_"
    else:
        base = Path.home() / ".ghidra"
        prefix = ".ghidra_"
    if not base.exists() and not version:
        return None
    # Prefer an existing dir that matches the version, else construct one.
    if version and base.exists():
        matches = sorted(base.glob(f"{prefix}{version}*"), reverse=True)
        if matches:
            return matches[0] / "Extensions"
    if version:
        return base / f"{prefix}{version}_PUBLIC" / "Extensions"
    existing = sorted(base.glob(f"{prefix}*"), reverse=True) if base.exists() else []
    return (existing[0] / "Extensions") if existing else None


def find_ghidra_mcp_extension_zip(ghidra_home: Path | str | None) -> Path | None:
    """Finds the built GhidraMCP extension .zip (archive with Module.manifest)."""
    search: list[Path] = []
    if ghidra_home:
        search += sorted(Path(ghidra_home).glob("Extensions/Ghidra/GhidraMCP*.zip"), reverse=True)
    search += sorted((GHIDRA_MCP_REPO / "dist").glob("*GhidraMCP*.zip"), reverse=True)
    search += sorted((GHIDRA_MCP_REPO / "target").glob("*GhidraMCP*.zip"), reverse=True)
    for z in search:
        if z.is_file():
            return z
    return None


def gui_extension_installed(ghidra_home: Path | str | None) -> Path | None:
    """Returns the extracted GhidraMCP extension dir if the GUI will load it."""
    ext_dir = ghidra_user_extensions_dir(ghidra_home)
    for base in filter(None, [ext_dir, (Path(ghidra_home) / "Ghidra" / "Extensions") if ghidra_home else None]):
        cand = base / "GhidraMCP"
        if (cand / "Module.manifest").is_file():
            return cand
    return None


def install_gui_extension(ghidra_home: Path | str | None, force: bool = False) -> Path | None:
    """Extracts the GhidraMCP extension into the user Extensions dir for the GUI.

    This is what makes GhidraMCPPlugin appear in the Ghidra GUI's
    File > Configure, without going through File > Install Extensions by hand.
    """
    if not ghidra_home:
        log_error("Ghidra installation not found.")
        return None

    existing = gui_extension_installed(ghidra_home)
    if existing and not force:
        log_info(f"GUI extension already installed: {existing}")
        return existing

    zip_path = find_ghidra_mcp_extension_zip(ghidra_home)
    if not zip_path:
        log_error("No GhidraMCP extension .zip found - run 'rea native build' first.")
        return None

    ext_dir = ghidra_user_extensions_dir(ghidra_home)
    if not ext_dir:
        log_error("Could not determine the Ghidra user extensions directory.")
        return None
    ensure_dir(ext_dir)

    target = ext_dir / "GhidraMCP"
    if target.exists() and force:
        shutil.rmtree(target, ignore_errors=True)

    log_info(f"Installing GUI extension: {zip_path.name} -> {ext_dir}")
    try:
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(ext_dir)
    except (zipfile.BadZipFile, OSError) as exc:
        log_error(f"Failed to extract extension: {exc}")
        return None

    installed = gui_extension_installed(ghidra_home)
    if installed:
        log_success(f"GUI extension installed: {installed}")
        log_info("Restart Ghidra, then File > Configure > Miscellaneous > enable GhidraMCPPlugin.")
        log_info("(When you next open a program, Ghidra will also offer to configure the new plugin.)")
        return installed
    log_error("Extraction finished but Module.manifest was not found afterwards.")
    return None


# ---------------------------------------------------------------------------
# GhidraMCP plugin jar: locate, build, deploy
# ---------------------------------------------------------------------------


def find_ghidra_mcp_jar(ghidra_home: Path | str | None = None) -> Path | None:
    """Finds a GhidraMCP jar - built in the clone, or installed as a Ghidra extension."""
    env_jar = os.environ.get("GHIDRA_MCP_JAR")
    if env_jar and Path(env_jar).is_file():
        return Path(env_jar).resolve()

    def newest(paths: list[Path]) -> Path | None:
        real = [
            p for p in paths
            if p.is_file() and "sources" not in p.name and "javadoc" not in p.name
        ]
        return max(real, key=lambda p: p.stat().st_mtime) if real else None

    built = newest(list((GHIDRA_MCP_REPO / "target").glob("GhidraMCP*.jar")))
    if built:
        return built.resolve()

    if ghidra_home:
        home = Path(ghidra_home)
        for pattern in (
            "Extensions/Ghidra/GhidraMCP*/lib/*.jar",
            "Ghidra/Extensions/GhidraMCP*/lib/*.jar",
        ):
            installed = newest(list(home.glob(pattern)))
            if installed:
                return installed.resolve()
    return None


def build_ghidra_mcp(
    ghidra_home: Path | str,
    deploy: bool = True,
    skip_prereqs: bool = False,
) -> Path | None:
    """Builds GhidraMCP from core/ghidra_mcp using its own tools.setup workflow."""
    if not GHIDRA_MCP_REPO.exists():
        log_error(f"GhidraMCP checkout not found at {GHIDRA_MCP_REPO}")
        log_info("Clone it: git clone https://github.com/bethington/ghidra-mcp core/ghidra_mcp")
        return None
    if not (shutil.which("mvn") or shutil.which("mvn.cmd")):
        log_error("Maven (mvn) is required to build GhidraMCP and was not found in PATH.")
        return None

    java_exe, major = find_java(prefer_major=21)
    if not java_exe:
        log_error("No java executable found. Install a JDK (21 recommended) and retry.")
        return None
    log_info(f"Using JDK {major}: {java_exe}")
    if major != 21:
        log_warn(f"GhidraMCP and Ghidra 12.x target JDK 21; building with JDK {major}.")

    def run_setup(args: list[str]) -> int:
        env = os.environ.copy()
        env["JAVA_HOME"] = str(java_exe.parent.parent)
        env["PATH"] = str(java_exe.parent) + os.pathsep + env.get("PATH", "")
        log_dim(f"$ python -m tools.setup {' '.join(args)}")
        return subprocess.run(
            [sys.executable, "-m", "tools.setup", *args],
            cwd=str(GHIDRA_MCP_REPO),
            env=env,
        ).returncode

    steps: list[list[str]] = []
    if not skip_prereqs:
        # install-ghidra-deps installs the Ghidra jars into the local Maven repo.
        # (ensure-prereqs would do the same but also requires the uv tool.)
        steps.append(["install-ghidra-deps", "--ghidra-path", str(ghidra_home)])
    steps.append(["build"])
    if deploy:
        steps.append(["deploy", "--ghidra-path", str(ghidra_home)])

    for step in steps:
        code = run_setup(step)
        if code != 0:
            if step[0] == "deploy":
                log_warn(
                    "deploy step returned non-zero (often just the optional uv-based "
                    "bridge-wheel build). The headless server uses the jar directly, so "
                    "this is not fatal - check the log if you also want the Ghidra GUI plugin."
                )
                continue
            log_error(f"GhidraMCP step {step[0]} failed (exit {code}).")
            return None

    jar = find_ghidra_mcp_jar(ghidra_home)
    if jar:
        log_success(f"GhidraMCP jar ready: {jar}")
    else:
        log_error("Build reported success but no GhidraMCP jar was found in target/.")
    if deploy:
        # Make the plugin loadable in the Ghidra GUI (upstream's uv-based bridge
        # wheel step may have aborted deploy before this happened).
        install_gui_extension(ghidra_home)
    return jar


def install_mcp_bridge_package() -> bool:
    """pip-installs the ghidra-mcp Python bridge from the local checkout."""
    if not (GHIDRA_MCP_REPO / "pyproject.toml").is_file():
        log_error(f"Bridge package not found in {GHIDRA_MCP_REPO}")
        return False
    bridge_dir = GHIDRA_MCP_REPO
    log_info("Installing the GhidraMCP MCP bridge (pip install core/ghidra_mcp)...")
    res = subprocess.run(
        [sys.executable, "-m", "pip", "install", str(bridge_dir)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if res.returncode == 0:
        log_success("MCP bridge installed - bridge-mcp-ghidra is now on PATH.")
        return True
    for line in (res.stdout or "").strip().splitlines()[-12:]:
        log_dim(line)
    log_error(f"pip install failed (exit {res.returncode}).")
    return False


# ---------------------------------------------------------------------------
# Headless GhidraMCP server
# ---------------------------------------------------------------------------


class GhidraMcpServer:
    """Runs com.xebyte.headless.GhidraMCPHeadlessServer - the GUI-free MCP backend."""

    def __init__(
        self,
        config_mgr: ConfigManager | None = None,
        ghidra_home: Path | str | None = None,
        jar: Path | str | None = None,
        port: int = DEFAULT_HEADLESS_PORT,
        bind: str = "127.0.0.1",
        heap: str = "4g",
        java: Path | str | None = None,
    ):
        self.config_mgr = config_mgr or ConfigManager()
        self.ghidra_home = Path(ghidra_home) if ghidra_home else find_ghidra_home(self.config_mgr)
        self.jar = Path(jar) if jar else find_ghidra_mcp_jar(self.ghidra_home)
        self.port = port
        self.bind = bind
        self.heap = heap
        if java:
            self.java, self.java_major = Path(java), java_major(java)
        else:
            self.java, self.java_major = find_java(prefer_major=21)

    # -- prerequisites -----------------------------------------------------
    def check(self) -> list[str]:
        problems = []
        if not self.ghidra_home:
            problems.append("Ghidra installation not found (set GHIDRA_HOME or unzip into core/ghidra)")
        if not self.jar:
            problems.append("GhidraMCP jar not found - run: rea native build")
        if not self.java:
            problems.append("No java executable found (JDK 21 recommended)")
        return problems

    def ghidra_classpath(self) -> list[str]:
        """Collects the Ghidra jars the headless server needs, mirroring entrypoint.sh."""
        home = Path(self.ghidra_home)
        jars: list[str] = [str(self.jar)]
        for pattern in (
            "Ghidra/Framework/*/lib/*.jar",
            "Ghidra/Features/*/lib/*.jar",
            "Ghidra/Processors/*/lib/*.jar",
        ):
            jars.extend(str(p) for p in sorted(home.glob(pattern)))
        return jars

    def _write_argfile(self, server_args: list[str]) -> Path:
        """Java @argfile - the full classpath is past the Windows command-line limit."""
        ensure_dir(STATE_DIR)
        home = Path(self.ghidra_home).as_posix()
        classpath = os.pathsep.join(Path(j).as_posix() for j in self.ghidra_classpath())
        lines = [
            f"-Xmx{self.heap}",
            "-XX:+UseG1GC",
            f"-Dghidra.home={home}",
            "-Dapplication.name=GhidraMCP",
            "-classpath",
            f'"{classpath}"',
            HEADLESS_MAIN_CLASS,
            *server_args,
        ]
        SERVER_ARGFILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return SERVER_ARGFILE

    def build_command(
        self,
        file: Path | str | None = None,
        project: Path | str | None = None,
        program: str | None = None,
    ) -> list[str]:
        server_args = ["--port", str(self.port), "--bind", self.bind]
        if file:
            server_args += ["--file", Path(file).as_posix()]
        if project:
            server_args += ["--project", Path(project).as_posix()]
        if program:
            server_args += ["--program", program]
        argfile = self._write_argfile(server_args)
        return [str(self.java), f"@{argfile}"]

    # -- lifecycle ---------------------------------------------------------
    def _client_host(self) -> str:
        return "127.0.0.1" if self.bind in ("0.0.0.0", "::") else self.bind

    def is_live(self, timeout: int = 3) -> bool:
        client = GhidraMcpClient(
            base_url=f"http://{self._client_host()}:{self.port}", timeout=timeout
        )
        try:
            status, _ = client.request("/check_connection")
            return status < 400
        except ConnectionError:
            return False

    def wait_ready(self, timeout: int = 600) -> bool:
        deadline = time.time() + timeout
        while time.time() < deadline:
            if self.is_live(timeout=2):
                return True
            time.sleep(2)
        return False

    def start(
        self,
        file: Path | str | None = None,
        project: Path | str | None = None,
        program: str | None = None,
        background: bool = False,
        wait_timeout: int = 600,
    ) -> int:
        problems = self.check()
        if problems:
            for p in problems:
                log_error(p)
            print_ghidra_setup_help()
            return 1

        if self.is_live():
            log_warn(f"A GhidraMCP server is already listening on port {self.port}.")
            log_info("Stop it with: rea native stop   (or pass --port for a second instance)")
            return 1

        if self.java_major and self.java_major != 21:
            log_warn(f"Running on JDK {self.java_major}; Ghidra 12.x targets JDK 21.")

        cmd = self.build_command(file=file, project=project, program=program)
        log_info(f"Starting headless GhidraMCP on {self.bind}:{self.port} (heap {self.heap})")
        if file:
            log_dim(f"program: {file}")
        log_dim(f"$ {' '.join(cmd)}")

        if not background:
            log_info("Server runs in the foreground - press Ctrl+C to stop.")
            try:
                return subprocess.run(cmd).returncode
            except KeyboardInterrupt:
                return 0

        ensure_dir(STATE_DIR)
        log_fd = os.open(str(SERVER_LOG_FILE), os.O_CREAT | os.O_WRONLY | os.O_TRUNC)
        os.set_inheritable(log_fd, True)
        creationflags = 0
        if os.name == "nt":
            creationflags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0x00000010) | getattr(
                subprocess, "CREATE_NEW_PROCESS_GROUP", 0x00000200
            )
        proc = subprocess.Popen(
            cmd,
            stdout=log_fd,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags,
            start_new_session=(os.name != "nt"),
            close_fds=False,
        )
        os.close(log_fd)
        SERVER_PID_FILE.write_text(str(proc.pid), encoding="utf-8")
        log_info(f"Server PID {proc.pid}; log: {SERVER_LOG_FILE}")
        log_info("Waiting for the HTTP API (Ghidra startup plus analysis takes a while)...")

        if self.wait_ready(timeout=wait_timeout):
            log_success(f"GhidraMCP is live at http://{self._client_host()}:{self.port}")
            log_info("Query it: rea native functions | rea native strings | rea native call <endpoint>")
            return 0

        log_error(f"Server did not answer /check_connection within {wait_timeout}s.")
        log_info(f"Check the log: {SERVER_LOG_FILE}")
        if proc.poll() is not None:
            log_error(f"Process exited early with code {proc.returncode}. Last log lines:")
            try:
                tail = SERVER_LOG_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
                for line in tail[-20:]:
                    log_dim(line)
            except OSError:
                pass
        return 1

    def stop(self) -> int:
        if not SERVER_PID_FILE.exists():
            log_warn("No background GhidraMCP server was started by REA_Kit.")
            return 1
        try:
            pid = int(SERVER_PID_FILE.read_text(encoding="utf-8").strip())
        except (OSError, ValueError):
            log_error(f"Could not read a PID from {SERVER_PID_FILE}")
            return 1

        log_info(f"Stopping GhidraMCP server (PID {pid})...")
        if os.name == "nt":
            res = subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            ok = res.returncode == 0
            if not ok:
                log_dim((res.stdout or "").strip())
        else:
            try:
                os.kill(pid, 15)
                ok = True
            except OSError as exc:
                log_dim(str(exc))
                ok = False

        SERVER_PID_FILE.unlink(missing_ok=True)
        if ok:
            log_success("Server stopped.")
            return 0
        log_error("Could not stop the server; it may already be gone.")
        return 1


# ---------------------------------------------------------------------------
# Endpoint catalog - the GhidraMCP REST surface, driven by its own spec file
# ---------------------------------------------------------------------------

# Short CLI names for the endpoints used most in Android native RE.
# value = (endpoint, positional parameter name or None)
QUERY_ALIASES: dict[str, tuple[str, str | None]] = {
    "check": ("/check_connection", None),
    "info": ("/get_current_program_info", None),
    "program": ("/get_current_program_info", None),
    "programs": ("/list_open_programs", None),
    "load": ("/load_program", "file"),
    "open": ("/open_program", "path"),
    "reanalyze": ("/reanalyze", None),
    "save": ("/save_program", None),
    "close": ("/close_program", "name"),
    "functions": ("/list_functions", None),
    "function": ("/get_function_by_address", "address"),
    "count": ("/get_function_count", None),
    "search-functions": ("/search_functions", "name_pattern"),
    "decompile": ("/decompile_function", None),
    "disassemble": ("/disassemble_function", "address"),
    "strings": ("/list_strings", None),
    "search-strings": ("/search_strings", "search_term"),
    "imports": ("/list_imports", None),
    "exports": ("/list_exports", None),
    "segments": ("/list_segments", None),
    "globals": ("/list_globals", None),
    "methods": ("/list_methods", None),
    "namespaces": ("/list_namespaces", None),
    "data": ("/list_data_items", None),
    "memory": ("/read_memory", "address"),
    "xrefs-to": ("/get_xrefs_to", "address"),
    "xrefs-from": ("/get_xrefs_from", "address"),
    "schema": ("/mcp/schema", None),
}

# Endpoints where REA_Kit supplies a nicer default than the server does.
PAGED_DEFAULTS = {"limit": "200"}


def load_endpoint_spec(client: "GhidraMcpClient | None" = None) -> dict[str, dict]:
    """Loads the 253-endpoint REST spec from the local checkout, else from a live server."""
    spec: dict[str, dict] = {}
    if ENDPOINT_SPEC_PATH.is_file():
        try:
            raw = json.loads(ENDPOINT_SPEC_PATH.read_text(encoding="utf-8"))
            for entry in raw.get("endpoints", []):
                spec[entry["path"]] = entry
            return spec
        except (OSError, json.JSONDecodeError, KeyError) as exc:
            log_warn(f"Could not parse {ENDPOINT_SPEC_PATH}: {exc}")

    if client is not None:
        try:
            status, text = client.request("/mcp/schema")
            if status < 400:
                raw = json.loads(text)
                entries = raw.get("endpoints") or raw.get("tools") or []
                for entry in entries:
                    path = entry.get("path") or entry.get("name")
                    if path:
                        spec[path if path.startswith("/") else "/" + path] = entry
        except (ConnectionError, json.JSONDecodeError):
            pass
    return spec


def print_endpoints(grep: str | None = None, category: str | None = None, limit: int = 0) -> int:
    """Lists the REST endpoints the CLI can call."""
    spec = load_endpoint_spec()
    if not spec:
        log_error("No endpoint spec available.")
        log_info(f"Expected {ENDPOINT_SPEC_PATH} (clone bethington/ghidra-mcp into core/ghidra_mcp).")
        return 1

    entries = list(spec.values())
    if category:
        entries = [e for e in entries if (e.get("category") or "").lower() == category.lower()]
    if grep:
        pattern = re.compile(grep, re.IGNORECASE)
        entries = [
            e for e in entries
            if pattern.search(e.get("path", "")) or pattern.search(e.get("description", "") or "")
        ]
    entries.sort(key=lambda e: e.get("path", ""))

    if not entries:
        log_warn("No endpoints matched.")
        return 0

    shown = entries[:limit] if limit else entries
    print(f"\n{Colors.BOLD}GhidraMCP endpoints ({len(shown)} of {len(spec)}):{Colors.RESET}\n")
    for e in shown:
        params = ",".join(e.get("params") or [])
        print(f"  {e.get('method', 'GET'):<5} {e.get('path', ''):<40} {Colors.DIM}{params}{Colors.RESET}")
        desc = (e.get("description") or "").strip()
        if desc:
            print(f"        {Colors.DIM}{desc[:110]}{Colors.RESET}")
    if limit and len(entries) > limit:
        log_dim(f"... {len(entries) - limit} more")

    print(f"\n{Colors.BOLD}Call any of them:{Colors.RESET} rea native call <endpoint> -p key=value")
    print(f"{Colors.BOLD}Short aliases:{Colors.RESET} {', '.join(sorted(QUERY_ALIASES))}\n")
    return 0


class GhidraMcpClient:
    """HTTP client for a GhidraMCP server (headless or the Ghidra GUI plugin)."""

    def __init__(self, base_url: str | None = None, token: str | None = None, timeout: int = 120):
        self.base_url = (base_url or os.environ.get("GHIDRA_MCP_URL") or DEFAULT_MCP_URL).rstrip("/")
        self.token = token or os.environ.get("GHIDRA_MCP_AUTH_TOKEN")
        self.timeout = timeout
        self._spec: dict[str, dict] | None = None

    # -- transport ---------------------------------------------------------
    def request(
        self,
        endpoint: str,
        params: dict[str, str] | None = None,
        method: str = "GET",
        json_body: dict | None = None,
    ) -> tuple[int, str]:
        if not endpoint.startswith("/"):
            endpoint = "/" + endpoint
        url = self.base_url + endpoint
        body = None
        content_type = None
        if json_body is not None:
            # POST body params are parsed as JSON by the server (JsonHelper.parseBody).
            body = json.dumps(json_body).encode("utf-8")
            content_type = "application/json"
        elif params:
            clean = {k: v for k, v in params.items() if v is not None}
            if method.upper() == "GET":
                url = f"{url}?{urlparse.urlencode(clean)}"
            else:
                # The GhidraMCP server parses POST bodies as JSON (JsonHelper.parseBody),
                # so POST params must go in a JSON body, not form-urlencoded.
                body = json.dumps(clean).encode("utf-8")
                content_type = "application/json"

        req = urlrequest.Request(url, data=body, method=method.upper())
        if content_type:
            req.add_header("Content-Type", content_type)
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")

        try:
            with urlrequest.urlopen(req, timeout=self.timeout) as resp:
                return resp.status, resp.read().decode("utf-8", "replace")
        except urlerror.HTTPError as exc:
            return exc.code, exc.read().decode("utf-8", "replace")
        except urlerror.URLError as exc:
            raise ConnectionError(f"{self.base_url} unreachable: {exc.reason}") from exc

    @property
    def spec(self) -> dict[str, dict]:
        if self._spec is None:
            self._spec = load_endpoint_spec(self)
        return self._spec

    def resolve(self, name: str) -> tuple[str, str, str | None]:
        """Maps an alias or raw endpoint path to (endpoint, method, positional param)."""
        if name in QUERY_ALIASES:
            endpoint, positional = QUERY_ALIASES[name]
        else:
            endpoint = name if name.startswith("/") else "/" + name
            positional = None
        entry = self.spec.get(endpoint)
        method = (entry.get("method") if entry else None) or "GET"
        if not positional and entry:
            params = entry.get("params") or []
            if params:
                positional = params[0]
        return endpoint, method, positional

    # -- command execution -------------------------------------------------
    def load_from_project(self, program_path: str) -> int:
        """Switch the running server to another program already in the open project."""
        if not program_path.startswith("/"):
            program_path = "/" + program_path
        try:
            status, text = self.request(
                "/load_program_from_project", method="POST", json_body={"path": program_path}
            )
        except ConnectionError as exc:
            log_error(str(exc))
            return 1
        if status >= 400:
            log_error(f"HTTP {status} from /load_program_from_project")
            print(text.strip())
            return 1
        print(_pretty(text))
        return 0

    def call(
        self,
        name: str,
        value: str | None = None,
        params: dict[str, str] | None = None,
        method: str | None = None,
        grep: str | None = None,
        limit: int | None = None,
        raw: bool = False,
    ) -> int:
        endpoint, spec_method, positional = self.resolve(name)
        method = method or spec_method
        query = dict(params or {})

        if value is not None:
            if name == "decompile":
                # decompile_function takes an address, or a function name via 'functions'
                key = "address" if value.lower().startswith("0x") else "functions"
                query.setdefault(key, value)
            elif positional:
                query.setdefault(positional, value)
            else:
                log_warn(f"{name} takes no positional value; ignoring {value}")

        entry = self.spec.get(endpoint)
        supported = set(entry.get("params") or []) if entry else set()
        if limit is not None and "limit" in supported:
            query["limit"] = str(limit)
        elif "limit" in supported:
            query.setdefault("limit", PAGED_DEFAULTS["limit"])

        if entry:
            unknown = [k for k in query if k not in supported]
            if unknown:
                log_warn(f"{endpoint} does not document these params: {', '.join(unknown)}")

        try:
            status, text = self.request(endpoint, params=query, method=method)
        except ConnectionError as exc:
            log_error(str(exc))
            log_info("Start the backend first: rea native serve <package> --lib <libname> --background")
            return 1

        if status >= 400:
            log_error(f"HTTP {status} from {endpoint}")
            print(text.strip())
            return 1

        output = text if raw else _pretty(text)
        if grep:
            output = _grep_text(output, grep)
            if not output.strip():
                log_warn(f"No lines matched /{grep}/")
                return 0
        print(output)
        return 0


def _pretty(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith(("{", "[")):
        try:
            return json.dumps(json.loads(stripped), indent=2)
        except json.JSONDecodeError:
            pass
    return text


def _grep_text(text: str, pattern: str) -> str:
    regex = re.compile(pattern, re.IGNORECASE)
    return "\n".join(line for line in text.splitlines() if regex.search(line))


# ---------------------------------------------------------------------------
# MCP bridge (stdio / HTTP transport for AI clients)
# ---------------------------------------------------------------------------


def find_mcp_bridge() -> list[str] | None:
    """Finds a command that launches the ghidra-mcp MCP bridge, if installed."""
    exe = shutil.which("bridge-mcp-ghidra") or shutil.which("bridge-mcp-ghidra.exe")
    if exe:
        return [exe]
    try:
        res = subprocess.run(
            [sys.executable, "-c", "import bridge_mcp_ghidra"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=60,
        )
        if res.returncode == 0:
            return [sys.executable, "-m", "bridge_mcp_ghidra"]
    except (OSError, subprocess.SubprocessError):
        pass
    return None


def run_mcp_bridge(extra_args: list[str] | None = None) -> int:
    """Runs the MCP bridge so an AI client can drive the same server the CLI uses."""
    cmd = find_mcp_bridge()
    if not cmd:
        log_error("The GhidraMCP MCP bridge is not installed.")
        log_info("Install it with: rea native build --bridge-only")
        return 1
    cmd = cmd + (extra_args or [])
    log_info(f"Launching MCP bridge: {' '.join(cmd)}")
    return subprocess.run(cmd).returncode


def print_mcp_config(url: str | None = None) -> int:
    """Prints MCP client configuration for the bridge."""
    cmd = find_mcp_bridge() or ["bridge-mcp-ghidra"]
    config = {
        "mcpServers": {
            "ghidra": {
                "command": cmd[0],
                "args": cmd[1:],
                "env": {"GHIDRA_MCP_URL": url or DEFAULT_MCP_URL},
            }
        }
    }
    print(json.dumps(config, indent=2))
    print(f"\n{Colors.BOLD}Add it to Claude Code:{Colors.RESET}")
    joined = " ".join(cmd)
    print(f"  claude mcp add ghidra --env GHIDRA_MCP_URL={url or DEFAULT_MCP_URL} -- {joined}\n")
    return 0


# ---------------------------------------------------------------------------
# Setup help and doctor
# ---------------------------------------------------------------------------


def print_ghidra_setup_help():
    print(
        f"""
{Colors.BOLD}Native analysis setup (one time):{Colors.RESET}

  1. Ghidra 12.x (JDK 21) - a downloaded binary, gitignored, NOT bundled in the repo:
       {Colors.CYAN}rea native fetch-ghidra{Colors.RESET}     download the release into {CORE_DIR / 'ghidra'}
     ...or set {Colors.CYAN}GHIDRA_HOME{Colors.RESET} / add {Colors.CYAN}"ghidraHome": "<dir>"{Colors.RESET} to workspace_config.json
     to point at an existing install.

  2. GhidraMCP - a git submodule at {Colors.CYAN}core/ghidra_mcp{Colors.RESET} (git submodule update --init):
       {Colors.CYAN}rea native build{Colors.RESET}      builds the plugin jar and installs the MCP bridge

  3. Verify:
       {Colors.CYAN}rea native setup{Colors.RESET}

{Colors.BOLD}Two front ends on predefined ports (both can run at once):{Colors.RESET}
  headless server -> :{DEFAULT_HEADLESS_PORT}   GUI plugin -> :{DEFAULT_GUI_PORT}

  {Colors.CYAN}rea native extract <pkg>{Colors.RESET}                     pull .so files out of the APKs

  {Colors.BOLD}Headless (no GUI):{Colors.RESET}
  {Colors.CYAN}rea native serve <pkg> --lib libfoo -d{Colors.RESET}       background Ghidra + GhidraMCP server
  {Colors.CYAN}rea native functions --grep Java_{Colors.RESET}            query it from the CLI

  {Colors.BOLD}GUI (browse visually):{Colors.RESET}
  {Colors.CYAN}rea native import <pkg>{Colors.RESET}                      import every .so into one Ghidra project
  {Colors.CYAN}rea native gui <pkg>{Colors.RESET}                         open it in Ghidra; enable GhidraMCPPlugin
  {Colors.CYAN}rea native serve <pkg> --from-project{Colors.RESET}        reuse that project headlessly (no re-analysis)

  {Colors.BOLD}For AI clients (either backend):{Colors.RESET}
  {Colors.CYAN}rea native mcp{Colors.RESET}                               MCP bridge -> either server (set GHIDRA_MCP_URL)
"""
    )


def doctor(config_mgr: ConfigManager, ghidra_home: Path | str | None = None, port: int | None = None) -> int:
    """Reports the state of every native-analysis prerequisite."""
    print("")
    home = Path(ghidra_home) if ghidra_home else find_ghidra_home(config_mgr)
    ok = True

    if home:
        log_success(f"Ghidra {ghidra_version(home) or '?'}: {home}")
    else:
        log_error("Ghidra installation not found.")
        ok = False

    java_exe, major = find_java(prefer_major=21)
    if java_exe and major == 21:
        log_success(f"Java {major}: {java_exe}")
    elif java_exe:
        log_warn(f"Java {major}: {java_exe} (Ghidra 12.x targets JDK 21)")
    else:
        log_error("No java executable found.")
        ok = False

    if GHIDRA_MCP_REPO.exists():
        log_success(f"GhidraMCP checkout: {GHIDRA_MCP_REPO}")
    else:
        log_warn(f"GhidraMCP checkout missing: {GHIDRA_MCP_REPO}")

    jar = find_ghidra_mcp_jar(home)
    if jar:
        log_success(f"GhidraMCP jar (headless server): {jar}")
    else:
        log_error("GhidraMCP jar not built - run: rea native build")
        ok = False

    if home:
        gui = find_ghidra_run(home)
        if gui:
            log_success(f"Ghidra GUI launcher: {gui}")
        installed = gui_extension_installed(home)
        if installed:
            log_success(f"GUI plugin installed: {installed} (enable via File > Configure)")
        elif find_ghidra_mcp_extension_zip(home):
            log_warn("GUI plugin built but not installed - run 'rea native gui --install-plugin'.")
        else:
            log_warn("GUI plugin not built - run 'rea native build'.")

    spec = load_endpoint_spec()
    if spec:
        log_success(f"Endpoint spec: {len(spec)} endpoints ({ENDPOINT_SPEC_PATH.name})")
    else:
        log_warn("No endpoint spec found; only raw endpoint paths will work.")

    bridge = find_mcp_bridge()
    if bridge:
        log_success(f"MCP bridge: {' '.join(bridge)}")
    else:
        log_warn("MCP bridge not installed (only needed for AI clients).")

    if shutil.which("mvn") or shutil.which("mvn.cmd"):
        log_success("Maven available (needed to build the plugin jar).")
    else:
        log_warn("Maven not found - required only when building GhidraMCP.")

    # Probe both predefined ports: the GUI plugin and the headless server.
    probes = [("GUI plugin", gui_port(config_mgr)), ("headless server", headless_port(config_mgr))]
    if port is not None:
        probes = [("server", port)]
    for label, p in probes:
        client = GhidraMcpClient(base_url=f"http://127.0.0.1:{p}")
        try:
            status, text = client.request("/check_connection")
            if status < 400:
                log_success(f"{label} live on :{p}: {text.strip()[:70]}")
                try:
                    _, info = client.request("/get_current_program_info")
                    loaded = info.strip()
                    if loaded:
                        log_dim(f"    loaded program: {loaded[:160]}")
                except ConnectionError:
                    pass
            else:
                log_warn(f"{label} on :{p} replied HTTP {status}")
        except ConnectionError:
            hint = "rea native gui <pkg> + enable the plugin" if "GUI" in label else "rea native serve <pkg> -d"
            log_info(f"No {label} on :{p} ({hint})")

    if not ok:
        print_ghidra_setup_help()
    print("")
    return 0 if ok else 1
