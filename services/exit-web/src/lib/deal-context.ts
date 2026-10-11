import { VALUATION_STRATEGIC, READINESS, READINESS_ANALYSIS } from "./engines";
import { exitReadinessCategories, type ReadinessCategory } from "./exit-readiness-ai";
import { SAMPLE_COMPANY } from "./profile";
import {
  runBuyerDiscovery, strategicBuyerReport, runReadiness, runReadinessAnalysis,
  type BuyerCandidate, type CompanyProfile, type ReadinessReport,
} from "@exit/engines";

// Deal context — the single source of truth every console surface reads from,
// so figures never drift between screens. One implied price, one valuation
// band, one Exit Score, one buyer pool. Anything price-dependent (buyer
// economics, opening offers, ranges) anchors to IMPLIED_PRICE_USD.
//
// `dealContextFor(company)` computes the same context for any company (the
// founder's intake on pages that personalise). The exported constants below
// are that context for the demo company, exactly as before.

export interface DealContext {
  readonly valuationBand: { low: number; mid: number; high: number };
  readonly impliedPriceUsd: number;
  readonly currentValueUsd: number;
  readonly potentialValueUsd: number;
  readonly valueLeftUsd: number;
  readonly readinessCategories: ReadinessCategory[];
  readonly exitScore: number;
  readonly readinessBand: ReadinessReport["band"];
  readonly dealBuyers: readonly BuyerCandidate[];
  readonly activeBuyers: number;
  readonly strategicActive: number;
  readonly demandLabel: "High" | "Medium" | "Low";
  readonly timeToCloseMonths: string;
}

interface ContextInputs {
  readonly company: CompanyProfile;
  readonly valuationBand: { low: number; mid: number; high: number };
  readonly readiness: ReadinessReport;
  readonly analysis: { currentStrategicMid: number; projectedStrategicMid: number };
}

function build({ company, valuationBand, readiness, analysis }: ContextInputs): DealContext {
  const impliedPriceUsd = valuationBand.mid;
  const currentValueUsd = analysis.currentStrategicMid;
  const potentialValueUsd = analysis.projectedStrategicMid;
  const valueLeftUsd = Math.max(0, potentialValueUsd - currentValueUsd);

  // The ten readiness categories, priced off the value-left-on-the-table.
  const readinessCategories = exitReadinessCategories(valueLeftUsd, company);
  // Exit Score = the weighted average of the ten categories, so the headline
  // score and the category breakdown always reconcile (no two-number drift).
  const catWeight = readinessCategories.reduce((s, c) => s + c.weight, 0) || 1;
  const exitScore = Math.round(readinessCategories.reduce((s, c) => s + c.score * c.weight, 0) / catWeight);

  // One buyer pool, anchored to the implied price and ranked by expected
  // outcome — used wherever per-buyer economics are shown.
  const dealBuyers = runBuyerDiscovery(company, { impliedPriceUsd, limit: 12, sortBy: "expected_outcome" }).candidates;
  const activeBuyers = dealBuyers.filter((c) => c.buyer.appetite === "active").length;
  const strategicActive = dealBuyers.filter((c) => c.buyer.buyerType === "strategic" && c.buyer.appetite === "active").length;
  const demandLabel: DealContext["demandLabel"] = activeBuyers >= 5 ? "High" : activeBuyers >= 2 ? "Medium" : "Low";

  // Median per-deal time to close, in months (operational — once a buyer is
  // chosen). Distinct from the Exit Timing Engine's strategic *window*.
  const dayList = dealBuyers.map((c) => c.expectedOutcome.expectedDaysToCash).filter((n) => n > 0).sort((a, b) => a - b);
  const timeToCloseMonths = dayList.length ? (dayList[Math.floor(dayList.length / 2)] / 30).toFixed(1) : "—";

  return {
    valuationBand, impliedPriceUsd, currentValueUsd, potentialValueUsd, valueLeftUsd,
    readinessCategories, exitScore, readinessBand: readiness.band,
    dealBuyers, activeBuyers, strategicActive, demandLabel, timeToCloseMonths,
  };
}

/** The deal context for any company (pure; runs the engines). */
export function dealContextFor(company: CompanyProfile): DealContext {
  const readiness = runReadiness(company);
  return build({
    company,
    valuationBand: strategicBuyerReport(company).headline,
    readiness,
    analysis: runReadinessAnalysis(company, readiness),
  });
}

/** The demo company's context, from the module-level engine runs. */
export const DEMO_DEAL_CONTEXT: DealContext = build({
  company: SAMPLE_COMPANY,
  valuationBand: VALUATION_STRATEGIC.headline,
  readiness: READINESS,
  analysis: READINESS_ANALYSIS,
});

export const VALUATION_BAND = DEMO_DEAL_CONTEXT.valuationBand;          // { low, mid, high }
export const IMPLIED_PRICE_USD = DEMO_DEAL_CONTEXT.impliedPriceUsd;
export const CURRENT_VALUE_USD = DEMO_DEAL_CONTEXT.currentValueUsd;
export const POTENTIAL_VALUE_USD = DEMO_DEAL_CONTEXT.potentialValueUsd;
export const VALUE_LEFT_USD = DEMO_DEAL_CONTEXT.valueLeftUsd;
export const READINESS_CATEGORIES: ReadinessCategory[] = DEMO_DEAL_CONTEXT.readinessCategories;
export const EXIT_SCORE = DEMO_DEAL_CONTEXT.exitScore;
export const READINESS_BAND = DEMO_DEAL_CONTEXT.readinessBand;
export const DEAL_BUYERS: readonly BuyerCandidate[] = DEMO_DEAL_CONTEXT.dealBuyers;
export const ACTIVE_BUYERS = DEMO_DEAL_CONTEXT.activeBuyers;
export const STRATEGIC_ACTIVE = DEMO_DEAL_CONTEXT.strategicActive;
export const DEMAND_LABEL: "High" | "Medium" | "Low" = DEMO_DEAL_CONTEXT.demandLabel;
export const TIME_TO_CLOSE_MONTHS = DEMO_DEAL_CONTEXT.timeToCloseMonths;
