// Writing systems: which scripts a text uses, which way each character runs,
// and where a line may break. Shared by the book typesetter (PDF) and Cover
// Studio (canvas). Pure functions, no fonts.

export type ScriptId = "arabic" | "hebrew" | "ethiopic" | "devanagari" | "bengali" | "tamil" | "armenian" | "georgian" | "sc" | "tc" | "jp" | "kr";

const RANGES: [ScriptId | "han" | "kana" | "hangul", RegExp][] = [
  ["arabic", /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/],
  ["hebrew", /[\u0590-\u05FF\uFB1D-\uFB4F]/],
  ["ethiopic", /[\u1200-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/],
  // eslint-disable-next-line no-misleading-character-class -- Unicode block ranges that include combining marks, on purpose
  ["devanagari", /[\u0900-\u097F\uA8E0-\uA8FF]/],
  ["bengali", /[\u0980-\u09FF]/],
  ["tamil", /[\u0B80-\u0BFF]/],
  ["armenian", /[\u0530-\u058F]/],
  ["georgian", /[\u10A0-\u10FF\u2D00-\u2D2F]/],
  ["kana", /[\u3040-\u30FF\u31F0-\u31FF]/],
  ["hangul", /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/],
  ["han", /[\u3400-\u9FFF\uF900-\uFAFF]/],
];

/** Chinese characters are drawn differently in each region; this picks the right font for them. */
export type CjkVariant = "sc" | "tc" | "jp" | "kr";

/** The non-Latin scripts in a text (Latin, Greek and Cyrillic are covered by the book faces and Noto Serif). */
export function scriptsIn(text: string, cjk?: CjkVariant): Set<ScriptId> {
  const out = new Set<ScriptId>();
  let han = false, kana = false, hangul = false;
  for (const [id, re] of RANGES) {
    if (!re.test(text)) continue;
    if (id === "han") han = true; else if (id === "kana") kana = true; else if (id === "hangul") hangul = true;
    else out.add(id);
  }
  if (kana) out.add("jp");
  if (hangul) out.add("kr");
  if (han) out.add(cjk ?? (kana ? "jp" : hangul ? "kr" : "sc"));
  return out;
}

/** The script most of the letters are in ("latin" for Latin, Greek and Cyrillic). */
export function dominantScript(text: string, cjk?: CjkVariant): ScriptId | "latin" {
  const counts = new Map<string, number>();
  let latin = 0;
  for (const c of text.slice(0, 100_000)) {
    if (/[A-Za-z\u00C0-\u024F\u0370-\u052F]/.test(c)) { latin++; continue; }
    const hit = RANGES.find(([, re]) => re.test(c));
    if (hit) counts.set(hit[0], (counts.get(hit[0]) ?? 0) + 1);
  }
  let best: string = "latin", n = latin;
  for (const [k, v] of counts) if (v > n) { best = k; n = v; }
  if (best === "han" || best === "kana" || best === "hangul") return [...scriptsIn(text, cjk)].find((x) => ["sc", "tc", "jp", "kr"].includes(x)) ?? "sc";
  return best as ScriptId | "latin";
}

/** Guesses the regional form of Chinese characters from a language name or code. */
export function cjkFromLanguage(lang?: string | null): CjkVariant | undefined {
  const l = (lang ?? "").toLowerCase();
  if (/^ja|japan/.test(l)) return "jp";
  if (/^ko|korea/.test(l)) return "kr";
  if (/zh-(tw|hk|hant)|traditional|cantonese|taiwan|hong kong/.test(l)) return "tc";
  if (/^zh|chinese|mandarin/.test(l)) return "sc";
  return undefined;
}

// ── Direction ────────────────────────────────────────────────────────────────

const RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
// eslint-disable-next-line no-misleading-character-class -- Unicode block ranges that include combining marks, on purpose
const STRONG_L = /[A-Za-z\u00C0-\u024F\u0370-\u052F\u0530-\u058F\u0900-\u0DFF\u10A0-\u10FF\u1200-\u139F\u2D80-\u2DDF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;
const DIGIT = /[0-9\u0660-\u0669\u06F0-\u06F9]/;
export type Dir = "ltr" | "rtl";
export const charDir = (c: string): "R" | "L" | "N" | "D" => (RTL.test(c) && !DIGIT.test(c) ? "R" : STRONG_L.test(c) ? "L" : DIGIT.test(c) ? "D" : "N");

/** A paragraph's direction is that of its first strong character. */
export function paragraphDir(text: string): Dir {
  for (const c of text) { const d = charDir(c); if (d === "R") return "rtl"; if (d === "L") return "ltr"; }
  return "ltr";
}
export const isRtl = (text: string) => paragraphDir(text) === "rtl";

// ── Line-break tokens ────────────────────────────────────────────────────────

export interface Token { text: string; space: boolean; dir: "R" | "L" | "D" | "N"; /** A line may break after this token even without a space (CJK). */ breakAfter?: boolean; /** Emphasis inside the paragraph (bold, italic): the face this word is set in. */ style?: "regular" | "italic" | "bold" | "boldItalic" }

const CJK_CHAR = /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF\u3000-\u303F\uFF00-\uFFEF]/;
// CJK punctuation that must not start a line (kinsoku), kept with the character before it.
const NO_LINE_START = /^[\u3001\u3002\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\uFF01\uFF09\u300D\u300F\u3011\u3015\u3009\u300B\u201D\u2019\u30FC\u30FB\u2026\u3001\u3002\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\uFF01\uFF09]$/;

function tokenDir(t: string): Token["dir"] {
  let sawDigit = false;
  for (const c of t) { const d = charDir(c); if (d === "R" || d === "L") return d; if (d === "D") sawDigit = true; }
  return sawDigit ? "D" : "N";
}

/**
 * Splits a paragraph into pieces for line breaking and bidi ordering: words
 * (with whether a space follows), single CJK characters (Korean breaks at
 * spaces like Latin), and punctuation around a word as its own piece, so it
 * lands on the correct side in mixed-direction lines. Lines only break at
 * spaces or between CJK characters.
 */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const push = (t: string, space: boolean, breakAfter = false) => {
    // Peel neutral punctuation off the ends of a word.
    const m = /^([^\p{L}\p{N}\p{M}]*)(.*?)([^\p{L}\p{N}\p{M}]*)$/su.exec(t)!;
    const parts = m[2] ? [m[1], m[2], m[3]].filter(Boolean) : [t];
    parts.forEach((p, i) => out.push({ text: p, space: i === parts.length - 1 ? space : false, dir: tokenDir(p), breakAfter: i === parts.length - 1 ? breakAfter : false }));
  };
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 2) {
    const w = words[i];
    const space = i + 1 < words.length;
    if (!w) continue;
    if (!CJK_CHAR.test(w) || /^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+$/.test(w)) { push(w, space); continue; }
    // Break between Han/kana characters; keep Latin runs inside CJK text whole.
    const parts = w.match(/[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]|[^\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]+/g) ?? [w];
    for (let j = 0; j < parts.length; j++) {
      const last = j === parts.length - 1;
      const prev = out[out.length - 1];
      if (NO_LINE_START.test(parts[j]) && prev && !prev.space) { prev.text += parts[j]; if (last) prev.space = space; continue; }
      out.push({ text: parts[j], space: last ? space : false, dir: tokenDir(parts[j]), breakAfter: !last });
    }
  }
  return out;
}

