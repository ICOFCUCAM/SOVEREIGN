import { PDFDocument } from "pdf-lib";

// Join PDFs (and JPG/PNG images, e.g. scanned pages) into one PDF, entirely in
// the browser. Pages are copied as they are, so text stays selectable and
// nothing is re-compressed. Each item can keep only some pages ("1-3, 5, 8-").

export interface PdfJoinItem { name: string; bytes: ArrayBuffer | Uint8Array; kind: "pdf" | "jpg" | "png"; ranges?: string }

const A4 = { w: 595.28, h: 841.89 };

/** Parses "1-3, 5, 8-" into zero-based page indexes for a document of `count` pages. */
export function parseRanges(spec: string | undefined, count: number): number[] {
  const s = (spec ?? "").trim();
  if (!s) return Array.from({ length: count }, (_, i) => i);
  const out: number[] = [];
  for (const part of s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)) {
    const m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
    if (!m || (!m[1] && !m[3])) throw new Error(`“${part}” isn't a page or range. Use e.g. 1-3, 5, 8-`);
    const from = m[1] ? Number(m[1]) : 1;
    const to = m[2] ? (m[3] ? Number(m[3]) : count) : from;
    if (from < 1 || to < from) throw new Error(`“${part}” isn't a valid range.`);
    if (from > count) throw new Error(`Page ${from} doesn't exist; this file has ${count} page${count === 1 ? "" : "s"}.`);
    for (let p = from; p <= Math.min(to, count); p++) out.push(p - 1);
  }
  return out;
}

export function pdfKind(name: string, type = ""): PdfJoinItem["kind"] | null {
  const n = name.toLowerCase();
  if (type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (type === "image/jpeg" || /\.(jpe?g)$/.test(n)) return "jpg";
  if (type === "image/png" || n.endsWith(".png")) return "png";
  return null;
}

export async function pageCount(bytes: ArrayBuffer | Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function joinPdfs(items: PdfJoinItem[], opts: { title?: string } = {}): Promise<{ bytes: Uint8Array; pages: number }> {
  if (items.length === 0) throw new Error("Add at least one file.");
  const out = await PDFDocument.create();
  for (const it of items) {
    if (it.kind === "pdf") {
      let src: PDFDocument;
      try { src = await PDFDocument.load(it.bytes); }
      catch (e) {
        const msg = e instanceof Error ? e.message : "";
        throw new Error(/encrypt/i.test(msg) ? `“${it.name}” is password-protected. Remove the protection, then add it again.` : `“${it.name}” couldn't be read as a PDF.`);
      }
      const idx = parseRanges(it.ranges, src.getPageCount());
      const pages = await out.copyPages(src, idx);
      pages.forEach((p) => out.addPage(p));
    } else {
      const img = it.kind === "png" ? await out.embedPng(it.bytes) : await out.embedJpg(it.bytes);
      // Each image becomes an A4 page (landscape for wide images), fitted with a small margin.
      const land = img.width > img.height;
      const W = land ? A4.h : A4.w, H = land ? A4.w : A4.h, m = 24;
      const s = Math.min((W - 2 * m) / img.width, (H - 2 * m) / img.height);
      const page = out.addPage([W, H]);
      page.drawImage(img, { x: (W - img.width * s) / 2, y: (H - img.height * s) / 2, width: img.width * s, height: img.height * s });
    }
  }
  if (opts.title) out.setTitle(opts.title);
  out.setProducer("Polished Pages");
  out.setCreator("Polished Pages · Join files");
  return { bytes: await out.save(), pages: out.getPageCount() };
}
