import { describe, expect, it } from "vitest";
import {
  DNA_PROFILES, DNA_AS_OF, SECTOR_TRANSACTIONS, sectorOverlap, recommendedAction,
  acquisitionProbability, rankedBuyers, acquisitionSignals, buyerById,
} from "./buyer-dna.js";

describe("acquisition DNA (derived from ingested registries)", () => {
  it("profiles exist, are alias-deduped, and sort by indexed events", () => {
    expect(DNA_PROFILES.length).toBeGreaterThan(100);
    // no two profiles for the same normalized identity (e.g. Cisco vs Cisco Systems)
    const norm = (s: string): string => s.toLowerCase().replace(/\b(systems|inc|corp|corporation)\b/g, "").replace(/[.,]/g, "").trim();
    const names = DNA_PROFILES.map((p) => norm(p.name));
    expect(new Set(names).size).toBe(names.length);
    for (let i = 1; i < DNA_PROFILES.length; i++) {
      expect(DNA_PROFILES[i].events_indexed).toBeLessThanOrEqual(DNA_PROFILES[i - 1].events_indexed);
    }
  });

  it("DNA fields are real-data shaped — no NaN, dates ISO, appetite consistent with cadence", () => {
    for (const p of DNA_PROFILES.slice(0, 40)) {
      expect(p.source_url).toMatch(/^https?:\/\//);
      if (p.last_acquisition) expect(p.last_acquisition.date).toMatch(/^\d{4}-\d{2}/);
      if (p.avg_deal_usd != null) expect(p.avg_deal_usd).toBeGreaterThan(0);
      if (p.appetite === "high") expect(p.deals_12m).toBeGreaterThanOrEqual(2);
      if (p.appetite === "no_events") expect(p.events_indexed).toBe(0);
    }
  });

  it("a major serial acquirer carries deep DNA", () => {
    const ms = DNA_PROFILES.find((p) => p.name === "Microsoft");
    expect(ms).toBeDefined();
    expect(ms!.events_indexed).toBeGreaterThan(200);
    expect(ms!.sector_tokens.length).toBeGreaterThan(2);
    expect(ms!.last_acquisition).toBeDefined();
    // NOTE: deal values for bare-numeric "Value (USD)" columns land on the
    // next ingest run (parser fixed with the usd-column hint); until then
    // avg/max stay honestly undisclosed rather than guessed.
  });

  it("sector overlap and recommended action derive from measured tokens", () => {
    // mechanism test on a profile shaped like the real records — the current
    // ingested universe (tech/media list pages) carries no logistics tokens
    // in any top-6, so dataset-wide overlap of 0 is the truthful state.
    const synthetic = {
      buyer_id: "t", name: "T", buyer_type: "corporate", events_indexed: 10, disclosed_events: 2,
      deals_12m: 3, deals_3y: 6, appetite: "high" as const, verified_events: 1,
      sector_tokens: [{ token: "logistics software", count: 6 }, { token: "media", count: 4 }],
      source_url: "https://en.wikipedia.org/wiki/X",
    };
    const o = sectorOverlap(synthetic);
    expect(o.pct).toBe(60);
    expect(recommendedAction(synthetic)).toBe("Initiate NDA outreach");
    // dataset: overlap is computable everywhere without error
    for (const p of DNA_PROFILES.slice(0, 30)) expect(sectorOverlap(p).pct).toBeGreaterThanOrEqual(0);
  });

  it("acquisition probability is a transparent 0–100 composite of measured inputs", () => {
    const p = DNA_PROFILES.find((x) => x.events_indexed > 0)!;
    const b = acquisitionProbability(p);
    expect(b.pct).toBeGreaterThanOrEqual(0);
    expect(b.pct).toBeLessThanOrEqual(100);
    // the score is the sum of its named, bounded parts (within rounding)
    expect(Math.abs(b.pct - (b.appetite + b.overlap + b.velocity + b.recency))).toBeLessThanOrEqual(2);
    expect(b.rationale.length).toBeGreaterThan(0);
  });

  it("rankedBuyers returns the crown-jewel ranking — active acquirers, sorted by probability", () => {
    const ranked = rankedBuyers(15);
    expect(ranked.length).toBeGreaterThan(0);
    for (const r of ranked) expect(r.profile.events_indexed).toBeGreaterThan(0);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].probability.pct).toBeLessThanOrEqual(ranked[i - 1].probability.pct);
    }
  });

  it("acquisition signals: derived signals are real; external feeds are honestly inactive", () => {
    const ms = buyerById("microsoft")!;
    expect(ms).toBeDefined();
    const { signals, activeCount } = acquisitionSignals(ms);
    // a serial acquirer shows real derived signals
    expect(activeCount).toBeGreaterThan(0);
    // external-feed signals are never invented — always inactive until connected
    const feeds = signals.filter((s) => s.source === "feed");
    expect(feeds.length).toBeGreaterThan(0);
    for (const f of feeds) expect(f.active).toBe(false);
    // activeCount counts only derived signals
    expect(activeCount).toBe(signals.filter((s) => s.source === "derived" && s.active).length);
  });

  it("similar-transactions extract is sector-relevant and sourced", () => {
    expect(SECTOR_TRANSACTIONS.length).toBeGreaterThan(5);
    for (const t of SECTOR_TRANSACTIONS) {
      expect(t.source_url).toMatch(/^https?:\/\//);
      expect(t.industry.toLowerCase()).toMatch(/logistic|freight|transport|supply|fleet|shipping|delivery|trucking/);
    }
    expect(Date.parse(DNA_AS_OF)).not.toBeNaN();
  });
});
