# @exit/engines

Six computational engines that power ExitOS. Consumed by `exit-web`
(SPA) and the forthcoming `exit-api` service. The engines are
deterministic where the math is deterministic, pluggable where an LLM
is required, and the marketplace engine composes all five upstream
engines into a single founder-facing run.

## Engines

| # | Engine | Status | Surface |
|---|---|---|---|
| 1 | Company Valuation Engine     | Deterministic | `runValuation`, `strategicBuyerReport`, `assetReplacementReport` |
| 2 | Acquisition Memorandum Generator | Interface + Claude adapter + deterministic template fallback | `TemplateMemorandumGenerator`, `ClaudeMemorandumGenerator` |
| 3 | Strategic Buyer Discovery     | Deterministic + curated buyer registry | `runBuyerDiscovery` |
| 4 | Due Diligence Engine         | Deterministic doc-spec generator | `runDueDiligence` |
| 5 | Exit Readiness Score          | Deterministic weighted score | `runReadiness` |
| 6 | Acquisition Marketplace Engine | Composer over 1–5 | `runMarketplace` |

## The marketplace flow

`runMarketplace(company)` is the "AI investment bank" the user
described. Given one `CompanyProfile`, it produces:

1. **Three valuation reports** — standard, strategic, asset replacement
2. **Exit Readiness Score** with band, dimensions, strengths, gaps, recommendations
3. **Ranked buyer list** with probability, signals, estimated check
4. **Diligence package spec** — seven standard documents (financial, market, user growth, technical, security, legal, commercial)
5. **Five memoranda** — CIM, executive summary, investor deck (10 slides), anonymized buyer teaser, DD room index

All composed into a single `MarketplaceRun` record.

## Usage

```ts
import { runMarketplace, ClaudeMemorandumGenerator } from '@exit/engines';

const run = await runMarketplace(company, {
  memorandumGenerator: process.env.ANTHROPIC_API_KEY
    ? new ClaudeMemorandumGenerator({ apiKey: process.env.ANTHROPIC_API_KEY })
    : undefined,            // falls back to TemplateMemorandumGenerator
  buyerLimit: 20,
  anonymizeTeaser: true,
});

console.log(run.headlineProposition);
// → "Ledgerline — vertical saas · 12.0M ARR. Headline range $52.3M – $186.4M.
//    Readiness 78/100 (strategic acquisition).
//    9 qualifying buyers; top candidate Vista Enterprise Software Bolt-On @ 88%."

console.log(run.memoranda.cim.sections);          // CIM sections
console.log(run.buyers.candidates.slice(0, 5));   // top-5 buyers
console.log(run.diligence.criticalQuestions);     // pre-flight DD warnings
```

## Methodology

### Valuation
Multiples-driven blend of ARR, TTM revenue, EBITDA and GMV with
sector-specific bands. Country adjustments applied per ISO
jurisdiction. Premiums for Rule of 40, Net Retention > 120%,
network effects / data moat / AI-native; discounts for customer
concentration > 50%. Preference-stack floor applied to the low band.

### Readiness
Weighted score across five dimensions: Revenue Quality (30%), Market
Penetration (20%), Technology Moat (20%), Competitive Advantage (15%),
Scalability (15%). Banded: `not_ready` < 35 < `seed_acquisition` <
55 < `growth_acquisition` < 75 < `strategic_acquisition`.

### Buyer Discovery
Each registry entry scored against the company on five dimensions:
sector fit (30%), model fit (15%), check-size fit (25%), geography
fit (10%), acquirer activity fit (20%). Final probability is the
weighted blend.

### Diligence
Generates seven document specs (financial, market, user growth,
technical architecture, security, legal, commercial) with sections,
artifact lists and questions targeted to the company profile.
Surfaces critical questions and red flags automatically.

### Memoranda
Template generator produces structurally-correct documents from the
engine inputs without an LLM (audit-traceable, deterministic).
Claude adapter overlays banker-quality prose; falls back to the
template generator on any API failure so the substrate is always
defensible.

## Boundary

This package is the **computational core only**. No persistence,
no auth, no I/O beyond the optional Anthropic fetch in the Claude
adapter. The `exit-web` SPA calls into it directly today; the future
`exit-api` will expose it via HTTP.

## Tests

```
npm test
```

31 tests cover all six engines: valuation math, readiness scoring,
buyer ranking, diligence spec generation, memorandum templating
(including the Claude adapter via stubbed fetch + fallback), and the
end-to-end marketplace composer.
