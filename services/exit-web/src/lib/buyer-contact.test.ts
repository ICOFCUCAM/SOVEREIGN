import { describe, expect, it } from "vitest";
import { buyerEngagement, ENGAGEMENT_DISCLAIMER } from "./buyer-contact.js";
import { DNA_PROFILES, sectorTokensFor } from "./buyer-dna.js";

const tokens = sectorTokensFor("enterprise_saas");

describe("buyer engagement intelligence", () => {
  const p = DNA_PROFILES.find((x) => x.events_indexed > 20)!;
  const e = buyerEngagement(p, tokens);

  it("infers a decision-maker ROLE, never a named person or invented email", () => {
    expect(e.bestContactRole.length).toBeGreaterThan(0);
    // it is a role title, not contact PII
    expect(e.bestContactRole).not.toMatch(/@/);
    expect(JSON.stringify(e)).not.toMatch(/@[\w.]+\.(com|io|ai|net)/); // no email anywhere
  });

  it("process telemetry is honestly absent until real platform deals exist", () => {
    expect(e.responseRatePct).toBeNull();
    expect(e.medianTimeToNdaDays).toBeNull();
    expect(e.medianTimeToLoiDays).toBeNull();
    expect(e.telemetryConnected).toBe(false);
  });

  it("prior similar acquisitions is a real count from the DNA token index", () => {
    expect(e.priorSimilarAcquisitions).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(e.priorSimilarAcquisitions)).toBe(true);
  });

  it("research links are deterministic public searches — not stored contacts", () => {
    expect(e.research.length).toBeGreaterThan(0);
    for (const r of e.research) {
      expect(r.url).toMatch(/^https:\/\/(www\.linkedin\.com|www\.google\.com)\//);
      expect(decodeURIComponent(r.url)).toContain(p.name);
    }
  });

  it("median time-to-close uses the disclosed figure when present, else null", () => {
    const withClose = DNA_PROFILES.find((x) => x.median_close_days != null);
    if (withClose) expect(buyerEngagement(withClose, tokens).medianTimeToCloseDays).toBe(withClose.median_close_days);
    expect(ENGAGEMENT_DISCLAIMER).toMatch(/does not store, scrape/);
  });
});
