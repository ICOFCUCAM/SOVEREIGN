import type { Remote } from "./documents/store";
import type { OfferTerms } from "./documents/transaction-docs";

// ── TRANSACTION RECORD (client) ─────────────────────────────────────
// Thin wrappers over the server functions in 20261014140000_exitos_transactions.sql.
// Nothing here decides a state. Opening a transaction, evidencing and confirming a condition,
// waiving one, confirming signing or completion and terminating are all checked by the database
// as the signed-in account; the helpers below only describe what the server returned.

export type TxnState = "negotiating" | "signed" | "closed" | "terminated";
export type Gate = "signing" | "closing" | "post_closing";
export type OwnerParty = "seller" | "buyer" | "both";
export type ItemStatus = "open" | "evidenced" | "satisfied" | "waived";
export type TxnParty = "seller" | "buyer";

export interface Transaction {
  id: string; listing_id: string; company_id: string; seller_account_id: string; buyer_account_id: string;
  offer_id: string; nda_agreement_id: string; price_usd: number; terms: OfferTerms; state: TxnState;
  created_at: string; signed_at: string | null; closed_at: string | null; ended_at: string | null; ended_by: string | null; end_reason: string | null;
}
export interface ItemEvidence { description: string; documentName?: string; documentSha256?: string; party?: TxnParty; [k: string]: unknown }
export interface TxnItem {
  id: string; transaction_id: string; gate: Gate; title: string; owner_party: OwnerParty; required: boolean; due_date: string | null;
  source: "standard" | "added" | "from_terms"; status: ItemStatus; evidence: ItemEvidence | null; evidenced_by: string | null; evidenced_at: string | null;
  confirmed_by: string | null; confirmed_at: string | null; waiver_requested_by: string | null; note: string | null; created_by: string | null; created_at: string;
}
export interface SigningEvidence { signatoryName: string; documentSha256: string; documentName?: string }
export interface ClosingEvidence { amountUsd: string; reference: string; paidOn?: string }
export interface TxnConfirmation { transaction_id: string; milestone: "signing" | "closing"; party: TxnParty; account_id: string; evidence: SigningEvidence & ClosingEvidence; confirmed_at: string }
export interface TxnEvent { id: number; transaction_id: string; at: string; actor: string | null; action: string; details: Record<string, unknown> }

export interface TransactionRecord { txn: Transaction; items: TxnItem[]; confirmations: TxnConfirmation[]; events: TxnEvent[] }

// ── what the record says (pure) ─────────────────────────────────────

/** The caller's side of the transaction, from the account ids the server returned. */
export function partyOf(t: Pick<Transaction, "seller_account_id" | "buyer_account_id">, me: string): TxnParty | null {
  return t.seller_account_id === me ? "seller" : t.buyer_account_id === me ? "buyer" : null;
}
export const other = (p: TxnParty): TxnParty => (p === "seller" ? "buyer" : "seller");

/** The milestone the transaction is working towards now, if any. */
export function currentGate(state: TxnState): "signing" | "closing" | null {
  return state === "negotiating" ? "signing" : state === "signed" ? "closing" : null;
}

/** Required items of a gate that still stop the milestone (not satisfied, not waived). */
export function blocking(items: readonly TxnItem[], gate: Gate): TxnItem[] {
  return items.filter((i) => i.gate === gate && i.required && i.status !== "satisfied" && i.status !== "waived");
}

export interface GateProgress { total: number; done: number; evidenced: number; open: number }
export function gateProgress(items: readonly TxnItem[], gate: Gate): GateProgress {
  const g = items.filter((i) => i.gate === gate);
  return {
    total: g.length, done: g.filter((i) => i.status === "satisfied" || i.status === "waived").length,
    evidenced: g.filter((i) => i.status === "evidenced").length, open: g.filter((i) => i.status === "open").length,
  };
}

/** What the signed-in party can do on one item, mirroring the server's rules (the server still decides). */
export function itemActions(i: TxnItem, party: TxnParty, me: string, state: TxnState): { evidence: boolean; review: boolean; waive: "ask" | "agree" | "asked" | null } {
  const live = state !== "terminated" && !(i.gate === "signing" && state !== "negotiating") && !(i.gate === "closing" && state === "closed");
  const finished = i.status === "satisfied" || i.status === "waived";
  return {
    evidence: live && !finished && (i.owner_party === "both" || i.owner_party === party),
    review: state !== "terminated" && i.status === "evidenced" && i.evidenced_by !== me,
    waive: state === "terminated" || finished ? null : i.waiver_requested_by == null ? "ask" : i.waiver_requested_by === me ? "asked" : "agree",
  };
}

export type MilestoneView = { mine: TxnConfirmation | null; theirs: TxnConfirmation | null; mismatch: string | null; blockedBy: number };
/** Both parties' confirmations of a milestone, and whether they disagree. */
export function milestoneView(r: TransactionRecord, milestone: "signing" | "closing", party: TxnParty): MilestoneView {
  const c = (p: TxnParty): TxnConfirmation | null => r.confirmations.find((x) => x.milestone === milestone && x.party === p) ?? null;
  const mine = c(party), theirs = c(other(party));
  let mismatch: string | null = null;
  if (mine && theirs) {
    if (milestone === "signing" && mine.evidence.documentSha256 !== theirs.evidence.documentSha256) mismatch = "The two confirmations name different agreement documents (their SHA-256 differ). Agree which document was signed and confirm again.";
    if (milestone === "closing" && Number(mine.evidence.amountUsd) !== Number(theirs.evidence.amountUsd)) mismatch = `The two confirmations state different amounts ($${Number(mine.evidence.amountUsd).toLocaleString("en-US")} and $${Number(theirs.evidence.amountUsd).toLocaleString("en-US")}). Reconcile the funds flow and confirm again.`;
  }
  return { mine, theirs, mismatch, blockedBy: blocking(r.items, milestone).length };
}

