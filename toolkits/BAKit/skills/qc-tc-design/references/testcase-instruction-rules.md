## Testcase Instruction Rules

### Language & Encoding (MANDATORY)

**Rule 0a — Preserve Vietnamese diacritics.** All Vietnamese text written into the test cases (Test Title/Summary of test cases, Pre-condition, Step, Expected Result, Function name, Sub-function) MUST preserve the original diacritics from the source UC document. Do NOT strip, normalize, or transliterate to ASCII.

- ✅ Correct: `"Đăng nhập hệ thống bằng tài khoản NĐT"`, `"Kiểm tra màn hình khởi tạo"`, `"Truy cập menu Báo cáo định kỳ 6 tháng ĐTRNN"`
- ❌ Wrong: `"Dang nhap he thong bang tai khoan NDT"`, `"Kiem tra man hinh khoi tao"`, `"Truy cap menu Bao cao dinh ky 6 thang DTRNN"`

**Rule 0b — Forbidden transformations.** Do NOT use any of the following on Vietnamese strings before writing to the xlsx:

- `unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()` — strips dấu
- `unidecode(s)` / `text_unidecode(s)` — strips dấu
- Manual replacement maps (`'à' → 'a'`, `'Đ' → 'D'`, …)
- `.encode('latin-1', 'ignore')` / `.encode('cp1252', 'ignore')` — corrupts non-Latin-1 chars
- Any transliteration library

**Rule 0c — Use the shared converter; do NOT write a new script.** xlsx generation is performed by `.agents/skills/qc-tc-design/scripts/md_to_xlsx.py` (see `generate-test-cases.md` Step 4 / `update-test-cases.md` Step 5). The agent invokes this script and does NOT write its own openpyxl populator. The script is UTF-8, opens md with `encoding='utf-8'`, writes Vietnamese as Unicode literals, and self-verifies dấu before exit. If you must extend the script, preserve these properties — never add `# -*- coding: cp1252 -*-`, never normalize/transliterate Vietnamese.

**Rule 0d — Self-verification before delivery.** After generating the xlsx, open it and spot-check at least 3 rows containing Vietnamese text. If any cell shows: ASCII-only Vietnamese (no dấu), `?` boxes, mojibake (e.g., `Ä\x90`, `Ã©`), or any character that doesn't match the source — STOP, debug the script, regenerate. Do NOT deliver a partially-stripped output.

### Sheet Layout & Section Headers (MANDATORY)

The template is a multi-sheet workbook (`Overview`, `Test plan&report`, `Revisions`, `Test Cases_Template`, `Template báo cáo`, `WFDesign`). Test cases are written ONLY into the `Test Cases_Template` sheet — the other sheets MUST stay untouched.

**Columns** (matches the template `Test Cases_Template` sheet, header rows 6-7 — pin by column letter; the project uses one fixed template):

`A=ID_TC | B=Test Title/Summary of test cases | C=Pre-condition | D=Step | E=Expected Result | F=Priority | G=Round 1 - iOS / Test Result | K=Round 1 - Android / Test Result`

**Reserved header block (rows 1-9) — leave untouched.** Rows 1-5 hold the workbook info (System Name, Module, Function Name, Created By, Execute By) plus the summary `=COUNTIF(...)` formulas. Row 6 holds the column titles (`ID_TC`, `Title`, …). Row 7 holds the sub-headers (`Test Result`, `PIC`, `Execute Date`, `ID Bug` …). Do NOT delete or rewrite any of rows 1-9 — the COUNTIF formulas reference fixed ranges starting at row 10 (e.g. `G10:G714`, `K10:K714`) and any row shift will silently break them.

**Data area starts at row 10.** GUI and Functional test cases are written into the same `Test Cases_Template` sheet, starting from row 10, separated by section header rows. The agent MUST insert these header rows in addition to the test case rows.

**Test result default values.** For every test case row (NOT for header rows), the converter MUST fill column G and column K with the literal value `"Untested"`. These are the Round-1 Window - Chrome and Round-1 Window - MS Edge Test Result columns; their default state is `Untested` so the summary formulas in rows 1-5 count the new TCs correctly. Header rows (Screen / GUI / FUNC) MUST NOT have any value in G or K.

**Within GUI section, sort in this order (4 buckets):**

1. **Screen Initialization** — case khởi tạo màn hình: initial render, default state, empty / populated state of every object on the screen.
2. **Item Interactions** — kiểm tra từng đối tượng UI trên màn hình: textboxes, dropdowns, buttons, icons, labels — clickability, default state, list values, enabled / disabled, placeholder.
3. **Common UI cases** — case thao tác chung của browser / keyboard: F5 / Refresh, Back / Next browser, Tab / Shift+Tab, Enter, Backspace, zoom in / zoom out, message consistency.
4. **UI elements verify** — visual fidelity vs design: vị trí, màu sắc (HEX), spacing, font size, responsive across resolutions.

