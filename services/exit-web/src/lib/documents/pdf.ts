import type { DdmDocument } from "./ddm";

// ── EXITOS PDF RENDERER ─────────────────────────────────────────────
// ExitOS's own PDF: a document version's model (DDM) laid out on A4 and written as a PDF file in the
// browser — no service, no library, nothing leaves the device. Text is real text (selectable,
// searchable), set in the PDF standard Helvetica faces. Layout: a title block with the document's
// classification, owner, audience, date, version, status and reference; numbered sections; paragraphs,
// lists, tables (header row repeated on each page) and callouts; a running header with the
// classification and a footer with the reference and "Page x of y". The file's Title metadata is the
// document's title. Pure and deterministic: the same version renders to the same bytes.

const PAGE_W = 595.28, PAGE_H = 841.89;
const MARGIN = 56, TOP = PAGE_H - 74, BOTTOM = 64, CONTENT_W = PAGE_W - 2 * MARGIN;

type Font = "F1" | "F2" | "F3"; // Helvetica, Helvetica-Bold, Helvetica-Oblique
type RGB = readonly [number, number, number];
const INK: RGB = [0.11, 0.12, 0.14], MUTED: RGB = [0.38, 0.4, 0.44], BRONZE: RGB = [0.54, 0.42, 0.18], LINE: RGB = [0.82, 0.8, 0.76], FILL: RGB = [0.965, 0.95, 0.925];

// Helvetica advance widths (per 1000 em) for printable ASCII, from the standard font metrics.
const HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
// WinAnsi code → width for the upper half that documents use (the rest fall back to their base letter)
const UPPER: Record<number, [number, number]> = {
  0x80: [556, 556], 0x85: [1000, 1000], 0x91: [222, 278], 0x92: [222, 278], 0x93: [333, 500], 0x94: [333, 500], 0x95: [350, 350],
  0x96: [556, 556], 0x97: [1000, 1000], 0x99: [1000, 1000], 0xa0: [278, 278], 0xa3: [556, 556], 0xa7: [556, 556], 0xa9: [737, 737],
  0xab: [556, 556], 0xae: [737, 737], 0xb0: [400, 400], 0xb1: [584, 584], 0xb7: [278, 278], 0xbb: [556, 556], 0xd7: [584, 584], 0xf7: [584, 584],
};
// Unicode → WinAnsi for the 0x80–0x9F block
const WIN: Record<string, number> = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };
// characters outside WinAnsi, written as their plain equivalents
const SUBST: Record<string, string> = { "→": "->", "←": "<-", "↔": "<->", "≥": ">=", "≤": "<=", "≈": "~", "≠": "!=", "−": "-", "‑": "-", "‐": "-", "‒": "-", "✓": "v", "✔": "v", "✗": "x", "✕": "x",
  " ": " ", " ": " ", " ": " ", " ": " ", "​": "", "′": "'", "″": '"', "◆": "*", "●": "*", "○": "o", "◉": "*", "▸": ">", "·": "·" };

/** Text as WinAnsi codes (one char code < 256 per character). */
export function toWinAnsi(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const s = SUBST[ch] ?? ch;
    for (const c of s) {
      const code = c.codePointAt(0)!;
      if (WIN[c] != null) out += String.fromCharCode(WIN[c]);
      else if (code === 9 || code === 10) out += " ";
      else if (code >= 32 && code < 127) out += c;
      else if (code >= 0xa0 && code <= 0xff) out += c;
      else {
        const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
        out += base && base.codePointAt(0)! < 0x100 && base !== c ? base : "?";
      }
    }
  }
  return out;
}

