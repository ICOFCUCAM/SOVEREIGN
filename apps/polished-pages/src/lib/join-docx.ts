import JSZip from "jszip";

// Join Word (.docx) files into one .docx, in the browser, at the level of the
// document XML, so formatting survives. The first file is the base: its styles,
// headers and footers lead. Every later file brings along what its content
// points at:
//   images and links        copied with fresh relationship ids
//   list numbering          its numbering definitions, renumbered
//   paragraph/table styles  any the base lacks
//   footnotes and endnotes  moved into the base's notes, or written out as
//                           numbered notes after that document when the base has none
//   page setup              each file keeps its own page size, margins and
//                           orientation as its own section
//   drawing and bookmark ids renumbered so they stay unique
// What cannot be carried safely (comments, charts, embedded objects, a file's
// own headers and footers) is left out and named in `notes`, never silently
// corrupting the file.

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PR = "http://schemas.openxmlformats.org/package/2006/relationships";
const CT = "http://schemas.openxmlformats.org/package/2006/content-types";
const WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
const PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture";
const W14 = "http://schemas.microsoft.com/office/word/2010/wordml";
const MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
const RT = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
const STRICT = "http://purl.oclc.org/ooxml/";

export interface DocxJoinItem { name: string; bytes: ArrayBuffer | Uint8Array }
export interface DocxJoinOptions { newPage?: boolean; headings?: boolean }
export interface DocxJoinResult { blob: Blob; bytes: Uint8Array; notes: string[]; documents: number }

const parse = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");
const serialize = (d: Document) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + new XMLSerializer().serializeToString(d).replace(/^<\?xml[^>]*\?>\s*/, "");
const kids = (el: Element) => Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1);
const all = (root: Document | Element, ns: string, local: string) => Array.from(root.getElementsByTagNameNS(ns, local));
const wattr = (el: Element, name: string) => el.getAttributeNS(W, name) ?? el.getAttribute(`w:${name}`);

function dirOf(p: string) { const i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i + 1); }
function relsPathOf(part: string) { return `${dirOf(part)}_rels/${part.slice(dirOf(part).length)}.rels`; }
function resolve(base: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = (dirOf(base) + target).split("/");
  const out: string[] = [];
  for (const p of parts) { if (p === "..") out.pop(); else if (p && p !== ".") out.push(p); }
  return out.join("/");
}

class Rels {
  doc: Document;
  constructor(public path: string, xml: string | null) {
    this.doc = parse(xml ?? `<Relationships xmlns="${PR}"/>`);
  }
  get list() { return all(this.doc, PR, "Relationship"); }
  byId(id: string) { return this.list.find((r) => r.getAttribute("Id") === id) ?? null; }
  byType(t: string) { return this.list.find((r) => r.getAttribute("Type") === RT + t) ?? null; }
  add(type: string, target: string, external: boolean) {
    const used = new Set(this.list.map((r) => r.getAttribute("Id")));
    let n = this.list.length + 1; while (used.has(`rId${n}`)) n++;
    const el = this.doc.createElementNS(PR, "Relationship");
    el.setAttribute("Id", `rId${n}`); el.setAttribute("Type", type); el.setAttribute("Target", target);
    if (external) el.setAttribute("TargetMode", "External");
    this.doc.documentElement.appendChild(el);
    return `rId${n}`;
  }
}

interface Pkg {
  zip: JSZip; main: string; doc: Document; rels: Rels; types: Document;
  part(type: string): string | null;
  xml(path: string): Promise<string | null>;
}

