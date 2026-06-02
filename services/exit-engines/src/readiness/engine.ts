import type { CompanyProfile, EngineMeta } from '../types.js';

export type ReadinessBand =
  | 'not_ready'
  | 'seed_acquisition'
  | 'growth_acquisition'
  | 'strategic_acquisition';

export interface ReadinessDimension {
  readonly name: string;
  readonly score: number;          // 0..100
  readonly weight: number;         // 0..1, sums to 1 across dims
  readonly evidence: readonly string[];
}

export interface ReadinessReport {
  readonly meta: EngineMeta;
  readonly overallScore: number;        // 0..100
  readonly band: ReadinessBand;
  readonly dimensions: readonly ReadinessDimension[];
  readonly strengths: readonly string[];
  readonly gaps: readonly string[];
  readonly recommendations: readonly string[];
}

const ENGINE = 'readiness';
const VERSION = '0.1.0';

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function pct(value: number, lowAt: number, highAt: number, lowOutput = 0, highOutput = 100): number {
  if (highAt === lowAt) return (lowOutput + highOutput) / 2;
  const t = (value - lowAt) / (highAt - lowAt);
  return clamp(lowOutput + t * (highOutput - lowOutput), Math.min(lowOutput, highOutput), Math.max(lowOutput, highOutput));
}

function bandFromScore(score: number): ReadinessBand {
  if (score < 35) return 'not_ready';
  if (score < 55) return 'seed_acquisition';
  if (score < 75) return 'growth_acquisition';
  return 'strategic_acquisition';
}

function revenueQuality(c: CompanyProfile): ReadinessDimension {
  const ev: string[] = [];
  let score = 0; let n = 0;

  // ARR scale — exponential to flatter as scale grows
  if (c.revenue.annualRecurringRevenueUsd > 0) {
    const s = pct(Math.log10(Math.max(c.revenue.annualRecurringRevenueUsd, 100_000)), 5.5, 8, 0, 100); // $300k → $100M
    score += s; n += 1; ev.push(`ARR: $${(c.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(2)}M (${s.toFixed(0)}/100)`);
  }
  // Margins
  if (c.revenue.grossMarginPct > 0) {
    const s = pct(c.revenue.grossMarginPct, 0.4, 0.85, 0, 100);
    score += s; n += 1; ev.push(`Gross margin ${(c.revenue.grossMarginPct * 100).toFixed(0)}% (${s.toFixed(0)}/100)`);
  }
  // Net retention
  if (c.revenue.netRetentionPct != null) {
    const s = pct(c.revenue.netRetentionPct, 0.8, 1.4, 0, 100);
    score += s; n += 1; ev.push(`NRR ${(c.revenue.netRetentionPct * 100).toFixed(0)}% (${s.toFixed(0)}/100)`);
  }
  // Concentration penalty
  if ((c.revenue.customerConcentrationTop10Pct ?? 0) > 0.5) {
    const penalty = pct(c.revenue.customerConcentrationTop10Pct!, 0.5, 0.9, 0, 35);
    score = Math.max(0, score - penalty);
    ev.push(`Concentration penalty −${penalty.toFixed(0)} (top-10 = ${((c.revenue.customerConcentrationTop10Pct!) * 100).toFixed(0)}%)`);
  }

  return { name: 'Revenue Quality', score: clamp(n > 0 ? score / n : 0), weight: 0.30, evidence: ev };
}

function marketPenetration(c: CompanyProfile): ReadinessDimension {
  const ev: string[] = [];
  let score = 0; let n = 0;

  // Penetration of TAM
  if (c.market.addressableMarketUsd > 0 && c.revenue.trailingTwelveMonthsRevenueUsd > 0) {
    const penetration = c.revenue.trailingTwelveMonthsRevenueUsd / c.market.addressableMarketUsd;
    // Reward presence + room to grow — sweet spot 0.1% – 5%
    const s = penetration < 0.001
      ? pct(penetration, 0, 0.001, 0, 35)
      : penetration < 0.05
        ? pct(penetration, 0.001, 0.05, 35, 90)
        : 80; // saturated markets get less optionality
    score += s; n += 1;
    ev.push(`Penetration ${(penetration * 100).toFixed(3)}% of TAM (${s.toFixed(0)}/100)`);
  }
  // Market growth
  if (c.market.marketGrowthPct > 0) {
    const s = pct(c.market.marketGrowthPct, 0.05, 0.40, 0, 100);
    score += s; n += 1;
    ev.push(`Market CAGR ${(c.market.marketGrowthPct * 100).toFixed(1)}% (${s.toFixed(0)}/100)`);
  }
  // Competitive density penalty
  if (c.market.competitiveDensity === 'high') { score = Math.max(0, score - 10); ev.push('Competitive density: high (−10)'); }
  if (c.market.competitiveDensity === 'low')  { score = Math.min(100, score + 5);  ev.push('Competitive density: low (+5)'); }
  return { name: 'Market Penetration', score: clamp(n > 0 ? score / n : 0), weight: 0.20, evidence: ev };
}

