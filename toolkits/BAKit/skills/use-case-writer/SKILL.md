---
name: use-case-writer
description: "Scope and write the Use Cases of the mobile SRS in Vietnamese, inside docs/project-srs.md, with the ba-templates use-case block (Trigger / Pre-condition / Post-condition, UI specification with screen grid and element images, User Flow, flows, business rules, Activity Diagram when needed). Use when ba-spec-writer or the user needs to split a feature into Use Cases, write or revise a Use Case, or check one ('viết use case', 'viết UC', 'tách UC', 'review UC'). Runs the Use Case self-check before handover. Does not write the Feature Checklist or decide product rules."
author: "Adapted from Phúc NT @ BA Zone (MIT) for this BAKit workspace"
---

# Use Case Writer

Writing-quality layer for Use Cases. The document format belongs to `ba-templates` (`use-case.md`, inside `srs.md`); the process belongs to `specs`. This skill decides **how big** each Use Case is, **how** it is written, and **checks** it.

## 1. Output Rules

1. **Template.** Always `.agents/skills/ba-templates/templates/use-case.md`, written inside `docs/project-srs.md`. Never another layout, never one file per Use Case.
2. **Language and style.** Follow `ba-global-rules` and `ba-markdown-formatting`: Vietnamese sentences, English UI / product terms, no `Tiếng Việt (English)` glosses, `Điều kiện / Hành động > Kết quả` syntax, no meta notes.
3. **Write in one pass.** Write the whole Use Case at once; do not stop between sub-sections.
4. **Only confirmed rules.** Write only after the PO rule confirmation (`product-decision`, batch mode) for the Use Case's screens. Never invent a value, limit, text or state. If something turns out to be missing while writing, stop and ask the PO in chat; do not write placeholders or open questions into the SRS.

## 2. Workflow

```
Step 1: SCOPE      → apply references/scoping-rules.md; for a feature group, list the Use Cases first
Step 2: WRITE      → fill the use-case block in one pass
Step 3: DIAGRAMS   → User Flow (user-flow skill); Activity Diagram only for a large feature; run the render script
Step 4: SELF-CHECK → references/self-check.md (14 items); fix failures
```

### Step 1 — Scope

- One Use Case = one complete user goal in one session (coffee-break test). It usually covers several screens; never one Use Case per screen by default.
- For a feature group, show the Use Case list in chat first (Mã UC | Tên UC | Mục tiêu | Màn hình), then write them in order.

### Step 2 — Write

Fill, in order: the attribute table (Mã UC, Trigger, Pre-condition, Post-condition — one short sentence each), `{N}.1 Đặc tả giao diện` (screen grid, then one element table per image), `{N}.3 Basic Flow`, `{N}.4 Alternative Flow` and `{N}.5 Exceptional Flow` only when they exist, `{N}.6 Business Rules`. Follow `references/writing-style.md`.

### Step 3 — Diagrams

- `{N}.2 User Flow`: required, drawn with the `user-flow` skill.
- `{N}.7 Activity Diagram`: only for a large feature (3+ screens, several conditional branches, or payment / IAP / subscription / permissions); otherwise delete the sub-section.
- Run `python .agents/skills/user-flow/scripts/render_diagrams.py docs/project-srs.md`.

### Step 4 — Self-check

Run `references/self-check.md` on every Use Case written or changed. Report the result in chat as **"Bảng tự kiểm tra Use Case"** (never call it "checklist", to avoid confusion with the Feature Checklist). Nothing from the self-check is written into the SRS.

## 3. Boundaries

Does not write the Feature Checklist (`apk-feature-extractor`, `research-feature-checklist`), does not make product decisions (`product-decision`), does not call Figma tools (`figma-ba-analysis`), does not export Word (`srs-export`).

## 4. Credits

Scoping rules and the self-check are adapted from *Use Case Writer* by Phúc NT (BA Zone, MIT License, see `LICENSE`), based on Alistair Cockburn's *Writing Effective Use Cases* and the IIBA BABOK Guide.