**Within FUNC section, sort by logical flow:** Happy path first → validation → error / exception cases.

**Hierarchy (use Roman numerals I, II, III… — one per screen / sub-UC):**

| Header level | Pattern                                                                  | Where it appears                         |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------- |
| Screen       | `<RomanNumeral>. Màn hình: <tên màn hình>`                        | One row per screen / sub-UC              |
| GUI section  | `<RomanNumeral>.1. Kiểm tra UI/UX của màn hình: <tên màn hình>` | Immediately below the screen header      |
| FUNC section | `<RomanNumeral>.2. Kiểm tra FUNC của màn hình: <tên màn hình>`  | After all GUI test cases for that screen |

**Header row format:**

- Header text goes in column **B** (`Test Title/Summary of test cases`).
- All other columns on the header row stay empty (no TC ID, no Pre-condition, no Step, no Expected Result, no Priority).
- Header rows are NOT counted as test cases — they do not consume TC ID numbers and they are not subject to Rule 2 (`TC_XXX`).
- The screen name in the header MUST match the screen name used in Section 4 of the audited UC file. Do NOT paraphrase or translate.

**Example 1 — Single-screen UC ("Danh sách báo cáo"):**

```
I. Màn hình: Danh sách báo cáo
I.1. Kiểm tra UI/UX của màn hình: Danh sách báo cáo
TC_001 | GUI  | Kiểm tra màn hình khởi tạo            | …
TC_002 | GUI  | Kiểm tra trạng thái mặc định bộ lọc    | …
…
I.2. Kiểm tra FUNC của màn hình: Danh sách báo cáo
TC_012 | FUNC | Kiểm tra hiển thị các kỳ báo cáo      | …
TC_013 | FUNC | Kiểm tra trạng thái nộp báo cáo       | …
…
```

**Example 2 — Multi-screen UC (UC161-166 with 3 screens):**

```
I. Màn hình: Danh sách báo cáo
  I.1. Kiểm tra UI/UX của màn hình: Danh sách báo cáo
  …GUI test cases for screen I
  I.2. Kiểm tra FUNC của màn hình: Danh sách báo cáo
  …FUNC test cases for screen I
II. Màn hình: Tạo mới báo cáo
  II.1. Kiểm tra UI/UX của màn hình: Tạo mới báo cáo
  …GUI test cases for screen II
  II.2. Kiểm tra FUNC của màn hình: Tạo mới báo cáo
  …FUNC test cases for screen II
III. Màn hình: Chi tiết báo cáo
  III.1. Kiểm tra UI/UX của màn hình: Chi tiết báo cáo
  …GUI test cases for screen III
  III.2. Kiểm tra FUNC của màn hình: Chi tiết báo cáo
  …FUNC test cases for screen III
```

### Test Case Writing rules:

Rule 0e: Navigation Steps (MANDATORY)

Every test case MUST include navigation step(s) as the FIRST step(s) to reach the screen under test. The actual test action starts AFTER all navigation steps. This rule ensures each TC is independently executable.

**Navigation step patterns by screen depth:**

| Screen depth | Navigation steps required |
|---|---|
| Level 1 — Main screen (e.g., Danh sách báo cáo) | Step 1: `Nhấn vào mục "[Menu Code]" trên menu bar` |
| Level 2 — Sub-screen opened from main (e.g., Lập báo cáo, Xem chi tiết, Chỉnh sửa) | Step 1: `Nhấn vào mục "[Menu Code]" trên menu bar`<br>Step 2: `Nhấn nút "[Button name]" tại [context]` |
| Level 3 — Popup opened from sub-screen or main (e.g., Popup Import, Popup Xác nhận) | Step 1: `Nhấn vào mục "[Menu Code]" trên menu bar`<br>Step 2: `Nhấn nút "[Button name]" tại [context]` |

**Rules:**
- The test action step number = (number of navigation steps) + 1. For a Level-1 screen, the action is step 2. For a Level-2 screen, the action is step 3.
- Expected Result MUST reference the action step number, NOT step 1. Example: if action is step 3, Expected Result starts with `3.`.
- Do NOT skip navigation steps even if the Pre-condition implies the screen is already open. Each TC must be independently reproducible.
- The `[Menu Code]` is UC-specific (e.g., `KTCN11`, `KTCN15`). Always use the correct code for the UC being tested, as confirmed by the user or documented in the audited file.

**Example — Level 1 (main screen):**
```
Step:
  1. Nhấn vào mục "KTCN15" trên menu bar
  2. Tại thanh tìm kiếm, kiểm tra placeholder
Expected Result:
  2. Hiển thị placeholder "Tìm kiếm theo mã báo cáo"
```

**Example — Level 2 (sub-screen):**
```
Step:
  1. Nhấn vào mục "KTCN15" trên menu bar
  2. Nhấn nút "Lập báo cáo" tại kỳ báo cáo hợp lệ
  3. Kiểm tra trường dữ liệu "Tên dự án đầu tư"
Expected Result:
  3. Định dạng: dropdown và cho phép chọn 1 giá trị. Hiển thị danh sách dự án.
```

