import type { CompanyProfile } from "@exit/engines";
import { regionOf, type Region } from "@exit/engines";

// ── ACQUIRER SIDE — Buyer → Company matching ────────────────────────
// The reverse of founder→buyer discovery. A buyer configures an acquisition
// mandate (sectors, revenue band, regions, growth) and ExitOS scores listed
// companies against it. Every match is itemized against real company figures
// — a qualified opportunity is earned on the data, never asserted.

// Buyers think in ExitOS sectors (the index taxonomy); companies carry a
// SectorTag. This maps one to the other so a mandate can match a listing.
const SECTORTAG_TO_EXITOS: Record<string, string> = {
  enterprise_saas: "Software", vertical_saas: "Software", developer_tools: "Developer Tools",
  ai_infra: "AI", fintech_payments: "Fintech", b2b_marketplace: "Marketplace",
  consumer_marketplace: "Consumer", logistics_freight: "Logistics", mobility: "Transportation",
  media_content: "Media", other: "Other",
};

export const exitosSectorOf = (company: CompanyProfile): string => SECTORTAG_TO_EXITOS[company.sector] ?? "Other";

export interface AcquisitionCriteria {
  sectors: readonly string[];      // ExitOS sectors; empty = any
  minRevUsd: number;
  maxRevUsd: number;
  regions: readonly Region[];      // empty = any
  minGrowthPct: number;            // e.g. 0.2
}

export interface MatchReason { readonly label: string; readonly ok: boolean; readonly detail: string }
export interface CompanyMatch { readonly score: number; readonly qualified: boolean; readonly reasons: readonly MatchReason[] }

const fmtM = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(0)}M`);

const WEIGHTS = { sector: 0.4, revenue: 0.25, region: 0.2, growth: 0.15 };

export function matchCompanyToCriteria(company: CompanyProfile, c: AcquisitionCriteria): CompanyMatch {
  const exitos = exitosSectorOf(company);
  const region = regionOf(company.jurisdiction);
  const ttm = company.revenue.trailingTwelveMonthsRevenueUsd;
  const growth = company.growth.arrGrowthYoyPct;

  const sectorOk = c.sectors.length === 0 || c.sectors.includes(exitos);
  const revenueOk = ttm >= c.minRevUsd && ttm <= c.maxRevUsd;
  const regionOk = c.regions.length === 0 || c.regions.includes(region);
  const growthOk = growth >= c.minGrowthPct;

  const reasons: MatchReason[] = [
    { label: "Sector", ok: sectorOk, detail: `${exitos}${sectorOk ? " — in your targets" : " — outside your targets"}` },
    { label: "Revenue", ok: revenueOk, detail: `${fmtM(ttm)} ${revenueOk ? "within" : "outside"} ${fmtM(c.minRevUsd)}–${fmtM(c.maxRevUsd)}` },
    { label: "Region", ok: regionOk, detail: `${company.jurisdiction} (${region})${regionOk ? " — covered" : " — outside coverage"}` },
    { label: "Growth", ok: growthOk, detail: `${Math.round(growth * 100)}% ${growthOk ? "≥" : "<"} ${Math.round(c.minGrowthPct * 100)}% threshold` },
  ];

  const score = Math.round(100 * (
    (sectorOk ? WEIGHTS.sector : 0) + (revenueOk ? WEIGHTS.revenue : 0) +
    (regionOk ? WEIGHTS.region : 0) + (growthOk ? WEIGHTS.growth : 0)
  ));
  // a qualified opportunity must clear the bar AND match the sector mandate
  const qualified = score >= 70 && sectorOk;
  return { score, qualified, reasons };
}
