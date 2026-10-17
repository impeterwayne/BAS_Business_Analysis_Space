# Scoring Rubric & Report Rules (Shared)

> File dùng chung cho cả First Audit và Re-Audit. Mỗi workflow chỉ giữ phần riêng, tham chiếu file này cho scoring + report.

---

## Phạm vi test — CHỈ Mobile Client

Mọi phát biểu PHẢI đặt **chủ ngữ là App/Client**, KHÔNG đặt chủ ngữ là API/Server.

| ❌ SAI | ✅ ĐÚNG |
|---|---|
| API Tin tức trả về danh sách 5 tin | App nhận response → render tối đa 5 tin |
| Server xử lý timeout sau 10s | App phát hiện không có response sau 10s → hiển thị thông báo |
| API Biểu đồ trả về dữ liệu chart | App nhận dữ liệu → render biểu đồ theo format |

---

## Bảng 10 Knowledge Area

| # | Knowledge Area | Max Pts | Critical? |
|---|---|:---:|:---:|
| 1 | Feature Identity | 4 | Yes |
| 2 | Objective & Scope | 4 | Yes |
| 3 | Actors & User Roles | 9 | Yes |
| 4 | Preconditions & Postconditions | 9 | Yes |
| 5 | UI Object Inventory & Mapping | 14 | Yes |
| 6 | Object Attributes & Behavior Definition | 18 | Yes |
| 7 | Functional Logic & Workflow Decomposition | 18 | Yes |
| 8 | Functional Integration Analysis | 9 | Yes |
| 9 | Acceptance Criteria | 10 | Yes |
| 10 | Non-functional Requirements | 5 | No |

**Total = 100 điểm. Raw score = Final score. Không chuẩn hóa.**

---

## Nguyên tắc chấm điểm

1. Chấm từng sub-item rồi cộng — KHÔNG ước lượng toàn KA.
2. Chỉ dùng đúng giá trị Clear/Partial/Missing trong bảng sub-item bên dưới. Điểm luôn là số nguyên.
3. Tiêu chí: Tester có đủ info để viết test case chưa?
4. KHÔNG trừ điểm cho gap phát hiện tại Edge Case Checklist (bonus coverage).
5. Phân vân Clear↔Partial → chọn **Partial**. Phân vân Partial↔Missing → chọn **Missing**.
6. Mỗi sub-item PHẢI ghi evidence (`UC §X.Y` / `CMR-NN`) + 1 câu lý do.

---

## Định nghĩa mức Clear / Partial / Missing

### ✅ Clear — full điểm sub-item

- Thông tin tường minh, **không cần suy luận**.
- KHÔNG dùng từ mơ hồ: "phù hợp", "hợp lý", "should", "can", "có thể".
- Nội dung cụ thể, kiểm chứng được (có số, enum, tên cụ thể, điều kiện rõ).
- Tester đọc vào thiết kế test case ngay mà KHÔNG cần hỏi BA.

### ⚡ Partial — điểm phụ (xem cột "Partial" trong bảng KA)

- Có mô tả nhưng mơ hồ, dùng từ không đo lường được.
- Chỉ suy luận được từ CMR / wireframe / ngữ cảnh — KHÔNG viết tường minh trong UC.
- Mâu thuẫn với artefact khác về cùng một điểm.
- Có nội dung đúng nhưng thiếu case biên cần thiết.

### ❌ Missing — 0 điểm

- Hoàn toàn không có thông tin trong toàn bộ artefact.
- Có nội dung nhưng sai hoàn toàn so với hành vi thực tế hoặc CMR.
- Artefact bắt buộc bị BLOCKED làm sub-item không thể đánh giá.

### Quy tắc phân vân

- Clear ↔ Partial → chọn **Partial**.
- Partial ↔ Missing → chọn **Missing**.

---

## Sub-item Breakdown từng KA

### KA #1 — Feature Identity (4đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 1.1 UC-ID + Tên tính năng | 1 | 0 | ID và tên nhất quán giữa header và nội dung |
| 1.2 Phiên bản UC + Ngày tạo | 1 | 0 | Có version + ngày; nhất quán |
| 1.3 Phân hệ + Loại chức năng | 1 | 0 | VD: Mobile App / Điều hướng & Tổng quan |
| 1.4 BA phụ trách + Context | 1 | 0 | Có tên BA và vị trí UC trong hệ thống |

### KA #2 — Objective & Scope (4đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 2.1 Mục tiêu (WHY) | 2 | 1 | Mô tả rõ vấn đề nghiệp vụ + đối tượng hưởng lợi |
| 2.2 In-Scope list | 1 | 0 | Liệt kê đầy đủ chức năng/sub-function |
| 2.3 Out-of-Scope list | 1 | 0 | Phát biểu tường minh gì KHÔNG thuộc phạm vi |

### KA #3 — Actors & User Roles (9đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 3.1 Danh sách Primary Actors | 3 | 1 | Liệt kê đủ, phân loại Primary/System/External |
| 3.2 Phân quyền / Role | 3 | 1 | Role định nghĩa; nêu rõ khác biệt hành vi giữa role |
| 3.3 Permission rules | 2 | 1 | Mỗi actor tap được gì / thấy gì |
| 3.4 Fallback khi role ngoài enum | 1 | 0 | Role không nằm trong enum → UI xử lý thế nào |

