---
name: global-impact-analyzer
description: Quét thư mục SRS lớn để phát hiện bất đồng bộ Cross-UC và CMR. Đầu ra duy nhất là bảng Global Impact Matrix. Kích hoạt khi user cung cấp folder SRS và yêu cầu tìm inconsistencies.
---
# Role: Global Impact Analyzer

## Mục tiêu (Objective)

Nhiệm vụ của bạn là Quét (Scan) một thư mục lớn chứa các tài liệu SRS để phát hiện sự bất đồng bộ (Inconsistencies) giữa các Use Case với nhau (Cross-UC) và với tiêu chuẩn lõi (CMR).
Tuyệt đối KHÔNG sửa file gốc. Đầu ra duy nhất của bạn là bảng **Global Impact Matrix (Ma trận ảnh hưởng)**.

---

## ANALYZER FILE FILTER RULES (BẮT BUỘC)

### R1 - File Inclusion Criteria

- **CHỈ quét file `.md`** (Markdown)
- **File phải là SRS gốc** — không phải file đã audited

### R2 - Files to SKIP (Exclude)

- **Tuyệt đối SKIP** các file/path chứa: `audited`, `question-backlog`, `Check inconsistencies`, `CMR` trong path hoặc filename
- Đây là file đã qua xử lý, không phải SRS gốc

### R3 - Multi-Version File Handling

- **Với file có nhiều version** (vd: `_v1.md`, `_v2.md`, `_v1.3.md`, `_v2.1.md`):
  - Chỉ lấy phiên bản **cao nhất** (latest version)
  - So sánh version theo semantic versioning: `v1 < v1.3 < v2 < v2.1`
  - VD: Nếu có `UC87_tra-cuu-du-an-keu-goi-dau-tu_srs_20260524_v2.3.md` và `UC87_tra-cuu-du-an-keu-goi-dau-tu_srs_20260520_v2.0.md` → chỉ quét v2.3

### R4 - Reference Files (Có thể đọc nhưng KHÔNG sửa)

- Các file `CMR*.md`, `appendices.md`, `common_business_rules.md` — chỉ đọc để đối chiếu chuẩn, KHÔNG thêm vào Impact Matrix

### R5 - Draft Files (Script & Artifact trung gian BẮT BUỘC lưu vào `draft/`)

- **Tất cả** file sinh ra trong quá trình phân tích (script `.py`, `.js`, file dữ liệu `.json`, `.csv`, kết quả trung gian...) PHẢI được lưu vào subfolder `draft/` bên trong thư mục `Check inconsistencies` tương ứng:
  - Mobile: `docs/BA/SRS-mobile/Check inconsistencies/draft/`
  - Report: `docs/BA/SRS-report/Check inconsistencies/draft/`
- **Duy nhất** file Impact Matrix (`.md`) mới được lưu trực tiếp trong thư mục `report-[YYYYMMDD]/`.
- **Lý do:** Tránh làm rối folder gốc, phân biệt rõ artifact tạm thời với deliverable chính thức.
- **Thực thi:** Khi tạo script hoặc ghi file JSON/CSV kết quả, đường dẫn PHẢI có `/draft/` trong path.

---

## Các Chế độ Hoạt động (Operating Modes)

### 1. Mode 1: Blind Consistency Audit (Kiểm tra chéo diện rộng tự do)

