# Quy trình tạo Test Case (Quy trình 5 bước bắt buộc & Logic)

### Bước 1: Phân tích đầu vào (BẮT BUỘC)

- Xác định phiên bản cao nhất của tất cả các tệp đầu vào (Báo cáo UC Readiness, Kịch bản/Scenarios). Luôn chọn số phiên bản mới nhất hiện có.
- Đọc các tài liệu được cung cấp và nắm vững trường hợp sử dụng (Use Case) để chuẩn bị thiết kế test case.
> ⚠️ **LƯU Ý PHẠM VI TEST:**
> Khi đọc UC có mô tả API (endpoint, payload, response): chỉ dùng để hiểu **hành vi phía client** cần test. **KHÔNG** tạo test case cho API endpoint, server response code, hay backend logic. Câu hỏi định hướng đúng khi đọc UC: *"App sẽ hiển thị/xử lý thế nào khi nhận kết quả này?"* — không phải *"API có trả đúng không?"*. Mọi TC đều phải có thể thực hiện và quan sát được trên thiết bị.

- **KHÔNG** tạo tệp `testcases` hoặc viết mã Python trong bước này.

### Bước 2: Soạn thảo chi tiết (BẮT BUỘC)

Viết một tệp dự thảo. Tuân thủ 6 giai đoạn riêng biệt để thiết kế test case:

#### Giai đoạn 1: Khởi tạo màn hình (Trạng thái tĩnh)

Agent phải kiểm chứng trạng thái ban đầu (landing state) của màn hình trước khi có bất kỳ tương tác nào từ người dùng.

- **Trạng thái trống (Không có dữ liệu):** Kiểm tra hiển thị và các thuộc tính mặc định cụ thể của mọi đối tượng trên màn hình.
  - Mô tả rõ ràng các văn bản gợi ý (placeholders), biểu tượng trạng thái trống, hoặc thông báo "Không có dữ liệu".
- **Trạng thái có dữ liệu:** Kiểm tra giao diện mặc định của tất cả các mục.
  - Mô tả trạng thái mặc định (Kích hoạt/Vô hiệu hóa - Enabled/Disabled) của tất cả các thành phần tương ứng với dữ liệu hiện có.

#### Giai đoạn 2: Tương tác thành phần (Trạng thái thành phần)

Kiểm chứng hành vi của các thành phần UI riêng lẻ mà không kích hoạt logic nghiệp vụ cốt lõi.

- **Điều hướng & Reset:** Kiểm tra các biểu tượng 'X', nút 'Hủy', và các trình điều khiển 'Đóng' để đảm bảo chúng thoát hoặc đặt lại chế độ xem đúng như thiết kế.
- **Kích hoạt khởi tạo màn hình:** Kiểm tra việc nhấp vào các nút chức năng có mở hoặc khởi tạo đúng các chức năng phụ hoặc cửa sổ bật lên (popups) liên quan hay không.
- **Xác minh từng thành phần:**
  - **Dropdowns:** Kiểm tra khả năng nhấp và đảm bảo danh sách giá trị hiển thị chính xác.
  - **Textbox/Button:** Kiểm tra các trạng thái (Có thể nhấp, Bị vô hiệu hóa, Chỉ đọc) dựa trên thiết kế hoặc quy tắc nghiệp vụ.
- **Công cụ điều hướng:** Kiểm tra hành vi phân trang (Trang hiện tại, mũi tên Tiếp/Trước).

#### Giai đoạn 3: Kiểm thử chức năng cốt lõi (Phân tích Logic)

Áp dụng các kỹ thuật kiểm thử hệ thống cho mọi chức năng cụ thể có trên màn hình:

- **Luồng chạy chuẩn (Happy Path):** Thực hiện luồng thành công với các đầu vào hợp lệ.
- **Kiểm tra tính hợp lệ (Validation):**

  - **Trường bắt buộc:** Đảm bảo hệ thống chặn lưu nếu các trường bắt buộc bị trống.
  - **Định dạng:** Kiểm tra định dạng Email, Số điện thoại, Ngày tháng hoặc các định dạng dữ liệu cụ thể.
  - **Phạm vi:** Kiểm tra độ dài ký tự hoặc giới hạn số lượng.
  - **Phân tích giá trị biên (BVA):** Kiểm thử tại các ngưỡng (Min, Max, Min-1, Max+1).
