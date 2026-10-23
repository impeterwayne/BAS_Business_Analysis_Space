---
name: ba-checklist
description: >-
  Synthesize and maintain the real Feature Checklist for our target product/project
  (`docs/BA/checklist/{slug}_checklist_{YYYYMMDD}_v{N}.md`) from competitor feature extractions
  (`apk-feature-extractor`), competitor evidence (`profile`, `screens`, `flow-*`, `comparison`),
  Figma design analyses, PRD / feature briefs, and PO requirements. Use when the user runs
  `/ba-checklist` or asks to create, consolidate, or update our product's Feature Checklist.
version: 1.0.0
argument-hint: "[module-or-scope] [--from <competitor-slugs...>] [--figma <feature-slug>]"
---

# Target Product Feature Checklist (`ba-checklist`)

Create or update the **real Feature Checklist for our product/project** (`docs/BA/checklist/{slug}_checklist_{YYYYMMDD}_v1.md`) using the company's standard 12-column checklist template (`.agents/skills/ba-templates/templates/feature-checklist.md`).

---

## 1. Boundary: `ba-checklist` vs Competitor Analysis (`competitor-app-analysis` / `apk-feature-extractor`)

| Dimension | Competitor Analysis (`/ba-competitor`, `/apk-feature-extractor`) | Target Product Checklist (`/ba-checklist` — **this skill**) |
| :--- | :--- | :--- |
| **Subject** | One specific **competitor / reference app** | **Our target product / project** (whole product or target module) |
| **Question answered** | *"What screens, flows, profile, and features exist in competitor app X?"* | *"What is the real Feature Checklist for OUR product, synthesized from benchmarks, Figma, PRD, and PO scope?"* |
| **Output path** | `docs/BA/competitor/{app-slug}/{app-slug}_features_{YYYYMMDD}_v{N}.md` (plus `profile`, `screens`, `flow-*`) | `docs/BA/checklist/{slug}_checklist_{YYYYMMDD}_v{N}.md` |
| **Multi-source** | Single reference APK + live device captures | Consolidates 1..N competitors + Figma designs + PRD/briefs + Product Decisions + PO notes |

- When the user wants to analyze a competitor app (flows, screens, profile, and competitor feature extraction), use `competitor-app-analysis` (`/ba-competitor`) or standalone `apk-feature-extractor` (`/apk-feature-extractor <app>`).
- When the user runs `/ba-checklist` or asks for our product's Feature Checklist, run **this skill** (`ba-checklist`).

---

## 2. Inputs & Order of Authority

Gather all available project sources before building the checklist. The skill works with whatever subset exists on disk:

| Priority | Source | Location | Role in Our Product Checklist |
| :--- | :--- | :--- | :--- |
| **1 (Highest)** | **Confirmed Product Decisions & PO Input** | `docs/BA/decisions/*_decisions_*.md` (`PD-*`), user chat instructions, Legacy Checklist / PRD links in `.agents/config/ba-project-config.md` | Defines confirmed target scope (`KEEP`, `MODIFY`, `REMOVE`, `NEW`, `TBD`), target rules, and explicit `PO note` / `Ưu tiên` values |
| **2** | **Target Figma Design Analysis** | `docs/BA/figma/{feature}/*_figma_*.md` (`FR-DSN-*`, `BR-CAND-*`) | Defines target screens, UI capabilities, visible states, and design-backed features for our product |
| **3** | **PRD, Feature Briefs & Research** | `docs/project-overview-pdr.md`, `docs/BA/briefs/*_brief_*.md`, `docs/BA/research/` | Defines product vision, chosen feature approaches, and supplementary domain capabilities |
| **4** | **Competitor Feature Extractions & Evidence** | `docs/BA/competitor/{app-slug}/` (`*_features_*.md`, `*_checklist_*.md`, `*_profile_*.md`, `*_screens_*.md`, `*_flow-*.md`, `*_comparison_*.md`) | Supplies reference feature taxonomy, benchmark behaviors, candidate requirements (`FR-CAND-*`, `GAP-*`), and technical constraints (`Technology notes`) |
| **5** | **Existing Project Checklist** | `docs/BA/checklist/*_checklist_*.md` | Preserves existing row structure, `STT`, PO notes, and Dev/Tech estimates when updating |

Also read `.agents/config/ba-project-config.md` for:
- Project name and `Project type` (`mobile`, `fullstack-web`, `web-frontend`, `api-backend`);
- Target Checklist Modules / Scope (if configured);
- Linked Figma, PRD, and Legacy Checklist URLs;
- Configured Competitor Apps.

---

## 3. Company 12-Column Checklist Structure

Every checklist produced by `ba-checklist` MUST use the exact 12 columns from `.agents/skills/ba-templates/templates/feature-checklist.md`:

