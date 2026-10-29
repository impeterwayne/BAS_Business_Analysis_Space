#!/usr/bin/env python3
"""
Export a Feature Checklist (Markdown) to Excel (.xlsx) in the company column layout.

Usage:
  python .agents/skills/apk-feature-extractor/scripts/export_checklist_xlsx.py <checklist.md> [-o out.xlsx]

- Reads the first Markdown table whose header starts with "STT | Group of feature".
- Writes the 12 company columns in a sheet named "Feature Checklist".
- Only STT, Group of feature, Tính năng, Tính năng nhỏ, Mô tả tính năng are copied.
  All other columns are written empty (project rule). Use --keep-all to copy them as-is.
- Default output: same folder and name as the Markdown, extension .xlsx.
Requires: openpyxl
"""
import argparse
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

COLUMNS = ["STT", "Group of feature", "Tính năng", "Tính năng nhỏ", "Mô tả tính năng",
           "Link tham khảo", "Khả thi", "Mức độ", "Thời gian (about)", "PO note", "Ưu tiên",
           "Technology notes"]
FILLED = set(COLUMNS[:5])
WIDTHS = [6, 20, 22, 24, 60, 18, 10, 10, 14, 20, 10, 22]
FONT = "Arial"


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    cells, cur, esc = [], "", False
    for ch in line:
        if ch == "\\" and not esc:
            esc = True
            continue
        if ch == "|" and not esc:
            cells.append(cur.strip())
            cur = ""
        else:
            cur += ch
        esc = False
    cells.append(cur.strip())
    return cells


def clean(text):
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    return text.strip()


def read_table(md_text):
    lines = md_text.splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("|") and "Group of feature" in line and "STT" in line:
            header = [clean(c) for c in split_row(line)]
            rows = []
            for row_line in lines[i + 2:]:
                if not row_line.strip().startswith("|"):
                    break
                cells = [clean(c) for c in split_row(row_line)]
                cells += [""] * (len(header) - len(cells))
                rows.append(dict(zip(header, cells)))
            return rows
    sys.exit("[error] No table with header 'STT | Group of feature | ...' found.")


def main():
    ap = argparse.ArgumentParser(description="Export Feature Checklist Markdown to Excel.")
    ap.add_argument("input")
    ap.add_argument("-o", "--output")
    ap.add_argument("--keep-all", action="store_true", help="Also copy the PO/Tech columns")
    args = ap.parse_args()

    src = Path(args.input)
    if not src.is_file():
        sys.exit(f"[error] File not found: {src}")
    out = Path(args.output) if args.output else src.with_suffix(".xlsx")
    rows = read_table(src.read_text(encoding="utf-8"))

    wb = Workbook()
    ws = wb.active
    ws.title = "Feature Checklist"
    thin = Side(style="thin", color="999999")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    head_fill = PatternFill("solid", fgColor="D9E1F2")

    for c, name in enumerate(COLUMNS, 1):
        cell = ws.cell(row=1, column=c, value=name)
        cell.font = Font(name=FONT, bold=True, size=11)
        cell.fill = head_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border
        ws.column_dimensions[cell.column_letter].width = WIDTHS[c - 1]

    for r, row in enumerate(rows, 2):
        for c, name in enumerate(COLUMNS, 1):
            value = row.get(name, "") if (name in FILLED or args.keep_all) else ""
            if name == "STT" and value.isdigit():
                value = int(value)
            cell = ws.cell(row=r, column=c, value=value if value != "" else None)
            cell.font = Font(name=FONT, size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True,
                                       horizontal="center" if name == "STT" else "left")
            cell.border = border

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{ws.cell(row=1, column=len(COLUMNS)).column_letter}{max(1, len(rows) + 1)}"
    wb.save(out)
    print(f"[ok] Excel file: {out} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
