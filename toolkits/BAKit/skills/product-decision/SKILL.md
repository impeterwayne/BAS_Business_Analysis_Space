---
name: product-decision
description: "Evidence-led Product Decisions before the SRS: compare a reference / competitor app (APK profile, screens, flows, checklist, gap report) and the Figma target design against confirmed PO decisions, surface hidden rules not visible in design, present a single Batch Rule Confirmation Table ('Bảng xác nhận rule') for the PO to confirm in one pass, and classify each reference behavior as KEEP / MODIFY / REMOVE / NEW / TBD. Writes a versioned Product Decision Summary with a READY FOR SRS / NOT READY FOR SRS verdict; conditional, it skips features that are already defined."
license: MIT
version: 1.1.0
argument-hint: "[feature or unresolved decision]"
---

# Product Decision

Clarify a feature's target requirements, resolve conflicts between sources, and record confirmed Product
Decisions before `ba-spec-writer` writes the SRS and use cases. The output is a **Rule Confirmation Table / Product Decision Summary**
that `specs` consumes.

This skill is **conditional**. Not every feature needs it. Run it only when a meaningful unresolved product
decision exists (section 5); otherwise skip it (section 6).

**IMPORTANT:** Do not write the SRS, use cases or code. Do not route to implementation planning. The only
transition is to `specs` (via `ba-spec-writer`).

## 1. Boundary vs `brainstorm-features`

| Situation | Skill | Output |
| :--- | :--- | :--- |
| A reference app, Figma design or Feature Checklist exists for the feature, and the question is which of its behaviors/rules the target adopts | `product-decision` (this skill) | Rule Confirmation Table & Product Decision Summary (`decisions`) |
| PO research notes exist (`docs/BA/research/` or `docs/inputs/research/`) with no APK yet, and the PO needs a Feature Checklist first | `ba-brainstormer` (Section 5A) → then `product-decision` | Feature Checklist → Rule Confirmation Table & Product Decision Summary |
| A new idea with no reference evidence, still weighing approaches and designing from scratch | `brainstorm-features` | Feature brief (`brief`) |

`ba-brainstormer` chooses: run this skill when competitor, Figma or checklist inputs exist for the feature,
`brainstorm-features` otherwise. If a decision here turns into open-ended design of a capability no source
covers (a `NEW` item with no target behavior at all), finish the summary with that item as `TBD` and suggest a
`brainstorm-features` pass for it.

## 2. Inputs

Use every relevant source that exists. The skill must work with only part of this set. Never invent missing
evidence. Paths are relative to the workspace (supporting both `docs/BA/...` and `docs/ba/...` / `docs/inputs/...` layouts).

