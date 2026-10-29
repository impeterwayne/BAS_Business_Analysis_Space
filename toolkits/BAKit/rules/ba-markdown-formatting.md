---
trigger: always_on
---

# Markdown Formatting Rules — Document Output Quality Gate

> This rule file MUST be referenced and strictly followed by ALL skills that produce Markdown (.md) and Word (.docx) output documents.

## Purpose
Ensure all generated Markdown and Word documents are syntactically correct, render properly in standard Markdown/Word viewers, and pass validation without manual post-processing.

## Mandatory Rules

### 1. Table Formatting & Word (`.docx`) Output Rules (CRITICAL)

- **One row per line:** Each table row MUST occupy exactly ONE line. NEVER concatenate multiple rows into a single line.
- **Column count consistency:** The separator row (`| --- | --- |`) MUST have the EXACT same number of columns as the header row. Count the `|` delimiters carefully.
- **Business Rules: one rule per row.** In `STT | Rule ID | Tên rule | Mô tả` tables each row holds exactly one rule (one condition `>` one result) with its own `BR-{NNN}`. Never stack several rules in one cell with `<br>`; split them into rows.
- **Note/References: links on one line.** Write references as clickable links, comma-separated, on one line: `[BR-002](#br-002), [AF-1](#uc-edit-001-af-1)`. The targets carry anchors (`<a id="br-002"></a>` in the Rule ID cell, `<a id="uc-edit-001-af-1"></a>` in the AF / EF step cell).
- **Other line breaks inside table cells (`<br>` without `- `):** When another cell genuinely holds several items (a UI label followed by its element image, several states of one element), break with `<br>` directly in `.md` (a real line break in `.docx`) — **never prefix lines with `- ` (never `<br>- `) and never use em-dashes `—`**. Inline `<img>` (screen grid, element images) and `<a id>` anchors are the only HTML allowed in tables; no `<p>` or `<div>`.
- **Screen grid:** in `X.1 Đặc tả giao diện`, screens are shown 3 per row in a table whose first row holds the images (`<img src="…" width="200">`) and whose second row holds the captions (`**Hình N: …**`); a short last row keeps empty cells.
- **No leading `- ` bullets or `—` em-dashes in SRS / Use Case documents:** Image captions use `**Hình N: ...**` (no leading `- ` and no `—`), and lists outside tables use numbered items (`1. `, `2. `) instead of `- `.
- **No extra `---` lines near tables:** Do NOT place horizontal rule (`---`) immediately before or after a table. This breaks table rendering in many parsers. Use a blank line instead if visual separation is needed.
- **Pipe alignment:** Every row must start and end with `|`. Inner pipes must align with header columns.
- **Word (`.docx`) Typography — Font `Mulish`, Size `12` & Native Heading Styles (`Heading 1` / `Heading 2` / `Heading 3`):**
  - All exported Word (`.docx`) documents MUST use font **`Mulish`** at size **`12pt`** (`Pt(12)`) across headings, body paragraphs, lists, and table cells (set both `run.font.name = "Mulish"`, `run.font.size = Pt(12)`, and XML `w:rFonts` attributes `w:ascii="Mulish" w:hAnsi="Mulish" w:cs="Mulish" w:eastAsia="Mulish"`).
  - Markdown headings (`#`, `##`, `###`) MUST be assigned native Microsoft Word Heading styles (`p.style = "Heading 1"`, `"Heading 2"`, `"Heading 3"` / `doc.add_paragraph(style=f"Heading {level}")`) with explicit `w:outlineLvl` (`0`, `1`, `2`), `bold=True`, and dark text color `#000000` (`RGBColor(0, 0, 0)`) so that all sections appear in Word's Navigation Pane (Outline view). NEVER export `#`, `##`, `###` headings as plain `Normal` paragraphs.
- **Proportional Column Widths in Word (`.docx`) Exports:** Never leave `.docx` tables with equal column widths (`25%` each). Always enforce fixed table layout (`w:tblLayout w:type="fixed"`, `table.autofit = False`) and set explicit `cell.width` (`w:tcW`) per column so short ID/index columns stay compact and description/action columns get the majority of the width (total `6.5 inches`):
  - **Document Header (`Thuộc tính | Giá trị`):** `1.6"` (`25%`) | `4.9"` (`75%`)
  - **Global Business Rules & Use Case Business Rules (`STT | Rule ID | Tên rule | Mô tả`):** `0.55"` | `0.85"` | `1.65"` | `3.45"` (STT widened so the header does not wrap)
  - **UI Specification (`ID | Thành phần | Loại | Mô tả tương tác`):** `0.45"` | `1.55"` | `1.05"` | `3.45"` (room for the element image)
  - **Screen grid (3 images):** `2.17"` | `2.17"` | `2.16"`, cells centered
  - **Use Case attributes (`Thuộc tính | Giá trị`: Mã UC, Trigger, Pre-condition, Post-condition):** same as the document header
  - **Use Case Flows (`Step | Actor | Action | Note/References`):** `0.65"` (`10%`) | `0.85"` (`13%`) | `3.55"` (`55%`) | `1.45"` (`22%`)

