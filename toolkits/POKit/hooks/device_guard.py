#!/usr/bin/env python3
"""PreToolUse gate: the root session delegates device work, it does not do it.

Ported from REAKit's `write_guard.py` (github.com/impeterwayne/REAKit) and retargeted from
"the root session doesn't write code" to this project's actual invariant: "the root session
doesn't drive the device and doesn't write the spec — `business-analyst` does." The
classification mechanism (root vs. delegate) is copied verbatim; only what gets gated changes.

**Why an agent's tool list can't carry this invariant.** `orchestrator.md`'s empty write-tool
list *looks* like it forces delegation, but REAKit's own hook docstring records the field fact
that killed that plan: `agy --agent <name>` does not load a custom agent in CLI 1.1.22, so a
custom `mainAgent`'s restricted tool list enforces nothing. Antigravity does not actually cut
tools based on a persona's frontmatter. So the invariant has to be re-homed into something the
platform *does* enforce — a `PreToolUse` hook's `deny` verdict — rather than trusted to agent
identity.

**Root vs. delegate, without a parent pointer.** The PreToolUse payload carries no parent
pointer, so root/delegate has to be read out of the transcripts, directionally: a parent's
spawn record and a child's report-back both name the other conversation, so a plain
"does another transcript mention my id" test matches both ways round.

    parent, on spawning:   GENERIC  'Created the following subagents:\n{ "conversationId": "<child>"'
    child, on reporting:   GENERIC  'Message sent to "<parent>"'  + a send_message tool call

Only the *spawn* record establishes "I am a delegate" — a report-back mentions the parent too,
which is exactly why a non-directional substring test misclassifies every parent as a delegate.

**What is gated, and why.** Two things, both because they belong to `business-analyst`, not the
session the human is talking to:

  - `run_command` invoking a real `scrcpy-cli` device action (tap/swipe/write/key/app-start/
    screenshot/ui-dump/...) — reuses `loop.py`'s `DEVICE_ACTION` pattern so "what counts as
    touching the device" has exactly one definition across the goal-quality gate and this hook.
    `device-list`/`daemon status` are not gated — they inspect, they don't act.
  - a write into `docs/spec/**` — the spec is completion proof for evidence `business-analyst`
    itself captured; a root-authored spec entry has no screenshot/dump behind it by construction.

**What is UNVERIFIED, unlike the rest of this harness.** `stop_verifier.py`'s Stop-payload
fields and `write_guard.py`'s `write_to_file` arg shape (`TargetFile`) were confirmed against
real Antigravity transcripts. Nobody has done that for `run_command`'s argument key here — and
REAKit deliberately avoided ever needing to know it (see `scrcpy_daemon.py`'s own note: "a
PreToolUse hook on run_command would have to return a decision for every shell command", given
as a reason to prefer PreInvocation/Stop for that hook instead). Rather than guess a key name
(`CommandLine`? `Command`? `command`?) and risk silently matching nothing, `extract_command`
below scans every string value in `args` for the device-action pattern. Confirm the real key
against a live payload before trusting this further, the way `stop_verifier.py` did.

    python hooks/device_guard.py             # hook mode, reads a PreToolUse payload
    python hooks/device_guard.py --self-test
    python hooks/device_guard.py --status
    python hooks/device_guard.py --off / --on
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
import time
from pathlib import Path

PASS_DECISION = "ask"  # never "allow": that would silently auto-approve every call

HOOKS_DIR = Path(__file__).resolve().parent
AGENTS_DIR = HOOKS_DIR.parent
PROJECT_ROOT = AGENTS_DIR.parent
STATE_DIR = AGENTS_DIR / "state" / "device_guard"
OFF_SWITCH = STATE_DIR / "off"
LOOP_CLI = AGENTS_DIR / "scripts" / "loop.py"

BRAIN_DIR = Path.home() / ".gemini" / "antigravity-cli" / "brain"
TRANSCRIPTS = (
    Path(".system_generated") / "logs" / "transcript_full.jsonl",
    Path(".system_generated") / "logs" / "transcript.jsonl",
)

# The parent writes this when it creates a subagent, alongside the child's conversationId.
# Copied from write_guard.py — same platform, same fact, no reason to re-derive it.
SPAWN_MARKER = b"Created the following subagents"

SCAN_MAX_AGE_S = 24 * 60 * 60
SCAN_MAX_DIRS = 60
READ_CAP_BYTES = 4 * 1024 * 1024

GATED_TOOLS = {"run_command", "write_to_file", "replace_file_content", "multi_replace_file_content"}
WRITE_TOOLS = {"write_to_file", "replace_file_content", "multi_replace_file_content"}


def loop_module():
    """Import scripts/loop.py so DEVICE_ACTION has exactly one definition in the harness."""
    spec = importlib.util.spec_from_file_location("agy_loop", LOOP_CLI)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {LOOP_CLI}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def in_project(path: str) -> bool:
    """True if path resolves inside the project that owns this hook. Errs toward True."""
    try:
        Path(path).resolve().relative_to(PROJECT_ROOT.resolve())
        return True
    except ValueError:
        return False
    except Exception:
        return True


def is_spec_write(path: str) -> bool:
    try:
        rel = Path(path).resolve().relative_to(PROJECT_ROOT.resolve())
    except (ValueError, Exception):
        return False
    parts = rel.parts
    return len(parts) >= 2 and parts[0] == "docs" and parts[1] == "spec"


def extract_target(args) -> str | None:
    """Best-effort write-target path from a write tool's args. Mirrors write_guard.py."""
    if not isinstance(args, dict):
        return None
    for key, val in args.items():
        if not isinstance(val, str):
            continue
        k = key.lower()
        if "targetfile" in k or k.endswith("path") or k == "file":
            return val
    return None


