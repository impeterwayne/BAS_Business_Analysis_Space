# ĐẶC TẢ YÊU CẦU NGƯỜI SỬ DỤNG

## Nhóm chức năng Đăng nhập, đăng xuất

### Đăng nhập, đăng xuất hệ thống

**Mô tả chức năng:**

* **Tên chức năng:** Đăng nhập, đăng xuất hệ thống
* **Mô tả:** Chức năng cho phép người dùng có thể Đăng nhập, đăng xuất khỏi hệ thống
* **Phân quyền:** Toàn bộ người dùng hệ thống.
* **Truy cập chức năng:** Truy cập vào hệ thống Quản lý, cấp định danh điện tử
* **Chức năng đáp ứng usecase số:** 1, 124

---

### 1. Giao diện danh sách

**Giao diện:** `/`

**Mô tả giao diện:**

| #                                                | Tên trường   | Kiểu trường | Giá trị mặc định | Được sửa | Bắt buộc | Mô tả                                                                                                                                                                                                                                               |
| ------------------------------------------------ | --------------- | -------------- | --------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khung Điều kiện tìm kiếm**          |                 |                |                       |              |            |                                                                                                                                                                                                                                                       |
| 1                                                | Mã phần mềm  | Textbox        | Null                  | x            |            | - Người dùng nhập từ bàn phím.`<br>`- Tìm kiếm chính xác, không phân biệt hoa, thường.                                                                                                                                              |
| 2                                                | Tên phần mềm | Textbox        | Null                  | x            |            | - Người dùng nhập từ bàn phím tên tiếng Lào hoặc tên tiếng Việt của phần mềm.`<br>`- Cho phép tìm kiếm like, tìm kiếm không dấu, không phân biệt chữ hoa, chữ thường.                                                |
| 3                                                | URL             | Textbox        | Null                  | x            |            | - Người dùng nhập từ bàn phím.`<br>`- Tìm kiếm chính xác.                                                                                                                                                                                |
| 4                                                | Trạng thái    | Combobox       | Null                  | x            |            | - Người dùng chọn 1 giá trị trong danh sách:`<br>`  + Hiệu lực;`<br>`  + Không hiệu lực.`<br>`- Tìm kiếm chính xác.                                                                                                             |
| **Khung Danh sách phần mềm tích hợp** |                 |                |                       |              |            |                                                                                                                                                                                                                                                       |
| 5                                                | STT             | Textbox        | Null                  |              |            | Hiển thị thứ tự: 1, 2, 3… tăng dần.                                                                                                                                                                                                            |
| 6                                                | Mã phần mềm  | Textbox        | Null                  |              |            | Hiển thị mã phần mềm.                                                                                                                                                                                                                            |
| 7                                                | Tên phần mềm | Textbox        | Null                  |              |            | Hiển thị tên phần mềm theo ngôn ngữ người dùng sử dụng:`<br>`  + Tên phần mềm bằng tiếng Lào nếu ngôn ngữ sử dụng là tiếng Lào.`<br>`  + Tên phần mềm bằng tiếng Việt nếu ngôn ngữ sử dụng là tiếng Việt. |
| 8                                                | URL             | Textbox        | Null                  |              |            | Hiển thị URL của phần mềm tương ứng.                                                                                                                                                                                                          |
| 9                                                | Hiệu lực      | Checkbox       | Null                  |              |            | Check nếu bản ghi phần mềm tích hợp có trạng thái là Hiệu lực.                                                                                                                                                                            |
| **Các button**                            |                 |                |                       |              |            |                                                                                                                                                                                                                                                       |
| 10                                               | Tìm kiếm      | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Tìm kiếm.                                                                                                                                                                      |
| 11                                               | Làm mới       | Button         |                       |              |            | Đưa các trường thông tin tại khung tìm kiếm về giá trị mặc định đồng thời trả kết quả tìm kiếm về mặc định.                                                                                                                |
| 12                                               | Xem chi tiết   | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Xem chi tiết.                                                                                                                                                                   |
| 13                                               | Thêm mới      | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Thêm mới.                                                                                                                                                                      |
| 14                                               | Sửa            | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Sửa.                                                                                                                                                                            |
| 15                                               | Kết xuất      | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Kết xuất.                                                                                                                                                                      |

