// Print-ready text interior PDF (KDP and general print): book margins, a title
// page, contents with real page numbers, running heads, chapters on a new page
// and folios. Set by the Polished Pages typesetter with embedded, subset fonts
// in the owner's chosen typefaces, in any writing system (Arabic and Hebrew
// right to left, Indic scripts shaped, Chinese/Japanese/Korean broken by
// character). See src/lib/typeset/.
import type { TrimSize } from "@/lib/print-sizes";
import type { BookFaceId } from "@/lib/typeset/font-files";
import type { BookFactsOpts } from "@/lib/copyright-page";

export async function markdownToPrintPdf(
  markdown: string,
  opts: { title: string; author?: string; trim: TrimSize; body?: BookFaceId; heading?: BookFaceId; size?: number; language?: string | null } & BookFactsOpts,
  filename: string,
): Promise<void> {
  const [{ typesetBook, downloadPdf }, { getInteriorType }] = await Promise.all([import("@/lib/typeset/book"), import("@/lib/typeset/prefs")]);
  const pref = getInteriorType();
  const { bytes } = await typesetBook(markdown, { ...opts, layout: "standard", style: pref.style, body: opts.body ?? pref.body, heading: opts.heading ?? pref.heading, size: opts.size ?? pref.size, leading: pref.leading, margins: pref.margins, arabicFrom: pref.arabicFrom, tocDepth: pref.tocDepth });
  downloadPdf(bytes, filename);
}
