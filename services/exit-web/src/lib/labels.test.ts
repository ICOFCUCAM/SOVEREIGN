import { describe, expect, it } from "vitest";
import { inlineLabel, label, labels } from "./labels";

describe("labels", () => {
  it("spells out known codes", () => {
    expect(labels(["strategic", "pe", "vc"])).toBe("Strategic · PE · VC");
    expect(label("private_full")).toBe("Private · full detail");
    expect(label("seed_acquisition")).toBe("Seed acquisition");
  });
  it("sets codes inside a sentence", () => { expect(inlineLabel("pe")).toBe("PE"); expect(inlineLabel("family_office")).toBe("family office"); });
  it("sentence-cases anything else", () => { expect(label("logistics_freight")).toBe("Logistics freight"); });
});
