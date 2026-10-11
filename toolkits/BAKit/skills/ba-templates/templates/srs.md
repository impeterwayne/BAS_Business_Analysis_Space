# Đặc tả Yêu cầu Phần mềm (Software Requirements Specification) — {Tên dự án}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Dự án (Project) | {project-name} |
| Loại dự án (Project type) | {web-frontend / api-backend / fullstack-web / mobile} |
| Nền tảng (Platform) | {Android / iOS / Android + iOS / Web — chỉ nền tảng đã xác nhận} |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Cập nhật lần cuối (Last updated) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |
| Trạng thái (Status) | Draft / Ready for SRS Audit / Blocked by P0 / Audited |
| Nguồn (Sources) | {Product Decision Summary, feature brief, Feature Checklist, APK evidence, Figma analysis — đường dẫn cụ thể} |

> SRS chính (master SRS) tóm tắt scope, business rule chung, sơ đồ và ma trận truy vết. Chi tiết từng use case — kể cả UI Specification và các flow — nằm trong file use case riêng và được liên kết từ đây. Chỉ tham chiếu Figma frame, evidence và file có thật.

## 1. Tổng quan sản phẩm (Product Overview)

- **Mục tiêu (Purpose):** {Mục tiêu sản phẩm}
- **Người dùng mục tiêu (Target users):** {Nhóm người dùng đã xác nhận}
- **Nền tảng hỗ trợ (Supported platforms):** {Nền tảng đã xác nhận}
- **Mục tiêu chính / Ràng buộc (Key objectives / Constraints):** {Chỉ các thông tin đã được duyệt}
- **Ứng dụng tham chiếu (Reference apps):** {Nếu có — tham chiếu không có nghĩa là sản phẩm của chúng ta áp dụng}

## 2. Phạm vi (Scope)

### 2.1 Trong phạm vi (In Scope)

- {Nhóm tính năng / tính năng đã duyệt — kèm `PD-{NNN}` hoặc brief}

### 2.2 Ngoài phạm vi (Out of Scope)

- {Tính năng bị loại bỏ (`REMOVE`) hoặc loại trừ rõ ràng — kèm `PD-{NNN}`}

### 2.3 Phạm vi chưa xác định / Ràng buộc (Unresolved Scope / Constraints)

- {`TBD`, phụ thuộc phạm vi quan trọng, giới hạn đã biết — kèm Open Question `Q-{NNN}`}

## 3. Tổng quan tính năng & Ma trận truy vết (Feature Overview & Traceability Matrix)

**Feature Checklist:** `{docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v{N}.md}`

