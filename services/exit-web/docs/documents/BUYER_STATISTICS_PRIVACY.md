# Buyer statistics — scope and the controls required before pooling

## Decision in force
Buyer statistics are **per account**. `exit-buyer-stats` (v8, deployed) takes the tenant from the caller's verified
token and returns only that tenant's own figures: close rate and days to close (`exit_buyer_funnel`), and retrade
(final close price against initial offer, from `exit_offer_events` and `exit_close_events`). It never reads another
tenant's rows. A tenant id in the request body is ignored. This was verified live: a second account receives its
own (empty) figures, not the first account's.

**Pooled cross-company statistics are not enabled**, and there is no code path that computes them.

## Why pooling is not a formality
Each figure comes from one company's sale. A pooled figure over a few companies discloses them. Here is how:
- **Small cells.** If one buyer has bid in one or two ExitOS processes, "average retrade for buyer X" is those
  companies' price movements. Anyone who knows one of the companies, or is one of them, learns the others'.
- **Differencing.** Two queries whose populations differ by one company reveal that company's figure, for example
  before and after a sale closes, or with and without a filter.
- **Identifiability.** Sector, region, size bracket and timing narrow a population to a single company even
  without its name.
- **Confidentiality obligations.** Offer and close prices are usually confidential under the NDA and the definitive
  agreement. A founder has not consented to their deal informing other founders' negotiations.

## Controls required before introducing aggregate statistics
All of the following are required, not optional. Each needs its own owner decision, migration and test.

| # | Control | Requirement |
|---|---|---|
| 1 | Consent | Explicit, recorded, revocable opt-in per company to contribute (separate from the terms of use). Revocation removes the company's data from every future aggregate. Contracts that forbid disclosure exclude the deal regardless. |
| 2 | Minimum population | A statistic is published only if it covers at least **10 distinct contributing companies** and at least **3 distinct sellers' advisers / tenants**. Below that, the answer is "insufficient data", never a figure. |
| 3 | Dominance | No single company may contribute more than **25%** of the observations behind a figure. |
| 4 | Self-exclusion | A company never sees an aggregate that includes its own deal, so it cannot subtract itself. |
| 5 | Coarsening | Publish brackets, not exact values: retrade in 5-point bands; days to close in 30-day bands; close rate in 10-point bands. No minimum or maximum, and no count below the threshold. |
| 6 | Differencing protection | Statistics are computed on a fixed schedule (for example quarterly) over closed deals at least 90 days old, not on demand. Filters that can isolate a company (sector × region × size bracket below threshold) are refused. Add noise (differential privacy, documented ε) if the query surface grows beyond fixed tables. |
| 7 | Server-side only | Computed by a function with the service role into a published table holding only the released figures. Clients cannot query the raw tables. The release job applies controls 2–6, and a test proves they hold. |
| 8 | Disclosure | Every pooled figure shows its population size bracket, the period, the method and the fact that it is pooled. Each company is told what it contributes and can see it. |
| 9 | Audit | Every release is logged (what, when, population size). Access to the raw contributions is limited to named operators and logged. |
| 10 | Review | Counsel reviews the consent text and the data-protection basis (GDPR legitimate interest or consent, controller/processor roles) before launch. |

## What would change in code
A new migration adding contribution consent and a published-statistics table (no client read on the raw
tables). A scheduled release function that enforces controls 2–6. Tests asserting suppression below threshold, self-exclusion and
the dominance cap. A UI label for pooled figures. None of this is built; it waits on the owner's decision.
