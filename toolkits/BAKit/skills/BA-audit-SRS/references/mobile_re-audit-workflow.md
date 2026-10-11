## Mobile Re-Audit Workflow

Re-check previously reported SRS / UC gaps after BA, PO or Designer updates, preserving the audit history and
the question backlog. The review stays mobile-client focused (see the TEST SCOPE note in
`mobile_first-audit-workflow.md`). Use the same template as the previous version
(`mobile_srs_readiness_review_template.md` for Full SRS / module, `UC_readiness_review_template_v3.md` for a
single UC).

### Step 1 — Load the baseline

1. Locate the highest version of the audited file for this scope (SKILL.md → Output Contract).
2. Read the `*_question-backlog.md` — `Open Questions`, `Answered Questions` and any deferred items.
3. Read the updated sources: SRS / UCs, Figma analysis, diagrams, and the latest Product Decision Summary
   (`PD-*` may have moved from TBD to a decision in a new `v{N+1}`).
4. Record the exact versions reviewed; keep the previous gap IDs (`AUD-*`), question IDs, owners and
   severities.
5. If questions are still open, the user has already been asked (SKILL.md → Routing step 3). Proceed on what
   is available; unanswered items stay open. Never assume an answer.

### Step 2 — Verify fixes and apply answers

1. For **every** previous gap, compare its original assertion with the updated source and its evidence. Do
   not assume an item is resolved because the document was edited. Classify it `Resolved`, `Open`,
   `Reopened` or `Deferred`.
2. `Deferred` needs an explicit rationale, owner and downstream impact. A P0 / Critical item cannot become
   handoff-ready by being deferred.
3. Incorporate the BA / PO answers and confirmed decisions into the synthesis (Single UC: the 5 synthesis
   sections of the previous audited file, applying the Common Reference Resolution rule of
   `first-audit-workflow.md` Phase 1 Step 1 to the SRS global rules — legacy: CMR).
4. **Re-scan the design (mandatory for UI-bearing UCs).** Do not trust the previous Section 4 / UI coverage.
   Re-open every Figma screen / screenshot in scope, re-extract the components and redo the coverage delta
   check until it is 0.
5. Verify the specific improvements that were requested: feature coverage, UI Specification, flow branching,
   business rules, Product Decision alignment, diagram coverage and traceability.

### Step 3 — Regression and consistency

1. Check whether the edits created new issues in related UCs, shared BRs, navigation, diagrams, other
   features, permissions or dependencies.
2. Verify that User Flow and Activity coverage is still complete; shared diagram reuse stays valid. Inspect
   Sequence Diagrams only where complex interaction warrants them — a simple UC without one still passes.
3. Apply the conditional section policy: absent, non-applicable Ads / IAP and other optional sections are not
   defects.
4. Re-run the cross-artefact conflict check and the blocked artefact protocol
   (`mobile_first-audit-workflow.md` Step 10).

### Step 4 — Backlog maintenance and re-score

1. **Answered questions:** for every satisfactory answer, change the status in the backlog from `Open` to
   `Resolved` and move the row to the `Answered Questions` table.
2. **New questions:** for new conflicts or missing information (including those caused by the answers), call
   `BA-audit-QnA` to append them to the `Open Questions` table — no duplicates, new IDs continue the sequence.
3. Keep unresolved questions open; report unresolved PO decisions, never assume them.
4. Recompute the score with the same scheme as the first audit (`mobile_first-audit-workflow.md` Step 12 for
   Full SRS / module, Step 9 knowledge areas for a single UC), on applicable dimensions only. A high score
   never overrides an open P0 / Critical gap.
5. Issue the updated verdict — `Ready`, `Conditionally Ready` or `Not Ready` — with specific handoff
   conditions. "Ready for Dev/QA Handoff" only with no open P0.

### Step 5 — Generate audited v{N+1}

1. Update the Gap Report with statuses and linked evidence; keep the previous `AUD-*` IDs and add new IDs for
   new gaps. Fill section H (Re-audit Changes) of the mobile template, or the Unified Gap & Question Report of
   the UC template.
2. Update the `📋 Unified Gap & Question Report` to reflect resolved and new questions.
3. Add a Change Log / Changelog entry summarizing what answers, decisions and fixes were integrated and the
   score change.
4. Save as a new file next to the previous report, version `v{N+1}`, named per `ba-naming-convention`. Never
   overwrite the previous version.
5. Do not modify the SRS and do not generate test cases. Report the remaining corrections and their owners
   (`ba-spec-writer` for SRS / UC content, `ba-brainstormer` + `product-decision` for unresolved product
   choices) to the user.

> **Backlog sync:** the re-audit maintains `*_question-backlog.md` inline (Step 4.1 resolve, Step 4.2 append).
> No end-of-workflow chain to `BA-audit-QnA` is needed — that chain belongs to the first audit, where the
> backlog does not exist yet.
