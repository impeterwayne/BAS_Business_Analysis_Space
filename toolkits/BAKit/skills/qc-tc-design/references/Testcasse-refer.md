# Test Cases Reference

> Tài liệu tham khảo test case (chuyển đổi từ file `Testcasse-refer.xlsx`, sheet **Test Cases**).
> Mỗi test case gồm 6 trường: **ID_TC**, **Test Title/Summary**, **Pre-condition**, **Step**, **Expected Result**, **Priority**.

---

## I. Màn hình: Danh sách báo cáo

### I.1. Kiểm tra UI/UX của màn hình: Danh sách báo cáo

#### I.1_01

- **Title:** Kiểm tra màn hình khởi tạo: Danh sách báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra màn hình khởi tạo
- **Expected Result:**
  2. Hiển thị màn hình "Danh sách báo cáo" giống design (Refer Item I. Danh sách Báo cáo tại sheet WF/Design)
  - Thanh tìm kiếm: mặc định trống, cho phép nhập dữ liệu
  - Dropdown [Năm]
  - Dropdown [Trạng thái kỳ]
  - Dropdown [Trạng thái báo cáo]
  - Danh sách các kỳ báo cáo:
   + Hiển thị đủ số báo cáo của các quý theo năm từ năm có báo cáo đến năm hiện tại
   + Các cột: Kỳ báo cáo, Trạng thái kỳ báo cáo
   + Được sắp xếp từ mới nhất đến cũ nhất theo kỳ báo cáo
  - Trong từng kỳ báo cáo, gồm:
   + Các cột: Mã báo cáo, Tên dự án, Ngày cập nhật/nộp, Trạng thái báo cáo, Hành động
   + Được sắp xếp từ mới nhất đến cũ nhất theo cột Ngày cập nhật/Nộp
  - Phân trang theo kỳ báo cáo:
   + Default: 10 kỳ báo cáo / trang
   + Dropdown chọn số kỳ hiển thị: mặc định là 10

#### I.1_02

- **Title:** Thanh tìm kiếm: Kiểm tra hiển thị
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, kiểm tra hiển thị placeholder
- **Expected Result:** 2. Hiển thị placeholder: "Tìm kiếm theo mã báo cáo"

#### I.1_03

- **Title:** Thanh tìm kiếm: Kiểm tra maxlength
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, nhập lớn hơn 500 ký tự
- **Expected Result:** 2. Chỉ cho phép nhập tối đa 500 ký tự

#### I.1_04

- **Title:** Thanh tìm kiếm: Kiểm tra các loại ký tự cho phép nhập
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, nhập tất cả các loại ký tự
- **Expected Result:** 2. Cho phép nhập tất cả các loại ký tự

#### I.1_05

- **Title:** Dropdown [Năm]: Kiểm tra trạng thái mặc định
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Năm], kiểm tra trạng thái mặc định
- **Expected Result:**
  2. Mặc định hiển thị: Tất cả năm
  - Dropdown cho phép chọn nhiều giá trị bên trong

#### I.1_06

- **Title:** Dropdown [Năm]: Kiểm tra giá trị trong dropdown
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Năm], kiểm tra giá trị trong dropdown
- **Expected Result:**
  2. Danh sách giá trị:
   + Năm hiện tại
   + Giá trị các năm cũ phát sinh do dữ liệu khi đồng bộ hoặc phát sinh khi dùng phần mềm

#### I.1_07

- **Title:** Dropdown [Trạng thái kỳ báo cáo]: Kiểm tra trạng thái mặc định
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Trạng thái kỳ báo cáo], kiểm tra trạng thái mặc định
- **Expected Result:**
  2. Mặc định hiển thị: Tất cả Trạng thái kỳ báo cáo
  - Dropdown cho phép chọn nhiều giá trị bên trong

#### I.1_08

- **Title:** Dropdown [Trạng thái kỳ báo cáo]: Kiểm tra giá trị trong dropdown
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Trạng thái kỳ báo cáo], kiểm tra giá trị trong dropdown
- **Expected Result:**
  2. Danh sách giá trị:
   + Qua hạn nộp báo cáo
   + Trong thời gian nộp báo cáo
   + Chưa tới hạn nộp báo cáo

#### I.1_09

- **Title:** Dropdown [Trạng thái báo cáo]: Kiểm tra trạng thái mặc định
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Trạng thái báo cáo], kiểm tra trạng thái mặc định
- **Expected Result:**
  2. Mặc định hiển thị: Tất cả Trạng thái báo cáo
  - Dropdown cho phép chọn nhiều giá trị bên trong

#### I.1_10

- **Title:** Dropdown [Trạng thái báo cáo]: Kiểm tra giá trị trong dropdown
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại dropdown [Trạng thái báo cáo], kiểm tra giá trị trong dropdown
- **Expected Result:**
  2. Danh sách giá trị:
  + Lưu nháp
  + Đã nộp
  + Yêu cầu chỉnh sửa

#### I.1_11

- **Title:** Nút [Lập báo cáo]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Lập báo cáo] trên các kỳ báo cáo
- **Expected Result:** 2. Nút hiển thị ở các kỳ báo cáo có trạng thái kỳ là: "Trong thời gian nộp báo cáo"

#### I.1_12

- **Title:** Nút [Import]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Import] trên các kỳ báo cáo
- **Expected Result:** 2. Nút hiển thị ở các kỳ báo cáo có trạng thái kỳ là: "Trong thời gian nộp báo cáo"

#### I.1_13

- **Title:** Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Pre-condition:** Nếu quý < quý hiện tại
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Expected Result:** 2. Hiển thị trạng thái: "Qua hạn nộp báo cáo"

#### I.1_14

- **Title:** Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Pre-condition:** Nếu quý = quý hiện tại
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Expected Result:** 2. Hiển thị trạng thái: "Trong thời hạn nộp báo cáo"

#### I.1_15

- **Title:** Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Pre-condition:** Nếu quý > quý hiện tại
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị trạng thái của kỳ báo cáo
- **Expected Result:** 2. Hiển thị trạng thái: "Chưa tới hạn nộp báo cáo"

#### I.1_16

- **Title:** Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi có báo cáo
- **Pre-condition:** Trạng thái quý báo cáo: "Trong thời hạn nộp báo cáo"
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị kỳ báo cáo khi có báo cáo
- **Expected Result:**
  2. Hiển thị đầy đủ các báo cáo được sắp xếp từ mới nhất đến cũ nhất theo cột Ngày cập nhật/Nộp và đúng các cột:
  - Mã báo cáo
  - Tên dự án
  - Ngày cập nhật/nộp
  - Trạng thái báo cáo
  - Hành động

#### I.1_17

- **Title:** Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi có báo cáo
- **Pre-condition:** Trạng thái quý báo cáo: "Quá hạn nộp báo cáo"
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi có báo cáo
- **Expected Result:**
  2. Hiển thị đầy đủ các báo cáo được sắp xếp từ mới nhất đến cũ nhất theo cột Ngày cập nhật/Nộp và đúng các cột:
  - Mã báo cáo
  - Tên dự án
  - Ngày cập nhật/nộp
  - Trạng thái báo cáo
  - Hành động

#### I.1_18

- **Title:** Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Pre-condition:** Trạng thái quý báo cáo: "Chưa tới hạn nộp báo cáo"
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Expected Result:**
  2. Hiển thị nội dung:
  "Quý báo cáo này chưa tới hạn
  Vui lòng đợi đến thời hạn để lập báo cáo"

#### I.1_19

- **Title:** Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Pre-condition:** Trạng thái quý báo cáo: "Trong thời hạn nộp báo cáo"
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Expected Result:**
  2. Hiển thị nội dụng
  Chưa có bộ hồ sơ nào cho quý này
  Nhấn "Lập báo cáo" ở trên để tạo bộ hồ sơ mới

#### I.1_20

- **Title:** Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Pre-condition:** Trạng thái quý báo cáo: "Quá hạn nộp báo cáo"
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị dữ liệu của kỳ báo cáo khi không có báo cáo
- **Expected Result:**
  2. Hiển thị nội dụng
  Chưa có bộ hồ sơ nào cho quý này
  Không thể tạo thêm

#### I.1_21

- **Title:** Kiểm tra hiển thị thông tin của trường: Mã báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Mã báo cáo
- **Expected Result:**
  2. Hiển thị mã báo cáo được hệ thống tự động sinh ra
  - Rule: EZ_2111.H.QLKKT_[ID tự tăng]

#### I.1_22

- **Title:** Kiểm tra hiển thị thông tin của trường: Ngày cập nhật/nộp
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Ngày cập nhật/nộp
- **Expected Result:**
  2. Hiển thị ngày giờ cập nhật mới nhất của báo cáo ở tất cả các hành động bao gồm: Lập, Chỉnh Sửa, Lưu Nháp, Nộp
  - Định dạng: dd/MM/yyyy HH:mm.

#### I.1_23

- **Title:** Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Pre-condition:** Báo cáo mới tạo chưa được nộp
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Expected Result:** 2. Hiển thị trạng thái của báo cáo: Lưu nháp

#### I.1_24

- **Title:** Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Pre-condition:** Báo cáo đã nộp lên đơn vị tiếp nhận
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Expected Result:** 2. Hiển thị trạng thái của báo cáo: Đã nộp

#### I.1_25

- **Title:** Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Pre-condition:** Báo cáo bị đơn vị tiếp nhận yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Trạng thái báo cáo
- **Expected Result:** 2. Hiển thị trạng thái của báo cáo: Yêu cầu chỉnh sửa

#### I.1_26

- **Title:** Kiểm tra hiển thị thông tin của trường: Hành động
- **Pre-condition:** Trạng thái báo cáo: Lưu nháp
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Hành động
- **Expected Result:** 1. Hiển thị các nút hành động: Nộp, Chỉnh sửa, Xem chi tiết, Xem vòng đời, In, Export, Xóa

#### I.1_27

- **Title:** Kiểm tra hiển thị thông tin của trường: Hành động
- **Pre-condition:** Trạng thái báo cáo: Đã nộp
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Hành động
- **Expected Result:** 1. Hiển thị các nút hành động: Xem chi tiết, Xem vòng đời, In, Export

#### I.1_28

- **Title:** Kiểm tra hiển thị thông tin của trường: Hành động
- **Pre-condition:** Trạng thái báo cáo: Yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị thông tin của trường: Hành động
- **Expected Result:** 1. Hiển thị các nút hành động: Nộp, Chỉnh sửa, Xem chi tiết, Xem vòng đời, In, Export

#### I.1_29

- **Title:** Nút [Nộp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Nộp] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở các báo cáo có trạng thái là: "Lưu nháp" hoặc "Yêu cầu chỉnh sửa" và cho phép nhấn

#### I.1_30

- **Title:** Nút [Chỉnh sửa]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Chỉnh sửa] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở các báo cáo có trạng thái là: "Lưu nháp" hoặc "Yêu cầu chỉnh sửa" và cho phép nhấn

#### I.1_31

- **Title:** Nút [Xem chi tiết]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Xem chi tiết] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở tất cả các báo cáo và cho phép nhấn

#### I.1_32

