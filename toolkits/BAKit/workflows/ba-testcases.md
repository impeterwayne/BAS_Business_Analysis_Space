---
description: Generate, update or export test cases from approved use cases (test-cases skill)
---

Run the `test-cases` skill.

**Input**: `/ba-testcases generate [module[/uc]]` · `/ba-testcases update` · `/ba-testcases export csv|json`

**Steps**

1. Load `.agents/skills/test-cases/SKILL.md` and route by the first word. If none is given, list the operations and ask.
2. Prefer use cases whose latest readiness review (`/ba-review`) is READY or CONDITIONALLY READY; if the review is missing or NOT READY, tell the user and ask whether to continue.
3. Use `ba-templates/templates/test-case.md`. Expected results quote on-screen messages verbatim, with English in parentheses.
4. Report files created, counts by type and priority, and gaps where a use case lacked enough detail to test.
