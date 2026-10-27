# Source — Rewritten book review and publication workflow (verbatim)

Forwarded by the owner on 27 October 2026 with a screenshot of the rewritten-book preview (Demonology I, 16,088 words, "Editorial check: nothing blocks publishing, 3 to review; compare it with your original") and the question "iN THIS INTERFACE GOOD OR IT STILL SHORT SOME FUNTIONS?". The message repeated the review recorded in `2026-10-rewrite-review.md`, then gave the answer below. Recorded verbatim; DESIGN-SPEC.md §16 implements it.

---

Yes — the interface is visually clean and reasonably professional, but I would not consider the rewriting workflow complete yet. The main issue is not the modal's appearance; it is whether the functions behind it can guarantee that a rewritten book is genuinely ready for publication.

From your screenshot, I can see that Claude Studio already offers a useful foundation: a rewritten-book preview, an editorial-check summary, a word count, and actions for saving, checking, editing, rewriting, copying, and downloading Markdown.

However, there are important functions I would add or strengthen before treating this as the final book-production interface.

## 1. What is already good?

**Readable manuscript preview** — The white document surface, serif book title, and clear heading hierarchy make the manuscript look like a book rather than a raw AI response.

**Editorial check is visible** — Showing the check before saving is a good design decision. The current message says there are three items to review and suggests comparing the rewrite with the original.

**Useful document actions** — Editing before saving, copying, and downloading the Markdown provide a practical starting point for working with the manuscript.

**The manuscript can be inspected before commitment** — Keeping a preview separate from the final save action is sensible, provided saving does not silently overwrite the source or discard the ability to compare versions.

## 2. What functions are still missing or need strengthening?

Here are the improvements I would prioritize, based on the screenshot and the problems found in the manuscript.

**1. Side-by-side original and rewritten book (Critical)** — The current preview does not show the original beside the rewrite. Add synchronized comparison with highlighted additions, deletions, changed claims, and altered citations. The editor should be able to see exactly what Claude changed and restore the original wording where necessary.

**2. A detailed editorial report (Critical)** — The message "nothing blocks publishing, 3 to review" is too vague for a book containing structural, citation, and consistency problems. Clicking See the check should open a report showing each issue, its chapter and location, severity, explanation, suggested correction, and whether it has been resolved. The system should distinguish between an actual publishing blocker and a recommendation that requires the author's judgment.

**3. Book structure and completeness validation (Critical)** — Add an automatic check for:
- Missing chapters and sections.
- Duplicate or skipped numbering.
- Table of contents versus actual headings.
- Incomplete front matter and back matter.
- Broken cross-references.
- Empty sections and missing appendices.

The engine should check the entire manuscript, not just the passage currently being rewritten.

**4. Meaning and factual-integrity audit (Critical)** — Verify that the rewrite has not introduced unsupported claims, removed qualifications, changed the author's position, altered quotations, or invented references. For theological books, the audit should distinguish Scripture, interpretation, personal testimony, speculation, and independently verifiable claims.

**5. Version history and recovery** — Every rewrite should have a recoverable version. Users should be able to compare revisions, undo a correction, restore an earlier version, and keep the original manuscript untouched. This is especially important when the engine performs a second rewrite or automatically fixes several chapters.

**6. A genuine publication-readiness workflow** — Saving to the library should not be confused with publishing a finished book. Add an explicit final review that checks manuscript completeness, formatting, citations, and unresolved editorial issues. The user should see what passed, what failed, and what still requires human approval before the book is marked ready.

## 3. The bottom toolbar needs a better workflow

Your existing toolbar is a good start, but the actions are not organized around the full editorial process.

Recommended action hierarchy (suggested layout, not a claim about the current implementation):
- Review: Compare with original · Editorial report
- Edit manuscript · Correct selected issues
- Export Markdown / DOCX · Save version to library · Approve as publication-ready

The final approval action should become available only when the required checks pass and any mandatory human reviews are complete. Exporting a working draft should remain possible before that stage.

I would also move Rewrite this into a more controlled action. Instead of rerunning the entire book without clear boundaries, users should be able to choose a chapter, a selected passage, or the whole manuscript, specify the desired improvement, and preserve the previous version automatically.

## 4. The editorial check must become more intelligent

For your system, I recommend these distinct checks rather than one generic editorial score.

| Check | What it verifies |
|---|---|
| Language quality | Grammar, awkward sentences, clarity, tone, and repetition. |
| Structural integrity | Chapters, numbering, headings, and missing sections. |
| Source fidelity | Whether the rewrite preserves the original meaning and coverage. |
| Citation integrity | Quotations, references, unresolved citation markers, and bibliography. |
| Consistency | Names, terminology, capitalization, dates, and cross-references. |
| Logical coherence | Contradictions, unsupported conclusions, and weak transitions. |
| Publication formatting | Front matter, headings, lists, footnotes, and export compatibility. |

Each result should have evidence. For example, instead of merely saying "three issues to review," the system might report:
- Section 20: duplicate section numbering.
- Introduction: a claim requires a source or explicit attribution.
- References: bibliography needs verification.

These are illustrative examples drawn from the manuscript issues discussed earlier, not the actual three findings currently stored by your interface.

Important: "No blocking issues" should mean that the system has completed its required checks and found no unresolved blockers—not simply that the model returned a positive status.

## 5. What I would change visually

The modal is clean, but it is quite tall and uses much of its space for the document itself. I would make three refinements:
- Improve navigation: Add a compact header with the book title, current version, and review status.
- Use the available width better: Provide a distraction-free reading mode and a separate comparison mode instead of trying to fit every editorial function into one preview.
- Make review status meaningful: Show the actual number of blocking issues, warnings, and resolved items, rather than a reassuring sentence without enough detail.

