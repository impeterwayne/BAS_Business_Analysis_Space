---
name: ba-shared-validation-rules
description: Quy tắc chuẩn mực chung về mô tả trường dữ liệu, quy tắc hiển thị, hành động và validation cho tất cả tài liệu BA (Mobile & Report).
---

# Quy Tắc Định Nghĩa Component & Validation (Dùng Chung)

Tất cả các Agent đảm nhiệm vai trò Document Architect (Mobile, Report) BẮT BUỘC phải kế thừa và áp dụng triệt để các quy tắc sau vào mọi bảng mô tả trường dữ liệu.

## 1. Cấu Trúc Bắt Buộc Của Cột "Mô tả/Ghi chú"

Mỗi trường dữ liệu trên màn hình bắt buộc phải có đủ 3 phần trong cột Ghi chú, ngăn cách bằng thẻ `<br>`:

1. **Quy tắc hiển thị:** [nội dung]
2. **Quy tắc hành động:** [nội dung]
3. **Validation:** [nội dung]

## 2. Chi Tiết Từng Phần

### A. Quy tắc hiển thị

Bao gồm các yếu tố sau (nếu có):
- **Trạng thái mặc định:** Enabled / Disabled / Read-only / Hidden.
- **Giá trị mặc định (Default Value):** 
  - KHÔNG phải trường nào cũng có default. 
  - *Bắt buộc có default đối với:* Dropdown list (vd: option đầu tiên hoặc "Tất cả"), Radio button (default option), Tab (default tab được focus), Menu/Sidebar (default active item). 
  - Text field có thể có hoặc không.
- **Placeholder:** Ghi rõ text (VD: `Placeholder: "Nhập nội dung"`).
- **Max/Min length & Overflow:**
  - Quy định rõ độ dài tối đa/tối thiểu (VD: `Max: 255 ký tự`).
  - **Hành vi vượt Max Length:** Phải chỉ rõ là **Block input** (không cho gõ thêm), **Truncate** (hiển thị `...`), hay **Wrap text** (xuống dòng tự động).
- **Empty State:** Khi không có dữ liệu, trường label rỗng hiển thị `-`, danh sách rỗng hiển thị `"Không có dữ liệu"` (không có dấu chấm cuối câu).

### B. Quy tắc hành động

- **Action của người dùng:** Tap, Swipe, Scroll, Hover, On-blur, Click outside.
- **System Action:** Auto-trim spaces, auto-focus, debounce (hiển thị kết quả sau N giây), toggle show/hide (khi chọn radio).

### C. Validation & Error Messages

Quy định bắt buộc về việc ghi thông báo lỗi:
- **Nguyên tắc "Exact String":** BẮT BUỘC ghi chính xác nguyên văn câu thông báo lỗi cho TỪNG case cụ thể. CẤM viết chung chung kiểu "Báo lỗi sai định dạng".
- **Các case tiêu chuẩn cần cover:**
  1. Bỏ trống (Required field): `"Vui lòng nhập [tên trường]"` hoặc `"Vui lòng chọn [tên trường]"`.
  2. Sai format (Regex): (VD: Email, SĐT, Số CMND).
  3. Ký tự không hợp lệ: (VD: block nhập text vào trường số).
  4. Giới hạn giá trị: Lớn hơn max, nhỏ hơn min.
- **Các case ĐẶC THÙ (Quan trọng):** Phải chủ động nhận diện các case nghiệp vụ đặc thù như:
  - **Check trùng (Duplicate):** (VD: `"Tên dự án đã tồn tại trong hệ thống. Vui lòng nhập tên khác"`). Nếu user quên mô tả case check trùng, Agent phải HỎI user để bổ sung.
  - **Cross-field validation:** So sánh Từ ngày - Đến ngày, giá trị max phải lớn hơn min, v.v.
- **Referencing CMR (Smart Referencing):** 
  - Chỉ ghi tham chiếu (VD: `Tham chiếu: CMR-07`). 
  - **TUYỆT ĐỐI KHÔNG copy y nguyên toàn bộ text rule từ file CMR vào SRS.** SRS chỉ ghi tham chiếu để QA tự đối chiếu. 
  - **Ngoại lệ:** Những validation *vượt ra ngoài* chuẩn CMR chung (như logic check trùng đặc thù của chức năng đó, hoặc rule riêng biệt) thì phải ghi rõ chi tiết logic và error message ngay trong file SRS. Nếu không rõ, HỎI lại user: *"Case check trùng này ghi vào SRS hay update vào CMR chung?"*
- **Quy tắc dấu câu:** Toàn bộ error message, toast, empty state **không có dấu `.` ở cuối câu**.

## 3. Quy Tắc Block Lặp & Phân Trang

- **Dynamic/Collapsible Block:** Phải mô tả rõ trạng thái mặc định của section là Expand (mở) hay Collapse (thu gọn). Nêu rõ điều kiện ẩn hiện (VD: Chọn Checkbox A thì hiện Block B).
- **Phân trang (Pagination):** Mô tả rõ scroll-to-load (Infinite scroll - Mobile) hay phân trang theo số (Report).

## 4. Lịch Sử Cập Nhật (Changelog)

Bắt buộc mọi file SRS cuối cùng phải có bảng Lịch sử cập nhật ở đầu hoặc cuối file với các cột: `Ngày | Phiên bản | Mục cập nhật | Before | After | Ghi chú`.
