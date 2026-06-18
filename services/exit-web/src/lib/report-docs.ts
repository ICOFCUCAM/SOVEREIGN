import { runInstitutionalValuation, runReadiness, runReadinessAnalysis, type CompanyProfile } from "@exit/engines";
import { rankedBuyers, expectedOutcomeFor, sectorOverlap, buyerConfidence, fmtUsdShort } from "./buyer-dna";
import { activeTokens } from "./active-company";
import { ACQ_INDEXES, MARKET_INTEL, fmtUsd } from "./market-intel";
import { MARKET } from "./market-stats";

// ── DOCUMENT-TYPE MODELS ────────────────────────────────────────────
// One builder per institutional document, each surfacing existing engine
// output through the shared report meta. Presentation/selection only — no
// valuation, probability or premium is recomputed here.

export interface ReportMeta { title: string; company: string; preparedFor: string; preparedBy: string; date: string; frameworkVersion: string; classification: string }

function meta(title: string, company: string, fv: string, classification = "Strictly Private & Confidential"): ReportMeta {
  return { title, company, preparedFor: "Board of Directors", preparedBy: "ExitOS Advisory", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), frameworkVersion: fv, classification };
}

const pctS = (x: number | null | undefined): string => (x == null ? "—" : `${Math.round(x * 100)}%`);

// ── BUYER INTELLIGENCE REPORT ───────────────────────────────────────
export interface BuyerScorecard {
  buyerId: string; name: string; type: string; probabilityPct: number;
  expectedValue: string; typicalCheck: string; medianCloseDays: string;
  activity: string; strategicFitPct: number; recentAcquisition: string; confidence: string;
}
export interface BuyerIntelReport {
  meta: ReportMeta;
  summary: { qualified: number; scored: number; topProbability: number; medianPremium: string };
  scorecards: BuyerScorecard[];
  universe: { strategic: number; financial: number; sovereign: number; family_office: number; qualified: number; scored: number; registry: number };
}
export function buildBuyerIntelReport(company: CompanyProfile): BuyerIntelReport {
  const INST = runInstitutionalValuation(company);
  const tokens = activeTokens(company);
  const baseline = INST.financialBaseline.mid;
  const ranked = rankedBuyers(10, tokens);
  const scorecards: BuyerScorecard[] = ranked.map((r) => {
    const p = r.profile, exp = expectedOutcomeFor(p, baseline), ov = sectorOverlap(p, tokens);
    return {
      buyerId: p.buyer_id, name: p.name, type: p.buyer_type.replace(/_/g, " "), probabilityPct: r.probability.pct,
      expectedValue: `${fmtUsdShort(exp.expectedClose)}–${fmtUsdShort(exp.expectedOffer)}`,
      typicalCheck: p.check_size_band ? `${fmtUsdShort(p.check_size_band.low_usd)}–${fmtUsdShort(p.check_size_band.high_usd)}` : (p.avg_deal_usd ? fmtUsdShort(p.avg_deal_usd) : "undisclosed"),
      medianCloseDays: p.median_close_days != null ? `${p.median_close_days}d` : "—",
      activity: `${p.deals_12m}/12m · ${p.deals_3y}/3y`,
      strategicFitPct: ov.pct,
      recentAcquisition: p.last_acquisition ? `${p.last_acquisition.target} · ${p.last_acquisition.date.slice(0, 7)}` : "—",
      confidence: buyerConfidence(p),
    };
  });
  return {
    meta: meta("Buyer Intelligence Report", company.name, INST.frameworkVersion),
    summary: { qualified: INST.buyerUniverse.qualified, scored: INST.buyerUniverse.scored, topProbability: ranked[0]?.probability.pct ?? 0, medianPremium: INST.comparablesAnalysis.medianPremiumPct != null ? pctS(INST.comparablesAnalysis.medianPremiumPct) : "—" },
    scorecards,
    universe: { strategic: INST.buyerUniverse.strategic, financial: INST.buyerUniverse.financial, sovereign: INST.buyerUniverse.sovereign, family_office: INST.buyerUniverse.family_office, qualified: INST.buyerUniverse.qualified, scored: INST.buyerUniverse.scored, registry: INST.buyerUniverse.registry },
  };
}