- **Xử lý ngoại lệ/lỗi:** Kích hoạt và xác minh phản hồi của hệ thống với logic không hợp lệ hoặc lỗi bên ngoài. ví dụ:

  > ⚠️ **LƯU Ý PHẠM VI TEST:**
  > Các test case xử lý lỗi bên dưới chỉ kiểm tra **hành vi hiển thị/phản hồi phía client** (thông báo lỗi, loading indicator, giữ dữ liệu). **KHÔNG** kiểm thử API endpoint, server response code, hay logic xử lý phía backend. Giả định API trả đúng spec, tập trung vào cách app phản hồi người dùng.

  Mất mạng / network error: Tắt mạng trước khi submit → kiểm tra thông báo lỗi mạng cụ thể, không crash app, không mất dữ liệu đã nhập.
  Timeout: Giả lập server phản hồi chậm → kiểm tra loading indicator và thông báo timeout.
  Dữ liệu đã tồn tại (Duplicate): Đăng ký email/mã đã có trong hệ thống → thông báo lỗi duplicate đúng nội dung.
  Tài khoản bị khóa / không có quyền: Đăng nhập tài khoản bị vô hiệu hóa → thông báo đúng trạng thái.
  Nhấn nút nhiều lần (Double-tap/Double-click): Nhấn submit liên tục nhanh → chỉ gửi 1 request, không tạo duplicate data.
  Quay lại giữa chừng: Điền một phần form → nhấn back → kiểm tra dữ liệu có bị reset hay vẫn giữ nguyên (theo spec).
  Gián đoạn mobile (đặc thù app): Nhận cuộc gọi / chuyển app rồi quay lại → form giữ nguyên, không crash.

#### Giai đoạn 4: Tích hợp chức năng

Kiểm chứng sự phối hợp giữa các chức năng khác nhau trên cùng một màn hình.
> ⚠️ **LƯU Ý PHẠM VI TEST:**
> "Tích hợp" ở đây là tích hợp **giữa các chức năng trên cùng màn hình** (client-side). KHÔNG thiết kế TC kiểm thử tích hợp với API/backend. Câu hỏi đúng phạm vi: *"Khi Filter thay đổi, Pagination trên UI có reset về trang 1 không?"* — không phải *"API có nhận đúng tham số filter không?"*.
- **Ví dụ:** Cách hành động 'Tìm kiếm' ảnh hưởng đến 'Phân trang', hoặc việc 'Xóa' một mục sẽ cập nhật số lượng danh sách trong thời gian thực như thế nào.

#### Giai đoạn 5: Kiểm thử phi chức năng mức UI

- **Bảo mật:** Kiểm tra việc che dấu dữ liệu nhạy cảm (mật khẩu) và làm sạch đầu vào (chống SQL Injection/XSS) trong các trường giao diện.

  > ⚠️ **LƯU Ý PHẠM VI TEST:**
  > Chỉ kiểm tra bảo mật **phía client** (masking password, input sanitization trên UI). **KHÔNG** thiết kế test case kiểm thử bảo mật phía server/API (authentication server-side, authorization backend, SQL injection ở tầng database).
- **UX/Loading:** Kiểm tra sự hiện diện của các biểu tượng tải (spinners) trong quá trình truy xuất dữ liệu và cơ chế chống lặp lệnh (debounce) của nút để ngăn chặn việc nhấp đúp.

  > ⚠️ **LƯU Ý PHẠM VI TEST:**
  > Chỉ kiểm tra hiển thị spinner/loading phía client và debounce button. **KHÔNG** kiểm tra thời gian phản hồi thực tế của API hoặc performance/load test phía server.

#### Giai đoạn 6: Tuân thủ GUI & Hình ảnh (Design-to-code)

Giai đoạn này tập trung hoàn toàn vào độ chuẩn xác về mặt thị giác:

- **Độ chuẩn thiết kế:** So sánh mọi đối tượng với tệp thiết kế (Figma/Mockup) về vị trí, màu sắc (mã HEX), khoảng cách và kích thước phông chữ.
- **Thiết kế đáp ứng (Responsive Design):** Kiểm chứng việc hiển thị giao diện trên các độ phân giải màn hình và tỷ lệ khung hình khác nhau.

