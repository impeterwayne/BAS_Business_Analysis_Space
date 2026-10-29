---
name: srs-export
description: "Exports docs/project-srs.md to Word (docs/project-srs.docx) with the workspace Word rules: Mulish 12pt, native Heading 1/2/3, fixed proportional column widths, real line breaks, screen grid and element images embedded, Mermaid diagrams as images, internal links kept. Run ONLY when the user explicitly asks for a Word file ('xuất Word', 'export docx', '/ba-export'). The SRS is always written in Markdown first."
---

# SRS Export — Markdown → Word

The Markdown SRS is the only source. The Word file is generated from it, never edited by hand, and **only produced when the user asks**.

## When

- The user asks for Word (`/ba-export`, "xuất Word", "gửi bản Word cho tester").
- Never automatically after writing or updating the SRS.
- If the SRS has unfinished Use Cases (a Figma section still waiting for PO answers), say so in chat and ask whether to export anyway.

## How

```bash
python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md   # make sure diagrams are current
python .agents/skills/srs-export/scripts/export_docx.py docs/project-srs.md
```

Output: `docs/project-srs.docx`, overwritten each time (the PO sends the tester one file).

Options: `-o path.docx`; `--reference-doc company.docx` to use a company Word template (default `assets/reference.docx`: Mulish 12pt, black bold headings, bordered tables).

## What the script applies

| Rule (`ba-markdown-formatting`) | How |
| :--- | :--- |
| Font Mulish 12pt everywhere | reference styles + every run |
| Native Heading 1/2/3, bold, black | pandoc heading styles from the reference doc |
| Fixed proportional column widths (6.5") | by table header: Thuộc tính/Giá trị · STT/Rule ID/Tên rule/Mô tả · ID/Thành phần/Loại/Mô tả tương tác · Step/Actor/Action/Note/References · screen grid 3 × 2.17" |
| `<br>` in cells → real line break | post-processing |
| Screens, element images, diagrams embedded | `<img>` and Mermaid converted to embedded pictures |
| Clickable references (`#br-002`, `#uc-…-af-1`) | anchors become Word bookmarks |
| "Xem ảnh lớn" line | the local SVG link is dropped (the image is embedded); the mermaid.live link is kept |

## Requirements (one-time, on the PO's machine)

Python 3 with `python-docx` (`pip install python-docx`), [pandoc](https://pandoc.org/installing.html), and mermaid-cli (`npm i -g @mermaid-js/mermaid-cli`) for diagrams. Without mermaid-cli the script reuses `docs/BA/diagrams/<id>.png` when it exists, otherwise leaves the diagram as code and warns. If mmdc cannot find a browser, set `PUPPETEER_EXECUTABLE_PATH` to Chrome / Edge.

## After export

Report in chat: the Word path, number of diagrams embedded, any diagram left as code, any missing image (`[pandoc] Could not fetch resource …` means a wrong path in the SRS: fix the Markdown, never the Word file).
