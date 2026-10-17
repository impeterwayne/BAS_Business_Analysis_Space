# Analyze Workflow — /specs analyze "feature description"

Analyze one **target feature**, create or update its use cases and diagrams, and synchronize the SRS without
rewriting unrelated modules.

## Arguments

Everything the user typed after `analyze` is the feature description.
Example: `/specs analyze "AI image generation: input photo validation and retry"`

The description may be a path to a Product Decision Summary (`docs/BA/decisions/…_decisions_*.md`), a feature
brief (`docs/BA/briefs/…`) or a Figma design analysis (`docs/BA/figma/{feature}/{feature}_figma_*.md`). The
decision file or brief then sets the confirmed scope; the Figma analysis supplies the screens, flows, fields,
states and messages, with its exported reference images embedded as Markdown image previews (`![...](...)`).

## Steps

### 1. Detect Project Type

Follow **Project Type Resolution** in `specs/SKILL.md` and store the result (`web-frontend`, `api-backend`,
`fullstack-web`, `mobile`, or `unknown`).

### 2. Check the Decision Gate

Find what confirms the target behavior, in this order:

1. A Product Decision Summary `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` (latest `v[N]`).
2. A feature brief under `docs/BA/briefs/`.
3. An explicit decision from the user in this conversation.

- Verdict `NOT READY FOR SRS` → **stop**. Show its blocking `PD-*` / `P0` items and ask whether to resolve
  them with `product-decision` (`ba-brainstormer`) first.
- Nothing found → **stop** and ask whether to brainstorm / decide first, or to proceed on the user's explicit
  decision.
- Verdict `READY FOR SRS` → continue; carry its `TBD` items forward as Open Questions.

### 3. Identify the Feature

Determine its module, related checklist rows, target screens, entry points, existing FRs / use cases and the
available evidence. If the description is ambiguous, ask before editing.

### 4. Read the Current Documentation

Read if present:

- `docs/project-srs.md` (or `docs/project-fsd.md` in legacy FSD mode)
- `docs/usecases/` — list modules and use cases
- `docs/diagrams/`
- Existing Open Questions and Change Log

If no SRS exists, say so and either create the minimum SRS structure using `/specs init` conventions, or
proceed with a partial draft marked as such. Do not invent existing content.

### 5. Analyze Source Evidence

For the requested feature, consult:

1. The decision file / brief for confirmed target behavior (`KEEP / MODIFY / REMOVE / NEW`).
2. The Figma analysis for target screens, components, visible states and copy.
3. APK `*_screens_*` and relevant `*_flow-{flow}_*` evidence for **reference** rules.
4. The Feature Checklist and PO notes for scope.
5. Research / PRD / existing requirements where relevant.

Keep four buckets apart: **Reference evidence**, **Target design**, **Confirmed target behavior**, **Unresolved
gaps**. Do not promote `[Inferred]` evidence into requirements.

### 6. Detect Gaps & Conflicts

Check for:

- Missing UI states, validations, defaults, limits, save / reset rules.
- Figma that contradicts confirmed behavior.
- Missing success / error / empty / loading / retry / cancel handling.
- Navigation or business rules that conflict with existing ones.

Prioritize gaps `P0/P1/P2`. Route blocking product decisions to `product-decision`; never fill a `TBD` with an
assumption.

### 7. Hand Off to `ba-spec-writer`

If this skill already runs inside `ba-spec-writer`, do the work below directly. Otherwise dispatch
`ba-spec-writer` with `invoke_subagent` and this brief:

```
Analyze the requested feature and update the SRS and use cases.

Feature: {feature-description}
Project type: {resolved-type}
Decision source: {decisions file + verdict / brief / user decision}
Current SRS: {summary or "none"}
Existing use cases / diagrams: {relevant paths}
Sources: {checklist / Figma analysis / APK evidence / research paths}
Gaps: {P0/P1/P2 list}

Instructions:
1. Read .agents/skills/ba-templates/templates/srs.md and
   .agents/skills/ba-templates/templates/use-case.md.
2. Reuse/update an existing UC when it covers the same user goal; otherwise create a new UC
   with the next stable ID in the module.
3. Put the Figma-linked UI Specification inside the UC before Main Flow, embedding each exported screen image with Markdown image syntax (`![{Screen ID} — {Screen name}](../../BA/figma/{feature}/screens/{NN}-{slug}.png)`) so it renders a visual preview rather than a shortened or plain backticked path.
4. Include Main, Alternative, Exception / Edge Flows, Business Rules, Navigation / Result, Acceptance Criteria.
5. Update shared User Flow / Activity Diagrams only where impacted; add a dedicated diagram for
   independently complex logic. Sequence Diagram only for warranted interactions.
6. Synchronize FR / UC / BR / diagram references, the traceability matrix and Open Questions in the SRS.
7. Promote FR-CAND / FR-DSN / BR-CAND only when confirmed; keep the candidate ID in Nguồn (Source).
8. Bump versions and add Change Log rows; preserve unrelated approved content.
9. Vietnamese with English terminology; validate against ba-markdown-formatting. Do not implement code.
```

### 8. Update Use Cases & Diagrams

- Write or update use cases in `docs/usecases/{module}/`; create the module directory if it is new.
- Navigation changed → update the covering `UF-*`.
- Decisions or branches changed → update the covering `ACT-*`.
- Complex interaction changed and warranted → update or create `SEQ-*`.
- Link shared diagrams from every relevant use case; avoid duplicate diagram files.

### 9. Synchronize the Master SRS

Update only what applies:

- Traceability matrix and Functional Requirements (add a module section for a new module).
- Global Business Rules.
- User Flow, Activity and Sequence indexes.
- Permissions, Ads / IAP, NFRs, dependencies **only when applicable and supported**.
- Open Questions and Change Log.

Do not overwrite unaffected requirements or claim designs or screenshots that do not exist.

### 10. Quality Check & Summary

Run the **Quality Gate** in `specs/SKILL.md` for the affected module, then report:

- Module affected (new or existing) and the decision source used.
- FRs and use cases created or updated; business rules added.
- UI states / rules added or clarified.
- User Flow / Activity / conditional Sequence diagrams updated.
- Open Questions and outstanding `P0` blockers.
- Readiness for `BA-audit-SRS`.

## Important

- Update an existing use case when the user goal is the same; do not duplicate it.
- Do not remove unrelated use cases.
- Do not treat APK reference rules as approved target rules.
- Documentation only; no implementation.
