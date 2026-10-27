// What each finished format needs (design spec §9 "format switcher"): EPUB,
// print PDF, paperback and audiobook each have their own constraints. Every
// check is a fact about the manuscript as it is now, with where to fix it.
// Page counts are estimates until the interior is typeset; they say so.
import { kindDef, words, type Manuscript } from "@/lib/manuscript";
import { SPINE_TEXT_MIN_PAGES } from "@/lib/cover-design";
import { coverSpec, getTrim } from "@/lib/print-sizes";

export type FormatId = "epub" | "print" | "paperback" | "audiobook";
export type FixTarget = "cover" | "export" | "production" | "audio" | "section" | "check";
export interface FormatCheck { ok: boolean; level: "required" | "advised"; text: string; fix?: FixTarget; sectionId?: string }
export interface FormatReport { id: FormatId; label: string; line: string; facts: string[]; checks: FormatCheck[]; ready: boolean }

export const FORMATS: { id: FormatId; label: string; line: string }[] = [
  { id: "epub", label: "EPUB", line: "Reflowable ebook for Kindle, Apple Books, Kobo and Google Play." },
  { id: "print", label: "Print PDF", line: "The typeset interior at your trim size, fonts embedded." },
  { id: "paperback", label: "Paperback", line: "Interior plus a full wrap cover: back, spine and front." },
  { id: "audiobook", label: "Audiobook", line: "One narrated file per chapter, with opening and closing credits." },
];

/** Words a typeset page holds at each trim (book serif, standard layout); an estimate only. */
const WORDS_PER_PAGE: Record<string, number> = { "5x8": 250, "5.5x8.5": 280, "6x9": 300, a5: 270, "7x10": 380, "8x10": 420, "8.5x11": 480, "8.5x8.5": 380, a4: 500 };
/** Narration runs at about 9,300 words an hour (the audiobook industry's usual figure). */
export const WORDS_PER_HOUR = 9300;
/** KDP paperbacks need at least 24 pages. */
export const MIN_PAPERBACK_PAGES = 24;

export function estimatePages(m: Manuscript, trimId: string): number {
  const total = m.sections.reduce((n, s) => n + words(s.body), 0);
  const per = WORDS_PER_PAGE[trimId] ?? 300;
  // Each section opens on a new page; front matter and the contents add a few.
  return Math.max(1, Math.ceil(total / per) + m.sections.length + 4);
}

