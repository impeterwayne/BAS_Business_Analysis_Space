# Init Workflow — /specs init

Create the initial **SRS, use cases with embedded UI Specifications, and editable diagrams** from confirmed
target context and the available reference evidence. A codebase is not required.

## Steps

### 1. Establish Project Context

- Follow **Project Type Resolution** in `specs/SKILL.md` and store the result (`web-frontend`, `api-backend`,
  `fullstack-web`, `mobile`, or `unknown`).
- Read `.agents/config/ba-project-config.md` for project name, platform(s) and deliverable language.
- Identify product goal, target users, known feature scope, design status and reference apps.
- If `docs/project-fsd.md` exists and `docs/project-srs.md` does not, ask whether to keep the legacy FSD or
  start an SRS (see **Legacy FSD** in `specs/SKILL.md`).

Treat missing evidence as missing, not as permission to infer product rules.

### 2. Collect Available Sources

Read, when present (paths in `specs/SKILL.md` → Accepted Inputs):

1. Product Decision Summaries in `docs/BA/decisions/` and feature briefs in `docs/BA/briefs/`.
2. Feature Checklist `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md`.
3. APK evidence: `*_profile_*`, `*_screens_*` and every relevant `*_flow-{flow}_*` file, plus the comparison
   report (`GAP-*`, `FR-CAND-*`).
4. Figma design analyses `docs/BA/figma/{feature}/` and their reference images in `screens/`.
5. PRD `docs/project-overview-pdr.md`, extracted requirements, research notes.
6. Any existing SRS, use cases or diagrams.

Log important missing sources. Keep the APK evidence grades (observed / `[Code]` / `[Inferred]`); APK
observations are never target approvals.

### 3. Check Decision Readiness

- If a decisions file has verdict `NOT READY FOR SRS`, or no decisions file, brief or explicit user decision
  covers a feature, **stop and ask** whether to run `product-decision` first (`ba-brainstormer`) or continue
  with a partial draft whose status is `Blocked by P0`.
- Classify features as **In Scope**, **Out of Scope** or **TBD** from the confirmed decisions.
- Exclude confirmed `REMOVE` behaviors from functional requirements.
- List conflicts among decisions, design and reference behavior as `P0/P1/P2` Open Questions. Never fill a
  `TBD` with an assumption.

### 4. Map Features, Screens & Use Cases

Build a feature-to-UC mapping by user goal, not one use case per screen. Record the target screens and the
relevant reference flows for each use case.

Example only:

| Nhóm tính năng (Feature group) | Tính năng (Feature) | Use case |
| :--- | :--- | :--- |
| AI Image Generation | Template browsing | UC-IMG-001 Browse Templates |
| AI Image Generation | Generate image | UC-IMG-002 Generate Image |
| AI Image Generation | Save result | UC-IMG-003 Save Result |

### 5. Hand Off to `ba-spec-writer`

If this skill already runs inside `ba-spec-writer`, do the work below directly. Otherwise dispatch
`ba-spec-writer` with `invoke_subagent` and this brief:

```
Create the initial SRS from the confirmed target context and available evidence.

Project type: {resolved-type}
Product Decisions / briefs: {paths, verdicts}
Feature Checklist: {path}
APK evidence: {profile / screens / flow-* / comparison paths}
Figma analyses: {paths}
Other approved context: {PRD / research / existing docs}
Feature-to-UC mapping: {table from step 4}
Open gaps: {P0/P1/P2 list}

Read templates:
- SRS: .agents/skills/ba-templates/templates/srs.md
- UC:  .agents/skills/ba-templates/templates/use-case.md

Outputs:
- docs/project-srs.md
- docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md
- docs/diagrams/{module}/{diagram-id}.md (editable Mermaid, flowchart TD)

Requirements:
1. Do not copy reference behavior into target rules without a confirmed decision.
2. Embed the UI Specification, with real Figma node links / reference images, in each UC BEFORE Main Flow.
3. Include Main / Alternative / Exception Flows, Business Rules, Navigation / Result, Acceptance Criteria.
4. User Flow for main journeys, Activity Diagram for core processes; shared diagrams for simple related UCs.
5. Sequence Diagrams only for genuinely complex interactions with verified participants.
6. Trace every in-scope feature to FR/UC and every UC to its diagrams.
7. Omit non-applicable Permissions / Ads-IAP / NFRs; never invent behavior, links or assets.
8. Promote FR-CAND / FR-DSN / BR-CAND only when confirmed; keep the candidate ID in Nguồn (Source).
9. Keep P0/P1/P2 Open Questions; set the status accurately.
10. Vietnamese with English terminology; validate against ba-markdown-formatting.
11. Do not implement code.
```

### 6. Write the Master SRS

Create `docs/project-srs.md` from the `srs` template:

- Header table, product overview, scope, traceability matrix (Feature → FR → UC → screen / BR / diagram).
- Global Business Rules and User Flow index.
- Functional Requirements per module, with use case links and Activity / Sequence indexes.
- Permissions, Ads / IAP, NFRs, dependencies only when applicable and supported.
- Open Questions, Change Log, coverage checklist.
- Keep only the `<!-- SECTION: ... -->` blocks matching the project type.

The SRS links the use case and diagram files; it does not duplicate full use cases.

### 7. Create Use Cases

Create `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` from the `use-case` template:

- Use the next free UC number in each module.
- Document screen-specific components and states inside the use case.
- Reference only real Figma node links and existing image paths (relative from the use case file, e.g.
  `../../BA/figma/{feature}/screens/01-login.png`).
- Record a missing design as `Design Pending` with a matching Open Question.

### 8. Create Required Diagrams

Store editable Mermaid sources under `docs/diagrams/{module}/`:

- `UF-{MOD}-{NNN}`: user actions, screens, navigation and exits for main journeys.
- `ACT-{MOD}-{NNN}`: validation, decisions, success / failure and recovery for core processes.
- `SEQ-{MOD}-{NNN}`: only where multi-component or asynchronous interactions warrant it.

Every affected use case links its User Flow and Activity Diagram. Do not invent backend or API details.

### 9. Coverage & Consistency Check

Run the **Quality Gate** in `specs/SKILL.md`. In particular:

- In-scope checklist items map to requirements and use cases.
- Figma screens and states map to use cases.
- Use cases and diagrams describe the **target** app, not unapproved reference behavior.
- Alternative, error, cancel, retry and persistence rules are covered where relevant.
- No `P0` is silently closed.

### 10. Output Summary

Report:

- Project type, platform and the sources actually used.
- Master SRS path; modules and use cases created.
- User Flow, Activity and optional Sequence diagrams created.
- Missing sources, Open Questions and remaining conflicts.
- Status: **Draft / Ready for SRS Audit / Blocked by P0**.

## Important

- `docs/` is the output root.
- Use the SRS, not the FSD, unless legacy FSD mode was chosen.
- Do not assume a codebase exists.
- Do not mark documents ready for development; that needs `BA-audit-SRS`, run only when the user asks.
- **Do not** implement any code — documentation only.
