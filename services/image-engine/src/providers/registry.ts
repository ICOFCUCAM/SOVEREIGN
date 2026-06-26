import type { ImageProvider } from "../types.js";
import { MockImageProvider } from "./mockImageProvider.js";
import { OpenAIImageProvider } from "./openaiImageProvider.js";

type Env = Record<string, string | undefined>;

/**
 * Provider factory. The orchestration logic depends only on the ImageProvider
 * interface, so adding Gemini / Stability / a sovereign model later is a new
 * case here — nothing else changes.
 *   IMAGE_PROVIDER=mock   (default, offline)
 *   IMAGE_PROVIDER=openai (requires OPENAI_API_KEY; OPENAI_IMAGE_MODEL optional)
 */
export function createProvider(env: Env = process.env): ImageProvider {
  const which = (env.IMAGE_PROVIDER ?? "mock").toLowerCase();
  switch (which) {
    case "openai": {
      const key = env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY is required when IMAGE_PROVIDER=openai");
      return new OpenAIImageProvider(key, env.OPENAI_IMAGE_MODEL ?? "gpt-image-1");
    }
    case "mock":
      return new MockImageProvider();
    default:
      throw new Error(`Unknown IMAGE_PROVIDER "${which}" (expected: mock | openai)`);
  }
}