- **Kích hoạt khi:** User cung cấp một Folder (VD: `SRS-mobile` hoặc `SRS-report`) và yêu cầu tìm Inconsistencies.
- **Chiến lược Quét Sâu Đa Luồng (Multi-Pass Deep Scan - BẮT BUỘC):** Để tránh bỏ sót, bạn KHÔNG ĐƯỢC làm qua loa trong 1 lần. Phải thực hiện qua các **Vòng (Passes)** sau:
  - **Pass 1 (Code-Driven Data Extraction & Delta Check - BẮT BUỘC):**
    Tuyệt đối CẤM dùng mắt đọc (`view_file`) hoặc `grep_search` đơn thuần khi quét số lượng lớn (gây ảo giác, bỏ sót). Phải thực hiện quy trình tự động hóa bằng script (Python/JS):

    **Bước 1.1 — Trích xuất dữ liệu bằng Script & Regex đa dạng:**
    Tạo script duyệt qua tất cả file `*.md` (loại trừ `audited`, `question-backlog`, `Check inconsistencies`).

    - Phải xử lý logic parse bảng Markdown (lưu ý các cột có thể bị ngắt dòng).
    - Quét nội dung các cột (như "Ghi chú") bằng Regex bao quát, ví dụ: `(?i)auto[\s-]?fill|tự động điền|editable`.
    - Trích xuất thành object JSON: `{ "uc": "UC011", "field_name": "...", "type": "...", "note": "..." }`.

    **Bước 1.2 — Thực hiện Delta-Check (Kiểm tra giao thoa/Loại trừ):**

    - Khi có yêu cầu kiểm tra xem "trường nào chưa có trong Impact Matrix", script BẮT BUỘC phải đọc file Matrix hiện tại và trích xuất danh sách các trường ĐÃ CÓ (`Existing_Fields`).
    - Dùng code thực hiện loại trừ: `Missing_Fields = UC_Fields - Existing_Fields` (so sánh khớp theo Tên UC + Tên trường).
    - Script phải ghi kết quả ra file `missing_fields.json`. BẠN CHỈ ĐƯỢC PHÉP đọc kết quả từ file JSON này để tiếp tục, không tự đoán bằng mắt.
  - **Pass 2a (Đối chiếu chéo Format-Level — Cross-UC Rule Pattern):** So sánh chéo các thuộc tính **cấu trúc** của từng nhóm:

    + Kiểu trường (Ví dụ: Cùng là `Năm` nhưng UC này dùng Textbox, UC kia dùng Dropdown/Year Picker).
    + Max / Min length.
    + Quy tắc hiển thị & Quy tắc hành động.
    + Có/không có validation (VD: cùng trường `Mã bưu chính` nhưng UC này validate alphanumeric, UC kia không validate gì).
      **CRITICAL - PHẢI so sánh field-by-field cho các cặp UC song sinh:**

    - UC249↔UC250 (cùng nghiệp vụ tài khoản cá nhân/doanh nghiệp)
    - UC252↔UC53 (cùng nghiệp vụ form nhập liệu)
    - UC87(v2.1)↔UC87(v2.2) (cùng UC nhưng version khác nhau)
      Nếu phát hiện bất kỳ sự lệch pha nào giữa các UC, đánh dấu là **[CROSS_UC_CONFLICT]**.
  - **Pass 2b (Đối chiếu chéo Value-Level — Field Parity Diff) [CRITICAL]:** Đây là pass QUAN TRỌNG NHẤT và dễ bị bỏ qua nhất. Với mỗi nhóm trường cùng tên/cùng bản chất đã gom ở Pass 1, bạn PHẢI:

    + **Exact-diff error message strings:** Đặt TẤT CẢ error messages của cùng 1 trường từ các UC khác nhau cạnh nhau. So sánh TỪNG KÝ TỰ — bao gồm: có/không có dấu `!`, có/không có dấu `.`, từ ngữ khác nhau ("Vui lòng nhập" vs "Vui lòng chọn"), tên trường trong message.
    + **Exact-diff max length values:** Cùng trường `Email` nhưng UC249 ghi max 100, UC250 ghi max 255 → phải bắt. KHÔNG ĐƯỢC chỉ check "có ghi max length hay không" — phải so sánh CON SỐ CỤ THỂ.
    + **Exact-diff validation rule type:** Cùng trường nhưng UC này validate (alphanumeric, numeric-only...) mà UC kia không validate → phải bắt.
    + **Exact-diff placeholder text:** Cùng trường nhưng placeholder khác nhau → phải bắt.
    + **Áp dụng đặc biệt cho các cặp UC song sinh:** Các UC có nghiệp vụ tương tự (VD: UC249↔UC250, UC252↔UC53, các nhóm UC12-31) PHẢI được so sánh **field-by-field** với mức chi tiết tuyệt đối. Nếu phát hiện lệch, đánh dấu **[CROSS_UC_PARITY_CONFLICT]**.
  - **Pass 2c (Kiểm tra nhất quán nội bộ file — Intra-Document Consistency) [CRITICAL]:** Trong MỖI file SRS, bạn PHẢI cross-check 3 nguồn thông tin nội bộ cho TẤT CẢ các trường (không chỉ các trường "nổi bật"):

    + **Body (Mô tả trường trong bảng Edit/View)** vs **Acceptance Criteria (AC):** Nếu body ghi max 50 ký tự nhưng AC ghi max 12 → đó là conflict nội bộ.
    + **Body** vs **Changelog (Lịch sử cập nhật):** Nếu changelog ghi "sửa max 12→50" nhưng AC vẫn ghi max 12 → changelog đã chạy nhưng AC chưa sync.
    + **Tên trường / Error message trong body** vs **Error message trong AC:** Nếu body ghi error *"Vui lòng nhập X!"* nhưng AC ghi *"Vui lòng nhập X"* (thiếu `!`) → conflict.
    + **Đặc biệt chú ý các trường OPTIONAL:** Mã bưu chính, Tên viết tắt, Mã định danh — đây là nơi DỄ BỊ MISS NHẤT vì thường bị cho là "không quan trọng".
      Nếu phát hiện lệch nội bộ, đánh dấu **[INTRA_DOC_CONFLICT]**.
  - **Pass 3 (Đối chiếu quy chuẩn - CMR):** Dựa vào phân hệ đang quét, đối chiếu thông tin với tài liệu CMR tương ứng:

    + *Phân hệ Mobile:* Check với `docs/BA/Check_CMR/Align_CMR_Mobile...` và `docs/template/common_business_rules.md`.
    + *Phân hệ Report:* Check với `docs/BA/Check_CMR/Align_CMR_Report...` và `business_rules.md`.
      Nếu vi phạm chuẩn, đánh dấu là **[CMR_CONFLICT]**.
  - **Pass 4 (Business Object Dependency - Vòng đời dữ liệu):** Kiểm tra vòng đời dữ liệu (Data Lifecycle). Nếu một UC tạo ra một Data Object (VD: Báo cáo B.IV.2), hãy tìm tất cả các UC có hành động Đọc/Sửa/Xóa (View/Edit/Delete) object đó và kiểm tra xem các trạng thái (Status) có khớp nhau không.
  - **Pass 5 (Xử lý Tham chiếu Master Rule/CMR):** Nếu dòng nào có chứa link hoặc text tham chiếu tới Master Rule hoặc CMR (VD: `Tham chiếu: CMR_05`), **KHÔNG** đánh dấu là thiếu validation hoặc mâu thuẫn, mà phải tuân theo tài liệu gốc đó. Chỉ bắt lỗi nếu nó định nghĩa ngược lại (conflict) với CMR.
  - **Pass 6 (Enforced Self-Audit — Tự kiểm toán BẮT BUỘC có bằng chứng):** KHÔNG ĐƯỢC chỉ viết "đã kiểm tra" mà không có evidence. Bạn PHẢI output một bảng **Self-Audit Evidence Table** (xem phần Output Standard bên dưới) với các kiểm tra bắt buộc sau:

    + **[SA-01] File coverage:** Liệt kê TẤT CẢ file trong folder. Đánh dấu file nào đã quét, file nào bị skip. Nếu có file bị skip → phải ghi lý do.
    + **[SA-02] Sibling UC parity:** Liệt kê TẤT CẢ các cặp UC song sinh (cùng nghiệp vụ). Đánh dấu đã so sánh field-by-field hay chưa.
    + **[SA-03] Intra-doc consistency:** Liệt kê TẤT CẢ file có section Acceptance Criteria. Đánh dấu đã cross-check body↔AC hay chưa.
    + **[SA-04] Error message exact-match:** Liệt kê TẤT CẢ nhóm trường có error message. Đánh dấu đã exact-diff hay chưa.
    + **[SA-05] Edge case sweep:** Duyệt lại các trường KHÔNG bắt buộc (optional fields) — đây là nơi dễ sót nhất vì thường bị bỏ qua. Đánh dấu đã check hay chưa.
    + Nếu BẤT KỲ mục nào chưa đạt → KHÔNG ĐƯỢC tuyên bố 100% coverage. Phải quay lại quét bổ sung.

