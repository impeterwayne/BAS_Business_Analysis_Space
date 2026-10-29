---
name: ba-templates
description: >-
  Catalog of BA document templates (SRS, use case, legacy FSD, product decision summary, user stories,
  feature brief, UC / SRS readiness review, question backlog, Figma design analysis, feature checklist) and the rules for filling them. Use whenever a BA deliverable must be written from a
  template, when the user runs /ba-template, or when another BA skill needs the canonical template path.
---

# BA Templates

Single source of truth for every BA deliverable template in this workspace. Other skills (`specs`,
`product-decision`, `apk-feature-extractor`, `figma-ba-analysis`, `BA-audit-SRS`, `BA-audit-QnA`) point here instead of keeping
their own copies, so a template fixed once is fixed everywhere.

## Template Catalog

Paths are relative to `.agents/skills/`.

| Key | Template | Path | Output location | Written by |
| :--- | :--- | :--- | :--- | :--- |
| `srs` | Software Requirements Specification — one file with every Use Case | `ba-templates/templates/srs.md` | `docs/project-srs.md` | `specs` |
| `use-case` | Use Case block (written inside the SRS) | `ba-templates/templates/use-case.md` | section of `docs/project-srs.md` | `specs`, `use-case-writer` |
| `fsd` | Functional Specification Document (legacy, only where a project already uses it) | `ba-templates/templates/fsd.md` | `docs/project-fsd.md` | `specs` |
| `user-stories` | User stories + Given/When/Then AC | `ba-templates/templates/user-stories.md` | `docs/BA/stories/` | this skill |
| `feature-brief` | Feature brief (problem, approaches, design) | `ba-templates/templates/feature-brief.md` | `docs/BA/briefs/` | `brainstorm-features`, this skill |
| `product-decision` | Product Decision Summary (PO answers, KEEP / MODIFY / REMOVE / NEW / TBD) | `ba-templates/templates/product-decision-summary.md` | `docs/BA/decisions/` | `product-decision` |
| `feature-checklist` | Feature Checklist (Markdown, exported to Excel) | `ba-templates/templates/feature-checklist.md` | `docs/BA/competitor/{app-slug}/` | `apk-feature-extractor`, `research-feature-checklist` |
| `figma-analysis` | Figma design analysis (screens, element images, flow, fields, states, copy) | `ba-templates/templates/figma-design-analysis.md` | `docs/BA/figma/{feature}/` | `figma-ba-analysis` |
| `readiness-review` | UC readiness review (full audit only) | `BA-audit-SRS/template/UC_readiness_review_template_v3.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-SRS` |
| `srs-readiness-review` | Mobile SRS readiness review (full audit only) | `BA-audit-SRS/template/mobile_srs_readiness_review_template.md` | `docs/BA/SRS-report/srs/` | `BA-audit-SRS` |
| `question-backlog` | Question backlog (full audit only) | `BA-audit-QnA/template/question-backlog_template.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-QnA` |
| `competitor-profile` | Competitor app profile | `ba-templates/templates/competitor-app-profile.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-screens` | Competitor screen inventory | `ba-templates/templates/competitor-screen-inventory.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-flow` | Competitor flow analysis | `ba-templates/templates/competitor-flow-analysis.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-features` | Competitor feature extraction | `ba-templates/templates/competitor-feature-extraction.md` | `docs/BA/competitor/{app-slug}/` | `apk-feature-extractor`, `competitor-app-analysis` |
| `comparison-gap` | Feature comparison matrix + gap analysis | `ba-templates/templates/feature-comparison-gap.md` | `docs/BA/competitor/` | `competitor-app-analysis` |
| `test-case` | Test cases per use case | `ba-templates/templates/test-case.md` | `docs/testcases/{module}/tc-{module}-{nnn}-{slug}.md` | `test-cases` |
| `test-config` | Test environment & accounts | `test-cases/references/templates/test-config-template.md` | `docs/testcases/test-config.md` | `test-cases` |
| `test-summary` | Test coverage summary | `test-cases/references/templates/test-summary-template.md` | `docs/testcases/test-summary.md` | `test-cases` |

