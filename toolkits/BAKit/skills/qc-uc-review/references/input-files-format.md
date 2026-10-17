# Format of input files
## Format file SRS
### Common Information
- Type: SRS document - describe Usecase and sub-usecase of a report. The document includes one Usecase and sub-usecases.
- File name: SRS_[Report's name]_v[N].docx

### Document Structure
#### Heading 1
- Report Title - is the parent UCID level.
- Include description and reference of this UC.
Example:
`UC161-166: Báo cáo định kỳ 6 tháng tình hình hoạt động dự án đầu tư tại nước ngoài`

#### Heading 2
- List of sub-UCID kèm tên.
Example:
1. `UC161-166.1: Xem Danh Sách Báo Cáo`
2. `UC161-166.2: Tạo Mới Báo Cáo`
3. `UC161-166.3: Các Tác Vụ Bổ Trợ`

#### Heading 3
- Three parts - detailed information of each sub-UCID:
1. `1. Mô tả chức năng`
2. `2. Mô tả giao diện`
3. `3. Mô tả các xử lý của chức năng`

### Detailed description for each sub-UCID
Part 1: `1. Mô tả chức năng`
Detailed description of the feature:
- Description.
- Permission to access the feature.
- Access path.
- Related UCIDs.

Part 2: `2. Mô tả giao diện`
Visual representation of the feature's interface.
The interface description typically includes:
- Field groups.
- A list and description of each field on the screen, presented in a table with columns:
    - #: Sequence number
    - Tên trường: Field name
    - Kiểu trường: Field type
    - Giá trị mặc định: Default value
    - Được sửa: Editable (x is editable, blank is not editable)
    - Bắt Buộc: Required (x is required, blank is not required)
    - Ghi chú: Note

Part 3: `3. Mô tả các xử lý của chức năng`
Business rules list with cross-references:
- `CF_xx`: refer to `docs\BA\SRS-report\CMR\Các chức năng dùng chung cho các báo cáo.docx`.
- `CMR_xx`: refer to `docs\BA\SRS-report\CMR\Quy tắc nghiệp vụ chung.docx`.

## Format file Toast-Alert-Popup
### Common Information

- Type: Common document - describe toas mesages, alert, popup using in the system.
- File name: Toast-Alert-Popup_v[N].docx

### Document Structure
The document has one main title (e.g., `BẢNG THÔNG BÁO LỖI & THÔNG BÁO HỆ THỐNG`) and is divided into 4 sections, each section corresponds to one type of message and is presented in a table.

#### Section 1: Toast Messages
- Description: Toast hiển thị ở góc trên bên phải màn hình, tự động biến mất sau 3–5 giây.
- Code prefix: `Txx` (e.g., `T01`, `T02`...).
- Table columns:
    - `Mã`: Message code (Txx).
    - `Trường hợp`: Use case / scenario triggering the toast.
    - `Tiêu đề`: Toast title.
    - `Nội dung thông báo`: Toast message content.
    - `Loại`: Type — `🟢 Success` or `🔴 Error`.
    - `Tham chiếu CF`: Cross-reference to common functions (`CF_xx`) in `docs\BA\SRS-report\CMR\Các chức năng dùng chung cho các báo cáo.docx`.

#### Section 2: Alert Messages
- Description: Hiển thị trên popup, không tự biến mất, người dùng phải đóng thủ công.
- Code prefix: `Axx` (e.g., `A01`, `A02`...).
- Table columns:
    - `Mã`: Message code (Axx).
    - `Trường hợp`: Use case / scenario triggering the alert.
    - `Nội dung thông báo`: Alert message content.
    - `Nút đi kèm`: Buttons attached to the alert (or `— (giữ nguyên popup)` if no buttons).
    - `Tham chiếu CF`: Cross-reference to common functions (`CF_xx`).

#### Section 3: Inline Validation Messages
- Description: Thông báo lỗi hiển thị inline ngay trên giao diện, gắn liền với trường thông tin (field).
- Code prefix: `Vxx` (e.g., `V01`, `V02`...).
- Table columns:
    - `Mã`: Message code (Vxx).
    - `Trường hợp`: Use case / validation scenario.
    - `Nội dung thông báo`: Validation message content.
    - `Vị trí hiển thị`: Display position (e.g., bên dưới trường thông tin, màu đỏ).
    - `Tham chiếu`: Cross-reference to common rules (`CMR_xx`) and/or common functions (`CF_xx`).

#### Section 4: Popup xác nhận (Confirmation Popup)
- Description: Popup xác nhận trước khi thực hiện một hành động quan trọng (nộp, hủy, xóa, ...).
- Code prefix: `Pxx` (e.g., `P01`, `P02`...).
- Table columns:
    - `Mã`: Message code (Pxx).
    - `Trường hợp`: Use case / scenario triggering the popup.
    - `Tiêu đề`: Popup title (có thể để trống `—` nếu không có tiêu đề).
    - `Nội dung`: Popup content; có thể bao gồm checkbox xác nhận hoặc lưu ý điều kiện kích hoạt nút.
    - `Nút đi kèm`: Buttons attached to the popup (e.g., `[Xác nhận] / [Hủy] / Icon Đóng (✕)`); kèm điều kiện active của nút nếu có.
    - `Tham chiếu CF`: Cross-reference to common functions (`CF_xx`).

### Cross-reference rules
- `Txx`, `Axx`, `Vxx`, `Pxx`: codes defined within this document; referenced from SRS files when describing message behavior of a sub-UCID.
- `CF_xx`: refer to `docs\BA\SRS-report\CMR\Các chức năng dùng chung cho các báo cáo.docx`.
- `CMR_xx`: refer to `docs\BA\SRS-report\CMR\Quy tắc nghiệp vụ chung.docx`.

