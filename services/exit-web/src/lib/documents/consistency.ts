import { DEFAULT_PROCESS_TIMELINE, milestone, weeksLabel, type CompanyProfile, type MilestoneId, type ProcessTimeline } from "@exit/engines";
import { SAMPLE_COMPANY } from "../profile";
import { CLOSING_ITEMS } from "../closing-checklist";

// ── CROSS-DOCUMENT CONSISTENCY ──────────────────────────────────────
// Rule-based checks over the text of every document generated for one
// company: the figures each one quotes against the company's own figures,
// the valuation against the one canonical valuation, the dates against the
// one process timeline, the closing items against the one checklist, the
// name (or code name) each one uses, and the currency. Each finding names the
// document, what it says and what it should say. The checks read only what a
// document states in the phrasings ExitOS uses; a figure they do not
// recognise is not checked, so "no findings" means "nothing contradicts",
// not "everything was verified".

export interface DocText {
  readonly typeId: string;
  readonly title: string;
  readonly text: string;
  /** Issued under a code name (pre-NDA). */
  readonly anonymized: boolean;
}

export type Check = "name" | "code_name" | "sample_data" | "figure" | "valuation" | "timeline" | "closing_items" | "currency" | "omission";
export interface Finding {
  readonly check: Check;
  readonly typeId: string;
  readonly severity: "high" | "medium";
  readonly what: string;
  readonly found: string;
  readonly expected: string;
}

export interface Truth {
  readonly company: CompanyProfile;
  readonly codeName: string;
  /** The canonical valuation (USD): headline low, mid, high. */
  readonly valuation?: { readonly low: number; readonly mid: number; readonly high: number };
  readonly timeline?: ProcessTimeline;
}

const pct = (x: number): number => Math.round(x * 100);
const m1 = (usd: number): number => Math.round(usd / 100_000) / 10;   // $ millions, one decimal
// a figure and its label are on one line: "78%\nEBITDA margin" is two bullets, not one claim
const numbers = (text: string, re: RegExp): number[] => text.split("\n").flatMap((line) => [...line.matchAll(re)]).map((m) => parseFloat((m.slice(1).find((g) => g !== undefined) ?? "").replace(/,/g, ""))).filter((n) => !Number.isNaN(n));

// "<label> → milestone": the words ExitOS uses near a date for each milestone
const MILESTONE_WORDS: ReadonlyArray<readonly [MilestoneId, RegExp]> = [
  ["ioi", /indications?(?: of interest)?|\bIOIs?\b/i],
  ["loi", /letter of intent|\bLOIs?\b|exclusivity/i],
  ["management_presentations", /management presentations?/i],
  ["confirmatory_diligence", /confirmatory diligence/i],
  ["signing", /\bsigning\b|definitive agreement|\bSPA\b|signature pages/i],
  ["closing", /\bclos(?:ing|e)\b/i],
  ["nda", /\bNDAs?\b/i],
  ["launch", /\blaunch\b|teaser issued/i],
];

