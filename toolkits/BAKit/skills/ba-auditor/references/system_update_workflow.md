# Global System Workflow (Update Flow)

This document defines the orchestration for the **Update Flow**, triggered when the User calls this workflow explicitly via `@system_update_workflow`.

---

## TRIGGER CONDITION

| Scenario | Action |
|---|---|
| User tags `@system_update_workflow` in prompt | ✅ **Follow this workflow** |
| User manually edits UC/CMR/CS/CF files directly | ❌ Workflow not required |
| User prompts Agent in chat without tagging | ❌ Workflow not required |

> **Note:** Tagging `@system_update_workflow` is the sole trigger. Do NOT confuse with `Init Flow` (which is for creating new UCs).

---

## PART III: UPDATE FLOW

### Phase A: Implementation Plan & Impact Analysis (PAUSE — wait for User approval)

**Agent must produce an Implementation Plan containing:**

1. **Description of the proposed change** — what is being modified and why

2. **Impact Analysis:**
   - What exactly needs to change (Before → After for each item)
   - List of **UC files** affected
   - List of **CMR / CS / CF files** affected (if any)
   - Check for **logical breakage**: Does the change conflict with existing rules in other UCs or CMR?
   - Check for **risks / side-effects**: Does the change cascade to other sections or flows?

3. **Execution order** — if there are dependencies (e.g., update CMR before UC)

**Rules:**
- Agent outputs the Implementation Plan and **PAUSES completely**.
- **No file changes are made during Phase A.**
- Resume only after explicit User approval (full or partial).

---

### Phase B: Document Update (execute only after User approves Phase A)

**Rules for updating files:**

#### 1. Update directly into the existing file
Do **not** create a new file. Overwrite the current file in place.

#### 2. Versioning — update the metadata table at the top of the file
- First call of this workflow on a file: `1.0` → `1.1`
- Subsequent calls: `1.1` → `1.2`, `1.2` → `1.3`, etc.
- Each workflow call = increment one minor version
- Applies to: **UC files, CMR files, CS files, CF files**

#### 3. Append to Section 4 — Lịch sử cập nhật (at the end of each modified file)
- If Section 4 does not exist: **create it**
- If Section 4 already exists: **append** a new row — do not overwrite existing rows
- Applies to: **all file types** (UC, CMR, CS, CF)

#### 4. Execution order
Follow the dependency order defined in the Implementation Plan (typically: CMR/CS/CF → UC).

---

## FORMAT: Section 4 — Lịch sử cập nhật

Place this section at the **end of every modified file**, after the last `---` divider.

```markdown
---

## 4. Lịch sử cập nhật

| Ngày | Phiên bản | Mục cập nhật | Before | After | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | 1.0 → 1.1 | [Tên section / field / rule] | [Nội dung cũ] | [Nội dung mới] | [Lý do] |
```

**Writing rules:**
| Case | Before | After |
|---|---|---|
| Thêm mới | `(Không có)` | Nội dung mới |
| Xóa | Nội dung cũ | `(Đã xóa)` |
| Sửa | Nội dung cũ (đầy đủ) | Nội dung mới (đầy đủ) |

- Each changed item = one row in the table
- If multiple fields are changed in one workflow call: add multiple rows under the same date/version
- Keep all historical rows — never delete past entries

