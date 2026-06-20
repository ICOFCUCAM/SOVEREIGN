import { describe, it, expect } from "vitest";
import { ingramGutterMm, ingramGutterIn, coverSpec, getTrim, TRIM_SIZES } from "./print-sizes";

describe("ingramGutterMm", () => {
  it("grows with page count across IngramSpark brackets", () => {
    expect(ingramGutterMm(40)).toBeCloseTo(12.7);    // 0.500 in
    expect(ingramGutterMm(180)).toBeCloseTo(12.7);
    expect(ingramGutterMm(181)).toBeCloseTo(15.875); // 0.625 in
    expect(ingramGutterMm(400)).toBeCloseTo(15.875);
    expect(ingramGutterMm(401)).toBeCloseTo(19.05);  // 0.750 in
    expect(ingramGutterMm(600)).toBeCloseTo(19.05);
    expect(ingramGutterMm(601)).toBeCloseTo(22.225); // 0.875 in
  });
  it("is monotonic and reported in inches", () => {
    expect(ingramGutterIn(40)).toBeCloseTo(0.5, 3);
    expect(ingramGutterIn(700)).toBeGreaterThan(ingramGutterIn(40));
  });
});

describe("coverSpec", () => {
  it("adds bleed on both height edges and a spine between two trim widths", () => {
    const trim = getTrim("6x9");
    const spec = coverSpec(trim, 200, "White");
    expect(spec.spineMm).toBeGreaterThan(0);
    // full width = 2*bleed + 2*trim width + spine
    expect(spec.fullWmm).toBeCloseTo(3.175 * 2 + trim.wmm * 2 + spec.spineMm);
    expect(spec.fullHmm).toBeCloseTo(trim.hmm + 3.175 * 2);
  });
  it("has a thicker spine for more pages", () => {
    const trim = getTrim("6x9");
    expect(coverSpec(trim, 400, "White").spineMm).toBeGreaterThan(coverSpec(trim, 100, "White").spineMm);
  });
});

describe("TRIM_SIZES", () => {
  it("includes the common IngramSpark 5.5 x 8.5 trim", () => {
    const t = TRIM_SIZES.find((s) => s.id === "5.5x8.5");
    expect(t).toBeDefined();
    expect(t!.wmm).toBeCloseTo(139.7);
    expect(t!.hmm).toBeCloseTo(215.9);
  });
});
