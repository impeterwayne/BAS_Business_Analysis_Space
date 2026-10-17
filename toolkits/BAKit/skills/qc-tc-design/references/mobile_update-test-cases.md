
## Cập nhật Test Cases (Quy trình 6 bước bắt buộc & Logic)

> **Điều kiện kích hoạt:** Quy trình này được kích hoạt khi xảy ra MỘT TRONG các trường hợp sau:
>
> 1. **Thay đổi requirement**: Báo cáo UC Readiness đã được cập nhật (phiên bản mới). Test cases cần được đồng bộ với các requirement đã thay đổi.
> 2. **Phản hồi từ người dùng**: Người dùng cung cấp phản hồi rõ ràng về các thiếu sót, lỗi, hoặc phạm vi bao phủ còn thiếu trong test cases hiện có.

---

### Bước 1: Phân tích đầu vào (BẮT BUỘC)

#### 1.1 — Tải các Artifact hiện có

- Xác định phiên bản cao nhất của file **test cases hiện có** (`docs/QC/testcases/[UC-ID]/`).
- Xác định **file audited hiện tại** (Báo cáo UC Readiness) đã được sử dụng để tạo ra các test cases đó ban đầu.
- Xác định **phiên bản mới nhất** của file audited hiện có.
- Load cả ba file trên. KHÔNG tạo bất kỳ file đầu ra nào trong bước này.

#### 1.2 — Xác định nguồn gốc thay đổi

Phân tích yêu cầu của người dùng để xác định **điều gì đã kích hoạt lần cập nhật này**:

| Loại kích hoạt                           | Mô tả                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Thay đổi Requirement**       | Người dùng cho biết file audited có phiên bản mới. HOẶC phiên bản file audited mới nhất mới hơn phiên bản đã dùng để tạo test cases hiện có. |
| **B — Phản hồi từ người dùng** | Người dùng cung cấp phản hồi rõ ràng về test cases (ví dụ: "thiếu cases", "expected result sai", "cần bổ sung X").                                      |
| **C — Cả hai**                      | Cả thay đổi requirement và phản hồi từ người dùng được cung cấp đồng thời.                                                                           |

Nếu loại kích hoạt không rõ ràng, hỏi người dùng:

> _"Bạn muốn cập nhật test cases vì: (A) Requirement đã thay đổi, (B) Có feedback về test cases hiện tại, hay (C) Cả hai?"_

---

### Bước 2: Phân tích tác động thay đổi - Impact Analysis (BẮT BUỘC)

Bước này thay thế việc soạn thảo mở của quy trình generate. Agent PHẢI tập trung phân tích vào **những gì đã thay đổi** và **thay đổi đó tác động như thế nào đến test cases hiện có**.

#### 2A — Nếu kích hoạt là Loại A (Thay đổi Requirement)

Thực hiện **phân tích sự khác biệt** giữa file audited trước đó và phiên bản mới nhất:

1. **Xác định các AC đã thay đổi**: Liệt kê tất cả Acceptance Criteria (AC) đã được thêm, xóa, hoặc sửa đổi.
2. **Map các AC với các TC hiện có**: Sử dụng Requirement Traceability Matrix từ file summary trước đó, tìm các test cases liên kết với từng AC đã thay đổi.
3. **Phân loại tác động** cho từng AC đã thay đổi:

| Loại thay đổi                                             | Tác động lên Test Cases                                                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC được thêm mới (requirement mới)                     | → Cần**thiết kế TC mới** bao phủ AC này. Áp dụng cùng logic 6 giai đoạn từ `generate-test-cases.md`.                                                  |
| AC bị xóa                                                  | →**Xóa các TC** chỉ bao phủ riêng AC này. Nếu một TC bao phủ nhiều AC và chỉ một AC bị xóa, giữ lại TC đó và cập nhật phạm vi bao phủ.      |
| AC bị sửa đổi (thay đổi nội dung, logic, ràng buộc) | →**Rà soát và cập nhật** các TC liên kết. Kiểm tra lại: Expected Result, Pre-conditions, Test Steps để đảm bảo chính xác so với requirement mới. |
| AC không thay đổi                                         | → Các TC hiện có vẫn hợp lệ. Đánh dấu "Không thay đổi".                                                                                                       |

4. Xây dựng **Bảng tác động (Impact Table)**:

```
| AC ID | Loại thay đổi | TC IDs liên kết | Hành động cần thực hiện |
|-------|---------------|-----------------|-------------------------|
| AC-03 | Sửa đổi      | TC_012, TC_013  | Cập nhật Expected Result trong TC_012, TC_013 |
| AC-07 | Thêm mới      | —               | Thiết kế TC mới         |
| AC-10 | Xóa           | TC_025          | Xóa TC_025              |
```

#### 2B — Nếu kích hoạt là Loại B (Feedback từ người dùng)

