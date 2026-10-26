// Real-font text for PDFs, in any writing system. fontkit shapes each run
// (Arabic joining, Indic conjuncts and vowel signs, Hebrew points, kerning,
// ligatures) and subsets the font; this module writes the shaped glyphs into
// the PDF as embedded CID fonts (Identity-H) with a ToUnicode map, so the text
// stays selectable and searchable, and the file passes "all fonts embedded"
// preflight. Lines are broken per script and laid out right-to-left where the
// text is (see scripts.ts). pdf-lib is the file writer.
import * as fontkit from "fontkit";
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFPage, PDFRef, PDFString } from "pdf-lib";
import { BOOK_FACES, FALLBACK_FACE, SCRIPT_FACES, type BookFaceId, type Style } from "@/lib/typeset/font-files";
import { canBreakAfter, paragraphDir, tokenize, visualOrder, type Dir, type ScriptId, type Token } from "@/lib/typeset/scripts";

export type FetchFont = (url: string) => Promise<Uint8Array>;
const browserFetch: FetchFont = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Couldn't load a font (${r.status}).`);
  return new Uint8Array(await r.arrayBuffer());
};
const fileCache = new Map<string, Promise<Uint8Array>>();
function loadBytes(url: string, fetchFont: FetchFont) {
  let p = fileCache.get(url);
  if (!p) { p = fetchFont(url); fileCache.set(url, p); p.catch(() => fileCache.delete(url)); }
  return p;
}

type FkFont = fontkit.Font;
type FkGlyph = fontkit.Glyph;
interface GlyphPos { xAdvance: number; yAdvance: number; xOffset: number; yOffset: number }

const hex4 = (n: number) => n.toString(16).padStart(4, "0");
const utf16hex = (s: string) => [...s].map((c) => {
  const cp = c.codePointAt(0)!;
  if (cp < 0x10000) return hex4(cp);
  const v = cp - 0x10000;
  return hex4(0xd800 + (v >> 10)) + hex4(0xdc00 + (v & 0x3ff));
}).join("");
const num = (n: number) => (Math.round(n * 1000) / 1000).toString();

/** One font as embedded in the PDF: only the glyphs used, renumbered. */
class PdfFont {
  readonly ref: PDFRef;
  // fontkit 2's subset API (includeGlyph returns the new glyph id); @types/fontkit lags behind it.
  private subset: { includeGlyph(id: number): number; encode(): Uint8Array };
  private ids = new Map<number, number>();
  private widths: number[] = [];
  private unicode = new Map<number, string>();
  constructor(private doc: PDFDocument, readonly fk: FkFont, readonly name: string, private tag: string) {
    if (!(fk as unknown as { directory?: { tables?: Record<string, unknown> } }).directory?.tables?.glyf) throw new Error(`${fk.familyName} isn't a TrueType font.`);
    this.ref = doc.context.nextRef();
    this.subset = fk.createSubset() as unknown as PdfFont["subset"];
  }
  use(g: FkGlyph): number {
    let id = this.ids.get(g.id);
    if (id === undefined) {
      id = this.subset.includeGlyph(g.id);
      this.ids.set(g.id, id);
      this.widths[id] = (g.advanceWidth * 1000) / this.fk.unitsPerEm;
    }
    if (g.codePoints?.length && !this.unicode.has(id)) this.unicode.set(id, String.fromCodePoint(...g.codePoints));
    return id;
  }
  finish() {
    const { doc, fk } = this;
    const ctx = doc.context;
    const k = 1000 / fk.unitsPerEm;
    const file = ctx.flateStream(this.subset.encode());
    const fileRef = ctx.register(file);
    const base = `${this.tag}+${(fk.postscriptName || fk.familyName || "Font").replace(/[^A-Za-z0-9-]/g, "")}`;
    const bb = fk.bbox;
    const descriptor = ctx.obj({
      Type: "FontDescriptor", FontName: base, Flags: 4,
      FontBBox: [bb.minX * k, bb.minY * k, bb.maxX * k, bb.maxY * k].map(Math.round),
      ItalicAngle: fk.italicAngle || 0, Ascent: Math.round(fk.ascent * k), Descent: Math.round(fk.descent * k),
      CapHeight: Math.round((fk.capHeight || fk.ascent) * k), StemV: 80, FontFile2: fileRef,
    });
    const w: (number | number[])[] = [];
    const used = [...this.ids.values()].sort((a, b) => a - b);
    for (const id of used) w.push(id, [Math.round(this.widths[id] ?? 0)]);
    const cid = ctx.obj({
      Type: "Font", Subtype: "CIDFontType2", BaseFont: base,
      CIDSystemInfo: { Registry: PDFString.of("Adobe"), Ordering: PDFString.of("Identity"), Supplement: 0 },
      FontDescriptor: ctx.register(descriptor), W: w, CIDToGIDMap: "Identity", DW: 1000,
    });
    const entries = [...this.unicode].sort((a, b) => a[0] - b[0]);
    const chunks: string[] = [];
    for (let i = 0; i < entries.length; i += 100) {
      const part = entries.slice(i, i + 100);
      chunks.push(`${part.length} beginbfchar\n${part.map(([id, s]) => `<${hex4(id)}> <${utf16hex(s)}>`).join("\n")}\nendbfchar`);
    }
    const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n${chunks.join("\n")}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
    const font = ctx.obj({
      Type: "Font", Subtype: "Type0", BaseFont: base, Encoding: "Identity-H",
      DescendantFonts: ctx.obj([ctx.register(cid)]) as PDFArray, ToUnicode: ctx.register(ctx.flateStream(cmap)),
    });
    ctx.assign(this.ref, font);
  }
}