**Quy tắc sắp xếp Test Case:**
**Quy tắc 1:** Mỗi màn hình/nhóm chức năng = 1 Section Group row. Bên trong mỗi Section Group: **Check UI/UX → Check Function → Check common** theo đúng thứ tự. Check common luôn nằm SAU Check Function, TRƯỚC Section Group tiếp theo. Hoàn thiện toàn bộ TC cho 1 màn hình trước khi chuyển sang màn hình tiếp theo.
Ví dụ:

[Section Group] 1. Màn hình Đăng nhập ← bg: FFA4C2F4
→ [Check type] Check UI/UX ← bg: FFFFF2CC
TC_001: Kiểm tra UI/UX
→ [Check type] Check Function ← bg: FFFFF2CC
TC_002 → TC_00N: Các TC chức năng
→ [Check type] Check common ← bg: FFFFF2CC
[Sub-label] Kiểm tra các trường hợp phổ biến UI/UX ← bg: #E3FAFD
TC_00X → TC_00Y: 8 TC UI/UX common
[Sub-label] Kiểm tra tương tác cơ bản với thiết bị ← bg: #E3FAFD
TC_00Z → TC_00W: 8 TC tương tác thiết bị

[Section Group] 2. Màn hình Quên mật khẩu ← bg: FFA4C2F4
→ Check UI/UX → Check Function → Check common

**Quy tắc 2**: Trong mỗi loại, sắp xếp theo Giai đoạn (1→6):

- Giai đoạn 1: Khởi tạo màn hình (Trạng thái tĩnh)
- Giai đoạn 2: Tương tác thành phần (Trạng thái thành phần)
- Giai đoạn 3: Kiểm thử chức năng cốt lõi (Phân tích Logic)
- Giai đoạn 4: Tích hợp chức năng
- Giai đoạn 5: Kiểm thử phi chức năng mức UI
- Giai đoạn 6: Tuân thủ GUI & Hình ảnh (Từ thiết kế đến mã nguồn)

**Quy tắc 3**: Trong mỗi Giai đoạn — sắp xếp theo luồng logic:

- Luồng chuẩn (Happy path) trước, sau đó đến kiểm tra tính hợp lệ (validation), cuối cùng là các trường hợp lỗi/ngoại lệ.

**Quy tắc hướng dẫn viết Test Case:** Tuân thủ 3 quy tắc dưới đây:
**Quy tắc 1 — TC ID**: Tuân thủ 3 quy tắc dưới đây: Quy tắc 1: Quy tắc định danh (Naming & Identifier)

TC ID: Luôn tuân thủ nghiêm ngặt định dạng: TC_[XXX] - XXX là số tăng dần (3 chữ số). Ví dụ: TC_001, TC_002

**Quy tắc 2**: Tiêu chuẩn ký hiệu UI: Agent phải tuân thủ tuyệt đối bộ ký hiệu sau:

1. **Sử dụng `[Ngoặc vuông]` cho Thành phần Giao diện (UI Elements/Objects):**
   * Dùng cho các đối tượng có thể tương tác hoặc định danh vùng: `[Button]`, `[Textbox]`, `[Checkbox]`, `[Tab]`, `[Popup]`, `[Screen/Màn hình]`.
   * *Ví dụ:* `Button [Đăng nhập]`, `Textbox [Mã định danh]`, `Màn hình [Trang chủ]`.
2. **Sử dụng `"Dấu nháy kép"` cho Nội dung và Giá trị (Labels, Data & Status):**
   * **Placeholder:** Tên hiển thị của trường hoặc văn bản gợi ý. (Ví dụ: placeholder  `"Số điện thoại"`, placeholder `"Nhập email của bạn"`).
   * **Input/Output Value:** Dữ liệu nhập vào hoặc giá trị hệ thống trả về. (Ví dụ: Nhập `"admin123"`, chọn giá trị `"Nam"`).
   * **Trạng thái/Thông báo:** Các tag trạng thái hoặc nội dung message. (Ví dụ: trạng thái `"Untested"`, thông báo `"Đăng nhập thành công"`).

**Quy tắc 3**: Logic nội dung viết

1. Cấu trúc tệp:

- Tên trang tính (sheet) đổi từ `Test cases` thành `[Tên tính năng]`.

2. Test Title/Summary of test cases (cột B):

