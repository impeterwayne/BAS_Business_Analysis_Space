# Style guide (the house design system)

The kit has ONE visual style, encoded as tokens in `src/theme.mjs` and applied through themed
creators. **Use the themed creators — don't hand-pick colors.** That's how every diagram inherits
the same polished look instead of drifting.

## The look (what makes it good)
- **Pale, theme-aware tints.** Frames use `light-dark(#…,#…)` pairs that are *barely tinted*, so the
  diagram reads cleanly in BOTH light and dark mode. The strong color comes from the **AWS icons**,
  not the frames.
- **Per-stage tint, not rainbow.** A pipeline's stages take a cohesive progression
  (green → orange → amber → purple). That's ordered + meaningful, not garish. Avoid saturated fills,
  a different color on every box, or color with no meaning.
- **Clean 2px edges**, orthogonal, with a `light-dark` label background. Main flow is **animated**
  (`flowAnimation`); fan-out/in are sharp combs.
- **Square frames** (AWS convention). Icons carry category color and keep it (never recolor).

## Themed creators (`src/layout-engine.mjs`)
| Creator | Use for | Token |
| --- | --- | --- |
| `stage(id, i, title, children)` | a pipeline layer/column (i = 0-based stage index) | `THEME.stages[i]` (pale per-stage tint) |
| `band(id, title, children)` | a cross-cutting band (governance/security/ops) | `THEME.band` (neutral) |
| `endpoint(id, label)` | source / consumer card (diagram entry/exit) | `THEME.endpoint` (pale blue) |
| `ossBox(id, label)` | a plain OSS/component box | `THEME.base` (theme-aware white) |
| `onpremFrame(id, title, children)` | on-premise / external site frame | `THEME.onprem` |
| `frame` / `group` (AWS stencil) | Region/VPC/AZ/Subnet/account containers | the stencil's own light fill |

Edges: `d.link(a, b, label)` already applies the 2px theme-aware edge style. Add `{ flow: true }`
for animated main-flow edges, `{ dash: true }` for sync/DR/policy.

## Rules of thumb
1. Reach for a **themed creator** first; pass an explicit `fill` only for a deliberate one-off.
2. Let **icons** be the color; keep **frames pale**.
3. Animate only the **main flow** (a few spine edges), not every edge.
4. To retheme the whole kit, edit `src/theme.mjs` — every diagram updates at once.
