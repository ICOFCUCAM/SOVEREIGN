import type { QualityCriterion } from "../types.js";

/** Weighted mean of per-criterion scores (0–100), rounded to 1 dp. */
export function weightedTotal(scores: Record<string, number>, criteria: QualityCriterion[]): number {
  const totalWeight = criteria.reduce((a, c) => a + c.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = criteria.reduce((a, c) => a + (scores[c.key] ?? 0) * c.weight, 0);
  return Math.round((sum / totalWeight) * 10) / 10;
}

/** A near-zero score on any `critical` criterion fails the candidate outright. */
export function criticalFlags(scores: Record<string, number>, criteria: QualityCriterion[]): string[] {
  return criteria
    .filter((c) => c.critical && (scores[c.key] ?? 100) < 50)
    .map((c) => `critical:${c.key}`);
}
