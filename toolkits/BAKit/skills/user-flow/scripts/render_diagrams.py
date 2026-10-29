#!/usr/bin/env python3
"""
Render every Mermaid diagram of a Markdown file and add a "Xem ảnh lớn" line under each one.

Usage:
  python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md
  python .agents/skills/user-flow/scripts/render_diagrams.py <file.md> [--out-dir DIR] [--no-render]

For each ```mermaid block:
  - the diagram id is taken from the <a id="..."></a> anchor just above the block
    (uf-edit-001, act-edit-001, feature-map…); without an anchor, <file-stem>-diagram-<n> is used;
  - <out-dir>/<id>.svg and <out-dir>/<id>.png are rendered with mermaid-cli (mmdc);
  - the line right under the block becomes:
      [Xem ảnh lớn](BA/diagrams/<id>.svg) · [Mở trên mermaid.live](https://mermaid.live/view#pako:…)
    (replaced on every run, so the script is safe to run again after edits).
Default out-dir: <folder of the .md>/BA/diagrams. The .md file is updated in place.

Requirements: mermaid-cli for the images (npm i -g @mermaid-js/mermaid-cli). Without it, only the
mermaid.live link is written. If mmdc cannot find a browser, set PUPPETEER_EXECUTABLE_PATH.
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

BLOCK_RE = re.compile(r"```mermaid[^\n]*\n(.*?)\n```", re.S)
ANCHOR_RE = re.compile(r'<a id="([^"]+)"></a>\s*$')
LINK_PREFIXES = ("[Xem ảnh lớn]", "[Mở trên mermaid.live]")
MERMAID_SCALE = 2


def find_mmdc():
    return shutil.which("mmdc") or shutil.which("mmdc.cmd")


def live_url(code: str) -> str:
    state = {"code": code, "mermaid": json.dumps({"theme": "default"}, indent=2),
             "autoSync": True, "updateDiagram": True}
    raw = json.dumps(state, ensure_ascii=False).encode("utf-8")
    packed = base64.urlsafe_b64encode(zlib.compress(raw, 9)).decode("ascii").rstrip("=")
    return f"https://mermaid.live/view#pako:{packed}"


def render(code: str, out_file: Path, mmdc: str) -> bool:
    """Render one diagram to .svg or .png (by extension). Returns True on success."""
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        src = tmp / "d.mmd"
        src.write_text(code, encoding="utf-8")
        cfg = {"args": ["--no-sandbox", "--disable-setuid-sandbox"]}
        if os.environ.get("PUPPETEER_EXECUTABLE_PATH"):
            cfg["executablePath"] = os.environ["PUPPETEER_EXECUTABLE_PATH"]
        pcfg = tmp / "puppeteer.json"
        pcfg.write_text(json.dumps(cfg), encoding="utf-8")
        cmd = [mmdc, "-i", str(src), "-o", str(out_file), "-b", "white", "-p", str(pcfg)]
        if out_file.suffix == ".png":
            cmd += ["-s", str(MERMAID_SCALE)]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=180)
            return True
        except subprocess.CalledProcessError as e:
            msg = (e.stderr or b"").decode("utf-8", "replace").strip().splitlines()
            print(f"[warn] {out_file.name}: {msg[0] if msg else e}", file=sys.stderr)
        except Exception as e:
            print(f"[warn] {out_file.name}: {e}", file=sys.stderr)
    return False


def iter_blocks(text: str):
    """Yield (match, diagram_id or None) for every mermaid block."""
    for m in BLOCK_RE.finditer(text):
        before = text[:m.start()].rstrip("\n").splitlines()[-3:]
        did = None
        for line in reversed(before):
            a = ANCHOR_RE.search(line.strip())
            if a:
                did = a.group(1)
                break
            if line.strip():
                break
        yield m, did


def main():
    ap = argparse.ArgumentParser(description="Render Mermaid diagrams and add 'Xem ảnh lớn' links.")
    ap.add_argument("input")
    ap.add_argument("--out-dir", help="Folder for .svg/.png (default: <md folder>/BA/diagrams)")
    ap.add_argument("--no-render", action="store_true", help="Only write mermaid.live links")
    args = ap.parse_args()

    md = Path(args.input)
    if not md.is_file():
        sys.exit(f"[error] File not found: {md}")
    out_dir = Path(args.out_dir) if args.out_dir else md.parent / "BA" / "diagrams"
    mmdc = None if args.no_render else find_mmdc()
    if not args.no_render and not mmdc:
        print("[warn] mermaid-cli (mmdc) not found: only mermaid.live links will be written. "
              "Install: npm i -g @mermaid-js/mermaid-cli", file=sys.stderr)

    text = md.read_text(encoding="utf-8")
    out, last, n, rendered = [], 0, 0, 0
    for m, did in iter_blocks(text):
        n += 1
        did = did or f"{md.stem}-diagram-{n}"
        code = m.group(1)
        out.append(text[last:m.end()])
        # skip an existing link line right after the block
        rest = text[m.end():]
        skip = re.match(r"\n*(\[(?:Xem ảnh lớn|Mở trên mermaid\.live)\][^\n]*)\n?", rest)
        last = m.end() + (skip.end() if skip else 0)

        links = []
        if mmdc:
            svg, png = out_dir / f"{did}.svg", out_dir / f"{did}.png"
            ok = render(code, svg, mmdc) and render(code, png, mmdc)
            if ok:
                rendered += 1
                rel = os.path.relpath(svg, md.parent).replace(os.sep, "/")
                links.append(f"[Xem ảnh lớn]({rel})")
        links.append(f"[Mở trên mermaid.live]({live_url(code)})")
        out.append("\n\n" + " · ".join(links) + "\n")
    out.append(text[last:])
    new_text = "".join(out)
    new_text = re.sub(r"\n{3,}", "\n\n", new_text)
    md.write_text(new_text, encoding="utf-8")
    print(f"[ok] {n} diagram(s) found, {rendered} rendered to {out_dir}")


if __name__ == "__main__":
    main()
