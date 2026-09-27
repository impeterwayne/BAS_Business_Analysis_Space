# So sánh tính năng & Phân tích khoảng trống (Feature Comparison & Gap Analysis) — {Chủ đề}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Sản phẩm của chúng ta (Our product) | {name} · {version / tài liệu tham chiếu} |
| Đối thủ (Competitors) | {App A (`pkg`, version)}, {App B (`pkg`, version)} |
| Ngày tạo (Created) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản (Version) | v1 |
| Nguồn (Sources) | `docs/BA/competitor/{app-slug}/…`, FSD của chúng ta mục … |

## 1. Ma trận tính năng (Feature Matrix)

Ký hiệu (Legend): ✅ Có (Present) · ⚡ Một phần (Partial) · ❌ Không có (Absent) · ❓ Chưa xác minh (Unverified)

| Nhóm (Area) | Tính năng (Feature) | Chúng ta (Ours) | {App A} | {App B} | Bằng chứng (Evidence) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| {Tài khoản} | {Đăng nhập sinh trắc học} | ❌ | ✅ | ⚡ | `{app-a}/screens/login-03.png` |

## 2. Khoảng trống & Cơ hội (Gaps & Opportunities)

| GAP-ID | Mô tả (Description) | Loại (Type) | Tác động (Impact) | Độ ưu tiên (MoSCoW) | Bằng chứng (Evidence) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GAP-001 | {Đối thủ có X, chúng ta chưa có} | Parity / Differentiator / Friction | High / Medium / Low | Must / Should / Could / Won't | `{…png}` |

## 3. Yêu cầu ứng viên (Candidate Requirements)

| ID | Yêu cầu ứng viên (Candidate requirement) | Từ GAP (From gap) | Ghi chú cho BA (Notes) |
| :--- | :--- | :--- | :--- |
| FR-CAND-001 | {Hệ thống cho phép …} | GAP-001 | {cần xác nhận với PO trước khi đưa vào FSD} |

## 4. Kết luận & Khuyến nghị (Conclusion & Recommendations)

1. {Khuyến nghị, kèm GAP-ID}

## 5. Hạn chế của phân tích (Limitations)

- {Chỉ khảo sát trên Android / phiên bản / tài khoản khách / luồng bị chặn}
