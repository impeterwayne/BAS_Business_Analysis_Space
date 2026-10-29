# Analyze Workflow — /ba-spec analyze "feature"

Write or rewrite the Use Cases of one feature, normally one Figma section sent by the PO.

## Step 1 — Read the design

If no current Figma analysis exists for the section, run `/ba-figma` (`figma-analyst`, skill `figma-ba-analysis`) first: screens and states in `screens/`, element images in `elements/`, copy, prototype navigation. If the PO sent only screenshots, save them to `docs/BA/figma/{feature}/screens/` with the naming convention and continue without element images.

## Step 2 — Collect the reference logic

Read the matching APK evidence (`*_screens*`, `*_flow-*`) and the Feature Checklist rows of the feature, if they exist.

## Step 3 — PO gate (mandatory)

Run `product-decision` in batch mode through `ba-brainstormer` (see `specs` §3):

- with APK evidence: conflicts between Figma and the reference logic + hidden rules, each with the APK value;
- without APK evidence: everything needed to define the rules and the User Flow, with AI proposals.

Send the table in chat and **wait**. Ask again for anything unanswered. Record the answers in the decisions file.

## Step 4 — Scope

`use-case-writer` scoping rules → the Use Case list for the section (Mã UC | Tên UC | Mục tiêu | Màn hình), shown in chat. Reuse an existing Use Case when the goal is the same.

## Step 5 — Write

`ba-spec-writer` writes each Use Case into `docs/project-srs.md` with `use-case.md`, in one pass, then:

- adds new global rules to section 3 (one per row);
- updates the feature tree in section 2 if the scope changed;
- bumps `Cập nhật lần cuối` and `Phiên bản` in the header.

## Step 6 — Diagrams and checks

1. User Flow for every Use Case (`user-flow`); Activity Diagram only for a large feature.
2. `python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md`.
3. `use-case-writer` self-check on every changed Use Case (reported in chat).
4. Markdown check (`ba-markdown-formatting`).

## Step 7 — Report (Vietnamese, chat)

Use Cases written / changed, diagrams rendered, self-check result. Do not export Word unless the user asks (`/ba-export`).
