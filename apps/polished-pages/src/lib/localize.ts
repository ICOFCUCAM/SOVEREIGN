import { translateLocalize } from "@/lib/translate";

export type LocalizeMode = "translate" | "localize";

// Split long markdown into translation-sized chunks at paragraph boundaries
// (the translate function caps each request), then translate and rejoin. Shared
// by the Edition Manager and the in-studio Localize panels so every entry point
// uses one engine.
export function chunkMarkdown(md: string, max = 12000): string[] {
  const paras = md.split(/\n\n+/);
  const out: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && (cur.length + p.length + 2) > max) { out.push(cur); cur = ""; }
    cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

// Translate/localize a markdown body chunk-by-chunk, reporting progress.
export async function localizeMarkdown(md: string, opts: {
  language: string; mode: LocalizeMode; culture?: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<string> {
  const parts = chunkMarkdown(md);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(await translateLocalize({ content: parts[i], targetLanguage: opts.language, culture: opts.culture, mode: opts.mode }));
    opts.onProgress?.(i + 1, parts.length);
  }
  return out.join("\n\n");
}

// Translate a set of short, discrete strings (e.g. a storybook's title +
// per-page texts), preserving order. One request per string; progress is the
// fraction of strings done.
export async function localizeStrings(texts: string[], opts: {
  language: string; mode: LocalizeMode; culture?: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    out.push(t.trim() ? await translateLocalize({ content: t, targetLanguage: opts.language, culture: opts.culture, mode: opts.mode }) : t);
    opts.onProgress?.(i + 1, texts.length);
  }
  return out;
}

// The edition payload + display title for a localized markdown document
// (book / tailored / educational). Keeps title-stamping consistent everywhere.
export function markdownEdition(sourceTitle: string, body: string, language: string, mode: LocalizeMode, culture?: string): { title: string; payload: unknown; preview: string } {
  const cultureLabel = mode === "localize" && culture?.trim() ? ` · ${culture.trim()}` : "";
  const title = `${sourceTitle} (${language}${cultureLabel})`;
  return { title, payload: { markdown: body, title }, preview: body.slice(0, 160) };
}
