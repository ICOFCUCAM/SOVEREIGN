// Book interiors set with real, embedded fonts in any writing system. Two page
// layouts share one typesetter:
//   • "standard": book margins, title page, contents with page numbers,
//     running heads, chapters on a new page, folios;
//   • "ingram": IngramSpark's bound-book rules: mirrored margins with a gutter
//     sized to the page count, title and copyright pages, chapters opening on a
//     recto, running heads (book title verso, chapter recto), outside folios.
// The interior style (styles.ts) designs the pages: chapter openings, drop
// caps, indents or spaced paragraphs, justification, running heads, folios.
// Right-to-left books (Arabic, Hebrew) are laid out for right-hand binding:
// the gutter and folios mirror, and paragraphs run from the right.
import { PDFDocument } from "pdf-lib";
import type { TrimSize } from "@/lib/print-sizes";
import { ingramGutterMm, INGRAM_OUTSIDE_MM } from "@/lib/print-sizes";
import { Typesetter, type FetchFont, type PageCtx, type TextStyle } from "@/lib/typeset/pdf-text";
import type { BookFaceId } from "@/lib/typeset/font-files";
import { charDir, cjkFromLanguage, dominantScript, paragraphDir, scriptsIn, type Dir, type ScriptId } from "@/lib/typeset/scripts";
import { numberWord, styleById, type InteriorStyleId } from "@/lib/typeset/styles";

const PT = 72 / 25.4;
const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`/g, "");

export interface BookTypeOptions {
  title: string;
  author?: string;
  trim: TrimSize;
  layout?: "standard" | "ingram";
  /** Interior design (default Classic). */
  style?: InteriorStyleId;
  /** Typefaces; default to the style's. */
  body?: BookFaceId;
  heading?: BookFaceId;
  /** Body size in points; defaults to the style's. */
  size?: number;
  /** Book language, to pick the right form of Chinese characters (or Japanese/Korean). */
  language?: string | null;
  year?: number;
  /** Credit line for the copyright page. */
  producedWith?: string;
  fetchFont?: FetchFont;
  /** Number of the first chapter (a single chapter set on its own, e.g. a preview of chapter 4). */
  chapterStart?: number;
  /** Line spacing (a multiple of the type size); defaults to the style's. */
  leading?: number;
  /** Page margins around the text. */
  margins?: Margins;
}
export type Margins = "narrow" | "normal" | "wide";
const MARGIN_SCALE: Record<Margins, number> = { narrow: 0.72, normal: 1, wide: 1.3 };

/** A title written as a file name ("The_Oneness_of_Yahuah") is set with spaces. */
export const displayTitle = (t: string) => (/_/.test(t) && !/\s/.test(t.trim()) ? t.replace(/_+/g, " ").trim() : t);

/** Whether most of the book's letters run right to left. */
export function bookDirection(text: string): Dir {
  let r = 0, l = 0;
  for (const c of text.slice(0, 200_000)) { const d = charDir(c); if (d === "R") r++; else if (d === "L") l++; }
  return r > l ? "rtl" : "ltr";
}

const CONTENTS: Partial<Record<ScriptId, string>> = {
  arabic: "المحتويات", hebrew: "תוכן העניינים", ethiopic: "ማውጫ", devanagari: "विषय-सूची", bengali: "সূচিপত্র", tamil: "பொருளடக்கம்",
  armenian: "Բովանդակություն", georgian: "სარჩევი", sc: "目录", tc: "目錄", jp: "目次", kr: "차례",
};

/**
 * A whole book stored as "# Book title" with "## Chapter" sections (how Claude
 * Studio, the Book wizard and the Library compile books) is set with those
 * sections as chapters: the title and by-line belong on the title page, and a
 * compiled "Contents" list gives way to the typeset contents. A manuscript
 * that already uses "# " for its chapters is left as it is.
 */
export function asChapters(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const h1 = lines.filter((l) => /^#\s+/.test(l.trim()));
  const first = lines.findIndex((l) => l.trim());
  if (h1.length !== 1 || first < 0 || !/^#\s+/.test(lines[first].trim()) || !lines.some((l) => /^##\s+/.test(l.trim()))) return markdown;
  const out: string[] = [];
  let i = first + 1;
  // Title-page lines between the title and the first section: a subtitle in *italics* and a "by …" line.
  while (i < lines.length && !/^##\s+/.test(lines[i].trim())) {
    const t = lines[i].trim();
    if (t && !/^\*[^*].*\*$/.test(t) && !/^by\s/i.test(t)) out.push(lines[i]);
    i++;
  }
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    // A compiled "Contents" list gives way to the typeset contents, set where the heading stands.
    if (/^##\s+contents\s*$/i.test(t)) { out.push("# Contents {toc}"); i++; while (i < lines.length && (!lines[i].trim() || /^[-*]\s+/.test(lines[i].trim()))) i++; i--; continue; }
    out.push(lines[i].replace(/^(\s*)##(#*)\s+/, (_m, sp, more) => `${sp}#${more} `));
  }
  return out.join("\n");
}