async function open(item: DocxJoinItem): Promise<Pkg> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(item.bytes); } catch { throw new Error(`“${item.name}” isn't a Word (.docx) file. Old .doc files must be saved as .docx first.`); }
  const root = await zip.file("_rels/.rels")?.async("string");
  const main = root ? (all(parse(root), PR, "Relationship").find((r) => /officeDocument$/.test(r.getAttribute("Type") ?? ""))?.getAttribute("Target") ?? "word/document.xml").replace(/^\//, "") : "word/document.xml";
  const xml = await zip.file(main)?.async("string");
  if (!xml) throw new Error(`“${item.name}” has no document inside. Is it a Word file?`);
  if (xml.includes(STRICT)) throw new Error(`“${item.name}” is saved as “Strict Open XML”. Save it as a normal Word document (.docx) and add it again.`);
  const doc = parse(xml);
  if (doc.getElementsByTagName("parsererror").length) throw new Error(`“${item.name}” is damaged and can't be read.`);
  const rels = new Rels(relsPathOf(main), (await zip.file(relsPathOf(main))?.async("string")) ?? null);
  const types = parse((await zip.file("[Content_Types].xml")?.async("string")) ?? `<Types xmlns="${CT}"/>`);
  return {
    zip, main, doc, rels, types,
    part: (t) => { const r = rels.byType(t); return r ? resolve(main, r.getAttribute("Target") ?? "") : null; },
    xml: async (p) => (await zip.file(p)?.async("string")) ?? null,
  };
}

function contentTypeFor(pkg: Pkg, part: string): { ext?: string; override?: string; type: string } | null {
  const ext = part.split(".").pop()?.toLowerCase() ?? "";
  const o = all(pkg.types, CT, "Override").find((e) => e.getAttribute("PartName") === "/" + part);
  if (o) return { override: "/" + part, type: o.getAttribute("ContentType") ?? "" };
  const d = all(pkg.types, CT, "Default").find((e) => e.getAttribute("Extension")?.toLowerCase() === ext);
  return d ? { ext, type: d.getAttribute("ContentType") ?? "" } : null;
}

function ensureType(base: Pkg, part: string, type: string, asOverride: boolean) {
  const root = base.types.documentElement;
  if (asOverride) {
    if (!all(base.types, CT, "Override").some((e) => e.getAttribute("PartName") === "/" + part)) {
      const el = base.types.createElementNS(CT, "Override"); el.setAttribute("PartName", "/" + part); el.setAttribute("ContentType", type); root.appendChild(el);
    }
    return;
  }
  const ext = part.split(".").pop()?.toLowerCase() ?? "";
  if (!all(base.types, CT, "Default").some((e) => e.getAttribute("Extension")?.toLowerCase() === ext)) {
    const el = base.types.createElementNS(CT, "Default"); el.setAttribute("Extension", ext); el.setAttribute("ContentType", type);
    root.insertBefore(el, root.firstChild);
  }
}

function maxNum(els: Element[], name: string) {
  return els.reduce((m, e) => Math.max(m, Number(e.getAttribute(name) ?? wattr(e, name)) || 0), 0);
}

function wEl(doc: Document, name: string, attrs: Record<string, string> = {}, children: Node[] = []) {
  const el = doc.createElementNS(W, `w:${name}`);
  for (const [k, v] of Object.entries(attrs)) el.setAttributeNS(W, `w:${k}`, v);
  children.forEach((c) => el.appendChild(c));
  return el;
}
function textPara(doc: Document, text: string, opts: { style?: string | null; bold?: boolean; size?: number } = {}) {
  const t = wEl(doc, "t", {}, [doc.createTextNode(text)]); t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
  const rPr = wEl(doc, "rPr", {}, [...(opts.bold ? [wEl(doc, "b")] : []), ...(opts.size ? [wEl(doc, "sz", { val: String(opts.size) })] : [])]);
  const p = wEl(doc, "p", {}, [...(opts.style ? [wEl(doc, "pPr", {}, [wEl(doc, "pStyle", { val: opts.style })])] : []), wEl(doc, "r", {}, [rPr, t])]);
  return p;
}

