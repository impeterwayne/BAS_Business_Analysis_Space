"""
TC Summary Script — Scan testcases folder and aggregate test result statuses.
Usage: python tc_summary.py [--output-dir PATH]
"""
import os
import re
import sys
import io
import json
from pathlib import Path
from datetime import date
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

try:
    import openpyxl
    from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
except ImportError:
    print("ERROR: openpyxl is required. Install with: pip install openpyxl")
    sys.exit(1)

TESTCASES_DIR = Path(__file__).resolve().parents[4] / "docs" / "QC-MOBILE" / "testcases"
SKIP_SHEETS = {"overview", "revisions", "wfdesign", "test plan&report", "test plan & report", "master plan"}
STATUS_KEYS = ["Pass", "Fail", "Untested", "Pending", "N/A"]


def find_latest_xlsx(folder: Path) -> Path | None:
    xlsx_files = []
    for f in folder.iterdir():
        if f.suffix == ".xlsx" and not f.name.startswith("~$") and "_testcases_" in f.name:
            match = re.search(r"_v(\d+)\.xlsx$", f.name)
            if match:
                xlsx_files.append((int(match.group(1)), f))
    if not xlsx_files:
        return None
    xlsx_files.sort(key=lambda x: x[0], reverse=True)
    return xlsx_files[0][1]


def find_test_sheet(wb) -> str | None:
    for name in wb.sheetnames:
        if name.lower().strip() not in SKIP_SHEETS:
            return name
    return wb.sheetnames[0] if wb.sheetnames else None


def compute_coverage(total: int, pass_n: int, fail_n: int, pending_n: int, na_n: int) -> tuple:
    """Compute Test Coverage and Test Success Coverage.

    Test Coverage = (Pass + Fail) / (Total - Pending - N/A)
    Test Success Coverage = Pass / (Total - Pending - N/A)
    Returns (None, None) when denominator <= 0.
    """
    denom = total - pending_n - na_n
    if denom <= 0:
        return None, None
    return (pass_n + fail_n) / denom, pass_n / denom


def count_statuses(filepath: Path) -> dict:
    result = {"file": filepath.name, "total": 0, "statuses": Counter(),
              "test_coverage": None, "test_success_coverage": None}
    try:
        wb = openpyxl.load_workbook(filepath, read_only=False, data_only=True)
    except Exception:
        try:
            wb = openpyxl.load_workbook(filepath, read_only=True)
        except Exception as e:
            result["error"] = str(e)
            return result

    sheet_name = find_test_sheet(wb)
    if not sheet_name:
        wb.close()
        return result

    ws = wb[sheet_name]
    for row in ws.iter_rows(min_row=1, max_row=ws.max_row, values_only=True):
        if row[0] and str(row[0]).strip().startswith("TC_"):
            for col_idx in (6, 10):
                raw = row[col_idx] if len(row) > col_idx else None
                status = str(raw).strip() if raw else "Untested"
                if status == "None":
                    status = "Untested"
                result["statuses"][status] += 1
                result["total"] += 1
    wb.close()

    s = result["statuses"]
    tc, tsc = compute_coverage(
        result["total"], s.get("Pass", 0), s.get("Fail", 0),
        s.get("Pending", 0), s.get("N/A", 0),
    )
    result["test_coverage"] = tc
    result["test_success_coverage"] = tsc
    return result


def _uc_sort_key(folder_name: str) -> int:
    match = re.search(r"UC(\d+)", folder_name)
    return int(match.group(1)) if match else 9999


def scan_all_uc_folders(testcases_dir: Path) -> list[dict]:
    results = []
    if not testcases_dir.exists():
        return results
    folders = [f for f in testcases_dir.iterdir() if f.is_dir() and f.name != "TC-summary"]
    for folder in sorted(folders, key=lambda f: _uc_sort_key(f.name)):
        xlsx_file = find_latest_xlsx(folder)
        if xlsx_file:
            data = count_statuses(xlsx_file)
            data["uc_id"] = folder.name
            results.append(data)
    return results


def _fmt_pct(value) -> str:
    if value is None:
        return "—"
    return f"{value * 100:.1f}%"


