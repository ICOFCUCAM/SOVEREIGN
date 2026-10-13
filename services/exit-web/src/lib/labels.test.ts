import { describe, expect, it } from "vitest";
import { label, labels } from "./labels";

describe("labels", () => {
  it("spells out known codes", () => {
    expect(labels(["strategic", "pe", "vc"])).toBe("Strategic · PE · VC");
    expect(label("private_full")).toBe("Private · full detail");
    expect(label("seed_acquisition")).toBe("Seed acquisition");
  });
  it("sentence-cases anything else", () => { expect(label("logistics_freight")).toBe("Logistics freight"); });
});