**Mô tả các xử lý của chức năng:**

* **Yêu cầu về hiển thị tại khung danh sách phần mềm tích hợp:**
  * Mặc định hiển thị toàn bộ phần mềm tích hợp;
  * Sắp xếp thứ tự bản ghi lần lượt theo mã phần mềm tích hợp;
  * Thực hiện phân trang danh sách, cho phép người dùng chọn hiển thị số bản ghi tại mỗi trang.
* **Thao tác tìm kiếm:**
  Tại giao diện Quản lý phần mềm tích hợp, người dùng nhập thông tin tìm kiếm và nhấn nút Tìm kiếm:
  * Nếu không có dữ liệu phù hợp với điều kiện tìm kiếm, hệ thống hiển thị header bảng và dữ liệu trống và hiển thị thông báo *“Không có bản ghi đáp ứng điều kiện tìm kiếm”*.
  * Trường... *(Bản gốc bị ngắt đoạn tại đây)*

---

### 2. Giao diện thêm mới

**Giao diện:** `/`

**Mô tả giao diện:**

| #                               | Tên trường     | Kiểu trường | Giá trị mặc định | Được sửa | Bắt buộc | Ghi chú                                                                                                                           |
| ------------------------------- | ----------------- | -------------- | --------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Thông tin thêm mới** |                   |                |                       |              |            |                                                                                                                                    |
| 1                               | Mã phần mềm    | Textbox        | Null                  | x            | x          | Người dùng nhập mã quốc gia.                                                                                                 |
| 2                               | URL               | Combobox       | Hiệu lực            | x            | x          | - Người dùng nhập URL của phần mềm.`<br>`- Chỉ được phép nhập ký tự chữ, số và ký “-“, “.”, “_”, “/”. |
| 3                               | Trạng thái      | Combobox       | Hiệu lực            | x            | x          | Người dùng chọn trạng thái của bản ghi:`<br>`+ Hiệu lực;`<br>`+ Không hiệu lực.                                   |
| 4                               | Tên tiếng Lào  | Textbox        | Null                  | x            | x          | Người dùng nhập tên tiếng Lào của phần mềm.                                                                              |
| 5                               | Tên tiếng Việt | Textbox        | Null                  | x            |            | Người dùng nhập tên tiếng Việt của phần mềm.                                                                             |
| 6                               | Mô tả           | Textbox        | Null                  | x            |            | Người dùng nhập mô tả của phần mềm.                                                                                       |
| **Các button**           |                   |                |                       |              |            |                                                                                                                                    |
| 7                               | Lưu              | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Thêm mới.                                                   |
| 8                               | Hủy              | Button         |                       |              |            | Mô tả chi tiết tại phân hệ Mô tả các xử lý của thao tác Thêm mới.                                                   |

**Mô tả các xử lý của chức năng:**

* **Yêu cầu về hiển thị tại khung danh sách phần mềm tích hợp:**
  * Mặc định hiển thị toàn bộ phần mềm tích hợp;
  * Sắp xếp thứ tự bản ghi lần lượt theo mã phần mềm tích hợp;
  * Thực hiện phân trang danh sách, cho phép người dùng chọn hiển thị số bản ghi tại mỗi trang.
* **Thao tác tìm kiếm:**
  Tại giao diện Quản lý phần mềm tích hợp, người dùng nhập thông tin tìm kiếm và nhấn nút Tìm kiếm:
  * Nếu không có dữ liệu phù hợp với điều kiện tìm kiếm, hệ thống hiển thị header bảng và dữ liệu trống và hiển thị thông báo *“Không có bản ghi đáp ứng điều kiện tìm kiếm”*.

---

### 3. Giao diện sửa

Tương tự các thông tin màn hình Thêm mới.

---

### 4. Giao diện xem chi tiết

Màn hình chi tiết hiển thị các trường thông tin đã nhập ở màn hình thêm mới / màn hình sửa.
