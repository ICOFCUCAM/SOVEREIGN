import { supabase } from "@/integrations/supabase/client";
import type { CvData } from "@/lib/cv-data";

// Document library client. Persistence lives in the `polished` schema and is
// reached only through the public.polished_* SECURITY DEFINER RPCs, which scope
// every row to auth.uid(). The generated Database types don't know these RPCs,
// so we cast (same pattern as session.ts).
export type DocKind = "cv" | "cover-letter" | "book" | "tailored" | "cover";

export interface DocSummary {
  id: string;
  kind: DocKind;
  title: string;
  template: string | null;
  preview: string | null;
  created_at: string;
}

export interface CvPayload { data: CvData }
export interface LetterPayload { markdown: string; fullName: string; email?: string; phone?: string }

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function saveDocument(input: {
  kind: DocKind;
  title: string;
  template?: string | null;
  payload: unknown;
  preview?: string;
}): Promise<string> {
  const { data, error } = await rpc().rpc("polished_save_document", {
    p_kind: input.kind,
    p_title: input.title,
    p_template: input.template ?? null,
    p_payload: input.payload,
    p_preview: input.preview ?? null,
  });
  if (error) throw new Error(error.message || "Could not save the document.");
  return data as string;
}

export async function listDocuments(): Promise<DocSummary[]> {
  const { data, error } = await rpc().rpc("polished_list_documents");
  if (error) throw new Error(error.message || "Could not load your library.");
  return (Array.isArray(data) ? data : []) as DocSummary[];
}

// Returns the full stored row (meta + payload) for one document the user owns.
export async function getDocument(id: string): Promise<(DocSummary & { payload: unknown }) | null> {
  const { data, error } = await rpc().rpc("polished_get_document", { p_id: id });
  if (error) throw new Error(error.message || "Could not open the document.");
  return (data as (DocSummary & { payload: unknown }) | null) ?? null;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_document", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the document.");
}
