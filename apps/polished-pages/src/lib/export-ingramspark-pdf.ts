// IngramSpark-grade print interior. Beyond the generic print PDF this adds the
// things IngramSpark's interior guidelines actually require for a bound book:
//   • mirrored margins — the inside (gutter) margin sits on the correct edge of
//     each recto/verso page instead of always on the left;
//   • a gutter that grows with page count (thicker books need more binding room);
//   • front matter — a title page (recto), a copyright page (verso) and a table
//     of contents with accurate folios;
//   • running headers (book title on verso, chapter on recto), omitted on
//     front matter and chapter-opening pages;
//   • chapters that always open on a recto (right-hand) page, inserting a blank
//     verso when needed, the way printed books are laid out;
//   • folios (page numbers) on the outside bottom corner, suppressed on front
//     matter and blank pages.
// Page count is detected automatically with a measuring pass so the gutter is
// sized correctly. jsPDF is loaded dynamically. The interior is set in Liberation
// Serif (SIL OFL, metric-compatible with Times) and fully embedded, so the file
// passes print-preflight "all fonts embedded" checks.
import type { TrimSize } from "@/lib/print-sizes";
import { ingramGutterMm, INGRAM_OUTSIDE_MM } from "@/lib/print-sizes";
import { isRtlText } from "@/lib/languages";
import { registerEmbeddedSerif } from "@/lib/embed-serif-font";
import { BRAND } from "@/lib/tools";

