import type { CompanyProfile, ProcessTimeline, SectionCoverage } from "@exit/engines";
import type { ContentSection } from "./ddm";

// ── TRANSACTION DOCUMENTS (deliverable 5, part 3) ───────────────────
// Built only from what the parties actually recorded: the bidders' offers (with the terms each
// bidder stated) and the seller's own negotiating positions. Nothing is filled in: a term a bidder
// did not state is "Not yet supplied by the bidder"; a position the seller has not set is not
// proposed. There are no universal negotiating positions (B-9): the 4% break fee, 10% indemnity
// cap and 8% escrow are gone. Legal instruments (term sheet, exclusivity) are drafts for counsel;
// binding provisions, governing law and conditions are for counsel to write and are stated as such.
// No document here gives price guidance; that needs its own approval and counsel review.

export type Financing = "cash_on_hand" | "committed_debt" | "equity_commitment" | "subject_to_financing";
export interface OfferTerms {
  readonly cashPct?: number; readonly stockPct?: number; readonly earnoutPct?: number; readonly earnoutMonths?: number;
  readonly rolloverPct?: number; readonly escrowPct?: number; readonly escrowMonths?: number; readonly indemnityCapPct?: number;
  readonly exclusivityDays?: number; readonly diligenceWeeks?: number; readonly financing?: Financing;
  readonly conditions?: readonly string[]; readonly approvals?: readonly string[]; readonly validUntil?: string; readonly keyAssumptions?: string;
}
export interface RecordedOffer {
  readonly id: string; readonly createdAt: string; readonly status: "submitted" | "accepted" | "rejected" | "withdrawn";
  readonly amountUsd: number; readonly note?: string | null; readonly terms?: OfferTerms;
}
/** The seller's own positions for this deal. Each is set deliberately or left unset; none has a default. */
export interface PositionValues {
  readonly headlineUsd?: number; readonly minCashPct?: number; readonly maxEscrowPct?: number; readonly maxEscrowMonths?: number;
  readonly maxIndemnityCapPct?: number; readonly maxExclusivityDays?: number; readonly maxEarnoutPct?: number; readonly reverseBreakFeePct?: number;
}
export interface NegotiationPositions { readonly values: PositionValues; readonly setAt?: string; readonly reviewedBy: "nobody" | "founder" | "counsel" }
export const NO_POSITIONS: NegotiationPositions = { values: {}, reviewedBy: "nobody" };

export interface TransactionDoc {
  readonly title: string; readonly subtitle?: string; readonly sections: ContentSection[];
  readonly coverage: SectionCoverage[]; readonly producedBy: string; readonly inputs: Record<string, unknown>;
  /** The document's basis, stated in its basis-and-limitations callout. */
  readonly notices?: readonly string[];
}

const usd = (n: number): string => `$${(n / 1e6).toFixed(1)}M`;
const pct = (n: number): string => `${Math.round(n * 1000) / 10}%`;
const NS = "Not yet supplied by the bidder";
const FIN: Record<Financing, string> = {
  cash_on_hand: "cash on hand", committed_debt: "committed debt financing", equity_commitment: "an equity commitment", subject_to_financing: "subject to financing being raised",
};
/** Bidders are named by the order their first offer arrived: never by identity. */
export function bidderLabels(offers: readonly RecordedOffer[]): Map<string, string> {
  return new Map([...offers].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((o, i) => [o.id, `Bidder ${String.fromCharCode(65 + (i % 26))}`]));
}
const termRows = (o: RecordedOffer): Array<[string, string]> => {
  const t = o.terms ?? {};
  return [
    ["Headline price proposed", usd(o.amountUsd)],
    ["Cash at completion", t.cashPct != null ? pct(t.cashPct) : NS],
    ["Shares in the buyer", t.stockPct != null ? pct(t.stockPct) : NS],
    ["Earn-out", t.earnoutPct != null ? `${pct(t.earnoutPct)}${t.earnoutMonths ? ` over ${t.earnoutMonths} months` : ""}` : NS],
    ["Management rollover", t.rolloverPct != null ? pct(t.rolloverPct) : NS],
    ["Escrow or holdback", t.escrowPct != null ? `${pct(t.escrowPct)}${t.escrowMonths ? ` for ${t.escrowMonths} months` : ""}` : NS],
    ["Indemnity cap", t.indemnityCapPct != null ? `${pct(t.indemnityCapPct)} of the price` : NS],
    ["Exclusivity requested", t.exclusivityDays != null ? `${t.exclusivityDays} days` : NS],
    ["Confirmatory diligence", t.diligenceWeeks != null ? `${t.diligenceWeeks} weeks` : NS],
    ["Financing", t.financing ? FIN[t.financing] : NS],
    ["Valid until", t.validUntil ?? NS],
  ];
};
const missingTerms = (o: RecordedOffer): string[] => termRows(o).filter(([, v]) => v === NS).map(([k]) => k.toLowerCase());
const cashAtCompletion = (o: RecordedOffer): number | null => (o.terms?.cashPct != null ? o.amountUsd * (o.terms.cashPct - (o.terms.escrowPct ?? 0)) : null);

