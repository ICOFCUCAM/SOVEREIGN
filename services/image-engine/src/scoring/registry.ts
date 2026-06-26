import type { Scorer } from "../types.js";
import { MockScorer } from "./mockScorer.js";
import { VisionScorer } from "./visionScorer.js";

type Env = Record<string, string | undefined>;

/**
 * Scorer factory. Orchestration depends only on the Scorer interface.
 *   SCORER=mock   (default, offline, deterministic)
 *   SCORER=vision (requires OPENAI_API_KEY; OPENAI_VISION_MODEL optional)
 */
export function createScorer(env: Env = process.env): Scorer {
  const which = (env.SCORER ?? "mock").toLowerCase();
  switch (which) {
    case "vision": {
      const key = env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY is required when SCORER=vision");
      return new VisionScorer(key, env.OPENAI_VISION_MODEL ?? "gpt-4o");
    }
    case "mock":
      return new MockScorer();
    default:
      throw new Error(`Unknown SCORER "${which}" (expected: mock | vision)`);
  }
}
