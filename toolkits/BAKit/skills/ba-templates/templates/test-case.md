# Test Cases: UC-{MODULE}-{NNN} — {Tên Use Case (UC title)}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Use Case liên quan (Related UC) | `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md` |
| Phân hệ (Module) | {module-name} |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Cập nhật lần cuối (Last updated) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |

## TC-{MODULE}-{NNN}-01: {Kịch bản luồng chính (Happy path)}

- **Loại (Type):** Positive
- **Độ ưu tiên (Priority):** Critical / High / Medium / Low
- **Phương thức (Method):** API / UI / CLI
- **Tiền điều kiện (Precondition):**
  - {Trạng thái cụ thể, ví dụ: "Tài khoản `testuser@example.com` tồn tại với vai trò `admin`"}
  - {Tham chiếu tài khoản trong test-config.md nếu có}
- **Dữ liệu kiểm thử (Test data):**
  - {Giá trị đầu vào cụ thể, ví dụ: `email: "new@example.com"`}
- **Các bước (Steps):**
  1. {Hành động cụ thể}
  2. {Hành động tiếp theo}
- **Kết quả mong đợi (Expected result):**
  - {Kết quả kiểm chứng được, thông báo giữ nguyên văn kèm tiếng Anh trong ngoặc}
- **Kết quả thực tế (Actual result):** __{điền khi thực thi}__
- **Trạng thái (Status):** Pending / Pass / Fail / Blocked

## TC-{MODULE}-{NNN}-02: {Kịch bản âm (Negative)}

- **Loại (Type):** Negative
- **Độ ưu tiên (Priority):** High
- **Phương thức (Method):** API / UI / CLI
- **Tiền điều kiện (Precondition):**
  - {Trạng thái thiết lập}
- **Dữ liệu kiểm thử (Test data):**
  - {Giá trị không hợp lệ, ví dụ: `email: "not-an-email"`, `password: ""`}
- **Các bước (Steps):**
  1. {Hành động với dữ liệu không hợp lệ}
- **Kết quả mong đợi (Expected result):**
  - {Lỗi cụ thể}
- **Kết quả thực tế (Actual result):** __{điền khi thực thi}__
- **Trạng thái (Status):** Pending / Pass / Fail / Blocked

## TC-{MODULE}-{NNN}-03: {Kịch bản biên (Edge)}

- **Loại (Type):** Edge
- **Độ ưu tiên (Priority):** Medium
- **Phương thức (Method):** API / UI / CLI
- **Tiền điều kiện (Precondition):**
  - {Trạng thái thiết lập}
- **Dữ liệu kiểm thử (Test data):**
  - {Giá trị biên, ví dụ: `name: ""` (rỗng), độ dài tối đa + 1}
- **Các bước (Steps):**
  1. {Hành động biên}
- **Kết quả mong đợi (Expected result):**
  - {Kết quả cụ thể}
- **Kết quả thực tế (Actual result):** __{điền khi thực thi}__
- **Trạng thái (Status):** Pending / Pass / Fail / Blocked

## TC-{MODULE}-{NNN}-04: {Kịch bản bảo mật (Security)}

- **Loại (Type):** Security
- **Độ ưu tiên (Priority):** High
- **Phương thức (Method):** API / UI / CLI
- **Tiền điều kiện (Precondition):**
  - {Ví dụ: "Đăng nhập với vai trò người dùng thường (xem test-config.md)"}
- **Dữ liệu kiểm thử (Test data):**
  - {Payload kiểm thử bảo mật, ví dụ: `id: "uuid-của-người-dùng-khác"`}
- **Các bước (Steps):**
  1. {Hành động kiểm thử bảo mật}
- **Kết quả mong đợi (Expected result):**
  - {Cơ chế bảo vệ, ví dụ: "403 Forbidden, không lộ dữ liệu người dùng khác"}
- **Kết quả thực tế (Actual result):** __{điền khi thực thi}__
- **Trạng thái (Status):** Pending / Pass / Fail / Blocked
