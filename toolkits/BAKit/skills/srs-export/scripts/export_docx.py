#!/usr/bin/env python3
"""
Export docs/project-srs.md to Word (docs/project-srs.docx). Run ONLY when the user asks for a Word file.

Usage:
  python .agents/skills/srs-export/scripts/export_docx.py docs/project-srs.md [-o out.docx] [--reference-doc tpl.docx]

Applies the workspace Word rules (ba-markdown-formatting):
  - font Mulish 12pt everywhere; headings use native Word Heading 1/2/3 (bold, black) for the Navigation Pane;
  - fixed, proportional column widths (total 6.5"):
      Thuộc tính | Giá trị                      1.60 | 4.90
      STT | Rule ID | Tên rule | Mô tả          0.55 | 0.85 | 1.65 | 3.45
      ID | Thành phần | Loại | Mô tả tương tác  0.45 | 1.55 | 1.05 | 3.45
      Step | Actor | Action | Note/References  0.65 | 0.85 | 3.55 | 1.45
      screen grid (3 images)                   2.17 | 2.17 | 2.16
  - <br> inside cells becomes a real line break;
  - Mermaid diagrams become images; the mermaid.live link under each diagram is kept;
  - screenshots, element images and diagrams are embedded; internal links (#br-002 …) keep working.

Requirements: pandoc, python-docx; mermaid-cli (mmdc) for diagrams (falls back to docs/BA/diagrams/<id>.png).
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "user-flow" / "scripts"))
import render_diagrams as rd  # noqa: E402

DEFAULT_REFERENCE = HERE.parent / "assets" / "reference.docx"
FONT = "Mulish"
BR_TOKEN = "\u2063BR\u2063"
WIDTHS = {
    ("thuộc tính", "giá trị"): [1.60, 4.90],
    ("stt", "rule id", "tên rule", "mô tả"): [0.55, 0.85, 1.65, 3.45],
    ("id", "thành phần", "loại", "mô tả tương tác"): [0.45, 1.55, 1.05, 3.45],
    ("step", "actor", "action", "note/references"): [0.65, 0.85, 3.55, 1.45],
}
PAGE_WIDTH_IN = 6.5
MAX_DIAGRAM_HEIGHT_IN = 8.0


# ---------- Markdown pre-processing ----------

def px_to_in(px: str) -> str:
    return f"{int(px) / 100:.2f}in"


def html_img_to_md(text: str) -> str:
    def repl(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag)
        if not src:
            return ""
        w = re.search(r'width="(\d+)"', tag)
        h = re.search(r'height="(\d+)"', tag)
        attrs = []
        if w:
            attrs.append(f"width={px_to_in(w.group(1))}")
        if h:
            attrs.append(f"height={px_to_in(h.group(1))}")
        return f"![]({src.group(1)})" + ("{" + " ".join(attrs) + "}" if attrs else "")
    return re.sub(r"<img\b[^>]*>", repl, text)


def anchors_to_pandoc(text: str) -> str:
    # anchor on its own line followed by a heading -> heading id
    text = re.sub(r'<a id="([^"]+)"></a>\s*\n(?:\s*\n)*(#{1,6} [^\n]+?)\s*$',
                  lambda m: f"{m.group(2)} {{#{m.group(1)}}}", text, flags=re.M)
    # any other anchor -> empty span with id (bookmark)
    return re.sub(r'<a id="([^"]+)"></a>', lambda m: f"[]{{#{m.group(1)}}}", text)


def png_size(path: Path):
    import struct
    with open(path, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


def diagram_attr(png: Path) -> str:
    w_px, h_px = png_size(png)
    w_in = w_px / rd.MERMAID_SCALE / 96
    h_in = h_px / rd.MERMAID_SCALE / 96
    factor = min(1.0, PAGE_WIDTH_IN / w_in, MAX_DIAGRAM_HEIGHT_IN / h_in)
    return f"{{width={w_in * factor:.2f}in}}"


def diagrams_to_images(text: str, md_path: Path, tmpdir: Path):
    mmdc = rd.find_mmdc()
    out, last, done, kept = [], 0, 0, []
    for i, (m, did) in enumerate(rd.iter_blocks(text), 1):
        out.append(text[last:m.start()])
        last = m.end()
        did = did or f"diagram-{i}"
        png = tmpdir / f"{did}.png"
        ok = bool(mmdc) and rd.render(m.group(1), png, mmdc)
        if not ok:
            existing = md_path.parent / "BA" / "diagrams" / f"{did}.png"
            if existing.is_file():
                shutil.copy(existing, png)
                ok = True
        if ok:
            out.append(f"![]({png.as_posix()}){diagram_attr(png)}")
            done += 1
        else:
            out.append(m.group(0))
            kept.append(did)
    out.append(text[last:])
    return "".join(out), done, kept


def preprocess(md_text: str, md_path: Path, tmpdir: Path):
    text = re.sub(r"<!--.*?-->\s*", "", md_text, flags=re.S)
    # keep only the mermaid.live link of the "Xem ảnh lớn" line
    text = re.sub(r"^\[Xem ảnh lớn\]\([^)]*\)[ \t]*·[ \t]*(\[Mở trên mermaid\.live\]\([^)]*\))[ \t]*$", r"\1",
                  text, flags=re.M)
    text = re.sub(r"^\[Xem ảnh lớn\]\([^)]*\)[ \t]*$", "", text, flags=re.M)
    text, done, kept = diagrams_to_images(text, md_path, tmpdir)
    text = anchors_to_pandoc(text)
    text = html_img_to_md(text)
    text = re.sub(r"<br\s*/?>", BR_TOKEN, text, flags=re.I)
    return text, done, kept


# ---------- Word post-processing ----------

def set_run_font(run, size=12, bold=None, color=None):
    run.font.name = FONT
    run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    if color is not None:
        run.font.color.rgb = color
    rpr = run._r.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), FONT)


def split_breaks(paragraph):
    for run in paragraph.runs:
        if BR_TOKEN in run.text:
            parts = run.text.split(BR_TOKEN)
            run.text = parts[0]
            for part in parts[1:]:
                run.add_break()
                run.add_text(part)


def fix_table(table):
    tbl = table._tbl
    tblPr = tbl.tblPr
    layout = tblPr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tblPr.append(layout)
    layout.set(qn("w:type"), "fixed")
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    first = table.rows[0].cells
    is_grid = any(c._tc.xpath(".//w:drawing") for c in first) and len(first) == 3
    header = tuple(c.text.strip().lower() for c in first)
    if is_grid:
        widths = [2.17, 2.17, 2.16]
    else:
        widths = WIDTHS.get(header) or [PAGE_WIDTH_IN / len(first)] * len(first)

    grid = tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), widths):
        gc.set(qn("w:w"), str(int(w * 1440)))
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = Inches(w)
            if is_grid:
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER


def postprocess(docx_path: Path):
    doc = Document(str(docx_path))
    for p in doc.paragraphs:
        split_breaks(p)
        heading = p.style.name.startswith("Heading")
        for r in p.runs:
            set_run_font(r, bold=True if heading else None, color=RGBColor(0, 0, 0) if heading else None)
    for table in doc.tables:
        fix_table(table)
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    split_breaks(p)
                    for r in p.runs:
                        set_run_font(r)
    doc.save(str(docx_path))


def main():
    ap = argparse.ArgumentParser(description="Export the SRS Markdown to Word.")
    ap.add_argument("input", help="docs/project-srs.md")
    ap.add_argument("-o", "--output", help="Default: same folder and name, .docx")
    ap.add_argument("--reference-doc", help="Company Word template for styles")
    args = ap.parse_args()

    md = Path(args.input)
    if not md.is_file():
        sys.exit(f"[error] File not found: {md}")
    pandoc = shutil.which("pandoc")
    if not pandoc:
        sys.exit("[error] pandoc is not installed: https://pandoc.org/installing.html")
    out = Path(args.output) if args.output else md.with_suffix(".docx")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        text, done, kept = preprocess(md.read_text(encoding="utf-8"), md, tmp)
        src = tmp / "srs.md"
        src.write_text(text, encoding="utf-8")
        cmd = [pandoc, str(src), "-f", "markdown-raw_html+pipe_tables+header_attributes+link_attributes+bracketed_spans",
               "-t", "docx", "-o", str(out), "--resource-path", os.pathsep.join([str(md.resolve().parent), str(tmp)])]
        ref = Path(args.reference_doc) if args.reference_doc else DEFAULT_REFERENCE
        if ref.is_file():
            cmd += ["--reference-doc", str(ref)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            sys.exit(f"[error] pandoc failed:\n{res.stderr}")
        for line in res.stderr.splitlines():
            print(f"[pandoc] {line}", file=sys.stderr)

    postprocess(out)
    print(f"[ok] Word file: {out}")
    print(f"[ok] Diagrams embedded: {done}")
    if kept:
        print(f"[warn] Diagrams left as code (install mermaid-cli or run render_diagrams.py first): {kept}")


if __name__ == "__main__":
    main()
