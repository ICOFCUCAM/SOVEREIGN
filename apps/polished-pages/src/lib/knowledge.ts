import { supabase } from "@/integrations/supabase/client";

// Reusable, optionally org-shared Knowledge Bases (Author Memory templates).
// A publisher/school/ministry defines rules once and reuses them across books.
export interface KnowledgeBase {
  id: string;
  name: string;
  rules: string;
  terminology: string;
  forbidden: string;
  org_id: string | null;
  org_name: string | null;
  updated_at: string;
}

interface RpcClient { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> }
const rpc = () => supabase as unknown as RpcClient;

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const { data, error } = await rpc().rpc("polished_knowledge_list");
  if (error) return [];
  return (Array.isArray(data) ? data : []) as KnowledgeBase[];
}

export async function saveKnowledgeBase(input: { id?: string | null; name: string; rules: string; terminology: string; forbidden: string; orgId?: string | null }): Promise<string> {
  const { data, error } = await rpc().rpc("polished_knowledge_save", {
    p_id: input.id ?? null, p_name: input.name, p_rules: input.rules, p_terminology: input.terminology, p_forbidden: input.forbidden, p_org: input.orgId ?? null,
  });
  if (error) throw new Error(error.message || "Could not save the knowledge base.");
  return data as string;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_knowledge_delete", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the knowledge base.");
}
