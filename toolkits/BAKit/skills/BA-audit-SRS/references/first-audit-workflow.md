## First Audit Workflow

1. **Ingest & Understand** — read all provided artefacts, understand the feature
2. **Audit** — score completeness across all required knowledge areas
3. **Report** — deliver a structured readiness report with verdict, score, gaps, and suggestions

## Supported Artefact Types

Accept any combination of:

| Type                        | Examples                                           |
| --------------------------- | -------------------------------------------------- |
| Requirements / Use Case doc | UC spec, feature brief, BRD, user story            |
| UI Design / Wireframe       | Figma export, mockup image, screen flow PDF        |
| API Specification           | REST API doc, Swagger/OpenAPI, integration spec    |
| Business Process doc        | Workflow diagram, BPMN, process description        |
| Design document             | Technical design, system design, architecture note |
| Other supporting docs       | Data dictionary, error code list, email templates  |

All file formats are supported: plain text, Markdown, PDF, Word (.docx), images (PNG/JPG).

## Phase 1 — Ingest & Understand

### Step 1: Read all artefacts

**Read the common files first** — they hold shared definitions that the UC will reference by code/ID. Located in `docs/BA/SRS-report/CMR/`:

| File | Holds |
|---|---|
| `Bảng thông báo lỗi.docx` | Error message catalog (mã lỗi → text message gốc) |
| `Quy tắc nghiệp vụ chung.docx` | Common business rules (rule ID → full rule text) |
| `Các chức năng dùng chung cho các báo cáo.docx` | Common functions reused across reports (login, navigation, …) |
| `Sơ đồ quy trình.docx` | Process flow diagrams |
| `Mô tả dự án.md` | Project overview |

For `.docx` files, invoke the `.agents/skills/docx/SKILL.md` skill to extract text/tables — do NOT use the Read tool directly on `.docx`.

**Common Reference Resolution rule (MANDATORY):** When the source UC references a common-file entry by code/ID/name (e.g., `MSG_E001`, `BR_xxx`, the name of a common function), do NOT leave the bare code in the audit output. Open the corresponding common file, copy the **exact original text** (message wording, full rule statement, function description), and inline that text into the audit section that uses it (Section 6.1.B Business Rules, 6.1.C Error Codes / Toast Messages, Section 3 Preconditions if a common function is reused, etc.). Preserve the original code in parentheses for traceability — e.g., `"Mã báo cáo đã tồn tại trong hệ thống" (MSG_E001)`.

This is so test cases written downstream from the audit file have the exact verbatim message/rule text in `Expected Result` without re-opening the common docs.

Then read each provided UC file or pasted content fully before scoring anything.

**Input-type routing:**
| Input type           | Action  |
| -------------------- | -------------------|
| URL provided         | Invoke the `.agents\skills\document-extraction\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on URL files.|
|PDF provided          | Invoke the `.agents\skills\pdf\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on PDF files.|
|DOCX provided          | Invoke the `.agents\skills\docx\SKILL.md` skill to extract text, tables, images first. Do NOT use the Read tool directly on DOCX files.|
| File path provided   | Read the file using the appropriate tools|
| Image file provided  | Use the Read tool — it renders images inline; describe all visible UI elements, labels, states, and flows in detail |
| Pasted text provided | Treat as a document; parse directly from the prompt |

### Step 2: Synthesise a Feature Understanding
After fully comprehending all provided documents and analyzing the design images (including any screen mockups embedded within the specification documents), proceed to synthesize the requirement content according to the following 5 sections:
**1. UI Object Inventory & Mapping**
Extract and catalog all user interface components based on the Design Mockup and map them correspondingly to the Functional Specification document.

**Granularity rule (MANDATORY):** Every atomic UI element gets **its own row** in Section 4. Do NOT collapse multiple inputs/buttons/columns into one row (e.g., do NOT write "Phần I: 9 API fields" — list each field individually). Each row MUST capture:
- **Exact label** as shown on the screen (Vietnamese/English original — no paraphrase)
- **Component type** (Text input / Number input / Dropdown / Date picker / Radio / Checkbox / Textarea / Button / Icon / Table column / Tab / Tooltip / Toast / Popup / etc.)
- **Required flag** (`*` shown in design = Required; absence of `*` = Optional)
- **Default value** (if pre-filled or hint shown)
- **Placeholder text** (exact text inside the input)
- **Enum values** (for Dropdown/Radio/Checkbox — list **all** options exactly as shown, no "(N values)" shorthand)
- **Section / sub-section grouping** (e.g., "Phần I > Nhà đầu tư #1")

