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

## Where it stands
Every document passes the automated review. What remains is not something rules can fix:
- **Thin content.** The CIM has about 1,200 words, where professional CIMs run to several thousand; the summary and deck are similar. The missing material is the company's own story:
  - history
  - products
  - customers and case studies
  - go-to-market
  - competitors
  - management biographies
  - market size with a source
  - the cap table

  ExitOS does not ask for any of it. The documents now say so rather than invent it. The fix is new intake fields (a product decision).
- **Valuation in the CIM.** The CIM states an enterprise value and range. Sell-side practice often keeps price guidance out of the CIM, so as not to anchor bids. This needs your decision.
- **Buyer names** come from ExitOS's registry, and their probabilities are model estimates. They appear only in internal documents (the board memorandum), labelled as such.
