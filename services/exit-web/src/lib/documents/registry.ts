import type { IntakeField } from "../active-company";

// ── DOCUMENT REGISTRY ───────────────────────────────────────────────
// One canonical entry per document type ExitOS generates, drafts, tracks,
// requests or expects from counsel, from the first valuation to the
// obligations after closing. It is the machine-readable inventory of the
// document system: every generator and page should be reachable from an
// entry here, and every claim the product makes about a document should be
// true of its entry.
//
// Stable ids (`exitos.<name>`) identify a type; titles and filenames may
// change. `status` is what exists in code today — never what is planned.
// `defects` are finding ids in docs/documents/IMPLEMENTATION_PLAN.md.

export const REGISTRY_SCHEMA_VERSION = "1.0.0";

export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const STAGE_NAME: Record<Stage, string> = {
  1: "Valuation and buyer intelligence",
  2: "Preparation and board authority",
  3: "Marketing and buyer outreach",
  4: "Confidentiality and NDA",
  5: "Due diligence and data room",
  6: "Offers and negotiation",
  7: "Signing and closing",
  8: "Post-closing and wealth transition",
};

/** Who may receive it. Drives the disclosure gate. */
export type Classification =
  | "public"                 // anyone, including the open web (listing post)
  | "pre_nda"                // named buyers before an NDA: code name, brackets and ratios only
  | "internal"               // the seller's own team and advisers
  | "board"                  // the seller's board
  | "confidential_nda"       // buyers under an executed NDA
  | "restricted_parties";    // the transaction parties and their counsel only

export type Audience = "founder" | "board" | "buyers" | "buyer" | "counsel" | "parties" | "public";

/** What ExitOS does with it. */
export type Kind =
  | "generated"              // ExitOS composes it from data
  | "drafted"                // ExitOS composes a draft the founder edits and sends
  | "tracked"                // ExitOS records its status only; no document is produced
  | "requested"              // supplied by the company or a counterparty (uploads)
  | "counsel";               // drafted by counsel; ExitOS prepares inputs and tracks versions

/** Formats that exist today. "print" is the browser's print dialog, not a generated PDF. */
export type Format = "screen" | "print" | "md" | "txt" | "csv" | "json" | "ics" | "clipboard" | "share";

export type Status = "built" | "partial" | "not_built" | "dead_code";

export interface DocumentType {
  readonly id: `exitos.${string}`;
  readonly title: string;
  readonly stage: Stage;
  readonly audience: Audience;
  readonly kind: Kind;
  readonly classification: Classification;
  /** Intake fields the document's figures depend on; unconfirmed ones make it a draft. */
  readonly inputs: readonly IntakeField[];
  readonly source: string | null;           // file:symbol, or null when not built
  readonly formats: readonly Format[];
  readonly status: Status;
  readonly dependsOn?: readonly string[];
  readonly reviewRequired?: "counsel" | "board" | "founder";
  readonly executionRequired?: boolean;     // signed by parties to take effect
  readonly defects?: readonly string[];
  readonly note?: string;
}

