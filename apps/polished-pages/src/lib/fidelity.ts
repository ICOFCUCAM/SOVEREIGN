// Faithfulness of a rewrite to the author's original (DESIGN-SPEC.md §15;
// source: source/2026-10-rewrite-review.md §3, §4 "Faithfulness to the source").
// Deterministic comparison of the original text with the rewritten book:
// scripture references and quotations kept or lost, qualifications removed,
// sentences copied unchanged (a rewrite re-expresses the ideas; only quotations
// and scripture stay word for word),
// certainty added, and names, numbers and headings that appear only in the
// rewrite (possible additions for the author to confirm). The book's own rules
// (Yahusha for Jesus, …) are applied to the original first, so a change the
// rules require is never reported as a change of meaning.
import { scriptureRefs } from "@/lib/teacher/scripture";
import { parseBookRules, type TermRule } from "../../supabase/functions/_shared/teacher-core";
import { CERTAIN, clip, contentWords, stem, type AuditFinding, type AuditPlace } from "@/lib/editorial-audit";

export interface FidelityReport {
  findings: AuditFinding[];
  stats: { originalWords: number; rewriteWords: number; refsKept: number; refsLost: number; refsAdded: number; quotesKept: number; quotesLost: number; qualifiersOriginal: number; qualifiersRewrite: number; copiedShare: number };
}

// Qualifications, in the author's words or in the professional wording a rewrite may give them ("I suppose" → "probably", "in the author's view").
const HEDGE = /\b(?:i (?:suppose|think|believe|suspect|feel|guess)|in (?:my|the author's|this author's) (?:view|opinion|understanding|reading)|the author (?:suggests|believes|holds|suspects|proposes|understands)|it (?:seems|appears)|seems? to|appears? to|perhaps|possibly|probably|maybe|might|may (?:be|refer|mean|indicate|suggest|have|well)|could (?:be|refer|mean)|it is possible|not (?:sure|certain)|we cannot be sure|likely|apparently|arguably|some (?:believe|say|teach|hold)|one (?:reading|interpretation)|can be read as|tentatively)\b/i;
const MAX = 12;

const sentencesOf = (text: string) => text.replace(/\r\n?/g, "\n").split(/(?<=[.!?…])\s+|\n{2,}/).map((s) => s.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim()).filter((s) => s.split(" ").length >= 4);
const flat = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9À-ɏ' ]+/g, " ").replace(/\s+/g, " ").trim();
const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

/** Applies the book's term rules to the original, so required replacements are not counted as changes. */
function applyRules(text: string, rules: TermRule[]): string {
  let out = text;
  for (const r of rules) for (const w of r.replaces) out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "giu"), r.term);
  return out;
}

/** For each sentence of A, the most similar sentence of B (shared content words), via an index. */
function matcher(b: string[]) {
  const sets = b.map((s) => new Set(contentWords(s).map(stem)));
  const index = new Map<string, number[]>();
  sets.forEach((set, i) => set.forEach((w) => index.set(w, [...(index.get(w) ?? []), i])));
  return (sentence: string): { i: number; score: number } | null => {
    const want = [...new Set(contentWords(sentence).map(stem))];
    if (want.length < 3) return null;
    const hits = new Map<number, number>();
    want.forEach((w) => (index.get(w) ?? []).forEach((i) => hits.set(i, (hits.get(i) ?? 0) + 1)));
    // Best by overlap of both sentences; accepted when it shares at least three words and over half of the shorter one.
    let best: { i: number; score: number; shared: number } | null = null;
    hits.forEach((n, i) => { const score = (2 * n) / (want.length + sets[i].size); if (!best || score > best.score) best = { i, score, shared: n }; });
    return best && best.shared >= 3 && best.shared / Math.min(want.length, sets[best.i].size) > 0.5 ? best : null;
  };
}

