// Insert a scripture verse (DESIGN-SPEC.md §21): fetched word for word from a public-domain translation
// (bible-api.com) and inserted as a quotation with its reference. Quotations keep their wording: the
// book's naming rules apply to the author's own words, not to quoted scripture.
export const TRANSLATIONS: { id: string; label: string }[] = [
  { id: "kjv", label: "KJV" }, { id: "web", label: "WEB" }, { id: "asv", label: "ASV" }, { id: "ylt", label: "YLT" }, { id: "darby", label: "Darby" },
];

export async function fetchVerse(reference: string, translation = "kjv", fetcher: typeof fetch = fetch): Promise<{ text: string; reference: string; translation: string }> {
  const ref = reference.trim();
  if (!/\d/.test(ref)) throw new Error("Write a reference such as John 3:16 or Psalm 23:1-3.");
  const r = await fetcher(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${encodeURIComponent(translation)}`);
  if (!r.ok) throw new Error(r.status === 404 ? `“${ref}” wasn't found. Check the book, chapter and verse.` : "The Bible text couldn't be fetched. Try again.");
  const v = (await r.json()) as { text?: string; reference?: string; translation_id?: string };
  const text = String(v.text ?? "").replace(/\s+/g, " ").trim();
  if (!text) throw new Error(`“${ref}” has no text in this translation.`);
  return { text, reference: v.reference || ref, translation: (TRANSLATIONS.find((t) => t.id === (v.translation_id || translation))?.label) ?? translation.toUpperCase() };
}

/** The verse as the book sets a quotation: on its own, with the reference and translation after it. */
export const verseBlock = (v: { text: string; reference: string; translation: string }) => `> “${v.text}” (${v.reference}, ${v.translation})`;
