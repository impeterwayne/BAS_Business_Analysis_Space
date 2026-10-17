# Third-party notices

This project bundles assets and scripts from third parties. Their licenses are reproduced/linked below.

## shape-index (`data/shape-index.json.gz`)

- Source: [jgraph/drawio-mcp](https://github.com/jgraph/drawio-mcp) → `shape-search/search-index.json`, via [Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill).
- Generated from the official draw.io / diagrams.net client shape libraries.
- License: **Apache License 2.0**.
- Used read-only by `scripts/ingest_index.py` to build `catalog/aws.json` with ground-truth stencil names, official colors, and connection points.

## Vendored scripts (`vendor/`)

- `autolayout.py`, `aiicons.py`, `repair_png.py`, `encode_drawio_url.py` and `data/lobe-icons.json` are from [Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill).
- License: **MIT** (see `vendor/drawio-skill-LICENSE`).
- `aiicons.py` resolves brand logos from the [lobe-icons](https://github.com/lobehub/lobe-icons) set (MIT) served via CDN.

## AWS Architecture Icons

- The `mxgraph.aws4.*` stencils referenced by the catalog are part of draw.io (Apache-2.0). The underlying AWS Architecture Icons are © Amazon Web Services and subject to the [AWS Architecture Icons usage terms](https://aws.amazon.com/architecture/icons/). Use them to depict AWS architectures; review the terms before redistributing icon bitmaps.

A full copy of the upstream reference skill is kept under `../reference/drawio-skill/` for documentation purposes.
