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

/** Construct a Figure — throws if any provenance field is missing, so an
 *  untraceable figure cannot exist. */
export function figure(f: Figure): Figure {
  for (const k of ['source', 'confidence', 'last_updated', 'methodology'] as const) {
    if (!f[k] || String(f[k]).trim() === '') {
      throw new Error(`Figure "${f.key}" is missing required provenance: ${k}. A number without a traceable ${k} may not enter a document.`);
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