- **[Tiền tố]:** Đây là tên của phần tử/đối tượng UI chính được tương tác trên màn hình cho trường hợp cụ thể đó (ví dụ: [Ô nhập liệu Tên tài khoản], [Nút Đăng nhập]).
- Prefix là tên element chính: `[Button Đăng nhập]`, `[Textbox Email]`, tên màn hình
- Phải bắt đầu bằng từ: Kiểm tra
- Phải bao gồm ngữ cảnh của kịch bản.
- Ví dụ:

  - Kiểm tra UI/UX
  - [Nút Đăng nhập] Kiểm tra khi nhấp đúp (double-click) vào nút "Đăng nhập".
  - [Ô nhập liệu Email] Kiểm tra khi để trống trường Email.

3. Pre-Condition (Cột C): Phải bắt đầu bằng một hành động, mô tả các thao tác phải được thực hiện trước khi thực thi test case.
   Ví dụ:

- Đăng nhập vào hệ thống Admin tại [URL].
- Điều hướng đến màn hình Danh sách Sản phẩm.

4. Step (Cột D):

- Mỗi bước phải là một hành động đơn lẻ, rời rạc trên giao diện.
- Đánh số `1. 2. 3.` — mỗi bước = 1 thao tác duy nhất
- Sử dụng các động từ mệnh lệnh: Truy cập, Nhấp vào, Chọn, Nhập, Di chuột qua, Kiểm tra, Dùng từ Kiểm tra hiển thị thay cho từ Quan sát
- Ví dụ:
  - 1. Tại màn hình [Đăng nhập], nhấp vào ô nhập liệu "Tên đăng nhập".
  - 2. Nhấp vào nút "Đăng nhập".
    3. Kiểm tra hiển thị trên màn hình [Đăng nhập]

5. Expected Result (cột E):

- **BẮT BUỘC** bắt đầu bằng số thứ tự của bước (Ví dụ: 1. Kết quả mong đợi).
- Không viết các câu chung chung như "Hệ thống hoạt động bình thường".
- TC UI/UX: `2.\n- Hiển thị đầy đủ các item, màu sắc, font chữ, layout giống Design\n(Tham khảo ảnh [X]. [Tên màn hình] sheet WFDesign)`
- Phải mô tả rõ ràng trạng thái thay đổi của giao diện:

  - Hiển thị một thông báo (nêu rõ nội dung thông báo).
  - Mở/Đóng một cửa sổ bật lên/màn hình.
  - Trạng thái của các trường (kích hoạt, vô hiệu hóa, hiển thị văn bản gợi ý).
  - Quy tắc hiển thị (Sắp xếp theo thứ tự nào? Màu sắc gì?).
  - Phản ứng của hệ thống (cho phép nhập/không cho phép nhập).
- Chưa rõ spec: ghi `"ABC"` + note cột F

### Bước 3: Ma trận truy xuất nguồn gốc tiền thực thi (Pre-Execution Traceability Matrix)

- Bên trong tệp dự thảo, xây dựng `Requirement Traceability Matrix` (RTM) ánh xạ các tiêu chí chấp nhận (AC) của yêu cầu với các mã ID của Test Case đã dự thảo.
- Đảm bảo bao phủ 100% yêu cầu trước khi tiếp tục.

### Bước 4: Tạo đầu ra (.xlsx) tuân thủ đúng theo file template

- Chỉ sau khi các Bước 1-3 đã được xác minh, hãy tiến hành tạo tệp `.xlsx` bằng cách viết mã để đổ dữ liệu vào `Template TestCase - Mobile.xlsx` sử dụng dữ liệu dự thảo đã được kiểm chứng.
- Kiểm tra thư mục đầu ra cho các phiên bản hiện có. Nếu `v[N].xlsx` đã tồn tại, hãy tăng phiên bản lên `v[N+1].xlsx`. Không bao giờ ghi đè lên các tệp hiện có.
- Kiểm tra `docs/QC/testcases/[UC-ID]/` cho các phiên bản hiện có. Bắt đầu từ `v1`, tăng dần nếu tệp đã tồn tại.

4.1 Cấu trúc các sheet:

