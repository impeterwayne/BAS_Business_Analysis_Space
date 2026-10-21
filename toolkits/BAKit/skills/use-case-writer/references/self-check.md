# Use Case Self-Check — 16 Items

Run this check after writing or changing each Use Case. It is a fast check of **writing quality**. Completeness of UI coverage and overall readiness are checked later by `BA-audit-SRS`.

Name this check **"Bảng tự kiểm tra Use Case"** when reporting to the user. Never call it "checklist", to avoid confusion with the company's Feature Checklist.

## How to Run

1. Walk through items K1–K16 for each Use Case.
2. Mark each: ✅ Đạt / ❌ Chưa đạt / ⚠️ Cần PO xem.
3. Fix every ❌ you can fix from available sources. Turn the rest into `Câu hỏi mở` entries.
4. Report in chat only (not inside the SRS file):

```
Bảng tự kiểm tra — UC-EDIT-001
| Mục | Kết quả | Ghi chú |
| K1  | ✅ | Tên "Chỉnh sửa và lưu ảnh" đúng dạng động từ + đối tượng |
| K14 | ⚠️ | Chưa rõ hành vi khi mất mạng lúc lưu → Q-004 |
```

## Group A — Scope and Identification

**K1. Use Case name is "verb + object".**
✅ "Lưu ảnh vào Gallery". ❌ "Lưu ảnh" is acceptable only if the object is unambiguous; ❌ "Gallery" (no verb); ❌ "User lưu ảnh" (user inside the name).

**K2. Correct size (passes the coffee-break test).**
Check `Hậu điều kiện thành công`: is it a meaningful result for the user? If it is only a sub-step → too small. If it spans several sessions → too big.

**K3. Use Case ID is unique and follows `UC-{MOD}-{NNN}`.**
Check against the Use Case list in the SRS.

**K4. Exactly one primary user and one clear goal.**
If two user types start the same Use Case with different goals, split it.

**K5. System boundary is clear.**
All "App …" steps refer to the target app. Third-party services (payment store, social login, push service) appear as named external parties, not as part of the app.

## Group B — User and Context

**K6. The user type is specific when it matters.**
"User" is acceptable when the app has only one user type. If behavior differs by user type (Free user / Premium user, logged-in / guest), name the type explicitly.

**K7. `Mục tiêu` answers why, what, and the result.**
✅ "User áp dụng Filter cho ảnh và lưu ảnh kết quả vào thiết bị." ❌ "Chỉnh sửa ảnh."

## Group C — Conditions

**K8. `Tiền điều kiện` is verifiable.**
✅ "User đã cấp quyền truy cập Photos." ❌ "User muốn chỉnh sửa ảnh."

**K9. `Hậu điều kiện` covers the success state and all visible changes.**
✅ "Ảnh được lưu vào Gallery; App hiển thị màn Result." ❌ "User hài lòng."

## Group D — Main Flow

**K10. Numbered, one action per step.**
Each row of `Luồng chính` is one user action and the app's response to it.

**K11. Clear subject in every step.**
Each step says who acts: "User …" or "App …". No passive sentences without a subject.

**K12. No if/else or loops inside the Main Flow.**
Conditions go to `Luồng thay thế`, `Luồng ngoại lệ` or `Quy tắc nghiệp vụ`.

**K13. The flow runs from the trigger to the success postcondition.**
The first step matches the trigger in `Tổng quan`; the last step reaches `Hậu điều kiện thành công`.

## Group E — Alternative and Exception Flows

**K14. Each alternative/exception flow states the step and the condition.**
✅ "Tại bước 3, nếu User bấm Back khi chưa lưu …" ❌ "Nếu có lỗi …"

**K15. Each exception has a cause, the app's response, and the final state.**
✅ "Mất mạng khi tải template → App hiển thị Toast 'No internet connection' → User ở lại màn Template, có thể thử lại."

**K16. Common mobile failure cases are considered.**
Where relevant: permission denied, no network, empty data, invalid input, interruption (incoming call, app sent to background), repeated taps, Back/Close with unsaved changes. Only document handling that is confirmed; otherwise raise an Open Question.
