import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBilling, subscribe, type Billing , humanError} from "./api";
import { Button } from "./ui";
import { track } from "./analytics";

// The commercial conversion layer. The frame throughout is OUTCOMES, not plans:
// "official records", "evaluation", "Professional" — never "free tier / paid".

export const planLabel = (plan: string) => (plan === "paid" ? "Professional" : "Evaluation");
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

/** Compact usage meter — records remaining + a bar, or "evaluation completed". */
export const QuotaMeter: React.FC<{ b: Billing; className?: string }> = ({ b, className = "" }) => {
  if (b.canDownload) return <div className={`text-[12px] font-semibold text-emerald-300 ${className}`}>Professional · unlimited records</div>;
  const rem = Math.max(0, b.documentQuota - b.documentsUsed);
  const pct = Math.min(100, (b.documentsUsed / Math.max(1, b.documentQuota)) * 100);
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-white/80">{rem > 0 ? `${rem} official record${rem === 1 ? "" : "s"} remaining` : "Free evaluation completed"}</span>
        <span className="tabular-nums text-white/40">{b.documentsUsed}/{b.documentQuota}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
        <div className={`h-full transition-all ${rem > 0 ? "bg-seal-light" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/** Top-of-surface banner: remaining records + upgrade nudge; "evaluation completed" when spent. */
export const UsageBanner: React.FC<{ b: Billing; onUpgrade: () => void; className?: string }> = ({ b, onUpgrade, className = "" }) => {
  if (b.canDownload) return null; // Professional — unlimited, no nudge
  const rem = Math.max(0, b.documentQuota - b.documentsUsed);
  const done = rem === 0;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${done ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-white/10 bg-ink-800/60"} ${className}`}>
      <div className="text-sm">
        {done
          ? <><span className="font-semibold text-amber-200">Free evaluation completed.</span> <span className="text-white/55">Your next record requires a subscription.</span></>
          : <><span className="font-semibold text-white">{rem} official record{rem === 1 ? "" : "s"} remaining</span> <span className="text-white/45">on your evaluation.</span></>}
      </div>
      <Button variant="primary" className="shrink-0" onClick={onUpgrade}>Upgrade</Button>
    </div>
  );
};

const UNLOCKS = ["Unlimited official records", "PDF downloads", "DOCX exports", "Record preservation", "Audit retention"];

/** The conversion moment. `reason` sets the headline; the unlock list is the sell.
 *  A real modal (native <dialog>): focus contained, Escape / backdrop closes. */
export const UpgradeModal: React.FC<{ open: boolean; reason: "quota" | "download"; onClose: () => void; onSubscribed: (b: Billing) => void }> = ({ open, reason, onClose, onSubscribed }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  // The conversion moment reached — the single most important friction signal.
  useEffect(() => { if (open) track("paywall.viewed", { reason }); }, [open, reason]);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  if (!open) return null;
  const head = reason === "download"
    ? { t: "This record has been generated.", s: "Publication artifacts are available on the Professional plan." }
    : { t: "Free evaluation completed.", s: "Your next record requires a subscription." };
  const go = async () => {
    setBusy(true); setErr(null);
    try { onSubscribed(await subscribe()); }
    catch (e) { setErr(humanError(e, "subscribe failed")); setBusy(false); }
  };
  return (
    <dialog ref={ref} aria-labelledby="sd-upgrade-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
      onClick={(e) => { if (e.target === ref.current && !busy) onClose(); }}
      className="w-[min(92vw,440px)] rounded-xl border border-[#263548] bg-[#111a26] p-0 text-[#edf2f8] shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-[#05080dcc]">
      <div className="p-6">
        <h2 id="sd-upgrade-title" className="text-lg font-semibold text-white">{head.t}</h2>
        <p className="mt-1 text-sm text-[#b4c0cf]">{head.s}</p>
        <div className="mt-5 rounded-lg border border-[#263548] bg-[#0d1520] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8dbbff]">Professional plan unlocks</div>
          <ul className="mt-3 space-y-2">
            {UNLOCKS.map((u) => <li key={u} className="flex items-center gap-2 text-sm text-[#edf2f8]"><span className="text-[#75c9a1]" aria-hidden>✓</span>{u}</li>)}
          </ul>
        </div>
        {err && <div role="alert" className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
        <div className="mt-5 flex items-center gap-3">
          <Button variant="primary" className="flex-1" disabled={busy} onClick={go}>{busy ? "Subscribing…" : "Subscribe"}</Button>
          <button onClick={onClose} disabled={busy} className="text-sm text-[#b4c0cf] hover:text-white">Not now</button>
        </div>
        <p className="mt-3 text-center text-[11px] text-[#8d9bb0]">Activates immediately. Your records and credentials are unchanged.</p>
      </div>
    </dialog>
  );
};
