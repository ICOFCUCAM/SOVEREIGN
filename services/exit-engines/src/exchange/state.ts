// ── PHASE 7 · THE SOVEREIGN EXCHANGE ────────────────────────────────
// Not buyer/seller/listing. A mandate moves through a typed state
// machine with guarded transitions — the protocol that makes ExitOS an
// acquisition exchange rather than a listing site:
//
//   anonymous_mandate → buyer_pool → qualified_buyers → interest_signals
//   → nda_state → cim_state → loi_state → bid_room → diligence_room
//   → close_room
//
// Guards are facts, not flags: a mandate cannot reach cim_state without
// an executed NDA, cannot reach bid_room without an LOI-stage offer, and
// so on. deriveMandateState() computes the live state from the actual
// engine artifacts (listing, matches, NDAs, offers) — the state is read
// off the record, never stored as an assertion.

import type { MarketplaceListing, ListingMatches } from '../listing/engine.js';
import type { NdaInstance } from '../nda/types.js';
import { evaluateNdaStatus } from '../nda/engine.js';

export const MANDATE_STATES = [
  'anonymous_mandate',
  'buyer_pool',
  'qualified_buyers',
  'interest_signals',
  'nda_state',
  'cim_state',
  'loi_state',
  'bid_room',
  'diligence_room',
  'close_room',
] as const;

export type MandateState = (typeof MANDATE_STATES)[number];

export interface StateEvidence {
  readonly state: MandateState;
  readonly reached: boolean;
  readonly evidence: string;            // the fact that proves (or blocks) the state
}

export interface MandateStateReport {
  readonly current: MandateState;
  readonly index: number;               // position in the lifecycle
  readonly trail: readonly StateEvidence[];
  readonly blockedBy?: string;          // what the next transition requires
}

export interface MandateInputs {
  readonly listing?: MarketplaceListing;
  readonly matches?: ListingMatches;
  readonly ndas?: readonly NdaInstance[];
  readonly offers?: ReadonlyArray<{ stage: string; headlinePriceUsd: number }>;
  readonly diligenceOpen?: boolean;      // data-room access granted to a bidder
  readonly closingStarted?: boolean;     // SPA circulation / escrow engaged
}

/** Derive the mandate's live state from the engine artifacts. */
export function deriveMandateState(i: MandateInputs): MandateStateReport {
  const listingId = i.listing?.listingId;
  const activeNdas = (i.ndas ?? []).filter(
    (n) => (!listingId || n.listingId === listingId) && evaluateNdaStatus(n) === 'active',
  );
  const pendingNdas = (i.ndas ?? []).filter(
    (n) => (!listingId || n.listingId === listingId) && evaluateNdaStatus(n) === 'pending_signature',
  );
  const offers = i.offers ?? [];
  const loiOffers = offers.filter((o) => o.stage === 'loi' || o.stage === 'countered' || o.stage === 'received');

  const trail: StateEvidence[] = [];
  const push = (state: MandateState, reached: boolean, evidence: string): boolean => {
    trail.push({ state, reached, evidence });
    return reached;
  };

  // each guard is cumulative — a later state requires every earlier one
  let ok = push('anonymous_mandate', !!i.listing,
    i.listing ? `listing ${i.listing.listingId.slice(0, 14)}… published (${i.listing.visibility})` : 'no listing published');
  ok = push('buyer_pool', ok && (i.matches?.matches.length ?? 0) > 0,
    i.matches ? `${i.matches.matches.length} mandates matched by the engine` : 'matching not run');
  const qualified = (i.matches?.matches ?? []).filter((m) => m.matchScore >= 0.6);
  ok = push('qualified_buyers', ok && qualified.length > 0,
    `${qualified.length} buyers above the 60% qualification bar`);
  ok = push('interest_signals', ok && (activeNdas.length + pendingNdas.length) > 0,
    `${pendingNdas.length} NDA request(s) pending · ${activeNdas.length} executed`);
  ok = push('nda_state', ok && activeNdas.length > 0,
    activeNdas.length ? `${activeNdas.length} NDA(s) executed — identity unlocked for signatories` : 'no executed NDA');
  ok = push('cim_state', ok && activeNdas.length > 0,
    activeNdas.length ? 'CIM distributable to NDA-cleared counterparties' : 'CIM gated on an executed NDA');
  ok = push('loi_state', ok && loiOffers.length > 0,
    loiOffers.length ? `${loiOffers.length} offer(s) in hand` : 'no indications of interest yet');
  ok = push('bid_room', ok && loiOffers.length >= 2,
    loiOffers.length >= 2 ? `competitive tension: ${loiOffers.length} parallel bids` : 'bid room opens with a second bid');
  ok = push('diligence_room', ok && !!i.diligenceOpen,
    i.diligenceOpen ? 'confirmatory diligence access granted' : 'diligence room not yet opened');
  push('close_room', ok && !!i.closingStarted,
    i.closingStarted ? 'definitive documentation in motion' : 'closing not initiated');

  const reachedStates = trail.filter((t) => t.reached);
  const current = reachedStates.at(-1)?.state ?? 'anonymous_mandate';
  const index = MANDATE_STATES.indexOf(current);
  const next = trail.find((t) => !t.reached);

  return {
    current,
    index,
    trail,
    ...(next ? { blockedBy: next.evidence } : {}),
  };
}
