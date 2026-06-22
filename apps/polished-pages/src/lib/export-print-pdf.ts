// Print-ready text interior PDF. Unlike the image-based export, this lays out
// real, selectable text with the standard Times font (base-14, universally
// embeddable) — paginated at the chosen trim size with book margins, a title
// page, a table of contents with accurate page numbers, running headers, chapters
// starting on a new page, and page numbers. Suitable for KDP/IngramSpark
// interiors. jsPDF is loaded dynamically.
import type { TrimSize } from "@/lib/print-sizes";
import { isRtlText } from "@/lib/languages";

const PT_TO_MM = 0.352778;
const strip = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`/g, "");

export async function markdownToPrintPdf(
  markdown: string,
  opts: { title: string; trim: TrimSize },
  filename: string,
): Promise<void> {
  // The standard PDF fonts can't shape right-to-left scripts; for RTL content the
  // EPUB and design-PDF (browser-rendered) paths handle direction correctly.
  if (isRtlText(markdown)) {
    throw new Error("For right-to-left languages, export EPUB or the Design PDF — the text-interior PDF can't shape this script.");
  }
  const { jsPDF } = await import("jspdf");
  const { wmm: pageW, hmm: pageH } = opts.trim;
  const pdf = new jsPDF({ orientation: pageW > pageH ? "l" : "p", unit: "mm", format: [pageW, pageH] });

  // Book margins (mm): a touch more on the inside (gutter) and bottom.
  const mTop = 16, mBottom = 18, mLeft = 18, mRight = 15;
  const contentW = pageW - mLeft - mRight;
  const bodyPt = 11, leadMul = 1.5;
  const lineHeight = (pt: number) => pt * PT_TO_MM * leadMul;

  const src = markdown.replace(/\r\n/g, "\n").split("\n");

  // Pre-scan chapters (level-1 headings) to size the reserved table of contents.
  const chapterTitles = src.filter((l) => /^#\s+/.test(l.trim())).map((l) => strip(l.trim().replace(/^#\s+/, "")));
  const tocLineH = 7;
  const tocUsableH = pageH - mTop - mBottom - 16; // minus the "Contents" heading
  const perTocPage = Math.max(1, Math.floor(tocUsableH / tocLineH));
  const tocPages = chapterTitles.length ? Math.ceil(chapterTitles.length / perTocPage) : 0;

  pdf.setTextColor(20);
  // ── Title page (jsPDF page 1) ──
  pdf.setFont("times", "bold");
  pdf.setFontSize(24);
  pdf.text(pdf.splitTextToSize(strip(opts.title), contentW) as string[], pageW / 2, pageH / 2 - 10, { align: "center" });

  // Reserve blank pages for the table of contents (filled in at the end, once we
  // know each chapter's real page).
  for (let i = 0; i < tocPages; i++) pdf.addPage();

  // ── Body ──
  pdf.addPage(); // first body page
  let bodyPageNo = 1;          // printed page number (body restarts at 1, book-style)
  let currentChapter = "";
  let chapterStartPage = true; // current page opens a chapter → no running header
  const chapterStarts: { title: string; page: number }[] = [];
  let y = mTop;

  const footer = () => {
    pdf.setFont("times", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(String(bodyPageNo), pageW / 2, pageH - 10, { align: "center" });
    pdf.setTextColor(20);
  };
  const runningHeader = () => {
    if (chapterStartPage) return; // chapter-opening pages carry no running head
    pdf.setFont("times", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(150);
    pdf.text(currentChapter || strip(opts.title), pageW / 2, 10, { align: "center", maxWidth: contentW });
    pdf.setTextColor(20);
  };
  const newBodyPage = () => { footer(); pdf.addPage(); bodyPageNo += 1; y = mTop; chapterStartPage = false; runningHeader(); };
  const startChapterPage = () => { footer(); pdf.addPage(); bodyPageNo += 1; y = mTop; chapterStartPage = true; };

  const emit = (text: string, pt: number, font: "normal" | "bold" | "italic", gapBefore = 0, gapAfter = 1.5) => {
    if (!text.trim()) return;
    pdf.setFont("times", font);
    pdf.setFontSize(pt);
    const lh = lineHeight(pt);
    y += gapBefore;
    const lines = pdf.splitTextToSize(text, contentW) as string[];
    for (const line of lines) {
      if (y + lh > pageH - mBottom) newBodyPage();
      pdf.text(line, mLeft, y);
      y += lh;
    }
    y += gapAfter;
  };

  let firstChapter = true;
  for (const raw of src) {
    const t = raw.trim();
    if (/^#\s+/.test(t)) {
      const title = strip(t.replace(/^#\s+/, ""));
      if (!firstChapter) startChapterPage(); else chapterStartPage = true;
      currentChapter = title;
      chapterStarts.push({ title, page: bodyPageNo });
      firstChapter = false;
      y = mTop + 8;
      emit(title, 20, "bold", 0, 6);
    } else if (/^##\s+/.test(t)) {
      if (y > pageH * 0.78) newBodyPage();
      emit(strip(t.replace(/^##\s+/, "")), 16, "bold", 4, 3);
    } else if (/^###\s+/.test(t)) {
      emit(strip(t.replace(/^###\s+/, "")), 13, "bold", 3, 2);
    } else if (/^[-*]\s+/.test(t)) {
      emit(`•  ${strip(t.replace(/^[-*]\s+/, ""))}`, bodyPt, "normal", 0, 1);
    } else if (t === "") {
      y += 1.5;
    } else {
      emit(strip(t), bodyPt, "normal", 0, 2.5);
    }
  }
  footer(); // last body page

  // ── Fill the reserved table of contents (jsPDF pages 2 .. 1+tocPages) ──
  if (tocPages > 0) {
    let idx = 0;
    for (let p = 0; p < tocPages; p++) {
      pdf.setPage(2 + p);
      let ty = mTop;
      if (p === 0) {
        pdf.setFont("times", "bold"); pdf.setFontSize(18); pdf.setTextColor(20);
        pdf.text("Contents", pageW / 2, ty, { align: "center" });
        ty += 16;
      }
      pdf.setFont("times", "normal"); pdf.setFontSize(11); pdf.setTextColor(40);
      const dotW = pdf.getTextWidth(".");
      for (let k = 0; k < perTocPage && idx < chapterStarts.length; k++, idx++) {
        const e = chapterStarts[idx];
        const num = String(e.page);
        const numW = pdf.getTextWidth(num);
        const tt = (pdf.splitTextToSize(e.title, contentW - numW - 8) as string[])[0] ?? e.title;
        pdf.text(tt, mLeft, ty);
        pdf.text(num, pageW - mRight, ty, { align: "right" });
        const startX = mLeft + pdf.getTextWidth(tt) + 2;
        const endX = pageW - mRight - numW - 2;
        if (endX > startX && dotW > 0) {
          pdf.setTextColor(175);
          pdf.text(".".repeat(Math.max(0, Math.floor((endX - startX) / dotW))), startX, ty);
          pdf.setTextColor(40);
        }
        ty += tocLineH;
      }
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
