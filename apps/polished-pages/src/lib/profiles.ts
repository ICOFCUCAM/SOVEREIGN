import { supabase } from "@/integrations/supabase/client";

// Creator profiles: an editable display name + bio, plus a public author
// profile (bio + aggregate reach). Reached only through public.polished_*
// SECURITY DEFINER RPCs; the generated types don't know them, so we cast.
interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export interface MyProfile { display_name: string; bio: string | null; tagline: string | null; website: string | null }
export interface AuthorProfile { display_name: string; bio: string | null; tagline?: string | null; website?: string | null; verified?: boolean; works: number; views: number; downloads: number }

export async function getMyProfile(): Promise<MyProfile | null> {
  const { data, error } = await rpc().rpc("polished_get_my_profile");
  if (error) throw new Error(error.message || "Could not load your profile.");
  const row = Array.isArray(data) ? (data[0] as MyProfile | undefined) : (data as MyProfile | null);
  return row ?? null;
}

export async function upsertProfile(displayName: string, bio: string, tagline?: string, website?: string): Promise<void> {
  const { error } = await rpc().rpc("polished_upsert_profile", {
    p_display_name: displayName, p_bio: bio,
    p_tagline: tagline ?? null, p_website: website ?? null,
  });
  if (error) throw new Error(error.message || "Could not save your profile.");
}

export async function getAuthorProfile(name: string): Promise<AuthorProfile | null> {
  const { data, error } = await rpc().rpc("polished_get_author_profile", { p_name: name });
  if (error) throw new Error(error.message || "Could not load the author.");
  return (data as AuthorProfile | null) ?? null;
}

// Admin curation: mark a creator (by public display name) verified or not.
export async function adminVerifyCreator(displayName: string, verified: boolean): Promise<void> {
  const { error } = await rpc().rpc("polished_admin_verify_creator", { p_display_name: displayName, p_verified: verified });
  if (error) throw new Error(error.message || "Could not update verification.");
}
