import { describe, expect, it } from "vitest";
import { NUMERIC_FIELDS, parseField, formatField, textsFor } from "./intake-fields.js";
import { SAMPLE_INTAKE } from "./company-intake.js";

const f = (k: string) => NUMERIC_FIELDS.find((x) => x.key === k)!;

describe("intake number fields", () => {
  it("keeps decimals: 12.5 ($M) is $12.5M, not $125M", () => {
    expect(parseField(f("ttmRevenueUsd"), "12.5")).toEqual({ ok: true, value: 12_500_000 });
    expect(parseField(f("ttmRevenueUsd"), ".5")).toEqual({ ok: true, value: 500_000 });
    expect(parseField(f("ttmRevenueUsd"), "1,200")).toEqual({ ok: true, value: 1_200_000_000 });
  });
  it("accepts negatives where meaningful and refuses them elsewhere", () => {
    expect(parseField(f("growthPct"), "-50")).toEqual({ ok: true, value: -0.5 });
    expect(parseField(f("ebitdaMarginPct"), "-12.5")).toEqual({ ok: true, value: -0.125 });
    expect(parseField(f("ttmRevenueUsd"), "-1")).toMatchObject({ ok: false, error: "Cannot be negative." });
  });
  it("rejects empty, non-numeric, out-of-range and fractional counts", () => {
    expect(parseField(f("arrUsd"), "")).toMatchObject({ ok: false });
    expect(parseField(f("arrUsd"), "12a")).toMatchObject({ ok: false });
    expect(parseField(f("grossMarginPct"), "150")).toMatchObject({ ok: false, error: "Must be at most 100." });
    expect(parseField(f("totalCustomers"), "10.5")).toMatchObject({ ok: false, error: "Enter a whole number." });
  });
  it("formats stored values without float noise and round-trips", () => {
    expect(formatField(f("growthPct"), 0.45)).toBe("45");
    expect(formatField(f("netRetentionPct"), 1.15)).toBe("115");
    const texts = textsFor(SAMPLE_INTAKE);
    for (const spec of NUMERIC_FIELDS) {
      const r = parseField(spec, texts[spec.key]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value).toBeCloseTo(SAMPLE_INTAKE[spec.key], 6);
    }
  });
});
