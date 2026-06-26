import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ImageProvider, ComposedPrompt, GenerateOptions, GenerationCandidate, AspectRatio } from "../types.js";

/** gpt-image-1 supported sizes, mapped from our aspect ratios. */
function mapSize(ar: AspectRatio): string {
  switch (ar) {
    case "1:1": return "1024x1024";
    case "4:5": return "1024x1536";
    default: return "1536x1024"; // 16:10, 16:9, 3:2, 4:3 → landscape
  }
}

/**
 * Live provider — OpenAI Images API (gpt-image-1) via fetch (no SDK dependency).
 * Generates candidates one call at a time so each is an independent sample, and
 * writes the returned PNG bytes to disk. Activated by IMAGE_PROVIDER=openai with
 * OPENAI_API_KEY set. Never called by the test suite.
 */
export class OpenAIImageProvider implements ImageProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly endpoint = "https://api.openai.com/v1/images/generations";

  constructor(private readonly apiKey: string, model = "gpt-image-1") {
    this.model = model;
  }

  async generate(prompt: ComposedPrompt, opts: GenerateOptions): Promise<GenerationCandidate[]> {
    mkdirSync(opts.outDir, { recursive: true });
    const size = mapSize(prompt.aspectRatio);
    const out: GenerationCandidate[] = [];

    for (let i = 0; i < opts.candidates; i++) {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: prompt.text, size, n: 1 }),
      });
      if (!res.ok) {
        throw new Error(`OpenAI Images API ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as { data: Array<{ b64_json?: string; url?: string; revised_prompt?: string }> };
      const item = data.data?.[0];
      if (!item?.b64_json) throw new Error("OpenAI response missing b64_json image data");

      const id = `${prompt.sceneId}-v${prompt.version}-c${i}-${prompt.hash.slice(0, 6)}`;
      const file = join(opts.outDir, `${id}.png`);
      writeFileSync(file, Buffer.from(item.b64_json, "base64"));
      out.push({
        id,
        sceneId: prompt.sceneId,
        promptVersion: prompt.version,
        provider: this.name,
        model: this.model,
        filePath: file,
        createdAt: new Date().toISOString(),
        meta: { size, revisedPrompt: item.revised_prompt, promptHash: prompt.hash },
      });
    }
    return out;
  }
}
