import { supabase } from "@/integrations/supabase/client";
import type { CvData } from "@/lib/cv-data";

// Document library client. Persistence lives in the `polished` schema and is
// reached only through the public.polished_* SECURITY DEFINER RPCs, which scope
// every row to auth.uid(). The generated Database types don't know these RPCs,
// so we cast (same pattern as session.ts).
export type DocKind = "cv" | "cover-letter" | "book" | "tailored" | "cover" | "storybook" | "illustration";

export interface DocSummary {
  id: string;
  kind: DocKind;
  title: string;
  template: string | null;
  preview: string | null;
  favorite?: boolean;
  shared?: boolean;
  listed?: boolean;
  category?: string | null;
  price_cents?: number;
  tags?: string[];
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

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  const { error } = await rpc().rpc("polished_toggle_favorite", { p_id: id, p_fav: favorite });
  if (error) throw new Error(error.message || "Could not update favorite.");
}

export interface DocVersion { id: string; preview: string | null; created_at: string }

// Update a saved document in place, snapshotting the previous content as a version.
export async function updateDocument(id: string, payload: unknown, preview?: string): Promise<void> {
  const { error } = await rpc().rpc("polished_update_document", { p_id: id, p_payload: payload, p_preview: preview ?? null });
  if (error) throw new Error(error.message || "Could not save changes.");
}

export async function listVersions(id: string): Promise<DocVersion[]> {
  const { data, error } = await rpc().rpc("polished_list_versions", { p_id: id });
  if (error) throw new Error(error.message || "Could not load history.");
  return (Array.isArray(data) ? data : []) as DocVersion[];
}

export async function getVersion(versionId: string): Promise<unknown> {
  const { data, error } = await rpc().rpc("polished_get_version", { p_version_id: versionId });
  if (error) throw new Error(error.message || "Could not load that version.");
  return data;
}

// Toggle public sharing. Returns the share token when turning on, null when off.
export async function setShared(id: string, shared: boolean): Promise<string | null> {
  const { data, error } = await rpc().rpc("polished_set_shared", { p_id: id, p_shared: shared });
  if (error) throw new Error(error.message || "Could not update sharing.");
  return (data as string) ?? null;
}

export const CATALOG_CATEGORIES = [
  "Children's storybooks", "Coloring books", "Educational readers", "Textbooks",
  "Workbooks", "Classroom packs", "Curriculum", "Teacher resources", "Other",
];

export const CATALOG_LICENSES = [
  "All rights reserved",
  "Free for personal use",
  "Free for classroom use",
  "Creative Commons (CC BY)",
  "Creative Commons (CC BY-NC)",
];

export interface CatalogItem { token: string; kind: DocKind; title: string; category: string | null; price_cents: number; preview: string | null; author_name: string | null; license: string | null; featured?: boolean; created_at: string }

export async function setTags(id: string, tags: string[]): Promise<void> {
  const { error } = await rpc().rpc("polished_set_tags", { p_id: id, p_tags: tags });
  if (error) throw new Error(error.message || "Could not update tags.");
}

export async function duplicateDocument(id: string): Promise<string> {
  const { data, error } = await rpc().rpc("polished_duplicate_document", { p_id: id });
  if (error) throw new Error(error.message || "Could not duplicate.");
  return data as string;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await rpc().rpc("polished_is_admin");
  if (error) return false;
  return Boolean(data);
}

export async function setFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await rpc().rpc("polished_set_featured", { p_id: id, p_featured: featured });
  if (error) throw new Error(error.message || "Could not update featured.");
}

// Admin curation of a catalog item by its share token.
export async function adminFeature(token: string, featured: boolean): Promise<void> {
  const { error } = await rpc().rpc("polished_admin_feature", { p_token: token, p_featured: featured });
  if (error) throw new Error(error.message || "Could not update featured.");
}

// Publish (or unpublish) a document to the public catalog. Returns the share token.
export async function publishDocument(id: string, opts: { listed: boolean; category?: string; priceCents?: number; author?: string; license?: string }): Promise<string | null> {
  const { data, error } = await rpc().rpc("polished_publish", {
    p_id: id, p_listed: opts.listed, p_category: opts.category ?? null, p_price_cents: opts.priceCents ?? 0, p_author: opts.author ?? null, p_license: opts.license ?? null,
  });
  if (error) throw new Error(error.message || "Could not publish.");
  return (data as string) ?? null;
}

export async function catalogList(category?: string, search?: string): Promise<CatalogItem[]> {
  const { data, error } = await rpc().rpc("polished_catalog", { p_category: category ?? null, p_search: search ?? null });
  if (error) throw new Error(error.message || "Could not load the catalog.");
  return (Array.isArray(data) ? data : []) as CatalogItem[];
}

export interface SharedDoc { kind: DocKind; title: string; template: string | null; payload: unknown; author_name?: string | null; license?: string | null }
// Public read of a shared document by token (no auth required).
export async function getShared(token: string): Promise<SharedDoc | null> {
  const { data, error } = await rpc().rpc("polished_get_shared", { p_token: token });
  if (error) throw new Error(error.message || "Could not load the shared document.");
  return (data as SharedDoc | null) ?? null;
}