| Input | Location | Contains |
| :--- | :--- | :--- |
| Project config | `.agents/config/ba-project-config.md` (or `.agents/config/project-config.md`) | Project type, deliverable language, competitor apps |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` or `docs/ba/feature-checklist/{app}_feature-checklist_v{N}.md` | Feature scope and hierarchy, `PO note`, Dev-owned columns |
| APK profile | `docs/BA/competitor/{app-slug}/{app-slug}_profile_*.md` or `docs/inputs/apk/*_profile*.md` | Reference capability map, modules, constraints |
| APK screen inventory | `docs/BA/competitor/{app-slug}/{app-slug}_screens_*.md` or `docs/inputs/apk/*_screens*.md` | Reference screens, entry points, components, states |
| APK flow analysis | `docs/BA/competitor/{app-slug}/{app-slug}_flow-{flow}_*.md` or `docs/inputs/apk/*_flow-*.md` | Actions, responses, branches, validations, limits, rules |
| Comparison / gap report | `docs/BA/competitor/*_comparison_*.md` | `CF-*`, `GAP-*`, `FR-CAND-*` IDs |
| Figma analysis / Design images | `docs/BA/figma/{feature}/{feature}_figma_*.md`, `docs/inputs/design/` | Target screens and states, `FR-DSN-*`, `BR-CAND-*` |
| Research | `docs/BA/research/` or `docs/inputs/research/` | Options, market practice, supplementary evidence |
| Feature briefs | `docs/BA/briefs/` | Earlier design decisions for the feature |
| Previous decisions | `docs/BA/decisions/{feature-slug}_decisions_*.md` or `docs/ba/product-decisions/` | Confirmed `PD-*` decisions and open items |
| Existing specs | `docs/project-srs.md`, `docs/ba/srs/{app}_srs_v{N}.md`, `docs/usecases/` | Current rules when updating an existing feature |
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
- **Target Design** — what Figma / design screenshots show (screen / node, `FR-DSN-*`, `BR-CAND-*`).
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
5. Figma / Design contains UI without enough hidden business behavior (limits, defaults, error states, persistence).
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

Read the project config and the available inputs (section 2). Identify the target feature(s), known scope,
available reference evidence, available target design, existing decisions and unresolved gaps. Do not ask the user for information already
present in these sources.

### Step 2 — Identify decision gaps

List the real unresolved decision points — **only rules not visible on the design images** (e.g., slider range, min/max photo count, output format/resolution, back/cancel behavior, permission denial behavior, ads/IAP triggers, error handling). Anything already visible in the design or confirmed in `PO note` is NOT asked again.

### Step 3 — Separate evidence from target requirement

For every gap, write the four buckets of section 4. Do not turn reference evidence into a target rule at this
stage.

### Step 4 — Assign priority

- `P0` — Blocking: the SRS cannot be written correctly without it.
- `P1` — Important: materially affects flow, rule, UX or implementation, but some specification can continue.
- `P2` — Optional: can be deferred without blocking the core feature.

Sort rows with `P0` first, then `P1`, then `P2`.

### Step 5 — Present the Rule Confirmation Table (Mandatory Batch Mode)

Before detailed Use Cases are written, do **NOT** ask one question per turn in a long back-and-forth when multiple rules need confirmation. Instead, collect **all** unresolved rules across the in-scope features into **one single confirmation table** ("Bảng xác nhận rule") and send it in one message (and save it to `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` or `docs/ba/product-decisions/{app}_rule-confirmation_v{N}.md`) so the PO can confirm everything in one pass.

#### Rules for building the table

1. **Only include items that genuinely need a decision** — rules not visible in the design images (limits, defaults, save format, back/cancel behavior, error handling, permission denial, etc.) or places where APK evidence and design disagree.
2. **Never include what the design already shows** (screen layout, visible buttons, visible tabs, visible labels) or what `PO note` already decided.
3. **Every row must show both:**
   - **Giá trị trong APK** — the exact value/behavior found in the APK evidence (or `Không có trong APK` if the feature is new / not in APK).
   - **Đề xuất của AI** — a concrete, practical recommendation (with short options `A / B / C` when helpful) so the PO can simply reply `OK` (keep APK value), `A` / `B`, or type a custom value.
4. Group rows by feature (`Group of feature` / `Tính năng`) and sort `P0` rows first.
5. Keep the wording short, plain Vietnamese with English screen/feature/UI names (no parenthesized Vietnamese translations).

#### Required Batch Table Format

```markdown
# Bảng xác nhận rule trước khi viết Use Case — [App Name]

> **Cách PO phản hồi nhanh:**
> - Ghi **`OK`** nếu đồng ý giữ theo **Giá trị trong APK** (hoặc theo **Đề xuất của AI** khi APK không có).
> - Ghi **`A` / `B` / `C`** để chọn phương án tương ứng trong cột Đề xuất.
> - Hoặc ghi trực tiếp rule/giá trị mới vào cột **PO chốt**.
> - Có thể trả lời nhanh tại khung chat theo mã, ví dụ: `PD-001: OK, PD-002: B, PD-003: tối đa 15 ảnh`.

| Mã | Tính năng | Rule cần chốt (không thấy trên Design) | Giá trị trong APK | Đề xuất của AI | Ưu tiên | PO chốt |
|---|---|---|---|---|---|---|
| PD-001 | Beauty | Số lượng tham số làm đẹp và dải giá trị Slider | 9 tham số, Slider 0–100, mặc định 50 | **A.** Giữ 6 tham số đúng theo Design, Slider 0–100 (mặc định 50)<br>**B.** Đưa đủ 9 tham số như APK | P0 |  |
| PD-002 | Collage | Số lượng ảnh tối thiểu / tối đa khi ghép | Tối thiểu 2 ảnh, tối đa 9 ảnh | Giữ như APK: 2–9 ảnh (ghi `OK` nếu đồng ý) | P0 |  |
| PD-003 | Save & Share | Định dạng và chất lượng ảnh khi lưu về Gallery | JPEG 90%, lưu vào thư mục `Pictures/<AppName>` | Giữ như APK: JPEG 90%, lưu vào `Pictures/<AppName>` | P1 |  |
```

Wait for the PO's single-pass reply (either edited in the file or pasted in chat such as `PD-001: A, PD-002: OK`). Any row the PO leaves blank or skips stays `TBD`.

### Step 6 — Evaluate options

When several approaches are relevant, compare them only on the dimensions that matter: user experience, target
scope, consistency with the target design and confirmed decisions, reference behavior, design impact,
dependency, technical feasibility when known, and implementation complexity at a qualitative level. Do not
fabricate exact effort or development time.

### Step 7 — Record the decision

After the PO replies to the confirmation table, map each response (`OK`, `A/B/C`, or custom text) into a structured decision record:

- `OK` on an APK-backed row → `KEEP` with the APK value as `Final Rule`.
- `OK` on a row where APK had no value → `NEW` with the AI-recommended value as `Final Rule`.
- `A` / `B` / `C` or custom value that differs from APK → `MODIFY` (or `REMOVE` / `NEW` as appropriate) with the chosen value as `Final Rule`.
- Unanswered row → `TBD`.

Decision IDs are `PD-{NNN}`, numbered per feature/app and **stable across versions**: a `TBD` keeps its ID when it
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

- `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` (standard BAKit path), or
- `docs/ba/product-decisions/{app}_product-decisions_v{N}.md` (when the workspace uses `docs/ba/` layout).

The file is **immutable once written**: new or changed decisions go into a new `v{N+1}` that carries forward every `PD-*` from the previous version, with the change in the Change Log. Write the deliverable in the language set by `ba-global-rules` and follow `ba-markdown-formatting`.

### Step 10 — Readiness check

Set the verdict in the summary:

**READY FOR SRS** when no P0 item is unresolved, core scope is clear, core behavior is confirmed, and any
remaining P1/P2 items are explicitly documented and do not block the SRS.

**NOT READY FOR SRS** when core scope is unclear, a P0 item is unresolved, Product Decisions conflict with each
other, or Figma and a confirmed requirement still conflict on implementation-critical behavior. List the
blocking reasons.

Then tell the user the file path and the verdict. On READY FOR SRS, ask whether to proceed to `specs`
with the decisions file as input; on NOT READY, list the blocking `PD-*` items to resolve first.

## 9. Conflict Handling

Never silently choose one source when sources conflict; turn the conflict into a decision point in the Batch Confirmation Table. Examples:

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

The decisions file is the input for `ba-spec-writer` (`specs`). It must include:

1. Confirmed Product Decisions (`PD-*`)
2. Open Decisions (`TBD`)
3. Modified reference behaviors
4. Removed reference behaviors
5. New target behaviors
6. Relevant evidence (file paths and IDs)
7. Remaining P1/P2 items
8. SRS readiness status (`READY FOR SRS` / `NOT READY FOR SRS`)

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
saved with its readiness verdict. If the user stops before P0 items are resolved,
still save the summary with verdict NOT READY FOR SRS and the open items.