- **Title:** Nút [Xem vòng đời]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Xem vòng đời] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở tất cả các báo cáo và cho phép nhấn

#### I.1_33

- **Title:** Nút [In]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [In] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở tất cả các báo cáo và cho phép nhấn

#### I.1_34

- **Title:** Nút [Export]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị nút [Export] trong mỗi báo cáo
- **Expected Result:** 2. Nút hiển thị ở tất cả các báo cáo và cho phép nhấn

#### I.1_35

- **Title:** Kiểm tra UI màn hình: Danh sách báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra UI trên màn hình
- **Expected Result:**
  2. Hiển thị màn hình "Danh sách báo cáo" giống design (Refer Item I. Danh sách Báo cáo tại sheet WF/Design)
  - Tên các item được hiển thị đầy đủ thông tin đúng như mô tả trong thiết kế màn hình, không có text sai hoặc bị chồng lấn giữa các item trên màn hình
  - Số lượng item hiển thị đầy đủ và giống với thiết kế màn hình
  - Vị trí các item giống với thiết kế màn hình
  - Font chữ, kích thước chữ, màu sắc, kiểu chữ giống với thiết kế màn hình
  - Căn chỉnh của các item giống với thiết kế màn hình

#### I.1_36

- **Title:** Kiểm tra khi zoom in/zoom out màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Thực hiện zoom in/zoom out màn hình
- **Expected Result:** 2. Layout màn hình không bị vỡ, không xảy ra bất thường

#### I.1_37

- **Title:** Kiểm tra dữ liệu với độ dài tối đa (maxlength)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra dữ liệu hiển thị khi nhập đến giới hạn maxlength
- **Expected Result:** 2. Không xảy ra lỗi font chữ

#### I.1_38

- **Title:** Kiểm tra nhấn phím F5
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn phím F5
- **Expected Result:** 2. Trang được refresh thành công

#### I.1_39

- **Title:** Kiểm tra nút Back của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn nút Back trên trình duyệt
- **Expected Result:** 2. Màn hình trước đó được mở

#### I.1_40

- **Title:** Kiểm tra nút Next của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn nút Next trên trình duyệt
- **Expected Result:** 2. Nút [Next] bị disable

#### I.1_41

- **Title:** Kiểm tra nút Refresh của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn nút Refresh trên trình duyệt
- **Expected Result:** 2. Trang được refresh thành công

#### I.1_42

- **Title:** Kiểm tra thao tác khi nhấn Tab và Shift + Tab
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra focus khi nhấn phím Tab
  3. Kiểm tra focus khi nhấn Shift + Tab
- **Expected Result:**
  2. Không có lỗi bất thường, focus đúng thứ tự các item trên màn hình
  Tab bỏ qua các field chỉ đọc (read-only)
  Tab bỏ qua các field bị disable
  Thứ tự Tab: từ trái → phải, từ trên → dưới
  3. Shift + Tab hoạt động ngược lại với Tab

#### I.1_43

- **Title:** Kiểm tra phím Backspace
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn Backspace nhiều lần tại các control cho phép nhập text để kiểm tra hành vi
- **Expected Result:** 2. Không xảy ra hiện tượng bất thường

#### I.1_44

- **Title:** Kiểm tra phím Enter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhập giá trị không hợp lệ và nhấn Enter nhiều lần để kiểm tra hành vi
- **Expected Result:** 2. Không xảy ra hiện tượng bất thường

#### I.1_45

- **Title:** Kiểm tra tính nhất quán của message
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra các message lỗi trên màn hình
- **Expected Result:**
  2. Các message lỗi cùng loại phải hiển thị giống nhau:
  - Message lỗi hiển thị bên dưới field bị lỗi
  - Toast message hiển thị ở góc trên màn hình trong 5 giây

### I.2. Kiểm tra FUNC của màn hình: Danh sách Báo cáo

#### I.2_01

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập đầy đủ mã báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập/Copy đầy đủ mã báo cáo tồn tại trong hệ thống, thuộc loại báo cáo KTCN11
  3. Nhấn Enter
- **Expected Result:** 3. Hiển thị kết quả tìm kiếm tương ứng theo mã báo cáo

#### I.2_02

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập 1 phần mã báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập/Copy 1 phần mã báo cáo tồn tại trong hệ thống, thuộc loại báo cáo KTCN11
  3. Nhấn Enter
- **Expected Result:** 3. Hiển thị kết quả tìm kiếm tương ứng theo mã báo cáo

#### I.2_03

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập tất cả chữ hoa
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập mã báo cáo hợp lệ tất cả đều là ký tự viết hoa
  3. Nhấn Enter
- **Expected Result:** 3. Không phân biệt chữ hoa/thường, tìm kiếm và hiển thị record có mã phiếu nhập như data đã nhập

#### I.2_04

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập tất cả chữ thường
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập mã báo cáo hợp lệ tất cả đều là ký tự viết thường
  3. Nhấn Enter
- **Expected Result:** 3. Không phân biệt chữ hoa/thường, tìm kiếm và hiển thị record có mã phiếu nhập như data đã nhập

#### I.2_05

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập cả chữ hoa và chữ thường
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập mã báo cáo hợp lệ mà các ký tự viết là chữ thường và chữ hoa
  3. Nhấn Enter
- **Expected Result:** 3. Không phân biệt chữ hoa/thường, tìm kiếm và hiển thị record có mã phiếu nhập như data đã nhập

#### I.2_06

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Nhập toàn bộ khoảng trắng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập toàn khoảng trắng
  3. Nhấn Enter
- **Expected Result:** 3. Auto trim khoảng trắng, hiển thị tất cả dữ liệu

#### I.2_07

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: nhập khoảng trắng ở đầu và cuối mã báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập khoảng trắng ở phía trước hoặc sau mã báo cáo
  3. Nhấn Enter
- **Expected Result:** 3. Tự động search không kèm dấu cách ở đầu và cuối  và hiển thị kết quả tìm kiếm tương ứng theo mã báo cáo

#### I.2_08

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Kiểm tra refresh trang khi tìm kiếm
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập mã báo cáo tồn tại trong hệ thống nhưng không ở page 1
  3. Nhấn Enter
- **Expected Result:** 3. Hiển thị kết quả tìm kiếm tương ứng theo mã báo cáo

#### I.2_09

- **Title:** Kiểm tra chức năng của Thanh tìm kiếm: Tìm kiếm không có kết quả
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Tại thanh tìm kiếm, Nhập mã báo cáo không có trong danh sách
  3. Nhấn Enter
- **Expected Result:** 3. Hiển thị màn hình với nội dung: Không tìm thấy kết quả

#### I.2_10

- **Title:** Kiểm tra chức năng của dropdown [Năm]
- **Pre-condition:** _(không có)_
- **Step:** 1. Chọn 1 hoặc nhiều giá trị trong bộ lọc
- **Expected Result:** 1. Hiển thị các kỳ báo cáo của các năm đã chọn

#### I.2_11

- **Title:** Kiểm tra chức năng của dropdown [Trạng thái kỳ báo cáo]
- **Pre-condition:** _(không có)_
- **Step:** 1. Chọn 1 hoặc nhiều giá trị trong bộ lọc
- **Expected Result:** 1. Hiển thị các kỳ báo cáo có trạng thái kỳ đã chọn

#### I.2_12

- **Title:** Kiểm tra chức năng của dropdown [Trạng thái báo cáo]
- **Pre-condition:** _(không có)_
- **Step:** 1. Chọn 1 hoặc nhiều giá trị trong bộ lọc
- **Expected Result:** 1. Hiển thị các báo cáo có trạng thái báo cáo đã chọn

#### I.2_13

- **Title:** Tìm kiếm kết hợp
- **Pre-condition:** _(không có)_
- **Step:** 1. Kết hợp tất cả các điều kiện
- **Expected Result:** 1. Thực hiện tìm kiếm theo điều kiện AND với ô Tìm kiếm và tất cả các filter

#### I.2_14

- **Title:** Kiểm tra hoạt động của nút: [Lập báo cáo]
- **Pre-condition:** Trạng tháikỳ báo cáo: Trong thời gian nộp báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
- **Expected Result:** 2. Chuyển hướng đến màn hình "Lập báo cáo"

#### I.2_15

- **Title:** Kiểm tra hoạt động của nút: [Import]
- **Pre-condition:** Trạng tháikỳ báo cáo: Trong thời gian nộp báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import]
- **Expected Result:** 1. Hiển thị popup: "Import báo cáo"

#### I.2_16

- **Title:** Kiểm tra hành động collapse một kỳ báo cáo bất kỳ
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào icon "v" hoặc Tên kỳ báo cáo
- **Expected Result:**
  1.
  - Icon chuyển ^
  - Hiển thị đầy đủ thông tin của các báo cáo trong kỳ báo cáo

#### I.2_17

- **Title:** Kiểm tra hành động expand một kỳ báo cáo bất kỳ
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào icon "^" hoặc Tên kỳ báo cáo
- **Expected Result:**
  1.
  - Icon chuyển thành v
  - Collapse quý:
   + Hiển thị tên quý báo cáo
   + Hiển thị ngày bắt đầu và kết thúc quý báo cáo, format: YYYY-MM-DD - YYYY-MM-DD
   + Hiển thị số lượng báo cáo trong quý
   + Hiển thị trạng thái quý báo cáo
   + Hiển thị nút hành động [Lập báo cáo], [Import]

#### I.2_18

- **Title:** Kiểm tra hoạt động của nút: [Chỉnh sửa]
- **Pre-condition:** Trạng thái báo cáo: Lưu nháp hoặc Yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa]
- **Expected Result:** 2. Chuyển hướng đến màn Chỉnh sửa báo cáo tương ứng

#### I.2_19

- **Title:** Kiểm tra hoạt động của nút: [Nộp]
- **Pre-condition:** Trạng thái báo cáo: Lưu nháp hoặc Yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
- **Expected Result:** 2. Mở popup: Xác nhận nộp báo cáo

#### I.2_20

- **Title:** Kiểm tra khởi tạo popup: "Nộp báo cáo"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Kiểm tra khởi tạo popup: Nộp báo cáo
- **Expected Result:**
  3. Hiển thị thông tin giống design, với các nút:
  - Checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]: uncheck
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Xác nhận]: disable

#### I.2_21

- **Title:** Popup: Nộp báo cáo - Kiểm tra checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Expected Result:** 3. Nút [Xác nhận] chuyển thành enable

#### I.2_22

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Nhấn vào nút [X]
- **Expected Result:** 3. Đóng popup, chưa nộp báo cáo thành công

#### I.2_23

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 3. Đóng popup, chưa nộp báo cáo thành công

#### I.2_24

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Nhấn ra bên ngoài popup
- **Expected Result:** 3. Đóng popup, chưa nộp báo cáo thành công

#### I.2_25

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  4. Nhấn vào nút [Xác nhận]
- **Expected Result:**
  4. Nộp báo cáo thành công
  - Hiển thị toast message: Thành công - Đã nộp báo cáo thành công!
  - Báo cáo được gửi lên cấp trên theo đúng vòng đời của báo cáo (gửi lên Cục Đầu tư nước ngoài)

