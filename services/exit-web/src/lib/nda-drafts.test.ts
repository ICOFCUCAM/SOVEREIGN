import { describe, it, expect } from "vitest";
import { issueNda, STANDARD_TEMPLATES } from "@exit/engines";
import { signNda, partiesToSign, founderParty } from "./nda-drafts";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake";

const mine = buildProfile({ ...SAMPLE_INTAKE, name: "Northwind Freight" });
const draft = (templateId: string) => issueNda({ templateId, listingId: "l-1", disclosing: founderParty(mine), receiving: { id: "b-1", name: "Acme Corp" } });

describe("NDA signing", () => {
  it("names the founder's own company as the disclosing party", () => {
    expect(founderParty(mine).name).toBe("Northwind Freight");
  });

  it("becomes active only once both parties' signatures are recorded", () => {
    const bilateral = STANDARD_TEMPLATES.find((t) => !t.id.includes("oneway"))!;
    let nda = draft(bilateral.id);
    expect(nda.state).toBe("pending_signature");
    expect(partiesToSign(nda)).toEqual(["disclosing", "receiving"]);
    nda = signNda(nda, "receiving", "Jo Buyer");
    expect(nda.state).toBe("pending_signature");
    expect(partiesToSign(nda)).toEqual(["disclosing"]);
    nda = signNda(nda, "disclosing", "Sam Founder");
    expect(nda.state).toBe("active");
    expect(nda.executedAt).toBeTruthy();
    expect(partiesToSign(nda)).toEqual([]);
  });

  it("refuses an unnamed signatory and a second signature for the same party", () => {
    const nda = draft(STANDARD_TEMPLATES[0].id);
    expect(() => signNda(nda, "receiving", "  ")).toThrow(/Name the person/);
    const once = signNda(nda, "receiving", "Jo Buyer");
    expect(() => signNda(once, "receiving", "Jo Again")).toThrow();
  });
});
