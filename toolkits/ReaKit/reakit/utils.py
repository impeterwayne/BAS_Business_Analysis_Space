import os
import sys
import re
import subprocess
from pathlib import Path, PurePosixPath
from urllib.parse import urlparse, parse_qs

# ANSI color codes
USE_COLOR = os.environ.get("NO_COLOR") is None and sys.stdout.isatty()

class Colors:
    HEADER = "\033[95m" if USE_COLOR else ""
    BLUE = "\033[94m" if USE_COLOR else ""
    CYAN = "\033[96m" if USE_COLOR else ""
    GREEN = "\033[92m" if USE_COLOR else ""
    YELLOW = "\033[93m" if USE_COLOR else ""
    RED = "\033[91m" if USE_COLOR else ""
    BOLD = "\033[1m" if USE_COLOR else ""
    DIM = "\033[2m" if USE_COLOR else ""
    UNDERLINE = "\033[4m" if USE_COLOR else ""
    RESET = "\033[0m" if USE_COLOR else ""

def log_info(msg: str):
    print(f"{Colors.CYAN}[*]{Colors.RESET} {msg}")

def log_success(msg: str):
    print(f"{Colors.GREEN}[+]{Colors.RESET} {msg}")

def log_warn(msg: str):
    print(f"{Colors.YELLOW}[!]{Colors.RESET} {msg}")

def log_error(msg: str):
    print(f"{Colors.RED}[-]{Colors.RESET} {msg}")

def log_dim(msg: str):
    print(f"{Colors.DIM}    {msg}{Colors.RESET}")

def print_banner():
    art = r"""
    ____  ______ ___         __ __ _ __ 
   / __ \/ ____//   |       / //_/(_) /_
  / /_/ / __/  / /| |      / ,<  / / __/
 / _, _/ /___ / ___ | _   / /| |/ / /_  
/_/ |_/_____//_/  |_|(_) /_/ |_/_/\__/  """
    print(f"{Colors.CYAN}{Colors.BOLD}{art}\n{Colors.DIM}Reverse Engineering Android & Automation Kit v2.0{Colors.RESET}\n")

def extract_package_name(line: str) -> str | None:
    """Extracts a package name from a Google Play link, APK store link, or raw string."""
    if not line:
        return None
    line = line.strip()
    if not line:
        return None

    # Method 1: Google Play query parameter (id=com.app.name or market://details?id=com.app.name)
    if "id=" in line:
        # Regex search for standard package name pattern following id=
        m = re.search(r'[?&]id=([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)', line)
        if m:
            return m.group(1).strip()
        parsed = urlparse(line)
        qs = parse_qs(parsed.query)
        if "id" in qs and qs["id"]:
            return qs["id"][0].strip()

    # Method 2: Google Play direct path (e.g. .../details/com.app.name or .../app/com.app.name)
    m = re.search(r'play\.google\.com/[^/]+/apps/[^/]+/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)', line)
    if m:
        return m.group(1).strip()

    # Method 3: APK / Store URL format (.../com.app.name or .../com.app.name.apk)
    if line.startswith("http://") or line.startswith("https://") or line.startswith("market://"):
        parsed = urlparse(line)
        path = parsed.path.strip("/")
        parts = [p for p in path.split("/") if p]
        if parts:
            potential_pkg = parts[-1]
            if potential_pkg.endswith(".apk"):
                potential_pkg = potential_pkg[:-4]
            if re.match(r'^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$', potential_pkg):
                return potential_pkg

    # Method 4: Raw package name (e.g. com.example.app)
    if re.match(r'^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$', line):
        return line

    return None

def sanitize_filename(filename: str) -> str:
    """Removes or replaces characters not allowed in file names across Windows/Linux."""
    illegal_chars = '<>:"/\\|?*'
    for char in illegal_chars:
        filename = filename.replace(char, "_")
    return filename

def get_safe_relative_parts(remote_path: str, base_dir: str) -> list[str]:
    """Extracts a sanitized list of directory parts relative to a base directory."""
    try:
        relative_path = PurePosixPath(remote_path).relative_to(PurePosixPath(base_dir))
    except ValueError:
        return []

    parts = []
    for part in relative_path.parts:
        if not part or part in {".", ".."}:
            continue
        parts.append(sanitize_filename(part))
    return parts

def ensure_dir(path: str | Path) -> Path:
    """Ensures a directory exists and returns its Path object."""
    p = Path(path).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p

def run_command(cmd, cwd=None, env=None, check=False, capture=False) -> subprocess.CompletedProcess:
    """Executes a command subprocess with consistent defaults."""
    if capture:
        return subprocess.run(
            cmd,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=check,
        )
    return subprocess.run(cmd, cwd=cwd, env=env, check=check)
