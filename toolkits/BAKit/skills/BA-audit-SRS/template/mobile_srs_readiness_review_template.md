# Rà soát mức sẵn sàng SRS Mobile (Mobile SRS Readiness Review) — {Tên dự án / module}

> **How to use this template:** fill every section from the audited sources. Write in Vietnamese with English
> terminology; quote on-screen labels and messages in their original language with English in parentheses.
> Every finding cites an exact source (file, section, UC / BR / PD / diagram ID). A section that does not
> apply says `N/A` with one line of reason — never leave it blank. Keep the heading
> `### 📋 Unified Gap & Question Report` exactly as written: `BA-audit-QnA` reads that table.

## A. Thông tin audit (Audit Information)

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Dự án (Project) | {Project name} |
| Nền tảng (Platform) | {Android / iOS / Both / Unknown} |
| Phạm vi audit (Audit Scope) | {Full SRS / Module {MOD} / UC group: UC-… / Individual UC} |
| Phiên bản SRS (SRS Version) | {`docs/project-srs.md` version + date} |
| Loại audit (Audit Type) | {First audit / Re-audit} |
| Phiên bản / Ngày audit (Audit Version / Date) | {v{N} / YYYY-MM-DD} |
| Người audit (Auditor) | {agent / reviewer} |
| Audit liên quan (Related Audit) | {previous report path / None} |
| Question backlog | {`docs/BA/SRS-report/srs/{ID}_question-backlog.md` / None yet} |

## B. Tóm tắt (Executive Summary)

| Kết luận (Verdict) | Điểm hoàn thiện (Completeness Score) | Vấn đề chặn (Blocking Issues) | Bàn giao Dev/QA (Dev/QA Handoff) |
| :--- | :--- | :--- | :--- |
| {✅ Ready / ⚡ Conditionally Ready / ❌ Not Ready} | {XX / 100 or N/A if unscorable} | {count + AUD-IDs} | {Ready for Dev/QA Handoff / Partial: {areas} / Not yet} |

**Tóm tắt (Summary):** {main strengths, blocking gaps, scope actually verified}

### B.1 Nguồn bằng chứng (Evidence Availability)

| Nguồn (Source) | Trạng thái (Status) | Đường dẫn / Ghi chú (Reference / Notes) |
| :--- | :--- | :--- |
| SRS & Use Cases | {Provided / Not Provided / Not Applicable / Unavailable} | {`docs/project-srs.md`, `docs/usecases/{module}/…`} |
| Feature Checklist | {Status} | {`docs/BA/competitor/{app-slug}/{app-slug}_checklist_*.md`} |
| Product Decision Summary | {Status} | {`docs/BA/decisions/{feature-slug}_decisions_*_v{N}.md` + verdict} |
| Figma / Screenshots | {Status} | {`docs/BA/figma/{feature}/…`} |
| APK Reference Evidence | {Status} | {`docs/BA/competitor/{app-slug}/…` profile / screens / flow-*} |
| User Flow Diagrams | {Status} | {`docs/diagrams/{module}/UF-…`} |
| Activity Diagrams | {Status} | {`docs/diagrams/{module}/ACT-…`} |
| Sequence Diagrams | {Provided / N/A / Required but missing} | {justification} |
| Research / Briefs / PO notes | {Status} | {path} |

**Giới hạn kiểm chứng (Verification Limits):** {what could not be verified and why}

## C. Ma trận bao phủ (Coverage Matrix)

| Nhóm tính năng (Feature Group) | Tính năng (Feature) | Quyết định (Decision) | Trong phạm vi? (In Scope?) | UC / FR | UI Spec | User Flow | Activity Diagram | Trạng thái / Gap (Status / Gaps) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {Group} | {Feature} | {PD-NNN: KEEP / MODIFY / REMOVE / NEW / TBD} | {Yes / No / TBD} | {FR-…, UC-…} | {Covered / Gap / N/A} | {UF-…} | {ACT-…} | {Covered / AUD-NNN} |

## D. Đánh giá chất lượng (Quality Assessment)