### KA #4 — Preconditions & Postconditions (9đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 4.1 Preconditions — Entry point | 3 | 1 | Điều kiện kích hoạt UC rõ ràng |
| 4.2 Preconditions — System state | 2 | 1 | Trạng thái system/data cần có trước |
| 4.3 Postconditions — Success state | 3 | 1 | Trạng thái sau happy path hoàn tất |
| 4.4 Postconditions — Data changes | 1 | 0 | Mọi thay đổi dữ liệu/session sau hoàn tất |

### KA #5 — UI Object Inventory & Mapping (14đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 5.1 Liệt kê đầy đủ component | 5 | 2 | Mọi component trên wireframe đều có trong UC |
| 5.2 Nhất quán UC ↔ Wireframe | 3 | 1 | Tên label, vị trí, loại component khớp |
| 5.3 State / Action / Label per component | 3 | 1 | Mỗi component có: trạng thái default, quy tắc tap, label |
| 5.4 CMR Cross-Check | 3 | 1 | Mọi CMR áp dụng được đều có UC tham chiếu |

**Quy tắc 5.4:** ≥85% CMR ref → Clear (3đ). 50–<85% → Partial (1đ). <50% → Missing (0đ).

### KA #6 — Object Attributes & Behavior Definition (18đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 6.1 System States | 5 | 2 | Mỗi component có trạng thái default + điều kiện thay đổi |
| 6.2 Interaction Matrix | 5 | 2 | Mỗi component có ma trận tương tác + phản hồi |
| 6.3 Object Behavior (reactive rules) | 4 | 2 | Quy tắc reactive khi data/state thay đổi |
| 6.4 Edge Case Coverage | 4 | 2 | Nhóm A-E edge case được UC đề cập |

**Quy tắc 6.4:** ≥70% items covered → Clear (4đ). 40–<70% → Partial (2đ). <40% → Missing (0đ).

### KA #7 — Functional Logic & Workflow Decomposition (18đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 7.1 Main Flow (Happy Path) | 5 | 2 | Mỗi sub-function có main flow đầy đủ bước |
| 7.2 Alternative Flows | 4 | 2 | Các luồng thay thế |
| 7.3 Exception & Error Flows | 3 | 1 | Error handling cho mọi API call (client-side) |
| 7.4 Business Rules & Validation | 3 | 1 | Enum values, ràng buộc, validation |
| 7.5 UI/UX Feedback | 3 | 1 | Loading states, toast messages, error wording |

### KA #8 — Functional Integration Analysis (9đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 8.1 Impact Analysis | 3 | 1 | Thay đổi ở 1 chức năng ảnh hưởng chức năng khác |
| 8.2 Data Consistency | 3 | 1 | Data source → consumer; quy tắc đồng bộ |
| 8.3 Section-level error isolation | 3 | 1 | 1 section fail không block các section khác |

### KA #9 — Acceptance Criteria (10đ, Critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 9.1 AC tường minh trong UC | 4 | 2 | UC có section AC do BA viết; KHÔNG phải skill tự suy luận |
| 9.2 AC đo lường được (pass/fail) | 3 | 1 | Mỗi AC kiểm chứng được (không "should", "may") |
| 9.3 AC phủ UI/Functional/Integration | 3 | 1 | AC phân loại rõ 3 nhóm, cover main + error flows |

**Lưu ý:** UC gốc không có section AC nhưng skill tự suy luận → 9.1 chấm **Partial (2đ)**.

### KA #10 — Non-functional Requirements (5đ, Non-critical)

| Sub-item | Clear | Partial | Tiêu chí Clear |
|---|:---:|:---:|---|
| 10.1 Performance | 1 | 0 | Có target thời gian (timeout, response SLA) |
| 10.2 Security | 1 | 0 | Session management, HTTPS, authentication |
| 10.3 Accessibility | 1 | 0 | Target cụ thể (WCAG, touch target size, contrast) |
| 10.4 Compatibility | 1 | 0 | OS versions, screen orientations, device types |
| 10.5 Reliability | 1 | 0 | Error isolation, retry behavior, fallback |

> KA #10 chỉ có Pass/Fail (1đ/0đ), không có Partial.

---

## Auto-fail Rule

