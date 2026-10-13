import { describe, it, expect, beforeEach } from "vitest";
import { loadPositions, savePositions, cleanPositions } from "./negotiation-positions";

beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
});

describe("negotiating positions", () => {
  it("have no defaults: an unknown company or a fresh one has none set", () => {
    expect(loadPositions(null).values).toEqual({});
    expect(loadPositions("co-x").values).toEqual({});
    expect(loadPositions("co-x").reviewedBy).toBe("nobody");
  });
  it("keep only what the seller set; empty is unset, not zero; percentages are fractions", () => {
    expect(cleanPositions({ headlineUsd: "118000000", minCashPct: "0.8", maxEscrowPct: "", maxIndemnityCapPct: "15", reverseBreakFeePct: "-1" })).toEqual({ headlineUsd: 118_000_000, minCashPct: 0.8 });
  });
  it("persist per company with who reviewed them", () => {
    savePositions("co-a", { maxExclusivityDays: 45 }, "founder");
    expect(loadPositions("co-a")).toMatchObject({ values: { maxExclusivityDays: 45 }, reviewedBy: "founder" });
    expect(loadPositions("co-b").values).toEqual({});
  });
});