// ── 1 · Process letter and bid instructions (buyers, under NDA) ─────
export function processLetter(company: CompanyProfile, timeline: ProcessTimeline, opts: { ioiDueDate?: string; contactName?: string } = {}): TransactionDoc {
  const ioi = timeline.milestones.find((m) => m.id === "ioi");
  const sections: ContentSection[] = [
    { heading: "Purpose of this letter", body: `${company.name} is considering a sale and has invited a small number of parties who have signed a confidentiality agreement to take part. This letter sets out how the process runs, what an indication of interest must contain and how to submit it.` },
    { heading: "Process and timeline",
      body: `The dates below follow ${timeline.basis.toLowerCase().startsWith("exitos default") ? "the company's planning timeline; they may move as the process develops" : "the company's timeline"}.`,
      table: { headers: ["Stage", "Weeks", "What happens"], rows: timeline.milestones.map((m) => [m.label, m.startWeek === m.endWeek ? `Week ${m.startWeek}` : `Weeks ${m.startWeek}–${m.endWeek}`, m.description]) } },
    { heading: "What an indication of interest must contain", bullets: [
      "The headline price proposed, on a cash-free, debt-free basis unless stated otherwise.",
      "The form of consideration: cash at completion, shares, earn-out, management rollover, each as a share of the price.",
      "Any escrow or holdback, the indemnity cap you would seek and the exclusivity period you would ask for.",
      "How the purchase would be financed, and any condition attached to the financing.",
      "The confirmatory diligence you would need and how long it would take.",
      "Internal and regulatory approvals required, and any other condition to proceeding.",
      "The key assumptions behind your proposal, and how long it remains valid.",
    ] },
    { heading: "How to submit", body: `Submit through ExitOS by ${opts.ioiDueDate ?? (ioi ? `the end of week ${ioi.endWeek}` : "the date notified to you")}, using the structured indication-of-interest form, so every proposal is recorded in the same terms. Proposals sent by other means may not be considered.${opts.contactName ? ` Questions go to ${opts.contactName}.` : ""}` },
    { heading: "Management meetings and diligence", body: "Management presentations are arranged with parties who remain in the process. Documents are released through the data room to parties with an executed confidentiality agreement; access is limited to the files the company discloses and can be withdrawn. Detailed diligence follows for the party chosen to proceed." },
    { heading: "Conduct of the process", bullets: [
      "Do not contact the company's employees, customers, suppliers or investors except through the channels this letter names.",
      "Treat this letter and the process itself as confidential under your confidentiality agreement.",
      "Each party bears its own costs.",
    ] },
    { heading: "Reservation of rights", body: "This letter is not an offer to sell and creates no obligation on the company or its shareholders. The company indicates no price. It may change the process, its timing or the parties invited, accept or reject any proposal, and end the process at any time without giving reasons. Only a signed definitive agreement would bind the parties." },
  ];
  return { title: "Process Letter and Bid Instructions", subtitle: company.name, sections,
    coverage: sections.map((s) => ({ section: s.heading, status: "supported" as const, missing: [] })),
    producedBy: "lib/documents/transaction-docs:processLetter", inputs: { timeline, opts } };
}