**Example — Level 2 (popup from main):**
```
Step:
  1. Nhấn vào mục "KTCN15" trên menu bar
  2. Nhấn nút "Import" tại kỳ báo cáo hợp lệ
  3. Kiểm tra UI popup
Expected Result:
  3. Hiển thị popup "Import báo cáo" với đầy đủ các thành phần: ...
```

---

Rule 1: UI Notation Standard
The Agent must utilize specific notations to differentiate on-screen components:
"Double Quotes": Use for interactive components such as Buttons, Menus, Tabs, Icons; or Labels, Placeholders, input values, or selected values from a list. (Example: "Platform" dropdown, "Select platform" placeholder, Nhập email vào "Email" textbox).

Rule 2: Content Logic
TC ID: Always strictly adhere to the format: TC_[XXX] - XXX is incremental number (3 digits).
Example: TC_001, TC_002.

Test Title:

- Must begin with a verification verb (Kiểm tra, Xác nhận).
- Must include the scenario context.
- Example for GUI test cases:

  - Kiểm tra màn hình khởi tạo
  - Kiểm tra UI của màn hình
  - Kiểm tra khi zoom in/zoom out màn hình
  - Kiểm tra dữ liệu với độ dài tối đa (maxlength)
  - Kiểm tra nhấn phím F5
  - Kiểm tra nút Back của trình duyệt
  - Kiểm tra nút Next của trình duyệt
  - Kiểm tra nút Refresh của trình duyệt
  - Kiểm tra thao tác Tab và Shift + Tab
  - Kiểm tra phím Backspace
  - Kiểm tra phím Enter
  - Kiểm tra tính nhất quán của message
- Example for Functional test cases:

  - Kiểm tra

Pre-conditions: Must begin with an action, describes the actions that must be performed before executing the test case.
Example:

- Đăng nhập vào hệ thống Admin tại [URL].
- Điều hướng đến màn hình Danh sách Sản phẩm.
- Nhấp vào nút "Tạo" và đợi cửa sổ bật lên "Tạo Sản phẩm" mở hoàn toàn.

Test Steps (Action-Oriented):

- Each step must be a single, discrete action on the UI.
- Use active imperative verbs: Truy cập, Nhấp vào, Chọn, Nhập, Di chuột qua, Chú ý vào.
- Example:
  "1. Tại màn hình Đăng nhập, click vào textbox "Tên đăng nhập"
  1.1 Nhập kí tự chữ (không phân biệt chữ hoa, chữ thường) (Eg:Thao)
  1.2 Nhập kí tự số (Eg:123456)
  1.3 Nhập kí tự đặc biệt (Eg:!@#$%^&*())
  1.4 Nhập kí tự chữ và số (Eg:Thao123456)

2. Nhấp vào "Đăng nhập" button.
3. Kiểm tra trường "Tên đăng nhập""

Expected Result (UI Verification):

- MUST begin with a number of step (Eg: 1. Kết quả mong đợi)
- Do not write generic statements like "Hệ thống hoạt động bình thường".
- Must explicitly describe the changed state of the UI:
  - Hiển thị một thông báo (explicitly stating the message content).
  - Mở/Đóng một popup/màn hình.
  - Trạng thái của các trường (enabled, disabled, displaying placeholder).
  - Quy tắc hiển thị (What order is it sorted in? What is the color?).
  - Phản ứng của hệ thống (cho phép nhập/không cho phép nhập).
- Example for GUI Test cases:
  "2. Hiển thị màn hình "Danh sách báo cáo" giống design (Refer Item I. Danh sách Báo cáo tại sheet WF/Design)
- Thanh tìm kiếm: mặc định trống, cho phép nhập dữ liệu
- Dropdown [Năm]: mặc định trống, cho phép chọn dữ liệu
- Dropdown [Trạng thái kỳ]: mặc định trống, cho phép chọn dữ liệu
- Dropdown [Trạng thái hồ sơ]: mặc định trống, cho phép chọn dữ liệu
- Danh sách các kỳ báo cáo, gồm các cột:

+ Năm báo cáo
+ Trạng thái kỳ báo cáo

- Trong từng kỳ báo cáo, gồm các cột

+ Mã bộ hồ sơ
+ Số báo cáo đang xử lý
+ Trạng thái hồ sơ
+ Ngày cập nhật/nộp
+ Hành động

- Phân trang theo kỳ báo cáo:

+ Default: 10 kỳ báo cáo / trang
+ Dropdown chọn số kỳ hiển thị: mặc định là 10"

- Example for Functional test cases:
  "3. Hiển thị lỗi dưới chân trường dữ liệu: "Tên đăng nhập". Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu."

### Test cases example: read the file `.agents/skills/qc-tc-design/references/Testcasse-refer.md`
