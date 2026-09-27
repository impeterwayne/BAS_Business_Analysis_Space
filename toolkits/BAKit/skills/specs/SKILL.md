---
name: specs
description: "Analyze requirements, create/maintain FSD and use cases. Use for business analysis, requirements documentation, functional specs. Operations: init, analyze 'feature', update."
argument-hint: "init|analyze 'description'|update"
---

# Business Analysis

Create and maintain Functional Specification Documents (FSD) and use case documentation through codebase analysis and requirements engineering.

## Default (No Arguments)

If invoked without an operation, list the operations below and ask the user to pick one:

| Operation | Description |
|-----------|-------------|
| `init` | Analyze codebase & create FSD + use cases |
| `analyze` | Analyze new feature requirements |
| `update` | Sync FSD & use cases with codebase |

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/specs init` | `references/init-workflow.md` | Analyze codebase and create initial FSD + use cases |
| `/specs analyze "feature"` | `references/analyze-workflow.md` | Analyze new feature and update FSD + use cases |
| `/specs update` | `references/update-workflow.md` | Sync FSD + use cases with current codebase state |

## Routing

Read the first word of the user's input after the command:
- `init` → Load `references/init-workflow.md`
- `analyze` → Load `references/analyze-workflow.md`, pass the remaining text as the feature description
- `update` → Load `references/update-workflow.md`
- empty/unclear → ask the user to choose an operation

## Project Type Resolution

1. Read `Project type` from `.agents/config/ba-project-config.md`. If it is set, use it.
2. Otherwise infer it from repository markers:

| Marker | Type |
|--------|------|
| `AndroidManifest.xml`, `build.gradle(.kts)` with an Android plugin, `pubspec.yaml`, `ios/` + `*.xcodeproj` | `mobile` |
| `package.json` with a UI framework (react, vue, angular, svelte, next) and a server (express, nest, next API routes) | `fullstack-web` |
| `package.json` with a UI framework only | `web-frontend` |
| Server code only (express, nest, fastapi, django, spring, go `net/http`) | `api-backend` |

3. If nothing matches (for example a documents-only BA workspace), ask the user and suggest saving
   the answer in `ba-project-config.md`.

## Shared Context

- FSD template: `.agents/skills/ba-templates/templates/fsd.md`
- UC template: `.agents/skills/ba-templates/templates/use-case.md`
- PRD input: `docs/project-overview-pdr.md`
- Competitor findings (optional input): `docs/BA/competitor/` — candidate requirements `FR-CAND-*` may be promoted into the FSD only after the user confirms them
- Output FSD: `docs/project-fsd.md`
- Output UCs: `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md`
- The FSD and use cases are living documents: update them in place, bump the header version and add a Change Log row

**IMPORTANT**: **Do not** start implementing code. This skill produces documentation only.
