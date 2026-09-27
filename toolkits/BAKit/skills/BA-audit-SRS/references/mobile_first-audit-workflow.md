## First Audit Workflow

1. **Ingest & Understand** — read all provided artefacts, understand the feature
2. **Audit** — score completeness across all required knowledge areas
3. **Report** — deliver a structured readiness report with verdict, score, gaps, and suggestions

## Supported Artefact Types

Accept any combination of:

| Type | Examples |
| --------------------------- | -------------------------------------------------- |
| Requirements / Use Case doc | UC spec, feature brief, BRD, user story |
| UI Design / Wireframe | Figma export, mockup image, screen flow PDF |
| API Specification | REST API doc, Swagger/OpenAPI, integration spec |
| Business Process doc | Workflow diagram, BPMN, process description |
| Design document | Technical design, system design, architecture note |
| Other supporting docs | Data dictionary, error code list, email templates |

>**PHẠM VI TEST — ĐỌC TRƯỚC KHI BẮT ĐẦU:**
> Dự án này chỉ kiểm thử **phía Mobile Client**. Mọi phân tích trong workflow này đều phải được nhìn qua lăng kính "client hiển thị/xử lý thế nào?" — KHÔNG phải "server/API làm gì?".
> - Nếu gặp mô tả API (endpoint, payload, response): chỉ dùng làm **context** để hiểu hành vi phía client.
> - KHÔNG audit logic API, KHÔNG đánh giá tính đúng đắn của backend, KHÔNG đặt câu hỏi về xử lý server-side.
> - Nếu phát hiện gap thuộc tầng API/backend: **ghi nhận vào báo cáo nhưng KHÔNG đề xuất test case cho tầng đó**.

All file formats are supported: plain text, Markdown, PDF, Word (.docx), images (PNG/JPG).

## Phase 1 — Ingest & Understand

### Step 1: Read all artefacts

<!-- ✏️ CHANGED: Mandatory reading order explicitly defined -->
**Mandatory reading order:**

1. Read Common Rules (CMR) document first — this is the foundation for detecting conflicts
2. Read the Use Case document in full
3. Analyze Wireframe / Design Mockup (if available)
4. Read API Specification (if available)

> ⚠️ **LƯU Ý PHẠM VI TEST:**
> API Specification chỉ đọc để **hiểu context hành vi phía client**. KHÔNG audit logic API, KHÔNG đánh giá tính đúng đắn của endpoint/payload/response phía backend. Khi requirement mô tả API → chỉ tập trung vào cách client hiển thị/xử lý kết quả trả về.