def generate_md_report(results: list[dict], output_path: Path) -> str:
    today = date.today().strftime("%Y-%m-%d")
    lines = [
        "# Test Cases Summary Report — QC Mobile",
        f"**Ngày:** {today} | **Tác giả:** QC Agent | **Phiên bản:** v1",
        "",
        "---",
        "",
        "| # | UC | File | Total | Pass | Fail | Untested | Pending | N/A | Test Coverage | Test Success Coverage |",
        "|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|",
    ]

    totals = Counter()
    for i, r in enumerate(results, 1):
        s = r["statuses"]
        tc = r.get("test_coverage")
        tsc = r.get("test_success_coverage")
        lines.append(
            f"| {i} | {r['uc_id']} | {r['file']} | {r['total']} "
            f"| {s.get('Pass',0)} | {s.get('Fail',0)} | {s.get('Untested',0)} "
            f"| {s.get('Pending',0)} | {s.get('N/A',0)} "
            f"| {_fmt_pct(tc)} | {_fmt_pct(tsc)} |"
        )
        totals["total"] += r["total"]
        for k in STATUS_KEYS:
            totals[k] += s.get(k, 0)

    total_coverage, total_success = compute_coverage(
        totals["total"], totals["Pass"], totals["Fail"],
        totals["Pending"], totals["N/A"],
    )
    lines.append(
        f"| | | **TỔNG CỘNG** | **{totals['total']}** "
        f"| **{totals['Pass']}** | **{totals['Fail']}** | **{totals['Untested']}** "
        f"| **{totals['Pending']}** | **{totals['N/A']}** "
        f"| **{_fmt_pct(total_coverage)}** | **{_fmt_pct(total_success)}** |"
    )

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Tỷ lệ thực thi")
    lines.append("")

    total = totals["total"]
    if total > 0:
        executed = totals["Pass"] + totals["Fail"]
        pass_rate = (totals["Pass"] / total) * 100
        fail_rate = (totals["Fail"] / total) * 100
        exec_rate = (executed / total) * 100
        lines.append(f"- **Tổng TC:** {total}")
        lines.append(f"- **Đã thực thi:** {executed} ({exec_rate:.1f}%)")
        lines.append(f"- **Pass rate:** {pass_rate:.1f}%")
        lines.append(f"- **Fail rate:** {fail_rate:.1f}%")
        lines.append(f"- **Chưa test:** {totals['Untested']} ({(totals['Untested']/total)*100:.1f}%)")
    else:
        lines.append("- Không có test case nào.")

    lines.append("")

    content = "\n".join(lines)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    return content


def generate_xlsx_report(results: list[dict], output_path: Path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "TC Summary"

    header_font = Font(bold=True, size=11)
    header_fill = PatternFill(start_color="FF4472C4", end_color="FF4472C4", fill_type="solid")
    header_font_white = Font(bold=True, size=11, color="FFFFFF")
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin")
    )
    center = Alignment(horizontal="center", vertical="center")

    headers = ["#", "UC", "File", "Total", "Pass", "Fail", "Untested", "Pending", "N/A",
               "Test Coverage", "Test Success Coverage"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = header_font_white
        cell.fill = header_fill
        cell.alignment = center
        cell.border = thin_border

    totals = Counter()
    for i, r in enumerate(results, 1):
        s = r["statuses"]
        tc = r.get("test_coverage")
        tsc = r.get("test_success_coverage")
        row_data = [
            i, r["uc_id"], r["file"], r["total"],
            s.get("Pass", 0), s.get("Fail", 0), s.get("Untested", 0),
            s.get("Pending", 0), s.get("N/A", 0),
            tc, tsc
        ]
        for col, val in enumerate(row_data, 1):
            cell = ws.cell(row=i + 1, column=col, value=val)
            cell.border = thin_border
            if col >= 4:
                cell.alignment = center
            if col in (10, 11) and val is not None:
                cell.number_format = "0.0%"
        totals["total"] += r["total"]
        for k in STATUS_KEYS:
            totals[k] += s.get(k, 0)

    total_coverage, total_success = compute_coverage(
        totals["total"], totals["Pass"], totals["Fail"],
        totals["Pending"], totals["N/A"],
    )

    total_row = len(results) + 2
    total_data = ["", "", "TỔNG CỘNG", totals["total"],
                  totals["Pass"], totals["Fail"], totals["Untested"],
                  totals["Pending"], totals["N/A"],
                  total_coverage, total_success]
    for col, val in enumerate(total_data, 1):
        cell = ws.cell(row=total_row, column=col, value=val)
        cell.font = Font(bold=True)
        cell.border = thin_border
        if col >= 4:
            cell.alignment = center
        if col in (10, 11) and val is not None:
            cell.number_format = "0.0%"

    ws.column_dimensions["A"].width = 5
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 55
    ws.column_dimensions["D"].width = 10
    ws.column_dimensions["E"].width = 10
    ws.column_dimensions["F"].width = 10
    ws.column_dimensions["G"].width = 12
    ws.column_dimensions["H"].width = 12
    ws.column_dimensions["I"].width = 8
    ws.column_dimensions["J"].width = 16
    ws.column_dimensions["K"].width = 22

    output_path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output_path)
    wb.close()


def get_next_version(output_dir: Path, prefix: str, ext: str) -> tuple[int, Path]:
    existing = list(output_dir.glob(f"{prefix}_v*{ext}"))
    max_v = 0
    for f in existing:
        m = re.search(r"_v(\d+)" + re.escape(ext) + "$", f.name)
        if m:
            max_v = max(max_v, int(m.group(1)))
    new_v = max_v + 1
    filename = f"{prefix}_v{new_v}{ext}"
    return new_v, output_dir / filename


def main():
    testcases_dir = TESTCASES_DIR
    today_str = date.today().strftime("%Y%m%d")
    output_dir = testcases_dir / "TC-summary" / today_str

    results = scan_all_uc_folders(testcases_dir)

    if not results:
        print("Không tìm thấy file testcase xlsx nào.")
        return

    prefix = f"TC-summary_{today_str}"

    _, md_path = get_next_version(output_dir, prefix, ".md")
    _, xlsx_path = get_next_version(output_dir, prefix, ".xlsx")

    md_content = generate_md_report(results, md_path)
    generate_xlsx_report(results, xlsx_path)

    output = {
        "md_path": str(md_path),
        "xlsx_path": str(xlsx_path),
        "md_content": md_content,
        "total_uc": len(results),
        "total_tc": sum(r["total"] for r in results),
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
