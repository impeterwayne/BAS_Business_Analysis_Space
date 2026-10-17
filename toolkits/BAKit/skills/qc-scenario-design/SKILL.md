---
name: qc-scenario-design
description: Designs test scenarios from a finalized, reviewed UC (Use Case) requirement document. Trigger this skill whenever the user says "design test scenarios", "build test scenarios", or provides a uc-review output and asks to proceed with testing. Also trigger when the user mentions their requirement is ready and they want to move to QA/test design, even if they don't say "test scenario" explicitly.
---
# Test Scenario Design Skill

## Purpose

Transform a finalized UC requirement (ideally reviewed and approved by `uc-review`) into ready-to-use QA artifacts: **`test_scenarios.md`** ‚Äî Test scenarios grouped by UC, covering all test types

This skill covers the following test types for **web applications and APIs**:

- Functional Testing
- Integration Testing
- UI Testing
- Functional/End-to-End (E2E) Testing
- Acceptance Testing

## Output Files

| Artifact       | Output Path                                                            |
| -------------- | ---------------------------------------------------------------------- |
| Test Scenarios | `docs/QC/scenarios/[UC-ID]/[UC-ID]_[feature-name]_scenarios_[YYYYMMDD].md`   |


## Input

The user will provide one or more of the following (same artefact types as `uc-review`):

- UC requirement document (Markdown, PDF, Word, plain text)
- The `uc-review` readiness report (the output from the `uc-readiness-review` skill)
- Supporting artefacts: wireframes, API specs, design docs

**Before generating anything**, read all provided documents fully and build a clear understanding of:

- All UC IDs and their names (e.g., `UC-001`, `UC_LOGIN`)
- All functions/features described within each UC
- The main flow, alternative flows, error flows
- All business rules and validations
- Acceptance criteria
- Actors/roles
- Pre and postconditions
- API endpoints and behaviors (if applicable)
- UI states and field behaviors (if applicable)

If the UC ID or function names are not clearly stated in the document, infer them from the
feature name and note your inference clearly. For example: *"UC ID inferred as UC-001 from
document title 'User Login Feature'."*

### MANDATORY Test Design Techniques Application

**CRITICAL RULE:** To guarantee comprehensive coverage and discover edge cases, you MUST forcefully expand requirements using these specific Test Design Techniques during scenario generation:

1. **Equivalence Partitioning (EP) Validation:** 
   - Never bundle valid or invalid inputs into a single scenario if they belong to different partitions.
   - Example: If allowed formats are `.png`, `.jpg`, and `.svg`, create a scenario checking ALL valid extensions independently, and separate scenarios for specific invalid extensions (`.pdf`, `.txt`).
   - Split compound rules into discrete positive/negative scenarios.

2. **Boundary Value Analysis (BVA):**
   - For ANY field with numerical, length, or sizing limits (e.g., max 255 chars, max 1MB), you MUST forcefully generate scenarios mapping exactly to the Boundary (`Limit`), and immediately outside the Boundary (`Limit + 1 unit`, `Limit - 1 unit`).
   - Example: For 255 chars limit, test 1 char, 255 chars, and 256 chars. For a 1MB limit, test 1.00MB exactly, and 1.01MB.

3. **Decision Tables / Combinatorics:**
   - Force matrix-based testing for search filters or multi-variable forms.
   - Example: Create combinations like `Filter A (Valid) + Filter B (Valid)` and `Filter A (Valid) + Filter C (Invalid)`.
   - Never test just one filter in isolation if multiple filters can logically interact on a List layout.

Failure to apply these techniques limits the scenarios to simple basic flows. Applying these bounds correctly typically scales valid CRUD feature scenarios upwards of 20-50 detailed variants.

### Test Scenario Template

```
### Scenario ID: TS_[UC ID]_[SequenceNo]
**Scenario Title:** [Short, clear description of what is being tested]
**UC Reference:** [UC ID and UC Name]
**Req-ID:** [Requirement ID(s) this scenario traces to ‚Äî e.g., UC-001-FR-003]
**Test Type:** [Functional | Integration | UI | End-to-End | Acceptance]
**Description:** [One or two sentences describing the scenario ‚Äî what condition or flow is being verified]
**Test Focus:** [Happy path | Alternative flow | Error/Exception | Boundary | Permission/Role | UI State | API contract]
```

### Scenario Coverage Rules

For each UC, generate scenarios that cover **all of the following** that apply:

