import { itemActions, type TransactionRecord, type TxnParty } from "./transactions";
import type { NdaStatus, OfferStatus } from "./exit-api";

// ── WAITING FOR YOU ─────────────────────────────────────────────────
// What a seller must act on now, from the records themselves: NDA requests to answer, offers to respond to,
// and transaction conditions to evidence or confirm. Read only; every action happens on its own page, where
// the server decides.

export interface WaitingItem { readonly key: string; readonly count: number; readonly label: string; readonly to: string }

const n = (k: number, one: string, many: string): string => `${k} ${k === 1 ? one : many}`;

export function sellerWaiting(input: {
  readonly ndaRequests: ReadonlyArray<{ status: NdaStatus }>;
  readonly offers: ReadonlyArray<{ status: OfferStatus }>;
  readonly txns: readonly TransactionRecord[];
  readonly me: string | undefined;
}): WaitingItem[] {
  const out: WaitingItem[] = [];
  const ndas = input.ndaRequests.filter((r) => r.status === "requested").length;
  if (ndas) out.push({ key: "nda", count: ndas, label: `${n(ndas, "NDA request", "NDA requests")} to answer`, to: "/console/inbox" });
  const offers = input.offers.filter((o) => o.status === "submitted").length;
  if (offers) out.push({ key: "offer", count: offers, label: `${n(offers, "offer", "offers")} to respond to`, to: "/console/inbox" });
  const party: TxnParty = "seller";
  let evidence = 0, review = 0;
  for (const r of input.txns) {
    const t = r.txn;
    if (!input.me || t.seller_account_id !== input.me || (t.state !== "negotiating" && t.state !== "signed")) continue;
    for (const i of r.items) {
      const a = itemActions(i, party, input.me, t.state);
      if (a.review) review++;
      else if (a.evidence && i.required && i.status === "open") evidence++;
    }
  }
  if (evidence) out.push({ key: "evidence", count: evidence, label: `${n(evidence, "deal condition", "deal conditions")} to evidence`, to: "/console/deals" });
  if (review) out.push({ key: "review", count: review, label: `${n(review, "piece of evidence", "pieces of evidence")} from the buyer to confirm`, to: "/console/deals" });
  return out;
}
