#!/usr/bin/env python3
"""Auto-layout a logical graph into draw.io XML using Graphviz.

Minimal layout pass for the drawio skill: takes a graph (nodes + edges as
JSON), runs `dot` to position the nodes, and emits a .drawio file with the
mxGeometry x/y filled in and dot's orthogonal edge routes replayed as waypoints.
This removes the manual-coordinate ceiling for medium/large diagrams.

`--tune` lays the graph out both directions (TB and LR) and keeps the one with
the lower `route_score` (edges-through-nodes and crossings, length as tiebreak).

Input JSON:
  {
    "direction": "TB",          # TB (top-bottom, default) or LR (left-right)
    "nodes": [
      {"id": "a", "label": "Service A", "style": "rounded=1;...",
       "width": 120, "height": 60}
    ],
    "edges": [
      {"source": "a", "target": "b", "label": "calls"}
    ]
  }
Only "id" is required per node; label defaults to id and style/width/height
have defaults. Node ids must be unique and must not be "0" or "1" (reserved
for the draw.io root cells). Requires Graphviz `dot` on PATH.

Usage: python3 autolayout.py graph.json [-o diagram.drawio]
"""
import argparse
import json
import os
import shlex
import subprocess
import sys
from xml.sax.saxutils import escape

DEFAULT_W, DEFAULT_H = 120, 60
NODE_STYLE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
EDGE_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=auto;"
GROUP_STYLE = ("rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#999999;"
               "verticalAlign=top;fontStyle=2;dashed=1;")
# Group colours come from the skill's own palette (styles/built-in/default.json)
# so there is a single source of truth, not a second list baked in here. When a
# grouped graph is laid out, each top-level group takes the next colour (cycled
# in a fixed, harmonious role order) so related modules read as a coloured
# cluster. Nodes that carry their own `style` keep it; only styleless grouped
# nodes are tinted. Disable with --mono.
_PALETTE_ORDER = ["primary", "success", "accent", "secondary", "warning", "danger", "neutral"]
_PALETTE_FILE = os.path.join(os.path.dirname(__file__), "..", "styles", "built-in", "default.json")
_FALLBACK_PALETTE = [("#dae8fc", "#6c8ebf"), ("#d5e8d4", "#82b366"), ("#ffe6cc", "#d79b00"),
                     ("#e1d5e7", "#9673a6"), ("#fff2cc", "#d6b656"), ("#f8cecc", "#b85450")]


def load_palette():
    """Ordered (fill, stroke) list from the default preset's palette; fall back
    to the same colours inline if the preset file can't be read."""
    try:
        with open(_PALETTE_FILE, encoding="utf-8") as fh:
            pal = json.load(fh)["palette"]
        colors = [(pal[r]["fillColor"], pal[r]["strokeColor"]) for r in _PALETTE_ORDER if r in pal]
        if colors:
            return colors
    except (OSError, KeyError, ValueError):
        pass
    return _FALLBACK_PALETTE


PALETTE = load_palette()
# Uniform container padding; the title sits in the top pad (verticalAlign=top).
# dot's cluster margin is set to this same value so each container box equals
# dot's cluster box — which dot guarantees never overlaps, at any nesting depth.
GROUP_PAD = 24


def attr(value):
    return escape(str(value), {'"': "&quot;"})


def dot_quote(value):
    # Wrap as a DOT double-quoted string, escaping backslash and quote so ids
    # with those characters can't corrupt the Graphviz input.
    return '"' + str(value).replace("\\", "\\\\").replace('"', '\\"') + '"'


def snap(value, grid=10):
    # Align to the grid the skill uses everywhere (multiples of 10).
    return int(round(value / grid) * grid)


def _clean_route(pts):
    """Tidy replayed dot waypoints: drop consecutive duplicates and collapse
    collinear midpoints. dot's `splines=ortho` emits repeated/near-identical
    control points that, once grid-snapped, become zero-length or tiny-step
    segments — the "jagged" look. After this, a straight run is a single segment.
    """
    out = []
    for p in pts:
        if not out or p != out[-1]:                      # dedup consecutive
            out.append(p)
    i = 1
    while i < len(out) - 1:                              # drop collinear middle point
        a, b, c = out[i - 1], out[i], out[i + 1]
        if (a[0] == b[0] == c[0]) or (a[1] == b[1] == c[1]):
            del out[i]
        else:
            i += 1
    return out


