import { join } from "node:path";
import type {
  EngineConfig, LibraryRecord, OrchestrationResult, ImageProvider, Scorer, PromptVersionRecord,
} from "./types.js";
import { composePrompt, type ComposeOverrides } from "./engines/promptComposer.js";
import { refinePrompt } from "./engines/refinement.js";
import { selectBest } from "./engines/selector.js";
import { checkContinuity } from "./engines/continuity.js";
import type { ImageLibrary } from "./library/imageLibrary.js";

export interface OrchestratorDeps {
  config: EngineConfig;
  provider: ImageProvider;
  scorer: Scorer;
  library: ImageLibrary;
  outDir: string;
}

/**
 * The Art Direction loop, fully dependency-injected:
 *   compose → generate N candidates → score each → select best →
 *   if (passes threshold AND continuity) → mark in_review, done
 *   else → refine the prompt programmatically and regenerate
 * until the threshold is met or maxAttempts is exhausted.
 */
export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  async run(sceneId: string): Promise<OrchestrationResult> {
    const { config, provider, scorer, library, outDir } = this.deps;
    const scene = library.scene(sceneId);
    if (!scene) throw new Error(`Unknown scene: ${sceneId}`);

    const now = new Date().toISOString();
    const record: LibraryRecord = library.get(sceneId) ?? {
      sceneId, index: scene.index, status: "pending", attempts: 0, revisionCount: 0,
      promptVersions: [], candidates: [], scores: [], createdAt: now, updatedAt: now,
    };
    // Fresh run: clear transient generation state, keep identity + history counters.
    record.candidates = []; record.scores = []; record.promptVersions = [];
    record.selectedCandidateId = undefined; record.continuity = undefined; record.bestScore = undefined;

    let overrides: ComposeOverrides = {};
    let version = 0;
    let lastReason = "";

    for (let attempt = 1; attempt <= config.quality.maxAttempts; attempt++) {
      version++;
      const prompt = composePrompt(scene, config, version, overrides);
      const pv: PromptVersionRecord = {
        version, hash: prompt.hash,
        refinementReason: version > 1 ? lastReason : undefined,
        createdAt: new Date().toISOString(),
      };
      record.promptVersions.push(pv);

      const candidates = await provider.generate(prompt, {
        candidates: config.quality.candidatesPerScene,
        outDir: join(outDir, scene.id),
      });
      const reports = await Promise.all(candidates.map((c) => scorer.score(c, scene, config)));
      record.candidates.push(...candidates);
      record.scores.push(...reports);
      record.attempts = attempt;

      const { best, passes } = selectBest(reports, config.quality);
      if (best) {
        record.bestScore = Math.max(record.bestScore ?? 0, best.weightedTotal);
        const continuity = checkContinuity(best, library.approvedReports(), config);

        if (passes && continuity.ok) {
          record.selectedCandidateId = best.candidateId;
          record.continuity = continuity;
          record.status = "in_review"; // awaits human approve/reject
          library.save(record);
          return { record, accepted: true, attemptsUsed: attempt, reason: `selected ${best.candidateId} at ${best.weightedTotal}` };
        }

        const refinement = refinePrompt(best, overrides);
        if (passes && !continuity.ok) {
          refinement.overrides.emphasis = [...(refinement.overrides.emphasis ?? []), "match the approved set grade and lighting exactly"];
          refinement.reason = `${refinement.reason}; continuity drift (${continuity.reasons.join("; ")})`;
        }
        overrides = refinement.overrides;
        lastReason = refinement.reason;
        record.revisionCount++;
      }
    }

    record.status = "pending"; // threshold never met; best candidates retained for review
    library.save(record);
    const fallback = selectBest(record.scores, config.quality).best;
    return {
      record, accepted: false, attemptsUsed: config.quality.maxAttempts,
      reason: `threshold ${config.quality.threshold} not reached after ${config.quality.maxAttempts} attempts (best ${fallback?.weightedTotal ?? "n/a"})`,
    };
  }
}
