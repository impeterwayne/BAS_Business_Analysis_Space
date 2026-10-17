---
name: ba-templates
description: >-
  Catalog of BA document templates (SRS, legacy FSD, use case, product decision summary, user stories,
  feature brief, test cases, UC / SRS readiness review, question backlog, competitor app profile, screen inventory, flow analysis, feature comparison and
  gap analysis, Figma design analysis, competitor feature checklist) and the rules for filling them. Use whenever a BA deliverable must be written from a
  template, when the user runs /ba-template, or when another BA skill needs the canonical template path.
---

# BA Templates

Single source of truth for every BA deliverable template in this workspace. Other skills (`specs`,
`product-decision`, `test-cases`, `competitor-app-analysis`, `BA-audit-SRS`, `BA-audit-QnA`) point here instead of keeping
their own copies, so a template fixed once is fixed everywhere.

## Template Catalog

Paths are relative to `.agents/skills/`.

| Key | Template | Path | Output location | Written by |
| :--- | :--- | :--- | :--- | :--- |
| `srs` | Software Requirements Specification (default spec) | `ba-templates/templates/srs.md` | `docs/project-srs.md` | `specs` |
| `fsd` | Functional Specification Document (legacy, only where a project already uses it) | `ba-templates/templates/fsd.md` | `docs/project-fsd.md` | `specs` |
| `use-case` | Use case | `ba-templates/templates/use-case.md` | `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` | `specs` |
| `user-stories` | User stories + Given/When/Then AC | `ba-templates/templates/user-stories.md` | `docs/BA/stories/` | this skill |
| `feature-brief` | Feature brief (problem, approaches, design) | `ba-templates/templates/feature-brief.md` | `docs/BA/briefs/` | `brainstorm-features`, this skill |
| `product-decision` | Product Decision Summary (KEEP / MODIFY / REMOVE / NEW / TBD, SRS readiness) | `ba-templates/templates/product-decision-summary.md` | `docs/BA/decisions/` | `product-decision` |
| `test-case` | Test cases per use case | `ba-templates/templates/test-case.md` | `docs/testcases/{module}/tc-{module}-{nnn}-{slug}.md` | `test-cases` |
| `test-config` | Test environment & accounts | `test-cases/references/templates/test-config-template.md` | `docs/testcases/test-config.md` | `test-cases` |
| `test-summary` | Test coverage summary | `test-cases/references/templates/test-summary-template.md` | `docs/testcases/test-summary.md` | `test-cases` |
| `readiness-review` | UC readiness review (scored audit) | `BA-audit-SRS/template/UC_readiness_review_template_v3.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-SRS` |
| `srs-readiness-review` | Mobile SRS readiness review (full SRS / module audit) | `BA-audit-SRS/template/mobile_srs_readiness_review_template.md` | `docs/BA/SRS-report/srs/` | `BA-audit-SRS` |
| `question-backlog` | Open question backlog | `BA-audit-QnA/template/question-backlog_template.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-QnA` |
| `competitor-profile` | Competitor app profile | `ba-templates/templates/competitor-app-profile.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-screens` | Competitor screen inventory | `ba-templates/templates/competitor-screen-inventory.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-flow` | Competitor flow analysis | `ba-templates/templates/competitor-flow-analysis.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `comparison-gap` | Feature comparison matrix + gap analysis | `ba-templates/templates/feature-comparison-gap.md` | `docs/BA/competitor/` | `competitor-app-analysis` |
| `feature-checklist` | Competitor Feature Checklist | `ba-templates/templates/feature-checklist.md` | `docs/BA/competitor/{app-slug}/` | `apk-feature-extractor`, `competitor-app-analysis` |
| `figma-analysis` | Figma design analysis (screens, flow, fields, states, copy, candidates) | `ba-templates/templates/figma-design-analysis.md` | `docs/BA/figma/{feature}/` | `figma-ba-analysis` |

The `readiness-review`, `srs-readiness-review` and `question-backlog` templates stay inside their audit skills because those
workflows score and parse them section by section. Do not copy them elsewhere.

## Workflow: Write a Document From a Template

1. **Resolve the template.** Map the user's request to a catalog key. If the request fits no key, or fits
   more than one, list the candidate keys and ask. Do not invent a new structure silently. For keys owned by a specialized skill, hand over to that skill:
   - `srs`, `fsd`, `use-case` → `specs` (or `use-case-writer`)
   - `user-stories` → `user-story-ac-writer` (or this skill)
   - `product-decision` → `product-decision`
   - `test-case`, `test-config`, `test-summary` → `test-cases` (or `qc-tc-design` / `qc-tc-summary`)
   - `readiness-review`, `srs-readiness-review` → `BA-audit-SRS` (or `qc-uc-review`); `question-backlog` → `BA-audit-QnA`
   - `competitor-*`, `comparison-gap` → `competitor-app-analysis`
   - `feature-checklist` → `apk-feature-extractor`
   - `figma-analysis` → `figma-ba-analysis`
2. **Collect inputs before writing.** Read every source the document needs: requirement files, SRS (or
   legacy FSD), Product Decision Summaries, use cases, competitor evidence under `docs/BA/competitor/`, and `.agents/config/ba-project-config.md`
   for project name, project type and language. If a mandatory input is missing, stop and ask.
3. **Copy the template structure, then fill it.**
   - Keep every heading, table and column in the template. Do not add columns.
   - Fill the header table first: title, created date (today, `YYYY-MM-DD`), author/agent, version.
   - Remove a section only when it truly does not apply, and say why in one line in its place.
   - `<!-- SECTION: ... -->` blocks in `srs.md`, `use-case.md` and `fsd.md` are filtered by project type; keep only matching blocks
     and delete the comment markers.
4. **Language.** Write content in Vietnamese per `ba-global-rules`, keeping product, BA and technical terms in
   English (`ba-global-rules` → Terminology: flow, use case, acceptance criteria, feature flag, …). Headings are
   already bilingual. Keep
   on-screen labels, error messages and source quotes in their original language, and put the English
   translation in parentheses.
5. **Evidence.** Every requirement, rule or competitor claim cites its source: a document section, a
   screenshot path, a UI-tree file, or a `path:line` in decoded code. Label code-only facts
   `[Code]` and inferences `[Inferred]`. Never fabricate data.
6. **Name and version the file** per `ba-naming-convention`. Living specs (`srs`, `fsd`, `use-case`,
   `test-case`) are updated in place with a Change Log row and a version bump. Every other output is an
   immutable `v[N]` file: if `v1` exists, write `v2`.
7. **Validate the Markdown** against `ba-markdown-formatting` before saving (column counts, one row per
   line, no `<br>` in tables, no `---` next to a table).
8. **Report** the output path and any open questions to the user.

## Choosing Between Similar Templates

- Early idea, still weighing options → `feature-brief`.
- Agreed scope, needs backlog items → `user-stories`.
- Reference app / Figma / checklist with open conflicts → `product-decision` first.
- Agreed scope, needs full system behaviour → `srs` + `use-case` via the `specs` skill (`fsd` only for a
  project that already keeps one).
- Handing to Dev/QA → `srs-readiness-review` for the SRS or `readiness-review` for one use case, then
  `test-case` if QA wants it.
- Turning a Figma design into requirements input → `figma-analysis`, then `srs` + `use-case` or `user-stories`
  from it.
- Learning from another app → `competitor-*`, then `comparison-gap` to turn findings into candidate
  requirements (`FR-CAND-*`), which a BA promotes into the SRS after PO confirmation
  (recorded in a `product-decision` summary).
