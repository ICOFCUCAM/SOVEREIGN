// Real EPUB export. Produces a valid .epub (EPUB 3 with an NCX fallback) that
// the major stores accept directly — Kobo, Apple Books, Google Play Books and
// Draft2Digital (and KDP/IngramSpark, which also take EPUB). JSZip is loaded
// dynamically so it never weighs down the main bundle.
import type { PictureBookData } from "@/components/children/PictureBookView";
import { isRtlText } from "@/lib/languages";
import { asChapters, UNNUMBERED } from "@/lib/typeset/book";
import { numberWord } from "@/lib/typeset/styles";
import { copyrightLines, fact } from "@/lib/copyright-page";
import { toIsbn13 } from "@/lib/cover-design";
import { scriptureBookName, scriptureBookOrder, scriptureRefs } from "@/lib/teacher/scripture";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/(^|[^\p{L}\p{N}_])_(?=\S)(.+?)_(?![\p{L}\p{N}_])/gu, "$1<em>$2</em>");

const uuid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** The book's details (bookFacts): the same title page and copyright page as the print interior. */
interface BookMeta { title: string; author?: string; language?: string; subtitle?: string; publisher?: string; rightsHolder?: string; isbn?: string; edition?: string; notices?: string[]; year?: number }

const CSS = `.titlepage{text-align:center;margin-top:25%}.titlepage h1{font-size:2em;margin-bottom:.3em}.titlepage .subtitle{font-style:italic;font-size:1.15em}.titlepage .author{margin-top:2em;font-style:italic}.titlepage .publisher{margin-top:4em;font-size:.85em}.copyright p{font-size:.8em;text-align:left;margin:.6em 0}.display{text-align:center;font-style:italic;margin-top:30%}.chapter-no{text-align:center;text-transform:uppercase;letter-spacing:.2em;font-size:.8em;color:#555;margin-top:2em}h1.chapter{text-align:center}.praise p{font-style:italic}.praise p.by{font-style:normal;text-align:right;font-size:.9em;margin-bottom:1.2em}blockquote{margin:1em 1.5em;font-size:.95em}nav.contents ol{list-style:none;padding:0}nav.contents li{margin:.4em 0}nav.contents li.sub{margin-left:1.5em;font-size:.9em}aside.fn p{font-size:.85em}sup a{text-decoration:none}body{font-family:Georgia,serif;line-height:1.6;margin:5%}h1{font-size:1.6em;margin:1em 0 .5em}h2{font-size:1.3em;margin:1.2em 0 .4em}h3{font-size:1.1em}p{margin:.5em 0;text-align:justify}img{max-width:100%;height:auto;display:block;margin:1em auto}ul{margin:.5em 0 .5em 1.2em}.page-text{font-size:1.15em;line-height:1.7;text-align:center;margin-top:1em}`;

const xhtml = (title: string, lang: string, body: string, dir: "ltr" | "rtl" = "ltr") =>
  `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body dir="${dir}">${body}</body></html>`;

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

async function imageToBytes(src: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    if (src.startsWith("data:")) return dataUrlToBytes(src);
    const r = await fetch(src);
    if (!r.ok) return null;
    const mime = r.headers.get("content-type") || "image/png";
    return { bytes: new Uint8Array(await r.arrayBuffer()), mime };
  } catch { return null; }
}

interface ChapterSpec { id: string; href: string; title: string; xhtml: string; /** Listed in the reader's contents (not the title, copyright or display pages). */ nav?: boolean }
interface ImageSpec { id: string; href: string; mime: string; bytes: Uint8Array }

