#!/usr/bin/env python3
"""
Export the single-file SRS (Markdown) to a Word file for testers.

Usage:
  python .agents/skills/srs-export/scripts/export_docx.py docs/ba/srs/photo-editor_srs_v1.md
  python .agents/skills/srs-export/scripts/export_docx.py <input.md> [-o output.docx] [--reference-doc template.docx]

What it does:
  1. Removes HTML comments (template guidance) from the Markdown.
  2. Renders every ```mermaid block to PNG with mermaid-cli (mmdc) and inserts the image.
  3. Turns <a id="..."></a> anchors into heading IDs so internal links keep working in Word.
  4. Sizes design images so phone screenshots fit on an A4 page.
  5. Converts to .docx with pandoc, embedding all images.

Requirements: pandoc (required), mermaid-cli `mmdc` (recommended: npm i -g @mermaid-js/mermaid-cli).
Default output: docs/ba/srs/<name>.md  ->  docs/ba/srs-word/<name>.docx
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import struct
import sys
import tempfile
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_REFERENCE = SKILL_DIR / "assets" / "reference.docx"
DESIGN_IMAGE_HEIGHT = "11cm"
DIAGRAM_MAX_WIDTH_CM = 16.0
DIAGRAM_MAX_HEIGHT_CM = 18.0
MERMAID_SCALE = 2


def find_tool(name):
    path = shutil.which(name) or shutil.which(name + ".cmd")
    return path


def default_output(md_path: Path) -> Path:
    parts = list(md_path.resolve().parts)
    if len(parts) >= 2 and parts[-2] == "srs":
        return Path(*parts[:-2]) / "srs-word" / (md_path.stem + ".docx")
    return md_path.with_suffix(".docx")


def strip_comments(text):
    return re.sub(r"<!--.*?-->\s*", "", text, flags=re.S)


def anchors_to_heading_ids(text):
    # <a id="x"></a> (blank lines) #### Heading   ->   #### Heading {#x}
    pattern = re.compile(r'<a id="([^"]+)"></a>\s*\n(?:\s*\n)*(#{1,6} [^\n]+?)\s*$', re.M)
    text = pattern.sub(lambda m: f"{m.group(2)} {{#{m.group(1)}}}", text)
    # any anchor left without a following heading: drop it
    return re.sub(r'<a id="[^"]+"></a>\s*', "", text)


def find_docs_root(md_path: Path) -> Path:
    for parent in [md_path.resolve().parent, *md_path.resolve().parents]:
        if parent.name.lower() == "docs":
            return parent
    return md_path.resolve().parent


def locate_image_file(raw_path: str, md_dir: Path, docs_root: Path):
    clean = raw_path.strip().strip("<>").replace("\\", "/")
    if re.match(r"^(https?:|data:)", clean, re.I):
        return None
    direct = (md_dir / clean).resolve()
    if direct.is_file():
        return direct
    # Fallback 1: relative to docs_root or workspace root
    for base in [docs_root, docs_root.parent]:
        cand = (base / clean.lstrip("/")).resolve()
        if cand.is_file():
            return cand
    # Fallback 2: search by filename under docs/BA/figma, docs/ba/figma, docs/inputs/design
    fname = Path(clean).name
    if fname:
        for match in docs_root.rglob(fname):
            if match.is_file():
                return match.resolve()
    return None


def heal_markdown_image_paths(text: str, md_path: Path):
    """Ensure relative image paths in the .md file itself resolve from md_path.parent for Markdown preview."""
    md_dir = md_path.resolve().parent
    docs_root = find_docs_root(md_path)
    healed_count = 0

    def repl(m):
        nonlocal healed_count
        alt, raw_url = m.group(1), m.group(2)
        direct = (md_dir / raw_url.strip().replace("\\", "/")).resolve()
        if direct.is_file():
            return m.group(0)
        found = locate_image_file(raw_url, md_dir, docs_root)
        if found:
            rel = os.path.relpath(found, md_dir).replace("\\", "/")
            healed_count += 1
            return f"![{alt}]({rel})"
        return m.group(0)

    new_text = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", repl, text)
    return new_text, healed_count


def size_images(text: str, md_path: Path):
    """Resolve image paths to absolute POSIX paths for Pandoc and add {height=11cm} for phone screenshots."""
    md_dir = md_path.resolve().parent
    docs_root = find_docs_root(md_path)

    def repl(m):
        alt, raw_url, after = m.group(1), m.group(2), m.group(3)
        found = locate_image_file(raw_url, md_dir, docs_root)
        final_url = found.as_posix() if found else raw_url
        img_md = f"![{alt}]({final_url})"
        if after.startswith("{"):
            return f"{img_md}{after}"
        return f"{img_md}{{height={DESIGN_IMAGE_HEIGHT}}}{after}"

    return re.sub(r"!\[([^\]]*)\]\(([^)]+)\)(.?)", repl, text)


def png_size(path: Path):
    with open(path, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


def diagram_attr(png: Path):
    """Natural size (96 dpi / render scale), capped to fit the page."""
    w_px, h_px = png_size(png)
    w_cm = w_px / MERMAID_SCALE / 96 * 2.54
    h_cm = h_px / MERMAID_SCALE / 96 * 2.54
    factor = min(1.0, DIAGRAM_MAX_WIDTH_CM / w_cm, DIAGRAM_MAX_HEIGHT_CM / h_cm)
    return f"{{width={w_cm * factor:.1f}cm}}"


def render_mermaid(text, workdir: Path, mmdc):
    blocks = list(re.finditer(r"```mermaid[^\n]*\n(.*?)```", text, flags=re.S))
    if not blocks:
        return text, 0, []
    failed = []
    out, last, count = [], 0, 0
    puppeteer_cfg = workdir / "puppeteer.json"
    cfg = {"args": ["--no-sandbox", "--disable-setuid-sandbox"]}
    chrome = os.environ.get("PUPPETEER_EXECUTABLE_PATH")
    if chrome:
        cfg["executablePath"] = chrome
    puppeteer_cfg.write_text(json.dumps(cfg), encoding="utf-8")
    for i, m in enumerate(blocks, 1):
        out.append(text[last:m.start()])
        last = m.end()
        if not mmdc:
            out.append(m.group(0))
            failed.append(i)
            continue
        src = workdir / f"diagram_{i}.mmd"
        png = workdir / f"diagram_{i}.png"
        src.write_text(m.group(1), encoding="utf-8")
        cmd = [mmdc, "-i", str(src), "-o", str(png), "-b", "white", "-s", str(MERMAID_SCALE), "-p", str(puppeteer_cfg)]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=180)
            out.append(f"![]({png.as_posix()}){diagram_attr(png)}")
            count += 1
        except subprocess.CalledProcessError as e:  # keep the source so nothing is lost
            out.append(m.group(0))
            failed.append(i)
            msg = (e.stderr or b"").decode("utf-8", "replace").strip().splitlines()
            print(f"[warn] Diagram #{i} could not be rendered: {msg[0] if msg else e}", file=sys.stderr)
        except Exception as e:
            out.append(m.group(0))
            failed.append(i)
            print(f"[warn] Diagram #{i} could not be rendered: {e}", file=sys.stderr)
    out.append(text[last:])
    return "".join(out), count, failed


def main():
    ap = argparse.ArgumentParser(description="Export SRS Markdown to Word (.docx) for testers.")
    ap.add_argument("input", help="SRS Markdown file, e.g. docs/ba/srs/photo-editor_srs_v1.md")
    ap.add_argument("-o", "--output", help="Output .docx (default: docs/ba/srs-word/<name>.docx)")
    ap.add_argument("--reference-doc", help="Company Word template (.docx) for styles")
    args = ap.parse_args()

    md_path = Path(args.input)
    if not md_path.is_file():
        sys.exit(f"[error] File not found: {md_path}")
    pandoc = find_tool("pandoc")
    if not pandoc:
        sys.exit("[error] pandoc is not installed. Install from https://pandoc.org/installing.html")
    mmdc = find_tool("mmdc")
    if not mmdc:
        print("[warn] mermaid-cli (mmdc) not found: diagrams stay as code in Word. "
              "Install: npm i -g @mermaid-js/mermaid-cli", file=sys.stderr)

    out_path = Path(args.output) if args.output else default_output(md_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    text = md_path.read_text(encoding="utf-8")
    text, healed = heal_markdown_image_paths(text, md_path)
    if healed:
        md_path.write_text(text, encoding="utf-8")
        print(f"[ok] Auto-fixed {healed} relative image path(s) in {md_path} for Markdown preview")
    text = strip_comments(text)
    text = anchors_to_heading_ids(text)
    text = size_images(text, md_path)

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        text, rendered, failed = render_mermaid(text, tmpdir, mmdc)
        tmp_md = tmpdir / "srs.md"
        tmp_md.write_text(text, encoding="utf-8")

        cmd = [pandoc, str(tmp_md), "-f", "markdown-raw_html+pipe_tables+header_attributes+link_attributes",
               "-t", "docx", "-o", str(out_path),
               "--resource-path", os.pathsep.join([str(md_path.resolve().parent), str(tmpdir)])]
        ref = Path(args.reference_doc) if args.reference_doc else DEFAULT_REFERENCE
        if ref.is_file():
            cmd += ["--reference-doc", str(ref)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            sys.exit(f"[error] pandoc failed:\n{res.stderr}")
        for line in res.stderr.splitlines():
            print(f"[pandoc] {line}", file=sys.stderr)

    print(f"[ok] Word file: {out_path}")
    print(f"[ok] Diagrams rendered as images: {rendered}")
    if failed:
        print(f"[warn] Diagrams left as code: {failed}")


if __name__ == "__main__":
    main()