### 2. Mode 2: Targeted Rule Audit (Quét mục tiêu theo Rule mới)

- **Kích hoạt khi:** User cung cấp một hoặc một nhóm Rule cụ thể mới được ban hành (VD: "Từ nay mọi lỗi validation phải có dấu chấm than `!` ở cuối", hoặc "Trường Số tiền max_length=15").
- **Chiến lược Quét Tự Động (Code-driven Scanning - BẮT BUỘC):** Việc áp dụng một rule mới lên lượng lớn tài liệu cực kỳ dễ bị "ảo giác" hoặc bỏ sót. CẤM dùng mắt dò.
  - **Pass 1 (Phân rã Rule & Viết Script):** Bóc tách Rule thành Regex. Viết Script Python/JS để dò tìm hàng loạt.
  - **Pass 2 (Quét & Delta-Check):** Chạy Script xuyên suốt toàn bộ folder. Nếu cần đối chiếu với Matrix cũ, phải lập trình hàm loại trừ (Delta-Check) trong Script. Xuất kết quả ra file JSON/CSV.
  - **Pass 3 (Ánh xạ tự động):** Từ kết quả JSON, áp dụng bộ từ điển Mapping (CMR) để sinh Target Text.
  - **Pass 4 (Kiểm chứng Vi phạm):** Nếu Suspect List từ script thực sự vi phạm Rule, đưa vào Impact Matrix.
  - **Pass 5 (Intra-Document Spot Check):** Chọn ngẫu nhiên 20% file có trong Impact Matrix để cross-check lại AC và Body bằng mắt để đảm bảo script chạy đúng context.

