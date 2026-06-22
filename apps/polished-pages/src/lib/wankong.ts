import { supabase } from "@/integrations/supabase/client";
import { getDocument, type DocSummary, type DocKind } from "@/lib/documents";
import { markdownToEpubBlob, pictureBookToEpubBlob } from "@/lib/export-epub";
import type { PictureBookData } from "@/components/children/PictureBookView";

// Public Wankong store URL — used for the "create an account" prompt when a
// user tries to publish without one. Override per-environment if needed.
export const WANKONG_STORE_URL =
  (import.meta.env.VITE_WANKONG_STORE_URL as string | undefined) || "https://wankonglobal.com";

// The Wankong store sells books, so only book-shaped documents can go there.
export const WANKONG_PUBLISHABLE_KINDS: DocKind[] = ["book", "tailored", "storybook"];
export const isWankongPublishable = (kind: DocKind) => WANKONG_PUBLISHABLE_KINDS.includes(kind);

export interface WankongPublishOpts {
  priceCents: number;
  author: string;
  description?: string;
  genre?: string;
  language?: string;
  isbn?: string;
}

export interface WankongPublishResult {
  ok?: boolean;
  needs_account?: boolean;
  status?: string;
  productId?: string;
  url?: string | null;
  error?: string;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const chunk = 0x8000; // chunk so String.fromCharCode doesn't blow the arg limit
  for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  return btoa(bin);
}

async function fetchAsBase64(url: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const mime = r.headers.get("content-type") || "image/png";
    return { base64: await blobToBase64(await r.blob()), mime };
  } catch {
    return null; // cover is best-effort; the EPUB still embeds it
  }
}

// Export the document to EPUB and publish it to the Wankong store via the
// `polished-publish-to-wankong` edge function (which asserts the seller's email
// and forwards to Wankong with the bridge secret).
export async function publishToWankong(doc: DocSummary, opts: WankongPublishOpts): Promise<WankongPublishResult> {
  if (!isWankongPublishable(doc.kind)) {
    throw new Error("Only books and storybooks can be sold on the Wankong store.");
  }

  const row = await getDocument(doc.id);
  if (!row) throw new Error("Could not open the document.");
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const title = doc.title || String(payload.title ?? "Book");

  let epub: Blob;
  let coverSrc: string | null = null;

  if (doc.kind === "storybook") {
    const book = (payload.book ?? payload) as PictureBookData;
    if (!book?.pages?.length) throw new Error("This storybook has no pages to publish.");
    epub = await pictureBookToEpubBlob(book, { title, language: opts.language });
    coverSrc = book.coverImage ?? null;
  } else {
    const markdown = String(payload.markdown ?? "");
    if (!markdown.trim()) throw new Error("This document has no exportable text.");
    epub = await markdownToEpubBlob(markdown, { title, author: opts.author, language: opts.language });
  }

  const epubBase64 = await blobToBase64(epub);
  const cover = coverSrc ? await fetchAsBase64(coverSrc) : null;

  const { data, error } = await supabase.functions.invoke("polished-publish-to-wankong", {
    body: {
      docId: doc.id,
      title,
      author: opts.author || null,
      description: opts.description ?? doc.preview ?? "",
      priceCents: Math.max(0, Math.round(opts.priceCents || 0)),
      language: opts.language || "en",
      genre: opts.genre || null,
      isbn: opts.isbn || null,
      epubBase64,
      epubFilename: `${title}.epub`,
      coverBase64: cover?.base64 ?? null,
      coverMime: cover?.mime ?? null,
    },
  });

  if (error) {
    // supabase-js wraps a non-2xx as FunctionsHttpError; read the JSON body for
    // the real message (e.g. a plan-gate 402).
    let message = error.message || "Could not publish to Wankong.";
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      }
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return (data ?? {}) as WankongPublishResult;
}

export interface WankongListing {
  channel: string;
  external_id: string | null;
  external_url: string | null;
  status: string;
  updated_at: string;
}

// Publish a saved audiobook (its chapter audio URLs + metadata) to the Wankong
// store via the publish-audiobook-to-wankong edge function. Audiobooks are an
// Enterprise Plus capability; the function holds the bridge secret and matches
// the seller by their verified email.
export async function publishAudiobookToWankong(input: {
  docId: string;
  title: string;
  author?: string;
  description?: string;
  priceCents?: number;
  language?: string;
  voice?: string;
  chapters: { title: string; url: string }[];
}): Promise<WankongPublishResult> {
  if (input.chapters.length === 0) throw new Error("This audiobook has no chapters to publish.");
  const { data, error } = await supabase.functions.invoke("publish-audiobook-to-wankong", {
    body: {
      docId: input.docId,
      title: input.title,
      author: input.author ?? null,
      description: input.description ?? "",
      priceCents: Math.max(0, Math.round(input.priceCents || 0)),
      language: input.language || "en",
      voice: input.voice ?? null,
      chapters: input.chapters,
    },
  });
  if (error) {
    let message = error.message || "Could not publish to Wankong.";
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      }
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return (data ?? {}) as WankongPublishResult;
}

// The current Wankong listing for a document (for library status), or null.
export async function wankongListing(docId: string): Promise<WankongListing | null> {
  const rpc = supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  const { data, error } = await rpc.rpc("polished_external_listings", { p_doc_id: docId });
  if (error) return null;
  const rows = (Array.isArray(data) ? data : []) as WankongListing[];
  return rows.find((r) => r.channel === "wankong") ?? null;
}

// All of the caller's Wankong listings, keyed by document id — one query for the
// whole library, so cards can show store status without N round-trips.
export async function wankongListingsByDoc(): Promise<Record<string, WankongListing>> {
  const rpc = supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
  const { data, error } = await rpc.rpc("polished_external_listings_all");
  if (error) return {};
  const rows = (Array.isArray(data) ? data : []) as (WankongListing & { document_id: string })[];
  const map: Record<string, WankongListing> = {};
  for (const r of rows) if (r.channel === "wankong" && r.document_id) map[r.document_id] = r;
  return map;
}
