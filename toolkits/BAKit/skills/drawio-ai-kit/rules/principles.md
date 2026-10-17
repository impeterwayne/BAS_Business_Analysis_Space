# Principles for beautiful draw.io diagrams (AWS & system architecture)

Goal: the AI produces draw.io XML with **correct stencil names**, **clean layout**, and a **readable flow** on the first try.

## 0. Mandatory workflow for the AI

0. **Match a template first.** If the request fits an archetype with a template (`diagram-types.md` → "Templates"), open that `examples/<domain>/*.mjs` (grouped `aws/`·`azure/`·`gcp/`·`multicloud/`·`bpmn/`; see `examples/README.md`), reproduce its structure, and run the **Reproduction loop** (match → build → validate → conform-to-checklist → fix, repeat). Don't free-hand a pattern a template already encodes.
1. **Look up every icon via `search_icon`** — do NOT recall or invent stencil names. Paste the exact `style` string returned.
2. Build the XML following the grid and rules below.
3. **Call `validate_diagram`** before returning the result. If there are stencil `errors`/`warnings`, fix and re-validate.

## 1. Grid, alignment & sizing

- Prioritize **relative alignment over absolute grid**: nodes in the same row share one `y`, nodes in the same column share one `x`. (Exact multiples of 10 matter less than things lining up with each other.)
- **Sibling blocks placed side by side must be the SAME HEIGHT** — container frames in a `row` share a common top *and* bottom edge (a shorter block is padded, not left short). The layout engine enforces this automatically (row-sibling `group`/`frame`/`grid`/`pool` children stretch to the tallest); if you hand-place, match their heights yourself. (Leaf icons/boxes keep their natural size, top-aligned.)
- Standard icon size: pick **one** size and reuse it — **78×78** for primary services, 48×48 for compact. Do NOT mix many icon widths in one diagram.
- Minimum spacing between icons: **80px horizontal**, **90px vertical** (leave room for the label under the icon).
- Keep node sizes consistent; avoid one oversized box dominating. **Do not stretch a giant full-width banner** — size elements to their content.
- Resource icons **must** include `aspect=fixed` so they don't distort on resize.

## 2. Flow direction

- Default **left → right** for data pipelines / request flows; **top → bottom** for tiered layering.
- Keep one consistent direction; avoid back-pointing arrows unless they represent feedback/sync (use dashed lines).

## 3. Group with official containers

- Use real AWS **group shapes** (`search_icon --kind group`): `group_aws_cloud_alt`, `group_region`, `group_vpc`, `group_availability_zone`, `group_security_group`, `group_public_subnet`/`group_private_subnet`...
- Nest in the real order: **AWS Cloud → Region → VPC → AZ → Subnet → Security Group**.
- Group frames use `verticalAlign=top;align=left;spacingLeft=30` so the label sits next to the corner icon.
- Declare containers **first** (lower z-index) so they sit beneath their child icons.

## 4. Color — restrained & theme-aware

- Icons keep their **category** color (Compute orange, Storage green, Database pink, Security red, Networking purple, Management magenta...). `search_icon` returns the correct one. Don't recolor icons arbitrarily.
- For **backgrounds/frames/notes**, use a **small cohesive palette** — a few neutral greys plus one or two soft accents. Do NOT scatter many ad-hoc pastel fills (palette sprawl reads as noise). Target ≤ ~8 distinct fill colors per diagram.
- **Pipeline/stage layers MAY carry a soft tint per stage** — the classic pale progression (light green → amber → yellow → purple) reads as ordered stages and looks good *when the tints are pale and cohesive*. That is desirable, not "rainbow". What to avoid is the **garish** look: saturated/clashing fills, a different colour on every small box, or colour with no meaning. For non-stage containers (Region/VPC/account), neutral grey or the AWS group stencil's own light fill is safest — let the service icons carry most of the colour.
- Prefer theme-aware tokens like `fillColor=light-dark(#fbe7d4, #3a2a16)` for backgrounds/accents so the diagram looks right in **both light and dark mode**.
- Reserve strong color for emphasis/notes (e.g. a red `#f8cecc` note box), not for every box. Use `fillOpacity` 20–40 on frames.

## 5. Labels & typography

- Service labels go **below the icon** (`verticalLabelPosition=bottom;verticalAlign=top`), kept short: service name + (role).
- **Limit to 3–4 font sizes** and keep label text **≤ 14px**; never jump to oversized (18+) titles inside the canvas — put a title in its own area.
- Long notes/constraints go in a separate **note box**, never crammed into the icon label.
- Third-party components (no AWS icon) → rounded box, clearly noting "(on EKS)"/"(on EC2)".

## 6. Edges — corner style and routing are *intentional*

- Base style: `edgeStyle=orthogonalEdgeStyle;html=1`.
- **Choose the corner by role, don't blanket-round everything:**
  - Sequential / pipeline flow → `rounded=1` (soft corners).
  - **Fan-out / bus / tree branches (one source → many targets) → `rounded=0`** (sharp right angles). This is the single biggest "looks hand-made vs auto" tell.
- **Pin connection points** (`exitX/exitY` + `entryX/entryY`) for parallel, fan-out, or bus edges so the lines leave/enter at aligned anchors instead of floating and wandering. (e.g. exit bottom-center = `exitX=0.5;exitY=1`.)
- Auto-route simple flows, but in **dense / error-handling diagrams add deliberate waypoints** to avoid line crossings and overlaps — don't rely purely on auto-route there.
- **Labels on bent (L/Z) edges:** a label defaults to the arc midpoint, which on a bent edge lands on the corner or against a box — looks off-center. Add **one waypoint at the centre of the corridor** between the two columns/rows so the perpendicular run is centred and the label sits cleanly on it (always with `labelBackgroundColor`). `validate_diagram` flags labelled bent edges that have no waypoint.
- **Solid** = primary data/control flow; **dashed** = sync/dependency/policy enforcement/lineage. Color edges by source layer to trace them.
- Double-headed arrows (`startArrow=block;endArrow=block`) for bidirectional links (Direct Connect, metadata sync).

## 7. Managed vs self-managed

- **AWS managed** services: use the AWS icon + (optional) a "▸ managed" label.
- OSS software running on EKS/EC2: use a text box, and optionally place it next to the EKS/EC2 icon to show where it runs.

## 8. Recommended overall layout

- Left: **sources/clients**. Center: the **AWS Cloud frame** holding the pipeline plus cross-cutting layers. Right: **consumer systems**.
- Cross-cutting layers (security, monitoring, governance, CI/CD) sit as their own band/column, connected with dashed lines to the relevant components.
- Hybrid/DR: place the other site as a separate block, connected through a Direct Connect node.

## 9. Self-check (before returning)

Run `validate_diagram` and clear both `errors`/`warnings` and the `audit.advice` list:

- [ ] Every `resIcon`/`grIcon` came from `search_icon` (validate reports no errors).
- [ ] No icon is missing `aspect=fixed`; one consistent icon size.
- [ ] All cell `id` values are unique — no two `mxCell` elements share the same `id` (validate now catches this as an error).
- [ ] No edge points to a non-existent id.
- [ ] Icon colors match their category; backgrounds use ≤ ~8 cohesive colors (consider `light-dark()`).
- [ ] ≤ 4 font sizes, no oversized (≥16) label text.
- [ ] Fan-out/bus edges use sharp corners (`rounded=0`) + pinned connection points.
- [ ] One consistent flow direction, edge labels are meaningful.
