# Writing Style — Use Cases in this Workspace

The base style is defined by `ba-global-rules` and `ba-markdown-formatting`. This file adds the Use-Case-specific habits.

## 1. `Hành động > Kết quả`

Every flow step, UI interaction and rule is one short line: what happens `>` what the user sees.

- ✅ `Click button Save > Lưu ảnh vào Gallery và mở màn Result.`
- ❌ `Khi người dùng nhấn vào nút Save thì hệ thống sẽ tiến hành lưu ảnh…`

## 2. One step = one action, with its actor

- ✅ `BF-1 | User | Click Edit > Mở màn Select Photo.` / `BF-2 | User | Chọn 1 ảnh > Mở Photo Editor.`
- ❌ `User click Edit, chọn ảnh rồi chỉnh filter.`

## 3. UI names exactly as in the design

Backticks around the label in the UI table (`` `Save` ``, `` `Your Name` ``). Short labels, not descriptions (`Your Name`, not `Your Name Input Field`). No translation in parentheses.

## 4. Rules stay in Business Rules, one per row

Flows reference rules by link instead of restating them: `Nhập Your Name > Kiểm tra hợp lệ.` with `[BR-002](#br-002), [BR-003](#br-003)` in Note/References. If three conditions exist, write three rows.

## 5. No implementation details

No API, class, intent, SDK internals, Figma node ids, hex colors or pixel sizes. Describe the visible result.

## 6. Messages

Quote on-screen texts exactly as in the design, in their original language: `> Hiển thị error state ("You cannot enter more than 20 characters.")`. No text in the design → ask the PO; never invent one.

## 7. Numbering and anchors

| Item | Format | Anchor |
|---|---|---|
| Use Case | `UC-{MOD}-{NNN}` | `uc-{mod}-{nnn}` |
| Basic Flow step | `BF-1` | — |
| Alternative / Exceptional | `AF-1`, `EF-1` (per Use Case) | `uc-{mod}-{nnn}-af-1` |
| Business rule | `BR-{NNN}` (global numbering) | `br-{nnn}` |
| User Flow / Activity | `UF-{MOD}-{NNN}` / `ACT-{MOD}-{NNN}` | `uf-{mod}-{nnn}` / `act-{mod}-{nnn}` |

## 8. Most common mistakes

1. Several rules stacked in one cell with `<br>`.
2. UI clicks repeated in Business Rules.
3. A user action with no visible result.
4. if/else inside the Basic Flow.
5. Alternative / Exceptional Flow written as "Không có" instead of deleting the sub-section.
6. A Trigger like "User vào app" (too vague).
7. Post-condition written as an action instead of a resulting state.
8. One Use Case per screen.
