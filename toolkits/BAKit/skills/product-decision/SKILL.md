---
name: product-decision
description: "Evidence-led Product Decisions before the SRS: compare a reference / competitor app (APK profile, screens, flows, checklist, gap report) and the Figma target design against confirmed PO decisions, surface conflicts and gaps, ask the PO one decision at a time, and classify each reference behavior as KEEP / MODIFY / REMOVE / NEW / TBD. Use when the competitor app and Figma disagree, a checklist row or rule is TBD, Figma shows UI without the business rule, or someone asks whether a feature is \"ready for SRS\". Writes a versioned Product Decision Summary with a READY FOR SRS / NOT READY FOR SRS verdict; conditional, it skips features that are already defined."
license: MIT
version: 1.0.0
argument-hint: "[feature or unresolved decision]"
---

# Product Decision

Clarify a feature's target requirements, resolve conflicts between sources, and record confirmed Product
Decisions before `ba-spec-writer` writes the SRS and use cases. The output is a **Product Decision Summary**
that `specs analyze` consumes.

This skill is **conditional**. Not every feature needs it. Run it only when a meaningful unresolved product
decision exists (section 5); otherwise skip it (section 6).

**IMPORTANT:** Do not write the SRS, use cases or code. Do not route to implementation planning. The only
transition is to `specs analyze` (via `ba-spec-writer`).

## 1. Boundary vs `brainstorm-features`

| Situation | Skill | Output |
| :--- | :--- | :--- |
| A reference app, Figma design or Feature Checklist exists for the feature, and the question is which of its behaviors the target adopts | `product-decision` (this skill) | Product Decision Summary (`decisions`) |
| A new idea with no reference evidence, still weighing approaches and designing from scratch | `brainstorm-features` | Feature brief (`brief`) |

`ba-brainstormer` chooses: run this skill when competitor, Figma or checklist inputs exist for the feature,
`brainstorm-features` otherwise. If a decision here turns into open-ended design of a capability no source
covers (a `NEW` item with no target behavior at all), finish the summary with that item as `TBD` and suggest a
`brainstorm-features` pass for it.

## 2. Inputs

Use every relevant source that exists. The skill must work with only part of this set. Never invent missing
evidence. Paths are relative to the workspace.

