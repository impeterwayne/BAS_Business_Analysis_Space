## First Audit Workflow

1. **Ingest & Understand** — read all provided artefacts, understand the feature
2. **Audit** — score completeness across all required knowledge areas
3. **Report** — deliver a structured readiness report with verdict, score, gaps, and suggestions

## Phase 1 — Ingest & Understand

### Step 1: Read all artefacts

**Reading order:**
1. Common Rules (CMR) — foundation for detecting conflicts
2. Use Case document in full
3. Wireframe / Design Mockup (if available)
4. API Specification (if available) — chỉ để hiểu context client

Input-type routing:
| Input Type | Action |
| :--- | :--- |
| URL | Invoke `.claude\skills\document-extraction\SKILL.md` |
| PDF | Invoke `.claude\skills\pdf\SKILL.md` |
| DOCX | Invoke `.claude\skills\docx\SKILL.md` |
| File path | Read directly |
| Image | Use Read tool — describe all UI elements, labels, states |
| Pasted text | Analyze directly |

DO NOT score any knowledge area before finishing all documents.

### Step 2: Synthesise a Feature Understanding

After reading all documents (including design images), synthesize into 5 sections with **heading cố định**:

---

## 1. UI Object Inventory & Mapping

Build table of all UI components from Wireframe, mapped to UC:

| # | Component Name | Type | In UC? | In Wireframe? | Notes |
|---|---|---|---|---|---|
| 1 | Example Button | Button | ✅ | ✅ | |

Per component check: display state? action rule? label consistent?

**CMR Cross-Check:**
- UC không mention applicable CMR → ⚠️ Partial + question
- Conflict UC vs CMR → 🔴 Conflict + High-priority question

Sub-categories: Data Display (grid/list/table), Controls (filters/search), Navigation (buttons), Others.

---

## 2. Object Attributes & Behavior Definition

- System States: default state per object (Enabled/Disabled/Hidden/Read-only) based on permissions, data conditions
- Interaction Matrix: actions (Tap/Swipe/Long-press) + system responses
- Object Behavior: reactive rules when data/state changes

**Edge Case Checklist** (nếu UC không mention → ghi gap + question):

| Group | Key checks |
|---|---|
| A — Extreme Data | Text overflow (truncate/wrap?), numeric 0/negative/max, empty list vs max items, null from API → placeholder? |
| B — Network | Slow API → loading/skeleton?, partial failure → independent or block all?, double-tap → debounce?, network loss mid-load? |
| C — Abnormal Interaction | Rapid taps → block multiple nav?, back button khi modal open?, screen rotation? |
| D — Permissions & Session | Session expire → redirect/notify?, force-close → return screen?, different roles → different UI? |
| E — i18n | Language change → immediate update?, long text languages → layout break?, language persistence? |

> Edge Case chỉ kiểm tra hành vi **client-side**. KHÔNG trừ điểm cho gap phát hiện tại đây (bonus coverage).

---

## 3. Functional Logic & Workflow Decomposition

Per function (view list, filter, search, create, edit, delete, etc.):

```
[Function Name]
MAIN FLOW: Step 1 → Step 2 → ... → Expected Result
ALTERNATIVE FLOWS: [Alt-1] Condition → Flow → Result
EXCEPTION FLOWS: [Err-1] Error → Displayed message → Behavior
BUSINESS RULES: BR-xxx: [Rule]
UI/UX FEEDBACK: Loading / Toast / Error message
```

Per input/display field:
| Field | Data Type | Required? | Min | Max | Format |
|---|---|---|---|---|---|
Missing info → record as gap.

---

## 4. Functional Integration Analysis

- Impact Analysis: state/data change in one function → affects others?
- Data Consistency: data sync across related UI components after execution

---

## 5. Acceptance Criteria Synthesis

Categorize AC into: Interface (UI), Function, Integration.

---

## Preliminary Gaps Found

Ghi nhận sơ bộ điểm thiếu/mâu thuẫn phát hiện trong Phase 1 — chưa chấm điểm.

---

## Phase 2 — Audit & Phase 3 — Report

→ **Áp dụng toàn bộ quy trình chấm điểm, verdict, breakdown, conflict check, blocked protocol, và report format tại [`scoring-rubric.md`](scoring-rubric.md).**
