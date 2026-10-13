import { checkDocument, type Truth } from "./consistency";
import type { DocumentVersion } from "./service";

// ── DOCUMENT QUALITY REVIEW ─────────────────────────────────────────
// A rubric run over every generated version before anyone else reads it. It
// finds what rules can find — contradictions, leaks, placeholders, broken
// phrasing, unsupported superlatives, thin or repetitive content — and scores
// the document. It cannot judge whether the argument persuades a buyer; that
// is the human review the score is meant to free up time for. The quality
// gate (quality.test.ts) re-runs it on the sample pack after every template
// change, so a document that has once passed cannot quietly get worse.

export type Severity = "critical" | "major" | "minor";
export interface QualityFinding {
  readonly severity: Severity;
  readonly rule: string;
  readonly section: string;
  readonly excerpt: string;
  readonly fix: string;
}
export interface QualityReport {
  readonly typeId: string;
  readonly title: string;
  readonly words: number;
  readonly score: number;
  readonly pass: boolean;
  readonly findings: readonly QualityFinding[];
}

const PENALTY: Record<Severity, number> = { critical: 25, major: 6, minor: 1 };
export const PASS_SCORE = 90;

/** Words a professional version of each type needs at minimum to do its job. */
export const MIN_WORDS: Record<string, number> = {
  "exitos.cim": 1800, "exitos.executive_summary": 550, "exitos.investor_deck": 300, "exitos.teaser": 300,
  "exitos.data_room_index": 250, "exitos.closing_checklist": 150, "exitos.board_memo_process": 350,
};

const STOP = new Set("a an the and or of in on at to for by with from as is are was were be been its it this that these those our their his her we you they which who whom whose than then into over under per not no all any each every more most less least other such same own only also very can will may should would could has have had do does did so if but about across after before between through during up down out off again once here there when where why how both few many much some one two three four five six seven eight nine ten company business buyers buyer process value market revenue growth margin weeks week".split(" "));
const SUPERLATIVE = /\b(world[- ]class|best[- ]in[- ]class|unparalleled|unrivall?ed|unique(?:ly)?|guarantee[ds]?|market[- ]leading|dominant|leader|leading|premier|cutting[- ]edge|state[- ]of[- ]the[- ]art|revolutionary|unmatched)\b/i;
const GARBAGE = /\b(undefined|NaN|Infinity|null)\b|\[object |\bTBD\b|lorem ipsum|\[MISSING[^\]]*\]|\{\{|\}\}/;
const FILLER = /\b(it is important to note|needless to say|at the end of the day|in order to|leverag(?:e|ing) synerg)/i;

interface Block { readonly section: string; readonly text: string; readonly table?: boolean }

/** The readable text of a DDM document, block by block. */
function blocksOf(ddm: DocumentVersion["ddm"]): Block[] {
  const out: Block[] = [];
  for (const s of ddm.sections) {
    for (const b of s.blocks as Array<Record<string, unknown>>) {
      const parts: string[] = [];
      if (typeof b.text === "string") parts.push(b.text);
      if (typeof b.title === "string") parts.push(b.title);
      if (Array.isArray(b.items)) for (const i of b.items as Array<{ text?: string }>) if (i.text) parts.push(i.text);
      for (const p of parts) out.push({ section: s.heading, text: p });
      if (Array.isArray(b.rows)) for (const r of b.rows as Array<Array<{ text?: string }>>) out.push({ section: s.heading, text: r.map((c) => c.text ?? "").join(" | "), table: true });
    }
  }
  return out;
}