export async function joinDocx(items: DocxJoinItem[], opts: DocxJoinOptions = {}): Promise<DocxJoinResult> {
  if (items.length < 1) throw new Error("Add at least one Word file.");
  const newPage = opts.newPage !== false;
  const notes: string[] = [];
  const base = await open(items[0]);
  const body = all(base.doc, W, "body")[0];
  if (!body) throw new Error(`“${items[0].name}” has no document body.`);

  // The base's own parts that later files merge into.
  const stylesPath = base.part("styles");
  const styles = stylesPath ? parse((await base.xml(stylesPath)) ?? "") : null;
  let numberingPath = base.part("numbering");
  let numbering = numberingPath ? parse((await base.xml(numberingPath)) ?? "") : null;
  const notesParts: Record<"footnotes" | "endnotes", { path: string; doc: Document; rels: Rels } | null> = { footnotes: null, endnotes: null };
  for (const k of ["footnotes", "endnotes"] as const) {
    const p = base.part(k);
    if (p) notesParts[k] = { path: p, doc: parse((await base.xml(p)) ?? ""), rels: new Rels(relsPathOf(p), await base.xml(relsPathOf(p))) };
  }
  const heading1 = styles && all(styles, W, "style").some((s) => wattr(s, "styleId") === "Heading1") ? "Heading1" : null;

  let docPrId = Math.max(maxNum(all(base.doc, WP, "docPr"), "id"), maxNum(all(base.doc, PIC, "cNvPr"), "id"));
  let bookmarkId = maxNum(all(base.doc, W, "bookmarkStart"), "id");
  let mediaN = 0;

  // The base's closing section moves into a paragraph so each file can bring its own.
  const baseSect = kids(body).filter((e) => e.namespaceURI === W && e.localName === "sectPr").pop() ?? null;
  const parts: { content: Element[]; sect: Element }[] = [];

  for (let fi = 1; fi < items.length; fi++) {
    const it = items[fi];
    const src = await open(it);
    const sbody = all(src.doc, W, "body")[0];
    if (!sbody) { notes.push(`“${it.name}” had no content and was skipped.`); continue; }
    mergeRootNamespaces(base.doc.documentElement, src.doc.documentElement);
    const skipped = new Map<string, number>();
    const skip = (what: string) => skipped.set(what, (skipped.get(what) ?? 0) + 1);

    const srcStylesPath = src.part("styles");
    const srcStyles = srcStylesPath ? parse((await src.xml(srcStylesPath)) ?? "") : null;
    const srcNumPath = src.part("numbering");
    const srcNumbering = srcNumPath ? parse((await src.xml(srcNumPath)) ?? "") : null;
    const srcNotes: Record<"footnotes" | "endnotes", { path: string; doc: Document; rels: Rels } | null> = { footnotes: null, endnotes: null };
    for (const k of ["footnotes", "endnotes"] as const) {
      const p = src.part(k);
      if (p) srcNotes[k] = { path: p, doc: parse((await src.xml(p)) ?? ""), rels: new Rels(relsPathOf(p), await src.xml(relsPathOf(p))) };
    }

    const srcNodes = kids(sbody);
    const srcSect = srcNodes.filter((e) => e.namespaceURI === W && e.localName === "sectPr").pop() ?? null;
    const nodes = srcNodes.filter((e) => e !== srcSect).map((n) => base.doc.importNode(n, true) as Element);

    // Relationship-bearing attributes: copy what they point at, or drop the element.
    const copyRels = async (els: Element[], from: { part: string; rels: Rels }, to: { part: string; rels: Rels }) => {
      for (const root of els) {
        const stack = [root, ...Array.from(root.getElementsByTagName("*"))];
        for (const el of stack) {
          if (el !== root && !root.contains(el)) continue; // inside something already dropped
          for (const a of Array.from(el.attributes)) {
            if (a.namespaceURI !== R) continue;
            const rel = from.rels.byId(a.value);
            const type = rel?.getAttribute("Type")?.replace(RT, "") ?? "";
            const external = rel?.getAttribute("TargetMode") === "External";
            if (rel && (type === "hyperlink" || (type === "image" && external))) {
              el.setAttributeNS(R, a.name, to.rels.add(RT + type, rel.getAttribute("Target") ?? "", true));
            } else if (rel && type === "image") {
              const srcPart = resolve(from.part, rel.getAttribute("Target") ?? "");
              const data = await src.zip.file(srcPart)?.async("uint8array");
              if (!data) { dropFor(el, skip, "image that was missing from its file"); break; }
              const ext = srcPart.split(".").pop() ?? "bin";
              const name = `media/joined-${fi}-${++mediaN}.${ext}`;
              const dest = resolve(to.part, name);
              base.zip.file(dest, data);
              const ct = contentTypeFor(src, srcPart);
              if (ct) ensureType(base, dest, ct.type, Boolean(ct.override));
              el.setAttributeNS(R, a.name, to.rels.add(RT + "image", name, false));
            } else {
              dropFor(el, skip, rel ? kindName(type) : "item with a broken link");
              break;
            }
          }
        }
      }
    };
    const fromMain = { part: src.main, rels: src.rels };
    const toMain = { part: base.main, rels: base.rels };

    // Comments are review marks, not content.
    for (const n of nodes) for (const tag of ["commentRangeStart", "commentRangeEnd", "commentReference"]) for (const el of all(n, W, tag)) {
      if (tag === "commentReference") dropFor(el, skip, "comment"); else el.remove();
    }
    for (const n of nodes) for (const el of all(n, W, "altChunk")) { el.remove(); skip("embedded document"); }
    // Optional ids that must stay unique: let Word regenerate them.
    for (const n of [...nodes, ...nodes.flatMap((x) => Array.from(x.getElementsByTagName("*")))]) {
      for (const a of Array.from(n.attributes)) if (a.namespaceURI === W14 && (a.localName === "paraId" || a.localName === "textId")) n.removeAttributeNode(a);
    }
    for (const n of nodes) {
      for (const el of [...all(n, WP, "docPr"), ...all(n, PIC, "cNvPr")]) el.setAttribute("id", String(++docPrId));
    }
    const bmMap = new Map<string, string>();
    for (const n of nodes) for (const tag of ["bookmarkStart", "bookmarkEnd"]) for (const el of all(n, W, tag)) {
      const old = wattr(el, "id") ?? "";
      if (!bmMap.has(old)) bmMap.set(old, String(++bookmarkId));
      el.setAttributeNS(W, "w:id", bmMap.get(old)!);
    }

    await copyRels(nodes, fromMain, toMain);

    // Styles the base doesn't have (and the styles they build on).
    if (styles && srcStyles) {
      const have = new Set(all(styles, W, "style").map((s) => wattr(s, "styleId")));
      const srcById = new Map(all(srcStyles, W, "style").map((s) => [wattr(s, "styleId"), s]));
      const want = (id: string | null) => {
        if (!id || have.has(id) || !srcById.has(id)) return;
        have.add(id);
        const s = srcById.get(id)!;
        styles.documentElement.appendChild(styles.importNode(s, true));
        for (const ref of ["basedOn", "link", "next"]) { const r = all(s, W, ref)[0]; if (r) want(wattr(r, "val")); }
      };
      for (const n of nodes) for (const tag of ["pStyle", "rStyle", "tblStyle"]) for (const el of all(n, W, tag)) want(wattr(el, "val"));
    }

    // List numbering: bring each list's definition over under new ids.
    const numMap = new Map<string, string>();
    const usedNumIds = nodes.flatMap((n) => all(n, W, "numId")).map((e) => wattr(e, "val") ?? "0").filter((v) => v !== "0");
    if (usedNumIds.length && srcNumbering) {
      if (!numbering) {
        numbering = parse(`<w:numbering xmlns:w="${W}"/>`);
        numberingPath = resolve(base.main, "numbering.xml");
        base.rels.add(RT + "numbering", "numbering.xml", false);
        ensureType(base, numberingPath, "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", true);
      }
      const nroot = numbering.documentElement;
      let absMax = maxNum(all(numbering, W, "abstractNum"), "abstractNumId");
      let numMax = maxNum(all(numbering, W, "num"), "numId");
      const absMap = new Map<string, string>();
      const srcNums = new Map(all(srcNumbering, W, "num").map((n) => [wattr(n, "numId"), n]));
      const srcAbs = new Map(all(srcNumbering, W, "abstractNum").map((a) => [wattr(a, "abstractNumId"), a]));
      for (const id of new Set(usedNumIds)) {
        const num = srcNums.get(id);
        if (!num) continue;
        const absId = wattr(all(num, W, "abstractNumId")[0] ?? num, "val") ?? "";
        if (!absMap.has(absId) && srcAbs.has(absId)) {
          const a = numbering.importNode(srcAbs.get(absId)!, true) as Element;
          const nid = String(++absMax);
          a.setAttributeNS(W, "w:abstractNumId", nid);
          for (const ns of all(a, W, "nsid")) ns.setAttributeNS(W, "w:val", Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, "0"));
          const firstNum = all(numbering, W, "num")[0];
          nroot.insertBefore(a, firstNum ?? null);
          absMap.set(absId, nid);
        }
        const n = numbering.importNode(num, true) as Element;
        const newId = String(++numMax);
        n.setAttributeNS(W, "w:numId", newId);
        const ab = all(n, W, "abstractNumId")[0];
        if (ab && absMap.has(absId)) ab.setAttributeNS(W, "w:val", absMap.get(absId)!);
        nroot.appendChild(n);
        numMap.set(id, newId);
      }
      for (const n of nodes) for (const el of all(n, W, "numId")) { const v = wattr(el, "val") ?? "0"; if (numMap.has(v)) el.setAttributeNS(W, "w:val", numMap.get(v)!); }
    }

    // Footnotes and endnotes.
    const tail: Element[] = [];
    for (const k of ["footnotes", "endnotes"] as const) {
      const refTag = k === "footnotes" ? "footnoteReference" : "endnoteReference";
      const noteTag = k === "footnotes" ? "footnote" : "endnote";
      const refs = nodes.flatMap((n) => all(n, W, refTag));
      if (!refs.length) continue;
      const sN = srcNotes[k];
      const bN = notesParts[k];
      const srcNote = (id: string) => sN ? all(sN.doc, W, noteTag).find((f) => wattr(f, "id") === id) ?? null : null;
      if (bN && sN) {
        let max = maxNum(all(bN.doc, W, noteTag), "id");
        for (const ref of refs) {
          const f = srcNote(wattr(ref, "id") ?? "");
          if (!f) { ref.remove(); continue; }
          const copy = bN.doc.importNode(f, true) as Element;
          const id = String(++max);
          copy.setAttributeNS(W, "w:id", id);
          await copyRels([copy], { part: sN.path, rels: sN.rels }, { part: bN.path, rels: bN.rels });
          bN.doc.documentElement.appendChild(copy);
          ref.setAttributeNS(W, "w:id", id);
        }
      } else {
        // The base has no notes part: number the notes in the text and list them after this document.
        const list: string[] = [];
        for (const ref of refs) {
          const f = srcNote(wattr(ref, "id") ?? "");
          list.push((f?.textContent ?? "").replace(/\s+/g, " ").trim());
          const t = wEl(base.doc, "t", {}, [base.doc.createTextNode(String(list.length))]);
          ref.parentNode?.replaceChild(t, ref);
        }
        tail.push(textPara(base.doc, k === "footnotes" ? "Notes" : "Endnotes", { bold: true }));
        list.forEach((txt, i) => tail.push(textPara(base.doc, `${i + 1}. ${txt}`)));
      }
    }

    // This file's page setup, as its own section (without its own headers/footers).
    const sect = (srcSect ? base.doc.importNode(srcSect, true) : baseSect ? baseSect.cloneNode(true) : wEl(base.doc, "sectPr")) as Element;
    for (const tag of ["headerReference", "footerReference"]) for (const el of all(sect, W, tag)) { el.remove(); if (srcSect) skip("header or footer of its own"); }
    for (const el of Array.from(sect.getElementsByTagName("*"))) for (const a of Array.from(el.attributes)) if (a.namespaceURI === R) el.remove();
    for (const t of all(sect, W, "type")) t.remove();
    if (!newPage) sect.insertBefore(wEl(base.doc, "type", { val: "continuous" }), sect.firstChild);

    const head = opts.headings ? [textPara(base.doc, it.name.replace(/\.[^.]+$/, ""), heading1 ? { style: heading1 } : { bold: true, size: 36 })] : [];
    parts.push({ content: [...head, ...nodes, ...tail], sect });
    if (skipped.size) notes.push(`“${it.name}”: left out ${[...skipped].map(([w, n]) => `${n} ${w}${n > 1 && !w.endsWith("s") ? "s" : ""}`).join(", ")}.`);
  }

  // Assemble. Word stores a section's page setup at its end, so:
  //   base content · ¶[base setup] · file 2 · ¶[file 2 setup] · … · last file · [last setup]
  if (parts.length) {
    const sectionBreak = (sp: Element) => wEl(base.doc, "p", {}, [wEl(base.doc, "pPr", {}, [sp])]);
    if (opts.headings) body.insertBefore(textPara(base.doc, items[0].name.replace(/\.[^.]+$/, ""), heading1 ? { style: heading1 } : { bold: true, size: 36 }), kids(body)[0] ?? null);
    if (baseSect) baseSect.remove();
    let pending: Element = baseSect ?? wEl(base.doc, "sectPr");
    for (const part of parts) {
      body.appendChild(sectionBreak(pending));
      part.content.forEach((el) => body.appendChild(el));
      pending = part.sect;
    }
    body.appendChild(pending);
  }

  base.zip.file(base.main, serialize(base.doc));
  base.zip.file(base.rels.path, serialize(base.rels.doc));
  base.zip.file("[Content_Types].xml", serialize(base.types));
  if (styles && stylesPath) base.zip.file(stylesPath, serialize(styles));
  if (numbering && numberingPath) base.zip.file(numberingPath, serialize(numbering));
  for (const k of ["footnotes", "endnotes"] as const) {
    const n = notesParts[k];
    if (n) { base.zip.file(n.path, serialize(n.doc)); if (n.rels.list.length) base.zip.file(n.rels.path, serialize(n.rels.doc)); }
  }
  const bytes = await base.zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  return { blob, bytes, notes, documents: items.length };
}

