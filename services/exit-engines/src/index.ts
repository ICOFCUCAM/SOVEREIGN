export * from './types.js';
export * as valuation    from './valuation/index.js';
export * as readiness    from './readiness/index.js';
export * as buyers       from './buyers/index.js';
export * as diligence    from './diligence/index.js';
export * as memorandum   from './memorandum/index.js';
export * as marketplace  from './marketplace/index.js';
export * as negotiation  from './negotiation/index.js';
export * as listing      from './listing/index.js';
export * as captable     from './captable/index.js';
export * as nda          from './nda/index.js';
export * as exchange     from './exchange/index.js';

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
export type { BuyerDiscoveryReport, BuyerCandidate, BuyerSignal } from './buyers/engine.js';
export type { BuyerEntry, BuyerType } from './buyers/registry.js';

// Buyer M&A history + deal outcomes + expected outcome + strategy simulator
export { rollupBuyerHistory, rollupBuyerOutcomes, compareOutcomes, closeDurationDays, premiumPct, computeExpectedOutcome, confidenceFromSample, runStrategySimulator, ACQUISITION_HISTORY } from './buyers/index.js';
export { runAcquisitionIntelligence, assessIntent, buildAcquisitionGraph, discoverAdjacentBuyers } from './buyers/index.js';
export type { AcquisitionIntelligenceReport, RankedOutcome, PipelineLayer, IntelligenceOptions, BuyerIntent, IntentSignal, GraphEdge, AdjacentBuyer } from './buyers/index.js';
export { buildBuyerGraph, runSimilarTransactions } from './buyers/index.js';
export type { BuyerGraph, GraphEntity, GraphEntityProps, GraphRelation, RelKind, SimilarTransactionsReport, SimilarExit } from './buyers/index.js';

// Sovereign Exchange — the mandate state machine
export { MANDATE_STATES, deriveMandateState } from './exchange/index.js';
export type { MandateState, MandateStateReport, MandateInputs, StateEvidence } from './exchange/index.js';
export type {
  AcquisitionEvent, AcquisitionSource, BuyerHistoryRollup, ConfidenceTier,
  BuyerDealOutcomeRollup, OutcomeStandouts,
  ExpectedOutcome, ConfidenceLabel, StatConfidence,
  StrategyConstraints, StrategyOutput, ProcessStructure,
} from './buyers/index.js';
export type {
  DueDiligenceReport, DiligenceDocumentSpec, DiligenceDocumentKind, DiligenceSection, DiligenceArtifact,
} from './diligence/engine.js';
export type {
  Offer, OfferEvaluation, OfferComparison, NegotiationState, ReservationLines, Term, TermCategory, OfferConflict,
} from './negotiation/types.js';
export type { MarketplaceListing, BuyerMatch, ListingMatches, ListingVisibility, CreateListingOptions } from './listing/engine.js';

// Cap-table CRM
export {
  runCapTableAnalysis, computeWaterfall, signatoryRoster, dragAlongCheck, foundersNetFromOffer, vestedShares,
} from './captable/index.js';
export type {
  ShareClass, ShareClassKind, StakeholderRole, Holding, VestingSchedule, Stakeholder, CapTable,
  CapTableAnalysis, SignatoryRoster, DragAlongCheck, Waterfall, WaterfallInputs, StakeholderDistribution,
} from './captable/index.js';

// NDA lifecycle
export {
  STANDARD_TEMPLATES, templateById, issueNda, recordSignature, evaluateNdaStatus, revokeNda, markBreached,
  generateBreachNotice, ndaCoverageFor, rosterFor,
} from './nda/index.js';
export type {
  NdaShape, NdaState, NdaTemplate, NdaTerms, NdaParty, NdaInstance, NdaSignatureEvent,
  BreachNotice, AccessCheck, NdaRoster,
} from './nda/index.js';
