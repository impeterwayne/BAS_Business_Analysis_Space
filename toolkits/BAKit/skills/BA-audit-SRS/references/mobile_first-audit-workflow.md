## Mobile First Audit Workflow

1. **Ingest & Understand** — read every available artefact, separate target scope from reference behavior
2. **Audit** — coverage, UI, business logic, Product Decisions, diagrams, optional sections; score readiness
3. **Report** — versioned readiness report with verdict, score, gaps, questions and handoff conditions
4. **Sync Question Backlog** — auto-chain `BA-audit-QnA`

## Purpose and Boundaries

Perform the first audit of a **full mobile SRS**, a **module / selected UCs**, or a **single UC**. The audit
never edits the SRS, use cases, diagrams or decisions, and never generates test cases.

> **TEST SCOPE — READ BEFORE STARTING:**
> The project tests the **Mobile Client** only. Look at everything through "how does the client display /
> handle it?" — NOT "what does the server / API do?".
> - API descriptions (endpoint, payload, response) are **context** for client behavior only.
> - Do NOT audit API logic, judge backend correctness, or raise questions about server-side processing.
> - A gap that belongs to the API / backend layer is **recorded in the report, without suggesting tests for
>   that layer**.
> - Documented integration expectations the client depends on (an SDK callback, a push payload the app
>   renders) are in scope as client-facing behavior.

| Scope | Template | Depth |
| :--- | :--- | :--- |
| Full SRS (`docs/project-srs.md` or legacy `docs/project-fsd.md`) | `../template/mobile_srs_readiness_review_template.md` | Steps 1–8 and 10–13 for every in-scope feature, then Phase 4 |
| Module / UC group (`srs {module}` or a UC list) | `../template/mobile_srs_readiness_review_template.md` | Same, limited to the module plus the global rules and shared diagrams it uses |
| Single UC | `../template/UC_readiness_review_template_v3.md` | Steps 1–8, then **Step 9 (Single-UC depth)**, then 10–13 and Phase 4 |

### Supported Artefact Types

| Type | Examples |
| :--- | :--- |
| SRS / Use Case | `docs/project-srs.md`, `docs/usecases/{module}/uc-*.md`, feature brief, user story |
| Product Decisions | `docs/BA/decisions/{feature-slug}_decisions_*.md` (`PD-*`), PO notes |
| Scope inventory | Feature Checklist `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` |
| UI Design | Figma analysis `docs/BA/figma/{feature}/`, Figma export, screenshot, mockup |
| Reference evidence | APK `*_profile_*`, `*_screens_*`, `*_flow-*` in `docs/BA/competitor/{app-slug}/` |
| Diagrams | `docs/diagrams/{module}/` — `UF-*`, `ACT-*`, `SEQ-*` |
| API / integration | REST doc, Swagger/OpenAPI, SDK spec (context only) |
| Other | Data dictionary, message catalog, legacy common rules (`docs/BA/SRS-report/CMR/`) |

All formats are supported: Markdown, plain text, PDF, Word (.docx), images (PNG/JPG).

## Phase 1 — Ingest & Understand

### Step 1 — Read all artefacts

**Mandatory reading order** (skip what does not exist, never invent it):

1. Product Decision Summary (latest `v{N}` per feature) and PO notes — target decisions, `PD-*`, TBD items,
   READY / NOT READY FOR SRS verdict.
2. Feature Checklist — candidate scope and `PO note` column.
3. SRS global sections — scope, FR list, global business rules, message catalog. In a legacy project, read
   the common rules (CMR) first; they are the foundation for detecting conflicts.
4. Use cases in scope, in full.
5. Figma analysis and its `screens/` images; any other screenshot or mockup.
6. APK evidence — `profile`, `screens`, `flow-*` for the related flows.
7. Diagram sources linked from the SRS / UCs.
8. Briefs and research relevant to the scope.
9. Audit history: previous `*_audited_*` reports and `*_question-backlog.md` (first audit: confirm there is
   none for this scope).

> ⚠️ **TEST SCOPE:** API specifications are read only to understand client behavior. Focus on how the client
> displays and handles results.

**Input-type routing:**

| Input type | Action |
| :--- | :--- |
| URL provided | Invoke `.agents/skills/document-extraction/SKILL.md` to extract text, tables, images first. Do NOT read URL files directly. |
| PDF provided | Invoke `.agents/skills/document-extraction/SKILL.md` first. Do NOT read PDF files directly. |
| DOCX provided | Invoke `.agents/skills/document-extraction/SKILL.md` first. Do NOT read DOCX files directly. |
| File path provided | Read the file with the appropriate tool. |
| Image file provided | Open the image; describe all visible UI elements, labels, states and flows in detail. |
| Pasted text provided | Treat as a document; parse it directly from the prompt. |