#### I.2_26

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** Server error
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Nộp]
  3. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  4. Nhấn vào nút [Xác nhận]
- **Expected Result:** 1. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### I.2_27

- **Title:** Kiểm tra trạng thái khi báo cáo nộp thành công
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra trạng thái khi báo cáo nộp thành công
- **Expected Result:**
  2. Hiển thị các thông tin:
  - Trạng thái báo cáo: Đã nộp
  - Ngày cập nhật/nộp: hiển thị thời gian nộp báo cáo
  - Cột [Hành động] gồm: Xem chi tiết, Xem vòng đời, In, Export

#### I.2_28

- **Title:** Kiểm tra hoạt động của nút: [Xem chi tiết]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
- **Expected Result:** 2. Chuyển hướng đến màn hình: "Chi tiết báo cáo"

#### I.2_29

- **Title:** Kiểm tra hoạt động của nút: [Xem vòng đời]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem vòng đời]
- **Expected Result:** 2. Mở popup: Vòng đời báo cáo

#### I.2_30

- **Title:** Kiểm tra khởi tạo popup: "Vòng đời báo cáo"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem vòng đời]
  3. Kiểm tra khởi tạo popup: Vòng đời báo cáo
- **Expected Result:**
  3. Hiển thị thông tin giống design, với các nút:
  - Nút [X]: enable
  - Hiển thị các vòng đời của báo cáo:
   + Khởi tạo báo cáo: thông tin người khởi tạo, ngày, giờ khởi tạo báo cáo
   + Nộp báo cáo: Hiển thị khi báo cáo đươc nộp, hiển thị thông tin người nộp báo cáo, ngày, giờ nộp báo cáo
   + Yêu cầu chỉnh sửa: Hiển thị khi báo cáo bị phía trên yêu cầu chỉnh sửa, hiển thị thông tin người yêu cầu chỉnh sửa kèm lý do yêu cầu, ngày, giờ yêu cầu chỉnh sửa
  - Các bước trong vòng đời tương ứng với số cấp nộp báo cáo và hành động tương ứng

#### I.2_31

- **Title:** Popup: Vòng đời báo cáo - Kiểm tra hoạt động của nút: [X]
- **Pre-condition:** _(không có)_
- **Step:** Kiểm tra hoạt động của nút: [Import]
- **Expected Result:** 1. Đóng popup

#### I.2_32

- **Title:** Kiểm tra hoạt động của nút: [In]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [In]
- **Expected Result:** 2. Hệ thống mở Print Preview ở định dạng PDF

#### I.2_33

- **Title:** Kiểm tra dữ liệu ở màn Print Preview
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [In]
  3. Kiểm tra dữ liệu ở màn Print Preview
- **Expected Result:**
  3. Hiển thị thông tin báo cáo và đúng các mẫu báo cáo Biểu số 2111.H.QLKKT
  Link mẫu: [Project_Name] | Phân hệ Báo cáo | KCN, KKT

#### I.2_34

- **Title:** Kiểm tra hoạt động của nút [In] - Đã kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [In]
  3. Nhấn nút In trong mẫu Preview
- **Expected Result:**
  3. Đúng định dạng, đẹp, không bị lệch layout
  - Các trường thông tin trống hiển thị hợp lý (— hoặc trống)
  - Tự động tách trang theo từng mẫu báo cáo

#### I.2_35

- **Title:** Kiểm tra hoạt động của nút [In] - Chưa kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [In]
  3. Nhấn nút In trong mẫu Preview
- **Expected Result:** 3. Hiển thị thông báo lỗi: Chưa kết nối máy in

#### I.2_36

- **Title:** Kiểm tra hoạt động của nút: [Export]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Export]
- **Expected Result:** 2. Hệ thống tạo file .docx và mở folder cho phép chọn nơi lưu file hoặc tự động tải file về máy (tùy cấu hình từng máy tính)

#### I.2_37

- **Title:** Kiểm tra dữ liệu khi export báo cáo thành công
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Export]
  3. Kiểm tra dữ liệu khi export báo cáo thành công
- **Expected Result:**
  3
  - Tên file:
  - Nội dung file:
   + Hiển thị đúng, đủ, dữ liệu trong báo cáo
  - File format:
   + File mở được bằng Microsoft Word, không lỗi
   + Không lỗi font chữ, đúng format theo thiết kế

#### I.2_38

- **Title:** Kiểm tra hoạt động của nút: [Xóa]
- **Pre-condition:** Trạng thái báo cáo: Lưu nháp
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
- **Expected Result:** 2. Mở popup: "Xác nhận xóa báo cáo"

#### I.2_39

- **Title:** Kiểm tra khởi tạo popup: "Xác nhận xóa báo cáo"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Kiểm tra khởi tạo popup: "Xác nhận xóa báo cáo"
- **Expected Result:**
  3. Hiển thị thông tin giống design, với các nút:
  - Checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]: uncheck
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Đồng ý]: enable

#### I.2_40

- **Title:** Popup: Xác nhận xóa báo cáo - Kiểm tra hoạt động của nút: [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn vào nút [X]
- **Expected Result:** 3. Đóng popup, chưa xóa báo cáo thành công

#### I.2_41

- **Title:** Popup: Xác nhận xóa báo cáo - Kiểm tra hoạt động của nút: [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 3. Đóng popup, chưa xóa báo cáo thành công

#### I.2_42

- **Title:** Popup: Xác nhận xóa báo cáo - Kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn ra ngoài popup
- **Expected Result:** 3. Đóng popup, chưa xóa báo cáo thành công

#### I.2_43

- **Title:** Popup: Xác nhận xóa báo cáo - Kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:**
  3. Xóa báo cáo thành công
  - Hiển thị toast message: Thành công - Đã xóa báo cáo thành công!

#### I.2_44

- **Title:** Popup: Xác nhận xóa báo cáo - Kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** Server error
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:** 3. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### I.2_45

- **Title:** Kiểm tra trạng thái của báo cáo sau khi nộp thành công
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xóa]
  3. Nhấn vào nút [Đồng ý]
  4. Kiểm tra trạng thái của báo cáo sau khi xóa thành công
- **Expected Result:** 4. Báo cáo không còn hiển thị trên màn hình: Danh sách báo cáo

#### I.2_46

- **Title:** Kiểm tra hiển thị phân trang - Có nhiều hơn 10 kỳ báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị phân trang
- **Expected Result:** 2. Hiển thị phân trang

#### I.2_47

- **Title:** Kiểm tra hiển thị phân trang - Có ít hơn hoặc bằng 10 kỳ báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị phân trang
- **Expected Result:** 2. Hiển thị phân trang

#### I.2_48

- **Title:** Kiểm tra hoạt động của nút: [<]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [<]
- **Expected Result:**
  2.
  - Bị vô hiệu hóa khi ở Trang 1
  - Cho phép nhấn khi ở khác Trang 1
  - Nhấn nút sẽ chuyển về trang trước đó

#### I.2_49

- **Title:** Kiểm tra hoạt động của nút: [>]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [>]
- **Expected Result:**
  2.
  - Bị vô hiệu hóa khi ở Trang cuối cùng
  - Cho phép nhấn khi ở khác Trang cuối cùng
  - Nhấn nút sẽ chuyển sang trang kế tiếp

#### I.2_50

- **Title:** Kiểm tra hiển thị khi nhấn vào 1 trang bất kỳ
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị khi nhấn vào 1 trang bất kỳ
- **Expected Result:** 2. Mở trang tương ứng

#### I.2_51

- **Title:** Kiểm tra hiển thị số lượng kỳ hạn trong 1 trang
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị số lượng kỳ hạn trong 1 trang
- **Expected Result:** 2. Mỗi trang: 10 kỳ hạn

#### I.2_52

- **Title:** Kiểm tra phân trang kết hợp tìm kiếm/filter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Thực hiện tìm kiếm, filter
  3. Kiểm tra hiển thị của phân trang
- **Expected Result:**
  2.
  - Phân trang cập nhật đúng số trang theo kết quả tìm kiếm/filter
  - Chuyển trang không mất điều kiện search/filter
  - Refresh sẽ quay về trang 1
  - Xóa/chỉnh sửa record ở trang bất kỳ sẽ quay về trang 1

#### I.2_53

- **Title:** Kiểm tra các giá trị trong dropdown chọn số record hiển thị
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra các giá trị trong dropdown chọn số record hiển thị
- **Expected Result:**
  2. Hiển thị các lựa chọn:
  - 10/trang: mặc định được chọn
  - 20/trang
  - 50/trang
  - 100/trang

#### I.2_54

- **Title:** Kiểm tra hiển thị phân trang khi chọn 1 giá trị trong dropdown
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Kiểm tra hiển thị phân trang khi chọn 1 giá trị trong dropdown hiển thị record
- **Expected Result:** 2. Số lượng record trong 1 trang hiển thị tương ứng với lựa chọn

## II. Màn hình: Lập báo cáo

### II.1. Kiểm tra UI/UX của màn hình: Lập báo cáo

#### II.2_01

- **Title:** Kiểm tra màn hình khởi tạo: Lập báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra màn hình khởi tạo: Lập báo cáo
- **Expected Result:**
  3. Hiển thị màn hình "Lập báo cáo" giống design (Refer Item II. Lập báo cáo tại sheet WF/Design)
  - Nút [Quay lại]
  - Nút [Thêm khu công nghiệp]
  - Hiển thị bảng nhập liệu gồm:
   + Hiển thị mặc định một hàng cho phép nhập liệu
   + Các cột: STT, KKT, Loại hình, Tên dự án/khu chức năng, Địa điểm, Văn bản thành lập, Tên nhà đầu tư, Quốc tịch, Tình trạng, Diện tích quy hoạch (ha), Diện tích thành lập (ha), Diện tích hoạt động (ha), VĐT NN - Đăng ký (tr.USD), VĐT NN - Thực hiện (tr.USD), VĐT TN - Đăng ký (tỷ VNĐ), VĐT TN - Thực hiện (tỷ VNĐ), Doanh thu (tr.USD), Xuất khẩu (tr.USD), Nhập khẩu (tr.USD), Nộp NS (tỷ NVĐ)
   + Icon [Xóa]
   + Dòng Tổng cộng
  - Hiển thị các nút:
   + Hủy
   + Lưu Nháp
   + Xem
   + Gửi báo cáo

#### II.2_02

- **Title:** Nút [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra hiển thị nút [Quay lại]
- **Expected Result:** 3. Cho phép nhấn

#### II.2_03

- **Title:** Nút [Thêm khu công nghiệp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra hiển thị nút [Quay lại]
- **Expected Result:** 3. Cho phép nhấn

#### II.2_04

- **Title:** Kiểm tra trường dữ liệu [STT]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [STT]
- **Expected Result:** 3. Luôn disable, hiển thị theo số hàng của bảng

#### II.2_05

- **Title:** Kiểm tra trường dữ liệu [KKT]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [KKT]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn giá trị
  - Hiển thị danh sách Khu Kinh Tế từ Master Data hệ thống
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### II.2_06

- **Title:** Kiểm tra trường dữ liệu [Lọai hình]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Lọai hình]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền sau khi chọn giá trị của cột: KKT

#### II.2_07

- **Title:** Kiểm tra trường dữ liệu [Tên dự án/khu chức năng]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Tên dự án/khu chức năng]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị danh sách dự án/khu chức năng thuộc KKT đã chọn ở cột: KKT, Dữ liệu lấy từ IRC, filtered theo KKT
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### II.2_08

- **Title:** Kiểm tra trường dữ liệu [Địa điểm]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Địa điểm]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền sau khi chọn giá trị của cột: Tên dự án/khu chức năng

