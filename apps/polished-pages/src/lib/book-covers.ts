// A book's cover lives in the Library as a "cover" document linked to the book
// (parent_document_id). Its payload keeps the finished front and back images
// (what the Library, sharing and the marketplace show) and the Cover Studio
// design, so the cover can be reopened and edited.
import { getDocument, listDocuments, saveDocument, updateDocument, type DocSummary } from "@/lib/documents";
import { defaultDesign, type CoverDesign } from "@/lib/cover-design";

export interface CoverPayload { front: string; back: string | null; title: string; subtitle: string; author: string; design: CoverDesign }

/** The newest cover saved for each book, keyed by book id. */
export function latestCovers(docs: DocSummary[]): Map<string, DocSummary> {
  const out = new Map<string, DocSummary>();
  for (const d of docs) {
    if (d.kind !== "cover" || !d.parent_document_id) continue;
    const cur = out.get(d.parent_document_id);
    const at = (x: DocSummary) => Date.parse(x.updated_at ?? x.created_at);
    if (!cur || at(d) > at(cur)) out.set(d.parent_document_id, d);
  }
  return out;
}

export async function loadCover(id: string): Promise<{ id: string; payload: CoverPayload } | null> {
  const row = await getDocument(id);
  if (!row) return null;
  const p = (row.payload ?? {}) as Partial<CoverPayload>;
  return {
    id,
    payload: {
      front: String(p.front ?? ""), back: p.back ?? null, title: String(p.title ?? row.title), subtitle: String(p.subtitle ?? ""), author: String(p.author ?? ""),
      // Covers made before Cover Studio have images but no design: start a design around them.
      design: p.design ? defaultDesign(p.design) : defaultDesign({ title: String(p.title ?? row.title), subtitle: String(p.subtitle ?? ""), author: String(p.author ?? "") }),
    },
  };
}

export async function findBookCover(bookId: string) {
  const c = latestCovers(await listDocuments()).get(bookId);
  return c ? loadCover(c.id) : null;
}

/** Saves the cover (updating the given one, or adding one linked to the book) and returns its id. */
export async function saveCover(p: CoverPayload, opts: { id?: string | null; bookId?: string | null }): Promise<string> {
  const preview = `Cover · ${p.design.template} template${p.design.pages ? ` · ${p.design.pages} pages` : ""}`;
  if (opts.id) { await updateDocument(opts.id, p, preview); return opts.id; }
  return saveDocument({ kind: "cover", title: `${p.title || "Book"} — cover`, payload: p, preview, parent: opts.bookId ?? null });
}
