// Before the book is called complete (DESIGN-SPEC.md §22): the front and back matter in the right order,
// no page twice, no page left empty or with a placeholder, the Introduction not repeating the Preface, the
// Introduction followed by Chapter 1 and the chapters numbered in order. The contents are made from the
// headings, so they are accurate by construction; the check says how many chapters they list.
import { kindDef, type Manuscript } from "./manuscript";
import { conventionalOrder } from "./arrange-book";
import type { FormatCheck } from "./format-readiness";
import { toIsbn13 } from "./cover-design";

const sentences = (t: string) => t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((s) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim()).filter((s) => s.split(" ").length >= 8);
/** How much of a's sentences appear word for word in b (0–1). */
export function overlap(a: string, b: string): number {
  const sa = sentences(a); if (!sa.length) return 0;
  const sb = new Set(sentences(b));
  return sa.filter((s) => sb.has(s)).length / sa.length;
}

export function frontMatterChecks(m: Manuscript): FormatCheck[] {
  const out: FormatCheck[] = [];
  const live = m.sections.filter((s) => !s.omit);
  const matter = live.filter((s) => kindDef(s.kind).group !== "body");
  // Text an organising left unplaced ("Opening pages") is not a chapter of the book.
  const leftover = live.find((s) => s.title === "Opening pages");
  if (leftover) out.push({ ok: false, level: "required", text: "“Opening pages” holds text the organising couldn't place (it would print as a chapter): look at it, or organise the book again", fix: "section", sectionId: leftover.id });
  // Order.
  const { moved } = conventionalOrder(live);
  out.push(moved.length
    ? { ok: false, level: "advised", text: `Front or back matter out of the usual order (${moved.slice(0, 3).join("; ")}${moved.length > 3 ? "…" : ""})`, fix: "order" }
    : { ok: true, level: "advised", text: "Front matter, chapters and back matter in the usual order" });
  // No page twice.
  const twice = [...new Set(matter.filter((s) => kindDef(s.kind).single && matter.filter((x) => x.kind === s.kind).length > 1).map((s) => s.kind))];
  out.push(twice.length
    ? { ok: false, level: "required", text: `In the book twice: ${twice.map((k) => kindDef(k).label).join(", ")}`, fix: "section", sectionId: matter.find((s) => s.kind === twice[0])?.id }
    : { ok: true, level: "required", text: "No front or back matter page appears twice" });
  // Every page the book includes is written, with nothing left to fill in.
  const empty = matter.filter((s) => !["half-title", "title-page", "copyright", "scripture-index"].includes(s.kind) && !s.body.trim());
  if (empty.length) out.push({ ok: false, level: "required", text: `Empty: ${empty.map((s) => s.title).join(", ")}. Write it or leave it out`, fix: "section", sectionId: empty[0].id });
  const holes = matter.filter((s) => /\[\[YOURS:|\[(name|placeholder|isbn|year|publisher|author)[^\]]*\]/i.test(s.body));
  if (holes.length) out.push({ ok: false, level: "required", text: `Still to fill in: ${holes.map((s) => s.title).join(", ")}`, fix: "section", sectionId: holes[0].id });
  // Facts the author gives.
  if (!m.title.trim()) out.push({ ok: false, level: "required", text: "No title for the title page", fix: "production" });
  out.push(m.author?.trim() && !/\[[^\]]*\]/.test(m.author) ? { ok: true, level: "advised", text: `Author on the title and copyright pages: ${m.author.trim()}` } : { ok: false, level: "advised", text: "No author name for the title and copyright pages", fix: "production" });
  // An ISBN that is given must be a real one (it prints on the copyright page and as the barcode).
  const isbn = String(m.meta?.isbn ?? "").trim();
  if (isbn && !/\[[^\]]*\]/.test(isbn) && !toIsbn13(isbn)) out.push({ ok: false, level: "required", text: `The ISBN ${isbn} isn't a valid ISBN-10 or ISBN-13`, fix: "production" });
  // The Preface and Introduction serve different purposes.
  const pre = live.find((s) => s.kind === "preface"), intro = live.find((s) => s.kind === "introduction");
  if (pre && intro && overlap(pre.body, intro.body) > 0.25) out.push({ ok: false, level: "required", text: "The Preface repeats the Introduction: the Preface should say why and how the book was written, the Introduction what it teaches", fix: "section", sectionId: pre.id });
  // The main text: Introduction, then Chapter 1, chapters in order.
  const body = live.filter((s) => kindDef(s.kind).group === "body");
  const chapters = body.filter((s) => s.kind === "chapter");
  if (!chapters.length) out.push({ ok: false, level: "required", text: "No chapters yet", fix: "section" });
  else {
    const misnumbered = chapters.map((s, i) => ({ s, i, n: Number(/^\s*(?:chapter\s+)?(\d+)\b/i.exec(s.title)?.[1] ?? NaN) })).filter((x) => !Number.isNaN(x.n) && x.n !== x.i + 1);
    out.push(misnumbered.length
      ? { ok: false, level: "required", text: `“${misnumbered[0].s.title}” is chapter ${misnumbered[0].i + 1} of the book`, fix: "section", sectionId: misnumbered[0].s.id }
      : { ok: true, level: "required", text: `${intro ? "The Introduction is followed by Chapter 1; " : ""}${chapters.length} chapters in order, listed in the contents with their page numbers` });
  }
  return out;
}

/** Puts the sections in the usual order of a book (front matter, chapters in the author's order, back matter); no text changes. */
export function putInOrder(m: Manuscript): Manuscript {
  return { ...m, sections: conventionalOrder(m.sections).sections };
}
