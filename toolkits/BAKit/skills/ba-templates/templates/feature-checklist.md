# Bảng kiểm tra tính năng sản phẩm (Product Feature Checklist) — {Tên dự án / Phân hệ}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Dự án / Sản phẩm (Target Project) | {Project name} |
| Phạm vi / Phân hệ (Scope / Modules) | {Full Product / Tên module hoặc nhóm tính năng} |
| Ngày tạo / Cập nhật (Date) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản tài liệu (Version) | v1 |
| Nguồn tổng hợp (Synthesized Sources) | {Competitor Extractions, Figma Analysis, PRD, Product Decisions} |
| Trạng thái phạm vi (Scope Status) | Bản nháp / Đã chốt PO (Draft / PO Confirmed) |

## 1. Tổng quan nguồn đầu vào (Input Sources Summary)

| Nguồn dữ liệu (Source Type) | Tài liệu / Đường dẫn (Files / Links) | Vai trò tổng hợp (Synthesis Role) |
| :--- | :--- | :--- |
| Quyết định sản phẩm / PO (Product Decisions & PRD) | `docs/BA/decisions/…` hoặc `docs/ba/product-decisions/…`, PRD / Checklist Link | Xác định phạm vi mục tiêu (`KEEP / MODIFY / REMOVE / NEW / TBD`) và ghi chú PO |
| Thiết kế mục tiêu (Target Figma Design) | `docs/BA/figma/{feature}/…` hoặc `docs/inputs/design/…` | Xác định màn hình, thành phần UI và tính năng thiết kế của sản phẩm |
| Trích xuất tính năng đối thủ (Competitor Extractions) | `docs/BA/competitor/{app-slug}/{app-slug}_features_*.md`, `flow-*`, `screens` | Tham chiếu danh mục tính năng, hành vi chuẩn và lưu ý kỹ thuật |
| Tài liệu nghiên cứu / Brief (Briefs & Research) | `docs/BA/briefs/…`, `docs/BA/research/…` | Bổ sung giải pháp và phạm vi tính năng mới |

## 2. Bảng kiểm tra tính năng sản phẩm (Target Product Feature Checklist)

| STT | Group of feature | Tính năng | Tính năng nhỏ | Mô tả tính năng | Link tham khảo | Khả thi | Mức độ | Thời gian (about) | PO note | Ưu tiên | Technology notes |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Onboarding | Onboarding | | | | | | | | | |
| 2 | {Nhóm tính năng / Module} | {Tính năng chính} | {Tính năng nhỏ} | {Mô tả chức năng cho sản phẩm của chúng ta bằng tiếng Việt tự nhiên, giữ tên màn hình/tính năng/UI bằng tiếng Anh không kèm dịch trong ngoặc} | {figma/...; competitor/...; PD-001} | | | | {Ghi chú PO hoặc trạng thái KEEP/MODIFY/NEW/TBD} | {Chỉ điền khi PO/PRD đã chốt} | {Ràng buộc kỹ thuật, quyền thiết bị, SDK, phần cứng nếu có} |

> **Quy tắc điền bảng (Ownership Rule):**
> - **Tự động tổng hợp (BA / Agent):** `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng` (**riêng dòng `Onboarding` bắt buộc để trống `Mô tả tính năng`**), `Link tham khảo` (để trống nếu chưa có nguồn cụ thể hoặc khi trích xuất thuần APK), `PO note` (chỉ từ quyết định PO/Product Decision hoặc đánh dấu `[TBD]`), `Technology notes` (khi có ràng buộc kỹ thuật thực tế).
> - **Không tự suy diễn/ước lượng (Dev / Tech / PO Owned):** Để trống `Khả thi`, `Mức độ`, `Thời gian (about)`, và `Ưu tiên` trừ khi đã được Tech, Dev hoặc Product Owner cung cấp rõ ràng.

## 3. Điểm cần PO / Tech chốt (Open Scope & Verification Notes)

- **Tính năng cần PO xác nhận phạm vi (`TBD` / Xung đột giữa Đối thủ & Figma):**
  - {Danh sách các điểm khác biệt giữa app tham chiếu và thiết kế Figma hoặc chưa rõ KEEP/MODIFY/REMOVE}
- **Tính năng mới riêng của sản phẩm (`NEW`):**
  - {Danh sách tính năng có trong PRD/Figma/PO yêu cầu nhưng không có ở app đối thủ}
- **Tính năng đối thủ đã loại trừ khỏi phạm vi (`REMOVE` / Out of Scope):**
  - {Danh sách tính năng tham chiếu đã quyết định không đưa vào sản phẩm}
- **Lưu ý kỹ thuật cần Tech/Dev đánh giá khả thi:**
  - {Các ràng buộc phần cứng, SDK, hiệu năng hoặc API cần Tech điền cột Khả thi / Thời gian}
