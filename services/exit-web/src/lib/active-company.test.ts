import { describe, expect, it, beforeEach } from "vitest";
import { loadActiveCompany, activeTokens } from "./active-company.js";
import { SAMPLE_COMPANY } from "./profile.js";

// in-memory localStorage shim (the test env is node, not jsdom)
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
});

describe("active company", () => {
  it("defaults to the demo company when the founder has not run intake", () => {
    const { company, fromIntake } = loadActiveCompany();
    expect(fromIntake).toBe(false);
    expect(company.name).toBe(SAMPLE_COMPANY.name);
  });

  it("uses the founder's intake company when present, and derives its sector tokens", () => {
    localStorage.setItem("exitos.intake.v1", JSON.stringify({ name: "Acme AI", sector: "ai_infra", ttmRevenueUsd: 50_000_000 }));
    const { company, fromIntake } = loadActiveCompany();
    expect(fromIntake).toBe(true);
    expect(company.name).toBe("Acme AI");
    expect(company.sector).toBe("ai_infra");
    const tokens = activeTokens(company);
    expect(tokens.some((t) => /intelligence|machine learning|infrastructure/.test(t))).toBe(true);
  });
});
