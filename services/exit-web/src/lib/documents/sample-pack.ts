import { TemplateMemorandumGenerator, DEFAULT_PROCESS_TIMELINE, EMPTY_STORY, type CompanyProfile, type CompanyStory, type MemorandumInputs, type MemorandumKind, type SectionCoverage } from "@exit/engines";
import { buildProfile, SAMPLE_INTAKE } from "../company-intake";
import { memorandumInputs } from "./memorandum-inputs";
import { NORTHWIND_STORY } from "./sample-story";
import { closingChecklistSections } from "../closing-checklist";
import { buildBoardMemo } from "../report-docs";
import { boardMemoToDdm } from "../dispatch-ddm";
import { generateVersion, type DocumentVersion } from "./service";
import type { Truth } from "./consistency";
import { processLetter, ioiRecord, offerComparison, counterOffer, termSheetDraft, exclusivityDraft, NO_POSITIONS, type RecordedOffer, type NegotiationPositions, type TransactionDoc } from "./transaction-docs";
import { spaBrief, fundsFlow, bringDownDraft, conditionsRegister, postClosingRegister, announcementDraft } from "./closing-docs";
import type { TransactionRecord, TxnItem } from "../transactions";

// ── SAMPLE PACK ─────────────────────────────────────────────────────
// Every document the generation service produces, for two fictional companies
// entered as founders would enter them (no demo values): one with a complete
// company story and source documents, one with only the headline intake — so
// both full documents and gap handling are reviewed. Deterministic: a fixed
// date, fixed inputs.

export interface PackCompany {
  readonly key: string; readonly company: CompanyProfile; readonly codeName: string; readonly story: CompanyStory; readonly offers: readonly RecordedOffer[]; readonly positions: NegotiationPositions;
  /** A transaction carried to completion on the accepted offer, as the server would return it; the buyer named as the seller typed it. */
  readonly transaction?: { readonly record: TransactionRecord; readonly buyerName: string };
}

