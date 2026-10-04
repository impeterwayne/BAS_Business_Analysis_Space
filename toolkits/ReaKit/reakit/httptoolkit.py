"""HTTP Toolkit integration for REA_Kit - dynamic launch plus API traffic capture.

This module is the network half of a target, the counterpart to :mod:`reakit.native`
(static/native) and :mod:`reakit.runtime` (on-device files):

* :class:`HtkControlClient` speaks the HTTP Toolkit control API over its local
  IPC endpoint - a named pipe on Windows (``\\\\.\\pipe\\httptoolkit-ctl``), a unix
  socket elsewhere. Stdlib only, matching the rest of REA_Kit's zero-dependency rule.
* :class:`HttpToolkit` starts the desktop app on demand, waits until its API answers,
  and exposes the captured-exchange log (``events.*``), proxy config and interceptor
  state as ordinary Python calls.
* The Android helpers point a connected device at the running proxy over ADB, so
  ``rea http`` slots into the same dynamic loop as ``rea scrcpy`` and ``rea pull``.

Tiering note: HTTP Toolkit gates its remote-control API by account tier, and the gate
keys off the ``source`` field of ``/api/execute``. ``source: "ctl"`` requires Pro for
every operation except ``account.*``; ``source: "mcp"`` allows any operation whose
``tiers`` list includes ``"free"`` - which today covers the whole ``events.*`` log,
``proxy.get-config`` and ``interceptors.list``. REA_Kit therefore identifies as an MCP
client by default (see :data:`DEFAULT_SOURCE`), which is what makes the traffic log
readable without Pro. Free tier also caps calls per session (500 outlines, 100 bodies)
and truncates bodies at 100k characters; those limits come from the app, not from here.
"""

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from reakit.config import ConfigManager
from reakit.utils import (
    Colors,
    ensure_dir,
    log_dim,
    log_error,
    log_info,
    log_success,
    log_warn,
)

# The desktop app's own defaults (httptoolkit-server/lib/commands/start.js).
DEFAULT_SERVER_PORT = 45457   # HTK server REST/GraphQL API
DEFAULT_MOCKTTP_PORT = 45456  # Mockttp admin server

# Control-API endpoint (httptoolkit-server/lib/api/ui-operation-bridge.js).
WINDOWS_PIPE = r"\\.\pipe\httptoolkit-ctl"
SOCKET_NAME = "httptoolkit-ctl.sock"

# Identify as an MCP client so free-tier operations are permitted; see module docstring.
DEFAULT_SOURCE = "mcp"

STATE_DIR = Path.home() / ".reakit"

# Operations the desktop UI publishes today. The real list is fetched live from
# /api/operations - this only drives short CLI aliases and help text.
OPERATION_ALIASES: dict[str, str] = {
    "events": "events.list",
    "list": "events.list",
    "outline": "events.get-outline",
    "request-body": "events.get-request-body",
    "response-body": "events.get-response-body",
    "clear": "events.clear",
    "proxy": "proxy.get-config",
    "interceptors": "interceptors.list",
    "upgrade": "account.upgrade",
}


class HtkError(Exception):
    """An HTTP Toolkit control-API call failed."""


class HtkNotRunning(HtkError):
    """The HTTP Toolkit control endpoint is not listening."""


# ---------------------------------------------------------------------------
# Control API transport: HTTP/1.1 over a named pipe (Windows) or unix socket
# ---------------------------------------------------------------------------


def control_socket_path() -> str:
    """Returns the IPC path the desktop app's control API listens on."""
    if os.name == "nt":
        return WINDOWS_PIPE
    runtime_dir = os.environ.get("XDG_RUNTIME_DIR")
    if sys.platform.startswith("linux") and runtime_dir:
        return str(Path(runtime_dir) / SOCKET_NAME)
    import tempfile

    tmp = tempfile.gettempdir()
    if tmp in ("/tmp", "/var/tmp"):
        # The app namespaces the socket per uid when using a shared temp dir.
        return str(Path(tmp) / f"httptoolkit-{os.getuid()}" / SOCKET_NAME)
    return str(Path(tmp) / SOCKET_NAME)


class _PipeConn:
    """Uniform send/recv over a Windows named pipe opened as a binary file."""

    def __init__(self, path: str, timeout: float):
        # A pipe that exists but is momentarily busy raises WinError 231; a short
        # retry is cheaper than failing a call the app would have served.
        deadline = time.time() + min(timeout, 5)
        last: OSError | None = None
        while True:
            try:
                self.f = open(path, "r+b", buffering=0)
                return
            except FileNotFoundError as exc:
                raise HtkNotRunning("HTTP Toolkit is not running (control pipe absent).") from exc
            except OSError as exc:
                last = exc
                if getattr(exc, "winerror", None) != 231 or time.time() >= deadline:
                    raise HtkNotRunning(f"Could not open the control pipe: {exc}") from exc
                time.sleep(0.2)
        raise HtkNotRunning(str(last))  # pragma: no cover - unreachable

    def send(self, data: bytes):
        self.f.write(data)

    def recv(self, size: int) -> bytes:
        return self.f.read(size)

    def close(self):
        try:
            self.f.close()
        except OSError:
            pass


class _SocketConn:
    """Uniform send/recv over a unix domain socket."""

    def __init__(self, path: str, timeout: float):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(timeout)
        try:
            self.sock.connect(path)
        except (FileNotFoundError, ConnectionRefusedError) as exc:
            self.sock.close()
            raise HtkNotRunning("HTTP Toolkit is not running (control socket absent).") from exc
        except OSError as exc:
            self.sock.close()
            raise HtkNotRunning(f"Could not connect to the control socket: {exc}") from exc

    def send(self, data: bytes):
        self.sock.sendall(data)

    def recv(self, size: int) -> bytes:
        return self.sock.recv(size)

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