Record each expected source as `Provided`, `Not Provided`, `Not Applicable` or `Unavailable`
(`input-files-format.md` §3). Respect the evidence grades observed / `[Code]` / `[Inferred]`.

DO NOT score anything before all documents are read.

### Step 2 — Build the target understanding

Establish, with source references:

- **Target scope:** in scope / out of scope / TBD features, from the checklist filtered by the Product
  Decisions (`PD-*` with KEEP / MODIFY / REMOVE / NEW / TBD).
- **Requirement map:** FR → UC → screen → BR → diagram (`UF-*`, `ACT-*`, `SEQ-*`).
- Screens and target flows, confirmed product changes, applicable permissions / monetization, known
  technical dependencies.
- **Reference vs target:** what the reference app does (APK evidence) versus what the target must do. Keep
  them apart in working notes.

Working-note table (not the report):

| Feature | Checklist ref | PD-ID | Decision | Target status | FR / UC | Screens | Diagrams |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {feature} | {row / CF-ID} | {PD-001} | {KEEP / MODIFY / REMOVE / NEW / TBD} | {In / Out / TBD} | {FR-…, UC-…} | {Figma screen NN} | {UF-…, ACT-…} |

## Phase 2 — Audit

### Step 3 — Feature scope and traceability

- Every confirmed in-scope checklist item maps to an FR / UC or a documented shared rule.
- Flag omitted requirements, requirements with no source (orphans), REMOVE behavior written as active, and
  TBD treated as final.
- APK features outside the target scope are **not** missing target requirements.
- Check IDs and links: FR / UC / BR / PD / diagram IDs exist, are unique and resolve to real files.

### Step 4 — UI specification coverage

For each UI-bearing UC:

- The UI Specification is embedded in the UC **before** the flows and references the authentic Figma frame /
  screenshot for each screen (or `Design Pending`, which is itself a gap when the screen is in scope).
- The specified components match the supplied design and the screen purpose; labels are consistent between
  design and UC (verbatim, original language).
- For each relevant component check: label, default value, visibility, enabled / disabled state, tap action,
  system response, error / empty / loading state, input constraint, Back / Close / Cancel.
- Record a gap only for **applicable or demonstrably necessary** states — there is no penalty for not filling
  a generic exhaustive state checklist.

### Step 5 — Business logic and testability

- Verify trigger, actor, pre/postconditions, Main / Alternative / Exception flows, branch conditions,
  validation, limits, navigation, save / reset, permission denied, data loss and error / retry behavior
  **when applicable**.
- Cross-check shared rules, duplicated logic and UC-to-UC transitions; a rule restated differently in two UCs is
  a conflict.
- Flag vague or non-verifiable wording ("should", "may", "fast", "easy", "appropriate").
- If a behavior is unconfirmed, raise a question — never add an assumption.

**Edge-case lens** — use these groups to look for gaps; raise one only where the case applies to the UC:

- **A — Extreme data states:** text overflow (truncate / wrap rule); numeric 0, negative, very large; empty
  list vs exactly 1 vs the maximum count; null / missing data shown to the user (placeholder?).
- **B — Network & API states (client behavior only):** slow response (loading / skeleton), timeout and
  retry, partial failure (one call fails, others succeed — independent handling or full-screen block?),
  duplicate calls (double tap, back then re-enter), network loss mid-load (is loaded data kept?).
- **C — Abnormal interactions:** rapid repeated taps, gestures outside the allowed area, rotation (if
  landscape is supported), Android system Back while a modal / sheet is open.
- **D — Permissions & session:** session expiry on the screen, reopen after force-close, role-dependent
  content, OS permission denied / revoked.
- **E — Internationalization:** text updates after a language change, long strings breaking layout, where the
  language choice persists (logout / reinstall).

> ⚠️ **TEST SCOPE:** groups A–B check only how the **client displays and reacts**; they do not test why the
> API returned null or an error. Correct scope example: "The app shows toast 'Có lỗi xảy ra' (An error
> occurred) and keeps the entered data when the API returns 5xx."

### Step 6 — Product Decision alignment

| Decision | Expected in the SRS | Gap when |
| :--- | :--- | :--- |
| `KEEP` | The named behavior is specified (only what the decision names, not every reference detail) | Missing, or reference details silently added |
| `MODIFY` | The modified target behavior, not the reference behavior | SRS still describes the reference behavior |
| `REMOVE` | Absent, or listed as out of scope | Specified as an active requirement |
| `NEW` | Specified with flows and rules | Missing or only named |
| `TBD` | An Open Question with P0/P1/P2, not an FR | Written as a final requirement |

