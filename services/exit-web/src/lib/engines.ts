import { useEffect, useState } from "react";
import {
  runValuation, strategicBuyerReport, assetReplacementReport, runInstitutionalValuation,
  runReadiness, runReadinessAnalysis, runBuyerDiscovery, runDueDiligence,
  evaluateOffer, compareOffers, deriveNegotiationState,
  createListing, matchBuyersToListing,
  TemplateMemorandumGenerator,
  runCapTableAnalysis, signatoryRoster, computeWaterfall,
  dragAlongCheck, foundersNetFromOffer,
  issueNda, recordSignature, revokeNda, rosterFor, ndaCoverageFor,
  type MemorandumDocument, type MemorandumKind, type MemorandumInputs,
  type NdaInstance,
} from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile.js";
import { SAMPLE_CAPTABLE } from "./captable-sample.js";

// Pre-compute the deterministic results once per module load.
export const VALUATION_STANDARD     = runValuation(SAMPLE_COMPANY, { reportType: "standard" });
export const VALUATION_STRATEGIC    = strategicBuyerReport(SAMPLE_COMPANY);
export const VALUATION_REPLACEMENT  = assetReplacementReport(SAMPLE_COMPANY);
export const VALUATION_INSTITUTIONAL = runInstitutionalValuation(SAMPLE_COMPANY);
// Canonical name — the institutional report IS the Valuation Constitution.
export const VALUATION_CONSTITUTION = VALUATION_INSTITUTIONAL;
export const READINESS              = runReadiness(SAMPLE_COMPANY);
export const READINESS_ANALYSIS     = runReadinessAnalysis(SAMPLE_COMPANY, READINESS);
export const BUYERS                 = runBuyerDiscovery(SAMPLE_COMPANY, { limit: 12 });
export const DILIGENCE              = runDueDiligence(SAMPLE_COMPANY);

// Marketplace listing for the SAMPLE company — private_full for the
// founder view; the anonymized one is what's rendered on the public
// Marketplace page.
export const LISTING_PRIVATE  = createListing(SAMPLE_COMPANY, { visibility: "private_full" });
export const LISTING_PUBLIC   = createListing(SAMPLE_COMPANY, { visibility: "public_anonymized" });
export const LISTING_MATCHES  = matchBuyersToListing(LISTING_PRIVATE, SAMPLE_COMPANY, { limit: 15 });

export const HEADLINE = `${SAMPLE_COMPANY.name} · ${(SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(1)}M ARR · ${SAMPLE_COMPANY.sector.replace(/_/g, " ")}`;

export const RESERVATION_LINES = {
  minHeadlinePriceUsd: 75_000_000,
  minCashPct: 0.65,
  maxEarnoutPct: 0.20,
  maxEscrowPct: 0.15,
  maxEscrowMonths: 24,
  maxRetentionMonths: 18,
  maxNonCompeteScope: "national" as const,
  maxIndemnityCapPct: 0.25,
  preferredTaxStructure: "stock_sale" as const,
};

export const SAMPLE_OFFERS = [
  {
    offerId: "o-001",
    buyerName: "Vista Enterprise Software Bolt-On",
    buyerType: "pe" as const,
    receivedAt: new Date(Date.now() - 4 * 86400_000).toISOString(),
    headlinePriceUsd: 132_000_000,
    cashPct: 0.78,
    stockPct: 0.10,
    earnoutPct: 0.12,
    terms: [
      { category: "escrow"      as const, label: "Escrow",        value: "12% / 24mo",    numeric: 0.12 },
      { category: "indemnity"   as const, label: "Indemnity cap", value: "20% of price",  numeric: 0.20 },
      { category: "retention"   as const, label: "Retention",     value: "18 months",     numeric: 18 },
      { category: "non_compete" as const, label: "Non-compete",   value: "National 24mo" },
    ],
    stage: "received" as const,
  },
  {
    offerId: "o-002",
    buyerName: "Microsoft Industry Solutions",
    buyerType: "strategic" as const,
    receivedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    headlinePriceUsd: 165_000_000,
    cashPct: 0.60,
    stockPct: 0.30,
    earnoutPct: 0.10,
    terms: [
      { category: "escrow"      as const, label: "Escrow",        value: "15% / 24mo",    numeric: 0.15 },
      { category: "indemnity"   as const, label: "Indemnity cap", value: "25% of price",  numeric: 0.25 },
      { category: "retention"   as const, label: "Retention",     value: "24 months",     numeric: 24 },
      { category: "non_compete" as const, label: "Non-compete",   value: "Worldwide 24mo" },
    ],
    stage: "received" as const,
  },
  {
    offerId: "o-003",
    buyerName: "Insight Partners Growth",
    buyerType: "pe" as const,
    receivedAt: new Date(Date.now() - 9 * 86400_000).toISOString(),
    headlinePriceUsd: 95_000_000,
    cashPct: 0.50,
    stockPct: 0.15,
    earnoutPct: 0.35,
    terms: [
      { category: "escrow"      as const, label: "Escrow",        value: "18% / 30mo",    numeric: 0.18 },
      { category: "indemnity"   as const, label: "Indemnity cap", value: "40% of price",  numeric: 0.40 },
      { category: "retention"   as const, label: "Retention",     value: "12 months",     numeric: 12 },
      { category: "non_compete" as const, label: "Non-compete",   value: "Continental 36mo" },
    ],
    stage: "countered" as const,
  },
];

