import type { CompanyProfile, EngineMeta } from '../types.js';
import { runValuation, type ValuationBand } from './engine.js';
import { MULTIPLES } from './multiples.js';
import { VALUATION_FRAMEWORK } from './framework.js';
import { ACQUISITION_HISTORY } from '../buyers/history.js';
import { premiumPct } from '../buyers/outcomes.js';
import { confidenceFromSample, type ConfidenceLabel } from '../buyers/expected-outcome.js';
import { runSimilarTransactions, type SimilarExit } from '../buyers/similar.js';
import { runAcquisitionIntelligence } from '../buyers/intelligence.js';
import { runBuyerDiscovery } from '../buyers/engine.js';
import { BUYER_REGISTRY } from '../buyers/registry.js';

// ── THE VALUATION CONSTITUTION — canonical engine ───────────────────
// runValuationConstitution() is the single source of valuation truth.
// Every rule it applies — methodology weights, the premium computation,
// confidence scoring, comparable selection, the buyer-qualification bar,
// provenance requirements and the disclaimer — is read from
// VALUATION_FRAMEWORK. No document computes any of this itself; they all
// consume this object. The output carries the ten mandatory outputs, the
// full required-variable set with per-figure provenance, and a provenance
// summary, so any inheriting document is institution-grade by construction.