Thực hiện **phân tích phân loại phản hồi**:

Với mỗi mục phản hồi từ người dùng, phân loại vào một trong ba danh mục:

| Danh mục phản hồi                            | Định nghĩa                                                                                                                                                                                                                 | Hành động của Agent                                                                                                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cat 1 — Thiếu sót của Agent**       | Requirement đã mô tả rõ trường hợp này, nhưng agent đã bỏ sót khi tạo test cases. Ví dụ: Một quy tắc validation có trong file audited nhưng không có TC nào được tạo cho nó.                     | → Thiết kế (các) TC còn thiếu.**Đồng thời đánh dấu đây là đề xuất cải thiện skill** (xem Bước 2B.3).                                                                                                    |
| **Cat 2 — Thiếu sót của Requirement** | Phản hồi mô tả một hành vi KHÔNG được ghi nhận trong file audited hiện tại. Ví dụ: Người dùng nói "hệ thống nên hiển thị cảnh báo khi X" nhưng X không có trong danh sách AC của file audited. | → KHÔNG thiết kế TC ngay. Trước tiên:**yêu cầu người dùng xác nhận và cập nhật file audited** với requirement mới này. Sau khi xác nhận, kích hoạt lại quy trình cập nhật với file audited mới. |
| **Cat 3 — Sửa lỗi thực tế**          | TC hiện có có expected result sai, bước thực hiện sai, hoặc pre-condition sai — không phải do thiếu requirement, mà do lỗi soạn thảo.                                                                         | → Trực tiếp sửa TC hiện có.                                                                                                                                                                                                   |

**Bước 2B.1 — Kết quả phân tích cho mỗi mục phản hồi:**

Với mỗi mục phản hồi, trình bày:

```
Feedback: "[nội dung phản hồi của người dùng]"
Category: Cat 1 / Cat 2 / Cat 3
Reason: [Giải thích tại sao phân loại như vậy, trích dẫn AC ID hoặc ghi nhận sự vắng mặt của nó]
Action: [Agent sẽ làm gì]
```

**Bước 2B.2 — Đối với các mục Cat 2:** Hỏi người dùng:

> _"Feedback '[tóm tắt]' mô tả một hành vi chưa được ghi nhận trong tài liệu requirement (audited file [version]). Để đảm bảo traceability, bạn có thể xác nhận và bổ sung nội dung này vào file audited không? Sau khi cập nhật, tôi sẽ thiết kế test case tương ứng."_

**Bước 2B.3 — Đối với các mục Cat 1:** Sau khi thiết kế các TC còn thiếu, hãy thêm một **flag đề xuất cải thiện Skill (Skill Improvement Flag)**:

```
⚠️ ĐỀ XUẤT CẢI THIỆN SKILL:
Thiếu bao phủ cho [loại validation/logic, ví dụ: "boundary value cho trường max-length"].
Đề xuất bổ sung vào generate-test-cases.md → Giai đoạn 3 (Kiểm thử chức năng cốt lõi):
"[Quy tắc hoặc mục checklist mới được đề xuất]"
```

Trình bày cho người dùng và hỏi:

> _"Trường hợp này bị thiếu do skill chưa cover loại case này. Tôi đề xuất bổ sung vào `generate-test-cases.md` để tránh lặp lại. Bạn có muốn tôi cập nhật skill không?"_

#### 2C — Nếu kích hoạt là Loại C (Cả hai)

Áp dụng cả hai phân tích 2A và 2B theo thứ tự. Tổng hợp Bảng tác động và Phân tích phản hồi thành một **Báo cáo phân tích thay đổi (Change Analysis Report)** thống nhất trước khi chuyển sang Bước 3.

---

### Bước 3: Thiết kế lại các Test Cases bị ảnh hưởng (BẮT BUỘC)

Sử dụng cùng logic thiết kế 6 giai đoạn như `generate-test-cases.md`, áp dụng **chỉ cho phạm vi bị ảnh hưởng** đã xác định ở Bước 2:

- **TC mới**: Thiết kế từ đầu sử dụng logic 6 giai đoạn cho các AC mới hoặc đã thay đổi.
- **TC cập nhật**: Chỉ viết lại các trường bị ảnh hưởng (Steps, Expected Result, Pre-conditions) — giữ nguyên TC ID. Thêm ghi chú: `[Updated vN — Reason: AC-XX modified]`.
- **TC bị xóa**: Đánh dấu là DELETED trong bản nháp — KHÔNG đánh lại số thứ tự các TC còn lại để tránh phá vỡ traceability.

**Quy tắc sắp xếp Test Case:** Tuân thủ cùng quy tắc như `generate-test-cases.md` (GUI trước → Giai đoạn 1→6 → Happy path trước).

**Quy tắc liên tục TC ID:**

