# Rà soát mức sẵn sàng Use Case (UC Readiness Review)
**Mẫu đánh giá sẵn sàng cho Functional / Black-box Test (Functional / Black-box Test Readiness Template)**

---

> **How to use this template**
>This template defines the minimum information QA testers need to begin test case design.
>Fill out all sections completely before handing off to QA. Do not leave any field blank — if a section truly does not apply, write N/A and explain why.
>
> **Completion status conventions:**
> - ✅ **Complete** = section is fully populated and no longer ambiguous
> - ⚡ **Partial** = contains content but requires further clarification
> - ⚠️ **Missing** = absent — BLOCKER, cannot start test design
>
> **Language:** write the content in Vietnamese with English terminology (`ba-global-rules`); quote on-screen labels and messages verbatim in their original language with an English translation in parentheses. Keep the bilingual headings `Tiếng Việt (English)` as they are.
>
> **Used by:** Mobile Single UC audits (`mobile_first-audit-workflow.md` Step 9) and Web/Report UC audits (`first-audit-workflow.md`). A Full SRS / module audit uses `mobile_srs_readiness_review_template.md` instead.

---

## Tóm tắt tính năng (Feature Brief)

*(Summarize the feature based on all read documents. Include: what the feature is, who uses it, how it works, key business rules, and known exceptions.)*

---

## Kết luận sẵn sàng (Readiness Verdict)

| Điểm tổng (Overall Score) | Kết luận (Verdict) |
| ------------- | ------- |
| `XX / 100` | [✅ READY / ⚠️ CONDITIONALLY READY / ❌ NOT READY] |

---

## 0. Thông tin tài liệu (Document Metadata)

| UC-ID | Feature Name | Version | Status |
|-------|-------------|---------|--------|
| *(e.g., UC-12)* | *(e.g., Service Menu List)* | *(e.g., v1.0)* | *(Draft / In Review / Finalized)* |

| Author / BA | Approved By | Date Created | Last Updated |
|-------------|-------------|--------------|--------------|
| *(Name)* | *(Name & Role)* | *(YYYY-MM-DD)* | *(YYYY-MM-DD)* |

---

## 1. Mục tiêu & Phạm vi (Objective & Scope)

### 1.1 Mục tiêu (Objective)
*(Describe WHY this feature exists. What business problem does it solve? Who benefits? Write 1–3 concise sentences.)*

### 1.2 Trong phạm vi (In Scope)
*(List every function / sub-use-case covered in this UC. Use one line per item or bullet points.)*

### 1.3 Ngoài phạm vi (Out of Scope)
*(Clearly list what is NOT covered in this UC. If nothing is excluded, write "None.")*

---

## 2. Tác nhân & Stakeholder (Actors & Stakeholders)

| Actor | Type | Role & Permissions |
|-------|------|-------------------|
| *(e.g., Admin User)* | *(Primary / System)* | *(Describe what this actor can do in the UC.)* |
*(Add rows as needed)*

---

## 3. Tiền điều kiện & Hậu điều kiện (Preconditions & Postconditions)

### 3.1 Tiền điều kiện (Preconditions)
*(List every condition that must be true before the flow begins. One condition per line.)*
- *(e.g., The admin has successfully authenticated.)*

### 3.2 Hậu điều kiện (Postconditions)
| After completing... | System state / Postcondition |
|--------------------|------------------------------|
| *(e.g., Add record)* | *(e.g., New record appears at the top of the list. Success message is displayed.)* |
*(Add rows as needed)*

---

## 4. Danh mục & ánh xạ thành phần UI (UI Object Inventory & Mapping)

> **Instructions:** Extract and catalog **every atomic UI component** from the Design Mockup. **One component = one row.** Do NOT collapse multiple inputs/buttons/columns into a single row.
>
> **Required columns per row:** Section grouping · exact Label (verbatim) · Component Type · Required (Yes/No) · Default value · Placeholder · Enum values (full list) · Description / constraints / source mockup file.
>
> **Coverage rule:** For each design image, the number of rows mapped to it must be ≥ the count of visible atomic elements in that image. If you find yourself writing "(N fields)" or "(4 values)" you are violating the granularity rule — expand them.

