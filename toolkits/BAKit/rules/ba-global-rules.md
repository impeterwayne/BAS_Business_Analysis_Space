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
- All BA deliverables MUST be written in **one consistent language** (**Vietnamese** by default, or **English** when specified by the user or `.agents/config/ba-project-config.md` → `Deliverable language`), grammatically correct and natural, preserving the clarity and integrity of the source material.
- **Terminology stays in English** (see *Terminology* below): write the sentences in Vietnamese, but keep
  product, BA, UI and screen/field terms in English as-is (`tab`, `click`, `button`, `popup`, `dialog`, `bottom sheet`, `banner`, `toast`, `scroll`, `swipe`, `carousel`, `dropdown`, `enable`, `disable`, `user`, `app`, `flow`, `use case`, `rule`, `in scope`, `out of scope`, `IAP`, `IAA`, plus exact English screen/field/module names on the UI).
- **Strictly NO parallel Vietnamese-English glosses (`Tiếng Việt (English)` or `English (Tiếng Việt)`) anywhere:**
  - NEVER write bilingual headings, and NEVER pair a Vietnamese phrase with its English equivalent in parentheses (or vice versa) in body text, feature lists, use case titles, or table cells.
  - **FORBIDDEN examples:** `Đếm bước chân (Step Count)`, `Thống kê xu hướng sức khỏe (Analytics)`, `Lịch nhắc nhở sức khỏe (Reminder)`, `Giới tính (Gender)`, `Cân nặng (Weight)`, `Chiều cao (Height)`, `Use Case: Thiết lập và chỉnh sửa hồ sơ người dùng (Introduce Yourself & Edit Profile)`, `Chuyển trạng thái chọn (radio button) sang thẻ đó`, `Vuốt ngang (swipe)`, `mở khóa (enable)`, `khóa mờ (disable)`.
  - **REQUIRED style:** Use ONE consistent term directly in natural Vietnamese sentences without parenthetical translation (e.g., `## 5. Use Case: Introduce Yourself & Edit Profile`, `3. Step Count.`, `Chọn Male hoặc Female`, `Swipe ngang thước trượt`, `Enable button Next`, `Disable button Save`).
  - In `Đặc tả giao diện`, the `Thành phần` column MUST use the concise label shown on the UI (e.g. `Back`, `Your Name`, `Date of Birth`, `Popup Pick Date`, `Next`, `Male / Female`, `lbs / kg & Thước trượt Weight`, `Save`) instead of verbose English component descriptions like `Your Name Input Field` or `Gender Selection Cards (Male, Female)`.
  - Keep `Mô tả tương tác` in `Đặc tả giao diện` ultra-concise:
    - **Omit obvious OS/keyboard behaviors:** Never write *"Chạm vào ô nhập > Mở bàn phím chữ để..."* or *"Chạm vào từng ô > Mở bàn phím số để..."*; write concisely: `Nhập tên của user.` or `Nhập trực tiếp chiều cao và cân nặng theo đơn vị cm và kg.`
    - **Concise navigation button descriptions:** For multi-step buttons like `Next`, write one concise line (`Click button Next > Điều hướng tới bước tiếp theo (tại Bước 4 > Lưu Profile và điều hướng vào màn hình Home).`) instead of breaking down every step's condition and action inside `Đặc tả giao diện`.
