# AWS architecture diagram preset

Conventions specific to AWS architecture diagrams. Layer these on top of the general `principles.md`.

## Containers — nest in the real order

Use the official AWS group shapes (`search_icon "<name>" --kind group`) and **nest them by parent-child**, not by stacking:

```text
AWS Cloud (group_aws_cloud_alt)
└─ Region (group_region, dashed)
   └─ VPC (group_vpc)
      └─ Availability Zone (group_availability_zone, dashed)
         └─ Subnet (group_subnet — color auto-set by label: "Public"→blue, "Private"→green; NEVER pass fill manually)
            └─ Security Group (group_security_group, dashed)
               └─ service icons
```

- A child sets `parent="<containerId>"` and uses coordinates **relative to its container**.
- Don't put a Subnet directly under AWS Cloud, or a Security Group outside a Subnet — the validator flags broken nesting.
- Managed/global services (S3, IAM, KMS, CloudWatch, Route 53, Organizations) live **outside the VPC** — place them in the AWS Cloud band, not inside a subnet.

## Icon color = identity — never recolor

Each AWS icon ships with its official category color (Compute orange, Storage green, Database pink, Security red, Networking purple, Management magenta...). The catalog style already carries the correct `fillColor`. **Do not override it** — a recolored S3 icon is a recognizability bug, and the validator flags it.

Category colors: Compute/Containers `#ED7100` · Storage `#7AA116` · Database `#C925D1` · Networking & Analytics `#8C4FFF` · Security `#DD344C` · Management & App-Integration `#E7157B` · Migration/ML `#01A88D`.

## Canonical layouts

- **Data pipeline (left → right):** Sources → Ingestion → Processing → Storage → Integration/Serving → Consumers. Cross-cutting layers (Security, Monitoring, Governance, CI/CD) as a band below, dashed links to the components they touch.
- **VPC / network diagram:** Each **Availability Zone is a vertical COLUMN**, the AZs sit **side by side**, and the **VPC is the horizontal box** wrapping them (Region → VPC → AZ columns → subnets). Inside an AZ, subnets are **tiers stacked top→bottom** (Public → App → Data); keep the **same tier aligned horizontally across AZs** (public-a level with public-b). Users/Internet sit outside the VPC; a shared ALB/NAT/bus spans **horizontally across the AZ columns**.
- **Event-driven / bus:** put the bus (Kafka/MSK/EventBridge/SNS) in the **center** of the producer/consumer row; producers connect from one side (`exitX=1`), consumers from the other (`exitX=0`) — no crossings.
- **Hybrid / DR:** on-prem / external sites are a SEPARATE block placed OUTSIDE the AWS Region/Cloud container — never nest on-prem inside the Region. Put a Direct Connect / Site-to-Site VPN **node** between cloud and on-prem as the connection channel (not just a labelled edge). See `examples/aws/build_hybrid.mjs`.

## Multi-AZ

- For HA, draw **≥2 Availability Zone columns side by side** inside the VPC and mirror the stateful tier in each (same tier on the same row across AZs). Label AZ-a / AZ-b.
- Stateless services scale horizontally inside each AZ; managed data services (RDS Multi-AZ, etc.) span AZs — show one icon at the VPC level with a note, or one per AZ with a sync link.

## Edges in AWS diagrams

- Pipeline flow → `rounded=1`. Fan-out to multiple targets / bus → `rounded=0` + pinned `exitX/entryX` (see `principles.md` §6).
- Data-flow diagrams read well with `flowAnimation=1` on the main pipeline edges (animates in SVG / desktop).
- Solid = data/control flow; dashed = policy/lineage/sync/DR.
- **Connect to the bounding box, not each replica.** When a multi-AZ stack is wrapped in a dashed `clusterBox` (the per-app / node-group / cluster frame that spans the AZs), point edges at the BOX's id — **one tidy arrow to the border** — instead of drawing a separate arrow to the same component's icon in every AZ. The frame already says "this is N replicas across the AZs", so a single edge to it reads cleanly; N arrows to N child icons just clutter. Create the `clusterBox`es **before** `d.link(...)` so the box ids exist as edge targets. (A genuine fan-out to *distinct* services still combs as usual — this rule is only about the per-AZ replicas of one stack.)

## Placement — keep edges short (avoid the "long detour" smell)

The layout engine places by declared nesting; it does **not** move nodes to shorten edges. So *you* must place connected things near each other:

- **Shared resources** (ECR, S3, CloudWatch, registries, KMS) used by many components: put them in a **band immediately next to their consumers** (e.g. right under the compute area), **not** in a far-away row at the bottom — otherwise every reference becomes a long detour line.
- Put a node **next to what it talks to most**; order layers/columns along the real flow so the spine is short and straight.
- Group repeated cross-cutting links (a node → many, or many → a node) so they comb instead of fanning across the whole canvas.

`validate_diagram` flags this automatically: **"Long connector(s) spanning most of the diagram"** (a node parked too far) and **"N edge crossings"** (tangled flow). Both mean *reposition nodes*, not *reroute edges* — fix placement and re-validate.