| # | Screen / Section | Label (verbatim) | Type | Required | Default | Placeholder | Enum values | Description / Constraint | Source |
|---|------------------|------------------|------|----------|---------|-------------|-------------|--------------------------|--------|
| *(e.g., 1)* | *(e.g., Form Tạo mới > Phần I > Nhà đầu tư #1)* | *(e.g., "Email người làm báo cáo")* | *(e.g., Text input)* | *(Yes)* | *(—)* | *(e.g., "example@email.com")* | *(N/A)* | *(e.g., Auto-filled from API; editable; mandatory before submit)* | *(e.g., Tạo mới báo cáo.png)* |
| *(e.g., 2)* | *(e.g., Form Tạo mới > Phần III)* | *(e.g., "Tiến độ thực hiện dự án")* | *(Radio group)* | *(Yes)* | *(Đúng tiến độ)* | *(—)* | *("Đúng tiến độ" / "Chậm tiến độ" / "Gặp khó khăn" / "Không có khả năng triển khai")* | *(Selecting any value ≠ default reveals the "Lý do" textarea)* | *(Tạo mới báo cáo.png)* |
| *(e.g., 3)* | *(e.g., Danh sách > Bảng BC > Cột Hành động)* | *(e.g., Icon "Xóa")* | *(Action icon)* | *(N/A)* | *(—)* | *(—)* | *(N/A)* | *(Visible only when row status = "Lưu nháp"; opens delete confirm popup)* | *(Xem danh sách báo cáo.png)* |

> Add one row per: input field · dropdown · radio option group · checkbox · date picker · button · action icon · table column (preserving multi-level headers) · table row label · tab · tooltip · badge · status chip · page title · subtitle · hint banner · empty-state message · loading spinner · toast · popup.

---

## 5. Thuộc tính & hành vi của thành phần (Object Attributes & Behavior Definition)

> **Instructions:** Determine the state and response of each UI object based on specific system conditions.

| Object / Component | System States | Interaction Matrix | Object Behavior (Data/State Change Context) |
|--------------------|---------------|--------------------|---------------------------------------------|
| *(e.g., Save Button)* | *(e.g., Disabled by default until all mandatory fields are filled.)* | *(e.g., Click: Triggers validation & submit. Hover: Shows tooltip.)* | *(e.g., Becomes disabled and shows a spinner while the API request is processing.)* |
| *(e.g., Type Dropdown)* | *(e.g., Enabled. Default value: 'Standard'.)* | *(e.g., Click: Expands list.)* | *(e.g., When changed to 'Custom', the 'Additional Details' text area becomes visible.)* |
*(Add rows as needed)*

---

## 6. Logic chức năng & phân rã luồng (Functional Logic & Workflow Decomposition)

> **Instructions:** Analyze in detail the business processes of each function available on the feature screen. Duplicate the block below for each major sub-function (e.g., 6.1 View List, 6.2 Create Record).

### 6.1 Tên chức năng (Function Name): *(e.g., Create New Record)*

**A. Workflows**
| Step | Actor | Action | System Response (Happy Path) | Alternative Flows | Exception & Error Flows |
|------|-------|--------|------------------------------|-------------------|-------------------------|
| 1 | *Admin* | *Clicks 'Add' button* | *System opens the creation form.* | *N/A* | *N/A* |
| 2 | *Admin* | *Enters data & clicks 'Save'* | *Data is saved. Popup shows "Success". List refreshes.* | *User clicks 'Cancel': Form closes without saving.* | *Mandatory field empty: Save is blocked, inline error "Field required" shown.* |

**B. Business Rules & Validations**

> If the source UC references an error code (e.g., `MSG_E001`) or a common business rule ID (e.g., `BR-012`, `BR_xxx`), do NOT keep the bare code here — resolve it to the **exact original text** from the project's common source: the global business rules / message catalog of `docs/project-srs.md` (legacy `docs/project-fsd.md`), or, in legacy Web/Report projects, `docs/BA/SRS-report/CMR/Bảng thông báo lỗi.docx` (messages) / `docs/BA/SRS-report/CMR/Quy tắc nghiệp vụ chung.docx` (rules). Write the full text in the cell and keep the original code in parentheses for traceability.

| Field / Object | Required | Format / Constraint | Min / Max | Error Message *(exact text)* |
|----------------|----------|---------------------|-----------|-------------------------------|
| *(e.g., Name)* | *Yes* | *Alphanumeric only* | *1 / 50* | *"Name is required" / "Max 50 chars"* |
| *(e.g., Mã báo cáo)* | *Yes* | *Alphanumeric, unique* | *— / 20* | *"Mã báo cáo đã tồn tại trong hệ thống" (MSG_E001)* |

**C. UI/UX Feedback**

> Same rule as 6.1.B: if the UC references a code, expand to full text from the common file and keep the code in parentheses.

* **Loading States:** *(e.g., Spinner on 'Save' button during submission.)*
* **Toast Messages:** *(e.g., Success: "Record created successfully". Error: "Failed to connect to server".)*
* **Error Codes:** *(e.g., `MSG_E020` → "Hệ thống đang bận, vui lòng thử lại sau" (The system is busy, please try again later) — exact text from the message catalog.)*

---

## 7. Phân tích tích hợp chức năng (Functional Integration Analysis)

> **Instructions:** Analyze and evaluate the linkages and influences between the cataloged functions, acting as an integration check between functions.

| Trigger Function / Action | Impact Analysis (Cross-function influence) | Data Consistency Verification |
|---------------------------|--------------------------------------------|-------------------------------|
| *(e.g., Delete a Parent Category)* | *(e.g., Indirectly affects the 'View List' function: all child items associated with this category must be hidden or reassigned.)* | *(e.g., Verify that the dropdown list in the 'Add Record' form immediately reflects the deletion of the category.)* |
| *(e.g., Change Item Status to Inactive)* | *(e.g., Item can no longer be selected in the reporting module.)* | *(e.g., Verify the dashboard counters update automatically to exclude the inactive item.)* |
*(Add rows as needed)*

---

## 8. Tiêu chí chấp nhận (Acceptance Criteria)

> **Instructions:** Acceptance criteria must be written in a verifiable pass/fail format, using the Given / When / Then structure.

| AC # | Scenario | Given *(precondition)* | When *(user action)* | Then *(expected result)* |
|------|----------|------------------------|----------------------|--------------------------|
| AC-01 | *(e.g., Create - Happy Path)* | *(e.g., Admin is on the Add form with valid data.)* | *(e.g., Admin clicks Save.)* | *(e.g., "Success" message appears. Record is added to the list.)* |
*(Add ACs for every flow and business rule...)*

---

## 9. Yêu cầu phi chức năng (Non-functional Requirements)

| Category | Requirement | Source / Reference |
|----------|-------------|-------------------|
| *(Performance)* | *(e.g., Search results must load within 2 seconds.)* | *(e.g., SLA doc)* |
| *(Security)* | *(e.g., CSRF protection is enforced.)* | *(e.g., Security policy)* |
| *(Browser Compatibility)* | *(e.g., Chrome, Edge, Safari latest versions.)* | |
*(Add categories as needed)*

---

## 10. Câu hỏi mở & phụ thuộc (Open Questions & Dependencies)

### 10.1 Câu hỏi mở (Open Questions)
| # | Question / Issue | Context | Owner | Status |
|---|-----------------|---------|-------|--------|
| Q1 | *(e.g., Is drag-and-drop reordering in scope?)* | *(e.g., Wireframe conflict.)* | *(e.g., PO)* | *(Open)* |

### 10.2 Phụ thuộc (Dependencies)
*(List any UC, feature, API, or external system that this UC depends on.)*

### 10.3 Căn chỉnh Product Decision & sơ đồ (Product Decision & Diagram Alignment)

> **Instructions:** Mobile audits only — Web/Report audits write `N/A`. Summarize `mobile_first-audit-workflow.md` Steps 6–7 for this UC. Not scored separately in the 110-point table; every gap here also goes into the Unified Gap & Question Report, and an open P0 makes the verdict NOT READY.

| Hạng mục (Item) | Nguồn (Source) | Trạng thái (Status) | Ghi chú (Notes) |
|-----------------|----------------|---------------------|-----------------|
| *(e.g., PD-003 MODIFY — OTP resend limit)* | *(e.g., `docs/BA/decisions/dang-nhap-otp_decisions_20261010_v2.md`)* | *(✅ Reflected / ⚡ Partial / ⚠️ Missing / 🔴 Conflict)* | *(e.g., UC still shows the reference limit of 3 resends.)* |
| *(e.g., User Flow UF-AUTH-001)* | *(e.g., `docs/diagrams/auth/uf-auth-001.md`)* | *(✅ Covers UC / ⚠️ Journey missing)* | *(e.g., Entry from deep link not shown.)* |
| *(e.g., Activity ACT-AUTH-002)* | *(e.g., `docs/diagrams/auth/act-auth-002.md`)* | *(✅ / ⚠️ Branch missing)* | *(e.g., OTP expired branch absent.)* |
| *(e.g., Sequence)* | *(—)* | *(N/A — simple UC, not required)* | |

---

## 11. Lịch sử thay đổi (Change Log)

| Version | Date | Author | Summary of Changes |
|---------|------|--------|--------------------|
| *(e.g., v2.0)* | *(YYYY-MM-DD)* | *(Author name)* | *(e.g., Restructured template to include UI mapping and integration analysis.)* |

---

*UC Readiness Template v3.0 — For QA Test Design*