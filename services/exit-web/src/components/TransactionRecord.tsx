import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Section } from "./xo";
import { DocumentVersions } from "./DocumentVersions";
import { useAuth } from "../lib/auth";
import type { Remote } from "../lib/documents/store";
import { loadActiveCompany } from "../lib/active-company";
import { loadNdas, type NdaAgreement } from "../lib/nda-lifecycle";
import { gateDocument } from "../lib/documents/gate";
import { asMemorandum, toMarkdown } from "../lib/documents/transaction-doc-view";
import type { TransactionDoc } from "../lib/documents/transaction-docs";
import { spaBrief, fundsFlow, bringDownDraft, conditionsRegister, postClosingRegister, announcementDraft, type ClosingInput } from "../lib/documents/closing-docs";
import {
  loadTransactions, openTransaction, addItem, evidenceItem, reviewItem, waiveItem, confirmSigning, confirmClosing, terminateTransaction,
  partyOf, other, currentGate, gateProgress, itemActions, milestoneView, nextStep, sha256OfFile,
  type TransactionRecord, type TxnItem, type TxnParty, type Gate, type OwnerParty,
} from "../lib/transactions";

// ── TRANSACTION RECORD ──────────────────────────────────────────────
// The server-held record of one deal from the accepted offer to completion and after. Each
// condition is evidenced by the party that owns it and confirmed by the other; a waiver needs both;
// signing needs both parties to name the same agreement hash, completion the same amount, and every
// required condition met. The page offers only what the server would allow and decides nothing:
// every action is re-checked by the database as the signed-in account.

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2 py-1 text-[12px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-0.5 block text-[11px] text-xo-muted";
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const usd = (n: number): string => `$${(n / 1e6).toFixed(1)}M`;
const STATE: Record<TransactionRecord["txn"]["state"], { text: string; cls: string }> = {
  negotiating: { text: "Negotiating · working to signing", cls: "text-xo-caution" }, signed: { text: "Signed · working to completion", cls: "text-xo-action" },
  closed: { text: "Completed", cls: "text-xo-verified" }, terminated: { text: "Terminated", cls: "text-xo-faint" },
};
const ITEM: Record<TxnItem["status"], { text: string; cls: string }> = {
  open: { text: "Open", cls: "text-xo-muted" }, evidenced: { text: "Evidence recorded", cls: "text-xo-caution" },
  satisfied: { text: "Satisfied", cls: "text-xo-verified" }, waived: { text: "Waived", cls: "text-xo-faint" },
};
const OWNER: Record<OwnerParty, string> = { seller: "Seller", buyer: "Buyer", both: "Both" };
const GATE_TITLE: Record<Gate, string> = { signing: "Conditions to signing", closing: "Conditions to completion", post_closing: "Post-closing obligations" };

type Run = (what: () => Promise<unknown>, done: string) => void;
interface OfferRow { id: string; listing_id: string; buyer_account_id: string; data: { amountUsd?: number; status?: string } }

export const TransactionRecordPanel: React.FC<{ remote: Remote }> = ({ remote }) => {
  const { session } = useAuth();
  const me = session?.verified?.userId ?? "";
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [candidates, setCandidates] = useState<Array<{ offer: OfferRow; nda: NdaAgreement }>>([]);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(() => {
    void loadTransactions(remote).then((r) => { setRecords(r); setLoaded(true); }).catch((e: Error) => { setMsg(e.message); setLoaded(true); });
    // a seller can open a transaction from an accepted offer and that buyer's executed NDA on the same listing
    void (async () => {
      const h = { apikey: remote.anonKey, Authorization: `Bearer ${remote.accessToken}` };
      const mine = await (await fetch(`${remote.url}/rest/v1/exitos_listings?owner_account_id=eq.${me}&select=id`, { headers: h })).json() as Array<{ id: string }>;
      if (!Array.isArray(mine) || !mine.length) { setCandidates([]); return; }
      const offers = await (await fetch(`${remote.url}/rest/v1/exitos_offers?listing_id=in.(${mine.map((x) => x.id).join(",")})&select=id,listing_id,buyer_account_id,data`, { headers: h })).json() as OfferRow[];
      const { agreements } = await loadNdas(remote);
      const accepted = Array.isArray(offers) ? offers.filter((o) => o.data.status === "accepted") : [];
      setCandidates(accepted.flatMap((offer) => agreements
        .filter((a) => a.state === "executed" && !a.transaction_id && a.owner_account_id === me && a.listing_id === offer.listing_id && a.buyer_account_id === offer.buyer_account_id
          && (!a.access_until || new Date(a.access_until) > new Date()))
        .map((nda) => ({ offer, nda }))));
    })().catch(() => setCandidates([]));
  }, [remote, me]);
  useEffect(refresh, [refresh]);
  const run: Run = (what, done) => { setMsg(""); void what().then(() => { setMsg(done); refresh(); }).catch((e: Error) => setMsg(e.message)); };
  const live = records.filter((r) => r.txn.state !== "terminated");
  const openable = candidates.filter((c) => !records.some((r) => r.txn.listing_id === c.offer.listing_id && (r.txn.state === "negotiating" || r.txn.state === "signed")));

  return (
    <Section title="Transaction record" eyebrow="Server-enforced · both parties confirm · the other party checks the evidence" className="border border-xo-line">
      <div className="space-y-3 px-4 py-3">
        <p className="text-[12px] leading-relaxed text-xo-muted">A shared record of the deal from the accepted offer to completion and after. Each condition is evidenced by the party that owns it and confirmed by the other; a waiver needs both parties. Signing is recorded only when both parties name the same signed agreement (by its SHA-256) and every required condition is met; completion only when both state the same amount paid. ExitOS holds no funds, checks no bank or legal record and gives no legal opinion: "satisfied" means the other party confirmed the evidence.</p>
        {msg && <p role="status" className="text-[12px] text-xo-text">{msg}</p>}
        {openable.length > 0 && <OpenForm candidates={openable} run={run} remote={remote} />}
        {loaded && records.length === 0 && openable.length === 0 && (
          <p className="text-[12px] text-xo-faint">No transaction yet. The seller opens one from an offer it accepted, once that buyer's NDA is executed.</p>
        )}
        {live.map((r) => <TxnCard key={r.txn.id} r={r} me={me} run={run} remote={remote} />)}
        {records.length > live.length && (
          <details className="text-[12px]"><summary className="cursor-pointer text-xo-muted">{records.length - live.length} terminated transaction{records.length - live.length === 1 ? "" : "s"}</summary>
            {records.filter((r) => r.txn.state === "terminated").map((r) => <TxnCard key={r.txn.id} r={r} me={me} run={run} remote={remote} />)}
          </details>
        )}
      </div>
    </Section>
  );
};

const OpenForm: React.FC<{ candidates: Array<{ offer: OfferRow; nda: NdaAgreement }>; run: Run; remote: Remote }> = ({ candidates, run, remote }) => {
  const [pick, setPick] = useState(0);
  const c = candidates[pick];
  if (!c) return null;
  return (
    <form className="space-y-2 border border-xo-line bg-xo-ink p-3" onSubmit={(e) => { e.preventDefault(); run(() => openTransaction(c.offer.id, c.nda.id, remote), "Transaction opened. The standard signing and completion conditions are listed below; add any the deal needs."); }}>
      <h3 className="text-[13px] font-semibold">Open the transaction</h3>
      <p className="text-[12px] text-xo-muted">From the offer you accepted and that buyer's executed NDA. The price and terms are fixed from the offer; the buyer's data-room access then depends on the transaction staying live.</p>
      <label className="block max-w-md" htmlFor="txn-open"><span className={LABEL}>Accepted offer and NDA</span>
        <select id="txn-open" className={INPUT} value={pick} onChange={(e) => setPick(Number(e.target.value))}>
          {candidates.map((x, i) => <option key={`${x.offer.id}-${x.nda.id}`} value={i}>{usd(Number(x.offer.data.amountUsd ?? 0))} · NDA executed {x.nda.executed_at?.slice(0, 10)}</option>)}
        </select></label>
      <button type="submit" className={BTN}>Open the transaction</button>
    </form>
  );
};

const TxnCard: React.FC<{ r: TransactionRecord; me: string; run: Run; remote: Remote }> = ({ r, me, run, remote }) => {
  const party = partyOf(r.txn, me);
  if (!party) return null;
  const st = STATE[r.txn.state];
  const gate = currentGate(r.txn.state);
  const gates: Gate[] = ["signing", "closing", ...(r.txn.state === "closed" || r.items.some((i) => i.gate === "post_closing") ? ["post_closing" as const] : [])];
  return (
    <article className="space-y-3 border border-xo-line p-3" aria-label="Transaction">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold">{usd(r.txn.price_usd)} · <span className={st.cls}>{st.text}</span></h3>
          <p className="text-[11px] text-xo-faint">You are the {party} · opened {r.txn.created_at.slice(0, 10)}{r.txn.signed_at ? ` · signed ${r.txn.signed_at.slice(0, 10)}` : ""}{r.txn.closed_at ? ` · completed ${r.txn.closed_at.slice(0, 10)}` : ""}</p>
        </div>
      </header>
      <p className="border-l-2 border-xo-action pl-2 text-[13px]">{nextStep(r, party)}</p>
      {gates.map((g) => <GateTable key={g} r={r} gate={g} party={party} me={me} run={run} remote={remote} />)}
      {r.txn.state !== "terminated" && <AddItem r={r} run={run} remote={remote} />}
      {gate && <Milestone r={r} gate={gate} party={party} run={run} remote={remote} />}
      {party === "seller" && <ClosingDocuments r={r} />}
      {(r.txn.state === "negotiating" || r.txn.state === "signed") && <Terminate r={r} run={run} remote={remote} />}
      <details className="text-[12px]"><summary className="cursor-pointer text-xo-muted">Audit trail ({r.events.length})</summary>
        <ol className="mt-1 space-y-0.5 font-mono text-[11px] text-xo-faint">{r.events.map((e) => (
          <li key={e.id}>{e.at.slice(0, 16).replace("T", " ")} · {e.actor === r.txn.seller_account_id ? "seller" : e.actor === r.txn.buyer_account_id ? "buyer" : "system"} · {e.action.replace(/_/g, " ")}</li>
        ))}</ol>
      </details>
    </article>
  );
};

const GateTable: React.FC<{ r: TransactionRecord; gate: Gate; party: TxnParty; me: string; run: Run; remote: Remote }> = ({ r, gate, party, me, run, remote }) => {
  const items = r.items.filter((i) => i.gate === gate);
  const p = gateProgress(r.items, gate);
  const [active, setActive] = useState<{ id: string; mode: "evidence" | "review" | "waive" } | null>(null);
  return (
    <section aria-label={GATE_TITLE[gate]}>
      <h4 className="mb-1 text-[12px] font-semibold">{GATE_TITLE[gate]} <span className="font-normal text-xo-faint">· {p.done} of {p.total} satisfied or waived{p.evidenced ? ` · ${p.evidenced} awaiting confirmation` : ""}</span></h4>
      {items.length === 0 ? <p className="text-[12px] text-xo-faint">None recorded.</p> : (
        <ul className="divide-y divide-xo-line border border-xo-line">
          {items.map((i) => {
            const a = itemActions(i, party, me, r.txn.state);
            const s = ITEM[i.status];
            return (
              <li key={i.id} className="space-y-1 px-3 py-2 text-[12px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13px]">{i.title}{!i.required && <span className="text-xo-faint"> · not required</span>}</span>
                  <span className="text-xo-faint">{OWNER[i.owner_party]}{i.due_date ? ` · due ${i.due_date}` : ""} · <span className={s.cls}>{s.text}</span></span>
                </div>
                {i.evidence && <p className="text-xo-muted">Evidence ({i.evidence.party ?? "?"}): {i.evidence.description}{i.evidence.documentName ? ` · ${i.evidence.documentName}` : ""}{i.evidence.documentSha256 ? ` · SHA-256 ${i.evidence.documentSha256.slice(0, 12)}…` : ""}</p>}
                {i.note && <p className="text-xo-faint">Note: {i.note}</p>}
                {i.waiver_requested_by && i.status !== "waived" && <p className="text-xo-caution">{i.waiver_requested_by === me ? "You asked to waive this; waiting for the other party." : "The other party asks to waive this."}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {a.evidence && <button type="button" className={BTN} onClick={() => setActive({ id: i.id, mode: "evidence" })}>{i.status === "evidenced" ? "Replace evidence" : "Record evidence"}</button>}
                  {a.review && <button type="button" className={BTN} onClick={() => setActive({ id: i.id, mode: "review" })}>Review evidence</button>}
                  {a.waive === "ask" && <button type="button" className={BTN} onClick={() => setActive({ id: i.id, mode: "waive" })}>Propose waiver</button>}
                  {a.waive === "agree" && <button type="button" className={BTN} onClick={() => setActive({ id: i.id, mode: "waive" })}>Agree to waive</button>}
                </div>
                {active?.id === i.id && <ItemForm item={i} mode={active.mode} close={() => setActive(null)} run={run} remote={remote} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const ItemForm: React.FC<{ item: TxnItem; mode: "evidence" | "review" | "waive"; close: () => void; run: Run; remote: Remote }> = ({ item, mode, close, run, remote }) => {
  const [text, setText] = useState(""); const [docName, setDocName] = useState(""); const [hash, setHash] = useState(""); const [hashing, setHashing] = useState(false);
  const done = (what: () => Promise<unknown>, m: string): void => { run(what, m); close(); };
  if (mode === "review") return (
    <div className="space-y-1.5 border border-xo-line bg-xo-ink p-2">
      <label className="block" htmlFor={`rv-${item.id}`}><span className={LABEL}>Note (what you checked)</span><input id={`rv-${item.id}`} className={INPUT} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="flex gap-1.5">
        <button type="button" className={BTN} onClick={() => done(() => reviewItem(item.id, "confirm", text, remote), "Confirmed: the condition is satisfied.")}>Confirm the evidence</button>
        <button type="button" className={BTN} onClick={() => done(() => reviewItem(item.id, "reject", text, remote), "Rejected: the condition is open again.")}>Reject</button>
        <button type="button" className={BTN} onClick={close}>Cancel</button>
      </div>
    </div>
  );
  if (mode === "waive") return (
    <form className="space-y-1.5 border border-xo-line bg-xo-ink p-2" onSubmit={(e) => { e.preventDefault(); done(() => waiveItem(item.id, text, remote), item.waiver_requested_by ? "Waived by both parties." : "Waiver proposed; the other party must agree."); }}>
      <label className="block" htmlFor={`wv-${item.id}`}><span className={LABEL}>Why it is waived (required)</span><input id={`wv-${item.id}`} className={INPUT} required value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="flex gap-1.5"><button type="submit" className={BTN}>{item.waiver_requested_by ? "Agree to waive" : "Propose waiver"}</button><button type="button" className={BTN} onClick={close}>Cancel</button></div>
    </form>
  );
  return (
    <form className="space-y-1.5 border border-xo-line bg-xo-ink p-2" onSubmit={(e) => { e.preventDefault(); done(() => evidenceItem(item.id, { description: text, ...(docName ? { documentName: docName } : {}), ...(hash ? { documentSha256: hash } : {}) }, remote), "Evidence recorded; the other party confirms it."); }}>
      <label className="block" htmlFor={`ev-${item.id}`}><span className={LABEL}>What was done, by whom, and the document that shows it (required)</span><input id={`ev-${item.id}`} className={INPUT} required value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <label className="block" htmlFor={`dn-${item.id}`}><span className={LABEL}>Document name (optional)</span><input id={`dn-${item.id}`} className={INPUT} value={docName} onChange={(e) => setDocName(e.target.value)} /></label>
        <label className="block" htmlFor={`df-${item.id}`}><span className={LABEL}>Hash the document (optional; it stays on your device)</span>
          <input id={`df-${item.id}`} type="file" className="text-[11px]" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setHashing(true); void sha256OfFile(f).then((h) => { setHash(h); if (!docName) setDocName(f.name); }).finally(() => setHashing(false)); }} /></label>
      </div>
      {hash && <p className="font-mono text-[11px] text-xo-faint">SHA-256 {hash}</p>}
      <div className="flex gap-1.5"><button type="submit" className={BTN} disabled={hashing}>Record evidence</button><button type="button" className={BTN} onClick={close}>Cancel</button></div>
    </form>
  );
};

const AddItem: React.FC<{ r: TransactionRecord; run: Run; remote: Remote }> = ({ r, run, remote }) => {
  const gates: Gate[] = r.txn.state === "negotiating" ? ["signing", "closing"] : r.txn.state === "signed" ? ["closing"] : ["post_closing"];
  const [open, setOpen] = useState(false);
  const [g, setG] = useState<Gate>(gates[0]!); const [title, setTitle] = useState(""); const [owner, setOwner] = useState<OwnerParty>("both");
  const [due, setDue] = useState(""); const [required, setRequired] = useState(true);
  if (!open) return <button type="button" className={BTN} onClick={() => setOpen(true)}>Add a {gates.length > 1 ? "condition" : gates[0] === "post_closing" ? "post-closing obligation" : "completion condition"}</button>;
  return (
    <form className="grid gap-2 border border-xo-line bg-xo-ink p-2 sm:grid-cols-6" onSubmit={(e) => { e.preventDefault(); run(() => addItem(r.txn.id, g, title, owner, due || null, required, remote), "Added."); setOpen(false); setTitle(""); }}>
      <label className="block sm:col-span-3" htmlFor={`ai-t-${r.txn.id}`}><span className={LABEL}>Title</span><input id={`ai-t-${r.txn.id}`} className={INPUT} required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      {gates.length > 1 && <label className="block" htmlFor={`ai-g-${r.txn.id}`}><span className={LABEL}>Before</span>
        <select id={`ai-g-${r.txn.id}`} className={INPUT} value={g} onChange={(e) => setG(e.target.value as Gate)}><option value="signing">Signing</option><option value="closing">Completion</option></select></label>}
      <label className="block" htmlFor={`ai-o-${r.txn.id}`}><span className={LABEL}>Owner</span>
        <select id={`ai-o-${r.txn.id}`} className={INPUT} value={owner} onChange={(e) => setOwner(e.target.value as OwnerParty)}><option value="both">Both</option><option value="seller">Seller</option><option value="buyer">Buyer</option></select></label>
      <label className="block" htmlFor={`ai-d-${r.txn.id}`}><span className={LABEL}>Due (optional)</span><input id={`ai-d-${r.txn.id}`} type="date" className={INPUT} value={due} onChange={(e) => setDue(e.target.value)} /></label>
      <label className="flex items-center gap-1.5 text-[12px] sm:col-span-3"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Required before the milestone</label>
      <div className="flex gap-1.5 sm:col-span-3"><button type="submit" className={BTN}>Add</button><button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
};

const Milestone: React.FC<{ r: TransactionRecord; gate: "signing" | "closing"; party: TxnParty; run: Run; remote: Remote }> = ({ r, gate, party, run, remote }) => {
  const v = milestoneView(r, gate, party);
  const [name, setName] = useState(""); const [hash, setHash] = useState(""); const [docName, setDocName] = useState("");
  const [amount, setAmount] = useState(""); const [ref, setRef] = useState(""); const [paidOn, setPaidOn] = useState("");
  const word = gate === "signing" ? "signing" : "completion";
  const summary = (c: typeof v.mine): string => !c ? "not yet confirmed" : gate === "signing"
    ? `confirmed ${c.confirmed_at.slice(0, 10)} · signed by ${c.evidence.signatoryName} · agreement SHA-256 ${c.evidence.documentSha256.slice(0, 12)}…`
    : `confirmed ${c.confirmed_at.slice(0, 10)} · $${Number(c.evidence.amountUsd).toLocaleString("en-US")} paid · reference ${c.evidence.reference}`;
  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (gate === "signing") run(() => confirmSigning(r.txn.id, { signatoryName: name, documentSha256: hash.trim().toLowerCase(), ...(docName ? { documentName: docName } : {}) }, remote), "Signing confirmed on your side.");
    else run(() => confirmClosing(r.txn.id, { amountUsd: amount.replace(/[,\s$]/g, ""), reference: ref, ...(paidOn ? { paidOn } : {}) }, remote), "Completion confirmed on your side.");
  };
  return (
    <section aria-label={`Confirm ${word}`} className="space-y-2 border border-xo-line p-2">
      <h4 className="text-[12px] font-semibold">Confirm {word}</h4>
      <ul className="text-[12px] text-xo-muted">
        <li>You ({party}): {summary(v.mine)}</li>
        <li>The {other(party)}: {summary(v.theirs)}</li>
      </ul>
      {v.mismatch && <p role="alert" className="text-[12px] text-xo-risk">{v.mismatch}</p>}
      {v.blockedBy > 0 && <p className="text-[12px] text-xo-caution">{v.blockedBy} required condition{v.blockedBy === 1 ? "" : "s"} still open: you can confirm now, but {word} is recorded only once they are met.</p>}
      <form className="grid gap-2 sm:grid-cols-3" onSubmit={submit}>
        {gate === "signing" ? (<>
          <label className="block" htmlFor={`ms-n-${r.txn.id}`}><span className={LABEL}>Signatory for your side</span><input id={`ms-n-${r.txn.id}`} className={INPUT} required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block" htmlFor={`ms-f-${r.txn.id}`}><span className={LABEL}>The signed agreement (hashed here, not uploaded)</span>
            <input id={`ms-f-${r.txn.id}`} type="file" className="text-[11px]" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sha256OfFile(f).then((h) => { setHash(h); setDocName(f.name); }); }} /></label>
          <label className="block" htmlFor={`ms-h-${r.txn.id}`}><span className={LABEL}>…or its SHA-256</span><input id={`ms-h-${r.txn.id}`} className={`${INPUT} font-mono`} required pattern="[0-9a-fA-F]{64}" value={hash} onChange={(e) => setHash(e.target.value)} /></label>
        </>) : (<>
          <label className="block" htmlFor={`ms-a-${r.txn.id}`}><span className={LABEL}>Amount paid at completion (USD)</span><input id={`ms-a-${r.txn.id}`} className={INPUT} required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="block" htmlFor={`ms-r-${r.txn.id}`}><span className={LABEL}>Payment reference</span><input id={`ms-r-${r.txn.id}`} className={INPUT} required value={ref} onChange={(e) => setRef(e.target.value)} /></label>
          <label className="block" htmlFor={`ms-p-${r.txn.id}`}><span className={LABEL}>Paid on (optional)</span><input id={`ms-p-${r.txn.id}`} type="date" className={INPUT} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} /></label>
        </>)}
        <div className="sm:col-span-3"><button type="submit" className={BTN}>{v.mine ? `Replace your ${word} confirmation` : `Confirm ${word}`}</button></div>
      </form>
      <p className="text-[11px] text-xo-faint">{gate === "signing"
        ? "Both parties hash the same signed agreement; if the hashes differ, nothing is recorded until you agree which document was signed. ExitOS does not see the agreement or check the signatures on it."
        : "Both parties state the amount actually paid at completion, after adjustments. ExitOS does not see the payment or check it with a bank."}</p>
    </section>
  );
};

const Terminate: React.FC<{ r: TransactionRecord; run: Run; remote: Remote }> = ({ r, run, remote }) => {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState("");
  if (!open) return <button type="button" className={`${BTN} text-xo-risk`} onClick={() => setOpen(true)}>Terminate the transaction…</button>;
  return (
    <form className="space-y-1.5 border border-xo-risk/50 p-2" onSubmit={(e) => { e.preventDefault(); run(() => terminateTransaction(r.txn.id, reason, remote), "Transaction terminated. The buyer's data-room access under it has ended."); setOpen(false); }}>
      <p className="text-[12px] text-xo-risk">Either party can end the transaction before completion. It cannot be reopened, and the buyer's data-room access under it ends at once, even while the NDA is in term.</p>
      <label className="block" htmlFor={`tm-${r.txn.id}`}><span className={LABEL}>Reason (recorded in the audit trail)</span><input id={`tm-${r.txn.id}`} className={INPUT} required value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <div className="flex gap-1.5"><button type="submit" className={`${BTN} text-xo-risk`}>Terminate</button><button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
};

// ── closing documents, from this record ─────────────────────────────
type DocKey = "spa" | "funds_flow" | "conditions" | "bring_down" | "post_closing" | "announcement";
const DOCS: ReadonlyArray<readonly [DocKey, string, string, (i: ClosingInput) => TransactionDoc]> = [
  ["spa", "exitos.spa", "Agreement drafting brief", spaBrief],
  ["conditions", "exitos.filings_checklist", "Conditions, consents and filings", conditionsRegister],
  ["funds_flow", "exitos.funds_flow", "Funds flow and closing statement", fundsFlow],
  ["bring_down", "exitos.bring_down_certificate", "Bring-down certificate (draft)", bringDownDraft],
  ["post_closing", "exitos.post_closing_register", "Post-closing register", postClosingRegister],
  ["announcement", "exitos.announcement", "Completion announcement (draft)", announcementDraft],
];

const ClosingDocuments: React.FC<{ r: TransactionRecord }> = ({ r }) => {
  const { company, companyId, unconfirmed } = useMemo(() => loadActiveCompany(), []);
  const [key, setKey] = useState<DocKey>("spa");
  const [buyer, setBuyer] = useState("");
  const entry = DOCS.find((d) => d[0] === key)!;
  const built = useMemo((): { doc: TransactionDoc } | { why: string } => {
    try { return { doc: entry[3]({ company, record: r, buyerLabel: buyer.trim() || "the buyer" }) }; }
    catch (e) { return { why: e instanceof Error ? e.message : "This document cannot be built yet." }; }
  }, [entry, company, r, buyer]);
  if (companyId !== r.txn.company_id) return <p className="text-[12px] text-xo-faint">Closing documents are built from your saved company intake for this company; open it to generate them.</p>;
  const doc = "doc" in built ? built.doc : null;
  const text = doc ? doc.sections.map((s) => [s.heading, s.body ?? "", ...(s.bullets ?? []), ...(s.table?.rows.flat() ?? [])].join("\n")).join("\n") : "";
  const gate = doc ? gateDocument(entry[1], text, { company, unconfirmed }) : null;
  return (
    <details className="border border-xo-line p-2">
      <summary className="cursor-pointer text-[12px] font-semibold">Closing documents from this record</summary>
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Closing documents">{DOCS.map(([k, , label]) => (
          <button key={k} type="button" role="tab" aria-selected={key === k} onClick={() => setKey(k)} className={`${BTN} ${key === k ? "border-xo-action text-xo-action" : ""}`}>{label}</button>
        ))}</div>
        <label className="block max-w-xs" htmlFor={`cd-b-${r.txn.id}`}><span className={LABEL}>The buyer's name, as the documents should state it</span>
          <input id={`cd-b-${r.txn.id}`} className={INPUT} value={buyer} placeholder="the buyer" onChange={(e) => setBuyer(e.target.value)} /></label>
        {"why" in built ? <p className="text-[12px] text-xo-caution">{built.why}</p> : doc && (
          <>
            <article className="max-h-[24rem] overflow-auto border border-xo-line bg-xo-ink px-3 py-2 text-[12px]" aria-label="Preview">
              <h3 className="font-serif text-[16px] font-semibold">{doc.title}</h3>
              {doc.sections.map((s) => (
                <section key={s.heading} className="mt-2">
                  <h4 className="font-semibold">{s.heading}</h4>
                  {s.body && <p className="mt-0.5 text-xo-muted">{s.body}</p>}
                  {s.bullets && <ul className="mt-0.5 list-disc pl-5 text-xo-muted">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
                  {s.table && <table className="mt-1 w-full"><thead><tr>{s.table.headers.map((h) => <th key={h} className="border-b border-xo-line py-0.5 text-left font-medium">{h}</th>)}</tr></thead>
                    <tbody>{s.table.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className="border-b border-xo-line py-0.5 pr-2 text-xo-muted">{c}</td>)}</tr>)}</tbody></table>}
                </section>
              ))}
            </article>
            <DocumentVersions typeId={entry[1]} doc={asMemorandum(key, doc)} gate={gate} company={company} companyId={companyId} unconfirmed={unconfirmed}
              inputs={doc.inputs} ownerName={company.name} codeName={company.name} {...(doc.notices ? { notices: doc.notices } : {})} markdown={toMarkdown(entry[1], doc, doc.notices?.[0] ?? "Prepared in ExitOS from the transaction record.")} />
          </>
        )}
      </div>
    </details>
  );
};
