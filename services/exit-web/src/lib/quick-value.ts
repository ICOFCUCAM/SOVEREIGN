import { runInstitutionalValuation } from "@exit/engines";
import { buildProfile, DEFAULT_INTAKE, SECTORS, type IntakeInputs, type Sector } from "./company-intake";
import { parseNumber, type ParseResult } from "./intake-fields";

// ── QUICK VALUE (homepage) ──────────────────────────────────────────
// Three inputs — sector, trailing revenue, growth — on top of the intake's
// typical defaults, run through the same institutional framework the console
// uses (owner decision D1). Nothing is stored here: the figures travel to
// Value My Company in the URL, which pre-fills them without saving.

export interface QuickInputs { sector: Sector; revenueUsd: number; growthPct: number }

/** Accepted ranges, in the units a visitor types ($M and %). */
export const QUICK_REVENUE = { min: 0.1, max: 5_000, scale: 1e6 } as const;
export const QUICK_GROWTH = { min: -50, max: 300, scale: 0.01 } as const;

/** ARR is taken in the same proportion to revenue as the intake's defaults. */
export const ARR_SHARE = DEFAULT_INTAKE.arrUsd / DEFAULT_INTAKE.ttmRevenueUsd;

export const parseRevenue = (text: string): ParseResult => parseNumber(text, QUICK_REVENUE);
export const parseGrowth = (text: string): ParseResult => parseNumber(text, QUICK_GROWTH);

/** The full intake the quick inputs stand for: typical defaults + the three figures. */
export function quickIntake(q: QuickInputs): IntakeInputs {
  return { ...DEFAULT_INTAKE, sector: q.sector, ttmRevenueUsd: q.revenueUsd, arrUsd: Math.round(q.revenueUsd * ARR_SHARE), growthPct: q.growthPct };
}

/** Low / mid / high from the institutional framework. */
export function quickValue(q: QuickInputs): { low: number; mid: number; high: number } {
  const h = runInstitutionalValuation(buildProfile(quickIntake(q))).headline;
  return { low: h.low, mid: h.mid, high: h.high };
}

/** The assumptions behind the quick value, for display. */
export const QUICK_ASSUMPTIONS: ReadonlyArray<[string, string]> = [
  ["ARR", `${Math.round(ARR_SHARE * 100)}% of revenue`],
  ["Gross margin", `${Math.round(DEFAULT_INTAKE.grossMarginPct * 100)}%`],
  ["EBITDA margin", `${Math.round(DEFAULT_INTAKE.ebitdaMarginPct * 100)}%`],
  ["Net revenue retention", `${Math.round(DEFAULT_INTAKE.netRetentionPct * 100)}%`],
  ["Top-10 customer share", `${Math.round(DEFAULT_INTAKE.customerConcentrationPct * 100)}%`],
  ["Customers", DEFAULT_INTAKE.totalCustomers.toLocaleString("en-US")],
];

/** Query string for Value My Company: sector, revenue in $M, growth in %. */
export function quickQuery(q: QuickInputs): string {
  const p = new URLSearchParams({ sector: q.sector, revenue: String(q.revenueUsd / 1e6), growth: String(Math.round(q.growthPct * 1e4) / 100) });
  return `?${p.toString()}`;
}

/** Read and validate the hand-off; null when any figure is missing or invalid. */
export function fromQuery(search: string): QuickInputs | null {
  const p = new URLSearchParams(search);
  const sector = p.get("sector");
  if (!sector || !(SECTORS as readonly string[]).includes(sector)) return null;
  const r = parseRevenue(p.get("revenue") ?? ""), g = parseGrowth(p.get("growth") ?? "");
  if (!r.ok || !g.ok) return null;
  return { sector: sector as Sector, revenueUsd: r.value, growthPct: g.value };
}
