import { authHeader } from "@/lib/session";

// AI Publishing Advisor — a go-to-market plan for a finished manuscript.
export interface PublishingAdvice {
  audience?: string;
  readingLevel?: string;
  categories?: string[];
  markets?: string[];
  estimatedPages?: number;
  price?: string;
  priceRationale?: string;
  distribution?: string[];
  translations?: string[];
  positioning?: string;
  wordCount?: number;
}

export async function getPublishingAdvice(input: { title: string; content: string }): Promise<PublishingAdvice> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publishing-advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Could not produce a publishing plan.");
  }
  return (await res.json()) as PublishingAdvice;
}