// Assemble the EPUB and return it as a Blob (no download). Both the
// download helpers and the "publish to a store" path go through this, so the
// bytes are identical wherever a book ends up.
async function composeEpub(meta: BookMeta, chapters: ChapterSpec[], images: ImageSpec[], dir: "ltr" | "rtl" = "ltr"): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const lang = meta.language || "en";
  const id = `urn:uuid:${uuid()}`;
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // mimetype must be first and stored uncompressed.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);

  const oebps = zip.folder("OEBPS")!;
  oebps.file("styles.css", CSS);
  for (const c of chapters) oebps.file(c.href, c.xhtml);
  for (const im of images) oebps.file(im.href, im.bytes);

  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="styles.css" media-type="text/css"/>`,
    ...chapters.map((c) => `<item id="${c.id}" href="${c.href}" media-type="application/xhtml+xml"/>`),
    ...images.map((im) => `<item id="${im.id}" href="${im.href}" media-type="${im.mime}"/>`),
  ].join("\n");
  const spine = chapters.map((c) => `<itemref idref="${c.id}"/>`).join("\n");
  const ppd = ` page-progression-direction="${dir}"`;

  oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${id}</dc:identifier><dc:title>${esc(meta.title)}</dc:title><dc:creator>${esc(fact(meta.author) || "Polished Pages")}</dc:creator>${fact(meta.publisher) ? `<dc:publisher>${esc(fact(meta.publisher))}</dc:publisher>` : ""}${toIsbn13(meta.isbn ?? "") ? `<dc:source>urn:isbn:${toIsbn13(meta.isbn ?? "")}</dc:source>` : ""}<dc:rights>${esc(copyrightLines(meta)[1])}</dc:rights><dc:language>${lang}</dc:language><meta property="dcterms:modified">${modified}</meta></metadata><manifest>${manifest}</manifest><spine toc="ncx"${ppd}>${spine}</spine></package>`);

  oebps.file("nav.xhtml", `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>Contents</title></head><body dir="${dir}"><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${chapters.filter((c) => c.nav !== false).map((c) => `<li><a href="${c.href}">${esc(c.title)}</a></li>`).join("")}</ol></nav></body></html>`);

  oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${id}"/><meta name="dtb:depth" content="1"/></head><docTitle><text>${esc(meta.title)}</text></docTitle><navMap>${chapters.filter((c) => c.nav !== false).map((c, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(c.title)}</text></navLabel><content src="${c.href}"/></navPoint>`).join("")}</navMap></ncx>`);

  return zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename.endsWith(".epub") ? filename : `${filename}.epub`; a.click();
  URL.revokeObjectURL(url);
}