def normalize_icon_sizes(graph):
    """Force icon nodes square — the ROOT fix for arrows missing the icon.

    A cell's geometry is what edges attach to, but the VISIBLE icon differs when
    the cell isn't square: stencil shapes (mxgraph.*) stretch into rectangles,
    image icons (aspect=fixed) shrink to min(w,h) centred in side padding — so
    arrows land on empty padding. Clamp both dims to min(w,h) so cell == icon;
    label room comes from ranksep/nodesep, not a wider box. Mutates + returns graph.
    """
    for node in graph.get("nodes", []):
        style = node.get("style", "")
        if "aspect=fixed" in style or "shape=mxgraph" in style:
            w, h = node.get("width", DEFAULT_W), node.get("height", DEFAULT_H)
            if w != h:
                node["width"] = node["height"] = min(w, h)
    return graph


def group_tree(nodes):
    """Parse hierarchical `group` paths ("a/b") into a container tree.

    Returns (gpath, direct, children, ordered):
      gpath[node_id] = tuple of path segments (the node's deepest container)
      direct[path]   = node ids whose group is exactly this path
      children[path] = child container paths
      ordered        = all container paths, shallow-to-deep (stable)
    """
    gpath, direct, paths = {}, {}, set()
    for node in nodes:
        g = node.get("group")
        if g is None or str(g).strip("/") == "":
            continue
        t = tuple(str(g).strip("/").split("/"))
        gpath[node["id"]] = t
        direct.setdefault(t, []).append(node["id"])
        for k in range(1, len(t) + 1):
            paths.add(t[:k])
    children = {}
    for p in sorted(paths):
        if len(p) > 1:
            children.setdefault(p[:-1], []).append(p)
    ordered = sorted(paths, key=lambda p: (len(p), p))
    return gpath, direct, children, ordered


def build_dot(graph):
    rankdir = "LR" if str(graph.get("direction", "TB")).upper() == "LR" else "TB"
    # splines=ortho makes dot route edges as orthogonal polylines; we replay
    # those bends as draw.io waypoints so edges go around nodes, not through them.
    # ranksep/nodesep reserve gap for the below-node labels (drawn OUTSIDE the
    # fixed-size box) so neighbours don't collide with each other's label text.
    lines = [f"digraph G {{ rankdir={rankdir}; splines=ortho; ranksep=0.7; nodesep=0.6; "
             "node [shape=box fixedsize=true];"]
    # Group nodes into (possibly nested) clusters so dot keeps each group
    # together; a node's first appearance fixes its cluster, so list members
    # before the size attributes. The cluster margin reserves room for the
    # padded container boxes we draw below (extra on Y for the title strip) so
    # neighbouring boxes do not overlap.
    _, direct, children, ordered = group_tree(graph["nodes"])
    cidx = {p: i for i, p in enumerate(ordered)}

    def emit_cluster(p, pad):
        lines.append(f'{pad}subgraph cluster_{cidx[p]} {{ margin={GROUP_PAD};')
        for c in children.get(p, []):
            emit_cluster(c, pad + "  ")
        lines.extend(f'{pad}  {dot_quote(m)};' for m in direct.get(p, []))
        lines.append(pad + "}")

    for root in [p for p in ordered if len(p) == 1]:
        emit_cluster(root, "")
    for node in graph["nodes"]:
        # Pass our pixel sizes to dot as inches so it lays out at the real size.
        w = node.get("width", DEFAULT_W) / 72.0
        h = node.get("height", DEFAULT_H) / 72.0
        lines.append(f'{dot_quote(node["id"])} [width={w:.4f} height={h:.4f}];')
    for edge in graph.get("edges", []):
        lines.append(f'{dot_quote(edge["source"])} -> {dot_quote(edge["target"])};')
    lines.append("}")
    return "\n".join(lines)


