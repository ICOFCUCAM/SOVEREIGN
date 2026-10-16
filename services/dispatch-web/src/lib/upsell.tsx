import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBilling, subscribe, type Billing, type PlanTier, humanError } from "./api";
import { PLANS, planInfo, planName, evaluationStatus } from "./plans";
import { Button } from "./ui";
import { track } from "./analytics";

// The commercial conversion layer. The frame throughout is OUTCOMES, not plans:
// "official records", "evaluation", "Professional" — never "free tier / paid".

export const planLabel = (b: Pick<Billing, "canDownload" | "tier">) => planName(b);
export const recordsRemaining = (b: Billing) => (b.canDownload ? null : Math.max(0, b.documentQuota - b.documentsUsed));

// Billing is a SINGLE source of truth for the whole console — held once at the
// Console root and shared via context. Without this, every surface (rail,
// dashboard, create, record, access) kept its own copy, so subscribing on one
// surface left the persistent rail still nagging "Free evaluation completed"
// until a full reload. One context means a subscription unlocks everywhere at once.
interface BillingCtx { billing: Billing | null; setBilling: (b: Billing | null) => void; refresh: () => Promise<void> }
const Ctx = createContext<BillingCtx | null>(null);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billing, setBilling] = useState<Billing | null>(null);
  const refresh = useCallback(async () => { try { setBilling(await getBilling()); } catch { /* non-fatal */ } }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const value = useMemo<BillingCtx>(() => ({ billing, setBilling, refresh }), [billing, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** Shared session billing state with refresh + direct set (instant post-subscribe). */
export function useBilling(): BillingCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBilling must be used within BillingProvider");
  return c;
}

/** Compact usage meter — the evaluation's days and records left + a bar, or the active plan. */
export const QuotaMeter: React.FC<{ b: Billing; className?: string }> = ({ b, className = "" }) => {
  if (b.canDownload) return <div className={`text-[12px] font-semibold text-[#75c9a1] ${className}`}>{planName(b)} · active</div>;
  const st = evaluationStatus(b);
  const pct = Math.min(100, (b.documentsUsed / Math.max(1, b.documentQuota)) * 100);
  const requested = planInfo(b.requestedTier);
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold text-[#edf2f8]">{st.ended ? st.text : `Evaluation · ${st.text}`}</span>
        <span className="font-mono tabular-nums text-[#8d9bb0]">{b.documentsUsed}/{b.documentQuota}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded bg-[#0d1520]" role="meter" aria-valuenow={b.documentsUsed} aria-valuemin={0} aria-valuemax={b.documentQuota} aria-label="Evaluation records used">
        <div className={`h-full transition-all ${st.ended ? "bg-[#e6bd72]" : "bg-[#8dbbff]"}`} style={{ width: `${b.trialEnded ? 100 : pct}%` }} />
      </div>
      {requested && <div className="mt-1 text-[11px] text-[#8d9bb0]">{requested.name} requested · starts when confirmed</div>}
    </div>
  );
};

/** Top-of-surface banner: remaining records + upgrade nudge; "evaluation completed" when spent. */
export const UsageBanner: React.FC<{ b: Billing; onUpgrade: () => void; className?: string }> = ({ b, onUpgrade, className = "" }) => {
  if (b.canDownload) return null; // a paid plan — no nudge
  const st = evaluationStatus(b);
  const done = st.ended;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${done ? "border-[#e6bd72]/45 bg-[#e6bd72]/[0.07]" : "border-[#263548] bg-[#111a26]"} ${className}`}>
      <div className="text-sm">
        {done
          ? <><span className="font-semibold text-amber-200">{st.text}.</span> <span className="text-[#b4c0cf]">Your next record requires a subscription.</span></>
          : <><span className="font-semibold text-white">{st.text}</span> <span className="text-[#b4c0cf]">on your evaluation.</span></>}
      </div>
      <Button variant="primary" className="shrink-0" onClick={onUpgrade}>Upgrade</Button>
    </div>
  );
};

const UNLOCKS = ["Official records (SD- identifiers), not evaluation records", "PDF and DOCX downloads", "Record preservation", "Audit retention"];

/** The conversion moment: the institution chooses the plan it is subscribing to. Institutional and
 *  Institutional Plus are subscribed to; Enterprise and Sovereign are requested. The server decides whether
 *  the plan is active; until payment is confirmed it records the request. A real modal (native <dialog>):
 *  focus contained, Escape / backdrop closes. */
export const UpgradeModal: React.FC<{ open: boolean; reason: "quota" | "download"; onClose: () => void; onSubscribed: (b: Billing) => void }> = ({ open, reason, onClose, onSubscribed }) => {
  const { setBilling } = useBilling();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tier, setTier] = useState<PlanTier>("institutional");
  const [requested, setRequested] = useState<{ name: string; note: string } | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  // The conversion moment reached — the single most important friction signal.
  useEffect(() => { if (open) track("paywall.viewed", { reason }); }, [open, reason]);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  if (!open) return null;
  const head = reason === "download"
    ? { t: "This record has been generated.", s: "Downloads and official records come with a paid plan." }
    : { t: "Choose your institution's plan.", s: "A paid plan keeps you creating records after the evaluation's 30 days or 10 records." };
  const plan = PLANS.find((p) => p.tier === tier)!;
  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const b = await subscribe(tier);
      if (b.activated) { onSubscribed(b); return; }
      setBilling(b);
      setRequested({ name: plan.name, note: plan.selfServe ? "Your plan starts as soon as payment is confirmed. Your records and credentials are unchanged." : "This plan is scoped with your institution. Our team will contact you to agree the terms." });
      setBusy(false);
    } catch (e) { setErr(humanError(e, "subscribe failed")); setBusy(false); }
  };
  return (
    <dialog ref={ref} aria-labelledby="sd-upgrade-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
      onClick={(e) => { if (e.target === ref.current && !busy) onClose(); }}
      className="w-[min(92vw,520px)] rounded-xl border border-[#263548] bg-[#111a26] p-0 text-[#edf2f8] shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-[#05080dcc]">
      {requested ? (
        <div className="p-6">
          <h2 id="sd-upgrade-title" className="text-lg font-semibold text-white">{requested.name} requested</h2>
          <p className="mt-2 text-sm text-[#b4c0cf]">{requested.note}</p>
          <div className="mt-5"><Button variant="primary" onClick={onClose}>Close</Button></div>
        </div>
      ) : (
      <div className="p-6">
        <h2 id="sd-upgrade-title" className="text-lg font-semibold text-white">{head.t}</h2>
        <p className="mt-1 text-sm text-[#b4c0cf]">{head.s}</p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Plan</legend>
          {PLANS.map((p) => (
            <label key={p.tier} className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${tier === p.tier ? "border-[#8dbbff]/60 bg-[#16263a]" : "border-[#263548] bg-[#0d1520] hover:border-[#3a4f69]"}`}>
              <input type="radio" name="sd-plan" value={p.tier} checked={tier === p.tier} onChange={() => setTier(p.tier)} className="mt-1 accent-[#8dbbff]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                  <span className="text-[12px] text-[#b4c0cf]">{p.price}</span>
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#8d9bb0]">{p.summary}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8dbbff]">Every paid plan unlocks</div>
        <ul className="mt-2 space-y-1">
          {UNLOCKS.map((u) => <li key={u} className="flex items-center gap-2 text-[13px] text-[#edf2f8]"><span className="text-[#75c9a1]" aria-hidden>✓</span>{u}</li>)}
        </ul>
        {err && <div role="alert" className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
        <div className="mt-5 flex items-center gap-3">
          <Button variant="primary" className="flex-1" disabled={busy} onClick={go}>{busy ? "Sending…" : plan.selfServe ? `Subscribe to ${plan.name}` : `Request ${plan.name}`}</Button>
          <button onClick={onClose} disabled={busy} className="text-sm text-[#b4c0cf] hover:text-white">Not now</button>
        </div>
        <p className="mt-3 text-center text-[11px] text-[#8d9bb0]">{plan.selfServe ? "Your plan starts when payment is confirmed. Your records and credentials are unchanged." : "We agree terms with your institution before this plan starts."}</p>
      </div>
      )}
    </dialog>
  );
};
