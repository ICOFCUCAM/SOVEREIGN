import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Section } from "./xo";
import { useAuth } from "../lib/auth";
import type { Remote } from "../lib/documents/store";
import { loadActiveCompany } from "../lib/active-company";
import { ndaTemplateText } from "../lib/nda-template";
import {
  loadNdas, issueNda, recordSignature, verifySignature, withdrawNda, terminateNda, revokeNdaAccess, buyerRoomFiles, buyerDownloadLink,
  effectiveState, outstanding, sha256Hex,
  type NdaAgreement, type NdaSignature, type NdaEvent, type Party, type SigningMethod, type BuyerRoomFile,
} from "../lib/nda-lifecycle";

// ── NDA LIFECYCLE ───────────────────────────────────────────────────
// The server-enforced workflow: the seller issues an NDA against a buyer's request; each
// required party records its signature from its own account with evidence; the counterparty
// verifies it; the NDA executes only when every required party is verified, and only then does
// the buyer see the files the seller disclosed. This page decides nothing on its own.

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2.5 py-1.5 text-[13px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-1 block text-[12px] font-medium text-xo-muted";
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const STATE_TEXT: Record<string, { text: string; cls: string }> = {
  issued: { text: "Issued · awaiting signatures", cls: "text-xo-caution" }, executed: { text: "Executed · access open", cls: "text-xo-verified" },
  expired: { text: "Expired · access closed", cls: "text-xo-faint" }, withdrawn: { text: "Withdrawn", cls: "text-xo-faint" },
  terminated: { text: "Terminated · access closed", cls: "text-xo-faint" }, revoked: { text: "Access revoked by the seller", cls: "text-xo-risk" },
};
const METHOD_TEXT: Record<SigningMethod, string> = {
  external_esign: "External e-signature (details entered by the party)",
  wet_ink_scan: "Wet-ink signature (scan hashed, not stored)",
  in_app_typed: "Typed name in ExitOS (weakest)",
};
// what each method does and does not establish, shown before a party signs
const METHOD_LIMITS: Record<SigningMethod, string> = {
  external_esign: "ExitOS is not connected to an e-signature provider: it records the provider, envelope id and signed-copy hash you enter, and the other party checks them against the provider's records. It does not receive the provider's certificate of completion.",
  wet_ink_scan: "Your browser hashes the scanned signed copy; the scan is not uploaded or stored, so send it to the other party yourself. They verify the hash against the copy they receive.",
  in_app_typed: "Records your typed name, your signed-in account and the time. There is no identity check beyond the e-mail sign-in, no certificate, and no check that you may sign for your organisation. Use an e-signature for a transaction of any size.",
};

interface Req { id: string; listing_id: string; buyer_account_id: string; data: { status?: string; requestedAt?: string } }

export const NdaLifecycle: React.FC<{ remote: Remote }> = ({ remote }) => {
  const { session } = useAuth();
  const me = session?.verified?.userId ?? "";
  const [data, setData] = useState<{ agreements: NdaAgreement[]; signatures: NdaSignature[]; events: NdaEvent[] }>({ agreements: [], signatures: [], events: [] });
  const [requests, setRequests] = useState<Req[]>([]);
  const [msg, setMsg] = useState("");
  const refresh = useCallback(() => {
    void loadNdas(remote).then(setData).catch((e: Error) => setMsg(e.message));
    void (async () => {
      const h = { apikey: remote.anonKey, Authorization: `Bearer ${remote.accessToken}` };
      const mine = await (await fetch(`${remote.url}/rest/v1/exitos_listings?owner_account_id=eq.${me}&select=id`, { headers: h })).json() as Array<{ id: string }>;
      if (!Array.isArray(mine) || !mine.length) { setRequests([]); return; }
      const r = await (await fetch(`${remote.url}/rest/v1/exitos_nda_requests?listing_id=in.(${mine.map((x) => x.id).join(",")})&select=id,listing_id,buyer_account_id,data`, { headers: h })).json() as Req[];
      setRequests(Array.isArray(r) ? r.filter((x) => (x.data.status ?? "requested") === "requested") : []);
    })().catch(() => setRequests([]));
  }, [remote, me]);
  useEffect(refresh, [refresh]);
  const run = (what: () => Promise<unknown>, done: string): void => { setMsg(""); void what().then(() => { setMsg(done); refresh(); }).catch((e: Error) => setMsg(e.message)); };
  const open = requests.filter((r) => !data.agreements.some((a) => a.nda_request_id === r.id && (a.state === "issued" || a.state === "executed")));

  return (
    <Section title="NDAs with signature evidence" eyebrow="Server-enforced · both parties sign · the counterparty verifies" className="border border-xo-line">
      <div className="space-y-3 px-4 py-3">
        <p className="text-[12px] leading-relaxed text-xo-muted">An NDA executes only when every required party has recorded a signature from its own account, on the exact issued text, and the other party has verified the evidence. Only then can the buyer open the files the seller has marked for buyers. Expiry, termination and revocation close access at once. "Verified" means the counterparty confirmed the evidence matches the issued version: ExitOS does not check e-signature certificates and gives no legal opinion.</p>
        {msg && <p role="status" className="text-[12px] text-xo-text">{msg}</p>}
        {open.length > 0 && <IssueForm requests={open} remote={remote} onDone={(m) => { setMsg(m); refresh(); }} />}
        {data.agreements.length === 0 && open.length === 0 && <p className="text-[12px] text-xo-faint">No NDAs yet. A seller issues one when a buyer requests an NDA on its listing.</p>}
        {data.agreements.map((a) => (
          <Agreement key={a.id} a={a} me={me} sigs={data.signatures.filter((s) => s.agreement_id === a.id)} events={data.events.filter((e) => e.agreement_id === a.id)} remote={remote} run={run} />
        ))}
      </div>
    </Section>
  );
};

const IssueForm: React.FC<{ requests: Req[]; remote: Remote; onDone: (m: string) => void }> = ({ requests, remote, onDone }) => {
  const { company, companyId } = useMemo(() => loadActiveCompany(), []);
  const [reqId, setReqId] = useState(requests[0]?.id ?? "");
  const [term, setTerm] = useState(12); const [survival, setSurvival] = useState(24);
  const [origin, setOrigin] = useState<NdaAgreement["document_origin"]>("exitos_template");
  const [text, setText] = useState(() => ndaTemplateText({ companyCode: company.name, accessTermMonths: 12, survivalMonths: 24 }));
  const [err, setErr] = useState("");
  const req = requests.find((r) => r.id === reqId);
  if (!companyId) return <p className="text-[12px] text-xo-caution">Save your company intake first: an NDA is issued for one company, and its data room is scoped to it.</p>;
  return (
    <form className="space-y-2 border border-xo-line px-3 py-3" onSubmit={(e) => { e.preventDefault(); if (!req) return; setErr("");
      void issueNda({ listingId: req.listing_id, companyId, buyerAccountId: req.buyer_account_id, requestId: req.id, title: "Mutual non-disclosure agreement", version: "v1",
        origin, shape: "mutual", text, accessTermMonths: term, survivalMonths: survival, scope: null }, remote).then(() => onDone("NDA issued. Both parties now sign; each verifies the other.")).catch((x: Error) => setErr(x.message)); }}>
      <div className="text-[13px] font-semibold">Issue an NDA to a requesting buyer</div>
      <label className="block" htmlFor="nda-req"><span className={LABEL}>Request</span>
        <select id="nda-req" className={INPUT} value={reqId} onChange={(e) => setReqId(e.target.value)}>
          {requests.map((r) => <option key={r.id} value={r.id}>A buyer · requested {r.data.requestedAt?.slice(0, 10) ?? ""}</option>)}
        </select></label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block" htmlFor="nda-term"><span className={LABEL}>Access term (months)</span><input id="nda-term" type="number" min={1} max={60} className={INPUT} value={term} onChange={(e) => setTerm(Number(e.target.value))} /></label>
        <label className="block" htmlFor="nda-surv"><span className={LABEL}>Obligations survive (months)</span><input id="nda-surv" type="number" min={0} max={120} className={INPUT} value={survival} onChange={(e) => setSurvival(Number(e.target.value))} /></label>
        <label className="block" htmlFor="nda-origin"><span className={LABEL}>Text</span>
          <select id="nda-origin" className={INPUT} value={origin} onChange={(e) => { const o = e.target.value as NdaAgreement["document_origin"]; setOrigin(o); if (o === "exitos_template") setText(ndaTemplateText({ companyCode: company.name, accessTermMonths: term, survivalMonths: survival })); }}>
            <option value="exitos_template">ExitOS template (founder draft, not reviewed by counsel)</option>
            <option value="seller_supplied">Supplied by me or my counsel</option>
          </select></label>
      </div>
      <label className="block" htmlFor="nda-text"><span className={LABEL}>Agreement text (fixed when issued; a change means a new NDA)</span>
        <textarea id="nda-text" rows={8} className={`${INPUT} font-mono text-[12px]`} value={text} onChange={(e) => setText(e.target.value)} /></label>
      {err && <p role="alert" className="text-[12px] text-xo-risk">{err}</p>}
      <button type="submit" className={BTN}>Issue NDA</button>
    </form>
  );
};

const Agreement: React.FC<{ a: NdaAgreement; me: string; sigs: NdaSignature[]; events: NdaEvent[]; remote: Remote; run: (f: () => Promise<unknown>, done: string) => void }> = ({ a, me, sigs, events, remote, run }) => {
  const role: Party = a.owner_account_id === me ? "seller" : "buyer";
  const state = effectiveState(a); const st = STATE_TEXT[state] ?? STATE_TEXT.issued!;
  const live = sigs.filter((s) => s.verification !== "rejected");
  const mySig = live.find((s) => s.party === role);
  const theirs = live.find((s) => s.party !== role && s.verification === "pending");
  const [showText, setShowText] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <article data-nda={a.id} className="border border-xo-line px-3 py-3 text-[12px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div><span className="text-[13px] font-semibold">{a.title}</span> <span className="text-xo-faint">· {a.document_version} · {a.document_origin === "exitos_template" ? "ExitOS template, not reviewed by counsel" : "supplied by the seller"} · you are the {role}</span></div>
        <span className={`font-semibold ${st.cls}`}>{st.text}</span>
      </div>
      <p className="mt-1 text-xo-muted">Document SHA-256 <span className="font-mono">{a.document_sha256.slice(0, 16)}…</span> · access term {a.access_term_months} months{a.access_until ? ` (until ${a.access_until.slice(0, 10)})` : ""} · obligations survive {a.survival_months} months · company scope {a.company_id.slice(0, 11)}…{a.transaction_id ? ` · transaction ${a.transaction_id}` : " · no transaction record yet"}</p>
      <button type="button" className="mt-1 text-xo-action hover:underline" onClick={() => setShowText(!showText)} aria-expanded={showText}>{showText ? "Hide" : "Read"} the issued text</button>
      {showText && <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap border border-xo-line bg-xo-ink p-2 font-mono text-[11px]">{a.document_text}</pre>}
      <ul className="mt-2 space-y-1">
        {a.required_signers.map((p) => { const s = live.find((x) => x.party === p); return (
          <li key={p}><span className="font-medium capitalize">{p}</span>: {s ? <>{s.signatory_name}{s.signatory_title ? `, ${s.signatory_title}` : ""} · {METHOD_TEXT[s.method]} · signed {s.signed_at.slice(0, 10)} · <span className={s.verification === "verified" ? "text-xo-verified" : "text-xo-caution"}>{s.verification === "verified" ? `verified by the ${p === "seller" ? "buyer" : "seller"}${s.verification_note ? ` (${s.verification_note})` : ""}` : "awaiting the counterparty's verification"}</span></> : <span className="text-xo-faint">not signed</span>}</li>
        ); })}
      </ul>
      {state === "issued" && !mySig && a.required_signers.includes(role) && <SignForm a={a} party={role} remote={remote} run={run} />}
      {state === "issued" && theirs && <VerifyForm s={theirs} remote={remote} run={run} />}
      {state === "issued" && outstanding(a, sigs).length > 0 && <p className="mt-1 text-xo-faint">Still needed: verified signatures from {outstanding(a, sigs).join(" and ")}.</p>}
      {role === "buyer" && state === "executed" && <BuyerRoom a={a} remote={remote} />}
      {(state === "issued" || state === "executed") && (
        <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-xo-line pt-2">
          <label className="block grow" htmlFor={`r-${a.id}`}><span className={LABEL}>Reason</span><input id={`r-${a.id}`} className={INPUT} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          {role === "seller" && state === "issued" && <button type="button" className={BTN} disabled={!reason.trim()} onClick={() => run(() => withdrawNda(a.id, reason, remote), "NDA withdrawn.")}>Withdraw</button>}
          {role === "seller" && state === "executed" && <button type="button" className={BTN} disabled={!reason.trim()} onClick={() => run(() => revokeNdaAccess(a.id, reason, remote), "The buyer's access is revoked.")}>Revoke the buyer's access</button>}
          {state === "executed" && <button type="button" className={BTN} disabled={!reason.trim()} onClick={() => run(() => terminateNda(a.id, reason, remote), "NDA terminated; access closed.")}>Terminate</button>}
        </div>
      )}
      <details className="mt-2"><summary className="cursor-pointer text-xo-muted">Audit trail ({events.length})</summary>
        <ol className="mt-1 space-y-0.5 font-mono text-[11px] text-xo-faint">{events.map((e) => <li key={e.id}>{e.at.replace("T", " ").slice(0, 19)} · {e.action.replace(/_/g, " ")}{e.actor === me ? " · you" : ""}</li>)}</ol>
      </details>
    </article>
  );
};

const SignForm: React.FC<{ a: NdaAgreement; party: Party; remote: Remote; run: (f: () => Promise<unknown>, done: string) => void }> = ({ a, party, remote, run }) => {
  const [method, setMethod] = useState<SigningMethod>("external_esign");
  const [f, setF] = useState({ name: "", title: "", email: "", typed: "", provider: "", envelope: "", copySha: "", read: false });
  const evidence = (): Record<string, unknown> => method === "in_app_typed" ? { typedName: f.typed } : method === "external_esign" ? { provider: f.provider, envelopeId: f.envelope, signedCopySha256: f.copySha } : { signedCopySha256: f.copySha };
  const hashFile = async (file: File | undefined): Promise<void> => { if (!file) return; const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer()); setF((x) => ({ ...x, copySha: [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("") })); };
  return (
    <form className="mt-2 space-y-2 border-t border-xo-line pt-2" onSubmit={(e) => { e.preventDefault();
      run(async () => recordSignature({ agreementId: a.id, party, name: f.name, title: f.title, email: f.email, method, signedSha256: await sha256Hex(a.document_text), evidence: evidence(), signedAt: new Date().toISOString() }, remote),
        "Signature recorded. It counts once the other party verifies it."); }}>
      <div className="font-semibold">Record your signature as the {party}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block" htmlFor={`sn-${a.id}`}><span className={LABEL}>Signatory name</span><input id={`sn-${a.id}`} required className={INPUT} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block" htmlFor={`st-${a.id}`}><span className={LABEL}>Title</span><input id={`st-${a.id}`} className={INPUT} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="block" htmlFor={`sm-${a.id}`}><span className={LABEL}>Method</span>
          <select id={`sm-${a.id}`} className={INPUT} value={method} onChange={(e) => setMethod(e.target.value as SigningMethod)}>
            {(Object.keys(METHOD_TEXT) as SigningMethod[]).map((m) => <option key={m} value={m}>{METHOD_TEXT[m]}</option>)}
          </select></label>
      </div>
      <p className="text-[11px] leading-relaxed text-xo-caution">{METHOD_LIMITS[method]}</p>
      {method === "in_app_typed" && <label className="block" htmlFor={`ty-${a.id}`}><span className={LABEL}>Type your name to sign the issued text</span><input id={`ty-${a.id}`} className={INPUT} value={f.typed} onChange={(e) => setF({ ...f, typed: e.target.value })} /></label>}
      {method === "external_esign" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block" htmlFor={`pv-${a.id}`}><span className={LABEL}>E-signature provider</span><input id={`pv-${a.id}`} className={INPUT} value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></label>
          <label className="block" htmlFor={`ev-${a.id}`}><span className={LABEL}>Envelope or transaction id</span><input id={`ev-${a.id}`} className={INPUT} value={f.envelope} onChange={(e) => setF({ ...f, envelope: e.target.value })} /></label>
        </div>
      )}
      {method !== "in_app_typed" && <label className="block" htmlFor={`cp-${a.id}`}><span className={LABEL}>The completed signed copy (hashed in your browser; the file is not uploaded)</span><input id={`cp-${a.id}`} type="file" className="text-[12px]" onChange={(e) => void hashFile(e.target.files?.[0])} />{f.copySha && <span className="ml-2 font-mono text-[11px] text-xo-faint">{f.copySha.slice(0, 16)}…</span>}</label>}
      <label className="flex items-start gap-2"><input type="checkbox" checked={f.read} onChange={(e) => setF({ ...f, read: e.target.checked })} className="mt-0.5" /><span>I have read the issued text (SHA-256 {a.document_sha256.slice(0, 12)}…) and this signature is for that exact version.</span></label>
      <button type="submit" className={BTN} disabled={!f.read || !f.name.trim()}>Record signature</button>
    </form>
  );
};

const VerifyForm: React.FC<{ s: NdaSignature; remote: Remote; run: (f: () => Promise<unknown>, done: string) => void }> = ({ s, remote, run }) => {
  const [note, setNote] = useState("");
  return (
    <div className="mt-2 space-y-2 border-t border-xo-line pt-2">
      <div className="font-semibold">Verify the {s.party}'s signature</div>
      <p className="text-xo-muted">{s.signatory_name} · {METHOD_TEXT[s.method]} · evidence: <span className="font-mono text-[11px]">{JSON.stringify(s.evidence)}</span></p>
      <p className="text-xo-faint">Check the evidence against your copy before verifying: the envelope in the provider's records, or the signed copy's SHA-256 against the file you received.</p>
      <label className="block" htmlFor={`vn-${s.id}`}><span className={LABEL}>What you checked</span><input id={`vn-${s.id}`} className={INPUT} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="flex gap-2">
        <button type="button" className={BTN} disabled={!note.trim()} onClick={() => run(() => verifySignature(s.id, "verified", note, remote), "Signature verified.")}>Verify</button>
        <button type="button" className={BTN} onClick={() => run(() => verifySignature(s.id, "rejected", note, remote), "Signature rejected; the party can sign again.")}>Reject</button>
      </div>
    </div>
  );
};

const BuyerRoom: React.FC<{ a: NdaAgreement; remote: Remote }> = ({ a, remote }) => {
  const [files, setFiles] = useState<BuyerRoomFile[] | null>(null);
  const [err, setErr] = useState("");
  return (
    <div className="mt-2 border-t border-xo-line pt-2">
      <button type="button" className={BTN} onClick={() => { setErr(""); void buyerRoomFiles(a.id, remote).then(setFiles).catch((e: Error) => setErr(e.message)); }}>Open the seller's data room</button>
      {err && <p role="alert" className="mt-1 text-xo-risk">{err}</p>}
      {files && (files.length === 0 ? <p className="mt-1 text-xo-faint">The seller has not disclosed any files to buyers yet.</p> : (
        <ul className="mt-2 space-y-1">{files.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2"><span><span className="font-mono">{x.filename}</span> <span className="text-xo-faint">· {x.room_kind.replace(/_/g, " ")}</span></span>
            <button type="button" className="font-semibold text-xo-action hover:underline" onClick={() => void buyerDownloadLink(a.id, x.id, remote).then((u) => window.open(u, "_blank", "noopener")).catch((e: Error) => setErr(e.message))}>Download<span className="sr-only"> {x.filename}</span></button>
          </li>))}</ul>
      ))}
      <p className="mt-1 text-[11px] text-xo-faint">Each download is re-checked against this NDA and opens a link valid for 60 seconds. Every listing and download is recorded in the audit trail.</p>
    </div>
  );
};
