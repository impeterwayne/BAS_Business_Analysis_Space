# Bảng kiểm tra tính năng ứng dụng (Feature Checklist) — {Tên ứng dụng}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Ứng dụng tham chiếu (Reference App) | {App name} |
| Package | `{com.competitor.app}` |
| Phiên bản (Version) | {versionName (versionCode)} |
| Ngày trích xuất (Extracted Date) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản tài liệu (Version) | v1 |
| Nguồn bằng chứng (Evidence Files) | {profile / screens / flows / code-index} |
| Trạng thái trích xuất (Extraction Status) | Hoàn thành / Một phần (Complete / Partial) |

## 1. Tổng quan nguồn dữ liệu (Source Summary)

| Thuộc tính (Attribute) | Chi tiết (Details) |
| :--- | :--- |
| Thư mục bằng chứng (Evidence Directory) | `docs/BA/competitor/{app-slug}/` |
| Hồ sơ ứng dụng (Profile) | `{app-slug}_profile_{YYYYMMDD}_v1.md` |
| Danh mục màn hình (Screens) | `{app-slug}_screens_{YYYYMMDD}_v1.md` |
| Phân tích luồng (Flows) | `{app-slug}_flow-*_{YYYYMMDD}_v1.md` |
| Chỉ mục mã nguồn (Code Index) | `code-index/_meta.md` (nếu có) |

## 2. Bảng kiểm tra tính năng (Feature Checklist)

| STT | Group of feature | Tính năng | Tính năng nhỏ | Mô tả tính năng | Link tham khảo | Khả thi | Mức độ | Thời gian (about) | PO note | Ưu tiên | Technology notes |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | {Nhóm tính năng} | {Tính năng chính} | {Tính năng nhỏ} | {Mô tả mục đích và hành vi tham chiếu quan trọng} | {flow-*.md; screens.md; profile.md} | | | | | | {Ghi chú kỹ thuật nếu có ràng buộc rõ ràng} |

> **Quy tắc điền bảng (Ownership Rule):**
> - **Tự động điền từ bằng chứng:** `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng`, `Link tham khảo`, `Technology notes` (chỉ khi có ràng buộc kỹ thuật rõ ràng).
> - **Không tự suy diễn/ước lượng:** Để trống các cột `Khả thi`, `Mức độ`, `Thời gian (about)`, `Ưu tiên`, `PO note` trừ khi có quyết định/dữ liệu chính thức từ Tech, Dev hoặc Product Owner.

## 3. Ghi chú độ phủ & Xác minh (Coverage / Verification Notes)

- **Luồng chưa khảo sát hoặc bị chặn (Missing or blocked flows):**
  - {Danh sách luồng chưa có dữ liệu hoặc bị chặn}
- **Xung đột bằng chứng (Evidence conflicts):**
  - {Các điểm mâu thuẫn giữa profile, screen và flow nếu có}
- **Tính năng chỉ có trong mã nguồn (Features supported only by code):**
  - {Tính năng [Code] chưa được kiểm chứng trực quan trên thiết bị}
- **Tính năng cần kiểm chứng thực tế (Features needing manual verification):**
  - {Tính năng [Inferred] hoặc cần tài khoản/môi trường đặc thù}
