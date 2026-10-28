// The live rule checker (DESIGN-SPEC.md §21): the book's naming rules ("Write Yahuah instead of God
// (never Jehovah or Yahweh)", "Yahusha instead of Jesus", "use X, not Y", "X → Y") read as word pairs,
// and the words in a section that break them, outside quotations (quotations keep their wording).
import { findMatches, type Match } from "./find-replace";
import type { Manuscript } from "./manuscript";

export interface NameRule { wrong: string; right: string }
const WORD = "[\\p{L}][\\p{L}'’ -]{0,40}?";

export function parseRules(rules: string): NameRule[] {
  const out: NameRule[] = [];
  for (const raw of (rules || "").split("\n")) {
    const line = raw.trim().replace(/^[-*•]\s*/, "");
    let m = new RegExp(`(?:write|use|say)?\\s*(${WORD})\\s+instead of\\s+(${WORD})(?=\\s*(?:\\(|,|;|\\.|$))`, "iu").exec(line);
    if (m) {
      const right = m[1].replace(/^(write|use|say)\s+/i, "").trim(), wrong = m[2].trim();
      out.push({ wrong, right });
      const never = /never\s+([^)]+)/i.exec(line);
      if (never) for (const w of never[1].split(/\s*(?:,|\bor\b|\band\b)\s*/i).map((x) => x.trim()).filter(Boolean)) out.push({ wrong: w, right });
      continue;
    }
    m = new RegExp(`(${WORD})\\s*(?:→|->|=>)\\s*(${WORD})\\s*$`, "u").exec(line);
    if (m) { out.push({ wrong: m[1].trim(), right: m[2].trim() }); continue; }
    m = new RegExp(`use\\s+(${WORD}),?\\s+not\\s+(${WORD})\\s*\\.?$`, "iu").exec(line);
    if (m) out.push({ wrong: m[2].trim(), right: m[1].trim() });
  }
  // One entry per word; a capitalised name keeps its case.
  return out.filter((r, i) => r.wrong && r.right && r.wrong.toLowerCase() !== r.right.toLowerCase() && out.findIndex((x) => x.wrong === r.wrong) === i);
}

export interface RuleHit { rule: NameRule; matches: Match[] }
/** The words in this text that break the rules, outside quotations. */
export function ruleHits(text: string, rules: NameRule[]): RuleHit[] {
  const m = { title: "", history: [], sections: [{ id: "s", kind: "chapter", title: "", body: text }] } as Manuscript;
  return rules.map((rule) => ({ rule, matches: findMatches(m, rule.wrong, { wholeWord: true, caseSensitive: /^\p{Lu}/u.test(rule.wrong) }).filter((x) => !x.quoted) })).filter((h) => h.matches.length);
}

/** The text with these words replaced by the rule's word (from the end, so positions stay right). */
export function fixHits(text: string, hits: RuleHit[]): string {
  const all = hits.flatMap((h) => h.matches.map((x) => ({ ...x, right: h.rule.right }))).sort((a, b) => b.index - a.index);
  let out = text;
  for (const x of all) if (out.slice(x.index, x.index + x.length) === x.text) out = out.slice(0, x.index) + x.right + out.slice(x.index + x.length);
  return out;
}