const PT_TO_MM = 0.352778;
const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`/g, "");

export interface IngramOpts { title: string; author?: string; trim: TrimSize; year?: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Jspdf = any;

// Build the full interior at a given gutter; returns the doc and its page count.
async function build(JsPDF: Jspdf, markdown: string, opts: IngramOpts, gutterMm: number): Promise<{ pdf: Jspdf; pages: number }> {
  const { wmm: pageW, hmm: pageH } = opts.trim;
  const out = INGRAM_OUTSIDE_MM, mTop = 14, mBottom = 16;
  const contentW = pageW - gutterMm - out;
  const pdf = new JsPDF({ orientation: pageW > pageH ? "l" : "p", unit: "mm", format: [pageW, pageH] });
  const FONT = await registerEmbeddedSerif(pdf); // Liberation Serif, fully embedded

  const rows = markdown.replace(/\r\n/g, "\n").split("\n");
  // Pre-scan chapters (level-1 headings) to reserve the table of contents.
  const chapterTitles = rows.filter((l) => /^#\s+/.test(l.trim())).map((l) => strip(l.trim().replace(/^#\s+/, "")));
  const tocLineH = 7;
  const tocUsableH = pageH - mTop - mBottom - 16;
  const perTocPage = Math.max(1, Math.floor(tocUsableH / tocLineH));
  const tocPages = chapterTitles.length ? Math.ceil(chapterTitles.length / perTocPage) : 0;

  let pageNo = 1, y = mTop, dirty = false;
  let bodyStartPage = 3;          // set after front matter is laid out
  let currentChapter = "";
  let chapterStartPage = false;   // current page opens a chapter → no running head
  const chapterStarts: { title: string; folio: number }[] = [];
  const recto = () => pageNo % 2 === 1;           // odd physical page = right-hand
  const xLeft = () => (recto() ? gutterMm : out); // gutter flips to the binding edge
  const lineHeight = (pt: number) => pt * PT_TO_MM * 1.5;
  const folioNum = () => pageNo - (bodyStartPage - 1);

  const folio = () => {
    if (pageNo < bodyStartPage || !dirty) return;
    pdf.setFont(FONT, "normal"); pdf.setFontSize(9); pdf.setTextColor(120);
    const n = String(folioNum());
    if (recto()) pdf.text(n, pageW - out, pageH - 9, { align: "right" });
    else pdf.text(n, out, pageH - 9, { align: "left" });
    pdf.setTextColor(20);
  };
  const header = () => {
    if (pageNo < bodyStartPage || chapterStartPage) return;
    pdf.setFont(FONT, "italic"); pdf.setFontSize(8.5); pdf.setTextColor(150);
    pdf.text(recto() ? (currentChapter || strip(opts.title)) : strip(opts.title), pageW / 2, 9, { align: "center", maxWidth: contentW });
    pdf.setTextColor(20);
  };
  const nextPage = () => { folio(); pdf.addPage(); pageNo += 1; y = mTop; dirty = false; chapterStartPage = false; header(); };

  const emit = (text: string, pt: number, font: "normal" | "bold" | "italic", gapBefore = 0, gapAfter = 1.5) => {
    if (!text.trim()) return;
    pdf.setFont(FONT, font); pdf.setFontSize(pt);
    const lh = lineHeight(pt); y += gapBefore;
    const lines = pdf.splitTextToSize(text, contentW) as string[];
    for (const line of lines) {
      if (y + lh > pageH - mBottom) nextPage();
      pdf.text(line, xLeft(), y); y += lh; dirty = true;
    }
    y += gapAfter;
  };

  // Title page (recto, page 1).
  pdf.setTextColor(20);
  pdf.setFont(FONT, "bold"); pdf.setFontSize(26);
  pdf.text(pdf.splitTextToSize(strip(opts.title), contentW) as string[], pageW / 2, pageH / 2 - 12, { align: "center" });
  if (opts.author) {
    pdf.setFont(FONT, "italic"); pdf.setFontSize(13);
    pdf.text(pdf.splitTextToSize(opts.author, contentW) as string[], pageW / 2, pageH / 2 + 2, { align: "center" });
  }

  // Copyright page (verso, page 2).
  pdf.addPage(); pageNo = 2; y = mTop; dirty = false;
  const year = opts.year ?? new Date().getFullYear();
  pdf.setFont(FONT, "normal"); pdf.setFontSize(10); pdf.setTextColor(60);
  const cw = pageW - out - gutterMm;
  const cLines = [
    strip(opts.title),
    opts.author ? `Copyright © ${year} ${opts.author}.` : `Copyright © ${year}.`,
    "All rights reserved.",
    "",
    `Produced with ${BRAND}.`,
  ];
  let cy = pageH - mBottom - cLines.length * 5;
  for (const l of cLines) { if (l) pdf.text(pdf.splitTextToSize(l, cw) as string[], out, cy); cy += 5; }
  pdf.setTextColor(20);

  // Reserve the table of contents (pages 3 .. 2+tocPages), then open the body
  // on a recto (padding with a blank verso if needed).
  for (let i = 0; i < tocPages; i++) { pdf.addPage(); pageNo += 1; }
  pdf.addPage(); pageNo += 1; y = mTop; dirty = false;
  if (!recto()) { pdf.addPage(); pageNo += 1; }
  bodyStartPage = pageNo;

  const openChapter = () => { nextPage(); if (!recto()) nextPage(); chapterStartPage = true; };

  let firstChapter = true;
  for (const raw of rows) {
    const t = raw.trim();
    if (/^#\s+/.test(t)) {
      const title = strip(t.replace(/^#\s+/, ""));
      if (!firstChapter || dirty) openChapter(); else chapterStartPage = true;
      currentChapter = title;
      chapterStarts.push({ title, folio: folioNum() });
      firstChapter = false;
      y += 10;
      emit(title, 20, "bold", 0, 6);
    } else if (/^##\s+/.test(t)) {
      if (y > pageH * 0.78) nextPage();
      emit(strip(t.replace(/^##\s+/, "")), 15, "bold", 4, 3);
    } else if (/^###\s+/.test(t)) {
      emit(strip(t.replace(/^###\s+/, "")), 12.5, "bold", 3, 2);
    } else if (/^[-*]\s+/.test(t)) {
      emit(`•  ${strip(t.replace(/^[-*]\s+/, ""))}`, 11, "normal", 0, 1);
    } else if (t === "") {
      y += 1.5;
    } else {
      emit(strip(t), 11, "normal", 0, 2.5);
    }
  }
  folio(); // last body page

  // ── Fill the reserved table of contents (mirrored margins per page) ──
  if (tocPages > 0) {
    let idx = 0;
    for (let p = 0; p < tocPages; p++) {
      const tocPageNo = 3 + p;
      pdf.setPage(tocPageNo);
      const isRecto = tocPageNo % 2 === 1;
      const leftX = isRecto ? gutterMm : out;
      const rightX = pageW - (isRecto ? out : gutterMm);
      const cW = pageW - gutterMm - out;
      let ty = mTop;
      if (p === 0) {
        pdf.setFont(FONT, "bold"); pdf.setFontSize(18); pdf.setTextColor(20);
        pdf.text("Contents", pageW / 2, ty, { align: "center" });
        ty += 16;
      }
      pdf.setFont(FONT, "normal"); pdf.setFontSize(11); pdf.setTextColor(40);
      const dotW = pdf.getTextWidth(".");
      for (let k = 0; k < perTocPage && idx < chapterStarts.length; k++, idx++) {
        const e = chapterStarts[idx];
        const num = String(e.folio);
        const numW = pdf.getTextWidth(num);
        const tt = (pdf.splitTextToSize(e.title, cW - numW - 8) as string[])[0] ?? e.title;
        pdf.text(tt, leftX, ty);
        pdf.text(num, rightX, ty, { align: "right" });
        const sX = leftX + pdf.getTextWidth(tt) + 2;
        const eX = rightX - numW - 2;
        if (eX > sX && dotW > 0) {
          pdf.setTextColor(175);
          pdf.text(".".repeat(Math.max(0, Math.floor((eX - sX) / dotW))), sX, ty);
          pdf.setTextColor(40);
        }
        ty += tocLineH;
      }
    }
  }

  return { pdf, pages: pageNo };
}

export async function markdownToIngramSparkPdf(markdown: string, opts: IngramOpts, filename: string): Promise<void> {
  // The base-14 PDF fonts can't shape right-to-left scripts; EPUB and the
  // browser-rendered Design PDF handle direction correctly instead.
  if (isRtlText(markdown)) {
    throw new Error("For right-to-left languages, export EPUB or the Design PDF — the text-interior PDF can't shape this script.");
  }
  const { jsPDF } = await import("jspdf");
  // Pass 1: measure with a provisional gutter to learn the page count…
  const { pages } = await build(jsPDF, markdown, opts, 15.875);
  // …then render final with the gutter sized for that page count.
  const { pdf } = await build(jsPDF, markdown, opts, ingramGutterMm(pages));
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