#### II.2_09

- **Title:** Kiểm tra trường dữ liệu [Văn bản thành lập]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Văn bản thành lập]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền sau khi chọn giá trị của cột: KKT

#### II.2_10

- **Title:** Kiểm tra trường dữ liệu [Tên nhà đầu tư]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Tên nhà đầu tư]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị danh sách dữ liệu lấy từ IRC, cho phép chọn nhiều NĐT
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### II.2_11

- **Title:** Kiểm tra trường dữ liệu [Quốc tịch]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Quốc tịch]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền sau khi chọn giá trị của cột: Tên nhà đầu tư

#### II.2_12

- **Title:** Kiểm tra trường dữ liệu [Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Tình trạng
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị danh sách giá trị:
   + Đang xây dựng
   + Đã đi vào hoạt động
  - Giá trị đang được chọn sẽ được highlighted

#### II.2_13

- **Title:** Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_14

- **Title:** Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích quy hoạch (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_15

- **Title:** Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_16

- **Title:** Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích thành lập (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_17

- **Title:** Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_18

- **Title:** Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích hoạt động (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_19

- **Title:** Kiểm tra trường dữ liệu [VĐT NN - Đăng ký (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT NN - Đăng ký (tr.USD)]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền theo từng dự án/KKT
  - API:

#### II.2_20

- **Title:** Kiểm tra trường dữ liệu [VĐT NN - Thực hiện (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT NN - Thực hiện (tr.USD)]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền theo từng dự án/KKT
  - API:

#### II.2_21

- **Title:** Kiểm tra trường dữ liệu [VĐT TN - Đăng ký (tỷ VNĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT TN - Đăng ký (tỷ VNĐ)]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền theo từng dự án/KKT
  - API:

#### II.2_22

- **Title:** Kiểm tra trường dữ liệu [VĐT TN - Thực hiện (tỷ VNĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT TN - Thực hiện (tỷ VNĐ)]
- **Expected Result:**
  3. Luôn luôn disable
  - Tự động điền theo từng dự án/KKT
  - API:

#### II.2_23

- **Title:** Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_24

- **Title:** Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Doanh thu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_25

- **Title:** Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_26

- **Title:** Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Xuất khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_27

- **Title:** Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_28

- **Title:** Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Nhập khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_29

- **Title:** Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Expected Result:** 3. Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### II.2_30

- **Title:** Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### II.2_31

- **Title:** Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Pre-condition:** _(không có)_
- **Step:** _(không có)_
- **Expected Result:** _(không có)_

#### II.2_32

- **Title:** Nút [Xóa]
- **Pre-condition:** Khi có 1 hàng
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra hiển thị nút [Xóa]
- **Expected Result:** 3. Không hiển thị

#### II.2_33

- **Title:** Nút [Xóa]
- **Pre-condition:** Khi có nhiều hơn 1 hàng
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra hiển thị nút [Xóa]
- **Expected Result:** 3. Hiển thị ở tất cả các hàng

#### II.2_34

- **Title:** Nút [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 2. Cho phép nhấn

#### II.2_35

- **Title:** Nút [Lưu nháp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 2. Cho phép nhấn

#### II.2_36

- **Title:** Nút [Xem]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Xem]
- **Expected Result:** 2. Cho phép nhấn

#### II.2_37

- **Title:** Nút [Gửi báo cáo]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 2. Cho phép nhấn

#### II.2_38

- **Title:** Kiểm tra UI trên màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra UI trên màn hình
- **Expected Result:**
  3. Hiển thị màn hình "Lập báo cáo" giống design (Refer Item II. Lập báo cáo tại sheet WF/Design)
  - Tên các item được hiển thị đầy đủ thông tin đúng như mô tả trong thiết kế màn hình, không có text sai hoặc bị chồng lấn giữa các item trên màn hình
  - Số lượng item hiển thị đầy đủ và giống với thiết kế màn hình
  - Vị trí các item giống với thiết kế màn hình
  - Font chữ, kích thước chữ, màu sắc, kiểu chữ giống với thiết kế màn hình
  - Căn chỉnh của các item giống với thiết kế màn hình

#### II.2_39

- **Title:** Kiểm tra khi zoom in/zoom out màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Thực hiện zoom in/zoom out màn hình
- **Expected Result:** 3. Layout màn hình không bị vỡ, không xảy ra bất thường

#### II.2_40

- **Title:** Kiểm tra dữ liệu với độ dài tối đa (maxlength)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra dữ liệu hiển thị khi nhập đến giới hạn maxlength
- **Expected Result:** 3. Không xảy ra lỗi font chữ

#### II.2_41

- **Title:** Kiểm tra nhấn phím F5
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn phím F5
- **Expected Result:** 3. Trang được refresh thành công

#### II.2_42

- **Title:** Kiểm tra nút Back của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn nút Back trên trình duyệt
- **Expected Result:** 3. Màn hình trước đó được mở

#### II.2_43

- **Title:** Kiểm tra nút Next của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn nút Next trên trình duyệt
- **Expected Result:** 3. Nút [Next] bị disable

#### II.2_44

- **Title:** Kiểm tra nút Refresh của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn nút Refresh trên trình duyệt
- **Expected Result:** 3. Trang được refresh thành công

#### II.2_45

- **Title:** Kiểm tra thao tác Tab và Shift + Tab
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra focus khi nhấn phím Tab
  4. Kiểm tra focus khi nhấn Shift + Tab
- **Expected Result:**
  4. Không có lỗi bất thường, focus đúng thứ tự các item trên màn hình
  Tab bỏ qua các field chỉ đọc (read-only)
  Tab bỏ qua các field bị disable
  Thứ tự Tab: từ trái → phải, từ trên → dưới
  2. Shift + Tab hoạt động ngược lại với Tab

#### II.2_46

- **Title:** Kiểm tra phím Backspace
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn Backspace nhiều lần tại các control cho phép nhập text để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### II.2_47

- **Title:** Kiểm tra phím Enter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập giá trị không hợp lệ và nhấn Enter nhiều lần để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### II.2_48

- **Title:** Kiểm tra tính nhất quán của message
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Kiểm tra các message lỗi trên màn hình
- **Expected Result:**
  3. Các message lỗi cùng loại phải hiển thị giống nhau:
  - Message lỗi hiển thị bên dưới field bị lỗi
  - Toast message hiển thị ở góc trên màn hình trong 5 giây

### II.2. Kiểm tra FUNC của màn hình: Lập báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút: [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Quay lại]
- **Expected Result:** 3. Quay lại màn hình: Danh sách báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút: [Thêm khu công nghiệp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Thêm khu công nghiệp]
- **Expected Result:** 3. Thêm 1 dòng trống mới ở cuối bảng (trên dòng tổng)

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: KKT
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: KKT
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: KKT
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên dự án/khu chức năng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tên dự án/khu chức năng
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên dự án/khu chức năng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tên dự án/khu chức năng
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên nhà đầu tư
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tên nhà đầu tư
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên nhà đầu tư
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tên nhà đầu tư
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tình trạng
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Tình trạng
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích quy hoạch (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích quy hoạch (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích quy hoạch (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích quy hoạch (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích quy hoạch (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích quy hoạch (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích thành lập (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích thành lập (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích thành lập (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích thành lập (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích thành lập (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích thành lập (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích hoạt động (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Diện tích hoạt động (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích hoạt động (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích hoạt động (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích hoạt động (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích hoạt động (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Doanh thu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Doanh thu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Doanh thu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Doanh thu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập < 0 vào trường: Doanh thu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Doanh thu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Doanh thu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Xuất khẩu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Xuất khẩu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Xuất khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Xuất khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập < 0 vào trường: Xuất khẩu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Xuất khẩu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Xuất khẩu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Nhập khẩu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Nhập khẩu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Nhập khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Nhập khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập < 0 vào trường: Nhập khẩu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Nhập khẩu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Nhập khẩu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Nộp NS (tỷ VNĐ)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Để trống trường: Nộp NS (tỷ VNĐ)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập < 0 vào trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Nộp NS (tỷ VNĐ)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Nộp NS (tỷ VNĐ)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích quy hoạch (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích thành lập (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích hoạt động (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - NN - Đăng ký (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - NN - Đăng ký (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - NN - Thực hiện (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - NN - Thực hiện (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - TN - Đăng ký (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - TN - Đăng ký (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - TN - Thực hiện (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - TN - Thực hiện (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Doanh thu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Xuất khẩu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Nhập khẩu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Nộp NS (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### II.2_57

- **Title:** Kiểm tra hoạt động của nút: Hủy
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:**
  3. Hiển thị popup xác nhận hủy, gồm thông tin giống design, với các nút:
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Đồng ý]: enable

#### II.2_58

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [X]
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_59

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_60

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn ra ngoài popup
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_61

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:**
  3. Hủy báo cáo thành công, quay lại màn hình Danh sách báo cáo
  - Mất toàn bộ dữ liệu chưa lưu của biểu mẫu đã hủy

#### II.2_62

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** Lỗi hệ thống
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:** 3. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_63

- **Title:** Kiểm tra trạng thái của báo cáo sau khi hủy thành công
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhấn vào nút [Đồng ý]
  4. Kiểm tra trạng thái của báo cáo sau khi hủy thành công
- **Expected Result:** 4. Báo cáo không còn hiển thị trên màn hình: Danh sách báo cáo

#### II.2_64

- **Title:** Kiểm tra hoạt động của nút: Xem
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Xem]
- **Expected Result:**
  4. Hệ thống mở popup xem trước ở định dạng PDF Preview theo biểu mẫu đang mở và hiện các dữ liệu đã nhập vào báo cáo
  - Tự động điền các thông tin chung cho Header và Footer của báo cáo:
   + Địa điểm: theo thông tin user
   + Ngày tháng năm: ngày nộp báo cáo
   + Người làm báo cáo: Tên của user đang thực hiện báo cáo

#### II.2_65

- **Title:** Kiểm tra hoạt động của nút: Xem
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
- **Expected Result:**
  4. Hệ thống mở popup xem trước ở định dạng PDF Preview theo biểu mẫu đang mở và hiện các dữ liệu đã nhập vào báo cáo
  - Tự động điền các thông tin chung cho Header và Footer của báo cáo:
   + Địa điểm: theo thông tin user
   + Ngày tháng năm: ngày nộp báo cáo
   + Người làm báo cáo: Tên của user đang thực hiện báo cáo

#### II.2_66

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [Export]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
- **Expected Result:**
  5. Xuất 1 file .docx theo biểu mẫu đang mở thành công
  - Hiển thị toast message: Thành công - Đã export báo cáo thành công

#### II.2_68

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [Export]
- **Pre-condition:** Lỗi hệ thống, export không thành công
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
- **Expected Result:** 5. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_67

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra file export sau khi export thành công
- **Pre-condition:** Export thành công
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
  6. Kiểm tra file export sau khi export thành công
- **Expected Result:**
  6. File export hiển thị đúng thông tin:
  - Tên file:
  - Định dạng theo mẫu: [Project_Name] | Phân hệ Báo cáo | KCN, KKT
  - Nội dung trong các trường trong file export như thông tin đã nhập ở trên màn hình

#### II.2_69

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [In]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
- **Expected Result:**
  5. Hiển thị thông tin báo cáo và đúng các mẫu báo cáo Biểu số 2111.H.QLKKT
  Link mẫu: [Project_Name] | Phân hệ Báo cáo | KCN, KKT

#### 

- **Title:** Kiểm tra hoạt động của nút [In] - Đã kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
  6. Thực hiện in
- **Expected Result:**
  6. Đúng định dạng, đẹp, không bị lệch layout
  - Các trường thông tin trống hiển thị hợp lý (— hoặc trống)
  - Tự động tách trang theo từng mẫu báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút [In] - Chưa kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
  6. Thực hiện in
- **Expected Result:** 6. Hiển thị thông báo lỗi: Chưa kết nối máy in

#### II.2_70

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [X] trong popup xem trước
- **Expected Result:** 5. Đóng popup xem trước

#### II.2_71

- **Title:** Kiểm tra hoạt động của nút: Lưu nháp
- **Pre-condition:** - Nhập các thông tin trong tab đang mở là hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Lưu nháp] trong popup xem trước
- **Expected Result:**
  4. Lưu nháp lại các thông tin đã nhập trong báo cáo đang mở
  - Nếu biểu mẫu đang ở trạng thái "Yêu cầu chỉnh sửa" -> trạng thái giữ nguyên sau khi lưu

#### II.2_72

- **Title:** Kiểm tra hoạt động của nút: Lưu nháp
- **Pre-condition:** - Nhập các thông tin của một số trường trong tab đang mở không hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Lưu nháp] trong popup xem trước
- **Expected Result:** 4. Hiển thị thông báo lỗi ở các trường dữ liệu không hợp lệ

#### II.2_73

- **Title:** Kiểm tra hoạt động của nút: Gửi báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
- **Expected Result:**
  4. Kích hoạt validate và nộp toàn bộ báo cáo
  - Tại các trường có dữ liệu không hợp lệ sẽ hiển thị thông báo lỗi màu đỏ ngay dưới trường

#### II.2_74

- **Title:** Kiểm tra hoạt động của nút: Gửi báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
- **Expected Result:** 4. Mở popup: Xác nhận nộp báo cáo

#### 

- **Title:** Kiểm tra khởi tạo popup: "Nộp báo cáo"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Kiểm tra khởi tạo popup: "Nộp báo cáo"
- **Expected Result:**
  5. Hiển thị thông tin giống design, với các nút:
  - Checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]: uncheck
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Xác nhận]: disable

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Expected Result:** 5. Nút [Xác nhận] chuyển thành enable

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn vào nút [X]
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn vào nút [Hủy]
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn ra bên ngoài popup
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
- **Expected Result:**
  6. Nộp báo cáo thành công
  - Hiển thị toast message: Thành công - Đã nộp báo cáo thành công!
  - Báo cáo được gửi lên cấp trên theo đúng vòng đời của báo cáo (gửi lên Cục Đầu tư nước ngoài)

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** Server error
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
- **Expected Result:** 6. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_75

- **Title:** Kiểm tra trạng thái khi báo cáo nộp thành công
- **Pre-condition:** Đăng nhập vào tài khoản thuộc đơn vị người tạo báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
  7. Kiểm tra hiển thị báo cáo khi báo cáo nộp thành công
- **Expected Result:**
  7. Hiển thị các thông tin:
  - Hiển thị báo cáo ở trên cùng tại Kỳ tương ứng nếu là báo cáo theo kỳ
  - Hiển thị báo cáo ở trên cùng trong Danh sách báo cáo nếu là báo cáo không theo kỳ
  - Trạng thái báo cáo: Đã nộp
  - Ngày cập nhật/nộp: Hiển thị thời gian nộp báo cáo
  - Cột [Hành động] gồm: Xem chi tiết, Xem vòng đời, In, Export

#### 

- **Title:** Kiểm tra trạng thái khi báo cáo nộp thành công
- **Pre-condition:** Đăng nhập vào tài khoản thuộc đơn vị tiếp nhận báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Lập báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
  7. Kiểm tra hiển thị báo cáo khi báo cáo nộp thành công
- **Expected Result:**
  7.
  - Tất cả người dùng thuộc đơn vị nhận báo cáo đều có thể xem được báo cáo
  - Hiển thị báo cáo tại màn hình: "Báo cáo đã nhận"

#### II.2_81

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A chỉnh sửa báo cáo (chưa lưu)
  2. Người dùng B xem báo cáo
- **Expected Result:**
  2. Người dùng B vẫn thấy data cũ
  - Không thấy dữ liệu chưa save của người dùng A

#### II.2_82

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp trước
  3. Người dùng B thực hiện lưu nháp sau
- **Expected Result:**
  3. Dữ liệu báo cáo hiển thị theo người dùng B
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và lưu nháp
  - Người dùng B chỉnh sửa báo cáo và lưu nháp

#### II.2_83

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo bị hủy
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và lưu nháp
  - Người dùng B hủy báo cáo

#### II.2_84

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp trước
  3. Người dùng B thực hiện gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên theo vòng đời
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo
  - Người dùng B chỉnh sửa báo cáo và gửi báo cáo

#### II.2_85

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo chưa được tạo
  Vòng đời báo cáo ghi nhận: không có dữ liệu gì

#### II.2_86

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện lưu nháp báo cáo
- **Expected Result:**
  3. Báo cáo được lưu nháp
  Vòng đời báo cáo ghi nhận:
  - Người dùng B tạo báo cáo và lưu nháp

#### II.2_87

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Vòng đời báo cáo ghi nhận:
  - Người dùng B tạo báo cáo và gửi lên cấp trên

#### II.2_88

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

#### II.2_89

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B thực hiện lưu nháp báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Người dùng B hiện toast message lỗi: Báo cáo đã được lập - Báo cáo cho [Phạm vi dữ liệu input] đã chọn được lập bởi [Tên người lập]
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

#### II.2_90

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Người dùng B hiện toast message lỗi: Báo cáo đã được lập - Báo cáo cho [Phạm vi dữ liệu input] đã chọn được lập bởi [Tên người lập]
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

## III. Màn hình: Xem chi tiết báo cáo

### III.1. Kiểm tra UI/UX của màn hình: Xem chi tiết báo cáo

#### III.1_01

- **Title:** Kiểm tra màn hình khởi tạo: Xem chi tiết báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết] của một báo cáo bất kỳ
  3. Kiểm tra màn hình khởi tạo: Xem chi tiết báo cáo
- **Expected Result:**
  2. Hiển thị màn hình "Xem chi tiết báo cáo" giống design (Refer Item II. Xem chi tiết báo cáo tại sheet WF/Design)
  - Nút [Quay lại]
  - Nút [Xem]
  - Nút [Chỉnh sửa]
  - Hiển thị bảng data:
   + Các cột: STT, KKT, Loại hình, Tên dự án/khu chức năng, Địa điểm, Văn bản thành lập, Tên nhà đầu tư, Quốc tịch, Tình trạng, Diện tích quy hoạch (ha), Diện tích thành lập (ha), Diện tích hoạt động (ha), VĐT NN - Đăng ký (tr.USD), VĐT NN - Thực hiện (tr.USD), VĐT TN - Đăng ký (tỷ VNĐ), VĐT TN - Thực hiện (tỷ VNĐ), Doanh thu (tr.USD), Xuất khẩu (tr.USD), Nhập khẩu (tr.USD), Nộp NS (tỷ NVĐ)
   + Dữ liệu trong các cột: hiển thị giá trị hiện tại của các cột của báo cáo và không cho phép chỉnh sửa
   + Dòng Tổng cộng

#### 

- **Title:** Kiểm tra thông tin dữ liệu tại màn hình: Chi tiết báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết] của một báo cáo bất kỳ
  3. Kiểm tra thông tin dữ liệu tại màn hình: Chi tiết báo cáo
- **Expected Result:**
  3. Hiển thị các dữ liệu hiện tại của các trường thông tin ở tất cả các tab dữ liệu
  - Tất cả các trường thông tin: Disable

#### 

- **Title:** Nút [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết] của một báo cáo bất kỳ
  3. Kiểm tra nút [Quay lại]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Nút [Xem]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết] của một báo cáo bất kỳ
  3. Kiểm tra nút [Xem]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Nút [Chỉnh sửa]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết] của một báo cáo bất kỳ
  3. Kiểm tra nút [Chỉnh sửa]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Kiểm tra UI trên màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Kiểm tra UI trên màn hình
- **Expected Result:**
  3. Hiển thị màn hình "Chi tiết báo cáo" giống design (Refer Item II. Chi tiết báo cáo tại sheet WF/Design)
  - Tên các item được hiển thị đầy đủ thông tin đúng như mô tả trong thiết kế màn hình, không có text sai hoặc bị chồng lấn giữa các item trên màn hình
  - Số lượng item hiển thị đầy đủ và giống với thiết kế màn hình
  - Vị trí các item giống với thiết kế màn hình
  - Font chữ, kích thước chữ, màu sắc, kiểu chữ giống với thiết kế màn hình
  - Căn chỉnh của các item giống với thiết kế màn hình

#### 

- **Title:** Kiểm tra khi zoom in/zoom out màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Thực hiện zoom in/zoom out màn hình
- **Expected Result:** 3. Layout màn hình không bị vỡ, không xảy ra bất thường

#### 

- **Title:** Kiểm tra dữ liệu với độ dài tối đa (maxlength)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Kiểm tra dữ liệu hiển thị khi nhập đến giới hạn maxlength
- **Expected Result:** 3. Không xảy ra lỗi font chữ

#### 

- **Title:** Kiểm tra nhấn phím F5
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn phím F5
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra nút Back của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn nút Back trên trình duyệt
- **Expected Result:** 3. Màn hình trước đó được mở

#### 

- **Title:** Kiểm tra nút Next của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn nút Next trên trình duyệt
- **Expected Result:** 3. Nút [Next] bị disable

#### 

- **Title:** Kiểm tra nút Refresh của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn nút Refresh trên trình duyệt
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra thao tác Tab và Shift + Tab
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Kiểm tra focus khi nhấn phím Tab
  4. Kiểm tra focus khi nhấn Shift + Tab
- **Expected Result:**
  4. Không có lỗi bất thường, focus đúng thứ tự các item trên màn hình
  Tab bỏ qua các field chỉ đọc (read-only)
  Tab bỏ qua các field bị disable
  Thứ tự Tab: từ trái → phải, từ trên → dưới
  2. Shift + Tab hoạt động ngược lại với Tab

#### 

- **Title:** Kiểm tra phím Backspace
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn Backspace nhiều lần tại các control cho phép nhập text để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra phím Enter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhập giá trị không hợp lệ và nhấn Enter nhiều lần để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra tính nhất quán của message
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Kiểm tra các message lỗi trên màn hình
- **Expected Result:**
  3. Các message lỗi cùng loại phải hiển thị giống nhau:
  - Message lỗi hiển thị bên dưới field bị lỗi
  - Toast message hiển thị ở góc trên màn hình trong 5 giây

### III.2. Kiểm tra FUNC của màn hình: Xem chi tiết báo cáo

#### III.2_01

- **Title:** Kiểm tra hoạt động của nút: [Chỉnh sửa]
- **Pre-condition:** Trạng thái báo cáo: Lưu nháp hoặc Yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn vào nút [Chỉnh sửa]
- **Expected Result:** 3. Chuyển hướng đến màn hình: Chỉnh sửa báo cáo

#### III.2_03

- **Title:** Kiểm tra hoạt động của nút: [Xem]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn vào nút [Xem]
- **Expected Result:** 3. Hệ thống mở popup xem trước ở định dạng PDF Preview theo biểu mẫu đang mở và hiện các dữ liệu đã nhập vào báo cáo

#### III.2_04

- **Title:** Kiểm tra hoạt động của nút: [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Xem chi tiết]
  3. Nhấn vào nút [Quay lại]
- **Expected Result:** 3. Quay về màn hình Danh sách báo cáo

## IV. Màn hình: Chỉnh sửa báo cáo

### IV.1. Kiểm tra UI/UX của màn hình: Chỉnh sửa báo cáo

#### IV.1_01

- **Title:** Kiểm tra màn hình khởi tạo: Chỉnh sửa báo cáo
- **Pre-condition:** Trạng thái của báo cáo: Lưu nháp hoặc Yêu cầu chỉnh sửa
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa]
  3. Kiểm tra màn hình khởi tạo: Chỉnh sửa báo cáo
- **Expected Result:**
  3. Hiển thị màn hình "Lập báo cáo" giống design (Refer Item II. Lập báo cáo tại sheet WF/Design)
  - Nút [Quay lại]
  - Nút [Thêm khu công nghiệp]
  - Hiển thị bảng nhập liệu gồm:
   + Hiển thị các dữ liệu đã được nhập trước đó ở các cột tương ứng và cho phép chỉnh sửa
   + Các cột: STT, KKT, Loại hình, Tên dự án/khu chức năng, Địa điểm, Văn bản thành lập, Tên nhà đầu tư, Quốc tịch, Tình trạng, Diện tích quy hoạch (ha), Diện tích thành lập (ha), Diện tích hoạt động (ha), VĐT NN - Đăng ký (tr.USD), VĐT NN - Thực hiện (tr.USD), VĐT TN - Đăng ký (tỷ VNĐ), VĐT TN - Thực hiện (tỷ VNĐ), Doanh thu (tr.USD), Xuất khẩu (tr.USD), Nhập khẩu (tr.USD), Nộp NS (tỷ NVĐ)
   + Icon [Xóa]
   + Dòng Tổng cộng
  - Hiển thị các nút:
   + Hủy
   + Lưu Nháp
   + Xem
   + Gửi báo cáo

#### 

- **Title:** Nút [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra hiển thị nút [Quay lại]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Nút [Thêm khu công nghiệp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra hiển thị nút [Quay lại]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Kiểm tra trường dữ liệu [STT]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [STT]
- **Expected Result:** 3. Luôn disable, hiển thị theo số hàng của bảng

#### 

- **Title:** Kiểm tra trường dữ liệu [KKT]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [KKT]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn giá trị
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Hiển thị danh sách Khu Kinh Tế từ Master Data hệ thống
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### 

- **Title:** Kiểm tra trường dữ liệu [Lọai hình]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Lọai hình]
- **Expected Result:**
  3. Luôn luôn disable
  - Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [Tên dự án/khu chức năng]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Tên dự án/khu chức năng]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Hiển thị danh sách dự án/khu chức năng thuộc KKT đã chọn ở cột: KKT, Dữ liệu lấy từ IRC, filtered theo KKT
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### 

- **Title:** Kiểm tra trường dữ liệu [Địa điểm]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Địa điểm]
- **Expected Result:**
  3. Luôn luôn disable
  - Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [Văn bản thành lập]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Văn bản thành lập]
- **Expected Result:**
  3. Luôn luôn disable
  - Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [Tên nhà đầu tư]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Tên nhà đầu tư]
- **Expected Result:**
  3. Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Hiển thị danh sách dữ liệu lấy từ IRC, cho phép chọn nhiều NĐT
   + API:
  - Nếu tên của 1 giá trị dài, hiển thị "..." và khi hover vào sẽ hiện đầy đủ
  - Giá trị đang được chọn sẽ được highlighted

#### 

- **Title:** Kiểm tra trường dữ liệu [Quốc tịch]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Quốc tịch]
- **Expected Result:**
  3. Luôn luôn disable
  - Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Tình trạng
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Định dạng: dropdown và cho phép chọn 1 giá trị
  - Hiển thị danh sách giá trị:
   + Đang xây dựng
   + Đã đi vào hoạt động

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích quy hoạch (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích quy hoạch (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích thành lập (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích thành lập (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Diện tích hoạt động (ha)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Diện tích hoạt động (ha)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [VĐT NN - Đăng ký (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT NN - Đăng ký (tr.USD)]
- **Expected Result:** 3. Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [VĐT NN - Thực hiện (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT NN - Thực hiện (tr.USD)]
- **Expected Result:** 3. Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [VĐT TN - Đăng ký (tỷ VNĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT TN - Đăng ký (tỷ VNĐ)]
- **Expected Result:** 3. Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [VĐT TN - Thực hiện (tỷ VNĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [VĐT TN - Thực hiện (tỷ VNĐ)]
- **Expected Result:** 3. Hiển thị giá trị hiện tại của trường dữ liệu

#### 

- **Title:** Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Doanh thu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Doanh thu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Xuất khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Xuất khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Nhập khẩu (tr.USD)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Nhập khẩu (tr.USD)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Expected Result:**
  3.
  - Hiển thị giá trị hiện tại của trường dữ liệu
  - Cho phép nhập và cho phép nhận tất cả các loại ký tự

#### 

- **Title:** Kiểm tra trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra maxlength của trường dữ liệu [Nộp NS (tỷ NVĐ)]
- **Expected Result:** 3. Cho phép nhập tối đa 500 ký tự

#### 

- **Title:** Nút [Xóa]
- **Pre-condition:** Khi có 1 hàng
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra hiển thị nút [Xóa]
- **Expected Result:** 3. Không hiển thị

#### 

- **Title:** Nút [Xóa]
- **Pre-condition:** Khi có nhiều hơn 1 hàng
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra hiển thị nút [Xóa]
- **Expected Result:** 3. Hiển thị ở tất cả các hàng

#### 

- **Title:** Nút [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 2. Cho phép nhấn

#### 

- **Title:** Nút [Lưu nháp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 2. Cho phép nhấn

#### 

- **Title:** Nút [Xem]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Xem]
- **Expected Result:** 2. Cho phép nhấn

#### 

- **Title:** Nút [Gửi báo cáo]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 2. Cho phép nhấn

#### 

- **Title:** Kiểm tra UI trên màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra UI trên màn hình
- **Expected Result:**
  3. Hiển thị màn hình "Chỉnh sửa báo cáo" giống design (Refer Item II. Chỉnh sửa báo cáo tại sheet WF/Design)
  - Tên các item được hiển thị đầy đủ thông tin đúng như mô tả trong thiết kế màn hình, không có text sai hoặc bị chồng lấn giữa các item trên màn hình
  - Số lượng item hiển thị đầy đủ và giống với thiết kế màn hình
  - Vị trí các item giống với thiết kế màn hình
  - Font chữ, kích thước chữ, màu sắc, kiểu chữ giống với thiết kế màn hình
  - Căn chỉnh của các item giống với thiết kế màn hình

#### 

- **Title:** Kiểm tra khi zoom in/zoom out màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Thực hiện zoom in/zoom out màn hình
- **Expected Result:** 3. Layout màn hình không bị vỡ, không xảy ra bất thường

#### 

- **Title:** Kiểm tra dữ liệu với độ dài tối đa (maxlength)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra dữ liệu hiển thị khi nhập đến giới hạn maxlength
- **Expected Result:** 3. Không xảy ra lỗi font chữ

#### 

- **Title:** Kiểm tra nhấn phím F5
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn phím F5
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra nút Back của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn nút Back trên trình duyệt
- **Expected Result:** 3. Màn hình trước đó được mở

#### 

- **Title:** Kiểm tra nút Next của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn nút Next trên trình duyệt
- **Expected Result:** 3. Nút [Next] bị disable

#### 

- **Title:** Kiểm tra nút Refresh của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn nút Refresh trên trình duyệt
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra thao tác Tab và Shift + Tab
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra focus khi nhấn phím Tab
  4. Kiểm tra focus khi nhấn Shift + Tab
- **Expected Result:**
  4. Không có lỗi bất thường, focus đúng thứ tự các item trên màn hình
  Tab bỏ qua các field chỉ đọc (read-only)
  Tab bỏ qua các field bị disable
  Thứ tự Tab: từ trái → phải, từ trên → dưới
  2. Shift + Tab hoạt động ngược lại với Tab

#### 

- **Title:** Kiểm tra phím Backspace
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn Backspace nhiều lần tại các control cho phép nhập text để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra phím Enter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập giá trị không hợp lệ và nhấn Enter nhiều lần để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra tính nhất quán của message
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Kiểm tra các message lỗi trên màn hình
- **Expected Result:**
  3. Các message lỗi cùng loại phải hiển thị giống nhau:
  - Message lỗi hiển thị bên dưới field bị lỗi
  - Toast message hiển thị ở góc trên màn hình trong 5 giây

### IV.2. Kiểm tra FUNC của màn hình: Chỉnh sửa báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút: [Quay lại]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Quay lại]
- **Expected Result:** 3. Quay lại màn hình: Danh sách báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút: [Thêm khu công nghiệp]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Thêm khu công nghiệp]
- **Expected Result:** 3. Thêm 1 dòng trống mới ở cuối bảng (trên dòng tổng)

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: KKT
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: KKT
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: KKT
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: KKT
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên dự án/khu chức năng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tên dự án/khu chức năng
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên dự án/khu chức năng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tên dự án/khu chức năng
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên nhà đầu tư
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tên nhà đầu tư
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tên nhà đầu tư
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tên nhà đầu tư
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tình trạng
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Tình trạng
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Tình trạng
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích quy hoạch (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích quy hoạch (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích quy hoạch (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích quy hoạch (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích quy hoạch (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích quy hoạch (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích thành lập (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích thành lập (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích thành lập (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích thành lập (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích thành lập (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích thành lập (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích hoạt động (ha)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Diện tích hoạt động (ha)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Diện tích hoạt động (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Diện tích hoạt động (ha)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Diện tích hoạt động (ha)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Diện tích hoạt động (ha)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Doanh thu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Doanh thu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Doanh thu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Doanh thu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập < 0 vào trường: Doanh thu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Doanh thu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Doanh thu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Xuất khẩu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Xuất khẩu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Xuất khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Xuất khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập < 0 vào trường: Xuất khẩu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Xuất khẩu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Xuất khẩu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Nhập khẩu (tr.USD)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Nhập khẩu (tr.USD)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Nhập khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Nhập khẩu (tr.USD)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập < 0 vào trường: Nhập khẩu (tr.USD)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Nhập khẩu (tr.USD)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Nhập khẩu (tr.USD)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Nộp NS (tỷ VNĐ)
  4. Nhấn vào nút [Lưu nháp]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Để trống trường: Nộp NS (tỷ VNĐ)
  4. Nhấn vào nút [Gửi báo cáo]
- **Expected Result:** 4. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dữ liệu sau đó xóa dữ liệu trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập toàn khoảng trắng vào trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** 3. Hiển thị lỗi dưới chân trường dữ liệu: "Trường bắt buộc"

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập < 0 vào trường: Nộp NS (tỷ VNĐ)
- **Expected Result:** _(không có)_

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập dấu - ở giữa các ký tự số vào trường: Nộp NS (tỷ VNĐ)
  ví dụ: 219-239.00
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Sai định dạng số. Vui lòng nhập theo định dạng chuẩn (VD: 1,234,567.89 hoặc -1,000.5)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra validate của trường: Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các ký tự không hợp lệ (khác số, dấu chấm, dấu phẩy, dấu -) vào trường: Nộp NS (tỷ VNĐ)
  ví dụ: 76hssqw2
- **Expected Result:**
  3. Hiển thị lỗi dưới chân trường dữ liệu: "Ký tự không hợp lệ. Chỉ chấp nhận chữ số, dấu chấm (.), dấu phẩy (,) và dấu trừ (-)"
  - Lỗi sẽ biến mất khi user nhập lại dữ liệu vào trường dữ liệu

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích quy hoạch (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích quy hoạch (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích thành lập (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích thành lập (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra dòng tổng hợp: Tổng diện tích hoạt động (ha)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra dòng tổng hợp: Tổng diện tích hoạt động (ha)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - NN - Đăng ký (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - NN - Đăng ký (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - NN - Thực hiện (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - NN - Thực hiện (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - TN - Đăng ký (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - TN - Đăng ký (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng VĐT - TN - Thực hiện (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng VĐT - TN - Thực hiện (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Doanh thu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Doanh thu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Xuất khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Xuất khẩu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Nhập khẩu (tr.USD)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Nhập khẩu (tr.USD)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### 

- **Title:** Kiểm tra cột: Tổng Nộp NS (tỷ VNĐ)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập hợp lệ vào các trường dữ liệu trong bảng
  4. Kiểm tra cột: Tổng Nộp NS (tỷ VNĐ)
- **Expected Result:**
  4. Luôn luôn disable và tính real-time
  - Tự động tính tổng toàn bộ giá trị cùng cột

#### II.2_57

- **Title:** Kiểm tra hoạt động của nút: Hủy
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:**
  3. Hiển thị popup xác nhận hủy, gồm thông tin giống design, với các nút:
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Đồng ý]: enable

#### II.2_58

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [X]
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_59

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Hủy]
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_60

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn ra ngoài popup
- **Expected Result:** 3. Đóng popup, chưa hủy báo cáo thành công

#### II.2_61

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:**
  3. Hủy báo cáo thành công, quay lại màn hình Danh sách báo cáo
  - Mất toàn bộ dữ liệu chưa lưu của biểu mẫu đã hủy

#### II.2_62

- **Title:** Popup "Xác nhận hủy" - kiểm tra hoạt động của nút [Đồng ý]
- **Pre-condition:** Lỗi hệ thống
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Đồng ý]
- **Expected Result:** 3. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_63

- **Title:** Kiểm tra trạng thái của báo cáo sau khi hủy thành công
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhấn vào nút [Đồng ý]
  4. Kiểm tra trạng thái của báo cáo sau khi hủy thành công
- **Expected Result:** 4. Báo cáo không còn hiển thị trên màn hình: Danh sách báo cáo

#### II.2_64

- **Title:** Kiểm tra hoạt động của nút: Xem
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Xem]
- **Expected Result:**
  4. Hệ thống mở popup xem trước ở định dạng PDF Preview theo biểu mẫu đang mở và hiện các dữ liệu đã nhập vào báo cáo
  - Tự động điền các thông tin chung cho Header và Footer của báo cáo:
   + Địa điểm: theo thông tin user
   + Ngày tháng năm: ngày nộp báo cáo
   + Người làm báo cáo: Tên của user đang thực hiện báo cáo

#### II.2_65

- **Title:** Kiểm tra hoạt động của nút: Xem
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
- **Expected Result:**
  4. Hệ thống mở popup xem trước ở định dạng PDF Preview theo biểu mẫu đang mở và hiện các dữ liệu đã nhập vào báo cáo
  - Tự động điền các thông tin chung cho Header và Footer của báo cáo:
   + Địa điểm: theo thông tin user
   + Ngày tháng năm: ngày nộp báo cáo
   + Người làm báo cáo: Tên của user đang thực hiện báo cáo

#### II.2_66

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [Export]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
- **Expected Result:**
  5. Xuất 1 file .docx theo biểu mẫu đang mở thành công
  - Hiển thị toast message: Thành công - Đã export báo cáo thành công

#### II.2_68

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [Export]
- **Pre-condition:** Lỗi hệ thống, export không thành công
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
- **Expected Result:** 5. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_67

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra file export sau khi export thành công
- **Pre-condition:** Export thành công
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [Export] trong popup xem trước
  6. Kiểm tra file export sau khi export thành công
- **Expected Result:**
  6. File export hiển thị đúng thông tin:
  - Tên file:
  - Định dạng: [Project_Name] | Phân hệ Báo cáo | KCN, KKT
  - Nội dung trong các trường trong file export như thông tin đã nhập ở trên màn hình

#### II.2_69

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [In]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
- **Expected Result:**
  5. Hiển thị thông tin báo cáo và đúng các mẫu báo cáo Biểu số 2111.H.QLKKT
  Link mẫu: [Project_Name] | Phân hệ Báo cáo | KCN, KKT

#### 

- **Title:** Kiểm tra hoạt động của nút [In] - Đã kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
  6. Thực hiện in
- **Expected Result:**
  6. Đúng định dạng, đẹp, không bị lệch layout
  - Các trường thông tin trống hiển thị hợp lý (— hoặc trống)
  - Tự động tách trang theo từng mẫu báo cáo

#### 

- **Title:** Kiểm tra hoạt động của nút [In] - Chưa kết nối máy in
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [In] trong popup xem trước
  6. Thực hiện in
- **Expected Result:** 6. Hiển thị thông báo lỗi: Chưa kết nối máy in

#### II.2_70

- **Title:** Popup "Xem trước báo cáo" - Kiểm tra hoạt động của nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Xem]
  5. Nhấn vào nút [X] trong popup xem trước
- **Expected Result:** 5. Đóng popup xem trước

#### II.2_71

- **Title:** Kiểm tra hoạt động của nút: Lưu nháp
- **Pre-condition:** - Nhập các thông tin trong tab đang mở là hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Lưu nháp] trong popup xem trước
- **Expected Result:**
  4. Lưu nháp lại các thông tin đã nhập trong báo cáo đang mở
  - Nếu biểu mẫu đang ở trạng thái "Yêu cầu chỉnh sửa" -> trạng thái giữ nguyên sau khi lưu

#### II.2_72

- **Title:** Kiểm tra hoạt động của nút: Lưu nháp
- **Pre-condition:** - Nhập các thông tin của một số trường trong tab đang mở không hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Lưu nháp] trong popup xem trước
- **Expected Result:** 4. Hiển thị thông báo lỗi ở các trường dữ liệu không hợp lệ

#### II.2_73

- **Title:** Kiểm tra hoạt động của nút: Gửi báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là không hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
- **Expected Result:**
  4. Kích hoạt validate và nộp toàn bộ báo cáo
  - Tại các trường có dữ liệu không hợp lệ sẽ hiển thị thông báo lỗi màu đỏ ngay dưới trường

#### II.2_74

- **Title:** Kiểm tra hoạt động của nút: Gửi báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
- **Expected Result:** 4. Mở popup: Xác nhận nộp báo cáo

#### 

- **Title:** Kiểm tra khởi tạo popup: "Nộp báo cáo"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Kiểm tra khởi tạo popup: "Nộp báo cáo"
- **Expected Result:**
  5. Hiển thị thông tin giống design, với các nút:
  - Checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]: uncheck
  - Nút [X]: enable
  - Nút [Hủy]: enable
  - Nút [Xác nhận]: disable

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
- **Expected Result:** 5. Nút [Xác nhận] chuyển thành enable

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn vào nút [X]
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Hủy]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn vào nút [Hủy]
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động khi nhấn ra ngoài popup
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Nhấn ra bên ngoài popup
- **Expected Result:** 5. Đóng popup, chưa nộp báo cáo thành công

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
- **Expected Result:**
  6. Nộp báo cáo thành công
  - Hiển thị toast message: Thành công - Đã nộp báo cáo thành công!
  - Báo cáo được gửi lên cấp trên theo đúng vòng đời của báo cáo (gửi lên Cục Đầu tư nước ngoài)

#### 

- **Title:** Popup: Nộp báo cáo - Kiểm tra hoạt động của nút: [Xác nhận]
- **Pre-condition:** Server error
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
- **Expected Result:** 6. Hiển thị toast message: Lỗi hệ thống - Không thể kết nối đến hệ thống. Vui lòng thử lại sau.

#### II.2_75

- **Title:** Kiểm tra trạng thái khi báo cáo nộp thành công
- **Pre-condition:** Đăng nhập vào tài khoản thuộc đơn vị người tạo báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
  7. Kiểm tra hiển thị báo cáo khi báo cáo nộp thành công
- **Expected Result:**
  7. Hiển thị các thông tin:
  - Hiển thị báo cáo ở trên cùng tại Kỳ tương ứng nếu là báo cáo theo kỳ
  - Hiển thị báo cáo ở trên cùng trong Danh sách báo cáo nếu là báo cáo không theo kỳ
  - Trạng thái báo cáo: Đã nộp
  - Ngày cập nhật/nộp: Hiển thị thời gian nộp báo cáo
  - Cột [Hành động] gồm: Xem chi tiết, Xem vòng đời, In, Export

#### 

- **Title:** Kiểm tra trạng thái khi báo cáo nộp thành công
- **Pre-condition:** Đăng nhập vào tài khoản thuộc đơn vị tiếp nhận báo cáo
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Chỉnh sửa báo cáo]
  3. Nhập các thông tin trong  là hợp lệ
  4. Nhấn vào nút [Gửi báo cáo] ở tab cuối cùng
  5. Đánh dấu vào checkbox [Tôi đã kiểm tra toàn bộ thông tin đã nhập và xác nhận rằng các thông tin đó là chính xác]
  6. Nhấn vào nút [Xác nhận]
  7. Kiểm tra hiển thị báo cáo khi báo cáo nộp thành công
- **Expected Result:**
  7.
  - Tất cả người dùng thuộc đơn vị nhận báo cáo đều có thể xem được báo cáo
  - Hiển thị báo cáo tại màn hình: "Báo cáo đã nhận"

#### II.2_81

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A chỉnh sửa báo cáo (chưa lưu)
  2. Người dùng B xem báo cáo
- **Expected Result:**
  2. Người dùng B vẫn thấy data cũ
  - Không thấy dữ liệu chưa save của người dùng A

#### II.2_82

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp trước
  3. Người dùng B thực hiện lưu nháp sau
- **Expected Result:**
  3. Dữ liệu báo cáo hiển thị theo người dùng B
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và lưu nháp
  - Người dùng B chỉnh sửa báo cáo và lưu nháp

#### II.2_83

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo bị hủy
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và lưu nháp
  - Người dùng B hủy báo cáo

#### II.2_84

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A lưu nháp trước
  3. Người dùng B thực hiện gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên theo vòng đời
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo
  - Người dùng B chỉnh sửa báo cáo và gửi báo cáo

#### II.2_85

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo chưa được tạo
  Vòng đời báo cáo ghi nhận: không có dữ liệu gì

#### II.2_86

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện lưu nháp báo cáo
- **Expected Result:**
  3. Báo cáo được lưu nháp
  Vòng đời báo cáo ghi nhận:
  - Người dùng B tạo báo cáo và lưu nháp

#### II.2_87

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A hủy báo cáo
  3. Người dùng B thực hiện gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Vòng đời báo cáo ghi nhận:
  - Người dùng B tạo báo cáo và gửi lên cấp trên

#### II.2_88

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B thực hiện hủy báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

#### II.2_89

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B thực hiện lưu nháp báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Người dùng B hiện toast message lỗi: Báo cáo đã được lập - Báo cáo cho [Phạm vi dữ liệu input] đã chọn được lập bởi [Tên người lập]
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

#### II.2_90

- **Title:** Kiểm tra trường hợp 2 user cùng lập báo cáo và thực hiện các hành động cùng một lúc
- **Pre-condition:** _(không có)_
- **Step:**
  1. Người dùng A & B cùng tạo báo cáo
  2. Người dùng A gửi báo cáo
  3. Người dùng B gửi báo cáo
- **Expected Result:**
  3. Báo cáo được gửi lên cấp trên
  Người dùng B hiện toast message lỗi: Báo cáo đã được lập - Báo cáo cho [Phạm vi dữ liệu input] đã chọn được lập bởi [Tên người lập]
  Vòng đời báo cáo ghi nhận:
  - Người dùng A tạo báo cáo và gửi lên cấp trên

## V. Màn hình: Import báo cáo

### V.1. Kiểm tra UI/UX của popup: Import báo cáo

#### V.1_01

- **Title:** Kiểm tra popup khởi tạo: Import báo cáo
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra khởi tạo popup
- **Expected Result:**
  2. Hiển thị màn hình "Import báo cáo" giống design (Refer Item V. Import Báo cáo tại sheet WF/Design)
  - Nút [X]
  - Nút [Tiếp tục]
  - Nút [Tải xuống file mẫu]
  - Nút [Vùng kéo, thả file]

#### 

- **Title:** Kiểm tra nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra nút [X]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Kiểm tra nút [Tiếp tục]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra nút [Tiếp tục]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Kiểm tra nút [Vùng kéo, thả file]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra nút [Vùng kéo, thả file]
- **Expected Result:** 3. Cho phép nhấn

#### 

- **Title:** Kiểm tra UI trên màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra UI trên màn hình
- **Expected Result:**
  3. Hiển thị màn hình "Import" giống design (Refer Item II. Import tại sheet WF/Design)
  - Tên các item được hiển thị đầy đủ thông tin đúng như mô tả trong thiết kế màn hình, không có text sai hoặc bị chồng lấn giữa các item trên màn hình
  - Số lượng item hiển thị đầy đủ và giống với thiết kế màn hình
  - Vị trí các item giống với thiết kế màn hình
  - Font chữ, kích thước chữ, màu sắc, kiểu chữ giống với thiết kế màn hình
  - Căn chỉnh của các item giống với thiết kế màn hình

#### 

- **Title:** Kiểm tra khi zoom in/zoom out màn hình
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Thực hiện zoom in/zoom out màn hình
- **Expected Result:** 3. Layout màn hình không bị vỡ, không xảy ra bất thường

#### 

- **Title:** Kiểm tra dữ liệu với độ dài tối đa (maxlength)
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra dữ liệu hiển thị khi nhập đến giới hạn maxlength
- **Expected Result:** 3. Không xảy ra lỗi font chữ

#### 

- **Title:** Kiểm tra nhấn phím F5
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn phím F5
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra nút Back của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn nút Back trên trình duyệt
- **Expected Result:** 3. Màn hình trước đó được mở

#### 

- **Title:** Kiểm tra nút Next của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn nút Next trên trình duyệt
- **Expected Result:** 3. Nút [Next] bị disable

#### 

- **Title:** Kiểm tra nút Refresh của trình duyệt
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn nút Refresh trên trình duyệt
- **Expected Result:** 3. Trang được refresh thành công

#### 

- **Title:** Kiểm tra thao tác Tab và Shift + Tab
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra focus khi nhấn phím Tab
  4. Kiểm tra focus khi nhấn Shift + Tab
- **Expected Result:**
  4. Không có lỗi bất thường, focus đúng thứ tự các item trên màn hình
  Tab bỏ qua các field chỉ đọc (read-only)
  Tab bỏ qua các field bị disable
  Thứ tự Tab: từ trái → phải, từ trên → dưới
  2. Shift + Tab hoạt động ngược lại với Tab

#### 

- **Title:** Kiểm tra phím Backspace
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn Backspace nhiều lần tại các control cho phép nhập text để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra phím Enter
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhập giá trị không hợp lệ và nhấn Enter nhiều lần để kiểm tra hành vi
- **Expected Result:** 3. Không xảy ra hiện tượng bất thường

#### 

- **Title:** Kiểm tra tính nhất quán của message
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Kiểm tra các message lỗi trên màn hình
- **Expected Result:**
  3. Các message lỗi cùng loại phải hiển thị giống nhau:
  - Message lỗi hiển thị bên dưới field bị lỗi
  - Toast message hiển thị ở góc trên màn hình trong 5 giây

### V.2. Kiểm tra FUNC của popup: Import báo cáo

#### V.2_01

- **Title:** Kiểm tra hoạt động nút [X]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [X]
- **Expected Result:** 3. Đóng popup import

#### V.2_02

- **Title:** Kiểm tra hoạt động nút [Hủy bỏ]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [Hủy bỏ]
- **Expected Result:** 3. Đóng popup import

#### V.2_03

- **Title:** Kiểm tra hoạt động nút [Tải xuống file mẫu]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [Tải xuống file mẫu]
- **Expected Result:** 3. Thực hiện tải xuống đúng file mẫu theo format: [Project_Name] | Phân hệ Báo cáo | KCN, KKT

#### V.2_04

- **Title:** Kiểm tra hoạt động nút [Vùng kéo, thả file]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [Vùng kéo, thả file]
- **Expected Result:** 3. Mở thư mục mặc định trên máy tính cho phép upload file

#### V.2_05

- **Title:** Kiểm tra hoạt động nút [Vùng kéo, thả file]
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Thực hiện kéo file vào vùng kéo thả
- **Expected Result:** 3. Cho phép kéo thả file thành công

#### V.2_06

- **Title:** Kiểm tra hoạt động nút [Tiếp tục]
- **Pre-condition:** Đã upload file dữ liệu hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [Tiếp tục]
- **Expected Result:** 3. Đóng popup Import, chuyển đến màn hình "Tạo mới báo cáo". Dữ liệu từ file được map vào các trường tương ứng trên form tạo báo cáo

#### V.2_07

- **Title:** Kiểm tra hoạt động nút [Tiếp tục]
- **Pre-condition:** Đã upload file không hợp lệ
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào nút [Tiếp tục]
- **Expected Result:** 3. Nút disable

#### V.2_08

- **Title:** Kiểm tra file mẫu của hệ thống
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Tải xuống file mẫu]
  4. Thực hiện tải file mẫu và kiểm tra định dạng và thông tin của file mẫu
- **Expected Result:**
  4. Hiển thị đúng file mẫu theo mẫu đã tải
  Refer file mẫu:

#### V.2_09

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File mẫu gồm các trường thông tin được nhập hợp lệ
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file dữ liệu hợp lệ
- **Expected Result:** 4. Enable nút [Tiếp tục]

#### V.2_10

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File rỗng / Không đọc được file
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file rỗng
- **Expected Result:** 4. Hiển thị lỗi: "Không thể đọc file. Vui lòng kiểm tra lại file và thử lại"

#### V.2_11

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - "File không đúng định dạng
VD: file .png, .jpg, file .xlsx"
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file không đúng định dạng .docx
  VD: .xlsx ; .jpg
- **Expected Result:** 4. Hiển thị lỗi: "Cấu trúc file không đúng định dạng template. Vui lòng sử dụng file template đã tải."

#### V.2_12

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File .docx nhưng không đúng file mẫu
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file  File .docx nhưng không đúng file mẫu
- **Expected Result:** 4. Hiển thị lỗi: "Dữ liệu không khớp với [Phạm vi dữ liệu nguồn input] đã chọn. Vui lòng kiểm tra lại."

#### V.2_13

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File mẫu nhưng một số trường thông tin là không hợp lệ
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file đúng mẫu nhưng một số trường thông tin là nhập không hợp lệ
- **Expected Result:** _(không có)_

#### V.2_14

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File mẫu gồm các trường thông tin được nhập hợp lệ nhưng lớn hơn 10MB
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file đúng mẫu gồm các trường thông tin được nhập hợp lệ nhưng lớn hơn 10MB
- **Expected Result:** _(không có)_

#### V.2_15

- **Title:** Kiểm tra hiển thị khi tải file dữ liệu lên - File không hợp lệ lớn hơn 10MB
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện tải lên 1 file không đúng mẫu và lớn hơn 10MB
- **Expected Result:** _(không có)_

#### V.2_16

- **Title:** Tại file vừa tải lên - Kiểm tra hoạt động của nút: X
- **Pre-condition:** _(không có)_
- **Step:**
  1. Nhấn vào mục "KTCN11" trên menu bar
  2. Nhấn vào nút [Import] ở màn hình "Danh sách báo cáo"
  3. Nhấn vào lựa chọn [Vùng kéo, thả file]
  4. Thực hiện upload 1 file bất kỳ
  5. Nhấn vào nút [X] tại file vừa tải lên
- **Expected Result:** 5. Xóa bỏ file vừa tải lên ở bước upload file
