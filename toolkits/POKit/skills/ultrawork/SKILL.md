---
name: ultrawork
description: >
  Maximum-rigour mode for a screen-driving request that must not come back wrong: classify the
  intent before acting, register the run as goals with evidence, delegate to the business-analyst
  and screen-analyst agents instead of doing everything in one context, and prove each finding
  with a spec entry backed by a screenshot and UI dump. Activates on "ultrawork", "ultra work",
  "ulw", or when the user asks for maximum rigour, "do this properly", "no shortcuts", "be
  thorough and verify". Use for a flow that must be driven to exhaustion, not just once through
  the happy path. Do NOT use it for a one-line lookup — the overhead would be the whole cost.
metadata:
  short-description: Rigour mode — classify, register goals, delegate, prove
---

# ultrawork

Open your reply with `ultrawork:` and one line naming what you are about to do. That line is the
activation receipt — without it, nobody can tell this mode engaged.

This mode changes **how carefully** you work. It does not change **how much** you cover — scope
stays whatever the request asked for. Rigour and minimalism are not in tension: the failure being
prevented here is a confidently wrong spec, not a small one.

## 1. Classify the intent, before any tool call

State the classification in one line: **understanding | investigation | evaluation | implementation**.

| The user said | It is not a request to produce an artifact |
| :--- | :--- |
| "explain what this screen does", "how does the flow work" | understanding → explain with evidence → stop |
| "what can a logged-out user reach", "is there a way to skip OTP" | investigation → report → stop |
| "is this flow good UX", "what do you think of this screen" | evaluation → recommend → stop |
| "spec the login flow", "document checkout" | implementation → drive it, write the spec |

The failure this exists to stop is reading a question and jumping straight to driving the device.
Only an explicit ask to spec/document a flow authorises writing a spec file. When a request
carries two intents ("explain the flow and spec it"), name both, do them in order.

## 2. Register the run before the first artifact

Multi-step or multi-screen work goes through the [`loop`](../loop/SKILL.md) skill:

```bash
python .agents/scripts/loop.py create-goals --brief "<the request, verbatim>" \
  --goals-json goals.json --json
```

This is the run's contract, and three things depend on it:

- The goal quality bar is **enforced** — activity-only objectives ("look at the app"),
  unfalsifiable pass conditions, and criteria without `expected_evidence` are rejected at
  registration. A good goal names the *coverage* it will reach and how that will be proven.
- The ledger is your durable memory. After a compaction, `loop.py status --json` is the first
  thing you run, and you resume from what it reports.
- The `Stop` gate (`.agents/hooks/stop_verifier.py`) holds the session open until the goals hold
  and rejects a `complete` checkpoint sitting on a non-zero recorded exit code or a missing
  artifact.

Every criterion names its scenario — the literal check against `docs/spec/` — and its expected
evidence, decided **now**. Criteria invented afterwards bend to fit whatever happened.

## 3. Delegate discovery and judgement

Your context window is the scarcest thing in the run. Spend it on decisions, not on screenshots
you could have had described.

| Need | Call |
| :--- | :--- |
| Establish which screens/actions exist, spec an on-screen flow | `business-analyst` |
| Read a captured screenshot against its dump for what the dump misses | `screen-analyst` |

`Subagents` is an array — independent questions are one call. Give a worker the goal, the
constraints, and the flow/screens; never a numbered plan. Then verify its result yourself: a
subagent's summary is a claim, not evidence.

This is mechanically enforced, not just advised: `device_guard.py` (a `PreToolUse` hook) denies
this session — but not a dispatched `business-analyst` — a `scrcpy-cli` device action or a write
under `docs/spec/`. If either gets denied, that is the harness working as designed: dispatch
`business-analyst` instead of retrying the call directly. See
[`orchestrator`](../../agents/orchestrator.md) for the persona built around this split.

## 4. Prove it — evidence, not assertion

Nothing is done without an artifact that would have caught the mistake:

- Every claim in the spec cites its screenshot, and its UI dump when the claim rests on an
  id or bounds.
- "Observed vs inferred" is separated in every entry — a validation rule you saw fire is
  observed; a validation rule you assume exists because the field looks like a phone number is
  inference, and must be labelled as such.
- Record each: `loop.py checkpoint --goal-id gN --status complete --evidence "..." --evidence-path "docs/spec/<flow>.md"`

Pre-existing walls you couldn't get past (no credentials, no OTP, a paywall) are not a failure to
hide — record them `inconclusive` with what you tried.

**Never** report a guessed next screen as fact, or claim a flow reaches a state you did not
actually see.

## 5. Before you claim done

Any "no" is unfinished work, not a caveat:

1. Does every goal I registered have a spec entry with screenshot + dump evidence recorded in
   **this** run?
2. Did I read the actual screenshot/dump of every screen, or skim it?
3. Is every "the app does X" backed by something I saw happen, not just how a screen looks?
4. Is every part of the request answered — re-read the original now?
5. Did I classify the intent at the start, and does what I did match it?
6. Is any part of the coverage frontier silently dropped instead of recorded as unvisited?

Then run `loop.py reconstruct --check --json`: it proves the record survives losing its cache.

## Completeness, not maximalism

Deliver the **requested scope, finished and verified** — a flow driven to exhaustion, not a
happy-path walkthrough. "Covered the main path" is not acceptable when the whole flow was asked
for. That is a bar on *finishing*, not a licence to spec more of the app than the question needs.
Being asked for rigour is not permission to widen scope; name out-of-scope screens at the end,
don't chase them.

## Stop rules

- **All registered goals complete, evidence recorded** → report and stop. Don't keep driving.
- **A goal's `stop_when` holds** → that goal is done. Note improvements, leave them.
- **Three consecutive failed attempts at the same problem** → stop, checkpoint `failed` with what
  each attempt produced and where the real blocker is, and surface it.
- **A criterion you cannot run** → checkpoint `inconclusive` and say why. Never mark complete on a
  scenario you did not execute.

Work past the stop line is a defect, not diligence.
