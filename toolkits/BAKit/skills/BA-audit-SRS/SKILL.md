---
name: BA-audit-SRS
description: "Audits requirements for Dev/QA handoff readiness without rewriting them. Supports Quick Mode (default for single-file mobile SRS — checks handoff blockers: missing UCs, missing UI specs for existing design images, unconfirmed APK values, missing required diagrams, and open P0s in a concise 1-table report) and Full Mode (0–100 scored readiness review with coverage matrix, AUD-* gap report, and BA-audit-QnA question backlog). Use whenever the user says 'review srs', 'audit srs', 'kiểm tra SRS', 'review uc', or asks whether an SRS or use case is ready for Dev/QA handoff."
---
# Requirements Readiness Review Skill (`BA-audit-SRS`)

## Purpose

You operate by **YAGNI**, **KISS** and **DRY**: audit what is in the target scope; find missing, ambiguous,
conflicting and untestable requirements — not hypothetical features. This skill never writes or edits the SRS, implements code or generates test cases.

## Modes: Quick Mode (Default for Mobile SRS) vs Full Mode

| Mode | When to Use | Output |
| :--- | :--- | :--- |
| **Quick Mode (Default)** | After `specs` writes or updates `docs/ba/srs/{app}_srs_v{N}.md` (or `docs/project-srs.md`), or when the user asks to check if the SRS is ready for testers / Word export | Concise 1-table blocker report: `docs/ba/audit/{app}_srs-audit_v{N}.md` (or `docs/BA/SRS-report/srs/SRS_{app}_audited_{YYYYMMDD}_v{N}.md`). Verdict: **Ready** / **Conditionally Ready** / **Not Ready**. |
| **Full Mode (`full`)** | User explicitly asks for `full audit`, `chấm điểm chi tiết`, or audits a legacy Web/Report UC folder in `docs/BA/SRS-report/` | Scored (0–100) Readiness Review using `references/mobile_first-audit-workflow.md` (or `references/first-audit-workflow.md`) + auto-chains `BA-audit-QnA`. |

---

## Quick Mode Workflow (Default)

Quick Mode focuses strictly on **handoff blockers** so the PO can see in 30 seconds whether the SRS is ready to export to Word (`srs-export`) and hand off to Dev & Testers.

### 1. Read Inputs
- The SRS (`docs/ba/srs/{app}_srs_v{N}.md` or `docs/project-srs.md` + `docs/usecases/` + `docs/diagrams/`).
- Feature Checklist (`docs/ba/feature-checklist/` or `docs/BA/competitor/*_checklist_*.md`).
- Product Decision Summary / Rule Confirmation Table (`docs/ba/product-decisions/` or `docs/BA/decisions/`).
- Design images / Figma analysis (`docs/inputs/design/` or `docs/BA/figma/`).
- APK evidence (`docs/inputs/apk/` or `docs/BA/competitor/`).

### 2. Check the 5 Handoff Blocker Gates

| Gate | What to Check | Blocker Severity |
| :--- | :--- | :--- |
| **1. Độ phủ tính năng (Feature Coverage)** | Every in-scope feature in the Feature Checklist maps to an FR and a full Use Case in Section 6; no confirmed `REMOVE` feature appears as an active requirement. | `P0` if an in-scope feature has no Use Case |
| **2. Đặc tả UI & Ảnh Design (UI Spec & Images)** | Every existing design image in `docs/inputs/design/` or `docs/BA/figma/.../screens/` is embedded with `![...](...)` at the top of its screen subsection and has a UI component table before Main Flow. | `P0` if an existing design screen is missing or not embedded; `P1` if states/components are incomplete |
| **3. Rule đã chốt vs APK (Decision Alignment)** | Confirmed `PD-*` rules are reflected accurately; no unconfirmed APK value or `[Inferred]` claim was silently copied into target requirements; no invented error text/limits. | `P0` if an unconfirmed APK rule was promoted as fact or contradicts `PD-*` |
| **4. Sơ đồ bắt buộc (Required Diagrams)** | Section 5 has User Flow (`UF-*`) for main journeys; complex features (3+ screens, multiple branches, IAP/Permission) have Activity Diagrams (`ACT-*`); diagrams use `flowchart TD` and ≤ 8–12 nodes per block. | `P0` if main User Flow or required complex Activity Diagram is missing; `P1` if diagram mismatches UC steps |
| **5. Câu hỏi mở P0 & Tự kiểm tra UC (Open P0s & K1–K16)** | Check Section 12 (`Câu hỏi mở`) and `use-case-writer/references/self-check.md` (`K1–K16`): any unresolved `P0` question blocks handoff. | `P0` if any `P0` question remains open |