function technologyMoat(c: CompanyProfile): ReadinessDimension {
  const ev: string[] = [];
  let score = 50;
  if (c.product.hasNetworkEffects) { score += 15; ev.push('Network effects (+15)'); }
  if (c.product.hasDataMoat)       { score += 15; ev.push('Data moat (+15)'); }
  if (c.product.aiNative)          { score += 10; ev.push('AI-native (+10)'); }
  const patents = c.product.intellectualProperty?.patentsGranted ?? 0;
  if (patents > 0) { score += Math.min(15, patents * 3); ev.push(`${patents} patent(s) (+${Math.min(15, patents * 3)})`); }
  const arch = c.product.technicalArchitecture;
  if (arch === 'microservices' || arch === 'modular_monolith') { score += 5; ev.push(`Architecture: ${arch} (+5)`); }
  if (arch === 'monolith') { score -= 5; ev.push('Architecture: monolith (−5)'); }
  return { name: 'Technology Moat', score: clamp(score), weight: 0.20, evidence: ev };
}

function competitiveAdvantage(c: CompanyProfile): ReadinessDimension {
  const ev: string[] = [];
  let score = 50;
  switch (c.product.differentiation) {
    case 'monopolist': score = 92; ev.push('Differentiation: monopolist (92)'); break;
    case 'leader':     score = 78; ev.push('Differentiation: leader (78)'); break;
    case 'parity':     score = 50; ev.push('Differentiation: parity (50)'); break;
    case 'commodity':  score = 25; ev.push('Differentiation: commodity (25)'); break;
  }
  if (c.product.defensibility === 'high') { score += 8; ev.push('Defensibility: high (+8)'); }
  if (c.product.defensibility === 'low')  { score -= 8; ev.push('Defensibility: low (−8)'); }
  // Brand / drivers signal
  const goodDrivers = (c.drivers ?? []).filter((d) => d.trend === 'improving').length;
  if (goodDrivers > 0) { const add = Math.min(10, goodDrivers * 2); score += add; ev.push(`${goodDrivers} improving driver(s) (+${add})`); }
  return { name: 'Competitive Advantage', score: clamp(score), weight: 0.15, evidence: ev };
}

function scalability(c: CompanyProfile): ReadinessDimension {
  const ev: string[] = [];
  let score = 0; let n = 0;
  if (c.growth.arrGrowthYoyPct != null) {
    const s = pct(c.growth.arrGrowthYoyPct, 0.1, 2.0, 0, 100);
    score += s; n += 1; ev.push(`ARR growth ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY (${s.toFixed(0)}/100)`);
  }
  if (c.team.leadershipBenchStrength === 'strong')   { score += 10; n += 1; ev.push('Leadership bench: strong (+10)'); }
  if (c.team.leadershipBenchStrength === 'thin')     { score -= 10; n += 1; ev.push('Leadership bench: thin (−10)'); }
  if (c.team.foundersStillActive === false)          { score += 5;  ev.push('Founder dependence reduced (+5)'); }
  if (c.product.technicalArchitecture === 'microservices') { score += 5; ev.push('Microservices architecture (+5)'); }
  return { name: 'Scalability', score: clamp(n > 0 ? score / n : score), weight: 0.15, evidence: ev };
}

export function runReadiness(company: CompanyProfile): ReadinessReport {
  const dims = [
    revenueQuality(company),
    marketPenetration(company),
    technologyMoat(company),
    competitiveAdvantage(company),
    scalability(company),
  ];
  const overall = clamp(dims.reduce((s, d) => s + d.score * d.weight, 0));
  const band = bandFromScore(overall);

  const strengths = dims.filter((d) => d.score >= 70).map((d) => `${d.name}: ${d.score.toFixed(0)}/100`);
  const gaps      = dims.filter((d) => d.score <  45).map((d) => `${d.name}: ${d.score.toFixed(0)}/100 — improvement target`);

  const recs: string[] = [];
  if (overall < 35) recs.push('Defer outreach; the institutional buyer pool will not engage at this profile. Prioritise revenue quality and growth.');
  if (overall >= 35 && overall < 55) recs.push('Seed-acquisition viable. Target acquihires, talent buys and tuck-ins. Avoid full-process auctions.');
  if (overall >= 55 && overall < 75) recs.push('Growth-acquisition viable. Run a managed process with 6–10 qualified buyers, not an auction.');
  if (overall >= 75) recs.push('Strategic-acquisition viable. Run a competitive process; strategic premiums of 25–60% over standard valuation are defensible.');

  if ((company.revenue.customerConcentrationTop10Pct ?? 0) > 0.5) recs.push('Diversify the customer base — concentration discount is binding institutional buyers will price.');
  if ((company.revenue.netRetentionPct ?? 1) < 1.0) recs.push('Net retention below 100% — buyers will price in churn risk. Surface expansion mechanics in the CIM.');
  if (company.team.leadershipBenchStrength === 'thin') recs.push('Strengthen leadership bench — buyers de-risk for founder dependence.');

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    overallScore: overall,
    band,
    dimensions: dims,
    strengths,
    gaps,
    recommendations: recs,
  };
}
