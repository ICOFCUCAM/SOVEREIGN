import { supabase } from "@/integrations/supabase/client";
import { saveDocument } from "@/lib/documents";
import type { PictureBookData } from "@/components/children/PictureBookView";

export type PictureVariant = "storybook" | "coloring";
export interface PictureBookSaveOpts { variant: PictureVariant; pageAspect: string; showText: boolean }

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const isDataUrl = (s?: string | null): s is string => !!s && s.startsWith("data:");

async function uploadImage(uid: string, folder: string, name: string, dataUrl: string): Promise<string> {
  const path = `${uid}/${folder}/${name}.png`;
  const { error } = await supabase.storage.from("polished-media").upload(path, dataUrlToBlob(dataUrl), {
    contentType: "image/png", upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("polished-media").getPublicUrl(path).data.publicUrl;
}

// Upload any inline (data-URL) images in a picture book to the per-user media
// bucket and return a copy whose images are stable URLs, so document rows stay
// small. Images that are already URLs are left as-is. Shared by save and by
// localized-edition creation (which reuses the parent's uploaded URLs).
export async function uploadBookImages(book: PictureBookData, variant: PictureVariant): Promise<PictureBookData> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to save.");
  const folder = `${variant}-${(crypto.randomUUID?.() ?? Date.now().toString(36))}`;

  const coverImage = isDataUrl(book.coverImage) ? await uploadImage(uid, folder, "cover", book.coverImage) : (book.coverImage ?? null);
  const pages: PictureBookData["pages"] = [];
  for (let i = 0; i < book.pages.length; i++) {
    const p = book.pages[i];
    const image = isDataUrl(p.image) ? await uploadImage(uid, folder, `p${i}`, p.image) : (p.image ?? null);
    pages.push({ text: p.text, image });
  }
  return { title: book.title, dedication: book.dedication, coverImage, pages };
}

// Persist an illustrated picture book to the Library and return its document id.
export async function savePictureBook(book: PictureBookData, opts: PictureBookSaveOpts): Promise<string> {
  const stored = await uploadBookImages(book, opts.variant);
  return saveDocument({
    kind: "storybook",
    title: book.title || (opts.variant === "coloring" ? "Coloring book" : "Storybook"),
    payload: { variant: opts.variant, pageAspect: opts.pageAspect, showText: opts.showText, book: stored },
    preview: opts.variant === "coloring" ? "Coloring book" : "Illustrated storybook",
  });
}