def layout(dot_src):
    """Run `dot -Tplain`; return (height_in, {id: (xc, yc)}, {(src, dst): [route, ...]}).

    Node coords are inches (bottom-left origin); each edge key maps to the LIST
    of routes dot computed, one per parallel edge in input order (a plain dict
    value silently collapsed duplicate source→target edges onto one route).
    Each route is a list of orthogonal control points, endpoints included.
    """
    try:
        proc = subprocess.run(
            ["dot", "-Tplain"], input=dot_src,
            capture_output=True, text=True, check=True,
        )
    except FileNotFoundError:
        sys.exit("error: Graphviz `dot` not found on PATH (brew install graphviz)")
    except subprocess.CalledProcessError as exc:
        sys.exit(f"error: dot failed: {exc.stderr.strip()}")
    height, pos, edges = 0.0, {}, {}
    for line in proc.stdout.splitlines():
        tok = shlex.split(line)
        if not tok:
            continue
        if tok[0] == "graph":
            height = float(tok[3])                        # graph scale width height
        elif tok[0] == "node":
            pos[tok[1]] = (float(tok[2]), float(tok[3]))  # node name x y ...
        elif tok[0] == "edge":                            # edge tail head n x1 y1 ... xn yn
            n = int(tok[3])
            edges.setdefault((tok[1], tok[2]), []).append(
                [(float(tok[4 + 2 * i]), float(tok[5 + 2 * i])) for i in range(n)]
            )
    return height, pos, edges


def _route_for(edge_pts, seen, edge):
    """Pop the next route for this (source, target) pair, FIFO over duplicates
    so two parallel a→b edges each keep their own dot route."""
    key = (edge["source"], edge["target"])
    k = seen.get(key, 0)
    seen[key] = k + 1
    routes = edge_pts.get(key) or []
    return routes[min(k, len(routes) - 1)] if routes else None


# --- routing geometry + readability score -----------------------------------
# These operate on the dot layout (node rects + edge polylines) so a route can
# be scored BEFORE it is written. The predicates are deliberately self-contained
# (no numpy) and the score mirrors what the visual self-check would penalise:
# an edge passing through an unrelated node, and two edges crossing.

def _orient(a, b, c):
    # >0 = c left of a->b, <0 = right, 0 = collinear.
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def segments_cross(p1, p2, p3, p4):
    """True iff segment p1p2 *properly* crosses p3p4 (a shared endpoint alone,
    e.g. two edges meeting at a node, does not count)."""
    d1, d2 = _orient(p3, p4, p1), _orient(p3, p4, p2)
    d3, d4 = _orient(p1, p2, p3), _orient(p1, p2, p4)
    return (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0)


def _point_in_rect(p, box, eps=1e-6):
    x, y, w, h = box
    return x - eps <= p[0] <= x + w + eps and y - eps <= p[1] <= y + h + eps


def route_hits_rect(points, box):
    """True if the polyline enters rect box: a vertex inside, or a segment
    crossing any of the rect's four edges."""
    if any(_point_in_rect(p, box) for p in points):
        return True
    x, y, w, h = box
    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    redges = [(corners[i], corners[(i + 1) % 4]) for i in range(4)]
    return any(segments_cross(a, b, c, d)
               for a, b in zip(points, points[1:]) for c, d in redges)


def routes_cross(pa, pb):
    """True if two polylines properly cross anywhere."""
    return any(segments_cross(a, b, c, d)
               for a, b in zip(pa, pa[1:]) for c, d in zip(pb, pb[1:]))


def route_score(graph, height, pos, edge_pts):
    """Readability score for one dot layout (lower is better): weighted count of
    edge-through-node hits and edge-edge crossings, with total edge length as a
    tiebreak. Works in dot pixel space (x*72, y flipped) so rects and routes are
    comparable. Used by --tune to pick the more readable of two directions."""
    rects = {}
    for node in graph["nodes"]:
        nid = node["id"]
        if nid in pos:
            w, h = node.get("width", DEFAULT_W), node.get("height", DEFAULT_H)
            xc, yc = pos[nid]
            rects[nid] = (xc * 72 - w / 2, (height - yc) * 72 - h / 2, w, h)
    routes, seen = [], {}
    for edge in graph.get("edges", []):
        pts = _route_for(edge_pts, seen, edge)
        if pts:
            routes.append(([(x * 72, (height - y) * 72) for x, y in pts],
                           {edge["source"], edge["target"]}))
    through = sum(1 for pts, ends in routes for nid, box in rects.items()
                  if nid not in ends and route_hits_rect(pts, box))
    cross = sum(1 for i in range(len(routes)) for j in range(i + 1, len(routes))
                if routes_cross(routes[i][0], routes[j][0]))
    length = sum(abs(b[0] - a[0]) + abs(b[1] - a[1])
                 for pts, _ in routes for a, b in zip(pts, pts[1:]))
    return 20 * through + 10 * cross + length / 100000


