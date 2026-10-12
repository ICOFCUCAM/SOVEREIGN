// Per-module facts for the marketing surfaces, derived from the live
// engine runs in ./engines.js — the same precomputed reports the console
// renders. Nothing here is invented: if an engine gains a methodology,
// dimension or package, these chips move with it.

import type { MemorandumKind } from "@exit/engines";
import {
  VALUATION_STANDARD, READINESS, READINESS_ANALYSIS, DILIGENCE,
} from "./engines.js";
import { MARKET, MARKET_FMT, HISTORY_FMT } from "./market-stats.js";

// The memorandum generator's document kinds. A const array (the union is
// type-only); `satisfies` keeps every member checked against the engine.
const DOC_KINDS = [
  "cim", "executive_summary", "investor_deck", "buyer_teaser", "dd_room_index",
] as const satisfies readonly MemorandumKind[];

const DD_ARTIFACTS = DILIGENCE.documents.reduce((s, d) => s + d.artifacts.length, 0);

/** One-line live stat per marketing module card. */
export const MODULE_FACTS = {
  valuation: `${VALUATION_STANDARD.methodologies.length} methodologies · 3 report types`,
  readiness: `${READINESS.dimensions.length} weighted dimensions · ${READINESS_ANALYSIS.weaknesses.length} fixes priced`,
  buyerIntel: `${MARKET.buyers} mandates · ${MARKET_FMT.appetite} capacity`,
  outreach: `${DOC_KINDS.length} document kinds · ${MARKET.activeMandates} active mandates`,
  dataRoom: `${DILIGENCE.documents.length} diligence packages · ${DD_ARTIFACTS} artifacts indexed`,
  documents: `${DOC_KINDS.length} generated formats`,
  marketplace: `${MARKET.sectors} sectors · ${MARKET.geographies} jurisdictions`,
  radar: `${HISTORY_FMT.events} source-referenced deals tracked`,
} as const;

/** The raw numbers behind the facts, for copy that is translated (homepage). */
export const MODULE_NUMS = {
  methodologies: VALUATION_STANDARD.methodologies.length,
  reportTypes: 3,
  readinessDimensions: READINESS.dimensions.length,
  fixesPriced: READINESS_ANALYSIS.weaknesses.length,
  documentKinds: DOC_KINDS.length,
  diligencePackages: DILIGENCE.documents.length,
  artifactsIndexed: DD_ARTIFACTS,
} as const;

/** Structural engine counts for copy that states a number. */
export const ENGINE_COUNTS = {
  readinessDimensions: READINESS.dimensions.length,
  diligencePackages: DILIGENCE.documents.length,
  documentKinds: DOC_KINDS.length,
  registryFirms: MARKET.buyers,
} as const;
