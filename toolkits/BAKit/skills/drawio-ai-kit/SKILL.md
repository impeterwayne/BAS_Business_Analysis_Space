---
name: drawio-ai-kit
description: >-
  Bundled zero-dependency Draw.io diagram generation engine, stencil catalog
  (BPMN 2.0, AWS, Azure, GCP, Databricks, AI/ML, Big Data, CI/CD, Containers,
  Database, Network, Observability), declarative layout engine, and validator.
  Use when generating or validating .drawio diagrams, or via the domain skills
  (drawio-bpmn, drawio-aws, drawio-azure, drawio-gcp, drawio-databricks).
---

# Draw.io AI Kit (Bundled Engine & Stencil Catalog)

The full `drawio-ai-kit` engine is bundled directly in this workspace at `.agents/skills/drawio-ai-kit/` (no global `npm i -g` installation required).

## CLI Usage

Run the bundled CLI directly with `node`:

```bash
node .agents/skills/drawio-ai-kit/src/cli.mjs workflow
node .agents/skills/drawio-ai-kit/src/cli.mjs principles --mode bpmn
node .agents/skills/drawio-ai-kit/src/cli.mjs search <query> [--category <cat>]
node .agents/skills/drawio-ai-kit/src/cli.mjs validate <path/to/diagram.drawio>
node .agents/skills/drawio-ai-kit/src/cli.mjs render <path/to/diagram.drawio> -o <path/to/diagram.png>
```

## Domain Skills

- [`drawio-bpmn`](../drawio-bpmn/SKILL.md) — BPMN 2.0 swimlane diagrams (`pool → lanes × phases`)
- [`drawio-aws`](../drawio-aws/SKILL.md) — AWS architecture diagrams (`mxgraph.aws4`)
- [`drawio-azure`](../drawio-azure/SKILL.md) — Azure architecture diagrams
- [`drawio-gcp`](../drawio-gcp/SKILL.md) — Google Cloud architecture diagrams (`mxgraph.gcp2`)
- [`drawio-databricks`](../drawio-databricks/SKILL.md) — Databricks Lakehouse / Medallion architecture diagrams