- **Natural, Non-Tech PO Language, Non-Redundant Structure & Concise `Condition / Action > Result` Style in SRS & Use Cases:**
  - Write all SRS and Use Case requirements in natural, concise business-level language for the Product Owner (PO).
  - **Separate `3. Global Business Rules` and `X.6 Business Rules` (inside each Use Case), with ZERO duplication across sections, ONE rule per row:**
    - **`3. Global Business Rules` (top of SRS):** ONLY include rules that apply globally across the entire app or across multiple features/modules (e.g., local device storage and cross-module `Profile` synchronization to `Weight & BMI` and `Water Reminder`) so they do not have to be repeated in every Use Case.
    - **`X.6 Business Rules` (after the Flows of each Use Case):** Document only the business rules specific to that Use Case (validation constraints, min/max ranges, default values, unit conversion formulas).
    - **No duplication between `Đặc tả giao diện`, `Flows` (`Basic / Alternative / Exceptional Flow`), and `Business Rules`:** Never repeat UI interaction, navigation steps, or `Exceptional Flow` error messages already covered in `X.1 Đặc tả giao diện` and `X.3–X.5 Flows` inside `X.6 Business Rules`. For example, if `EF-1` and `EF-2` in `X.5 Exceptional Flow` already state `Nhập vượt quá 20 ký tự > Hiển thị error state ("...")`, do NOT repeat those error state lines in `X.6 Business Rules` (`BR-002`); only state the valid constraint and button enable/disable condition (`Điền hợp lệ cả 2 trường Your Name (chỉ gồm chữ cái và khoảng trắng, tối đa 20 ký tự) và Date of Birth > Enable button Next / Save; chưa điền đủ hoặc thông tin không hợp lệ > Disable button.`).
  - **Omit meta-notes and design comparison commentary:** NEVER include introductory meta-explanations or design-diff notes in the SRS/Use Cases (e.g. omit `"Hệ thống sử dụng thống nhất 1 trường..."`, `"thay cho thiết kế tách First name / Last name trên bản vẽ"`, or blockquote notes explaining PO overrides). State only the final target product behavior directly.
  - **Use concise `Condition / Action > Result` (`>`) syntax throughout:** Across `Global Business Rules`, `Đặc tả giao diện` (`Mô tả tương tác`), Use Case Flows (`Basic Flow`, `Alternative Flow`, `Exceptional Flow`), and Use Case `Business Rules`, express interactions and rules concisely using `>` instead of verbose prose.
  - **Use `> Hiển thị error state ("...")` for validation errors in `Exceptional Flow`:** Do not describe visual styling details such as red borders or label placement (never write *"ô nhập đổi viền sang màu đỏ và hiển thị thông báo lỗi bên dưới..."*); write concisely in `Exceptional Flow`: `Nhập vượt quá 20 ký tự vào trường Your Name > Hiển thị error state ("You cannot enter more than 20 characters.") và disable button Next (hoặc Save).`
  - **No leading dash bullets (`- `) or em-dashes (`—`) in SRS & Use Case documents:**
    - **Business Rules tables: one rule per row** (one condition `>` one result, its own `BR-{NNN}`). Never stack several rules in one cell with `<br>`.
    - **Note/References: clickable links on one line, comma-separated** (`[BR-002](#br-002), [AF-1](#uc-edit-001-af-1)`), never one reference per line.
    - Other table cells that genuinely hold several items (e.g. a UI label followed by its element image) separate them with `<br>` directly in `.md` (and a real line break in `.docx`) **without** leading `- ` bullets (never use `<br>- `).
    - Write image captions without leading `- ` or `—` (e.g. `**Hình 1: Bước 1/4 Introduce Yourself (Trạng thái mặc định)**`).
    - In lists outside tables, use numbered items (`1. `, `2. `) or clean lines without `- ` or `—`.
  - **NEVER** include source-code API/class/intent names (e.g. `Intent.ACTION_BATTERY_CHANGED`, `BatteryManager.EXTRA_STATUS`, `UsageStatsManager`), Figma node IDs (e.g. `14005:3555`), icon library codes (`reicon:setting`), pixel dimensions (`36×36`), or hex color codes (`#004c44`) in SRS or Use Case deliverables.
  - **NEVER** include mockup sample numbers as `(ví dụ: ...)` inside business rules (e.g. omit `(ví dụ: 80%)`, `(ví dụ: 32°)`, `(ví dụ: 4.299v)`, `(ví dụ: Good)`).
  - **Explicitly define formulas and sorting rules:** Whenever the UI displays calculated metrics (dates, unit conversions, total usage duration, percentage share, progress increments, list grouping/sorting), clearly define the exact business formula and sorting order in `Global Business Rules` or the Use Case's `Business Rules`.
