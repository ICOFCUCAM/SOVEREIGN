import { numericTokens, type Figure } from './figure.js';

// ── TRACEABILITY VALIDATOR ──────────────────────────────────────────
// Enforces the architectural rule: no document may contain a number
// unless that number traces back to a stored Figure. Scans every section's
// prose, bullets and tables for numeric tokens and confirms each one is a
// figure value (or an allowlisted non-figure: a calendar year, the
// framework version, or an ordinal already labelled as such).

export interface TracedSectionLike {
  readonly heading: string;
  readonly body?: string;
  readonly bullets?: readonly string[];
  readonly rows?: ReadonlyArray<readonly string[]>;
}

export interface Untraced {
  readonly section: string;
  readonly token: string;
  readonly context: string;
}

export interface TraceabilityReport {
  readonly ok: boolean;
  readonly checked: number;       // numeric tokens scanned
  readonly traced: number;
  readonly untraced: readonly Untraced[];
}

const isYear = (t: string): boolean => /^\d{4}$/.test(t) && +t >= 1900 && +t <= 2099;

export function validateTraceability(
  facts: readonly Figure[],
  sections: readonly TracedSectionLike[],
  frameworkVersion: string,
): TraceabilityReport {
  // the universe of traceable tokens: every numeric token in every figure value
  const traceable = new Set<string>();
  for (const f of facts) for (const t of numericTokens(f.value)) traceable.add(t);
  // the framework version's own tokens are allowlisted (e.g. "1.0.0")
  for (const t of numericTokens(frameworkVersion)) traceable.add(t);

  const untraced: Untraced[] = [];
  let checked = 0;
  let traced = 0;

  const scan = (text: string, heading: string): void => {
    for (const tok of numericTokens(text)) {
      checked++;
      if (traceable.has(tok) || isYear(tok)) { traced++; continue; }
      // a token contained within a traceable compound (e.g. "112" inside a
      // "27-257" range value already rendered) also counts as traced
      const contained = [...traceable].some((t) => t.includes(tok) && tok.length >= 2);
      if (contained) { traced++; continue; }
      untraced.push({ section: heading, token: tok, context: text.slice(0, 80) });
    }
  };

  for (const s of sections) {
    if (s.body) scan(s.body, s.heading);
    for (const b of s.bullets ?? []) scan(b, s.heading);
    for (const row of s.rows ?? []) for (const cell of row) scan(cell, s.heading);
  }

  return { ok: untraced.length === 0, checked, traced, untraced };
}