function kindName(type: string) {
  return ({ chart: "chart", oleObject: "embedded object", package: "embedded object", diagramData: "SmartArt diagram", header: "header", footer: "footer", printerSettings: "printer setting", customXml: "custom data" } as Record<string, string>)[type] ?? "unsupported object";
}

/** Removes the run (or the element) that holds a link we can't carry over. */
function dropFor(el: Element, skip: (w: string) => void, what: string) {
  if (el.localName === "headerReference" || el.localName === "footerReference") { el.remove(); return; }
  let run: Element | null = el;
  while (run && !(run.namespaceURI === W && run.localName === "r")) run = run.parentElement;
  (run ?? el).remove();
  skip(what);
}

/** Adds the later file's namespace declarations and ignorable prefixes to the base root. */
function mergeRootNamespaces(baseRoot: Element, srcRoot: Element) {
  for (const a of Array.from(srcRoot.attributes)) {
    if (a.name.startsWith("xmlns:") && !baseRoot.hasAttribute(a.name)) baseRoot.setAttributeNS("http://www.w3.org/2000/xmlns/", a.name, a.value);
  }
  const ign = (el: Element) => (el.getAttributeNS(MC, "Ignorable") ?? "").split(/\s+/).filter(Boolean);
  const merged = [...new Set([...ign(baseRoot), ...ign(srcRoot)])].filter((p) => baseRoot.hasAttribute(`xmlns:${p}`));
  if (merged.length) baseRoot.setAttributeNS(MC, "mc:Ignorable", merged.join(" "));
}
