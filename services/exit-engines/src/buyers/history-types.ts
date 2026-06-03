import type { SectorTag } from '../types.js';

// Reference model for an acquirer's M&A track record. Populated from
// EDGAR 8-K filings and Wikidata SPARQL queries via the adapters in
// edgar.ts / wikidata.ts; the snapshot lives in history.ts. The buyer
// discovery engine rolls this up into per-buyer aggregates (dealsLast3y,
// avgCheckUsd, sectorMix) and uses it as both a fit dimension and as
// evidence in the ranked-list explanation.

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
}

export interface AcquisitionSource {
  readonly kind: 'edgar_8k' | 'edgar_10k' | 'wikidata' | 'press_release' | 'manual';
  readonly ref: string;                        // accession number, Wikidata QID, URL, or note
  readonly retrievedAt?: string;
}

export interface BuyerHistoryRollup {
  readonly buyerName: string;
  readonly totalDeals: number;
  readonly dealsLast12Months: number;
  readonly dealsLast3Years: number;
  readonly avgDisclosedCheckUsd?: number;
  readonly medianDisclosedCheckUsd?: number;
  readonly largestDealUsd?: number;
  readonly lastAcquiredAt?: string;
  readonly lastTargetName?: string;
  readonly sectorMix: Readonly<Partial<Record<SectorTag, number>>>;  // count by sector
  readonly geographyMix: Readonly<Record<string, number>>;
  readonly terminatedDeals: number;
}
