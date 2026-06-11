import { SAMPLE_COMPANY } from "./profile";

// Exit Readiness Engine — a 100-point Exit Score across the ten categories a
// buyer underwrites, each derived deterministically from the company profile.
// The Value Impact Simulator prices each fix by distributing the engine's
// value-left-on-the-table across the gaps, so per-category dollars reconcile
// with the readiness cascade rather than inventing a separate number.

export interface ReadinessCategory {
  key: string;
  label: string;
  score: number;        // 0..100
  fix: string;          // what to do
  impactUsd: number;    // valuation impact of closing the gap (0 when on track)
  weight: number;       // importance to valuation (internal)
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const TARGET = 85;      // the score a category needs to stop dragging the headline

function rawCategories(): Omit<ReadinessCategory, "impactUsd">[] {
  const C = SAMPLE_COMPANY;
  const recurring = C.revenue.trailingTwelveMonthsRevenueUsd > 0
    ? C.revenue.annualRecurringRevenueUsd / C.revenue.trailingTwelveMonthsRevenueUsd : 0;
  const gross = C.revenue.grossMarginPct;
  const ebitda = C.revenue.ebitdaMarginPct;
  const conc = C.revenue.customerConcentrationTop10Pct ?? 0.2;
  const granted = C.product.intellectualProperty?.patentsGranted ?? 0;
  const pending = C.product.intellectualProperty?.patentsPending ?? 0;
  const arrPerHead = C.team.headcount > 0 ? C.revenue.annualRecurringRevenueUsd / C.team.headcount : 0;

  // Financial Readiness — margins + recurring quality.
  const financial = clamp(100 * (0.4 * Math.min(1, gross / 0.80) + 0.35 * Math.min(1, ebitda / 0.25) + 0.25 * Math.min(1, recurring / 0.6)));

  // Legal Readiness — IP title, compliance, contract completeness.
  let legal = 74;
  if (pending > granted) legal -= 12;
  legal += C.market.regulatoryRisk === "high" ? -22 : C.market.regulatoryRisk === "medium" ? -12 : 0;
  legal -= 6;
  legal = clamp(legal);

  // Technical Readiness — architecture, AI-native, defensibility.
  let tech = 52;
  if (C.product.aiNative) tech += 14;
  if (C.product.technicalArchitecture === "microservices") tech += 12;
  else if (C.product.technicalArchitecture === "modular_monolith") tech += 7;
  if (C.product.defensibility === "high") tech += 10; else if (C.product.defensibility === "medium") tech += 4;
  tech = clamp(tech);

  // Market Readiness — market growth + penetration headroom + competition.
  const sam = C.market.serviceableMarketUsd ?? 0;
  const penetration = sam > 0 ? C.revenue.trailingTwelveMonthsRevenueUsd / sam : 0;
  let market = 100 * (0.45 * Math.min(1, (C.market.marketGrowthPct ?? 0) / 0.12) + 0.3 * Math.min(1, penetration / 0.02) + 0.25);
  market -= C.market.competitiveDensity === "high" ? 12 : C.market.competitiveDensity === "medium" ? 6 : 0;
  market = clamp(market);

  // Founder Independence — can the business run without the founders.
  let founderIndep = C.team.foundersStillActive ? 52 : 88;
  founderIndep += C.team.leadershipBenchStrength === "strong" ? 14 : C.team.leadershipBenchStrength === "adequate" ? 6 : -6;
  founderIndep = clamp(founderIndep);

  // Operational Scalability — margin headroom + revenue per head + AI leverage.
  let scalability = 100 * (0.5 * Math.min(1, gross / 0.75) + 0.3 * Math.min(1, arrPerHead / 150_000) + 0.2 * (C.product.aiNative ? 1 : 0.4));
  scalability = clamp(scalability);

  // Customer Concentration — inverse of top-10 share.
  let concentration = 100 * (1 - conc);
  if (conc >= 0.35) concentration -= 15;
  concentration = clamp(concentration);

  // IP Protection — granted/pending patents + data/network moat.
  let ip = 40 + granted * 12 + pending * 4;
  if (C.product.hasDataMoat) ip += 8;
  if (C.product.hasNetworkEffects) ip += 6;
  ip = clamp(ip);

  // Governance — cap-table cleanliness, founder ownership, preference overhang.
  const prefOverhang = C.cap.priorRoundsValuationUsd && C.cap.priorRoundsValuationUsd > 0
    ? (C.cap.preferenceStackUsd ?? 0) / C.cap.priorRoundsValuationUsd : 0;
  let governance = 78;
  if ((C.cap.foundersOwnershipPct ?? 0) < 0.25) governance -= 8;
  if (prefOverhang > 0.3) governance -= 10;
  governance = clamp(governance);

  // Team Depth — bench + tenure + engineering share.
  const benchMap: Record<string, number> = { thin: 45, adequate: 78, strong: 92 };
  let team = benchMap[C.team.leadershipBenchStrength] ?? 70;
  if ((C.team.tenureMedianYears ?? 0) >= 3) team += 4;
  team = clamp(team);

  return [
    { key: "financial",     label: "Financial Readiness",      score: financial,     weight: 0.18, fix: "Lift gross margin and normalize EBITDA with a quality-of-earnings pack." },
    { key: "concentration", label: "Customer Concentration",   score: concentration, weight: 0.16, fix: "Diversify the book — multi-year renewals on the top accounts before launch." },
    { key: "founderIndep",  label: "Founder Independence",     score: founderIndep,  weight: 0.12, fix: "Push relationships and decisions to the team; document the playbook." },
    { key: "legal",         label: "Legal Readiness",          score: legal,         weight: 0.10, fix: "Backfill IP assignments, missing contracts and compliance evidence." },
    { key: "scalability",   label: "Operational Scalability",  score: scalability,   weight: 0.10, fix: "Show a margin-expansion path: automation, vendor renegotiation, mix shift." },
    { key: "market",        label: "Market Readiness",         score: market,        weight: 0.08, fix: "Articulate a bottom-up SAM/SOM and a 5-year capture thesis in the CIM." },
    { key: "ip",            label: "IP Protection",            score: ip,            weight: 0.08, fix: "File 2–3 core-architecture patents; make the data/network moat measurable." },
    { key: "governance",    label: "Governance",               score: governance,    weight: 0.07, fix: "Clean the cap table, resolve preference overhang, formalize the board." },
    { key: "technical",     label: "Technical Readiness",      score: tech,          weight: 0.06, fix: "Document the architecture, security posture and scalability headroom." },
    { key: "team",          label: "Team Depth",               score: team,          weight: 0.05, fix: "Retention + succession for the critical few; deepen the bench." },
  ];
}

// Distribute the value-left-on-the-table across the weak categories by
// (weight × gap-to-target), so per-category dollars sum to the cascade gap.
export function exitReadinessCategories(valueLeftUsd: number): ReadinessCategory[] {
  const cats = rawCategories();
  const raw = cats.map((c) => c.weight * Math.max(0, (TARGET - c.score) / 100));
  const sum = raw.reduce((s, r) => s + r, 0) || 1;
  return cats.map((c, i) => ({
    ...c,
    impactUsd: Math.round((valueLeftUsd * (raw[i] / sum)) / 100_000) * 100_000,
  }));
}
