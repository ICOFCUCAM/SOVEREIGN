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

// Persist an illustrated picture book: upload any inline (data-URL) images to the
// per-user media bucket, then store the book with image URLs so the document row
// stays small. Restorable from the Library.
export async function savePictureBook(book: PictureBookData, opts: PictureBookSaveOpts): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to save.");
  const folder = `${opts.variant}-${(crypto.randomUUID?.() ?? Date.now().toString(36))}`;

  const coverImage = isDataUrl(book.coverImage) ? await uploadImage(uid, folder, "cover", book.coverImage) : (book.coverImage ?? null);
  const pages: PictureBookData["pages"] = [];
  for (let i = 0; i < book.pages.length; i++) {
    const p = book.pages[i];
    const image = isDataUrl(p.image) ? await uploadImage(uid, folder, `p${i}`, p.image) : (p.image ?? null);
    pages.push({ text: p.text, image });
  }

  const stored: PictureBookData = { title: book.title, dedication: book.dedication, coverImage, pages };
  await saveDocument({
    kind: "storybook",
    title: book.title || (opts.variant === "coloring" ? "Coloring book" : "Storybook"),
    payload: { variant: opts.variant, pageAspect: opts.pageAspect, showText: opts.showText, book: stored },
    preview: opts.variant === "coloring" ? "Coloring book" : "Illustrated storybook",
  });
}
