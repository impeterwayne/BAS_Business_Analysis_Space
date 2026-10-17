# Workflow: Global Audit & Bulk Update (Hệ thống Kiểm toán & Cập nhật Diện rộng)

## 1. Mục đích
Workflow này được thiết kế để giải quyết bài toán kiểm tra tính nhất quán (Consistency) và cập nhật hàng loạt (Bulk Update) trên quy mô hàng chục/trăm file tài liệu Use Case, vượt qua giới hạn của từng AI Agent đơn lẻ.

## 2. Các Thành phần (Agents & Skills)
Workflow này sử dụng 2 kỹ năng chuyên biệt:
- **Phase A: The Analyzer** (`skill_global_impact_analyzer.md`) - Chuyên quét, so sánh và lập Ma trận ảnh hưởng.
- **Phase B: The Executor** (`skill_global_executor.md`) - Chuyên đọc Ma trận ảnh hưởng để đi sửa từng file cơ học.

## 3. Hướng dẫn Luồng thực thi (Dành cho BA)

### Bước 1: Khởi chạy Quét (Phase A)
Bạn (User) có thể gọi Agent chạy quét theo 2 chế độ (Mode):

**Mode 1: Blind Consistency Audit (Dò tìm bất đồng bộ tự do)**
- *Khi nào dùng:* Khi các BA vừa đẩy hết tài liệu lên, bạn muốn kiểm tra xem có ai viết sai chuẩn không, hoặc các file có bị đá nhau không.
- *Câu lệnh Trigger:* `"Kích hoạt skill global impact analyzer. Chạy Blind Audit cho folder @[kéo thả folder SRS-mobile hoặc SRS-report vào đây]."`
- *Hành động của AI:* AI sẽ quét toàn bộ file trong folder, tự động so sánh các trường dữ liệu phổ biến (Email, SĐT, Nút bấm...) xem chúng có giống nhau giữa các UC và có khớp với CMR không.

**Mode 2: Targeted Rule Audit (Dò tìm theo rule mới)**
- *Khi nào dùng:* Khi có một thông báo đổi luật (VD: "Từ nay mọi lỗi để trống đều phải có dấu chấm than ở cuối").
- *Câu lệnh Trigger:* `"Kích hoạt skill global impact analyzer. Chạy Targeted Audit. Rule mới là: [Mô tả rule]. Áp dụng cho folder @[folder]."`

### Bước 2: Review Ma trận Ảnh hưởng (Impact Matrix)
- Sau khi chạy Bước 1, AI sẽ sinh ra các file báo cáo lưu tại folder:
  - `docs/BA/SRS-mobile/Check inconsistencies/mobile-[YYYYMMDD]/` (Nếu quét Mobile)
  - `docs/BA/SRS-report/Check inconsistencies/report-[YYYYMMDD]/` (Nếu quét Report)
- Tên file sinh ra sẽ là: `Impact_Matrix_v1.md`.
- Bạn (BA Lead) sẽ mở file này lên xem. Nếu thấy AI bắt đúng, bạn chuyển sang Bước 3. Nếu sai, bạn tự sửa lại file Matrix này cho chuẩn.

### Bước 3: Thực thi Cập nhật (Phase B)
- *Câu lệnh Trigger:* `"Kích hoạt skill global executor. Thực thi dựa trên file @[Kéo thả file Impact_Matrix_v1.md vào đây]."`
- *Hành động của AI:* AI sẽ ngoan ngoãn mở từng file được liệt kê trong Matrix, tìm đúng dòng cần sửa, và ghi đè nội dung mới vào. Xong xuôi, nó sẽ báo cáo `[DONE]` cho bạn.
