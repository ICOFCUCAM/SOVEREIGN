// Deterministic cover art for a catalog item that has no uploaded image. The
// same title always yields the same gradient, so the marketplace reads as a
// real shelf of distinct books — a generated visual, never fabricated data.
const COVER_PALETTES: [string, string][] = [
  ["hsl(262 83% 58%)", "hsl(221 83% 38%)"],
  ["hsl(221 83% 53%)", "hsl(252 83% 38%)"],
  ["hsl(160 84% 38%)", "hsl(190 84% 28%)"],
  ["hsl(38 92% 52%)", "hsl(14 86% 44%)"],
  ["hsl(330 80% 52%)", "hsl(262 83% 42%)"],
  ["hsl(192 84% 44%)", "hsl(221 83% 38%)"],
  ["hsl(24 80% 50%)", "hsl(38 92% 42%)"],
  ["hsl(280 72% 52%)", "hsl(221 83% 40%)"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function coverArt(seed: string): { from: string; to: string } {
  const [from, to] = COVER_PALETTES[hash(seed) % COVER_PALETTES.length];
  return { from, to };
}