// a closed transaction as exitos_transactions returns it: standard conditions evidenced and confirmed (one waived by both
// parties, one the parties added), matching confirmations, and the post-closing obligations created at completion
export function sampleClosedTransaction(offer: RecordedOffer): TransactionRecord {
  const S = "acct-seller", B = "acct-buyer", T = "txn-sample";
  const item = (n: number, gate: TxnItem["gate"], title: string, owner: TxnItem["owner_party"], extra: Partial<TxnItem> = {}): TxnItem => ({
    id: `item-${n}`, transaction_id: T, gate, title, owner_party: owner, required: true, due_date: null, source: "standard", status: "satisfied",
    evidence: { description: "Recorded by the owning party" }, evidenced_by: owner === "buyer" ? B : S, evidenced_at: "2026-10-20T10:00:00Z",
    confirmed_by: owner === "buyer" ? S : B, confirmed_at: "2026-10-21T10:00:00Z", waiver_requested_by: null, note: null, created_by: S, created_at: "2026-10-14T09:00:00Z", ...extra,
  });
  const ev = (description: string, documentName?: string): TxnItem["evidence"] => ({ description, ...(documentName ? { documentName } : {}) });
  const items: TxnItem[] = [
    item(1, "signing", "Definitive agreement in agreed form, approved by both parties' counsel", "both", { evidence: ev("Agreed form circulated by both firms of counsel", "SPA agreed form v7") }),
    item(2, "signing", "Disclosure letter or schedules delivered against the warranties", "seller", { evidence: ev("Disclosure letter delivered with its bundle", "Disclosure letter") }),
    item(3, "signing", "Shareholder approvals at the thresholds the company's documents require", "seller", { evidence: ev("Written resolution passed by 92% of the shares") }),
    item(4, "signing", "Buyer board or investment committee approval", "buyer", { evidence: ev("Board minutes approving the acquisition") }),
    item(5, "closing", "Regulatory clearances and third-party consents required for completion", "both", { status: "waived", evidence: null, evidenced_by: null, evidenced_at: null, waiver_requested_by: B,
      note: "Counsel advised that no clearance applies / agreed" }),
    item(6, "closing", "Bring-down of warranties at completion", "seller", { evidence: ev("Bring-down certificate signed by the chief executive") }),
    item(7, "closing", "Funds flow agreed, including escrow and any holdback", "both", { evidence: ev("Funds flow schedule agreed by both parties", "Funds flow v3") }),
    item(8, "closing", "Completion deliverables exchanged (resignations, share transfer forms, board minutes)", "both", { evidence: ev("Completion bundle exchanged by counsel") }),
    item(9, "closing", "Escrow agent engaged and escrow account opened", "buyer", { evidence: ev("Escrow agreement signed with the escrow agent") }),
    item(10, "closing", "Assignment of the two largest customer contracts acknowledged", "seller", { source: "added", evidence: ev("Customer acknowledgement letters") }),
    item(11, "post_closing", "Release of the escrow (8.0% of the price) unless claims are notified", "both", { source: "from_terms", due_date: "2028-05-04", status: "open", evidence: null, evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null }),
    item(12, "post_closing", "Earn-out measurement and payment (10.0% of the price)", "buyer", { source: "from_terms", due_date: "2028-11-04", status: "open", evidence: null, evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null }),
    item(13, "post_closing", "Confidentiality obligations under the NDA continue for its survival period", "both", { source: "from_terms", due_date: "2028-11-04", status: "open", evidence: null, evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null }),
    item(14, "post_closing", "Transitional services for finance systems", "seller", { source: "added", due_date: null, status: "open", evidence: null, evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null }),
  ];
  const H = "4f1c9e0a7b2d3c5e6f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6";
  return {
    txn: { id: T, listing_id: "lst-sample", company_id: "co-sample-full", seller_account_id: S, buyer_account_id: B, offer_id: offer.id, nda_agreement_id: "nda-sample",
      price_usd: offer.amountUsd, terms: offer.terms ?? {}, state: "closed", created_at: "2026-10-14T09:00:00Z", signed_at: "2026-10-28T16:00:00Z", closed_at: "2026-11-04T12:00:00Z",
      ended_at: null, ended_by: null, end_reason: null },
    items,
    confirmations: [
      { transaction_id: T, milestone: "signing", party: "seller", account_id: S, evidence: { signatoryName: "Ada Park", documentSha256: H, amountUsd: "", reference: "" }, confirmed_at: "2026-10-28T15:00:00Z" },
      { transaction_id: T, milestone: "signing", party: "buyer", account_id: B, evidence: { signatoryName: "Jonas Weir", documentSha256: H, amountUsd: "", reference: "" }, confirmed_at: "2026-10-28T16:00:00Z" },
      { transaction_id: T, milestone: "closing", party: "seller", account_id: S, evidence: { amountUsd: "86240000", reference: "CHAPS 04NOV-7731", signatoryName: "", documentSha256: "" }, confirmed_at: "2026-11-04T11:30:00Z" },
      { transaction_id: T, milestone: "closing", party: "buyer", account_id: B, evidence: { amountUsd: "86240000", reference: "Wire 2026-11-04 / KH-55", signatoryName: "", documentSha256: "" }, confirmed_at: "2026-11-04T12:00:00Z" },
    ],
    events: [],
  };
}

