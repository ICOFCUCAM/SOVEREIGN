import { supabase } from "@/integrations/supabase/client";

// Reusable story characters for the Children's Studio. Reached through the
// public.polished_* SECURITY DEFINER RPCs (scoped to auth.uid()); the generated
// types don't know them, so we cast (same pattern as documents.ts).
export interface StoryCharacter { id: string; name: string; appearance: string; created_at: string }

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function listCharacters(): Promise<StoryCharacter[]> {
  const { data, error } = await rpc().rpc("polished_list_characters");
  if (error) throw new Error(error.message || "Could not load your characters.");
  return (Array.isArray(data) ? data : []) as StoryCharacter[];
}

export async function saveCharacter(name: string, appearance: string): Promise<string> {
  const { data, error } = await rpc().rpc("polished_save_character", { p_name: name, p_appearance: appearance });
  if (error) throw new Error(error.message || "Could not save the character.");
  return data as string;
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_character", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the character.");
}
