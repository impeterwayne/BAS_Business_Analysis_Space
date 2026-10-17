# Global System Workflow (Init Flow)

This document explicitly delineates the step-by-step orchestrations for both the Report Module and Mobile App Module, including how the agents manage missing data, update logic, and how the entire system is triggered by the User.

---

## 0. Command Guide (System Triggers)

To execute any of the agent workflows cleanly, you (the User) must use the following initialization commands:

* **`Init Report Flow`**: Trigger `skill_auditor` ? `skill_challenger` ? `skill_architect_report`.
* **`Init Mobile Flow`**: Trigger `skill_auditor` (Agent 4 sync) ? `skill_challenger` (Agent 5) ? `skill_architect_mobile`.

---

## PART I: REPORT MODULE

### Step 1: Reception & Identification (Auditor)

* **Executing Agent:** Agent 1: Report Compliance Auditor
* **Actions:**
  * **Implementation Plan (MANDATORY):** Whenever the workflow is initiated, you MUST create an implementation plan for the output of step 1.
  * **Auto-Discovery:** Automatically search for templates in `.agents/skills/requirement-analysis/references/web-references/web-template` and legal constraints in `.agents/skills/requirement-analysis/references/web-references/web-thong-tu`.
  * **Data Recording & UX Check:** Note the "BA in charge". Based on your explicit Input defining the feature as Periodic or Ad-hoc, Agent 1 will extract the corresponding layout constraint directly from `.agents/skills/requirement-analysis/references/web-references/web-UX-sample`.
  * **Input Processing:** Parse column lists and exact validations required for the Creation Screen.
  * **Error Checking:** Cross-check input against Circulars mapping special case regulations. List omitted validations on a warning checklist. Suggest filters autonomously if they exist in the templates but are missing from User Input.
  * **Rule Validation:** Rigidly enforce the `business_rules.md` file limits.
* **Output:** Cross-check Checklist and UI Case Confirmation.

### Step 2: Critique & Assumption Management (Challenger)

* **Executing Agent:** Agent 2: Report Logic Challenger
* **Actions:**
  * **Logic Review:** Raise sharp critical questions addressing vague business flow, concurrency gaps, and permission loops.
  * **QnA & Assumption Logging (MANDATORY):** Log **every** generated question AND assumption into `docs/BA/SRS-report/CMR/PENDING_assumptions_backlog_20260424_v1.md`. Use the existing format: group by UC, assign ID (A-01, A-02...), fill the question, leave "Tr? l?i" blank for BA to answer later.
  * **Assumption Handling (CRITICAL):** If the User cannot answer immediately, Agent 2 makes an intelligent assumption and **proceeds with it as accepted fact**. Do NOT tag outputs with `[ASSUMPTION]` markers in the UC file. Do NOT add a "Danh s�ch ASSUMPTIONS" section to the UC. The assumption is applied silently and only logged in the backlog file above.
* **Output:** Updated `PENDING_assumptions_backlog_20260424_v1.md` + unblocked flow proceeding to Step 3.

### Step 3: Functional Specification Authoring (Architect)

* **Executing Agent:** Agent 3: Report FDD Architect
* **Actions:**
  * **FDD Composition:** Generate documentation strictly following `.agents/skills/ba-architect/references/SRS_Temp_uc_extracted.md` structure. Content MUST be 100% in technical Vietnamese.
  * **UC Naming Convention (MANDATORY):**
    * **Primary source for UC number resolution:** `.agents/skills/requirement-analysis/references/web-references/web-template/3_Ph?_l?c_XIII_B�o_c�o,_th?ng_k�_TKCS_Cong1cua_�TQG_v4_extracted.txt` � this is the extracted text version of Ph? l?c XIII containing the complete numbered UC list. Search for the section header (e.g., `III.3`, `IV.1`) and read the sequential STT numbers to determine the UC range.
    * **Fallback source:** `.agents/skills/requirement-analysis/references/List UC_web.docx` (binary .docx � same content as Ph? l?c XIII but harder to parse).
    * **Legal/Circular reference folder:** `.agents/skills/requirement-analysis/references/web-references/web-thong-tu/` � contains Th�ng tu drafts (e.g., `�TNN_Du thao Thong tu (2).docx`), the Ph? l?c XIV mobile UC list (`3_Ph?_l?c_XIV_?ng_d?ng_di_d?ng_TKCS_Cong1cua_�TQG_v4 (4).docx`), and the Excel bi?u m?u template (`2026_1.4.07 Phu luc A TT03.2021- BC DTNN III-IV (2).xlsx`).
    * The **Parent UC file** is named using the full range: `UC###-###_[Report Name].md` and saved in `docs/BA/SRS-report/`.
    * Each **Child UC** inside is named with a decimal suffix: `UC###-###.1` (Listing/Filters), `UC###-###.2` (Create/Import), `UC###-###.3` (Supplementary Actions).
    * Each parent UC group = **One separate Markdown file** in `docs/BA/SRS-report/`.
  * **Use Case Structure:** Rigid authoring order inside each file: `.1` (List/Filter/Search) ? `.2` (Create/Import) ? `.3` (Supplementary).
  * **Presentation:** Use zero diagrams (No Mermaid). Do NOT tag any section with `[ASSUMPTION]` markers. Do NOT include a "Danh s�ch ASSUMPTIONS" section in the UC file � that section is **no longer used**.
  * **Template Reference (MANDATORY):** The active SRS template to mimic for ALL new report UCs is `docs/BA/SRS-report/UC161-166_BaoCao6ThangDTRNN.md`. Every new UC file MUST match:
    * The exact header attribute table format (BA ph? tr�ch, Ph�n h?, M?u bi?u, Lo?i b�o c�o, H�nh th?c n?p, Co quan nh?n, Giao di?n, Ng�y t?o, Phi�n b?n).
    * The exact field table columns: `# | T�n tru?ng | Ki?u tru?ng | Gi� tr? m?c d?nh | �u?c s?a | B?t bu?c | M� t?/Ghi ch�`.
    * The exact section headers: `### 1. M� t? ch?c nang`, `### 2. M� t? giao di?n`, `### 3. M� t? c�c x? l� c?a ch?c nang`.
    * Group header rows embedded in the field table using bold text (e.g., `**PH?N I � TH�NG TIN NH� �?U TU**`).
  * **CMR & CF Referencing Rules (MANDATORY):**
    * Every field that involves validation MUST reference the appropriate CMR rule inline (e.g., `Tham chi?u: CMR_06`).
    * Every action button MUST reference the appropriate CF inline (e.g., `Tham chi?u: CF_01 (m?c "X? l� n�t [Luu nh�p]")`).
    * Auto-fill fields from IRC or API MUST reference `CMR_12` for field state behavior.
    * The CMR/CF reference list: `docs/template/common_business_rules.md`. Read this file before authoring if uncertain about a rule number.
  * **Tooltip Rules (CRITICAL):**
    * **DO NOT add tooltips** to any field unless explicitly stated in the User's input or confirmed in the official bi?u m?u template.
    * The ONLY permitted tooltip in the List screen is for status "�� du?c l?p b?i N�T kh�c" � this is mandated by CMR_02 and must always be included for �TRNN reports.
    * Do NOT generate tooltip content for number/formula fields (e.g., T? l? thu h?i v?n) unless the User explicitly requires it.
  * **Auto-fill Field Rules:**
    * Fields auto-filled from IRC: Disabled, no editable flag (`x`), Ghi ch� references CMR_12.
    * Fields auto-filled from API profile (e.g., S�T/Email ngu?i l�m b�o c�o): **Enabled** (`x` in �u?c s?a), Required, Ghi ch� explicitly states "Cho ph�p ch?nh s?a" and references CMR_06.
    * Fields auto-filled from API after ch?n D? �n: Disabled, Ghi ch� references CMR_12 and CF_01.
