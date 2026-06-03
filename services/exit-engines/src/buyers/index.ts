export * from './engine.js';
export { BUYER_REGISTRY } from './registry.js';
export type { BuyerEntry, BuyerType } from './registry.js';
export { ACQUISITION_HISTORY } from './history.js';
export { rollupBuyerHistory } from './history-rollup.js';
export { rollupBuyerOutcomes, compareOutcomes, closeDurationDays, premiumPct } from './outcomes.js';
export type { AcquisitionEvent, AcquisitionSource, BuyerHistoryRollup, ConfidenceTier } from './history-types.js';
export type { BuyerDealOutcomeRollup, OutcomeStandouts } from './outcomes.js';