Input-type routing:
| Input type           | Action                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL provided         | Invoke the `.claude\skills\document-extraction\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on URL files.   |
| PDF provided         | Invoke the `.claude\skills\pdf\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on PDF files.                   |
| DOCX provided        | Invoke the `.claude\skills\docx\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on DOCX files.                 |
| File path provided   | Read the file using the appropriate tools.                                                                                                              |
| Image file provided  | Use the Read tool — it renders images inline; describe all visible UI elements, labels, states, and flows in detail.                                    |
| Pasted text provided | Treat as a document; parse directly from the prompt.
DO NOT score any knowledge area before finishing all documents.

### Step 2: Synthesise a Feature Understanding

After fully comprehending all provided documents, including analyzing the design images (and any screen mockups embedded within the specification documents), proceed to synthesize the requirement content according to the following 5 sections:

**1. UI Object Inventory & Mapping**

Build a complete table of all UI components from the Wireframe, mapped to the UC document:

| # | Component Name | Type | In UC? | In Wireframe? | Notes |
| --- | ------------------- | ------------- | ------ | ------------- | ----- |
| 1 | Hamburger Button (☰) | Button (Icon) | ✅ | ✅ | |
| ... | | | | | |

<!-- ✏️ CHANGED: Added mandatory checks per component -->
**Mandatory checks for each component:**
- Is there a display state definition (Enabled / Disabled / Hidden / Read-only)?
- Is there an action rule for tap / click?
- Is the label name consistent between Wireframe and UC document?

<!-- ✏️ NEW SECTION: CMR Cross-Check -->
**CMR Cross-Check — Common Rules Application Verification**

After completing the UI Inventory, cross-reference each component against CMR:

- Any row where the UC doc does not mention an applicable CMR → mark as ⚠️ Partial, create a confirmation question.
- Any row where there is a conflict between UC and CMR → mark as 🔴 Conflict, create a High-priority question.

Sub-categories:
- Data Display Structure (Grid/List/Table): Identify the list of data columns, pagination limit, default sorting logic, and empty state display.
- Control System (Filters/Search Fields): Identify the initial state, available Dropdown values, and input data constraints of search fields.
- Navigation and Action Components (Buttons/Controls): Define the position and role of all functional buttons on the interface.
- All other components present on the interface.

**2. Object Attributes & Behavior Definition**

Determine the state and response of each UI object based on specific system conditions.

- System States: Define the default state of the object (Enabled, Disabled, Hidden, Read-only) based on variables such as: account privileges (Permissions), input data conditions, or the current data state of the system.
- Interaction Matrix: Specify the possible interaction actions (Click, Hover, Drag & Drop) and the corresponding system responses for each object.
- Object Behavior: Define how the object reacts when there is a data change or a state change in related objects.

<!-- ✏️ NEW SECTION: Edge Case Checklist -->
**Edge Case Checklist — Automated Edge Case Verification**

For each object in the matrix above, the following edge case groups MUST be checked. If the UC doc does not mention them → record as a gap, create a question:

**Group A — Extreme Data States:**
- Name/text field overflow → Does the UC doc have a truncate / wrap rule?
- Numeric value = 0, negative, or very large (max int) → How is it displayed?
- Empty list (0 items) vs. exactly 1 item vs. exactly max items (e.g., exactly 5 news items)
- Null / undefined data from API → How does the UI handle it? Is there a placeholder?

> ⚠️ **LƯU Ý PHẠM VI TEST:**
> Mục này chỉ kiểm tra cách **client hiển thị** khi nhận dữ liệu null/undefined từ API (placeholder, empty state). KHÔNG kiểm tra tại sao API trả null.

**Group B — Network & API States:**

> ⚠️ **LƯU Ý PHẠM VI TEST:**
> Các mục trong Group B chỉ kiểm tra **hành vi hiển thị/xử lý phía client** khi gặp lỗi từ API (loading, timeout, retry, error message). **KHÔNG** kiểm thử bản thân API (endpoint, status code, payload). Giả định API trả đúng spec, tập trung vào cách app phản hồi.

- API responds slowly (> 5s but < 30s timeout) → Does skeleton/loading display correctly?
- Partial API failure (1 of multiple API calls fails, the rest succeed) → Does the UI handle independently or block the entire screen?
- Duplicate API calls (double tap, back then re-enter) → Is there debounce / prevent duplicate call? (see CMR-13)
- Network loss mid-load (partially loaded) → Is already-loaded data preserved?

**Group C — Abnormal User Interactions:**
- Rapid consecutive taps on the same button → Is multiple navigation blocked?
- Drag & Drop to an area outside the screen / outside the allowed zone → How is it handled?
- Screen rotation to landscape → Does the layout break? (if app supports landscape)
- Physical Back button (Android) when a modal/sidebar is open → Close modal or exit screen?

**Group D — Permissions & Session:**
- Session expires while on the screen → Redirect to login or show notification?
- Reopen app after force-close → Which screen does it return to?
- Different roles (e.g., Domestic Investor vs. Foreign vs. Institutional) → Is Quick Access the same? Is news filtered by role?

**Group E — Internationalization (i18n):**
- After changing language → Does all text on the current screen update immediately?
- Languages with long characters (e.g., Japanese, Korean) → Does the layout break?
- Where is the language stored (local storage / server)? Is it preserved after logout / re-login?

**3. Functional Logic & Workflow Decomposition**

Analyze in detail the business processes of each function available on the feature screen, such as: view list, filter, search, create, view detail, edit, delete, export, etc.

- Workflows:
- Main Flow (Happy Path): The correct execution flow that produces no errors or exceptions.
- Alternative Flows: Alternative execution paths that still lead to a successful outcome.
- Exception & Error Flows: Scenarios involving system errors or invalid data.

> ⚠️ **LƯU Ý PHẠM VI TEST:**
> Exception & Error Flows chỉ mô tả **cách client phản hồi** khi nhận lỗi từ API (thông báo hiển thị, retry button, giữ/mất state). KHÔNG phân tích tại sao server trả lỗi, KHÔNG đánh giá logic xử lý lỗi phía backend. Ví dụ đúng phạm vi: "App hiển thị toast 'Có lỗi xảy ra' và giữ nguyên dữ liệu đã nhập khi API trả 5xx."
- Business Rules & Validations: Synthesize the business rules regarding format constraints, value ranges, and mandatory fields.
- UI/UX Feedback: Specify system notifications (Toast messages), error codes, and loading states corresponding to each process.

<!-- ✏️ CHANGED: Added structured example format -->
**Example format:**

```
[Function Name — e.g., Display Home Page]

