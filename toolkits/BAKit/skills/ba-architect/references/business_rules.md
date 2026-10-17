# REPORT MODULE: BUSINESS LOGIC RULES

> Tài liệu này được đồng bộ với `docs/template/common_business_rules.md`.
> Các quy tắc CMR là nguồn tham chiếu chính thức. Tài liệu này ghi lại phiên bản hiện hành đang áp dụng.

## 1. Thực thể lập báo cáo

### Case A: Đầu tư vào Việt Nam (ĐTNN/ĐTTN)
*Tham chiếu: CMR_01*
- Dự án bắt buộc phải thành lập/chỉ định một Tổ chức kinh tế (TCKT) phụ trách.
- **Phân quyền:** TCKT là thực thể duy nhất có quyền Khởi tạo và Nộp báo cáo. Các NĐT thành viên chỉ có quyền: Xem chi tiết, In, Xuất file, Xem vòng đời.
- **UI Danh sách:** Tooltip tại màn hình NĐT: *"Đã được lập bởi [Tên TCKT đã lập báo cáo]".*

### Case B: Đầu tư ra nước ngoài (ĐTRNN)
*Tham chiếu: CMR_02*
- Không thành lập tổ chức phụ trách chung. Tất cả NĐT có quyền và nghĩa vụ ngang nhau.
- Hệ thống chỉ cho phép tồn tại **01 bản ghi báo cáo** cho mỗi dự án/kỳ.
- **Ràng buộc:** Khi một NĐT đã khởi tạo, hệ thống chặn quyền khởi tạo của các NĐT còn lại.
- **UI Danh sách:** Tooltip: *"Đã được lập bởi [Tên NĐT A]".*
- **Yêu cầu chỉnh sửa:** Chỉ NĐT đã khởi tạo mới có quyền [Chỉnh sửa]. NĐT khác chỉ được Xem chi tiết.

## 2. Trạng thái Vòng đời Bản ghi (Record Level)

| Trạng thái | Mô tả |
| :--- | :--- |
| **Lưu nháp** | Bản ghi đã khởi tạo nhưng chưa nộp. |
| **Đã nộp** | Bản ghi đã gửi thành công, đang chờ xử lý. |
| **Yêu cầu chỉnh sửa** | Bị trả về, cần cập nhật nội dung. |
| **Đã được lập bởi NĐT khác** | Dành riêng cho Case B - ĐTRNN. |

## 3. Hành động theo từng trạng thái (Người khởi tạo)
*Tham chiếu: CMR_03*

| Trạng thái | Hành động được phép |
| :--- | :--- |
| **Lưu nháp** | [Nộp], [Chỉnh sửa], [Xem chi tiết], [Xem vòng đời], [In], [Xuất file] |
| **Đã nộp** | [Xem chi tiết], [Xem vòng đời], [In], [Xuất file] |
| **Yêu cầu chỉnh sửa** | [Chỉnh sửa], [Xem chi tiết], [Xem vòng đời], [In], [Xuất file] |
| **Đã được lập bởi NĐT khác** | [Xem chi tiết], [Xem vòng đời], [In], [Xuất file] |

## 4. Trạng thái Kỳ hạn báo cáo (Period Level)
*Tham chiếu: CMR_04*

| Trạng thái kỳ | Mô tả | Quyền thao tác |
| :--- | :--- | :--- |
| **Chưa tới hạn** | Kỳ trong tương lai. | Ẩn nút [Lập báo cáo] và [Import]. |
| **Trong thời hạn** | Kỳ hiện tại, còn hiệu lực. | Hiển thị nút [Lập báo cáo] và [Import]. |
| **Qua kỳ báo cáo** | Đã qua kỳ hạn. | Hiển thị nút [Lập báo cáo] và [Import]. |

## 5. Logic IRC - Tự động điền dữ liệu
*Tham chiếu: CMR_05*

- Báo cáo theo dự án (Type 1): Bắt buộc chọn Dự án để kích hoạt API IRC.
- Sau khi chọn, các trường từ IRC được Auto-fill và **Disabled (Khóa)**.
- Nguồn dữ liệu IRC: `report-docs/web-IRC`.
- **Audit Task (Agent 1):** Nếu BA đánh dấu một trường IRC là "Editable", Agent 1 phải flag đây là lỗi nhất quán.

