# Document quality loop

How generated documents are re-examined until they are fit to send.

## The loop
1. **Generate the sample pack.** Run `npm run docs:samples`. It produces the seven documents on the generation service for one fictional founder company, "Northwind Analytics", using only founder-style inputs:
   - CIM
   - executive summary
   - investor deck
   - teaser
   - data-room index
   - closing checklist
   - board memorandum

   Each document is written as Markdown, as HTML, and as PDF through Dispatch's real renderer, into `docs/documents/samples/`. The command also writes `QUALITY_REVIEW.md` there.
2. **Automated review** (`src/lib/documents/quality.ts`).
   - Each document is scored out of 100.
   - **Critical** findings:
     - contradictions with the company's figures, the valuation, the timeline or the checklist;
     - pre-NDA disclosure;
     - placeholders or empty sections.
   - **Major** findings:
     - broken phrasing (articles, a missing noun, doubled or repeated words);
     - unsupported superlatives;
     - content too thin for the document's job.
   - **Minor** findings:
     - long sentences;
     - repeated sentences;
     - filler;
     - mixed number formats.
   - A document passes at a score of 90 or more with no critical finding.
3. **Quality gate** (`quality.test.ts`, part of `npm test`).
   - Every document must pass.
   - Assumed values and seller-only material must never appear in buyer documents.
   - Tables must reach the rendered document.

   A change that makes a document worse fails the build.
4. **Human review.** Read the PDFs. The rules cannot judge whether the argument persuades, whether something a buyer expects is missing, or how the page looks. Every human finding becomes either a template fix or a new rule, so it cannot come back.
5. **Repeat** from step 1.

## Rounds on 13 October 2026

| Round | Passed (of 7) | What it found | What changed |
|---|---|---|---|
| 1 | 1 | 7 critical, 30 major findings. Some were false positives in the review itself: bullets misread across lines, table cells read as prose, rounding. Real defects: "a saas operating in vertical saas"; "leader differentiation"; timeline lines repeating their own label; everything far too thin. | Consistency checks became line-bounded and rounding-aware. Profile codes became plain English (`prose.ts`). The CIM, summary, deck and teaser were rewritten from the company's data: customers, ownership, risks, important notice, basis of preparation. "Profitable while compounding" now appears only when EBITDA is positive. |
| 2–3 | 2 → 7 | Doubled "a a". Board memo: "vv1" on the reference line, a timeline contradiction (50–178 days against weeks 10–16), "and adjacent markets", the recommendation labelled "Resolved". | Version stamp fixed. Comparable-deal timing labelled as such. Unsupported claims removed. Board memo given a background, the timeline, proposed resolutions and a basis. "Resolved" became "Proposed". |
| 4 (human read) | 7 | **Tables were dropped from every rendered document.** The CIM, which goes to buyers, listed the seller's target buyers with probabilities and its own readiness advice ("not an auction"). **Thirteen profile fields the founder never supplies were stated as facts:** market size (revenue × 200), headcount (revenue ÷ $350k), a fixed 40/45/15 cap table, "ahead of its competitors", architecture, gross retention. The ARR history table was invented. | Tables rendered. Seller-side sections removed from the CIM. `MemorandumInputs.assumed`: documents state only supplied facts and say what is still missing. The Autonomous Exit run now uses the same inputs (it was falling back to "Project Cipher"). The ARR table shows only what the growth rate implies. |
| 5–6 | 7 | Repeated words in new copy. The PDF banner read "CORPORATE STRICTLY CONFIDENTIAL". Headings were orphaned at the foot of a page. Board-memo sections were reordered by Dispatch. | Copy fixed. Dispatch renderers (HTML, Markdown, DOCX) drop the scheme name for corporate documents and keep headings with their content. The board memo carries an explicit section order, and a test checks it. |

| 7–12 (deliverable 4) | 14 of 14, two companies | Valuation in buyer documents (CIM, summary, deck, teaser, Management Presentation); thirteen inferred facts across readiness, diligence, Exit Score, Claude inputs; wrapped checklist cells and an unreadable six-column market table in the PDF; an empty column; weaknesses listed as highlights; half-filled rows reaching documents. | Valuation removed and gated; profile-carried assumed list; evidence-driven CIM with stated gaps; two independent gates; PDF inspection with pdftotext/pdfinfo; renderer and template fixes; a regression test for each. |

## Two gates
Since deliverable 4 the review has two gates, and a document is accepted only when both pass:
- **Gate A, integrity:**
  - figures and consistency;
  - provenance: no assumed value stated, no invented period;
  - confidentiality and seller-only leaks, in the model, the metadata and every rendering;
  - placeholders;
  - document state.
- **Gate B, communication and rendering:**
  - structure and substance for the purpose: every section written or its gap stated;
  - phrasing and claims;
  - readable tables;
  - every heading and table row present in the Markdown, the HTML preview and the PDF.

A perfect text score never offsets a failed PDF inspection.

## Where it stands
- **Sample pack.** All 14 documents for two companies pass both gates.
  - The full-story CIM is about 2,060 words and 97% supported by the company's information.
  - The headline-only CIM is about 1,390 words and 33% supported, with every gap stated professionally.
  - Length follows the evidence, never filler.
- **Valuation is out of every buyer-facing document** (owner decision). It stays in the valuation report and board materials.
- **What remains is the company's own information.** A founder adds it on the Company Story page, and the documents grow with it. Server storage of the story waits on the migration being applied (O-9).
- **Human review stays a separate requirement.** Each problem a reviewer finds becomes a template fix or a new rule, with a regression test.
