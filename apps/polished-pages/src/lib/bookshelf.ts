import { setTags, type DocSummary } from "@/lib/documents";

// My books: the owner's shelves are private document tags ("shelf:Devotional"),
// and a finished book carries "status:complete". Nothing else changes in the
// Library, and nothing here is public.
export const DEFAULT_SHELVES = [
  "Christian living", "Bible study", "Devotional", "Theology", "Teaching & sermons", "Biography & memoir",
  "Children", "Fiction", "Non-fiction", "Academic", "Poetry",
];
export const SHELF = "shelf:";
export const COMPLETE = "status:complete";

export const shelfOf = (d: Pick<DocSummary, "tags">) => (d.tags ?? []).find((t) => t.startsWith(SHELF))?.slice(SHELF.length) ?? null;
export const isComplete = (d: Pick<DocSummary, "tags">) => (d.tags ?? []).includes(COMPLETE);

export async function setShelf(d: DocSummary, shelf: string | null) {
  const rest = (d.tags ?? []).filter((t) => !t.startsWith(SHELF));
  const tags = shelf ? [...rest, SHELF + shelf.trim()] : rest;
  await setTags(d.id, tags);
  return tags;
}
export async function setComplete(d: DocSummary, done: boolean) {
  const rest = (d.tags ?? []).filter((t) => t !== COMPLETE);
  const tags = done ? [...rest, COMPLETE] : rest;
  await setTags(d.id, tags);
  return tags;
}
