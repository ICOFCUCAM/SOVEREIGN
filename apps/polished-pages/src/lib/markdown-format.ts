// The Writing toolbar (DESIGN-SPEC.md §21): formatting applied to the selected text with the marks the
// book's text already uses (## headings, **bold**, *italic*, > quotations, lists), so every view and
// export (Book page, PDF, Word, EPUB) shows it.
export type FormatKind = "paragraph" | "heading" | "subheading" | "bold" | "italic" | "quote" | "bullets" | "numbers" | "link";
export interface Edit { text: string; start: number; end: number }

const lineRange = (text: string, start: number, end: number) => {
  const a = text.lastIndexOf("\n", start - 1) + 1;
  const e = text.indexOf("\n", Math.max(end - (end > start && text[end - 1] === "\n" ? 1 : 0), start));
  return [a, e === -1 ? text.length : e] as const;
};
const BLOCK = /^(#{1,6}\s+|>\s?|[-*]\s+|\d+[.)]\s+)/;

export function applyFormat(text: string, start: number, end: number, kind: FormatKind, url = ""): Edit {
  if (kind === "bold" || kind === "italic" || kind === "link") {
    const sel = text.slice(start, end) || (kind === "link" ? "link text" : "text");
    const mark = kind === "bold" ? "**" : "*";
    // Applying it again to marked text takes the marks off.
    if (kind !== "link" && text.slice(start - mark.length, start) === mark && text.slice(end, end + mark.length) === mark && !(kind === "italic" && text.slice(start - 2, start) === "**" && text.slice(start - 3, start) !== "***"))
      return { text: text.slice(0, start - mark.length) + sel + text.slice(end + mark.length), start: start - mark.length, end: start - mark.length + sel.length };
    const wrapped = kind === "link" ? `[${sel}](${url || "https://"})` : `${mark}${sel}${mark}`;
    const off = kind === "link" ? 1 : mark.length;
    return { text: text.slice(0, start) + wrapped + text.slice(end), start: start + off, end: start + off + sel.length };
  }
  const [a, b] = lineRange(text, start, end);
  const lines = text.slice(a, b).split("\n");
  const prefix = (i: number) => (kind === "heading" ? "## " : kind === "subheading" ? "### " : kind === "quote" ? "> " : kind === "bullets" ? "- " : kind === "numbers" ? `${i + 1}. ` : "");
  const has = (l: string) => (kind === "quote" ? /^>\s?/.test(l) : kind === "bullets" ? /^[-*]\s+/.test(l) : kind === "numbers" ? /^\d+[.)]\s+/.test(l) : kind === "heading" ? /^##\s+/.test(l) : kind === "subheading" ? /^###\s+/.test(l) : false);
  const all = lines.filter((l) => l.trim()).every(has) && kind !== "paragraph";
  const out = lines.map((l, i) => (!l.trim() ? l : all ? l.replace(BLOCK, "") : prefix(i) + l.replace(BLOCK, ""))).join("\n");
  return { text: text.slice(0, a) + out + text.slice(b), start: a, end: a + out.length };
}

/** The paragraph style of the line the cursor is on. */
export function styleAt(text: string, at: number): "paragraph" | "heading" | "subheading" | "quote" {
  const line = text.slice(text.lastIndexOf("\n", at - 1) + 1).split("\n")[0];
  return /^###\s/.test(line) ? "subheading" : /^##?\s/.test(line) ? "heading" : /^>\s?/.test(line) ? "quote" : "paragraph";
}

/** A footnote at the cursor: the next number in the text, and its note line at the end, ready to write. */
export function insertFootnote(text: string, at: number): Edit {
  const used = [...text.matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  const n = (used.length ? Math.max(...used) : 0) + 1;
  const withRef = `${text.slice(0, at)}[^${n}]${text.slice(at)}`;
  const tail = `${withRef.replace(/\s+$/, "")}\n\n[^${n}]: `;
  return { text: tail, start: tail.length, end: tail.length };
}

/** A block (an image, a quotation) inserted on its own lines at the cursor. */
export function insertBlock(text: string, at: number, block: string): Edit {
  const before = text.slice(0, at).replace(/\s+$/, ""), after = text.slice(at).replace(/^\s+/, "");
  const out = `${before}${before ? "\n\n" : ""}${block}${after ? `\n\n${after}` : ""}`;
  const end = (before ? before.length + 2 : 0) + block.length;
  return { text: out, start: end, end };
}