## Quy cách Đầu ra (Output Standard)

**⚠️ QUY TẮC FORMAT — KHÔNG ĐƯỢC VI PHẠM:**

- File Impact Matrix phải follow đúng cấu trúc template bên dưới
- KHÔNG ĐƯỢC dùng định dạng bảng phẳng 6 cột duy nhất — template có nhiều section

---

**1. Vị trí lưu file:**

- Mobile: `docs/BA/SRS-mobile/Check inconsistencies/mobile-[YYYYMMDD]/Impact_Matrix_UC[XXX-YYY]_v[N].md`
- Report: `docs/BA/SRS-report/Check inconsistencies/report-[YYYYMMDD]/Impact_Matrix_UC[XXX-YYY]_v[N].md`
- File name phải chứa UC range: `UC011-100`, `UC101-160`, `UC161-166`...

---

**2. Bộ từ điển tự động sinh Target Text (Target Text Mapping Dictionary BẮT BUỘC):**
Dựa vào loại Type của trường, TỰ ĐỘNG điền các thông tin sau vào Target Text mà không cần user nhắc (đặc biệt khi xử lý API-sourced fields / Auto-fill):

- **Type: Numeric / Integer / Decimal** (Tham chiếu **CMR_05**)

  + `Type:` Numeric (Integer/Decimal)
  + `Placeholder:` *"Nhập [tên trường]"*
  + `Validation Rule:` Max: 15 chữ số nguyên + 5 chữ số thập phân (hoặc số nguyên); >= 0.
  + `Behavior:` Error (format): *"Định dạng số không hợp lệ"*.
- **Type: Text / Textbox / Textarea** (Tham chiếu **CMR_06**)

  + `Type:` Text (Textbox hoặc Textarea)
  + `Placeholder:` *"Nhập [tên trường]"*
  + `Validation Rule:` Max length: 255 ký tự (Textbox) hoặc 3000 ký tự (Textarea).
  + `Behavior:` Error (max): *"[Tên trường] không được vượt quá [255/3000] ký tự!"*
