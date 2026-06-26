import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type {
  EngineConfig, BrandConfig, StyleConfig, CameraConfig, LightingConfig,
  CompositionConfig, QualityConfig, NegativeConfig, SceneCard,
} from "../types.js";

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

/** Load the seven immutable config layers into one EngineConfig. */
export function loadConfig(configDir: string): EngineConfig {
  return {
    brand: readJson<BrandConfig>(join(configDir, "brand.json")),
    style: readJson<StyleConfig>(join(configDir, "style.json")),
    camera: readJson<CameraConfig>(join(configDir, "camera.json")),
    lighting: readJson<LightingConfig>(join(configDir, "lighting.json")),
    composition: readJson<CompositionConfig>(join(configDir, "composition.json")),
    quality: readJson<QualityConfig>(join(configDir, "quality.json")),
    negative: readJson<NegativeConfig>(join(configDir, "negative.json")),
  };
}

/** Load every scene card from scenes/, ordered by index. */
export function loadScenes(scenesDir: string): SceneCard[] {
  return readdirSync(scenesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<SceneCard>(join(scenesDir, f)))
    .sort((a, b) => a.index - b.index);
}
