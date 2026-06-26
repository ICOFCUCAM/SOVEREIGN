import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { Scorer, GenerationCandidate, SceneCard, EngineConfig, ScoreReport } from "../types.js";
import { weightedTotal, criticalFlags } from "./rubric.js";

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

/**
 * Live evaluator — a vision model grades each candidate 0–100 per criterion and
 * flags prohibited elements, returning strict JSON. Uses the OpenAI chat
 * completions API via fetch. Activated by SCORER=vision with OPENAI_API_KEY.
 */
export class VisionScorer implements Scorer {
  readonly name = "vision";
  private readonly endpoint = "https://api.openai.com/v1/chat/completions";

  constructor(private readonly apiKey: string, private readonly model = "gpt-4o") {}

  async score(candidate: GenerationCandidate, scene: SceneCard, config: EngineConfig): Promise<ScoreReport> {
    const mime = MIME[extname(candidate.filePath).toLowerCase()];
    if (!mime) throw new Error(`VisionScorer cannot grade ${candidate.filePath} (unsupported image type)`);
    const dataUrl = `data:${mime};base64,${readFileSync(candidate.filePath).toString("base64")}`;

    const criteriaList = config.quality.criteria.map((c) => `- ${c.key}: ${c.label}`).join("\n");
    const prohibited = config.negative.global.join(", ");
    const system = `You are a ruthless art director for "${config.brand.name}". Grade the image for an institutional illustration set. Brand DNA: ${config.brand.dna.join("; ")}. Grade signature: ${config.brand.gradeSignature}`;
    const user = `Scene intent: ${scene.title} — ${scene.story}
Grade each criterion 0–100 (be harsh; reserve >92 for excellent):
${criteriaList}
Also list any PROHIBITED elements you actually see from: ${prohibited}.
Respond as STRICT JSON only: {"scores":{"<key>":<0-100>,...},"flags":["..."],"notes":"<1 sentence>"}`;

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: [
            { type: "text", text: user },
            { type: "image_url", image_url: { url: dataUrl } },
          ] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Vision scorer ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const parsed = JSON.parse(body.choices[0].message.content) as { scores: Record<string, number>; flags?: string[]; notes?: string };

    const scores: Record<string, number> = {};
    for (const c of config.quality.criteria) scores[c.key] = clamp(parsed.scores?.[c.key]);
    const total = weightedTotal(scores, config.quality.criteria);
    const flags = [...new Set([...(parsed.flags ?? []), ...criticalFlags(scores, config.quality.criteria)])];
    return { candidateId: candidate.id, sceneId: scene.id, scores, weightedTotal: total, flags, notes: parsed.notes ?? "" };
  }
}

const clamp = (n: unknown): number => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