- Sao chép mẫu từ: `\.agents\skills\qc-tc-design\templates\[Project_Name] Template TestCase - Mobile.xlsx`
- **Clear data (BẮT BUỘC):** Sau khi sao chép template, kiểm tra sheet `Tên tính năng`. Nếu sheet đã có dữ liệu cũ (từ Row 8 trở đi), xóa toàn bộ nội dung và định dạng từ Row 8 đến hết dữ liệu hiện có trước khi ghi dữ liệu mới. Giữ nguyên Header (Row 1–7) không thay đổi.
- Chỉ update vào sheet `Tên tính năng`, các sheet còn lại giữ nguyên so với `.claude\skills\qc-tc-design\templates\[Project_Name] Template TestCase - Mobile.xlsx`

4.2 Kích thước các cột và hàng:

```
Cột A (ID_TC) : width = 14.25
Cột B (Title) : width = 39.0
Cột C (Pre-Condition) : width = 37.38
Cột D (Step) : width = 50.38
Cột E (Expected Result): width = 48.63
Cột F (Data/Note) : width = 16.0
Cột G (R1-iOS Result) : width = 16.0 (G H I J merge header)
Cột K (R1-Android) : width = 16.0 (K L M N merge header)
Cột O (R2-iOS) : width = 16.0 (O P merge header)
Cột Q (R2-Android) : width = 16.0 (Q R merge header)
Cột H, I, J, L, M, N, P, R: width tự động (không set cứng)

Row 1–7 : height = 15.75
Row 8+ : height = tự động (wrap text)
```

4.3 Metadata Header (Row 1–5) — Style & Công thức

```
Font toàn bộ: **Calibri 11**, màu chữ `FF000000`, vertical align = center.

| Row | Col A | Style A | Col B–C | Col D | Col G–R (thống kê) |
|-----|-------|---------|---------|-------|-------------------|
| 1 | `System Name` | bg=`FFCFE2F3`, bold, left | Tên hệ thống | Tên file: `[Project_Name]_UC-[ID]_[FunctionName]_Testcase_v[X.Y]` | Xem công thức bên dưới |
| 2 | `Module` | bg=`FFCFE2F3`, bold, left | Tên module | (trống) | |
| 3 | `Function Name` | bg=`FFCFE2F3`, bold, left | (trống) | Tên chức năng | |
| 4 | `Created By` | bg=`FFCFE2F3`, bold, left | Công thức: `=Overview!E17` | Ngày tạo | |
| 5 | `Execute By` | bg=`FFCFE2F3`, bold, left | Username thực thi | (trống) | |
```

4.4 Column Header (Row 6–7) — Style cố định

**Row 6 — Group headers:**

```
A6 = "ID_TC" bg=FFCFE2F3, bold, center, merge A6:A7
B6 = "Test Title/Summary..." bg=FFCFE2F3, bold, center, merge B6:B7
C6 = "Pre-Condition" bg=FFCFE2F3, bold, center, merge C6:C7
D6 = "Step" bg=FFCFE2F3, bold, center, merge D6:D7
E6 = "Expected Result" bg=FFCFE2F3, bold, center, merge E6:E7
F6 = "Data/Note" bg=FFCFE2F3, bold, center, merge F6:F7
G6 = "Round 1 - iOS" bg=FFD9EAD3 (xanh lá), bold, center, merge G6:J6
K6 = "Round 1 - Android" bg=FFD9EAD3, bold, center, merge K6:N6
O6 = "Round 2 - iOS" bg=FFD9D2E9 (tím nhạt), bold, center, merge O6:P6
Q6 = "Round 2 - Android" bg=FFD9D2E9, bold, center, merge Q6:R6
```

**Row 7 — Sub-headers:**

```
G7 = "Test Result" H7 = "PIC" I7 = "Execute Date" J7 = "ID Bug" → bg=FFD9EAD3, bold, center
K7 = "Test Result" L7 = "PIC" M7 = "Execute Date" N7 = "ID Bug" → bg=FFD9EAD3, bold, center
O7 = "Test Result" P7 = "PIC" → bg=FFD9D2E9, bold, center
Q7 = "Test Result" R7 = "PIC" → bg=FFD9D2E9, bold, center
```

4.5 Section Marker Rows — Style màu nền

**Section Group row** (VD: "1. Tên màn hình"):

