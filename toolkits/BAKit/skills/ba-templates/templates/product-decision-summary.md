# Tổng hợp quyết định sản phẩm (Product Decision Summary) — {Tên tính năng}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Tính năng (Feature) | {feature-name} · `{feature-slug}` |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v{N} |
| Phiên bản trước (Previous version) | `{docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N-1}.md}` hoặc none |
| Người xác nhận (Confirmed by) | {PO / người có thẩm quyền} |
| Kết luận (Verdict) | READY FOR SRS / NOT READY FOR SRS |

Loại quyết định (Decision types): **KEEP** giữ hành vi tham chiếu · **MODIFY** giữ ý tưởng, đổi hành vi ·
**REMOVE** loại khỏi sản phẩm · **NEW** hành vi mới, không có ở app tham chiếu · **TBD** chưa xác nhận.
Nhãn bằng chứng (Evidence grades): quan sát trên thiết bị (ghi file screenshot / tree) · **[Code]** `path:line` ·
**[Inferred]** suy luận, cần xác nhận.

## 1. Phạm vi & nguồn (Scope & Sources)

- **Phạm vi (Scope):** {phần của tính năng được quyết định trong tài liệu này}
- **Ngoài phạm vi (Out of scope):** {…}

| Nguồn (Source) | Đường dẫn (Path) | Ghi chú (Notes) |
| :--- | :--- | :--- |
| Feature Checklist | `docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v{N}.md` | {dòng STT liên quan} |
| APK profile / screens / flows | `docs/BA/competitor/{app-slug}/…` | {flow nào đã đọc} |
| Comparison / gap | `docs/BA/competitor/{topic}_comparison_{YYYYMMDD}_v{N}.md` | {GAP-ID, FR-CAND-ID} |
| Figma analysis | `docs/BA/figma/{feature-slug}/{feature-slug}_figma_{YYYYMMDD}_v{N}.md` | {FR-DSN-ID, BR-CAND-ID} |
| Research | `docs/BA/research/…` | {…} |
| PO notes | {biên bản / chat / cột PO note} | {ngày} |

## 2. Quyết định đã xác nhận (Confirmed Decisions)

| ID | Feature | Decision Point | Reference | Target Decision | Final Rule | Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| PD-001 | {tính năng} | {điểm cần quyết định} | {hành vi app tham chiếu, kèm nhãn bằng chứng} | KEEP / MODIFY / REMOVE / NEW | {quy tắc cuối cùng cho sản phẩm} | PO / Figma / Research / Existing Requirement | Confirmed |

## 3. Quyết định còn mở (Open Decisions)

| ID | Feature | Question | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| PD-002 | {tính năng} | {câu hỏi cần PO trả lời} | P0 / P1 / P2 | TBD |

## 4. Hành vi tham chiếu được điều chỉnh (Modified Reference Behaviors)

| ID | Hành vi tham chiếu (Reference behavior) | Hành vi sản phẩm (Target behavior) |
| :--- | :--- | :--- |
| PD-001 | {app tham chiếu làm gì} | {sản phẩm làm khác thế nào} |

## 5. Hành vi tham chiếu bị loại bỏ (Removed Reference Behaviors)

- `PD-{NNN}` — {hành vi của app tham chiếu không đưa vào sản phẩm} — {lý do}

## 6. Hành vi mới của sản phẩm (New Target Behaviors)

- `PD-{NNN}` — {hành vi mới không có ở app tham chiếu} — {nguồn: Figma / PO / Research}

## 7. Liên kết bằng chứng (Evidence Links)

| ID | Bằng chứng tham chiếu (Reference evidence) | Thiết kế mục tiêu (Target design) | Quyết định có sẵn (Existing decision) |
| :--- | :--- | :--- | :--- |
| PD-001 | `{app-slug}_flow-{flow}_{YYYYMMDD}_v{N}.md` §{…}, `screens/{flow}-{NN}-{slug}.png` | `FR-DSN-{NNN}`, node `{123:456}` | {PO note / FR / BR hoặc none} |

## 8. Kết luận sẵn sàng (Readiness Verdict)

**Kết luận (Verdict):** READY FOR SRS / NOT READY FOR SRS

- **Lý do (Reasons):** {không còn P0 mở, phạm vi rõ, hành vi cốt lõi đã xác nhận — hoặc các điểm chặn}
- **P0 còn mở (Blocking items):** {PD-ID hoặc none}
- **P1/P2 được chuyển sang SRS dưới dạng câu hỏi mở (Deferred items):** {PD-ID hoặc none}
- **Bước tiếp theo (Next step):** {`specs analyze` với file này làm đầu vào / giải quyết PD-ID trước}

## 9. Lịch sử thay đổi (Change Log)

| Phiên bản (Version) | Ngày (Date) | Tác giả (Author) | Thay đổi (Changes) |
| :--- | :--- | :--- | :--- |
| v1 | {YYYY-MM-DD} | {author} | Khởi tạo tài liệu |
