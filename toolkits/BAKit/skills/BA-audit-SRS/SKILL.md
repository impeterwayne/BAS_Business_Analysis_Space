---
name: BA-audit-SRS
description: Audits requirements for readiness without rewriting them. Mobile (default) audits a complete SRS (`docs/project-srs.md`) or selected use cases for feature coverage, UI specification, business logic, Product Decision alignment, diagram consistency (User Flow + Activity required, Sequence conditional), testability and Dev/QA handoff readiness; also scores a single use case for QA test design, and keeps the legacy Web/Report per-UC review. Produces a verdict (Ready / Conditionally Ready / Not Ready), a completeness score (0–100), a severity-ranked gap report and open questions, then auto-chains `BA-audit-QnA` to open the question backlog. Use whenever the user says `review uc`, `review requirement`, `audit srs`, `review srs`, or asks whether an SRS or use case is ready for Dev/QA handoff or test design.
---
# Requirements Readiness Review Skill

## Purpose

You operate by **YAGNI**, **KISS** and **DRY**: audit what is in the target scope; find missing, ambiguous,
conflicting and untestable requirements — not hypothetical features. Requirements should be minimal enough to
build what is needed, clear enough to test, and free of duplication.

**Multi-language support:** source documents may be Vietnamese, English or any language. Read them accurately;
preserve original text, terminology, IDs and formatting. Do NOT translate or paraphrase quoted content.

Analyse **one or more requirement artefacts together as a set** (SRS, use cases, Figma analysis, screenshots,
diagrams, Product Decisions, checklists, API docs) and decide whether Dev and QA have enough information to
start.

**Mobile default outcome:** an SRS Readiness Review (Ready / Conditionally Ready / Not Ready) with a coverage
matrix, severity-ranked gaps and a question backlog. The per-UC first-audit / re-audit mechanism and the legacy
Web/Report path are kept. This skill never writes or edits the SRS, implements code or generates test cases.

## Scope and Routing

1. **Platform.** Mobile App or Web/Report — from the user's request, `/ba-review` argument, or
   `.agents/config/ba-project-config.md` → *Mobile vs Web audit rules*. If still unknown, ask in chat.
2. **Audit scope.**

| Mode | When | Workflow | Template |
| :--- | :--- | :--- | :--- |
| Mobile — Full SRS | Target is `srs`, `docs/project-srs.md` (or legacy `docs/project-fsd.md`), a module, or a set of UCs | `references/mobile_first-audit-workflow.md` / `references/mobile_re-audit-workflow.md` | `template/mobile_srs_readiness_review_template.md` |
| Mobile — Single UC | Target is one use case file or one UC folder | Same mobile workflows, Single-UC depth (Phase 2 Step 9) | `template/UC_readiness_review_template_v3.md` |
| Web/Report — UC (legacy) | Web or report project, one UC folder in `docs/BA/SRS-report/` | `references/first-audit-workflow.md` / `references/re-audit-workflow.md` | `template/UC_readiness_review_template_v3.md` |

3. **First audit vs re-audit.** Look in the output folder (see Output Contract) for an existing
   `*_audited_*_v{N}.md` (legacy name `audited-v[N].md` also counts).
   - Not found → **first audit**.
   - Found → read the matching `*_question-backlog.md`.
     - All open questions answered → **re-audit**.
     - Some still open → tell the user in chat how many are open (P0 first) and ask whether to answer them now
       or re-audit with them kept open. Re-audit may proceed on the decisions and changes that are available;
       unanswered items stay open and are never invented or assumed resolved.
4. Never overwrite an existing audit report or question backlog; reconcile and version them.

**Mandatory auto-chain to `BA-audit-QnA` (first audit only):** after the audited file is saved at the end of
the report phase, the agent MUST automatically invoke the `BA-audit-QnA` skill to create the
`*_question-backlog.md` file. Do NOT wait for the user to ask. Skip only when the "Unified Gap & Question
Report" table is empty. See `Phase 4` in `first-audit-workflow.md` / `mobile_first-audit-workflow.md`. The
re-audit workflows do NOT auto-chain — they maintain the backlog inline (mark resolved, append new via
`BA-audit-QnA`).

After completing the task (including the auto-chain), delete all temp and intermediate files created during
the task.

## Input Contract

Read `references/input-files-format.md` for the full source map. Use every relevant source that exists; the
audit must work with part of the set.