```
Cột A: trống | bg = FFA4C2F4 (xanh dương nhạt), toàn bộ A→R
Cột B: "1. Tên màn hình / nhóm chức năng" | bold=True, left align, va=center, wrap=True
Cột C→R: trống, cùng bg FFA4C2F4
Merge: B[row]:R[row]
```

**Check type row** ("Check UI/UX" hoặc "Check Function"):

```
Cột A: trống | bg = FFFFF2CC (vàng nhạt), toàn bộ A→R
Cột B: "Check UI/UX" hoặc "Check Function" | bold=True, left align, va=center, wrap=True
Cột C→R: trống, cùng bg FFFFF2CC
Merge: B[row]:R[row]
```

4.6 TC Data Rows (Row) — Style

```
Font: Times New Roman 11, màu FF000000, va=center, wrap=True

Cột A (ID_TC): ha=left, bg=None, công thức ="TC_"&TEXT(ROW()-offset,"000")
Cột B (Title): ha=left, bg=None, bold=False, wrap=True
Cột C (Pre): ha=left, bg=None, wrap=True
Cột D (Steps): ha=left, bg=None, wrap=True
Cột E (Expected):ha=left, bg=None, wrap=True
Cột F (Note): ha=left, bg=None

**All Borders (BẮT BUỘC):** Tự động áp dụng viền (thin border) cho tất cả các ô từ Row 6 đến row cuối cùng có dữ liệu (cột A đến R). Mỗi khi ghi một row dữ liệu mới (TC row, Section Group row, Check type row, Sub-label row), row đó phải được áp dụng all borders ngay lập tức. Đảm bảo không có row nào trong vùng dữ liệu bị thiếu border.
```

### 4.8 Check common — Danh sách TC cố định cho mỗi màn hình

**Check common là section BẮT BUỘC**, đặt sau Check Function của mỗi màn hình. Gồm 2 nhóm con:

#### Nhóm A — Sub-label: "Kiểm tra các trường hợp phổ biến UI/UX"

| # | Cột B (Title) | Cột D (Step) | Cột E (Expected Result) |
|---|--------------|-------------|------------------------|
| 1 | Kiểm tra hiển thị dữ liệu tối đa (maxlength) | 1. Kiểm tra hiển thị dữ liệu tối đa (maxlength) | 1. Hiển thị đúng độ dài tối đa |
| 2 | Kiểm tra khôi phục/phóng to/thu nhỏ ứng dụng | 1. Thực hiện khôi phục, phóng to, thu nhỏ ứng dụng | 1. Không xảy ra lỗi bất thường |
| 3 | Kiểm tra tính nhất quán của các thông báo | 1. Kiểm tra tính nhất quán của các thông báo | 1. Xác nhận thông báo lỗi:\n- Thông báo lỗi inline: hiển thị dưới ô nhập liệu bị lỗi, màu đỏ\n- Thông báo lỗi dạng toast: hiển thị ở giữa hoặc phía dưới màn hình |
| 4 | Kiểm tra hiển thị khi thiết bị ở chế độ dọc (thiết bị xoay theo chiều đứng) | 1. Kiểm tra hiển thị khi thiết bị ở chế độ dọc | 1. Không có lỗi gì xảy ra, giao diện không bị vỡ |
| 5 | Kiểm tra hiển thị khi thiết bị ở chế độ ngang (thiết bị xoay theo chiều ngang) | 1. Kiểm tra hiển thị khi thiết bị ở chế độ ngang | 1. Không có lỗi gì xảy ra, giao diện không bị vỡ |
| 6 | Kiểm tra hiển thị khi chuyển đổi giữa chế độ dọc và ngang | 1. Kiểm tra hiển thị khi chuyển từ chế độ dọc sang ngang\n2. Kiểm tra hiển thị khi chuyển từ chế độ ngang sang dọc | 1 & 2. Không có lỗi gì xảy ra, giao diện không bị vỡ |
| 7 | Kiểm tra hiển thị khi thiết bị sử dụng cỡ chữ lớn nhất | 1. Kiểm tra hiển thị khi thiết bị sử dụng cỡ chữ lớn nhất | 1. Giao diện không bị vỡ |
| 8 | Kiểm tra hiển thị khi thiết bị sử dụng cỡ chữ nhỏ nhất | 1. Kiểm tra hiển thị khi thiết bị sử dụng cỡ chữ nhỏ nhất | 1. Giao diện không bị vỡ |

