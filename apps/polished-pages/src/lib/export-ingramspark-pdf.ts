// IngramSpark-grade print interior. Beyond the generic print PDF this adds the
// things IngramSpark's interior guidelines actually require for a bound book:
//   • mirrored margins — the inside (gutter) margin sits on the correct edge of
//     each recto/verso page instead of always on the left;
//   • a gutter that grows with page count (thicker books need more binding room);
//   • front matter — a title page (recto) and a copyright page (verso);
//   • chapters that always open on a recto (right-hand) page, inserting a blank
//     verso when needed, the way printed books are laid out;
//   • folios (page numbers) on the outside bottom corner, suppressed on front
//     matter and blank pages.
// Page count is detected automatically with a measuring pass so the gutter is
// sized correctly. jsPDF is loaded dynamically. Uses the standard Times family
// (the base-14 PDF fonts, substituted identically by every reader) — for
// guaranteed font embedding, run the file through IngramSpark's preflight.
import type { TrimSize } from "@/lib/print-sizes";
import { ingramGutterMm, INGRAM_OUTSIDE_MM } from "@/lib/print-sizes";
import { isRtlText } from "@/lib/languages";
import { BRAND } from "@/lib/tools";

const PT_TO_MM = 0.352778;
const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`/g, "");

export interface IngramOpts { title: string; author?: string; trim: TrimSize; year?: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Jspdf = any;

// Build the full interior at a given gutter; returns the doc and its page count.
function build(JsPDF: Jspdf, markdown: string, opts: IngramOpts, gutterMm: number): { pdf: Jspdf; pages: number } {
  const { wmm: pageW, hmm: pageH } = opts.trim;
  const out = INGRAM_OUTSIDE_MM, mTop = 14, mBottom = 16;
  const contentW = pageW - gutterMm - out;
  const bodyStartPage = 3; // title (1) + copyright (2), body opens on recto (3)
  const pdf = new JsPDF({ orientation: pageW > pageH ? "l" : "p", unit: "mm", format: [pageW, pageH] });

  let pageNo = 1, y = mTop, dirty = false;
  const recto = () => pageNo % 2 === 1;          // odd physical page = right-hand
  const xLeft = () => (recto() ? gutterMm : out); // gutter flips to the binding edge
  const lineHeight = (pt: number) => pt * PT_TO_MM * 1.5;

  const folio = () => {
    if (pageNo < bodyStartPage || !dirty) return;
    pdf.setFont("times", "normal"); pdf.setFontSize(9); pdf.setTextColor(120);
    const n = String(pageNo - (bodyStartPage - 1));
    if (recto()) pdf.text(n, pageW - out, pageH - 9, { align: "right" });
    else pdf.text(n, out, pageH - 9, { align: "left" });
    pdf.setTextColor(20);
  };
  const nextPage = () => { folio(); pdf.addPage(); pageNo += 1; y = mTop; dirty = false; };

  const emit = (text: string, pt: number, font: "normal" | "bold" | "italic", gapBefore = 0, gapAfter = 1.5) => {
    if (!text.trim()) return;
    pdf.setFont("times", font); pdf.setFontSize(pt);
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
  pdf.setFont("times", "bold"); pdf.setFontSize(26);
  pdf.text(pdf.splitTextToSize(strip(opts.title), contentW) as string[], pageW / 2, pageH / 2 - 12, { align: "center" });
  if (opts.author) {
    pdf.setFont("times", "italic"); pdf.setFontSize(13);
    pdf.text(pdf.splitTextToSize(opts.author, contentW) as string[], pageW / 2, pageH / 2 + 2, { align: "center" });
  }

  // Copyright page (verso, page 2).
  pdf.addPage(); pageNo = 2; y = mTop; dirty = false;
  const year = opts.year ?? new Date().getFullYear();
  pdf.setFont("times", "normal"); pdf.setFontSize(10); pdf.setTextColor(60);
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

  // Body opens on a recto (page 3).
  pdf.addPage(); pageNo = 3; y = mTop; dirty = false;

  const openChapter = () => { nextPage(); if (!recto()) nextPage(); };

  const rows = markdown.replace(/\r\n/g, "\n").split("\n");
  let firstChapter = true;
  for (const raw of rows) {
    const t = raw.trim();
    if (/^#\s+/.test(t)) {
      if (!firstChapter || dirty) openChapter();
      firstChapter = false;
      y += 10;
      emit(strip(t.replace(/^#\s+/, "")), 20, "bold", 0, 6);
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
  const { pages } = build(jsPDF, markdown, opts, 15.875);
  // …then render final with the gutter sized for that page count.
  const { pdf } = build(jsPDF, markdown, opts, ingramGutterMm(pages));
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
