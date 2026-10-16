import { describe, it, expect } from "vitest";
import { sellerWaiting } from "./waiting.js";
import type { TransactionRecord, TxnItem, TxnState } from "./transactions.js";

const item = (o: Partial<TxnItem>): TxnItem => ({
  id: Math.random().toString(36).slice(2), transaction_id: "t1", gate: "signing", title: "x", owner_party: "seller", required: true, due_date: null,
  source: "standard", status: "open", evidence: null, evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null,
  waiver_requested_by: null, note: null, created_by: null, created_at: "2026-10-16T00:00:00Z", ...o,
});
const txn = (state: TxnState, seller: string, items: TxnItem[]): TransactionRecord => ({
  txn: { id: "t1", listing_id: "l", company_id: "c", seller_account_id: seller, buyer_account_id: "buyer", offer_id: "o", nda_agreement_id: "n", price_usd: 1, terms: {} as never, state,
    created_at: "", signed_at: null, closed_at: null, ended_at: null, ended_by: null, end_reason: null },
  items, confirmations: [], events: [],
});

describe("what is waiting for the seller", () => {
  it("counts NDA requests to answer and offers to respond to, and nothing already resolved", () => {
    const w = sellerWaiting({ ndaRequests: [{ status: "requested" }, { status: "signed" }, { status: "requested" }], offers: [{ status: "submitted" }, { status: "accepted" }], txns: [], me: "me" });
    expect(w.map((x) => x.label)).toEqual(["2 NDA requests to answer", "1 offer to respond to"]);
  });
  it("counts the seller's open required conditions and the buyer's evidence to confirm, in live deals only", () => {
    const live = txn("negotiating", "me", [
      item({}), item({ required: false }), item({ owner_party: "buyer" }),
      item({ owner_party: "buyer", status: "evidenced", evidenced_by: "buyer" }), item({ status: "satisfied" }),
    ]);
    const w = sellerWaiting({ ndaRequests: [], offers: [], txns: [live, txn("closed", "me", [item({ gate: "closing" })]), txn("negotiating", "someone-else", [item({})])], me: "me" });
    expect(w.map((x) => x.label)).toEqual(["1 deal condition to evidence", "1 piece of evidence from the buyer to confirm"]);
  });
  it("is empty when nothing waits", () => {
    expect(sellerWaiting({ ndaRequests: [], offers: [], txns: [], me: undefined })).toEqual([]);
  });
});
