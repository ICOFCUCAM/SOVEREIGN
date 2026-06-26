import type { ScoreReport } from "../types.js";
import type { ComposeOverrides } from "./promptComposer.js";

export interface Refinement {
  overrides: ComposeOverrides;
  reason: string;
}

const dedupe = (xs: string[]): string[] => Array.from(new Set(xs));

/**
 * Programmatic prompt refinement. Reads the weak criteria of the best candidate
 * and returns positive/negative overrides for the next attempt. This is the
 * deterministic rule set the spec calls for:
 *   architecture weak  → emphasise architecture
 *   people dominate    → reduce human prominence
 *   lighting flat      → increase cinematic lighting
 *   realism drops      → push photoreal editorial language
 *   composition busy   → simplify framing
 */
export function refinePrompt(report: ScoreReport, previous: ComposeOverrides = {}): Refinement {
  const s = report.scores;
  const emphasis = [...(previous.emphasis ?? [])];
  const suppress = [...(previous.suppress ?? [])];
  const reasons: string[] = [];
  const low = (k: string, floor = 85): boolean => (s[k] ?? 100) < floor;

  if (low("architecturalQuality")) {
    emphasis.push("foreground the architecture — stronger columns, cornices, depth and scale");
    reasons.push("architecture weak");
  }
  if (low("institutionalAtmosphere")) {
    emphasis.push("more institutional gravitas and ceremonial stillness");
    reasons.push("atmosphere weak");
  }
  if (low("lightingConsistency")) {
    emphasis.push("stronger single-source cinematic lighting, deeper shadow falloff, restrained highlights");
    reasons.push("lighting flat");
  }
  if (low("composition")) {
    emphasis.push("simplify the framing — one clear subject, more negative space, remove clutter");
    reasons.push("composition cluttered");
  }
  if (low("humanRealism") || low("facialQuality") || low("handQuality")) {
    emphasis.push("reduce human prominence — figures smaller and distant, seen from behind, hands and faces away from camera");
    reasons.push("human realism weak");
  }
  if (low("brandConsistency")) {
    emphasis.push("match the set grade exactly — near-black field, one warm gold accent, muted and cinematic");
    reasons.push("off-brand grade");
  }
  if (low("luxuryFeel") || low("editorialQuality") || low("artisticExcellence")) {
    emphasis.push("increase quiet-luxury editorial richness and material detail");
    reasons.push("editorial uplift");
  }
  if (low("artifactAbsence", 88) || low("prohibitedAbsence", 88)) {
    suppress.push("any text", "any signage", "warped geometry", "duplicated objects", "extra limbs");
    reasons.push("artifacts/prohibited present");
  }

  if (reasons.length === 0) {
    emphasis.push("push overall editorial excellence and material richness");
    reasons.push("general uplift");
  }

  return { overrides: { emphasis: dedupe(emphasis), suppress: dedupe(suppress) }, reason: reasons.join(", ") };
}
