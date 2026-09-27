---
description: Score a use case / SRS for QA readiness (BA-audit-SRS) and open the question backlog (BA-audit-QnA)
---

Run a readiness review.

**Input**: `/ba-review <UC folder or file> [mobile|web]`
Example: `/ba-review docs/BA/SRS-report/UC69_TraCuuVanBanPhapLuat mobile`

**Steps**

1. Load `.agents/skills/BA-audit-SRS/SKILL.md`. Ask whether the feature is Mobile or Web if not given; Mobile uses the `mobile_*` reference workflows.
2. Pick first-audit or re-audit exactly as the skill describes (existing `audited` file + answered backlog → re-audit).
3. Let the first audit auto-chain `BA-audit-QnA` to create the question backlog.
4. Never edit the audited input files. Save outputs next to the input with an incremented version.
5. Report the score, the verdict, the number of open questions, and the backlog path. Do not start test design automatically.
