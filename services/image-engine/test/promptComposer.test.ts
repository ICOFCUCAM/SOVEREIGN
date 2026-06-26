import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config/loadConfig.js";
import { composePrompt } from "../src/engines/promptComposer.js";
import { PATHS } from "../src/paths.js";
import type { SceneCard } from "../src/types.js";

const config = loadConfig(PATHS.config);
const scene: SceneCard = {
  id: "scene-test", index: 99, title: "Test Hall",
  purpose: "unit test", story: "A still ceremonial moment.",
  environment: "A dark panelled hall.", architecture: "Columns into shadow.",
  people: { prominence: "none" },
  materials: ["marble"], objects: ["a brass lamp"],
  negativeExtra: ["national flags"], continuityNotes: "match the set",
};

test("composes from every layer, never handwritten", () => {
  const p = composePrompt(scene, config);
  for (const layer of ["brand", "style", "camera", "lighting", "composition", "scene", "quality"]) {
    assert.ok(p.layers[layer] && p.layers[layer].length > 0, `layer ${layer} present`);
  }
  assert.match(p.text, /Sovereign Dispatch/);
  assert.match(p.text, /A still ceremonial moment/);     // scene story
  assert.equal(p.aspectRatio, "16:10");
  assert.equal(p.hash.length, 16);
});

test("appends global + scene-specific negatives", () => {
  const p = composePrompt(scene, config);
  assert.match(p.text, /Do NOT include:/);
  assert.match(p.negativeText, /holograms/);     // global
  assert.match(p.negativeText, /national flags/); // scene-specific
});

test("deterministic: same inputs → same hash; overrides change it", () => {
  const a = composePrompt(scene, config, 1);
  const b = composePrompt(scene, config, 1);
  assert.equal(a.hash, b.hash);
  const c = composePrompt(scene, config, 2, { emphasis: ["more architecture"], suppress: ["any text"] });
  assert.notEqual(a.hash, c.hash);
  assert.match(c.text, /more architecture/);
  assert.match(c.negativeText, /any text/);
});