export const SAMPLE_PACK_COMPANIES: readonly PackCompany[] = [
  {
    key: "full", codeName: "Project Meridian", story: NORTHWIND_STORY,
    offers: [
      { id: "off-a", createdAt: "2026-10-02T09:00:00Z", status: "accepted", amountUsd: 112_000_000, terms: {
        cashPct: 0.85, stockPct: 0, earnoutPct: 0.1, earnoutMonths: 24, rolloverPct: 0.05, escrowPct: 0.08, escrowMonths: 18, indemnityCapPct: 0.15,
        exclusivityDays: 60, diligenceWeeks: 6, financing: "cash_on_hand", conditions: ["Satisfactory confirmatory diligence", "Retention of the two founders for 24 months"],
        approvals: ["Buyer board approval", "Merger control clearance where required"], validUntil: "2026-11-15", keyAssumptions: "Net working capital at a normal level; no debt at completion" } },
      { id: "off-b", createdAt: "2026-10-04T15:30:00Z", status: "submitted", amountUsd: 104_000_000, terms: {
        cashPct: 0.7, earnoutPct: 0.3, earnoutMonths: 36, exclusivityDays: 90, financing: "committed_debt", validUntil: "2026-11-01" } },
    ],
    positions: { values: { headlineUsd: 118_000_000, minCashPct: 0.8, maxEarnoutPct: 0.15, maxEscrowPct: 0.05, maxEscrowMonths: 12, maxIndemnityCapPct: 0.1, maxExclusivityDays: 45 },
      setAt: "2026-10-05", reviewedBy: "founder" },
    get transaction() { return { record: sampleClosedTransaction(this.offers[0]!), buyerName: "Kestrel Health Systems" }; },
    company: { ...buildProfile({
      ...SAMPLE_INTAKE, name: "Northwind Analytics", jurisdiction: "GB", sector: "vertical_saas", foundedYear: 2016,
      ttmRevenueUsd: 24_600_000, arrUsd: 21_800_000, growthPct: 0.36, grossMarginPct: 0.78, ebitdaMarginPct: 0.14,
      netRetentionPct: 1.17, customerConcentrationPct: 0.22, totalCustomers: 640, hasNetworkEffects: false, hasDataMoat: true,
    }), id: "co-sample-full" },
  },
  {
    key: "minimal", codeName: "Project Atlas", story: EMPTY_STORY,
    offers: [{ id: "off-c", createdAt: "2026-10-06T11:00:00Z", status: "submitted", amountUsd: 41_000_000 }],
    positions: NO_POSITIONS,
    company: { ...buildProfile({
      ...SAMPLE_INTAKE, name: "Calder Freight Software", jurisdiction: "DE", sector: "logistics_freight", foundedYear: 2014,
      ttmRevenueUsd: 11_300_000, arrUsd: 8_900_000, growthPct: 0.19, grossMarginPct: 0.61, ebitdaMarginPct: -0.04,
      netRetentionPct: 1.02, customerConcentrationPct: 0.41, totalCustomers: 210, hasNetworkEffects: false, hasDataMoat: false,
    }), id: "co-sample-minimal" },
  },
];

const MEMORANDA: ReadonlyArray<readonly [MemorandumKind, string]> = [
  ["cim", "exitos.cim"], ["executive_summary", "exitos.executive_summary"], ["investor_deck", "exitos.investor_deck"],
  ["buyer_teaser", "exitos.teaser"], ["dd_room_index", "exitos.data_room_index"],
];

export interface PackItem { readonly version: DocumentVersion; readonly anonymized: boolean; readonly slug: string; readonly company: string; readonly coverage?: readonly SectionCoverage[] }

