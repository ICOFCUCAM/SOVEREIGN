import { describe, expect, it } from "vitest";
import { runInstitutionalValuation, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile.js";
import { canonicalValuationFor, valueAfterFixes } from "./canonical-valuation.js";
import { VALUATION_CANONICAL, OFFER_COMPARISON } from "./engines.js";
import { DEMO_DEAL_CONTEXT, dealContextFor } from "./deal-context.js";
import { commanderMetrics } from "./commander-metrics.js";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake.js";

// Decision D1: one enterprise value across the console — the institutional
// framework's headline, the figure the Intelligence Terminal shows.
describe("one enterprise value (D1)", () => {
  const terminal = runInstitutionalValuation(SAMPLE_COMPANY).headline;

  it("the canonical valuation carries the Terminal's headline", () => {
    expect(VALUATION_CANONICAL.headline.mid).toBe(terminal.mid);
    expect(VALUATION_CANONICAL.headline.low).toBe(terminal.low);
    expect(VALUATION_CANONICAL.headline.high).toBe(terminal.high);
  });

  it("the shared deal context and commander metrics use it", () => {
    expect(DEMO_DEAL_CONTEXT.valuationBand.mid).toBe(terminal.mid);
    expect(DEMO_DEAL_CONTEXT.currentValueUsd).toBe(terminal.mid);
    expect(commanderMetrics().companyValue).toBe(terminal.mid);
  });

  it("value after fixes = value + the readiness engine's uplift (the Terminal's rule)", () => {
    const ra = runReadinessAnalysis(SAMPLE_COMPANY, runReadiness(SAMPLE_COMPANY));
    const uplift = Math.max(0, ra.projectedStrategicMid - ra.currentStrategicMid);
    expect(DEMO_DEAL_CONTEXT.potentialValueUsd).toBe(terminal.mid + uplift);
    expect(valueAfterFixes(100, { currentStrategicMid: 10, projectedStrategicMid: 25 })).toBe(115);
    expect(valueAfterFixes(100, { currentStrategicMid: 25, projectedStrategicMid: 10 })).toBe(100);
  });

  it("a founder's own company gets its own institutional value", () => {
    const other = buildProfile({ ...SAMPLE_INTAKE, name: "Other Co" });
    expect(dealContextFor(other).valuationBand.mid).toBe(runInstitutionalValuation(other).headline.mid);
    expect(canonicalValuationFor(other).headline.mid).toBe(runInstitutionalValuation(other).headline.mid);
  });

  it("offer scoring still produces a comparison", () => {
    expect(OFFER_COMPARISON.offers.length).toBe(3);
  });
});
