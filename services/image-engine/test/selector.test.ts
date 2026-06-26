import { test } from "node:test";
import assert from "node:assert/strict";
import { selectBest } from "../src/engines/selector.js";
import type { ScoreReport, QualityConfig } from "../src/types.js";

const quality: QualityConfig = { criteria: [], threshold: 92, maxAttempts: 5, candidatesPerScene: 6, continuityFloor: 80 };
const rep = (id: string, total: number, flags: string[] = []): ScoreReport => ({ candidateId: id, sceneId: "s", scores: {}, weightedTotal: total, flags, notes: "" });

test("picks the highest weighted total", () => {
  const { best } = selectBest([rep("a", 88), rep("b", 94), rep("c", 90)], quality);
  assert.equal(best!.candidateId, "b");
});

test("passes only at/above threshold with no flags", () => {
  assert.equal(selectBest([rep("a", 94)], quality).passes, true);
  assert.equal(selectBest([rep("a", 91.9)], quality).passes, false);
});

test("a critical flag fails an otherwise-high candidate", () => {
  assert.equal(selectBest([rep("a", 99, ["critical:prohibitedAbsence"])], quality).passes, false);
});

test("empty candidate set does not pass", () => {
  const s = selectBest([], quality);
  assert.equal(s.passes, false);
  assert.equal(s.best, undefined);
});