def _decode_chunked(body: bytes) -> bytes:
    out = bytearray()
    rest = body
    while True:
        line, sep, rest = rest.partition(b"\r\n")
        if not sep:
            break
        try:
            size = int(line.split(b";")[0].strip() or b"0", 16)
        except ValueError:
            break
        if size == 0:
            break
        out += rest[:size]
        rest = rest[size + 2:]
    return bytes(out)


class HtkControlClient:
    """Minimal HTTP/1.1 client for the HTTP Toolkit control API."""

    def __init__(self, socket_path: str | None = None, timeout: float = 15.0):
        self.socket_path = socket_path or control_socket_path()
        self.timeout = timeout

    # -- transport ---------------------------------------------------------
    def _connect(self):
        if os.name == "nt":
            return _PipeConn(self.socket_path, self.timeout)
        return _SocketConn(self.socket_path, self.timeout)

    def request(self, method: str, path: str, body: dict | None = None) -> tuple[int, str]:
        """Sends one request and reads the full response. Raises HtkNotRunning if absent."""
        payload = b""
        headers = [f"{method.upper()} {path} HTTP/1.1", "Host: localhost", "Connection: close"]
        if body is not None:
            payload = json.dumps(body).encode("utf-8")
            headers += ["Content-Type: application/json", f"Content-Length: {len(payload)}"]
        raw = ("\r\n".join(headers) + "\r\n\r\n").encode("utf-8") + payload

        conn = self._connect()
        try:
            conn.send(raw)
            chunks: list[bytes] = []
            while True:
                block = conn.recv(65536)
                if not block:
                    break
                chunks.append(block)
        except OSError as exc:
            raise HtkError(f"Control API read failed: {exc}") from exc
        finally:
            conn.close()

        data = b"".join(chunks)
        if not data:
            raise HtkError("Empty response from the HTTP Toolkit control API.")

        head, _, body_bytes = data.partition(b"\r\n\r\n")
        head_text = head.decode("latin-1")
        try:
            status = int(head_text.split("\r\n", 1)[0].split()[1])
        except (IndexError, ValueError) as exc:
            raise HtkError(f"Unparseable response head: {head_text[:120]}") from exc
        if "transfer-encoding: chunked" in head_text.lower():
            body_bytes = _decode_chunked(body_bytes)
        return status, body_bytes.decode("utf-8", "replace")

    def _json(self, method: str, path: str, body: dict | None = None):
        status, text = self.request(method, path, body)
        try:
            parsed = json.loads(text) if text.strip() else None
        except json.JSONDecodeError as exc:
            raise HtkError(f"HTTP {status}: unparseable JSON ({text[:160]})") from exc
        return status, parsed

    # -- API surface -------------------------------------------------------
    def status(self) -> dict:
        """``{'ready': bool}`` when the app is up; raises HtkNotRunning otherwise."""
        _, parsed = self._json("GET", "/api/status")
        return parsed or {}

    def is_running(self) -> bool:
        try:
            self.status()
            return True
        except (HtkNotRunning, HtkError):
            return False

    def is_ready(self) -> bool:
        try:
            return bool(self.status().get("ready"))
        except (HtkNotRunning, HtkError):
            return False

    def operations(self) -> list[dict]:
        """The operations the desktop UI currently publishes, with JSON schemas."""
        _, parsed = self._json("GET", "/api/operations")
        return parsed or []

    def execute(self, name: str, args: dict | None = None, source: str = DEFAULT_SOURCE):
        """Runs one operation and returns its ``data`` payload."""
        status, parsed = self._json(
            "POST", "/api/execute", {"name": name, "args": args or {}, "source": source}
        )
        if isinstance(parsed, dict) and parsed.get("success") is False:
            err = parsed.get("error") or {}
            code = err.get("code") or f"HTTP {status}"
            message = err.get("message") or "operation failed"
            raise HtkError(f"{code}: {message}")
        if status >= 400:
            raise HtkError(f"HTTP {status} from {name}: {json.dumps(parsed)[:200]}")
        if isinstance(parsed, dict) and "data" in parsed:
            return parsed["data"]
        return parsed


# ---------------------------------------------------------------------------
# Installation discovery
# ---------------------------------------------------------------------------


def _resource_candidates() -> list[Path]:
    """Default locations of the desktop app's bundled `resources` directory."""
    if sys.platform == "darwin":
        return [
            Path("/Applications/HTTP Toolkit.app/Contents/Resources"),
            Path.home() / "Applications/HTTP Toolkit.app/Contents/Resources",
        ]
    if os.name == "nt":
        out = []
        for var in ("LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)"):
            base = os.environ.get(var)
            if base:
                out.append(Path(base) / "Programs" / "HTTP Toolkit" / "resources")
                out.append(Path(base) / "HTTP Toolkit" / "resources")
        return out
    return [Path("/opt/HTTP Toolkit/resources")]


def find_htk_resources(config_mgr: ConfigManager | None = None) -> Path | None:
    """Finds the directory holding httptoolkit-ctl / httptoolkit-mcp / httptoolkit-server."""
    candidates: list[Path] = []

    env_res = os.environ.get("HTK_DESKTOP_RESOURCES")
    if env_res:
        candidates.append(Path(env_res))

    if config_mgr is not None:
        cfg = config_mgr.config_data.get("httpToolkitHome")
        if cfg:
            cfg_path = Path(cfg)
            candidates.append(cfg_path)
            candidates.append(cfg_path / "resources")

    candidates.extend(_resource_candidates())

    # An `httptoolkit-ctl` already on PATH points straight at the resources dir.
    on_path = shutil.which("httptoolkit-ctl") or shutil.which("httptoolkit-ctl.cmd")
    if on_path:
        candidates.append(Path(on_path).resolve().parent)

    ext = ".cmd" if os.name == "nt" else ""
    for cand in candidates:
        try:
            if (cand / f"httptoolkit-ctl{ext}").is_file() or (cand / "httptoolkit-server").is_dir():
                return cand.resolve()
        except OSError:
            continue
    return None


