import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const CV_ACCEPT = ".pdf,.docx,.txt";
export const CV_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Extract plain text from an uploaded CV file. PDFs are read page-by-page via
// pdf.js; everything else is read as text. DOCX is read as text too (not a true
// unzip) — good enough for the model to parse, and PDF/TXT are the common cases.
export async function extractFileText(file: File): Promise<string> {
  let text: string;
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // pdf.js typed items expose `str` on TextItem; cast as the upstream code does.
      pages.push(content.items.map((item: any) => (item.str as string) ?? "").join(" "));
    }
    text = pages.join("\n\n");
  } else {
    text = await file.text();
  }
  if (!text || text.trim().length < 20) {
    throw new Error("Could not extract readable text from this file. Please try a different format.");
  }
  return text;
}
