---
trigger: always_on
---

# BA Workflow

How the agents, skills and slash commands chain from a reference app (or PO research) to one SRS file for Dev
and QA. Evidence-led and decision-aware: reference behaviour is never a target requirement until the PO says so,
and **no Use Case is written before the PO has answered the questions for its Figma section**.

## Toolchain

| Step | Lead agent | Skills | Command |
| :--- | :--- | :--- | :--- |
| 0. Competitor discovery (optional) | `ba-lead` → `code-scout`, `competitor-analyst`, `evidence-verifier` | `apk-code-index`, `competitor-app-analysis`, `mobilerun`, `ba-templates`, `apk-feature-extractor` | `/ba-competitor` |
| 1. Feature Checklist | `ba-lead` → `ba-spec-writer` / `ba-brainstormer` | `apk-feature-extractor` (APK decode output) or `research-feature-checklist` (PO research) | `/ba-checklist` |
| 2. Design reading | `ba-lead` → `figma-analyst` | `figma-ba-analysis` | `/ba-figma` |
| 3. PO gate | `ba-brainstormer` | `product-decision` (batch table), `brainstorm-features` (new idea) | — |
| 4. SRS writing | `ba-spec-writer` | `specs`, `use-case-writer`, `user-flow`, `mermaidjs-v11`, `ba-templates` | `/ba-spec` |
| 5. Review | `ba-spec-writer` | `BA-audit-SRS` (quick by default), `BA-audit-QnA` (full mode only) | `/ba-review` |
| 6. Word export (on request) | `ba-spec-writer` | `srs-export` | `/ba-export` |
| Research (any time, conditional) | `ba-researcher` | `problem-solving`, `sequential-thinking`, `document-extraction` | — |

## Steps

### 0. Competitor discovery (optional, in-workspace APK decoding & device walk)

When a competitor APK is decoded in BA Space (or connected on an Android device via `mobilerun`), `/ba-competitor <package> <flows> [--code-only]` runs `code-scout`, `competitor-analyst` (Hybrid device walk or Static `--code-only`), and `evidence-verifier` to generate `*_profile*.md`, `*_screens*.md`, `*_flow-*.md`, and `screens/` under `docs/BA/competitor/{app-slug}/`.

### 1. Feature Checklist

- **APK decode output** in `docs/BA/competitor/{app-slug}/` (`*_profile*`, `*_screens*`, `*_flow-*`) →
  `apk-feature-extractor`.
- **No APK** → `research-feature-checklist` from the PO's notes (`ba-brainstormer`).
- Rules: start from Home (no Splash / Language / Onboarding / first-launch permission / app-open ads); fill only
  `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng`.
- Output: `{app-slug}_checklist_{YYYYMMDD}_v{N}.md` + the same name `.xlsx`. Design works from it.

### 2. Design reading

The PO sends a **Figma section link**. `figma-analyst` reads it through `figma-mcp-android`: screens and states
(`screens/`), one image per interactive element (`elements/`), copy, prototype navigation, designed / missing
states → `docs/BA/figma/{feature}/`. Screenshots only (no Figma access) → saved to `screens/`, no element images.

### 3. PO gate — mandatory before any Use Case

`product-decision` (batch mode) sends the PO **one table in chat** for the section:

- **with APK evidence:** every conflict between Figma and the reference app logic, plus every hidden rule the
  design does not show, each with the APK value;
- **without APK evidence:** everything still needed to define the rules and the User Flow, with proposals.

Wait for the answers; ask again for empty rows; record them in `docs/BA/decisions/`. A new idea with no reference
at all goes through `brainstorm-features` first.

### 4. SRS writing

One living file, `docs/project-srs.md`, overwritten on every update (no change log):

1. Tổng quan sản phẩm (1 sentence) · 2. Sơ đồ tính năng (mindmap from the checklist) · 3. Global Business Rules
2. One section per Use Case: Trigger / Pre / Post → `.1` Đặc tả giao diện (screen grid 3 per row + element tables
   with element images) → `.2` User Flow (required) → `.3` Basic Flow → `.4` Alternative / `.5` Exceptional Flow
   (only when they exist) → `.6` Business Rules (one rule per row) → `.7` Activity Diagram (large features only).
3. One Use Case = one user goal (several screens), never one per screen; one User Flow per Use Case (user action →
   UI response).
4. Note/References are clickable links (`[BR-002](#br-002)`), comma-separated on one line.
5. After any diagram change, run `user-flow/scripts/render_diagrams.py` (SVG/PNG + "Xem ảnh lớn" links).
6. Nothing unanswered goes into the SRS: no Phạm vi, no Open Questions, no placeholders.

### 5. Review

`/ba-review` → quick audit in chat (verdict + findings table). Full scored audit with report file and question
backlog only when the user asks.

### 6. Word export — only on request

`/ba-export` → `docs/project-srs.docx` (Mulish 12pt, native headings, fixed column widths, images and diagrams
embedded). Never exported automatically.

## Source of truth

1. **PO answers** (decisions files) define hidden rules and every difference from the reference app.
2. **Figma** defines the visible UI only.
3. **APK evidence** explains the reference app and feeds the questions; `[Inferred]` stays an inference.
4. **Feature Checklist** defines scope and the feature tree.
5. **Research** offers options; it decides nothing.
6. When sources conflict or a behaviour is undecided, ask the PO; never invent a value.

## Hard constraints

1. **PO gate before writing.** No Use Case before the PO has answered the batch table of its Figma section.
2. **Continuous context.** Each step reads the previous step's files; it never redoes them.
3. **No reference-to-target assumption.** Never copy features, defaults, limits, navigation, ads or paywalls
   because the reference app has them.
4. **No fabricated requirements, images or links.**
5. **Markdown first.** Word only when the user asks.
6. **User controls transitions.** Do not auto-advance between steps; confirm with the user.
