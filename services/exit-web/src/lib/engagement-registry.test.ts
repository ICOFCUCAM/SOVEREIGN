import { describe, expect, it } from "vitest";
import { buyerEngagementRecord, engagementRegistry } from "./engagement-registry.js";
import { DNA_PROFILES, sectorTokensFor } from "./buyer-dna.js";

const tokens = sectorTokensFor("enterprise_saas");

describe("buyer engagement registry (consolidated, not a contact database)", () => {
  const serial = DNA_PROFILES.find((x) => x.events_indexed >= 40)!;
  const rec = buyerEngagementRecord(serial, tokens);

  it("unifies the nine dimensions into one record", () => {
    expect(rec.acquisitionDna.dealsIndexed).toBe(serial.events_indexed);   // acquisition DNA
    expect(Array.isArray(rec.strategicIntent)).toBe(true);                 // strategic intent
    expect(rec.acquisitionHistory.total).toBe(serial.events_indexed);      // acquisition history
    expect(rec.outreachPath.length).toBeGreaterThan(0);                    // outreach path
    expect(rec.contactChannels.length).toBeGreaterThan(0);                 // public contact channels
    expect(["High", "Medium", "Low"]).toContain(rec.contactConfidence);
    // response history / NDA / LOI conversion + close rate fields all present
    expect("ndaConversionPct" in rec).toBe(true);
    expect("loiConversionPct" in rec).toBe(true);
    expect("closeRatePct" in rec).toBe(true);
    expect(rec.engagementLikelihood.score).toBeGreaterThanOrEqual(0);      // how likely to engage
    expect(rec.engagementLikelihood.score).toBeLessThanOrEqual(100);
  });

  it("never leaks contact PII — channels are public searches, no emails", () => {
    expect(JSON.stringify(rec)).not.toMatch(/@[\w.]+\.(com|io|ai|net|org)/);
    for (const c of rec.contactChannels) expect(c.discoveryUrl).toMatch(/^https:\/\//);
  });

  it("NDA/LOI conversion are absent until the buyer has run a real process", () => {
    // a registry buyer with no platform process has null conversion, not 0% asserted
    expect(rec.processesRun === 0 ? rec.ndaConversionPct === null : true).toBe(true);
    expect(rec.processesRun === 0 ? rec.loiConversionPct === null : true).toBe(true);
  });

  it("engagement likelihood is honest about its basis", () => {
    expect(rec.engagementLikelihood.basis).toMatch(/appetite|response history/);
    if (rec.processesRun === 0) expect(rec.engagementLikelihood.basis).toMatch(/no outreach history/);
  });

  it("the registry ranks indexed buyers by engagement likelihood, descending", () => {
    const reg = engagementRegistry(tokens, 30);
    expect(reg.length).toBeGreaterThan(0);
    for (const r of reg) expect(r.acquisitionDna.dealsIndexed).toBeGreaterThan(0);
    for (let i = 1; i < reg.length; i++) {
      expect(reg[i].engagementLikelihood.score).toBeLessThanOrEqual(reg[i - 1].engagementLikelihood.score);
    }
  });
});
