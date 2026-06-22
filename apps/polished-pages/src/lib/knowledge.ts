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

// ── Knowledge source documents (reference material the AI writes in line with) ──
export interface KnowledgeDoc { id: string; name: string; org_id: string | null; org_name: string | null; chars: number; created_at: string }

export async function listKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  const { data, error } = await rpc().rpc("polished_knowledge_docs_list");
  if (error) return [];
  return (Array.isArray(data) ? data : []) as KnowledgeDoc[];
}

export async function saveKnowledgeDoc(input: { name: string; content: string; orgId?: string | null }): Promise<string> {
  const { data, error } = await rpc().rpc("polished_knowledge_doc_save", { p_name: input.name, p_content: input.content, p_org: input.orgId ?? null });
  if (error) throw new Error(error.message || "Could not save the document.");
  return data as string;
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_knowledge_doc_delete", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the document.");
}

async function knowledgeDocsText(ids: string[]): Promise<{ id: string; name: string; content: string }[]> {
  const { data, error } = await rpc().rpc("polished_knowledge_docs_text", { p_ids: ids });
  if (error) return [];
  return (Array.isArray(data) ? data : []) as { id: string; name: string; content: string }[];
}

// Chunk + embed a document for vector search (best-effort, runs after upload).
export async function indexKnowledgeDoc(docId: string, content: string): Promise<void> {
  try { await supabase.functions.invoke("embed-knowledge-doc", { body: { docId, content } }); } catch { /* indexing is best-effort */ }
}

// Vector-search the selected documents for the passages most relevant to a query.
async function retrieveKnowledge(docIds: string[], query: string): Promise<string> {
  try {
    const { data } = await supabase.functions.invoke("knowledge-retrieve", { body: { docIds, query, k: 8 } });
    return ((data as { context?: string })?.context) ?? "";
  } catch { return ""; }
}

interface RuleSet { rules: string; terminology: string; forbidden: string }
const hasAny = (k: RuleSet) => !!(k.rules.trim() || k.terminology.trim() || k.forbidden.trim());

// Build the knowledge object to send to a generator: fold the selected reference
// documents into the rules as grounding material. With a query (e.g. a chapter
// brief) it uses vector search to pull only the most relevant passages; without
// one it falls back to the documents' full text (capped to a context budget).
export async function buildGenerationKnowledge(knowledge: RuleSet | null, docIds: string[], query?: string): Promise<RuleSet | null> {
  const k = knowledge ?? { rules: "", terminology: "", forbidden: "" };
  if (!docIds.length) return hasAny(k) ? k : null;
  const BUDGET = 60000;
  let refText = "";
  if (query && query.trim()) refText = await retrieveKnowledge(docIds, query.trim());
  if (!refText) {
    const docs = await knowledgeDocsText(docIds).catch(() => []);
    let acc = "";
    for (const d of docs) {
      if (acc.length >= BUDGET) break;
      const head = `--- ${d.name} ---\n`;
      acc += head + d.content.slice(0, Math.max(0, BUDGET - acc.length - head.length)) + "\n\n";
    }
    refText = acc;
  }
  if (!refText.trim()) return hasAny(k) ? k : null;
  const ref = "REFERENCE MATERIAL — draw on these source passages and stay fully consistent with them (facts, terminology, positions, prior books):\n\n" + refText.slice(0, BUDGET);
  return { rules: [k.rules, ref].filter((s) => s && s.trim()).join("\n\n"), terminology: k.terminology, forbidden: k.forbidden };
}
