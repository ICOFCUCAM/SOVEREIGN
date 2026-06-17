import type { CompanyProfile, EngineMeta } from '../types.js';
import { runValuation, type ValuationBand } from './engine.js';
import { MULTIPLES } from './multiples.js';
import { ACQUISITION_HISTORY } from '../buyers/history.js';
import { premiumPct } from '../buyers/outcomes.js';
import { confidenceFromSample, type ConfidenceLabel } from '../buyers/expected-outcome.js';
import { runSimilarTransactions, type SimilarExit } from '../buyers/similar.js';
import { runAcquisitionIntelligence } from '../buyers/intelligence.js';
import { runBuyerDiscovery } from '../buyers/engine.js';
import { BUYER_REGISTRY } from '../buyers/registry.js';

// ── INSTITUTIONAL VALUATION ─────────────────────────────────────────
// Closes the gap between "professional enough for founders" and
// "credible to a PE firm, corp-dev team or banker". It does not invent
// a single number. It composes the engines already built:
//
//   · the multiples engine          → the financial baseline + methodology
//   · the precedent-transaction set → an EVIDENCE-BASED strategic premium
//                                      (a range and an applied figure drawn
//                                      from observed deals, never a flat 50%)
//   · the similar-transaction engine→ the comparable transactions used
//   · the acquisition-intelligence  → the qualified buyer universe, the
//                                      most-likely buyers, and time-to-close
//   · a confidence score            → data completeness × comparable depth
//                                      × sector maturity × financial quality
//
// Every figure traces to a source: the conclusion is explained, the
// premium is defended, and the range is justified by market evidence.

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number): string => `${Math.round(x * 100)}%`;
const usdM = (n: number): string => `$${(n / 1_000_000).toFixed(n >= 1e9 ? 0 : 1)}M`;

export interface PremiumEvidence {
  /** Observed premiums from precedent transactions, sorted ascending. */
  readonly observedPremiums: readonly number[];
  readonly rangeLowPct: number;
  readonly rangeHighPct: number;
  readonly appliedPct: number;
  readonly inSectorSample: number;
  readonly marketSample: number;
  readonly basis: 'in_sector' | 'market_prior' | 'neutral_prior';
  readonly confidence: ConfidenceLabel;
  readonly note: string;
}

export interface ConfidenceScore {
  readonly score: number;                 // 0–100
  readonly tier: 'Developing' | 'Medium' | 'Medium-High' | 'High';
  readonly drivers: {
    readonly dataCompleteness: number;    // 0–1
    readonly comparableDepth: number;     // 0–1
    readonly sectorMaturity: number;      // 0–1
    readonly financialQuality: number;    // 0–1
  };
  readonly note: string;
}

export interface MethodologyView {
  readonly name: string;
  readonly basis: string;
  readonly multiple?: number;
  readonly band: ValuationBand;
  readonly weightPct: number;             // normalized — the views sum to 100
  readonly evidence: string;              // why this range, in market terms
}

export interface LikelyBuyer {
  readonly name: string;
  readonly probabilityPct: number;
  readonly expectedDaysToCash: number;
}

export interface InstitutionalValuationReport {
  readonly meta: EngineMeta;
  readonly companyName: string;
  readonly headline: ValuationBand;            // strategic, evidence-premium applied
  readonly financialBaseline: ValuationBand;   // pre-strategic-premium
  readonly methodologies: readonly MethodologyView[];
  readonly premium: PremiumEvidence;
  readonly comparableTransactions: readonly SimilarExit[];
  readonly comparablesUsed: number;
  readonly confidence: ConfidenceScore;
  readonly buyerUniverse: { readonly qualified: number; readonly scored: number; readonly registry: number };
  readonly mostLikelyBuyers: readonly LikelyBuyer[];
  readonly timeToClose: { readonly lowDays: number; readonly highDays: number };
  readonly strategicRationale: readonly string[];
  readonly notes: readonly string[];
}

// Observed precedent premiums: same-sector first, market-wide as fallback.
// Only deals with a disclosed prior reference price contribute — we never
// impute a premium where the data doesn't support one.
function collectPremiums(sector: string): { inSector: number[]; market: number[] } {
  const inSector: number[] = [];
  const market: number[] = [];
  for (const e of ACQUISITION_HISTORY) {
    if (e.status === 'lost_bid') continue;
    const p = premiumPct(e);
    if (p == null || p <= 0) continue;
    market.push(p);
    if (e.sector === sector) inSector.push(p);
  }
  inSector.sort((a, b) => a - b);
  market.sort((a, b) => a - b);
  return { inSector, market };
}

