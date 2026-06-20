import { supabase } from "@/integrations/supabase/client";

// Reusable Assessment Bank for teachers. Reached through public.polished_* RPCs.
export interface AssessmentSummary {
  id: string;
  subject: string | null;
  grade: string | null;
  topic: string | null;
  doc_type: string | null;
  title: string;
  created_at: string;
}
export interface AssessmentFull extends Omit<AssessmentSummary, "id" | "created_at"> { content: string }

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function saveAssessment(a: { subject?: string; grade?: string; topic?: string; docType?: string; title: string; content: string }): Promise<string> {
  const { data, error } = await rpc().rpc("polished_save_assessment", {
    p_subject: a.subject ?? null, p_grade: a.grade ?? null, p_topic: a.topic ?? null,
    p_doc_type: a.docType ?? null, p_title: a.title, p_content: a.content,
  });
  if (error) throw new Error(error.message || "Could not save to the bank.");
  return data as string;
}

export async function listAssessments(subject?: string, grade?: string): Promise<AssessmentSummary[]> {
  const { data, error } = await rpc().rpc("polished_list_assessments", { p_subject: subject ?? null, p_grade: grade ?? null });
  if (error) throw new Error(error.message || "Could not load the bank.");
  return (Array.isArray(data) ? data : []) as AssessmentSummary[];
}

export async function getAssessment(id: string): Promise<AssessmentFull | null> {
  const { data, error } = await rpc().rpc("polished_get_assessment", { p_id: id });
  if (error) throw new Error(error.message || "Could not load the item.");
  const row = Array.isArray(data) ? (data[0] as AssessmentFull | undefined) : (data as AssessmentFull | null);
  return row ?? null;
}

export async function deleteAssessment(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_assessment", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete.");
}
