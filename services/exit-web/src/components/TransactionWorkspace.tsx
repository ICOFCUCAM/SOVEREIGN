import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_PROCESS_TIMELINE } from "@exit/engines";
import { PageHeader, Section, Provenance } from "./xo";
import { DocumentVersions } from "./DocumentVersions";
import { loadActiveCompany } from "../lib/active-company";
import { findOwnListing, listingFromCompany } from "../lib/listings";
import { offersForListing } from "../lib/exit-api";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { gateDocument } from "../lib/documents/gate";
import { asMemorandum, toMarkdown } from "../lib/documents/transaction-doc-view";
import { loadPositions, savePositions } from "../lib/negotiation-positions";
import {
  processLetter, ioiRecord, offerComparison, counterOffer, termSheetDraft, exclusivityDraft, bidderLabels,
  type RecordedOffer, type TransactionDoc, type PositionValues, type NegotiationPositions,
} from "../lib/documents/transaction-docs";

// ── TRANSACTION WORKSPACE (founder) ─────────────────────────────────
// The bids recorded on the founder's listing, the founder's own negotiating positions, and the
// transaction documents built from them. A document that cannot be built yet says why; nothing is
// filled in with defaults. Price guidance is not offered: it needs its own approval and counsel review.

const INPUT = "w-full rounded-sm border border-xo-line bg-xo-ink px-2 py-1 text-[12px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-0.5 block text-[11px] text-xo-muted";
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

type DocKey = "process_letter" | "ioi" | "offer_comparison" | "counter_offer" | "loi" | "exclusivity";
const TYPE: Record<DocKey, string> = { process_letter: "exitos.process_letter", ioi: "exitos.ioi", offer_comparison: "exitos.offer_comparison", counter_offer: "exitos.counter_offer", loi: "exitos.loi", exclusivity: "exitos.exclusivity" };
const LABELS: Record<DocKey, string> = { process_letter: "Process letter and bid instructions", ioi: "Indication of interest (record)", offer_comparison: "Offer comparison", counter_offer: "Counter-proposal", loi: "Heads of terms (draft for counsel)", exclusivity: "Exclusivity letter (draft for counsel)" };
const POSITION_FIELDS: ReadonlyArray<readonly [keyof PositionValues, string, "usd" | "pct" | "int"]> = [
  ["headlineUsd", "Headline price you would counter at ($M)", "usd"], ["minCashPct", "Minimum cash at completion (%)", "pct"], ["maxEarnoutPct", "Maximum earn-out (%)", "pct"],
  ["maxEscrowPct", "Maximum escrow (%)", "pct"], ["maxEscrowMonths", "Maximum escrow period (months)", "int"], ["maxIndemnityCapPct", "Maximum indemnity cap (% of price)", "pct"],
  ["maxExclusivityDays", "Maximum exclusivity (days)", "int"], ["reverseBreakFeePct", "Reverse break fee you would ask (%)", "pct"],
];

