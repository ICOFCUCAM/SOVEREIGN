// Edit on the Book page (DESIGN-SPEC.md §21): a paragraph clicked on a set page is found again in the
// manuscript by its words (the marks of the text set aside), so the owner corrects it where they read it.
import type { Manuscript } from "./manuscript";

const plain = (s: string) => s.replace(/\[\^[^\]]+\]/g, "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "").replace(/^\s*(?:>\s?|[-*]\s+|\d+[.)]\s+)/gm, "").replace(/\*\*|__|[*_`]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

export interface Found { sectionId: string; start: number; end: number; raw: string }
export function findParagraph(m: Manuscript, setText: string): Found | null {
  const key = plain(setText).slice(0, 90);
  if (key.length < 8) return null;
  for (const s of m.sections) {
    let at = 0;
    for (const part of s.body.split(/(\n\s*\n)/)) {
      if (!/^\n\s*\n$/.test(part) && part.trim()) {
        const p = plain(part);
        if (p.startsWith(key) || (key.length > 30 && p.includes(key.slice(0, 40)))) return { sectionId: s.id, start: at, end: at + part.length, raw: part };
      }
      at += part.length;
    }
  }
  return null;
}