- **Markdown-First Authoring & Word (`.docx`) Output Formatting Standard:**
  - **Author `.md` first; export `.docx` only when requested after full completion:** When writing or updating the SRS incrementally (module by module or use case by use case), **only update the `.md` files**. Do **NOT** generate or re-export the `.docx` file on intermediate steps unless the full SRS `.md` is complete and the user explicitly asks to export `.docx`.
  - Font family: **`Mulish`**, font size: **`12pt`** (`Pt(12)`) across the entire document.
  - **Native Word Heading Styles (`Heading 1` / `Heading 2` / `Heading 3`):** All `#`, `##`, `###` headings in `.md` MUST be assigned native Microsoft Word Heading styles (`Heading 1`, `Heading 2`, `Heading 3` with `w:outlineLvl` `0`, `1`, `2`, font `Mulish` `12pt` bold, color `#000000`) so they appear in Word's Navigation Pane (Outline view). Never export headings as `Normal` paragraphs.
  - Table column widths MUST be fixed (`layout=fixed`) and proportional to content (`STT` / `Rule ID` / `ID` / `Step` / `Actor` narrow; `Mô tả` / `Mô tả tương tác` / `Action` wide).
  - Multi-item cells MUST use explicit line breaks (`<br>` in `.md` and `\n` in `.docx`, with no leading `- `), and all UI screenshots, element images and diagrams MUST be embedded directly into the `.docx` file.
- All `SKILL.md`, rule and workflow files MUST be written in English.
- The project may override the deliverable language in `.agents/config/ba-project-config.md` →
  `Deliverable language`. Read it before writing a deliverable.

## Terminology

Vietnamese grammar, English terms. Write the term once, directly as the team says it, without translating it and
**never** pairing a Vietnamese word and an English word in parentheses (`Tiếng Việt (English)` or `English (Tiếng Việt)`). Everyday words stay Vietnamese (người dùng, màn hình, nút, ứng dụng, tài khoản, số tiền).

| Area | Keep in English |
| :--- | :--- |
| Product / UX | flow, user flow, onboarding, login, sign-up, logout, home, tab, menu, popup, dialog, bottom sheet, banner, toast, form, field, dropdown, checkbox, toggle, button, click, scroll, swipe, carousel, CTA, deep link, push notification, empty state, loading state, error state, paywall, layout, UI, UX, user, app |
| BA | requirement, functional / non-functional requirement, use case, user story, acceptance criteria, business rule, actor, precondition, postcondition, basic flow, main flow, alternative flow, exceptional flow, exception flow, edge case, scope, in scope / out of scope, stakeholder, backlog, epic, feature, MVP, gap, benchmark, persona, pain point, trade-off, KPI, test case |
| Tech | API, endpoint, backend, SDK, feature flag, remote config, A/B test, analytics event, tracking, session, token, cache, sync, permission, OTP, KYC / eKYC, QR, IAP |
| Competitor analysis | competitor, evidence, screenshot, UI tree, deep link, observed, inferred, boundary |

| Avoid (forced translation) | Write instead |
| :--- | :--- |
| Luồng giới thiệu ban đầu yêu cầu mật khẩu dùng một lần trước khi vào trang chủ. | Flow onboarding yêu cầu nhập OTP trước khi vào Home. |
| Tiêu chí chấp nhận của câu chuyện người dùng | Acceptance criteria của user story |
| Cờ tính năng từ cấu hình từ xa | Feature flag từ remote config |

A term not in the table follows the same test: if the team would say it in English in a meeting, write it in
English.

## File & Naming Standards

- All output files MUST follow `ba-naming-convention`.
- Versioned deliverables are immutable: NEVER overwrite; create `v2`, `v3`, … instead.
- Exception: the living SRS `docs/project-srs.md` (and legacy `docs/project-fsd.md`), its Word copy
  `docs/project-srs.docx` and the generated diagram images `docs/BA/diagrams/**` are **overwritten** in place;
  the SRS header `Phiên bản` / `Cập nhật lần cuối` is bumped, and there is no Change Log.
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
- Never put real personal data into Figma notes, research files or the SRS.
