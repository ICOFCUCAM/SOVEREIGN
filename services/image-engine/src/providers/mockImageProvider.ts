import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ImageProvider, ComposedPrompt, GenerateOptions, GenerationCandidate } from "../types.js";

/**
 * Deterministic offline provider. Writes a valid SVG placeholder per candidate
 * (varied by prompt hash + index) so the full pipeline — compose, generate,
 * score, select, refine, continuity, library — runs and is unit-testable with
 * no network and no cost. Swap to OpenAIImageProvider via IMAGE_PROVIDER=openai.
 */
export class MockImageProvider implements ImageProvider {
  readonly name = "mock";
  readonly model = "mock-1";

  async generate(prompt: ComposedPrompt, opts: GenerateOptions): Promise<GenerationCandidate[]> {
    mkdirSync(opts.outDir, { recursive: true });
    const out: GenerationCandidate[] = [];
    for (let i = 0; i < opts.candidates; i++) {
      const id = `${prompt.sceneId}-v${prompt.version}-c${i}-${prompt.hash.slice(0, 6)}`;
      const file = join(opts.outDir, `${id}.svg`);
      writeFileSync(file, this.placeholder(i));
      out.push({
        id,
        sceneId: prompt.sceneId,
        promptVersion: prompt.version,
        provider: this.name,
        model: this.model,
        filePath: file,
        createdAt: new Date().toISOString(),
        meta: { mock: true, promptHash: prompt.hash },
      });
    }
    return out;
  }

  private placeholder(i: number): string {
    const tint = ["#16140e", "#0d0f14", "#120d0d", "#0c0d0c"][i % 4];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs><radialGradient id="g" cx="50%" cy="30%" r="75%">
    <stop offset="0%" stop-color="rgba(202,164,90,0.16)"/><stop offset="100%" stop-color="${tint}"/>
  </radialGradient></defs>
  <rect width="1600" height="1000" fill="${tint}"/>
  <rect width="1600" height="1000" fill="url(#g)"/>
  <circle cx="800" cy="300" r="60" fill="none" stroke="rgba(202,164,90,0.5)" stroke-width="3"/>
</svg>`;
  }
}
