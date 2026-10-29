# BA Project Configuration

| Field | Value |
| :--- | :--- |
| Project | {Tên dự án} |
| App slug | {app-slug, ví dụ photo-editor} |
| Project type | mobile |
| Platform | {Android / iOS / Android + iOS} |
| Deliverable language | Vietnamese |

## 1. Project Overview

> **Description:** {1–2 câu mô tả app}

## 2. Links & Resources

| Resource | URL | Note / Access |
| :--- | :--- | :--- |
| Figma | `{https://www.figma.com/design/...}` | File phải đang mở trong Figma Desktop và chạy plugin figma-mcp-android |

## 3. Reference App (APK decode output / `/ba-competitor`)

Point the APK decode tool (or `/ba-competitor`) at the folder below; `/ba-checklist` reads from there.

| App | Package | Platform | Flows of interest | Account to use | Decoded source | Output folder |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| {Tên app tham chiếu} | `{com.example.app}` | Android | {home, luồng chính} | guest | `{…/com.example.app/jadx_src}` or none | `docs/BA/competitor/{app-slug}/` |

**Device:** {serial from `adb devices`, only needed when several devices are attached for `/ba-competitor`}

## 4. Word Export

| Field | Value |
| :--- | :--- |
| Word template | `.agents/skills/srs-export/assets/reference.docx` (thay bằng mẫu công ty nếu có) |
