// Restore a project from its backup (DESIGN-SPEC.md §21): the .zip "Download a backup" makes becomes a
// new project with its manuscript (and every section's versions), its documents and its results.
// The project it came from is never touched.
import JSZip from "jszip";
import type { Manuscript } from "./manuscript";

export interface Backup { title: string; manuscript: Manuscript | null; documents: { name: string; bytes: Uint8Array }[]; results: { path: string; text: string }[] }

export async function readBackup(file: Blob): Promise<Backup> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(file); } catch { throw new Error("That file isn't a Claude Studio backup (.zip)."); }
  if (!zip.file("README.txt") && !zip.file("manuscript.json")) throw new Error("That .zip isn't a Claude Studio backup: it has no manuscript.json or README.txt.");
  const readme = (await zip.file("README.txt")?.async("string")) ?? "";
  const title = /^Claude Studio project: (.+)$/m.exec(readme)?.[1]?.trim() || "Restored project";
  let manuscript: Manuscript | null = null;
  const mj = await zip.file("manuscript.json")?.async("string");
  if (mj) { try { manuscript = JSON.parse(mj) as Manuscript; } catch { throw new Error("The backup's manuscript.json can't be read."); } }
  const documents: Backup["documents"] = [], results: Backup["results"] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (path.startsWith("documents/")) documents.push({ name: path.slice("documents/".length), bytes: await entry.async("uint8array") });
    // Results come back as they were; the earlier versions of whole books stay in the backup itself.
    else if (path.startsWith("results/") && !path.startsWith("results/versions/") && /\.(md|txt|json)$/i.test(path)) results.push({ path: path.slice("results/".length), text: await entry.async("string") });
  }
  return { title, manuscript, documents, results };
}

/** Which documents are uploads, and which are the text read from an upload (put back as its text). */
export function splitDocuments(docs: Backup["documents"]) {
  const base = (n: string) => n.replace(/\.[^.]+$/, "");
  const originals = docs.filter((d) => !/\.txt$/i.test(d.name) || !docs.some((o) => o !== d && base(o.name) === base(d.name)));
  const texts = docs.filter((d) => !originals.includes(d));
  return { originals, texts };
}