/** One company's documents and the truth they are checked against. */
export async function buildCompanyPack(pc: PackCompany): Promise<{ items: PackItem[]; truth: Truth }> {
  const shared = memorandumInputs(pc.company, true, pc.story);
  const company = shared.company!;
  const valuation = shared.valuation!;
  const now = new Date("2026-10-13T12:00:00Z");
  const common = { company, companyId: company.id ?? null, unconfirmed: [] as never[], generatedBy: "sample-pack", valuationMidUsd: valuation.headline.mid, now };
  const inputs = { ...(shared as MemorandumInputs), codeName: pc.codeName };
  const gen = new TemplateMemorandumGenerator();
  const items: PackItem[] = [];
  for (const [kind, typeId] of MEMORANDA) {
    const d = await gen.generate(kind, inputs);
    const v = await generateVersion({ ...common, typeId, title: d.title, sections: d.sections, producedBy: d.producedBy, inputs: { kind, story: pc.story }, ownerName: d.anonymized ? pc.codeName : company.name });
    items.push({ version: v, anonymized: d.anonymized, slug: kind, company: pc.key, ...(d.coverage ? { coverage: d.coverage } : {}) });
  }
  items.push({
    version: await generateVersion({ ...common, typeId: "exitos.closing_checklist", title: `Closing Checklist — ${company.name}`, subtitle: "Signature, escrow and filing items to the wire",
      sections: closingChecklistSections({}), producedBy: "lib/closing-checklist", inputs: { statuses: {} }, ownerName: company.name }),
    anonymized: false, slug: "closing_checklist", company: pc.key,
  });
  const memo = buildBoardMemo(company, shared.assumed ?? []);
  items.push({
    version: await generateVersion({ ...common, typeId: "exitos.board_memo_process", title: "Board Transaction Memorandum", sections: [],
      ddm: boardMemoToDdm(memo) as never, producedBy: "lib/report-docs:buildBoardMemo", inputs: { memo }, ownerName: company.name }),
    anonymized: false, slug: "board_memo", company: pc.key,
  });
  // transaction documents, from the recorded offers and the company's own positions
  // a counter-proposal states the seller's proposed price by design, so it is not matched against the valuation figure
  const noValuation: Omit<typeof common, "valuationMidUsd"> = { company: common.company, companyId: common.companyId, unconfirmed: common.unconfirmed, generatedBy: common.generatedBy, now: common.now };
  const tx = async (typeId: string, slug: string, d: TransactionDoc): Promise<void> => {
    items.push({ version: await generateVersion({ ...(typeId === "exitos.counter_offer" ? noValuation : common), typeId, title: d.title, ...(d.subtitle ? { subtitle: d.subtitle } : {}),
      sections: d.sections, producedBy: d.producedBy, inputs: d.inputs, ...(d.notices ? { notices: d.notices } : {}), ownerName: company.name }), anonymized: false, slug, company: pc.key, coverage: d.coverage });
  };
  const accepted = pc.offers.find((o) => o.status === "accepted");
  const open = pc.offers.find((o) => o.status === "submitted");
  await tx("exitos.process_letter", "process_letter", processLetter(company, DEFAULT_PROCESS_TIMELINE, { ioiDueDate: "6 November 2026" }));
  await tx("exitos.ioi", "ioi", ioiRecord(company, accepted ?? open!, pc.offers));
  await tx("exitos.offer_comparison", "offer_comparison", offerComparison(company, pc.offers, pc.positions));
  if (open && Object.values(pc.positions.values).some((v) => v != null)) await tx("exitos.counter_offer", "counter_offer", counterOffer(company, open, pc.offers, pc.positions));
  if (accepted) {
    await tx("exitos.loi", "loi", termSheetDraft(company, accepted, pc.offers, pc.positions));
    await tx("exitos.exclusivity", "exclusivity", exclusivityDraft(company, accepted, pc.offers, pc.positions));
  }
  // closing documents, from the transaction record alone
  if (pc.transaction) {
    const input = { company, record: pc.transaction.record, buyerLabel: pc.transaction.buyerName };
    await tx("exitos.spa", "spa_brief", spaBrief(input));
    await tx("exitos.funds_flow", "funds_flow", fundsFlow(input));
    await tx("exitos.bring_down_certificate", "bring_down", bringDownDraft(input));
    await tx("exitos.filings_checklist", "conditions_register", conditionsRegister(input));
    await tx("exitos.post_closing_register", "post_closing", postClosingRegister(input));
    await tx("exitos.announcement", "announcement", announcementDraft(input));
  }
  const h = valuation.headline;
  return { items, truth: { company, codeName: pc.codeName, valuation: { low: h.low, mid: h.mid, high: h.high }, timeline: DEFAULT_PROCESS_TIMELINE, story: pc.story, assumed: shared.assumed ?? [] } };
}
