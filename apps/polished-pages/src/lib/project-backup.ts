// A complete copy of a Studio project to keep on the owner's computer (DESIGN-SPEC.md §21):
// the manuscript with every section's versions, the uploaded documents and their text, every result,
// and the earlier versions of whole-book results.
import JSZip from "jszip";
import { isBookResult } from "./claude-studio";
import type { StudioBackend } from "./studio-backend";

export interface BackupReport { files: number; skipped: string[] }

export async function buildBackup(backend: StudioBackend, id: string, raw?: (storedAs: string) => Promise<ArrayBuffer>): Promise<{ blob: Blob; report: BackupReport }> {
  const zip = new JSZip();
  const skipped: string[] = [];
  let files = 0;
  const { thread } = await backend.thread(id);
  const add = (name: string, data: string | ArrayBuffer) => { zip.file(name, typeof data === "string" ? data : new Uint8Array(data)); files++; };
  const m = await backend.manuscript(id).catch(() => null);
  if (m) add("manuscript.json", JSON.stringify(m, null, 2));
  for (const f of thread.files) {
    try {
      // Originals as uploaded where the runner keeps them; otherwise their text.
      if (raw && f.kind !== "text") add(`documents/${f.storedAs}`, await raw(f.storedAs));
      else { const t = await backend.source(id, f.storedAs); if (t == null) throw new Error(); add(`documents/${f.storedAs}`, t); }
    } catch { skipped.push(`documents/${f.storedAs}`); }
  }
  for (const o of thread.outputs) {
    try { add(`results/${o.path}`, await backend.output(id, o.path)); } catch { skipped.push(`results/${o.path}`); }
    if (!isBookResult(o.path)) continue;
    try {
      const h = await backend.history(id, o.path);
      if (h.versions.length) add(`results/versions/${o.path}.history.json`, JSON.stringify(h, null, 2));
      for (const v of h.versions) { try { add(`results/versions/${o.path.replace(/\.md$/, "")}-v${v.n}.md`, await backend.version(id, o.path, v.n)); } catch { skipped.push(`version ${v.n} of ${o.path}`); } }
    } catch { /* no versions kept */ }
  }
  add("conversation.json", JSON.stringify(thread.messages, null, 2));
  add("README.txt", [
    `Claude Studio project: ${thread.title}`,
    `Saved ${new Date().toLocaleString()}.`,
    "",
    "manuscript.json   the book as written in the Studio, with each section's earlier versions",
    "documents/        the uploaded documents (and the text read from them)",
    "results/          everything Claude wrote; results/versions/ holds earlier versions of whole books",
    "conversation.json the runs and messages of the project",
    ...(skipped.length ? ["", "Could not be included:", ...skipped.map((s) => `- ${s}`)] : []),
  ].join("\n"));
  return { blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), report: { files, skipped } };
}
