import { createHash } from "node:crypto";
import type {
  EngineConfig, SceneCard, ComposedPrompt, CameraPreset, LightingPreset, AspectRatio,
} from "../types.js";

// Refinement overrides injected by the Refinement Engine between attempts.
export interface ComposeOverrides {
  emphasis?: string[];   // extra positive direction
  suppress?: string[];   // extra negatives
}

function pickCamera(scene: SceneCard, config: EngineConfig): CameraPreset {
  const id = scene.camera ?? config.camera.default;
  return config.camera.presets.find((p) => p.id === id) ?? config.camera.presets[0];
}

function pickLighting(scene: SceneCard, config: EngineConfig): LightingPreset {
  const id = scene.lighting ?? config.lighting.default;
  return config.lighting.presets.find((p) => p.id === id) ?? config.lighting.presets[0];
}

function peopleClause(scene: SceneCard): string {
  const p = scene.people;
  const base: Record<string, string> = {
    none: "No people in frame.",
    distant: "Any figures are small, distant, seen from behind or in silhouette — no face toward the camera.",
    present: "A few figures at work, none posing, no eye contact with the camera.",
    central: "A single figure, dignified and candid, not addressing the camera.",
  };
  return base[p.prominence] + (p.notes ? ` ${p.notes}` : "");
}

/**
 * Compose the final prompt from every layer. Prompts are never handwritten:
 * Brand DNA · Style · Camera · Lighting · Composition · Scene · Quality · Negative.
 */
export function composePrompt(
  scene: SceneCard,
  config: EngineConfig,
  version = 1,
  overrides: ComposeOverrides = {},
): ComposedPrompt {
  const cam = pickCamera(scene, config);
  const light = pickLighting(scene, config);
  const ar: AspectRatio = scene.aspectRatio ?? config.composition.defaultAspectRatio;
  const s = config.style;

  const layers: Record<string, string> = {
    brand: `${config.brand.name} — ${config.brand.positioning} Brand DNA: ${config.brand.dna.join("; ")}. Grade signature: ${config.brand.gradeSignature} Avoid: ${config.brand.avoid.join("; ")}.`,
    style: `Palette: ${s.palette.join(", ")}. Materials: ${s.materials.join(", ")}. Textures: ${s.textures.join(", ")}. Rendering: ${s.renderingQuality.join(", ")}. Lens: ${s.lens}. Depth of field: ${s.depthOfField}. Perspective: ${s.perspective}. Mood: ${s.mood}. Atmosphere: ${s.atmosphere}.`,
    camera: `Camera: ${cam.angle}; ${cam.lens}; ${cam.height}; ${cam.distance}; framing — ${cam.framing}; ${cam.composition}.`,
    lighting: `Lighting: ${light.description}`,
    composition: `Composition: ${config.composition.rules.join("; ")}${scene.composition ? `; ${scene.composition}` : ""}.`,
    scene: `Scene — ${scene.title}. ${scene.story} Environment: ${scene.environment} Architecture: ${scene.architecture} ${peopleClause(scene)} Materials in shot: ${scene.materials.join(", ")}. Objects: ${scene.objects.join(", ")}.`,
    quality: `A photorealistic editorial photograph, annual-report quality, ${ar} landscape aspect ratio. Painterly photorealism — a real, considered photograph, not a 3D render, not AI-looking, not stock.`,
    emphasis: overrides.emphasis?.length ? `Direction for this revision: ${overrides.emphasis.join("; ")}.` : "",
  };

  const negatives = [...config.negative.global, ...scene.negativeExtra, ...(overrides.suppress ?? [])];
  const negativeText = Array.from(new Set(negatives)).join(", ");

  const text = [
    layers.brand, layers.style, layers.camera, layers.lighting,
    layers.composition, layers.scene, layers.quality, layers.emphasis,
  ].filter(Boolean).join("\n\n") + `\n\nDo NOT include: ${negativeText}.`;

  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  return { sceneId: scene.id, version, text, negativeText, aspectRatio: ar, hash, layers };
}
