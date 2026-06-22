import { authHeader } from "@/lib/session";
import { saveDocument } from "@/lib/documents";
import { uploadAudioDataUrl } from "@/lib/media-upload";

export interface AudiobookChapter { title: string; url: string }
export interface AudiobookData { voice: string; bookTitle: string; chapters: AudiobookChapter[] }

// Audiobook narration client. The generate-narration edge function holds the
// OpenAI key, enforces the Enterprise gate, and returns one MP3 per chapter as
// a data URL. Audiobooks are an Enterprise capability.
export const NARRATION_VOICES = [
  { id: "alloy", label: "Alloy", hint: "Neutral, balanced" },
  { id: "fable", label: "Fable", hint: "Warm, storytelling" },
  { id: "nova", label: "Nova", hint: "Bright, friendly" },
  { id: "shimmer", label: "Shimmer", hint: "Soft, gentle" },
  { id: "echo", label: "Echo", hint: "Calm, measured" },
  { id: "onyx", label: "Onyx", hint: "Deep, resonant" },
] as const;

export async function narrate(text: string, voice: string): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-narration`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Narration failed");
  }
  return (await res.json()).audio as string;
}

// Persist a narrated audiobook: upload each chapter's MP3 to storage (so the
// document row stays small) and save it as an "audiobook" document linked to its
// book, so it appears under the project in the Library. Returns the new doc id.
export async function saveAudiobook(opts: {
  bookId: string | null;
  bookTitle: string;
  voice: string;
  tracks: { title: string; dataUrl: string }[];
}): Promise<string> {
  const folder = `audiobook-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
  const chapters: AudiobookChapter[] = [];
  for (let i = 0; i < opts.tracks.length; i++) {
    const url = await uploadAudioDataUrl(opts.tracks[i].dataUrl, folder, `ch${String(i).padStart(2, "0")}`);
    chapters.push({ title: opts.tracks[i].title, url });
  }
  const payload: AudiobookData = { voice: opts.voice, bookTitle: opts.bookTitle, chapters };
  return saveDocument({
    kind: "audiobook",
    title: `${opts.bookTitle} (Audiobook)`,
    payload,
    preview: `Audiobook · ${chapters.length} chapter${chapters.length === 1 ? "" : "s"} · ${opts.voice}`,
    parent: opts.bookId ?? undefined,
  });
}
