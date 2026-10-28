// The publishing package (DESIGN-SPEC.md §21): one .zip for KDP and IngramSpark with the print interior
// (mirrored margins, gutter for the page count), the EPUB, the metadata sheet and the cover's size with its
// spine, checked against the platforms' rules first. The cover image goes in when the book has one.
import JSZip from "jszip";
import { coverSpec, type TrimSize } from "./print-sizes";

export interface PackageInput { title: string; subtitle?: string; author?: string; isbn?: string; publisher?: string; paper?: string; trim: TrimSize; language?: string | null; coverUrl?: string | null }
export interface Check { ok: boolean; level: "block" | "advice"; text: string }

const SCREEN_ONLY = ["kindle", "phone"];
/** What KDP and IngramSpark need, as true statements about this book. */
export function packageChecks(i: PackageInput, pages: number | null): Check[] {
  const c: Check[] = [];
  c.push(SCREEN_ONLY.includes(i.trim.id) ? { ok: false, level: "block", text: `${i.trim.label} is a screen preview, not a print size: choose a print format (for example 6 × 9 in) in Page design.` } : { ok: true, level: "block", text: `Print size ${i.trim.label}.` });
  if (pages != null) c.push(pages >= 24 && pages <= 828 ? { ok: true, level: "block", text: `${pages} pages (KDP accepts 24–828 for paperbacks).` } : { ok: false, level: "block", text: `${pages} pages: KDP paperbacks need 24–828.` });
  const author = i.author?.trim() && !/^\[.*\]$/.test(i.author.trim()) ? i.author.trim() : "";
  c.push(author ? { ok: true, level: "advice", text: `Author: ${author}.` } : { ok: false, level: "advice", text: "No author name yet, only a placeholder (Finish → Production)." });
  c.push(i.isbn?.trim() ? { ok: true, level: "advice", text: `ISBN ${i.isbn.trim()}.` } : { ok: false, level: "advice", text: "No ISBN: IngramSpark needs your own; KDP can give a free one." });
  c.push(i.coverUrl ? { ok: true, level: "advice", text: "Front cover included." } : { ok: false, level: "advice", text: "No cover yet: make it in the Cover tab (the sheet gives its size)." });
  return c;
}

export async function buildPackage(markdown: string, i: PackageInput, fetchCover: (url: string) => Promise<Blob> = async (u) => (await fetch(u)).blob()): Promise<{ blob: Blob; pages: number; checks: Check[] }> {
  const [{ typesetBook }, { getInteriorType }, { markdownToEpubBlob }] = await Promise.all([import("./typeset/book"), import("./typeset/prefs"), import("./export-epub")]);
  const pref = getInteriorType();
  const interior = await typesetBook(markdown, { title: i.title, author: i.author, trim: i.trim, layout: "ingram", style: pref.style, body: pref.body, heading: pref.heading, size: pref.size, leading: pref.leading, margins: pref.margins, language: i.language });
  const checks = packageChecks(i, interior.pages);
  const spec = coverSpec(i.trim, interior.pages, i.paper || "Cream");
  const zip = new JSZip();
  zip.file("interior-print.pdf", interior.bytes);
  zip.file("book.epub", await markdownToEpubBlob(markdown, { title: i.title, author: i.author, language: i.language ?? undefined }));
  if (i.coverUrl) { try { zip.file("cover-front.jpg", await fetchCover(i.coverUrl)); } catch { /* the sheet says the cover is missing */ } }
  const mm = (x: number) => `${x.toFixed(1)} mm (${(x / 25.4).toFixed(3)} in)`;
  zip.file("metadata.txt", [
    `Title: ${i.title}`, i.subtitle ? `Subtitle: ${i.subtitle}` : null, `Author: ${i.author || "[author]"}`, `ISBN: ${i.isbn || "[ISBN]"}`, `Publisher: ${i.publisher || "[publisher]"}`,
    `Language: ${i.language || "en"}`, `Trim size: ${i.trim.label} — ${mm(i.trim.wmm)} × ${mm(i.trim.hmm)}`, `Pages: ${interior.pages}`, `Paper: ${i.paper || "Cream"}`,
    "", "Cover (full wrap, with 3.175 mm bleed on every side):", `  Spine width: ${mm(spec.spineMm)}`, `  Full size: ${mm(spec.fullWmm)} × ${mm(spec.fullHmm)}`,
    "", "Checks:", ...checks.map((x) => `  ${x.ok ? "✓" : x.level === "block" ? "✗" : "!"} ${x.text}`),
    "", "Files: interior-print.pdf (upload as the interior), book.epub (Kindle and other ebook stores)" + (i.coverUrl ? ", cover-front.jpg (the front; the full wrap is made from it)" : "") + ".",
  ].filter((x) => x !== null).join("\n"));
  return { blob: await zip.generateAsync({ type: "blob" }), pages: interior.pages, checks };
}