// ── ACQUISITION READINESS REPORT ────────────────────────────────────
export interface ReadinessReport {
  meta: ReportMeta;
  summary: { score: number; band: string; currentValue: string; potentialValue: string; uplift: string; upliftPct: number; currentUsd: number; potentialUsd: number; upliftUsd: number };
  categories: { dimension: string; severity: string; weakness: string; recommendation: string; impact: string; effort: string }[];
}
export function buildReadinessReport(company: CompanyProfile): ReadinessReport {
  const INST = runInstitutionalValuation(company);
  const ra = runReadinessAnalysis(company, runReadiness(company));
  const cur = ra.currentStrategicMid, pot = ra.projectedStrategicMid, up = Math.max(0, pot - cur);
  return {
    meta: meta("Acquisition Readiness Report", company.name, INST.frameworkVersion),
    summary: { score: Math.round(ra.currentScore), band: ra.currentBand.replace(/_/g, " "), currentValue: fmtUsd(cur), potentialValue: fmtUsd(pot), uplift: fmtUsd(up), upliftPct: cur > 0 ? Math.round((up / cur) * 100) : 0, currentUsd: cur, potentialUsd: pot, upliftUsd: up },
    categories: [...ra.weaknesses].sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd).map((w) => ({ dimension: w.dimension, severity: w.severity, weakness: w.weakness, recommendation: w.recommendation, impact: fmtUsd(w.valuationUpliftUsd), effort: w.effort })),
  };
}

// ── MARKET INTELLIGENCE REPORT ──────────────────────────────────────
export interface MarketReport {
  meta: ReportMeta;
  summary: { events: string; disclosed: string; buyers: string; sectors: number };
  indexes: { sector: string; volume: number; trendPct: number | null; activeBuyers: number; medianDealUsd: number | null }[];
  acquirers: { name: string; deals: number; recentDeals: number }[];
}
export function buildMarketReport(company: CompanyProfile): MarketReport {
  const INST = runInstitutionalValuation(company);
  return {
    meta: meta("Market Intelligence Report", "Global Acquisition Activity", INST.frameworkVersion, "Confidential"),
    summary: { events: MARKET_INTEL.totalEvents.toLocaleString(), disclosed: fmtUsd(MARKET_INTEL.totalDisclosedUsd), buyers: MARKET.buyers.toLocaleString(), sectors: ACQ_INDEXES.indexes.length },
    indexes: [...ACQ_INDEXES.indexes].sort((a, b) => b.volume - a.volume).slice(0, 12).map((i) => ({ sector: i.sector, volume: i.volume, trendPct: i.trendPct, activeBuyers: i.activeBuyers, medianDealUsd: i.medianDealUsd })),
    acquirers: [...MARKET_INTEL.topAcquirers].slice(0, 12).map((a) => ({ name: a.name, deals: a.deals, recentDeals: a.recentDeals })),
  };
}

// ── BOARD TRANSACTION MEMORANDUM ────────────────────────────────────
export interface BoardMemo {
  meta: ReportMeta;
  recommendation: string;
  decision: { k: string; v: string }[];
  highlights: string[];
  risks: { dimension: string; impact: string }[];
}
export function buildBoardMemo(company: CompanyProfile): BoardMemo {
  const INST = runInstitutionalValuation(company);
  const ra = runReadinessAnalysis(company, runReadiness(company));
  const lead = INST.mostLikelyBuyers[0];
  return {
    meta: meta("Board Transaction Memorandum", company.name, INST.frameworkVersion),
    recommendation: `Authorise the preparation and launch of a competitive sale process for ${company.name}, targeting a strategic-buyer enterprise value of ${fmtUsd(INST.headline.mid)} (range ${fmtUsd(INST.headline.low)}–${fmtUsd(INST.headline.high)}).`,
    decision: [
      { k: "Recommended enterprise value", v: `${fmtUsd(INST.headline.mid)} (${fmtUsd(INST.headline.low)}–${fmtUsd(INST.headline.high)})` },
      { k: "Confidence", v: `${INST.confidence.score}% · ${INST.confidence.tier}` },
      { k: "Qualified buyers", v: `${INST.buyerUniverse.qualified} of ${INST.buyerUniverse.scored} scored` },
      { k: "Lead acquirer", v: lead ? `${lead.name} (${lead.probabilityPct}%)` : "competitive process" },
      { k: "Strategic premium", v: `+${pctS(INST.premium.appliedPct)} (n=${INST.premium.observedPremiums.length})` },
      { k: "Expected time to close", v: `${INST.timeToClose.lowDays}–${INST.timeToClose.highDays} days` },
      { k: "Readiness", v: `${Math.round(ra.currentScore)}/100` },
    ],
    highlights: INST.strategicRationale.slice(0, 5),
    risks: [...ra.weaknesses].sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd).slice(0, 5).map((w) => ({ dimension: w.dimension, impact: fmtUsd(w.valuationUpliftUsd) })),
  };
}
