import { describe, it, expect } from "vitest";
import { revenueBand, growthBand, bandOverlaps } from "./bands";

describe("pre-NDA bands", () => {
  it("brackets revenue", () => {
    expect(revenueBand(3e6).label).toBe("under $5M");
    expect(revenueBand(12e6).label).toBe("$10–25M");
    expect(revenueBand(25e6).label).toBe("$25–50M");
    expect(revenueBand(180e6).label).toBe("$100–250M");
    expect(revenueBand(900e6)).toMatchObject({ low: 250e6, high: null, label: "over $250M" });
  });
  it("brackets growth", () => {
    expect(growthBand(-0.05).label).toBe("declining");
    expect(growthBand(0.32).label).toBe("25–50%");
    expect(growthBand(0.8).label).toBe("over 50%");
  });
  it("tests overlap with a range", () => {
    const b = revenueBand(12e6);              // 10–25M
    expect(bandOverlaps(b, 20e6, 60e6)).toBe(true);
    expect(bandOverlaps(b, 25e6, 60e6)).toBe(false);
    expect(bandOverlaps(growthBand(0.8), 0.2)).toBe(true);
  });
});
