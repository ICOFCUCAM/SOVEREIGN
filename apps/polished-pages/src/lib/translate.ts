import { authHeader } from "@/lib/session";

export async function translateLocalize(input: {
  content: string; targetLanguage: string; culture?: string; mode: "translate" | "localize";
}): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-localize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Translation failed.");
  }
  return (await res.json()).content as string;
}
