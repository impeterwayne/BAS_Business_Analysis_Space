# BA Project Configuration

Fill this in per project so BAs, QAs and the BAKit agents share the same context. Agents read it before
writing any deliverable. Never store passwords, OTPs or API tokens here.

| Field | Value |
| :--- | :--- |
| Project | [Tên dự án thực tế] |
| App slug (`{app}`) | [ten-app-viet-thuong-gach-ngang, ví dụ: photo-editor] |
| Project type | [mobile / web-frontend / api-backend / fullstack-web] |
| Deliverable language | Vietnamese |
| Communication language | Vietnamese |
| Created | [YYYY-MM-DD] |
| Author | [Tên] |
| Version | v1 |

## 1. Project Overview

> **Description:** [Bối cảnh dự án, ví dụ: ứng dụng chỉnh sửa ảnh, ví điện tử, nền tảng thương mại điện tử]
> **Domain:** [Photo & Video / Utility / E-commerce / Finance / …]
> **Target audience:** [Người dùng cá nhân / Người dùng nội bộ / Đối tác B2B]

## 2. Links & Resources

| Resource | URL | Note / Access |
| :--- | :--- | :--- |
| Task board (Plane / Jira) | `https://…` | Sprint tracking |
| Confluence / Wiki | `https://…` | PRD, architecture, API specs |
| Figma | `https://figma.com/design/…` | Design mockups, design system (`/ba-figma` default link) |
| Firebase | `https://console.firebase.google.com/project/…` | Analytics, Crashlytics, Remote Config |
| Git repo | `https://…` | Source code |
| API docs | `https://…` | Swagger / Postman |

## 3. Environments

| Environment | URL | Purpose |
| :--- | :--- | :--- |
| DEV | `https://dev…` | Development |
| QA / Staging | `https://qa…` | QA and UAT |
| PROD | `https://…` | Live system |

## 4. Account Types (no passwords)

| Account type | Username format | Role | How to obtain the password |
| :--- | :--- | :--- | :--- |
| Admin | `admin_qa@…` | Full access | Password vault |
| Standard user | `user_*@…` | Customer | Password vault |

## 5. Competitor Apps

Used by `competitor-app-analysis` / `/ba-competitor`. One row per app to benchmark.

| App | Package | Platform | Flows of interest | Account to use | Decoded source | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [Tên app] | `com.example.app` | Android | onboarding, login, [luồng chính] | guest / test account from [owner] | `[…\com.example.app\jadx_src]` or none | [ví dụ: cần OTP, giới hạn vùng] |

**Decoded source** is the ReaKit jadx output for the app (BA Space → Competitor → Decode). With it,
`/ba-competitor` reads the code with parallel `code-scout` agents before touching the device.

**Device:** [serial from `adb devices`, only needed when several devices are attached]

## 6. Output Locations

| Deliverable | Single-File Mobile SRS Layout (`docs/ba/`) | Modular / Multi-Agent Layout (`docs/BA/`) |
| :--- | :--- | :--- |
| APK Evidence / Competitor analysis & feature extraction | `docs/inputs/apk/` | `docs/BA/competitor/[app-slug]/` |
| Design images / Figma analysis | `docs/inputs/design/` | `docs/BA/figma/[feature-slug]/` |
| Research notes | `docs/inputs/research/` | `docs/BA/research/` |
| Target Product Feature Checklist (`/ba-checklist`) | `docs/ba/feature-checklist/{app}_feature-checklist_v{N}.md` | `docs/BA/checklist/[slug]_checklist_*.md` |
| Batch Rule Confirmation / Decisions | `docs/ba/product-decisions/{app}_rule-confirmation_v{N}.md` | `docs/BA/decisions/[feature-slug]_decisions_*.md` |
| Feature briefs | `docs/BA/briefs/` | `docs/BA/briefs/` |
| User stories | `docs/BA/stories/` | `docs/BA/stories/` |
| SRS | `docs/ba/srs/{app}_srs_v{N}.md` (inline UCs & diagrams) | `docs/project-srs.md` + `docs/usecases/[module]/` + `docs/diagrams/[module]/` |
| Word SRS for Testers (`.docx`) | `docs/ba/srs-word/{app}_srs_v{N}.docx` | `docs/ba/srs-word/{app}_srs_v{N}.docx` |
| SRS / UC Audit reports | `docs/ba/audit/{app}_srs-audit_v{N}.md` | `docs/BA/SRS-report/[UC-folder]/` |
| Test cases | `docs/qc/` or `docs/testcases/[module]/` | `docs/testcases/[module]/` |

## 7. Pipeline Settings

| Setting | Value |
| :--- | :--- |
| Auto-proceed between phases | Disabled (user controls) |
| Overwrite versioned files | Never (create a new version) |
| Mobile vs Web audit rules | mobile |