// ── 2 · Indication of interest, as recorded (seller) ────────────────
export function ioiRecord(company: CompanyProfile, offer: RecordedOffer, all: readonly RecordedOffer[]): TransactionDoc {
  const label = bidderLabels(all).get(offer.id) ?? "Bidder";
  const missing = missingTerms(offer);
  const cash = cashAtCompletion(offer);
  const sections: ContentSection[] = [
    { heading: "Summary", body: `${label} submitted an indication of interest of ${usd(offer.amountUsd)} for ${company.name} on ${offer.createdAt.slice(0, 10)}. Its status is ${offer.status}. This record restates what the bidder entered; it adds nothing.` },
    { heading: "Terms stated by the bidder", table: { headers: ["Term", "As stated"], rows: termRows(offer) } },
    { heading: "Cash at completion", body: cash != null ? `On the stated cash share less escrow, about ${usd(cash)} would be paid at completion, before transaction costs and adjustments.` : `Not yet supplied by the bidder: without the cash share the amount paid at completion cannot be worked out. Ask ${label} for it.` },
    { heading: "Conditions and approvals", ...(offer.terms?.conditions?.length || offer.terms?.approvals?.length
      ? { bullets: [...(offer.terms?.conditions ?? []).map((c) => `Condition: ${c}`), ...(offer.terms?.approvals ?? []).map((a) => `Approval: ${a}`)] }
      : { body: `Not yet supplied by the bidder: no conditions or approvals were stated. Ask ${label} to confirm whether there are none.` }) },
    { heading: "What to clarify", body: missing.length ? `Not yet supplied by the bidder: ${missing.join("; ")}. Ask ${label} to complete these before comparing proposals.` : "Every term the process letter asks for has been stated." },
  ];
  return { title: `Indication of Interest — ${label}`, subtitle: company.name, sections,
    coverage: [
      { section: "Summary", status: "supported", missing: [] },
      { section: "Terms stated by the bidder", status: missing.length ? "partial" : "supported", missing },
      { section: "Cash at completion", status: cash != null ? "supported" : "gap", missing: cash != null ? [] : ["cash share"] },
      { section: "Conditions and approvals", status: offer.terms?.conditions?.length || offer.terms?.approvals?.length ? "supported" : "gap", missing: [] },
      { section: "What to clarify", status: missing.length ? "gap" : "supported", missing },
    ],
    producedBy: "lib/documents/transaction-docs:ioiRecord", inputs: { offer } };
}

