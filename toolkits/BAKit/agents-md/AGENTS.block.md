# BAKit Delegation Rule: this session plans, subagents do the work

The session the human is talking to **plans, delegates and verifies**. It does not drive the device, does not
call Figma tools, does not read decoded competitor code in bulk, and does not author BA deliverables. That work goes to subagents
dispatched with `invoke_subagent`. If you catch yourself about to call a `mobilerun` or `figma-mcp-android`
tool, grep through `jadx_src/`, or write a document under `docs/`, dispatch it instead. The one file this session writes
itself is a competitor `exploration-plan.md`.

The full playbook is `.agents/agents/ba-lead.md`; competitor discovery is `.agents/skills/competitor-app-analysis/SKILL.md`, and Figma design discovery
(Figma section → analysis → PO batch rule gate → Use Cases in `docs/project-srs.md`) is `.agents/skills/figma-ba-analysis/SKILL.md` and `.agents/workflows/ba-figma.md`.

## 1. The roster

| Agent | Use it for | Parallel |
| :--- | :--- | :--- |
| `code-scout` | One angle on a decoded APK (`jadx_src/`): screen map, feature areas, one flow in code | 2-3 in one call |
| `competitor-analyst` | WALK one flow on the device (mobilerun); SYNTHESIZE competitor profile, screens, checklist (`apk-feature-extractor`), comparison | WALK: never |
| `evidence-verifier` | Check finished competitor docs against captures and code | Alone |
| `figma-analyst` | Read one Figma section into `docs/BA/figma/<feature>/` (`screens/` + `elements/`, via figma-mcp-android) | Never: one Figma Desktop |
| `ba-brainstormer` | Mandatory PO gate (`product-decision` batch table in chat before any Use Case), Feature Checklist from PO research (`research-feature-checklist`), or options for a new idea (`brainstorm-features`) | — |
| `ba-spec-writer` | Feature Checklist from APK decode output (`apk-feature-extractor`, `.md` + `.xlsx`), single-file SRS `docs/project-srs.md` (`specs`, `use-case-writer`, `user-flow`), quick/full reviews (`BA-audit-SRS`), on-request Word export (`srs-export`) | One per deliverable |
| `ba-researcher` | Domain rules, regulations, prior art, URL extraction | Yes |

`Subagents` is an array, so N parallel spawns are one call:

```
invoke_subagent(Subagents=[
  {TypeName: "code-scout", Workspace: "inherit", Model: "inherit", Prompt: "..."},
  {TypeName: "code-scout", Workspace: "inherit", Model: "inherit", Prompt: "..."}
])
```

## 2. Barriers, single holders & mandatory gates

- **PO gate before any Use Case.** After `figma-analyst` reads a Figma section, `ba-brainstormer` (`product-decision`, batch mode) sends one table in chat; never dispatch `ba-spec-writer` until the PO has answered every row.
- **Scouts are a barrier.** Fire them together, wait for every one, then plan from what they wrote. Never put a
  scout and a device walker in the same call.
- **The device is a single-holder resource.** One `competitor-analyst` WALK at a time, one flow per dispatch.
  Two agents on one device corrupt each other's state.
- **Figma Desktop is a single holder too.** One `figma-analyst` at a time; the bridge serves the one open file.
- **The verifier runs alone, after the writers.**
- **Shared inputs exist before a parallel wave starts.** If scouts need the code index, one scout builds it
  first, alone; never dispatch readers alongside the agent that writes what they read.
- **Paths in dispatch prompts use forward slashes** (`<workspaces>/<package>/jadx_src`); backslashes get mangled in tool calls.
- **A subagent that dies on a tool error** is relaunched once with the same brief plus the error; a second
  failure goes to the user.

## 3. Every dispatch carries six sections

A subagent sees none of this conversation.

```
1. TASK             one atomic goal (one angle, one flow, one Figma section, one deliverable)
2. EXPECTED OUTCOME the file(s) to write, at which path, and what "done" looks like
3. MUST DO          exhaustive requirements (template key, rules, language)
4. MUST NOT DO      the plausible wrong turn (writing before PO answers, per-UC files, exporting Word unasked, calling get_document)
5. CONTEXT          app, package, jadx root, Figma link + node ids, feature slug, app slug, files to read, absolute workspace root
6. SKILLS           which skills to load before starting
```

## 4. Verify, do not trust

A subagent's report is a claim, not evidence. Read the files it wrote with `view_file`: header filled, structure matches the template, Markdown passes `ba-markdown-formatting`, every image path exists, every Note/References link has its anchor, Business Rules hold one rule per row, every Use Case has a User Flow. Competitor work is not done without an `evidence-verifier` `<verdict>`. Route each defect back to the agent that owns it, quoting it. At three failed attempts on the same problem, stop and bring it to the user.

---

The rest of BAKit lives under `.agents/`: `rules/` (always-on), `workflows/` (`/ba-checklist`, `/ba-figma`, `/ba-spec`, `/ba-review`, `/ba-export`, `/ba-competitor`), `skills/` (`apk-feature-extractor`, `figma-ba-analysis`, `product-decision`, `specs`, `use-case-writer`, `user-flow`, `srs-export`, `competitor-app-analysis`, …), `agents/` (the roster above), and `config/ba-project-config.md`.
