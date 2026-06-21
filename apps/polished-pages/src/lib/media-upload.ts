import { supabase } from "@/integrations/supabase/client";

// Upload a data-URL image to the per-user media bucket and return its public URL.
export async function uploadDataUrl(dataUrl: string, folder: string, name: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to save.");
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const path = `${uid}/${folder}/${name}.png`;
  const { error } = await supabase.storage.from("polished-media").upload(path, new Blob([arr], { type: mime }), {
    contentType: "image/png", upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("polished-media").getPublicUrl(path).data.publicUrl;
}

// Upload a data-URL audio clip (MP3) to the per-user media bucket; returns its
// public URL. Used to persist narrated audiobook chapters.
export async function uploadAudioDataUrl(dataUrl: string, folder: string, name: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in to save.");
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const path = `${uid}/${folder}/${name}.mp3`;
  const { error } = await supabase.storage.from("polished-media").upload(path, new Blob([arr], { type: "audio/mpeg" }), {
    contentType: "audio/mpeg", upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("polished-media").getPublicUrl(path).data.publicUrl;
}
