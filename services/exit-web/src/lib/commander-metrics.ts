import { VALUATION_STRATEGIC, READINESS, READINESS_ANALYSIS, BUYERS, NEGOTIATION_STATE } from "./engines";

// Shared command metrics for the Exit Commander and the Dashboard, so both
// read from one engine-derived source of truth.

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

export function commanderMetrics(): CommanderMetrics {
  const companyValue = VALUATION_STRATEGIC.headline.mid;
  const potential = READINESS_ANALYSIS.projectedStrategicMid;
  const topMove = READINESS_ANALYSIS.weaknesses[0];
  const activeBuyers = BUYERS.candidates.filter((c) => c.buyer.appetite === "active").length;
  const strategicActive = BUYERS.candidates.filter((c) => c.buyer.buyerType === "strategic" && c.buyer.appetite === "active").length;
  const demandLabel: CommanderMetrics["demandLabel"] = activeBuyers >= 5 ? "High" : activeBuyers >= 2 ? "Medium" : "Low";

  const readinessNorm = READINESS.overallScore / 100;
  const demandNorm = Math.min(1, activeBuyers / 6);
  const levNorm = NEGOTIATION_STATE.leverage === "high" ? 1 : NEGOTIATION_STATE.leverage === "medium" ? 0.6 : 0.3;
  const exitProbability = Math.round((0.35 * readinessNorm + 0.4 * demandNorm + 0.25 * levNorm) * 100);

  const dayList = BUYERS.candidates.map((c) => c.expectedOutcome.expectedDaysToCash).filter((n) => n > 0).sort((a, b) => a - b);
  const medianDays = dayList.length ? dayList[Math.floor(dayList.length / 2)] : 120;
  const timeToExitMonths = (medianDays / 30).toFixed(1);

  const recommendedAction = strategicActive > 0
    ? `Launch soft outreach to the ${strategicActive} strategic buyer${strategicActive === 1 ? "" : "s"} already circling.`
    : topMove ? topMove.recommendation.split(".")[0] + "." : "Start the process — your posture is strong.";

  const expectedIncreaseUsd = topMove ? topMove.valuationUpliftUsd : Math.round(companyValue * 0.1);
  const confidencePct = Math.min(92, 64 + activeBuyers * 3 + Math.round(levNorm * 12));

  return {
    companyValue, potential, readinessScore: READINESS.overallScore,
    exitProbability, demandLabel, activeBuyers, strategicActive,
    timeToExitMonths, fixCount: READINESS_ANALYSIS.weaknesses.length,
    recommendedAction, expectedIncreaseUsd, confidencePct,
  };
}