## 6. Quy tắc trường Số (Numeric Fields - Toàn hệ thống)
*Tham chiếu: CMR_06*

- Chấp nhận số dương và số âm (có dấu trừ `-`).
- Ký tự hợp lệ: `0-9`, dấu chấm `.`, dấu phẩy `,`.
- Tất cả ký tự khác: Không hợp lệ, hệ thống hiển thị lỗi inline.

## 7. Quy tắc Trường Text / Text Area / Ô tìm kiếm
*Tham chiếu: CMR_07*

- **Auto trim:** Hệ thống tự động xóa khoảng trắng thừa ở đầu và cuối chuỗi trước khi xử lý/lưu.
- **Chỉ nhập khoảng trắng:** Nếu người dùng chỉ nhập khoảng trắng, hệ thống coi đó là không có dữ liệu (tương đương giá trị rỗng).
- **Tự động xóa thông báo lỗi:** Khi người dùng để trống một trường Bắt buộc, hệ thống hiển thị thông báo lỗi màu đỏ: *"Trường bắt buộc"*. Ngay khi người dùng nhập dữ liệu hợp lệ, thông báo lỗi tự động biến mất.

## 8. Quy tắc Dropdown
*Tham chiếu: CMR_08*

- **Mở danh sách:** Khi người dùng nhấp vào Dropdown, hệ thống hiển thị toàn bộ các tùy chọn hiện có.
- **Tên tùy chọn dài:** Nếu tên tùy chọn vượt quá số ký tự giới hạn (do dev cấu hình), hệ thống tự động cắt ngắn và hiển thị "..." ở cuối. Người dùng có thể hover để xem đầy đủ tên.
- **Chọn tùy chọn:** Khi người dùng nhấp chọn 1 tùy chọn, hệ thống thay thế placeholder bằng tên tùy chọn đã chọn và đóng danh sách.
- **Tô sáng tùy chọn đã chọn:** Khi người dùng mở lại Dropdown, tùy chọn đang được chọn sẽ được tô sáng (highlighted).

## 9. Quy tắc hiển thị Tooltip/Giải thích trường thông tin
*Tham chiếu: CMR_15*

- Áp dụng cho các trường thông tin có mô tả, giải thích rõ thêm trong report template gốc.
- Phải có một biểu tượng information icon (ℹ️) nằm bên cạnh tiêu đề trường thông tin.
- Khi người dùng hover vào icon này, hệ thống sẽ hiện tooltip chứa toàn bộ nội dung hướng dẫn điền/giải thích từ template gốc.

## 10. Cấu trúc Use Case và Quy tắc đặt số UC
*Tham chiếu: docs/report-docs/web-template/3_Phụ_lục_XIII*

- UC được đánh số theo cột **STT** trong tài liệu Phụ lục XIII.
- Mỗi nhóm chức năng (báo cáo) được xác định bằng một **dải STT** (ví dụ: 161–166).
- **File output:** Một nhóm chức năng = Một file Markdown duy nhất (không tách UC con).
- **Tên file:** `UC[dải STT]_[Tên rút gọn].md` (VD: `UC161-166_BaoCao6ThangDTRNN.md`).
- **UC con bên trong file:** Đánh số thập phân: `.1` (Danh sách), `.2` (Tạo mới/Import), `.3` (Tác vụ bổ trợ).

## 11. Ghi chú Giao diện Wireframe (UI Placeholder)

Khi viết phần "Giao diện" trong Đặc tả chức năng (UC), bắt buộc phải ghi chú rõ ràng diện thiết kế bằng đoạn text dưới đây để BA dán wireframe vào sau:
- **Adhoc-package**: Giao diện mẫu cho báo cáo không có kỳ hạn và gửi gộp bộ hồ sơ
- **Adhoc-single**: Giao diện mẫu cho báo cáo không có kỳ hạn và gửi lẻ từng báo cáo
- **Periodic-package**: Giao diện mẫu cho báo cáo có kỳ hạn và gửi gộp bộ hồ sơ
- **Periodic-single**: Giao diện mẫu cho báo cáo có kỳ hạn và gửi lẻ từng báo cáo

## 12. Quy tắc tham chiếu CMR và CF trong FDD/SRS