/** Whether a line may break after token i. */
export const canBreakAfter = (t: Token) => t.space || Boolean(t.breakAfter);

/**
 * Visual order of a line's tokens (a compact form of the Unicode bidi
 * algorithm): numbers stay left-to-right, neutral tokens take the direction of
 * their neighbours when both agree (else the paragraph's), and runs at higher
 * embedding levels are reversed.
 */
export function visualOrder(tokens: Token[], base: Dir): number[] {
  const n = tokens.length;
  const strong = tokens.map((t) => (t.dir === "R" ? "R" : t.dir === "L" ? "L" : t.dir === "D" ? (base === "rtl" ? "D" : "L") : null));
  const resolved: ("R" | "L")[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const s = strong[i];
    if (s === "R" || s === "L") { resolved[i] = s; continue; }
    if (s === "D") { resolved[i] = "L"; continue; }
    let a: string | null = null, b: string | null = null;
    for (let j = i - 1; j >= 0 && !a; j--) if (strong[j]) a = strong[j] === "D" ? "R" : strong[j];
    for (let j = i + 1; j < n && !b; j++) if (strong[j]) b = strong[j] === "D" ? "R" : strong[j];
    resolved[i] = a && a === b ? (a as "R" | "L") : base === "rtl" ? "R" : "L";
  }
  const baseLevel = base === "rtl" ? 1 : 0;
  const levels = resolved.map((r, i) => (base === "rtl" ? (r === "R" ? 1 : 2) : r === "R" ? 1 : strong[i] === "D" && i > 0 && resolved[i - 1] === "R" ? 2 : 0));
  const order = [...Array(n).keys()];
  const max = Math.max(baseLevel, ...levels);
  const minOdd = Math.max(1, Math.min(...levels.filter((l) => l % 2 === 1), max));
  for (let lv = max; lv >= minOdd; lv--) {
    for (let i = 0; i < n;) {
      if (levels[order[i]] < lv) { i++; continue; }
      let j = i; while (j < n && levels[order[j]] >= lv) j++;
      order.splice(i, j - i, ...order.slice(i, j).reverse());
      i = j;
    }
  }
  return order;
}