- An `[Inferred]` reference claim must not appear as a confirmed target rule.
- If the decision summary for an in-scope feature is `NOT READY FOR SRS`, check which `PD-*` were unresolved
  and whether the SRS invented their answers.
- Distinguish a deliberate, confirmed divergence from the reference (not a defect) from a conflict between
  sources (a gap). Cite both sources.

### Step 7 — Diagram audit

- **User Flow (required):** the main feature journeys are covered; entry points, screens, decisions and
  navigation match the target UCs.
- **Activity (required):** the core business processes are covered; validations, branches, success / failure
  and end states match the UCs and BRs.
- **Shared diagrams:** valid when each UC references the covered path (`Sơ đồ liên quan (Related Diagrams)`
  or the coverage matrix). Do not require duplicate diagrams per UC.
- **Sequence (conditional):** assess the need only for intricate cross-component or asynchronous interaction
  (app ↔ backend / SDK / third party). **A missing Sequence Diagram for a simple UC is a pass.** If one is
  needed and its participants are unknown, raise a question instead of requiring invented architecture.
- Flag absent coverage, wrong direction or branch, conflicts with target rules, unconfirmed APK assumptions,
  a User Flow used as an Activity Diagram (or vice versa), and horizontal flowcharts (`ba-markdown-formatting`
  §5).

### Step 8 — Optional requirement audit

- Permissions, Ads / IAP, NFR and dependencies are checked only when confirmed in target scope or
  operationally applicable based on evidence.
- Target Ads / IAP absent → mark `N/A`; **absence of Ads / IAP is not a defect**.
- Reference monetization exists but target adoption is TBD → log a clarification question; do not treat it as
  a target requirement.
- Never require invented numeric NFR targets.

### Step 9 — Single-UC depth (Single UC scope only)

Synthesize the UC into the sections of `UC_readiness_review_template_v3.md`, then score it.

**1. UI Object Inventory & Mapping (Section 4)** — one atomic component per row, mapped design ↔ UC:

| # | Component Name | Type | In UC? | In Design? | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Hamburger Button (☰) | Button (Icon) | ✅ | ✅ | |

Mandatory checks per component: display state (Enabled / Disabled / Hidden / Read-only), tap action rule,
label consistency between design and UC. Then cross-check each row against the SRS global rules (legacy:
CMR): an applicable rule the UC does not mention → ⚠️ Partial + confirmation question; a conflict → 🔴
Conflict + High-priority question. Sub-categories: data display (list columns, paging, default sort, empty
state), controls (filters / search: initial state, values, constraints), navigation and action components,
everything else. Apply the granularity and coverage self-check of `first-audit-workflow.md` Phase 1 Step 2–3
(no collapsed rows; image element count = mapped rows).

**2. Object Attributes & Behavior (Section 5)** — system states by permission / data / state, interaction
matrix (tap, long-press, swipe, drag), object behavior on related changes. At least one row per Section-4
component.

**3. Functional Logic & Workflow Decomposition (Section 6)** — per function: Main Flow, Alternative Flows,
Exception & Error Flows (client response only), Business Rules & Validations, UI/UX feedback:

```
[Function Name — e.g., Display Home]

MAIN FLOW (Happy Path):
Step 1 → Step 2 → ... → Expected Result

ALTERNATIVE FLOWS:
[Alt-1] Different condition → Alternative flow → Result

EXCEPTION & ERROR FLOWS:
[Err-1] Error condition → Displayed message → System behavior

BUSINESS RULES:
BR-xxx: [Rule]

UI/UX FEEDBACK:
- Loading state: [description]
- Toast / Snackbar: [content, duration]
- Error message: [content, position]
```

For each input or dynamic display field, a table is mandatory; every empty cell the UC does not answer is a
gap:

| Field | Data Type | Required? | Min | Max | Format |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Full Name | Text | — | — | 1 line | Truncate if too long |
| Post Date | Date | — | — | — | DD/MM/YYYY |

**4. Functional Integration Analysis (Section 7)** — impact of one function's state / data change on others;
data consistency across related components.

**5. Acceptance Criteria (Section 8)** — Given / When / Then per group (UI, Function, Integration). Score the
source's AC, but always provide the synthesized AC in the output.

**Product Decision & diagram alignment (Section 10.3)** — summarize Steps 6–7 for this UC.

