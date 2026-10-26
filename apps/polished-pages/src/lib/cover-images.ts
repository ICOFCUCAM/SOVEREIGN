// Client for free cover images (search-cover-images edge function).
import { authHeader } from "@/lib/session";
import type { CoverImage, Source } from "../../supabase/functions/_shared/cover-images";
export type { CoverImage, Source };

async function call<T>(body: unknown): Promise<T> {
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-cover-images`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: await authHeader() }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || "Image search failed.");
  return j as T;
}
export const searchCoverImages = (q: string, page = 1, sources?: Source[]) =>
  call<{ sources: Source[]; results: CoverImage[]; errors?: string[] }>({ action: "search", q, page, sources });
export const fetchCoverImage = (img: Pick<CoverImage, "source" | "id">) => call<{ image: string }>({ action: "fetch", source: img.source, id: img.id }).then((r) => r.image);

export const SOURCE_LABEL: Record<Source, string> = { openverse: "Openverse", pexels: "Pexels", unsplash: "Unsplash", pixabay: "Pixabay" };
