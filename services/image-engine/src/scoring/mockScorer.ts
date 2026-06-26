import { createHash } from "node:crypto";
import type { Scorer, GenerationCandidate, SceneCard, EngineConfig, ScoreReport } from "../types.js";
import { weightedTotal, criticalFlags } from "./rubric.js";

/**
 * Deterministic offline evaluator. Derives stable per-criterion scores from the
 * candidate id so the orchestration loop is reproducible: most candidates land
 * in the high-80s/90s, a few clear the threshold, exercising selection,
 * refinement and continuity without a vision model. Swap for VisionScorer live.
 */
export class MockScorer implements Scorer {
  readonly name = "mock";

  async score(candidate: GenerationCandidate, scene: SceneCard, config: EngineConfig): Promise<ScoreReport> {
    const digest = createHash("sha256").update(candidate.id).digest();
    const scores: Record<string, number> = {};
    config.quality.criteria.forEach((c, idx) => {
      // 80..100, deterministic per criterion+candidate (stays above continuity floor)
      scores[c.key] = 80 + (digest[(idx * 7) % digest.length] % 21);
    });
    const total = weightedTotal(scores, config.quality.criteria);
    const flags = criticalFlags(scores, config.quality.criteria);
    return {
      candidateId: candidate.id,
      sceneId: scene.id,
      scores,
      weightedTotal: total,
      flags,
      notes: "mock deterministic score (offline)",
    };
  }
}
