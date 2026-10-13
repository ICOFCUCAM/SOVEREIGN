import { describe, it, expect } from "vitest";
import { capabilityOf, CAPABILITY_LABEL } from "./capability";
import { documentType, DOCUMENT_TYPES } from "./registry";
import type { GateResult } from "./gate";

const gate = (over: Partial<GateResult> = {}): GateResult => ({ type: documentType("exitos.cim"), unconfirmed: [], disclosure: [], blocked: false, ...over });

describe("capabilityOf", () => {
  it("never reports a document ExitOS does not build as available", () => {
    for (const t of DOCUMENT_TYPES.filter((d) => d.status === "not_built" || d.status === "dead_code")) {
      expect(capabilityOf(t, gate(), "approved")).toBe("not_built");
    }
  });
  it("counsel and requested documents are external", () => {
    const nda = documentType("exitos.nda");
    if (nda.status !== "not_built") expect(capabilityOf(nda, gate(), null)).toBe("external");
  });
  it("a withheld document is blocked whatever its saved state", () => {
    expect(capabilityOf(documentType("exitos.teaser"), gate({ blocked: true }), "approved")).toBe("blocked");
  });
  it("demo inputs make it a draft that needs inputs, unless already in review", () => {
    const g = gate({ unconfirmed: ["name"] as GateResult["unconfirmed"] });
    expect(capabilityOf(documentType("exitos.cim"), g, null)).toBe("needs_inputs");
    expect(capabilityOf(documentType("exitos.cim"), g, "draft")).toBe("needs_inputs");
    expect(capabilityOf(documentType("exitos.cim"), g, "in_review")).toBe("awaiting_review");
  });
  it("follows the saved version's status", () => {
    const t = documentType("exitos.cim");
    expect(capabilityOf(t, gate(), null)).toBe("available");
    expect(capabilityOf(t, gate(), "draft")).toBe("draft");
    expect(capabilityOf(t, gate(), "counsel_review")).toBe("awaiting_review");
    expect(capabilityOf(t, gate(), "approved")).toBe("approved");
  });
  it("an approval is never labelled as execution", () => {
    expect(CAPABILITY_LABEL.approved).toMatch(/not executed/);
    expect(Object.values(CAPABILITY_LABEL).join(" ")).not.toMatch(/\bsigned\b|\bexecuted\b(?<!not executed)/i);
  });
});

describe("the demo company", () => {
  it("is labelled as sample, never as the user's document", () => {
    expect(capabilityOf(documentType("exitos.cim"), gate(), "draft", true)).toBe("sample");
    expect(capabilityOf(documentType("exitos.teaser"), gate({ blocked: true }), null, true)).toBe("blocked");
  });
});
