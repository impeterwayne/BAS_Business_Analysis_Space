---
trigger: always_on
---

# Markdown Formatting Rules — Document Output Quality Gate

> This rule file MUST be referenced and strictly followed by ALL skills that produce Markdown (.md) output documents.

## Purpose
Ensure all generated Markdown documents are syntactically correct, render properly in standard Markdown viewers, and pass validation without manual post-processing.

## Mandatory Rules

### 1. Table Formatting (CRITICAL)

- **One row per line:** Each table row MUST occupy exactly ONE line. NEVER concatenate multiple rows into a single line.
- **Column count consistency:** The separator row (`| --- | --- |`) MUST have the EXACT same number of columns as the header row. Count the `|` delimiters carefully.
- **No `<br>` tags inside table cells:** NEVER use `<br>` or any HTML line-break tags inside Markdown table cells. If multi-line content is needed within a cell, use one of these alternatives:
  - Use `•` bullet points inline (e.g., `• Item 1 • Item 2`)
  - Use numbered items inline (e.g., `1. Item 1 2. Item 2`)
  - Split into multiple rows if the content is logically separable
- **No extra `---` lines near tables:** Do NOT place horizontal rule (`---`) immediately before or after a table. This breaks table rendering in many parsers. Use a blank line instead if visual separation is needed.
- **Pipe alignment:** Every row must start and end with `|`. Inner pipes must align with header columns.

### 2. Self-Validation Checklist (MUST run before finalizing output)

Before writing any Markdown file to disk, the agent MUST perform these checks:

1. **Column count check:** For every table, count columns in the header row and verify the separator row has the same count.
2. **Row integrity check:** Verify each table row is on its own line (no merged/concatenated rows).
3. **HTML tag check:** Scan for any `<br>`, `<p>`, `<div>` or other HTML tags inside tables. Remove or replace them.
4. **Horizontal rule check:** Ensure no `---` line appears directly adjacent to a table (must have at least one blank line of separation).
5. **Trailing whitespace:** Remove trailing spaces that could cause unintended line breaks.
6. **Mermaid direction check:** Every `flowchart` / `graph` header is `TD` (or `TB`), and no diagram or `subgraph` sets `direction LR` / `direction RL` (see section 5).
7. **Mermaid simplicity & split check:** No single `mermaid` block exceeds **10–12 nodes** or mixes a complex happy path with every alternative/error branch into one giant tangled chart. Split large flows into multiple smaller, focused diagrams (see section 5).
8. **Embedded Figma / Design image check:** Every screen screenshot in Figma analysis, SRS, or Use Case files uses Markdown image syntax `![{Screen ID} — {Screen name}](<relative-path>.png)` with a relative path calculated from the **target Markdown file's directory** (using forward slashes `/`), and the referenced `.png` file actually exists on disk (see section 6).

### 3. General Document Structure

- Use `---` (horizontal rule) ONLY as a section separator between major sections, NOT within or adjacent to tables.
- Maintain consistent heading hierarchy (`#` > `##` > `###`). Do not skip levels.
- Ensure blank lines before and after headings, tables, and code blocks.

### 4. Content Integrity

- **NEVER modify business content** when fixing formatting issues. Only fix structural/syntactic problems.
- Preserve all original text, terminology, and data values exactly as provided.
- If reformatting requires splitting a cell's content, ensure no information is lost.

### 5. Mermaid Diagram Direction & Simplicity (vertical, small, split for easy viewing)

Documents are read top-down in a narrow pane (Obsidian, preview panels). Horizontal or oversized diagrams overflow the width, shrink the text to unreadable sizes, and force zooming/scrolling. Keep every diagram **vertical, simple, and split into multiple small diagrams**:

- **Flowcharts:** always `flowchart TD` (or `TB`). NEVER `flowchart LR` / `RL` / `graph LR`.
- **Subgraphs:** do not add `direction LR` / `direction RL` inside a `subgraph`. Avoid deeply nested `subgraph`s.
- **State, class and ER diagrams:** keep the default top-to-bottom layout; do not add `direction LR`.
- **Keep each diagram simple (≤ 10–12 nodes max):**
  - Each `mermaid` block MUST contain at most **8–12 nodes** and at most **2–3 branches** from a decision node.
  - Keep node labels short and scannable (**3–6 words max**, e.g. `S01[01 Đăng nhập]`, `D1{OTP hợp lệ?}` — never put full sentences or detailed rules inside node boxes).
  - Avoid long cross-chart back-arrows that cross over other edges.