def group_style(stroke):
    """Container box styled with a group's colour (coloured border + title)."""
    return (f"rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor={stroke};"
            f"fontColor={stroke};verticalAlign=top;fontStyle=2;dashed=1;")


def to_drawio(graph, height, pos, edge_pts, color=True):
    nodes = graph["nodes"]
    # Absolute snapped rect for every placed node.
    rects = {}
    for node in nodes:
        nid = node["id"]
        if nid not in pos:
            continue
        w, h = node.get("width", DEFAULT_W), node.get("height", DEFAULT_H)
        xc, yc = pos[nid]
        x = snap(xc * 72 - w / 2)
        y = snap((height - yc) * 72 - h / 2)             # flip: dot origin is bottom-left
        rects[nid] = (x, y, w, h)
    # Parse the (possibly nested) group tree and assign each container a
    # collision-free id and a title (the path's last segment, or a member's groupLabel).
    gpath, direct, children, ordered = group_tree(nodes)
    # Assign each top-level group a palette colour, in order of first appearance.
    top_order = []
    for node in nodes:
        t = gpath.get(node["id"])
        if t and t[0] not in top_order:
            top_order.append(t[0])

    def gcolor(seg):
        return PALETTE[top_order.index(seg) % len(PALETTE)]

    used = {n["id"] for n in nodes}
    label_override = {}
    for node in nodes:
        if node["id"] in gpath and "groupLabel" in node:
            label_override.setdefault(gpath[node["id"]], str(node["groupLabel"]))
    gid, glabel = {}, {}
    for i, p in enumerate(ordered):
        cid = f"group_{i}"
        while cid in used:                               # never collide with a node id
            cid += "_"
        used.add(cid)
        gid[p] = cid
        glabel[p] = label_override.get(p, p[-1])
    # Container bounding box (members + nested children + uniform padding),
    # computed deepest-first so a parent can wrap its already-sized children.
    gbox = {}
    for p in sorted(ordered, key=len, reverse=True):
        xs = [(rects[m][0], rects[m][1], rects[m][0] + rects[m][2], rects[m][1] + rects[m][3])
              for m in direct.get(p, []) if m in rects]
        xs += [(gbox[c][0], gbox[c][1], gbox[c][0] + gbox[c][2], gbox[c][1] + gbox[c][3])
               for c in children.get(p, []) if c in gbox]
        if not xs:
            continue
        x0 = min(b[0] for b in xs) - GROUP_PAD
        y0 = min(b[1] for b in xs) - GROUP_PAD
        x1 = max(b[2] for b in xs) + GROUP_PAD
        y1 = max(b[3] for b in xs) + GROUP_PAD
        gbox[p] = (x0, y0, x1 - x0, y1 - y0)

    # Shift everything positive: a container's top padding can push its top edge
    # above the page origin. Only translates when something would be negative.
    absx = [r[0] for r in rects.values()] + [b[0] for b in gbox.values()]
    absy = [r[1] for r in rects.values()] + [b[1] for b in gbox.values()]
    dx = GROUP_PAD - min(absx) if absx and min(absx) < 0 else 0
    dy = GROUP_PAD - min(absy) if absy and min(absy) < 0 else 0

    def rebase(x, y, parent_path):
        """Absolute -> coordinates relative to parent_path's box (or shifted if top-level)."""
        if parent_path is None:
            return x + dx, y + dy, "1"
        px, py, _, _ = gbox[parent_path]
        return x - px, y - py, gid[parent_path]

    cells = []
    # Containers shallow-first so each parent precedes its children.
    for p in ordered:
        if p not in gbox:
            continue
        gx, gy, gw, gh = gbox[p]
        x, y, parent = rebase(gx, gy, p[:-1] if len(p) > 1 else None)
        gstyle = group_style(gcolor(p[0])[1]) if color else GROUP_STYLE
        cells.append(
            f'        <mxCell id="{attr(gid[p])}" value="{attr(glabel[p])}" '
            f'style="{gstyle}" vertex="1" parent="{attr(parent)}">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{gw}" height="{gh}" as="geometry"/>\n'
            f"        </mxCell>"
        )
    for node in nodes:
        nid = node["id"]
        if nid not in rects:
            continue
        rx, ry, w, h = rects[nid]
        x, y, parent = rebase(rx, ry, gpath.get(nid) if gpath.get(nid) in gbox else None)
        if node.get("style"):
            style = node["style"]                         # explicit style always wins
        elif color and nid in gpath:
            fill, stroke = gcolor(gpath[nid][0])          # tint styleless nodes by group
            style = f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
        else:
            style = NODE_STYLE
        cells.append(
            f'        <mxCell id="{attr(nid)}" value="{attr(node.get("label", nid))}" '
            f'style="{attr(style)}" vertex="1" parent="{attr(parent)}">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f"        </mxCell>"
        )
    seen = {}
    for i, edge in enumerate(graph.get("edges", [])):
        # Drop the first/last points (they sit on the node borders, where
        # draw.io attaches anyway), snap + tidy the interior bends, and replay
        # them as waypoints (orthogonalEdgeStyle squares off the entry/exit).
        raw = (_route_for(edge_pts, seen, edge) or [])[1:-1]
        interior = _clean_route([(snap(x * 72) + dx, snap((height - y) * 72) + dy)
                                 for x, y in raw])
        if interior:
            points = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in interior)
            geom = (f'<mxGeometry relative="1" as="geometry">'
                    f'<Array as="points">{points}</Array></mxGeometry>')
        else:
            geom = '<mxGeometry relative="1" as="geometry"/>'
        cells.append(
            f'        <mxCell id="e{i}" value="{attr(edge.get("label", ""))}" '
            f'style="{EDGE_STYLE}" edge="1" parent="1" '
            f'source="{attr(edge["source"])}" target="{attr(edge["target"])}">\n'
            f"          {geom}\n"
            f"        </mxCell>"
        )
    return (
        '<mxfile>\n  <diagram id="autolayout" name="Page-1">\n'
        '    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" '
        'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        'pageWidth="850" pageHeight="1100" math="0" shadow="0">\n'
        "      <root>\n"
        '        <mxCell id="0"/>\n'
        '        <mxCell id="1" parent="0"/>\n'
        + "\n".join(cells)
        + "\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n"
    )