// Build the chapter/image specs for the two book shapes, so the download and
// blob variants share one definition each.
function markdownToSpecs(markdown: string, meta: BookMeta): { chapters: ChapterSpec[]; images: ImageSpec[]; dir: "ltr" | "rtl" } {
  const lang = meta.language || "en";
  const dir = isRtlText(markdown) ? "rtl" : "ltr";
  const images: ImageSpec[] = [];
  // The book as the typesetter reads it: "# " for each part, the title and by-line taken off (they belong on the title page).
  const parts = splitParts(asChapters(markdown));
  const page = (href: string, title: string, body: string, type: string) => xhtml(title, lang, `<section epub:type="${type}">${body}</section>`, dir);
  const out: ChapterSpec[] = [];
  let n = 0;
  const next = () => `part-${++n}.xhtml`;
  // Endorsements open the book, before the title page.
  for (const p of parts.filter((x) => x.flag === "praise")) {
    const body = p.lines.filter((l) => l.trim()).map((l) => (/^\s*[—–-]{1,2}\s*\S/.test(l) ? `<p class="by">${inline(l.trim())}</p>` : `<p>${inline(l.trim())}</p>`)).join("");
    out.push({ id: `p${n + 1}`, href: next(), title: p.title, xhtml: page("", p.title, `<div class="praise"><h2>${esc(p.title)}</h2>${body}</div>`, "praise"), nav: false });
  }
  const title = meta.title;
  out.push({ id: `p${n + 1}`, href: next(), title, nav: false, xhtml: page("", title, `<div class="titlepage"><h1>${esc(title)}</h1>${fact(meta.subtitle) ? `<p class="subtitle">${esc(fact(meta.subtitle))}</p>` : ""}${fact(meta.author) ? `<p class="author">${esc(fact(meta.author))}</p>` : ""}${fact(meta.publisher) ? `<p class="publisher">${esc(fact(meta.publisher))}</p>` : ""}</div>`, "titlepage") });
  out.push({ id: `p${n + 1}`, href: next(), title: "Copyright", nav: false, xhtml: page("", "Copyright", `<div class="copyright">${copyrightLines(meta).map((l) => `<p>${esc(l)}</p>`).join("")}</div>`, "copyright-page") });
  // Every other part in the book's order; the contents page links to them (filled in once all are known).
  const body = parts.filter((x) => x.flag !== "praise" && !(x.title === title && !x.lines.some((l) => l.trim())));
  // Every part's file is known before any is written, so the index can link forward and back.
  const first = n + 1;
  const hrefOf = (i: number) => `part-${first + i}.xhtml`;
  let tocIndex = -1, chapterNo = 0;
  body.forEach((p, i) => {
    const href = next();
    if (p.flag === "toc") { tocIndex = out.length; out.push({ id: `p${n}`, href, title: "Contents", xhtml: "" }); return; }
    if (p.flag === "scripture-index") {
      // An ebook has no page numbers: each reference links to the chapters it is in.
      const by = new Map<string, Map<string, { c: number; v: number; at: Set<number> }>>();
      body.forEach((q, qi) => { if (q.flag === "toc" || q.flag === "scripture-index") return; for (const r of scriptureRefs(q.lines.join("\n"))) { if (r.verse === undefined) continue; const b = by.get(r.book) ?? new Map(); by.set(r.book, b); const k = `${r.chapter}:${r.verse}${r.verseEnd ? `–${r.verseEnd}` : ""}`; const e = b.get(k) ?? { c: r.chapter, v: r.verse, at: new Set<number>() }; e.at.add(qi); b.set(k, e); } });
      const html = [...by.keys()].sort((a, b) => scriptureBookOrder(a) - scriptureBookOrder(b)).map((code) => `<h2>${esc(scriptureBookName(code))}</h2>${[...by.get(code)!.entries()].sort((a, b) => a[1].c - b[1].c || a[1].v - b[1].v).map(([k, e]) => `<p>${k} — ${[...e.at].map((qi) => `<a href="${hrefOf(qi)}">${esc(body[qi].title)}</a>`).join(", ")}</p>`).join("")}`).join("");
      out.push({ id: `p${n}`, href, title: p.title, xhtml: page(href, p.title, `<h1 class="chapter">${esc(p.title)}</h1>${html || "<p><em>No scripture references with chapter and verse were found in the text.</em></p>"}`, "index") });
      return;
    }
    if (p.flag === "display") { out.push({ id: `p${n}`, href, title: p.title, nav: false, xhtml: page(href, p.title, `<div class="display">${p.lines.filter((l) => l.trim()).map((l) => `<p>${inline(l.trim())}</p>`).join("")}</div>`, /epigraph/i.test(p.title) ? "epigraph" : "dedication") }); return; }
    const numbered = p.flag !== "plain" && !UNNUMBERED.test(p.title);
    if (numbered) chapterNo++;
    const label = numbered ? `<p class="chapter-no">Chapter ${numberWord(chapterNo)}</p>` : "";
    out.push({ id: `p${n}`, href, title: p.title, xhtml: page(href, p.title, `${label}<h1 class="chapter">${inline(p.title)}</h1>${partBody(p.lines.join("\n"), `c${n}`, images)}`, numbered ? "chapter" : p.title.toLowerCase().replace(/[^a-z]+/g, "-")) });
  });
  // The contents: where the book puts them, or after the copyright page.
  const listed = out.filter((c) => c.nav !== false && c.title !== "Contents");
  const toc = { id: "contents", href: "contents.xhtml", title: "Contents", xhtml: page("contents.xhtml", "Contents", `<nav class="contents" epub:type="toc"><h1 class="chapter">Contents</h1><ol>${listed.map((c) => `<li><a href="${c.href}">${esc(c.title)}</a></li>`).join("")}</ol></nav>`, "toc") };
  if (tocIndex >= 0) out[tocIndex] = { ...toc, id: out[tocIndex].id, href: out[tocIndex].href };
  else out.splice(out.findIndex((c) => c.title === "Copyright") + 1, 0, toc);
  return { chapters: out, images, dir };
}

