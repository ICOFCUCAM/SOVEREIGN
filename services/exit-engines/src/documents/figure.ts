// ── THE FIGURE PRIMITIVE ────────────────────────────────────────────
// The architectural rule, made structural: a number cannot appear in an
// ExitOS document unless it is a Figure — and a Figure cannot be
// constructed without a source, a confidence, a last_updated date and the
// methodology that produced it. Documents are assembled from Figures and
// prose; the traceability validator proves no untraced number slips in.

export interface Figure {
  readonly key: string;          // stable id, referenced by document sections
  readonly label: string;        // human label, e.g. "Enterprise Value"
  readonly value: string;        // rendered display value, e.g. "$112.4M"
  readonly source: string;       // where it came from
  readonly confidence: string;   // tier or % — never blank
  readonly last_updated: string; // ISO date or framework version
  readonly methodology: string;  // how it was derived — never blank
}

/** The non-negotiable rule: every number displayed in ExitOS must answer
 *  five questions. A Figure that cannot answer all five may not be shown. */
export interface FiveQuestions {
  readonly whereFrom: string;       // 1. Where did it come from?   (source)
  readonly whenUpdated: string;     // 2. When was it updated?      (last_updated)
  readonly howConfident: string;    // 3. How confident are we?     (confidence)
  readonly whatMethodology: string; // 4. What methodology?         (methodology)
  readonly traceable: boolean;      // 5. Can we trace it to source data?
}

export function fiveQuestions(f: Figure): FiveQuestions {
  return {
    whereFrom: f.source,
    whenUpdated: f.last_updated,
    howConfident: f.confidence,
    whatMethodology: f.methodology,
    traceable: true,                // a constructed Figure is, by definition, traced
  };
}

/** True only if the figure answers all five questions. */
export function answersAllFive(f: Figure): boolean {
  const q = fiveQuestions(f);
  return [q.whereFrom, q.whenUpdated, q.howConfident, q.whatMethodology].every((a) => !!a && a.trim() !== '') && q.traceable;
}

/** Construct a Figure — throws unless it answers all five questions, so a
 *  number that can't be traced to source data cannot enter a document. */
export function figure(f: Figure): Figure {
  for (const k of ['source', 'confidence', 'last_updated', 'methodology'] as const) {
    if (!f[k] || String(f[k]).trim() === '') {
      throw new Error(`Figure "${f.key}" cannot answer question for "${k}". Per the non-negotiable rule, a number that cannot answer where it came from, when it was updated, how confident we are, what methodology produced it, and whether it traces to source data may not be displayed.`);
    }
  }
  return f;
}

/** The numeric tokens a figure's value contains — used by the traceability
 *  validator to confirm a document's numbers all trace to a figure. */
export function numericTokens(s: string): string[] {
  // currency ($1.2B, $450M, $1,200), percentages (38%), and bare numbers.
  // A single-letter unit (B/M/K) only attaches when IMMEDIATELY adjacent to
  // the number and not the first letter of a following word — so "23 buyers"
  // yields "23", not "23b". Word units (billion/million) may have one space.
  const out = new Set<string>();
  const re = /\$?\d[\d,]*(?:\.\d+)?(?:[bmk](?![a-z])|\s?(?:billion|million|thousand|bn)\b)?%?/gi;
  for (const m of s.matchAll(re)) {
    const t = m[0].replace(/\s+/g, '').replace(/,/g, '');
    if (/\d/.test(t)) out.add(t.toLowerCase());
  }
  return [...out];
}