function charWidth(code: number, font: Font): number {
  const bold = font === "F2";
  if (code >= 32 && code < 127) return (bold ? BOLD : HELV)[code - 32]!;
  const u = UPPER[code];
  if (u) return bold ? u[1] : u[0];
  const base = String.fromCharCode(code).normalize("NFD")[0]!.charCodeAt(0);
  return base >= 32 && base < 127 ? (bold ? BOLD : HELV)[base - 32]! : 556;
}
/** Width in points of WinAnsi text. */
export function textWidth(win: string, font: Font, size: number): number {
  let w = 0;
  for (let i = 0; i < win.length; i++) w += charWidth(win.charCodeAt(i), font);
  return (w * size) / 1000;
}
/** Break WinAnsi text into lines no wider than `max`; a word longer than a line is split. */
export function wrap(win: string, font: Font, size: number, max: number): string[] {
  const words = win.split(" ").filter((w, i, a) => w || (i > 0 && i < a.length - 1));
  const lines: string[] = [];
  let cur = "";
  for (let word of words) {
    while (textWidth(word, font, size) > max) {
      let n = word.length;
      while (n > 1 && textWidth(word.slice(0, n), font, size) > max) n--;
      if (cur) { lines.push(cur); cur = ""; }
      lines.push(word.slice(0, n));
      word = word.slice(n);
    }
    const next = cur ? `${cur} ${word}` : word;
    if (textWidth(next, font, size) <= max) cur = next;
    else { if (cur) lines.push(cur); cur = word; }
  }
  if (cur || !lines.length) lines.push(cur);
  return lines;
}

const esc = (win: string): string => win.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[\x80-\xff]/g, (c) => `\\${c.charCodeAt(0).toString(8).padStart(3, "0")}`);
const n2 = (x: number): string => (Math.round(x * 100) / 100).toString();
const rgb = (c: RGB, stroke = false): string => `${c.map(n2).join(" ")} ${stroke ? "RG" : "rg"}`;

interface Block { type: string; text?: string; title?: string; style?: string; ordered?: boolean; items?: Array<{ text: string }>; caption?: string; columns?: Array<{ label: string }>; rows?: Array<Array<{ text: string }>> }
interface Section { heading: string; level?: number; blocks: Block[] }

class Layout {
  readonly pages: string[][] = [[]];
  y = TOP;
  private get ops(): string[] { return this.pages[this.pages.length - 1]!; }
  newPage(): void { this.pages.push([]); this.y = TOP; }
  /** Room for `h` points below the cursor, or a new page. */
  need(h: number): void { if (this.y - h < BOTTOM) this.newPage(); }
  text(x: number, y: number, win: string, font: Font, size: number, color: RGB = INK): void {
    this.ops.push(`BT ${rgb(color)} /${font} ${n2(size)} Tf ${n2(x)} ${n2(y)} Td (${esc(win)}) Tj ET`);
  }
  rect(x: number, y: number, w: number, h: number, fill?: RGB, stroke?: RGB): void {
    const parts = [`${n2(x)} ${n2(y)} ${n2(w)} ${n2(h)} re`];
    if (fill && stroke) this.ops.push(`q ${rgb(fill)} ${rgb(stroke, true)} 0.6 w ${parts[0]} B Q`);
    else if (fill) this.ops.push(`q ${rgb(fill)} ${parts[0]} f Q`);
    else if (stroke) this.ops.push(`q ${rgb(stroke, true)} 0.6 w ${parts[0]} S Q`);
  }
  line(x1: number, y1: number, x2: number, y2: number, color: RGB = LINE, w = 0.6): void {
    this.ops.push(`q ${rgb(color, true)} ${n2(w)} w ${n2(x1)} ${n2(y1)} m ${n2(x2)} ${n2(y2)} l S Q`);
  }
  /** A wrapped run of text from the cursor; returns nothing, moves the cursor. */
  para(text: string, opts: { font?: Font; size?: number; color?: RGB; indent?: number; leading?: number; after?: number } = {}): void {
    const font = opts.font ?? "F1", size = opts.size ?? 10, leading = opts.leading ?? size * 1.42, indent = opts.indent ?? 0;
    for (const l of wrap(toWinAnsi(text), font, size, CONTENT_W - indent)) {
      this.need(leading);
      this.y -= leading;
      this.text(MARGIN + indent, this.y + leading * 0.28, l, font, size, opts.color ?? INK);
    }
    this.y -= opts.after ?? 6;
  }
}

