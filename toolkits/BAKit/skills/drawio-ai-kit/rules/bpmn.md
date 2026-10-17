# BPMN swimlane diagram rules (Tier-1)

Conventions for BPMN 2.0 swimlane process diagrams. Layer these on top of `principles.md`.

## When to draw BPMN

- Use BPMN when the diagram shows a **business process** — roles, handoffs, decision gates, sequence of activities across participants.
- Use **AWS-architecture** preset for cloud topology (VPCs, subnets, services).
- Use a **pipeline/flow** diagram for data transformation stages with no role separation.
- If the question is "who does what, in what order, with what decisions?" → BPMN. If it's "what services connect to what?" → architecture.

## Element vocabulary (Tier-1)

Events (circles):
- **Start event** — thin single-line circle; one per pool, placed top-left.
- **End event** — thick bold circle; placed on the right edge of the flow.
- **Intermediate event** — double-line circle (inner ring); attached to an activity or between steps.

Event markers (inside the circle):
- **None** — empty circle (default).
- **Message** — envelope icon.
- **Timer** — clock icon.
- **Error** — lightning bolt; fill **red**.
- **Terminate** — bold X or stop icon; fill **red**.
- **Link** — arrow-in/out icon.
- **Cancel** — bold X; fill **red**.
- **Signal** — triangle icon.

Activities (rounded rectangles):
- **Task** — single-line rounded rect.
- **User task** — rounded rect with person icon marker.
- **Service task** — rounded rect with gear icon marker.
- **Sub-process** — rounded rect with a small square marker in the bottom-centre border (expandable; for Tier-1, treat as a collapsed box with a label).

Gateways (diamonds):
- **Exclusive (XOR)** — diamond with an `X` marker; only one outgoing path taken.
- **Parallel (AND)** — diamond with a `+` marker; all outgoing paths taken concurrently.
- **Inclusive (OR)** — diamond with an `O` marker; one or more outgoing paths taken.
- **Event-based** — diamond with a pentagon/circle inside; path chosen by which event occurs first.

Flows:
- **Sequence flow** — solid arrow; stays **within** one pool. Connects events, activities, and gateways in execution order.
- **Message flow** — dashed arrow; connects **between pools** (e.g. sender → receiver across organizational boundaries).

Containers:
- **Pool** — outer rectangle representing a participant (company, role, system). Contains lanes and all flow objects.
- **Lane** — horizontal band inside a pool representing a role or responsibility.
- **Phase** — optional vertical milestone band dividing the pool into temporal or logical stages.

## Layout

- **Orientation:** horizontal by default — flow runs left → right, lanes stack top → bottom.
- **One start event per pool** at the top-left of its first active lane. End events on the right.
- **Main flow on a horizontal spine:** keep the happy path roughly level across lanes; avoid zigzagging up and down.
- **Lane handoffs:** when the flow crosses from one lane to another, place the receiving activity vertically aligned with (or close to) the sending activity so the connecting sequence flow is short and mostly vertical.
- **Gateways** sit where paths split (diverging) or rejoin (converging). Place the merge gateway directly below the split gateway if the flow recombines after a parallel section.
- **Phase bands:** optional vertical columns with a header row at the top. Label each phase (e.g. "Intake", "Review", "Fulfill"). Flow objects sit inside the lane×phase intersection.
- **Pool placement:** side by side when showing collaboration between participants. The initiating pool (with the start event) is on the left.

## Color & style

- **Canonical monochrome:**
  - Activities: white fill (`#FFFFFF`), neutral dark stroke (`#000000`), black labels.
  - Events: white fill, neutral stroke; **thick stroke on end events**, **double stroke on intermediate**.
  - Gateways: white fill, neutral stroke, marker symbol in black.
  - Sequence flow: dark stroke, solid line.
  - Message flow: dark stroke, dashed line.
- **Red accent only** for error, cancel, and terminate events (fill `#f8cecc` or stroke `#b85450`). Do not color normal activities or gateways red.
- **Lane bands:** faint tint or no-fill with a left-border stripe — just enough to distinguish lanes without competing with the flow. One neutral colour for all lanes; do not rainbow-colour lanes.
- **Phase headers:** subtle tinted band across the top; label in small bold text.
- **No per-element colouring by mood, status, or "importance".** Colour carries BPMN semantics only (red = error/terminate).

## Validation contract

The validator enforces these — build to pass on the first run:

- **Sequence flow stays inside its pool.** Crossing a pool boundary → error. Use message flow instead.
- **Gateways need ≥2 outgoing flows** (or a single outgoing flow with a label if the other path is a non-BPMN annotation). A gateway with one unlabeled outgoing edge is a structural error.
- **Each pool has ≥1 start event and ≥1 end event.** Empty pools or dead-end flows are errors.
- **Every flow object (event, activity, gateway) lives inside a lane, inside a pool.** Orphan nodes outside a lane are errors.
- **No self-loops** on a single flow object (a sequence flow from a node back to itself is not valid BPMN).
- **Message flow connects pools only.** Message flow inside a single pool is an error.

## Common mistakes

- **Sequence flow between pools** — always use message flow for inter-pool communication.
- **Orphan nodes** outside a lane — every element must sit in a lane.
- **Gateway with one outgoing edge** — if only one path follows, the gateway is unnecessary; remove it.
- **Colouring tasks by "importance" or "status"** — colour is semantic (red = error/terminate), not decorative.
- **Forcing cloud-architecture nested containers** (VPC→Subnet→SG) onto a process flow — BPMN uses Pool→Lane→Phase, not infrastructure nesting.
- **Backward-pointing arrows everywhere** — if most of the flow goes right→left, reconsider the layout order. Occasional backward arrows for loops/exceptions are fine; a dominant reverse flow means the layout should be reordered.
- **Cramming too many nodes into one lane** — split into more lanes or widen the phase columns. Crowded lanes make sequence flows unreadable.