### 2. Self-Validation Checklist (MUST run before finalizing output)

Before writing any Markdown or Word file to disk, the agent MUST perform these checks:

1. **Column count check:** For every table, count columns in the header row and verify the separator row has the same count.
2. **Row integrity check:** Verify each table row is on its own line (no merged/concatenated rows).
3. **Rule rows, reference links, line breaks & HTML check:** every Business Rules row holds one rule; Note/References are comma-separated links on one line whose anchors exist; other multi-item cells use `<br>` without leading `- ` or `—`; no `<p>` or `<div>` inside tables.
4. **No parallel bilingual gloss & non-duplication check:** Ensure there are zero `Tiếng Việt (English)` or `English (Tiếng Việt)` parenthetical translations anywhere in headings, lists, or tables, and verify that `3. Global Business Rules` (app-wide/cross-module rules) and `X.6 Business Rules` (UC-specific validation/range/formula rules) do not repeat UI click/navigation steps from `X.1 Đặc tả giao diện` or `X.3–X.5 Flows`.
5. **Word (`.docx`) font, native `Heading 1/2/3` styles & column width check:** When exporting `.docx`, verify that font `Mulish` size `12pt` is applied throughout, all `#`, `##`, `###` headings use native Word `Heading 1`, `Heading 2`, `Heading 3` styles (`w:outlineLvl` `0/1/2`, bold, `#000000`) for Navigation Pane outline visibility, compact columns (`STT`, `Rule ID`, `ID`, `Step`, `Actor`) use narrow fixed widths, and description/action columns use wide widths.
6. **Horizontal rule check:** Ensure no `---` line appears directly adjacent to a table (must have at least one blank line of separation).
7. **Trailing whitespace:** Remove trailing spaces that could cause unintended line breaks.
8. **Mermaid direction check:** Every `flowchart` / `graph` header is `TD` (or `TB`), and no diagram or `subgraph` sets `direction LR` / `direction RL` (see section 5).

### 3. General Document Structure

- Use `---` (horizontal rule) ONLY as a section separator between major sections, NOT within or adjacent to tables.
- Maintain consistent heading hierarchy (`#` > `##` > `###`). Do not skip levels.
- Ensure blank lines before and after headings, tables, and code blocks.

### 4. Content Integrity

- **NEVER modify business content** when fixing formatting issues. Only fix structural/syntactic problems.
- Preserve all original text, terminology, and data values exactly as provided.
- If reformatting requires splitting a cell's content, ensure no information is lost.

### 5. Mermaid Diagram Direction (vertical by default)

Documents are read top-down in a narrow pane (Obsidian, preview panels). Horizontal diagrams overflow
the width, shrink the text to unreadable sizes, and force sideways scrolling. So diagrams flow **vertically**.

- **Flowcharts:** always `flowchart TD` (or `TB`). NEVER `flowchart LR` / `RL` / `graph LR`.
- **Subgraphs:** do not add `direction LR` / `direction RL` inside a `subgraph`.
- **State, class and ER diagrams:** keep the default top-to-bottom layout; do not add `direction LR`.
- **Wide fan-out:** when one node branches into many siblings and the diagram gets wide, split it into
  stacked `subgraph`s or several smaller diagrams — do not switch to a horizontal direction.
- **Exempt (horizontal by nature):** `sequenceDiagram`, `gantt`, `timeline`, `journey`. Their layout is fixed.
- **Only exception:** the user explicitly asks for a horizontal diagram.

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

### BAD — Run-on single-line list in table cell (hard to read):
```
| 1 | Status | Rule | • Charging: Đang sạc • Discharging: Đang xả pin • Fully Charged: Pin đầy |
```

### BAD — Several rules stacked in one Business Rules cell:
```
| 1 | BR-004 | Trạng thái pin | Charging > Hiển thị Đang sạc<br>Discharging > Hiển thị Đang xả pin<br>Fully Charged > Hiển thị Pin đầy |
```

### GOOD — One rule per row, concise `>` syntax:
```
| 1 | <a id="br-004"></a>`BR-004` | Trạng thái Charging | Charging > Hiển thị trạng thái Đang sạc. |
| 2 | <a id="br-005"></a>`BR-005` | Trạng thái Discharging | Discharging > Hiển thị trạng thái Đang xả pin. |
| 3 | <a id="br-006"></a>`BR-006` | Trạng thái Fully Charged | Fully Charged > Hiển thị trạng thái Pin đầy. |
```

### GOOD — Note/References as links on one line:
```
| `BF-2` | System | Kiểm tra trạng thái pin > Hiển thị trạng thái tương ứng. | [BR-004](#br-004), [BR-005](#br-005), [EF-1](#uc-bat-001-ef-1) |
```

### BAD — Horizontal flowchart:
```
flowchart LR
    A[Mở app] --> B[Đăng nhập] --> C[Trang chủ]
```

### GOOD — Vertical flowchart:
```
flowchart TD
    A[Mở app] --> B[Đăng nhập] --> C[Trang chủ]
```
