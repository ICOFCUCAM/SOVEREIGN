import { strategicBuyerReport, runInstitutionalValuation, type CompanyProfile } from "@exit/engines";

// ── ONE ENTERPRISE VALUE (owner decision D1, 2026-10-11) ────────────
// Every console surface that needs "the company's value" uses the
// institutional valuation framework's headline — the figure the Terminal,
// the Valuation page and the valuation report show. Consumers that expect a
// report object (offer scoring, the memorandum generator) read only
// `headline`, so they receive the strategic-buyer report with its headline
// replaced by the institutional one. See docs/redesign/DECISION-D1-ONE-VALUATION.md.

export type CanonicalValuation = ReturnType<typeof strategicBuyerReport>;

export function canonicalValuationFor(
  company: CompanyProfile,
  institutional: ReturnType<typeof runInstitutionalValuation> = runInstitutionalValuation(company),
  strategic: CanonicalValuation = strategicBuyerReport(company),
): CanonicalValuation {
  return { ...strategic, headline: { ...strategic.headline, low: institutional.headline.low, mid: institutional.headline.mid, high: institutional.headline.high } };
}

/** Value after the readiness fixes: canonical mid + the readiness engine's
 *  uplift (an absolute amount), the same rule the Terminal uses. */
export const valueAfterFixes = (canonicalMid: number, analysis: { currentStrategicMid: number; projectedStrategicMid: number }): number =>
  canonicalMid + Math.max(0, analysis.projectedStrategicMid - analysis.currentStrategicMid);