- TC mới phải tiếp nối từ TC ID cao nhất hiện có (ví dụ: nếu TC_025 là cuối cùng, TC mới bắt đầu từ TC_026).
- KHÔNG BAO GIỜ tái sử dụng ID của TC đã bị xóa.

---

### Bước 4: Viết file Draft (.md) (BẮT BUỘC)

Trước khi tạo file `.xlsx`, viết toàn bộ danh sách test cases đã cập nhật vào file md mới.

- File md phải chứa TẤT CẢ test cases — không thay đổi, đã cập nhật, và mới thêm — ở dạng hoàn chỉnh cuối cùng.
- Với mỗi TC đã thay đổi, chú thích inline:
  - `[UPDATED — Reason: AC-XX modified]` bên cạnh tiêu đề TC.
  - `[NEW — AC-XX]` bên cạnh tiêu đề TC cho các case mới.
  - KHÔNG đưa các TC đã xóa vào file md.
- Ở cuối file md, đưa vào **Ma trận truy xuất nguồn gốc yêu cầu đã cập nhật (Updated Requirement Traceability Matrix)**:
  - Gộp phạm vi bao phủ cũ + mới.
  - Đánh dấu TC đã xóa là `[DELETED]`. Đánh dấu TC mới là `[NEW]`. Đánh dấu TC đã cập nhật là `[UPDATED]`.
  - Đảm bảo bao phủ 100% cho tất cả AC đang hoạt động trong file audited mới nhất.

---

### Bước 5: Tạo đầu ra (.xlsx)

- **Luôn tạo phiên bản mới**: Nếu `v[N].xlsx` đã tồn tại, tạo `v[N+1].xlsx`. KHÔNG BAO GIỜ ghi đè.
- Sử dụng file template.
- Dữ liệu nguồn lấy từ file md đã tạo ở Bước 4.
- Ghi TẤT CẢ test cases — cả không thay đổi và đã cập nhật — vào file mới:
  - Sheet đăng ký → Functional test cases (bắt đầu từ row 2)
  - Các cột: `A=TC ID | B= Test Title| C= Preconditions| D=Steps | E=Expected Result | F=Priority`
- Đối với TC đã xóa: **KHÔNG đưa vào** file mới. Việc xóa được ghi nhận trong file summary.

---

### Bước 6: Viết tóm tắt cập nhật (Update Summary)

Lưu file summary trong cùng thư mục với file Excel. File summary PHẢI bao gồm:

```markdown
## ✅ Hoàn tất cập nhật Test Cases

### Bối cảnh cập nhật
- Kích hoạt: [Loại A — Thay đổi Requirement / Loại B — Phản hồi từ người dùng / Loại C — Cả hai]
- Phiên bản trước: [tên_file]_v[N].xlsx ([X] cases)
- Phiên bản mới: [tên_file]_v[N+1].xlsx ([Y] cases)
- File audited đã dùng (trước): [tên_file_audited_vX]
- File audited đã dùng (mới): [tên_file_audited_vY]

---

### Tóm tắt thay đổi

| Chỉ số | Số lượng |
|---|---|
| Tổng TC trong phiên bản trước | X |
| TC đã xóa | -D |
| TC đã cập nhật (sửa đổi) | ~U |
| TC đã thêm mới | +A |
| **Tổng TC trong phiên bản mới** | **Y** |

#### Test Cases đã xóa
| TC ID | Tiêu đề | Lý do |
|---|---|---|
| TC_025 | [Tiêu đề] | AC-10 bị xóa khỏi requirement |

#### Test Cases đã cập nhật
| TC ID | Tiêu đề | Mô tả thay đổi |
|---|---|---|
| TC_012 | [Tiêu đề] | Expected Result đã cập nhật — ràng buộc AC-03 bị sửa đổi |

#### Test Cases mới
| TC ID | Tiêu đề | AC liên kết |
|---|---|---|
| TC_026 | [Tiêu đề] | AC-07 (mới thêm) |

---

### Ma trận truy xuất nguồn gốc yêu cầu đã cập nhật
| AC ID | Tiêu chí chấp nhận | Test Cases liên kết | Trạng thái |
|---|---|---|---|
| AC-01 | ... | TC_001, TC_002 | Đã bao phủ |
| AC-07 | ... | TC_026 | Đã bao phủ [MỚI] |
| AC-10 | ... | — | Đã xóa |

---

### Cờ đề xuất cải thiện Skill (nếu có)
[Liệt kê các mục phản hồi Cat 1 cho thấy thiếu sót trong skill generate]

### Câu hỏi mở (nếu có)
[Liệt kê các mục phản hồi Cat 2 đang chờ người dùng xác nhận để cập nhật file audited]

### Các hạng mục ngoài phạm vi
[Ví dụ: Performance testing, Load testing — không thuộc phạm vi của skill này]
```