| Coverage Area                    | Source in UC                                        |
| -------------------------------- | --------------------------------------------------- |
| Happy path (main flow)           | Main Flow section                                   |
| Each named alternative flow      | Alternative Flows section                           |
| Each error/exception flow        | Exception & Error Flows section                     |
| Each business rule / validation  | Business Rules section                              |
| Boundary value cases             | Any field with min/max/format constraints           |
| Role/permission variations       | Actors & User Roles section                         |
| UI state transitions             | UI/UX Behaviour section (if applicable)             |
| API contract verification        | API / Integration Behaviour section (if applicable) |
| Acceptance criteria verification | Acceptance Criteria section                         |

Do not skip any coverage area just because the UC is brief. If a UC only has a main flow and
two business rules, you still generate scenarios for each. Quality over quantity ‚Äî each scenario
should represent a meaningfully different test intent.

### Output File: test_scenarios.md

Structure the file like this:

```markdown
# Test Scenarios

## [UC ID] ‚Äî [UC Name]

### Scenario ID: TS_[UC ID]_001
**Scenario Title:** ...
**UC Reference:** ...
**Req-ID:** ...
**Test Type:** ...
**Description:** ...
**Test Focus:** ...

### Scenario ID: TS_[UC ID]_002
...

---

## [Next UC ID] ‚Äî [Next UC Name]

...
```

---

## Output Summary

After generating both files, provide a brief summary:

```
## ‚úÖ Test Design Complete

| Artifact | File | Count |
|---|---|---|
| Test Scenarios | docs/QC/scenarios/[UC-ID]/[UC-ID]_[feature-name]_scenarios_[YYYYMMDD].md | X scenarios across Y UCs |

### Coverage breakdown by test type:
- Functional: X test scenarios
- Integration: X test scenarios
- UI: X test scenarios
- End-to-End: X test scenarios
- Acceptance: X test scenarios

### Notes:
- Any inferred UC IDs or function names
- Any gaps found in the requirements that limited test case generation
- Suggestions for areas to revisit (if applicable)
```

---

## Quality Checks Before Finalizing

Before writing the final output, verify:

- [ ] Every UC in the requirement has at least one scenario
- [ ] All critical knowledge areas from `uc-review` have corresponding test coverage
  (main flow, alternative flows, error flows, business rules, acceptance criteria)
- [ ] Every test case has a unique ID
- [ ] All test data uses realistic values (not abstract placeholders)
- [ ] Pre-conditions are specific enough that a tester can set up the test independently
- [ ] Expected results are observable and verifiable (not vague like "works correctly")
- [ ] API test cases describe the request and expected response clearly
- [ ] E2E test cases trace the full journey from start to finish

---

## Important Notes

- **Scope**: This skill covers functional, integration, UI, E2E, and acceptance testing only.
- System testing and non-functional testing (performance, security, load) are handled by separate skills.
- **Version**: All new test cases start at `v1.0`. If updating existing test cases,
  the user will specify the new version.
- **Traceability**: Every test case must be traceable back to a UC via its ID. Never generate
  a test case without a clear UC reference.

## Out-of-Scope Handling

When a scenario is identified as performance, security (beyond functional auth checks), or load testing:

1. Do NOT generate test cases for it
2. Add an entry to the `## ‚ö†Ô∏è Out-of-Scope Flags` section at the end of the scenarios file:

```markdown
## ‚ö†Ô∏è Out-of-Scope Flags

| Scenario Area | Reason | Recommended Action |
|--------------|--------|--------------------|
| [Description] | [NFR: PERFORMANCE / SECURITY / LOAD] | Defer to performance/security testing specialist |
```

## Platform-Specific Rules
**IMPORTANT:** D?a v‡o yÍu c?u c?a ngu?i d˘ng l‡ l‡m App (Mobile) hay Web (Report) d? ch?n lu?t ·p d?ng tuong ?ng:
- **Web/Report:** ¡p d?ng lu?ng x? l˝ v‡ thu m?c tham chi?u tiÍu chu?n du?c khai b·o ? trÍn.
- **Mobile App:** –?c c·c file tham chi?u cÛ ti?n t? mobile_ trong thu m?c eferences/ (n?u cÛ). ¡p d?ng c·c quy t?c d?c th˘ cho Mobile (vÌ d?: giao di?n mobile, h‡nh vi vu?t ch?m, khÙng ph‚n tÌch s‚u backend API n?u lu?ng cu yÍu c?u).