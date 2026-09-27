## Re-Audit Workflow

### Step 1 — Ingest Current State & Answers
1. Locate the highest version of the audited file.
2. Locate and read the `question-backlog` file - `Answered Questions` section and `Deferred Questions` section.

### Step 2 — Apply Answers & Resolve Gaps
1. Analyze the BA's answers in the backlog.
2. Incorporate the clarified business rules, logic, and UI behavior into the 5 synthesis sections (Object Attributes, Workflows, etc.) of the previous audited file.

### Step 3 — Backlog Maintenance & Re-Audit
1. Recalculate the Readiness Score based on the newly introduced information. Determine the new Readiness verdict (Ready / Conditionally Ready / Not Ready).

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
| 5   | UI Object Inventory & Mapping         | 15      | Yes       | List all user interface components based on the Design Mockup and map them correspondingly to the Functional Specification  document.|
| 6   | Object Attributes & Behavior Definition| 20      | Yes       | Determine the state and response of each UI object based on specific system conditions|
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

2. **Handle Existing Questions:** For any questions where the BA provided a satisfactory answer, update the `question-backlog` file to change the status of that question from `Open` to `Resolved`. Move these rows to the "Answered Questions" section table.
3. **Handle New Questions:** If the re-audit reveals *new* conflicts or missing information arising from the BA's answers, immediately call the `qc-ask-ba` skill to append these new questions to the "Open Questions" table of the backlog file.

### Step 4 — Generate Audited v[N+1]
1. Update the "Unified Gap & Question Report" inside the audited document to reflect the resolved and new questions.
2. Add a "Changelog" at the bottom of the audited document summarizing what rules/answers were integrated.
3. Save the combined updated content as a new file, incrementing the version: `v[N+1]`. (Never overwrite the `v[N]` version).