import { READINESS_ANALYSIS, NEGOTIATION_STATE } from "./engines";
import { CURRENT_VALUE_USD, DEMO_DEAL_CONTEXT, type DealContext } from "./deal-context";

// Shared command metrics for the Exit Commander and the Dashboard. All values
// trace to deal-context, so the Commander, Dashboard and every other surface
// read one consistent set of numbers.

export interface CommanderMetrics {
  companyValue: number;
  potential: number;
  readinessScore: number;
  exitProbability: number;        // 0..100
  demandLabel: "High" | "Medium" | "Low";
  activeBuyers: number;
  strategicActive: number;
  timeToExitMonths: string;
  fixCount: number;
  recommendedAction: string;
  expectedIncreaseUsd: number;
  confidencePct: number;
}

/** The close-probability index, part by part (points out of 100). The only
 *  inputs are the Exit Score, active buyers and negotiation leverage — the
 *  leverage comes from the demo negotiation state (sample offers). */
export function exitProbabilityParts(ctx: DealContext = DEMO_DEAL_CONTEXT): {
  readiness: number; demand: number; leverage: number; total: number;
  exitScore: number; activeBuyers: number; leverageLabel: string; leverageNorm: number;
} {
  const readinessNorm = ctx.exitScore / 100;
  const demandNorm = Math.min(1, ctx.activeBuyers / 6);
  const leverageNorm = NEGOTIATION_STATE.leverage === "high" ? 1 : NEGOTIATION_STATE.leverage === "medium" ? 0.6 : 0.3;
  const total = Math.round((0.35 * readinessNorm + 0.4 * demandNorm + 0.25 * leverageNorm) * 100);
  return {
    readiness: 35 * readinessNorm, demand: 40 * demandNorm, leverage: 25 * leverageNorm, total,
    exitScore: ctx.exitScore, activeBuyers: ctx.activeBuyers, leverageLabel: NEGOTIATION_STATE.leverage, leverageNorm,
  };
}

// Defaults are the demo company's context, so callers that pass nothing get
// exactly the figures they always had. Leverage still comes from the demo
// negotiation state (sample offers) for every company — see Page 02 G4.
export function commanderMetrics(
  ctx: DealContext = DEMO_DEAL_CONTEXT,
  analysis: { weaknesses: readonly { recommendation: string; valuationUpliftUsd: number }[] } = READINESS_ANALYSIS,
): CommanderMetrics {
  const { exitScore: EXIT_SCORE, activeBuyers: ACTIVE_BUYERS, strategicActive: STRATEGIC_ACTIVE,
    demandLabel: DEMAND_LABEL, timeToCloseMonths: TIME_TO_CLOSE_MONTHS } = ctx;
  const companyValue = ctx.valuationBand.mid;
  const potential = ctx.potentialValueUsd;
  const topMove = analysis.weaknesses[0];

  // exit probability — blend of readiness (the reconciled Exit Score), buyer
  // demand and negotiation leverage (see exitProbabilityParts).
  const parts = exitProbabilityParts(ctx);
  const levNorm = parts.leverageNorm;
  const exitProbability = parts.total;

  const recommendedAction = STRATEGIC_ACTIVE > 0
    ? `Launch soft outreach to the ${STRATEGIC_ACTIVE} strategic buyer${STRATEGIC_ACTIVE === 1 ? "" : "s"} already circling.`
    : topMove ? topMove.recommendation.split(".")[0] + "." : "Start the process — your posture is strong.";

  const expectedIncreaseUsd = topMove ? topMove.valuationUpliftUsd : Math.round(companyValue * 0.1);
  const confidencePct = Math.min(92, 64 + ACTIVE_BUYERS * 3 + Math.round(levNorm * 12));

  return {
    companyValue, potential, readinessScore: EXIT_SCORE,
    exitProbability, demandLabel: DEMAND_LABEL, activeBuyers: ACTIVE_BUYERS, strategicActive: STRATEGIC_ACTIVE,
    timeToExitMonths: TIME_TO_CLOSE_MONTHS, fixCount: analysis.weaknesses.length,
    recommendedAction, expectedIncreaseUsd, confidencePct,
  };
}

export { CURRENT_VALUE_USD };
