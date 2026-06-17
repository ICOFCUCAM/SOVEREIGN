// ── MARKET DATA · the fourth data source ────────────────────────────
// Public comparables, the M&A market cycle, the rate environment and
// retrade risk. Every market variable carries the same provenance contract
// as every other figure: source, source_url, confidence, last_updated and
// methodology. A variable is either sourced — from the acquisition
// registry (derivable now) or an injected external feed — or HONESTLY
// ABSENT. Nothing here is invented.

export interface MarketVariable {
  readonly name: string;
  readonly present: boolean;
  readonly value: string;
  readonly source: string;
  readonly source_url: string | null;
  readonly confidence: string;
  readonly last_updated: string;
  readonly methodology: string;
}

export interface MarketConditions {
  readonly comparable_public_companies: MarketVariable;
  readonly market_cycle: MarketVariable;
  readonly interest_rate_environment: MarketVariable;
  readonly retrade_risk: MarketVariable;
}

/** Injected external feeds — supplied as data (from a connector drop file
 *  written by the egress-enabled ingestion job), never fetched in-engine. */
export interface MarketFeedInput {
  readonly public_companies?: {
    readonly count: number;
    readonly medianEvToRevenue?: number;
    readonly source: string;
    readonly source_url: string;
    readonly as_of: string;
  };
  readonly interest_rate?: {
    readonly label: string;          // e.g. "10Y UST 4.2%, restrictive"
    readonly source: string;
    readonly source_url: string;
    readonly as_of: string;
  };
  readonly retrade?: {
    readonly avgRetradePct: number;  // negative = price cut LOI→close
    readonly sample: number;
    readonly source: string;
    readonly source_url: string;
    readonly as_of: string;
  };
}
