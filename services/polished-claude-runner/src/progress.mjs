// Where a long job stopped, so the next run continues instead of starting again (DESIGN-SPEC.md §21):
// the pages of a scan already transcribed, and the chapters of a rewrite already written.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";

/** Pages read per run: a long scan is read in several short runs, each one kept as it finishes. */
export const SCAN_BATCH = 20;

const MARK = /<!--\s*page\s+(\d+)\s*-->/gi;
/** The last page a transcription reached (its "<!-- page N -->" markers). */
export function pagesDone(text) {
  let n = 0;
  for (const m of String(text).matchAll(MARK)) n = Math.max(n, Number(m[1]));
  return n;
}
export const stripPageMarks = (text) => String(text).replace(/<!--\s*page\s+\d+\s*-->\n?/gi, "");

/** A PDF's page count: pdfinfo when poppler is installed, otherwise the page objects in the file; 0 when unknown. */
export async function pdfPages(file) {
  const info = await new Promise((resolve) => execFile("pdfinfo", [file], { timeout: 15_000 }, (err, out) => resolve(err ? "" : String(out))));
  const m = /^Pages:\s*(\d+)/m.exec(info);
  if (m) return Number(m[1]);
  const bytes = await fs.readFile(file, "latin1").catch(() => "");
  return (bytes.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

/**
 * How far each scanned document has been read: its page count (page images the Studio rendered, else the PDF's pages,
 * else 1 for an image) and the last page in ./out/scanned/<name>.txt.
 */
export async function scanProgress(thread, cwd, { fresh = false } = {}) {
  const base = (f) => f.storedAs.replace(/\.[^.]+$/, "");
  const out = [];
  for (const f of thread.files) {
    if (f.kind !== "original" || /\.(txt|md|markdown|docx?|rtf|odt|epub|html?)$/i.test(f.storedAs)) continue;
    const images = thread.files.filter((x) => x.kind === "page" && x.storedAs.startsWith(`${base(f)}-p`)).length;
    const hasText = thread.files.some((x) => x.kind === "text" && x.storedAs === `${base(f)}.txt`);
    const scanned = await fs.readFile(path.join(cwd, "out", "scanned", `${base(f)}.txt`), "utf8").catch(() => "");
    const total = images || (/\.pdf$/i.test(f.storedAs) ? await pdfPages(path.join(cwd, "source", f.storedAs)) : 1);
    const done = fresh ? 0 : pagesDone(scanned);
    // Only documents that still need reading: no text yet, page images sent for a re-read, or a transcription not finished.
    if (!hasText || images || (scanned && done < total)) out.push({ name: f.name, storedAs: f.storedAs, base: base(f), images, total, done });
  }
  return out;
}

/** The pages the next run reads: the first unfinished document, from the page after the last one read. */
export function nextBatch(progress, size = SCAN_BATCH) {
  const f = progress.find((p) => p.total > 0 && p.done < p.total);
  return f ? { ...f, from: f.done + 1, to: Math.min(f.total, f.done + size) } : null;
}

/** Chapter files a stopped rewrite already wrote, with their length, for the run that continues it. */
export async function rewriteDone(cwd) {
  const dir = path.join(cwd, "out", "rewrite");
  const names = (await fs.readdir(dir).catch(() => [])).filter((n) => /^\d+.*\.md$/i.test(n)).sort();
  return Promise.all(names.map(async (n) => ({ name: n, words: (await fs.readFile(path.join(dir, n), "utf8")).split(/\s+/).filter(Boolean).length })));
}
