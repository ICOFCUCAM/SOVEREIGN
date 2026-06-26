import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config/loadConfig.js";
import { ImageLibrary } from "../src/library/imageLibrary.js";
import { Orchestrator } from "../src/orchestrator.js";
import { PATHS } from "../src/paths.js";
import type { ImageProvider, Scorer, ComposedPrompt, GenerateOptions, GenerationCandidate, SceneCard, EngineConfig, ScoreReport } from "../src/types.js";

const config = loadConfig(PATHS.config);
const aScene = (): SceneCard => loadScenesFirst();
function loadScenesFirst(): SceneCard {
  const lib = new ImageLibrary(PATHS.scenes, mkdtempSync(join(tmpdir(), "ie-")));
  return lib.allScenes()[0];
}

class StubProvider implements ImageProvider {
  readonly name = "stub"; readonly model = "stub"; calls = 0;
  async generate(prompt: ComposedPrompt, opts: GenerateOptions): Promise<GenerationCandidate[]> {
    this.calls++;
    return Array.from({ length: opts.candidates }, (_, i) => ({
      id: `${prompt.sceneId}-v${prompt.version}-c${i}`, sceneId: prompt.sceneId,
      promptVersion: prompt.version, provider: this.name, model: this.model,
      filePath: `/tmp/${prompt.sceneId}-v${prompt.version}-c${i}.png`, createdAt: new Date().toISOString(),
    }));
  }
}
class FixedScorer implements Scorer {
  readonly name = "fixed";
  constructor(private total: number) {}
  async score(c: GenerationCandidate, scene: SceneCard, _cfg: EngineConfig): Promise<ScoreReport> {
    const v = this.total;
    return { candidateId: c.id, sceneId: scene.id,
      scores: { brandConsistency: 95, lightingConsistency: 95 }, weightedTotal: v, flags: [], notes: "" };
  }
}

function makeOrchestrator(scorer: Scorer, provider: ImageProvider) {
  const library = new ImageLibrary(PATHS.scenes, mkdtempSync(join(tmpdir(), "ie-lib-")));
  const outDir = mkdtempSync(join(tmpdir(), "ie-out-"));
  return { orchestrator: new Orchestrator({ config, provider, scorer, library, outDir }), library };
}

test("accepts on the first attempt when a candidate clears threshold + continuity", async () => {
  const provider = new StubProvider();
  const { orchestrator, library } = makeOrchestrator(new FixedScorer(95), provider);
  const scene = library.allScenes()[0];
  const res = await orchestrator.run(scene.id);
  assert.equal(res.accepted, true);
  assert.equal(res.attemptsUsed, 1);
  assert.equal(provider.calls, 1);
  assert.equal(res.record.status, "in_review");
  assert.ok(res.record.selectedCandidateId);
});

test("regenerates up to maxAttempts then gives up below threshold", async () => {
  const provider = new StubProvider();
  const { orchestrator, library } = makeOrchestrator(new FixedScorer(70), provider);
  const scene = library.allScenes()[0];
  const res = await orchestrator.run(scene.id);
  assert.equal(res.accepted, false);
  assert.equal(res.attemptsUsed, config.quality.maxAttempts);
  assert.equal(provider.calls, config.quality.maxAttempts);   // regenerated each attempt
  assert.ok(res.record.revisionCount > 0);                    // refinement engine ran
  assert.equal(res.record.status, "pending");
});

test("end-to-end with the real mock provider + scorer accepts within budget", async () => {
  const { MockImageProvider } = await import("../src/providers/mockImageProvider.js");
  const { MockScorer } = await import("../src/scoring/mockScorer.js");
  const provider = new MockImageProvider();
  const { orchestrator } = makeOrchestrator(new MockScorer(), provider);
  const scene = aScene();
  const res = await orchestrator.run(scene.id);
  assert.equal(res.accepted, true, res.reason);
  assert.ok(res.record.bestScore! >= config.quality.threshold);
});
