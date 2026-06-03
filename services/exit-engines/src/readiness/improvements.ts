import type { CompanyProfile } from '../types.js';
import type { ReadinessReport } from './engine.js';
import { runValuation } from '../valuation/engine.js';

// Acquisition-readiness improvement planner. Takes a readiness report
// and returns a prioritized list of weaknesses, each with a concrete
// improvement plan AND an estimated valuation uplift if executed.
// Composes runReadiness + runValuation into one actionable surface.

export type ImprovementEffort = 'days' | 'weeks' | 'months' | 'quarters';

export interface ImprovementPlan {
  readonly dimension: string;
  readonly weakness: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly recommendation: string;
  readonly effort: ImprovementEffort;
  readonly valuationUpliftPct: number;     // estimated headline uplift
  readonly valuationUpliftUsd: number;     // applied against current strategic mid
}

export interface ReadinessAnalysis {
  readonly currentScore: number;
  readonly currentBand: ReadinessReport['band'];
  readonly currentStrategicMid: number;
  readonly projectedScore: number;
  readonly projectedBand: ReadinessReport['band'];
  readonly projectedStrategicMid: number;
  readonly weaknesses: readonly ImprovementPlan[];
  readonly headline: string;
}

function bandFromScore(score: number): ReadinessReport['band'] {
  if (score < 35) return 'not_ready';
  if (score < 55) return 'seed_acquisition';
  if (score < 75) return 'growth_acquisition';
  return 'strategic_acquisition';
}

const DIM_UPLIFT_PCT: Record<string, number> = {
  // Per-dimension valuation impact when the weakness is repaired.
  'Revenue Quality':       0.35,   // biggest lever — NRR, margin, concentration
  'Market Penetration':    0.18,
  'Technology Moat':       0.25,   // adds defensibility premium
  'Competitive Advantage': 0.20,
  'Scalability':           0.15,
};