// ── 3 · Offer comparison (seller, from recorded offers only) ────────
export function offerComparison(company: CompanyProfile, offers: readonly RecordedOffer[], positions: NegotiationPositions = NO_POSITIONS): TransactionDoc {
  const live = offers.filter((o) => o.status === "submitted" || o.status === "accepted");
  if (!live.length) throw new Error("There is no recorded offer to compare.");
  const labels = bidderLabels(offers);
  const ordered = [...live].sort((a, b) => (labels.get(a.id) ?? "").localeCompare(labels.get(b.id) ?? ""));
  const rows = termRows(ordered[0]!).map(([term], i) => [term, ...ordered.map((o) => termRows(o)[i]![1].replace(NS, "not stated"))]);
  const p = positions.values;
  const against = ordered.map((o) => {
    const t = o.terms ?? {}; const notes: string[] = [];
    if (p.minCashPct != null && t.cashPct != null && t.cashPct < p.minCashPct) notes.push(`cash ${pct(t.cashPct)} is below your ${pct(p.minCashPct)}`);
    if (p.maxEscrowPct != null && t.escrowPct != null && t.escrowPct > p.maxEscrowPct) notes.push(`escrow ${pct(t.escrowPct)} is above your ${pct(p.maxEscrowPct)}`);
    if (p.maxIndemnityCapPct != null && t.indemnityCapPct != null && t.indemnityCapPct > p.maxIndemnityCapPct) notes.push(`indemnity cap ${pct(t.indemnityCapPct)} is above your ${pct(p.maxIndemnityCapPct)}`);
    if (p.maxExclusivityDays != null && t.exclusivityDays != null && t.exclusivityDays > p.maxExclusivityDays) notes.push(`exclusivity of ${t.exclusivityDays} days exceeds your ${p.maxExclusivityDays}`);
    if (p.maxEarnoutPct != null && t.earnoutPct != null && t.earnoutPct > p.maxEarnoutPct) notes.push(`earn-out ${pct(t.earnoutPct)} is above your ${pct(p.maxEarnoutPct)}`);
    return `${labels.get(o.id)}: ${notes.length ? notes.join("; ") : "within every position you have set"}.`;
  });
  const anyPositions = Object.values(p).some((v) => v != null);
  const sections: ContentSection[] = [
    { heading: "Summary", body: `${ordered.length} live proposal${ordered.length === 1 ? "" : "s"} recorded for ${company.name}. The table restates the terms each bidder gave, in one place; "not stated" means the bidder did not give that term. No ranking is implied.` },
    { heading: "Terms compared", table: { headers: ["Term", ...ordered.map((o) => labels.get(o.id)!)], rows } },
    { heading: "Cash at completion", body: ordered.map((o) => { const c = cashAtCompletion(o); return `${labels.get(o.id)}: ${c != null ? `about ${usd(c)} at completion` : "cannot be worked out until the bidder states its cash share"}.`; }).join(" ") },
    { heading: "Against your positions", ...(anyPositions ? { bullets: against } : { body: "Not yet supplied: you have not set any negotiating positions, so the proposals are not measured against them. Set them in the Bid Room; ExitOS proposes none." }) },
  ];
  return { title: "Offer Comparison", subtitle: company.name, sections,
    coverage: [
      { section: "Summary", status: "supported", missing: [] },
      { section: "Terms compared", status: ordered.some((o) => missingTerms(o).length) ? "partial" : "supported", missing: [] },
      { section: "Cash at completion", status: ordered.every((o) => cashAtCompletion(o) != null) ? "supported" : "partial", missing: [] },
      { section: "Against your positions", status: anyPositions ? "supported" : "gap", missing: anyPositions ? [] : ["negotiating positions"] },
    ],
    producedBy: "lib/documents/transaction-docs:offerComparison", inputs: { offers: ordered, positions } };
}

// position rows shared by the counter-offer and the term sheet
function positionRows(o: RecordedOffer, p: PositionValues): Array<[string, string, string]> {
  const t = o.terms ?? {};
  const row = (term: string, theirs: string, ours: string | null): [string, string, string] => [term, theirs, ours ?? "Not proposed"];
  return [
    row("Headline price", usd(o.amountUsd), p.headlineUsd != null ? usd(p.headlineUsd) : null),
    row("Cash at completion", t.cashPct != null ? pct(t.cashPct) : "not stated", p.minCashPct != null ? `at least ${pct(p.minCashPct)}` : null),
    row("Earn-out", t.earnoutPct != null ? pct(t.earnoutPct) : "not stated", p.maxEarnoutPct != null ? `no more than ${pct(p.maxEarnoutPct)}` : null),
    row("Escrow or holdback", t.escrowPct != null ? pct(t.escrowPct) : "not stated", p.maxEscrowPct != null ? `no more than ${pct(p.maxEscrowPct)}${p.maxEscrowMonths ? ` for ${p.maxEscrowMonths} months` : ""}` : null),
    row("Indemnity cap", t.indemnityCapPct != null ? pct(t.indemnityCapPct) : "not stated", p.maxIndemnityCapPct != null ? `no more than ${pct(p.maxIndemnityCapPct)} of the price` : null),
    row("Exclusivity", t.exclusivityDays != null ? `${t.exclusivityDays} days` : "not stated", p.maxExclusivityDays != null ? `no more than ${p.maxExclusivityDays} days` : null),
    row("Reverse break fee", "not stated", p.reverseBreakFeePct != null ? pct(p.reverseBreakFeePct) : null),
  ];
}
const reviewNote = (p: NegotiationPositions): string =>
  p.reviewedBy === "counsel" ? "The company's positions were reviewed by its counsel." : p.reviewedBy === "founder" ? "The company's positions were set by the founder and have not been reviewed by counsel." : "Not yet supplied: the company's positions have not been reviewed.";