function premiumEvidence(sector: string): PremiumEvidence {
  const { inSector, market } = collectPremiums(sector);
  let observed: number[];
  let basis: PremiumEvidence['basis'];
  let confidence: ConfidenceLabel;

  if (inSector.length >= 1) {
    observed = inSector;
    basis = 'in_sector';
    confidence = confidenceFromSample(inSector.length, 'in-sector precedent premiums');
  } else if (market.length >= 1) {
    observed = market;
    basis = 'market_prior';
    confidence = confidenceFromSample(0, 'in-sector precedent premiums'); // experimental: no in-sector evidence
  } else {
    observed = [];
    basis = 'neutral_prior';
    confidence = confidenceFromSample(0, 'precedent premiums');
  }

  const applied = observed.length ? mean(observed) : 0.20;          // 20% neutral prior, stated as such
  const rangeLow = observed.length ? observed[0]! : 0.10;
  const rangeHigh = observed.length ? observed[observed.length - 1]! : 0.30;

  const note =
    basis === 'in_sector'
      ? `Applied premium is the mean of ${inSector.length} observed ${sector.replace(/_/g, ' ')} precedent transaction(s).`
      : basis === 'market_prior'
        ? `No in-sector precedent with a disclosed reference price; applied premium is the mean of ${market.length} market-wide precedents (lower confidence).`
        : 'No precedent transaction carries a disclosed reference price; a 20% market-neutral prior is applied and flagged as experimental.';

  return {
    observedPremiums: observed,
    rangeLowPct: rangeLow,
    rangeHighPct: rangeHigh,
    appliedPct: applied,
    inSectorSample: inSector.length,
    marketSample: market.length,
    basis,
    confidence,
    note,
  };
}

function confidenceScore(
  company: CompanyProfile,
  comparablesUsed: number,
): ConfidenceScore {
  // data completeness — how many of the inputs the conclusion rests on are present
  const checks = [
    company.revenue.annualRecurringRevenueUsd > 0 || company.revenue.trailingTwelveMonthsRevenueUsd > 0,
    company.revenue.trailingTwelveMonthsRevenueUsd > 0,
    company.revenue.ebitdaMarginPct != null,
    company.revenue.netRetentionPct != null,
    company.revenue.customerConcentrationTop10Pct != null,
    company.growth?.arrGrowthYoyPct != null,
  ];
  const dataCompleteness = checks.filter(Boolean).length / checks.length;

  // comparable depth — 8+ source-referenced comparables = full credit
  const comparableDepth = clamp01(comparablesUsed / 8);

  // sector maturity — how many curated buyers actively mandate this sector
  const sectorBuyers = BUYER_REGISTRY.filter((b) => b.sectorsActive.includes(company.sector)).length;
  const sectorMaturity = clamp01(sectorBuyers / 10);

  // financial quality — rule-of-40, retention, concentration
  const rule40 = company.growth?.rule40 ?? ((company.growth?.arrGrowthYoyPct ?? 0) + (company.revenue.ebitdaMarginPct ?? 0));
  const nrr = company.revenue.netRetentionPct ?? 1;
  const conc = company.revenue.customerConcentrationTop10Pct ?? 0.25;
  const financialQuality = mean([
    clamp01(rule40 / 0.5),
    clamp01((nrr - 0.9) / 0.4),
    1 - clamp01(conc / 0.6),
  ]);

  const drivers = { dataCompleteness, comparableDepth, sectorMaturity, financialQuality };
  const score = Math.round(100 * (0.30 * dataCompleteness + 0.30 * comparableDepth + 0.20 * sectorMaturity + 0.20 * financialQuality));
  const tier: ConfidenceScore['tier'] =
    score >= 80 ? 'High' : score >= 60 ? 'Medium-High' : score >= 40 ? 'Medium' : 'Developing';

  return {
    score,
    tier,
    drivers,
    note: `Composite of data completeness (${pct(dataCompleteness)}), comparable depth (${comparablesUsed} on record), sector maturity (${sectorBuyers} active buyers) and financial quality (${pct(financialQuality)}).`,
  };
}

function strategicRationale(company: CompanyProfile): string[] {
  const label = company.sector.replace(/_/g, ' ');
  const out: string[] = [];
  out.push(`Immediate market entry — acquiring an operating ${label} platform versus a multi-year in-house build`);
  if (company.product?.hasDataMoat) out.push('Technology & data acquisition — proprietary data assets and the moat they create transfer with the deal');
  if (company.product?.hasNetworkEffects) out.push('Competitive positioning — denying a network-effects asset to a rival is worth a control premium');
  if ((company.revenue.netRetentionPct ?? 0) >= 1.05) out.push(`Customer acquisition — a durable, expanding base (NRR ${pct(company.revenue.netRetentionPct!)}) to cross-sell into the acquirer's install base`);
  else out.push("Customer acquisition — the company's logos and contracts transfer with the transaction");
  if (company.jurisdiction) out.push(`Geographic expansion — established presence in ${company.jurisdiction} and adjacent markets`);
  if ((company.revenue.ebitdaMarginPct ?? 0) > 0 || company.revenue.trailingTwelveMonthsRevenueUsd > 0) out.push('Cost synergies — consolidation of overlapping G&A, platform and go-to-market spend');
  return out.slice(0, 6);
}

