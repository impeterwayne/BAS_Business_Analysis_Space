---
description: Review the SRS for Dev/QA readiness — quick mode by default (chat only), full scored audit on request (BA-audit-SRS + BA-audit-QnA)
---

Run a readiness review.

**Input**: `/ba-review [srs | UC-NET-001,UC-NET-002] [full]`

| Command | Mode |
| :--- | :--- |
| `/ba-review` or `/ba-review srs` | **Quick** audit of `docs/project-srs.md` (default) |
| `/ba-review UC-NET-001` | Quick audit of the named Use Cases |
| `/ba-review srs full` | Full scored audit (mobile workflows, report file + question backlog) |

**Steps**

1. Load `.agents/skills/BA-audit-SRS/SKILL.md`.
2. **Quick (default):** run the quick-mode checks; answer in chat with the verdict, one findings table and, if
   needed, a short batch table of questions for the PO. No files written.
3. **Full (only when asked):** follow the skill's full mobile workflow; it may write the readiness report and the
   question backlog under `docs/BA/SRS-report/srs/`.
4. Never edit the SRS during a review. Fixes are a separate `/ba-spec update` after the user agrees.
