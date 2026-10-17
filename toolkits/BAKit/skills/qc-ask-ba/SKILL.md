---
name: qc-ask-ba
description: Transfers open questions from the 'Unified Gap & Question Report' of an audited file to a Question Backlog file for the BA to answer. Triggered when the user asks "h·ªèi BA c√°c c√¢u h·ªèi c·ªßa [UC-CAT-ID]", or auto-invoked by `qc-uc-review` at the end of its first-audit workflow (Phase 4) to create the initial backlog file. Also called inline from re-audit Step 3.3 to append new questions.
---
# QC Ask BA Skill

## Purpose

This skill aims to extract unresolved questions identified during the requirement review process (located in the "Unified Gap & Question Report" section of the audited file) and transfer them into a dedicated Question Backlog file. This ensures that Business Analysts (BAs) can easily track, answer, and confirm the missing information.

## Step 1: Input Resolution & Clone Template

1. Extract the `[UC-ID]` or Module/Function name from the User's prompt.
2. Search for the audited UC file within the `docs/QC/review-doc/` directory. If multiple versions of the audited file exist, you MUST select the file with the highest version number.
3. Search for the question backlog file within the `docs/QC/review-doc/` directory. If multiple versions of the question backlog file exist, you MUST select the file with the highest version number.
If the question backlog file already exists, skip the template cloning process, check if there are any answered questions in the backlog file that are not in the audited file. If there are, stop and warning the user that they should be re-audit the UC.
If the question backlog file does not exist, follow the step 4 and 5 to create a new one.
4. Read the master template from `skills\qc-ask-ba\template\question-backlog_template.md`.
5. Create the output file at the same folder with the audited file.


## Step 2: Content Extraction & Transfer

1. From the highest version audited file, extract all the table data under the heading `### üìã Unified Gap & Question Report`.
2. In the newly created (or opened) `[UC-CAT-ID]_question-backlog.md` file, locate the `## Open Questions` section.
3. Remove the placeholder line `_(No open questions ‚Äî all resolved.)_` (if it exists).
4. Populate the `Open Questions` table with all the rows extracted from the audited report.
5. Ensure the table columns strictly follow the standard format:
   `| ID | Priority | Ref | Question | Why It Matters | Status |`
6. **ID Handling**: Keep the original IDs (e.g., Q1, Q2) from the audited report unless there is an ID conflict with existing entries in the backlog file (if appending to an existing file).

## Input Contract

- Audited file at: `docs/QC/review-doc/` - find the UCID folder, Module or Function folder (highest version)
- Question backlog file: `docs/QC/review-doc/` - find the UCID folder, Module or Function folder (highest version, if exists)

## Output Contract

- **Output path:** `docs/QC/review-doc/` - find the UCID folder, Module or Function folder (highest version, if exists)

## Platform-Specific Rules
**IMPORTANT:** D?a v‡o yÍu c?u c?a ngu?i d˘ng l‡ l‡m App (Mobile) hay Web (Report) d? ch?n lu?t ·p d?ng tuong ?ng:
- **Web/Report:** ¡p d?ng lu?ng x? l˝ v‡ thu m?c tham chi?u tiÍu chu?n du?c khai b·o ? trÍn.
- **Mobile App:** –?c c·c file tham chi?u cÛ ti?n t? mobile_ trong thu m?c eferences/ (n?u cÛ). ¡p d?ng c·c quy t?c d?c th˘ cho Mobile (vÌ d?: giao di?n mobile, h‡nh vi vu?t ch?m, khÙng ph‚n tÌch s‚u backend API n?u lu?ng cu yÍu c?u).