const sentences = (t: string): string[] => t.split(/(?<=[.!?])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
const wordsOf = (t: string): string[] => t.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
const clip = (t: string, at: number, n = 70): string => t.slice(Math.max(0, at - 25), at + n).replace(/\s+/g, " ").trim();

/** Review one version. `truth` adds the cross-document consistency findings for this document. */
export function reviewVersion(v: DocumentVersion, truth?: Truth, anonymized = false): QualityReport {
  const blocks = blocksOf(v.ddm);
  const title = String((v.ddm.metadata as Record<string, unknown>)?.title ?? v.typeId);
  const f: QualityFinding[] = [];
  const add = (severity: Severity, rule: string, section: string, excerpt: string, fix: string): void => { f.push({ severity, rule, section, excerpt, fix }); };
  const all = blocks.map((b) => b.text).join("\n");
  const words = wordsOf(all).length;

  // critical: contradictions, leaks and broken output
  if (truth) for (const c of checkDocument({ typeId: v.typeId, title, text: all + "\n" + title, anonymized }, truth))
    add(c.severity === "high" ? "critical" : "major", `consistency:${c.check}`, "—", `${c.what}: says ${c.found}`, `should say ${c.expected}`);
  for (const d of v.disclosure) add("critical", "disclosure", "—", d.what, "remove it from a pre-NDA document");
  const seenSentence = new Map<string, string>();
  for (const b of blocks) {
    const g = b.text.match(GARBAGE);
    if (g) add("critical", "placeholder", b.section, clip(b.text, g.index ?? 0), "the generator emitted a placeholder or a missing value; supply the input or remove the line");
    if (b.text.trim() === "—" || b.text.trim() === "") add("critical", "empty", b.section, "(empty block)", "write the section or drop it");

    // major: phrasing a reader notices
    // a content word twice within five words of the same sentence
    repeat: for (const sentence of b.table ? [] : sentences(b.text.replace(/year over year|year on year|week by week|month over month/gi, "yoy"))) {
      const w = wordsOf(sentence);
      for (let i = 0; i < w.length; i++) {
        const k = w[i].toLowerCase().replace(/[^a-z-]/g, "");
        if (k.length < 4 || STOP.has(k)) continue;
        const j = w.slice(i + 1, i + 6).findIndex((x) => x.toLowerCase().replace(/[^a-z-]/g, "") === k && !/^[A-Z]/.test(x));
        if (j >= 0) { add("major", "repeated-word", b.section, w.slice(Math.max(0, i - 3), i + j + 4).join(" "), `"${k}" twice in a few words; rephrase`); break repeat; }
      }
    }
    for (const m of b.text.matchAll(/\b([Aa]n?) ([A-Za-z][\w-]*)/g)) {
      const art = m[1].toLowerCase(), next = m[2];
      if (/^[A-Z0-9&]{2,}$/.test(next)) continue;                       // acronyms read by letter: skip
      const vowel = /^[aeio]/i.test(next) || (/^u/i.test(next) && !/^u(ni|se|sa|su|r|ti)/i.test(next)) || /^(hour|honest|heir)/i.test(next);
      if ((art === "a" && vowel) || (art === "an" && !vowel)) add("major", "article", b.section, clip(b.text, m.index ?? 0, 40), `"${m[1]} ${next}" should be "${art === "a" ? "an" : "a"} ${next}"`);
    }
    if (/\b(a|an|the)\s+(a|an|the)\b/i.test(b.text) || /\b(\w+)\s+\1\b/i.test(b.text.replace(/\d+/g, ""))) add("major", "doubled-word", b.section, clip(b.text, b.text.search(/\b(\w+)\s+\1\b/i)), "a word is doubled");
    const sup = b.text.match(SUPERLATIVE);
    if (sup) add("major", "unsupported-claim", b.section, clip(b.text, sup.index ?? 0), `"${sup[0]}" needs evidence a buyer can check, or a plainer word`);
    if (/\ba \w+ operating in\b/i.test(b.text) && !/\ba \w+ (company|business|platform|provider|operator|group)\b/i.test(b.text)) add("major", "noun-phrase", b.section, clip(b.text, b.text.search(/\ba \w+ operating in\b/i)), "the sentence is missing its noun (\"a logistics operating in …\")");

    // minor: polish
    for (const s of sentences(b.text)) {
      const n = wordsOf(s).length;
      if (n > 45) add("minor", "long-sentence", b.section, s.slice(0, 80) + "…", `${n} words; split it`);
      if (n >= 8) {
        const key = s.toLowerCase().replace(/[^a-z ]/g, "");
        if (seenSentence.has(key) && seenSentence.get(key) !== b.section) add("minor", "repeated-sentence", b.section, s.slice(0, 80), `also in "${seenSentence.get(key)}"; say it once`);
        else seenSentence.set(key, b.section);
      }
    }
    const fl = b.text.match(FILLER);
    if (fl) add("minor", "filler", b.section, clip(b.text, fl.index ?? 0), "cut the filler phrase");
    if (b.text.includes("!")) add("minor", "tone", b.section, clip(b.text, b.text.indexOf("!")), "no exclamation marks in a transaction document");
  }

  // major: too thin for its job
  const min = MIN_WORDS[v.typeId];
  if (min && words < min) add("major", "too-thin", "—", `${words} words`, `a professional ${title} needs at least ~${min}: add the sections a reader expects`);
  // minor: mixed money formats ($18M and $18.0M)
  const money = [...all.matchAll(/\$\d+(?:\.(\d+))?[MBK]\b/g)].map((m) => (m[1] ?? "").length);
  if (new Set(money).size > 1) add("minor", "number-format", "—", "money with different decimal places", "one format: $18.0M throughout");

  const score = Math.max(0, 100 - f.reduce((s, x) => s + PENALTY[x.severity], 0));
  return { typeId: v.typeId, title, words, score, pass: score >= PASS_SCORE && !f.some((x) => x.severity === "critical"), findings: f };
}

/** The review as Markdown, for a person deciding what to fix next. */
export function qualityReportMarkdown(reports: readonly QualityReport[], heading = "Document quality review"): string {
  const lines = [`# ${heading}`, "", `Pass: score ≥ ${PASS_SCORE} and no critical finding. Penalties: critical ${PENALTY.critical}, major ${PENALTY.major}, minor ${PENALTY.minor}.`,
    "Rule-based: it does not judge whether the argument is persuasive — that is your review.", "",
    "| Document | Words | Score | Result | Critical | Major | Minor |", "|---|---|---|---|---|---|---|"];
  for (const r of reports) {
    const c = (s: Severity): number => r.findings.filter((x) => x.severity === s).length;
    lines.push(`| ${r.title} | ${r.words} | ${r.score} | ${r.pass ? "pass" : "**fail**"} | ${c("critical")} | ${c("major")} | ${c("minor")} |`);
  }
  for (const r of reports) {
    if (!r.findings.length) continue;
    lines.push("", `## ${r.title} — ${r.score}`, "", "| Severity | Rule | Section | Excerpt | Fix |", "|---|---|---|---|---|");
    for (const x of r.findings) lines.push(`| ${x.severity} | ${x.rule} | ${x.section} | ${x.excerpt.replace(/\|/g, "/")} | ${x.fix.replace(/\|/g, "/")} |`);
  }
  return lines.join("\n") + "\n";
}
