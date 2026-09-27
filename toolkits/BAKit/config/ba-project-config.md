# BA Project Configuration

Fill this in per project so BAs, QAs and the BAKit agents share the same context. Agents read it before
writing any deliverable. Never store passwords, OTPs or API tokens here.

| Field | Value |
| :--- | :--- |
| Project | [Tên dự án thực tế] |
| Project type | [web-frontend / api-backend / fullstack-web / mobile] |
| Deliverable language | Vietnamese |
| Communication language | Vietnamese |
| Created | [YYYY-MM-DD] |
| Author | [Tên] |
| Version | v1 |

## 1. Project Overview

> **Description:** [Bối cảnh dự án, ví dụ: ví điện tử, cổng dịch vụ công, nền tảng thương mại điện tử]
> **Domain:** [E-commerce / Finance / Government / Healthcare / …]
> **Target audience:** [Người dùng nội bộ / Khách hàng cá nhân / Đối tác B2B]

## 2. Links & Resources

| Resource | URL | Note / Access |
| :--- | :--- | :--- |
| Task board (Plane / Jira) | `https://…` | Sprint tracking |
| Confluence / Wiki | `https://…` | PRD, architecture, API specs |
| Figma | `https://figma.com/file/…` | Design mockups, design system |
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

| App | Package | Platform | Flows of interest | Account to use | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [Tên app] | `com.example.app` | Android | onboarding, login, [luồng chính] | guest / test account from [owner] | [ví dụ: cần OTP, giới hạn vùng] |

**Device:** [serial from `adb devices`, only needed when several devices are attached]

## 6. Output Locations

| Deliverable | Path |
| :--- | :--- |
| Extracted / audited requirements, question backlogs | `docs/BA/SRS-report/[UC-folder]/` |
| Research notes | `docs/BA/research/` |
| Feature briefs | `docs/BA/briefs/` |
| User stories | `docs/BA/stories/` |
| Competitor analysis | `docs/BA/competitor/[app-slug]/` |
| FSD | `docs/project-fsd.md` |
| Use cases | `docs/usecases/[module]/` |
| Test cases | `docs/testcases/[module]/` |

## 7. Pipeline Settings

| Setting | Value |
| :--- | :--- |
| Auto-proceed between phases | Disabled (user controls) |
| Overwrite versioned files | Never (create a new version) |
| Mobile vs Web audit rules | [mobile / web] |
