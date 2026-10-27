// The editorial audit (DESIGN-SPEC.md §15; source: source/2026-10-rewrite-review.md).
// Deterministic checks on a whole book in Markdown, run on every whole-book
// rewrite and in Finish before export. "Duplicate numbering should be caught by
// code": everything here is code, so the same book always gives the same report.
// It never changes the text; it says what to look at and where. Questions of
// judgement (is an argument coherent, is a claim fair) are raised for the author
// as "review", never decided here.
import { checkTerminology, parseBookRules } from "../../supabase/functions/_shared/teacher-core";

export type AuditArea = "fidelity" | "structure" | "completeness" | "style" | "coherence" | "terminology" | "sensitive" | "coverage";
/** blocker: not publication-ready until fixed · review: an editor should look · note: worth knowing. */
export type AuditLevel = "blocker" | "review" | "note";
export interface AuditPlace { heading: string; line: number; excerpt: string }
export interface AuditFinding { id: string; area: AuditArea; level: AuditLevel; text: string; places: AuditPlace[] }
export interface AuditReport { findings: AuditFinding[]; blockers: number; reviews: number; notes: number; ready: boolean; headings: number; words: number }

export const AREA_LABEL: Record<AuditArea, string> = {
  fidelity: "Faithfulness to the original",
  structure: "Structure and numbering", completeness: "Unfinished editorial work", style: "Language and style", coherence: "Logic and certainty",
  terminology: "Terminology", sensitive: "Sensitive claims", coverage: "Promised coverage",
};

interface Heading { level: number; text: string; line: number }
interface Para { text: string; line: number; heading: string }

