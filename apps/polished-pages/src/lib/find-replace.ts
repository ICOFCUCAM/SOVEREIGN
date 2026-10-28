// Find and replace across the whole book (DESIGN-SPEC.md §21). Every match is shown with its context and
// chosen one by one; matches inside quotations start unticked (quotations are never changed blindly);
// each changed section keeps its text as it was in its version history.
import { addVersion } from "./section-versions";
import type { Manuscript } from "./manuscript";

export interface FindOptions { caseSensitive?: boolean; wholeWord?: boolean; titles?: boolean }
export interface Match { id: string; sectionId: string; field: "title" | "body"; index: number; length: number; before: string; text: string; after: string; quoted: boolean }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function pattern(query: string, o: FindOptions = {}): RegExp | null {
  if (!query) return null;
  const core = escape(query);
  return new RegExp(o.wholeWord ? `(?<![\\p{L}\\p{N}_])${core}(?![\\p{L}\\p{N}_])` : core, `gu${o.caseSensitive ? "" : "i"}`);
}

/** Whether a position is inside a quotation: a block quote line, or between quotation marks in its paragraph. */
export function inQuotation(text: string, at: number): boolean {
  const start = text.lastIndexOf("\n\n", at) + 1;
  const line = text.slice(text.lastIndexOf("\n", at - 1) + 1, at);
  if (/^\s*>/.test(line)) return true;
  const para = text.slice(start, at);
  const curly = (para.match(/“/g) || []).length - (para.match(/”/g) || []).length;
  const straight = (para.match(/"/g) || []).length % 2;
  return curly > 0 || straight === 1;
}

export function findMatches(m: Manuscript, query: string, o: FindOptions = {}): Match[] {
  const re = pattern(query, o);
  if (!re) return [];
  const out: Match[] = [];
  for (const s of m.sections) {
    for (const field of (o.titles ? ["title", "body"] : ["body"]) as ("title" | "body")[]) {
      const text = s[field];
      for (const x of text.matchAll(re)) {
        const i = x.index ?? 0;
        out.push({ id: `${s.id}:${field}:${i}`, sectionId: s.id, field, index: i, length: x[0].length, before: text.slice(Math.max(0, i - 60), i), text: x[0], after: text.slice(i + x[0].length, i + x[0].length + 60), quoted: field === "body" && inQuotation(text, i) });
      }
    }
  }
  return out;
}

/** Replaces the chosen matches; each changed section keeps a version of its text before the change. */
export function replaceMatches(m: Manuscript, chosen: Match[], replacement: string): Manuscript {
  const by = new Map<string, Match[]>();
  for (const c of chosen) by.set(c.sectionId, [...(by.get(c.sectionId) ?? []), c]);
  return {
    ...m,
    sections: m.sections.map((s) => {
      const list = by.get(s.id);
      if (!list) return s;
      let next = { ...addVersion(s, "snapshot", "Before find and replace") };
      for (const field of ["title", "body"] as const) {
        // From the end, so earlier positions stay valid.
        for (const c of list.filter((x) => x.field === field).sort((a, b) => b.index - a.index)) {
          const t = next[field];
          if (t.slice(c.index, c.index + c.length) !== c.text) continue; // the text changed since it was found
          next = { ...next, [field]: t.slice(0, c.index) + replacement + t.slice(c.index + c.length) };
        }
      }
      return next;
    }),
  };
}