function drawTable(L: Layout, b: Block): void {
  const cols = b.columns ?? [], rows = b.rows ?? [];
  if (!cols.length) return;
  const size = 8.5, leading = 11.5, pad = 4;
  if (b.caption) { L.need(leading * 3); L.para(b.caption, { font: "F2", size: 9, after: 3, color: MUTED }); }
  // column widths follow their content, within limits, scaled to the text width
  const natural = cols.map((c, i) => {
    const cells = [c.label, ...rows.map((r) => r[i]?.text ?? "")].map((t) => toWinAnsi(t));
    const widest = Math.max(...cells.map((t, k) => Math.min(textWidth(t, k === 0 ? "F2" : "F1", size), 220)));
    // short phrases ("Not started", "by weeks 8–10") stay on one line where they can
    const phrase = Math.max(...cells.slice(1).map((t) => (t.length <= 16 ? textWidth(t, "F1", size) : 0)), ...cells.map((t, k) => Math.max(...t.split(" ").map((w) => textWidth(w, k === 0 ? "F2" : "F1", size)))));
    return Math.max(48, widest + 2 * pad, Math.min(phrase, 110) + 2 * pad);
  });
  const minimum = natural.map((w) => Math.min(w, 110));
  const total = natural.reduce((a, x) => a + x, 0);
  // proportional to content, but no column below its one-line minimum while the others can give way
  let widths = natural.map((w) => (w / total) * CONTENT_W);
  const short = widths.map((w, i) => Math.max(0, minimum[i]! - w));
  const lack = short.reduce((a, x) => a + x, 0);
  if (lack > 0) {
    const spare = widths.map((w, i) => (short[i]! > 0 ? 0 : Math.max(0, w - minimum[i]!)));
    const room = spare.reduce((a, x) => a + x, 0);
    if (room >= lack) widths = widths.map((w, i) => (short[i]! > 0 ? minimum[i]! : w - (spare[i]! / room) * lack));
  }
  const cellLines = (texts: readonly string[], font: Font): string[][] => texts.map((t, i) => wrap(toWinAnsi(t || " "), font, size, widths[i]! - 2 * pad));
  const header = cellLines(cols.map((c) => c.label), "F2");
  const headerH = Math.max(...header.map((l) => l.length)) * leading + 2 * pad;
  const drawRow = (lines: string[][], font: Font, h: number, fill?: RGB): void => {
    const top = L.y;
    if (fill) L.rect(MARGIN, top - h, CONTENT_W, h, fill);
    let x = MARGIN;
    lines.forEach((cell, i) => {
      cell.forEach((l, k) => L.text(x + pad, top - pad - leading * (k + 1) + leading * 0.28, l, font, size));
      x += widths[i]!;
    });
    L.line(MARGIN, top - h, MARGIN + CONTENT_W, top - h);
    L.y = top - h;
  };
  const drawHeader = (): void => { L.line(MARGIN, L.y, MARGIN + CONTENT_W, L.y, INK, 0.8); drawRow(header, "F2", headerH, FILL); };
  L.need(headerH + leading + 2 * pad);
  drawHeader();
  for (const r of rows) {
    const lines = cellLines(cols.map((_, i) => r[i]?.text ?? ""), "F1");
    const h = Math.max(...lines.map((l) => l.length)) * leading + 2 * pad;
    if (L.y - h < BOTTOM) { L.newPage(); drawHeader(); }
    drawRow(lines, "F1", h);
  }
  L.y -= 10;
}

function drawCallout(L: Layout, b: Block): void {
  const size = 9.5, leading = 13.5, pad = 9;
  const title = b.title ? wrap(toWinAnsi(b.title), "F2", size, CONTENT_W - 2 * pad - 4) : [];
  const body = b.text ? wrap(toWinAnsi(b.text), "F1", size, CONTENT_W - 2 * pad - 4) : [];
  const h = (title.length + body.length) * leading + 2 * pad;
  if (h < TOP - BOTTOM) L.need(h + 6);
  if (L.y - h >= BOTTOM) {
    const top = L.y;
    L.rect(MARGIN, top - h, CONTENT_W, h, FILL, LINE);
    L.rect(MARGIN, top - h, 3, h, BRONZE);
    let y = top - pad;
    for (const l of title) { y -= leading; L.text(MARGIN + pad + 4, y + leading * 0.28, l, "F2", size); }
    for (const l of body) { y -= leading; L.text(MARGIN + pad + 4, y + leading * 0.28, l, "F1", size); }
    L.y = top - h - 10;
  } else {
    // taller than a page: set as plain text
    if (b.title) L.para(b.title, { font: "F2", size, after: 2 });
    if (b.text) L.para(b.text, { size, after: 10 });
  }
}

