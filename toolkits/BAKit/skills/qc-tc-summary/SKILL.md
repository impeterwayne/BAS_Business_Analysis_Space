---
name: qc-tc-summary
description: Tổng hợp trạng thái test cases từ tất cả file xlsx mới nhất trong QC/testcases. Trigger khi user gõ "tc summary", "tổng hợp testcase", "test summary". Output ra chat + file .md + file .xlsx.
---
# QC Test Cases Summary Skill

## Purpose

Tự động scan toàn bộ folder `docs/QC/testcases/`, tìm file xlsx version mới nhất của mỗi UC, đếm số lượng test case theo trạng thái (Pass, Fail, Untested, Pending, N/A), và xuất báo cáo tổng hợp.

## Trigger

Skill được kích hoạt khi user gõ một trong các lệnh:
- `tc summary`
- `tổng hợp testcase`
- `test summary`

## Workflow

### Step 1: Chạy script tổng hợp

Chạy Python script để scan và tổng hợp dữ liệu:

```bash
python .agents/skills/qc-tc-summary/scripts/tc_summary.py
```

Script sẽ:
1. Scan tất cả subfolder trong `docs/QC/testcases/` (bỏ qua folder `TC-summary`)
2. Với mỗi UC folder, tìm file `.xlsx` có version cao nhất (v4 > v3 > v2 > v1), bỏ qua file tạm `~$`
3. Mở file xlsx, tìm sheet chính (không phải Overview/Revisions/WFDesign/Test Plan&report/Master Plan)
4. Đếm các row có `TC_xxx` ở cột A. Mỗi row được tính **2 test case**: cột G (Round 1 - iOS) + cột K (Round 1 - Android), cell trống hoặc `None` được tính là `Untested`.
5. Tính **Test Coverage** và **Test Success Coverage** theo công thức:
   - `Test Coverage = (Pass + Fail) / (Total - Pending - N/A)`
   - `Test Success Coverage = Pass / (Total - Pending - N/A)`
   - Nếu `(Total - Pending - N/A) <= 0` → hiển thị `—`
6. Dòng TỔNG CỘNG: áp dụng công thức trên với tổng các UC (không phải average của %).
7. Xuất kết quả dưới dạng JSON

### Step 2: Hiển thị kết quả trên chat

Từ JSON output của script, format thành bảng markdown và hiển thị trực tiếp cho user:

```markdown
## Bảng tổng hợp Test Cases — QC Mobile

| # | UC | File | Total | Pass | Fail | Untested | Pending | N/A | Test Coverage | Test Success Coverage |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | UC1 | UC1_..._v1.xlsx | 81 | 0 | 0 | 81 | 0 | 0 | 0.0% | 0.0% |
...
| | | **TỔNG** | **X** | ... | **avg%** | **avg%** |

## Tỷ lệ
- Pass rate: X%
- Fail rate: X%
```

### Step 3: Xác nhận output files

Thông báo cho user đường dẫn 2 file output:
- `.md`: `docs/QC/testcases/TC-summary/[YYYYMMDD]/TC-summary_[YYYYMMDD]_v[N].md`
- `.xlsx`: `docs/QC/testcases/TC-summary/[YYYYMMDD]/TC-summary_[YYYYMMDD]_v[N].xlsx`

## Output

| Artifact | Path |
|---|---|
| Summary (.md) | `docs/QC/testcases/TC-summary/[YYYYMMDD]/TC-summary_[YYYYMMDD]_v[N].md` |
| Summary (.xlsx) | `docs/QC/testcases/TC-summary/[YYYYMMDD]/TC-summary_[YYYYMMDD]_v[N].xlsx` |

## Error Handling

- Nếu file xlsx bị lock (đang mở trong Excel): bỏ qua file đó và ghi chú trong report
- Nếu không tìm thấy file xlsx nào: thông báo "Không tìm thấy file testcase"
- Nếu openpyxl chưa cài: hướng dẫn `pip install openpyxl`

## Notes

- Script đếm Round 1 cho cả iOS (cột G) và Android (cột K). Round 2 (cột O/Q) chưa được đọc — nếu cần, mở rộng logic.
- Version mới nhất được xác định bằng regex `_v(\d+)\.xlsx$`
- Folder `_summary` được tạo tự động nếu chưa tồn tại