| Column | Purpose | Rules for Our Product Checklist |
| :--- | :--- | :--- |
| `STT` | Sequential number | Auto-fill per major feature or row |
| `Group of feature` | Target module / feature group | Organize by our product's logical modules (e.g., `Onboarding & Auth`, `Home`, `Camera`, `AI Editor`, `Settings`, `Monetization`) |
| `Tính năng` | Major feature | User-facing capability name |
| `Tính năng nhỏ` | Sub-feature | Granular sub-capability when applicable (leave blank only if atomic) |
| `Mô tả tính năng` | Target functional description & key benchmark behavior | Describe what the feature does for **our product**. Incorporate confirmed target rules (`KEEP`/`MODIFY`/`NEW`); where target details are not yet locked, state the core capability and summarize key reference behavior from benchmarked apps |
| `Link tham khảo` | Traceable source links | Cite Figma analysis/frame links, competitor feature/flow/screen docs (`momo/flow-transfer.md`, `b612/screens.md`), PRD, or decision IDs (`PD-001`) |
| `Khả thi` | Technical feasibility | **Leave blank** unless explicitly provided by Tech/Dev |
| `Mức độ` | Difficulty (`Dễ` / `Bình thường` / `Khó`) | **Leave blank** unless explicitly provided by Tech/Dev |
| `Thời gian (about)` | Estimated development effort | **Leave blank** unless explicitly provided by Tech/Dev |
| `PO note` | Product Owner decision / scope status | Fill with confirmed PO notes or decision status (`[PD-001: KEEP]`, `[MODIFY: ...]`, `[NEW]`, or `[TBD — cần PO chốt]`). Never invent PO approval |
| `Ưu tiên` | Product priority (`P0`/`P1`/`P2` or `Must`/`Should`/`Could`) | Fill **only** when explicitly provided by PO, PRD, or confirmed Product Decisions; otherwise leave blank |
| `Technology notes` | Technical constraints & notes for Dev/Tech | Meaningful technical requirements, OS/API dependencies, permissions, SDKs, or hardware/RAM constraints observed in code/design |

---

## 4. Synthesis & Normalization Rules

### 4.1 Multi-Source Consolidation (Do Not Duplicate Across Competitors)
- When multiple competitors exist under `docs/BA/competitor/` (e.g. App A and App B), **merge overlapping features into a single unified taxonomy for our product**.
- Do not create separate sections per competitor. Instead:
  - Describe the unified capability in `Mô tả tính năng` (noting important differences between Competitor A, Competitor B, and our Figma if relevant);
  - List all supporting sources in `Link tham khảo` (e.g., `figma/camera_figma_v1.md; appA/flow-camera.md; appB/screens.md`).

### 4.2 Handling Product Decisions (`KEEP` / `MODIFY` / `REMOVE` / `NEW` / `TBD`)
- **`KEEP`**: Write the confirmed target behavior in `Mô tả tính năng` and record `[KEEP - PD-xxx]` in `PO note` if a decision ID exists.
- **`MODIFY`**: Write the **modified target behavior** in `Mô tả tính năng` (not the raw competitor behavior) and note the change in `PO note`.
- **`REMOVE`**: Exclude from the main in-scope checklist table (or list under Section 4 *Tính năng loại trừ (Excluded / Out-of-Scope)* so the team has an audit trail).
- **`NEW`**: Include target-only features from Figma (`FR-DSN-*`), Feature Briefs, PRD, or PO instructions even when absent from competitors. Mark `[NEW]` in `PO note` when helpful.
- **`TBD` / Unconfirmed Reference Features**: When building the checklist before Phase 2 (`product-decision`) has run, include candidate features from reference extractions/Figma so the PO and Tech team can review and scope them, and flag unresolved conflicts in Section 3 (*Điểm cần PO / Tech chốt*).

### 4.3 Feature Granularity (`Group of feature → Tính năng → Tính năng nhỏ`)
- Follow the 3-level hierarchy:
  - **Group of feature**: Module or epic level (`Camera`, `Image Collage`, `Payment & Transfer`, `Account & KYC`).
  - **Tính năng**: Feature level (`Beauty`, `Aspect Ratio`, `QR Scan`, `Biometric Login`).
  - **Tính năng nhỏ**: Sub-feature level (`Skin Beauty`, `Facial Retouch`, `Makeup`).
- Do **not** explode individual slider parameters, button IDs, or low-level code constants into separate rows; keep parameter lists inside `Mô tả tính năng`.

---

## 5. Execution Workflow