/** Each "week N" / "weeks N–M" the text ties to a milestone, with what it says. */
function datedMilestones(text: string): Array<{ id: MilestoneId; start: number; end: number; quote: string }> {
  const out: Array<{ id: MilestoneId; start: number; end: number; quote: string }> = [];
  for (const line of text.split(/\n|(?<=[.;])\s/)) {
    for (const m of line.matchAll(/\bweeks?\s+(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?/gi)) {
      const start = +m[1], end = m[2] ? +m[2] : start;
      const at = m.index ?? 0;
      // "Weeks 5–6 · Letter of intent" names it after; otherwise the nearest milestone word before it in the clause
      const after = line.slice(at + m[0].length).match(/^\s*·\s*([^—|]+)/)?.[1] ?? "";
      const before = line.slice(Math.max(0, at - 70), at);
      let id: MilestoneId | undefined;
      if (after) id = MILESTONE_WORDS.find(([, re]) => re.test(after))?.[0];
      if (!id) {
        let best = -1;
        for (const [mid, re] of MILESTONE_WORDS) {
          const all = [...before.matchAll(new RegExp(re.source, "gi"))];
          const last = all.length ? (all[all.length - 1].index ?? -1) : -1;
          if (last > best) { best = last; id = mid; }
        }
      }
      if (id) out.push({ id, start, end, quote: line.slice(Math.max(0, at - 40), at + m[0].length).trim() });
    }
  }
  return out;
}

/** Findings for one document. */
export function checkDocument(d: DocText, t: Truth): Finding[] {
  const C = t.company, text = d.text, f: Finding[] = [];
  const add = (check: Check, severity: Finding["severity"], what: string, found: string, expected: string): void => { f.push({ check, typeId: d.typeId, severity, what, found, expected }); };

  // names
  if (d.anonymized) {
    if (C.name && text.includes(C.name)) add("name", "high", "Company named in a code-name document", C.name, t.codeName);
    if (!text.includes(t.codeName)) add("code_name", "high", "Code name", (text.match(/Project [A-Z][a-z]+/)?.[0]) ?? "none", t.codeName);
  } else if (!text.includes(C.name)) add("name", "medium", "Company name", "not stated", C.name);
  // another company's name — the demo company's — in the user's own documents
  if (C.name !== SAMPLE_COMPANY.name && text.includes(SAMPLE_COMPANY.name)) add("sample_data", "high", "The demo company appears in this document", SAMPLE_COMPANY.name, C.name);

  // figures the document quotes against the company's own
  // a money figure written without decimals ("$22M") is compared at that precision
  const figure = (what: string, found: number[], expected: number, tol: number, unit: string, check: Check = "figure"): void => {
    for (const n of new Set(found)) if (Math.abs(n - expected) > (unit === "M" && Number.isInteger(n) ? Math.max(tol, 0.5) : tol)) add(check, Math.abs(n - expected) / Math.max(1, Math.abs(expected)) >= 0.08 ? "high" : "medium", what, `${n}${unit}`, `${expected}${unit}`);
  };
  figure("ARR growth", numbers(text, /(\d{1,3})%\s*(?:YoY|year[- ]over[- ]year)|compounding at (\d{1,3})%|Revenue growth:\s*(\d{1,3})%/gi), pct(C.growth.arrGrowthYoyPct), 1, "%");
  figure("Gross margin", numbers(text, /(\d{1,3})%\s*gross margin|gross margin:?\s*(\d{1,3})%/gi), pct(C.revenue.grossMarginPct), 1, "%");
  figure("EBITDA margin", numbers(text, /(\d{1,3}(?:\.\d)?)%\s*EBITDA margin|EBITDA margin:?\s*(\d{1,3}(?:\.\d)?)%|EBITDA \((\d{1,3}(?:\.\d)?)% margin\)/gi), pct(C.revenue.ebitdaMarginPct), 1, "%");
  if (C.revenue.netRetentionPct != null) figure("Net retention", numbers(text, /(\d{2,3})%\s*net (?:revenue )?retention|net (?:revenue )?retention:?\s*(\d{2,3})%|(\d{2,3})%\s*NRR/gi), pct(C.revenue.netRetentionPct), 1, "%");
  figure("ARR", numbers(text, /\$(\d[\d,]*(?:\.\d+)?)M\s*(?:ARR|of annual recurring revenue)|ARR:?\s*\$(\d[\d,]*(?:\.\d+)?)M/gi), m1(C.revenue.annualRecurringRevenueUsd), 0.1, "M");
  figure("TTM revenue", numbers(text, /\$(\d[\d,]*(?:\.\d+)?)M\s*(?:TTM revenue|in trailing twelve-month revenue)|Revenue \(TTM\):?\s*\$(\d[\d,]*(?:\.\d+)?)M/gi), m1(C.revenue.trailingTwelveMonthsRevenueUsd), 0.1, "M");

  // the one valuation
  if (t.valuation) {
    const v = t.valuation;
    figure("Valuation midpoint", numbers(text, /enterprise value is \$(\d[\d,]*(?:\.\d+)?)M|midpoint \$(\d[\d,]*(?:\.\d+)?)M|Enterprise value \(mid\):?\s*\$(\d[\d,]*(?:\.\d+)?)M/gi), m1(v.mid), 0.1, "M", "valuation");
    for (const r of text.matchAll(/range \$(\d[\d,]*(?:\.\d+)?)M\s*[–-]\s*\$(\d[\d,]*(?:\.\d+)?)M/gi)) {
      const lo = parseFloat(r[1]), hi = parseFloat(r[2]);
      // a figure stated to fewer decimals is compared at its own precision
      const tol = (q: string): number => (q.includes(".") ? 0.1 : 0.5);
      if (Math.abs(lo - m1(v.low)) > tol(r[1]) || Math.abs(hi - m1(v.high)) > tol(r[2])) add("valuation", "high", "Valuation range", `$${lo}M – $${hi}M`, `$${m1(v.low)}M – $${m1(v.high)}M`);
    }
  }

  // the one process timeline
  const tl = t.timeline ?? DEFAULT_PROCESS_TIMELINE;
  for (const q of datedMilestones(text)) {
    const m = tl.milestones.find((x) => x.id === q.id);
    if (!m) continue;
    // a date inside the milestone's window is not a contradiction; one outside it is
    if (q.start < m.startWeek || q.end > m.endWeek) add("timeline", "high", `${m.label} date`, q.quote, weeksLabel(m));
  }

  // currency: ExitOS states every figure in US dollars
  const other = text.match(/[€£]\s?\d|\b(?:EUR|GBP)\s?\d/);
  if (other) add("currency", "high", "Currency", other[0], "USD ($)");

  // omission: a known high concentration not disclosed in a named document
  if (!d.anonymized && (C.revenue.customerConcentrationTop10Pct ?? 0) >= 0.35 && /cim|executive_summary/.test(d.typeId) && !/concentrat/i.test(text))
    add("omission", "high", "Customer concentration not disclosed", "not stated", `top-10 customers = ${pct(C.revenue.customerConcentrationTop10Pct ?? 0)}% of revenue`);

  return f;
}

/** The closing checklist must list every item once, with its milestone's timing. */
export function checkClosingChecklist(text: string, timeline: ProcessTimeline = DEFAULT_PROCESS_TIMELINE): Finding[] {
  const f: Finding[] = [];
  for (const i of CLOSING_ITEMS) {
    const rows = text.split("\n").filter((l) => l.includes(i.title));
    const timing = weeksLabel(milestone(timeline, i.by)).toLowerCase();
    if (rows.length !== 1) f.push({ check: "closing_items", typeId: "exitos.closing_checklist", severity: "high", what: i.title, found: rows.length ? `listed ${rows.length} times` : "missing", expected: "listed once" });
    else if (!rows[0].includes(timing)) f.push({ check: "closing_items", typeId: "exitos.closing_checklist", severity: "high", what: `${i.title} timing`, found: rows[0].match(/weeks? [\d–-]+/i)?.[0] ?? "none", expected: timing });
  }
  return f;
}

/** Every document together, and the closing checklist when given. */
export function checkSuite(docs: readonly DocText[], t: Truth, closingChecklist?: string): Finding[] {
  const out = docs.flatMap((d) => checkDocument(d, t));
  if (closingChecklist != null) out.push(...checkClosingChecklist(closingChecklist, t.timeline));
  return out;
}