- Khi viết FDD/SRS, bắt buộc dùng cú pháp: **"Tham chiếu: [Mã CMR]"** hoặc **"Tham chiếu: [Mã CF]"** tại mỗi mục áp dụng quy tắc/chức năng chung.
- Khi tham chiếu một mục cụ thể trong CF, dùng cú pháp: **"Tham chiếu: CF_XX (mục [tên mục])"**.
- Cột "Áp dụng Usecase" trong `common_business_rules.md` chỉ được cập nhật bởi Agent 3 sau khi UC được đặc tả chính thức.
- **QC team:** Phải kiểm tra rằng mọi chức năng chung trong UC đều có tham chiếu CF/CMR, không được viết lại chi tiết.

## 13. Tiêu chuẩn ngôn ngữ và tài liệu

- **Ngôn ngữ:** 100% tiếng Việt kỹ thuật cho toàn bộ output.
- **Thuật ngữ bắt buộc:**
    - "Trường thông tin" (thay cho Field)
    - "Luồng nghiệp vụ" (thay cho Business flow)
    - "Đặc tả chức năng" (thay cho SRS/FDD trong văn xuôi)
- **BA phụ trách:** Ghi rõ tên BA ở đầu mỗi tài liệu.

## 14. Chức năng chung (Common Functions — CF)

> CF là **nguồn chân lý duy nhất (Single Source of Truth)** cho logic chức năng chung.
> Các UC phải tham chiếu CF thay vì viết lại chi tiết chức năng chung.
> Trong nội bộ mỗi CF, không tham chiếu sang CF khác — phải viết đầy đủ chi tiết.

| Mã CF | Tên chức năng | Mô tả tóm tắt |
| :--- | :--- | :--- |
| **CF_01** | Lập báo cáo (Create Report) | Luồng tạo báo cáo mới: điều kiện hiển thị, auto-fill API, validate, lưu nháp, nộp, xem chi tiết, hủy. |
| **CF_02** | Import báo cáo (Import Report) | Popup import: chọn Phạm vi, tải template, upload file, validate cấu trúc/dữ liệu, chuyển sang Tạo mới. |
| **CF_03** | Chỉnh sửa báo cáo (Edit Report) | Luồng chỉnh sửa: bảo toàn trạng thái, lưu nháp, nộp, xem chi tiết, hủy. |
| **CF_04** | Kết xuất file (Export) | Kết xuất .docx/.xlsx theo biểu mẫu. Toast thành công/lỗi. |
| **CF_05** | In báo cáo (Print) | Print Preview PDF → hộp thoại in trình duyệt. |
| **CF_06** | Xem vòng đời (Audit Trail) | Popup Timeline lịch sử thao tác. *(Chưa xác định, sẽ cập nhật sau.)* |
| **CF_07** | Xem chi tiết (View Detail / Preview) | Popup preview PDF với [In] và [Export]. Kích hoạt từ Danh sách hoặc form Tạo mới/Chỉnh sửa. |

**Quy tắc khi viết UC:**
- Tại phần "Mô tả các xử lý", thay thế toàn bộ mô tả chức năng chung bằng `Tham chiếu: CF_XX`.
- Chỉ viết chi tiết phần xử lý đặc thù của biểu mẫu cụ thể (VD: logic chọn Dự án cho biểu mẫu I.15).
- Tại bảng giao diện (dòng Buttons), thay mô tả chi tiết bằng tham chiếu CF.

**Chi tiết đầy đủ của từng CF:** Xem `docs/template/common_business_rules.md` (phần CHỨC NĂNG CHUNG).


## App Specific Rules

# MOBILE MODULE: BUSINESS LOGIC RULES

## 1. Yêu cầu đăng nhập (Login Requirement)
*Tham chiếu: CMR_Mobile_Login*
- **Quy tắc cốt lõi:** Tất cả các chức năng trên nền tảng ứng dụng di động (Mobile App) đều **bắt buộc yêu cầu đăng nhập**.
- Không có bất kỳ luồng chức năng hay Use Case nào hỗ trợ "không đăng nhập" (public access).
- Đối tượng "Cá nhân/Tổ chức" được đề cập trong tất cả các đặc tả (SRS/UC) của Mobile App mặc định hiểu là **Cá nhân/Tổ chức (đã đăng nhập)**.
- Bất kỳ Agent hay tài liệu nào viết "không yêu cầu đăng nhập" đối với Mobile App đều là lỗi nghiêm trọng vi phạm nghiệp vụ.
