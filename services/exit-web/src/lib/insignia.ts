// ── THE EXITOS INSIGNIA — master geometry (owner addendum and benchmark, HX2) ──
// One symbol on a 100-unit grid, from which every ExitOS mark is cut: the
// header lockup, the favicon, the document mark and the hero's dial.
//
//   market ring        the exchange: one full circle
//   registration ticks four cardinal ticks crossing the ring — the market's
//                      axes, carried from the original mark
//   transaction node   the asset at the centre: an ice-blue core inside a
//                      fine ring (the one cool note in a warm identity)
//
// In the hero the same figure opens into the full instrument (dial, rings,
// aperture wedge, registration orbs). Weights are set per size tier (optical
// sizing): the micro tier thickens every stroke so the figure holds at 16 px.
// The static SVG files in /public are generated from this module
// (scripts/brand-assets.ts) and a test keeps them in step.

export const CX = 50;

export type Tier = "micro" | "standard";
export type Variant = "tile" | "mono";

export interface TierSpec {
  r: number; ring: number;
  tick: [number, number]; tickW: number;
  core: number; coreRing: number; coreRingW: number;
}

export const TIERS: Record<Tier, TierSpec> = {
  // ≤ 20 px: favicon, report running heads
  micro: { r: 29, ring: 6.5, tick: [17, 43], tickW: 6.5, core: 9, coreRing: 0, coreRingW: 0 },
  // header, sign-in, app icon
  standard: { r: 29, ring: 4.2, tick: [19, 41], tickW: 4.2, core: 6.2, coreRing: 11, coreRingW: 4.4 },
};

export const tierFor = (size: number): Tier => (size <= 20 ? "micro" : "standard");

/** Point on a circle about the centre; 0° is north, angles run clockwise. */
export const polar = (deg: number, r: number, c = CX): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [+(c + r * Math.sin(a)).toFixed(3), +(c - r * Math.cos(a)).toFixed(3)];
};

/** The four registration ticks crossing the ring, [x1, y1, x2, y2] each. */
export const ticks = (inner: number, outer: number, c = CX): Array<[number, number, number, number]> =>
  [0, 90, 180, 270].map((d) => [...polar(d, inner, c), ...polar(d, outer, c)] as [number, number, number, number]);

// the palette (tailwind `ex`, CSS --hx-*)
export const INK = { graphite: "#242522", shadow: "#111310", porcelain: "#F5F1E9", ivory: "#E8E0D2", bronze: "#B49A75" } as const;
/** The tile: near-black, a cool white figure, the ice-blue core (as in the benchmark lockup). */
export const TILE = { from: "#171C20", to: "#0B0E11", fg: "#EEF1F3", core: "#7FC2CE", coreDeep: "#1E6A75" } as const;

/** The insignia as a standalone SVG document (favicon, /public/brand files). */
export const insigniaSvg = ({ tier, variant, size = 100, color = INK.shadow }: { tier: Tier; variant: Variant; size?: number; color?: string }): string => {
  const T = TIERS[tier];
  const tile = variant === "tile";
  const fg = tile ? TILE.fg : color;
  const tickLines = ticks(T.tick[0], T.tick[1]).map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join("");
  const core = tile
    ? (T.coreRing ? `<circle cx="50" cy="50" r="${T.coreRing}" fill="${TILE.core}"/><circle cx="50" cy="50" r="${T.core}" fill="${TILE.coreDeep}"/>` : `<circle cx="50" cy="50" r="${T.core}" fill="${TILE.core}"/>`)
    : (T.coreRing ? `<circle cx="50" cy="50" r="${T.coreRing - T.coreRingW / 2}" stroke="${fg}" stroke-width="${T.coreRingW}"/>` : `<circle cx="50" cy="50" r="${T.core}" fill="${fg}"/>`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" role="img" aria-label="ExitOS">`,
    tile ? `<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TILE.from}"/><stop offset="1" stop-color="${TILE.to}"/></linearGradient></defs><rect x="2" y="2" width="96" height="96" rx="22" fill="url(#t)"/>` : "",
    `<circle cx="50" cy="50" r="${T.r}" stroke="${fg}" stroke-width="${T.ring}"/>`,
    `<g stroke="${fg}" stroke-width="${T.tickW}" stroke-linecap="round">${tickLines}</g>`,
    core,
    `</svg>`,
  ].join("");
};

/** The static brand files under /public, keyed by path (scripts/brand-assets.ts writes them). */
export const BRAND_FILES: Record<string, string> = {
  "favicon.svg": insigniaSvg({ tier: "micro", variant: "tile" }),
  "brand/exitos-insignia.svg": insigniaSvg({ tier: "standard", variant: "tile", size: 512 }),
  "brand/exitos-insignia-mono.svg": insigniaSvg({ tier: "standard", variant: "mono", size: 512, color: INK.shadow }),
  "brand/exitos-insignia-mono-ivory.svg": insigniaSvg({ tier: "standard", variant: "mono", size: 512, color: INK.ivory }),
  "brand/exitos-insignia-mono-small.svg": insigniaSvg({ tier: "micro", variant: "mono", size: 64, color: INK.shadow }),
};