export function compareFidelity(original: string, rewrite: string, opts: { rules?: string } = {}): FidelityReport {
  const rules = parseBookRules(opts.rules ?? "").filter((r): r is TermRule => r.kind === "required_term");
  const orig = applyRules(original ?? "", rules);
  const rw = rewrite ?? "";
  const findings: AuditFinding[] = [];
  const at = (excerpt: string): AuditPlace => ({ heading: "", line: 0, excerpt: clip(excerpt, 220) });
  const add = (f: Omit<AuditFinding, "area" | "places"> & { places?: AuditPlace[] }) => findings.push({ ...f, area: "fidelity", places: (f.places ?? []).slice(0, MAX) });

  // Scripture references: every one the author gave should still be there; new ones are additions to confirm.
  const refsO = new Map(scriptureRefs(orig).map((r) => [r.normalized, r.original]));
  const refsR = new Map(scriptureRefs(rw).map((r) => [r.normalized, r.original]));
  const lost = [...refsO.keys()].filter((k) => !refsR.has(k));
  const added = [...refsR.keys()].filter((k) => !refsO.has(k));
  if (lost.length) add({ id: "refs-lost", level: "blocker", text: `${lost.length} scripture ${lost.length === 1 ? "reference" : "references"} from the original ${lost.length === 1 ? "is" : "are"} missing from the rewrite: ${lost.slice(0, 8).map((k) => refsO.get(k)).join(", ")}${lost.length > 8 ? "…" : ""}` });
  if (added.length) add({ id: "refs-added", level: "review", text: `${added.length} scripture ${added.length === 1 ? "reference appears" : "references appear"} only in the rewrite (check each is the author's intention): ${added.slice(0, 8).map((k) => refsR.get(k)).join(", ")}${added.length > 8 ? "…" : ""}` });

  // Quotations of six words or more must survive word for word.
  const quotes = [...orig.matchAll(/“([^”]{20,})”|"([^"\n]{20,})"/g)].map((m) => (m[1] ?? m[2]).trim()).filter((q) => q.split(/\s+/).length >= 6);
  const rwFlat = flat(rw);
  const lostQuotes = [...new Set(quotes)].filter((q) => !rwFlat.includes(flat(q)));
  if (lostQuotes.length) add({ id: "quotes-lost", level: "blocker", text: `${lostQuotes.length} ${lostQuotes.length === 1 ? "quotation was" : "quotations were"} changed or dropped (quotations must stay word for word)`, places: lostQuotes.map((q) => at(`“${q}”`)) });

  // Qualifications removed and certainty added, sentence by sentence.
  const sO = sentencesOf(orig), sR = sentencesOf(rw);
  const toRewrite = matcher(sR), toOriginal = matcher(sO);
  const removed: AuditPlace[] = [];
  sO.filter((s) => HEDGE.test(s)).forEach((s) => {
    const m = toRewrite(s);
    if (m && !HEDGE.test(sR[m.i])) removed.push(at(`Original: “${clip(s, 160)}” → Rewrite: “${clip(sR[m.i], 160)}”`));
  });
  const hedgesO = sO.filter((s) => HEDGE.test(s)).length, hedgesR = sR.filter((s) => HEDGE.test(s)).length;
  if (removed.length) add({ id: "hedges", level: removed.length >= 3 ? "blocker" : "review", text: `${removed.length} ${removed.length === 1 ? "sentence lost its" : "sentences lost their"} qualification (“I suppose”, “perhaps”, “it seems”…): the rewrite states as certain what the author offered as opinion`, places: removed });
  const firmer: AuditPlace[] = [];
  sR.filter((s) => CERTAIN.test(s)).forEach((s) => {
    const m = toOriginal(s);
    if (m && !CERTAIN.test(sO[m.i])) firmer.push(at(`Original: “${clip(sO[m.i], 160)}” → Rewrite: “${clip(s, 160)}”`));
  });
  if (firmer.length) add({ id: "certainty", level: "review", text: `${firmer.length} ${firmer.length === 1 ? "sentence is" : "sentences are"} more certain than the original (“clearly”, “without doubt”…)`, places: firmer });

  // Names and numbers that only the rewrite contains: possible invented details.
  const known = new Set(flat(orig).split(" "));
  rules.forEach((r) => known.add(r.term.toLowerCase()));
  const refText = new Set(scriptureRefs(rw).map((r) => r.original));
  let rwNoRefs = rw; refText.forEach((t) => { rwNoRefs = rwNoRefs.split(t).join(" "); });
  const newNames = new Map<string, string>();
  sentencesOf(rwNoRefs).forEach((s) => {
    for (const m of s.matchAll(/(?<![\p{L}'])(\p{Lu}[\p{L}'’-]{2,}|\d{2,4})(?![\p{L}\d])/gu)) {
      const w = m[1].replace(/[’']s$/, "");
      // Capitalised common words ("They", "However") open sentences; only names and numbers count.
      if (!/^\d/.test(w) && !contentWords(w).length) continue;
      if (!known.has(w.toLowerCase()) && !newNames.has(w)) newNames.set(w, s);
    }
  });
  if (newNames.size) add({ id: "new-details", level: "review", text: `${newNames.size} ${newNames.size === 1 ? "name or number appears" : "names and numbers appear"} only in the rewrite: confirm each was the author's, not added (${[...newNames.keys()].slice(0, 10).join(", ")}${newNames.size > 10 ? "…" : ""})`, places: [...newNames].map(([w, s]) => at(`${w} · ${s}`)) });

  // Headings the original had that the rewrite no longer has.
  const headsO = [...orig.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => m[1].trim());
  const headsR = [...rw.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => new Set(contentWords(m[1]).map(stem)));
  const lostHeads = headsO.filter((h) => { const want = contentWords(h).map(stem); return want.length > 0 && !headsR.some((t) => want.filter((w) => t.has(w)).length >= Math.ceil(want.length / 2)); });
  if (lostHeads.length) add({ id: "heads-lost", level: "review", text: `${lostHeads.length} ${lostHeads.length === 1 ? "heading" : "headings"} of the original have no counterpart in the rewrite: was that material moved, merged or dropped?`, places: lostHeads.map((h) => at(h)) });

  // A rewrite re-expresses the author's ideas; sentences copied unchanged (outside quotations) mean it was not rewritten.
  const origSet = new Set(sO.map((x) => flat(x.replace(/“[^”]*”|"[^"\n]*"/g, " "))).filter((x) => x.split(" ").length >= 6));
  const own = sR.map((x) => flat(x.replace(/“[^”]*”|"[^"\n]*"/g, " "))).filter((x) => x.split(" ").length >= 6);
  const copied = own.filter((x) => origSet.has(x));
  if (own.length >= 10 && copied.length / own.length > 0.3) {
    const share = Math.round((copied.length / own.length) * 100);
    add({ id: "copied", level: share > 60 ? "blocker" : "review", text: `${share}% of the rewrite's sentences are copied unchanged from the original: a rewrite keeps the ideas and re-expresses them professionally`, places: copied.slice(0, MAX).map((x) => at(x)) });
  }

  // Length: a much shorter rewrite usually means dropped teaching.
  const wo = wordCount(orig), wr = wordCount(rw);
  if (wo > 200 && wr < wo * 0.75) add({ id: "shorter", level: wr < wo * 0.5 ? "blocker" : "review", text: `The rewrite is ${Math.round((1 - wr / wo) * 100)}% shorter than the original (${wr.toLocaleString("en")} of ${wo.toLocaleString("en")} words): check nothing was dropped` });
  else if (wo > 200 && wr > wo * 1.6) add({ id: "longer", level: "note", text: `The rewrite is ${Math.round((wr / wo - 1) * 100)}% longer than the original: check every addition is explanation, not new claims` });

  const order = ["blocker", "review", "note"];
  findings.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  return { findings, stats: { originalWords: wo, rewriteWords: wr, refsKept: refsO.size - lost.length, refsLost: lost.length, refsAdded: added.length, quotesKept: new Set(quotes).size - lostQuotes.length, quotesLost: lostQuotes.length, qualifiersOriginal: hedgesO, qualifiersRewrite: hedgesR, copiedShare: own.length ? copied.length / own.length : 0 } };
}