/** One line on where the transaction stands and what it waits for. */
export function nextStep(r: TransactionRecord, party: TxnParty): string {
  const s = r.txn.state;
  if (s === "terminated") return `Terminated${r.txn.end_reason ? `: ${r.txn.end_reason}` : ""}. The buyer's data-room access under this transaction has ended.`;
  if (s === "closed") {
    const open = r.items.filter((i) => i.gate === "post_closing" && i.status !== "satisfied" && i.status !== "waived").length;
    return open ? `Closed. ${open} post-closing obligation${open === 1 ? "" : "s"} still open.` : "Closed. Every post-closing obligation is satisfied or waived.";
  }
  const gate = currentGate(s)!;
  const v = milestoneView(r, gate, party);
  const word = gate === "signing" ? "signing" : "completion";
  if (v.blockedBy) return `${v.blockedBy} required ${gate} condition${v.blockedBy === 1 ? "" : "s"} still open before ${word} can be recorded.`;
  if (v.mismatch) return v.mismatch;
  if (!v.mine) return `Every ${gate} condition is met. Confirm ${word} with your evidence.`;
  if (!v.theirs) return `You confirmed ${word}; waiting for the ${other(party)} to confirm.`;
  return "Both parties confirmed; refresh to see the new state.";
}

/** SHA-256 of a file's bytes, hex (the signed agreement is hashed in the browser, never uploaded). */
export async function sha256OfFile(file: Blob): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── server calls ────────────────────────────────────────────────────
const h = (r: Remote): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json" });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function json<T>(res: Response, what: string): Promise<T> {
  const body = await res.json().catch(() => null) as unknown;
  if (!res.ok) throw new Error(`${what}: ${(body as { message?: string; error?: string } | null)?.message ?? (body as { error?: string } | null)?.error ?? res.status}`);
  return body as T;
}
const rpc = async <T>(r: Remote, fn: string, args: Record<string, unknown>, what: string): Promise<T> =>
  json<T>(await f(r)(`${r.url}/rest/v1/rpc/${fn}`, { method: "POST", headers: h(r), body: JSON.stringify(args) }), what);
const rows = async <T>(r: Remote, path: string, what: string): Promise<T[]> => json<T[]>(await f(r)(`${r.url}/rest/v1/${path}`, { headers: h(r) }), what);

/** Every transaction the signed-in account is a party to (row-level security returns no others). */
export async function loadTransactions(r: Remote): Promise<TransactionRecord[]> {
  const txns = await rows<Transaction>(r, "exitos_transactions?select=*&order=created_at.desc", "Reading transactions");
  if (!txns.length) return [];
  const ids = `(${txns.map((t) => t.id).join(",")})`;
  const [items, confirmations, events] = await Promise.all([
    rows<TxnItem>(r, `exitos_transaction_items?transaction_id=in.${ids}&select=*&order=created_at.asc`, "Reading conditions"),
    rows<TxnConfirmation>(r, `exitos_transaction_confirmations?transaction_id=in.${ids}&select=*`, "Reading confirmations"),
    rows<TxnEvent>(r, `exitos_transaction_events?transaction_id=in.${ids}&select=*&order=at.asc`, "Reading the audit trail"),
  ]);
  return txns.map((txn) => ({
    txn: { ...txn, price_usd: Number(txn.price_usd) },
    items: items.filter((i) => i.transaction_id === txn.id), confirmations: confirmations.filter((c) => c.transaction_id === txn.id),
    events: events.filter((e) => e.transaction_id === txn.id),
  }));
}

export const openTransaction = (offerId: string, ndaId: string, r: Remote): Promise<string> =>
  rpc(r, "exitos_txn_create", { p_offer: offerId, p_nda: ndaId }, "Opening the transaction");
export const addItem = (txnId: string, gate: Gate, title: string, owner: OwnerParty, due: string | null, required: boolean, r: Remote): Promise<string> =>
  rpc(r, "exitos_txn_add_item", { p_txn: txnId, p_gate: gate, p_title: title, p_owner: owner, p_due: due, p_required: required }, "Adding the item");
export const evidenceItem = (itemId: string, evidence: ItemEvidence, r: Remote): Promise<void> =>
  rpc(r, "exitos_txn_evidence_item", { p_item: itemId, p_evidence: evidence }, "Recording the evidence");
export const reviewItem = (itemId: string, decision: "confirm" | "reject", note: string, r: Remote): Promise<string> =>
  rpc(r, "exitos_txn_confirm_item", { p_item: itemId, p_decision: decision, p_note: note || null }, "Reviewing the evidence");
export const waiveItem = (itemId: string, note: string, r: Remote): Promise<"requested" | "waived"> =>
  rpc(r, "exitos_txn_waive_item", { p_item: itemId, p_note: note }, "Waiving the item");
export const confirmSigning = (txnId: string, e: SigningEvidence, r: Remote): Promise<TxnState> =>
  rpc(r, "exitos_txn_confirm_milestone", { p_txn: txnId, p_milestone: "signing", p_evidence: e }, "Confirming signing");
export const confirmClosing = (txnId: string, e: ClosingEvidence, r: Remote): Promise<TxnState> =>
  rpc(r, "exitos_txn_confirm_milestone", { p_txn: txnId, p_milestone: "closing", p_evidence: e }, "Confirming completion");
export const terminateTransaction = (txnId: string, reason: string, r: Remote): Promise<void> =>
  rpc(r, "exitos_txn_terminate", { p_txn: txnId, p_reason: reason }, "Terminating the transaction");