def extract_command_strings(args) -> list[str]:
    """Every string value in a run_command call's args.

    The real argument key for the command line is unverified (see module docstring) — scanning
    every string value costs nothing extra per call and cannot be defeated by a wrong guess.
    """
    if not isinstance(args, dict):
        return []
    return [val for val in args.values() if isinstance(val, str)]


def transcript_for(brain: Path):
    for rel in TRANSCRIPTS:
        candidate = brain / rel
        if candidate.exists():
            return candidate
    return None


def spawned_by_another(conversation_id: str, brain_root: Path | None = None) -> bool:
    """True if some other conversation's transcript records *spawning* this one."""
    root = brain_root or BRAIN_DIR
    if not conversation_id or not root.is_dir():
        return False

    needle = conversation_id.encode("utf-8", "ignore")
    now = time.time()

    candidates = []
    for entry in root.iterdir():
        if not entry.is_dir() or entry.name == conversation_id:
            continue
        try:
            age = now - entry.stat().st_mtime
        except OSError:
            continue
        if age > SCAN_MAX_AGE_S:
            continue
        candidates.append((age, entry))

    candidates.sort(key=lambda pair: pair[0])

    for _, entry in candidates[:SCAN_MAX_DIRS]:
        path = transcript_for(entry)
        if path is None:
            continue
        try:
            with path.open("rb") as handle:
                read = 0
                for line in handle:
                    read += len(line)
                    if read > READ_CAP_BYTES:
                        break
                    if needle in line and SPAWN_MARKER in line:
                        return True
        except OSError:
            continue
    return False


def cache_path(conversation_id: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "._-" else "_" for c in conversation_id)
    return STATE_DIR / f"{safe}.json"


