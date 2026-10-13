import type { SectionCoverage } from "@exit/engines";
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
/** Gate A: factual and logical integrity. Gate B: professional communication and rendering.
 *  Each is scored on its own rules; a document is accepted only when both pass, so a clean
 *  text score can never offset a failed PDF inspection, nor good prose a wrong figure. */
export interface GateScore { readonly score: number; readonly pass: boolean }
export interface QualityReport {
  readonly typeId: string;
  readonly title: string;
  readonly words: number;
  readonly gateA: GateScore;
  readonly gateB: GateScore;
  /** Overall: the lower of the two gate scores. */
  readonly score: number;
  readonly pass: boolean;
  /** Share of the document's sections the company's information supports (supported 1, partial ½), when known. */
  readonly completeness?: number;
  readonly findings: readonly QualityFinding[];
}

const GATE_A = /^(consistency:|disclosure|placeholder|leak:|provenance:|render:placeholder|render:state-not-shown|render:pdf-metadata)/;
export const gateOf = (rule: string): "A" | "B" => (GATE_A.test(rule) ? "A" : "B");

const PENALTY: Record<Severity, number> = { critical: 25, major: 6, minor: 1 };
export const PASS_SCORE = 90;

function scored(base: Pick<QualityReport, "typeId" | "title" | "words" | "completeness">, findings: readonly QualityFinding[]): QualityReport {
  const gate = (g: "A" | "B"): GateScore => {
    const fs = findings.filter((x) => gateOf(x.rule) === g);
    const score = Math.max(0, 100 - fs.reduce((t, x) => t + PENALTY[x.severity], 0));
    return { score, pass: score >= PASS_SCORE && !fs.some((x) => x.severity === "critical") };
  };
  const gateA = gate("A"), gateB = gate("B");
  return { ...base, gateA, gateB, score: Math.min(gateA.score, gateB.score), pass: gateA.pass && gateB.pass, findings };
}