**Knowledge areas** — mark each ✅ Clear (full), ⚠️ Partial (half), ❌ Missing (0):

| # | Knowledge Area | Max Pts | Critical? | What to look for |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Feature Identity (title, ID, context) | 5 | Yes | Is it clear what this feature is and where it fits in the app? |
| 2 | Objective & Scope | 5 | Yes | Why does it exist? What is in / out of scope (consistent with the Product Decisions)? |
| 3 | Actors & User Roles | 10 | Yes | Who triggers it? Which roles / permissions? |
| 4 | Preconditions & Postconditions | 10 | Yes | What must be true before? What is the state after success? |
| 5 | UI Object Inventory & Mapping | 15 | Yes | All components from the design mapped to the UC UI Specification |
| 6 | Object Attributes & Behavior Definition | 20 | Yes | State and response of each UI object under specific conditions |
| 7 | Functional Logic & Workflow Decomposition | 20 | Yes | Business process of each function on the screen |
| 8 | Functional Integration Analysis | 10 | Yes | Linkages and influences between functions |
| 9 | Acceptance Criteria | 10 | Yes | Measurable pass / fail statements |
| 10 | Non-functional Requirements | 5 | No | Performance, security, compatibility, accessibility — N/A when none is applicable or confirmed |

**Total 110 → normalized:** `Final Score = round((Raw Score / applicable max) × 100, 1)` (applicable max =
110 unless area #10 is N/A, then 105). Critical areas #1–#9: any score of 0 → NOT READY. Area #10 scoring 0
reduces the total only. An open P0 from Steps 6–7 also makes the UC NOT READY.

### Step 10 — Cross-artefact conflicts and blocked artefacts

**Conflicts** (automatic warnings): UC flow vs design; UC vs Product Decision; UC vs diagram; fields in the API
doc absent from requirements (only where it affects client display / behavior); design elements with no
rule; inconsistent labels or field names across documents.

**Blocked artefact protocol:** if a referenced artefact (Figma frame, screenshot, diagram, decision file, API
doc) is unavailable:

- Mark the dependent dimension / knowledge area `[BLOCKED: {artefact} not accessible]` and score it 0.
- Surface each blocked item as a 🔴 Blocker (Critical, P0 when it hides core behavior).
- Do NOT infer content from the unavailable artefact.

## Phase 3 — Report

### Step 11 — Register gaps and questions

For each issue record: Gap ID (`AUD-{NNN}`, so it never collides with competitor `GAP-*`), category, exact
source reference, observed issue and evidence, severity, priority, recommendation, owner, status (`Open`).

| Severity | Use for | Question priority | Backlog priority |
| :--- | :--- | :--- | :--- |
| Critical | Blocks Dev/QA: missing core flow, scope conflict, REMOVE specified as active, TBD finalized, missing required User Flow / Activity coverage, blocked core artefact | P0 | High |
| Major | Partial / ambiguous behavior, cross-artefact conflict, missing applicable state or rule | P1 | Medium |
| Minor | Wording, formatting, traceability polish, non-blocking suggestion | P2 | Low |

- Do not overstate severity. Separate missing **evidence** (verification limit) from a missing
  **requirement**.
- Every gap that needs an answer gets a question row in the `📋 Unified Gap & Question Report`, with columns
  exactly `| ID | Priority | Ref | Question | Why It Matters | Status |`. Write Priority as `High (P0)`,
  `Medium (P1)` or `Low (P2)`; put the source excerpt (or `N/A (Missing)`) and the `AUD-*` ID in `Ref`.
  No duplicates.

### Step 12 — Score and decide readiness

**Full SRS / module scoring** — mark each dimension ✅ Clear (full), ⚠️ Partial (half), ❌ Missing (0), or
N/A (removed from the denominator):

| # | Dimension | Max Pts | Critical? | N/A only when |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Feature Coverage | 15 | Yes | Never |
| 2 | Use Case Completeness | 15 | Yes | Never |
| 3 | UI Specification & Figma Alignment | 15 | Yes | No UC in scope has UI |
| 4 | Business Logic & Testability | 20 | Yes | Never |
| 5 | Product Decision Alignment | 10 | Yes | The scope needed no decision pass (no checklist / reference conflict, no TBD) |
| 6 | Diagram Coverage & Consistency | 10 | Yes | Never (User Flow + Activity are required) |
| 7 | Traceability & Cross-UC Consistency | 10 | No | Never |
| 8 | Optional requirements (Permissions / Ads / IAP / NFR / Dependencies) | 5 | No | None applicable or confirmed in target scope |

`Final Score = round((Earned / Applicable max) × 100, 1)`. A source that is `Not Provided` but needed is not
N/A — score the dimension on what can be verified and record the limit.

**Verdict** (SKILL.md → Readiness Policy): ≥ 90 Ready · 70–89 Conditionally Ready · < 70 Not Ready. Any open
P0 / Critical gap, or any Critical dimension at 0, → **Not Ready** regardless of score. State "Ready for
Dev/QA Handoff" only with no open P0.

### Step 13 — Produce the versioned report

- Full SRS / module: fill `../template/mobile_srs_readiness_review_template.md` in full; keep the
  source-referenced coverage matrix and owners.
- Single UC: fill `../template/UC_readiness_review_template_v3.md`, then append the **Audit Summary** (the
  knowledge-area score table), **📋 Unified Gap & Question Report**, **🟢 What's Good**, **🧪 Testability
  Outlook** and **📌 Summary & Recommendation** sections as defined in `first-audit-workflow.md` Phase 3.
  Testability focus areas for mobile also cover: global-rule compliance, real-time / push behavior,
  partial API failure, edge cases (long text, special characters, broken layout).
- Write in Vietnamese with English terminology; quote labels and messages in their original language with an
  English translation in parentheses. Run the `ba-markdown-formatting` self-validation checklist.
- Save with the name and folder from SKILL.md → Output Contract. Never overwrite; never edit the SRS.

## Phase 4 — Sync Question Backlog (auto-chain, MANDATORY)

After the audited file is saved, automatically invoke `BA-audit-QnA` — without waiting for the user — to move
every row of the `📋 Unified Gap & Question Report` into `{ID}_question-backlog.md` in the same folder (`ID` =
`SRS`, `SRS-{MOD}` or the `UC-ID`).

- **Trigger:** the audited file is saved AND the table has ≥ 1 row.
- **Skip:** only when the table is empty; tell the user no backlog is needed.
- An existing backlog is never overwritten; `BA-audit-QnA` reconciles it.

Then delete temp / intermediate files and report to the user: verdict, score, blocker count, open questions
by priority, report path and backlog path. Do not start test design.

## Common Gap Patterns

| Gap Pattern | Recognizable Sign | Example Question |
| :--- | :--- | :--- |
| No preconditions stated | UC starts directly at step 1 | "What must be true before [function] is triggered?" |
| Vague actor | Only "user", no role distinction | "Which role is 'user' here? Does behavior differ by role?" |
| Missing validation rules | Input fields with no constraints | "What does field [X] accept? Min / Max? Special characters? Exact error message?" |
| Missing exact error messages | Only "display error" | "What is the exact message for [situation X]? Does it follow the global message catalog?" |
| AC uses "should" / "can" | Criteria not measurable | "Can criterion [X] be a pass / fail statement?" |
| Design element not in UC | Found in the UI cross-check | "Which UC rule governs element [X] on screen [NN]?" |
| UC ignores a global rule | No reference to the SRS global BR | "Does this UC apply [BR-xxx]? Same behavior as the SRS?" |
| UI Spec after the flows or missing | Flows reference screens not specified | "Where is the UI Specification for screen [X]?" |
| REMOVE item still specified | FR / UC describes a `REMOVE` decision | "PD-[NNN] removes [X]; should FR-[…] be deleted or moved out of scope?" |
| TBD written as final | Concrete value with no decision | "PD-[NNN] is TBD; who confirms [value], and until when is it an open question?" |
| Reference behavior copied | Limits / copy from APK evidence with no decision | "Is [limit] from the reference app confirmed for the target, or TBD?" |
| User Flow missing a journey | Journey in UCs not in any `UF-*` | "Which User Flow covers [journey]?" |
| Activity missing a branch | Validation / failure path absent from `ACT-*` | "Should [failure branch] appear in ACT-[…]?" |
| Partial API failure not handled | Only a full-screen error handler | "When only [call X] fails, does the UI handle it independently or block?" *(client behavior only)* |
| Real-time has no fallback | Real-time / push with no disconnection rule | "When the connection drops, is the user told? Is there a fallback?" |
| i18n persistence missing | Language switch with no storage rule | "Where is the language stored? Kept after logout / reinstall?" |
| Double-tap / race condition | Navigation with no debounce rule | "If [button X] is tapped twice quickly, does the app navigate twice?" |

**Not gaps:** a simple UC without a Sequence Diagram; no Ads / IAP section when monetization is not in target
scope; a target behavior that deliberately differs from the reference app under a confirmed decision; one
shared diagram covering several UCs with explicit references.
