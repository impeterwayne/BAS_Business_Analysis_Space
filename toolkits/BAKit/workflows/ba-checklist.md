---
description: Extract and normalize APK decoder evidence documents into the company Feature Checklist format (apk-feature-extractor)
---

Extract reference-app features into the company Feature Checklist from decoded APK documentation.

**Input**: `/ba-checklist [app-slug or decoded-docs-path] [optional-output-path]`
Examples:
- `/ba-checklist momo`
- `/ba-checklist docs/BA/competitor/momo`
- `/ba-checklist docs/BA/competitor/momo docs/BA/competitor/momo/momo_checklist_20261009_v1.md`

**You are the orchestrator for this command** — act as `ba-lead` (`.agents/agents/ba-lead.md`) or execute via `competitor-analyst` using the `apk-feature-extractor` skill (`.agents/skills/apk-feature-extractor/SKILL.md`).

---

**Steps**

1. **Resolve inputs & locate evidence documents:**
   - App slug or path. If omitted, check `.agents/config/ba-project-config.md` → Competitor Apps or list existing folders under `docs/BA/competitor/`.
   - Read available decoded APK documents:
     - `*_profile.md` (App overview, module map, high-level features)
     - `*_screens.md` (Screen inventory, purpose, UI components)
     - `*_flow-*.md` (User flows, interactions, system responses, rules)
     - `code-index/_meta.md`, `tech.md` (if available from `apk-code-index`)
   - Check if an existing checklist exists (`{app-slug}_checklist_*.md`). If found, run in **Existing Checklist Update Mode** (preserve rows/IDs, never delete target-only items, enrich descriptions).

2. **Normalize feature hierarchy:**
   - Structure features strictly into: **Group of feature → Tính năng → Tính năng nhỏ**.
   - Merge duplicate features appearing across profile, screen, and flow documents.
   - Do not create rows for every button, class, or low-level constant.

3. **Fill Feature Checklist (`ba-templates/templates/feature-checklist.md`):**
   - **Auto-fill:** `STT`, `Group of feature`, `Tính năng`, `Tính năng nhỏ`, `Mô tả tính năng` (functional purpose + important reference behavior), `Link tham khảo` (traceable evidence file/section).
   - **Technical notes:** Fill `Technology notes` only when evidence provides a clear, meaningful constraint (e.g. low-RAM gating, required permissions, hardware dependency).
   - **Ownership Rule (STRICT):** Leave `Khả thi`, `Mức độ`, `Thời gian (about)`, `PO note`, `Ưu tiên` **blank** unless explicitly provided by PO or Tech. Never guess estimates or priorities.
   - **Evidence Rule:** Never convert `[Inferred]` statements into confirmed facts without corroborating evidence.

4. **Save deliverable:**
   - Save to `docs/BA/competitor/<app-slug>/<app-slug>_checklist_<YYYYMMDD>_v1.md` per `ba-naming-convention`.
   - Never overwrite a previous version; bump version to `v2` if updating.

5. **Report in Vietnamese:**
   - Number of feature groups and total features/sub-features extracted.
   - Output checklist path.
   - Coverage notes, conflicts, and features needing manual verification.
   - Recommended next step (`ba-researcher` for domain research, `ba-brainstormer` for product decisions, or `ba-spec-writer` for SRS).
