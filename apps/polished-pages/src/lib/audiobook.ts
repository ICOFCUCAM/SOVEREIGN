import { authHeader } from "@/lib/session";

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