def _selftest():
    """Runnable check for the geometry predicates + route_score — needs no dot."""
    assert segments_cross((0, 0), (10, 10), (0, 10), (10, 0))          # X
    assert not segments_cross((0, 0), (10, 0), (0, 5), (10, 5))        # parallel
    assert not segments_cross((0, 0), (10, 0), (10, 0), (20, 0))       # shared endpoint only
    box = (40, 40, 20, 20)                                            # covers 40..60
    assert route_hits_rect([(0, 50), (100, 50)], box)                 # straight through
    assert not route_hits_rect([(0, 0), (100, 0)], box)               # misses
    assert route_hits_rect([(50, 50), (200, 200)], box)               # vertex inside
    assert routes_cross([(0, 0), (10, 10)], [(0, 10), (10, 0)])
    assert not routes_cross([(0, 0), (10, 0)], [(0, 5), (10, 5)])
    # _clean_route drops duplicates + collinear midpoints -> clean single runs.
    assert _clean_route([(0, 0), (0, 0), (0, 10), (0, 20), (10, 20)]) == [(0, 0), (0, 20), (10, 20)]
    assert _clean_route([(370, 260), (370, 260), (370, 260), (370, 340)]) == [(370, 260), (370, 340)]
    # normalize_icon_sizes squares icon nodes (cell == visible icon, arrows attach
    # on the icon); plain boxes keep their size.
    g = normalize_icon_sizes({"nodes": [
        {"id": "i", "style": "aspect=fixed;shape=mxgraph.aws4.resourceIcon;", "width": 130, "height": 76},
        {"id": "s", "style": "shape=mxgraph.aws4.cognito;", "width": 130, "height": 76},
        {"id": "b", "width": 130, "height": 76},
    ]})
    assert g["nodes"][0]["width"] == g["nodes"][0]["height"] == 76
    assert g["nodes"][1]["width"] == g["nodes"][1]["height"] == 76
    assert g["nodes"][2]["width"] == 130 and g["nodes"][2]["height"] == 76
    # route_score: an a->b edge that pierces unrelated node c costs >=20; a
    # detour around c costs only its (small) length term, so it must score lower.
    g = {"nodes": [{"id": "a"}, {"id": "b"}, {"id": "c"}],
         "edges": [{"source": "a", "target": "b"}]}
    H, pos = 10.0, {"a": (1, 5), "b": (9, 5), "c": (5, 5)}
    s_through = route_score(g, H, pos, {("a", "b"): [[(1, 5), (9, 5)]]})
    s_around = route_score(g, H, pos, {("a", "b"): [[(1, 5), (5, 8), (9, 5)]]})
    assert s_through >= 20, s_through
    assert s_around < s_through, (s_around, s_through)
    # parallel duplicate edges: each occurrence pops ITS OWN route (FIFO), so two
    # a->b edges don't collapse onto one overlapping route.
    ep = {("a", "b"): [[(1, 5), (9, 5)], [(1, 5), (5, 8), (9, 5)]]}
    seen = {}
    e = {"source": "a", "target": "b"}
    assert _route_for(ep, seen, e) == [(1, 5), (9, 5)]
    assert _route_for(ep, seen, e) == [(1, 5), (5, 8), (9, 5)]
    assert _route_for(ep, seen, e) == [(1, 5), (5, 8), (9, 5)]   # extra dup reuses last
    assert _route_for(ep, {}, {"source": "x", "target": "y"}) is None
    # and route_score counts BOTH duplicates (only one of the two pierces c).
    g2 = dict(g, edges=[e, dict(e)])
    s2 = route_score(g2, H, pos, ep)
    assert 20 <= s2 < 40, s2
    print("autolayout selftest: OK")


