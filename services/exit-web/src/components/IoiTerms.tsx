import React from "react";
import type { Financing, OfferTerms } from "../lib/documents/transaction-docs";

// ── STRUCTURED INDICATION OF INTEREST ───────────────────────────────
// The terms the process letter asks a bidder to state. Every field is optional; a blank field
// is "not stated" (never zero), and the founder's documents say so.

export interface IoiDraft { cash: string; earnout: string; earnoutMonths: string; rollover: string; escrow: string; escrowMonths: string; cap: string; exclusivity: string; diligence: string; financing: "" | Financing; validUntil: string; conditions: string; approvals: string; assumptions: string }
export const EMPTY_IOI: IoiDraft = { cash: "", earnout: "", earnoutMonths: "", rollover: "", escrow: "", escrowMonths: "", cap: "", exclusivity: "", diligence: "", financing: "", validUntil: "", conditions: "", approvals: "", assumptions: "" };

const pctOf = (s: string): number | undefined => { const n = Number(s); return s.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100 ? n / 100 : undefined; };
const intOf = (s: string): number | undefined => { const n = Number(s); return s.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 3650 ? n : undefined; };
const lines = (s: string): string[] => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** The terms actually stated; blank fields are left out. */
export function toTerms(d: IoiDraft): OfferTerms {
  const t: Record<string, unknown> = {
    cashPct: pctOf(d.cash), earnoutPct: pctOf(d.earnout), earnoutMonths: intOf(d.earnoutMonths), rolloverPct: pctOf(d.rollover),
    escrowPct: pctOf(d.escrow), escrowMonths: intOf(d.escrowMonths), indemnityCapPct: pctOf(d.cap), exclusivityDays: intOf(d.exclusivity),
    diligenceWeeks: intOf(d.diligence), financing: d.financing || undefined, validUntil: /^\d{4}-\d{2}-\d{2}$/.test(d.validUntil) ? d.validUntil : undefined,
    conditions: lines(d.conditions).length ? lines(d.conditions) : undefined, approvals: lines(d.approvals).length ? lines(d.approvals) : undefined,
    keyAssumptions: d.assumptions.trim() || undefined,
  };
  return Object.fromEntries(Object.entries(t).filter(([, v]) => v !== undefined)) as OfferTerms;
}

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2 py-1 text-[12px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const L = "mb-0.5 block text-[11px] text-xo-muted";

export const IoiTermsFields: React.FC<{ id: string; value: IoiDraft; onChange: (d: IoiDraft) => void }> = ({ id, value: d, onChange }) => {
  const f = (k: keyof IoiDraft, label: string, hint?: string): React.ReactNode => (
    <label className="block" htmlFor={`${id}-${k}`}><span className={L}>{label}{hint ? <span className="text-xo-faint"> · {hint}</span> : null}</span>
      <input id={`${id}-${k}`} className={INPUT} inputMode="decimal" value={d[k]} onChange={(e) => onChange({ ...d, [k]: e.target.value })} /></label>
  );
  return (
    <div className="mt-2 space-y-2 border border-xo-line px-3 py-2">
      <p className="text-[11px] text-xo-faint">Optional: the terms the process letter asks for. Leave a field blank if you are not stating it; the founder sees it as not stated.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {f("cash", "Cash at completion", "%")}{f("earnout", "Earn-out", "%")}{f("earnoutMonths", "Earn-out period", "months")}{f("rollover", "Management rollover", "%")}
        {f("escrow", "Escrow or holdback", "%")}{f("escrowMonths", "Escrow period", "months")}{f("cap", "Indemnity cap", "% of price")}{f("exclusivity", "Exclusivity sought", "days")}
        {f("diligence", "Confirmatory diligence", "weeks")}
        <label className="block" htmlFor={`${id}-financing`}><span className={L}>Financing</span>
          <select id={`${id}-financing`} className={INPUT} value={d.financing} onChange={(e) => onChange({ ...d, financing: e.target.value as IoiDraft["financing"] })}>
            <option value="">Not stated</option><option value="cash_on_hand">Cash on hand</option><option value="committed_debt">Committed debt</option>
            <option value="equity_commitment">Equity commitment</option><option value="subject_to_financing">Subject to financing</option>
          </select></label>
        <label className="block" htmlFor={`${id}-validUntil`}><span className={L}>Valid until</span><input id={`${id}-validUntil`} type="date" className={INPUT} value={d.validUntil} onChange={(e) => onChange({ ...d, validUntil: e.target.value })} /></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block" htmlFor={`${id}-conditions`}><span className={L}>Conditions (one per line)</span><textarea id={`${id}-conditions`} rows={2} className={INPUT} value={d.conditions} onChange={(e) => onChange({ ...d, conditions: e.target.value })} /></label>
        <label className="block" htmlFor={`${id}-approvals`}><span className={L}>Approvals required (one per line)</span><textarea id={`${id}-approvals`} rows={2} className={INPUT} value={d.approvals} onChange={(e) => onChange({ ...d, approvals: e.target.value })} /></label>
        <label className="block" htmlFor={`${id}-assumptions`}><span className={L}>Key assumptions</span><textarea id={`${id}-assumptions`} rows={2} className={INPUT} value={d.assumptions} onChange={(e) => onChange({ ...d, assumptions: e.target.value })} /></label>
      </div>
    </div>
  );
};
