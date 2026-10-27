// Book files from Markdown: .md in the browser; Word (.docx) and EPUB from the
// export-book edge function. One helper for Finish's export panel and the
// rewritten-book viewer.
import { authHeader } from "@/lib/session";

export type BookFormat = "md" | "docx" | "epub";

/** A file name for the book; a working draft says so, so it is never mistaken for the approved book. */
export function bookFileName(title: string, format: BookFormat, opts: { draft?: boolean } = {}): string {
  const base = (title || "book").replace(/[^\p{L}\p{N} _-]+/gu, "").trim().replace(/\s+/g, "_") || "book";
  return `${base}${opts.draft ? "_draft" : ""}.${format}`;
}

export async function bookFile(content: string, title: string, format: BookFormat): Promise<Blob> {
  if (format === "md") return new Blob([content], { type: "text/markdown;charset=utf-8" });
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-book`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify({ content, title, format }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || "Export failed");
  }
  return r.blob();
}

export function saveFile(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