### Step 1 — Resolve Scope & Inventory Sources
1. Parse command arguments:
   - `/ba-checklist` (no args) → Full product checklist (or scoped to configured modules in `ba-project-config.md`).
   - `/ba-checklist <module-or-scope>` → Scoped checklist for the requested module(s) or feature group(s), or full checklist prioritizing those modules.
   - `--from <competitor-slugs>` → Filter or prioritize specific competitor folders under `docs/BA/competitor/`.
   - `--figma <feature-slug>` → Include specific Figma design analysis under `docs/BA/figma/`.
2. Scan the workspace for available inputs:
   - `.agents/config/ba-project-config.md`
   - `docs/BA/checklist/` (check for existing versions to update)
   - `docs/BA/competitor/*/` (`*_features_*.md`, `*_checklist_*.md`, `*_profile_*.md`, `*_screens_*.md`, `*_flow-*.md`, `*_comparison_*.md`)
   - `docs/BA/figma/*/` (`*_figma_*.md`)
   - `docs/BA/decisions/` (`*_decisions_*.md`)
   - `docs/BA/briefs/` (`*_brief_*.md`) and `docs/project-overview-pdr.md`
3. **If no competitor extractions exist yet but decoded competitor docs (`profile`/`screens`/`flow-*`) exist**:
   - You may either read the competitor `profile`/`screens`/`flow-*` docs directly or run `apk-feature-extractor` first, then synthesize our product checklist.
4. **If no files exist on disk yet and the user gave a topic/scope in chat**:
   - Build the initial checklist structure from the project config, PRD/briefs, and user requirements, marking unconfirmed details in Section 3.

### Step 2 — Build & Normalize Our Product's Feature Hierarchy
1. Map all in-scope modules (`Group of feature`).
2. Populate `Tính năng` and `Tính năng nhỏ` across each module by combining:
   - Target features from PRD / PO notes / Feature Briefs;
   - Target UI capabilities from Figma analyses (`FR-DSN-*`);
   - Reference capabilities from competitor extractions (`CF-*`, `FR-CAND-*`).
3. Deduplicate capabilities that have multiple entry points or appear across multiple sources.

### Step 3 — Draft Descriptions, Links & Notes
1. Write `Mô tả tính năng` in Vietnamese (keeping standard English BA/tech terms per `ba-global-rules`).
2. Populate `Link tham khảo` with relative paths or concise document/section references.
3. Populate `PO note` with confirmed PO decisions/notes only.
4. Populate `Technology notes` with genuine technical constraints only.
5. Leave `Khả thi`, `Mức độ`, `Thời gian (about)`, and unconfirmed `Ưu tiên` empty.

### Step 4 — Write & Version the Deliverable
1. Determine `{slug}`:
   - Full project checklist: `{project-slug}` (kebab-case project name from config, e.g. `beauty-camera` or `my-app`).
   - Module-specific checklist: `{module-slug}`.
2. Save to:
   ```
   docs/BA/checklist/{slug}_checklist_{YYYYMMDD}_v{N}.md
   ```
   - Never overwrite an existing `v{N}` file; increment to `v{N+1}` when updating.
   - When updating an existing checklist, preserve existing `STT`, Dev estimates (`Khả thi`, `Mức độ`, `Thời gian`), and explicit `PO note` / `Ưu tiên` values.
3. Validate Markdown formatting against `ba-markdown-formatting` (exact 12 columns per table row, no `<br>`, no `---` adjacent to tables).

### Step 5 — Report & Recommend Next Phase
Report in Vietnamese:
1. Output file path (`docs/BA/checklist/{slug}_checklist_{YYYYMMDD}_v{N}.md`).
2. Sources synthesized (which competitor extractions, Figma analyses, PRD/decisions were merged).
3. Total feature groups (`Group of feature`), major features (`Tính năng`), and sub-features (`Tính năng nhỏ`).
4. Key open scope questions or conflicts between sources (e.g., Competitor vs Figma).
5. Recommended next step:
   - Run `product-decision` (`ba-brainstormer`) to resolve open `TBD` / conflict items with the PO; or
   - Run `/specs init` or `/specs analyze` (`ba-spec-writer`) if product decisions are already confirmed.

---

## 6. Hard Rules

1. **This checklist is for OUR product** — do not blindly copy competitor branding, competitor-only ad placements, or implementation trivia as confirmed requirements.
2. **Strict column ownership** — never guess or fabricate `Khả thi`, `Mức độ`, `Thời gian (about)`, or `Ưu tiên`.
3. **Preserve evidence grades** — if a benchmarked behavior is only `[Inferred]` in competitor docs, flag it as needing verification rather than stating it as confirmed fact.
4. **Never overwrite existing human inputs** — when updating a checklist (`v2`, `v3`), keep all PO notes and Dev/Tech estimation columns intact.
5. **Traceability required** — every row must cite its origin in `Link tham khảo` (Competitor doc, Figma analysis, PRD, Brief, or PO input).