Categorize after enumeration, not before:
  - Data Display Structure (Grid/List/Table): For every table, list **every column** as a separate row (preserve multi-level header hierarchy). Identify pagination limit, default sorting, and Empty state text exactly as designed.
  - Control System (Filters/Search Fields): Each filter/search field is its own row. Capture initial state, full list of dropdown values, and input constraints.
  - Navigation and Action Components (Buttons/Controls): Each button/icon is its own row, including action icons inside table rows (Edit/Delete/View/Export/Print/etc.).
  - Other components: page title, subtitle, hint banner, breadcrumb, tooltip, badge, status chip, empty-state message, loading spinner — each as its own row.

**Self-check before finishing this step:** For each design image, count the visible atomic UI elements. The number of rows in Section 4 mapped to that image must be ≥ that count. Record the count delta in your working notes; if any element is collapsed/grouped, flag and re-expand.

**2. Object Attributes & Behavior Definition**
Determine the state and response of each UI object based on specific system conditions.

**1-to-1 mapping rule (MANDATORY):** Section 5 MUST contain **at least one row for every row in Section 4**. The set of "Object / Component" names in Section 5 must equal or be a superset of the names in Section 4. If a UI element has no special behavior, still list it with `System States = "Enabled (no special behavior)"` and `Behavior = "N/A"` — do NOT omit it. Never group multiple Section-4 components into a single Section-5 row (e.g., do NOT write "SĐT, Email" as one row — split into two).

  - System States: Define the default state of the object (Enabled, Disabled, Hidden, Read-only) based on variables such as: account privileges (Permissions), input data conditions, or the current data state of the system.
  - Interaction Matrix: Specify the possible interaction actions (Click, Hover, Drag & Drop) and the corresponding system responses for each object.
  - Object Behavior: Define how the object reacts when there is a data change or a state change in related objects.

**3. Functional Logic & Workflow Decomposition**
Analyze in detail the business processes of each function available on the feature screen, such as view list, filter, search, create, view detail, edit, delete, export, etc.
  - Workflows:
    - Main Flow (Happy Path): The correct execution flow that produces no errors or exceptions.
    - Alternative Flows: Alternative execution paths that lead to a successful outcome.
    - Exception & Error Flows: Scenarios involving system errors or invalid data.
  - Business Rules & Validations: Synthesize the business rules regarding format constraints, value ranges, and mandatory fields.
  - UI/UX Feedback: Specify system notifications (Toast messages), error codes, and loading states corresponding to each process.

**4. Functional Integration Analysis**
Analyze and evaluate the linkages and influences between the cataloged functions, acting as an integration check between functions.
  - Impact Analysis: Determine whether a change in state or data within one function directly or indirectly affects other functions.
  - Data Consistency: Verify the synchronization of data across all related UI components after a function is executed.

**5. Acceptance Criteria (AC) Synthesis**
Establish the final set of measurement and evaluation standards regarding the completeness of the requirement.
  - Establishing Acceptance Criteria (AC): Categorize and detail the acceptance criteria for each group: Interface (UI), Function, and Integration.

### Step 3: UI Coverage Self-Verification (mandatory before Phase 2)

Before scoring, do a coverage audit of Section 4 against every design image:

1. For each design image in the input set, count `elements_in_image` — the visible atomic UI elements (every input, dropdown, radio option, checkbox, button, action icon, table column, table row label, tab, tooltip, badge, chip, page title, subtitle, hint banner, empty-state message, toast, popup).
2. Count `rows_in_section_4` — Section 4 rows whose `Source` column references that image.
3. Record a delta table in working notes:

   | Image | elements_in_image | rows_in_section_4 | Delta | Action |
   |---|---|---|---|---|
   | *(filename)* | *(N)* | *(M)* | *(N − M)* | *(if Delta > 0: enumerate the missing elements and add rows; if Delta < 0: review for fabricated elements)* |

4. Loop until `Delta == 0` for every image. Only then proceed to Phase 2.
5. If a design image cannot be opened or rendered, mark Section 4 row `[BLOCKED: <filename> not accessible]` and surface as Blocker — do NOT skip the image silently.

## Phase 2 — Audit

### Knowledge Areas Checklist

Score the **combined artefact set** against these knowledge areas.
A tester needs all of these to design complete test cases.

Mark each as:

- ✅ **Clear** — explicitly stated and unambiguous (full marks)
- ⚠️ **Partial** — present but vague, incomplete, or only inferred (half marks)
- ❌ **Missing** — absent from all provided artefacts (zero marks)