// Sections that open like chapters but carry no chapter number.
const UNNUMBERED = /^(preface|foreword|introduction|prologue|acknowledge?ments?|dedication|epigraph|conclusion|epilogue|afterword|bibliography|references|works cited|sources|glossary|index|appendix(\s.*)?|notes|endnotes|about the author|also by .*|author'?s note|a note on .*|contents)$/i;
/** "{-}" after a chapter heading (as in Pandoc) sets it without a number. */
export const unnumbered = (title: string) => `${title} {-}`;

interface Block { kind: "h1" | "h2" | "h3" | "li" | "p" | "quote" | "gap" | "toc" | "fn" | "img"; text: string; plain?: boolean; id?: string; src?: string }
/** A quotation the author introduces with a colon and closes with its source, "(Dyrness, 1979, pp. 41-42)". */
const CITED_END = /\((?:[^()]*\b(?:1[5-9]|20)\d\d\b[^()]*|[^()]*\bp{1,2}\.\s*\d[^()]*)\)\s*\.?$/;
function parse(markdown: string): Block[] {
  return markdown.replace(/\r\n/g, "\n").split("\n").map((raw): Block => {
    const t = raw.trim();
    if (/^#\s+/.test(t)) {
      const raw = t.replace(/^#\s+/, "");
      if (/\s\{toc\}\s*$/.test(raw)) return { kind: "toc", text: "" };
      const plain = /\s\{-\}\s*$/.test(raw);
      const text = strip(raw.replace(/\s\{-\}\s*$/, ""));
      return { kind: "h1", text, plain: plain || UNNUMBERED.test(text) };
    }
    if (/^##\s+/.test(t)) return { kind: "h2", text: strip(t.replace(/^##\s+/, "")) };
    if (/^###\s+/.test(t)) return { kind: "h3", text: strip(t.replace(/^###\s+/, "")) };
    const img = /^!\[([^\]]*)\]\((data:image\/(?:png|jpe?g);base64,[A-Za-z0-9+/=]+)\)$/.exec(t);
    if (img) return { kind: "img", text: strip(img[1]), src: img[2] };
    const fn = /^\[\^([^\]\s]+)\]:\s*(.*)$/.exec(t);
    if (fn) return { kind: "fn", id: fn[1], text: strip(fn[2]) };
    if (/^[-*]\s+/.test(t)) return { kind: "li", text: strip(t.replace(/^[-*]\s+/, "")) };
    if (/^>\s?/.test(t)) return { kind: "quote", text: strip(t.replace(/^>\s?/, "")) };
    if (!t) return { kind: "gap", text: "" };
    return { kind: "p", text: strip(t) };
  }).map((b, i, all) => {
    if (b.kind !== "p" || !CITED_END.test(b.text)) return b;
    let j = i - 1; while (j >= 0 && all[j].kind === "gap") j--;
    return j >= 0 && all[j].kind === "p" && /:\s*$/.test(all[j].text) && b.text.length > 80 ? { ...b, kind: "quote" as const } : b;
  });
}

async function build(markdown: string, o: BookTypeOptions, gutterMm: number) {
  const S = styleById(o.style);
  const ingram = (o.layout ?? "standard") === "ingram";
  let blocks = parse(asChapters(markdown));
  // A half-title page: a first section that is only the book's title (the Studio's "Half-title page").
  const firstBlock = blocks.findIndex((b) => b.kind !== "gap");
  const nextBlock = blocks.findIndex((b, i) => i > firstBlock && b.kind !== "gap");
  const halfTitle = firstBlock >= 0 && blocks[firstBlock].kind === "h1" && displayTitle(strip(blocks[firstBlock].text)).toLowerCase() === displayTitle(strip(o.title)).toLowerCase() && (nextBlock < 0 || blocks[nextBlock].kind === "h1" || blocks[nextBlock].kind === "toc");
  if (halfTitle) blocks = blocks.filter((_, i) => i !== firstBlock);
  const scripts = scriptsIn(`${o.title} ${o.author ?? ""} ${markdown}`, cjkFromLanguage(o.language));
  const dir = bookDirection(markdown);
  const main = dominantScript(markdown, cjkFromLanguage(o.language));
  const latin = main === "latin";
  const doc = await PDFDocument.create();
  doc.setTitle(displayTitle(strip(o.title))); if (o.author) doc.setAuthor(o.author);
  doc.setCreator(o.producedWith ?? "Polished Pages"); doc.setProducer("Polished Pages typesetter");
  const ts = await Typesetter.create(doc, { body: o.body ?? S.faces.body, heading: o.heading ?? S.faces.heading, scripts, fetchFont: o.fetchFont });

  const W = o.trim.wmm * PT, H = o.trim.hmm * PT;
  const size = o.size ?? S.size;
  const body: TextStyle = { kind: "body", style: "regular", size };
  const leading = o.leading && o.leading >= 1 && o.leading <= 2.5 ? o.leading : S.leading;
  const lead = size * leading;
  // Margins scale with the choice; IngramSpark's minimums are never undercut.
  const ms = MARGIN_SCALE[o.margins ?? "normal"] ?? 1;
  const top = (ingram ? Math.max(14, 14 * ms) : 16 * ms) * PT, bottom = (ingram ? Math.max(16, 16 * ms) : 18 * ms) * PT;
  const inside = (ingram ? Math.max(gutterMm, gutterMm * ms) : 18 * ms) * PT, outside = (ingram ? Math.max(INGRAM_OUTSIDE_MM, INGRAM_OUTSIDE_MM * ms) : 15 * ms) * PT;
  const colW = W - inside - outside;
  const textH = H - top - bottom;

  const pages: PageCtx[] = [];
  const add = () => { const p = ts.addPage(W, H); pages.push(p); return p; };
  // Physical page n (1-based) is a recto (right-hand) page when odd; in a
  // right-to-left book the binding is on the right, so the gutter mirrors.
  const gutterLeft = (n: number) => (ingram ? ((n % 2 === 1) !== (dir === "rtl")) : dir === "ltr");
  const colX = (n: number) => (gutterLeft(n) ? inside : outside);
  const contentsLabel = (!latin && CONTENTS[main as ScriptId]) || "Contents";

  let pc: PageCtx;
  if (halfTitle) {
    pc = add();
    const hSt: TextStyle = { kind: "heading", style: S.titleStyle === "italic" ? "italic" : "regular", size: 16 };
    let hy = H * 0.66;
    for (const l of ts.wrap(displayTitle(strip(o.title)), hSt, colW)) { ts.drawLine(pc, l, colX(1), hy, colW, hSt, "center"); hy -= 20; }
    if (ingram) add(); // its back stays blank, so the title page is a recto
  }
  // ── Title page ──
  pc = add();
  const bookTitle = displayTitle(strip(o.title));
  // The title is made smaller until every line fits the page (a long word cannot wrap).
  let titleSt: TextStyle = { kind: "heading", style: S.titleStyle === "italic" ? "italic" : "bold", size: ingram ? 26 : 24 };
  let tLines = ts.wrap(bookTitle, titleSt, colW);
  const widest = (ls: typeof tLines) => Math.max(0, ...ls.map((l) => l.widths.reduce((a, b) => a + b, 0)));
  while (titleSt.size > 12 && widest(tLines) > colW) { titleSt = { ...titleSt, size: titleSt.size - 2 }; tLines = ts.wrap(bookTitle, titleSt, colW); }
  let ty = H / 2 + (tLines.length * titleSt.size * 1.2) / 2;
  for (const l of tLines) { ts.drawLine(pc, l, colX(1), ty, colW, titleSt, "center"); ty -= titleSt.size * 1.2; }
  if (S.ornament !== "none") { ty -= 4; ornament(pc, colX(1) + colW / 2, ty + 6); ty -= 10; }
  if (o.author) {
    const aSt: TextStyle = { kind: "body", style: "italic", size: 13 };
    for (const l of ts.wrap(o.author, aSt, colW)) { ty -= 6; ts.drawLine(pc, l, colX(1), ty, colW, aSt, "center"); ty -= 16; }
  }

  function ornament(p: PageCtx, cx: number, y: number) {
    if (S.ornament === "diamond") { ts.rule(p, cx - 42, y, cx - 7, y, 0.5); ts.diamond(p, cx, y, 2.6); ts.rule(p, cx + 7, y, cx + 42, y, 0.5); }
    else if (S.ornament === "rule") {
      if (S.titleAlign === "center") ts.rule(p, cx - 28, y, cx + 28, y, 0.8);
    }
  }

  // ── Copyright page (Ingram) ──
  if (ingram) {
    pc = add();
    const year = o.year ?? new Date().getFullYear();
    const copyN = pages.length;
    const cSt: TextStyle = { kind: "body", style: "regular", size: 10, gray: 0.24 };
    const cl = [bookTitle, o.author ? `Copyright © ${year} ${o.author}.` : `Copyright © ${year}.`, "All rights reserved.", "", `Produced with ${o.producedWith ?? "Polished Pages"}.`];
    let cy = bottom + cl.length * 14;
    for (const l of cl) { if (l) for (const line of ts.wrap(l, cSt, colW)) ts.drawLine(pc, line, colX(copyN), cy, colW, cSt, "start"); cy -= 14; }
  }

  // ── Reserve the contents ──
  const chapters = blocks.filter((b) => b.kind === "h1");
  const tocLine = 20;
  const perToc = Math.max(1, Math.floor((textH - 46) / tocLine));
  const tocCount = chapters.length ? Math.ceil(chapters.length / perToc) : 0;
  // The contents stand where the book places them (before the introduction), or after the title page.
  const tocAt = blocks.findIndex((b) => b.kind === "toc");
  let tocFirst = pages.length + 1;
  if (tocAt < 0) for (let i = 0; i < tocCount; i++) add();

  // ── Body ──
  pc = add();
  if (ingram && pages.length % 2 === 0) pc = add(); // open the body on a recto
  const bodyFirst = pages.length;
  let y = H - top;
  let chapter = "";
  let chapterNo = Math.max(0, (o.chapterStart ?? 1) - 1), h2No = 0;
  let opening = true;   // current page opens a chapter: no running head
  let dirty = false;
  let afterHeading = true; // the next paragraph isn't indented
  let dropNext = false;    // the next paragraph opens a chapter: drop cap
  const starts: { title: string; folio: number }[] = [];
  const pageNo = () => pages.length;
  const folioOf = (n: number) => n - bodyFirst + 1;

  const heads: { n: number; chapter: string; open: boolean; used: boolean }[] = [];
  const tocPages: number[] = [];
  const closePage = () => heads.push({ n: pageNo(), chapter, open: opening, used: dirty });
  const nextPage = () => { closePage(); pc = add(); y = H - top; opening = false; dirty = false; };
  const room = (h: number) => { if (y - h < bottom) nextPage(); };

  /** Sets a paragraph. indent: first-line indent; bullet; drop cap on the first letter. */
  const para = (text: string, st: TextStyle, align: "justify" | "center" | "start", o2: { before?: number; after?: number; indent?: number; hang?: number; bullet?: string; drop?: number; lh?: number; keep?: number; right?: number } = {}) => {
    const lh = o2.lh ?? st.size * (st.kind === "heading" ? 1.25 : leading);
    const pDir = paragraphDir(text);
    const hang = o2.hang ?? 0;
    let rest = text, cap = "", capW = 0, capSize = 0;
    // Drop caps only for left-to-right alphabetic text that starts with a letter.
    if (o2.drop && pDir === "ltr" && latin) {
      const m = /^(\p{L})(.*)$/su.exec(text);
      if (m) {
        cap = m[1]; rest = m[2];
        // Top of the cap level with the first line's capitals, foot on the last line's baseline (cap height ≈ 0.66 em).
        capSize = (lh * (o2.drop - 1) + st.size * 0.66) / 0.66;
        capW = ts.measure(cap, { kind: "heading", style: "regular", size: capSize }) + st.size * 0.35;
      }
    }
    const indent = o2.indent ?? 0;
    const right = o2.right ?? 0;
    const inner = colW - hang - right;
    const firstW = inner - indent;
    const lines = ts.wrap(rest, st, inner, (i) => (cap && i < (o2.drop ?? 0) ? inner - capW : i === 0 ? firstW : inner));
    // A heading stays with at least two lines of what follows it; a paragraph never leaves
    // its first line alone at the foot of a page (orphan) or its last line alone at the top (widow).
    if (o2.keep !== undefined) { if (y - (o2.before ?? 0) - lines.length * lh - (o2.after ?? 0) - o2.keep < bottom) nextPage(); else y -= o2.before ?? 0; }
    else y -= o2.before ?? 0;
    if (cap) room(lh * (o2.drop ?? 1));
    else if (lines.length >= 2) room(lh * 2);
    lines.forEach((l, i) => {
      if (lines.length >= 3 && i === lines.length - 2 && i >= 2 && y - lh * 2 < bottom && y - lh >= bottom) nextPage();
      room(lh);
      const base = y - st.size * 1.02;
      const n = pageNo();
      let x = colX(n) + (pDir === "rtl" ? right : hang);
      let w = inner;
      if (cap && i < (o2.drop ?? 0)) { if (i === 0) ts.text(pc, cap, x, base - lh * ((o2.drop ?? 1) - 1), { kind: "heading", style: "regular", size: capSize }, "left"); x += capW; w -= capW; }
      else if (i === 0 && indent) { if (pDir === "rtl") w -= indent; else { x += indent; w -= indent; } }
      if (o2.bullet && i === 0) ts.text(pc, o2.bullet, pDir === "rtl" ? colX(n) + colW - hang + 5 : colX(n) + 3, base, st, "left");
      ts.drawLine(pc, l, x, base, w, st, align);
      y -= lh;
      dirty = true;
    });
    y -= o2.after ?? 0;
  };

  const chapterOpening = (title: string, plain = false) => {
    if (!plain) chapterNo++;
    h2No = 0;
    const n = pageNo();
    const x = colX(n), cx = x + colW / 2;
    const center = S.titleAlign === "center";
    y = H - top - textH * S.sink;
    if (plain) { /* front and back matter: no chapter number */ }
    else if (S.chapterLabel === "word") {
      const lab: TextStyle = { kind: "body", style: "regular", size: size * 0.95, gray: 0.35 };
      const text = latin ? `CHAPTER ${numberWord(chapterNo).toUpperCase()}` : String(chapterNo);
      y -= lab.size;
      if (center) ts.tracked(pc, text, cx, y, lab, "center", size * 0.18);
      else ts.tracked(pc, text, dir === "rtl" ? x + colW : x, y, lab, dir === "rtl" ? "right" : "left", size * 0.18);
      y -= size * 1.4;
    } else if (S.chapterLabel === "numeral") {
      const big: TextStyle = { kind: "heading", style: "bold", size: 46, gray: 0.82 };
      y -= big.size * 0.8;
      ts.text(pc, String(chapterNo).padStart(2, "0"), center ? cx : dir === "rtl" ? x + colW : x, y, big, center ? "center" : dir === "rtl" ? "right" : "left");
      y -= 14;
    }
    const tSt: TextStyle = { kind: "heading", style: S.titleStyle === "italic" ? "italic" : S.titleStyle === "bold" ? "bold" : "regular", size: S.titleSize };
    const label = S.numberedHeadings && !plain ? `${chapterNo}  ${title}` : title;
    para(label, tSt, center ? "center" : "start", { lh: S.titleSize * 1.2 });
    if (S.ornament === "diamond") { y -= 8; ornament(pc, cx, y); y -= 22; }
    else if (S.ornament === "rule") { y -= 6; if (center) ts.rule(pc, cx - 28, y, cx + 28, y, 0.8); else ts.rule(pc, dir === "rtl" ? x + colW - 56 : x, y, dir === "rtl" ? x + colW : x + 56, y, 1.2, 0.2); y -= 22; }
    else y -= 20;
    afterHeading = true;
    dropNext = S.dropCap > 0;
  };

  // Footnotes ([^1] in the text, "[^1]: …" below): numbered per chapter in order of use, set as notes
  // at the end of their chapter, with a raised number in the text.
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (n: number) => String(n).split("").map((d) => SUP[Number(d)]).join("");
  let notes: { n: number; text: string }[] = [];
  let noteNo = new Map<string, number>();
  let defs = new Map<string, string>();
  const chapterDefs = (from: number) => { const m = new Map<string, string>(); for (let i = from + 1; i < blocks.length && blocks[i].kind !== "h1"; i++) if (blocks[i].kind === "fn") m.set(blocks[i].id!, blocks[i].text); return m; };
  const marks = (text: string) => text.replace(/\[\^([^\]\s]+)\]/g, (_m, id: string) => {
    if (!defs.has(id)) return "";
    if (!noteNo.has(id)) { noteNo.set(id, noteNo.size + 1); notes.push({ n: noteNo.size, text: defs.get(id)! }); }
    return sup(noteNo.get(id)!);
  });
  const flushNotes = () => {
    if (!notes.length) return;
    para("Notes", { kind: "heading", style: "bold", size: Math.round(size * 1.05) }, "start", { before: lead * 1.2, after: lead * 0.3, keep: lead * 2 });
    for (const x of notes) para(`${x.n}. ${x.text}`, { kind: "body", style: "regular", size: Math.max(8, size * 0.85) }, "start", { hang: size * 1.2, after: lead * 0.1, lh: size * 0.85 * leading });
    notes = []; noteNo = new Map();
  };
  defs = chapterDefs(-1);
  let first = true;
  for (const [bi, b] of blocks.entries()) {
    if (b.kind === "fn") continue;
    if (b.kind === "h1") { flushNotes(); defs = chapterDefs(bi); }
    if (b.kind === "p" || b.kind === "li" || b.kind === "quote") b.text = marks(b.text);
    if (b.kind === "toc") {
      if (!tocCount) continue;
      if (!first || dirty) nextPage();
      if (ingram && pageNo() % 2 === 0) nextPage();
      first = false;
      // The contents pages carry no running head or folio; they are filled once every page is known.
      tocFirst = pageNo();
      for (let i = 1; i < tocCount; i++) { closePage(); pc = add(); }
      opening = true; dirty = true; tocPages.push(...Array.from({ length: tocCount }, (_, i) => tocFirst + i));
      continue;
    }
    if (b.kind === "h1") {
      if (!first || dirty) {
        nextPage();
        if (ingram && pageNo() % 2 === 0) nextPage(); // chapters open on a recto
      }
      first = false;
      opening = true;
      chapter = b.text;
      starts.push({ title: S.numberedHeadings && !b.plain ? `${chapterNo + 1}  ${b.text}` : b.text, folio: folioOf(pageNo()) });
      chapterOpening(b.text, b.plain);
    } else if (b.kind === "h2") {
      h2No++;
      para(S.numberedHeadings && chapterNo ? `${chapterNo}.${h2No}  ${b.text}` : b.text, { kind: "heading", style: "bold", size: Math.round(size * 1.35) }, S.titleAlign === "center" && S.paragraphs === "block" ? "center" : "start", { before: lead * 0.9, after: lead * 0.35, keep: lead * 3 });
      afterHeading = true;
    } else if (b.kind === "h3") {
      para(b.text, { kind: "heading", style: S.numberedHeadings ? "bold" : "italic", size: Math.round(size * 1.12) }, "start", { before: lead * 0.6, after: lead * 0.2, keep: lead * 2.5 });
      afterHeading = true;
    } else if (b.kind === "li") {
      para(b.text, body, "start", { hang: size * 1.4, bullet: "•", after: lead * 0.15 });
      afterHeading = false;
    } else if (b.kind === "quote") {
      // Set apart from the author's own words: indented on both sides, a little smaller, space around it.
      const qSize = Math.max(8, size * 0.92);
      para(b.text, { kind: "body", style: "regular", size: qSize }, S.justify ? "justify" : "start", { hang: size * 1.8, right: size * 1.8, before: lead * 0.45, after: lead * 0.55, lh: qSize * leading });
      afterHeading = true;
    } else if (b.kind === "img" && b.src) {
      // A figure: scaled to the text width (and at most 60% of the page's height), its caption below.
      const raw = Uint8Array.from(atob(b.src.split(",")[1]), (c) => c.charCodeAt(0));
      const image = /^data:image\/png/.test(b.src) ? await doc.embedPng(raw) : await doc.embedJpg(raw);
      const k = Math.min(colW / image.width, (textH * 0.6) / image.height, 1.5);
      const w = image.width * k, h = image.height * k;
      const capSt: TextStyle = { kind: "body", style: "italic", size: Math.max(8, size * 0.85), gray: 0.3 };
      const capLines = b.text ? ts.wrap(b.text, capSt, colW) : [];
      room(h + lead * 0.8 + capLines.length * capSt.size * 1.3);
      y -= lead * 0.4;
      pc.page.drawImage(image, { x: colX(pageNo()) + (colW - w) / 2, y: y - h, width: w, height: h });
      y -= h + lead * 0.35;
      for (const l of capLines) { ts.drawLine(pc, l, colX(pageNo()), y - capSt.size, colW, capSt, "center"); y -= capSt.size * 1.3; }
      y -= lead * 0.4;
      dirty = true; afterHeading = true;
    } else if (b.kind === "gap") {
      if (S.paragraphs === "block") y -= lead * 0.15;
    } else {
      const indented = S.paragraphs === "indent" && !afterHeading;
      para(b.text, body, S.justify ? "justify" : "start", { indent: indented ? size * 1.5 : 0, drop: dropNext ? S.dropCap : 0, after: S.paragraphs === "block" ? lead * 0.5 : 0 });
      afterHeading = false; dropNext = false;
    }
  }
  flushNotes();
  closePage();

  // Running heads and folios, now that every page's chapter is known.
  for (const h of heads) {
    if (h.n < bodyFirst || !h.used || tocPages.includes(h.n)) continue;
    const p = pages[h.n - 1];
    const fSt: TextStyle = { kind: "body", style: "regular", size: 9, gray: 0.45 };
    const f = S.folio === "dashes" ? `— ${folioOf(h.n)} —` : String(folioOf(h.n));
    if (ingram && S.folio === "plain") {
      // Outside bottom corner: right on a recto, left on a verso (mirrored for right-to-left books).
      const right = gutterLeft(h.n);
      ts.text(p, f, right ? W - outside : outside, 9 * PT, fSt, right ? "right" : "left");
    } else ts.text(p, f, colX(h.n) + colW / 2, (ingram ? 9 : 10) * PT, fSt, "center");
    if (h.open || S.runningHead === "none") continue;
    const text = ingram ? (h.n % 2 === 1 ? h.chapter || bookTitle : bookTitle) : h.chapter || bookTitle;
    const hy = H - (ingram ? 9 : 10) * PT;
    const cx = colX(h.n) + colW / 2;
    if (S.runningHead === "caps" && latin) ts.tracked(p, text.toUpperCase().slice(0, 60), cx, hy, { kind: "body", style: "regular", size: 7.5, gray: 0.45 }, "center", 1.2);
    else {
      const hSt: TextStyle = { kind: "body", style: "italic", size: 8.5, gray: 0.5 };
      const line = ts.wrap(text, hSt, colW)[0];
      if (line) ts.drawLine(p, line, colX(h.n), hy, colW, hSt, "center");
    }
    if (S.headRule) ts.rule(p, colX(h.n), hy - 5, colX(h.n) + colW, hy - 5, 0.4, 0.55);
  }

  // ── Fill the contents ──
  if (tocCount) {
    const tSt: TextStyle = { kind: "body", style: "regular", size: 11, gray: 0.16 };
    const dots: TextStyle = { ...tSt, gray: 0.7 };
    const dotW = ts.measure(".", tSt);
    const sp = ts.measure(" ", tSt);
    let idx = 0;
    for (let p = 0; p < tocCount; p++) {
      const n = tocFirst + p;
      const page = pages[n - 1];
      let cy = H - top - 18;
      if (p === 0) {
        const cSt: TextStyle = { kind: "heading", style: S.titleStyle === "italic" ? "italic" : "bold", size: 18 };
        if (S.runningHead === "caps" && latin) ts.tracked(page, contentsLabel.toUpperCase(), W / 2, cy, { ...cSt, size: 13 }, "center", 2.5);
        else ts.text(page, contentsLabel, W / 2, cy, cSt, "center");
        cy -= 46;
      }
      for (let k = 0; k < perToc && idx < starts.length; k++, idx++) {
        const e = starts[idx];
        const numStr = String(e.folio);
        const numW = ts.measure(numStr, tSt);
        const x = colX(n);
        const line = ts.wrap(e.title, tSt, colW - numW - 30)[0];
        if (!line) continue;
        const tw = line.widths.reduce((a, b) => a + b, 0) + line.tokens.slice(0, -1).reduce((a, t) => a + (t.space ? sp : 0), 0);
        const rtl = dir === "rtl";
        ts.drawLine(page, line, rtl ? x + numW + 12 : x, cy, colW - numW - 12, tSt, rtl ? "right" : "left");
        if (rtl) ts.text(page, numStr, x, cy, tSt, "left"); else ts.text(page, numStr, x + colW, cy, tSt, "right");
        const from = rtl ? x + numW + 4 : x + tw + 4;
        const to = rtl ? x + colW - tw - 4 : x + colW - numW - 4;
        const count = Math.floor((to - from) / dotW);
        if (count > 2) ts.text(page, ".".repeat(count), from, cy, dots, "left");
        cy -= tocLine;
      }
    }
  }

  ts.finish();
  // Where each chapter (and front or back matter section) opens, as a physical page number.
  return { doc, pages: pages.length, sections: starts.map((x) => ({ title: x.title, page: x.folio + bodyFirst - 1 })), bodyFirst, contents: tocCount ? [tocFirst, tocFirst + tocCount - 1] as [number, number] : null };
}
export interface SetSection { title: string; page: number }

/** Typesets a Markdown book into a print-ready PDF and returns its bytes and page count. */
export async function typesetBook(markdown: string, o: BookTypeOptions): Promise<{ bytes: Uint8Array; pages: number; sections: SetSection[]; bodyFirst: number; contents: [number, number] | null }> {
  if (o.layout === "ingram") {
    // Measure once with a provisional gutter, then set it for the real page count.
    const probe = await build(markdown, o, 15.875);
    const final = await build(markdown, o, ingramGutterMm(probe.pages));
    return { bytes: await final.doc.save(), pages: final.pages, sections: final.sections, bodyFirst: final.bodyFirst, contents: final.contents };
  }
  const r = await build(markdown, o, 0);
  return { bytes: await r.doc.save(), pages: r.pages, sections: r.sections, bodyFirst: r.bodyFirst, contents: r.contents };
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  // Attached while clicked, so every browser honours the file name.
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
