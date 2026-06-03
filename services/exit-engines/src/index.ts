export * from './types.js';
export * as valuation    from './valuation/index.js';
export * as readiness    from './readiness/index.js';
export * as buyers       from './buyers/index.js';
export * as diligence    from './diligence/index.js';
export * as memorandum   from './memorandum/index.js';
export * as marketplace  from './marketplace/index.js';
export * as negotiation  from './negotiation/index.js';
export * as listing      from './listing/index.js';

// Top-level convenience re-exports — the most common entrypoints.
export { runValuation, strategicBuyerReport, assetReplacementReport, tenMillionReport, twentyFiveMillionReport } from './valuation/index.js';
export { runReadiness, runReadinessAnalysis } from './readiness/index.js';
export { runBuyerDiscovery } from './buyers/index.js';
export { runDueDiligence }   from './diligence/index.js';
export { TemplateMemorandumGenerator, ClaudeMemorandumGenerator } from './memorandum/index.js';
export { runMarketplace }    from './marketplace/index.js';
export { evaluateOffer, compareOffers, deriveNegotiationState } from './negotiation/index.js';
export { createListing, matchBuyersToListing } from './listing/index.js';

export type {
  MemorandumKind, MemorandumInputs, MemorandumDocument, MemorandumSection, MemorandumTable, MemorandumGenerator,
} from './memorandum/types.js';
export type { MarketplaceRun, MarketplaceRunOptions } from './marketplace/engine.js';
export type {
  ValuationReport, ValuationReportType, ValuationBand, MethodologyEntry,
} from './valuation/engine.js';
export type { ReadinessReport, ReadinessBand, ReadinessDimension } from './readiness/engine.js';
export type { ReadinessAnalysis, ImprovementPlan, ImprovementEffort } from './readiness/improvements.js';
export type { BuyerDiscoveryReport, BuyerCandidate } from './buyers/engine.js';
export type { BuyerEntry, BuyerType } from './buyers/registry.js';
export type {
  DueDiligenceReport, DiligenceDocumentSpec, DiligenceDocumentKind, DiligenceSection, DiligenceArtifact,
} from './diligence/engine.js';
export type {
  Offer, OfferEvaluation, OfferComparison, NegotiationState, ReservationLines, Term, TermCategory, OfferConflict,
} from './negotiation/types.js';
export type { MarketplaceListing, BuyerMatch, ListingMatches, ListingVisibility, CreateListingOptions } from './listing/engine.js';