| #   | Knowledge Area                        | Max Pts | Critical? | What to look for  |
| --- | ------------------------------------- | ------- | --------- | ---------------- |
| 1   | Feature Identity (title, ID, context) | 5       | Yes       | Is it clear what this feature is and where it fits in the system? |
| 2   | Objective & Scope                     | 5      | Yes       | Why does this feature exist? What is in/out of scope? |
| 3   | Actors & User Roles                   | 10      | Yes       | Who triggers the feature? What roles/permissions are involved? |
| 4   | Preconditions & Postconditions        | 10      | Yes       | What must be true before? What is the system state after success? |
| 5   | UI Object Inventory & Mapping         | 15      | Yes       | Every atomic UI element listed as its own row with label/type/required/default/placeholder/enum values. **Auto-cap rules:** if any row collapses ≥ 2 atomic elements (e.g., "9 API fields", "(4 values)"), max score = 8/15. If any design image has < 80% of its visible elements enumerated, max score = 5/15. If any design image is referenced but no element from it appears in Section 4, max score = 0/15. |
| 6   | Object Attributes & Behavior Definition| 20      | Yes       | Determine the state and response of each UI object based on specific system conditions. **1-to-1 rule:** every row in Section 4 must have ≥ 1 corresponding row here. If < 80% of Section-4 rows are covered, max score = 10/20.|
| 7   | Functional Logic & Workflow Decomposition| 20      | Yes       | Analyze in detail the business processes of each function available on the feature screen. Duplicate the block below for each major sub-function (e.g., View List, Create Record).|
| 8   | Functional Integration Analysis       | 10      | Yes       | Analyze and evaluate the linkages and influences between the cataloged functions, acting as an integration check between functions.|
| 9   | Acceptance Criteria                   | 10      | Yes       | Measurable, verifiable pass/fail statements|
| 10   | Non-functional Requirements           | 5       | No        | Performance, security, compatibility, accessibility|

**Total: 110 points → Normalise to 100 for the final score.**

**Normalization formula:** `Final Score = round((Raw Score / 110) × 100, 1)`

> Example: Raw score 88 / 110 → Final Score = round((88 / 110) × 100, 1) = **80.0 / 100**
> Example: Raw score 95 / 110 → Final Score = round((95 / 110) × 100, 1) = **86.4 / 100**

**Auto-fail rule:** If any Critical knowledge area scores 0, verdict = NOT READY
regardless of total score.

> **Critical areas** (rows marked "Yes"): Areas #1–#9. If ANY of these score 0, the verdict is automatically NOT READY regardless of total score.
> **Non-critical areas** (rows marked "No"): Areas #10–#12. Scoring 0 here reduces the total but does not trigger auto-fail.

### Cross-Artefact Conflict Check

After scoring, check for **conflicts between artefacts**:

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

The report is based on the **UC Readiness Review Template**. Open the template file, fill every section based on what was found (or not found) in the provided artefacts, then save the completed as the report output.
Section 8 — Acceptance Criteria: Based on the AC synthesis performed in Phase 1 Step 2.5, populate Section 8 of the template with concrete Given/When/Then acceptance criteria derived from the analyzed workflows, business rules, and UI behaviors. Even if the source document lacks explicit AC, the agent MUST generate them from the synthesized understanding. Score this section based on the source document's AC, but always provide generated AC in the output.
Add the Audit Summary in the end of the report.

**Status markers used throughout:**
- ✅ **Complete** — explicitly stated and unambiguous
- ⚡ **Partial** — present but vague, incomplete, or only inferred (half marks)
- ⚠️ **Missing** — absent from all provided artefacts (zero marks)
- *(inferred)* — the reviewer inferred information rather than finding it explicitly; these are candidates for confirmation before test design begins

### Audit Summary

> **Note:** Knowledge area numbers map to template sections as follows:
> #1 → Section 0 · #2 → Section 1 · #3 → Section 2 · #4 → Section 3 · #5 → Section 4 · #6 → Section 5 · #7 → Section 6 · #8 → Section 7 · #9 → Section 8 · #10 → Section 9 

| #               | Knowledge Area                           | Max Pts       | Score | Status                    |
| --------------- | ---------------------------------------- | ------------- | ----- | ------------------------- |
| 1               | Feature Identity                         | 5             | X/5   | ✅/⚡/⚠️                 |
| 2               | Objective & Scope                        | 5             | X/5   | ✅/⚡/⚠️                 |
| 3               | Actors & User Roles                      | 10            | X/10  | ✅/⚡/⚠️                 |
| 4               | Preconditions & Postconditions           | 10            | X/10  | ✅/⚡/⚠️                 |
| 5               | UI Object Inventory & Mapping            | 15            | X/15  | ✅/⚡/⚠️                 |
| 6               | Object Attributes & Behavior Definition  | 20            | X/20  | ✅/⚡/⚠️                 |
| 7               | Functional Logic & Workflow Decomposition| 20            | X/20  | ✅/⚡/⚠️                 |
| 8               | Functional Integration Analysis          | 10            | X/10  | ✅/⚡/⚠️                 |
| 9               | Acceptance Criteria                      | 10            | X/10  | ✅/⚡/⚠️                 |
| 10              | Non-functional Requirements              | 5             | X/5   | ✅/⚡/⚠️                 |
| **Total**       |                                          | **110**       |       | **XX/110 → XX/100**       |