/** The parts of a book set as "# " headings, with their markers: {toc}, {display}, {praise}, {-}. */
type PartFlag = "toc" | "display" | "praise" | "plain" | "scripture-index";
function splitParts(md: string): { title: string; flag?: PartFlag; lines: string[] }[] {
  const parts: { title: string; flag?: PartFlag; lines: string[] }[] = [];
  let cur: (typeof parts)[number] | null = null;
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    const m = /^#\s+(.+)$/.exec(line.trim());
    if (m) {
      const raw = m[1].trim();
      const flag: PartFlag | undefined = /\s\{toc\}$/.test(raw) ? "toc" : /\s\{display\}$/.test(raw) ? "display" : /\s\{praise\}$/.test(raw) ? "praise" : /\s\{scripture-index\}$/.test(raw) ? "scripture-index" : /\s\{-\}$/.test(raw) ? "plain" : undefined;
      cur = { title: raw.replace(/\s\{(toc|display|praise|scripture-index|-)\}$/, "").replace(/\*\*?(.+?)\*\*?/g, "$1"), flag, lines: [] };
      parts.push(cur);
    } else if (cur) cur.lines.push(line);
    else if (line.trim()) { cur = { title: "", lines: [line] }; parts.push(cur); }
  }
  return parts.filter((p) => p.title || p.lines.some((l) => l.trim()));
}

/** A part's text as XHTML: sections, lists, block quotes, figures, and footnotes as linked notes at its end. */
function partBody(md: string, key: string, images: ImageSpec[]): string {
  const defs = new Map<string, string>();
  const lines = md.split("\n").filter((l) => { const d = /^\[\^([^\]\s]+)\]:\s*(.*)$/.exec(l.trim()); if (d) { defs.set(d[1], d[2]); return false; } return true; });
  const order: string[] = [];
  const note = (t: string) => t.replace(/\[\^([^\]\s]+)\]/g, (_m, id: string) => {
    if (!defs.has(id)) return "";
    if (!order.includes(id)) order.push(id);
    const k = order.indexOf(id) + 1;
    return `<sup><a epub:type="noteref" id="r-${key}-${k}" href="#n-${key}-${k}">${k}</a></sup>`;
  });
  const out: string[] = [];
  let list = false;
  const close = () => { if (list) { out.push("</ul>"); list = false; } };
  for (const raw of lines) {
    const t = raw.trim();
    const img = /^!\[([^\]]*)\]\((data:image\/(?:png|jpe?g);base64,[A-Za-z0-9+/=]+)\)$/.exec(t);
    if (img) {
      close();
      const { bytes, mime } = dataUrlToBytes(img[2]);
      const href = `images/fig-${images.length + 1}.${mime.includes("jpeg") ? "jpg" : "png"}`;
      images.push({ id: `fig${images.length + 1}`, href, mime, bytes });
      out.push(`<figure><img src="${href}" alt="${esc(img[1])}"/>${img[1] ? `<figcaption>${esc(img[1])}</figcaption>` : ""}</figure>`);
    } else if (/^##\s+/.test(t)) { close(); out.push(`<h2>${inline(t.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^###\s+/.test(t)) { close(); out.push(`<h3>${inline(t.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^[-*]\s+/.test(t)) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${note(inline(t.replace(/^[-*]\s+/, "")))}</li>`); }
    else if (/^>\s?/.test(t)) { close(); out.push(`<blockquote><p>${note(inline(t.replace(/^>\s?/, "")))}</p></blockquote>`); }
    else if (!t) close();
    else { close(); out.push(`<p>${note(inline(t))}</p>`); }
  }
  close();
  if (order.length) out.push(`<section epub:type="footnotes"><h3>Notes</h3>${order.map((id, i) => `<aside class="fn" epub:type="footnote" id="n-${key}-${i + 1}"><p><a href="#r-${key}-${i + 1}">${i + 1}.</a> ${inline(defs.get(id) ?? "")}</p></aside>`).join("")}</section>`);
  return out.join("\n");
}

