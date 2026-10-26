// Cover Studio's design model: everything a professional cover is made of,
// independent of how it's drawn. Artwork comes from the image model (or the
// owner's own upload) WITHOUT lettering; the title, author, blurb, spine and
// barcode are typeset here, so type is always sharp, correctly spelled and
// placed inside the printer's safe zones.
import { BLEED_MM, coverSpec, getTrim, type TrimSize } from "@/lib/print-sizes";

export type TemplateId = "classic" | "modern" | "devotional" | "academic" | "children" | "thriller";
export type TitlePos = "top" | "middle" | "bottom";
export type FontKey = "playfair" | "fraunces" | "grotesk" | "inter" | "manrope" | "jakarta";

export const COVER_FONTS: Record<FontKey, { label: string; family: string }> = {
  playfair: { label: "Playfair Display (serif)", family: "'Playfair Display', Georgia, serif" },
  fraunces: { label: "Fraunces (soft serif)", family: "'Fraunces', Georgia, serif" },
  grotesk: { label: "Space Grotesk (bold sans)", family: "'Space Grotesk', 'Inter', sans-serif" },
  inter: { label: "Inter (clean sans)", family: "'Inter', system-ui, sans-serif" },
  manrope: { label: "Manrope (modern sans)", family: "'Manrope', system-ui, sans-serif" },
  jakarta: { label: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', system-ui, sans-serif" },
};

export interface CoverTemplate {
  id: TemplateId;
  label: string;
  line: string;
  titleFont: FontKey;
  bodyFont: FontKey;
  titleWeight: number;
  upper: boolean;
  /** Title cap height as a share of the trim width. */
  titleSize: number;
  titlePos: TitlePos;
  align: "center" | "left";
  /** Gradient shading behind the type, so it reads over any artwork. */
  scrim: "top" | "bottom" | "both" | "none";
  /** A solid colour band holding the title (academic look). */
  band: boolean;
  ornament: boolean;
  letterSpacing: number;
  /** Background used when there's no artwork, and the spine/back fallback. */
  bg: [string, string];
  ink: string;
  accent: string;
}

export const TEMPLATES: CoverTemplate[] = [
  { id: "classic", label: "Classic", line: "Centred serif, timeless", titleFont: "playfair", bodyFont: "playfair", titleWeight: 700, upper: false, titleSize: 0.105, titlePos: "top", align: "center", scrim: "both", band: false, ornament: false, letterSpacing: 0, bg: ["#1d2b45", "#0c1424"], ink: "#ffffff", accent: "#d8b45a" },
  { id: "modern", label: "Modern", line: "Bold sans, left-aligned", titleFont: "grotesk", bodyFont: "inter", titleWeight: 700, upper: true, titleSize: 0.12, titlePos: "bottom", align: "left", scrim: "bottom", band: false, ornament: false, letterSpacing: 0.01, bg: ["#202225", "#0d0e10"], ink: "#ffffff", accent: "#f05a3c" },
  { id: "devotional", label: "Devotional", line: "Elegant serif with ornament", titleFont: "fraunces", bodyFont: "playfair", titleWeight: 600, upper: false, titleSize: 0.1, titlePos: "middle", align: "center", scrim: "both", band: false, ornament: true, letterSpacing: 0.005, bg: ["#3d2a1a", "#1c120a"], ink: "#fbf4e6", accent: "#d6ae62" },
  { id: "academic", label: "Academic", line: "Title band, sober and clear", titleFont: "inter", bodyFont: "inter", titleWeight: 700, upper: false, titleSize: 0.085, titlePos: "top", align: "left", scrim: "none", band: true, ornament: false, letterSpacing: 0, bg: ["#12355b", "#0a2038"], ink: "#ffffff", accent: "#f2b134" },
  { id: "children", label: "Children's", line: "Big, friendly and bright", titleFont: "fraunces", bodyFont: "jakarta", titleWeight: 700, upper: false, titleSize: 0.135, titlePos: "top", align: "center", scrim: "none", band: false, ornament: false, letterSpacing: 0, bg: ["#2f8fd8", "#1b5fa8"], ink: "#ffffff", accent: "#ffd23f" },
  { id: "thriller", label: "Thriller", line: "Huge caps, dark and tense", titleFont: "grotesk", bodyFont: "inter", titleWeight: 700, upper: true, titleSize: 0.15, titlePos: "bottom", align: "center", scrim: "bottom", band: false, ornament: false, letterSpacing: 0.04, bg: ["#151515", "#000000"], ink: "#ffffff", accent: "#c8102e" },
];
export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export interface Endorsement { quote: string; by: string }

export interface CoverDesign {
  title: string;
  subtitle: string;
  author: string;
  /** Small line above the title on the front, e.g. "Book 2 of The Harbour Trilogy". */
  seriesLine: string;
  tagline: string;
  template: TemplateId;
  titleFont: FontKey | null;
  titleScale: number; // 0.6 – 1.6
  titlePos: TitlePos | null;
  ink: string | null; // null = template / automatic
  accent: string | null;
  shade: number; // 0 – 1, strength of the scrim
  frontArt: string | null;
  backArt: string | null;
  /** How the back is filled when there's no back artwork. */
  backFill: "front-blur" | "solid";
  backHeadline: string;
  blurb: string;
  endorsements: Endorsement[];
  bio: string;
  authorPhoto: string | null;
  publisher: string;
  category: string;
  price: string;
  isbn: string;
  /** Keep the barcode area clear even without an ISBN (KDP prints its own barcode there). */
  reserveBarcode: boolean;
  trimId: string;
  paper: string;
  pages: number;
}

export function defaultDesign(p: Partial<CoverDesign> = {}): CoverDesign {
  return {
    title: "", subtitle: "", author: "", seriesLine: "", tagline: "",
    template: "classic", titleFont: null, titleScale: 1, titlePos: null, ink: null, accent: null, shade: 0.55,
    frontArt: null, backArt: null, backFill: "front-blur",
    backHeadline: "", blurb: "", endorsements: [], bio: "", authorPhoto: null,
    publisher: "", category: "", price: "", isbn: "", reserveBarcode: true,
    trimId: "6x9", paper: "Cream", pages: 0,
    ...p,
  };
}

// ── Print geometry ───────────────────────────────────────────────────────────

const IN = 25.4;
/** Text is kept this far inside the trim edge (0.375 in) — inside KDP's and IngramSpark's minimums with room to spare. */
export const SAFE_MM = 0.375 * IN;
/** KDP's barcode area: 2 × 1.2 in, bottom right of the back cover. */
export const BARCODE_MM = { w: 2 * IN, h: 1.2 * IN };
/** KDP prints spine text only on books with more than 79 pages. */
export const SPINE_TEXT_MIN_PAGES = 80;
/** Spine text keeps 0.0625 in clear of each fold. */
export const SPINE_MARGIN_MM = 0.0625 * IN;

export interface Rect { x: number; y: number; w: number; h: number }
export interface WrapGeometry {
  trim: TrimSize;
  bleed: number;
  spine: number;
  full: { w: number; h: number };
  /** Each panel including its outer bleed, and its trimmed area. */
  back: { panel: Rect; trim: Rect };
  spineRect: Rect;
  front: { panel: Rect; trim: Rect };
  barcode: Rect;
  spineText: boolean;
}

export function wrapGeometry(d: Pick<CoverDesign, "trimId" | "paper" | "pages">): WrapGeometry {
  const trim = getTrim(d.trimId);
  const spec = coverSpec(trim, d.pages, d.paper);
  const b = BLEED_MM, spine = spec.spineMm;
  const back = { panel: { x: 0, y: 0, w: b + trim.wmm, h: spec.fullHmm }, trim: { x: b, y: b, w: trim.wmm, h: trim.hmm } };
  const spineRect = { x: b + trim.wmm, y: 0, w: spine, h: spec.fullHmm };
  const fx = b + trim.wmm + spine;
  const front = { panel: { x: fx, y: 0, w: trim.wmm + b, h: spec.fullHmm }, trim: { x: fx, y: b, w: trim.wmm, h: trim.hmm } };
  const barcode = { x: back.trim.x + back.trim.w - SAFE_MM - BARCODE_MM.w, y: back.trim.y + back.trim.h - SAFE_MM - BARCODE_MM.h, w: BARCODE_MM.w, h: BARCODE_MM.h };
  return { trim, bleed: b, spine, full: { w: spec.fullWmm, h: spec.fullHmm }, back, spineRect, front, barcode, spineText: d.pages >= SPINE_TEXT_MIN_PAGES && spine > 2 * SPINE_MARGIN_MM };
}

// Words per printed page at each trim (typical trade typesetting), used to
// estimate the page count — and so the spine width — from the manuscript.
const WORDS_PER_PAGE: Record<string, number> = { a4: 500, "6x9": 300, "5x8": 240, "5.5x8.5": 270, "8.5x11": 500, "8.5x8.5": 350, "7x10": 380, "8x10": 420, a5: 260 };
export function estimatePages(words: number, trimId: string): number {
  if (!words) return 0;
  const body = Math.ceil(words / (WORDS_PER_PAGE[trimId] ?? 300));
  const n = body + 10; // title, copyright, contents, blank versos and the like
  return n + (n % 2); // printed books have an even page count
}

/** Plain-language checks shown beside the preview and before export. */
export function coverChecks(d: CoverDesign): { level: "ok" | "warn"; text: string }[] {
  const g = wrapGeometry(d);
  const out: { level: "ok" | "warn"; text: string }[] = [];
  if (!d.title.trim()) out.push({ level: "warn", text: "Add the title." });
  if (!d.author.trim()) out.push({ level: "warn", text: "Add the author's name." });
  if (!d.pages) out.push({ level: "warn", text: "Set the page count: the spine width depends on it." });
  else if (d.pages < 24) out.push({ level: "warn", text: "KDP paperbacks need at least 24 pages." });
  else if (!g.spineText) out.push({ level: "warn", text: `The spine is ${g.spine.toFixed(1)} mm: too thin for text (KDP allows spine text from ${SPINE_TEXT_MIN_PAGES} pages). It's left plain.` });
  else if (g.spine - 2 * SPINE_MARGIN_MM < 3) out.push({ level: "warn", text: `The spine is ${g.spine.toFixed(1)} mm, so its text is set very small. Consider leaving it plain on books this thin.` });
  else out.push({ level: "ok", text: `Spine ${g.spine.toFixed(1)} mm (${(g.spine / IN).toFixed(3)} in) for ${d.pages} pages on ${d.paper.toLowerCase()} paper.` });
  if (!d.frontArt) out.push({ level: "warn", text: "No front artwork: the template background is used." });
  const isbn = d.isbn.trim();
  if (isbn && !toIsbn13(isbn)) out.push({ level: "warn", text: "That ISBN isn't valid (check the digits)." });
  else if (isbn) out.push({ level: "ok", text: "ISBN barcode drawn as sharp vector lines in the print PDF." });
  else if (d.reserveBarcode) out.push({ level: "ok", text: "Barcode area kept clear: KDP adds its own barcode there." });
  if (d.blurb.trim().split(/\s+/).length > 230) out.push({ level: "warn", text: "The blurb is long for a back cover (aim for 120–200 words)." });
  if (d.endorsements.some((e) => /\[|\]/.test(e.quote + e.by))) out.push({ level: "warn", text: "An endorsement still has a [placeholder]. Use only real quotes you have permission to print." });
  if (/\[[^\]]+\]/.test(d.bio)) out.push({ level: "warn", text: "The author bio still has [placeholders] to fill in." });
  return out;
}

