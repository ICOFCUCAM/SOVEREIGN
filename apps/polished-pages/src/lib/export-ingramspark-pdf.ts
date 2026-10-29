// IngramSpark-grade print interior. Beyond the standard print PDF it follows
// IngramSpark's bound-book rules: mirrored margins with a gutter that grows
// with page count (measured in a first pass), title and copyright pages,
// contents with real folios, running heads (book title verso, chapter recto)
// left off front matter and chapter openings, chapters opening on a recto, and
// outside folios. Right-to-left books are laid out for right-hand binding. Set
// by the Polished Pages typesetter with embedded, subset fonts in the owner's
// chosen typefaces, in any writing system. See src/lib/typeset/.
import type { TrimSize } from "@/lib/print-sizes";
import type { BookFaceId } from "@/lib/typeset/font-files";
import type { BookFactsOpts } from "@/lib/copyright-page";
import { BRAND } from "@/lib/tools";

export interface IngramOpts extends BookFactsOpts { title: string; author?: string; trim: TrimSize; year?: number; body?: BookFaceId; heading?: BookFaceId; size?: number; language?: string | null }

export async function markdownToIngramSparkPdf(markdown: string, opts: IngramOpts, filename: string): Promise<void> {
  const [{ typesetBook, downloadPdf }, { getInteriorType }] = await Promise.all([import("@/lib/typeset/book"), import("@/lib/typeset/prefs")]);
  const pref = getInteriorType();
  const { bytes } = await typesetBook(markdown, { ...opts, layout: "ingram", producedWith: BRAND, style: pref.style, body: opts.body ?? pref.body, heading: opts.heading ?? pref.heading, size: opts.size ?? pref.size, leading: pref.leading, margins: pref.margins, arabicFrom: pref.arabicFrom, tocDepth: pref.tocDepth });
  downloadPdf(bytes, filename);
}