const MAX_PLACES = 8;
export const clip = (s: string, n = 140) => { const t = s.replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const STOP = new Set("a an and are as at be but by for from has have he her his i in into is it its of on or our she so that the their them they this to was we were what when which who will with you your not no do does did can could should would shall may might must also than then there these those about after before over under between through however therefore thus yet although though while because since where here now each every some many all one first finally instead rather indeed also such both even only just very more most other another any same".split(" "));
export const contentWords = (s: string) => s.toLowerCase().replace(/[’']s\b/g, "").split(/[^a-zÀ-ɏ]+/).filter((w) => w.length > 2 && !STOP.has(w));
export const stem = (w: string) => w.replace(/(ings?|ions?|ments?|ness|ed|es|s)$/, "").slice(0, 7);

function parse(md: string): { lines: string[]; headings: Heading[]; paras: Para[] } {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const headings: Heading[] = [];
  const paras: Para[] = [];
  let current = "(before the first heading)";
  let buf: string[] = []; let start = 0; let fence = false;
  const flush = () => { if (buf.length) paras.push({ text: buf.join(" "), line: start + 1, heading: current }); buf = []; };
  lines.forEach((raw, i) => {
    if (/^\s*```/.test(raw)) { fence = !fence; flush(); return; }
    if (fence) return;
    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(raw);
    if (h) { flush(); const text = h[2].replace(/\s*\{[^}]*\}\s*$/, "").trim(); headings.push({ level: h[1].length, text, line: i + 1 }); current = text; return; }
    if (!raw.trim()) { flush(); return; }
    if (!buf.length) start = i;
    buf.push(raw.trim());
  });
  flush();
  return { lines, headings, paras };
}

/** A heading's number: "20. Sift", "Section 20", "Chapter IV", "2.3 Title" → key and value. */
const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };
function roman(s: string): number | null {
  if (!/^[ivxlc]+$/i.test(s)) return null;
  let n = 0; const t = s.toLowerCase();
  for (let i = 0; i < t.length; i++) { const v = ROMAN[t[i]], next = ROMAN[t[i + 1]] ?? 0; n += v < next ? -v : v; }
  return n;
}
function headingNumber(text: string): { key: string; n: number } | null {
  const word = /^(part|chapter|section|lesson|unit|module|lecture|session|week|day|appendix)\s+([0-9]+|[ivxlc]+)\b/i.exec(text);
  if (word) { const n = /^\d+$/.test(word[2]) ? Number(word[2]) : roman(word[2]); return n ? { key: word[1].toLowerCase(), n } : null; }
  const dotted = /^(\d+(?:\.\d+)*)[.):]?\s+\S/.exec(text);
  if (dotted) { const parts = dotted[1].split(".").map(Number); return { key: `#${parts.slice(0, -1).join(".")}|${parts.length}`, n: parts[parts.length - 1] }; }
  return null;
}

/** Duplicates and gaps in a run of numbers; a run restarts at 1. */
function sequenceProblems<T>(items: { n: number; item: T }[]): { dup: T[][]; gaps: { after: T; from: number; to: number }[] } {
  const dup: T[][] = []; const gaps: { after: T; from: number; to: number }[] = [];
  let run: { n: number; item: T }[] = [];
  const close = () => {
    const by = new Map<number, T[]>();
    run.forEach((r) => by.set(r.n, [...(by.get(r.n) ?? []), r.item]));
    by.forEach((v) => { if (v.length > 1) dup.push(v); });
    for (let i = 1; i < run.length; i++) if (run[i].n > run[i - 1].n + 1) gaps.push({ after: run[i - 1].item, from: run[i - 1].n, to: run[i].n });
    run = [];
  };
  for (const it of items) { if (it.n === 1 && run.length && run[run.length - 1].n >= 1) close(); run.push(it); }
  close();
  return { dup, gaps };
}

const PLACEHOLDER = /\[\[YOURS:[^\]]*\]\]|\[(?:citation needed|source needed|cite|ref(?:erence)? needed|placeholder|insert[^\]]*|add[^\]]*|todo|tbd|tk|\?+|x{2,})\]|\b(?:TODO|TBD|FIXME|XXX)\b|lorem ipsum/gi;
const isPlaceholder = (s: string) => new RegExp(PLACEHOLDER.source, "i").test(s);
const ARTIFACT = /^(?:here is|here's) (?:the|your) (?:rewritten|revised|edited|improved)|^(?:certainly|sure)[!,.]|\bas an ai\b|\bi hope this helps\b|\bnote to (?:self|editor)\b|\[(?:rewritten|revised|continued)[^\]]*\]|\(rewritten\)/i;
const REFS_HEADING = /^(?:references|bibliography|works cited|sources|notes and references|endnotes)$/i;
const PROMISE_HEADING = /\b(?:contents|course (?:schedule|outline|content|plan|structure)|syllabus|outline|in this book|what this (?:book|course) covers|overview of (?:the )?(?:course|book))\b/i;
const ACADEMIC = /\b(?:learning outcomes|course description|bachelor|master'?s|syllabus|university|credits?|semester|academic)\b/i;
export const CERTAIN = /\b(?:(?:it )?is (?:clear|plain|obvious)|clearly|without (?:a )?doubt|undoubtedly|there is no doubt|it is a fact|certainly|we know for (?:sure|certain)|beyond question|it is certain|definitely)\b/i;
const UNCERTAIN = /\b(?:cannot be known|can(?:no|')t be known|not (?:be )?known for certain|we do not know|no one knows|uncertain|unclear|not certain|cannot be sure|we cannot say)\b/i;
const TESTIMONY = /\b(?:in (?:a|my) (?:dream|vision)|i (?:dreamt|dreamed|had a (?:dream|vision)|saw in)|the lord (?:showed|told) me|i was shown|in my experience|i have (?:seen|witnessed))\b/i;
const SPIRIT = /\b(?:demon\w*|devil\w*|satan\w*|evil spirits?|unclean spirits?|possess(?:ed|ion)|curse[sd]?|witchcraft|agents? of darkness|darkness)\b/i;
const GROUP = /\b(?:homosexual\w*|gay|lesbian\w*|same[- ]sex|transgender\w*|bisexual\w*|mental(?:ly)? ill\w*|mental illness\w*|depress\w*|schizophreni\w*|bipolar|autis\w*|epilep\w*|disabilit\w*|disabled|deaf|blind(?:ness)?|insan\w*|madness|psychiatric)\b/i;
const VARIANTS: [string, string][] = [["Holy Ghost", "Holy Spirit"], ["colour", "color"], ["honour", "honor"], ["saviour", "savior"], ["judgement", "judgment"], ["centre", "center"], ["baptise", "baptize"], ["realise", "realize"], ["organise", "organize"], ["behaviour", "behavior"], ["favour", "favor"], ["neighbour", "neighbor"], ["worshipping", "worshiping"], ["recognise", "recognize"]];

export function auditBook(markdown: string, opts: { rules?: string } = {}): AuditReport {
  const { lines, headings, paras } = parse(markdown ?? "");
  const findings: AuditFinding[] = [];
  const add = (f: Omit<AuditFinding, "places"> & { places?: AuditPlace[] }) => findings.push({ ...f, places: (f.places ?? []).slice(0, MAX_PLACES) });
  const placeOfHeading = (h: Heading): AuditPlace => ({ heading: h.text, line: h.line, excerpt: `${"#".repeat(h.level)} ${h.text}` });
  const placeOfPara = (p: Para, excerpt = p.text): AuditPlace => ({ heading: p.heading, line: p.line, excerpt: clip(excerpt) });
  const unquoted = (s: string) => s.replace(/“[^”]*”|"[^"\n]*"|«[^»]*»/g, " ");

  // ── Structure ────────────────────────────────────────────────────────────
  const groups = new Map<string, { n: number; item: Heading }[]>();
  headings.forEach((h) => { const num = headingNumber(h.text); if (num) { const k = `${h.level}|${num.key}`; groups.set(k, [...(groups.get(k) ?? []), { n: num.n, item: h }]); } });
  groups.forEach((items) => {
    const { dup, gaps } = sequenceProblems(items);
    dup.forEach((hs) => add({ id: `dup-${hs[0].line}`, area: "structure", level: "blocker", text: `${hs.length} headings share the number ${headingNumber(hs[0].text)!.n}: ${hs.map((h) => `“${clip(h.text, 60)}”`).join(", ")}`, places: hs.map(placeOfHeading) }));
    gaps.forEach((g) => add({ id: `gap-${g.after.line}`, area: "structure", level: "blocker", text: `Numbering jumps from ${g.from} to ${g.to} after “${clip(g.after.text, 60)}” (${g.to - g.from === 2 ? `${g.from + 1} is missing` : `${g.from + 1}–${g.to - 1} are missing`})`, places: [placeOfHeading(g.after)] }));
  });
  // Ordered lists written with explicit numbers (a printed list renumbers them, hiding the missing item).
  let list: { n: number; item: AuditPlace }[] = []; let heading = "(before the first heading)";
  const closeList = () => {
    if (list.length > 1) {
      const { dup, gaps } = sequenceProblems(list);
      dup.forEach((ps) => add({ id: `ldup-${ps[0].line}`, area: "structure", level: "review", text: `A numbered list repeats item ${list.find((x) => x.item === ps[0])!.n}`, places: ps }));
      gaps.forEach((g) => add({ id: `lgap-${g.after.line}`, area: "structure", level: "review", text: `A numbered list jumps from ${g.from} to ${g.to}: is an item missing?`, places: [g.after] }));
    }
    list = [];
  };
  lines.forEach((raw, i) => {
    const h = /^(#{1,6})\s+(.+)/.exec(raw); if (h) { closeList(); heading = h[2].trim(); return; }
    const m = /^\s{0,3}(\d{1,3})[.)]\s+(\S.*)/.exec(raw);
    if (m) list.push({ n: Number(m[1]), item: { heading, line: i + 1, excerpt: clip(raw) } });
    else if (raw.trim() && !/^\s{2,}\S/.test(raw)) closeList();
  });
  closeList();
  for (let i = 1; i < headings.length; i++) {
    const a = headings[i - 1], b = headings[i];
    if (b.level > a.level + 1) add({ id: `skip-${b.line}`, area: "structure", level: "review", text: `Heading level jumps from ${"#".repeat(a.level)} to ${"#".repeat(b.level)} under “${clip(a.text, 60)}”`, places: [placeOfHeading(b)] });
  }
  headings.forEach((h, i) => {
    const next = headings[i + 1];
    const body = lines.slice(h.line, next ? next.line - 1 : lines.length).join("\n").trim();
    // An empty references section is reported once, under completeness.
    if (!body && (!next || next.level <= h.level) && !REFS_HEADING.test(h.text)) add({ id: `empty-${h.line}`, area: "structure", level: h.level <= 2 ? "blocker" : "review", text: `“${clip(h.text, 60)}” has no text`, places: [placeOfHeading(h)] });
  });

  // ── Completeness ─────────────────────────────────────────────────────────
  const holes: AuditPlace[] = []; let holeCount = 0; const kinds = new Set<string>();
  paras.forEach((p) => { const ms = p.text.match(PLACEHOLDER); if (ms) { holeCount += ms.length; ms.forEach((x) => kinds.add(x.length > 30 ? `${x.slice(0, 28)}…` : x)); holes.push(placeOfPara(p, `${ms[0]} · ${p.text}`)); } });
  if (holeCount) add({ id: "placeholders", area: "completeness", level: "blocker", text: `${holeCount} editorial ${holeCount === 1 ? "marker is" : "markers are"} still in the text (${[...kinds].slice(0, 4).join(", ")}): resolve each claim, or move it to the editorial notes`, places: holes });
  const artifacts = paras.filter((p) => ARTIFACT.test(p.text));
  if (artifacts.length) add({ id: "artifacts", area: "completeness", level: "blocker", text: `${artifacts.length} drafting ${artifacts.length === 1 ? "remark" : "remarks"} from the rewriting tool left in the book`, places: artifacts.map((p) => placeOfPara(p)) });
  headings.filter((h) => REFS_HEADING.test(h.text)).forEach((h) => {
    const i = headings.indexOf(h); const next = headings.slice(i + 1).find((x) => x.level <= h.level);
    const entries = lines.slice(h.line, next ? next.line - 1 : lines.length).filter((l) => l.trim() && !/^#/.test(l) && !isPlaceholder(l)).length;
    if (!entries) add({ id: `refs-${h.line}`, area: "completeness", level: "blocker", text: `“${h.text}” has no entries`, places: [placeOfHeading(h)] });
  });
  const quotes = paras.filter((p) => { const o = (p.text.match(/“/g) ?? []).length, c = (p.text.match(/”/g) ?? []).length, s = (p.text.match(/"/g) ?? []).length; return o !== c || s % 2 === 1; });
  if (quotes.length) add({ id: "quotes", area: "completeness", level: "review", text: `${quotes.length} ${quotes.length === 1 ? "paragraph has" : "paragraphs have"} an opening quotation mark without its closing one (or the reverse)`, places: quotes.map((p) => placeOfPara(p)) });
  const academic = ACADEMIC.test(markdown);
  const hasRefs = headings.some((h) => REFS_HEADING.test(h.text)) || /\[\^[^\]]+\]:/.test(markdown);
  if (academic && !hasRefs) add({ id: "apparatus", area: "completeness", level: "review", text: "The book presents itself as an academic course but has no bibliography or source notes" });

  // ── Language and style ───────────────────────────────────────────────────
  const caps = paras.filter((p) => /\b(?:[A-Z]{2,}[’']?[A-Z]*\s+){2,}[A-Z]{2,}\b/.test(unquoted(p.text).replace(/\b[IVXLC]+\b/g, "")));
  if (caps.length) add({ id: "caps", area: "style", level: "review", text: `${caps.length} ${caps.length === 1 ? "passage uses" : "passages use"} capital letters for emphasis (e.g. “IN THE NAME OF”); keep the author's force with the house style instead`, places: caps.map((p) => placeOfPara(p, (unquoted(p.text).match(/\b(?:[A-Z]{2,}\s+){2,}[A-Z]{2,}\b/) ?? [p.text])[0] + " · " + p.text)) });
  const doubled = paras.filter((p) => /\b(\w{2,})\s+\1\b/i.test(p.text));
  if (doubled.length) add({ id: "doubled", area: "style", level: "review", text: `${doubled.length} repeated ${doubled.length === 1 ? "word" : "words"} (“the the”)`, places: doubled.map((p) => placeOfPara(p, (p.text.match(/\b(\w{2,})\s+\1\b/i) ?? [""])[0] + " · " + p.text)) });
  const openings = new Map<string, Para[]>();
  paras.forEach((p) => { const k = contentWords(p.text).length > 5 ? p.text.toLowerCase().split(/\s+/).slice(0, 3).join(" ").replace(/[^a-z ]/g, "") : ""; if (k.split(" ").length === 3) openings.set(k, [...(openings.get(k) ?? []), p]); });
  openings.forEach((ps, k) => { if (ps.length >= 4) add({ id: `open-${k}`, area: "style", level: "review", text: `${ps.length} paragraphs open with the same words (“${k}…”)`, places: ps.map((p) => placeOfPara(p)) }); });
  const bySection = new Map<string, Para[]>();
  paras.forEach((p) => bySection.set(p.heading, [...(bySection.get(p.heading) ?? []), p]));
  bySection.forEach((ps, h) => {
    const sentences = ps.flatMap((p) => p.text.split(/(?<=[.!?])\s+/));
    const q = sentences.filter((s) => s.trim().endsWith("?")).length;
    if (q >= 6 && q / sentences.length > 0.2) add({ id: `rq-${h}`, area: "style", level: "note", text: `“${clip(h, 60)}” asks ${q} questions in ${sentences.length} sentences: fine in a sermon, heavy in a textbook`, places: [placeOfPara(ps[0])] });
  });
  const lower = markdown.toLowerCase();
  VARIANTS.forEach(([a, b]) => {
    const ra = new RegExp(`\\b${a.toLowerCase()}`, "g"), rb = new RegExp(`\\b${b.toLowerCase()}`, "g");
    const na = (lower.match(ra) ?? []).length, nb = (lower.match(rb) ?? []).length;
    if (na && nb) add({ id: `var-${a}`, area: a === "Holy Ghost" ? "terminology" : "style", level: a === "Holy Ghost" ? "review" : "note", text: `Both “${a}” (${na}) and “${b}” (${nb}) are used${a === "Holy Ghost" ? ": choose one, or explain when each is used" : ": choose one spelling"}` });
  });

  // ── Logic and certainty ──────────────────────────────────────────────────
  const certain = paras.flatMap((p) => p.text.split(/(?<=[.!?])\s+/).filter((s) => CERTAIN.test(s)).map((s) => ({ s, p })));
  const unsure = paras.flatMap((p) => p.text.split(/(?<=[.!?])\s+/).filter((s) => UNCERTAIN.test(s)).map((s) => ({ s, p })));
  const seen = new Set<string>();
  for (const c of certain) for (const u of unsure) {
    if (c.p === u.p && c.s === u.s) continue;
    const shared = contentWords(c.s).map(stem).filter((w) => w.length > 4 && contentWords(u.s).map(stem).includes(w));
    const topic = shared[0];
    if (topic && !seen.has(topic) && seen.size < 6) {
      seen.add(topic);
      add({ id: `cert-${topic}`, area: "coherence", level: "review", text: `The book is certain in one place and uncertain in another about the same subject (“${topic}…”): make the level of certainty consistent, or explain the difference`, places: [placeOfPara(c.p, c.s), placeOfPara(u.p, u.s)] });
    }
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const byText = new Map<string, Para[]>();
  paras.filter((p) => p.text.split(/\s+/).length >= 20).forEach((p) => { const k = norm(p.text); byText.set(k, [...(byText.get(k) ?? []), p]); });
  byText.forEach((ps) => { if (ps.length > 1) add({ id: `repeat-${ps[0].line}`, area: "coherence", level: "review", text: `The same paragraph appears ${ps.length} times`, places: ps.map((p) => placeOfPara(p)) }); });
  const testimony = paras.filter((p) => TESTIMONY.test(p.text));
  if (testimony.length) add({ id: "testimony", area: "coherence", level: "note", text: `${testimony.length} ${testimony.length === 1 ? "passage is" : "passages are"} personal testimony (a dream, a vision, the author's experience): keep them, and let the reader see they are testimony rather than evidence`, places: testimony.map((p) => placeOfPara(p, (p.text.match(TESTIMONY) ?? [""])[0] + " · " + p.text)) });

  // ── Terminology (the book's own rules, outside quotations) ───────────────
  if (opts.rules?.trim()) {
    const rules = parseBookRules(opts.rules);
    const hits = paras.map((p) => ({ p, v: checkTerminology(p.text, rules) })).filter((x) => x.v.length);
    if (hits.length) {
      const words = [...new Set(hits.flatMap((x) => x.v.map((v) => `${v.word} → ${v.term}`)))];
      add({ id: "rules", area: "terminology", level: "blocker", text: `The book's rules are broken outside quotations in ${hits.length} ${hits.length === 1 ? "paragraph" : "paragraphs"} (${words.slice(0, 4).join(", ")})`, places: hits.map((x) => placeOfPara(x.p)) });
    }
  }

  // ── Sensitive claims (flagged for the author, never changed here) ────────
  const sensitive = paras.flatMap((p) => p.text.split(/(?<=[.!?])\s+/).filter((s) => SPIRIT.test(s) && GROUP.test(s)).map((s) => placeOfPara(p, s)));
  if (sensitive.length) add({ id: "sensitive", area: "sensitive", level: "review", text: `${sensitive.length} ${sensitive.length === 1 ? "sentence links" : "sentences link"} a group of people (sexuality, mental illness, disability) with demonic or spiritual causes. Keep the author's conviction, but present it as the author's theological belief, not as established or medical fact; the author decides`, places: sensitive });

  // ── Promised coverage (contents, course schedule) against the headings ──
  const later = (line: number) => headings.filter((h) => h.line > line).map((h) => new Set(contentWords(h.text).map(stem)));
  headings.filter((h) => PROMISE_HEADING.test(h.text)).forEach((h) => {
    const i = headings.indexOf(h); const next = headings.slice(i + 1).find((x) => x.level <= h.level);
    const items = lines.slice(h.line, next ? next.line - 1 : lines.length)
      .map((l, k) => ({ l, line: h.line + k + 1 }))
      .filter((x) => /^\s*(?:[-*+]|\d{1,3}[.)])\s+\S/.test(x.l))
      .map((x) => ({ ...x, text: x.l.replace(/^\s*(?:[-*+]|\d{1,3}[.)])\s+/, "").replace(/[*_`]/g, "").replace(/\s*[.…·\s]*\d+\s*$/, "").trim() }));
    if (!items.length) return;
    const targets = later(next ? next.line - 1 : h.line);
    const missing = items.filter((it) => {
      const want = contentWords(it.text).map(stem).filter((w) => w.length > 3);
      if (!want.length) return false;
      // A word matches a heading word with the same stem or a shared beginning ("demons" ~ "Demonology").
      const hit = (t: Set<string>, w: string) => t.has(w) || [...t].some((x) => Math.min(x.length, w.length) >= 5 && (x.startsWith(w) || w.startsWith(x)));
      return !targets.some((t) => want.filter((w) => hit(t, w)).length >= Math.max(1, Math.ceil(want.length / 2)));
    });
    // Matching by words is an estimate, so this asks for review rather than blocking export.
    if (missing.length) add({ id: `cover-${h.line}`, area: "coverage", level: "review",
      text: `“${clip(h.text, 50)}” lists ${missing.length} of ${items.length} ${items.length === 1 ? "item" : "items"} with no matching chapter or section in the book`, places: missing.map((it) => ({ heading: h.text, line: it.line, excerpt: clip(it.text) })) });
  });

  const blockers = findings.filter((f) => f.level === "blocker").length;
  const reviews = findings.filter((f) => f.level === "review").length;
  const order: AuditLevel[] = ["blocker", "review", "note"];
  findings.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  return { findings, blockers, reviews, notes: findings.length - blockers - reviews, ready: blockers === 0, headings: headings.length, words: (markdown.match(/\S+/g) ?? []).length };
}

/** The report as Markdown, for the editorial notes file and for copying. */
export function auditMarkdown(r: AuditReport, title = "Editorial check"): string {
  const out = [`# ${title}`, "", `${r.ready ? "No blocking problems." : `${r.blockers} blocking ${r.blockers === 1 ? "problem" : "problems"} to fix before publishing.`} ${r.reviews} to review, ${r.notes} ${r.notes === 1 ? "note" : "notes"}. ${r.words.toLocaleString("en")} words, ${r.headings} headings.`, ""];
  (Object.keys(AREA_LABEL) as AuditArea[]).forEach((area) => {
    const fs = r.findings.filter((f) => f.area === area);
    if (!fs.length) return;
    out.push(`## ${AREA_LABEL[area]}`, "");
    fs.forEach((f) => {
      out.push(`- **${f.level === "blocker" ? "Fix" : f.level === "review" ? "Review" : "Note"}:** ${f.text}`);
      f.places.forEach((p) => out.push(`  - line ${p.line} (${clip(p.heading, 50)}): ${p.excerpt}`));
    });
    out.push("");
  });
  return out.join("\n");
}

/** The problems to fix, as instructions for a targeted correction: what fails and where, the author's judgement items marked as such. */
export function correctionBrief(findings: AuditFinding[], max = 7000): string {
  const lines: string[] = [];
  for (const f of findings.filter((x) => x.level !== "note")) {
    lines.push(`- ${f.level === "blocker" ? "FIX" : "REVIEW (fix only if it can be done without changing the author's meaning; otherwise report it)"}: ${f.text}`);
    f.places.forEach((p) => lines.push(`  - ${p.line ? `line ${p.line}${p.heading ? ` (${clip(p.heading, 50)})` : ""}: ` : ""}${p.excerpt}`));
  }
  const out = lines.join("\n");
  return out.length > max ? `${out.slice(0, max)}\n- (more problems: run the check again after this correction)` : out;
}