| Nhóm tính năng (Feature group) | Tính năng / Tính năng nhỏ (Feature / Sub-feature) | FR ID | Use case | Màn hình (Screens) | Business rule | Sơ đồ (Diagrams) | Quyết định (Decision) | Trạng thái phạm vi (Scope status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {Nhóm} | {Tính năng} | FR-{MOD}-{NNN} | [UC-{MOD}-{NNN}](usecases/{module}/uc-{module}-{nnn}-{slug}.md) | {Mã / tên màn hình} | BR-{NNN} | UF-{MOD}-{NNN}, ACT-{MOD}-{NNN} | PD-{NNN} | In Scope / TBD |

> Mỗi tính năng in scope đã xác nhận phải map tới ít nhất một FR / use case, hoặc một requirement / business rule dùng chung được nêu rõ. Không ép một use case cho mỗi màn hình — nhóm theo mục tiêu của người dùng.

## 4. Quy tắc nghiệp vụ chung (Global Business Rules)

| Rule ID | Điều kiện kích hoạt (Trigger / Condition) | Quy tắc (Target rule) | Áp dụng cho (Applies to) | Nguồn (Source) |
| :--- | :--- | :--- | :--- | :--- |
| BR-{NNN} | {Khi / nếu} | {Hành vi đã duyệt, kiểm thử được} | {Tính năng / UC} | {PD-{NNN} / BR-CAND-{NN} / mục tài liệu} |

Giữ business rule dùng chung ở đây và tham chiếu từ use case, không chép lại.

## 5. Sơ đồ User Flow (User Flow Diagrams) — Bắt buộc

Các journey chính in scope phải có User Flow có thể chỉnh sửa, thể hiện điểm vào, hành động người dùng, màn hình đích, điều hướng và điểm thoát.

| Diagram ID | Nhóm tính năng / Journey (Feature group / Journey) | Mermaid source | Use case liên quan (Related use cases) |
| :--- | :--- | :--- | :--- |
| UF-{MOD}-{NNN} | {Journey} | [UF-{MOD}-{NNN}](diagrams/{module}/uf-{mod}-{nnn}.md) | UC-{MOD}-{NNN}, UC-{MOD}-{NNN} |

> Dùng Mermaid `flowchart TD` cho điều hướng màn hình. User Flow không thay thế Activity Diagram.

## 6. Yêu cầu chức năng & Use case (Functional Requirements & Use Cases)

### 6.1 {Tên phân hệ / Nhóm tính năng (Module / Feature group)}

**Mô tả (Description):** {Phạm vi ngắn của phân hệ}

| FR ID | Yêu cầu (Requirement) | Độ ưu tiên (Priority) | Trạng thái (Status) | Use case | Nguồn (Source) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-{MOD}-{NNN} | {Yêu cầu chức năng rõ ràng, kiểm thử được} | Critical / High / Medium / Low | Draft | [UC-{MOD}-{NNN}](usecases/{module}/uc-{module}-{nnn}-{slug}.md) | {PD-{NNN} / FR-CAND-{NNN} / FR-DSN-{NNN} / mục tài liệu} |

**Danh mục use case (Use case index):** `docs/usecases/{module}/` — mỗi file chứa UI Specification, Main / Alternative / Exception Flows, Business Rules, Navigation / Result và Open Questions.

**Activity Diagram — Bắt buộc cho quy trình cốt lõi (Required for core processes):**

| Diagram ID | Quy trình (Process) | Mermaid source | Use case được bao phủ (Use cases covered) |
| :--- | :--- | :--- | :--- |
| ACT-{MOD}-{NNN} | {Quy trình nghiệp vụ / logic rẽ nhánh cốt lõi} | [ACT-{MOD}-{NNN}](diagrams/{module}/act-{mod}-{nnn}.md) | UC-{MOD}-{NNN} |

> Một Activity Diagram dùng chung có thể bao phủ nhiều use case đơn giản liên quan. Quy trình phức tạp độc lập có sơ đồ riêng; không vẽ sơ đồ cho mỗi màn hình.

**Sequence Diagram — Chỉ khi độ phức tạp cần (Only if warranted):**

| Diagram ID | Tương tác (Interaction) | Mermaid source | Use case liên quan (Related use case) |
| :--- | :--- | :--- | :--- |
| SEQ-{MOD}-{NNN} | {Tương tác nhiều thành phần đã xác minh} | [SEQ-{MOD}-{NNN}](diagrams/{module}/seq-{mod}-{nnn}.md) | UC-{MOD}-{NNN} |

> Bỏ bảng Sequence Diagram khi không cần. Không bịa API, tương tác SDK, participant hay kiến trúc.

<!-- Lặp lại mục 6.x cho mỗi nhóm tính năng in scope. -->

## 7. Permission — Nếu áp dụng (Permissions — If Applicable)

| Permission | Thời điểm yêu cầu (Trigger) | Mục đích (Purpose) | Hành vi khi cấp / từ chối (Granted / Denied behavior) | Use case liên quan (Related UC) |
| :--- | :--- | :--- | :--- | :--- |
| {Permission} | {Khi nào yêu cầu} | {Mục đích đã duyệt} | {Kết quả đã duyệt} | UC-{MOD}-{NNN} |

> Bỏ mục này nếu sản phẩm không có permission được xác nhận (ghi một dòng lý do). Không tự chép cách xử lý permission của ứng dụng tham chiếu.

## 8. Quy tắc Ads / IAP — Nếu áp dụng (Ads / IAP Rules — If Applicable)

| Hạng mục (Monetization item) | Thời điểm kích hoạt (Trigger) | Hành vi mục tiêu (Target behavior) | UC / Rule liên quan (Related UC / Rule) | Nguồn (Source) |
| :--- | :--- | :--- | :--- | :--- |
| {Loại Ads hoặc IAP} | {Trigger đã xác nhận} | {Rule đã xác nhận} | {UC / BR} | PD-{NNN} |

> **Chỉ** đưa vào khi Ads / IAP được một quyết định xác nhận thuộc target scope. Nếu không có hoặc không áp dụng, **bỏ cả mục** và ghi một dòng lý do. Không suy ra monetization từ ứng dụng tham chiếu; không bịa vị trí ads, paywall, gói subscription, giá hay giới hạn credit. Nếu ứng dụng tham chiếu có monetization mà việc áp dụng chưa rõ, tạo Open Question.

## 9. Yêu cầu phi chức năng — Nếu áp dụng (Non-Functional Requirements — If Applicable)

| Nhóm (Category) | Yêu cầu (Requirement) | Mục tiêu / Ràng buộc (Target / Constraint) | Nguồn / Trạng thái (Source / Status) |
| :--- | :--- | :--- | :--- |
| {Hiệu năng (Performance) / Bảo mật (Security) / Độ tin cậy (Reliability) / Tương thích (Compatibility) / Xử lý dữ liệu (Data handling)} | {Yêu cầu} | {Mục tiêu đo được đã duyệt, nếu có} | {Nguồn} |

> Không bịa ngưỡng hiệu năng, SLA hay quy tắc tương thích nền tảng.

## 10. Phụ thuộc — Nếu áp dụng (Dependencies — If Applicable)

| Phụ thuộc (Dependency) | Mục đích (Purpose) | Nguồn xác nhận (Confirmed source) | Ảnh hưởng / Requirement liên quan (Impact / Related requirement) |
| :--- | :--- | :--- | :--- |
| {API, SDK, design asset, permission, dịch vụ bên ngoài} | {Mục đích} | {Nguồn thực tế} | {FR / UC bị ảnh hưởng} |

<!-- SECTION: api-backend, fullstack-web -->
## 11. Hợp đồng API — Nếu áp dụng (API Contracts — If Applicable)

### {Tên endpoint}

- **Phương thức (Method):** GET / POST / PUT / DELETE
- **Đường dẫn (Path):** `/api/v1/{resource}`
- **Xác thực (Auth):** Required / Public
- **Request:** `{schema}`
- **Response:** `{schema}`
- **Mã lỗi (Error codes):** {chỉ các mã đã xác nhận}
- **Use case liên quan (Related UC):** UC-{MOD}-{NNN}

> Chỉ ghi contract đã được xác nhận trong nguồn. Contract chưa biết mà cần thiết → Open Question.
<!-- END SECTION -->

## 12. Câu hỏi mở (Open Questions)

| ID | Tính năng / Chủ đề (Feature / Topic) | Khoảng trống quyết định (Decision gap) | Ưu tiên (Priority) | Owner | Trạng thái / Ảnh hưởng (Status / Impact) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Q-{NNN} | {Chủ đề} | {Hành vi chưa được quyết định} | P0 / P1 / P2 | {Nếu biết} | Open / {Requirement bị ảnh hưởng} |

> `P0` còn mở nghĩa là SRS chưa sẵn sàng bàn giao Dev / QA.

## 13. Lịch sử thay đổi (Change Log)

| Phiên bản (Version) | Ngày (Date) | Tác giả (Author) | Thay đổi (Changes) | Nguồn / Quyết định (Source / Decision) |
| :--- | :--- | :--- | :--- | :--- |
| v1 | {YYYY-MM-DD} | {author} | Khởi tạo tài liệu | {Nguồn đã duyệt} |

## Danh sách kiểm tra độ phủ & Sẵn sàng audit (Coverage & Audit Readiness Checklist)

- [ ] Mọi tính năng in scope đã xác nhận map tới requirement và use case.
- [ ] Mọi màn hình / trạng thái hiển thị liên quan có UI Specification trong use case.
- [ ] Main, Alternative, Exception và Edge Flows áp dụng được đã được mô tả.
- [ ] Business rule rõ ràng, kiểm thử được và được tham chiếu nhất quán.
- [ ] Journey chính có User Flow.
- [ ] Quy trình cốt lõi có Activity Diagram; sơ đồ dùng chung đã được liên kết.
- [ ] Sequence Diagram chỉ có khi cần và dựa trên evidence.
- [ ] Figma, Product Decisions, use case, rule và sơ đồ không mâu thuẫn.
- [ ] Ads / IAP / Permission / NFR chỉ có khi áp dụng và có nguồn.
- [ ] Open Questions rõ ràng; không có `P0` bị bỏ qua.
- [ ] Change Log và các liên kết đã cập nhật.

**Trạng thái (Status):** Draft / Ready for SRS Audit / Blocked by P0 / Audited

> Chỉ `BA-audit-SRS` xác nhận độ sẵn sàng audit cuối cùng. Ready for audit không có nghĩa là đã duyệt để phát triển.