def find_htk_exe(config_mgr: ConfigManager | None = None) -> Path | None:
    """Finds the desktop app executable that `rea http start` launches."""
    env_exe = os.environ.get("HTK_DESKTOP_EXE")
    if env_exe and Path(env_exe).is_file():
        return Path(env_exe)

    resources = find_htk_resources(config_mgr)
    if resources:
        # Wrapper scripts live in <app>/resources; the binary sits one level up.
        app_dir = resources.parent
        for rel in ("HTTP Toolkit.exe", "httptoolkit", "MacOS/HTTP Toolkit"):
            cand = app_dir / rel
            if cand.is_file():
                return cand

    if sys.platform == "darwin":
        for cand in (
            Path("/Applications/HTTP Toolkit.app/Contents/MacOS/HTTP Toolkit"),
            Path.home() / "Applications/HTTP Toolkit.app/Contents/MacOS/HTTP Toolkit",
        ):
            if cand.is_file():
                return cand
    elif os.name == "nt":
        for var in ("LOCALAPPDATA", "PROGRAMFILES"):
            base = os.environ.get(var)
            if base:
                cand = Path(base) / "Programs" / "HTTP Toolkit" / "HTTP Toolkit.exe"
                if cand.is_file():
                    return cand
                cand = Path(base) / "HTTP Toolkit" / "HTTP Toolkit.exe"
                if cand.is_file():
                    return cand
    else:
        cand = Path("/opt/HTTP Toolkit/httptoolkit")
        if cand.is_file():
            return cand

    found = shutil.which("httptoolkit")
    return Path(found) if found else None


def find_htk_tool(name: str, config_mgr: ConfigManager | None = None) -> list[str] | None:
    """Returns the command that runs the bundled ``ctl`` or ``mcp`` wrapper."""
    ext = ".cmd" if os.name == "nt" else ""
    resources = find_htk_resources(config_mgr)
    if resources:
        wrapper = resources / f"httptoolkit-{name}{ext}"
        if wrapper.is_file():
            return [str(wrapper)]
        server_bin = resources / "httptoolkit-server" / "bin" / (
            "httptoolkit-server.cmd" if os.name == "nt" else "httptoolkit-server"
        )
        if server_bin.is_file():
            return [str(server_bin), name]

    direct = shutil.which(f"httptoolkit-{name}") or shutil.which(f"httptoolkit-{name}{ext}")
    if direct:
        return [direct]
    server = shutil.which("httptoolkit-server")
    if server:
        return [server, name]
    return None