| Input | Location | Contains |
| :--- | :--- | :--- |
| Project config | `.agents/config/ba-project-config.md` | Project type, deliverable language, competitor apps |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` | Feature scope and hierarchy, `PO note`, Dev-owned columns |
| APK profile | `docs/BA/competitor/{app-slug}/{app-slug}_profile_*.md` | Reference capability map, modules, constraints |
| APK screen inventory | `docs/BA/competitor/{app-slug}/{app-slug}_screens_*.md` | Reference screens, entry points, components, states |
| APK flow analysis | `docs/BA/competitor/{app-slug}/{app-slug}_flow-{flow}_*.md` | Actions, responses, branches, validations, limits, rules |
| Comparison / gap report | `docs/BA/competitor/*_comparison_*.md` | `CF-*`, `GAP-*`, `FR-CAND-*` IDs |
| Figma analysis | `docs/BA/figma/{feature}/{feature}_figma_*.md` | Target screens and states, `FR-DSN-*`, `BR-CAND-*` |
| Research | `docs/BA/research/` | Options, market practice, supplementary evidence |
| Feature briefs | `docs/BA/briefs/` | Earlier design decisions for the feature |
| Previous decisions | `docs/BA/decisions/{feature-slug}_decisions_*.md` | Confirmed `PD-*` decisions and open items |
| Existing specs | `docs/project-srs.md` (or legacy `docs/project-fsd.md`), `docs/usecases/` | Current rules when updating an existing feature |
| PO notes | Chat, meeting notes, checklist `PO note` column | Confirmed target decisions |

Read the latest version of each versioned file. Reuse the existing IDs (`CF-*`, `GAP-*`, `FR-CAND-*`,
`FR-DSN-*`, `BR-CAND-*`, `PD-*`) instead of re-describing the evidence.

## 3. Source Roles

- **Feature Checklist:** feature scope, hierarchy, high-level expected behavior, PO notes and known target
  constraints. It does not hold the complete business logic.
- **Profile:** the reference app's broad capability map, modules, feature groups and important reference
  constraints. Reference evidence only.
- **Screens:** available reference screens, their purpose, entry points, visible components, observed UI states
  and navigation. A reference screen is not required to exist in the target.
- **Flows (`flow-*`):** the main source for detailed reference behavior — user actions, system responses,
  branching, state transitions, validations, limits, save/cancel behavior, error behavior and reference business
  rules. None of it is inherited into the target automatically.
- **Figma / target design:** target screens, components, visible states, navigation, values shown in the design,
  and differences from the reference. Do not infer hidden business rules from visual design alone.
- **Research:** relevant options, competitive behavior, best practices and extra evidence. Supplementary unless
  the PO explicitly adopts it.
- **PO notes and existing Product Decisions:** confirmed target decisions. Do not reopen them without a real new
  conflict.

## 4. Evidence Discipline

Always separate evidence from decision. For each unresolved item, record four things and never merge them into
one assumed requirement:

- **Reference Evidence** — what the reference product does, with its grade and citation.
- **Target Design** — what Figma shows (screen / node, `FR-DSN-*`, `BR-CAND-*`).
- **Existing Decision** — what the PO has already confirmed (`PD-*`, `PO note`, existing FR / BR).
- **Gap** — what remains unresolved.

Keep the evidence grade of every reference claim: observed on device (cite the screenshot / tree file),
`[Code]` (cite `path:line`), or `[Inferred]` (needs confirmation). An `[Inferred]` reference behavior can
inform a question but never stands as evidence for a `KEEP`.

## 5. Brainstorm Triggers

Run this skill when at least one is true:

1. The requirement is ambiguous.
2. A feature, checklist row or rule is marked `TBD`.
3. APK evidence and Figma are inconsistent.
4. A reference behavior exists but whether the target adopts it is unclear.
5. Figma contains UI without enough business behavior.
6. Multiple valid approaches exist.
7. Research suggests competing approaches.
8. The PO requests a recommendation.
9. A new feature does not yet have sufficient target behavior.
10. An update to an existing requirement conflicts with current rules.

## 6. Skip Conditions

Do not run a full brainstorm when the requirement is already confirmed, the target behavior is sufficiently
defined, the feature only needs to be converted into SRS language, a change request already states the final
rule, or no unresolved item affects implementation. Return exactly:

`Brainstorm not required — requirement sufficiently defined.`

Then give `ba-spec-writer` the relevant context (sources, confirmed rules, IDs) for the handoff. No decisions
file is written in this case unless the user asks for one.

## 7. Decision Types

Use exactly these types:

| Type | Meaning |
| :--- | :--- |
| `KEEP` | Reference behavior is retained substantially as-is |
| `MODIFY` | The target keeps the feature concept but changes one or more behaviors, limits, values, states, flows or rules |
| `REMOVE` | The reference feature or behavior is excluded from the target |
| `NEW` | The target adds a behavior or feature not present in the reference |
| `TBD` | Not confirmed. It stays `TBD` until the PO or an authorized product source confirms it |

`KEEP`, `MODIFY`, `REMOVE` and `NEW` are only for confirmed items. An unresolved item is `TBD`.

## 8. Workflow

### Step 1 — Collect context

Read the project config and the available inputs (section 2). Identify the target feature, known scope,
available reference evidence, available target design, existing decisions (including the latest
`docs/BA/decisions/` file for the feature) and unresolved gaps. Do not ask the user for information already
present in these sources.

### Step 2 — Identify decision gaps

List the real unresolved decision points, concisely:

```text
Feature: Beauty

Known:
- Reference has 9 beauty parameters ({app-slug}_flow-beauty, observed).
- Figma shows 6 parameter controls (FR-DSN-004).

Unknown:
- Should the target include 6 or 9?
- Are the default values inherited or redefined?
- Does Reset apply to one parameter or the whole beauty group?
```

### Step 3 — Separate evidence from target requirement

For every gap, write the four buckets of section 4. Do not turn reference evidence into a target rule at this
stage.

### Step 4 — Assign priority

- `P0` — Blocking: the SRS cannot be written correctly without it.
- `P1` — Important: materially affects flow, rule, UX or implementation, but some specification can continue.
- `P2` — Optional: can be deferred without blocking the core feature.

Resolve P0 first. Do not spend interaction time on P2 while P0 or P1 items remain.

### Step 5 — Ask clarifying questions

Ask in chat, **one decision point per message**, multiple choice preferred. Wait for the answer before asking
the next. For prioritising and phrasing questions, follow
`.agents/skills/brainstorm-features/references/dynamic-questioning.md`.

```text
Feature:
Decision to confirm:

Reference:
...

Figma:
...

Question:
...

Options:
A.
B.
C.

Recommendation:
...
```

`Options` and `Recommendation` are optional. Do not create artificial alternatives when the decision is
straightforward. If the user does not answer a question, leave the item `TBD`.

### Step 6 — Evaluate options

When several approaches are relevant, compare them only on the dimensions that matter: user experience, target
scope, consistency with the target design and confirmed decisions, reference behavior, design impact,
dependency, technical feasibility when known, and implementation complexity at a qualitative level. Do not
fabricate exact effort or development time.

### Step 7 — Record the decision

After the PO confirms, record it:

```text
Decision ID: PD-001
Feature:
Status: Confirmed

Reference:
...

Decision:
KEEP | MODIFY | REMOVE | NEW

Final Rule:
...

Reason:
...

Source:
PO | Figma | Research | Existing Requirement | Other confirmed source
```

Decision IDs are `PD-{NNN}`, numbered per feature and **stable across versions**: a `TBD` keeps its ID when it
is later confirmed, and a reversed decision keeps its ID with the change recorded in the Change Log. Never
renumber or reuse an ID.

### Step 8 — Preserve context downstream

The Feature Checklist does not have to hold the detailed decisions; the decisions file does. If the workflow
explicitly requires updating the checklist `PO note`, summarize the confirmed decision there with its `PD-*` ID.
Never fill or overwrite Dev-owned columns (`Khả thi`, `Mức độ`, `Thời gian (about)`) unless their owner has
provided the values.

### Step 9 — Write the Product Decision Summary

Fill template key `product-decision` (`.agents/skills/ba-templates/templates/product-decision-summary.md`) and
save it as:

```
docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md
```

Naming type `decisions`, per `ba-naming-convention`. The file is **immutable once written**: new or changed
decisions go into a new `v{N+1}` that carries forward every `PD-*` from the previous version, with the change in
the Change Log. Write the deliverable in the language set by `ba-global-rules` and follow
`ba-markdown-formatting`. The summary contains: scope and sources, Confirmed Decisions, Open Decisions,
modified and removed reference behaviors, new target behaviors, evidence links and the readiness verdict.

### Step 10 — Readiness check

Set the verdict in the summary:

**READY FOR SRS** when no P0 item is unresolved, core scope is clear, core behavior is confirmed, and any
remaining P1/P2 items are explicitly documented and do not block the SRS.

**NOT READY FOR SRS** when core scope is unclear, a P0 item is unresolved, Product Decisions conflict with each
other, or Figma and a confirmed requirement still conflict on implementation-critical behavior. List the
blocking reasons.

Then tell the user the file path and the verdict. On READY FOR SRS, ask whether to proceed to `specs analyze`
with the decisions file as input; on NOT READY, list the blocking `PD-*` items to resolve first.

## 9. Conflict Handling

Never silently choose one source when sources conflict; turn the conflict into a decision point. Examples:

- APK supports 12 categories; Figma shows 6.
- APK auto-saves; Figma shows a Save button.
- The Feature Checklist says a feature exists; Figma has no entry point.
- Research recommends a new flow that conflicts with a confirmed PO rule.

When a confirmed Product Decision exists, it is the target rule; record the conflicting reference behavior only
as evidence.

## 10. Reference Behavior Rules

APK evidence explains reference behavior. It can inform a target decision but cannot make one. Do not
automatically inherit limits, default values, technical constraints, monetization logic, device restrictions,
save behavior, permission behavior, navigation behavior, error handling or implementation details. Each item
that affects the target must be confirmed (`KEEP`), changed (`MODIFY`), excluded (`REMOVE`) or left `TBD`.

## 11. Technical Brainstorming

Keep technical questions separate from product decisions — SDK choice, file storage, local vs server
processing, caching, device performance fallback, API design, security constraints. Record them as technical
open items, and flag them for `ba-lead` to route to `ba-researcher` (or the technical owner) when deeper
validation is needed.
A technical decision must never redefine a product requirement without PO confirmation.

## 12. Handoff Contract

The decisions file is the input for `ba-spec-writer` (`specs analyze`). It must include:

1. Confirmed Product Decisions
2. Open Decisions
3. Modified reference behaviors
4. Removed reference behaviors
5. New target behaviors
6. Relevant evidence (file paths and IDs)
7. Remaining P1/P2 items
8. SRS readiness status

## 13. Hard Rules

1. APK evidence describes the reference product, not the target product.
2. Never convert reference behavior into a target requirement without target confirmation.
3. Do not ask the user to reconfirm an already confirmed Product Decision.
4. Do not brainstorm simply because a feature exists; brainstorm only unresolved decisions that matter.
5. Do not silently resolve source conflicts.
6. Confirmed Product Decisions override reference behavior.
7. Figma defines target UI intent, not hidden business logic.
8. `TBD` is a valid state. Never fabricate missing values or rules to make the document look complete.
9. Do not force 2–3 approaches when only one clear requirement exists.
10. Do not create exact feasibility or effort estimates without owner input.
11. Do not write the SRS (or FSD), and do not route to implementation planning.
12. Never edit a written decisions file; write a new version.
13. The output must be usable directly by `ba-spec-writer`.

## 14. Completion Criteria

The skill is complete when all P0 decisions are resolved, the target scope is sufficiently clear, core target
behavior is confirmed, unresolved P1/P2 items are explicitly documented, and the Product Decision Summary is
saved under `docs/BA/decisions/` with its readiness verdict. If the user stops before P0 items are resolved,
still save the summary with verdict NOT READY FOR SRS and the open items.
