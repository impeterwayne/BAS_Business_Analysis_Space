---
name: loop
description: Durable goal loop for long-running screen-driving work — decompose a request into evidence-bound goals, record progress in an append-only ledger, and survive context loss or compaction without re-planning. Use when the user asks for a loop, durable or checkpointed execution, evidence-led work, or when a flow is large enough that losing your place would be expensive.
metadata:
  short-description: Evidence-bound goal loop with an append-only ledger
---

# loop

State lives under `.agents/state/loop/<session>/`. Drive it with `run_command`:

```bash
python .agents/scripts/loop.py <subcommand> [flags]
```

Two files per session. **`ledger.jsonl` is append-only and authoritative.** `goals.json` is only
a cache of it — never hand-edit either. If they ever disagree, the ledger wins and `reconstruct`
repairs the cache.

The CLI fails loud: non-zero exit and a reason on stderr. Read the error, fix the input, retry.
Do not work around it by writing state files yourself.

## After any context loss, do this first

```bash
python .agents/scripts/loop.py status --json
```

Then resume from what it reports. **Never re-plan from scratch and never redo a goal already
marked complete** — the ledger already holds the evidence.

## 1. Register goals, before any artifact

```bash
python .agents/scripts/loop.py create-goals \
  --brief "<the user's request, verbatim>" \
  --goals-json goals.json --json
```

The goal set is the binding contract for the run, so its quality caps the run's quality. In
screen-driving work a good goal names the **coverage/finding** and how it will be **proven**, not
the activity. The CLI rejects goals below the bar — see "The quality bar".

Goal shape (a business-analyst example):

```json
[
  {
    "id": "g1",
    "objective": "The login and OTP flow is spec'd end to end, every reachable screen visited.",
    "deliverables": ["docs/spec/login.md", "docs/spec/screens/login-*"],
    "criteria": [
      {
        "id": "c1",
        "pass_condition": "every actionable element on each visited screen is either tapped or recorded as a coverage-frontier gap",
        "scenario": "scrcpy-cli ui-dump against the coverage frontier tracked while driving the flow",
        "expected_evidence": "the spec's Coverage section lists zero unexplained unvisited elements"
      },
      {
        "id": "c2",
        "pass_condition": "each screen in the spec has a screenshot and a matching UI dump",
        "scenario": "docs/spec/screens/ contains a .png + .xml pair per numbered screen",
        "expected_evidence": "file listing under docs/spec/screens/, cited in the spec's Screen inventory"
      }
    ],
    "constraints": ["assumed: no test OTP available — the flow stops at OTP entry, reversible"],
    "stop_when": "every screen the flow can reach is captured and the spec records why any branch was left unvisited"
  }
]
```

One goal per outcome. Two independent flows → two goals, not one compound objective.

`create-goals` refuses to overwrite an existing goal set. For unrelated new work use `--session
<new-id>`; use `--force` only when you deliberately mean to discard recorded evidence.

## The quality bar

Enforced mechanically — a rejected goal is a real defect, not a formatting complaint:

| Rule | Why |
| :--- | :--- |
| The objective states an **outcome/finding**, not an activity | "Look at the checkout flow" cannot fail, so it cannot finish. State what will be TRUE ("the checkout flow is spec'd end to end"). |
| Every goal has `stop_when` | Without it the run keeps driving past done. |
| Every goal has at least one criterion | A goal with no criterion measures nothing. |
| Each criterion has a **binary** `pass_condition` | "understand the flow" is rejected. "spec written, coverage frontier empty", "screenshot + dump pair exists" pass. |
| Each criterion names its `scenario` | The literal command or check that proves it — decided now. |
| Each criterion names its `expected_evidence` | Written at registration. Evidence invented after the work bends the contract to fit whatever happened. |
| At least one criterion's `scenario` names a real `scrcpy-cli` device action (`tap`/`swipe`/`write`/`key`/`app-start`/`screenshot`/`ui-dump`/...) | This project specs an app by driving it. A goal whose every scenario only reads `docs/spec/` back proves nothing was actually driven — `device-list`/`daemon status` don't count, they don't touch the app. |

Record unstated bounds you chose in `constraints` as `assumed: <bound> — <rationale>,
<reversible?>`. Ask the user only when the missing detail is genuinely theirs (a destructive
action like registering an account or making a purchase, a real budget).

## 2. Work a goal, then checkpoint it

```bash
python .agents/scripts/loop.py checkpoint --goal-id g1 --status in_progress --json
```

Then, once you have actually driven the flow and written the spec:

```bash
python .agents/scripts/loop.py checkpoint --goal-id g1 --status complete \
  --evidence "docs/spec/login.md written, 6 screens 01-06, coverage frontier empty" \
  --evidence-path "docs/spec/login.md" --json
```

`--evidence` is **required** for any status other than `in_progress`. Record what you observed,
not what you expect. `--command` and `--exit-code` make a checkpoint auditable later without
re-driving the app — which is why the stop-verifier can trust it.

Use `--status failed` when the scenario ran and did not pass, `inconclusive` when you could not
run it at all (a wall you can't get past — no credentials, no OTP, a paywall). Both are useful; a
silent gap is not.

## 3. Steer when the plan changes — on the record

```bash
python .agents/scripts/loop.py steer --kind add-goal  --goals-json new.json --rationale "..." --json
python .agents/scripts/loop.py steer --kind drop-goal --goal-id g3 --rationale "descoped" --json
python .agents/scripts/loop.py steer --kind revise    --goal-id g1 \
  --patch-json '{"stop_when": "flow is spec'"'"'d AND the settings sub-tree is covered"}' \
  --rationale "settings was part of the ask" --json
python .agents/scripts/loop.py steer --kind note \
  --rationale "checkout dead-ends at payment — no test card, recorded as a wall" --json
```

`--rationale` is required. Future-you reading the ledger after compaction is the reviewer.

## 4. Verify the ledger is sufficient

```bash
python .agents/scripts/loop.py reconstruct --check --json
```

Exits non-zero if `goals.json` disagrees with the ledger. Run it before reporting completion.

## Stop rules

- **All goals complete** (`all_complete: true`) → deliver and stop. Don't keep driving.
- **A goal's `stop_when` holds** → that goal is done. Note further screens; don't chase them.
- **Three consecutive failed checkpoints on one goal** → stop, checkpoint `failed` with what you
  tried and where the real blocker is, and surface it.
- **You cannot run a criterion's scenario** → checkpoint `inconclusive` and say why.

A spec backed by screenshots and UI dumps is completion proof; a description of what the app
"probably does" is not. Audit every criterion against the evidence actually recorded before
reporting done.

## If you are resumed after trying to stop

A `Stop` hook (`.agents/hooks/stop_verifier.py`) holds the session open while a registered loop
still has work, and injects a system message naming the active goal. It fires only for a loop
**you** registered. It rejects a `complete` checkpoint on a recorded non-zero exit code or a
missing `--evidence-path`, and marks the loop stuck if a resume adds no new ledger entry. The way
out is never to argue with it: finish the goal, or close it out honestly with `failed` /
`inconclusive`. Resumes are capped (2 per goal, 1 after compaction, 6 per session).