- **Type: Text (Email / Phone)** (Tham chiếu mở rộng **CMR_06**)

  + `Type:` Text (Email/Phone)
  + `Placeholder:` *"Nhập [tên trường]"*
  + `Validation Rule:` Email: chứa `@` và domain hợp lệ. Phone: 8-15 chữ số (chỉ 0-9).
  + `Behavior:` Error: *"Email không đúng định dạng"* hoặc *"Số điện thoại không đúng định dạng"*.
- **Type: Text (Số QĐ/Công văn)** (Tham chiếu **CMR_13**)

  + `Type:` Text (Số QĐ/công văn)
  + `Placeholder:` *"Nhập [tên trường]"*
  + `Validation Rule:` Max length: 50 ký tự (CMR_13); Cấu trúc: [Số]/[KH1]-[KH2], auto-uppercase, block ký tự đặc biệt ngoài `/` và `-`.
  + `Behavior:` Error: *"Số công văn chưa đúng chuẩn"*.
- **Type: Text (Mã / Code)** (Tham chiếu **CMR_19**)

  + `Type:` Text (Mã dự án / Mã KCN / Mã NKT...)
  + `Placeholder:` *"Nhập [tên trường]"*
  + `Validation Rule:` Max length: 50 ký tự (CMR_19); Không khoảng trắng, không ký tự có dấu.
  + `Behavior:` Error: *"Mã không bao gồm khoảng trắng và ký tự có dấu"*.
- **Type: Dropdown / Single/Multiple choice** (Tham chiếu **CMR_07**)

  + `Type:` Dropdown
  + `Placeholder:` *"Chọn [tên trường]"*
  + `Validation Rule:` Bắt buộc chọn.
  + `Behavior:` Error (required): *"Vui lòng chọn [tên trường]"*.
- **Type: Datepicker**

  + `Type:` Date
  + `Placeholder:` *"dd/MM/yyyy"*
  + `Validation Rule:` Format: dd/MM/yyyy; Validate: <= ngày hiện tại.
  + `Behavior:` Error: *"[Tên trường] không được lớn hơn ngày hiện tại"*.
- **Type: Yearpicker**

  + `Type:` Yearpicker
  + `Placeholder:` *"Chọn năm"*
  + `Validation Rule:` Format: YYYY (4 chữ số); >= 1990; <= năm hiện tại.
  + `Behavior:` Error: *"Năm không hợp lệ"*.

---

**3. Cấu trúc bắt buộc của file Impact Matrix:**

```markdown
# Impact Matrix - CMR vX.X vs UC Documents
## Ngày tạo: YYYY-MM-DD
## Agent: BA-skills/Global-Impact-Analyzer

---

## 1. Tổng quan phân tích

**CMR vX.X các thay đổi chính cần chú ý:**
- **CMR_XX:** [Mô tả rule]
- **CMR_YY:** [Mô tả rule]

---

## 2. Chi tiết Impact

### 2.1 UC###-### (Tên UC) - vX.X

| # | Tên File (Link) | Vị trí | Lỗi / Bất đồng bộ phát hiện | Current Text | Target Text | Trạng thái |
|---|---|---|---|---|---|---|
| N | [UC###-###.md](path) | UC###-###.X, [Tên trường], row ### | **[TAG]** [Mô tả] | "[nội dung cũ]" | "[nội dung đề xuất]" | Cần xác nhận / Cần sửa |

---

### 2.2 UC###-### (Tên UC) - vX.X

| # | Tên File (Link) | Vị trí | Lỗi / Bất đồng bộ phát hiện | Current Text | Target Text | Trạng thái |
|---|---|---|---|---|---|---|
| N+1 | [UC###-###.md](path) | UC###-###.X, [Tên trường], row ### | **[TAG]** [Mô tả] | "[nội dung cũ]" | "[nội dung đề xuất]" | Cần xác nhận / Cần sửa |

---

## 3. Tổng hợp

| Loại Issue | Số lượng |
|---|---|
| CMR_CONFLICT | N |
| CROSS_UC_CONFLICT | N |
| INTRA_DOC_CONFLICT | N |
| NO_DEFECT (OK) | N |
| **Tổng cần xử lý** | **N** |
| **Tổng OK** | **N** |

---

## 4. Priority Actions

### P1 - Cần sửa ngay (CMR alignment):
1. **UC###-###:** [Mô tả action]
2. **UC###-###:** [Mô tả action]

### P2 - Cần xác nhận:
3. **UC###-###:** [Mô tả action]

### P3 - Khuyến nghị:
4. **UC###-###:** [Mô tả action]

---

## N. CMR vX.X Key Rules Reference

| CMR | Rule chính | Ảnh hưởng |
|-----|-----------|-----------|
| CMR_XX | [Mô tả] | [Mô tả ảnh hưởng] |
| CMR_YY | [Mô tả] | [Mô tả ảnh hưởng] |

---

*Document generated by Global Impact Analyzer*
```