Nếu bất kỳ KA Critical (#1–#9) nào bị **0 điểm toàn mục** → verdict = ❌ NOT READY bất kể tổng điểm.

- Chỉ trigger khi CẢ KA = 0, KHÔNG phải 1 sub-item = 0.
- KA #10 (non-critical) không trigger auto-fail.

---

## Verdict

| Score | Verdict |
|:---:|---|
| `[85, 100]` | ✅ **READY** — QA bắt đầu test design ngay |
| `[70, 85)` | ⚡ **CONDITIONALLY READY** — bắt đầu vùng rõ, gap giải quyết song song |
| `[0, 70)` | ❌ **NOT READY** — quá nhiều gap, không bắt đầu |

> `[a, b]` bao gồm cả a và b. `[a, b)` bao gồm a, KHÔNG bao gồm b.

---

## Breakdown chi tiết (BẮT BUỘC)

Với mỗi KA, PHẢI xuất bảng breakdown:

```markdown
### KA #N — [Tên KA] ([total]đ)
| Sub-item | Max | Điểm | Trạng thái | Evidence / Lý do |
|---|:---:|:---:|:---:|---|
| N.1 [tên] | X | x | ✅/⚡/❌ | UC §X.Y / CMR-NN / Missing |

**Subtotal KA #N: Y/Total — ✅/⚡/❌**
**Evaluation:** [1 dòng — lý do chính]
```

---

## Cross-Artefact Conflict Check

Chỉ flag xung đột **ảnh hưởng client**:
- UC flow mâu thuẫn wireframe?
- API spec có field không mention trong UC?
- UI element trên design không có business rule?
- Label/field name không nhất quán giữa documents?

Conflicts → automatic Warnings.

---

## Blocked Artefact Protocol

Artefact không truy cập được:
- Mark KA phụ thuộc = `[BLOCKED]`, score = 0
- Surface as 🔴 Blocker in report
- KHÔNG infer content từ artefact không có

---

## Report Format

**Status markers:** ✅ Complete · ⚡ Partial · ⚠️ Missing · *(inferred)*

### 📊 Audit Summary

| # | Knowledge Area | Max | Score | Status |
|---|---|:---:|---|---|
| 1 | Feature Identity | 4 | X/4 | ✅/⚡/⚠️ |
| 2 | Objective & Scope | 4 | X/4 | ✅/⚡/⚠️ |
| 3 | Actors & User Roles | 9 | X/9 | ✅/⚡/⚠️ |
| 4 | Preconditions & Postconditions | 9 | X/9 | ✅/⚡/⚠️ |
| 5 | UI Object Inventory & Mapping | 14 | X/14 | ✅/⚡/⚠️ |
| 6 | Object Attributes & Behavior Definition | 18 | X/18 | ✅/⚡/⚠️ |
| 7 | Functional Logic & Workflow Decomposition | 18 | X/18 | ✅/⚡/⚠️ |
| 8 | Functional Integration Analysis | 9 | X/9 | ✅/⚡/⚠️ |
| 9 | Acceptance Criteria | 10 | X/10 | ✅/⚡/⚠️ |
| 10 | Non-functional Requirements | 5 | X/5 | ✅/⚡/⚠️ |
| **Total** | | **100** | | **XX/100** |

### Section-Level Scoring (BẮT BUỘC cuối mỗi Mục 0-9)

```markdown
---
**Đánh giá KA #N ([Tên KA]):** Y/Total — ✅ Clear | ⚡ Partial | ❌ Missing
[1 câu lý do chính]
---
```

### 📋 Unified Gap & Question Report

| ID | Priority | Ref | Question | Why It Matters | Status |
|---|---|---|---|---|---|
| Q1 | High/Medium/Low | Excerpt or "N/A (Missing)" | What needs clarification | Impact on testability | Open |

Priority: 🔴 High = blocker (KA critical = 0). ⚠️ Medium = conflict/partial. 🟡 Low = suggestion/non-critical.
Sort giảm dần theo priority.

### 🟢 What's Good

Bullet 1 dòng / 1 ý. Ghi công các mục ✅ Complete.

### 🧪 Testability Outlook

- **CAN test now:** [areas with enough info]
- **CANNOT test yet:** [areas blocked by gaps + ID gap reference]
- **Focus areas once resolved:** Happy path, alternative scenarios, boundary/validation, error/exception, UI checks, CMR compliance, edge cases

### 📌 Summary & Recommendation

4-6 câu: (a) trạng thái tổng thể, (b) 2-3 hành động chính, (c) đề xuất rõ ràng (tạm dừng / sửa rồi tiếp / tiếp ngay).

---

## Common Gap Patterns

| Gap Pattern | Sign | Example Question |
|---|---|---|
| No preconditions | UC starts from step 1 | "Điều kiện nào phải đúng trước khi [X]?" |
| Vague actor | Only "user" | "Role cụ thể? Hành vi khác nhau giữa role?" |
| Missing validation | Input fields, no constraints | "[X] chấp nhận gì? Min/Max? Error message?" |
| Generic error message | "hiển thị lỗi" | "Thông báo chính xác cho [X]?" |
| AC not measurable | "should"/"can" | "Viết [X] thành pass/fail?" |
| Wireframe element not in UC | CMR cross-check | "Element [X] tương ứng rule nào?" |
| UC không ref CMR | No "Xem CMR-xx" | "UC có áp CMR-xx không?" |
| Partial API failure | Only full-screen error | "Khi [A] lỗi + [B] OK, UI xử lý thế nào?" |
| No debounce | Nav without tap guard | "Tap 2 lần nhanh, nav 2 lần?" |
| i18n no persistence | Language switch, no storage rule | "Ngôn ngữ lưu ở đâu? Giữ sau logout?" |