def htk_server_version(config_mgr: ConfigManager | None = None) -> str | None:
    """Reads the bundled server version from its package.json (no subprocess)."""
    resources = find_htk_resources(config_mgr)
    if not resources:
        return None
    pkg = resources / "httptoolkit-server" / "package.json"
    try:
        return json.loads(pkg.read_text(encoding="utf-8")).get("version")
    except (OSError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------------------
# High-level facade: lifecycle + the operations REA_Kit actually uses
# ---------------------------------------------------------------------------


class HttpToolkit:
    """Starts HTTP Toolkit on demand and reads its captured-traffic log."""

    def __init__(self, config_mgr: ConfigManager | None = None, timeout: float = 15.0):
        self.config_mgr = config_mgr or ConfigManager()
        self.client = HtkControlClient(timeout=timeout)

    # -- lifecycle ---------------------------------------------------------
    def is_ready(self) -> bool:
        return self.client.is_ready()

    def wait_ready(self, timeout: int = 60, poll: float = 0.5) -> bool:
        deadline = time.time() + timeout
        while time.time() < deadline:
            if self.client.is_ready():
                return True
            time.sleep(poll)
        return False

    def start(self, wait: bool = True, timeout: int = 60) -> int:
        """Launches the desktop app if it is not already serving the control API.

        The event log is published by the desktop UI over the operation bridge, so
        the UI process is what has to be running - starting only the headless
        ``httptoolkit-server`` would give you a proxy but no ``events.*`` API.
        """
        if self.client.is_ready():
            log_info("HTTP Toolkit is already running and ready.")
            return 0
        if self.client.is_running():
            log_info("HTTP Toolkit is starting; waiting for the UI to connect...")
        else:
            exe = find_htk_exe(self.config_mgr)
            if not exe:
                log_error("HTTP Toolkit desktop app not found.")
                print_setup_help()
                return 1
            log_info(f"Launching HTTP Toolkit: {exe}")
            creationflags = 0
            if os.name == "nt":
                creationflags = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(
                    subprocess, "CREATE_NEW_PROCESS_GROUP", 0
                )
            try:
                subprocess.Popen(
                    [str(exe)],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=creationflags,
                    start_new_session=(os.name != "nt"),
                )
            except OSError as exc:
                log_error(f"Could not launch HTTP Toolkit: {exc}")
                return 1

        if not wait:
            log_info("Launched (not waiting for readiness).")
            return 0

        log_info(f"Waiting up to {timeout}s for the control API...")
        if self.wait_ready(timeout=timeout):
            log_success("HTTP Toolkit is ready.")
            try:
                cfg = self.proxy_config()
                log_info(f"Proxy listening on port {cfg.get('httpProxyPort')}")
                log_dim(f"CA certificate: {cfg.get('certPath')}")
            except HtkError:
                pass
            return 0

        log_error(f"HTTP Toolkit did not become ready within {timeout}s.")
        log_info("Open the app window once - the UI must connect before the API is usable.")
        return 1

    # -- operations --------------------------------------------------------
    def events(self, filter: str | None = None, limit: int = 20, offset: int = 0) -> dict:
        """Raw ``events.list``: pages from the *oldest* exchange forward."""
        args: dict = {"limit": limit, "offset": offset}
        if filter:
            args["filter"] = filter
        return self.client.execute("events.list", args)

    def recent(self, filter: str | None = None, limit: int = 20) -> dict:
        """Returns the most recent `limit` exchanges, still in chronological order.

        ``events.list`` paginates oldest-first, so "the last 20 requests" means
        seeking to ``total - limit`` rather than reading from offset 0 - otherwise
        a busy session only ever shows the traffic it started with.
        """
        head = self.events(filter=filter, limit=1)
        total = head.get("total") or 0
        if total <= limit:
            return self.events(filter=filter, limit=limit)
        result = self.events(filter=filter, limit=limit, offset=total - limit)
        result.setdefault("total", total)
        return result

    def outline(self, event_id: str) -> dict:
        return self.client.execute("events.get-outline", {"id": event_id})

    def body(
        self,
        event_id: str,
        response: bool = True,
        offset: int = 0,
        max_length: int | None = None,
    ):
        op = "events.get-response-body" if response else "events.get-request-body"
        args: dict = {"id": event_id}
        if offset:
            args["offset"] = offset
        if max_length is not None:
            args["maxLength"] = max_length
        return self.client.execute(op, args)

    def clear(self, clear_pinned: bool = False):
        return self.client.execute("events.clear", {"clearPinned": clear_pinned})

    def proxy_config(self) -> dict:
        return self.client.execute("proxy.get-config", {})

    def interceptors(self) -> list[dict]:
        data = self.client.execute("interceptors.list", {})
        if isinstance(data, dict):
            return data.get("interceptors", [])
        return data or []


# ---------------------------------------------------------------------------
# Terminal reports
# ---------------------------------------------------------------------------


def _fmt_time(ts) -> str:
    try:
        return time.strftime("%H:%M:%S", time.localtime(float(ts) / 1000.0))
    except (TypeError, ValueError):
        return "-"


def _split_url(url: str) -> tuple[str, str]:
    m = re.match(r"^[a-z]+://([^/]+)(.*)$", url or "", re.IGNORECASE)
    if m:
        return m.group(1), m.group(2) or "/"
    return "-", url or "-"


def _status_color(status) -> str:
    try:
        code = int(status)
    except (TypeError, ValueError):
        return Colors.DIM
    if code >= 500:
        return Colors.RED
    if code >= 400:
        return Colors.YELLOW
    if code >= 300:
        return Colors.CYAN
    return Colors.GREEN


def print_events(result: dict, grep: str | None = None, show_ids: bool = True) -> int:
    """Prints the captured-exchange table; returns the number of rows shown."""
    events = (result or {}).get("events") or []
    total = (result or {}).get("total", len(events))

    if grep:
        pattern = re.compile(grep, re.IGNORECASE)
        events = [
            e for e in events
            if pattern.search(e.get("url") or "")
            or pattern.search(e.get("source") or "")
            or pattern.search(str(e.get("method") or ""))
        ]

    if not events:
        log_warn("No captured exchanges matched.")
        return 0

    print(f"\n{Colors.BOLD}Captured exchanges ({len(events)} shown of {total} total){Colors.RESET}\n")
    header = f"  {'Time':<9} {'Method':<7} {'Status':>6}  {'Host':<32} {'Path':<40} Source"
    if show_ids:
        header = f"  {'ID':<8} " + header[2:]
    print(header)
    print("  " + "-" * (len(header) - 2))

    for e in events:
        host, path = _split_url(e.get("url") or "")
        status = e.get("status")
        color = _status_color(status)
        row = (
            f"  {_fmt_time(e.get('timestamp')):<9} "
            f"{str(e.get('method') or e.get('type') or '-')[:7]:<7} "
            f"{color}{str(status if status is not None else '-'):>6}{Colors.RESET}  "
            f"{host[:32]:<32} {path[:40]:<40} "
            f"{Colors.DIM}{(e.get('source') or '-')[:24]}{Colors.RESET}"
        )
        if show_ids:
            row = f"  {Colors.DIM}{(e.get('id') or '')[:8]:<8}{Colors.RESET} " + row[2:]
        print(row)

    print("")
    if show_ids:
        log_dim("Inspect one with: rea http show <id>   (an 8-char prefix is enough)")
    return len(events)


def print_outline(outline: dict):
    """Prints headers, status, timing and body sizes for one exchange."""
    req = outline.get("request") or {}
    res = outline.get("response") or {}
    host, path = _split_url(outline.get("url") or "")

    print(f"\n{Colors.BOLD}{outline.get('method') or outline.get('type')} {outline.get('url')}{Colors.RESET}")
    print(f"  {Colors.DIM}id {outline.get('id')}  |  {_fmt_time(outline.get('timestamp'))}  |  "
          f"HTTP/{outline.get('httpVersion') or '?'}  |  source: {outline.get('source') or '-'}{Colors.RESET}\n")

    print(f"  {Colors.BOLD}Request{Colors.RESET}  ({req.get('bodySize', 0)} byte body)")
    for key, value in (req.get("headers") or {}).items():
        print(f"    {Colors.CYAN}{key}{Colors.RESET}: {value}")

    status = res.get("statusCode")
    color = _status_color(status)
    print(f"\n  {Colors.BOLD}Response{Colors.RESET}  {color}{status} {res.get('statusMessage') or ''}{Colors.RESET}"
          f"  ({res.get('bodySize', 0)} byte body)")
    for key, value in (res.get("headers") or {}).items():
        print(f"    {Colors.CYAN}{key}{Colors.RESET}: {value}")

    timing = outline.get("timing") or {}
    if timing.get("startTimestamp") and timing.get("responseSentTimestamp"):
        elapsed = timing["responseSentTimestamp"] - timing["startTimestamp"]
        print(f"\n  {Colors.BOLD}Duration{Colors.RESET}: {elapsed:.1f} ms")
    if outline.get("tags"):
        print(f"  {Colors.BOLD}Tags{Colors.RESET}: {', '.join(outline['tags'])}")

    print("")
    log_dim(f"Bodies: rea http body {str(outline.get('id'))[:8]} --request | --response")


def print_proxy(cfg: dict):
    print(f"\n{Colors.BOLD}HTTP Toolkit proxy{Colors.RESET}\n")
    rows = [
        ("Proxy port", str(cfg.get("httpProxyPort", "-"))),
        ("CA certificate", str(cfg.get("certPath", "-"))),
        ("Cert fingerprint", str(cfg.get("certFingerprint", "-"))),
    ]
    for label, value in rows:
        print(f"  {label:<18}: {value}")
    addresses = cfg.get("externalNetworkAddresses") or []
    if addresses:
        print(f"  {'Reachable at':<18}: " + ", ".join(f"{a}:{cfg.get('httpProxyPort')}" for a in addresses))
    print("")
    log_dim("Point a device at it with: rea http android --on")


def print_interceptors(interceptors: list[dict], only_available: bool = False, grep: str | None = None):
    if grep:
        pattern = re.compile(grep, re.IGNORECASE)
        interceptors = [i for i in interceptors if pattern.search(i.get("id", "")) or pattern.search(i.get("name", ""))]
    if only_available:
        interceptors = [i for i in interceptors if i.get("isActivable")]
    if not interceptors:
        log_warn("No interceptors matched.")
        return

    print(f"\n{Colors.BOLD}Interceptors ({len(interceptors)}){Colors.RESET}\n")
    print(f"  {'ID':<24} {'State':<12} {'Name'}")
    print("  " + "-" * 70)
    for i in interceptors:
        if i.get("isActive"):
            state, color = "active", Colors.GREEN
        elif i.get("isActivable"):
            state, color = "available", Colors.CYAN
        elif i.get("isSupported"):
            state, color = "unavailable", Colors.DIM
        else:
            state, color = "unsupported", Colors.DIM
        print(f"  {i.get('id', '-')[:24]:<24} {color}{state:<12}{Colors.RESET} {i.get('name', '')}")
    print("")
    log_dim("Activation is driven from the HTTP Toolkit UI (Pro gates it in the API).")
    log_dim("For an ADB device, 'rea http android --on' does the same proxy + cert setup.")


def print_operations(operations: list[dict], verbose: bool = False):
    print(f"\n{Colors.BOLD}HTTP Toolkit operations ({len(operations)}){Colors.RESET}\n")
    for op in operations:
        tiers = ",".join(op.get("tiers") or [])
        free = f"{Colors.GREEN}free{Colors.RESET}" if "free" in (op.get("tiers") or []) else f"{Colors.YELLOW}pro{Colors.RESET}"
        print(f"  {op.get('name', ''):<26} [{free}] {Colors.DIM}tiers: {tiers}{Colors.RESET}")
        desc = (op.get("description") or "").split("\n")[0]
        if desc:
            print(f"        {Colors.DIM}{desc[:120]}{Colors.RESET}")
        if verbose:
            schema = op.get("inputSchema") or {}
            for key, prop in (schema.get("properties") or {}).items():
                required = " (required)" if key in (schema.get("required") or []) else ""
                print(f"        {Colors.CYAN}--{key}{Colors.RESET} <{prop.get('type', 'string')}>{required}")
    print("")
    log_dim("Call any of them: rea http call <operation> -p key=value")


# ---------------------------------------------------------------------------
# Event lookup helpers
# ---------------------------------------------------------------------------


def resolve_event_id(htk: HttpToolkit, prefix: str, search_limit: int = 200) -> str | None:
    """Expands an 8-char id prefix (as printed by `rea http events`) to a full id."""
    if len(prefix) >= 36:
        return prefix
    try:
        result = htk.recent(limit=search_limit)
    except HtkError as exc:
        log_error(str(exc))
        return None
    matches = [e["id"] for e in (result.get("events") or []) if str(e.get("id", "")).startswith(prefix)]
    if not matches:
        log_error(f"No captured exchange starts with '{prefix}' in the last {search_limit} events.")
        return None
    if len(matches) > 1:
        log_warn(f"'{prefix}' matches {len(matches)} exchanges; using the most recent.")
    return matches[-1]  # the log is chronological, so the last match is newest


def resolve_operation(client: HtkControlClient, name: str) -> tuple[str, list[str] | None]:
    """Maps an alias to a real operation name and validates it against the live list.

    Returns ``(resolved_name, None)`` when the operation exists, or
    ``(resolved_name, available_names)`` when it does not - so the caller can say
    what *is* callable instead of relaying the server's bare HTTP 500.
    """
    resolved = OPERATION_ALIASES.get(name, name)
    try:
        available = [o.get("name") for o in client.operations() if o.get("name")]
    except HtkError:
        return resolved, None  # cannot validate; let the call itself report
    if not available or resolved in available:
        return resolved, None
    return resolved, available


def watch_events(
    htk: HttpToolkit,
    filter: str | None = None,
    interval: float = 2.0,
    batch: int = 50,
    grep: str | None = None,
) -> int:
    """Streams newly captured exchanges until interrupted.

    The API has no push channel, so this polls the *tail* of the log and prints only
    ids it has not seen yet - enough to follow a live session driven by `rea scrcpy`.
    Polling from offset 0 would pin the window to the oldest exchanges and never
    surface new traffic, since ``events.list`` paginates oldest-first.
    """
    seen: set[str] = set()
    pattern = re.compile(grep, re.IGNORECASE) if grep else None
    first_pass = True

    # Fail fast if nothing is listening yet: the in-loop HtkNotRunning handler exists to
    # ride out a restart mid-session, and would otherwise silently spin here forever.
    if not htk.is_ready():
        log_error("HTTP Toolkit is not running (or its UI has not connected yet).")
        log_info("Start it with: rea http start - then 'rea http' to listen.")
        return 1

    try:
        cfg = htk.proxy_config()
        log_dim(f"proxy port {cfg.get('httpProxyPort')}")
    except HtkError:
        pass

    log_info(f"Watching for new exchanges every {interval:g}s - press Ctrl+C to stop.")
    if filter:
        log_dim(f"filter: {filter}")
    print("")
    header = f"  {'ID':<8} {'Time':<9} {'Method':<7} {'Status':>6}  {'Host':<32} {'Path':<40} Source"
    print(header)
    print("  " + "-" * (len(header) - 2), flush=True)

    try:
        while True:
            try:
                result = htk.recent(filter=filter, limit=batch)
            except HtkNotRunning:
                log_warn("HTTP Toolkit stopped responding; waiting for it to come back...")
                time.sleep(interval)
                continue
            except HtkError as exc:
                log_error(str(exc))
                return 1

            events = result.get("events") or []
            # Already chronological, so the feed reads downward as traffic arrives.
            fresh = [e for e in events if e.get("id") and e["id"] not in seen]
            for e in fresh:
                seen.add(e["id"])
                if first_pass:
                    continue  # don't replay the backlog, just take note of it
                if pattern and not (
                    pattern.search(e.get("url") or "") or pattern.search(e.get("source") or "")
                ):
                    continue
                host, path = _split_url(e.get("url") or "")
                color = _status_color(e.get("status"))
                print(
                    f"  {Colors.DIM}{e['id'][:8]:<8}{Colors.RESET} "
                    f"{_fmt_time(e.get('timestamp')):<9} "
                    f"{str(e.get('method') or e.get('type') or '-')[:7]:<7} "
                    f"{color}{str(e.get('status') if e.get('status') is not None else '-'):>6}{Colors.RESET}  "
                    f"{host[:32]:<32} {path[:40]:<40} "
                    f"{Colors.DIM}{(e.get('source') or '-')[:24]}{Colors.RESET}",
                    flush=True,
                )
            if first_pass:
                log_dim(f"{len(seen)} existing exchange(s) skipped; showing new traffic only.")
                sys.stdout.flush()
                first_pass = False
            time.sleep(interval)
    except KeyboardInterrupt:
        print("")
        log_info(f"Stopped. {len(seen)} exchange(s) seen this session.")
        return 0


def save_events(config_mgr: ConfigManager, target: str, result: dict, label: str | None = None) -> Path | None:
    """Writes a captured-traffic snapshot into the target's workspace."""
    pkg = config_mgr.resolve_package_name(target)
    if not pkg:
        log_error(f"Could not resolve package name from '{target}'")
        return None
    traffic_dir = config_mgr.get_app_paths(pkg)["traffic"]
    ensure_dir(traffic_dir)
    stamp = time.strftime("%Y%m%d_%H%M%S")
    name = f"traffic_{label}_{stamp}.json" if label else f"traffic_{stamp}.json"
    out = traffic_dir / name
    payload = {
        "package": pkg,
        "captured": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "total": result.get("total"),
        "events": result.get("events") or [],
    }
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    log_success(f"Saved {len(payload['events'])} exchange(s) -> {out}")
    return out


# ---------------------------------------------------------------------------
# Android device wiring (proxy + CA certificate over ADB)
# ---------------------------------------------------------------------------


def _adb_base(serial: str | None = None) -> list[str]:
    adb = os.environ.get("ADB_PATH") or shutil.which("adb") or "adb"
    return [adb, "-s", serial] if serial else [adb]


def _adb(args: list[str], serial: str | None = None, capture: bool = True):
    cmd = _adb_base(serial) + args
    try:
        return subprocess.run(
            cmd,
            stdout=subprocess.PIPE if capture else None,
            stderr=subprocess.STDOUT if capture else None,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        log_error("adb not found in PATH. Run 'rea env' to check the environment.")
        return None
    except subprocess.SubprocessError as exc:
        log_error(f"adb failed: {exc}")
        return None


def android_proxy_on(
    htk: HttpToolkit,
    serial: str | None = None,
    host: str | None = None,
    push_cert: bool = True,
) -> int:
    """Points a connected device at the running HTTP Toolkit proxy.

    Uses ``adb reverse`` so the device reaches the proxy on its own loopback - that
    survives Wi-Fi changes and works on emulators, which is what HTTP Toolkit's own
    android-adb interceptor does. ``--host`` overrides with a LAN address instead.
    """
    try:
        cfg = htk.proxy_config()
    except HtkError as exc:
        log_error(str(exc))
        return 1

    port = cfg.get("httpProxyPort")
    if not port:
        log_error("HTTP Toolkit did not report a proxy port; is a proxy started in the UI?")
        return 1

    if host:
        proxy_target = f"{host}:{port}"
        log_info(f"Using explicit proxy address {proxy_target}")
    else:
        res = _adb(["reverse", f"tcp:{port}", f"tcp:{port}"], serial)
        if res is None:
            return 1
        if res.returncode != 0:
            log_warn(f"adb reverse failed: {(res.stdout or '').strip()}")
            addresses = cfg.get("externalNetworkAddresses") or []
            if not addresses:
                log_error("No fallback address available; pass --host <lan-ip>.")
                return 1
            proxy_target = f"{addresses[0]}:{port}"
            log_info(f"Falling back to the LAN address {proxy_target}")
        else:
            proxy_target = f"127.0.0.1:{port}"
            log_success(f"adb reverse tcp:{port} -> host proxy")

    res = _adb(["shell", "settings", "put", "global", "http_proxy", proxy_target], serial)
    if res is None or res.returncode != 0:
        log_error(f"Could not set the device proxy: {(res.stdout or '').strip() if res else ''}")
        return 1
    log_success(f"Device proxy set to {proxy_target}")

    if push_cert:
        cert_path = cfg.get("certPath")
        if cert_path and Path(cert_path).is_file():
            remote = "/data/local/tmp/httptoolkit-ca.pem"
            res = _adb(["push", str(cert_path), remote], serial)
            if res is not None and res.returncode == 0:
                log_success(f"CA certificate pushed to {remote}")
                log_dim(f"Fingerprint: {cfg.get('certFingerprint')}")
                log_info("Install it so the app trusts HTTPS:")
                log_dim("  user store:   Settings > Security > Encryption & credentials > Install a certificate")
                log_dim("  rooted/system: remount /system and copy it into /system/etc/security/cacerts as <hash>.0")
                log_dim("  per-app:      add a debuggable network_security_config trusting user CAs")
            else:
                log_warn(f"Could not push the certificate: {(res.stdout or '').strip() if res else ''}")
        else:
            log_warn(f"CA certificate not found at {cert_path}")

    print("")
    log_info("Traffic now flows through HTTP Toolkit. Watch it with: rea http watch")
    return 0


def android_proxy_off(
    serial: str | None = None,
    port: int | None = None,
    htk: "HttpToolkit | None" = None,
) -> int:
    """Clears the device proxy and the reverse tunnel this tool created.

    Only the proxy port's own tunnel is removed. HTTP Toolkit's android-adb
    interceptor keeps its own ``adb reverse`` entry on that same port, and other
    tooling may hold unrelated ones, so a blanket ``--remove-all`` would break
    interception that REA_Kit did not set up.
    """
    res = _adb(["shell", "settings", "put", "global", "http_proxy", ":0"], serial)
    if res is None or res.returncode != 0:
        log_error(f"Could not clear the device proxy: {(res.stdout or '').strip() if res else ''}")
        return 1
    log_success("Device proxy cleared.")

    if port is None and htk is not None:
        try:
            port = htk.proxy_config().get("httpProxyPort")
        except HtkError:
            port = None

    if port:
        _adb(["reverse", "--remove", f"tcp:{port}"], serial)
        log_info(f"Removed the adb reverse tunnel on tcp:{port}.")
        log_dim("If HTTP Toolkit's own Android interceptor is active, re-activate it in the UI.")
    else:
        log_warn("Proxy port unknown; left adb reverse tunnels untouched.")
        log_dim("Remove one explicitly with: rea http android --off --port <port>")
    return 0


def export_cert(htk: HttpToolkit, out_path: Path | str | None = None) -> int:
    """Copies the HTTP Toolkit CA certificate somewhere useful."""
    try:
        cfg = htk.proxy_config()
    except HtkError as exc:
        log_error(str(exc))
        return 1
    cert_path = cfg.get("certPath")
    if not cert_path or not Path(cert_path).is_file():
        log_error(f"CA certificate not found at {cert_path}")
        return 1
    if not out_path:
        print(Path(cert_path).read_text(encoding="utf-8"))
        return 0
    dest = Path(out_path)
    ensure_dir(dest.parent)
    shutil.copyfile(cert_path, dest)
    log_success(f"CA certificate copied -> {dest}")
    log_dim(f"Fingerprint: {cfg.get('certFingerprint')}")
    return 0


# ---------------------------------------------------------------------------
# MCP bridge passthrough
# ---------------------------------------------------------------------------


def run_mcp_bridge(config_mgr: ConfigManager | None = None, extra_args: list[str] | None = None) -> int:
    """Runs HTTP Toolkit's own stdio MCP server so an AI client can drive it.

    Everything this function prints goes to **stderr**: in stdio MCP transport the
    child's stdout is the JSON-RPC channel, and a stray log line there is parsed as
    a message and breaks the handshake. The bridge itself already logs to stderr.
    """
    cmd = find_htk_tool("mcp", config_mgr)
    if not cmd:
        print("[-] The HTTP Toolkit MCP bridge was not found.", file=sys.stderr)
        print("    Install the desktop app: https://httptoolkit.com/download/", file=sys.stderr)
        return 1
    cmd = cmd + (extra_args or [])
    print(f"[*] Launching HTTP Toolkit MCP bridge: {' '.join(cmd)}", file=sys.stderr)
    try:
        return subprocess.run(cmd).returncode
    except KeyboardInterrupt:
        return 0


def print_mcp_config(config_mgr: ConfigManager | None = None) -> int:
    """Prints MCP client configuration for the bundled bridge."""
    cmd = find_htk_tool("mcp", config_mgr)
    if not cmd:
        log_error("The HTTP Toolkit MCP bridge was not found.")
        print_setup_help()
        return 1
    config = {
        "mcpServers": {
            "http-toolkit": {
                "type": "stdio",
                "command": cmd[0],
                "args": cmd[1:],
            }
        }
    }
    print(json.dumps(config, indent=2))
    print(f"\n{Colors.BOLD}Add it to Claude Code:{Colors.RESET}")
    print(f"  claude mcp add http-toolkit -- {' '.join(cmd)}\n")
    return 0


def run_ctl(config_mgr: ConfigManager | None = None, extra_args: list[str] | None = None) -> int:
    """Runs the bundled httptoolkit-ctl directly (its operations need Pro)."""
    cmd = find_htk_tool("ctl", config_mgr)
    if not cmd:
        log_error("httptoolkit-ctl was not found.")
        print_setup_help()
        return 1
    return subprocess.run(cmd + (extra_args or [])).returncode


# ---------------------------------------------------------------------------
# Setup help and doctor
# ---------------------------------------------------------------------------


def print_setup_help():
    print(
        f"""
{Colors.BOLD}HTTP Toolkit setup:{Colors.RESET}

  1. Install the desktop app (it bundles the server, ctl and MCP wrappers):
       {Colors.CYAN}https://httptoolkit.com/download/{Colors.RESET}

  2. If it lives somewhere unusual, point REA_Kit at it:
       {Colors.CYAN}"httpToolkitHome": "<app dir>"{Colors.RESET}  in workspace_config.json
     ...or set {Colors.CYAN}HTK_DESKTOP_RESOURCES{Colors.RESET} / {Colors.CYAN}HTK_DESKTOP_EXE{Colors.RESET}.

  3. Verify:
       {Colors.CYAN}rea http setup{Colors.RESET}

{Colors.BOLD}Typical dynamic session:{Colors.RESET}

  {Colors.CYAN}rea http start{Colors.RESET}                       launch the app and wait for its API
  {Colors.CYAN}rea http android --on{Colors.RESET}                point the ADB device at the proxy
  {Colors.CYAN}rea scrcpy ...{Colors.RESET}                       drive the app while traffic is captured
  {Colors.CYAN}rea http watch{Colors.RESET}                       stream new exchanges as they arrive
  {Colors.CYAN}rea http events -f "hostname*=api"{Colors.RESET}   filter the captured log
  {Colors.CYAN}rea http show <id>{Colors.RESET}                   headers, status and timing
  {Colors.CYAN}rea http body <id> --response{Colors.RESET}        dump a body
  {Colors.CYAN}rea http android --off{Colors.RESET}               hand the device back

{Colors.BOLD}Tiering:{Colors.RESET} REA_Kit reads the log through the free-tier MCP operation path.
  Free tier caps outline calls (500/session) and body calls (100/session, 100k chars).
  httptoolkit-ctl itself requires Pro for every operation - 'rea http' does not use it.
"""
    )


def doctor(config_mgr: ConfigManager) -> int:
    """Reports the state of every HTTP Toolkit prerequisite."""
    print("")
    ok = True

    resources = find_htk_resources(config_mgr)
    if resources:
        version = htk_server_version(config_mgr)
        log_success(f"HTTP Toolkit resources: {resources}" + (f" (server {version})" if version else ""))
    else:
        log_error("HTTP Toolkit installation not found.")
        ok = False

    exe = find_htk_exe(config_mgr)
    if exe:
        log_success(f"Desktop app: {exe}")
    else:
        log_warn("Desktop app executable not found - 'rea http start' cannot launch it.")

    for tool in ("ctl", "mcp"):
        cmd = find_htk_tool(tool, config_mgr)
        if cmd:
            log_success(f"httptoolkit-{tool}: {' '.join(cmd)}")
        else:
            log_warn(f"httptoolkit-{tool} wrapper not found.")

    sock = control_socket_path()
    client = HtkControlClient(timeout=5)
    try:
        status = client.status()
        if status.get("ready"):
            log_success(f"Control API live on {sock} (UI connected)")
        else:
            log_warn(f"Control API live on {sock} but the UI has not connected yet.")
    except HtkNotRunning:
        log_info(f"HTTP Toolkit is not running ({sock}). Start it with: rea http start")
        print_setup_help()
        return 0 if ok else 1
    except HtkError as exc:
        log_warn(f"Control API error: {exc}")

    try:
        operations = client.operations()
        free = [o for o in operations if "free" in (o.get("tiers") or [])]
        log_success(f"Operations published: {len(operations)} ({len(free)} usable on the free tier)")
    except HtkError as exc:
        log_warn(f"Could not list operations: {exc}")
        operations = []

    if operations:
        htk = HttpToolkit(config_mgr)
        try:
            cfg = htk.proxy_config()
            log_success(f"Proxy port {cfg.get('httpProxyPort')}, CA cert {cfg.get('certPath')}")
        except HtkError as exc:
            log_warn(f"Proxy config unavailable: {exc}")
        try:
            result = htk.events(limit=1)
            log_success(f"Event log reachable: {result.get('total', 0)} exchange(s) captured")
        except HtkError as exc:
            log_warn(f"Event log unavailable: {exc}")

    adb = os.environ.get("ADB_PATH") or shutil.which("adb")
    if adb:
        log_success(f"adb: {adb} (needed for 'rea http android')")
    else:
        log_warn("adb not found - 'rea http android' will not work.")

    if not ok:
        print_setup_help()
    print("")
    return 0 if ok else 1
