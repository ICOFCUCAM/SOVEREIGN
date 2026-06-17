import type { CompanyProfile, EngineMeta } from '../types.js';
import { MULTIPLES, countryAdjustment } from './multiples.js';
import { METHODOLOGY_WEIGHTS, VALUATION_FRAMEWORK } from './framework.js';

// Methodology weights and every prior are owned by the Valuation
// Constitution, never defined inline — so every report computes identically.
const W = METHODOLOGY_WEIGHTS;
const FW = VALUATION_FRAMEWORK;

export type ValuationReportType = 'standard' | 'strategic' | 'asset_replacement';

export interface ValuationBand {
  readonly low: number;
  readonly mid: number;
  readonly high: number;
  readonly currency: 'USD';
}

export interface MethodologyEntry {
  readonly name: string;
  readonly basis: string;
  readonly multiple?: number;
  readonly band: ValuationBand;
  readonly weight: number;
}

export interface ValuationReport {
  readonly meta: EngineMeta;
  readonly reportType: ValuationReportType;
  readonly headline: ValuationBand;
  readonly methodologies: readonly MethodologyEntry[];
  readonly countryAdjustment: number;
  readonly premiums: readonly { readonly name: string; readonly pct: number; readonly reason: string }[];
  readonly notes: readonly string[];
}

const ENGINE_NAME = 'valuation';
const ENGINE_VERSION = '0.1.0';

function bandFromMultiple(base: number, mult: { low: number; mid: number; high: number }): ValuationBand {
  return { low: base * mult.low, mid: base * mult.mid, high: base * mult.high, currency: 'USD' };
}

function applyAdjustments(band: ValuationBand, countryAdj: number, premiumPct: number): ValuationBand {
  const f = countryAdj * (1 + premiumPct);
  return { low: band.low * f, mid: band.mid * f, high: band.high * f, currency: 'USD' };
}

function combineWeighted(entries: readonly MethodologyEntry[]): ValuationBand {
  const totalW = entries.reduce((s, e) => s + e.weight, 0);
  if (totalW === 0) return { low: 0, mid: 0, high: 0, currency: 'USD' };
  const low  = entries.reduce((s, e) => s + e.band.low  * e.weight, 0) / totalW;
  const mid  = entries.reduce((s, e) => s + e.band.mid  * e.weight, 0) / totalW;
  const high = entries.reduce((s, e) => s + e.band.high * e.weight, 0) / totalW;
  return { low, mid, high, currency: 'USD' };
}

export interface RunOptions {
  readonly reportType?: ValuationReportType;
  /** Evidence-based strategic premium injected by the institutional layer.
   *  When set, it overrides the heuristic synergy formula — the premium is
   *  then driven by observed precedent transactions, not a flat assumption. */
  readonly strategicPremiumPct?: number;
}

