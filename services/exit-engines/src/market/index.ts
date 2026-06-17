// ── MARKET INTELLIGENCE (browser-safe) ──────────────────────────────
// Pure region map + Knowledge Graph query. The node-only extract builder
// (scripts/market/build.ts) is NOT exported here — it uses fs and must
// never enter the web bundle.
export { regionOf, ALL_REGIONS } from './regions.js';
export type { Region } from './regions.js';
export { queryAcquisitions } from './query.js';
export type { GraphQuery, GraphResult, BuyerRollup } from './query.js';
export { sectorIndexes } from './indexes.js';
export type { SectorIndex, IndexEventInput } from './indexes.js';
export type {
  AcquisitionIndex, IndexEvent, MarketIntelligence,
  SectorHeat, GeoDensity, Corridor, ActiveAcquirer,
} from './types.js';
