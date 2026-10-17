# Diagram types — layout & routing presets

Different diagram types need different layout and **edge routing**, not one strategy for all. Pick the type first, then apply its preset (`src/types.mjs` → `typePreset(name)`); the routing helpers in `src/layout.mjs` do the geometry.

## Pick the type

| User intent | Type key |
|---|---|
| Data/request pipeline, ETL, request-response across tiers | `pipeline` |
| Org structure, Landing Zone, account/OU hierarchy | `hierarchy` |
| VPC / network topology, Multi-AZ deployment, 3-tier in a VPC | `network` |
| Event-driven, message bus, fan-in/fan-out around a hub | `hubspoke` |
| Hybrid / disaster recovery (on-prem ↔ cloud, two sites) | `hybrid` |
| Multi-account connectivity / service mesh (VPC Lattice, TGW, peering, RAM share) | `mesh` |
| Numbered request walkthrough over an architecture | `sequence` |

## Templates — copy-paste starting points (`examples/`)

Before free-handing, check if a template matches the request. Open it, **reproduce its structure**, then adapt the labels / LAYERS block. Faster, and keeps the house style consistent.

| You're drawing | Start from |
|---|---|
| A **Multi-AZ workload layer** — AZ private-subnet columns · pods on EC2 worker nodes · per-app cross-AZ `clusterBox` · GitOps band | `examples/aws/build_multiaz_template.mjs` |
| A **multi-account Landing Zone / hub-and-spoke** — Network account + **Transit Gateway** · Ingress/Inspection/Egress VPCs · workload spokes · hybrid (DX/VPN) · governance — incl. a **multi-tab SA deck** (As-Is · To-Be · Networking · Security · Backup · Logging · CI/CD) | `examples/aws/build_landingzone_hubspoke_template.mjs` |
| A single VPC (Multi-AZ · EKS · NAT) | `examples/aws/build_vpc_eks.mjs` |
| Hybrid / DR (on-prem ↔ cloud, two sites) | `examples/aws/build_hybrid.mjs` |
| Multi-account mesh / TGW connectivity | `examples/aws/build_mesh.mjs` |

## Reproduction loop — build → validate → conform → fix (repeat)

When a template matches, **don't free-hand it — reproduce it and self-check** in a loop:

1. **Match** — pick the template above for the diagram type; open it.
2. **Build** — reproduce its structure with the layout engine + helpers (`clusterBox`, themed creators); never hardcode coordinates.
3. **Validate** — `validate_diagram` (or `d.validate()`); clear all `errors`, `warnings`, `audit.advice`.
4. **Conform** — `render_diagram`, then check the output against the archetype checklist below.
5. **Fix & repeat** — until validate is clean **and** every checklist item passes (≤ ~3 rounds).

### Conformance checklist

#### Multi-AZ workload layer

- [ ] AZ are vertical columns; each AZ = a private subnet (bank/internal style = NO public subnet/NAT).
- [ ] 1 EC2 worker node per AZ holds the app pods (real icons), mirrored across AZs.
- [ ] Each app pod has its OWN dashed cross-AZ `clusterBox` (colour-coded); an outer EKS node-group box spans the worker nodes; non-EKS stacks (Kafka…) get their own box.
- [ ] EDGES connect to the dashed BOX border (`comp_<app>` / `eksstack` / stack id) — ONE arrow — never to each per-AZ icon.
- [ ] Managed AWS services sit OUTSIDE the VPC; optional GitOps band (Terraform + ArgoCD).

#### Multi-account Landing Zone (hub-and-spoke)

- [ ] Accounts separated via `group_account`: Network (hub) + Workload (spokes) + Security / shared-services.
- [ ] Transit Gateway is the hub; Ingress (WAF/ALB) · Inspection (NGFW) · Egress (NAT) VPCs live in the Network account.
- [ ] Workload VPCs attach to the TGW (spokes); on-prem reaches the TGW via Direct Connect + Site-to-Site VPN.
- [ ] Governance baseline present: CloudTrail · Config · GuardDuty · Security Hub · KMS.
- [ ] Edges go to the Transit Gateway (hub-and-spoke), not node-to-node spaghetti.

## Composing archetypes (real systems mix several)

A real architecture is usually NOT one pure type — it COMBINES them, and the engine composes freely because every archetype is just a nested `group`/`frame` subtree. Build the dominant type, then nest the others inside/around it. `new Diagram(type)` only sets edge-routing defaults (pick the dominant one) — it does **not** restrict the layout.

Example — a full data platform = **pipeline** (layered stages) **inside** an AWS Cloud frame, with a **hybrid** on-prem block + Direct Connect channel beside it, a **mesh** of accounts, and a cross-cutting **band**:

