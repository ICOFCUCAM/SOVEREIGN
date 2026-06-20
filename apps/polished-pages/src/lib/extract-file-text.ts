import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const CV_ACCEPT = ".pdf,.docx,.txt";
export const CV_MIME = ["application/pdf", DOCX_MIME, "text/plain"];

const isDocx = (file: File): boolean => file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");

// Extract plain text from an uploaded document. PDFs are read page-by-page via
// pdf.js; DOCX is properly unzipped via mammoth (lazy-loaded so it never weighs
// down the main bundle); everything else is read as plain text.
export async function extractFileText(file: File): Promise<string> {
  let text: string;
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // pdf.js content items are TextItem | TextMarkedContent; only TextItem has `str`.
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    text = pages.join("\n\n");
  } else if (isDocx(file)) {
    const { default: mammoth } = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    text = value;
  } else {
    text = await file.text();
  }
  if (!text || text.trim().length < 20) {
    throw new Error("Could not extract readable text from this file. Please try a different format.");
  }
  return text;
}