* **Output:** Finalized FDD/SRS Markdown files saved in `docs/BA/SRS-report/`.

---

## PART II: MOBILE APP MODULE

### Step 1: Review/Skip (Auditor)

* **Executing Agent:** Agent 4: Mobile Sync Auditor
* **Actions:**
  * **Implementation Plan (MANDATORY):** Whenever the workflow is initiated, you MUST create an implementation plan for the output of step 1.
  * **API Mode:** If API/Web frameworks are available, perform deep synchronization checks detecting logic discrepancies against the Mobile scope.
  * **Figma-Only Mode:** If only Figma/Wireframe mockups are available, skip synchronization validation and immediately move interface logic into Step 2.
* **Output:** Inconsistency List (if API is analyzed).

### Step 2: Technical Critique (Challenger)

* **Executing Agent:** Agent 5: Mobile Tech Challenger
* **Actions:**
  * Challenge UI/UX coherence natively across platforms. Evaluate low-network handling and state exception caching.
  * **QnA & Assumption Logging (MANDATORY):** Log **every** generated question AND assumption into `docs/BA/SRS-report/CMR/PENDING_assumptions_backlog_20260424_v1.md`. Same format as Report flow: group by UC, assign ID, leave "Tr? l?i" blank.
  * **Assumption Handling:** Make an intelligent assumption and proceed as accepted fact. Do NOT tag outputs with `[ASSUMPTION]` markers in the UC file. Assumptions are logged in the backlog file only.

### Step 3: Mobile Specification Authoring (Architect)

* **Executing Agent:** Agent 6: Mobile FDD Architect
* **Actions:**
  * **UC Naming Convention (MANDATORY):**
    * **Primary source for mobile UC number resolution:** `.agents/skills/requirement-analysis/references/web-references/web-thong-tu/3_Ph?_l?c_XIV_?ng_d?ng_di_d?ng_TKCS_Cong1cua_�TQG_v4 (4).docx` � Ph? l?c XIV containing the mobile app UC list.
    * **Fallback source:** `.agents/skills/requirement-analysis/references/List UC_app.docx`.
    * Each UC group = **One separate Markdown file** saved in `docs/BA/SRS-mobile/`.
    * Child UC naming mirrors Report convention: `UC[range].1`, `UC[range].2`, `UC[range].3`.
    * Child UC naming mirrors Report convention: `UC[range].1`, `UC[range].2`, `UC[range].3`.
  * Flesh out exact Wireframe Map (if API enabled) tracking user Touch Actions (Tap/Swipe/Long Press). Document without Mermaid diagrams.
  * Strictly follow the structure from `.agents/skills/ba-architect/references/SRS_Temp_uc_extracted.md`
  * **Presentation:** Use zero diagrams (No Mermaid). Do NOT tag any section with `[ASSUMPTION]` markers. Assumptions are already logged in the backlog file � write the UC as if all assumptions are confirmed fact.
  * **Empty State Rule (MANDATORY):** Always use `"Kh�ng t�m th?y d? li?u"` (with or without trailing space as needed) for empty search results or empty lists. Do NOT use `"Kh�ng t�m th?y k?t qu?"`.
* **Output:** Complete Mobile FDD Markdown files saved in `docs/BA/SRS-mobile/`.

