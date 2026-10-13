import { describe, it, expect } from "vitest";
import { buildProfile, SAMPLE_INTAKE } from "../company-intake";
import { spaBrief, fundsFlow, bringDownDraft, conditionsRegister, postClosingRegister, announcementDraft } from "./closing-docs";
import { sampleClosedTransaction } from "./sample-pack";
import type { TransactionRecord } from "../transactions";

const company = { ...buildProfile({ ...SAMPLE_INTAKE, name: "Harrow Labs" }), id: "co-x" };
const OFFER = { id: "o", createdAt: "t", status: "accepted" as const, amountUsd: 40_000_000, terms: { cashPct: 0.9, escrowPct: 0.1, escrowMonths: 12 } };
const closed = sampleClosedTransaction(OFFER);
const at = (state: TransactionRecord["txn"]["state"]): TransactionRecord =>
  ({ ...closed, txn: { ...closed.txn, state, closed_at: state === "closed" ? closed.txn.closed_at : null, signed_at: state === "negotiating" ? null : closed.txn.signed_at },
     confirmations: state === "closed" ? closed.confirmations : closed.confirmations.filter((c) => c.milestone === "signing") });
const text = (d: { sections: ReadonlyArray<{ body?: string; bullets?: readonly string[]; table?: { rows: ReadonlyArray<readonly string[]> } }> }): string =>
  d.sections.map((s) => [s.body ?? "", ...(s.bullets ?? []), ...(s.table?.rows.flat() ?? [])].join(" ")).join(" ");

describe("closing documents state only what the transaction record holds", () => {
  it("the funds flow splits the accepted price and leaves the adjustments and an unconfirmed completion as gaps", () => {
    const open = fundsFlow({ company, record: at("signed"), buyerLabel: "Kestrel" });
    expect(text(open)).toContain("$32.0M");                       // 90% cash share less the 10% escrow, of $40.0M (as the IOI record computes it)
    expect(text(open)).toMatch(/Not yet supplied: completion has not been confirmed by both parties/);
    expect(open.coverage.find((c) => c.section === "Adjustments at completion")!.status).toBe("gap");
    const done = fundsFlow({ company, record: at("closed"), buyerLabel: "Kestrel" });
    expect(text(done)).toContain("CHAPS 04NOV-7731");
    expect(text(done)).toMatch(/differs from the cash at completion/);   // the sample paid $86.2M against a $32.0M split
  });
  it("draft instruments exist only once the record reaches their stage", () => {
    expect(() => bringDownDraft({ company, record: at("negotiating"), buyerLabel: "Kestrel" })).toThrow(/has not been signed/);
    expect(() => postClosingRegister({ company, record: at("signed"), buyerLabel: "Kestrel" })).toThrow(/has not closed/);
    expect(() => announcementDraft({ company, record: at("signed"), buyerLabel: "Kestrel" })).toThrow(/has not closed/);
    expect(() => announcementDraft({ company, record: closed, buyerLabel: "Bidder A" })).toThrow(/Name the buyer/);
    expect(text(announcementDraft({ company, record: closed, buyerLabel: "Kestrel" }))).not.toMatch(/\$\d/);   // no price
  });
  it("conditions read as the record has them: a waiver says it was waived and why; evidence is the party's own words", () => {
    const t = text(conditionsRegister({ company, record: closed, buyerLabel: "Kestrel" }));
    expect(t).toContain("Waived: Counsel advised that no clearance applies / agreed");
    expect(t).toContain("Satisfied (confirmed by the other party)");
    expect(text(spaBrief({ company, record: closed, buyerLabel: "Kestrel" }))).toMatch(/not yet supplied: the buyer's legal entity/);
  });
  it("every closing document states its basis: the record, no funds held, no legal check", () => {
    for (const d of [spaBrief, fundsFlow, conditionsRegister, postClosingRegister].map((f) => f({ company, record: closed, buyerLabel: "Kestrel" })))
      expect(d.notices?.[0]).toMatch(/holds no funds and checks no bank or legal record/);
  });
});
