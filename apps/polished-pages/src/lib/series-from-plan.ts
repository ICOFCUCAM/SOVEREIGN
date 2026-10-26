import { saveDocument, setTags } from "@/lib/documents";
import { createSeries, setDocumentSeries } from "@/lib/series";
import { importText } from "@/lib/manuscript";
import { SHELF } from "@/lib/bookshelf";
import type { StudioBackend } from "@/lib/studio-backend";

// Acting on a "Turn into a series" result: the volumes become books in a new
// Library series (in order), and each planned book becomes a Studio project
// whose manuscript starts from its chapter outline.
export interface SeriesManifest { title: string; premise: string; volumes: { title: string; file: string }[]; planned: { title: string; file: string }[] }

export async function readManifest(backend: StudioBackend, threadId: string): Promise<SeriesManifest> {
  const raw = await backend.output(threadId, "series.json");
  const m = JSON.parse(raw) as Partial<SeriesManifest>;
  return { title: String(m.title ?? "Series"), premise: String(m.premise ?? ""), volumes: Array.isArray(m.volumes) ? m.volumes : [], planned: Array.isArray(m.planned) ? m.planned : [] };
}

export async function createSeriesInLibrary(backend: StudioBackend, threadId: string, shelf?: string): Promise<{ seriesId: string; books: number }> {
  const m = await readManifest(backend, threadId);
  if (!m.volumes.length) throw new Error("This plan has no volumes to save.");
  const seriesId = await createSeries({ title: m.title, premise: m.premise });
  let i = 0;
  for (const v of m.volumes) {
    const md = await backend.output(threadId, v.file);
    const id = await saveDocument({ kind: "book", title: v.title, payload: { markdown: md, title: v.title }, preview: md.replace(/^#.*$/m, "").trim().slice(0, 160) });
    await setDocumentSeries(id, seriesId, ++i);
    if (shelf) await setTags(id, [SHELF + shelf]).catch(() => {});
  }
  return { seriesId, books: i };
}

/** One project per planned book, its manuscript laid out from the outline (chapter summaries as notes to write from). */
export async function startPlannedBooks(backend: StudioBackend, threadId: string): Promise<string[]> {
  const m = await readManifest(backend, threadId);
  const ids: string[] = [];
  for (const p of m.planned) {
    const md = await backend.output(threadId, p.file);
    const t = await backend.create(p.title);
    const ms = importText(p.title, md);
    // The premise paragraph before the first chapter heading stays in the uploaded outline, not as a chapter.
    if (ms.sections.length > 1 && ms.sections[0].title === "Chapter 1" && /^##\s/m.test(md)) ms.sections.shift();
    ms.sections = ms.sections.map((s) => ({ ...s, body: s.body ? `[[YOURS: Outline: ${s.body.replace(/\s+/g, " ").trim()}]]` : "" }));
    await backend.upload(t.id, new File([md], `${p.title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "outline"} (outline).md`, { type: "text/markdown" }));
    await backend.saveManuscript(t.id, ms);
    ids.push(t.id);
  }
  return ids;
}