```js
const tree = frame("root", "", { dir: "row", align: "center" }, [
  onpremFrame("op", "On-Premise", [...]),        // hybrid block (outside the Region)
  frame("chn", "", { dir: "col" }, [icon("dx","direct_connect","Direct Connect")]),  // channel
  group("aws", "group_aws_cloud_alt", "AWS Cloud", { dir: "col" }, [
    frame("pipe", "", { dir: "row" }, [stage("s1",0,..), stage("s2",1,..), ...]),    // pipeline
    band("ops", "Security · Ops", [...]),                                            // cross-cutting band
  ]),
]);
```

Don't force a complex system into one archetype — **compose**. Reuse the themed creators (`stage`/`band`/`endpoint`/`onpremFrame`) across the pieces so the whole thing stays one coherent style.

## Frames are square — AWS convention

AWS architecture diagrams use **square-corner** containers, not rounded frames. Use the official group stencils (`group_*`, already square) for Region/Account/VPC/AZ/Subnet, and keep resource boxes square too. The `Diagram` builder's `box()` defaults to square (pass `round:true` only when you deliberately want a rounded shape).

## Per-type layout & routing

### pipeline
- **Layout:** left → right, one column per tier (Ingest → Process → Store → Serve). Cross-cutting layers as a band below.
- **Routing:** put the connected "spine" nodes at the **same Y** so the main flow is straight horizontal. Bent edges use **two waypoints in the inter-column corridor** (`routeLR` with `laneX`). Fan-out from one source → **sharp** corners (`rounded=0`).

### hierarchy
- **Layout:** top → down. Parent (Management/Root) on top; children (OUs/accounts) nested below. Group by OU containers.
- **Routing:** **sharp** corners. All siblings of one parent exit the parent at its bottom-centre and share **one horizontal lane** just below the parent (a bus) before dropping to each child — `routeTB` with a shared `laneY`.

### network
- **Layout:** nest **Region → VPC → Availability Zone → Subnet → Security Group** with real parent-child containment. **Mirror the AZs** (stack them vertically). Tiers flow left → right inside each AZ: Public (NAT/IGW) → Private app → Private data.
- **Routing:** make the **load balancer a tall node spanning the AZs** so its edges to each AZ's app tier are straight horizontals. Edges between tiers are horizontal; go **vertical only to cross AZs** (e.g. RDS primary → standby). Cross-AZ replication / DR uses **dashed** lines. Regional/edge services (WAF, CloudWatch, S3) sit **outside the VPC** but inside the Region.

### hubspoke
- **Layout:** hub (bus/TGW/EventBridge/SNS) in the **centre** of the producer/consumer row.
- **Routing:** producers connect from one side (`exitX=1`), consumers from the other (`exitX=0`) with short horizontal edges → no crossings.

### hybrid
- **Layout:** two site blocks (on-prem, cloud) as separate frames.
- **Routing:** connect through a single **Direct Connect / VPN** node; mirror matching components on both sides; bidirectional links are **dashed double-headed**.

## Fan-out / fan-in edges (the #1 source of ugly diagrams)

The kit routes both automatically — you never compute lanes, just call `d.link(...)`
repeatedly and the builder groups edges by shared endpoint:

- **Fan-out** (1 source → ≥2 same-direction targets): routed as a **comb** — one
  shared trunk lane, one short branch per target, all exiting the source center so
  the collinear segments merge into a single clean trunk.
- **Fan-in** (≥2 same-direction sources → 1 target): the **reverse comb** — edges
  share one lane just before the target and arrive at **distinct entry points**
  (spread `entryY`/`entryX`), so the arrowheads don't stack on one spot.

Both work on either axis (LR: hub→consumers; TB: management account→OUs, org-chart
style). Fan-out wins if an edge qualifies as both. Keep the many-side roughly
**aligned** (same x for LR, same y for TB) so branches stay short — the layout
engine's `frame`/`group`/`grid` already does this.

## Grid layout

When a row of N items doesn't match the column count of a sibling row (e.g. 4 storage
icons under 3 AZ columns), use `grid(id, gname, label, { cols }, children)` instead of
hand-stacking. It lays children into evenly-sized cells (centered), so the frame hugs
the grid tightly with no lop-sided whitespace.

## Validation hooks

`validate_diagram` enforces several of these regardless of type: unknown stencils, recolored icons, broken Region→…→SG nesting, off-centre labels on bent edges, and fan-out edges that should be sharp + pinned. Clear all `audit.advice` before delivering.
