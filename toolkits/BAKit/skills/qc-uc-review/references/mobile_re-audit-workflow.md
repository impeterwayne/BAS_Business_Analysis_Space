## Re-Audit Workflow

### Step 0 — Backlog Status Check (Warning Only)

1. Locate and read the `question-backlog` file.
2. Count Open / Answered / Deferred questions.
3. If there are still Open questions:
   - **Warn** the user: "Backlog có X/Y câu hỏi còn Open chưa được trả lời."
   - **Ask** the user to choose:
     - **Option A — Tạo mới v[N+1]:** Run first-audit workflow from scratch → produce a fresh audited file (ignores previous audit).
     - **Option B — Re-audit:** Continue re-audit workflow below — only integrate Answered/Deferred questions, skip Open ones (note in Changelog).
   - If user chooses Option A → switch to `first-audit-workflow.md`, output version = N+1.
   - If user chooses Option B → continue with Step 1 below.
4. If all questions are Answered/Deferred → proceed directly to Step 1.

> **Note:** This check is a WARNING, not a blocker. The user always has the choice to proceed.

### Step 1 — Ingest Current State & Answers

1. Locate the highest version of the audited file.
2. Locate and read the `question-backlog` file — `Answered Questions` section and `Deferred Questions` section.
3. If there are remaining Open questions (user chose Option B), note them as unresolved — do NOT attempt to answer them or infer answers.

### Step 2 — Apply Answers & Resolve Gaps

1. Analyze the BA's answers (Answered + Deferred) in the backlog.
2. Incorporate the clarified business rules, logic, and UI behavior into the 5 synthesis sections of the previous audited file:
   - UI Object Inventory & Mapping
   - Object Attributes & Behavior Definition
   - Functional Logic & Workflow Decomposition
   - Functional Integration Analysis
   - Acceptance Criteria Synthesis
3. For Open questions that remain unanswered: keep the original assessment unchanged for those areas.

### Step 3 — Re-Audit Scoring & Backlog Maintenance

#### 3.1–3.5 — Scoring, Verdict, Breakdown, Conflict Check, Blocked Protocol

→ **Áp dụng toàn bộ quy trình chấm điểm tại [`scoring-rubric.md`](scoring-rubric.md).**

Recalculate Readiness Score dựa trên thông tin mới từ BA answers.

#### 3.6 — Handle Existing Questions

For any questions where the BA provided a satisfactory answer, update the `question-backlog` file to change the status from `Open` to `Resolved`. Move these rows to the "Answered Questions" section table.

#### 3.7 — Handle New Questions

If the re-audit reveals *new* conflicts or missing information arising from the BA's answers, immediately call the `qc-ask-ba` skill to append these new questions to the "Open Questions" table of the backlog file.

### Step 4 — Generate Audited v[N+1]

→ **Áp dụng report format tại [`scoring-rubric.md`](scoring-rubric.md)** (Audit Summary, Gap Report, What's Good, Testability Outlook, Summary & Recommendation).

Bổ sung thêm:

#### 📝 Changelog

Summarize what rules/answers were integrated from the BA's responses in this re-audit cycle.

If there are Open questions that were skipped (user chose Option B with unresolved backlog):
- List the skipped question IDs
- Note: "Các câu hỏi trên chưa được BA trả lời — điểm số tại các KA liên quan giữ nguyên từ v[N]."

---

**Output:** Save the combined updated content as a new file, incrementing the version: `v[N+1]`. (Never overwrite the `v[N]` version).
