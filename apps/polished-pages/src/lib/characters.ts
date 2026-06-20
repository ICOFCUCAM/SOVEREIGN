import { supabase } from "@/integrations/supabase/client";

// Character Bible for the Children's Studio: persistent character profiles
// (look, personality, relationships, age) reused across books so a recurring
// cast stays consistent. Reached through the public.polished_* SECURITY DEFINER
// RPCs (scoped to auth.uid()); the generated types don't know them, so we cast.
export interface StoryCharacter {
  id: string;
  name: string;
  appearance: string;
  personality?: string | null;
  relationships?: string | null;
  age?: string | null;
  created_at: string;
}

export interface CharacterInput {
  name: string;
  appearance: string;
  personality?: string;
  relationships?: string;
  age?: string;
}

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function listCharacters(): Promise<StoryCharacter[]> {
  const { data, error } = await rpc().rpc("polished_list_characters");
  if (error) throw new Error(error.message || "Could not load your characters.");
  return (Array.isArray(data) ? data : []) as StoryCharacter[];
}

export async function saveCharacter(c: CharacterInput): Promise<string> {
  const { data, error } = await rpc().rpc("polished_save_character", {
    p_name: c.name, p_appearance: c.appearance,
    p_personality: c.personality ?? null, p_relationships: c.relationships ?? null, p_age: c.age ?? null,
  });
  if (error) throw new Error(error.message || "Could not save the character.");
  return data as string;
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_character", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the character.");
}

// One-line brief used when inserting a character into a story prompt, so the
// engine keeps the look, personality and age consistent.
export function characterBrief(c: StoryCharacter): string {
  const parts = [`${c.name} — ${c.appearance}`];
  if (c.age) parts.push(`age ${c.age}`);
  if (c.personality) parts.push(c.personality);
  if (c.relationships) parts.push(c.relationships);
  return parts.join("; ");
}