// Standard valuation — multiples-driven, weighted blend of ARR /
// revenue / EBITDA / GMV. The deterministic core. Strategic and
// asset-replacement variants layer additional methodology on top.
export function runValuation(company: CompanyProfile, opts: RunOptions = {}): ValuationReport {
  const reportType = opts.reportType ?? 'standard';
  const sectorMult = MULTIPLES[company.sector];
  const countryAdj = countryAdjustment(company.jurisdiction);
  const notes: string[] = [];
  const premiums: Array<{ name: string; pct: number; reason: string }> = [];
  const methodologies: MethodologyEntry[] = [];

  // ARR multiple — recurring revenue businesses
  if (sectorMult.arr && company.revenue.annualRecurringRevenueUsd > 0) {
    methodologies.push({
      name: 'ARR multiple',
      basis: `${(company.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(2)}M ARR`,
      multiple: sectorMult.arr.mid,
      band: bandFromMultiple(company.revenue.annualRecurringRevenueUsd, sectorMult.arr),
      weight: W['ARR multiple'],
    });
  }

  // Revenue multiple — TTM revenue
  if (sectorMult.revenue && company.revenue.trailingTwelveMonthsRevenueUsd > 0) {
    methodologies.push({
      name: 'Revenue multiple (TTM)',
      basis: `${(company.revenue.trailingTwelveMonthsRevenueUsd / 1_000_000).toFixed(2)}M TTM revenue`,
      multiple: sectorMult.revenue.mid,
      band: bandFromMultiple(company.revenue.trailingTwelveMonthsRevenueUsd, sectorMult.revenue),
      weight: W['Revenue multiple (TTM)'],
    });
  }

  // EBITDA multiple — profitable businesses only
  if (sectorMult.ebitda && company.revenue.ebitdaMarginPct > 0) {
    const ebitda = company.revenue.trailingTwelveMonthsRevenueUsd * company.revenue.ebitdaMarginPct;
    methodologies.push({
      name: 'EBITDA multiple',
      basis: `${(ebitda / 1_000_000).toFixed(2)}M EBITDA (${(company.revenue.ebitdaMarginPct * 100).toFixed(1)}% margin)`,
      multiple: sectorMult.ebitda.mid,
      band: bandFromMultiple(ebitda, sectorMult.ebitda),
      weight: W['EBITDA multiple'],
    });
  }

  // GMV multiple — marketplaces only
  if (sectorMult.gmv && (company.revenue.grossMerchandiseValueUsd ?? 0) > 0) {
    const gmv = company.revenue.grossMerchandiseValueUsd!;
    methodologies.push({
      name: 'GMV multiple',
      basis: `${(gmv / 1_000_000).toFixed(2)}M GMV`,
      multiple: sectorMult.gmv.mid,
      band: bandFromMultiple(gmv, sectorMult.gmv),
      weight: W['GMV multiple'],
    });
  }

  // Rule of 40 premium — SaaS-style
  const rule40 = company.growth.rule40 ?? (company.growth.arrGrowthYoyPct + company.revenue.ebitdaMarginPct);
  if (sectorMult.rule40Premium && rule40 >= 0.4) {
    premiums.push({ name: 'Rule of 40', pct: sectorMult.rule40Premium, reason: `Rule of 40 = ${(rule40 * 100).toFixed(0)}%` });
  }

  // Net retention premium
  const nrr = company.revenue.netRetentionPct ?? 0;
  if (sectorMult.netRetentionPremium && nrr >= 1.2) {
    premiums.push({ name: 'Net retention', pct: sectorMult.netRetentionPremium, reason: `NRR ${(nrr * 100).toFixed(0)}%` });
  }

  // Customer concentration discount
  const conc = company.revenue.customerConcentrationTop10Pct ?? 0;
  if (conc >= FW.concentrationDiscount.thresholdPct) {
    premiums.push({ name: 'Concentration discount', pct: FW.concentrationDiscount.discountPct, reason: `Top-10 customers concentrate ${(conc * 100).toFixed(0)}% of revenue` });
  }

  // Liquidation preference floor — applies as a hard low-band guard
  const liqFloor = company.cap.preferenceStackUsd ?? 0;

  // Combine baseline
  let headline = combineWeighted(methodologies);
  const totalPremium = premiums.reduce((s, p) => s + p.pct, 0);
  headline = applyAdjustments(headline, countryAdj, totalPremium);

  // Strategic uplift — buyers pay for synergies + control + competitive blocking.
  if (reportType === 'strategic') {
    const heuristicUplift = FW.strategicHeuristic.basePct
      + (company.product.hasNetworkEffects ? FW.strategicHeuristic.networkEffectsUpliftPct : 0)
      + (company.product.hasDataMoat ? FW.strategicHeuristic.dataMoatUpliftPct : 0);
    const strategicUplift = opts.strategicPremiumPct ?? heuristicUplift;
    premiums.push({
      name: 'Strategic premium',
      pct: strategicUplift,
      reason: opts.strategicPremiumPct != null
        ? 'Applied from observed precedent-transaction premiums (evidence-based)'
        : 'Synergies, control, competitive blocking',
    });
    headline = applyAdjustments(headline, 1, strategicUplift);
    notes.push('Strategic buyer valuation includes synergy premium and reflects control transaction pricing.');
  }

  // Asset replacement — bottom-up cost to rebuild
  if (reportType === 'asset_replacement') {
    const ar = FW.assetReplacement;
    const engineeringHc = company.team.engineeringHeadcount ?? Math.max(2, Math.floor(company.team.headcount * ar.engRatioOfHeadcount));
    const yearsToBuild = Math.max(ar.minYearsToBuild, Math.ceil((company.foundedYear < 2026 ? 2026 - company.foundedYear : ar.minYearsToBuild) * ar.yearsToBuildFactor));
    const ipPremium = company.product.intellectualProperty?.patentsGranted ?? 0;
    const replacementCost = engineeringHc * ar.fullyLoadedEngCostUsd * yearsToBuild + ipPremium * ar.patentValueUsd;
    const opportunityCost = company.revenue.annualRecurringRevenueUsd * ar.arrOpportunityMultiple;
    methodologies.push({
      name: 'Replacement cost',
      basis: `${engineeringHc} eng × ${yearsToBuild}yr × $${(ar.fullyLoadedEngCostUsd / 1000).toFixed(0)}k + ${ipPremium} patent(s)`,
      band: { low: replacementCost * ar.replacementLowBand, mid: replacementCost, high: replacementCost * ar.replacementHighBand, currency: 'USD' },
      weight: W['Replacement cost'],
    });
    methodologies.push({
      name: 'Opportunity cost (foregone revenue)',
      basis: `${ar.arrOpportunityMultiple}× ARR (${(company.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(2)}M)`,
      band: { low: opportunityCost * ar.opportunityLowBand, mid: opportunityCost, high: opportunityCost * ar.opportunityHighBand, currency: 'USD' },
      weight: W['Opportunity cost (foregone revenue)'],
    });
    headline = combineWeighted(methodologies);
    notes.push('Asset-replacement valuation reflects the cost a buyer would incur to rebuild the asset in-house, plus opportunity cost of years lost.');
  }

  // Apply preference floor on the low band
  if (liqFloor > headline.low) {
    headline = { ...headline, low: liqFloor };
    notes.push(`Low band floored at preference stack ($${(liqFloor / 1_000_000).toFixed(1)}M).`);
  }

  notes.push(`Country adjustment for ${company.jurisdiction}: ${(countryAdj * 100).toFixed(0)}%.`);
  if (methodologies.length === 0) {
    notes.push('No applicable methodology fired — provide ARR, TTM revenue, EBITDA margin or GMV.');
  }

  return {
    meta: { engine: ENGINE_NAME, version: ENGINE_VERSION, runAt: new Date().toISOString(), inputs: { reportType, sector: company.sector } },
    reportType,
    headline,
    methodologies,
    countryAdjustment: countryAdj,
    premiums,
    notes,
  };
}

// Convenience — three named reports the user surfaced.
export function tenMillionReport(company: CompanyProfile): ValuationReport {
  return runValuation(company, { reportType: 'standard' });
}

export function twentyFiveMillionReport(company: CompanyProfile): ValuationReport {
  return runValuation(company, { reportType: 'standard' });
}

export function strategicBuyerReport(company: CompanyProfile): ValuationReport {
  return runValuation(company, { reportType: 'strategic' });
}

export function assetReplacementReport(company: CompanyProfile): ValuationReport {
  return runValuation(company, { reportType: 'asset_replacement' });
}
