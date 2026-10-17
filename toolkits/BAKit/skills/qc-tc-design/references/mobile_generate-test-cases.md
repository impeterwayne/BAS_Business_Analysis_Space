## Generate Test Cases (5-Step Mandatory Workflow & Logic)

### Step 1: Input Analysis (MANDATORY)

- Identify the highest version of all the input files (UC Readiness Report, Scenarios). Always select the highest version number available.
- Read the provided documents and comprehend the use case in preparation for test case design.
- Do NOT generate `testcases` files or write Python scripts in this step.

### Step 2: Detailed Drafting (MANDATORY)

Write a draft file.
Follow  6 distinct phases to design test cases:

#### Phase 1: Screen Initialization (Static States)

The agent must verify the landing state of the screen before any user interaction occurs.

- Empty State (No Data): Verify the visibility and specific default attributes of every object on the screen.
  - Explicitly describe placeholders, empty-state icons, or "No Data" messages.
- Populated State (With Data): Verify the default appearance of all items.
  - Describe the default state (Enabled/Disabled) of all components relative to the data present.

#### Phase 2: Item Interactions (Component States)

Verify the behavior of individual UI components without triggering core business logic.

- Navigation & Reset: Check 'X' icons, 'Cancel' buttons, and 'Close' controls to ensure they exit or reset the view as intended.
- Screen Initialization Triggers: Verify that clicking functional buttons correctly opens or initializes the relevant sub-functions or popups.
- Component Verification:
  - Dropdowns: Verify clickability and ensure the correct list of values is displayed.
  - Textboxes/Buttons: Verify states (Clickable, Disabled, Read-only) based on the design or business rules.
- Navigation Tools: Check pagination behavior (Active page, Next/Prev arrows).

#### Phase 3: Core Functional Testing (Logic Analysis)

Apply systematic testing techniques,  **explicitly categorized by the expected outcome** :

* **Success Scenarios (Happy Path & Positive Flows):**
  * **Standard Happy Path:** Execute the successful flow using valid and complete inputs.
  * **Optional Fields:** Verify successful completion when non-mandatory fields are left empty.
  * **Default Values:** Confirm the system correctly processes default values.
* **Failure Scenarios (Negative Flows & Validations):**
  * **Input Validation:** Block actions for empty mandatory fields, incorrect formats (Email/Phone), or character limits.
  * **Boundary Value Analysis (BVA):** Test at the limits (Min, Max, Min-1, Max+1).
  * **Business Logic Violations:** Actions that violate specific rules (e.g., spending more than available balance).
  * **Exception/Error Handling:** Verify system responses to external errors or technical failures (e.g., Timeout, Server 500).

#### Phase 4: Functional Integration

Verify the synergy between different functions on the same screen.

- Example: How a 'Search' action affects 'Pagination', or how 'Deleting' an item updates the list count in real-time.

#### Phase 5: UI-Level Non-Functional Testing

- Security: Check for sensitive data masking (passwords) and input sanitization (SQL Injection/XSS) in UI fields.
- U X/Loading: Verify the presence of loading indicators (spinners) during data fetching and button debounce to prevent double-clicks.

#### Phase 6: GUI & Visual Compliance (Design-to-Code)

This phase focuses exclusively on visual fidelity:

- Design Alignment: Compare every object against the design file (Figma/Mockup) regarding position, color (HEX codes), spacing, and font sizes.
- Responsive Design: Verify the UI rendering across various screen resolutions and aspect ratios.

**Test Case sorting rules:**
Rule 1: Test cases sheet sorting:

- GUI test cases first, then functional test cases.

Rule 2: Within each type, sort by Phase (1→6):

- Phase 1: Screen Initialization (Static States)
- Phase 2: Item Interactions (Component States)
- Phase 3: Core Functional Testing (Logic Analysis)
- Phase 4: Functional Integration
- Phase 5: UI-Level Non-Functional Testing
- Phase 6: GUI & Visual Compliance (Design-to-Code)

Rule 3: Within each Phase — sort by logical flow:

- Happy path first, then validation, then error/exception cases.

**Test Case Instruction rules:** Following 3 rules below:
Rule 1: Naming & Identifier Rules
TC ID: Always strictly adhere to the format: TC_[XXX] - XXX is incremental number (3 digits).
Example: TC_001, TC_002.

