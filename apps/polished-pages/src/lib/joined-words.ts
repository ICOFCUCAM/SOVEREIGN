// Words joined when a book was imported (DESIGN-SPEC.md §22): a PDF line break lost its space, so
// "Yahusha" + "and" printed as "Yahushaand". Found from the book's own vocabulary: a word the book
// uses at most once that splits into a name or word the book uses often and a common short word (or
// two words the book uses often). Shown for review; a space is only inserted when the author agrees.

const FUNCTION = new Set(["and", "the", "of", "to", "in", "is", "was", "that", "for", "with", "as", "his", "her", "are", "but", "not", "who", "which", "from", "by", "on", "at", "be", "this", "he", "she", "it", "we", "they", "our", "their", "him", "them", "a", "an", "or", "were", "has", "had", "have", "will", "shall", "all", "said", "unto"]);
// Ordinary English words made of two words, never split.
const COMPOUNDS = new Set("another anyone anything anyway anywhere become before behind beside besides beyond cannot everyone everything everywhere forever furthermore however herein hereby herself himself inside into itself meanwhile myself nevertheless nobody nothing notwithstanding onto otherwise ourselves outside someone something sometimes somewhere thereby therefore therein thereof throughout together understand upon whatever whenever whereas whereby wherein whereof wherever whoever within without yourself themselves already although altogether always almost also overcome undergo underneath forgive forgiven forgiveness withstand withhold whatsoever whosoever whomsoever howbeit thereto hereafter heretofore insofar inasmuch".split(" "));

export interface Joined { index: number; length: number; text: string; fix: string }

const WORDS = /\p{L}+/gu;
/** How often each word appears (lower case) in the book. */
export function vocabulary(text: string): Map<string, number> {
  const v = new Map<string, number>();
  for (const m of text.matchAll(WORDS)) { const w = m[0].toLowerCase(); v.set(w, (v.get(w) ?? 0) + 1); }
  return v;
}

/** The joined words in this text, judged against the whole book's vocabulary. */
export function joinedWords(text: string, vocab: Map<string, number>): Joined[] {
  const out: Joined[] = [];
  for (const m of text.matchAll(WORDS)) {
    const word = m[0], low = word.toLowerCase();
    if (low.length < 6 || (vocab.get(low) ?? 0) > 2 || COMPOUNDS.has(low)) continue;
    let best: string | null = null;
    for (let i = 3; i <= low.length - 2; i++) {
      const left = low.slice(0, i), right = low.slice(i);
      const lf = vocab.get(left) ?? 0, rf = vocab.get(right) ?? 0;
      // A name or word the book uses often, followed by a common short word ("Yahusha" + "and").
      const nameThenWord = lf >= 3 && left.length >= 4 && FUNCTION.has(right) && !FUNCTION.has(left);
      // Two words the book uses often ("scripturesteach").
      const twoWords = lf >= 5 && rf >= 5 && left.length >= 4 && right.length >= 4;
      if (nameThenWord || twoWords) { best = `${word.slice(0, i)} ${word.slice(i)}`; break; }
    }
    if (best) out.push({ index: m.index ?? 0, length: word.length, text: word, fix: best });
  }
  return out;
}

/** The text with a space put into each of these words (from the end, so positions stay right). */
export function separate(text: string, hits: Joined[]): string {
  let out = text;
  for (const h of [...hits].sort((a, b) => b.index - a.index)) if (out.slice(h.index, h.index + h.length) === h.text) out = out.slice(0, h.index) + h.fix + out.slice(h.index + h.length);
  return out;
}
