import { describe, it, expect, vi } from "vitest";
import { partyOf, currentGate, blocking, gateProgress, itemActions, milestoneView, nextStep, loadTransactions, confirmSigning, evidenceItem, type TransactionRecord, type TxnItem } from "./transactions";
import { sampleClosedTransaction } from "./documents/sample-pack";

const remoteWith = (respond: (url: string, init?: RequestInit) => Response) => {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => { calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null }); return respond(String(url), init); });
  return { calls, remote: { url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl: fetchImpl as unknown as typeof fetch } };
};
const OFFER = { id: "off-a", createdAt: "t", status: "accepted" as const, amountUsd: 50_000_000, terms: { escrowPct: 0.1, cashPct: 1 } };
/** The sample record rewound to negotiation: signing items as given, no confirmations. */
const negotiating = (items: Array<Partial<TxnItem>>): TransactionRecord => {
  const r = sampleClosedTransaction(OFFER);
  const base = r.items[0]!;
  return { ...r, txn: { ...r.txn, state: "negotiating", signed_at: null, closed_at: null }, confirmations: [],
    items: items.map((x, n) => ({ ...base, id: `i${n}`, gate: "signing", status: "open", evidence: null, evidenced_by: null, confirmed_by: null, waiver_requested_by: null, ...x })) };
};

describe("transaction record client", () => {
  it("knows the caller's side only from the account ids the server returned", () => {
    const t = { seller_account_id: "s", buyer_account_id: "b" };
    expect(partyOf(t, "s")).toBe("seller"); expect(partyOf(t, "b")).toBe("buyer"); expect(partyOf(t, "x")).toBeNull();
    expect(currentGate("negotiating")).toBe("signing"); expect(currentGate("signed")).toBe("closing");
    expect(currentGate("closed")).toBeNull(); expect(currentGate("terminated")).toBeNull();
  });
  it("only satisfied or waived required conditions stop blocking; an optional one never blocks", () => {
    const r = negotiating([{ status: "satisfied" }, { status: "waived" }, { status: "evidenced" }, { status: "open", required: false }]);
    expect(blocking(r.items, "signing").map((i) => i.id)).toEqual(["i2"]);
    expect(gateProgress(r.items, "signing")).toEqual({ total: 4, done: 2, evidenced: 1, open: 1 });
  });
  it("offers each party only what the server allows: the owner evidences, the other party reviews, a waiver needs both", () => {
    const sellerItem = negotiating([{ owner_party: "seller" }]).items[0]!;
    expect(itemActions(sellerItem, "seller", "acct-seller", "negotiating").evidence).toBe(true);
    expect(itemActions(sellerItem, "buyer", "acct-buyer", "negotiating").evidence).toBe(false);
    const evidenced = { ...sellerItem, status: "evidenced" as const, evidenced_by: "acct-seller" };
    expect(itemActions(evidenced, "seller", "acct-seller", "negotiating").review).toBe(false);
    expect(itemActions(evidenced, "buyer", "acct-buyer", "negotiating").review).toBe(true);
    const asked = { ...sellerItem, waiver_requested_by: "acct-buyer" };
    expect(itemActions(asked, "buyer", "acct-buyer", "negotiating").waive).toBe("asked");
    expect(itemActions(asked, "seller", "acct-seller", "negotiating").waive).toBe("agree");
    expect(itemActions(sellerItem, "seller", "acct-seller", "signed").evidence).toBe(false);   // signing items freeze at signing
    expect(itemActions(sellerItem, "seller", "acct-seller", "terminated")).toEqual({ evidence: false, review: false, waive: null });
  });
  it("shows a disagreement between the two confirmations instead of a state change", () => {
    const r = negotiating([{ status: "satisfied" }]);
    const conf = (party: "seller" | "buyer", h: string) => ({ transaction_id: r.txn.id, milestone: "signing" as const, party, account_id: party, confirmed_at: "2026-10-28T00:00:00Z",
      evidence: { signatoryName: party, documentSha256: h, amountUsd: "", reference: "" } });
    const mismatched = { ...r, confirmations: [conf("seller", "a".repeat(64)), conf("buyer", "b".repeat(64))] };
    expect(milestoneView(mismatched, "signing", "seller").mismatch).toMatch(/different agreement documents/);
    expect(nextStep(mismatched, "seller")).toMatch(/different agreement documents/);
    expect(nextStep({ ...r, confirmations: [conf("seller", "a".repeat(64))] }, "seller")).toMatch(/waiting for the buyer/);
    expect(nextStep(negotiating([{ status: "open" }]), "buyer")).toMatch(/1 required signing condition still open/);
  });
  it("describes a closed transaction by its open post-closing obligations", () => {
    expect(nextStep(sampleClosedTransaction(OFFER), "seller")).toBe("Closed. 4 post-closing obligations still open.");
  });
  it("reads the parties' rows and acts only through the checked server functions, surfacing refusals", async () => {
    const { calls, remote } = remoteWith((url) => new Response(JSON.stringify(url.includes("exitos_transactions?") ? [{ id: "t1", price_usd: "5000000" }] : []), { status: 200 }));
    const recs = await loadTransactions(remote);
    expect(recs[0]!.txn.price_usd).toBe(5_000_000);
    expect(calls.map((c) => c.url)).toEqual(expect.arrayContaining([expect.stringContaining("exitos_transaction_items?transaction_id=in.(t1)")]));
    const rpc = remoteWith(() => new Response(JSON.stringify("negotiating"), { status: 200 }));
    await confirmSigning("t1", { signatoryName: "Sam", documentSha256: "a".repeat(64) }, rpc.remote);
    expect(rpc.calls[0]).toMatchObject({ url: "https://x.supabase.co/rest/v1/rpc/exitos_txn_confirm_milestone", body: { p_txn: "t1", p_milestone: "signing" } });
    const refused = remoteWith(() => new Response(JSON.stringify({ message: "this item is the buyer's to evidence" }), { status: 400 }));
    await expect(evidenceItem("i1", { description: "x" }, refused.remote)).rejects.toThrow("the buyer's to evidence");
  });
});
