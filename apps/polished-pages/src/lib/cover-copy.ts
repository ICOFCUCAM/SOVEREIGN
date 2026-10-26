// Cover copy written from the book itself: front tagline, back-cover blurb, a
// short author bio (only from what the book says, otherwise [placeholders]),
// a shelving category, the template that suits the book, and art direction for
// text-free artwork. Never endorsements: those must be real quotes.
import { authHeader } from "@/lib/session";
import { TEMPLATES, type TemplateId } from "@/lib/cover-design";

export interface CoverCopy {
  tagline: string;
  backHeadline: string;
  blurb: string;
  bio: string;
  category: string;
  template: TemplateId | null;
  frontArt: string;
  backArt: string;
}
export interface CoverCopyInput { title: string; subtitle?: string; author?: string; text: string }
/** Something that can write cover copy, and says which engine does it. */
export interface CoverCopyWriter { label: string; write(i: CoverCopyInput): Promise<CoverCopy> }

export const COVER_COPY_SHAPE = `{"tagline": "", "backHeadline": "", "blurb": "", "bio": "", "category": "", "template": "", "frontArt": "", "backArt": ""}`;
export const COVER_COPY_RULES = `- tagline: one line for the front cover, under 12 words.
- backHeadline: a short hook line that opens the back cover (under 14 words).
- blurb: back-cover copy of 120–180 words that sells the book honestly: the hook, what the reader will gain or feel, why this book. Short paragraphs separated by a blank line. For fiction, don't give away the ending.
- bio: a 40–70 word author bio in the third person, using only facts the book states about the author. Use [placeholders] for anything else (e.g. [where the author lives]).
- category: a shelving line in BISAC style, e.g. "Religion / Christian Living / Spiritual Growth".
- template: the cover style that suits the book, one of ${TEMPLATES.map((t) => t.id).join(", ")}.
- frontArt: art direction for a front-cover illustration that contains NO text, letters or logos: subject, composition, mood, palette, medium, and where to leave calm space for the title.
- backArt: art direction for a quieter, matching back-cover background with large calm areas for text, also with no text.
Write everything except the art direction in the language the book is written in.
Never invent endorsements, reviews, awards, sales figures or facts about the author.`;

export function coverCopyPrompt(i: CoverCopyInput) {
  return `Write the cover copy for this book.
Title: ${i.title || "Untitled"}${i.subtitle ? `\nSubtitle: ${i.subtitle}` : ""}${i.author ? `\nAuthor: ${i.author}` : ""}

Reply with valid JSON only (no code fences, no commentary), with exactly this shape:
${COVER_COPY_SHAPE}

${COVER_COPY_RULES}

The book:

${bookExcerpt(i.text)}`;
}

/** The whole book when it fits; otherwise its opening, its chapter headings and its close. */
export function bookExcerpt(text: string, max = 120_000): string {
  if (text.length <= max) return text;
  const heads = [...text.matchAll(/^#{1,3}\s+.+$/gm)].map((m) => m[0]).join("\n");
  const head = text.slice(0, Math.floor(max * 0.6));
  const tail = text.slice(-Math.floor(max * 0.2));
  return `${head}\n\n[…]\n\nChapter headings:\n${heads.slice(0, max * 0.15)}\n\n[…]\n\n${tail}`;
}

export function parseCoverCopy(raw: string): CoverCopy {
  const s = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const start = s.indexOf("{"), end = s.lastIndexOf("}");
  let o: Record<string, unknown>;
  try { o = JSON.parse(s.slice(start, end + 1)); } catch { throw new Error("The cover copy wasn't in the expected form. Try again."); }
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");
  const tpl = str("template").toLowerCase();
  const copy: CoverCopy = {
    tagline: str("tagline"), backHeadline: str("backHeadline"), blurb: str("blurb"), bio: str("bio"), category: str("category"),
    template: (TEMPLATES.some((t) => t.id === tpl) ? tpl : null) as TemplateId | null,
    frontArt: str("frontArt"), backArt: str("backArt"),
  };
  if (!copy.blurb) throw new Error("No blurb came back. Try again.");
  return copy;
}

/** The site's own text service, for Book Creator users (metered on their plan). */
export const siteCoverCopyWriter: CoverCopyWriter = {
  label: "Written by AI",
  async write(i) {
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: await authHeader() },
      body: JSON.stringify({ title: i.title, subtitle: i.subtitle, author: i.author, text: bookExcerpt(i.text, 60_000) }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as { error?: string }).error || "Couldn't write the cover copy."); }
    return parseCoverCopy(JSON.stringify((await r.json()).copy ?? {}));
  },
};