def main():
    ap = argparse.ArgumentParser(description="Auto-layout a graph JSON into draw.io XML.")
    ap.add_argument("input", nargs="?", help="graph JSON file")
    ap.add_argument("-o", "--output", help="output .drawio path (default: stdout)")
    ap.add_argument("--mono", action="store_true",
                    help="don't colour groups by palette (monochrome boxes)")
    ap.add_argument("--tune", action="store_true",
                    help="lay out both TB and LR, keep the lower route_score")
    ap.add_argument("--selftest", action="store_true",
                    help="run geometry/score self-checks and exit (no dot needed)")
    args = ap.parse_args()
    if args.selftest:
        _selftest()
        return
    if not args.input:
        ap.error("input is required (or pass --selftest)")
    with open(args.input, encoding="utf-8") as f:
        graph = normalize_icon_sizes(json.load(f))
    if args.tune:
        best = None
        for d in ("TB", "LR"):
            cand = dict(graph, direction=d)
            h, p, ep = layout(build_dot(cand))
            s = route_score(cand, h, p, ep)
            if best is None or s < best[0]:
                best = (s, d, h, p, ep)
        _, d, height, pos, edge_pts = best
        graph = dict(graph, direction=d)
        print(f"tuned: direction={d} (route_score {best[0]:.2f})", file=sys.stderr)
    else:
        height, pos, edge_pts = layout(build_dot(graph))
    xml = to_drawio(graph, height, pos, edge_pts, color=not args.mono)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(xml)
        print(f"wrote {args.output} ({len(graph['nodes'])} nodes, "
              f"{len(graph.get('edges', []))} edges)", file=sys.stderr)
    else:
        sys.stdout.write(xml)


if __name__ == "__main__":
    main()
