# UC-{MODULE}-{NNN}: {Tên Use Case (Title)}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Phân hệ / Nhóm tính năng (Module / Feature group) | {module-name} |
| Tính năng / Tính năng nhỏ (Feature / Sub-feature) | {feature-name} |
| Tác nhân chính (Primary actor) | {primary-actor} |
| Độ ưu tiên (Priority) | Critical / High / Medium / Low / TBD |
| Trạng thái (Status) | Draft / Review / Approved / Blocked / Deprecated |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Cập nhật lần cuối (Last updated) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |
| Yêu cầu liên quan (Related FR) | FR-{MOD}-{NNN} |
| Màn hình liên quan (Related screens) | {Mã màn hình — tên màn hình} |

## 1. Mô tả (Description)

{1–2 câu: tác nhân đạt được mục tiêu gì qua use case này.}

- **Điểm kích hoạt / Điểm vào (Trigger / Entry point):** {Hành động người dùng hoặc sự kiện cụ thể}

## 2. Tiền điều kiện (Preconditions)

- {Điều kiện phải đúng trước khi bắt đầu}

## 3. Hậu điều kiện (Postconditions)

- **Thành công (Success):** {Kết quả và trạng thái dữ liệu sau khi thành công}
- **Thất bại / Hủy (Failure / Cancel):** {Trạng thái sau khi lỗi hoặc hủy, nếu liên quan}

<!-- SECTION: web-frontend, fullstack-web, mobile -->
## 4. Đặc tả giao diện (UI Specification)

> Lặp lại mục con dưới đây cho mỗi màn hình mục tiêu trong use case này. **UI Specification phải đứng trước Main Flow.** Không bịa link Figma frame, đường dẫn screenshot hay trạng thái màn hình. Khi đã có ảnh màn hình export từ Figma (hoặc screenshot), **bắt buộc nhúng bằng cú pháp ảnh Markdown `![...](...)` với đường dẫn tương đối từ file use case** để hiển thị preview trực tiếp — không chỉ ghi đường dẫn rút gọn hay bọc trong dấu backtick `` `...` `` không có preview.

### 4.1 {Mã màn hình (Screen ID)} — {Tên màn hình (Screen name)}

