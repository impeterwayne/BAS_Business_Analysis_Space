# Agentic Harness Guide (`.agents/` + `rea harness`)

REAKit ships a **reverse-engineering agent harness** — a drop-in `.agents/` payload that equips
Google Antigravity (IDE & `agy` CLI) with senior-analyst guardrails, agent personas, domain
skills, and deterministic safety hooks tuned for Android reverse engineering. It follows the same
standard as the AndroidHarnessAGY engineering harness, retargeted from *building* apps to *taking
them apart*.

The whole payload is one directory, `.agents/`. Nothing is written to a project's root, so
`rea harness init` is a self-contained, reversible drop-in. The injected agents call the globally
installed `rea` CLI, which discovers the local workspace — so each RE engagement can be its own
repo with the harness copied in.

---

## Quickstart

```bash
# Inject the full harness into an engagement repo
rea harness init /path/to/engagement

# Or a focused profile
rea harness init /path/to/engagement --profile native

# See what is installed and whether it drifted from source
rea harness status /path/to/engagement

# Pull in upstream harness updates, keeping your local edits
rea harness update /path/to/engagement

# List every rule, agent, skill, hook, and profile
rea harness list
```

`rea harness` runs through the same `rea` CLI as everything else; you can also run it standalone
with `python -m reakit.harness <command>`.

### Management commands

| Command | Description |
| :--- | :--- |
| `rea harness init <target>` | Install `.agents/` into `<target>`. Merges an existing `hooks.json` rather than clobbering it. |
| `rea harness update <target>` | Re-copy harness files, **preserving files you edited** since install. Add `--prune` to drop files the profile no longer ships. |
| `rea harness status <target>` | Show installed version, source commit, and drifted files. |
| `rea harness list` | List available rules, agents, skills, hooks, and profiles. |
| `rea harness remove <target>` | Delete the installed `.agents/` (protects local edits unless `--force`). |

### Granular selection

```bash
rea harness init . --skills native-analysis,jni-reversing,deobfuscation
rea harness init . --no-hooks
rea harness init . -n            # dry-run: print the plan only
```

Installs are tracked by a `.reaharness.json` manifest (digests + profile + source commit), which
is how `update` knows which files you changed and `status` knows what drifted.

---

## Installation profiles

| Profile | Skills | Agents | Rules | Use case |
| :--- | :---: | :---: | :---: | :--- |
| **`full`** *(default)* | 14 | 9 | 3 | Everything — static + native + dynamic + rigour |
| **`static`** | 10 | 6 | 2 | Bytecode + native static analysis (download, decode, `.so`, deobfuscation) |
| **`native`** | 8 | 6 | 2 | Focused `.so` / JNI reversing with Ghidra |
| **`dynamic`** | 9 | 8 | 3 | Device-driven work: control, runtime extraction, traffic capture, protocol |
| **`minimal`** | 4 | 5 | 1 | Rigour mode, finding review, and goal loops only |

---

## What's inside `.agents/`

### 1. Rules — always-on guardrails (`rules/`)

Loaded into every session as continuous context.

- **`orchestrate.md`** — the session the human talks to plans and delegates; it does not write
  analysis code. Executable artifacts (scripts, hooks, patches) go through worker subagents.
  Enforced by `write_guard.py`.
- **`reverse.md`** — evidence over inference. Every claim cites a file:line, an address, or a
  captured exchange; prefer the lowest layer that settles it; confirm dynamically when you can.
  Documents the workspace layout and which dirs are generated (off-limits to hand edits).
- **`dynamic.md`** — device and traffic hygiene: confirm a device, let the daemon hook manage
  `scrcpy-cli`, wire the proxy/CA, and correlate on-wire values back to the code that built them.
### 2. Agents — specialized personas (`agents/`)

| Agent | Role |
| :--- | :--- |
| `orchestrator` | Strategic lead — decomposes requests, delegates, verifies. Cannot write code by design. |
| `explore` | Read-only contextual grep over `jadx_src/`, `native/`, `traffic/`. Fire 2-3 in parallel. |
| `oracle` | Read-only strategist — deobfuscation approach, crypto/protocol ID, review of a finding. |
| `native-analyst` | Drives `rea native` + Ghidra: decompile, trace, name JNI routines. |
| `traffic-analyst` | Drives `rea http`: correlate requests to the code that signs them. |
| `business-analyst` | Drives `rea scrcpy`: screenshots each state and writes a functional spec of a flow, dispatching `screen-analyst` for what the UI dump misses, `explore` for code-binding, and `oracle` for coverage planning on branchy flows. |
| `screen-analyst` | Reads a captured screenshot against its UI dump: custom-drawn views, WebView content, icon-only controls, visual state the dump doesn't carry. |
| `worker-quick` | Trivial single-file artifact (a Frida snippet, a small helper). No shell. |
| `worker-deep` | Autonomous multi-step tooling — an end-to-end deobfuscator, a device-verified hook. |

