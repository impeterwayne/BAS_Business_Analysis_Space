# Danh mục màn hình (Screen Inventory) — {Tên ứng dụng}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Ứng dụng (App) | {App name} · `{com.competitor.app}` · {version} |
| Thiết bị (Device) | {serial / model} |
| Ngày khảo sát (Captured) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |

## Tổng hợp (Summary)

| # | Màn hình (Screen) | Luồng (Flow) | Ảnh (Screenshot) | Cây UI (UI tree) |
| :--- | :--- | :--- | :--- | :--- |
| 01 | {Đăng nhập} | {login} | `screens/login-01-signin.png` | `screens/login-01-signin.tree.txt` |

## 01 — {Tên màn hình}

- **Mục đích (Purpose):** {một dòng}
- **Cách vào (Entry):** {từ màn hình nào, bằng hành động gì}
- **Package / Activity:** `{package}` / `{activity nếu có}`

**Thành phần (Elements):**

| Nhãn gốc (Original label) | Tiếng Anh (English) | Loại (Type) | resource-id | Ghi chú (Notes) |
| :--- | :--- | :--- | :--- | :--- |
| {Đăng nhập} | {Log in} | Button | `{id}` | {disabled cho đến khi nhập đủ} |

**Hành động (Actions):**

| Hành động (Action) | Kết quả (Result) |
| :--- | :--- |
| tap "{nhãn}" | → 02 / → lỗi / → đóng |

- **Quy tắc quan sát được (Observed rules):** {chỉ điều đã thấy xảy ra}
- **[Code]:** {quy tắc trong mã chưa thấy trên màn hình — `path:line`}
- **[Inferred]:** {gắn nhãn rõ ràng, tách khỏi quan sát}
- **Chưa rõ (Unresolved):** {điều còn mờ và cách xác nhận}