export type FaceKind = "body" | "heading";
export interface TextStyle { kind: FaceKind; style: Style; size: number; gray?: number }
export type Align = "start" | "end" | "center" | "justify" | "left" | "right";
export interface Line { tokens: Token[]; widths: number[]; dir: Dir; last: boolean }

interface Shaped { glyphs: FkGlyph[]; positions: GlyphPos[]; width: number }
interface Segment { font: PdfFont; text: string }
export interface PageCtx { page: PDFPage; ops: string[]; fonts: Set<PdfFont> }

// eslint-disable-next-line no-misleading-character-class -- matches combining marks and joiners one by one, on purpose
const FOLLOWS = /[\p{M}\u200C\u200D\uFE00-\uFE0F\u0640]/u;
const TAGS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Typesets text into a pdf-lib document with real fonts. Create with the book's
 * body and heading faces and the scripts the book uses; every style has a
 * fallback chain (the face, Noto Serif, then one face per script).
 */
export class Typesetter {
  private chains = new Map<string, PdfFont[]>();
  private shapeCache = new Map<string, Shaped>();
  private pages: PageCtx[] = [];
  private constructor(readonly doc: PDFDocument) {}

  static async create(doc: PDFDocument, o: { body: BookFaceId; heading: BookFaceId; scripts: Set<ScriptId>; fetchFont?: FetchFont }) {
    const ts = new Typesetter(doc);
    const fetchFont = o.fetchFont ?? browserFetch;
    const fonts = new Map<string, Promise<PdfFont>>();
    let n = 0;
    const get = (url: string) => {
      let p = fonts.get(url);
      if (!p) {
        const i = n++;
        p = loadBytes(url, fetchFont).then((b) => new PdfFont(doc, fontkit.create(b as unknown as Buffer) as FkFont, `F${i + 1}`, `PP${TAGS[(i / 26) | 0] ?? "Z"}${TAGS[i % 26]}AA`));
        fonts.set(url, p);
      }
      return p;
    };
    const scripts = [...o.scripts];
    await Promise.all((["body", "heading"] as FaceKind[]).flatMap((kind) => (["regular", "italic", "bold", "boldItalic"] as Style[]).map(async (style) => {
      const face = BOOK_FACES[kind === "body" ? o.body : o.heading].files[style];
      const fb = BOOK_FACES[FALLBACK_FACE].files[style];
      const bold = style === "bold" || style === "boldItalic";
      const chain = await Promise.all([get(face), get(fb), ...scripts.map((s) => get(SCRIPT_FACES[s].files[bold ? "bold" : "regular"]))]);
      ts.chains.set(`${kind}:${style}`, chain);
    })));
    return ts;
  }

  addPage(widthPt: number, heightPt: number): PageCtx {
    const p = { page: this.doc.addPage([widthPt, heightPt]), ops: [], fonts: new Set<PdfFont>() };
    this.pages.push(p);
    return p;
  }
  /** Writes every page's text and the fonts. Call once, before saving. */
  finish() {
    const ctx = this.doc.context;
    const all = new Set<PdfFont>();
    for (const p of this.pages) {
      if (p.ops.length) p.page.node.addContentStream(ctx.register(ctx.flateStream(p.ops.join("\n"))));
      for (const f of p.fonts) { p.page.node.setFontDictionary(PDFName.of(f.name), f.ref); all.add(f); }
    }
    for (const f of all) f.finish();
  }

