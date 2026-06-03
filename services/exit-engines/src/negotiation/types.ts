// Negotiation engine types — offers, terms, reservation lines, and
// the state of a multi-buyer negotiation tracked over time.

export type TermCategory =
  | 'price'
  | 'consideration'
  | 'earnout'
  | 'escrow'
  | 'indemnity'
  | 'retention'
  | 'non_compete'
  | 'tax_structure'
  | 'closing_conditions'
  | 'exclusivity'
  | 'reps_warranties';

export interface Term {
  readonly category: TermCategory;
  readonly label: string;
  readonly value: string;                     // human readable
  readonly numeric?: number;                   // optional canonical numeric value
}

export interface Offer {
  readonly offerId: string;
  readonly buyerName: string;
  readonly buyerType: 'strategic' | 'pe' | 'vc' | 'family_office' | 'sponsor';
  readonly receivedAt: string;                 // ISO date
  readonly headlinePriceUsd: number;
  readonly cashPct: number;                    // 0..1
  readonly stockPct: number;                   // 0..1
  readonly earnoutPct: number;                 // 0..1 (cash+stock+earnout = 1)
  readonly terms: readonly Term[];
  readonly stage: 'received' | 'countered' | 'accepted' | 'declined' | 'expired';
  readonly expiresAt?: string;
}

// Reservation lines define the founder's walk-away constraints. Used
// by evaluateOffer to surface conflicts.
export interface ReservationLines {
  readonly minHeadlinePriceUsd: number;
  readonly minCashPct: number;                 // 0..1
  readonly maxEarnoutPct: number;              // 0..1
  readonly maxEscrowPct?: number;              // 0..1
  readonly maxEscrowMonths?: number;
  readonly maxRetentionMonths?: number;
  readonly maxNonCompeteScope?: 'local' | 'national' | 'continental' | 'worldwide';
  readonly maxIndemnityCapPct?: number;        // 0..1 of price
  readonly preferredTaxStructure?: 'stock_sale' | 'asset_sale' | 'merger';
}

export interface OfferConflict {
  readonly term: string;
  readonly severity: 'soft' | 'hard';
  readonly reason: string;
  readonly counterProposal?: string;
}

export interface OfferEvaluation {
  readonly offer: Offer;
  readonly score: number;                      // 0..100, weighted across dimensions
  readonly dimensions: {
    readonly price:         { score: number; weight: number; comment: string };
    readonly consideration: { score: number; weight: number; comment: string };
    readonly downsideRisk:  { score: number; weight: number; comment: string };
    readonly founderImpact: { score: number; weight: number; comment: string };
  };
  readonly conflicts: readonly OfferConflict[];
  readonly recommendation: 'accept' | 'counter' | 'decline' | 'engage';
  readonly counterMoves: readonly string[];
  readonly impliedNetToFoundersUsd: number;   // cash + valued-stock to founders' ownership
}

export interface OfferComparison {
  readonly offers: readonly OfferEvaluation[];
  readonly leader?: string;                    // offer.offerId of the leading bid
  readonly delta: ReadonlyArray<{ readonly term: string; readonly notes: string }>;
  readonly summary: string;
}

// Multi-buyer negotiation state — what move to make next.
export interface NegotiationState {
  readonly activeOffers: number;
  readonly leadingBuyer?: string;
  readonly stage: 'sourcing' | 'engaged' | 'diligence' | 'loi' | 'signed' | 'closed' | 'dead';
  readonly daysSinceLastMove?: number;
  readonly nextMove: string;
  readonly leverage: 'low' | 'medium' | 'high';
  readonly recommendations: readonly string[];
}