| # | Tiêu chí (Dimension) | Max | Điểm (Score) | Trạng thái (Status) | Bằng chứng / Ghi chú (Evidence / Notes) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Feature Coverage | 15 | {X} | {✅ / ⚠️ / ❌} | {references} |
| 2 | Use Case Completeness | 15 | {X} | {✅ / ⚠️ / ❌} | {references} |
| 3 | UI Specification & Figma Alignment | 15 | {X / N/A} | {✅ / ⚠️ / ❌ / N/A} | {references} |
| 4 | Business Logic & Testability | 20 | {X} | {✅ / ⚠️ / ❌} | {references} |
| 5 | Product Decision Alignment | 10 | {X / N/A} | {✅ / ⚠️ / ❌ / N/A} | {references} |
| 6 | Diagram Coverage & Consistency | 10 | {X} | {✅ / ⚠️ / ❌} | {references} |
| 7 | Traceability & Cross-UC Consistency | 10 | {X} | {✅ / ⚠️ / ❌} | {references} |
| 8 | Optional requirements (Permissions / Ads / IAP / NFR / Dependencies) | 5 | {X / N/A} | {✅ / ⚠️ / ❌ / N/A} | {applicability basis} |
| **Tổng (Total)** | | **{applicable max}** | **{earned}** | | **{earned} / {applicable max} → {XX} / 100** |

**Cơ sở chấm điểm (Scoring Rationale):** {N/A dimensions excluded and why; previous score if re-audit}

## E. Báo cáo gap (Gap Report)

| Gap ID | Nhóm (Category) | Tham chiếu (Requirement / Diagram Reference) | Vấn đề & bằng chứng (Issue & Evidence) | Mức độ (Severity) | Ưu tiên (Priority) | Đề xuất (Recommendation) | Phụ trách (Owner) | Trạng thái (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| AUD-001 | {Coverage / UC / UI / Logic / Decision / Diagram / Traceability / Optional} | {file: section / UC-… / ACT-…} | {issue + evidence} | {Critical / Major / Minor} | {P0 / P1 / P2 / N/A} | {action} | {PO / BA / Designer / Dev} | {Open / Resolved / Reopened / Deferred} |

## F. Câu hỏi mở (Open Questions)

### 📋 Unified Gap & Question Report

| ID | Priority | Ref | Question | Why It Matters | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Q-001 | {High (P0) / Medium (P1) / Low (P2)} | {AUD-NNN · exact source excerpt, or N/A (Missing)} | {decision or clarification needed, with the issue as found} | {impact on Dev / QA, scope or testability} | Open |

## G. Rà soát sơ đồ (Diagram Review)

**User Flow:** {coverage, missing journeys, navigation consistency with UCs}

**Activity Diagram:** {coverage of core business logic, shared-diagram mapping, missing branches}

**Sequence Diagram:** {Required — reason / Not required — reason / Present and reviewed}

**Xung đột sơ đồ (Diagram Conflicts):** {UC / BR / PD mismatches with references; horizontal flowcharts}

## H. Thay đổi khi re-audit (Re-audit Changes)

{N/A for a first audit.}

| Gap ID | Trạng thái trước (Previous Status) | Trạng thái hiện tại (Current Status) | Thay đổi đã kiểm chứng / Bằng chứng (Verified Change / Evidence) |
| :--- | :--- | :--- | :--- |
| {AUD-NNN} | {Open} | {Resolved / Open / Reopened / Deferred} | {reference} |

## I. Rủi ro hồi quy (Regression Risks)

- {related UC / shared BR / diagram / navigation that the changes may affect, with references}

## J. Quyết định sẵn sàng & bàn giao (Readiness Decision and Handoff)

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Quyết định (Decision) | {Ready / Conditionally Ready / Not Ready} |
| Điều kiện chặn (Blocking Conditions) | {open P0 / Critical AUD-IDs, or None} |
| Bước tiếp theo được phép (Allowed Next Step) | {BA fix (`ba-spec-writer`) / PO decision (`product-decision`) / Dev & QA handoff} |
| Việc còn lại không chặn & phụ trách (Remaining Non-blocking Work and Owners) | {AUD-IDs → owner} |

> **Notes:** N/A Ads / IAP or a not-required Sequence Diagram is not counted as missing. "Ready for Dev/QA
> Handoff" is never stated while an unresolved P0 / Critical gap exists. This report does not modify the SRS
> and does not generate test cases.

## K. Lịch sử thay đổi (Change Log)

| Phiên bản (Version) | Ngày (Date) | Tác giả (Author) | Tóm tắt (Summary of Changes) |
| :--- | :--- | :--- | :--- |
| v{N} | {YYYY-MM-DD} | {agent / reviewer} | {first audit / re-audit: integrated answers, score change} |
