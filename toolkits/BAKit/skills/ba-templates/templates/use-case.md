# UC-{MODULE}-{NNN}: {Tên Use Case (Title)}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Phân hệ (Module) | {module-name} |
| Tác nhân chính (Primary actor) | {primary-actor} |
| Độ ưu tiên (Priority) | Critical / High / Medium / Low |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Cập nhật lần cuối (Last updated) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |
| Yêu cầu liên quan (Related FR) | FR-{MOD}-{NNN} |

## Mô tả (Description)

{1–2 câu: tác nhân đạt được mục tiêu gì qua use case này.}

## Tiền điều kiện (Preconditions)

- {Điều kiện phải đúng trước khi bắt đầu}

## Luồng chính (Main Flow)

1. {Tác nhân thực hiện hành động}
2. {Hệ thống phản hồi}
3. {Tác nhân thực hiện hành động tiếp theo}

## Luồng thay thế (Alternative Flows)

### AF-1: {Tên luồng}

- Tại bước {N}, nếu {điều kiện}:
  1. {Bước thay thế}
  2. {Quay lại luồng chính tại bước M / Kết thúc}

## Luồng ngoại lệ (Exception Flows)

### EF-1: {Tên luồng}

- Tại bước {N}, nếu {điều kiện lỗi}:
  1. {Hệ thống hiển thị thông báo — giữ nguyên văn, kèm tiếng Anh trong ngoặc}
  2. {Hành động khôi phục}

## Hậu điều kiện (Postconditions)

- {Điều phải đúng sau khi hoàn tất thành công}

## Quy tắc nghiệp vụ (Business Rules)

- BR-{NNN}: {Quy tắc áp dụng trong use case này}

## Tiêu chí chấp nhận (Acceptance Criteria)

| ID | Given (Cho trước) | When (Khi) | Then (Thì) |
| :--- | :--- | :--- | :--- |
| AC-01 | {bối cảnh} | {hành động} | {kết quả kiểm chứng được} |

## Câu hỏi mở (Open Questions)

| ID | Câu hỏi (Question) | Ảnh hưởng (Impact) | Trạng thái (Status) |
| :--- | :--- | :--- | :--- |
| Q-01 | {câu hỏi} | {vì sao quan trọng} | Open |
