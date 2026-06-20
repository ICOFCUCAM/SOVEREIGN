export interface TrimSize { id: string; label: string; wmm: number; hmm: number }

// Common print-on-demand trim sizes (KDP / IngramSpark / Lulu), in millimetres.
export const TRIM_SIZES: TrimSize[] = [
  { id: "a4", label: "A4 (default)", wmm: 210, hmm: 297 },
  { id: "6x9", label: "6 × 9 in — US trade", wmm: 152.4, hmm: 228.6 },
  { id: "5x8", label: "5 × 8 in — digest", wmm: 127, hmm: 203.2 },
  { id: "5.5x8.5", label: "5.5 × 8.5 in — US trade (IngramSpark)", wmm: 139.7, hmm: 215.9 },
  { id: "8.5x11", label: "8.5 × 11 in — US letter", wmm: 215.9, hmm: 279.4 },
  { id: "8.5x8.5", label: "8.5 × 8.5 in — square picture book", wmm: 215.9, hmm: 215.9 },
  { id: "7x10", label: "7 × 10 in — workbook", wmm: 177.8, hmm: 254 },
  { id: "8x10", label: "8 × 10 in — children's / textbook", wmm: 203.2, hmm: 254 },
  { id: "a5", label: "A5", wmm: 148, hmm: 210 },
];

export const getTrim = (id: string): TrimSize => TRIM_SIZES.find((t) => t.id === id) ?? TRIM_SIZES[0];

// Approximate page-thickness (mm/sheet) for the cover spine, matching KDP guidance.
export const PAPER_MM_PER_PAGE: Record<string, number> = {
  "White": 0.0572,        // 0.002252 in
  "Cream": 0.0635,        // 0.0025 in
  "Colour (premium)": 0.0596,
};
export const BLEED_MM = 3.175; // 0.125 in
const MM_PER_IN = 25.4;

// IngramSpark inside (gutter) margin minimum, which grows with page count so the
// binding doesn't swallow text. Outside/top/bottom stay at the 0.5 in safety
// margin. Figures follow IngramSpark's published interior guidance.
export function ingramGutterMm(pages: number): number {
  if (pages <= 180) return 12.7;   // 0.500 in
  if (pages <= 400) return 15.875; // 0.625 in
  if (pages <= 600) return 19.05;  // 0.750 in
  return 22.225;                   // 0.875 in
}
export const ingramGutterIn = (pages: number) => ingramGutterMm(pages) / MM_PER_IN;
export const INGRAM_OUTSIDE_MM = 12.7; // 0.5 in outside/top/bottom safety margin

export interface CoverSpec { spineMm: number; spineIn: number; fullWmm: number; fullHmm: number; fullWin: number; fullHin: number }

// Full wrap-cover dimensions (back + spine + front + bleed) for a paperback.
export function coverSpec(trim: TrimSize, pages: number, paper: string): CoverSpec {
  const t = PAPER_MM_PER_PAGE[paper] ?? PAPER_MM_PER_PAGE["White"];
  const spineMm = Math.max(0, pages) * t;
  const fullWmm = BLEED_MM * 2 + trim.wmm * 2 + spineMm;
  const fullHmm = trim.hmm + BLEED_MM * 2;
  return {
    spineMm, spineIn: spineMm / MM_PER_IN,
    fullWmm, fullHmm, fullWin: fullWmm / MM_PER_IN, fullHin: fullHmm / MM_PER_IN,
  };
}
