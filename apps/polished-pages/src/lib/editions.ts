import { supabase } from "@/integrations/supabase/client";

// Multi-language editions of a document. Reached through the public.polished_*
// SECURITY DEFINER RPCs (scoped to auth.uid()).
export interface Edition {
  id: string;
  title: string;
  edition_language: string | null;
  edition_culture: string | null;
  is_source: boolean;
  listed: boolean;
  shared: boolean;
  share_token: string | null;
  created_at: string;
}

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function listEditions(parentId: string): Promise<Edition[]> {
  const { data, error } = await rpc().rpc("polished_list_editions", { p_parent: parentId });
  if (error) throw new Error(error.message || "Could not load editions.");
  return (Array.isArray(data) ? data : []) as Edition[];
}

export async function saveEdition(input: { parent: string; language: string; kind: string; title: string; payload: unknown; preview?: string; culture?: string }): Promise<string> {
  const { data, error } = await rpc().rpc("polished_save_edition", {
    p_parent: input.parent, p_language: input.language, p_kind: input.kind,
    p_title: input.title, p_payload: input.payload, p_preview: input.preview ?? null, p_culture: input.culture ?? null,
  });
  if (error) throw new Error(error.message || "Could not save the edition.");
  return data as string;
}
