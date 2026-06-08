import { VALUATION_STRATEGIC, READINESS, READINESS_ANALYSIS } from "./engines";
import { exitReadinessCategories, type ReadinessCategory } from "./exit-readiness-ai";
import { SAMPLE_COMPANY } from "./profile";
import { runBuyerDiscovery, type BuyerCandidate } from "@exit/engines";

// Deal context — the single source of truth every console surface reads from,
// so figures never drift between screens. One implied price, one valuation
// band, one Exit Score, one buyer pool. Anything price-dependent (buyer
// economics, opening offers, ranges) anchors to IMPLIED_PRICE_USD.

export const VALUATION_BAND = VALUATION_STRATEGIC.headline;          // { low, mid, high }
export const IMPLIED_PRICE_USD = VALUATION_BAND.mid;
export const CURRENT_VALUE_USD = READINESS_ANALYSIS.currentStrategicMid;
export const POTENTIAL_VALUE_USD = READINESS_ANALYSIS.projectedStrategicMid;
export const VALUE_LEFT_USD = Math.max(0, POTENTIAL_VALUE_USD - CURRENT_VALUE_USD);

// The ten readiness categories, priced off the value-left-on-the-table.
export const READINESS_CATEGORIES: ReadinessCategory[] = exitReadinessCategories(VALUE_LEFT_USD);

// Exit Score = the weighted average of the ten categories, so the headline
// score and the category breakdown always reconcile (no two-number drift).
const catWeight = READINESS_CATEGORIES.reduce((s, c) => s + c.weight, 0) || 1;
export const EXIT_SCORE = Math.round(
  READINESS_CATEGORIES.reduce((s, c) => s + c.score * c.weight, 0) / catWeight,
);
export const READINESS_BAND = READINESS.band;

// One buyer pool, anchored to the implied price and ranked by expected
// outcome — used wherever per-buyer economics are shown.
export const DEAL_BUYERS: readonly BuyerCandidate[] = runBuyerDiscovery(SAMPLE_COMPANY, {
  impliedPriceUsd: IMPLIED_PRICE_USD,
  limit: 12,
  sortBy: "expected_outcome",
}).candidates;

export const ACTIVE_BUYERS = DEAL_BUYERS.filter((c) => c.buyer.appetite === "active").length;
export const STRATEGIC_ACTIVE = DEAL_BUYERS.filter((c) => c.buyer.buyerType === "strategic" && c.buyer.appetite === "active").length;
export const DEMAND_LABEL: "High" | "Medium" | "Low" = ACTIVE_BUYERS >= 5 ? "High" : ACTIVE_BUYERS >= 2 ? "Medium" : "Low";

// Median per-deal time to close, in months (operational — once a buyer is
// chosen). Distinct from the Exit Timing Engine's strategic *window*.
const dayList = DEAL_BUYERS.map((c) => c.expectedOutcome.expectedDaysToCash).filter((n) => n > 0).sort((a, b) => a - b);
export const TIME_TO_CLOSE_MONTHS = dayList.length ? (dayList[Math.floor(dayList.length / 2)] / 30).toFixed(1) : "—";
