# Update Workflow — /specs update

Synchronize the existing **SRS, use cases, UI Specifications and diagrams** with confirmed changes. Current
codebase behavior is never the only source of requirements.

## Steps

### 1. Detect Project Type

Follow **Project Type Resolution** in `specs/SKILL.md` and store the result (`web-frontend`, `api-backend`,
`fullstack-web`, `mobile`, or `unknown`).

### 2. Read Current Documents

- `docs/project-srs.md` (or `docs/project-fsd.md` in legacy FSD mode).
- `docs/usecases/` by module.
- `docs/diagrams/` sources and the diagram links in each use case.
- Business rules, decisions, Open Questions and Change Log.

If no SRS or use case exists, warn: "No SRS found. Run `/specs init` first." Do not invent a past state.

### 3. Collect Change Inputs

Review the latest available:

- Product Decision Summaries in `docs/BA/decisions/` (new `v[N]` files, changed `PD-*` items) and briefs.
- Figma analysis updates in `docs/BA/figma/{feature}/`.
- Feature Checklist changes and PO notes.
- Approved requirements / PRD, research-driven additions.
- APK evidence when the change concerns reference-based behavior.
- Optionally, codebase differences — as corroboration, never as an automatic product decision.

Record which files and versions were actually consulted. A change whose decision file says
`NOT READY FOR SRS` is recorded as `TBD`, not applied.

### 4. Create a Change Inventory

Compare each updated source against the documented target requirement and classify every affected item:

| Class | Meaning |
| :--- | :--- |
| `ADDED` | New confirmed requirement |
| `MODIFIED` | Confirmed change to an existing requirement |
| `REMOVED` | Confirmed removal only |
| `UNCHANGED` | Reviewed, no change |
| `CONFLICT` | Sources disagree |
| `TBD` | Not yet decided |

Do not mark a feature removed just because a Figma frame disappeared, the reference app changed, or the code
no longer has it.

### 5. Assess Impact

Check the affected:

- Feature scope, traceability matrix and FR / UC mappings.
- UI components, states and Figma references.
- Main / Alternative / Exception Flows and Business Rules.
- Navigation, defaults, persistence and error handling.
- Shared User Flows and Activity Diagrams; Sequence Diagrams where present.
- Permissions, Ads / IAP, NFRs and dependencies where applicable.
- Rules or use cases reused across modules — list every cross-module hit in the summary.

### 6. Hand Off to `ba-spec-writer`

If this skill already runs inside `ba-spec-writer`, do the work below directly. Otherwise dispatch
`ba-spec-writer` with `invoke_subagent` and this brief:

```
Update the SRS from confirmed changes.

Project type: {resolved-type}
Existing documents: {paths}
Change inventory: {table from step 4}
Conflicts / TBD: {open items}
Sources consulted: {paths + versions}

Instructions:
1. Read .agents/skills/ba-templates/templates/srs.md and
   .agents/skills/ba-templates/templates/use-case.md.
2. Preserve unaffected approved requirements and user edits.
3. Update the affected UCs, embedded UI Specifications (embedding exported screen images with Markdown image syntax `![...](../../BA/figma/{feature}/screens/...)` for inline preview), flows, rules and navigation.
4. Update the related shared or dedicated User Flow / Activity Diagrams; Sequence Diagrams only if warranted.
5. Keep FR / UC / BR / diagram references and the traceability matrix consistent.
6. Never delete a UC or its history: mark it Deprecated / Out of Scope only when the removal is confirmed.
7. Do not invent reference adoption, API contracts, Ads / IAP rules or defaults.
8. Keep unresolved P0/P1/P2 questions and their impact.
9. Bump versions and add Change Log rows; validate against ba-markdown-formatting.
10. Do not implement code.
```

### 7. Apply Controlled Updates

- Modify only the affected sections and files.
- Add a new use case only for a genuinely new user goal; keep stable IDs.
- For a confirmed removal, mark the artifacts Out of Scope / Deprecated and update the current requirements and
  diagrams without erasing history.
- For an unresolved conflict, keep the prior confirmed behavior unless superseded and record an Open Question.
- Do not change Dev-owned estimates or feasibility entries without the owner's input.

### 8. Diagram & Traceability Check

- Updated journeys match their `UF-*` diagrams.
- Updated validations, branches and results match their `ACT-*` diagrams.
- `SEQ-*` diagrams, if present, use supported participants and interactions.
- Every relevant use case links its covering User Flow and Activity Diagram.
- No stale navigation, rule IDs or missing linked files remain.

### 9. Consistency Check

- Feature Checklist ↔ scope ↔ FR ↔ use case mapping.
- Confirmed Product Decisions ↔ requirement wording.
- Figma ↔ embedded UI Specification.
- Business Rules ↔ flow tables ↔ diagrams.
- Open Questions (`P0/P1/P2`) and Change Log.

### 10. Output Summary

Report:

- Sources and confirmed changes considered.
- FRs, use cases, UI Specifications and rules changed.
- User Flow, Activity and conditional Sequence diagrams updated.
- Items marked Deprecated / Out of Scope (confirmed only).
- Unresolved conflicts and points for PO review.
- Draft / audit readiness status.

## Important

- Never auto-delete a use case because it is absent from a new design or from the code — flag it for review.
- Preserve user-edited content and unrelated approved requirements.
- Documentation only; no code changes.
