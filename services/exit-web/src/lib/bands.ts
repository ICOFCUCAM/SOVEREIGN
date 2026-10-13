// Ranges for figures shown before an NDA. A pre-NDA surface (the public
// listing, a warm introduction, a teaser) states a bracket, never the exact
// figure, so every one of them uses these same brackets.

export interface Band {
  readonly low: number;           // inclusive
  readonly high: number | null;   // exclusive; null = open-ended
  readonly label: string;
}

const REVENUE_EDGES = [5e6, 10e6, 25e6, 50e6, 100e6, 250e6];
const m = (usd: number): string => `$${usd / 1e6}M`;

/** The revenue (or ARR) bracket for a dollar figure. */
export function revenueBand(usd: number): Band {
  const v = Math.max(0, usd);
  if (v < REVENUE_EDGES[0]) return { low: 0, high: REVENUE_EDGES[0], label: `under ${m(REVENUE_EDGES[0])}` };
  for (let i = 1; i < REVENUE_EDGES.length; i++) {
    if (v < REVENUE_EDGES[i]) return { low: REVENUE_EDGES[i - 1], high: REVENUE_EDGES[i], label: `${m(REVENUE_EDGES[i - 1]).replace("M", "")}–${m(REVENUE_EDGES[i]).slice(1)}` };
  }
  const top = REVENUE_EDGES[REVENUE_EDGES.length - 1];
  return { low: top, high: null, label: `over ${m(top)}` };
}

const GROWTH_EDGES = [0, 0.1, 0.25, 0.5];
const p = (x: number): string => `${Math.round(x * 100)}`;

/** The year-over-year growth bracket for a fraction (0.32 = 32%). */
export function growthBand(pct: number): Band {
  if (pct < GROWTH_EDGES[0]) return { low: -Infinity, high: 0, label: "declining" };
  for (let i = 1; i < GROWTH_EDGES.length; i++) {
    if (pct < GROWTH_EDGES[i]) return { low: GROWTH_EDGES[i - 1], high: GROWTH_EDGES[i], label: `${p(GROWTH_EDGES[i - 1])}–${p(GROWTH_EDGES[i])}%` };
  }
  const top = GROWTH_EDGES[GROWTH_EDGES.length - 1];
  return { low: top, high: null, label: `over ${p(top)}%` };
}

/** Whether any value in the band can fall within [lo, hi]. */
export const bandOverlaps = (b: Band, lo: number, hi: number = Infinity): boolean =>
  b.low <= hi && (b.high == null || b.high > lo);
