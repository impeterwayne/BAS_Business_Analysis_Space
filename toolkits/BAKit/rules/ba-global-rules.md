---
trigger: always_on
---

# BA Global Rules

## Common

- Use only knowledge stored in this workspace (`docs/`, `.agents/`) plus sources the user provides or that you
  capture yourself (device screens, web research you cite). Do not rely on unrelated history.
- If the user's request is ambiguous, DO NOT guess. Ask for clarification until the input is complete.

## Language & Communication

- Communication language: **Vietnamese** is the default for all exchanges, reports and explanations.
- All BA deliverables MUST be written in **Vietnamese**, grammatically correct and natural, preserving the
  clarity and integrity of the source material.
- **Terminology stays in English** (see *Terminology* below): write the sentences in Vietnamese, but keep
  product, BA and technical terms in English as-is. A forced translation is harder to read than the term
  the team already uses.
- Templates in `ba-templates` use bilingual headings `Tiếng Việt (English)`; keep them as they are.
- On-screen labels, error messages and quotes MUST stay in their original language (Vietnamese, Korean,
  English, …) with an English translation in parentheses, e.g. `"Đăng nhập" (Log in)`.
- All `SKILL.md`, rule and workflow files MUST be written in English.
- The project may override the deliverable language in `.agents/config/ba-project-config.md` →
  `Deliverable language`. Read it before writing a deliverable.

## Terminology

Vietnamese grammar, English terms. Write the term exactly as the team says it, without translating it and
without a Vietnamese gloss in parentheses. Everyday words stay Vietnamese (người dùng, màn hình, nút, ứng
dụng, tài khoản, số tiền).

| Area | Keep in English |
| :--- | :--- |
| Product / UX | flow, user flow, onboarding, login, sign-up, logout, home, tab, menu, popup, dialog, bottom sheet, banner, toast, form, field, dropdown, checkbox, toggle, CTA, deep link, push notification, empty state, loading state, error state, paywall, layout, UI, UX |
| BA | requirement, functional / non-functional requirement, use case, user story, acceptance criteria, business rule, actor, precondition, postcondition, main flow, alternative flow, exception flow, edge case, scope, in scope / out of scope, stakeholder, backlog, epic, feature, MVP, gap, benchmark, persona, pain point, trade-off, KPI, test case |
| Tech | API, endpoint, backend, SDK, feature flag, remote config, A/B test, analytics event, tracking, session, token, cache, sync, permission, OTP, KYC / eKYC, QR |
| Competitor analysis | competitor, evidence, screenshot, UI tree, deep link, observed, inferred, boundary |

| Avoid (forced translation) | Write instead |
| :--- | :--- |
| Luồng giới thiệu ban đầu yêu cầu mật khẩu dùng một lần trước khi vào trang chủ. | Flow onboarding yêu cầu nhập OTP trước khi vào Home. |
| Tiêu chí chấp nhận của câu chuyện người dùng | Acceptance criteria của user story |
| Cờ tính năng từ cấu hình từ xa | Feature flag từ remote config |

A term not in the table follows the same test: if the team would say it in English in a meeting, write it in
English. On-screen labels and quotes still follow the rule above (original language, English in parentheses).

## File & Naming Standards

- All output files MUST follow `ba-naming-convention`.
- Versioned deliverables are immutable: NEVER overwrite; create `v2`, `v3`, … instead.
- Exception: living specs owned by `specs` / `test-cases` (`docs/project-fsd.md`, `docs/usecases/**`,
  `docs/testcases/**`) are updated in place with a version bump and a Change Log entry.
- Every file MUST start with a header holding: document title, date created, author/agent, version.

## Output Quality Standards

- Every output MUST be **evidence-based**: cite the requirement section, document, screenshot path or UI
  tree file it rests on.
- NEVER fabricate data, statistics, screens or requirements.
- Separate observation from inference; label inferences `[Inferred]`. Facts read from decoded
  competitor code are `[Code]` with a `path:line`, never presented as observed behaviour.
- When uncertain, say so explicitly and ask.

## Agent Boundaries

- Each agent works strictly within its own role (see `ba-workflow`).
- When an agent needs another agent's output, it reads the file under `docs/` — it never redoes that work.

## Error Handling

- On an error or ambiguity, stop and report to the user; do not fill gaps with assumptions.
- Log every issue, conflict or missing input in the output report's open-questions section.

## Security & Privacy

- NEVER send sensitive data (PII, passwords, proprietary documents) to public services.
- NEVER store passwords, OTPs, tokens or API keys in any output file, note or finding.
- On a competitor app, never enter real personal data and never perform payments, transfers, sign-ups,
  posts or deletions without the user's explicit approval (see `ba-device-automation`).
