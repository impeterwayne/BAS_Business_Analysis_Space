# Scoping Rules — How Big Should a Use Case Be?

Scoping is the most error-prone part of Use Case writing. Apply these rules before writing.

## The 4 Scoping Rules

### Rule 1 — Coffee-break test

After the Use Case finishes, can the user stop and feel the task is done?

- YES → correct size (user-goal level).
- NO → the Use Case is only a sub-step; merge it into the Use Case that contains it.

Examples (mobile photo app):

- ✅ "Chỉnh sửa và lưu ảnh" — the user can stop afterwards; the goal is achieved.
- ❌ "Chọn Filter" — only a step inside editing.
- ❌ "Xác thực OTP" — only a step inside sign-in.

### Rule 2 — Goal level

| Level | Description | Example | Action |
|---|---|---|---|
| Summary (too big) | Spans many sessions or many goals | "Quản lý toàn bộ ảnh của người dùng" | Split into several Use Cases |
| User goal (correct) | One user, one session, one business goal | "Ghép ảnh với template" | Write as one Use Case |
| Sub-function (too small) | A step inside another Use Case | "Bấm nút Next" | Describe inside the parent Use Case |

### Rule 3 — One user, one goal, one session

Each Use Case has exactly one primary user, one business goal, and finishes in one continuous session. If two different goals appear, split into two Use Cases.

### Rule 4 — System boundary

Every step in a flow is either:

- the user does something to the app (input), or
- the app responds to the user (output).

Internal processing that the user cannot see (API calls, database writes, caching) is not a flow step. Mention a visible consequence instead ("App hiển thị loading", "App lưu ảnh vào Gallery").

## 3 Techniques to Split a Large Feature

Use these when one Feature Checklist item is too big for one Use Case.

### Technique 1 — Goal-driven

List what the user wants to achieve in this feature. Each distinct goal is a candidate Use Case.

### Technique 2 — Event-driven

List what starts something:

- user actions (tap, swipe, choose a photo, grant a permission);
- app or system events (push notification opened, timer ends, subscription expires).

Each event that leads to a meaningful result is a candidate Use Case.

### Technique 3 — Data-driven (CRUD)

For each main data object of the feature (project, photo, template, favorite…), check whether the user can create, view, edit or delete it. Each is a candidate Use Case. View/edit/delete of the same object may be merged when the logic is similar.

## Output of Scoping

For a large feature, output the Use Case list before writing:

| Mã UC | Tên UC | Người dùng chính | Mục tiêu | Màn hình liên quan |
|---|---|---|---|---|
| UC-EDIT-001 | Chỉnh sửa và lưu ảnh | User | Áp dụng hiệu ứng và lưu ảnh kết quả | SCR-EDIT-01, SCR-EDIT-02 |

Use Case names follow "động từ + đối tượng" ("Chỉnh sửa ảnh", "Lưu ảnh vào Gallery"), never a noun alone ("Chỉnh sửa") and never with the user inside the name ("User chỉnh sửa ảnh").
