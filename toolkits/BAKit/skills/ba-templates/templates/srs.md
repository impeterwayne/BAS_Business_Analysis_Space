<!--
SRS TEMPLATE — ONE living file for the whole app: docs/project-srs.md (overwritten on every update, no change log).
Word copy (docs/project-srs.docx) is exported ONLY when the user asks (skill srs-export).
Every Use Case is written in full inside this file with use-case.md. Every diagram is an inline Mermaid block.
After writing or changing any diagram, run the user-flow render script to add the "Xem ảnh lớn" links.
Image paths are relative to docs/ (e.g. BA/figma/{feature}/screens/01-home.png).
Template guidance lives only in HTML comments; delete every comment and placeholder in the output.
Rules: ba-global-rules, ba-markdown-formatting. No Phạm vi section, no Open Questions section, no change log.
-->

# Tài liệu Đặc tả Yêu cầu Phần mềm: {Tên dự án}

| Thuộc tính | Giá trị |
| :--- | :--- |
| Dự án | {project-name} |
| Nền tảng | {Android / iOS / Android + iOS} |
| Ngày tạo | {YYYY-MM-DD} |
| Cập nhật lần cuối | {YYYY-MM-DD} |
| Tác giả | {name / agent} |
| Phiên bản | v{N} |

## 1. Tổng quan sản phẩm

{Đúng 1 câu ngắn gọn nêu ứng dụng dùng để làm gì.}

## 2. Sơ đồ tính năng

<!--
Simple tree of the features the app will have, from Home onward, built from the Feature Checklist (in-scope rows only):
app → Group of feature → Tính năng → Tính năng nhỏ. Not a user flow: no arrows, no actions, no screens order.
Keep labels short (English UI names). More than ~40 leaves → one tree per group.
-->

<a id="feature-map"></a>

```mermaid
mindmap
  root(({Tên app}))
    {Group of feature 1}
      {Tính năng}
        {Tính năng nhỏ}
    {Group of feature 2}
      {Tính năng}
```

## 3. Global Business Rules

<!-- Only rules that apply to the whole app or several Use Cases. ONE rule per row (one condition > one result); never stack several rules in one cell with <br>. Each Rule ID cell starts with its anchor so other tables can link to it. -->

| STT | Rule ID | Tên rule | Mô tả |
| :--- | :--- | :--- | :--- |
| 1 | <a id="br-001"></a>`BR-001` | {Tên rule chung} | {Điều kiện / Hành động} > {Kết quả}. |
| 2 | <a id="br-002"></a>`BR-002` | {Tên rule chung} | {Điều kiện / Hành động} > {Kết quả}. |

## 4. Use Case: {Tên Use Case}

<!-- Write each Use Case with .agents/skills/ba-templates/templates/use-case.md, numbered 4, 5, 6… in this file. -->

{Khối Use Case theo use-case.md}

<!-- SECTION: api-backend, fullstack-web -->
## Hợp đồng API

### {Tên endpoint}

1. Phương thức: GET / POST / PUT / DELETE
2. Đường dẫn: `/api/v1/{resource}`
3. Xác thực: Required / Public
4. Request: `{schema}`
5. Response: `{schema}`
6. Mã lỗi: {chỉ các mã đã xác nhận}
7. Use case liên quan: `UC-{MOD}-{NNN}`
<!-- END SECTION -->