- **Mục đích (Purpose):** {Vai trò của màn hình trong use case này}
- **Figma frame:** [{Tên frame / node-id}]({https://www.figma.com/design/…?node-id=…}) hoặc Design Pending
- **Vào từ (Entry from):** {Hành động / màn hình trước}
- **Ảnh tham chiếu (Reference image):** (hoặc ghi `Design Pending` nếu chưa có thiết kế)

![{Mã màn hình} — {Tên màn hình}](../../BA/figma/{feature}/screens/{NN}-{slug}.png)

| UI ID | Thành phần (Component) | Hiển thị / Nội dung (Display / Content) | Tương tác & Phản hồi hệ thống (Interaction & System response) | Hiển thị / Trạng thái / Kiểm tra hợp lệ (Visibility / State / Validation) |
| :--- | :--- | :--- | :--- | :--- |
| UI-01 | {Button} | "{Nhãn gốc}" ({English}) | {Hành động → phản hồi} | {Enabled / disabled và điều kiện hiển thị} |
| UI-02 | {Field} | {Placeholder / giá trị mặc định nếu đã duyệt} | {Hành vi nhập} | {Định dạng / giới hạn / lỗi nếu đã duyệt} |

**Trạng thái giao diện (UI states):** {Default / Loading / Empty / Success / Error / Disabled / Permission — chỉ khi áp dụng và có nguồn; nếu trạng thái có ảnh export riêng thì nhúng `![{Mã màn hình} — {Trạng thái}](../../BA/figma/{feature}/screens/{NN}-{slug}-{state}.png)`}

**Popup / Dialog / Bottom sheet:** {Trigger, nội dung, hành động và cách đóng — nếu áp dụng}

**Khoảng trống thiết kế (Design gaps):** {Màn hình / frame / trạng thái chưa có thiết kế → Open Question liên quan}

### 4.2 {Màn hình khác, nếu có (Another screen)}

{Lặp lại UI Specification với evidence thiết kế thực tế và ảnh tham chiếu nhúng bằng `![...](...)`.}
<!-- END SECTION -->

## 5. Luồng chính (Main Flow)

| Bước (Step) | Hành động người dùng (User action) | Phản hồi hệ thống (System response) | Màn hình / Trạng thái (Screen / State) |
| :--- | :--- | :--- | :--- |
| 1 | {Hành động} | {Hành vi hệ thống đã xác nhận} | {Màn hình / trạng thái} |
| 2 | {Hành động tiếp theo} | {Phản hồi / kết quả} | {Màn hình / trạng thái} |

## 6. Luồng thay thế (Alternative Flows)

| ID | Điểm rẽ nhánh / Điều kiện (Branch point / Trigger) | Hành động / Hành vi thay thế (Alternative behavior) | Quay lại / Kết quả (Return / Result) |
| :--- | :--- | :--- | :--- |
| AF-01 | {Bước N của Main Flow + điều kiện} | {Hành vi} | {Quay lại bước M / Kết thúc} |

## 7. Luồng ngoại lệ / Lỗi / Edge case (Exception / Error / Edge Cases)

| ID | Điểm rẽ nhánh / Điều kiện (Branch point / Condition) | Hành vi hệ thống (System behavior) | Khôi phục / Trạng thái cuối (Recovery / Final state) |
| :--- | :--- | :--- | :--- |
| EF-01 | {Bước N + điều kiện lỗi đã xác nhận} | {Thông báo — giữ nguyên văn, kèm tiếng Anh trong ngoặc} | {Retry / hủy / kết thúc} |

> Xem xét khi áp dụng: permission bị từ chối, dữ liệu rỗng / không hợp lệ, lỗi mạng, timeout, thao tác bị gián đoạn, chạm lặp, thay đổi chưa lưu, retry, back / đóng / hủy. **Không bịa cách xử lý; hành vi chưa được quyết định → Open Question.**

## 8. Quy tắc nghiệp vụ (Business Rules)

| Rule ID | Điều kiện kích hoạt (Trigger / Condition) | Hành vi bắt buộc (Required behavior) | Áp dụng cho (Applies to) | Nguồn (Source) |
| :--- | :--- | :--- | :--- | :--- |
| BR-{NNN} | {Khi / nếu} | {Rule kiểm thử được — default / giới hạn / chuyển trạng thái chỉ khi đã duyệt} | {UI / flow / tính năng} | {PD-{NNN} / BR-CAND-{NN} / SRS §4} |

## 9. Điều hướng / Kết quả (Navigation / Result)

| Kịch bản (Scenario) | Đích / Kết quả (Destination / Result) | Lưu trữ dữ liệu / Trạng thái (Data / State persistence) |
| :--- | :--- | :--- |
| Thành công (Success) | {Màn hình / kết quả} | {Hành vi lưu / cập nhật} |
| Thất bại (Failure) | {Màn hình / kết quả} | {Hành vi dữ liệu} |
| Back / Đóng / Hủy (Back / Close / Cancel) | {Màn hình / kết quả} | {Hành vi dữ liệu} |

## 10. Tiêu chí chấp nhận (Acceptance Criteria)

| ID | Given (Cho trước) | When (Khi) | Then (Thì) |
| :--- | :--- | :--- | :--- |
| AC-01 | {bối cảnh} | {hành động} | {kết quả kiểm chứng được} |

## 11. Sơ đồ liên quan (Related Diagrams)

| Loại sơ đồ (Diagram type) | ID / Link | Phạm vi bao phủ (Coverage) |
| :--- | :--- | :--- |
| User Flow (bắt buộc) | [UF-{MOD}-{NNN}](../../diagrams/{module}/uf-{mod}-{nnn}.md) | {Journey chính — dùng chung hoặc riêng} |
| Activity Diagram (bắt buộc) | [ACT-{MOD}-{NNN}](../../diagrams/{module}/act-{mod}-{nnn}.md) | {Quy trình cốt lõi — dùng chung hoặc riêng} |
| Sequence Diagram (nếu phức tạp) | [SEQ-{MOD}-{NNN}](../../diagrams/{module}/seq-{mod}-{nnn}.md) hoặc N/A | {Tương tác nhiều thành phần đã xác minh} |

> Giữ mỗi sơ đồ đơn giản (**tối đa 8–12 node / block**, nhãn ngắn gọn); nếu luồng phức tạp hoặc có nhiều nhánh phụ / lỗi thì **tách thành nhiều sơ đồ nhỏ** (trong cùng file theo mục `###` hoặc tách nhiều mã `UF-*` / `ACT-*`) để dễ xem. Một sơ đồ đơn giản có thể dùng chung cho các use case nhỏ liên quan.

## 12. Câu hỏi mở (Open Questions)

| ID | Câu hỏi / Khoảng trống (Question / Gap) | Ảnh hưởng (Impact) | Ưu tiên (Priority) | Trạng thái / Owner (Status / Owner) |
| :--- | :--- | :--- | :--- | :--- |
| Q-01 | {Điều còn chưa biết} | {Rule / flow bị ảnh hưởng} | P0 / P1 / P2 | Open / {Owner nếu biết} |

## 13. Evidence / Tham chiếu (Evidence / References)

- **Product Decision:** `{docs/BA/decisions/{feature-slug}_decisions_{YYYYMMDD}_v{N}.md}` — {PD-{NNN}}
- **Feature Checklist:** `{docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v{N}.md}` — {dòng STT}
- **Figma analysis / Ảnh tham chiếu (Figma / Reference images):** `{docs/BA/figma/{feature}/…}`
- **APK evidence:** `{*_screens_* / *_flow-{flow}_* / screens/{flow}-{NN}-{slug}.png}` — {observed / [Code] / [Inferred]}
- **Nguồn đã duyệt khác (Other approved context):** {chỉ khi được cung cấp}

> **Hành vi của ứng dụng tham chiếu không mặc nhiên là hành vi mục tiêu.** Không ghi giá trị `TBD` như đã xác nhận, và không dùng phát biểu `[Inferred]` từ APK làm requirement.

## 14. Lịch sử thay đổi (Change Log)

| Phiên bản (Version) | Ngày (Date) | Tác giả (Author) | Thay đổi (Changes) |
| :--- | :--- | :--- | :--- |
| v1 | {YYYY-MM-DD} | {author} | Khởi tạo use case |
