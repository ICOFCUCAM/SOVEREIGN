// Print-ready text interior PDF. Unlike the image-based export, this lays out
// real, selectable text with the standard Times font (base-14, universally
// embeddable) — paginated at the chosen trim size with book margins, chapters
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
  let y = mTop;
  let pageNo = 1;

  const footer = () => {
    pdf.setFont("times", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(String(pageNo), pageW / 2, pageH - 10, { align: "center" });
    pdf.setTextColor(20);
  };
  const newPage = () => { footer(); pdf.addPage(); pageNo += 1; y = mTop; };
  const lineHeight = (pt: number) => pt * PT_TO_MM * leadMul;

  // Emit a wrapped block of text, paginating line-by-line.
  const emit = (text: string, pt: number, font: "normal" | "bold" | "italic", gapBefore = 0, gapAfter = 1.5) => {
    if (!text.trim()) return;
    pdf.setFont("times", font);
    pdf.setFontSize(pt);
    const lh = lineHeight(pt);
    y += gapBefore;
    const lines = pdf.splitTextToSize(text, contentW) as string[];
    for (const line of lines) {
      if (y + lh > pageH - mBottom) newPage();
      pdf.text(line, mLeft, y);
      y += lh;
    }
    y += gapAfter;
  };

  pdf.setTextColor(20);
  // Title page
  pdf.setFont("times", "bold");
  pdf.setFontSize(24);
  pdf.text(pdf.splitTextToSize(strip(opts.title), contentW) as string[], pageW / 2, pageH / 2 - 10, { align: "center" });
  newPage();

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let firstChapter = true;
  for (const raw of lines) {
    const t = raw.trim();
    if (/^#\s+/.test(t)) {
      if (!firstChapter || y > mTop) newPage();
      firstChapter = false;
      y += 8;
      emit(strip(t.replace(/^#\s+/, "")), 20, "bold", 0, 6);
    } else if (/^##\s+/.test(t)) {
      if (y > pageH * 0.78) newPage();
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
  footer();
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
