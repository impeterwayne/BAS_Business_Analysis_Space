# Writing Style — Vietnamese Use Cases

Supreme principle: **readability first**. A good Use Case lets the PO understand it, the developer build from it, and the tester test from it.

## 1. Active voice, present tense, clear subject

- ✅ "User bấm Button Save." / "App lưu ảnh vào Gallery."
- ❌ "Button Save được bấm." / "Ảnh sẽ được lưu."

Every step starts with its subject: `User` or `App` (or a named external party such as `App Store`).

## 2. One step = one action

- ✅ Step 1: "User bấm Button Edit." Step 2: "App mở màn Photo Editor."
- ❌ "User bấm Edit, chọn Filter rồi bấm Save."

In the Main Flow table, one row = one user action + the app response to it.

## 3. Avoid vague verbs and words

Avoid: "xử lý", "quản lý", "hỗ trợ", "thực hiện", "nhanh", "phù hợp", "một số", "v.v.".
Say what the user sees: "App hiển thị loading và vô hiệu hoá Button Save cho đến khi lưu xong."

## 4. No implementation details

Do not write API names, class names, database tables, SDK internals or storage keys. Describe the visible result.

- ✅ "App hiển thị danh sách template mới nhất."
- ❌ "App gọi GET /templates và lưu vào Room DB."

## 5. UI names

- Use the exact label/name from the design: `Button Save`, `Tab Trending`, `Bottom Sheet Share`.
- Keep English UI names; do not add Vietnamese translations in parentheses.
- Reference components by their UI ID from the UI Specification table when useful: "User bấm Button Save (UI-03)."
- Screen names come with their screen ID the first time they appear: "màn SCR-EDIT-01 Photo Editor".

## 6. Business rules stay out of steps

Put conditions, limits and defaults in `Quy tắc nghiệp vụ` and reference them:

- ✅ "App kiểm tra số lượng ảnh đã chọn (BR-005)."
- ❌ "App kiểm tra nếu số ảnh lớn hơn 10 thì báo lỗi, nếu nhỏ hơn 2 thì …"

## 7. Numbering

| Item | Format | Example |
|---|---|---|
| Main Flow step | 1, 2, 3 | 3 |
| Alternative flow | AF-NN | AF-01 |
| Exception flow | EF-NN | EF-02 |
| Business rule | BR-NNN (global numbering in the SRS) | BR-012 |
| Open question | Q-NNN (global numbering in the SRS) | Q-004 |
| UI component | UI-NN (per screen) | UI-03 |

Alternative and exception flows always state where they branch: "Tại bước 3 …".

## 8. Messages and texts

Quote on-screen texts exactly as in the design (keep the original language). If the design has no text for a state (e.g. an error Toast), write `Chưa có text trong design` and raise an Open Question instead of inventing one.

## 9. The 10 most common mistakes

1. Repeating the UI table inside the Main Flow (UI details belong in the UI Specification).
2. Mixing user and app actions in one step.
3. A user action with no app response.
4. if/else inside the Main Flow.
5. A vague trigger ("User vào app").
6. A postcondition written as an action instead of a resulting state.
7. Two primary users in one Use Case.
8. "App xử lý" without saying what the user sees.
9. `Mục tiêu` repeated word-for-word as the Main Flow.
10. Only the happy path; no failure cases.
