---
name: srs-export
description: "Export the single-file SRS Markdown (docs/ba/srs/{app}_srs_v{N}.md) to a Word file for testers (docs/ba/srs-word/{app}_srs_v{N}.docx), with design images embedded and Mermaid diagrams rendered as images. Use after the SRS passes the quick audit, or when the user asks 'xuất Word', 'xuất docx cho tester', 'export SRS'."
---

# SRS Export — Markdown → Word for Testers

The Markdown SRS is the **only source**. The Word file is generated from it and is never edited by hand, so the developer and tester versions always have the same content.

## When to Run

- After `BA-audit-SRS` (quick mode) returns **Ready** or **Conditionally Ready**.
- After every new SRS version (`v{N+1}`).
- Do not export a version whose audit is **Not Ready** unless the user explicitly asks; if so, tell them the Word file contains open P0 items.

## How to Run

From the project root:

```bash
python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/{app}_srs_v{N}.md
```

Output: `docs/ba/srs-word/{app}_srs_v{N}.docx` (same version number as the Markdown).

Options:

- `-o path.docx` — custom output path.
- `--reference-doc path.docx` — use the company Word template for fonts, colors and heading styles. Without it, `assets/reference.docx` is used (Arial, bordered tables).

The script:

1. removes template comments (`<!-- … -->`);
2. renders every Mermaid block to an image (needs `mmdc`);
3. keeps internal links (anchors such as `#uc-edit-001`) working in Word;
4. fits phone screenshots and diagrams on an A4 page;
5. embeds every image into the .docx.

## Requirements (one-time setup on the PO's machine)

| Tool | Needed for | Install |
|---|---|---|
| Python 3 | running the script | https://www.python.org/downloads/ |
| pandoc | Markdown → Word (required) | https://pandoc.org/installing.html |
| Node.js + mermaid-cli | diagrams as images (recommended) | install Node.js, then `npm i -g @mermaid-js/mermaid-cli` |

Without mermaid-cli the export still works, but diagrams stay as code text in Word; the script prints a warning.

If mermaid-cli cannot find a browser, set `PUPPETEER_EXECUTABLE_PATH` to an installed Chrome/Edge executable before running the script.

## After Export — Report to the User (Vietnamese)

- Path of the Word file.
- Number of diagrams rendered; any diagram left as code (and why).
- Any image the script could not find (pandoc prints `Could not fetch resource …`): this means a broken path in the SRS — fix the SRS, never the Word file.

## Rules

- Never edit the .docx by hand or with the `docx` skill to change content. Change the Markdown, then export again.
- The `docx` skill may be used only for layout-level tasks the user explicitly asks for on an exported file (e.g., adding a company cover page), and those changes must be repeated after each export.
- Never overwrite an exported version that was already sent to testers; export the new SRS version instead.