export function runInstitutionalValuation(company: CompanyProfile): InstitutionalValuationReport {
  // 1) financial baseline + methodology (pre-strategic-premium)
  const standard = runValuation(company, { reportType: 'standard' });
  const financialBaseline = standard.headline;

  // 2) evidence-based strategic premium from precedent transactions
  const premium = premiumEvidence(company.sector);

  // 3) strategic headline = baseline × (1 + applied evidence premium)
  const strategic = runValuation(company, { reportType: 'strategic', strategicPremiumPct: premium.appliedPct });
  const headline = strategic.headline;

  // 4) normalized methodology views with market evidence per method
  const totalW = standard.methodologies.reduce((s, m) => s + m.weight, 0) || 1;
  const sectorMult = MULTIPLES[company.sector];
  const methodologies: MethodologyView[] = standard.methodologies.map((m) => {
    const band =
      /ARR/.test(m.name) ? sectorMult.arr
      : /Revenue/.test(m.name) ? sectorMult.revenue
      : /EBITDA/.test(m.name) ? sectorMult.ebitda
      : /GMV/.test(m.name) ? sectorMult.gmv
      : undefined;
    const evidence = band
      ? `${company.sector.replace(/_/g, ' ')} sector band ${band.low}×–${band.high}× (mid ${band.mid}×), trough-to-peak market conditions`
      : 'Bottom-up build; not multiple-driven';
    return {
      name: m.name,
      basis: m.basis,
      ...(m.multiple != null ? { multiple: m.multiple } : {}),
      band: m.band,
      weightPct: Math.round((m.weight / totalW) * 100),
      evidence,
    };
  });

  // 5) comparable transactions (source-referenced)
  const sim = runSimilarTransactions(company, 12);
  const comparableTransactions = sim.similarExits;
  const comparablesUsed = comparableTransactions.length;

  // 6) buyer universe + most-likely buyers + time-to-close, ranked against the baseline
  const implied = financialBaseline.mid;
  const discovery = runBuyerDiscovery(company, { impliedPriceUsd: implied, limit: 100 });
  // "qualified" means a genuine acquisition probability, not merely scored
  const qualified = discovery.candidates.filter((c) => c.probability >= 0.5).length;
  const intel = runAcquisitionIntelligence(company, { impliedPriceUsd: implied, limit: 5 });
  const mostLikelyBuyers: LikelyBuyer[] = intel.ranked.map((r) => ({
    name: r.candidate.buyer.name,
    probabilityPct: Math.round(r.candidate.probability * 100),
    expectedDaysToCash: Math.round(r.candidate.expectedOutcome.expectedDaysToCash),
  }));
  const days = mostLikelyBuyers.map((b) => b.expectedDaysToCash).filter((d) => d > 0);
  const timeToClose = days.length
    ? { lowDays: Math.min(...days), highDays: Math.max(...days) }
    : { lowDays: 90, highDays: 180 };

  // 7) confidence score
  const confidence = confidenceScore(company, comparablesUsed);

  const notes = [
    `Enterprise value midpoint ${usdM(headline.mid)} = financial baseline ${usdM(financialBaseline.mid)} × (1 + ${pct(premium.appliedPct)} strategic premium).`,
    premium.note,
    `Methodology weights are normalized and sum to 100%; each range is the sector's observed trough-to-peak multiple band.`,
    `${qualified} buyers clear a 50% acquisition-probability bar; ${discovery.candidates.length} scored from a ${BUYER_REGISTRY.length}-mandate curated registry.`,
    ...standard.notes,
  ];

  return {
    meta: { engine: 'valuation-institutional', version: '0.1.0', runAt: new Date().toISOString(), inputs: { sector: company.sector } },
    companyName: company.name,
    headline,
    financialBaseline,
    methodologies,
    premium,
    comparableTransactions,
    comparablesUsed,
    confidence,
    buyerUniverse: { qualified, scored: discovery.candidates.length, registry: BUYER_REGISTRY.length },
    mostLikelyBuyers,
    timeToClose,
    strategicRationale: strategicRationale(company),
    notes,
  };
}
