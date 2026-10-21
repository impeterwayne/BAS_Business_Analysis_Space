<!--
USE CASE TEMPLATE — written INSIDE the single SRS file, under section 6 (module subsection).
Heading level: each Use Case starts with "####" because it sits under "## 6" → "### 6.x Module".
Language: Vietnamese content; keep screen names, UI component names and on-screen texts exactly as in the design.
Remove every {placeholder}. Omit a row only when genuinely not applicable.
-->

#### UC-{MOD}-{NNN}: {Tên Use Case — động từ + đối tượng}

##### 1. Tổng quan

| Mục | Nội dung |
|---|---|
| Mã UC | UC-{MOD}-{NNN} |
| Nhóm tính năng | {Group of feature — khớp Feature Checklist} |
| Tính năng / Tính năng nhỏ | {Tính năng / Tính năng nhỏ — khớp Feature Checklist} |
| Người dùng chính | {User / Free user / Premium user …} |
| Mục tiêu | {User làm gì, để đạt kết quả gì} |
| Điểm bắt đầu (Trigger) | {Hành động hoặc sự kiện cụ thể bắt đầu UC} |
| Tiền điều kiện | {Điều kiện kiểm chứng được, phải đúng trước khi bắt đầu} |
| Hậu điều kiện thành công | {Trạng thái app / dữ liệu sau khi thành công} |
| Hậu điều kiện thất bại / huỷ | {Trạng thái sau khi lỗi hoặc huỷ, nếu có} |
| Màn hình liên quan | {SCR-{MOD}-{NN} Tên màn, …} |
| Mức ưu tiên | {Theo Feature Checklist, hoặc TBD} |

##### 2. Đặc tả giao diện

<!-- Lặp lại mục 2.x cho từng màn hình thuộc UC này. Khối Design LUÔN đứng đầu mỗi màn hình. -->

###### 2.1. SCR-{MOD}-{NN} — {Tên màn hình}

**Design**

![SCR-{MOD}-{NN} {Tên màn hình}](../../BA/figma/{feature-slug}/screens/{NN}-{slug}.png)
<!-- Hoặc nếu ảnh đặt trong docs/inputs/design/: ![SCR-{MOD}-{NN} {Tên màn hình}](../../inputs/design/SCR-{MOD}-{NN}.png) -->
<!-- LƯU Ý: Đường dẫn PHẢI tính tương đối từ vị trí file SRS hiện tại (ví dụ từ docs/ba/srs/{app}_srs_v1.md lên docs/ là ../../). KHÔNG copy nguyên đường dẫn ngắn `screens/...` từ file phân tích Figma và KHÔNG để đường dẫn trong dấu backtick code. -->

- **Figma**: {link frame thật, hoặc "Không có link"}
- **Mục đích màn hình**: {Màn này dùng để làm gì trong UC}
- **Vào từ**: {Màn / hành động dẫn tới màn này}
- **Trạng thái có design**: {Default, Loading, Empty, Error … — chỉ liệt kê trạng thái có ảnh design}
- **Trạng thái thiếu design**: {Trạng thái cần nhưng chưa có design → Q-NNN, hoặc "Không có"}

<!-- Nếu file ảnh chưa có: thay dòng ảnh bằng "Design Pending — chưa có ảnh SCR-{MOD}-{NN}.png" và thêm câu hỏi mở. Không bao giờ chèn đường dẫn ảnh không tồn tại. -->
<!-- Trạng thái khác của cùng màn hình: đặt ảnh tên SCR-{MOD}-{NN}_{state}.png (ví dụ SCR-EDIT-01_empty.png) và chèn ngay dưới ảnh chính. -->

| UI ID | Thành phần | Nội dung hiển thị | Thao tác và phản hồi | Trạng thái / Điều kiện hiển thị / Validation |
|---|---|---|---|---|
| UI-01 | {Button Save} | {Icon + text "Save"} | {Bấm → App lưu ảnh, hiển thị loading} | {Disable khi chưa có chỉnh sửa} |
| UI-02 | {Input …} | {Placeholder …} | {Hành vi khi nhập} | {Giới hạn / định dạng / lỗi — chỉ khi đã chốt} |

**Popup / Dialog / Bottom Sheet**: {Điều kiện mở, nội dung, các nút và kết quả của từng nút, cách đóng — hoặc "Không có"}

###### 2.2. {Màn hình tiếp theo, nếu có}

##### 3. Luồng chính

| Bước | User | App | Màn hình / Trạng thái |
|---|---|---|---|
| 1 | {Hành động của User} | {Phản hồi của App} | {SCR-…, trạng thái} |
| 2 | {…} | {…} | {…} |

##### 4. Luồng thay thế

| Mã | Rẽ nhánh tại | Diễn biến | Quay lại / Kết thúc |
|---|---|---|---|
| AF-01 | {Tại bước N, khi …} | {User làm gì / App phản hồi gì} | {Quay lại bước M / kết thúc ở …} |

##### 5. Luồng ngoại lệ / Trường hợp biên

| Mã | Rẽ nhánh tại / Điều kiện | Phản hồi của App | Kết quả / Cách khôi phục |
|---|---|---|---|
| EF-01 | {Tại bước N, khi mất mạng …} | {Hiển thị … — text đúng như design} | {Thử lại / huỷ / ở lại màn …} |

<!-- Xem xét: từ chối quyền, mất mạng, dữ liệu rỗng, dữ liệu không hợp lệ, bị gián đoạn, bấm liên tục, Back/Close khi chưa lưu. Chỉ ghi cách xử lý đã chốt; còn lại ghi Câu hỏi mở. -->

##### 6. Quy tắc nghiệp vụ

| Mã | Khi / Điều kiện | Quy tắc | Áp dụng cho |
|---|---|---|---|
| BR-{NNN} | {Khi …} | {Quy tắc kiểm chứng được: giá trị mặc định, giới hạn, lưu / reset …} | {UI-xx / bước N / AF-xx} |

<!-- Quy tắc dùng chung nhiều UC: đặt ở mục 4 của SRS và chỉ tham chiếu mã BR ở đây. -->

##### 7. Điều hướng / Kết quả

| Tình huống | Màn hình / Kết quả | Dữ liệu |
|---|---|---|
| Thành công | {…} | {Lưu / cập nhật gì} |
| Thất bại | {…} | {Dữ liệu giữ / huỷ} |
| Back / Close / Huỷ | {…} | {Dữ liệu giữ / huỷ} |

##### 8. Sơ đồ liên quan

| Loại sơ đồ | Mã | Phạm vi |
|---|---|---|
| User Flow (bắt buộc) | [UF-{MOD}-{NNN}](#uf-{mod}-{nnn}) | {Hành trình chung của nhóm tính năng / riêng UC} |
| Activity Diagram (khi là tính năng lớn) | [ACT-{MOD}-{NNN}](#act-{mod}-{nnn}) hoặc "Không cần" | {Quy trình được mô tả} |

##### 9. Câu hỏi mở

| Mã | Nội dung cần chốt | Ảnh hưởng | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| Q-{NNN} | {Điều còn thiếu} | {Bước / quy tắc / UI bị ảnh hưởng} | P0/P1/P2 | Mở |

<!-- Không có câu hỏi: ghi "Không có". -->
