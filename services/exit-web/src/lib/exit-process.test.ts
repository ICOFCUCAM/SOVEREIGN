import { describe, it, expect, beforeEach } from "vitest";
import { runExitProcess } from "./exit-process";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake";

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

describe("the one-click exit run", () => {
  it("runs on the company it is given, not the demo company", async () => {
    const mine = buildProfile({ ...SAMPLE_INTAKE, name: "Northwind Freight" });
    const run = await runExitProcess({ company: mine, fastMode: true });
    expect(run.steps.find((s) => s.id === "profile")?.summary).toMatch(/^Northwind Freight/);
    expect(run.artifacts.cim?.title ?? "").not.toContain(SAMPLE_INTAKE.name);
    expect(run.steps.find((s) => s.id === "data_room")?.summary).not.toMatch(/Provisioned/);
  });
});