// ── 4 · Counter-proposal (to one bidder) ────────────────────────────
export function counterOffer(company: CompanyProfile, offer: RecordedOffer, all: readonly RecordedOffer[], positions: NegotiationPositions): TransactionDoc {
  const label = bidderLabels(all).get(offer.id) ?? "the bidder";
  const rows = positionRows(offer, positions.values);
  const proposed = rows.filter((r) => r[2] !== "Not proposed");
  if (!proposed.length) throw new Error("Set at least one negotiating position before drafting a counter-proposal: ExitOS proposes none.");
  const sections: ContentSection[] = [
    { heading: "Summary", body: `${company.name} thanks ${label} for its indication of interest of ${usd(offer.amountUsd)} dated ${offer.createdAt.slice(0, 10)}, and responds on the terms below. This is a non-binding response to continue discussions; it is not an offer capable of acceptance.` },
    { heading: "Parties", bullets: [`${company.name}, the company, acting for its shareholders`, `${label}, the prospective buyer`] },
    { heading: "Proposed terms", table: { headers: ["Term", "Your proposal", "Our response"], rows }, body: "Where the response reads \"Not proposed\", the company has not taken a position and the term remains open for discussion." },
    { heading: "Timing and next steps", body: `Please respond through ExitOS. The company may continue discussions with other parties until exclusivity is agreed in writing. ${reviewNote(positions)}` },
  ];
  return { title: `Response to Indication of Interest — ${label}`, subtitle: company.name, sections,
    coverage: [
      { section: "Summary", status: "supported", missing: [] }, { section: "Parties", status: "supported", missing: [] },
      { section: "Proposed terms", status: proposed.length === rows.length ? "supported" : "partial", missing: rows.filter((r) => r[2] === "Not proposed").map((r) => r[0]) },
      { section: "Timing and next steps", status: positions.reviewedBy === "nobody" ? "partial" : "supported", missing: [] },
    ],
    producedBy: "lib/documents/transaction-docs:counterOffer", inputs: { offer, positions } };
}

