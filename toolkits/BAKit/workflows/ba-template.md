---
description: Write a BA document from the BAKit template catalog (FSD, use case, user stories, feature brief, test case, competitor docs, gap analysis)
---

Write one BA deliverable from a template.

**Input**: `/ba-template <key> <subject> [sources…]`
Examples: `/ba-template user-stories payment docs/BA/briefs/UC-201_payment-otp_brief_20260927_v1.md`, `/ba-template feature-brief biometric-login`

If `<key>` is omitted or unknown, list the catalog keys from `.agents/skills/ba-templates/SKILL.md` and ask which one.

**Steps**

1. **Resolve the template** via the catalog in `ba-templates`. For keys owned by another skill, hand over to it:
   - `fsd`, `use-case` → `specs`
   - `test-case`, `test-config`, `test-summary` → `test-cases`
   - `readiness-review` → `BA-audit-SRS`; `question-backlog` → `BA-audit-QnA`
   - `competitor-*`, `comparison-gap` → `competitor-app-analysis` (needs device evidence first)

2. **Collect inputs.** Read the sources the user gave, `.agents/config/ba-project-config.md`, and any related files under `docs/`. If a mandatory input is missing, stop and ask — do not invent content.

3. **Fill the template** following the `ba-templates` workflow: keep its structure, fill the header, write in Vietnamese with original labels plus English in parentheses, cite every source, label inferences.

4. **Save** under the catalog's output location, named and versioned per `ba-naming-convention` (never overwrite a `v[N]` file). Validate against `ba-markdown-formatting`.

5. **Report** the path, a two-line summary, and open questions.
