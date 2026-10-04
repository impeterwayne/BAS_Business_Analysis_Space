# BAKit Delegation Rule: this session plans, subagents do the work

The session the human is talking to **plans, delegates and verifies**. It does not drive the device, does not
call Figma tools, does not read decoded competitor code in bulk, and does not author BA deliverables. That work goes to subagents
dispatched with `invoke_subagent`. If you catch yourself about to call a `mobilerun` or `figma-mcp-android`
tool, grep through `jadx_src/`, or write a document under `docs/BA/`, dispatch it instead. The one file this session writes
itself is a competitor `exploration-plan.md`.

The full playbook is `.agents/agents/ba-lead.md`; `/ba-competitor` is `.agents/workflows/ba-competitor.md`, `/ba-figma`
(Figma design → analysis → FSD / use cases / user stories) is `.agents/workflows/ba-figma.md`.

## 1. The roster

| Agent | Use it for | Parallel |
| :--- | :--- | :--- |
| `code-scout` | One angle on a decoded APK (`jadx_src/`): screen map, feature areas, one flow in code | 2-3 in one call |
| `competitor-analyst` | WALK one flow on the device (mobilerun); SYNTHESIZE profile, screens, comparison | WALK: never |
| `evidence-verifier` | Check finished competitor docs against captures and code | Alone |
| `figma-analyst` | Read one flow of a Figma design into `docs/BA/figma/<feature>/` (figma-mcp-android) | Never: one Figma Desktop |
| `ba-researcher` | Domain rules, regulations, prior art, URL extraction | Yes |
| `ba-brainstormer` | Options, trade-offs, feature brief | — |
| `ba-spec-writer` | FSD, use cases, user stories, readiness reviews, test cases | One per deliverable |

`Subagents` is an array, so N parallel spawns are one call:

```
invoke_subagent(Subagents=[
  {TypeName: "code-scout", Workspace: "inherit", Model: "inherit", Prompt: "..."},
  {TypeName: "code-scout", Workspace: "inherit", Model: "inherit", Prompt: "..."}
])
```

## 2. Barriers and single holders

- **Scouts are a barrier.** Fire them together, wait for every one, then plan from what they wrote. Never put a
  scout and a device walker in the same call.
- **The device is a single-holder resource.** One `competitor-analyst` WALK at a time, one flow per dispatch.
  Two agents on one device corrupt each other's state.
- **Figma Desktop is a single holder too.** One `figma-analyst` at a time; the bridge serves the one open file.
- **The verifier runs alone, after the writers.**
- **Shared inputs exist before a parallel wave starts.** If scouts need the code index, one scout builds it
  first, alone; never dispatch readers alongside the agent that writes what they read.
- **Paths in dispatch prompts use forward slashes** (`D:/RE/app/jadx_src`); backslashes get mangled in tool calls.
- **A subagent that dies on a tool error** is relaunched once with the same brief plus the error; a second
  failure goes to the user.

## 3. Every dispatch carries six sections

A subagent sees none of this conversation.

```
1. TASK             one atomic goal (one angle, one flow, one deliverable)
2. EXPECTED OUTCOME the file(s) to write, at which path, and what "done" looks like
3. MUST DO          exhaustive requirements, nothing left implicit
4. MUST NOT DO      the plausible wrong turn, anticipated
5. CONTEXT          app, package, jadx root, app-slug, flow, account, files to read
6. SKILLS           which skills to load before starting
```

## 4. Verify, do not trust

A subagent's report is a claim, not evidence. Read the files it wrote with `view_file`. Competitor work is not
done without an `evidence-verifier` `<verdict>`. Route each defect back to the agent that owns it, quoting it.
At three failed attempts on the same problem, stop and bring it to the user.

---

The rest of BAKit lives under `.agents/`: `rules/` (always-on), `skills/`, `agents/` (the roster above),
`workflows/` (`/ba-competitor`, `/ba-figma`, `/ba-spec`, …) and `config/ba-project-config.md`.
