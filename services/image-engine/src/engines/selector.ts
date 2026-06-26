import type { ScoreReport, QualityConfig } from "../types.js";

export interface Selection {
  best?: ScoreReport;
  passes: boolean;
  ranked: ScoreReport[];
}

/**
 * Best-Image Selector. Ranks candidates by weighted total and accepts the top
 * one only if it clears the quality threshold and carries no critical flags.
 */
export function selectBest(reports: ScoreReport[], quality: QualityConfig): Selection {
  const ranked = [...reports].sort((a, b) => b.weightedTotal - a.weightedTotal);
  const best = ranked[0];
  const passes = !!best && best.weightedTotal >= quality.threshold && best.flags.length === 0;
  return { best, passes, ranked };
}