| Source | BAKit location | Role |
| :--- | :--- | :--- |
| Living SRS | `docs/project-srs.md` (legacy `docs/project-fsd.md` still accepted) | FR list, global business rules, module map |
| Use cases | `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` | UI Specification, flows, BRs, Related Diagrams |
| Diagrams | `docs/diagrams/{module}/{diagram-id}.md` (`UF-*`, `ACT-*`, `SEQ-*`) | User Flow, Activity, conditional Sequence |
| Product Decision Summary | `docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md` | `PD-{NNN}` KEEP / MODIFY / REMOVE / NEW / TBD; READY / NOT READY FOR SRS verdict |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md` | Candidate target scope, PO notes |
| APK evidence | `docs/BA/competitor/{app-slug}/` (`*_profile_*`, `*_screens_*`, `*_flow-*`, `screens/`) | Reference-app behavior (observed / `[Code]` / `[Inferred]`) |
| Figma analysis | `docs/BA/figma/{feature}/` (`*_figma_*.md`, `screens/`) | Target screens, components, visible states |
| Comparison / gap report | `docs/BA/competitor/*_comparison_*.md` | `CF-*`, `GAP-*`, `FR-CAND-*` |
| Briefs / research / PO notes | `docs/BA/briefs/`, `docs/BA/research/`, chat | Agreed approach, supplementary evidence |
| Audit history | `docs/BA/SRS-report/…` (`*_audited_*`, `*_question-backlog.md`) | Previous findings and answers |
| Legacy Web/Report | `docs/BA/SRS-report/[UC-folder-name]/`, common files in `docs/BA/SRS-report/CMR/` | Per-UC input and common rules |

- Always read the highest version of every versioned file.
- Resolve shared / common rules (SRS global BRs, legacy CMR) before auditing the UC behavior that depends on
  them; inline the exact rule or message text when the audit cites it.
- Record each expected source as `Provided`, `Not Provided`, `Not Applicable` or `Unavailable`. `Not Provided`
  is not `Not Applicable`. State verification limits instead of fabricating evidence.

## Source Interpretation

- **Feature Checklist** identifies candidate target scope; the Product Decisions decide inclusion/exclusion.
- **Figma** is target UI evidence, not proof of invisible business rules.
- **APK evidence** describes the reference app, not the mandatory target. Keep observed / `[Code]` /
  `[Inferred]` apart; an `[Inferred]` claim is never a confirmed requirement.
- **Confirmed Product Decisions / PO notes** define target rules: evaluate KEEP, MODIFY, REMOVE, NEW and TBD.
- A difference from the reference app is **not** a defect when the target difference is confirmed.
- A REMOVE item must not appear as an active target requirement; a TBD item must not be silently finalized.

## Audit Dimensions (mobile)

1. **Feature coverage** — every confirmed in-scope item maps to an FR / UC; no excluded feature is required.
2. **UC completeness** — trigger, actor, pre/postconditions, Main, Alternative and Exception/Edge flows, system
   response, navigation, persistence where relevant.
3. **UI alignment** — UI Specification inside the UC, before the flows; supplied Figma frame / screenshot
   mapped; relevant components and actionable states specified.
4. **Business logic & testability** — conditions, defaults, limits, validations, success/failure/cancel paths
   when applicable; cross-UC and common rules consistent; every important behavior verifiable.
5. **Product Decision alignment** — confirmed KEEP/MODIFY/REMOVE/NEW reflected; TBD not promoted.
6. **Diagram coverage & consistency** — see Diagram Rules.
7. **Traceability** — FR / UC / BR / PD / diagram IDs and links consistent (Feature → FR → UC → screen / rule /
   diagram).
8. **Optional sections** — Permissions, Ads/IAP, NFR, dependencies audited **only when applicable or confirmed
   in target scope**. Absence of Ads/IAP (or any non-applicable optional section) is not a defect.

### Core competencies (all modes)

- **Zero-trust analysis:** treat inputs as incomplete; look for contradictions, missing edge cases and risks.
- **Multi-layer validation:** Business layer (domain logic, compliance), System layer (integration, data
  consistency — for mobile, only as documented client-facing expectations), User layer (resilience to chaotic
  user behavior).
- **Requirement taxonomy:** Business, Functional, Non-functional, User Stories (with AC), Transition
  requirements, Constraints. Flag anything that fits no type as "Unclassified — requires clarification".
- **5 pillars:** Completeness, Clarity (no "should / may / fast / easy"), Consistency, Testability,
  Traceability (no orphan requirement).
- **Domain knowledge:** Agile / Waterfall / hybrid SDLC; BPMN, use case, activity and sequence diagrams;
  IEEE 830, BABOK v3, ISO/IEC 25010; integration points and data contracts; regulatory flags (GDPR, PCI-DSS, …).

## Diagram Rules

- **User Flow — required coverage:** entry points, screen / navigation transitions, key user paths.
- **Activity Diagram — required coverage:** processing steps, branch conditions, validations, success /
  failure / end states. One Activity Diagram may cover several related UCs.
- **Sequence Diagram — conditional:** required only where complex or asynchronous interaction among app,
  backend, API, SDK or third parties must be sequenced to understand the requirement. **Never fail a simple UC
  for lacking a Sequence Diagram.** Do not invent participants, endpoints or contracts.
- Traceability comes from `Sơ đồ liên quan (Related Diagrams)` in each UC or the coverage matrix; a shared
  diagram is valid when its coverage is explicit. Do not require one diagram per UC.
- A User Flow and an Activity Diagram are not interchangeable even though both are Mermaid `flowchart`s;
  judge purpose, not syntax. Flowcharts must be vertical (`ba-markdown-formatting` §5).

## Readiness Policy

- **Ready** — score ≥ 90, no blocking issue; scope, flow, UI and core diagram coverage verified.
- **Conditionally Ready** — score 70–89, or remaining issues are non-blocking (P1/P2), scoped, owned and
  documented.
- **Not Ready** — score < 70, or any unresolved P0 / Critical gap, material scope conflict, untestable core
  behavior, or missing required User Flow / Activity coverage. Any Critical knowledge area scoring 0 (single-UC
  and legacy scoring) is also Not Ready.
- A high score never overrides a blocker. Genuinely N/A dimensions are removed from the denominator.
- **"Ready for Dev/QA Handoff"** may be stated only when there is no open P0. For Conditionally Ready, name the
  areas that can be handed off and the conditions for the rest.

## Report Contract

- Mobile Full SRS: `template/mobile_srs_readiness_review_template.md` — metadata and scope, evidence
  availability and limits, verdict and score, feature / UC / UI / diagram coverage matrix, scored dimensions
  (N/A excluded), severity-ranked Gap Report (`AUD-{NNN}`) with source pointers, owner, recommendation and
  status, P0/P1/P2 questions in the `📋 Unified Gap & Question Report`, regression risks and handoff conditions.
- Mobile Single UC and Web/Report: `template/UC_readiness_review_template_v3.md` plus the Audit Summary,
  Unified Gap & Question Report, What's Good, Testability Outlook and Summary sections of the workflow.
- Deliverable language: Vietnamese with English terminology (`ba-global-rules`); on-screen labels and messages
  quoted in their original language. Markdown must pass `ba-markdown-formatting`.

## Output Contract

Names follow `ba-naming-convention` (type `audited`; versions are immutable — if `v{N}` exists, write
`v{N+1}`; never overwrite). Never write into `docs/usecases/`, `docs/diagrams/` or the SRS: those are living
specs owned by `specs`.

| Mode | Folder | Audited file | Backlog (by `BA-audit-QnA`) |
| :--- | :--- | :--- | :--- |
| Mobile — Full SRS | `docs/BA/SRS-report/srs/` | `SRS_{project-slug}_audited_{YYYYMMDD}_v{N}.md` | `SRS_question-backlog.md` |
| Mobile — module / UC group | `docs/BA/SRS-report/srs/` | `SRS-{MOD}_{module-name}_audited_{YYYYMMDD}_v{N}.md` | `SRS-{MOD}_question-backlog.md` |
| Mobile — Single UC from `docs/usecases/` | `docs/BA/SRS-report/{UC-ID}/` | `{UC-ID}_{feature-name}_audited_{YYYYMMDD}_v{N}.md` | `{UC-ID}_question-backlog.md` |
| UC folder already in `docs/BA/SRS-report/` (Web or Mobile) | that same folder | `{UC-ID}_{feature-name}_audited_{YYYYMMDD}_v{N}.md` | `{UC-ID}_question-backlog.md` |

- Example (legacy): input `docs/BA/SRS-report/UC69_TraCuuVanBanPhapLuat/UC69_...md` → outputs in
  `docs/BA/SRS-report/UC69_TraCuuVanBanPhapLuat/`.
- When invoking `BA-audit-QnA`, pass the folder and the ID used in the file name (`SRS`, `SRS-{MOD}` or the
  `UC-ID`).

## Boundaries

- Audit only. NEVER edit the SRS, use cases, diagrams, Product Decisions, Figma analyses or checklists.
- Every finding cites an exact file / section / UC / BR / PD / diagram reference; if a source is missing, say
  verification is blocked.
- Never invent reference behavior, target rules, API contracts, effort estimates or monetization rules. When
  uncertain, say so and ask in chat.
- Mobile reviews focus on client-facing behavior and documented integration expectations; do not assess
  server internals unless the user puts them in scope.
- Do NOT opine on implementation approach; leave architecture decisions to the development team.
- Do NOT generate test cases or scenarios, even on a Ready verdict. Test design starts only when the user asks
  (`/ba-testcases`).
- After a fix, run the re-audit and update gap statuses without deleting unresolved issues. Send unresolved
  corrections to `ba-spec-writer` (SRS / UC content) or `ba-brainstormer` (`product-decision`, for
  unresolved product choices) — only when the user asks.
