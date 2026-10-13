import { describe, expect, it, beforeEach } from "vitest";
import { loadActiveCompany, activeTokens } from "./active-company.js";
import { SAMPLE_COMPANY } from "./profile.js";
import { SAMPLE_INTAKE as SAMPLE_COMPANY_INTAKE } from "./company-intake.js";

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

describe("saved intake", () => {
  it("nothing is saved until the founder saves; clearing returns to the demo", async () => {
    const { loadSavedIntake, saveIntake, clearIntake } = await import("./active-company.js");
    const { SAMPLE_INTAKE } = await import("./company-intake.js");
    expect(loadSavedIntake()).toBeNull();
    expect(loadActiveCompany().fromIntake).toBe(false);
    saveIntake({ ...SAMPLE_INTAKE, name: "Acme AI" });
    expect(loadSavedIntake()?.name).toBe("Acme AI");
    expect(loadActiveCompany()).toMatchObject({ fromIntake: true, company: { name: "Acme AI" } });
    clearIntake();
    expect(loadSavedIntake()).toBeNull();
    expect(loadActiveCompany().fromIntake).toBe(false);
  });
});

describe("what the founder supplied vs the demo company's values", () => {
  it("a field counts as the founder's only once entered or confirmed", async () => {
    const { saveIntake, loadActiveCompany: load, confirmIntakeFields } = await import("./active-company.js");
    const { SAMPLE_INTAKE } = await import("./company-intake.js");
    // the form starts from the demo figures; the founder types only the name
    saveIntake({ ...SAMPLE_INTAKE, name: "Northwind" }, ["name"]);
    const a = load();
    expect(a.company.name).toBe("Northwind");
    expect(a.unconfirmed).toContain("ttmRevenueUsd");
    expect(a.unconfirmed).not.toContain("name");
    // then enters revenue
    saveIntake({ ...SAMPLE_INTAKE, name: "Northwind", ttmRevenueUsd: 12e6 }, ["ttmRevenueUsd"]);
    expect(load().unconfirmed).not.toContain("ttmRevenueUsd");
    expect(load().unconfirmed).not.toContain("name");          // earlier fields stay supplied
    confirmIntakeFields(load().unconfirmed);
    expect(load().unconfirmed).toEqual([]);
  });

  it("gives each saved company its own stable id", async () => {
    const { saveIntake, loadActiveCompany: load, clearIntake } = await import("./active-company.js");
    const { SAMPLE_INTAKE } = await import("./company-intake.js");
    saveIntake({ ...SAMPLE_INTAKE, name: "One" }, ["name"]);
    const id1 = load().company.id;
    saveIntake({ ...SAMPLE_INTAKE, name: "One Inc" }, ["name"]);
    expect(load().company.id).toBe(id1);
    expect(id1).toMatch(/^co-/);
    expect(id1).not.toBe("intake");
    clearIntake();
    saveIntake({ ...SAMPLE_INTAKE, name: "Two" }, ["name"]);
    expect(load().company.id).not.toBe(id1);
  });

  it("migrates an earlier saved intake: only values that differ from the demo count as supplied", () => {
    localStorage.setItem("exitos.intake.v1", JSON.stringify({ ...JSON.parse(JSON.stringify(SAMPLE_COMPANY_INTAKE)), name: "Legacy Co", ttmRevenueUsd: 9e6 }));
    const a = loadActiveCompany();
    expect(a.company.name).toBe("Legacy Co");
    expect(a.unconfirmed).not.toContain("name");
    expect(a.unconfirmed).not.toContain("ttmRevenueUsd");
    expect(a.unconfirmed).toContain("grossMarginPct");
    expect(localStorage.getItem("exitos.intake.v1")).toBeNull();
    expect(loadActiveCompany().company.id).toBe(a.company.id);   // migrated once, id kept
  });
});