- **Cut large flows into multiple smaller diagrams:**
  - Whenever a flow has more than ~10 nodes, multiple sub-flows, or several alternative/exception branches, **split it into multiple separate `mermaid` blocks** under clear subheadings (e.g., **Diagram 1: Luồng chính / Happy Path**, **Diagram 2: Nhánh phụ / Xử lý lỗi OTP**, **Diagram 3: Nhánh quên mật khẩu**).
  - Use a clean handoff node (e.g., `D1 -->|Lỗi| E_OTP[Xem sơ đồ 3.2: Xử lý lỗi OTP]`) to connect the main diagram to the sub-diagrams instead of cramming everything into one block.
  - For `sequenceDiagram`, keep to **≤ 4 participants** and **≤ 10–12 message arrows** per block; split multi-phase interactions (e.g., Init/Auth vs Execution vs Callback) into separate sequence diagrams.
- **Exempt from vertical rule (horizontal by nature):** `sequenceDiagram`, `gantt`, `timeline`, `journey`. Their layout is fixed, but the simplicity and splitting rules still apply.
- **Only exception:** the user explicitly asks for a horizontal or single consolidated diagram.

### 6. Embedded Reference & Figma Images (Display in Markdown Preview & Word Export)

To ensure Figma / design screenshots render inline in Markdown previewers (BA Space, VS Code, Obsidian, GitHub) and embed properly when exported to Word `.docx` via `srs-export`:

- **Always use Markdown image syntax:** Write `![{Screen ID} — {Screen name}](<relative-path>.png)`. NEVER write plain backticked paths (`` `screens/01-home.png` ``) or plain text paths without `![...](...)`.
- **Always use forward slashes (`/`)** in image paths, never Windows backslashes (`\`).
- **Calculate the relative path from the directory of the Markdown file being written** (NEVER copy the shortened `screens/{NN}-{slug}.png` path from a Figma analysis file directly into an SRS or Use Case file without adjusting `../` depth):

| Document Being Written | Relative Path to `/ba-figma` Screenshot (`docs/BA/figma/{feature-slug}/screens/{NN}-{slug}.png`) | Relative Path to `docs/inputs/design/SCR-{MOD}-{NN}.png` |
|---|---|---|
| **Figma Analysis** (`docs/BA/figma/{feature-slug}/{feature-slug}_figma_*.md`) | `screens/{NN}-{slug}.png` | `../../../inputs/design/SCR-{MOD}-{NN}.png` |
| **Single-File Mobile SRS** (`docs/ba/srs/{app}_srs_v{N}.md`) | `../../BA/figma/{feature-slug}/screens/{NN}-{slug}.png` | `../../inputs/design/SCR-{MOD}-{NN}.png` |
| **Modular Use Case** (`docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md`) | `../../BA/figma/{feature-slug}/screens/{NN}-{slug}.png` | `../../inputs/design/SCR-{MOD}-{NN}.png` |
| **Modular Master SRS** (`docs/project-srs.md`) | `BA/figma/{feature-slug}/screens/{NN}-{slug}.png` | `inputs/design/SCR-{MOD}-{NN}.png` |

- **Never cite a non-existent image:** Verify the `.png` file exists on disk before writing the `![...](...)` tag. If a screen has no exported image yet, write `Design Pending — chưa có ảnh {Screen ID}` and log an Open Question (`Q-{NNN}`).

## Error Examples

### BAD — Merged rows (causes rendering failure):
```
| # | Field | Type || 1 | Name | Text | 2 | Email | Text |
```

### GOOD — One row per line:
```
| # | Field | Type |
|---|---|---|
| 1 | Name | Text |
| 2 | Email | Text |
```

### BAD — Column count mismatch:
```
| # | Field | Type | Description |
|---|---|---|
```

### GOOD — Matching column count:
```
| # | Field | Type | Description |
|---|---|---|---|
```

### BAD — HTML tags in table:
```
| 1 | Description | Label | Line 1<br>Line 2<br>Line 3 |
```

### GOOD — Inline bullets:
```
| 1 | Description | Label | • Line 1 • Line 2 • Line 3 |
```

### BAD — Horizontal or monolithic overloaded flowchart:
```
flowchart LR
    A[Mở app] --> B[Đăng nhập] --> C[Trang chủ]
```

### GOOD — Vertical, simple flowcharts split by concern:
```
flowchart TD
    S01[01 Đăng nhập] -->|Nhập SĐT hợp lệ| S02[02 Nhập OTP]
    S02 -->|OTP đúng| S03[03 Trang chủ]
    S02 -.->|OTP sai / hết hạn| SUB1[Xem sơ đồ nhánh lỗi OTP]
```