export const OFFER_EVALUATIONS = SAMPLE_OFFERS.map((o) => evaluateOffer(o, SAMPLE_COMPANY, VALUATION_STRATEGIC, RESERVATION_LINES));
export const OFFER_COMPARISON  = compareOffers(SAMPLE_OFFERS, SAMPLE_COMPANY, VALUATION_STRATEGIC, RESERVATION_LINES);
export const NEGOTIATION_STATE = deriveNegotiationState({
  stage: "loi",
  activeOffers: SAMPLE_OFFERS.length,
  ...(OFFER_COMPARISON.leader ? { leadingBuyer: OFFER_COMPARISON.leader } : {}),
  daysSinceLastMove: 3,
  hasExclusivity: false,
});

// ── Cap-table CRM ──────────────────────────────────────────────────
export { SAMPLE_CAPTABLE };
export const CAPTABLE_ANALYSIS  = runCapTableAnalysis(SAMPLE_CAPTABLE);
export const CAPTABLE_SIGNATORY = signatoryRoster(SAMPLE_CAPTABLE);
export const CAPTABLE_DRAGALONG = dragAlongCheck(SAMPLE_CAPTABLE);
// Per-offer waterfall against the same offers shown on the Negotiator.
export const OFFER_WATERFALLS = SAMPLE_OFFERS.map((o) => ({
  offerId: o.offerId,
  waterfall: computeWaterfall(SAMPLE_CAPTABLE, {
    headlinePriceUsd: o.headlinePriceUsd,
    cashPct: o.cashPct,
    stockPct: o.stockPct,
    earnoutPct: o.earnoutPct,
  }),
  foundersNet: foundersNetFromOffer(SAMPLE_CAPTABLE, o),
}));

// ── NDA lifecycle ──────────────────────────────────────────────────
// Seed a small portfolio of NDAs against the marketplace listing so the
// Nda page renders with active / pending / expired / revoked rows and
// the Marketplace gate (ndaCoverageFor) returns realistic visibility.
const FOUNDER_PARTY = { id: "founder-helios", name: "Helios Freight, Inc.", representativeName: "Anne Kovac", representativeEmail: "anne@helios.example" };

function buildSeedNda(
  templateId: string,
  buyer: { id: string; name: string },
  daysAgo: number,
  state: "active" | "pending" | "revoked",
): NdaInstance {
  const issued = new Date(Date.now() - daysAgo * 86400_000);
  let nda = issueNda({
    templateId,
    listingId: LISTING_PRIVATE.listingId,
    disclosing: FOUNDER_PARTY,
    receiving: { ...buyer, representativeName: "Authorized signatory" },
  });
  nda = { ...nda, issuedAt: issued.toISOString() };
  if (state === "pending") return nda;
  nda = recordSignature(nda, "disclosing", "Anne Kovac");
  nda = recordSignature(nda, "receiving",  "Authorized signatory");
  if (state === "revoked") nda = revokeNda(nda, "mutual termination after talks ended");
  return nda;
}

export const SAMPLE_NDAS: readonly NdaInstance[] = [
  buildSeedNda("tpl-bilateral-standard-v3",   { id: "buyer-helios-ag",  name: "Helios Acquisition Group" }, 18,  "active"),
  buildSeedNda("tpl-bilateral-standard-v3",   { id: "buyer-astra",       name: "Astra Strategic" },          11,  "active"),
  buildSeedNda("tpl-bilateral-standard-v3",   { id: "buyer-forum",       name: "Forum Equity Partners" },     2,  "pending"),
  buildSeedNda("tpl-oneway-buyer-receipt-v2", { id: "buyer-northbound",  name: "Northbound Capital" },       45,  "active"),
  buildSeedNda("tpl-bilateral-standard-v3",   { id: "buyer-sentinel",    name: "Sentinel Holdings" },       120,  "revoked"),
  buildSeedNda("tpl-oneway-buyer-receipt-v2", { id: "buyer-lehnen",      name: "Lehnen Family Holdings" },    9,  "active"),
];

export const NDA_ROSTER = rosterFor(SAMPLE_NDAS);

export function buyerVisibility(buyerId: string): "public_anonymized" | "private_full" {
  return ndaCoverageFor(buyerId, LISTING_PRIVATE.listingId, SAMPLE_NDAS).visibility;
}

const memoGen = new TemplateMemorandumGenerator();

export function useMemorandum(kind: MemorandumKind, inputs?: Partial<MemorandumInputs>): MemorandumDocument | null {
  const [doc, setDoc] = useState<MemorandumDocument | null>(null);
  useEffect(() => {
    let alive = true;
    memoGen
      .generate(kind, {
        company:      SAMPLE_COMPANY,
        valuation:    VALUATION_STRATEGIC,
        constitution: VALUATION_INSTITUTIONAL,   // every memo inherits the framework
        readiness:    READINESS,
        buyers:       BUYERS,
        diligence:    DILIGENCE,
        ...inputs,
      })
      .then((d) => { if (alive) setDoc(d); });
    return () => { alive = false; };
  }, [kind, inputs]);
  return doc;
}

export function fmt(n?: number, opts: { compact?: boolean; currency?: string } = {}): string {
  if (n == null) return "—";
  const { compact = true, currency = "USD" } = opts;
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(n) >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)         return `$${(n / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
