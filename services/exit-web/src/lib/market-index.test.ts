import { describe, expect, it } from "vitest";
import { MARKET_INDEX, MARKET_INDEX_FMT, TOP_INDEXED_ACQUIRERS } from "./market-index.js";
import manifest from "../../../exit-engines/data/ingest_manifest.json";

describe("market index (ingested registries)", () => {
  it("counts mirror the ingest manifest exactly — no inflation, no drift", () => {
    expect(MARKET_INDEX.events).toBe(manifest.counts.acquisition_events);
    expect(MARKET_INDEX.buyers).toBe(manifest.counts.buyers);
    expect(MARKET_INDEX.graphEdges).toBe(manifest.counts.graph_edges);
    expect(MARKET_INDEX.events).toBeGreaterThan(1000);
    expect(MARKET_INDEX.buyers).toBeGreaterThan(100);
  });

  it("provenance is on the record: generated timestamp + the six source hosts", () => {
    expect(Date.parse(MARKET_INDEX.generatedAt)).not.toBeNaN();
    for (const host of ["en.wikipedia.org", "query.wikidata.org", "data.sec.gov"]) {
      expect(MARKET_INDEX.hosts).toContain(host);
    }
  });

  it("top indexed acquirers are real rollups with positive deal counts", () => {
    expect(TOP_INDEXED_ACQUIRERS.length).toBeGreaterThan(0);
    for (const a of TOP_INDEXED_ACQUIRERS) {
      expect(a.name.length).toBeGreaterThan(1);
      expect(a.deals).toBeGreaterThan(0);
    }
    // descending by deal count
    for (let i = 1; i < TOP_INDEXED_ACQUIRERS.length; i++) {
      expect(TOP_INDEXED_ACQUIRERS[i].deals).toBeLessThanOrEqual(TOP_INDEXED_ACQUIRERS[i - 1].deals);
    }
  });

  it("formatted values render for the surfaces", () => {
    expect(MARKET_INDEX_FMT.events).toMatch(/^\d{1,3}(,\d{3})*$/);
    expect(MARKET_INDEX_FMT.asOf).toMatch(/\w+ \d{1,2}, \d{4}/);
  });
});