async function pictureBookToSpecs(book: PictureBookData, meta: BookMeta): Promise<{ chapters: ChapterSpec[]; images: ImageSpec[]; dir: "ltr" | "rtl" }> {
  const lang = meta.language || "en";
  const dir = isRtlText(book.pages.map((p) => p.text ?? "").join(" ")) ? "rtl" : "ltr";
  const chapters: ChapterSpec[] = [];
  const images: ImageSpec[] = [];
  let imgN = 0;

  const addImage = async (src?: string | null): Promise<string | null> => {
    if (!src) return null;
    const res = await imageToBytes(src);
    if (!res) return null;
    imgN += 1;
    const ext = res.mime.includes("jpeg") ? "jpg" : "png";
    const href = `images/img-${imgN}.${ext}`;
    images.push({ id: `img${imgN}`, href, mime: res.mime, bytes: res.bytes });
    return href;
  };

  const coverHref = await addImage(book.coverImage);
  chapters.push({
    id: "cover", href: "chapter-1.xhtml", title: book.title,
    xhtml: xhtml(book.title, lang, `${coverHref ? `<img src="${coverHref}" alt="Cover"/>` : ""}<h1 style="text-align:center">${esc(book.title)}</h1>${book.dedication ? `<p style="text-align:center"><em>${esc(book.dedication)}</em></p>` : ""}`, dir),
  });

  for (let i = 0; i < book.pages.length; i++) {
    const p = book.pages[i];
    const href = await addImage(p.image);
    chapters.push({
      id: `pg${i + 1}`, href: `chapter-${i + 2}.xhtml`, title: `Page ${i + 1}`,
      xhtml: xhtml(`Page ${i + 1}`, lang, `${href ? `<img src="${href}" alt="Page ${i + 1}"/>` : ""}${p.text ? `<p class="page-text">${inline(p.text)}</p>` : ""}`, dir),
    });
  }
  return { chapters, images, dir };
}

export async function markdownToEpub(markdown: string, meta: BookMeta, filename: string): Promise<void> {
  const { chapters, images, dir } = markdownToSpecs(markdown, meta);
  downloadBlob(await composeEpub(meta, chapters, images, dir), filename);
}

// Same engine as the download, but returns the .epub bytes for uploading to a
// store (e.g. publishing to Wankong) instead of triggering a browser download.
export async function markdownToEpubBlob(markdown: string, meta: BookMeta): Promise<Blob> {
  const { chapters, images, dir } = markdownToSpecs(markdown, meta);
  return composeEpub(meta, chapters, images, dir);
}

export async function pictureBookToEpub(book: PictureBookData, meta: BookMeta, filename: string): Promise<void> {
  const { chapters, images, dir } = await pictureBookToSpecs(book, meta);
  downloadBlob(await composeEpub(meta, chapters, images, dir), filename);
}

export async function pictureBookToEpubBlob(book: PictureBookData, meta: BookMeta): Promise<Blob> {
  const { chapters, images, dir } = await pictureBookToSpecs(book, meta);
  return composeEpub(meta, chapters, images, dir);
}
