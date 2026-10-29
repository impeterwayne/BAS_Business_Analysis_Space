---
name: research-feature-checklist
description: "Builds the company Feature Checklist from the PO's own research when there is no decoded APK of a competitor: PO notes, screenshots, store listings, links the PO provides, or a new app idea. Same columns and writing standard as apk-feature-extractor (fill only STT, Group of feature, Tính năng, Tính năng nhỏ, Mô tả tính năng; start from Home), then exports Excel. Use when the PO says 'tạo checklist từ research', 'chưa có APK', 'app mới chưa có app mẫu', or hands research notes instead of APK evidence."
---

# Research → Feature Checklist

Turn PO research into the same Feature Checklist the APK path produces, so Design and the SRS get identical input either way.

## 1. Inputs

- PO research notes, screenshots, store listings, competitor links (only what the PO provides), saved under `docs/BA/research/`.
- Optional: a feature brief from `brainstorm-features` (`docs/BA/briefs/`) for a brand-new idea.
- Optional, only when the PO asks: extra research by `ba-researcher`.

## 2. Rules

1. **Format.** `ba-templates` → `feature-checklist` template, same columns as `apk-feature-extractor`.
2. **Fill only five columns:** `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng`. Leave `Link tham khảo`, `Khả thi`, `Mức độ`, `Thời gian (about)`, `PO note`, `Ưu tiên`, `Technology notes` empty.
3. **Start from Home.** No rows for Splash, Language, Onboarding, first-launch permission, app-open ads or first-launch paywall.
4. **Granularity, naming and description style:** follow `apk-feature-extractor` sections 7 (granularity), 8 (merge duplicates) and 9 (`Mô tả tính năng` writing standard): English feature / UI names, natural Vietnamese descriptions, no bilingual glosses.
5. **No invention.** Only features the research supports. A feature the PO mentions as an idea is written as the PO described it; anything unclear is asked in chat before writing it, never guessed.
6. **STT** numbers each major feature (`Tính năng`); sub-feature rows of the same feature leave `STT` empty.

## 3. Steps

1. Read all inputs; list in chat the feature groups you found and any part of the app the research does not cover. Ask the PO to confirm or complete the list (one message).
2. Write `docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v{N}.md` (`{app-slug}` = the target app slug when there is no competitor). Header row `Ứng dụng tham chiếu` = `Không có — từ research của PO`.
3. Export Excel:

```bash
python .agents/skills/apk-feature-extractor/scripts/export_checklist_xlsx.py docs/BA/competitor/{app-slug}/{app-slug}_checklist_{YYYYMMDD}_v{N}.md
```

4. Report both paths in chat and the gaps the PO should fill.

## 4. Boundaries

Does not decide scope, priority or feasibility; does not write the SRS. Next steps: Design works from the checklist; Figma sections then go through `/ba-figma` and the PO gate.