I would retain the white reading surface, serif title typography, restrained blue accents, and rounded controls. The current design does not need a complete visual overhaul; it needs a stronger functional workflow.

## 6. The instruction I would give Claude Code

Claude Studio — Rewritten Book Review and Publication Workflow

Improve the existing rewritten-book preview in Polished Pages / Claude Studio. Preserve the current visual identity and existing working functionality. Do not rebuild the application from scratch.

**Objective** — Transform the rewritten-book preview from a basic document modal into a professional manuscript review, correction, versioning, and publication-readiness workspace. The system must distinguish between a rewritten manuscript, an editorially reviewed manuscript, and an approved publication-ready book.

**1. Inspect Before Changing Code** — Inspect the existing implementation, database schema, server functions, and workflow responsible for: generating rewritten manuscripts; running editorial checks; displaying editorial-check results; editing and saving rewritten books; saving manuscripts to the library; downloading Markdown and copying content. Identify which functions already exist, which are incomplete, and which are absent. Reuse existing components and services where appropriate. Do not invent successful functionality or replace working implementations without justification.

**2. Add Original-versus-Rewrite Comparison** — Implement a comparison workspace with: side-by-side original and rewritten text; synchronized navigation by chapter and section; highlighted additions, deletions, and modifications; clear indication of changed quotations, citations, numbers, names, and factual claims; the ability to inspect and restore original wording for an individual change; a summary of significant changes. Preserve the original source as an immutable version. Never silently overwrite it. If the original is unavailable, clearly indicate that fidelity comparison cannot be completed.

**3. Build a Detailed Editorial Report** — Replace the generic editorial-check message with a detailed report containing: issue identifier; severity: blocker, warning, or recommendation; category; chapter and section; relevant passage; explanation; proposed correction; status: open, resolved, dismissed, or requiring human review. Allow the user to navigate directly from an issue to its passage. Do not report checks as passed when they have not run. Distinguish completed checks, failed checks, skipped checks, and checks requiring human judgment.

**4. Implement Whole-Manuscript Validation** — Check: duplicate and missing section numbers; heading hierarchy and chapter sequence; table of contents versus actual manuscript structure; empty or incomplete sections; broken internal references; unresolved placeholders such as [citation needed]; incomplete bibliography and reference sections; inconsistent terminology and capitalization; missing or malformed front matter and back matter. Use deterministic validation for mechanically verifiable problems. Use AI review for semantic and editorial problems. Do not automatically invent missing chapters, references, quotations, or facts.

**5. Protect Meaning and Source Fidelity** — Compare the original and rewritten manuscript for: omitted arguments or sections; new claims that were not in the source; changes to the author's meaning or position; removed qualifications and uncertainty; altered quotations and citations; unsupported factual or academic assertions; inconsistent treatment of personal testimony, interpretation, and verified facts. Allow permitted editorial improvements without silently introducing new substantive content. Any substantive additions or unresolved source discrepancies must be visible in the editorial report.

**6. Improve Targeted Corrections** — Allow users to: correct a selected issue; improve a selected paragraph; rewrite a chapter; run a whole-book revision when explicitly requested. Pass the relevant source passage, surrounding context, original wording, and editorial constraints to the rewriting model. Preserve approved content outside the requested correction scope. Revalidate the manuscript after changes. Never mark an issue resolved merely because a correction was generated; verify the result.

**7. Add Version History** — Create recoverable manuscript versions with: version identifier; timestamp; operation performed; relevant editorial report; ability to compare, restore, and undo changes. Keep the original manuscript intact. Ensure that concurrent editing and saving cannot silently overwrite newer changes. Use the existing persistence architecture where possible.

**8. Separate Saving, Exporting, and Publication Approval** — Provide distinct actions for: save working version; save to library; export Markdown; export DOCX if supported by the existing document pipeline; approve as publication-ready. Do not imply that a book is publication-ready solely because it has been saved or exported. Require the configured publication checks to pass and mandatory human reviews to be completed before final approval. Permit users to export working drafts with an appropriate status.

**9. Improve the Interface** — Retain the current premium, restrained design and white reading surface. Improve: header hierarchy and version/status visibility; navigation between document and review report; access to original-versus-rewrite comparison; issue counts and review status; readability on smaller screens; loading, failure, empty, and unsaved-change states; confirmation when an operation could replace or discard edits. Keep the main reading area spacious. Do not overcrowd the bottom toolbar. Group actions according to review, correction, saving, and export.

**10. Testing and Acceptance Criteria** — Add or update tests covering: duplicate section numbers and missing sections; unresolved citation placeholders; original-text preservation; detection of substantive differences; editorial-report navigation; correction and revalidation; version restoration; save failures and concurrent edits; publication approval when blockers remain; export of working and approved manuscripts. Verify that the interface reflects real backend results rather than hardcoded statuses.

**Deliverables** — 1. A brief audit of existing functionality. 2. An implementation plan identifying reuse and necessary changes. 3. The completed changes. 4. Test results. 5. A list of remaining limitations. Work incrementally. Do not perform destructive migrations, overwrite source manuscripts, or claim that functionality works without testing it.

My recommendation: Keep this interface and improve it incrementally. The most valuable first change is to make See the check a real, evidence-based editorial report and connect it to the original-versus-rewrite comparison. Those two functions will help you discover why a manuscript is defective before you save it as a finished book.