def read_cache(conversation_id: str):
    try:
        return json.loads(cache_path(conversation_id).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def write_cache(conversation_id: str, role: str) -> None:
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path(conversation_id).write_text(
            json.dumps({"conversationId": conversation_id, "role": role, "ts": time.time()}),
            encoding="utf-8",
        )
    except OSError:
        pass


def classify(conversation_id: str, brain_root: Path | None = None,
             state_dir: Path | None = None) -> str:
    """'delegate' | 'root' | 'unknown'. Cached: a conversation never changes role.

    Only 'delegate' is cached — 'root' is inferred from absence, which is also what a
    not-yet-flushed parent transcript looks like, so it must stay re-checkable.
    """
    global STATE_DIR
    if state_dir is not None:
        STATE_DIR = state_dir

    if not conversation_id:
        return "unknown"

    cached = read_cache(conversation_id)
    if cached and cached.get("role") == "delegate":
        return "delegate"

    if spawned_by_another(conversation_id, brain_root):
        write_cache(conversation_id, "delegate")
        return "delegate"
    return "root"


def hook_mode() -> None:
    verdict = {"decision": PASS_DECISION}
    try:
        if OFF_SWITCH.exists():
            print(json.dumps(verdict))
            return

        payload = json.loads(sys.stdin.read() or "{}")
        call = payload.get("toolCall") or {}
        tool_name = call.get("name") or ""
        conversation_id = payload.get("conversationId") or ""
        args = call.get("args")

        if tool_name not in GATED_TOOLS:
            print(json.dumps(verdict))
            return

        problem = None
        if tool_name == "run_command":
            device_action = loop_module().DEVICE_ACTION
            if any(device_action.search(s) for s in extract_command_strings(args)):
                problem = (
                    "driving the device with scrcpy-cli belongs to business-analyst, not the "
                    "session the human is talking to."
                )
        elif tool_name in WRITE_TOOLS:
            path = extract_target(args)
            if path and in_project(path) and is_spec_write(path):
                problem = (
                    f"{Path(path).name} is under docs/spec/ — that's completion proof for "
                    "evidence business-analyst captured, not something to author from here."
                )

        if problem and classify(conversation_id) == "root":
            verdict = {
                "decision": "deny",
                "reason": (
                    f"This session delegates device-driving and spec-writing; it does not do "
                    f"either itself. {problem}\n"
                    "  invoke_subagent(TypeName='business-analyst')\n"
                    "Give it the flow, the constraints, and any screens already captured; then "
                    "verify its result with view_file — its summary is a claim, not evidence.\n"
                    "To lift this for the session: run "
                    "`python .agents/hooks/device_guard.py --off`."
                ),
            }
    except Exception as exc:  # fail open: never block work over our own bug
        print(f"device_guard: {type(exc).__name__}: {exc}", file=sys.stderr)

    print(json.dumps(verdict))


# --------------------------------------------------------------------------
# self-test
# --------------------------------------------------------------------------


def self_test() -> int:
    import shutil
    import tempfile

    global STATE_DIR, OFF_SWITCH, BRAIN_DIR
    tmp = Path(tempfile.mkdtemp(prefix="device-guard-selftest-"))
    failures: list[str] = []

    def check(name: str, condition: bool, detail: str = "") -> None:
        if condition:
            print(f"  ok   {name}")
        else:
            failures.append(f"{name}: {detail}")
            print(f"  FAIL {name} {detail}")

    def make_brain(root: Path, conv: str, body: str = "") -> Path:
        d = root / conv / ".system_generated" / "logs"
        d.mkdir(parents=True, exist_ok=True)
        (d / "transcript_full.jsonl").write_text(body, encoding="utf-8")
        return root / conv

    def run_hook(payload: dict) -> dict:
        import io

        stdin, stdout = sys.stdin, sys.stdout
        sys.stdin = io.StringIO(json.dumps(payload))
        sys.stdout = io.StringIO()
        try:
            hook_mode()
            return json.loads(sys.stdout.getvalue())
        finally:
            sys.stdin, sys.stdout = stdin, stdout

    try:
        brain = tmp / "brain"
        brain.mkdir()
        STATE_DIR = tmp / "state"
        OFF_SWITCH = STATE_DIR / "off"
        BRAIN_DIR = brain

        def spawn_record(child_id: str) -> str:
            return json.dumps({
                "type": "GENERIC", "source": "MODEL",
                "content": 'Created the following subagents:\n{\n  "conversationId":  '
                           f'"{child_id}",\n  "typeName": "business-analyst"\n}}',
            }) + "\n"

        def report_record(parent_id: str) -> str:
            return json.dumps({
                "type": "GENERIC", "source": "MODEL",
                "content": f'Message sent to "{parent_id}".',
            }) + "\n"

        parent, child = "conv-parent", "conv-child"
        make_brain(brain, parent, spawn_record(child))
        make_brain(brain, child, report_record(parent))

        # --- classification (identical mechanism to write_guard.py) ---------
        check("child is a delegate", classify(child, brain, STATE_DIR) == "delegate")
        check("parent is root DESPITE the child naming it in a report",
              classify(parent, brain, STATE_DIR) == "root")

        # --- device-action detection ------------------------------------
        check("tap is a device action",
              bool(loop_module().DEVICE_ACTION.search("scrcpy-cli tap 540 1200")))
        check("device-list is NOT a device action",
              not loop_module().DEVICE_ACTION.search("scrcpy-cli device-list"))

        # --- spec-write detection ----------------------------------------
        check("docs/spec/login.md is a spec write",
              is_spec_write(str(PROJECT_ROOT / "docs" / "spec" / "login.md")))
        check("docs/other.md is not", not is_spec_write(str(PROJECT_ROOT / "docs" / "other.md")))
        check("README.md is not", not is_spec_write(str(PROJECT_ROOT / "README.md")))

        # --- hook verdicts: run_command ------------------------------------
        deny_tap = run_hook({
            "conversationId": parent,
            "toolCall": {"name": "run_command", "args": {"CommandLine": "scrcpy-cli tap 540 1200"}},
        })
        check("root tapping the device is denied", deny_tap.get("decision") == "deny")
        check("denial names business-analyst", "business-analyst" in (deny_tap.get("reason") or ""))

        allow_list = run_hook({
            "conversationId": parent,
            "toolCall": {"name": "run_command", "args": {"CommandLine": "scrcpy-cli device-list"}},
        })
        check("root listing devices passes", allow_list.get("decision") == PASS_DECISION)

        allow_child_tap = run_hook({
            "conversationId": child,
            "toolCall": {"name": "run_command", "args": {"CommandLine": "scrcpy-cli tap 540 1200"}},
        })
        check("delegate tapping the device passes", allow_child_tap.get("decision") == PASS_DECISION)

        # Unknown arg key still matches, because every string value is scanned.
        deny_unknown_key = run_hook({
            "conversationId": parent,
            "toolCall": {"name": "run_command", "args": {"cmd": "scrcpy-cli swipe 0 0 1 1 100"}},
        })
        check("an unrecognised arg key is still scanned",
              deny_unknown_key.get("decision") == "deny")

        # --- hook verdicts: spec writes -------------------------------------
        spec_path = str(PROJECT_ROOT / "docs" / "spec" / "login.md")
        deny_spec = run_hook({
            "conversationId": parent,
            "toolCall": {"name": "write_to_file", "args": {"TargetFile": spec_path}},
        })
        check("root writing the spec is denied", deny_spec.get("decision") == "deny")

        allow_other_doc = run_hook({
            "conversationId": parent,
            "toolCall": {"name": "write_to_file",
                        "args": {"TargetFile": str(PROJECT_ROOT / "docs" / "notes.md")}},
        })
        check("root writing a non-spec doc passes", allow_other_doc.get("decision") == PASS_DECISION)

        allow_child_spec = run_hook({
            "conversationId": child,
            "toolCall": {"name": "write_to_file", "args": {"TargetFile": spec_path}},
        })
        check("delegate writing the spec passes", allow_child_spec.get("decision") == PASS_DECISION)

        # --- ungated tools pass through untouched ---------------------------
        check("view_file is never gated",
              run_hook({"conversationId": parent,
                        "toolCall": {"name": "view_file", "args": {"TargetFile": spec_path}}}
                       ).get("decision") == PASS_DECISION)

        # --- edge cases ------------------------------------------------------
        check("unparseable args pass",
              run_hook({"conversationId": parent,
                        "toolCall": {"name": "run_command", "args": "not-a-dict"}}
                       ).get("decision") == PASS_DECISION)
        check("missing conversationId passes",
              run_hook({"toolCall": {"name": "run_command",
                                     "args": {"CommandLine": "scrcpy-cli tap 0 0"}}}
                       ).get("decision") == PASS_DECISION)
        check("empty payload passes", run_hook({}).get("decision") == PASS_DECISION)

        # --- escape hatch ------------------------------------------------------
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        OFF_SWITCH.write_text("off", encoding="utf-8")
        check("off switch lifts the gate",
              run_hook({"conversationId": parent,
                        "toolCall": {"name": "run_command",
                                     "args": {"CommandLine": "scrcpy-cli tap 0 0"}}}
                       ).get("decision") == PASS_DECISION)
        OFF_SWITCH.unlink()
        check("gate returns once the off switch is removed",
              run_hook({"conversationId": parent,
                        "toolCall": {"name": "run_command",
                                     "args": {"CommandLine": "scrcpy-cli tap 0 0"}}}
                       ).get("decision") == "deny")

        # --- garbage in ---------------------------------------------------
        import io
        stdin, stdout = sys.stdin, sys.stdout
        sys.stdin, sys.stdout = io.StringIO("not json at all"), io.StringIO()
        try:
            hook_mode()
            out = sys.stdout.getvalue()
        finally:
            sys.stdin, sys.stdout = stdin, stdout
        check("garbage stdin still emits valid JSON",
              json.loads(out).get("decision") == PASS_DECISION)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print()
    if failures:
        print(f"{len(failures)} failure(s):")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("all self-tests passed")
    return 0


def status_mode() -> int:
    print(f"off switch : {OFF_SWITCH} "
          f"{'EXISTS (gate lifted)' if OFF_SWITCH.exists() else 'absent (gate active)'}")
    print(f"brain dir  : {BRAIN_DIR} {'ok' if BRAIN_DIR.is_dir() else 'MISSING'}")
    print(f"state dir  : {STATE_DIR}")
    if STATE_DIR.is_dir():
        cached = sorted(p.stem for p in STATE_DIR.glob("*.json"))
        print(f"delegates cached: {len(cached)}")
        for name in cached[:10]:
            print(f"  {name}")
    return 0


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        return self_test()
    if "--status" in argv:
        return status_mode()
    if "--off" in argv:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        OFF_SWITCH.write_text("off\n", encoding="utf-8")
        print(f"device guard lifted ({OFF_SWITCH}). Re-arm with --on.")
        return 0
    if "--on" in argv:
        OFF_SWITCH.unlink(missing_ok=True)
        print("device guard armed.")
        return 0
    hook_mode()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
