// Buyer Portal data — the acquirer's seat, derived from the same engine
// runs the founder console renders. The demo seat is the registry mandate
// the matching engine ranks highest that also has a live offer in, so both
// sides of the table show the same deal.

import { buyers } from "@exit/engines";
import {
  LISTING_PUBLIC, LISTING_PRIVATE, LISTING_MATCHES,
  SAMPLE_OFFERS, VALUATION_STRATEGIC, DILIGENCE,
  SAMPLE_NDAS,
} from "./engines.js";
import { sectorLabel } from "./market-stats.js";

const REGISTRY = buyers.BUYER_REGISTRY;

// Seat = the mandate the matching engine ranks highest for the live
// listing (or, if one of them has an offer on the table, that one).
const seatMatch =
  LISTING_MATCHES.matches.find((m) => SAMPLE_OFFERS.some((o) => o.buyerName === m.buyerName)) ??
  LISTING_MATCHES.matches[0];

export const SEAT = {
  match: seatMatch,
  rank: LISTING_MATCHES.matches.indexOf(seatMatch) + 1,
  entry: REGISTRY.find((b) => b.name === seatMatch.buyerName),
  offer: SAMPLE_OFFERS.find((o) => o.buyerName === seatMatch.buyerName),
} as const;

const usd = (n: number): string =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${Math.round(n / 1e6)}M`;

/** The acquisition mandate line, from the seat's actual registry entry. */
export const SEAT_MANDATE = SEAT.entry
  ? `${SEAT.entry.sectorsActive.slice(0, 2).map(sectorLabel).join(" & ")} · check ${usd(SEAT.entry.checkSizeLowUsd)}–${usd(SEAT.entry.checkSizeHighUsd)} · ${SEAT.entry.geographyPreferred.join(" + ")}`
  : seatMatch.rationale;

export type PortalStage = "sourcing" | "engaged" | "diligence" | "loi";

// Diligence access is per-buyer: the seat sees the data room only if its
// own NDA on this listing is active.
const seatHasNda = SAMPLE_NDAS.some(
  (n) =>
    n.listingId === LISTING_PRIVATE.listingId &&
    n.state === "active" &&
    n.receiving.name === seatMatch.buyerName,
);

export interface PortalOpportunity {
  readonly code: string;
  readonly sector: string;
  readonly region: string;
  /** Absolute revenue is NDA-gated on anonymized listings. */
  readonly revenue?: number;
  readonly ask: number;
  readonly fit: number;
  readonly stage: PortalStage;
  readonly readiness: number;
  readonly highlights: readonly string[];
  readonly outreach: string;
  readonly hasDataRoom: boolean;
}

/** Live opportunities — every marketplace listing, seen from the seat.
 *  One real listing exists today; the array grows with the marketplace. */
const seatSees = seatHasNda ? LISTING_PRIVATE : LISTING_PUBLIC;

export const PORTAL_OPPORTUNITIES: readonly PortalOpportunity[] = [
  {
    code: seatSees.fullName ?? seatSees.title,
    sector: sectorLabel(seatSees.sector),
    region: seatSees.jurisdiction,
    ...(seatSees.headline.arrUsd ?? seatSees.headline.ttmRevenueUsd
      ? { revenue: seatSees.headline.arrUsd ?? seatSees.headline.ttmRevenueUsd }
      : {}),
    ask: seatSees.askingPriceUsd.mid,
    fit: Math.round(seatMatch.matchScore * 100),
    stage: SEAT.offer ? (SEAT.offer.stage === "countered" ? "loi" : "engaged") : "sourcing",
    readiness: Math.round(seatSees.readinessScore),
    highlights: seatSees.highlights,
    outreach: seatMatch.suggestedOutreach.replace(/_/g, " "),
    hasDataRoom: seatHasNda,
  },
];

export interface PortalNegotiation {
  readonly code: string;
  readonly offer: number;
  readonly premiumPct: number;
  readonly stage: PortalStage;
  readonly status: string;
}

/** The seat's own offers on listings, with premium vs the strategic mid. */
export const PORTAL_NEGOTIATIONS: readonly PortalNegotiation[] = SEAT.offer
  ? [{
      code: LISTING_PUBLIC.title,
      offer: SEAT.offer.headlinePriceUsd,
      premiumPct: Math.round((SEAT.offer.headlinePriceUsd / VALUATION_STRATEGIC.headline.mid - 1) * 100),
      stage: SEAT.offer.stage === "countered" ? "loi" : "engaged",
      status: SEAT.offer.stage === "countered" ? "Counter received" : "Offer submitted",
    }]
  : [];

export const PORTAL_STATS = {
  opportunities: PORTAL_OPPORTUNITIES.length,
  inDiligence: PORTAL_OPPORTUNITIES.filter((o) => o.hasDataRoom).length,
  negotiations: PORTAL_NEGOTIATIONS.length,
  diligencePackages: DILIGENCE.documents.length,
  competingMatches: LISTING_MATCHES.matches.length,
} as const;
