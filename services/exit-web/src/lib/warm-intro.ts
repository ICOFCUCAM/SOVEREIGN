import { fmtMoney } from "./ui";
import { sectorLabel } from "./market-stats";
import { revenueBand } from "./bands";
import type { BuyerCandidate, CompanyProfile } from "@exit/engines";

// The warm introduction a founder copies from the Buyers page.
// Sent before any NDA, so it names neither the company nor its exact figures:
// the sector and an ARR band only (the brackets shared by every pre-NDA surface).
export const arrBand = (usd: number): string => revenueBand(usd).label;
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
