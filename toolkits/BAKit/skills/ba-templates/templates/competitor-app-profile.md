# Hồ sơ ứng dụng đối thủ (Competitor App Profile) — {Tên ứng dụng}

| Thuộc tính (Attribute) | Giá trị (Value) |
| :--- | :--- |
| Ứng dụng (App) | {App name} |
| Package | `{com.competitor.app}` |
| Phiên bản ứng dụng (App version) | {versionName (versionCode)} |
| Thiết bị (Device) | {serial / model / Android version} |
| Tài khoản sử dụng (Account used) | {Khách / tài khoản test — không ghi mật khẩu} |
| Ngày khảo sát (Captured) | {YYYY-MM-DD} |
| Tác giả / Agent (Author) | {name / agent} |
| Phiên bản tài liệu (Version) | v1 |
| Thư mục bằng chứng (Evidence folder) | `docs/BA/competitor/{app-slug}/screens/` |
| Mã nguồn đã giải mã (Decoded source) | `{jadx_src path}` — chỉ mục: `code-index/_meta.md` / Không có (black-box) |

## 1. Tổng quan (Overview)

{2–4 câu: ứng dụng làm gì, cho ai. Chỉ ghi điều quan sát được hoặc có nguồn; suy luận phải gắn nhãn [Inferred].}

## 2. Phạm vi khảo sát (Survey Scope)

| Luồng (Flow) | Trạng thái (Status) | Tài liệu (Doc) | Ghi chú (Notes) |
| :--- | :--- | :--- | :--- |
| {Onboarding / Đăng nhập / …} | Đã khảo sát / Một phần / Bị chặn | `{app-slug}_flow-{slug}_{YYYYMMDD}_v1.md` | {bị chặn bởi OTP, paywall, …} |

## 3. Bản đồ tính năng (Feature Map)

| ID | Nhóm (Area) | Tính năng (Feature) | Mô tả quan sát (Observed description) | Bằng chứng (Evidence) |
| :--- | :--- | :--- | :--- | :--- |
| CF-001 | {Tài khoản} | {Đăng nhập bằng OTP} | {…} | `screens/login-02-otp.png` |

## 4. Điều hướng chính (Primary Navigation)

```mermaid
flowchart TD
    Home[Trang chủ] --> A[Tab A]
    Home --> B[Tab B]
```

## 5. Điểm mạnh (Strengths)

- {Điểm mạnh} — bằng chứng: `{screens/...png}`

## 6. Điểm yếu & Ma sát (Weaknesses & Friction)

- {Điểm yếu, số bước thừa, thông báo khó hiểu} — bằng chứng: `{screens/...png}`

## 7. Mô hình kinh doanh quan sát được (Observed Business Model)

{Miễn phí / Freemium / Phí giao dịch / Quảng cáo — chỉ ghi điều nhìn thấy trên màn hình.}

## 8. Ranh giới khảo sát (Survey Boundaries)

| Ranh giới (Boundary) | Lý do (Reason) | Cần gì để vượt qua (What would unblock it) |
| :--- | :--- | :--- |
| {Màn hình thanh toán} | {Hành động phá hủy / cần tài khoản thật} | {Tài khoản sandbox} |

## 9. Hồ sơ kỹ thuật (Tech Profile)

Chỉ khi có `code-index/`. Nguồn: `code-index/tech.md`, `code-index/endpoints.md`. Mọi dòng gắn nhãn [Code].

| Hạng mục (Item) | Giá trị (Value) | Nguồn (Source) |
| :--- | :--- | :--- |
| Nền tảng UI (UI framework) | {Native View / Compose / Flutter / React Native} | `code-index/tech.md` |
| Nhóm SDK (SDK categories) | {Analytics: AppsFlyer, Firebase; eKYC: …} | `code-index/tech.md` |
| Miền backend (Backend hosts) | {api.example.vn, …} | `code-index/endpoints.md` |

## 10. Tính năng chỉ thấy trong mã nguồn (Code-only Features)

Màn hình, cờ tính năng (feature flag) hoặc sự kiện có trong mã nhưng chưa quan sát được trên thiết bị: có thể bị ẩn,
giới hạn theo tài khoản/vùng, đang A/B test hoặc sắp ra mắt. Không phải năng lực đã quan sát.

| ID | Tính năng (Feature) | Dấu hiệu trong mã (Code signal) | Nguồn (Source) | Vì sao chưa thấy (Why not observed) |
| :--- | :--- | :--- | :--- | :--- |
| CC-001 | {Tab Đầu tư} | {InvestFragment + cờ `invest_tab_enabled`} | `{path:line}` | {Cờ tắt / cần KYC / chưa đi tới} |

## 11. Câu hỏi mở (Open Questions)

| ID | Câu hỏi (Question) | Bước tiếp theo để trả lời (Next step) |
| :--- | :--- | :--- |
| Q-01 | {câu hỏi} | {…} |