// ── 5 · Term sheet / letter of intent, draft for counsel ────────────
export function termSheetDraft(company: CompanyProfile, offer: RecordedOffer, all: readonly RecordedOffer[], positions: NegotiationPositions): TransactionDoc {
  if (offer.status !== "accepted") throw new Error("A term sheet is drafted from the proposal the company accepted to take forward.");
  const label = bidderLabels(all).get(offer.id) ?? "the buyer";
  const t = offer.terms ?? {};
  const agreed = positionRows(offer, positions.values).map(([term, theirs, ours]) => [term, ours === "Not proposed" ? theirs : `${theirs}; the company asks ${ours}`]);
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Draft heads of terms for the proposed acquisition of ${company.name} by ${label}, prepared from ${label}'s indication of interest of ${usd(offer.amountUsd)} and the company's recorded positions, for the parties' counsel to complete. It is not a binding document and has not been reviewed by counsel.` },
    { heading: "Parties", bullets: [`Seller: the shareholders of ${company.name}`, `Company: ${company.name}`, `Buyer: ${label} (legal entity to be confirmed by the buyer)`] },
    { heading: "Commercial terms", table: { headers: ["Term", "Position"], rows: agreed } },
    { heading: "Conditions", ...(t.conditions?.length || t.approvals?.length ? { bullets: [...(t.conditions ?? []), ...(t.approvals ?? []).map((a) => `${a} (approval)`)] } : { body: "Not yet supplied by the bidder: no conditions stated. Counsel to confirm the conditions to signing and to completion." }) },
    { heading: "Term and exclusivity", body: t.exclusivityDays != null ? `${label} asks for ${t.exclusivityDays} days of exclusivity${positions.values.maxExclusivityDays != null ? `; the company's position is no more than ${positions.values.maxExclusivityDays} days` : ""}. Exclusivity would be agreed in a separate letter.` : "Not yet supplied by the bidder: no exclusivity period was requested." },
    { heading: "For counsel to draft", bullets: ["Which provisions bind (typically confidentiality, exclusivity, costs and governing law) and which do not.", "Governing law and jurisdiction.", "Warranty, indemnity and limitation framework consistent with the commercial terms above.", "Treatment of employees, option holders and management arrangements."] },
  ];
  return { title: `Draft Heads of Terms — ${label}`, subtitle: company.name, sections,
    coverage: [
      { section: "Summary", status: "supported", missing: [] }, { section: "Parties", status: "partial", missing: ["buyer legal entity"] },
      { section: "Commercial terms", status: missingTerms(offer).length ? "partial" : "supported", missing: missingTerms(offer) },
      { section: "Conditions", status: t.conditions?.length || t.approvals?.length ? "supported" : "gap", missing: [] },
      { section: "Term and exclusivity", status: t.exclusivityDays != null ? "supported" : "gap", missing: [] },
      { section: "For counsel to draft", status: "partial", missing: ["counsel drafting"] },
    ],
    producedBy: "lib/documents/transaction-docs:termSheetDraft", inputs: { offer, positions } };
}

// ── 6 · Exclusivity letter, draft for counsel ───────────────────────
export function exclusivityDraft(company: CompanyProfile, offer: RecordedOffer, all: readonly RecordedOffer[], positions: NegotiationPositions): TransactionDoc {
  if (offer.status !== "accepted") throw new Error("Exclusivity is drafted only for the proposal the company accepted to take forward.");
  const label = bidderLabels(all).get(offer.id) ?? "the buyer";
  const asked = offer.terms?.exclusivityDays; const cap = positions.values.maxExclusivityDays;
  const days = asked != null && cap != null ? Math.min(asked, cap) : (cap ?? asked);
  if (days == null) throw new Error("Neither the bidder nor the company has stated an exclusivity period.");
  const sections: ContentSection[] = [
    { heading: "Summary", body: `Draft exclusivity letter under which ${company.name} and its shareholders would negotiate only with ${label} for ${days} days, to allow confirmatory diligence and the definitive agreement. It is a draft for counsel and binds no one until signed.` },
    { heading: "Parties", bullets: [`${company.name} and its shareholders`, `${label} (legal entity to be confirmed)`] },
    { heading: "Obligations during exclusivity", bullets: [
      `The company will not solicit, encourage or negotiate any competing proposal for ${days} days from signature.`,
      `${label} will pursue confirmatory diligence and the definitive agreement diligently and in good faith.`,
      "Any approach from another party is to be declined; whether it must be disclosed to the buyer is for counsel to settle.",
    ] },
    { heading: "Term", body: `${days} days from signature${asked != null && cap != null && asked > cap ? ` (the bidder asked for ${asked}; the company's position is ${cap})` : ""}, ending early if either party withdraws in writing or the definitive agreement is signed. Counsel to settle extension and termination mechanics.` },
    { heading: "For counsel to draft", bullets: ["Governing law and jurisdiction.", "Whether a break fee or cost cover applies if the buyer withdraws.", "Confidentiality, which continues under the existing agreement."] },
  ];
  return { title: `Draft Exclusivity Letter — ${label}`, subtitle: company.name, sections,
    coverage: sections.map((s) => ({ section: s.heading, status: s.heading === "For counsel to draft" ? "partial" as const : "supported" as const, missing: [] })),
    producedBy: "lib/documents/transaction-docs:exclusivityDraft", inputs: { offer, positions, days } };
}
