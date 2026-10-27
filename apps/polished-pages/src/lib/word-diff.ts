// Tracked changes between two versions of a section: paragraphs are matched
// first, then words inside each changed paragraph, so a whole chapter diffs
// quickly and reads like suggestion mode in a word processor.

export type DiffKind = "same" | "add" | "del";
export interface DiffPart { kind: DiffKind; text: string }
/** One paragraph to show, made of unchanged, added and removed runs. */
export interface DiffBlock { parts: DiffPart[] }

// The longest common subsequence of two lists, as a list of same/add/del runs.
// Common ends are trimmed first; a middle too large to compare is shown as one
// removal and one addition rather than spending seconds on it.
function diffSeq(a: string[], b: string[], limit = 2_500_000): { kind: DiffKind; items: string[] }[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  const out: { kind: DiffKind; items: string[] }[] = [];
  const push = (kind: DiffKind, item: string) => {
    const last = out[out.length - 1];
    if (last?.kind === kind) last.items.push(item); else out.push({ kind, items: [item] });
  };
  a.slice(0, start).forEach((x) => push("same", x));
  const A = a.slice(start, endA), B = b.slice(start, endB);
  if (A.length * B.length > limit) {
    A.forEach((x) => push("del", x)); B.forEach((x) => push("add", x));
  } else {
    const n = A.length, m = B.length;
    const L = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      L[i * (m + 1) + j] = A[i] === B[j] ? L[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + j + 1]);
    }
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { push("same", A[i]); i++; j++; }
      else if (L[(i + 1) * (m + 1) + j] >= L[i * (m + 1) + j + 1]) push("del", A[i++]);
      else push("add", B[j++]);
    }
    while (i < n) push("del", A[i++]);
    while (j < m) push("add", B[j++]);
  }
  a.slice(endA).forEach((x) => push("same", x));
  return out;
}

const paragraphs = (t: string) => t.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
// Words with the space after them, so joining the parts gives back the text.
const words = (t: string) => t.match(/\S+\s*/g) ?? [];

function wordParts(a: string, b: string): DiffPart[] {
  return diffSeq(words(a), words(b), 1_500_000).map((r) => ({ kind: r.kind, text: r.items.join("") }));
}

/** The changes from `before` to `after`, paragraph by paragraph. */
export function diffText(before: string, after: string): DiffBlock[] {
  const runs = diffSeq(paragraphs(before), paragraphs(after));
  const blocks: DiffBlock[] = [];
  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    if (run.kind === "same") { run.items.forEach((p) => blocks.push({ parts: [{ kind: "same", text: p }] })); continue; }
    // A removal followed by an addition is a rewrite of those paragraphs: compare them word by word.
    const next = runs[r + 1];
    if (run.kind === "del" && next?.kind === "add") {
      const pairs = Math.min(run.items.length, next.items.length);
      for (let k = 0; k < pairs; k++) blocks.push({ parts: wordParts(run.items[k], next.items[k]) });
      run.items.slice(pairs).forEach((p) => blocks.push({ parts: [{ kind: "del", text: p }] }));
      next.items.slice(pairs).forEach((p) => blocks.push({ parts: [{ kind: "add", text: p }] }));
      r++;
      continue;
    }
    run.items.forEach((p) => blocks.push({ parts: [{ kind: run.kind, text: p }] }));
  }
  return blocks;
}

/** How many separate changes there are (each added or removed run counts once; a replacement counts once). */
export function countChanges(blocks: DiffBlock[]): number {
  let n = 0;
  for (const b of blocks) b.parts.forEach((p, i) => { if (p.kind === "del" || (p.kind === "add" && b.parts[i - 1]?.kind !== "del")) n++; });
  return n;
}