function planForDimension(
  c: CompanyProfile,
  dim: ReadinessReport['dimensions'][number],
  strategicMid: number,
): ImprovementPlan | undefined {
  if (dim.score >= 70) return undefined;       // no plan — already strong
  const severity: ImprovementPlan['severity'] = dim.score < 35 ? 'high' : dim.score < 55 ? 'medium' : 'low';

  // Dimension-specific weakness + recommendation
  let weakness = `${dim.name} sits at ${dim.score.toFixed(0)}/100.`;
  let recommendation = 'Tighten the dimension over the next quarter.';
  let effort: ImprovementEffort = 'quarters';

  if (dim.name === 'Revenue Quality') {
    if ((c.revenue.customerConcentrationTop10Pct ?? 0) > 0.5) {
      weakness = `Customer concentration: top-10 customers represent ${((c.revenue.customerConcentrationTop10Pct ?? 0) * 100).toFixed(0)}% of revenue. Buyers will price a concentration discount.`;
      recommendation = 'Diversify the customer base — target ≥ 12 logos contributing ≥ 5% each. Surface expansion mechanics + reference customers in the next two quarters.';
      effort = 'months';
    } else if ((c.revenue.netRetentionPct ?? 1) < 1.0) {
      weakness = `Net retention ${((c.revenue.netRetentionPct ?? 1) * 100).toFixed(0)}% — below institutional 100% threshold.`;
      recommendation = 'Engineer expansion: tier-based pricing, usage-based modules, account-management ownership. Retention discount drops as NRR clears 110%.';
      effort = 'months';
    } else if (c.revenue.grossMarginPct < 0.5) {
      weakness = `Gross margin ${(c.revenue.grossMarginPct * 100).toFixed(0)}% — below institutional comfort range for the sector.`;
      recommendation = 'Identify the COGS drivers and refactor: infra optimization, vendor renegotiation, services-to-product mix shift.';
      effort = 'quarters';
    } else {
      weakness = `Revenue scale or growth quality drags the dimension to ${dim.score.toFixed(0)}/100.`;
      recommendation = 'Drive ARR growth to ≥ 40% YoY while holding margins. Buyers value combined growth × margin (Rule of 40).';
      effort = 'quarters';
    }
  } else if (dim.name === 'Market Penetration') {
    weakness = `Penetration low relative to TAM ($${(c.market.addressableMarketUsd / 1_000_000_000).toFixed(1)}B). Growth optionality un-narrated.`;
    recommendation = 'Articulate a 5-year market-capture thesis in the CIM. Add bottom-up SAM/SOM model with proof points.';
    effort = 'weeks';
  } else if (dim.name === 'Technology Moat') {
    if (!c.product.hasDataMoat && c.product.aiNative) {
      weakness = 'AI-native posture without an evidenced data moat. Buyers will discount the AI thesis.';
      recommendation = 'Document corpus size, refresh cadence, exclusivity and downstream model performance. Make the moat measurable.';
      effort = 'months';
    } else if ((c.product.intellectualProperty?.patentsGranted ?? 0) === 0) {
      weakness = 'No granted patents; IP defensibility relies on trade-secret posture only.';
      recommendation = 'File 2–3 core-architecture patents this quarter; build trademark portfolio for the most-referenced product surfaces.';
      effort = 'quarters';
    } else {
      weakness = 'Moat dimension under-scored relative to differentiation claim.';
      recommendation = 'Surface defensibility evidence: switching costs, integrations, customer-specific configurations.';
      effort = 'months';
    }
  } else if (dim.name === 'Competitive Advantage') {
    if (c.product.differentiation === 'parity' || c.product.differentiation === 'commodity') {
      weakness = `Differentiation: ${c.product.differentiation}. Buyers will price as a commodity in the headline range.`;
      recommendation = 'Identify the two strongest product wedges; double-down on them; deprioritize parity features. Frame as the category-defining alternative.';
      effort = 'quarters';
    } else {
      weakness = `Competitive advantage signal weaker than differentiation claim warrants.`;
      recommendation = 'Surface win/loss evidence: comparable competitor analysis, customer migration cases, analyst quadrant positioning.';
      effort = 'weeks';
    }
  } else if (dim.name === 'Scalability') {
    if (c.team.leadershipBenchStrength === 'thin') {
      weakness = 'Leadership bench: thin. Founder-dependence priced as transition risk.';
      recommendation = 'Hire 2 senior leaders (CFO + CRO or COO) within two quarters; establish operating cadence the founders do not own day-to-day.';
      effort = 'quarters';
    } else if (c.growth.arrGrowthYoyPct < 0.30) {
      weakness = `ARR growth ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY — below institutional scaling threshold for the sector.`;
      recommendation = 'Diagnose the growth ceiling: GTM motion, pricing, sales productivity. Buyers value sustained growth above absolute scale.';
      effort = 'quarters';
    } else {
      weakness = 'Scalability under-scored relative to growth rate.';
      recommendation = 'Document the operating cadence + GTM playbook in a way that survives the founder transition.';
      effort = 'months';
    }
  }

  const upliftPct = (DIM_UPLIFT_PCT[dim.name] ?? 0.15) * (severity === 'high' ? 1 : severity === 'medium' ? 0.6 : 0.3);
  const upliftUsd = strategicMid * upliftPct;

  return {
    dimension: dim.name,
    weakness,
    severity,
    recommendation,
    effort,
    valuationUpliftPct: upliftPct,
    valuationUpliftUsd: upliftUsd,
  };
}

export function runReadinessAnalysis(company: CompanyProfile, readiness: ReadinessReport): ReadinessAnalysis {
  const strategic = runValuation(company, { reportType: 'strategic' });
  const currentStrategicMid = strategic.headline.mid;

  const weaknesses: ImprovementPlan[] = [];
  for (const dim of readiness.dimensions) {
    const plan = planForDimension(company, dim, currentStrategicMid);
    if (plan) weaknesses.push(plan);
  }
  weaknesses.sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd);

  const projectedUplift = weaknesses.reduce((s, w) => s + w.valuationUpliftUsd, 0);
  const projectedScore = Math.min(100, readiness.overallScore + weaknesses.length * 8);

  const headline = weaknesses.length === 0
    ? `Acquisition-ready at ${readiness.overallScore.toFixed(0)}/100. No dimension scores below 70 — no material uplift available through preparation work.`
    : `${weaknesses.length} weakness${weaknesses.length === 1 ? '' : 'es'} identified. Executed in full, the headline range projects upward by $${(projectedUplift / 1_000_000).toFixed(1)}M (${((projectedUplift / currentStrategicMid) * 100).toFixed(0)}% of current strategic mid).`;

  return {
    currentScore: readiness.overallScore,
    currentBand: readiness.band,
    currentStrategicMid,
    projectedScore,
    projectedBand: bandFromScore(projectedScore),
    projectedStrategicMid: currentStrategicMid + projectedUplift,
    weaknesses,
    headline,
  };
}
