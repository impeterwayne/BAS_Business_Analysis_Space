---
description: Build the company Feature Checklist (Markdown + Excel) from the APK decode tool output (apk-feature-extractor) or from PO research (research-feature-checklist)
---

Build the Feature Checklist.

**Input**: `/ba-checklist [app-slug | docs/BA/competitor/<app-slug>] [research]`
Examples: `/ba-checklist momo` · `/ba-checklist docs/BA/competitor/momo` · `/ba-checklist my-app research`

**Steps**

1. **Choose the source.**
   - APK decode tool output exists in `docs/BA/competitor/<app-slug>/` (`*_profile*`, `*_screens*`, `*_flow-*`) →
     skill `apk-feature-extractor`.
   - No APK, or the argument says `research` → `ba-brainstormer` with skill `research-feature-checklist`
     (PO notes in `docs/BA/research/`).
   - An earlier checklist exists → update mode (keep STT, grouping and anything the PO typed).
2. **Write** `docs/BA/competitor/<app-slug>/<app-slug>_checklist_<YYYYMMDD>_v<N>.md` with the `feature-checklist`
   template:
   - start from Home — no Splash / Language / Onboarding / first-launch permission / app-open ads rows;
   - fill only `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng`;
   - leave `Link tham khảo`, `Khả thi`, `Mức độ`, `Thời gian (about)`, `PO note`, `Ưu tiên`, `Technology notes` empty;
   - never turn `[Inferred]` into a confirmed feature description.
3. **Export Excel:**
   `python .agents/skills/apk-feature-extractor/scripts/export_checklist_xlsx.py docs/BA/competitor/<app-slug>/<app-slug>_checklist_<YYYYMMDD>_v<N>.md`
4. **Report in Vietnamese:** number of groups / features / sub-features, the `.md` and `.xlsx` paths, coverage
   notes. Next step: Design works from the checklist; Figma sections then go through `/ba-figma`.