#### Nhóm B — Sub-label: "Kiểm tra tương tác cơ bản với thiết bị"

| # | Cột B (Title) | Cột D (Step) | Cột E (Expected Result) |
|---|--------------|-------------|------------------------|
| 9 | Xác nhận hiển thị của ứng dụng khi người dùng chạm vào nút [Quay lại] trên thiết bị Android | 1. Mở ứng dụng\n2. Người dùng chạm vào nút [Quay lại] trên thiết bị Android\n3. Xác nhận hiển thị | 3. Quay lại màn hình trước đó |
| 10 | Xác nhận hiển thị của ứng dụng khi người dùng vuốt từ trái sang phải trên thiết bị iOS | 1. Mở ứng dụng\n2. Người dùng vuốt từ trái sang phải trên thiết bị iOS\n3. Xác nhận hiển thị | 3. Quay lại màn hình trước đó |
| 11 | Xác nhận hiển thị của ứng dụng khi người dùng tắt và mở lại ứng dụng | 1. Mở ứng dụng\n2. Người dùng tắt ứng dụng\n3. Mở lại ứng dụng\n4. Xác nhận hiển thị | 4. Ứng dụng mở lại từ trạng thái ban đầu |
| 12 | Kiểm tra chế độ đa nhiệm (multitasking) | 1. Mở ứng dụng\n2. Trở về màn hình chính (không tắt ứng dụng)\n3. Mở lại ứng dụng\n4. Xác nhận hiển thị | 4. Ứng dụng giữ nguyên ở trạng thái hiện tại |
| 13 | Xác nhận hiển thị của ứng dụng khi người dùng khóa và mở khóa màn hình thiết bị | 1. Mở ứng dụng\n2. Khóa thiết bị\n3. Mở khóa thiết bị\n4. Xác nhận hiển thị | 4. Giữ nguyên trạng thái hiện tại của ứng dụng |
| 14 | Kiểm tra hành động kéo xuống để làm mới (pull-to-refresh) | Tiền điều kiện: Màn hình hỗ trợ tính năng kéo để làm mới\n1. Người dùng ở màn hình hiện tại\n2. Kéo xuống để làm mới | 2. Hiển thị dữ liệu mới nhất của màn hình |
| 15 | Kiểm tra hành động cuộn xuống để tải thêm (scroll-down-to-load-more) | Tiền điều kiện: Màn hình hỗ trợ tính năng cuộn xuống để tải thêm\n1. Người dùng cuộn xuống cuối danh sách | 2. Hiển thị thêm dữ liệu mới |
| 16 | Kiểm tra phản hồi của ứng dụng khi thiết bị nhận được thông báo từ ứng dụng khác | Tiền điều kiện: Ứng dụng khác được phép gửi thông báo\n1. Người dùng mở ứng dụng\n2. Ứng dụng khác gửi thông báo\n3. Xác nhận hiển thị | 3. Không có lỗi nào xảy ra |

> ⚠️ TC #14, #15: ghi `N/A` nếu màn hình không hỗ trợ. TC #16: ghi `N/A` nếu không có logic notification.

4.7 Kiểm tra version & lưu file

- Kiểm tra `docs/qc/testcases/[UC-ID]/` xem đã có phiên bản nào chưa.
- Bắt đầu từ `v1`, tăng dần nếu đã tồn tại. **Không bao giờ ghi đè file cũ.**
- Lưu tại: `docs/qc/testcases/[UC-ID]/[UC-ID]_[FunctionName]_Testcase_[YYYYMMDD]_v[N].xlsx`

---
```

### Bước 5: Viết tóm tắt

Lưu một tệp tóm tắt (summary) trong cùng thư mục với tệp Excel. Bao gồm:

```markdown
## ✅ Hoàn tất thiết kế kiểm thử

| Sản phẩm | Tệp | Số lượng |
|---|---|---|
| Test Cases | [tên tệp].xlsx | X trường hợp (Y GUI / Z FUNC) |

### Ma trận truy xuất nguồn gốc yêu cầu (RTM)
| AC ID | Tiêu chí chấp nhận | Test Cases liên kết | Trạng thái |
|---|---|---|---|
| AC-01 | ... | TC_UC001_GUI_01, TC_UC001_GUI_02 | Đã bao phủ |
```
