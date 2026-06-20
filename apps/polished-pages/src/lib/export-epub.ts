// Real EPUB export. Produces a valid .epub (EPUB 3 with an NCX fallback) that
// the major stores accept directly — Kobo, Apple Books, Google Play Books and
// Draft2Digital (and KDP/IngramSpark, which also take EPUB). JSZip is loaded
// dynamically so it never weighs down the main bundle.
import type { PictureBookData } from "@/components/children/PictureBookView";
import { isRtlText } from "@/lib/languages";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

const uuid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

interface BookMeta { title: string; author?: string; language?: string }

const CSS = `body{font-family:Georgia,serif;line-height:1.6;margin:5%}h1{font-size:1.6em;margin:1em 0 .5em}h2{font-size:1.3em;margin:1.2em 0 .4em}h3{font-size:1.1em}p{margin:.5em 0;text-align:justify}img{max-width:100%;height:auto;display:block;margin:1em auto}ul{margin:.5em 0 .5em 1.2em}.page-text{font-size:1.15em;line-height:1.7;text-align:center;margin-top:1em}`;

const xhtml = (title: string, lang: string, body: string, dir: "ltr" | "rtl" = "ltr") =>
  `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body dir="${dir}">${body}</body></html>`;

// Minimal markdown -> XHTML for a chapter body.
function mdToXhtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of lines) {
    const t = raw.trim();
    if (/^#\s+/.test(t)) { closeList(); out.push(`<h1>${inline(t.replace(/^#\s+/, ""))}</h1>`); }
    else if (/^##\s+/.test(t)) { closeList(); out.push(`<h2>${inline(t.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^###\s+/.test(t)) { closeList(); out.push(`<h3>${inline(t.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^[-*]\s+/.test(t)) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${inline(t.replace(/^[-*]\s+/, ""))}</li>`); }
    else if (t === "") { closeList(); }
    else { closeList(); out.push(`<p>${inline(t)}</p>`); }
  }
  closeList();
  return out.join("\n");
}

// Split markdown into chapters on # / ## headings (content before the first
// heading becomes a front chapter).
function splitChapters(md: string): { title: string; body: string }[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const chapters: { title: string; lines: string[] }[] = [];
  let cur: { title: string; lines: string[] } = { title: "", lines: [] };
  for (const line of lines) {
    const m = line.match(/^#{1,2}\s+(.+)/);
    if (m) {
      if (cur.lines.join("").trim()) chapters.push(cur);
      cur = { title: m[1].trim(), lines: [line] };
    } else cur.lines.push(line);
  }
  if (cur.lines.join("").trim()) chapters.push(cur);
  return (chapters.length ? chapters : [{ title: "", lines: [md] }]).map((c, i) => ({ title: c.title || `Section ${i + 1}`, body: mdToXhtml(c.lines.join("\n")) }));
}

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

interface ChapterSpec { id: string; href: string; title: string; xhtml: string }
interface ImageSpec { id: string; href: string; mime: string; bytes: Uint8Array }

async function buildEpub(meta: BookMeta, chapters: ChapterSpec[], images: ImageSpec[], filename: string, dir: "ltr" | "rtl" = "ltr") {
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

  oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${id}</dc:identifier><dc:title>${esc(meta.title)}</dc:title><dc:creator>${esc(meta.author || "Polished Pages")}</dc:creator><dc:language>${lang}</dc:language><meta property="dcterms:modified">${modified}</meta></metadata><manifest>${manifest}</manifest><spine toc="ncx"${ppd}>${spine}</spine></package>`);

  oebps.file("nav.xhtml", `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>Contents</title></head><body dir="${dir}"><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${chapters.map((c) => `<li><a href="${c.href}">${esc(c.title)}</a></li>`).join("")}</ol></nav></body></html>`);

  oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${id}"/><meta name="dtb:depth" content="1"/></head><docTitle><text>${esc(meta.title)}</text></docTitle><navMap>${chapters.map((c, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(c.title)}</text></navLabel><content src="${c.href}"/></navPoint>`).join("")}</navMap></ncx>`);

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename.endsWith(".epub") ? filename : `${filename}.epub`; a.click();
  URL.revokeObjectURL(url);
}

export async function markdownToEpub(markdown: string, meta: BookMeta, filename: string): Promise<void> {
  const lang = meta.language || "en";
  const dir = isRtlText(markdown) ? "rtl" : "ltr";
  const chapters = splitChapters(markdown).map((c, i) => ({
    id: `ch${i + 1}`, href: `chapter-${i + 1}.xhtml`, title: c.title,
    xhtml: xhtml(c.title, lang, c.body, dir),
  }));
  await buildEpub(meta, chapters, [], filename, dir);
}

export async function pictureBookToEpub(book: PictureBookData, meta: BookMeta, filename: string): Promise<void> {
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

  // Cover page
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
  await buildEpub(meta, chapters, images, filename, dir);
}
