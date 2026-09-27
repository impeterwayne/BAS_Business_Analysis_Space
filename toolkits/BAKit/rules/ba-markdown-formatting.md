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

### 3. General Document Structure

- Use `---` (horizontal rule) ONLY as a section separator between major sections, NOT within or adjacent to tables.
- Maintain consistent heading hierarchy (`#` > `##` > `###`). Do not skip levels.
- Ensure blank lines before and after headings, tables, and code blocks.

### 4. Content Integrity

- **NEVER modify business content** when fixing formatting issues. Only fix structural/syntactic problems.
- Preserve all original text, terminology, and data values exactly as provided.
- If reformatting requires splitting a cell's content, ensure no information is lost.

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