The `readiness-review`, `srs-readiness-review` and `question-backlog` templates stay inside their audit skills because those
workflows score and parse them section by section. Do not copy them elsewhere.

## Workflow: Write a Document From a Template

1. **Resolve the template.** Map the user's request to a catalog key. If the request fits no key, or fits
   more than one, list the candidate keys and ask. Do not invent a new structure silently.
2. **Collect inputs before writing.** Read every source the document needs: requirement files, SRS (or
   legacy FSD), Product Decision Summaries, use cases, APK decode output and the Feature Checklist under `docs/BA/competitor/`, Figma analyses under `docs/BA/figma/`, and
   `.agents/config/ba-project-config.md` for project name, project type and language. If a mandatory input is missing, stop and ask the user first.
3. **Copy the template structure, then fill it.**
   - Keep every heading, table and column in the template. Do not add columns.
   - Fill the header table first: title, created date (today, `YYYY-MM-DD`), author/agent, version.
   - Remove a section only when it truly does not apply (for example, omit `Alternative Flow` or `Exceptional Flow` in a Use Case when not present on the design — never write placeholder text like `"Không có nên bỏ qua"`).
   - `<!-- SECTION: ... -->` blocks in `srs.md`, `use-case.md` and `fsd.md` are filtered by project type; keep only matching blocks
     and delete the comment markers.
   - For SRS (`srs.md`) and Use Cases (`use-case.md`): follow the `specs` skill §5–§6 exactly — one file
     `docs/project-srs.md`; sections 1 Tổng quan (1 sentence), 2 Sơ đồ tính năng (mindmap), 3 Global Business
     Rules (one rule per row); each Use Case with Trigger / Pre / Post, `.1` screen grid + element tables with
     element images, `.2` User Flow, `.3` Basic Flow, `.4`/`.5` Alternative / Exceptional only when they exist,
     `.6` Business Rules (one rule per row), `.7` Activity Diagram only for a large feature; Note/References as
     clickable links on one line. No Phạm vi, no Open Questions, no change log.
4. **Language.** Write content in one consistent language per `ba-global-rules` (Vietnamese by default, or English when specified), keeping product, BA and technical terms (`tab`, `click`, `button`, `popup`, `bottom sheet`, `banner`, `scroll`, `swipe`, `user`, `app`, `flow`, `use case`, …) in English without bilingual headings or redundant parenthetical glosses.
5. **Evidence.** Every requirement, rule or competitor claim cites its source: a document section, a
   screenshot path, a UI-tree file, or a `path:line` in decoded code. Label code-only facts
   `[Code]` and inferences `[Inferred]`. Never fabricate data.
6. **Name and version the file** per `ba-naming-convention`. The SRS (`docs/project-srs.md`, Use Cases inside) and
   legacy FSD are overwritten in place with the header version bumped (no Change Log). Every other output is an
   immutable `v[N]` file: if `v1` exists, write `v2`.
7. **Validate the Markdown** against `ba-markdown-formatting` before saving (column counts, one row per line,
   one rule per Business Rules row, Note/References as links on one line, no `---` next to a table). Word is
   produced only by `srs-export` when the user asks.
8. **Report** the output path and any open questions to the user.

## Choosing Between Similar Templates

- Early idea, still weighing options → `feature-brief`.
- Agreed scope, needs backlog items → `user-stories`.
- Reference app / Figma / checklist with open conflicts → `product-decision` first.
- Agreed scope, needs full system behaviour → `srs` + `use-case` via the `specs` skill (`fsd` only for a
  project that already keeps one).
- Handing to Dev/QA → quick review in chat (`/ba-review`); `srs-readiness-review` / `readiness-review` only for a
  full audit.
- Turning a Figma design into requirements input → `figma-analysis`, then `srs` + `use-case` or `user-stories`
  from it.
- Learning from another app → `feature-checklist` from the APK decode output (`apk-feature-extractor`); its
  reference behaviour reaches the SRS only through the PO's answers (`product-decision`).
