import { describe, expect, it } from "vitest";
import {
  buyerContactRegistry, contactConfidence, outreachPaths, buyerEngagementScore,
  ENGAGEMENT_DISCLAIMER, ENRICHMENT_PROVIDERS,
} from "./buyer-contact.js";
import { DNA_PROFILES, sectorTokensFor } from "./buyer-dna.js";

const tokens = sectorTokensFor("enterprise_saas");

describe("buyer contact intelligence (registry, not a contact-data clone)", () => {
  const serial = DNA_PROFILES.find((x) => x.events_indexed >= 40)!;
  const reg = buyerContactRegistry(serial, tokens);

  it("never emits an email or asserted contact — only public discovery links", () => {
    const blob = JSON.stringify(reg);
    expect(blob).not.toMatch(/@[\w.]+\.(com|io|ai|net|org)/);     // no emails
    for (const c of reg.channels) expect(c.discoveryUrl).toMatch(/^https:\/\/(www\.google\.com|www\.linkedin\.com)\//);
    for (const path of reg.outreachPaths) if (path.discoveryUrl) expect(path.discoveryUrl).toMatch(/^https:\/\//);
  });

  it("contact confidence is earned from acquisition depth", () => {
    expect(contactConfidence(serial).tier).toBe("High");
    const thin = DNA_PROFILES.find((x) => x.events_indexed > 0 && x.events_indexed < 8);
    if (thin) expect(contactConfidence(thin).tier).toBe("Low");
  });

  it("provides the five ordered outreach paths bankers use", () => {
    const paths = outreachPaths(serial);
    expect(paths.map((p) => p.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(paths[0].channel).toMatch(/Corporate Development|Investment Team|Acquisitions/);
    // the partner-network path has no external link (it routes through ExitOS)
    expect(paths[4].discoveryUrl).toBeUndefined();
  });

  it("engagement score uses disclosed close data; outreach metrics await real history", () => {
    const e = buyerEngagementScore(serial);
    // close rate / median close are real-where-disclosed
    if (serial.close_rate != null) expect(e.closeRatePct).toBe(Math.round(serial.close_rate * 100));
    // responsiveness / NDA / LOI rates require the platform's own outreach history
    expect(e.responsivenessPct).toBeNull();
    expect(e.ndaRatePct).toBeNull();
    expect(e.loiRatePct).toBeNull();
  });

  it("enrichment providers are an explicit integration point, not connected by default", () => {
    expect(ENRICHMENT_PROVIDERS.map((p) => p.name)).toContain("Apollo.io");
    expect(ENRICHMENT_PROVIDERS.every((p) => p.connected === false)).toBe(true);
    expect(ENGAGEMENT_DISCLAIMER).toMatch(/does not store, scrape, guess/);
  });
});
