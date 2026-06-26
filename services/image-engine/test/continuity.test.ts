import { test } from "node:test";
import assert from "node:assert/strict";
import { checkContinuity } from "../src/engines/continuity.js";
import type { ScoreReport, EngineConfig } from "../src/types.js";

const config = { quality: { continuityFloor: 80 } } as unknown as EngineConfig;
const rep = (brand: number, light: number): ScoreReport => ({
  candidateId: "c", sceneId: "s",
  scores: { brandConsistency: brand, lightingConsistency: light },
  weightedTotal: 95, flags: [], notes: "",
});

test("passes above floor with no approved baseline", () => {
  assert.equal(checkContinuity(rep(90, 90), [], config).ok, true);
});

test("fails below the continuity floor", () => {
  const v = checkContinuity(rep(72, 90), [], config);
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /brand consistency 72/);
});

test("fails when it drifts far from the approved set", () => {
  const approved = [rep(96, 96), rep(94, 95)];
  const v = checkContinuity(rep(81, 96), approved, config); // above floor but >12 below avg
  assert.equal(v.ok, false);
  assert.match(v.reasons.join(" "), /drifts from approved grade/);
});