### Unified Gap & Question Report
Synthesize all gaps, missing info, warnings, conflicts, and open questions from all analyzed sections into a single comprehensive table for the BA to review. Ensure there is no duplicated content.
| ID | Priority | Ref | Question | Why It Matters | Status |
|----|----------|-----|----------|----------------|--------|
| *(e.g., Q1)* | *(High / Medium / Low)* | *(Exact excerpt from requirement. Skip if Missing)* | *(Main content to clarify or fix)* | *(Why this is an issue, impact on testability)* | *(Open)* |
- **ID**: ID of the question (e.g., Q1, Q2)
- **Priority**: 
- **High**: Blockers (critical knowledge areas scoring 0, missing critical info).
- **Medium**: Warnings, Cross-artefact conflicts, Partial/Vague details.
- **Low**: Suggestions for improvement, minor open questions.
- **Ref**: Exact excerpt from the requirement that led to this question. If the issue is something completely missing, write "N/A (Missing)".
- **Question**: Clearly state what needs to be answered, provided, or corrected by the BA. Make sure to include the description of the issue as currently found.
- **Why It Matters**: Explain the specific reason for raising this question (e.g., impact on test design, potential bugs, data inconsistency).
- **Status**: Default to "Open".

### 🟢 What's Good

Briefly acknowledge what is well-documented. Give the author credit for what is ✅ Complete.


### 🧪 Testability Outlook

**What CAN be tested now:**

- [Test areas with enough information to start]

**What CANNOT be tested yet (blocked by gaps):**

- [Test areas blocked by ⚠️ Missing or ⚡ Partial sections]

**Suggested test focus areas** *(once gaps are resolved)*:

- Happy path: [based on Section 5. Object Attributes & Behavior Definition
- Alternative scenarios: [based on Section 5. Object Attributes & Behavior Definition]
- Boundary & validation tests: [based on Section 5. Object Attributes & Behavior Definition]
- Error & exception scenarios: [based on Section 5. Object Attributes & Behavior Definition]
- UI-specific checks: [based on Section 5. Object Attributes & Behavior Definition, if design/wireframe was provided]

### 📌 Summary & Recommendation

One paragraph: overall state of the artefact set, key actions required, and a clear recommendation — hold until fixed / fix specific items and proceed / proceed now.

---

## Readiness Thresholds

| Score   | Verdict                           | Meaning                                                              |
| ------- | --------------------------------- | -------------------------------------------------------------------- |
| 90–100 | ✅**READY**                 | QA can begin test design immediately (Do NOT auto-generate test cases). |
| 70–89  | ⚠️**CONDITIONALLY READY** | QA can start on clear areas; flagged items must be fixed in parallel |
| 0–69   | ❌**NOT READY**             | Too many gaps; do not begin test design                              |

**Auto-fail:** Any Critical knowledge area scoring 0 → ❌ NOT READY regardless of total.


## Common Gap Patterns

| Gap Pattern                                  | Impact on Test Design                         |
| -------------------------------------------- | --------------------------------------------- |
| No preconditions stated                      | Tester can't set up test data correctly       |
| Vague actor ("the user")                     | Can't determine which role/permission to test |
| Missing field validation rules               | Can't write boundary value or negative tests  |
| No error messages specified                  | Can't verify error handling behaviour         |
| Acceptance criteria use "should" / "can"     | Not verifiable; can't define pass/fail        |
| Error UI state not described                 | Can't verify UI error behaviour               |
| API error codes not listed                   | Can't verify API error handling               |
| Design shows fields not in requirements      | Ambiguous scope and validation rules          |
| Flows reference other features without links | Can't trace test dependencies                 |

## Phase 4 — Sync Question Backlog (auto-chain, MANDATORY)

After the audited file is saved successfully, the agent MUST automatically invoke the `qc-ask-ba` skill — without waiting for further user prompt — to transfer all entries in the "Unified Gap & Question Report" of the audited file into a `*_question-backlog.md` file at the same UC folder.

**Trigger condition:** The audited file has been saved AND the "Unified Gap & Question Report" table contains ≥ 1 row.

**Skip condition:** Only skip the chain if the "Unified Gap & Question Report" is empty (i.e., zero open questions). In that case, log to the user that no backlog file is needed.

**Why mandatory:** The backlog file is the single source of truth for BA to answer open questions. Without it, the re-audit workflow cannot execute (it depends on `*_question-backlog.md` to exist). Auto-chaining guarantees the next step is unblocked.