/** What a stated assumed value looks like in text, per profile path (Gate A: no inferred fact stated as fact). */
const ASSUMED_STATEMENT: Record<string, (t: Truth) => RegExp> = {
  "team.headcount": () => /\b(?:employs|employing|headcount of|team of)\s+\d+|\b\d+\s+(?:people|employees|staff)\b/i,
  cap: () => /\bfounders?\b[^.\n]{0,30}\b\d{1,2}%|\bFounders: \d+%|\binvestors?: \d+%/i,
  "revenue.grossRetentionPct": () => /\bgross (?:revenue )?retention\b/i,
  "product.differentiation": () => /\bahead of (?:its|their) (?:main )?competitors\b|\bno direct competitor\b|\bmarket leader\b/i,
  "growth.customerGrowthYoyPct": () => /\bcustomer (?:count )?growth\b/i,
  "team.foundersStillActive": () => /\bfounders? (?:remain|are|is) (?:still )?active\b/i,
  "team.leadershipBenchStrength": () => /\bleadership bench\b/i,
  "product.technicalArchitecture": () => /\bmonolith\b|\bmicroservices\b/i,
  "market.addressableMarketUsd": (t) => new RegExp(`\\$${(t.company.market.addressableMarketUsd / 1e9).toFixed(1).replace(".", "\\.")}B|\\$${Math.round(t.company.market.addressableMarketUsd / 1e6)}M`),
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
export function reviewVersion(v: DocumentVersion, truth?: Truth, anonymized = false, coverage?: readonly SectionCoverage[]): QualityReport {
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
    repeat: for (const sentence of b.table ? [] : sentences(b.text.replace(/year over year|year on year|week by week|month over month/gi, "yoy")).flatMap((x) => x.split(/:\s|\s—\s|\s\(/))) {
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
      if (/^[A-Z]$/.test(m[1]) && /\b[A-Z][a-z]+\s$/.test(b.text.slice(0, m.index ?? 0))) continue;   // "Series A", "Class B": a name, not an article
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

  // Gate A: nothing the company did not supply is stated as its fact
  if (truth) {
    for (const path of truth.assumed ?? []) {
      const re = ASSUMED_STATEMENT[path]?.(truth);
      const hits = re ? [...all.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))] : [];
      const m = hits.find((h) => { const at = h.index ?? 0; const sent = all.slice(Math.max(0, all.lastIndexOf(".", at) + 1), all.indexOf(".", at + 1) >= 0 ? all.indexOf(".", at + 1) : all.length); return !/not yet supplied|has not (?:yet )?(?:been )?supplied|not been supplied|needs to provide|to complete this section/i.test(sent); });
      if (m) add("critical", "provenance:assumed-stated", "—", clip(all, m.index ?? 0), `"${path}" was not supplied by the Company; the document must not state it`);
    }
    // no financial period the company has not reported (or forecast)
    const allowed = new Set([...(truth.story?.financials?.annual ?? []).map((a) => a.period), ...(truth.story?.financials?.forecasts ?? []).map((x) => x.period)].map((x) => x.replace(/\s+/g, "").toUpperCase()));
    for (const m of all.matchAll(/\bFY\s?(\d{4})\b/g)) {
      if (!allowed.has(`FY${m[1]}`)) { add("critical", "provenance:invented-period", "—", clip(all, m.index ?? 0), `FY${m[1]} is not a period the Company reported or forecast`); break; }
    }
    if (/\bimplied\b[^.\n]{0,40}\b(?:prior|previous) year\b|\b(?:prior|previous) year \(implied\)/i.test(all)) add("critical", "provenance:invented-period", "—", "an implied prior-year figure", "show only reported periods");
  }

  // Gate B: substance for the document's purpose — every section is either written from the
  // company's information or states the gap (what is missing, why it matters, what completes it)
  let completeness: number | undefined;
  if (coverage?.length) {
    completeness = coverage.reduce((t, c) => t + (c.status === "supported" ? 1 : c.status === "partial" ? 0.5 : 0), 0) / coverage.length;
    for (const c of coverage) {
      const sec = v.ddm.sections.find((x) => x.heading.replace(/^\d+\.?\s*/, "") === c.section || x.heading === c.section);
      if (!sec) { add("critical", "coverage:section-missing", c.section, "section not in the document", "the structure lost a section"); continue; }
      const text = JSON.stringify(sec.blocks);
      if (c.status === "gap" && !/Not yet supplied/.test(text)) add("critical", "coverage:gap-unstated", c.section, "no gap statement", "say what is missing, why it matters and what completes it");
    }
  }
  // major (Gate B): a table too dense to read on a page — many columns holding long text
  for (const sec of v.ddm.sections) for (const b of sec.blocks as Array<Record<string, unknown>>) {
    if (b.type !== "table") continue;
    const cols = (b.columns as unknown[]).length, rows = b.rows as Array<Array<{ text?: string }>>;
    const long = rows.flat().filter((c) => (c.text ?? "").length > 60).length;
    const colsEmpty = (b.columns as Array<{ label: string }>).filter((_, ci) => rows.length > 0 && rows.every((r) => ["", "—", "-"].includes((r[ci]?.text ?? "").trim()))).map((c) => c.label);
    if (colsEmpty.length) add("major", "table-empty-column", sec.heading, `column "${colsEmpty.join('", "')}" is empty in every row`, "drop the column");
    if (cols > 5 && long > 0) add("major", "table-dense", sec.heading, `${cols} columns with ${long} long cell(s)`, "fewer columns; move long text to a note beneath the table");
  }
  // minor: mixed money formats ($18M and $18.0M)
  const money = [...all.matchAll(/\$\d+(?:\.(\d+))?[MBK]\b/g)].map((m) => (m[1] ?? "").length);
  if (new Set(money).size > 1) add("minor", "number-format", "—", "money with different decimal places", "one format: $18.0M throughout");

  return scored({ typeId: v.typeId, title, words, ...(completeness != null ? { completeness } : {}) }, f);
}

/** Add findings from the rendered outputs (rendered.ts) to a review and re-score it. */
export function withFindings(r: QualityReport, extra: readonly QualityFinding[]): QualityReport {
  return scored(r, [...r.findings, ...extra]);
}

/** The review as Markdown, for a person deciding what to fix next. */
export function qualityReportMarkdown(reports: readonly QualityReport[], heading = "Document quality review"): string {
  const lines = [`# ${heading}`, "",
    `Two independent gates; a document is accepted only when both pass (score ≥ ${PASS_SCORE} and no critical finding in that gate). Penalties: critical ${PENALTY.critical}, major ${PENALTY.major}, minor ${PENALTY.minor}.`,
    "- **Gate A — integrity:** figures, provenance, confidentiality, consistency, document state, no fabricated claims or periods.",
    "- **Gate B — communication and rendering:** structure and substance for the purpose, phrasing, claims, tables, headings and layout in the Markdown, the preview and the PDF.",
    "Completeness is the share of sections the company's information supports; a gap is stated, never filled. Rules cannot judge persuasiveness — human review is a separate requirement.", "",
    "| Document | Words | Gate A | Gate B | Completeness | Result | Critical | Major | Minor |", "|---|---|---|---|---|---|---|---|---|"];
  for (const r of reports) {
    const c = (s: Severity): number => r.findings.filter((x) => x.severity === s).length;
    const g = (x: GateScore): string => `${x.score}${x.pass ? "" : " ✗"}`;
    lines.push(`| ${r.title} | ${r.words} | ${g(r.gateA)} | ${g(r.gateB)} | ${r.completeness != null ? `${Math.round(r.completeness * 100)}%` : "—"} | ${r.pass ? "accepted" : "**rejected**"} | ${c("critical")} | ${c("major")} | ${c("minor")} |`);
  }
  for (const r of reports) {
    if (!r.findings.length) continue;
    lines.push("", `## ${r.title} — Gate A ${r.gateA.score}, Gate B ${r.gateB.score}`, "", "| Gate | Severity | Rule | Section | Excerpt | Fix |", "|---|---|---|---|---|---|");
    for (const x of r.findings) lines.push(`| ${gateOf(x.rule)} | ${x.severity} | ${x.rule} | ${x.section} | ${x.excerpt.replace(/\|/g, "/")} | ${x.fix.replace(/\|/g, "/")} |`);
  }
  return lines.join("\n") + "\n";
}