export const TransactionWorkspace: React.FC = () => {
  const { company, companyId, unconfirmed } = useMemo(() => loadActiveCompany(), []);
  const listing = useMemo(() => findOwnListing(company) ?? listingFromCompany(company), [company]);
  const [offers, setOffers] = useState<RecordedOffer[]>([]);
  const [positions, setPositions] = useState<NegotiationPositions>(() => loadPositions(companyId));
  const [form, setForm] = useState<Record<string, string>>({});
  const [reviewedBy, setReviewedBy] = useState<NegotiationPositions["reviewedBy"]>(positions.reviewedBy === "nobody" ? "founder" : positions.reviewedBy);
  const [key, setKey] = useState<DocKey>("process_letter");
  const [offerId, setOfferId] = useState("");
  const refresh = useCallback(() => { void offersForListing(listing.id).then((o) => setOffers(o.map((x) => ({ id: x.id, createdAt: x.createdAt, status: x.status, amountUsd: x.amountUsd, note: x.note, ...(x.terms ? { terms: x.terms } : {}) })))).catch(() => setOffers([])); }, [listing.id]);
  useEffect(refresh, [refresh]);
  useEffect(() => {
    const v = positions.values; const f: Record<string, string> = {};
    for (const [k, , kind] of POSITION_FIELDS) { const n = v[k]; if (n != null) f[k] = kind === "usd" ? String(n / 1e6) : kind === "pct" ? String(Math.round(n * 1000) / 10) : String(n); }
    setForm(f);
  }, [positions]);

  const labels = bidderLabels(offers);
  const valuationMid = useMemo(() => canonicalValuationFor(company).headline.mid, [company]);
  const choices = offers.filter((o) => key === "counter_offer" ? o.status === "submitted" : key === "loi" || key === "exclusivity" ? o.status === "accepted" : true);
  const chosen = choices.find((o) => o.id === offerId) ?? choices[0];
  const built = useMemo((): { doc: TransactionDoc } | { why: string } => {
    try {
      if (key === "process_letter") return { doc: processLetter(company, DEFAULT_PROCESS_TIMELINE) };
      if (key === "offer_comparison") return { doc: offerComparison(company, offers, positions) };
      if (!chosen) return { why: key === "loi" || key === "exclusivity" ? "Accept a proposal in your Inbox first: drafts for counsel follow the proposal you take forward." : "No recorded offer to use yet." };
      if (key === "ioi") return { doc: ioiRecord(company, chosen, offers) };
      if (key === "counter_offer") return { doc: counterOffer(company, chosen, offers, positions) };
      if (key === "loi") return { doc: termSheetDraft(company, chosen, offers, positions) };
      return { doc: exclusivityDraft(company, chosen, offers, positions) };
    } catch (e) { return { why: e instanceof Error ? e.message : "This document cannot be built yet." }; }
  }, [key, company, offers, positions, chosen]);
  const doc = "doc" in built ? built.doc : null;
  const typeId = TYPE[key];
  const text = doc ? doc.sections.map((s) => [s.heading, s.body ?? "", ...(s.bullets ?? []), ...(s.table?.rows.flat() ?? [])].join("\n")).join("\n") : "";
  const gate = doc ? gateDocument(typeId, text, { company, unconfirmed, ...(key === "counter_offer" ? {} : { valuationMidUsd: valuationMid }) }) : null;

  const savePos = (): void => {
    if (!companyId) return;
    const values: Record<string, number> = {};
    for (const [k, , kind] of POSITION_FIELDS) { const raw = (form[k] ?? "").trim(); if (!raw) continue; const n = Number(raw); if (!Number.isFinite(n) || n < 0) continue; values[k] = kind === "usd" ? n * 1e6 : kind === "pct" ? n / 100 : Math.round(n); }
    setPositions(savePositions(companyId, values as PositionValues, reviewedBy));
  };

  return (
    <div data-page="bid-room" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Founder · Negotiation desk" title="Bid Room" badge={<Provenance kind="company" />}
        description={`The proposals buyers recorded on ${listing.code}, your own positions, and the transaction documents built from them.`} />
      <Section title="Recorded proposals" eyebrow={`${offers.length} on your listing`} className="border border-xo-line"
        foot="Bidders are shown by letter in the order they arrived, never by identity. Accept or reject proposals in your Inbox; a bidder's terms are its own and cannot be edited here.">
        {offers.length === 0 ? <p className="px-4 py-3 text-[12px] text-xo-faint">No proposals recorded yet. Buyers submit them, with their terms, from the Acquisition Radar.</p> : (
          <ul className="divide-y divide-xo-line">{[...offers].sort((a, b) => (labels.get(a.id) ?? "").localeCompare(labels.get(b.id) ?? "")).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px]">
              <span><span className="font-semibold">{labels.get(o.id)}</span> · ${(o.amountUsd / 1e6).toFixed(1)}M · {o.status} · {o.createdAt.slice(0, 10)}</span>
              <span className="text-xo-faint">{o.terms ? `${Object.keys(o.terms).length} terms stated` : "amount only"}</span>
            </li>))}</ul>
        )}
      </Section>
      <Section title="Your negotiating positions" eyebrow={positions.setAt ? `set ${positions.setAt} · ${positions.reviewedBy === "counsel" ? "reviewed by counsel" : "set by you, not reviewed by counsel"}` : "none set"} className="border border-xo-line"
        foot="ExitOS proposes no position. A position you leave blank is not proposed in any document. Positions stay in this browser and reach a buyer only as the terms a counter-proposal states.">
        <form className="space-y-2 px-4 py-3" onSubmit={(e) => { e.preventDefault(); savePos(); }}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{POSITION_FIELDS.map(([k, label]) => (
            <label key={k} className="block" htmlFor={`pos-${k}`}><span className={LABEL}>{label}</span><input id={`pos-${k}`} className={INPUT} inputMode="decimal" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}</div>
          <label className="block max-w-xs" htmlFor="pos-review"><span className={LABEL}>Who has reviewed these positions</span>
            <select id="pos-review" className={INPUT} value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value as NegotiationPositions["reviewedBy"])}>
              <option value="founder">Only me</option><option value="counsel">My counsel (you confirm this)</option>
            </select></label>
          <button type="submit" className={BTN} disabled={!companyId}>Save positions</button>
          {!companyId && <p className="text-[12px] text-xo-caution">Save your company intake first.</p>}
        </form>
      </Section>
      <Section title="Transaction documents" eyebrow="from the records above" className="border border-xo-line">
        <div className="space-y-3 px-4 py-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Transaction documents">{(Object.keys(LABELS) as DocKey[]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={key === k} onClick={() => { setKey(k); setOfferId(""); }} className={`${BTN} ${key === k ? "border-xo-action text-xo-action" : ""}`}>{LABELS[k]}</button>
          ))}</div>
          {(key === "ioi" || key === "counter_offer" || key === "loi" || key === "exclusivity") && choices.length > 1 && (
            <label className="block max-w-xs" htmlFor="tx-offer"><span className={LABEL}>Proposal</span>
              <select id="tx-offer" className={INPUT} value={chosen?.id ?? ""} onChange={(e) => setOfferId(e.target.value)}>
                {choices.map((o) => <option key={o.id} value={o.id}>{labels.get(o.id)} · ${(o.amountUsd / 1e6).toFixed(1)}M</option>)}
              </select></label>
          )}
          {"why" in built ? <p className="text-[12px] text-xo-caution">{built.why}</p> : doc && (
            <>
              <article className="max-h-[28rem] overflow-auto border border-xo-line bg-xo-ink px-4 py-3 text-[13px]" aria-label="Preview">
                <h3 className="font-serif text-[18px] font-semibold">{doc.title}</h3>
                {doc.sections.map((s) => (
                  <section key={s.heading} className="mt-3">
                    <h4 className="text-[13px] font-semibold">{s.heading}</h4>
                    {s.body && <p className="mt-1 text-xo-muted">{s.body}</p>}
                    {s.bullets && <ul className="mt-1 list-disc pl-5 text-xo-muted">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
                    {s.table && <table className="mt-1 w-full text-[12px]"><thead><tr>{s.table.headers.map((h) => <th key={h} className="border-b border-xo-line py-1 text-left font-medium">{h}</th>)}</tr></thead>
                      <tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-xo-line py-1 pr-2 text-xo-muted">{c}</td>)}</tr>)}</tbody></table>}
                  </section>
                ))}
              </article>
              <DocumentVersions typeId={typeId} doc={asMemorandum(key, doc)} gate={gate} company={company} companyId={companyId} unconfirmed={unconfirmed}
                inputs={doc.inputs} ownerName={company.name} codeName={listing.code} markdown={toMarkdown(typeId, doc, "Draft prepared in ExitOS from the recorded offers and the company's own positions.")}
                {...(key === "counter_offer" ? {} : { valuationMidUsd: valuationMid })} />
            </>
          )}
        </div>
      </Section>
    </div>
  );
};