MAIN FLOW (Happy Path):
Step 1 → Step 2 → ... → Expected Result

ALTERNATIVE FLOWS:
[Alt-1] Different condition → Alternative flow → Result
[Alt-2] ...

EXCEPTION & ERROR FLOWS:
[Err-1] Error condition → Displayed message → System behavior
[Err-2] ...

BUSINESS RULES:
BR-xxx: [Rule]

UI/UX FEEDBACK:
- Loading state: [description]
- Toast / Snackbar: [content, duration]
- Error message: [content, position]
```

<!-- ✏️ CHANGED: Added mandatory field attribute table -->
**For each input field or dynamic display field, a table MUST be created:**

| Field | Data Type | Required? | Min | Max | Format |
| ---------- | --------- | --------- | --- | ------ | ------------------- |
| Full Name | Text | — | — | 1 line | Truncate if too long |
| Post Date | Date | — | — | — | DD/MM/YYYY |
| ... | | | | | |

Any cell without information in the UC doc → record as a corresponding gap.

**4. Functional Integration Analysis**

Analyze and evaluate the linkages and influences between the cataloged functions — acting as an integration check between functions.

- Impact Analysis: Determine whether a change in state or data within one function directly or indirectly affects other functions.
- Data Consistency: Verify the synchronization of data across all related UI components after a function is executed.

**5. Acceptance Criteria (AC) Synthesis**

Establish the final set of measurement and evaluation standards regarding the completeness of the requirement.

- Establishing Acceptance Criteria (AC): Categorize and detail the acceptance criteria for each group: Interface (UI), Function, and Integration.

## Phase 2 — Audit

### Knowledge Areas Checklist

Score the **combined artefact set** against these knowledge areas.
A tester needs all of these to design complete test cases.

Mark each as:

- ✅ **Clear** — explicitly stated and unambiguous (full marks)
- ⚠️ **Partial** — present but vague, incomplete, or only inferred (half marks)
- ❌ **Missing** — absent from all provided artefacts (zero marks)

| # | Knowledge Area | Max Pts | Critical? | What to look for |
| -- | ----------------------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Feature Identity (title, ID, context) | 5 | Yes | Is it clear what this feature is and where it fits in the system? |
| 2 | Objective & Scope | 5 | Yes | Why does this feature exist? What is in/out of scope? |
| 3 | Actors & User Roles | 10 | Yes | Who triggers the feature? What roles/permissions are involved? |
| 4 | Preconditions & Postconditions | 10 | Yes | What must be true before? What is the system state after success? |
| 5 | UI Object Inventory & Mapping | 15 | Yes | List all user interface components from the Design Mockup and map them to the Functional Specification document. |
| 6 | Object Attributes & Behavior Definition | 20 | Yes | Determine the state and response of each UI object based on specific system conditions. |
| 7 | Functional Logic & Workflow Decomposition | 20 | Yes | Analyze in detail the business processes of each function on the feature screen. Duplicate the block for each major sub-function (e.g., View List, Create Record). |
| 8 | Functional Integration Analysis | 10 | Yes | Analyze and evaluate the linkages and influences between the cataloged functions. |
| 9 | Acceptance Criteria | 10 | Yes | Measurable, verifiable pass/fail statements. |
| 10 | Non-functional Requirements | 5 | No | Performance, security, compatibility, accessibility. |

**Total: 110 points → Normalise to 100 for the final score.**

**Normalization formula:** `Final Score = round((Raw Score / 110) × 100, 1)`

> Example: Raw score 88 / 110 → Final Score = round((88 / 110) × 100, 1) = **80.0 / 100**
> Example: Raw score 95 / 110 → Final Score = round((95 / 110) × 100, 1) = **86.4 / 100**

**Auto-fail rule:** If any Critical knowledge area scores 0, verdict = NOT READY regardless of total score.

<!-- ✏️ CHANGED: Corrected non-critical area reference (was #10–#12, now only #10) -->
> **Critical areas** (rows marked "Yes"): Areas #1–#9. If ANY of these score 0, the verdict is automatically NOT READY regardless of total score.
> **Non-critical areas** (rows marked "No"): Area #10. Scoring 0 here reduces the total but does not trigger auto-fail.

### Verdict Thresholds

| Score | Verdict | Meaning |
| ------ | -------------------------------- | -------------------------------------------------------------------- |
| 90–100 | ✅ **READY** | QA can begin test design immediately |
| 70–89 | ⚡ **CONDITIONALLY READY** | QA can start on clear areas; flagged items must be resolved in parallel |
| 0–69 | ❌ **NOT READY** | Too many gaps; do not begin test design |

### Cross-Artefact Conflict Check

After scoring, check for **conflicts between artefacts**:

> ⚠️ **LƯU Ý PHẠM VI TEST:**
> Khi kiểm tra xung đột liên quan đến API spec, chỉ flag những xung đột **ảnh hưởng đến hiển thị/hành vi phía client**. KHÔNG đánh giá tính đúng đắn của logic API hoặc thiết kế backend.

- Does the UC doc describe a flow that contradicts the wireframe?
- Does the API spec define fields not mentioned in requirements?
- Are there UI elements in the design with no corresponding business rule?
- Are labels/field names inconsistent across documents?

List all conflicts found — they are automatic Warnings.

### Blocked Artefact Protocol

If a referenced artefact (wireframe, API spec, supporting doc) is **unavailable or inaccessible**:

- Mark the dependent knowledge area(s) as `[BLOCKED: artefact name not accessible]`
- Score those areas as 0
- Since blocked artefacts almost always affect Critical knowledge areas (#1–#9), surface each blocked area as a 🔴 **Blocker** in the report under the "Blockers" section
- Do NOT infer or assume content from unavailable artefacts

## Phase 3 — Report

The report is based on the **UC Readiness Review Template**. Open the template file, fill every section based on what was found (or not found) in the provided artefacts, then save the completed version as the report output.

**Status markers used throughout:**

- ✅ **Complete** — explicitly stated and unambiguous
- ⚡ **Partial** — present but vague, incomplete, or only inferred (half marks)
- ⚠️ **Missing** — absent from all provided artefacts (zero marks)
- *(inferred)* — the reviewer inferred information rather than finding it explicitly; these are candidates for confirmation before test design begins

### 📊 Audit Summary

> **Note:** Knowledge area numbers map to template sections as follows:
> #1 → Section 0 · #2 → Section 1 · #3 → Section 2 · #4 → Section 3 · #5 → Section 4 · #6 → Section 5 · #7 → Section 6 · #8 → Section 7 · #9 → Section 8 · #10 → Section 9

| # | Knowledge Area | Max Pts | Score | Status |
| --------- | ----------------------------------------- | --------- | ----- | ---------- |
| 1 | Feature Identity | 5 | X/5 | ✅/⚡/⚠️ |
| 2 | Objective & Scope | 5 | X/5 | ✅/⚡/⚠️ |
| 3 | Actors & User Roles | 10 | X/10 | ✅/⚡/⚠️ |
| 4 | Preconditions & Postconditions | 10 | X/10 | ✅/⚡/⚠️ |
| 5 | UI Object Inventory & Mapping | 15 | X/15 | ✅/⚡/⚠️ |
| 6 | Object Attributes & Behavior Definition | 20 | X/20 | ✅/⚡/⚠️ |
| 7 | Functional Logic & Workflow Decomposition | 20 | X/20 | ✅/⚡/⚠️ |
| 8 | Functional Integration Analysis | 10 | X/10 | ✅/⚡/⚠️ |
| 9 | Acceptance Criteria | 10 | X/10 | ✅/⚡/⚠️ |
| 10 | Non-functional Requirements | 5 | X/5 | ✅/⚡/⚠️ |
| **Total** | | **110** | | **XX/110 → XX/100** |

### 📋 Unified Gap & Question Report

Synthesize all gaps, missing info, warnings, conflicts, and open questions from all analyzed sections into a single comprehensive table for the BA to review. Ensure there is no duplicated content.

| ID | Priority | Ref | Question | Why It Matters | Status |
| ---------- | ----------------------- | --------------------------------------------------- | ---------------------------------- | ----------------------------------------------- | -------- |
| *(e.g., Q1)* | *(High / Medium / Low)* | *(Exact excerpt from requirement. Skip if Missing)* | *(Main content to clarify or fix)* | *(Why this is an issue, impact on testability)* | *(Open)* |

**Column definitions:**

- **ID**: Question identifier (e.g., Q1, Q2)
- **Priority**:
- **High**: Blockers — critical knowledge areas scoring 0, completely missing critical info.
- **Medium**: Warnings, cross-artefact conflicts, partial/vague details.
- **Low**: Suggestions for improvement, non-critical open questions.
- **Ref**: Exact excerpt from the requirement that led to this question. If the issue is something completely missing, write "N/A (Missing)".
- **Question**: Clearly state what needs to be answered, provided, or corrected by the BA. Must include the description of the issue as currently found.
- **Why It Matters**: Explain the specific reason for raising this question (e.g., impact on test design, potential bugs, data inconsistency).
- **Status**: Default to "Open".

### 🟢 What's Good

Briefly acknowledge what is well-documented. Give the author credit for what is ✅ Complete.

### 🧪 Testability Outlook

**What CAN be tested now:**

- [Test areas with enough information to start]

**What CANNOT be tested yet (blocked by gaps):**

- [Test areas blocked by ⚠️ Missing or ⚡ Partial sections]

<!-- ✏️ CHANGED: Expanded suggested test focus areas with new categories -->
**Suggested test focus areas** *(once gaps are resolved)*:

- Happy path: [based on Section 5 — Object Attributes & Behavior Definition]
- Alternative scenarios: [based on Section 5 — Object Attributes & Behavior Definition]
- Boundary & validation tests: [based on Section 5 — Object Attributes & Behavior Definition]
- Error & exception scenarios: [based on Section 5 — Object Attributes & Behavior Definition]
- UI-specific checks: [based on Section 5 — Object Attributes & Behavior Definition, if design/wireframe was provided]
- CMR compliance tests: Verify UC correctly applies CMR rules
- Real-time behavior tests: Verify WebSocket / polling / push
- Partial API failure tests: One API call fails, the rest succeed
- Edge case tests: Long text, special characters, broken layout

### 📌 Summary & Recommendation

One paragraph: overall state of the artefact set, key actions required, and a clear recommendation — hold until fixed / fix specific items and proceed / proceed now.

---

## Readiness Thresholds

| Score | Verdict | Meaning |
| ------ | -------------------------------- | -------------------------------------------------------------------- |
| 90–100 | ✅ **READY** | QA can begin test design immediately |
| 70–89 | ⚠️ **CONDITIONALLY READY** | QA can start on clear areas; flagged items must be fixed in parallel |
| 0–69 | ❌ **NOT READY** | Too many gaps; do not begin test design |

**Auto-fail:** Any Critical knowledge area scoring 0 → ❌ NOT READY regardless of total.

<!-- ✏️ CHANGED: Expanded Common Gap Patterns table with new v2 patterns -->
## Common Gap Patterns

| Gap Pattern | Recognizable Sign | Example Question |
| ---------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No preconditions stated | UC starts directly from step 1 | "What conditions must be true before [function] is triggered?" |
| Vague actor | Only says "user" without role distinction | "In this UC, which specific role is 'user'? Does behavior differ between roles?" |
| Missing validation rules | Has input fields but no constraints | "What data type does field [X] accept? Min/Max? Special characters? Specific error message?" |
| Missing specific error messages | Only says "display error" | "What is the exact error message for [situation X]? Does it follow CMR-07 or have a custom message?" |
| AC uses "should" / "can" | Criteria are not measurable | "Can criterion [X] be expressed as a specific pass/fail statement?" |
| Wireframe has element not in UC | Detected via CMR cross-check | "Element [X] on wireframe corresponds to which rule in the UC doc?" |
| UC does not reference CMR | No "(See CMR-xx)" annotations | "Does this UC apply [CMR-xx]? Is the behavior the same as described in CMR?" |
| [NEW v2] Partial API failure not handled | Only has full-screen error handler | "When only [API-X] fails while [API-Y] succeeds, does the UI handle independently or block everything?" *(chỉ kiểm tra hành vi hiển thị phía client)* |
| [NEW v2] Real-time has no fallback | Has real-time but no disconnection description | "When real-time connection is lost, does the UI notify the user? Is there a fallback polling mechanism?" |
| [NEW v2] i18n missing persistence rule | Has language switch but doesn't say where it's stored | "Where is the selected language stored? Is it preserved after logout / reinstall?" |
| [NEW v2] Double-tap / race condition | Has navigation but no debounce rule | "If the user taps [button X] twice rapidly, does the system navigate twice?" |
