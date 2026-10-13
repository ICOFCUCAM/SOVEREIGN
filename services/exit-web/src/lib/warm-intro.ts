import { fmtMoney } from "./ui";
import { sectorLabel } from "./market-stats";
import type { BuyerCandidate, CompanyProfile } from "@exit/engines";

// The warm introduction a founder copies from the Buyers page.
// Sent before any NDA, so it names neither the company nor its exact figures:
// the sector and an ARR band only (the band is stated to the nearest bracket).
export const arrBand = (usd: number): string => {
  const m = usd / 1_000_000;
  if (m < 5) return "under $5M";
  if (m < 10) return "$5–10M";
  if (m < 25) return "$10–25M";
  if (m < 50) return "$25–50M";
  if (m < 100) return "$50–100M";
  return "over $100M";
};
export function warmIntro(c: BuyerCandidate, co: CompanyProfile): string {
  const sector = sectorLabel(co.sector);
  return (
    `Subject: Introduction — a confidential ${sector} opportunity\n\n` +
    `Hi ${c.buyer.name} team,\n\n` +
    `I'm reaching out about a ${sector} business that aligns closely with your acquisition thesis: ${c.buyer.thesis} ` +
    `It is in the ${arrBand(co.revenue.annualRecurringRevenueUsd)} ARR band, growing ${(co.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY, ` +
    // Only mention recent activity when the registry records deals in the
    // last three years.
    (c.history.dealsLast3Years > 0
      ? `and your recent activity in the space — plus a check range of ${fmtMoney(c.buyer.checkSizeLowUsd)}–${fmtMoney(c.buyer.checkSizeHighUsd)} — `
      : `and your check range of ${fmtMoney(c.buyer.checkSizeLowUsd)}–${fmtMoney(c.buyer.checkSizeHighUsd)} `) +
    `makes a conversation worth both our time.\n\n` +
    `I can share an anonymized teaser now; the company's name and full figures follow under NDA. Would the coming week work for a short call?\n\nBest,\n[Your name]`
  );
}
