import { SAMPLE_COMPANY } from "./profile";

// Exit Readiness AI — scores the company across the six categories a buyer
// actually underwrites (Revenue, Team, Product, Financials, Legal, Growth),
// each derived deterministically from the company profile. The valuation
// impact of fixing each weak category is distributed from the engine's
// value-left-on-the-table, so the per-category dollars reconcile with the
// readiness cascade rather than inventing a separate number.

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
  const ret = C.revenue.grossRetentionPct ?? 0.85;
  const conc = C.revenue.customerConcentrationTop10Pct ?? 0.2;
  const gross = C.revenue.grossMarginPct;
  const ebitda = C.revenue.ebitdaMarginPct;
  const granted = C.product.intellectualProperty?.patentsGranted ?? 0;
  const pending = C.product.intellectualProperty?.patentsPending ?? 0;

  // Revenue — quality of the top line: recurring mix, retention, concentration.
  const revenue = clamp(100 * (0.40 * Math.min(1, recurring / 0.6) + 0.35 * ret + 0.25 * (1 - conc)));

  // Team — bench strength + tenure.
  const benchMap: Record<string, number> = { thin: 45, adequate: 78, strong: 92 };
  let team = benchMap[C.team.leadershipBenchStrength] ?? 70;
  if ((C.team.tenureMedianYears ?? 0) >= 3) team += 4;
  team = clamp(team);

  // Product — defensibility, differentiation, moat features, IP.
  let product = 50;
  if (C.product.differentiation === "leader") product += 14;
  if (C.product.aiNative) product += 9;
  if (C.product.hasNetworkEffects) product += 8;
  if (C.product.hasDataMoat) product += 8;
  if (C.product.defensibility === "high") product += 6;
  product += Math.min(4, granted * 2);
  product = clamp(product);

  // Financials — margins.
  const financials = clamp(100 * (0.55 * Math.min(1, gross / 0.80) + 0.45 * Math.min(1, ebitda / 0.25)));

  // Legal — IP title, compliance, regulatory risk, contract completeness.
  let legal = 74;
  if (pending > granted) legal -= 12;
  legal += C.market.regulatoryRisk === "high" ? -22 : C.market.regulatoryRisk === "medium" ? -12 : 0;
  legal -= 6; // missing contracts in the package
  legal = clamp(legal);

  // Growth — ARR growth, customer growth, market tailwind.
  const arrG = C.growth.arrGrowthYoyPct;
  const custG = C.growth.customerGrowthYoyPct ?? 0;
  const mktG = C.market.marketGrowthPct ?? 0;
  const growth = clamp(100 * (0.5 * Math.min(1, arrG / 0.7) + 0.3 * Math.min(1, custG / 0.4) + 0.2 * Math.min(1, mktG / 0.12)));

  return [
    { key: "revenue",    label: "Revenue",    score: revenue,    weight: 0.28, fix: "Convert transactional revenue to recurring and de-risk top-account concentration." },
    { key: "team",       label: "Team",       score: team,       weight: 0.10, fix: "Deepen the leadership bench and reduce founder dependency before diligence." },
    { key: "product",    label: "Product",    score: product,    weight: 0.10, fix: "Strong — keep the moat measurable (data, network effects, IP) in the CIM." },
    { key: "financials", label: "Financials", score: financials, weight: 0.22, fix: "Lift gross margin and normalize EBITDA with a quality-of-earnings pack." },
    { key: "legal",      label: "Legal",      score: legal,      weight: 0.14, fix: "Backfill IP assignments, missing contracts and compliance evidence." },
    { key: "growth",     label: "Growth",     score: growth,     weight: 0.16, fix: "Sustain ARR growth while holding margins — buyers price the Rule of 40." },
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