Rule 2: UI Notation Standard
The Agent must utilize specific notations to differentiate on-screen components:
"Double Quotes": Use for interactive components such as Buttons, Menus, Tabs, Icons; or Labels, Placeholders, input values, or selected values from a list. (Example: "Platform" dropdown, "Select platform" placeholder, Nhập email vào "Email" textbox).

Rule 3: Content Logic
File structure:

- Sheet name change from `Test cases` to `Feature Name`.

Test Title:

- [Prefix]: This is the name of the main UI element/object interacted with on the screen for that specific case (e.g., [Textbox Tên tài khoản], [Button Đăng nhập]).
- Must begin with a verification verb (Kiểm tra, Xác nhận).
- Must include the scenario context.
- Example:
  - Kiểm tra UI/UX
  - [Button Đăng nhập] Kiểm tra khi double-click button "Đăng nhập",
  - [Button Đăng nhập] Kiểm tra đăng nhập thành công khi: Đổi mật khẩu thành công sau khi được yêu cầu đổi mật khẩu định kì",
  - [Textbox Email] Kiểm tra khi để trống trường Email.
  - Kiểm tra đăng nhập bằng mật khẩu mới sau khi nhận được email có chứa mật khẩu.

Pre-conditions: Must begin with an action, describes the actions that must be performed before executing the test case.
Example:

- Đăng nhập vào hệ thống Admin tại [URL].
- Điều hướng đến màn hình Danh sách Sản phẩm.
- Nhấp vào nút "Tạo" và đợi cửa sổ bật lên "Tạo Sản phẩm" mở hoàn toàn.

Test Steps (Action-Oriented):

- Each step must be a single, discrete action on the UI.
- Use active imperative verbs: Truy cập, Nhấp vào, Chọn, Nhập, Di chuột qua, Chú ý vào., Tại màn hình "Login",...
- Example:
  - 1. Tại màn hình Đăng nhập, click vào textbox "Tên đăng nhập"

    - 1.1 Nhập kí tự chữ (không phân biệt chữ hoa, chữ thường) (Eg:Thao)
    - 1.2 Nhập kí tự số (Eg:123456)
    - 1.3 Nhập kí tự đặc biệt (Eg:!@#$%^&*())
    - 1.4 Nhập kí tự chữ và số (Eg:Thao123456)
  - 2. Nhấp vào "Đăng nhập" button.

Expected Result (UI Verification):

- MUST begin with a number of step (Eg: 1. Kết quả mong đợi)
- Do not write generic statements like "Hệ thống hoạt động bình thường".
- Must explicitly describe the changed state of the UI:
  - Hiển thị một thông báo (explicitly stating the message content).
  - Mở/Đóng một popup/màn hình.
  - Trạng thái của các trường (enabled, disabled, displaying placeholder).
  - Quy tắc hiển thị (What order is it sorted in? What is the color?).
  - Phản ứng của hệ thống (cho phép nhập/không cho phép nhập).

### Step 3: Pre-Execution Traceability Matrix

- Inside the draft file, build the `Requirement Traceability Matrix` mapping the file requirement ACs to the drafted Test Case IDs.
- Ensure 100% test coverage before progressing.

### Step 4: Output Generation (.xlsx)

- Only after Steps 1-3 are verified, proceed to generate the `.xlsx` file by writing a script to populate the `Testcase_template.xlsx` using the verified draft data.
- Check the output directory for existing versions. If `v[N].xlsx` exists, increment the version to `v[N+1].xlsx`. Never overwrite existing files.
- Check `docs/qc/testcases/[UC-ID]/` for existing versions. Start at `v1`, increment if files exist. Never overwrite.
- Copy the template from: `.agents/skills/tc-design/templates/Testcase_template.xlsx`
- Write test cases to the correct sheet:
  - Register sheet → Functional test cases (start row 2)
  - Columns: `A=TC ID | B= Test Title| C= Preconditions| D=Steps | E=Expected Result | F=Priority`

### Step 5: Write Summary

Save a summary file in the same folder as the Excel. Include:

```markdown
## ✅ Test Design Complete

| Artifact | File | Count |
|---|---|---|
| Test Cases | [filename].xlsx | X cases (Y GUI / Z FUNC) |

### Requirement Traceability Matrix
| AC ID | Acceptance Criteria | Linked Test Cases | Status |
|---|---|---|---|
| AC-01 | ... | TC_UC001_GUI_01, TC_UC001_GUI_02 | Covered |
```