const FIN: IntakeField[] = ["name", "jurisdiction", "sector", "foundedYear", "ttmRevenueUsd", "arrUsd", "growthPct", "grossMarginPct", "ebitdaMarginPct", "netRetentionPct", "customerConcentrationPct", "totalCustomers"];
const BAND: IntakeField[] = ["sector", "jurisdiction", "ttmRevenueUsd", "arrUsd", "growthPct"];
const RATIOS: IntakeField[] = ["sector", "growthPct", "grossMarginPct", "ebitdaMarginPct", "netRetentionPct"];

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  // ── 1 · Valuation and buyer intelligence ──
  { id: "exitos.valuation_report", title: "Valuation Report", stage: 1, audience: "board", kind: "generated", classification: "board", inputs: FIN,
    source: "lib/report-model.ts:buildValuationReport → pages/Report.tsx", formats: ["screen", "print"], status: "built", defects: ["B-11"] },
  { id: "exitos.valuation_summary", title: "Institutional Valuation Summary", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/deliverables.ts:institutionalValuationMemo", formats: ["md"], status: "built", defects: ["B-13"] },
  { id: "exitos.valuation_model", title: "Valuation model data", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "pages/Valuation.tsx (Export data)", formats: ["json"], status: "built" },
  { id: "exitos.market_report", title: "Market Intelligence Report", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: [],
    source: "lib/report-docs.ts:buildMarketReport", formats: ["screen", "print"], status: "built", note: "Market-wide, not company-specific." },
  { id: "exitos.buyer_intel_report", title: "Buyer Intelligence Report", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: ["sector", "ttmRevenueUsd"],
    source: "lib/report-docs.ts:buildBuyerIntelReport", formats: ["screen", "print"], status: "built" },
  { id: "exitos.buyer_briefing", title: "Buyer Briefing Book", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: ["sector", "ttmRevenueUsd"],
    source: "lib/report-docs.ts:buildBuyerBriefing", formats: ["screen", "print"], status: "built" },
  { id: "exitos.valuation_memo_legacy", title: "Valuation Memo (legacy)", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/deliverables.ts:valuationMemo", formats: [], status: "dead_code", defects: ["D-5"], note: "Never called; superseded by the valuation summary." },
  { id: "exitos.traced_suite", title: "Traced document suite (9 kinds)", stage: 1, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "exit-engines documents/engine.ts:renderDocumentSuite", formats: [], status: "dead_code", defects: ["D-5"], note: "Computed, never rendered; its provenance model is input to the registry." },

  // ── 2 · Preparation and board authority ──
  { id: "exitos.readiness_report", title: "Acquisition Readiness Report", stage: 2, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/report-docs.ts:buildReadinessReport", formats: ["screen", "print"], status: "built" },
  { id: "exitos.board_memo_process", title: "Board Transaction Memorandum (authority to launch a process)", stage: 2, audience: "board", kind: "generated", classification: "board", inputs: FIN,
    source: "lib/report-docs.ts:buildBoardMemo", formats: ["screen", "print"], status: "built", reviewRequired: "board", executionRequired: true,
    defects: ["D-4"], note: "Authorises launching a sale process; it is not a resolution approving a transaction. Real PDF only via Dispatch when configured." },
  { id: "exitos.diligence_report", title: "Vendor Due-Diligence Report", stage: 2, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/report-docs.ts:buildDiligenceReport", formats: ["screen", "print"], status: "built" },
  { id: "exitos.diligence_findings", title: "Diligence findings reports (six)", stage: 2, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/diligence-intel.ts:allReports → pages/DiligenceAI.tsx", formats: ["md", "json"], status: "built", defects: ["A-6"] },
  { id: "exitos.seller_diligence_report", title: "Seller Diligence Report", stage: 2, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "lib/deliverables.ts:riskReportDoc", formats: ["md"], status: "built" },
  { id: "exitos.consistency_check", title: "Document consistency check", stage: 2, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "pages/Documents.tsx:redTeam", formats: ["screen"], status: "partial", note: "Four checks only; the cross-document engine is deliverable 5." },

  // ── 3 · Marketing and buyer outreach ──
  { id: "exitos.listing_post", title: "Exchange listing post", stage: 3, audience: "public", kind: "generated", classification: "public", inputs: BAND,
    source: "lib/social-publish.ts:buildListingPost", formats: ["clipboard", "share"], status: "built", dependsOn: ["exitos.listing"] },
  { id: "exitos.listing", title: "Anonymised exchange listing", stage: 3, audience: "buyers", kind: "tracked", classification: "pre_nda", inputs: BAND,
    source: "lib/listings.ts:listingFromCompany", formats: ["screen"], status: "built" },
  { id: "exitos.teaser", title: "Anonymised buyer teaser", stage: 3, audience: "buyers", kind: "generated", classification: "pre_nda", inputs: RATIOS,
    source: "exit-engines memorandum/template.ts:buyerTeaser", formats: ["screen", "md"], status: "built", dependsOn: ["exitos.listing"], defects: ["D-3"] },
  { id: "exitos.intro_letter", title: "Buyer introduction letter", stage: 3, audience: "buyer", kind: "drafted", classification: "pre_nda", inputs: ["sector"],
    source: "lib/deliverables.ts:buyerIntroLetter", formats: ["txt"], status: "built", dependsOn: ["exitos.listing"] },
  { id: "exitos.warm_intro", title: "Warm introduction email", stage: 3, audience: "buyer", kind: "drafted", classification: "pre_nda", inputs: ["sector", "arrUsd", "growthPct"],
    source: "lib/warm-intro.ts:warmIntro", formats: ["clipboard"], status: "built" },
  { id: "exitos.cim", title: "Confidential Information Memorandum", stage: 3, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: FIN,
    source: "exit-engines memorandum/template.ts:cim (Document Generator, Banker, /report/cim print view with exhibits)", formats: ["screen", "md", "print"], status: "built",
    dependsOn: ["exitos.nda"], note: "One CIM: the report page renders the engine CIM's sections and tables. States no valuation or price (owner decision); seller intelligence stays in the valuation report and board materials." },
  { id: "exitos.executive_summary", title: "Executive Summary", stage: 3, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: FIN,
    source: "exit-engines memorandum/template.ts:executiveSummary", formats: ["screen", "md"], status: "built", dependsOn: ["exitos.nda"], defects: ["D-3"] },
  { id: "exitos.investor_deck", title: "Investor deck outline", stage: 3, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: FIN,
    source: "exit-engines memorandum/template.ts:investorDeck", formats: ["screen", "md"], status: "partial", defects: ["B-10", "D-3"], note: "A ten-slide text outline, not slides." },
  { id: "exitos.management_presentation", title: "Management Presentation", stage: 3, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: FIN,
    source: "pages/ReportManagement.tsx (renders the engine investor deck)", formats: ["screen", "print"], status: "built", dependsOn: ["exitos.nda"],
    note: "Buyer-facing: states no valuation, price guidance, buyer ranking or readiness advice." },
  { id: "exitos.price_guidance", title: "Price guidance letter", stage: 3, audience: "buyers", kind: "drafted", classification: "restricted_parties", inputs: [],
    source: null, formats: [], status: "not_built", reviewRequired: "counsel", dependsOn: ["exitos.valuation_report"],
    note: "Only if the seller chooses to give price guidance: a separate, approved document sent to named parties. The CIM and other buyer materials never state a price." },
  { id: "exitos.buyer_target_list", title: "Buyer target list", stage: 3, audience: "founder", kind: "generated", classification: "internal", inputs: ["sector", "ttmRevenueUsd"],
    source: "lib/deliverables.ts:buyerShortlistMemo", formats: ["md"], status: "built" },
  { id: "exitos.buyer_shortlist_csv", title: "Buyer shortlist", stage: 3, audience: "founder", kind: "generated", classification: "internal", inputs: ["sector", "ttmRevenueUsd"],
    source: "lib/deliverables.ts:buyerListCsv", formats: ["csv"], status: "built", defects: ["B-13"] },
  { id: "exitos.outreach_plan", title: "Outreach plan", stage: 3, audience: "founder", kind: "drafted", classification: "internal", inputs: ["sector"],
    source: "lib/deliverables.ts:outreachPlanDoc; pages/Banker.tsx (campaign); lib/outreach-plan.ts (waves)", formats: ["md", "screen"], status: "partial", defects: ["D-3"],
    note: "Three overlapping outreach plans." },
  { id: "exitos.process_letter", title: "Process letter and bid instructions", stage: 3, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: [],
    source: "lib/documents/transaction-docs.ts:processLetter", formats: ["screen", "md"], status: "built", dependsOn: ["exitos.nda"],
    note: "From the canonical process timeline; the structured IOI fields; no price is indicated." },

  // ── 4 · Confidentiality and NDA ──
  { id: "exitos.nda", title: "Non-disclosure agreement", stage: 4, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: ["name", "jurisdiction"],
    source: "exit-engines nda/engine.ts:issueNda; pages/ReportNda.tsx (summary)", formats: ["screen", "print"], status: "partial", reviewRequired: "counsel", executionRequired: true,
    defects: ["C-2", "C-3"], note: "Terms and signature records only; no clause text. Signature recorded per party (local record)." },
  { id: "exitos.nda_request", title: "NDA request (buyer)", stage: 4, audience: "parties", kind: "tracked", classification: "restricted_parties", inputs: [],
    source: "lib/exit-api.ts:requestNda", formats: ["screen"], status: "built" },
  { id: "exitos.data_room_policy", title: "Data-room access policy", stage: 4, audience: "founder", kind: "generated", classification: "internal", inputs: [],
    source: "lib/deliverables.ts:dataRoomGatingDoc", formats: ["md"], status: "built", note: "States what ExitOS records and does not verify." },
  { id: "exitos.breach_notice", title: "NDA breach notice (illustrative)", stage: 4, audience: "parties", kind: "drafted", classification: "restricted_parties", inputs: [],
    source: "exit-engines nda/engine.ts:generateBreachNotice", formats: ["screen"], status: "partial", reviewRequired: "counsel", note: "Illustrative allegations; on screen only." },

  // ── 5 · Due diligence and data room ──
  { id: "exitos.data_room_index", title: "Data Room Index", stage: 5, audience: "buyers", kind: "generated", classification: "confidential_nda", inputs: FIN,
    source: "exit-engines memorandum/template.ts:ddRoomIndex", formats: ["screen", "md"], status: "built", defects: ["B-10"] },
  { id: "exitos.diligence_artifacts", title: "Diligence artifacts (22 across 7 packages)", stage: 5, audience: "buyers", kind: "requested", classification: "confidential_nda", inputs: [],
    source: "exit-engines diligence/engine.ts:runDueDiligence; pages/DataRoom.tsx", formats: ["screen"], status: "partial", defects: ["C-4", "A-4"] },
  { id: "exitos.diligence_questions", title: "Critical questions and red flags", stage: 5, audience: "founder", kind: "generated", classification: "internal", inputs: FIN,
    source: "exit-engines diligence/engine.ts", formats: ["screen"], status: "built" },

  // ── 6 · Offers and negotiation ──
  { id: "exitos.ioi", title: "Indication of interest", stage: 6, audience: "founder", kind: "tracked", classification: "restricted_parties", inputs: [],
    source: "lib/documents/transaction-docs.ts:ioiRecord (structured IOI from lib/exit-api.ts:submitOffer)", formats: ["screen", "md"], status: "built",
    note: "The bidder's own structured terms, restated; a term not given reads \"not yet supplied by the bidder\"." },
  { id: "exitos.offer_comparison", title: "Offer comparison", stage: 6, audience: "founder", kind: "generated", classification: "internal", inputs: [],
    source: "lib/documents/transaction-docs.ts:offerComparison", formats: ["screen", "md"], status: "built",
    note: "Recorded offers only, bidders by letter; measured against the seller's own positions where set; no ranking." },
  { id: "exitos.counter_offer", title: "Counter-offer letter", stage: 6, audience: "buyer", kind: "drafted", classification: "restricted_parties", inputs: [],
    source: "lib/documents/transaction-docs.ts:counterOffer", formats: ["screen", "md"], status: "built",
    note: "From one recorded offer and the seller's positions; unset positions are not proposed; non-binding." },
  { id: "exitos.loi", title: "Letter of intent / term sheet", stage: 6, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: "lib/documents/transaction-docs.ts:termSheetDraft", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel", executionRequired: true,
    note: "Draft heads of terms from the accepted offer and the seller's positions; binding provisions and governing law are left to counsel." },
  { id: "exitos.exclusivity", title: "Exclusivity agreement", stage: 6, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: "lib/documents/transaction-docs.ts:exclusivityDraft", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel", executionRequired: true,
    note: "Draft letter for counsel from the accepted offer's requested period and the seller's limit." },

  // ── 7 · Signing and closing ──
  { id: "exitos.spa", title: "Share purchase agreement (drafting brief)", stage: 7, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:spaBrief", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel", executionRequired: true,
    note: "A brief for counsel from the transaction record (accepted terms, recorded conditions); ExitOS does not draft the agreement." },
  { id: "exitos.disclosure_schedules", title: "Disclosure schedules", stage: 7, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: null, formats: [], status: "not_built", reviewRequired: "counsel", dependsOn: ["exitos.spa"] },
  { id: "exitos.consents", title: "Board resolutions and shareholder consents", stage: 7, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: null, formats: [], status: "not_built", reviewRequired: "counsel", executionRequired: true },
  { id: "exitos.escrow_agreement", title: "Escrow agreement", stage: 7, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: null, formats: [], status: "not_built", reviewRequired: "counsel", executionRequired: true },
  { id: "exitos.funds_flow", title: "Funds-flow and closing statement", stage: 7, audience: "parties", kind: "generated", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:fundsFlow", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel",
    note: "Split from the accepted terms; the closing statement from both parties' matching confirmations. Adjustments (cash, debt, working capital, costs) are not held and say so; no funds are moved." },
  { id: "exitos.bring_down_certificate", title: "Bring-down certificate", stage: 7, audience: "parties", kind: "counsel", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:bringDownDraft", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel", executionRequired: true,
    note: "Draft for counsel after signing; officer and exceptions not supplied." },
  { id: "exitos.closing_cap_table", title: "Closing cap table and allocation", stage: 7, audience: "parties", kind: "generated", classification: "restricted_parties", inputs: [],
    source: "pages/Investors.tsx (sample, on screen)", formats: ["screen"], status: "partial", defects: ["B-7"] },
  { id: "exitos.filings_checklist", title: "Conditions, consents and filings register", stage: 7, audience: "counsel", kind: "tracked", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:conditionsRegister", formats: ["screen", "md"], status: "partial", reviewRequired: "counsel",
    note: "The signing and completion conditions the parties recorded, with evidence and confirmation; which consents and filings apply is for counsel." },
  { id: "exitos.announcement", title: "Closing announcement drafts", stage: 7, audience: "founder", kind: "drafted", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:announcementDraft", formats: ["screen", "md"], status: "partial",
    note: "After completion only; names the buyer as typed by the seller; leaves out the price; both parties approve." },
  { id: "exitos.closing_checklist", title: "Closing checklist", stage: 7, audience: "parties", kind: "tracked", classification: "restricted_parties", inputs: [],
    source: "lib/closing-checklist.ts (page and export)", formats: ["screen", "md"], status: "built",
    note: "One checklist: the page and the export show the same items, owners, timing and statuses (tracking notes, not execution evidence)." },
  { id: "exitos.closing_call", title: "Closing call invitation", stage: 7, audience: "parties", kind: "generated", classification: "restricted_parties", inputs: [],
    source: "pages/Closing.tsx:downloadInvite", formats: ["ics"], status: "partial", defects: ["B-13"], note: "Always two days out at 08:00." },

  // ── 8 · Post-closing ──
  { id: "exitos.wealth_plan", title: "Wealth transition plan", stage: 8, audience: "founder", kind: "generated", classification: "internal", inputs: [],
    source: "lib/deliverables.ts:wealthPlanDoc", formats: ["md"], status: "built", note: "One flat illustrative tax rate, stated." },
  { id: "exitos.post_closing_register", title: "Post-closing obligations register", stage: 8, audience: "parties", kind: "tracked", classification: "restricted_parties", inputs: [],
    source: "lib/documents/closing-docs.ts:postClosingRegister", formats: ["screen", "md"], status: "partial",
    note: "From the transaction record: escrow release, earn-out and NDA survival dated from the accepted terms at completion, plus obligations either party adds; each closed by evidence and the other party's confirmation. Working-capital true-up and indemnity deadlines only if a party adds them." },
];

const BY_ID = new Map(DOCUMENT_TYPES.map((d) => [d.id, d]));

export function documentType(id: string): DocumentType {
  const d = BY_ID.get(id as DocumentType["id"]);
  if (!d) throw new Error(`Unknown document type: ${id}`);
  return d;
}

/** The registry as plain JSON, for export and review. */
export const registryJson = (): string =>
  JSON.stringify({ schemaVersion: REGISTRY_SCHEMA_VERSION, stages: STAGE_NAME, documents: DOCUMENT_TYPES }, null, 2);
