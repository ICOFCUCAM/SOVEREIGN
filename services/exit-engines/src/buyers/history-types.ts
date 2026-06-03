import type { SectorTag } from '../types.js';

// Reference model for an acquirer's M&A track record. Populated from
// EDGAR 8-K filings and Wikidata SPARQL queries via the adapters in
// edgar.ts / wikidata.ts; the snapshot lives in history.ts. The buyer
// discovery engine rolls this up into per-buyer aggregates (dealsLast3y,
// avgCheckUsd, sectorMix) and uses it as both a fit dimension and as
// evidence in the ranked-list explanation.

// Provenance tier governs how an event may be used:
//
//   verified    — fetched from a primary source (EDGAR filing, Wikidata
//                 statement) by an automated adapter within the last 90
//                 days; safe to quote to paying customers without caveat.
//   unverified  — believed to be true and well-formed, but not confirmed
//                 against the live primary source from this environment.
//                 Curated entries default to this tier until refreshed.
//   estimated   — a numeric field (typically headlinePriceUsd) is a
//                 best-effort estimate, not a disclosed figure.
//   synthetic   — fabricated for testing/demo; never mix into a real
//                 aggregate.
//
// Tiers do not mix: avgCheck / median / dealsLast3y aggregates are
// computed within a tier (default: verified) and the UI shows the tier
// the number is sourced from. See history-rollup.ts.

export type ConfidenceTier = 'verified' | 'unverified' | 'estimated' | 'synthetic';

export interface AcquisitionEvent {
  readonly buyerName: string;                  // matches BuyerEntry.name
  readonly targetName: string;
  readonly announcedDate: string;              // ISO date
  readonly closedDate?: string;
  readonly headlinePriceUsd?: number;          // null when undisclosed
  readonly sector?: SectorTag;
  readonly targetGeography?: string;           // ISO country
  readonly status: 'closed' | 'announced' | 'terminated' | 'pending';
  readonly sourceRefs: readonly AcquisitionSource[];
  readonly confidence: ConfidenceTier;         // event-level provenance tier
  readonly priceConfidence?: ConfidenceTier;   // tier for headlinePriceUsd specifically; defaults to confidence
}

export interface AcquisitionSource {
  readonly kind: 'edgar_8k' | 'edgar_10k' | 'wikidata' | 'press_release' | 'manual';
  readonly ref: string;                        // accession number, Wikidata QID, URL, or note
  readonly retrievedAt?: string;               // present iff verified
  readonly verified?: boolean;                 // true iff the ref was confirmed against the primary source
}

export interface BuyerHistoryRollup {
  readonly buyerName: string;
  readonly aggregateTier: ConfidenceTier;          // tier the numbers below are sourced from
  readonly totalDeals: number;
  readonly dealsLast12Months: number;
  readonly dealsLast3Years: number;
  readonly avgDisclosedCheckUsd?: number;
  readonly medianDisclosedCheckUsd?: number;
  readonly largestDealUsd?: number;
  readonly lastAcquiredAt?: string;
  readonly lastTargetName?: string;
  readonly lastTargetConfidence?: ConfidenceTier;  // tier of the most-recent deal specifically
  readonly sectorMix: Readonly<Partial<Record<SectorTag, number>>>;
  readonly geographyMix: Readonly<Record<string, number>>;
  readonly terminatedDeals: number;
  readonly coverageByTier: Readonly<Record<ConfidenceTier, number>>;  // event counts per tier
}