const FW = VALUATION_FRAMEWORK;
const DAY_MS = 86_400_000;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: readonly number[]): number | undefined => {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const pct = (x: number): string => `${Math.round(x * 100)}%`;
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

// Every figure carries provenance — the five framework-required fields.
export interface VariableRecord {
  readonly name: string;
  readonly present: boolean;
  readonly value: string;
  readonly source: string;
  readonly source_url: string | null;
  readonly confidence: string;
  readonly verification_status: string;
  readonly last_updated: string;
}

export interface PremiumEvidence {
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
  readonly tier: string;                  // framework labels: High | Moderate | Low
  readonly drivers: {
    readonly dataCompleteness: number;
    readonly comparableDepth: number;
    readonly sectorMaturity: number;
    readonly financialQuality: number;
    readonly dataFreshness: number;
  };
  readonly note: string;
}

export interface MethodologyView {
  readonly name: string;
  readonly basis: string;
  readonly multiple?: number;
  readonly band: ValuationBand;
  readonly weightPct: number;
  readonly evidence: string;
}

export interface LikelyBuyer {
  readonly name: string;
  readonly probabilityPct: number;
  readonly expectedDaysToCash: number;
}

export interface ComparableAnalysis {
  readonly count: number;
  readonly dateRangeStart?: string;
  readonly dateRangeEnd?: string;
  readonly medianPremiumPct?: number;
  readonly avgPremiumPct?: number;
  readonly medianPriceUsd?: number;
  readonly avgPriceUsd?: number;
  readonly note: string;
}

export interface ProvenanceSummary {
  readonly totalFigures: number;
  readonly bySource: Readonly<Record<string, number>>;
  readonly mostRecentDataDate?: string;
  readonly requiredFields: readonly string[];
  readonly note: string;
}

// The ten mandatory outputs, rendered, so any document can show them and
// any test can assert their presence.
export interface MandatoryOutputs {
  readonly enterprise_value_range: string;
  readonly midpoint_valuation: string;
  readonly confidence_score: string;
  readonly valuation_methodologies: string;
  readonly methodology_weighting: string;
  readonly comparable_transaction_count: string;
  readonly strategic_premium_basis: string;
  readonly buyer_universe_size: string;
  readonly expected_time_to_close: string;
  readonly data_provenance_summary: string;
}

export interface ValuationConstitution {
  readonly meta: EngineMeta;
  readonly frameworkVersion: string;
  readonly companyName: string;

  readonly headline: ValuationBand;            // strategic, evidence-premium applied
  readonly financialBaseline: ValuationBand;   // pre-strategic-premium
  readonly methodologies: readonly MethodologyView[];
  readonly premium: PremiumEvidence;
  readonly comparableTransactions: readonly SimilarExit[];
  readonly comparablesUsed: number;
  readonly comparablesAnalysis: ComparableAnalysis;
  readonly confidence: ConfidenceScore;
  readonly buyerUniverse: { readonly qualified: number; readonly scored: number; readonly registry: number; readonly strategic: number; readonly financial: number; readonly sovereign: number; readonly family_office: number };
  readonly mostLikelyBuyers: readonly LikelyBuyer[];
  readonly timeToClose: { readonly lowDays: number; readonly highDays: number };
  readonly strategicRationale: readonly string[];

  readonly variables: {
    readonly company: readonly VariableRecord[];
    readonly market: readonly VariableRecord[];
    readonly buyer: readonly VariableRecord[];
    readonly execution: readonly VariableRecord[];
  };
  readonly mandatoryOutputs: MandatoryOutputs;
  readonly provenanceSummary: ProvenanceSummary;
  readonly disclaimer: string;
  readonly notes: readonly string[];
}

/** Backward-compatible alias — the institutional report IS the constitution. */
export type InstitutionalValuationReport = ValuationConstitution;

// Observed precedent premiums: same-sector first, market-wide as fallback.
function collectPremiums(sector: string): { inSector: number[]; market: number[] } {
  const inSector: number[] = [];
  const market: number[] = [];
  for (const e of ACQUISITION_HISTORY) {
    if (FW.premium.excludeStatuses.includes(e.status)) continue;
    const p = premiumPct(e);
    if (p == null || (FW.premium.requirePositive && p <= 0)) continue;
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

  if (inSector.length >= FW.premium.inSectorMinSample) {
    observed = inSector;
    basis = 'in_sector';
    confidence = confidenceFromSample(inSector.length, 'in-sector precedent premiums');
  } else if (FW.premium.marketFallback && market.length >= 1) {
    observed = market;
    basis = 'market_prior';
    confidence = confidenceFromSample(0, 'in-sector precedent premiums');
  } else {
    observed = [];
    basis = 'neutral_prior';
    confidence = confidenceFromSample(0, 'precedent premiums');
  }

  const applied = observed.length ? mean(observed) : FW.premium.neutralPriorPct;
  const rangeLow = observed.length ? observed[0]! : FW.premium.neutralPriorPct / 2;
  const rangeHigh = observed.length ? observed[observed.length - 1]! : FW.premium.neutralPriorPct * 1.5;

  const note =
    basis === 'in_sector'
      ? `Applied premium is the mean of ${inSector.length} observed ${sector.replace(/_/g, ' ')} precedent transaction(s).`
      : basis === 'market_prior'
        ? `No in-sector precedent with a disclosed reference price; applied premium is the mean of ${market.length} market-wide precedents (lower confidence).`
        : `No precedent transaction carries a disclosed reference price; a ${pct(FW.premium.neutralPriorPct)} market-neutral prior is applied and flagged experimental.`;

  return { observedPremiums: observed, rangeLowPct: rangeLow, rangeHighPct: rangeHigh, appliedPct: applied, inSectorSample: inSector.length, marketSample: market.length, basis, confidence, note };
}

function comparableAnalysis(comps: readonly SimilarExit[]): ComparableAnalysis {
  const dates = comps.map((c) => c.date).filter((d): d is string => !!d).sort();
  const premiums = comps.map((c) => c.premiumPct).filter((x): x is number => x != null);
  const prices = comps.map((c) => c.priceUsd).filter((x): x is number => x != null);
  return {
    count: comps.length,
    ...(dates.length ? { dateRangeStart: dates[0], dateRangeEnd: dates[dates.length - 1] } : {}),
    ...(premiums.length ? { medianPremiumPct: median(premiums)!, avgPremiumPct: mean(premiums) } : {}),
    ...(prices.length ? { medianPriceUsd: median(prices)!, avgPriceUsd: mean(prices) } : {}),
    note: comps.length >= FW.comparables.minForConclusion
      ? `${comps.length} source-referenced same-sector transactions; ${premiums.length} with a disclosed premium, ${prices.length} with a disclosed value.`
      : 'Insufficient transaction evidence — conclusion flagged unsupported by the framework.',
  };
}

function dataFreshness(comps: readonly SimilarExit[]): { score: number; mostRecent?: string } {
  const dates = comps.map((c) => c.date).filter((d): d is string => !!d).map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
  if (!dates.length) return { score: 0 };
  const mostRecentMs = Math.max(...dates);
  const ageDays = (Date.now() - mostRecentMs) / DAY_MS;
  const { freshnessFullDays, freshnessZeroDays } = FW.confidence;
  const score = ageDays <= freshnessFullDays ? 1 : ageDays >= freshnessZeroDays ? 0 : 1 - (ageDays - freshnessFullDays) / (freshnessZeroDays - freshnessFullDays);
  return { score: clamp01(score), mostRecent: new Date(mostRecentMs).toISOString().slice(0, 10) };
}

function confidenceScore(company: CompanyProfile, comparablesUsed: number, freshness: number): ConfidenceScore {
  const checks = [
    company.revenue.annualRecurringRevenueUsd > 0 || company.revenue.trailingTwelveMonthsRevenueUsd > 0,
    company.revenue.trailingTwelveMonthsRevenueUsd > 0,
    company.revenue.ebitdaMarginPct != null,
    company.revenue.netRetentionPct != null,
    company.revenue.customerConcentrationTop10Pct != null,
    company.growth?.arrGrowthYoyPct != null,
  ];
  const dataCompleteness = checks.filter(Boolean).length / checks.length;
  const comparableDepth = clamp01(comparablesUsed / FW.confidence.comparableFullCount);
  const sectorBuyers = BUYER_REGISTRY.filter((b) => b.sectorsActive.includes(company.sector)).length;
  const sectorMaturity = clamp01(sectorBuyers / FW.confidence.sectorMatureBuyers);
  const rule40 = company.growth?.rule40 ?? ((company.growth?.arrGrowthYoyPct ?? 0) + (company.revenue.ebitdaMarginPct ?? 0));
  const nrr = company.revenue.netRetentionPct ?? 1;
  const conc = company.revenue.customerConcentrationTop10Pct ?? 0.25;
  const financialQuality = mean([clamp01(rule40 / 0.5), clamp01((nrr - 0.9) / 0.4), 1 - clamp01(conc / 0.6)]);

  const w = FW.confidence.driverWeights;
  const drivers = { dataCompleteness, comparableDepth, sectorMaturity, financialQuality, dataFreshness: freshness };
  const score = Math.round(100 * (
    w.dataCompleteness * dataCompleteness + w.comparableDepth * comparableDepth +
    w.sectorMaturity * sectorMaturity + w.financialQuality * financialQuality + w.dataFreshness * freshness
  ));
  const tier = score >= FW.confidence.tierThresholds.high ? FW.confidence.labels.high
    : score >= FW.confidence.tierThresholds.moderate ? FW.confidence.labels.moderate
    : FW.confidence.labels.low;

  return {
    score, tier, drivers,
    note: `Composite of data completeness (${pct(dataCompleteness)}), comparable depth (${comparablesUsed} on record), sector maturity (${sectorBuyers} active buyers), financial quality (${pct(financialQuality)}) and data freshness (${pct(freshness)}).`,
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

// ── variable assembly with provenance ───────────────────────────────
const companyVar = (name: string, present: boolean, value: string, runAt: string): VariableRecord => ({
  name, present, value,
  source: present ? 'company_provided' : 'not_provided',
  source_url: null,
  confidence: present ? 'reported' : 'none',
  verification_status: present ? 'unverified' : 'absent',
  last_updated: runAt,
});

const derivedVar = (name: string, present: boolean, value: string, source: string, lastUpdated: string, sourceUrl: string | null = null): VariableRecord => ({
  name, present, value, source, source_url: sourceUrl,
  confidence: present ? 'reported' : 'none',
  verification_status: present ? 'curated' : 'absent',
  last_updated: lastUpdated,
});

export function runValuationConstitution(company: CompanyProfile): ValuationConstitution {
  const runAt = new Date().toISOString();

  // 1) financial baseline + methodology (pre-strategic-premium)
  const standard = runValuation(company, { reportType: 'standard' });
  const financialBaseline = standard.headline;

  // 2) evidence-based strategic premium from precedent transactions
  const premium = premiumEvidence(company.sector);

  // 3) strategic headline = baseline × (1 + applied evidence premium)
  const strategic = runValuation(company, { reportType: 'strategic', strategicPremiumPct: premium.appliedPct });
  const headline = strategic.headline;

  // 4) normalized methodology views with market evidence
  const totalW = standard.methodologies.reduce((s, m) => s + m.weight, 0) || 1;
  const sectorMult = MULTIPLES[company.sector];
  const methodologies: MethodologyView[] = standard.methodologies.map((m) => {
    const band = /ARR/.test(m.name) ? sectorMult.arr : /Revenue/.test(m.name) ? sectorMult.revenue : /EBITDA/.test(m.name) ? sectorMult.ebitda : /GMV/.test(m.name) ? sectorMult.gmv : undefined;
    const evidence = band
      ? `${company.sector.replace(/_/g, ' ')} sector band ${band.low}×–${band.high}× (mid ${band.mid}×), trough-to-peak market conditions`
      : 'Bottom-up build; not multiple-driven';
    return { name: m.name, basis: m.basis, ...(m.multiple != null ? { multiple: m.multiple } : {}), band: m.band, weightPct: Math.round((m.weight / totalW) * FW.methodology.normalizeToPct), evidence };
  });

  // 5) comparable transactions (source-referenced) + analysis
  const sim = runSimilarTransactions(company, FW.comparables.maxCount);
  const comparableTransactions = sim.similarExits;
  const comparablesUsed = comparableTransactions.length;
  const comparablesAnalysis = comparableAnalysis(comparableTransactions);

  // 6) buyer universe + most-likely buyers + time-to-close
  const implied = financialBaseline.mid;
  const discovery = runBuyerDiscovery(company, { impliedPriceUsd: implied, limit: FW.buyerUniverse.scoredPoolLimit });
  const qualified = discovery.candidates.filter((c) => c.probability >= FW.buyerUniverse.qualifiedProbabilityBar).length;
  const intel = runAcquisitionIntelligence(company, { impliedPriceUsd: implied, limit: FW.buyerUniverse.mostLikelyCount });
  const mostLikelyBuyers: LikelyBuyer[] = intel.ranked.map((r) => ({
    name: r.candidate.buyer.name,
    probabilityPct: Math.round(r.candidate.probability * 100),
    expectedDaysToCash: Math.round(r.candidate.expectedOutcome.expectedDaysToCash),
  }));
  const days = mostLikelyBuyers.map((b) => b.expectedDaysToCash).filter((d) => d > 0);
  const timeToClose = days.length ? { lowDays: Math.min(...days), highDays: Math.max(...days) } : { lowDays: FW.executionNeutrals.daysToCash, highDays: FW.executionNeutrals.daysToCash };

  // registry composition by buyer type
  const typeCount = (re: RegExp): number => BUYER_REGISTRY.filter((b) => re.test(b.buyerType)).length;
  const buyerUniverse = {
    qualified, scored: discovery.candidates.length, registry: BUYER_REGISTRY.length,
    strategic: typeCount(/strategic|corporate/i),
    financial: typeCount(/pe|private_equity|sponsor|vc|growth/i),
    sovereign: typeCount(/sovereign/i),
    family_office: typeCount(/family/i),
  };

  // 7) confidence (five drivers incl. freshness)
  const fresh = dataFreshness(comparableTransactions);
  const confidence = confidenceScore(company, comparablesUsed, fresh.score);

  // ── required variables with provenance ────────────────────────────
  const r = company.revenue;
  const closeRates = intel.ranked.map((x) => x.candidate.outcomes.closeRatePct).filter((x): x is number => x != null);
  const variables = {
    company: [
      companyVar('revenue_ttm', r.trailingTwelveMonthsRevenueUsd > 0, usd(r.trailingTwelveMonthsRevenueUsd), runAt),
      companyVar('revenue_growth', company.growth?.arrGrowthYoyPct != null, pct(company.growth?.arrGrowthYoyPct ?? 0), runAt),
      companyVar('gross_margin', r.grossMarginPct != null, pct(r.grossMarginPct), runAt),
      companyVar('ebitda', r.ebitdaMarginPct != null, usd(r.trailingTwelveMonthsRevenueUsd * (r.ebitdaMarginPct ?? 0)), runAt),
      companyVar('ebitda_margin', r.ebitdaMarginPct != null, pct(r.ebitdaMarginPct ?? 0), runAt),
      companyVar('customer_count', company.users?.totalCustomers != null, String(company.users?.totalCustomers ?? '—'), runAt),
      companyVar('geography', !!company.jurisdiction, company.jurisdiction ?? '—', runAt),
      companyVar('sector', !!company.sector, company.sector, runAt),
      companyVar('subsector', false, '—', runAt),
      companyVar('ownership_type', false, '—', runAt),
      companyVar('funding_history', company.cap?.priorRoundsValuationUsd != null, company.cap?.priorRoundsValuationUsd != null ? usd(company.cap.priorRoundsValuationUsd) : '—', runAt),
    ],
    market: [
      derivedVar('comparable_transactions', comparablesUsed > 0, String(comparablesUsed), 'exitos_registry', runAt),
      derivedVar('comparable_public_companies', false, '—', 'not_provided', runAt),
      derivedVar('sector_multiples', true, `${sectorMult.revenue?.low ?? sectorMult.arr?.low ?? '—'}×–${sectorMult.revenue?.high ?? sectorMult.arr?.high ?? '—'}×`, 'exitos_framework', `v${FW.version}`),
      derivedVar('market_cycle', false, '—', 'not_provided', runAt),
      derivedVar('interest_rate_environment', false, '—', 'not_provided', runAt),
    ],
    buyer: [
      derivedVar('buyer_universe_size', true, String(buyerUniverse.registry), 'exitos_registry', runAt),
      derivedVar('strategic_buyers', true, String(buyerUniverse.strategic), 'exitos_registry', runAt),
      derivedVar('financial_buyers', true, String(buyerUniverse.financial), 'exitos_registry', runAt),
      derivedVar('sovereign_buyers', true, String(buyerUniverse.sovereign), 'exitos_registry', runAt),
      derivedVar('acquisition_history', true, `${ACQUISITION_HISTORY.length} events`, 'exitos_registry', runAt),
      derivedVar('acquisition_frequency', mostLikelyBuyers.length > 0, `${mostLikelyBuyers.length} active acquirers ranked`, 'exitos_registry', runAt),
      derivedVar('historical_premiums', premium.observedPremiums.length > 0, premium.observedPremiums.length ? `n=${premium.observedPremiums.length}, ${pct(premium.rangeLowPct)}–${pct(premium.rangeHighPct)}` : '—', 'exitos_registry', runAt),
    ],
    execution: [
      derivedVar('expected_close_rate', closeRates.length > 0, closeRates.length ? pct(mean(closeRates)) : '—', 'exitos_registry', runAt),
      derivedVar('expected_time_to_close', days.length > 0, `${timeToClose.lowDays}–${timeToClose.highDays} days`, 'exitos_registry', runAt),
      derivedVar('diligence_risk', true, conc(company) >= 0.4 ? 'Elevated (concentration)' : 'Standard', 'exitos_derived', runAt),
      derivedVar('retrade_risk', false, 'Not observed in snapshot', 'not_provided', runAt),
    ],
  };

  // ── provenance summary ─────────────────────────────────────────────
  const bySource: Record<string, number> = {};
  for (const c of comparableTransactions) {
    const kind = c.sourceRef.split(':')[0] || 'manual';
    bySource[kind] = (bySource[kind] ?? 0) + 1;
  }
  const allVars = [...variables.company, ...variables.market, ...variables.buyer, ...variables.execution];
  for (const v of allVars.filter((x) => x.present)) bySource[v.source] = (bySource[v.source] ?? 0) + 1;
  const provenanceSummary: ProvenanceSummary = {
    totalFigures: comparableTransactions.length + allVars.filter((v) => v.present).length,
    bySource,
    ...(fresh.mostRecent ? { mostRecentDataDate: fresh.mostRecent } : {}),
    requiredFields: FW.provenance.requiredFields,
    note: `Every figure traces to a stated source, confidence and date. Comparable evidence spans ${comparablesAnalysis.dateRangeStart ?? '—'} to ${comparablesAnalysis.dateRangeEnd ?? '—'}.`,
  };

  // ── the ten mandatory outputs, rendered ────────────────────────────
  const mandatoryOutputs: MandatoryOutputs = {
    enterprise_value_range: `${usd(headline.low)} – ${usd(headline.high)}`,
    midpoint_valuation: usd(headline.mid),
    confidence_score: `${confidence.score}% · ${confidence.tier}`,
    valuation_methodologies: methodologies.map((m) => m.name).join(', '),
    methodology_weighting: methodologies.map((m) => `${m.name} ${m.weightPct}%`).join(' · '),
    comparable_transaction_count: String(comparablesUsed),
    strategic_premium_basis: `+${pct(premium.appliedPct)} — ${premium.basis.replace(/_/g, ' ')} (n=${premium.observedPremiums.length})`,
    buyer_universe_size: `${buyerUniverse.qualified} qualified / ${buyerUniverse.scored} scored / ${buyerUniverse.registry} registry`,
    expected_time_to_close: `${timeToClose.lowDays}–${timeToClose.highDays} days`,
    data_provenance_summary: provenanceSummary.note,
  };

  const notes = [
    `Enterprise value midpoint ${usd(headline.mid)} = financial baseline ${usd(financialBaseline.mid)} × (1 + ${pct(premium.appliedPct)} strategic premium).`,
    premium.note,
    `Methodology weights are normalized and sum to ${FW.methodology.normalizeToPct}%; each range is the sector's observed trough-to-peak multiple band.`,
    `${buyerUniverse.qualified} buyers clear the ${pct(FW.buyerUniverse.qualifiedProbabilityBar)} acquisition-probability bar; ${discovery.candidates.length} scored from a ${BUYER_REGISTRY.length}-mandate curated registry.`,
    `Prepared under ExitOS Valuation Framework v${FW.version}. ${comparablesUsed >= FW.comparables.minForConclusion ? 'Transaction evidence requirement met.' : 'WARNING: insufficient transaction evidence per framework.'}`,
    ...standard.notes,
  ];

  return {
    meta: { engine: 'valuation-constitution', version: FW.version, runAt, inputs: { sector: company.sector } },
    frameworkVersion: FW.version,
    companyName: company.name,
    headline, financialBaseline, methodologies, premium,
    comparableTransactions, comparablesUsed, comparablesAnalysis,
    confidence, buyerUniverse, mostLikelyBuyers, timeToClose,
    strategicRationale: strategicRationale(company),
    variables, mandatoryOutputs, provenanceSummary,
    disclaimer: FW.disclaimer,
    notes,
  };
}

function conc(company: CompanyProfile): number {
  return company.revenue.customerConcentrationTop10Pct ?? 0;
}

/** Backward-compatible alias. The institutional report IS the constitution. */
export const runInstitutionalValuation = runValuationConstitution;