  private chain(st: TextStyle) { return this.chains.get(`${st.kind}:${st.style}`)!; }

  /** Splits text into runs that one font can draw, keeping marks and joiners with their letter. */
  private segments(text: string, st: TextStyle): Segment[] {
    const chain = this.chain(st);
    const out: Segment[] = [];
    let cur: PdfFont | null = null;
    for (const ch of text) {
      let f: PdfFont | null = null;
      if (cur && (FOLLOWS.test(ch) || /\s/.test(ch))) f = cur;
      else {
        const cp = ch.codePointAt(0)!;
        f = chain.find((x) => x.fk.hasGlyphForCodePoint(cp)) ?? cur ?? chain[0];
      }
      if (f === cur && out.length) out[out.length - 1].text += ch;
      else { out.push({ font: f, text: ch }); cur = f; }
    }
    return out;
  }
  private shape(seg: Segment, size: number): Shaped {
    const key = `${seg.font.name}|${seg.text}`;
    let s = this.shapeCache.get(key);
    if (!s) {
      const run = seg.font.fk.layout(seg.text);
      const pos = run.positions as unknown as GlyphPos[];
      s = { glyphs: run.glyphs, positions: pos, width: pos.reduce((a, p) => a + p.xAdvance, 0) / seg.font.fk.unitsPerEm };
      if (this.shapeCache.size > 20000) this.shapeCache.clear();
      this.shapeCache.set(key, s);
    }
    return { ...s, width: s.width * size };
  }

  /** Width of text set on one line, in points. */
  measure(text: string, st: TextStyle): number {
    return this.segments(text, st).reduce((a, s) => a + this.shape(s, st.size).width, 0);
  }
  private spaceWidth(st: TextStyle) { return this.measure(" ", st); }

  /** A straight rule (points), e.g. under a running head or a chapter title. */
  rule(pc: PageCtx, x1: number, y1: number, x2: number, y2: number, weight = 0.5, gray = 0.3) {
    pc.ops.push(`q ${num(gray)} G ${num(weight)} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S Q`);
  }
  /** A small filled diamond, the centre of a chapter ornament. */
  diamond(pc: PageCtx, cx: number, cy: number, r: number, gray = 0.3) {
    pc.ops.push(`q ${num(gray)} g ${num(cx)} ${num(cy + r)} m ${num(cx + r)} ${num(cy)} l ${num(cx)} ${num(cy - r)} l ${num(cx - r)} ${num(cy)} l h f Q`);
  }

  /** Breaks a paragraph into lines no wider than width (points); widthFor narrows given lines (a drop cap, an indent). */
  wrap(text: string, st: TextStyle, width: number, widthFor?: (line: number) => number): Line[] {
    const dir = paragraphDir(text);
    const sp = this.spaceWidth(st);
    const toks: Token[] = [];
    for (const t of tokenize(text)) {
      if (this.measure(t.text, st) <= width) { toks.push(t); continue; }
      // A single word wider than the line (a long URL): break it by character.
      let piece = "";
      for (const ch of t.text) {
        if (piece && this.measure(piece + ch, st) > width) { toks.push({ ...t, text: piece, space: false }); piece = ""; }
        piece += ch;
      }
      toks.push({ ...t, text: piece });
    }
    // Greedy fill over unbreakable groups (a word and the punctuation around it).
    const groups: Token[][] = [];
    for (const t of toks) {
      const g = groups[groups.length - 1];
      if (g && !canBreakAfter(g[g.length - 1])) g.push(t); else groups.push([t]);
    }
    const lines: Line[] = [];
    let cur: Token[] = [], widths: number[] = [], w = 0;
    for (const g of groups) {
      const gw = g.map((t) => this.measure(t.text, st));
      const inner = g.slice(0, -1).reduce((a, t) => a + (t.space ? sp : 0), 0);
      const total = gw.reduce((a, b) => a + b, 0) + inner;
      const gap = cur.length && cur[cur.length - 1].space ? sp : 0;
      if (cur.length && w + gap + total > (widthFor?.(lines.length) ?? width)) { lines.push({ tokens: cur, widths, dir, last: false }); cur = []; widths = []; w = 0; }
      w += (cur.length && cur[cur.length - 1].space ? sp : 0) + total;
      cur.push(...g); widths.push(...gw);
    }
    if (cur.length) lines.push({ tokens: cur, widths, dir, last: true });
    return lines;
  }