const STATUS_WORD: Record<string, string> = { draft: "Draft", review: "In review", final: "Final" };
const meta = (d: DdmDocument): Record<string, string> => {
  const m = (d.metadata ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v == null ? "" : String(v)]));
};

/** Options: `review` is the version's review state in words ("Approved", "In review"), shown beside the
 *  document's own status; `notice` is set in a callout under the title block (e.g. that the figures are
 *  sample data). */
export interface PdfOptions { readonly review?: string; readonly notice?: string }

/** The PDF for a document version's model, as bytes. */
export function renderDocumentPdf(doc: DdmDocument, opts: PdfOptions = {}): Uint8Array {
  const m = meta(doc);
  const cls = (doc.classification ?? {}) as { level?: string; handling?: string };
  const title = m.title || "Untitled document";
  const L = new Layout();

  // ── title block
  if (cls.level) {
    const label = toWinAnsi(cls.level);
    const w = textWidth(label, "F2", 8) + 14;
    L.rect(MARGIN, L.y - 14, w, 16, undefined, BRONZE);
    L.text(MARGIN + 7, L.y - 9.5, label, "F2", 8, BRONZE);
    L.y -= 30;
  }
  L.para(title, { font: "F2", size: 21, leading: 26, after: 4 });
  if (m.subtitle) L.para(m.subtitle, { size: 12, color: MUTED, leading: 16, after: 8 });
  const facts: Array<[string, string]> = [
    ["Prepared by", m.owningBody ?? ""], ["For", m.audience ?? ""], ["Date", m.date ?? ""],
    ["Version", [m.version, STATUS_WORD[m.status ?? ""] ?? m.status].filter(Boolean).join(" · ")], ["Reference", m.referenceCode ?? ""], ["Review", opts.review ?? ""],
  ].filter(([, v]) => v) as Array<[string, string]>;
  L.y -= 4;
  for (const [k, v] of facts) {
    L.need(14);
    L.y -= 14;
    L.text(MARGIN, L.y + 4, toWinAnsi(k), "F2", 8.5, MUTED);
    const lines = wrap(toWinAnsi(v), "F1", 9.5, CONTENT_W - 90);
    lines.forEach((l, i) => { if (i) { L.y -= 13; } L.text(MARGIN + 90, L.y + 4, l, "F1", 9.5); });
  }
  if (cls.handling) { L.y -= 6; L.para(cls.handling, { font: "F3", size: 8.5, color: MUTED, after: 4 }); }
  if (opts.notice) { L.y -= 4; drawCallout(L, { type: "callout", title: "Sample data", text: opts.notice }); }
  L.y -= 6;
  L.line(MARGIN, L.y, MARGIN + CONTENT_W, L.y, INK, 0.8);
  L.y -= 16;

  // ── sections
  const sections = ((doc.sections ?? []) as unknown as Section[]);
  let n = 0, sub = 0;
  for (const s of sections) {
    const level = s.level ?? 1;
    if (level <= 1) { n++; sub = 0; } else sub++;
    const label = level <= 1 ? `${n}. ${s.heading}` : `${n}.${sub} ${s.heading}`;
    L.need(52); // a heading never sits alone at the foot of a page
    L.y -= level <= 1 ? 8 : 4;
    L.para(label, { font: "F2", size: level <= 1 ? 13 : 11, leading: level <= 1 ? 18 : 15, after: 4 });
    for (const b of s.blocks ?? []) {
      if (b.type === "paragraph") L.para(b.text ?? "", { after: 7, ...(b.style === "lead" ? { font: "F2" as Font } : {}) });
      else if (b.type === "bullets") {
        (b.items ?? []).forEach((it, i) => {
          const mark = b.ordered ? `${i + 1}.` : "•";
          const lines = wrap(toWinAnsi(it.text ?? ""), "F1", 10, CONTENT_W - 16);
          lines.forEach((l, k) => {
            L.need(14.2);
            L.y -= 14.2;
            if (k === 0) L.text(MARGIN + 2, L.y + 4, toWinAnsi(mark), "F1", 10);
            L.text(MARGIN + 16, L.y + 4, l, "F1", 10);
          });
          L.y -= 2;
        });
        L.y -= 6;
      } else if (b.type === "table") drawTable(L, b);
      else if (b.type === "callout") drawCallout(L, b);
      else if (b.text) L.para(b.text);
    }
  }

  // ── running header and footer on every page
  const total = L.pages.length;
  const headLeft = toWinAnsi(cls.level ?? ""), headRight = wrap(toWinAnsi(title), "F1", 7.5, CONTENT_W * 0.55)[0] ?? "";
  const foot = toWinAnsi(`ExitOS${m.referenceCode ? ` · ${m.referenceCode}` : ""}`);
  L.pages.forEach((ops, i) => {
    const put = (x: number, y: number, win: string, font: Font, size: number, color: RGB): void => { ops.push(`BT ${rgb(color)} /${font} ${n2(size)} Tf ${n2(x)} ${n2(y)} Td (${esc(win)}) Tj ET`); };
    if (headLeft) put(MARGIN, PAGE_H - 40, headLeft, "F2", 7.5, BRONZE);
    if (i > 0) put(PAGE_W - MARGIN - textWidth(headRight, "F1", 7.5), PAGE_H - 40, headRight, "F1", 7.5, MUTED);
    ops.push(`q ${rgb(LINE, true)} 0.5 w ${n2(MARGIN)} ${n2(PAGE_H - 48)} m ${n2(PAGE_W - MARGIN)} ${n2(PAGE_H - 48)} l S Q`);
    ops.push(`q ${rgb(LINE, true)} 0.5 w ${n2(MARGIN)} 44 m ${n2(PAGE_W - MARGIN)} 44 l S Q`);
    put(MARGIN, 30, wrap(foot, "F1", 7.5, CONTENT_W * 0.7)[0] ?? "", "F1", 7.5, MUTED);
    const pg = toWinAnsi(`Page ${i + 1} of ${total}`);
    put(PAGE_W - MARGIN - textWidth(pg, "F1", 7.5), 30, pg, "F1", 7.5, MUTED);
  });

  return writePdf(L.pages, { title, subject: m.subtitle ?? "", date: m.date ?? "" });
}

