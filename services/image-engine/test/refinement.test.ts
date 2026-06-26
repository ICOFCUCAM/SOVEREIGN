import { test } from "node:test";
import assert from "node:assert/strict";
import { refinePrompt } from "../src/engines/refinement.js";
import type { ScoreReport } from "../src/types.js";

const report = (scores: Record<string, number>): ScoreReport => ({
  candidateId: "c", sceneId: "s", scores, weightedTotal: 0, flags: [], notes: "",
});
const high = 96;
const base: Record<string, number> = {
  architecturalQuality: high, institutionalAtmosphere: high, lightingConsistency: high,
  composition: high, brandConsistency: high, luxuryFeel: high, editorialQuality: high,
  humanRealism: high, handQuality: high, facialQuality: high, artisticExcellence: high,
  artifactAbsence: high, prohibitedAbsence: high,
};

test("weak architecture → architecture emphasis", () => {
  const r = refinePrompt(report({ ...base, architecturalQuality: 70 }));
  assert.match(r.reason, /architecture weak/);
  assert.ok(r.overrides.emphasis!.some((e) => /architecture/.test(e)));
});

test("weak faces/hands → reduce human prominence", () => {
  const r = refinePrompt(report({ ...base, facialQuality: 60 }));
  assert.match(r.reason, /human realism weak/);
  assert.ok(r.overrides.emphasis!.some((e) => /reduce human prominence/.test(e)));
});

test("artifacts/prohibited → suppress text + geometry", () => {
  const r = refinePrompt(report({ ...base, prohibitedAbsence: 80 }));
  assert.ok(r.overrides.suppress!.includes("any text"));
});

test("all strong → general uplift", () => {
  const r = refinePrompt(report(base));
  assert.match(r.reason, /general uplift/);
});

test("carries previous overrides forward (accumulates)", () => {
  const r = refinePrompt(report({ ...base, lightingConsistency: 70 }), { emphasis: ["prior note"], suppress: ["prior neg"] });
  assert.ok(r.overrides.emphasis!.includes("prior note"));
  assert.ok(r.overrides.suppress!.includes("prior neg"));
});
