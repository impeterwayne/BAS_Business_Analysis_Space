---
name: ba-templates
description: >-
  Catalog of BA document templates (FSD, use case, user stories, feature brief, test cases, UC readiness
  review, question backlog, competitor app profile, screen inventory, flow analysis, feature comparison and
  gap analysis) and the rules for filling them. Use whenever a BA deliverable must be written from a
  template, when the user runs /ba-template, or when another BA skill needs the canonical template path.
---

# BA Templates

Single source of truth for every BA deliverable template in this workspace. Other skills (`specs`,
`test-cases`, `competitor-app-analysis`, `BA-audit-SRS`, `BA-audit-QnA`) point here instead of keeping
their own copies, so a template fixed once is fixed everywhere.

## Template Catalog

Paths are relative to `.agents/skills/`.

| Key | Template | Path | Output location | Written by |
| :--- | :--- | :--- | :--- | :--- |
| `fsd` | Functional Specification Document | `ba-templates/templates/fsd.md` | `docs/project-fsd.md` | `specs` |
| `use-case` | Use case | `ba-templates/templates/use-case.md` | `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` | `specs` |
| `user-stories` | User stories + Given/When/Then AC | `ba-templates/templates/user-stories.md` | `docs/BA/stories/` | this skill |
| `feature-brief` | Feature brief (problem, approaches, design) | `ba-templates/templates/feature-brief.md` | `docs/BA/briefs/` | `brainstorm-features`, this skill |
| `test-case` | Test cases per use case | `ba-templates/templates/test-case.md` | `docs/testcases/{module}/tc-{module}-{nnn}-{slug}.md` | `test-cases` |
| `test-config` | Test environment & accounts | `test-cases/references/templates/test-config-template.md` | `docs/testcases/test-config.md` | `test-cases` |
| `test-summary` | Test coverage summary | `test-cases/references/templates/test-summary-template.md` | `docs/testcases/test-summary.md` | `test-cases` |
| `readiness-review` | UC readiness review (scored audit) | `BA-audit-SRS/template/UC_readiness_review_template_v3.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-SRS` |
| `question-backlog` | Open question backlog | `BA-audit-QnA/template/question-backlog_template.md` | `docs/BA/SRS-report/{UC-folder}/` | `BA-audit-QnA` |
| `competitor-profile` | Competitor app profile | `ba-templates/templates/competitor-app-profile.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-screens` | Competitor screen inventory | `ba-templates/templates/competitor-screen-inventory.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `competitor-flow` | Competitor flow analysis | `ba-templates/templates/competitor-flow-analysis.md` | `docs/BA/competitor/{app-slug}/` | `competitor-app-analysis` |
| `comparison-gap` | Feature comparison matrix + gap analysis | `ba-templates/templates/feature-comparison-gap.md` | `docs/BA/competitor/` | `competitor-app-analysis` |

The `readiness-review` and `question-backlog` templates stay inside their audit skills because those
workflows score and parse them section by section. Do not copy them elsewhere.

## Workflow: Write a Document From a Template

1. **Resolve the template.** Map the user's request to a catalog key. If the request fits no key, or fits
   more than one, list the candidate keys and ask. Do not invent a new structure silently.
2. **Collect inputs before writing.** Read every source the document needs: requirement files, FSD,
   use cases, competitor evidence under `docs/BA/competitor/`, and `.agents/config/ba-project-config.md`
   for project name, project type and language. If a mandatory input is missing, stop and ask.
3. **Copy the template structure, then fill it.**
   - Keep every heading, table and column in the template. Do not add columns.
   - Fill the header table first: title, created date (today, `YYYY-MM-DD`), author/agent, version.
   - Remove a section only when it truly does not apply, and say why in one line in its place.
   - `<!-- SECTION: ... -->` blocks in `fsd.md` are filtered by project type; keep only matching blocks
     and delete the comment markers.
4. **Language.** Write content in Vietnamese per `ba-global-rules`. Headings are already bilingual. Keep
   on-screen labels, error messages and source quotes in their original language, and put the English
   translation in parentheses.
5. **Evidence.** Every requirement, rule or competitor claim cites its source: a document section, a
   screenshot path, or a UI-tree file. Label inferences `[Suy luận (Inferred)]`. Never fabricate data.
6. **Name and version the file** per `ba-naming-convention`. Living specs (`fsd`, `use-case`,
   `test-case`) are updated in place with a Change Log row and a version bump. Every other output is an
   immutable `v[N]` file: if `v1` exists, write `v2`.
7. **Validate the Markdown** against `ba-markdown-formatting` before saving (column counts, one row per
   line, no `<br>` in tables, no `---` next to a table).
8. **Report** the output path and any open questions to the user.

## Choosing Between Similar Templates

- Early idea, still weighing options → `feature-brief`.
- Agreed scope, needs backlog items → `user-stories`.
- Agreed scope, needs full system behaviour → `fsd` + `use-case` via the `specs` skill.
- Handing to QA → `readiness-review` first, then `test-case`.
- Learning from another app → `competitor-*`, then `comparison-gap` to turn findings into candidate
  requirements (`FR-CAND-*`), which a BA promotes into the FSD after PO confirmation.