### 3. Skills — domain playbooks (`skills/`)

**Tool wrappers** (map each to its `rea` subcommand): `workspace-setup`, `apk-acquisition`,
`decompilation`, `static-pipeline`, `native-analysis`, `runtime-extraction`, `device-control`,
`traffic-capture`.

**Methodology**: `jni-reversing`, `deobfuscation`, `protocol-reversing`, `finding-review`.

**Rigour engine**: `ultrawork` (classify → register goals → delegate → prove), `loop` (durable
evidence-bound goal ledger).

### 4. Hooks — deterministic gates (`hooks/` + `hooks.json`)

Antigravity runs these Python hooks so safety and orchestration cost no LLM tokens.

| Hook | Event | What it does |
| :--- | :--- | :--- |
| `artifact-guard` (`artifact_guard.py`) | PreToolUse | Denies **writes into generated dirs** (`jadx_src/`, `native/`, `apks/`, `runtime/`) and acquired binaries — they are overwritten on the next `rea` run. Points you at `findings/` / `patches/` instead. Reads are never touched. |
| `root-write-guard` (`write_guard.py`) | PreToolUse | Enforces the delegation rule: the root session cannot write script/code artifacts (`.py .js .java .smali .c …`); those go through workers. Prose (`.md`) is always allowed. |
| `ultrawork-intent-gate` (`intent_gate.py`) | PreInvocation | Turns the word `ultrawork` in a prompt into an injected rigour directive. |
| `stop-verifier` (`stop_verifier.py`) | Stop | Holds a registered goal loop open until its goals hold, validating recorded evidence (never re-running the work). |
| `device-daemon` (`scrcpy_daemon.py`) | PreInvocation / Stop | Owns the `scrcpy-cli` daemon lifecycle (refcounted across sessions) so agents never start/stop it by hand. |

Each hook fails open, self-tests (`python .agents/hooks/<hook>.py --self-test`), and has an
off-switch (`--off` / `--on` / `--status`). Runtime state lives under `.agents/state/`
(gitignored).

### No MCP server

The harness deliberately ships **no `mcp_config.json`**. Every backend — Ghidra and HTTP
Toolkit alike — is driven through the `rea` CLI, and the skills read its stdout. That is the whole
point: a registered MCP server would load its tool schemas into every agent turn and bloat
context, while `rea native …` / `rea http …` cost nothing until called. If an MCP-native client
outside the harness wants a direct bridge, `rea native mcp` and `rea http mcp` still exist as
`rea` subcommands, backed by a live server you start yourself.

---

## The durable goal loop

For large analyses that must survive context compaction, `.agents/scripts/loop.py` provides an
append-only, evidence-bound ledger under `.agents/state/loop/`:

```bash
python .agents/scripts/loop.py create-goals --brief "trace how X-Sign is computed" \
  --goals-json goals.json --json
python .agents/scripts/loop.py status --json
python .agents/scripts/loop.py checkpoint --goal-id g1 --status complete \
  --evidence "reproduce_xsign matched event 41" \
  --command "python scripts/reproduce_xsign.py --from-capture 41" --exit-code 0 --json
```

The `stop-verifier` hook watches this ledger and blocks premature termination while a registered
goal still has unmet, evidence-backed criteria. See the `loop` and `ultrawork` skills for the
full contract.

---

## Slash-command / trigger workflows

| Action | Trigger | What happens |
| :--- | :--- | :--- |
| Full rigour mode | type `ultrawork <task>` (or `/ultrawork`) | Classify intent → register goal loop → delegate → prove each finding with a re-runnable command or a live capture. |
| Finding review | `/finding-review` | Fan out `explore` to re-check evidence, `oracle` to judge, specialists to confirm dynamically. |
| Durable goal loop | `loop.py create-goals …` | Evidence-bound execution the stop-verifier holds open until goals hold. |

---

## Notes

- The harness targets **Antigravity** (`agy`) — hook schema (`PreInvocation` / `PreToolUse` /
  `Stop`) and agent frontmatter match that platform.
- Authorized use only: analyse apps you have permission to reverse (security testing, CTF, RE
  research, interop). The rules encode this expectation.
