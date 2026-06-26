import type { ScoreReport, ContinuityVerdict, EngineConfig } from "../types.js";

/**
 * Continuity Engine. Before a candidate is approved, confirm it matches the
 * already-approved set on the visual-identity sub-scores (brand grade + cinematic
 * lighting). Offline-deterministic: it reasons over the evaluator's sub-scores
 * rather than re-reading pixels, so it is testable and provider-agnostic.
 */
export function checkContinuity(
  candidate: ScoreReport,
  approved: ScoreReport[],
  config: EngineConfig,
): ContinuityVerdict {
  const floor = config.quality.continuityFloor;
  const reasons: string[] = [];

  const brand = candidate.scores["brandConsistency"] ?? 0;
  const light = candidate.scores["lightingConsistency"] ?? 0;

  if (brand < floor) reasons.push(`brand consistency ${brand} below floor ${floor}`);
  if (light < floor) reasons.push(`lighting consistency ${light} below floor ${floor}`);

  if (approved.length > 0) {
    const avg = (k: string): number =>
      approved.reduce((a, r) => a + (r.scores[k] ?? 0), 0) / approved.length;
    const avgBrand = avg("brandConsistency");
    const avgLight = avg("lightingConsistency");
    if (brand < avgBrand - 12) reasons.push(`drifts from approved grade (${brand} vs set avg ${avgBrand.toFixed(0)})`);
    if (light < avgLight - 12) reasons.push(`drifts from approved lighting (${light} vs set avg ${avgLight.toFixed(0)})`);
  }

  return { ok: reasons.length === 0, reasons };
}
