---
description: Audit the SRS or a use case for Dev/QA readiness (BA-audit-SRS) and open the question backlog (BA-audit-QnA)
---

Run a readiness review.

**Input**: `/ba-review <target> [mobile|web]`

| Target | Audit mode |
| :--- | :--- |
| `srs` or `docs/project-srs.md` (legacy `docs/project-fsd.md`) | Mobile — Full SRS |
| `srs <module>` or `srs UC-AUTH-001,UC-AUTH-002` | Mobile — module / selected UCs |
| a use case file (`docs/usecases/{module}/uc-*.md`) or a UC folder | Single UC (mobile), or Web/Report UC (legacy) with `web` |

Examples:
- `/ba-review srs` — audit the whole mobile SRS
- `/ba-review srs auth` — audit module `auth` with its global rules and shared diagrams
- `/ba-review docs/usecases/auth/uc-auth-001-login-otp.md mobile`
- `/ba-review docs/BA/SRS-report/UC69_TraCuuVanBanPhapLuat web`

**Steps**

1. Load `.agents/skills/BA-audit-SRS/SKILL.md`. Ask in chat whether the feature is Mobile or Web if neither
   the argument nor `ba-project-config.md` says; Mobile uses the `mobile_*` reference workflows. A full-SRS
   target is a mobile audit; for a Web/Report project, audit the UC folders one by one instead.
2. Pick first-audit or re-audit exactly as the skill describes (existing `audited` file + answered backlog →
   re-audit; open questions → ask whether to answer them first or re-audit with them kept open).
3. Read the inputs the skill lists: SRS, use cases, diagrams, Product Decision Summary, Feature Checklist,
   Figma analysis and APK evidence — whatever exists; record what is missing.
4. Let the first audit auto-chain `BA-audit-QnA` to create the question backlog.
5. Never edit the audited input files (SRS, use cases, diagrams, decisions). Save outputs with an incremented
   version: next to a UC folder already in `docs/BA/SRS-report/`, in `docs/BA/SRS-report/{UC-ID}/` for a UC
   from `docs/usecases/`, and in `docs/BA/SRS-report/srs/` for a full-SRS or module audit.
6. Report the score, the verdict (Ready / Conditionally Ready / Not Ready), the blocking P0 count, the number of
   open questions, and the report and backlog paths. Say "Ready for Dev/QA Handoff" only when no P0 is open.
   Do not start test design automatically.