/** A UTF-16BE hex string, for document information (any script). */
const infoString = (s: string): string => {
  let hex = "FEFF";
  for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase();
  return `<${hex}>`;
};

function writePdf(pages: string[][], info: { title: string; subject: string; date: string }): Uint8Array {
  const objs: string[] = [];
  const add = (body: string): number => { objs.push(body); return objs.length; };
  const catalog = add(""), pagesId = add("");
  const fonts = [
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>"),
  ];
  const resources = `<< /Font << /F1 ${fonts[0]} 0 R /F2 ${fonts[1]} 0 R /F3 ${fonts[2]} 0 R >> >>`;
  const kids: number[] = [];
  for (const ops of pages) {
    const stream = ops.join("\n");
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${n2(PAGE_W)} ${n2(PAGE_H)}] /Resources ${resources} /Contents ${content} 0 R >>`));
  }
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(info.date) ? `D:${info.date.replace(/-/g, "")}000000Z` : "";
  const infoId = add(`<< /Title ${infoString(info.title)}${info.subject ? ` /Subject ${infoString(info.subject)}` : ""} /Creator (ExitOS) /Producer (ExitOS document renderer)${d ? ` /CreationDate (${d})` : ""} >>`);

  let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets: number[] = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}

/** A file name for the PDF of a version: the title, the version number. */
export function pdfFilename(doc: DdmDocument): string {
  const m = meta(doc);
  const base = (m.title || "document").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "document";
  return `${base}${m.version ? `-v${m.version.replace(/[^\w.]+/g, "")}` : ""}.pdf`;
}

/** Save the PDF in the browser. */
export function downloadPdf(doc: DdmDocument, opts: PdfOptions = {}): void {
  const bytes = renderDocumentPdf(doc, opts);
  const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: pdfFilename(doc) });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