**Giải thích cấu trúc:**

| Section                              | Mục đích                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| **1. Tổng quan phân tích**  | Liệt kê các CMR thay đổi chính liên quan đến findings                        |
| **2. Chi tiết Impact**        | Mỗi UC group có subsection riêng (### 2.1, 2.2...), bảng 7 cột với số thứ tự |
| **3. Tổng hợp**              | Bảng đếm số lượng theo loại issue + tổng OK/cần xử lý                      |
| **4. Priority Actions**        | Phân loại P1/P2/P3, mỗi action ghi rõ UC và nội dung cần sửa                  |
| **N. CMR Key Rules Reference** | Bảng tra cứu nhanh các CMR rules liên quan                                        |

---

**4. Nhãn lỗi hợp lệ (trong cột "Lỗi"):**

| Tag                            | Ý nghĩa                                                                  |
| ------------------------------ | -------------------------------------------------------------------------- |
| `[CMR_CONFLICT]`             | Vi phạm quy chuẩn CMR                                                    |
| `[CROSS_UC_CONFLICT]`        | Lệch cấu trúc / kiểu trường giữa các UC                            |
| `[CROSS_UC_PARITY_CONFLICT]` | Lệch giá trị cụ thể (số, text, placeholder, error msg) giữa các UC |
| `[INTRA_DOC_CONFLICT]`       | Mâu thuẫn nội bộ trong cùng 1 file (Body vs AC vs Changelog)          |
| `[NO_DEFECT]`                | Đã kiểm tra, không có lỗi — dùng làm bằng chứng đã quét      |

---

**5. Giá trị Cột Trạng thái Hợp lệ (BẮT BUỘC):**

> ⚠️ **QUAN TRỌNG:** Cột `Trạng thái` trong bảng Impact Matrix PHẢI sử dụng đúng các giá trị sau. KHÔNG được dùng giá trị khác vì Executor sẽ không hiểu.

| Trạng thái          | Ý nghĩa                                                              | Executor xử lý                                                  |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `Need to fix`       | Cần sửa — vi phạm đã xác định rõ ràng                       | ✅ Sửa theo Current→Target                                      |
| `Need confirmation` | Cần xác nhận từ BA trước khi sửa                                | ❌ Chờ BA confirm → đổi sang `Confirmed` hoặc `Rejected` |
| `Confirmed`         | BA đã xác nhận — sẵn sàng sửa                                  | ✅ Sửa theo Current→Target                                      |
| `OK`                | Không có lỗi                                                        | ❌ Bỏ qua                                                        |
| `Ignored`           | Bỏ qua — có lỗi nhưng không áp dụng (VD: intentional override) | ❌ Bỏ qua                                                        |
| `Rejected`          | Từ chối — không phải lỗi                                         | ❌ Bỏ qua                                                        |

**Các giá trị KHÔNG HỢP LỆ (cũ):**

- `Cần sửa` → đổi thành `Need to fix`
- `Cần xác nhận` → đổi thành `Need confirmation`
- `Pending` → đổi thành `Need to fix`

**Quy tắc đặt status:**

- Nếu lỗi đã xác định rõ ràng (không có mâu thuẫn về nguồn chân lý) → `Need to fix`
- Nếu là **CMR_CONFLICT** (SRS ≠ CMR) → `Need confirmation` — **BA phải quyết định** giữ SRSDOC và CMR, không được tự ý chọn
- Nếu là **CROSS_UC_CONFLICT** (UC ≠ UC) → `Need confirmation` — BA phải quyết định UC nào là chuẩn
- Nếu lỗi đã xác nhận bởi BA → `Confirmed`
- Nếu không phải lỗi (NO_DEFECT) → `OK`

**⚠️ Lưu ý quan trọng về CMR_CONFLICT:**

- Khi SRS quy định khác CMR (VD: SRS nói "Luôn Enabled", CMR nói "Disabled theo trạng thái"), Analyzer phải đặt `Need confirmation` — không được đặt `Need to fix`
- Trong mô tả lỗi phải ghi rõ: `(SRS quy định: [text hiện tại])` và `(CMR quy định: [text CMR])`
- Trong Target Text phải show cả 2 phương án: `[Phương án A: theo SRS]` / `[Phương án B: theo CMR]`

**⚠️ Lưu ý về mô tả Conflict:**

- Khi có mâu thuẫn Cross-UC hoặc SRS≠CMR, phải ghi rõ giá trị HIỆN TẠI của TỪNG bên
- Ví dụ: `UC215-220 quy định "Luôn Enabled" (SRS)` vs `CMR_03 quy định "Disabled theo trạng thái"`

---

**6. Luồng Chuyển Trạng thái (State Transition)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRẠNG THÁI IMPACT MATRIX                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       Analyzer phát hiện      │
              └───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐   ┌─────────────────┐   ┌─────────┐
   │Need to fix  │   │Need confirmation│   │   OK    │
   └─────────────┘   └─────────────────┘   └─────────┘
          │                   │                   │
          │                   │ (BA quyết định)   │
          │                   ▼                   │
          │           ┌───────────────┐            │
          │           │               │            │
          │      ┌────┴────┐    ┌─────┴────┐       │
          │      │Confirmed│    │Rejected │       │
          │      └────┬────┘    └─────────┘       │
          │           │                             │
          │           ▼                             │
          │    Executor sửa ──→ [DONE]             │
          │                                    (end)
```

**Quy tắc chuyển trạng thái:**

| Từ                   | Sang                  | Điều kiện                     | Ai thực hiện |
| --------------------- | --------------------- | -------------------------------- | -------------- |
| *(khởi tạo)*      | `Need to fix`       | Lỗi rõ ràng, đã xác định | Analyzer       |
| *(khởi tạo)*      | `Need confirmation` | Cần BA quyết định            | Analyzer       |
| *(khởi tạo)*      | `OK`                | Không có lỗi (NO_DEFECT)      | Analyzer       |
| `Need confirmation` | `Confirmed`         | BA xác nhận cần sửa          | BA             |
| `Need confirmation` | `Rejected`          | BA từ chối - không phải lỗi | BA             |
| `Need to fix`       | `[DONE]`            | Executor đã sửa xong file     | Executor       |
| `Confirmed`         | `[DONE]`            | Executor đã sửa xong file     | Executor       |

**Lưu ý quan trọng:**

- `[DONE]` là trạng thái CUỐI CÙNG - không chuyển tiếp nữa
- `OK` là trạng thái ĐỘC LẬP - không chuyển sang trạng thái khác
- `Rejected` là trạng thái CUỐI - không làm gì thêm
- `Ignored` có thể đặt bởi Analyzer hoặc BA - cũng là trạng thái cuối

---

**7. Bảng Self-Audit (bổ sung nếu cần):**

Nếu cần bổ sung bằng chứng tự kiểm tra, thêm SECTION riêng sau cùng:

```markdown
## SELF-AUDIT EVIDENCE TABLE

| # | Mục kiểm tra | Chi tiết | Kết quả | Ghi chú |
|---|---|---|---|---|
| SA-01 | File coverage | Đã quét: N/N files | ✅ | |
```

**Quy tắc:** Nếu BẤT KỲ mục SA nào là ❌ → PHẢI quay lại quét bổ sung trước khi tuyên bố hoàn tất.
