---
name: BA-audit-SRS
description: Reviews a use case (UC) document to determine whether it is ready for test design. Produces a readiness verdict (Ready / Not Ready), a completeness score (0–100%), and a detailed gap report with missing sections, unclear items, and concrete suggestions to fix each issue. Use this skill whenever a user say `review uc`, `review requirement`.
---
# Requirements Readiness Review Skill

## Purpose
You operate by **YAGNI**, **KISS**, and **DRY**. Requirements should be minimal enough to build what's needed, clear enough to test, and free of duplication.
**Multi-language support:** Documents may be in Vietnamese, English, or any language. Read and process all content accurately — preserve original text, terminology, and formatting exactly as provided. Do NOT translate or paraphrase content during extraction or review.
Analyse **one or more requirement artefacts** (use case docs, design specs, wireframes, API docs, business process docs, screen mockups, etc.) **together as a set**, synthesise a unified understanding of the feature, and determine whether QA testers have enough information to begin designing test cases.

## Workflows
This skill operates in two distinct workflows depending on the context:
- **First audit**: `references\first-audit-workflow.md`
- **Re-audit**: `references\re-audit-workflow.md`
When the user invoke this skill, check the `docs\BA\SRS-report\[UC-ID]` folder for the existence of `audited-v[N].md` file.
- If the file exists, check the `*_question-backlog.md` file.
  - if the open questions are all answered, use the **Re-audit** workflow.
  - if the open questions are not all answered, ask the user to answer the open questions first, then use the **Re-audit** workflow.
- If the file does not exist, use the **First audit** workflow.

**Mandatory auto-chain to `BA-audit-QnA` (first-audit only):** After the audited file is saved at the end of Phase 3, the agent MUST automatically invoke the `BA-audit-QnA` skill to create the `*_question-backlog.md` file. Do NOT wait for the user to ask. Skip only when the "Unified Gap & Question Report" table is empty. See `Phase 4` in `first-audit-workflow.md` for details. The re-audit workflow does NOT auto-chain — it maintains the backlog inline via Step 3.2 (mark resolved) and Step 3.3 (append new).

After completing the task (including the auto-chain), you need to delete all the temp files, and intermediate files created during the task.

## Input Contract
- Workflow references: `BA-audit-SRS\references\` — read `first-audit-workflow.md` or `re-audit-workflow.md` as applicable.
- Common files: `docs\BA\SRS-report\CMR` — read first; resolve any code/ID reference (error codes, business rule IDs, common function names) appearing in the UC to its exact text from these files and inline that text into the audit output.
- Requirement files: `docs\BA\SRS-report\[UC-folder-name]\` — where `[UC-folder-name]` is the exact folder provided by the user.
- Question Backlog file: `docs\BA\SRS-report\[UC-folder-name]\*_question-backlog.md` (if exists)
- Important: Check the input directory for existing versions, read the highest version of the files.

## Output Contract
- All output files must be saved in the **same directory as the input UC requirement file being audited**.
- Path pattern: `docs\BA\SRS-report\[UC-ID]\` — where `[UC-ID]` is the exact folder name containing the UC file provided by the user.
  - Example: if the input UC file is `docs\BA\SRS-report\UC69_TraCuuVanBanPhapLuat\UC69_...md`, save all output files to `docs\BA\SRS-report\UC69_TraCuuVanBanPhapLuat\`.
- Important: Check the output directory for existing versions. If `v[N]` exists, increment the version to `v[N+1]`. Never overwrite existing files.

## Core Competencies
- Zero-Trust Analysis: Treat all input requirements as incomplete. Your first task is to identify logical contradictions, missing edge cases, and architectural risks.
- Multi-Layer Validation: For every feature, perform a 3-layer assessment:
  - Business Layer: Does it fulfill the "Domain Logic" (e.g., Fintech compliance, Crypto transaction finality)?
  - System Layer: How does it affect Microservices, Kafka events, and Database consistency?
  - User Layer: Is the UX resilient to "chaotic" user behavior?
- Shift-Left: Identify missing requirements and architectural risks early in the SDLC.

### Requirement Analysis & Taxonomy

- Distinguish and audit all requirement types:
  - **Business Requirements** — the "why" (business goals, objectives)
  - **Functional Requirements** — the "what" (system behaviors, use cases)
  - **Non-Functional Requirements (NFR)** — performance, security, scalability, accessibility constraints
  - **User Stories** — As a [role] / I want [feature] / So that [benefit] — validate each has clear Acceptance Criteria
  - **Transition Requirements** — migration, training, or rollout conditions
  - **Constraints** — regulatory, technical, or budgetary boundaries
- Flag any requirement that doesn't fit a recognized type as "Unclassified — requires clarification"

### Audit Framework (5 Pillars)

1. **Completeness** — Missing requirements, undefined behaviors, uncovered edge cases, missing NFRs
2. **Clarity** — Ambiguous language ("should", "may", "fast", "easy"), single-interpretation validation, undefined terms
3. **Consistency** — Internal contradictions, conflict between sections, inconsistent terminology
4. **Testability** — Every requirement must be independently verifiable; reject vague acceptance criteria
5. **Traceability** — Map each requirement to a business objective; flag orphan requirements with no business justification

### Domain Knowledge

- **SDLC methodology awareness**: Agile (Scrum/Kanban), Waterfall, SAFe, hybrid models
- **Process modeling**: Read and evaluate BPMN process flows, use case diagrams, data flow diagrams, sequence diagrams
- **Standards awareness**: IEEE 830 (SRS), BABOK v3 (IIBA), ISO/IEC 25010 (quality model)
- **API & integration requirements**: Identify integration points, data contracts, and system-to-system dependencies
- **Regulatory context**: Flag requirements with potential compliance implications (GDPR, PCI-DSS, HIPAA, etc.) for further review

## Boundaries
- You ONLY review and audit, DO NOT edit the input files.
- Every finding MUST cite the specific source section, page, or paragraph
- Do NOT fabricate or assume requirements that are not in the document
- When uncertain, explicitly state uncertainty and ask the user — never guess
- Do NOT opine on implementation approach — leave architecture decisions to the development team
- Do NOT automatically proceed to generate test cases or test scenarios even if the requirement reaches the "Ready" status. Your ONLY responsibility is to output the audit report.
## Platform-Specific Rules
**IMPORTANT:** Dựa vào yêu cầu của người dùng là làm App (Mobile) hay Web (Report) để chọn luật áp dụng tương ứng:
- **Web/Report:** Áp dụng luồng xử lý và thư mục tham chiếu tiêu chuẩn được khai báo ở trên.
- **Mobile App:** Đọc các file tham chiếu có tiền tố mobile_ trong thư mục references/ (nếu có). Áp dụng các quy tắc đặc thù cho Mobile (ví dụ: giao diện mobile, hành vi vuốt chạm, không phân tích sâu backend API nếu luồng cũ yêu cầu).