const count = (m: Manuscript, re: RegExp) => m.sections.map((s) => ({ id: s.id, n: (s.body.match(re) ?? []).length })).filter((x) => x.n);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function formatReport(id: FormatId, m: Manuscript, opts: { cover: boolean; /** The editorial check of the whole book (DESIGN-SPEC.md §15). */ audit?: { blockers: number; reviews: number } }): FormatReport {
  const meta = (m.meta ?? {}) as Record<string, string | undefined>;
  const def = FORMATS.find((f) => f.id === id)!;
  const chapters = m.sections.filter((s) => s.kind === "chapter");
  const written = chapters.filter((s) => s.body.trim());
  const empty = chapters.find((s) => !s.body.trim());
  const totalWords = m.sections.reduce((n, s) => n + words(s.body), 0);
  const checks: FormatCheck[] = [];
  const facts: string[] = [];
  const add = (c: FormatCheck) => checks.push(c);

  add({ ok: chapters.length > 0 && !empty, level: "required", text: !chapters.length ? "No chapters yet" : empty ? `${chapters.length - written.length} of ${chapters.length} chapters not written` : `All ${chapters.length} chapters written`, fix: empty ? "section" : undefined, sectionId: empty?.id });
  const yours = count(m, /\[\[YOURS:[^\]]*\]\]/g), holes = count(m, /\[(?:placeholder|insert|add|TODO|citation needed)[^\]]*\]/gi);
  if (yours.length || holes.length) {
    const n = [...yours, ...holes].reduce((t, x) => t + x.n, 0);
    add({ ok: false, level: "required", text: `${plural(n, "marker", "markers")} still in the text ([[YOURS]], [citation needed], placeholders)`, fix: "section", sectionId: (yours[0] ?? holes[0]).id });
  }

  if (opts.audit) add(opts.audit.blockers
    ? { ok: false, level: "required", text: `Editorial check: ${plural(opts.audit.blockers, "problem", "problems")} to fix (numbering, unfinished markers, references, front matter, rules)`, fix: "check" }
    : { ok: true, level: "required", text: `Editorial check passed${opts.audit.reviews ? `; ${plural(opts.audit.reviews, "point", "points")} to review` : ""}`, fix: opts.audit.reviews ? "check" : undefined });

  if (id === "epub") {
    add({ ok: Boolean(m.title.trim()), level: "required", text: m.title.trim() ? "Title set" : "No title (Sources → Book details)" });
    const author = m.author?.trim() ?? "";
    const named = Boolean(author) && !/^\[.*\]$/.test(author);
    add({ ok: named, level: "required", text: named ? `Author: ${author}` : author ? `The author is still a placeholder (${author})` : "No author name (Sources → Book details)" });
    add({ ok: opts.cover, level: "required", text: opts.cover ? "Front cover image" : "No front cover image (stores require one; KDP's ideal is 1,600 × 2,560 px)", fix: opts.cover ? undefined : "cover" });
    const noAlt = count(m, /!\[\s*\]\(/g);
    if (noAlt.length) add({ ok: false, level: "advised", text: `${plural(noAlt.reduce((t, x) => t + x.n, 0), "image has", "images have")} no description for screen readers`, fix: "section", sectionId: noAlt[0].id });
    add({ ok: Boolean(meta.language), level: "advised", text: meta.language ? `Language: ${meta.language}` : "No language set (stores and screen readers use it)", fix: meta.language ? undefined : "production" });
    facts.push("No page numbers: text reflows to the reader's screen and font size.", "Chapter headings become the ebook's navigation.", `${totalWords.toLocaleString()} words`);
  }

  if (id === "print" || id === "paperback") {
    const trimId = meta.trimSize || "6x9";
    const trim = getTrim(trimId);
    const pages = Number(meta.pageCount) || estimatePages(m, trimId);
    const estimated = !Number(meta.pageCount);
    add({ ok: Boolean(meta.trimSize), level: "required", text: meta.trimSize ? `Trim size ${trim.label}` : "No trim size chosen (6 × 9 in is assumed)", fix: meta.trimSize ? undefined : "production" });
    add({ ok: m.sections.some((s) => kindDef(s.kind).group === "front"), level: "advised", text: m.sections.some((s) => kindDef(s.kind).group === "front") ? "Front matter present" : "No front matter (title page, copyright…)", fix: "section", sectionId: m.sections[0]?.id });
    facts.push(`${estimated ? "About " : ""}${pages.toLocaleString()} pages${estimated ? " (estimated until typeset)" : ""}`, "Fonts are embedded; chapters open on a new page with running heads and page numbers.");
    if (id === "paperback") {
      const paper = meta.paper || "Cream";
      const spec = coverSpec(trim, pages, paper);
      add({ ok: pages >= MIN_PAPERBACK_PAGES, level: "required", text: pages >= MIN_PAPERBACK_PAGES ? `${pages} pages: above the 24-page minimum` : `${pages} pages: paperbacks need at least ${MIN_PAPERBACK_PAGES}` });
      add({ ok: Boolean(meta.isbn), level: "required", text: meta.isbn ? `ISBN ${meta.isbn}` : "No ISBN (yours, or the platform's free one)", fix: meta.isbn ? undefined : "production" });
      add({ ok: opts.cover, level: "required", text: opts.cover ? "Cover designed (export the full wrap from Cover)" : "No cover yet: the wrap needs back, spine and front", fix: "cover" });
      facts.push(`Spine ${spec.spineMm.toFixed(1)} mm on ${paper.toLowerCase()} paper; full wrap ${spec.fullWin.toFixed(2)} × ${spec.fullHin.toFixed(2)} in with bleed.`,
        pages >= SPINE_TEXT_MIN_PAGES ? "Spine text allowed." : `No spine text below ${SPINE_TEXT_MIN_PAGES} pages; the spine stays plain.`);
    }
  }

  if (id === "audiobook") {
    const hours = totalWords / WORDS_PER_HOUR;
    const tables = count(m, /^\s*\|.*\|\s*$/gm), notes = count(m, /\[\^[^\]]+\]/g), cites = count(m, /\([A-Z][^()]{1,80}?,\s*\d{4}[a-z]?\)/g);
    if (tables.length) add({ ok: false, level: "advised", text: `${plural(tables.length, "section has a table", "sections have tables")}: describe them in words for listeners`, fix: "section", sectionId: tables[0].id });
    if (notes.length || cites.length) add({ ok: false, level: "advised", text: "Footnotes and in-text citations are read aloud: decide whether the narrator skips them", fix: "section", sectionId: (notes[0] ?? cites[0]).id });
    add({ ok: written.length > 0, level: "required", text: written.length ? `${plural(written.length, "chapter", "chapters")} to narrate, one file each` : "Nothing to narrate yet", fix: written.length ? undefined : "section", sectionId: empty?.id });
    facts.push(`About ${hours < 1 ? `${Math.max(1, Math.round(hours * 60))} minutes` : `${hours.toFixed(1)} hours`} of narration at ${WORDS_PER_HOUR.toLocaleString()} words an hour.`, "Retailers ask for opening and closing credits and a short retail sample.");
  }

  return { ...def, facts, checks, ready: checks.every((c) => c.ok || c.level === "advised") };
}
