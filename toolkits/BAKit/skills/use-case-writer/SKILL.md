---
name: use-case-writer
description: "Quality rules for scoping, writing and self-checking Use Cases. Supports two modes: (1) Vietnamese Mobile SRS Use Case mode (default inside specs — writes the full Use Case in one pass with embedded UI Specification, Main/Alternative/Exception flows, Business Rules, Acceptance Criteria, and runs the 16-item self-check K1–K16), and (2) Standalone 13-field English Cockburn/Wiegers mode (assets/uc-template.md + 20-point checklist) when explicitly requested."
author: Phúc NT @ BA Zone (adapted for BAKit Mobile SRS)
source: https://github.com/ba-zone
---

# Use Case Writer — Scoping, Writing & Self-Check Rules

This skill provides the **Use Case scoping, writing-style, and quality self-check rules** for `ba-spec-writer` (`specs`), as well as standalone Use Case authoring.

## Mode Selection

| Mode | When to Use | Language & Template | Validation |
| :--- | :--- | :--- | :--- |
| **Mode 1: Mobile SRS Use Case (Default)** | Writing Use Cases inside the SRS (`docs/ba/srs/{app}_srs_v{N}.md` Section 6 or `docs/usecases/{module}/uc-*.md`) | **Vietnamese** with English UI/feature terms (`specs/references/templates/use-case-template.md` or `ba-templates/templates/use-case.md`). **Write the full Use Case in one pass** (no section-by-section pauses). | **16-item self-check (`references/self-check.md`, `K1–K16`)** |
| **Mode 2: Standalone 13-Field Wiegers UC** | User explicitly asks for the 13-field English BA Zone / Wiegers template | **English** 2-column table (`assets/uc-template.md`, `references/template-guide.md`, `references/writing-style-en.md`) | **20-point checklist (`references/quality-checklist.md`, `C1–C20`)** |

---

## Mode 1: Vietnamese Mobile SRS Use Case (Default)

When `specs` writes or updates Section 6 of the SRS (or `docs/usecases/`):

1. **Write the full Use Case in one pass** — do not stop after each section when generating the SRS.
2. **Language**: Vietnamese with English product/UI terms (see `ba-global-rules` and `references/writing-style.md`). Never add Vietnamese translations in parentheses after English UI/screen/feature names (`Home`, `Photo Editor`, `Button Save`, `Bottom Sheet` — not `Home (Trang chủ)`).
3. **Structure**: Follow `.agents/skills/specs/references/templates/use-case-template.md` (for single-file SRS) or `.agents/skills/ba-templates/templates/use-case.md` (for modular SRS).

### Step 1 — Scope the Use Cases (`references/scoping-rules.md`)

Before writing Section 6 of the SRS, build the Use Case list for each feature group using `references/scoping-rules.md`:

- **Coffee-break test**: after finishing the Use Case, can the user pause and feel they accomplished something meaningful? If no, merge it into the parent Use Case.
- **One primary user, one goal, one continuous session**.
- **Group by user goal, not one Use Case per screen** (a 3-step wizard is 1 Use Case; a screen with two unrelated goals may be 2 Use Cases).
- **Name format**: `Động từ + Đối tượng` (active verb + object), e.g. `Chỉnh sửa ảnh bằng Filter`, `Ghép nhiều ảnh theo Layout`, `Lưu ảnh về Gallery`. Never use vague verbs (`Quản lý`, `Xử lý`, `Thực hiện`).

### Step 2 — Write Each Use Case (`references/writing-style.md`)

Follow `references/writing-style.md` and the template:

- **Overview table**: actor (`Người dùng` / `Người dùng chưa cấp quyền Camera`, never generic `User`), clear 1-sentence goal, specific trigger (which screen + which button), verifiable preconditions, verifiable postconditions (success and failure/cancel states).
- **UI Specification (before Main Flow)**:
  - One subsection per screen used by the Use Case.
  - **Place the Design image block right at the top of each screen subsection**, using Markdown image syntax `![{Screen ID} — {Screen name}](<relative-path>.png)` (e.g. `![SCR-EDIT-01 — Photo Editor](../../inputs/design/01-photo-editor.png)` or `![01 — Photo Editor](../../BA/figma/{feature}/screens/01-photo-editor.png)`) so it renders as an inline preview. If no design image exists, write `Chưa có thiết kế (Design Pending)` and add an Open Question `Q-{NNN}`.
  - Component table: `UI ID | Thành phần | Nội dung hiển thị | Thao tác & Phản hồi của App | Trạng thái / Kiểm tra dữ liệu`.
  - Document UI states (Default, Loading, Empty, Error, Disabled, Permission) and Popups / Dialogs / Bottom Sheets.
- **Main Flow (Happy Path)**:
  - Table: `Bước | Hành động của User | Phản hồi của App | Màn hình / Trạng thái`.
  - One action per step, active voice, present tense.
  - **No `if/else` or error branches inside Main Flow** — those belong in Alternative or Exception Flows.
  - Put limits/defaults/formulas in **Quy tắc nghiệp vụ (`BR-{NNN}`)** and reference the `BR-*` ID from the step.
- **Alternative Flows (`AF-01`, `AF-02`, …)**:
  - Different paths that still achieve the goal (or valid user cancel/back). Must state the exact branch step (`Tại bước N của Luồng chính, khi ...`) and where it returns or ends.
- **Exception / Error Flows (`EF-01`, `EF-02`, …)**:
  - Paths where the goal fails. Must state the branch step + condition, exact App response/message (do not invent error copy not in Design/decisions — flag `Chưa có text trong design` + `Q-{NNN}`), and final recovery state.
  - Cover relevant mobile failure modes: permission denied, invalid/corrupted photo/file, storage full, network error/timeout (for online features), interrupted process (app backgrounded/call), repeated tap, back/cancel with unsaved edits.
- **Navigation / Result** and **Acceptance Criteria (`AC-01`, Given / When / Then)**.

### Step 3 — Self-Check Before Saving (`references/self-check.md`)

Run all **16 checks (`K1–K16`)** in `references/self-check.md` on every Use Case. Fix any violation before writing the SRS file, or record genuine product gaps in `Câu hỏi mở (Q-{NNN})`.

---

## Mode 2: Standalone 13-Field English UC (When Requested)

If the user explicitly requests a standalone English 13-field Use Case (Karl Wiegers / IIBA style):
- Load `assets/uc-template.md`, `references/template-guide.md`, `references/writing-style-en.md`, and `references/quality-checklist.md` (20-point checklist `C1–C20`).

## References

- `references/scoping-rules.md` — 4 scoping rules + 3 splitting techniques (Vietnamese mobile examples)
- `references/writing-style.md` — Active voice, UI naming, numbering, 10 common mistakes (Vietnamese mobile SRS)
- `references/self-check.md` — 16-item Use Case self-check (`K1–K16`)
- `references/template-guide.md` & `references/writing-style-en.md` & `references/quality-checklist.md` — 13-field English Wiegers reference suite
- `assets/uc-template.md` — 13-field English template
