---
description: Analyze a competitor app from its decoded APK source (jadx) and/or a live Android device (mobilerun) into profile, screen inventory, flow analyses, and Feature Checklist
---

Run competitor app discovery.

**Input**: `/ba-competitor <package or app-slug> [flows] [--code-only | --no-device]`
Examples: `/ba-competitor com.example.app home,editor --code-only` · `/ba-competitor momo transfer`

**You are the orchestrator for this command** — act as `ba-lead` (`.agents/agents/ba-lead.md`) and follow `.agents/skills/competitor-app-analysis/SKILL.md`.

**Steps**

1. **Read `.agents/config/ba-project-config.md`** for the app slug, package name, decoded source (`jadx_src`), and target flows.
2. **Choose the branch:**
   - **Branch 1 (Hybrid — Code + Live Device via `mobilerun`):** When a device is connected and `--code-only` is not passed. Run Wave A (`2-3 × code-scout` in parallel) → Wave B (`exploration-plan.md`) → Wave C (`competitor-analyst` WALK, one flow at a time) → Wave D (`competitor-analyst` SYNTHESIZE) → Wave E (`evidence-verifier`).
   - **Branch 2 (Static — `--code-only` / `--no-device`):** Bypass `mobilerun` completely. Run Wave A (`2-3 × code-scout` in parallel on `jadx_src`) → Wave B (`competitor-analyst` SYNTHESIZE in `code-only` mode) → Wave C (`evidence-verifier`).
3. **Deliverables written under `docs/BA/competitor/<app-slug>/`:**
   - `<app-slug>_profile_<YYYYMMDD>_v<N>.md`
   - `<app-slug>_screens_<YYYYMMDD>_v<N>.md`
   - `<app-slug>_flow-<flow>_<YYYYMMDD>_v<N>.md`
   - `<app-slug>_checklist_<YYYYMMDD>_v<N>.md` + `.xlsx` (via `apk-feature-extractor` + `export_checklist_xlsx.py`)
4. **Verify** with `evidence-verifier` before reporting in Vietnamese.
