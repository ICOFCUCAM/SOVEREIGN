import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem } from "@/lib/documents";

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  public: boolean;
  share_token: string | null;
  item_count: number;
  created_at: string;
}

export interface PublicCollection { title: string; description: string | null; items: CatalogItem[] }

export async function createCollection(title: string, description?: string): Promise<string> {
  const { data, error } = await rpc().rpc("polished_create_collection", { p_title: title, p_description: description ?? null });
  if (error) throw new Error(error.message || "Could not create collection.");
  return data as string;
}

export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await rpc().rpc("polished_list_collections");
  if (error) throw new Error(error.message || "Could not load collections.");
  return (Array.isArray(data) ? data : []) as Collection[];
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_collection", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete collection.");
}

export async function setCollectionPublic(id: string, isPublic: boolean): Promise<string | null> {
  const { data, error } = await rpc().rpc("polished_set_collection_public", { p_id: id, p_public: isPublic });
  if (error) throw new Error(error.message || "Could not update collection.");
  return (data as string) ?? null;
}

export async function setCollectionItem(collectionId: string, documentId: string, add: boolean): Promise<void> {
  const { error } = await rpc().rpc("polished_collection_set_item", { p_collection_id: collectionId, p_document_id: documentId, p_add: add });
  if (error) throw new Error(error.message || "Could not update collection.");
}

export async function collectionsForDocument(documentId: string): Promise<string[]> {
  const { data, error } = await rpc().rpc("polished_collections_for_document", { p_document_id: documentId });
  if (error) throw new Error(error.message || "Could not load membership.");
  return (Array.isArray(data) ? (data as { collection_id: string }[]).map((r) => r.collection_id) : []);
}

export async function getPublicCollection(token: string): Promise<PublicCollection | null> {
  const { data, error } = await rpc().rpc("polished_get_collection", { p_token: token });
  if (error) throw new Error(error.message || "Could not load the collection.");
  return (data as PublicCollection | null) ?? null;
}
