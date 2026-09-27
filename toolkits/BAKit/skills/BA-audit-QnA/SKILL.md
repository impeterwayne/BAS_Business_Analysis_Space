---
name: BA-audit-QnA
description: Transfers open questions from the 'Unified Gap & Question Report' of an audited file to a Question Backlog file for the BA to answer. Triggered when the user asks "hỏi BA các câu hỏi của [UC-CAT-ID]", or auto-invoked by `BA-audit-SRS` at the end of its first-audit workflow (Phase 4) to create the initial backlog file. Also called inline from re-audit Step 3.3 to append new questions.
---
# QC Ask BA Skill

## Purpose

This skill aims to extract unresolved questions identified during the requirement review process (located in the "Unified Gap & Question Report" section of the audited file) and transfer them into a dedicated Question Backlog file. This ensures that Business Analysts (BAs) can easily track, answer, and confirm the missing information.

## Step 1: Input Resolution & Clone Template

1. Extract the `[UC-ID]` or Module/Function name from the User's prompt.
2. Search for the audited UC file within the **same directory as the input UC file** (`docs/BA/SRS-report/[UC-folder-name]/`). If multiple versions of the audited file exist, you MUST select the file with the highest version number.
3. Search for the question backlog file within the **same directory** (`docs/BA/SRS-report/[UC-folder-name]/`). If multiple versions of the question backlog file exist, you MUST select the file with the highest version number.
If the question backlog file already exists, skip the template cloning process, check if there are any answered questions in the backlog file that are not in the audited file. If there are, stop and warning the user that they should be re-audit the UC.
If the question backlog file does not exist, follow the step 4 and 5 to create a new one.
4. Read the master template from `.agents/skills/BA-audit-QnA/template/question-backlog_template.md`.
5. Create the output file in the **same directory as the audited UC file**: `docs/BA/SRS-report/[UC-folder-name]/[UC-ID]_question-backlog.md`.


## Step 2: Content Extraction & Transfer

1. From the highest version audited file, extract all the table data under the heading `### 📋 Unified Gap & Question Report`.
2. In the newly created (or opened) `[UC-CAT-ID]_question-backlog.md` file, locate the `## Open Questions` section.
3. Remove the placeholder line `_(No open questions — all resolved.)_` (if it exists).
4. Populate the `Open Questions` table with all the rows extracted from the audited report.
5. Ensure the table columns strictly follow the standard format:
   `| ID | Priority | Ref | Question | Why It Matters | Status |`
6. **ID Handling**: Keep the original IDs (e.g., Q1, Q2) from the audited report unless there is an ID conflict with existing entries in the backlog file (if appending to an existing file).

## Input Contract

- Audited file: same directory as the input UC file — `docs/BA/SRS-report/[UC-folder-name]/[UC-ID]_audited_v[N].md` (highest version)
- Question backlog file: same directory — `docs/BA/SRS-report/[UC-folder-name]/[UC-ID]_question-backlog.md` (if exists)

## Output Contract

- All output files must be saved in the **same directory as the audited UC file**.
- Path pattern: `docs/BA/SRS-report/[UC-folder-name]/[UC-ID]_question-backlog.md` — where `[UC-folder-name]` is the exact folder containing the UC requirement file.
  - Example: `docs/BA/SRS-report/UC69_TraCuuVanBanPhapLuat/UC69_question-backlog.md`
- Once the transfer or merge is completed, output a summary message indicating the number of questions successfully transferred to the backlog file.

## Platform-Specific Rules
**IMPORTANT:** Dựa vào yêu cầu của người dùng là làm App (Mobile) hay Web (Report) để chọn luật áp dụng tương ứng:
- **Web/Report:** Áp dụng luồng xử lý và thư mục tham chiếu tiêu chuẩn được khai báo ở trên.
- **Mobile App:** Đọc các file tham chiếu có tiền tố mobile_ trong thư mục references/ (nếu có). Áp dụng các quy tắc đặc thù cho Mobile (ví dụ: giao diện mobile, hành vi vuốt chạm, không phân tích sâu backend API nếu luồng cũ yêu cầu).