// ── ISBN / EAN-13 barcode ────────────────────────────────────────────────────

/** Normalises an ISBN-10 or ISBN-13 to the 13 digits printed on the barcode, or null if invalid. */
export function toIsbn13(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(s)) {
    if (!/^97[89]/.test(s)) return null;
    return ean13Check(s.slice(0, 12)) === Number(s[12]) ? s : null;
  }
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((a, c, i) => a + (c === "X" ? 10 : Number(c)) * (10 - i), 0);
    if (sum % 11 !== 0) return null;
    const base = `978${s.slice(0, 9)}`;
    return base + ean13Check(base);
  }
  return null;
}
export function ean13Check(twelve: string): number {
  const sum = [...twelve].reduce((a, c, i) => a + Number(c) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}
/** The line above the bars. Correct hyphenation needs the ISBN agency's range tables, so the digits are printed unhyphenated, which retailers accept. */
export const isbnLabel = (d13: string) => `ISBN ${d13}`;

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

/** The 95 modules of an EAN-13 symbol as "1" (bar) / "0" (space). */
export function ean13Modules(d13: string): string {
  const d = [...d13].map(Number);
  const par = PARITY[d[0]];
  let m = "101";
  for (let i = 1; i <= 6; i++) m += (par[i - 1] === "L" ? L : G)[d[i]];
  m += "01010";
  for (let i = 7; i <= 12; i++) m += R[d[i]];
  return m + "101";
}
/** Guard bars (start, centre, end) extend below the others. */
export const isGuard = (i: number) => i < 3 || (i >= 45 && i < 50) || i >= 92;

// ── Colour helpers ───────────────────────────────────────────────────────────

export function luminance(hex: string): number {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return 0;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
export const inkFor = (bgHex: string) => (luminance(bgHex) > 150 ? "#14171d" : "#ffffff");

export { BLEED_MM };
