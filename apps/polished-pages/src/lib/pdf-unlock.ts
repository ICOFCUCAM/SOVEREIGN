import * as pdfjsLib from "pdfjs-dist";

// Opening a PDF in the owner's browser (DESIGN-SPEC.md §18b): with its password when it
// has one, then either its text (a PDF with a text layer) or its pages as images (a scan),
// so Claude Code can read it without poppler on the runner. The password never leaves
// the browser: only the text or the page images are sent to the owner's runner.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export class PdfPasswordError extends Error {
  constructor(public wrong: boolean) { super(wrong ? "That password is not right." : "This PDF needs its password."); }
}

/** Opens the PDF; throws PdfPasswordError when a password is needed or wrong. */
export async function openPdf(data: ArrayBuffer, password?: string): Promise<pdfjsLib.PDFDocumentProxy> {
  try {
    return await pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)), ...(password ? { password } : {}) }).promise;
  } catch (e) {
    const err = e as { name?: string; code?: number };
    if (err?.name === "PasswordException") throw new PdfPasswordError(err.code === 2);
    throw e;
  }
}

/** The PDF's own text, page by page (empty for a scan). */
export async function pdfText(pdf: pdfjsLib.PDFDocumentProxy, onPage?: (n: number, of: number) => void): Promise<string> {
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const c = await page.getTextContent();
    pages.push(c.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : "")).join("").replace(/[ \t]+\n/g, "\n").trim());
    onPage?.(i, pdf.numPages);
  }
  return pages.join("\n\n").trim();
}

/** Enough text that the PDF is not a scan: on average at least 25 words a page. */
export const hasTextLayer = (text: string, pages: number) => text.split(/\s+/).filter(Boolean).length >= Math.max(50, pages * 25);

/** Each page as a JPEG about 1600 pixels wide, in order. */
export async function pdfPageImages(pdf: pdfjsLib.PDFDocumentProxy, onPage?: (n: number, of: number) => void): Promise<Blob[]> {
  const out: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(3, 1600 / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    out.push(await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error("A page couldn't be drawn."))), "image/jpeg", 0.82)));
    page.cleanup();
    onPage?.(i, pdf.numPages);
  }
  return out;
}

/** The name the runner and the scan prompt expect for page n of a PDF: <name>-p001.jpg. */
export const pageName = (pdfStoredAs: string, n: number) => `${pdfStoredAs.replace(/\.[^.]+$/, "")}-p${String(n).padStart(3, "0")}.jpg`;