  /** Draws one line with its baseline at y; x/width are the column. Returns the line's natural width. */
  drawLine(pc: PageCtx, line: Line, x: number, y: number, width: number, st: TextStyle, align: Align = "start"): number {
    const sp = this.spaceWidth(st);
    const order = visualOrder(line.tokens, line.dir);
    const gapAfter = order.map((a, i) => (i < order.length - 1 && line.tokens[Math.min(a, order[i + 1])].space ? sp : 0));
    const natural = line.widths.reduce((a, b) => a + b, 0) + gapAfter.reduce((a, b) => a + b, 0);
    // Justification goes into the spaces, or between characters in CJK text.
    const slot = order.map((a, i) => i < order.length - 1 && (gapAfter[i] > 0 || Boolean(line.tokens[Math.min(a, order[i + 1])].breakAfter)));
    const gaps = slot.filter(Boolean).length;
    const justify = align === "justify" && !line.last && gaps > 0 && natural > width * 0.6;
    const extra = justify ? (width - natural) / gaps : 0;
    const a = align === "justify" ? "start" : align;
    const atRight = a === "right" || (a === "start" && line.dir === "rtl") || (a === "end" && line.dir === "ltr");
    let cx = justify ? x : a === "center" ? x + (width - natural) / 2 : atRight ? x + width - natural : x;
    order.forEach((ti, i) => {
      const t = line.tokens[ti];
      let segs = this.segments(t.text, st);
      if (t.dir === "R" && segs.length > 1) segs = segs.reverse();
      for (const s of segs) cx = this.emit(pc, s, cx, y, st);
      if (slot[i]) cx += gapAfter[i] + extra;
    });
    return natural;
  }

  /** Draws a paragraph that fits on one line, aligned at x (start/center/end relative to x). */
  text(pc: PageCtx, text: string, x: number, y: number, st: TextStyle, align: "left" | "center" | "right" = "left") {
    const w = this.measure(text, st);
    const lines = this.wrap(text, st, 1e6);
    if (!lines.length) return;
    const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    this.drawLine(pc, lines[0], left, y, w, st, "left");
  }

  /** Letter-spaced text (labels, running heads in capitals): tracking in points between characters. */
  tracked(pc: PageCtx, text: string, x: number, y: number, st: TextStyle, align: "left" | "center" | "right", tracking: number) {
    const chars = [...text];
    const ws = chars.map((c) => (c === " " ? this.spaceWidth(st) : this.measure(c, st)));
    const total = ws.reduce((a, b) => a + b, 0) + tracking * Math.max(0, chars.length - 1);
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    chars.forEach((c, i) => {
      if (c !== " ") for (const seg of this.segments(c, st)) this.emit(pc, seg, cx, y, st);
      cx += ws[i] + tracking;
    });
  }

  private emit(pc: PageCtx, seg: Segment, x: number, y: number, st: TextStyle): number {
    const { glyphs, positions } = this.shape(seg, st.size);
    const f = seg.font;
    pc.fonts.add(f);
    const s = st.size / f.fk.unitsPerEm;
    const ops = pc.ops;
    ops.push(`BT ${num(st.gray ?? 0.08)} g /${f.name} ${num(st.size)} Tf`);
    let pen = x;
    let group: string[] = [];
    let gx = 0;
    const flush = () => { if (group.length) ops.push(`1 0 0 1 ${num(gx)} ${num(y)} Tm [${group.join(" ")}] TJ`); group = []; };
    glyphs.forEach((g, i) => {
      const p = positions[i];
      const id = f.use(g);
      if (p.xOffset || p.yOffset) {
        flush();
        ops.push(`1 0 0 1 ${num(pen + p.xOffset * s)} ${num(y + p.yOffset * s)} Tm <${hex4(id)}> Tj`);
      } else {
        if (!group.length) gx = pen;
        group.push(`<${hex4(id)}>`);
        const adj = ((g.advanceWidth - p.xAdvance) * 1000) / f.fk.unitsPerEm;
        if (Math.abs(adj) > 0.01) group.push(num(adj));
      }
      pen += p.xAdvance * s;
      if (p.xOffset || p.yOffset) gx = pen;
    });
    flush();
    ops.push("ET");
    return pen;
  }
}

// Silence unused-import lint for types used only in casts above.
export type { PDFDict, PDFHexString, PDFNumber };