### 3. Determine Verdict

- **Ready (Sẵn sàng bàn giao & xuất Word):** 0 issues at `P0`, and 0–2 minor `P1/P2` notes.
- **Conditionally Ready (Sẵn sàng có điều kiện):** 0 issues at `P0`, but `P1` items exist that should be noted for Dev/QC.
- **Not Ready (Chưa sẵn sàng — cần chốt thêm):** Any `P0` issue exists.

### 4. Write the Quick Audit Report

Save to `docs/ba/audit/{app}_srs-audit_v{N}.md` (or `docs/BA/SRS-report/srs/SRS_{app}_audited_{YYYYMMDD}_v{N}.md` in `docs/BA/` workspaces):

```markdown
# Kết quả kiểm tra SRS (Quick Audit) — {Tên App}

| Thuộc tính | Giá trị |
| :--- | :--- |
| File SRS kiểm tra | `{path-to-srs}` |
| Phiên bản audit | v{N} |
| Ngày kiểm tra | {YYYY-MM-DD} |
| Kết luận (Verdict) | **Ready / Conditionally Ready / Not Ready** |

## 1. Tổng hợp kiểm tra 5 hạng mục chặn (Handoff Gates)

| Hạng mục | Trạng thái | Ghi chú ngắn |
| :--- | :--- | :--- |
| 1. Độ phủ tính năng (Feature Checklist → UC) | Đạt / Chưa đạt | {ví dụ: 12/12 tính năng in-scope đã có Use Case} |
| 2. Đặc tả UI & Ảnh Design | Đạt / Chưa đạt | {ví dụ: Đủ 18/18 ảnh màn hình, thiếu state Empty ở SCR-GAL-01} |
| 3. Khớp bảng xác nhận Rule (PD-*) | Đạt / Chưa đạt | {ví dụ: Khớp 10/10 rule PO đã chốt} |
| 4. Sơ đồ User Flow & Activity | Đạt / Chưa đạt | {ví dụ: Đủ UF-001..003 và ACT-001..002} |
| 5. Câu hỏi mở P0 & Chuẩn UC (K1–K16) | Đạt / Chưa đạt | {ví dụ: Không còn P0 mở} |

## 2. Danh sách điểm cần xử lý (Nếu có)

| Mã | Mức độ | Vị trí (UC / Mục) | Vấn đề phát hiện | Hành động đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| AUD-001 | P0 / P1 / P2 | {UC-EDIT-002 / §6.2} | {Mô tả ngắn gọn, dẫn nguồn} | {Cần PO chốt / Cần bổ sung vào SRS} |
```

If Verdict is **Ready** or **Conditionally Ready**, proceed to (or offer) `srs-export` to generate `docs/ba/srs-word/{app}_srs_v{N}.docx`.

---

## Full Mode Workflow (`full` / Legacy Per-UC Audit)

When the user requests a **Full Mode** scored review (0–100) or audits a UC folder under `docs/BA/SRS-report/`:

| Mode | When | Workflow | Template |
| :--- | :--- | :--- | :--- |
| Mobile — Full SRS (Scored) | User asks for full scored audit of `docs/project-srs.md` or `docs/ba/srs/{app}_srs_v{N}.md` | `references/mobile_first-audit-workflow.md` / `references/mobile_re-audit-workflow.md` | `template/mobile_srs_readiness_review_template.md` |
| Mobile — Single UC | Target is one use case file or one UC folder | `references/mobile_first-audit-workflow.md` (Single-UC depth) | `template/UC_readiness_review_template_v3.md` |
| Web/Report — UC | Web or report project, one UC folder in `docs/BA/SRS-report/` | `references/first-audit-workflow.md` / `references/re-audit-workflow.md` | `template/UC_readiness_review_template_v3.md` |

In Full Mode first-audit, auto-chain `BA-audit-QnA` to create `*_question-backlog.md` when the `Unified Gap & Question Report` is non-empty.

## Boundaries

- Audit only. NEVER edit the SRS, use cases, diagrams, Product Decisions, Figma analyses or checklists.
- Every finding cites an exact file / section / UC / BR / PD / diagram reference.
- Never invent reference behavior, target rules, API contracts, effort estimates or monetization rules.
- Do NOT generate test cases or scenarios, even on a Ready verdict. Test design starts only when the user asks (`/test-cases`).
