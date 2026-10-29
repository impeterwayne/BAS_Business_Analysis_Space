# Use Case Self-Check — 14 Items

Run after writing or changing each Use Case. Report in chat only, titled **"Bảng tự kiểm tra Use Case"**:

```
Bảng tự kiểm tra — UC-EDIT-001
| Mục | Kết quả | Ghi chú |
| K1  | ✅ | … |
| K12 | ❌ → đã sửa | … |
```

Mark ✅ Đạt / ❌ Chưa đạt. Fix every ❌ from the available sources. If a fix needs a PO answer, ask the PO in chat before finishing; never write the gap into the SRS.

## A. Scope and identification

**K1. Name is "verb + object".** ✅ "Lưu ảnh vào Gallery". ❌ "Gallery", ❌ "User lưu ảnh".

**K2. Correct size.** The Post-condition is a meaningful result for the user (coffee-break test). Only a sub-step → merge into its parent. Several sessions → split.

**K3. Unique id `UC-{MOD}-{NNN}`,** and the anchors use it (`uc-edit-001`, `uf-edit-001`, `uc-edit-001-af-1`).

**K4. One user, one goal.** Different goals for different user types → split.

## B. Attribute table

**K5. Trigger, Pre-condition, Post-condition are one short sentence each and verifiable.** ✅ Pre-condition "User đã cấp quyền truy cập Photos." ❌ "User muốn chỉnh ảnh."

## C. UI specification

**K6. Screen grid** has every screen / state used by the Use Case, 3 per row, each with a "Hình N" caption, and every image path exists on disk.

**K7. Element tables** list only interactive elements, use the exact UI label in backticks, carry the element image when one was exported (large containers say "Xem Hình N"), and do not repeat shared elements from earlier screens.

## D. Flows

**K8. Basic Flow is numbered, one action per step, each step with its actor** (`User` / `System`), written as `Hành động > Kết quả`, from the Trigger to the Post-condition.

**K9. No if/else inside the Basic Flow.** Branches go to Alternative / Exceptional Flow, conditions to Business Rules.

**K10. Every Alternative / Exceptional step states where it branches** (`Tại BF-2: …`) and how it ends (return step or end state). Error messages are quoted exactly from the design.

**K11. Common mobile failure cases are considered** when relevant (permission denied, no network, empty data, invalid input, Back with unsaved changes) — only documented when confirmed by the PO.

## E. Rules and references

**K12. One rule per row** in Business Rules; no `<br>`-stacked rules; no UI clicks or navigation repeated from the UI table or flows.

**K13. Note/References are clickable links on one line** (`[BR-002](#br-002), [AF-1](#uc-edit-001-af-1)`) and every link target anchor exists.

## F. Diagrams

**K14. User Flow present** (user action → UI response, `flowchart TD`, ≤ ~15 nodes), **Activity Diagram present only for a large feature**, and the render script has added the "Xem ảnh lớn" line under each diagram.
