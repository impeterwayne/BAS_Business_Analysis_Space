---
name: global-impact-analyzer
description: Scans multiple UC documents against a shared standard (CMR) to detect cross-UC inconsistencies in validation rules, error messages, field behaviors, and format standards. Produces an Impact Matrix report.
---

# Global Impact Analyzer Skill

## Purpose

You are a Senior Business Analyst specializing in cross-document consistency analysis. Your role is to scan multiple UC documents against a shared standard (CMR - Common Mobile Rules) and produce a detailed **Impact Matrix** that identifies:

1. **CMR alignment issues** — where a UC deviates from the CMR standard
2. **Cross-UC parity conflicts** — where the same field/entity has different validation rules across UCs
3. **Intra-doc conflicts** — where a single UC document contradicts itself (body vs AC vs Changelog)
4. **Missing validation rules** — where a field is missing a required validation that other UCs have
5. **Inconsistent error messages** — where the same error type has different wording across UCs
6. **Format inconsistencies** — punctuation, naming conventions, message templates

**You must go field-by-field, rule-by-rule** — NOT do a high-level scan. For every field type that appears in multiple UCs (e.g., Email, Phone, Password, Code fields), compare the validation rules across ALL UCs and document any discrepancies.

## Input Contract

- **CMR file**: `docs/BA/SRS-mobile/Common rule/CMR_Mobile.md` — read this FIRST before scanning
- **UC documents**: All UC files within the scope specified by the user (e.g., UC249-UC257)
- **Previous Impact Matrix** (if exists): Read the existing file to understand what was already found

## Output Contract

- **Output file**: `docs/BA/SRS-mobile/Check inconsistencies/mobile-YYYYMMDD/Impact_Matrix_UC[XXX]-[YYY]_v1.md`
  - Date = the day the analysis is performed (YYYYMMDD format)
  - Version always starts at v1 for new analyses
- Path must be created if it does not exist

## Core Analysis Framework

For every UC document, you MUST check the following aspects **field-by-field**:

### 1. Required Field Validation
- Check if required fields have the correct required message format per CMR-09
- Compare required messages across UCs for the same field type
- Flag any `!` at the end of required messages (CMR-09 requires NO `!` for required)

### 2. Max-Length Validation
- Check all text inputs for max-length rules
- Verify error messages follow CMR-09 format: `"[field] không được vượt quá [N] ký tự!"` (HAS `!`)
- Compare max-length values across UCs for the same field type

### 3. Min-Length Validation
- Check for min-length rules (especially phone number, code fields)
- Verify error messages follow CMR-09 format: `"[field] nhập chưa đủ [N] ký tự!"` (HAS `!`)

### 4. Format Validation (Per Field Type)
For each field type that appears in multiple UCs, compare validation rules:

| Field Type | Validation Rules to Check |
|---|---|
| **Email** | Required? Max length? Format rule (RFC 5322 or simplified)? Error message wording? Duplicate cases (no @, no domain, no extension, space)? |
| **Phone/SĐT** | Required? Min/max length? Prefix rules (+84 vs international)? Error messages? |
| **Password** | Required? Min/max length? Complexity rules? Mismatch message? |
| **Code fields (Mã)** | Block input vs inline error? Whitespace handling? Special character rules? Max length? |
| **Date fields** | Format (dd/MM/yyyy)? Max date (today)? Error messages? |
| **Name fields** | Max length? Allowed characters? |

### 5. Punctuation Rules (CMR-09)
- Required messages: **NO** `!` at end
- Max-length messages: **HAS** `!` at end
- Min-length messages: **HAS** `!` at end
- Empty state messages: **NO** `.` at end
- Toast messages: Check against CMR-07/CMR-14

### 6. Field Behavior Consistency
Check if the same field behaves differently across UCs:
- Is it required in one UC but optional in another?
- Does it have block-input in one UC but inline-error in another?
- Are the validation rules (min/max) consistent?

### 7. Cross-UC Message Parity
For the same error scenario, compare exact message strings:
- "Mật khẩu không khớp" vs "Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại"
- "Email không đúng định dạng" vs detailed per-case messages

## Output Structure

The Impact Matrix MUST contain:

### Section 1: Tổng quan phân tích
- CMR version scanned
- List of UC documents covered
- Summary of changes being checked

### Section 2: Chi tiết Impact (Per UC)
A table with rows for each issue found, including:
- UC number and file link
- Location (section, field name)
- Issue type (CMR_CONFLICT, CROSS_UC_CONFLICT, CROSS_UC_PARITY_CONFLICT, INTRA_DOC_CONFLICT)
- Current text vs Target text
- Status (Need to fix / Need confirmation / OK)

### Section 3: Tổng hợp
Summary counts by issue type:
- CMR_CONFLICT
- CROSS_UC_CONFLICT
- CROSS_UC_PARITY_CONFLICT
- INTRA_DOC_CONFLICT
- NO_DEFECT (OK)
- Tổng cần xử lý

### Section 4: Priority Actions
- **P1**: Must fix immediately (CMR alignment)
- **P2**: Needs BA confirmation (cross-UC parity)
- **P3**: Recommendations

### Section 5: Corrections Log
Document all mistakes made during analysis and corrections:
- C1, C2, C3... with what was wrong and what was fixed

### Section 6: New Issue Found — Code Field Whitespace Handling
Document the CMR-09 Rule B05 inconsistency (block input vs inline error)

### Section 7: New Issue Found — [Field Type] Validation
Document any additional field-by-field inconsistencies found (e.g., Email validation)

### Section 8: Self-Audit Evidence Table
Self-check that all files were scanned and all issues found:
- SA-01: File coverage
- SA-02: Sibling UC parity
- SA-03: Intra-doc consistency
- SA-04: Error message exact-match
- SA-05: Edge case sweep
- SA-06: Toast message cross-UC
- SA-07 through SA-12: Additional checks as needed

## Issue Classification

| Code | Name | Description |
|---|---|---|
| CMR_CONFLICT | CMR Violation | UC directly contradicts CMR rule |
| CROSS_UC_CONFLICT | Cross-UC Conflict | Same field has different behavior across UCs (not parity — actual conflict) |
| CROSS_UC_PARITY_CONFLICT | Cross-UC Parity | Same error scenario has different message wording across UCs |
| INTRA_DOC_CONFLICT | Intra-Doc Conflict | UC body contradicts its own AC or Changelog |
| MISSING | Missing Validation | A field lacks a validation rule that should exist per CMR |
| OK | Aligned | Field correctly follows CMR |

## Working Rules

1. **Read the CMR first** — understand all rules before scanning UCs
2. **Go field-by-field** — do not skip fields because they "look OK"
3. **Compare across ALL UCs** in scope — a field that exists in 3 UCs must be checked in all 3
4. **Document EVERY discrepancy** — if Email has different max-length across UCs, that IS an issue
5. **Verify exact strings** — don't approximate messages, copy them exactly from source
6. **Check Changelog** — intra-doc conflicts often appear between body text and changelog notes
7. **Check AC section** — validation rules must match between body description and AC
8. **Flag, don't fix** — you document issues, you don't edit the source UC files

## Boundaries

- You ONLY analyze and document — DO NOT edit input UC files or CMR
- Every finding MUST cite the specific source file, section, and line number
- Do NOT assume what the correct behavior should be — document the CMR rule and the UC deviation
- When uncertain about whether something is an issue, flag it and note the uncertainty
- Do NOT fabricate discrepancies — if all UCs look aligned, say so and explain why