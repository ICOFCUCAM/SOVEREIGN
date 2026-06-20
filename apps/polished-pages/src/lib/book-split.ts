// Split an uploaded book into transform-sized sections. Prefers chapter/heading
// boundaries; falls back to paragraph grouping. Each section stays well under the
// edge function's per-section limit so a long, many-page book is revised in
// bounded, sequential calls (with progress) rather than one giant request.
const TARGET = 14000; // chars per section (function hard-limits at 40000)

const isBoundary = (line: string): boolean =>
  /^#{1,3}\s/.test(line) || /^(chapter|part|section)\s+[\divxlc]+/i.test(line.trim());

export function splitBook(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: string[] = [];
  let cur: string[] = [];
  const len = () => cur.join("\n").length;
  const flush = () => { if (cur.join("\n").trim()) sections.push(cur.join("\n").trim()); cur = []; };

  for (const line of lines) {
    if (isBoundary(line) && len() > 0) flush();
    cur.push(line);
    // Hard cap: if a section runs long without a heading, break at a blank line.
    if (len() > TARGET && line.trim() === "") flush();
  }
  flush();

  // Merge very short sections forward to avoid a flood of tiny calls.
  const merged: string[] = [];
  for (const s of sections) {
    if (merged.length && merged[merged.length - 1].length + s.length < TARGET / 2) {
      merged[merged.length - 1] += "\n\n" + s;
    } else {
      merged.push(s);
    }
  }
  return merged.length ? merged : [text.trim()];
}
