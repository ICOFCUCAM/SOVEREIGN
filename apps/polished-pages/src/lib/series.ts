import { supabase } from "@/integrations/supabase/client";

// Series: a shared universe for a set of books. Reached through the
// public.polished_* SECURITY DEFINER RPCs (scoped to auth.uid()).
export interface SeriesInput {
  title: string;
  premise?: string;
  setting?: string;
  objective?: string;
  language?: string;
  culture?: string;
}

export interface SeriesSummary {
  id: string;
  title: string;
  premise: string | null;
  setting: string | null;
  educational_objective: string | null;
  language: string | null;
  culture: string | null;
  book_count: number;
  listed: boolean;
  share_token: string | null;
  created_at: string;
}

export interface PublicSeriesBook { token: string; title: string; preview: string | null; series_index: number | null }
export interface PublicSeries {
  title: string;
  premise: string | null;
  setting: string | null;
  objective: string | null;
  language: string | null;
  culture: string | null;
  author: string | null;
  books: PublicSeriesBook[];
}

export interface SeriesBook { id: string; title: string; kind: string; series_index: number | null; created_at: string }
export interface SeriesDetail {
  id: string;
  title: string;
  premise: string | null;
  setting: string | null;
  educational_objective: string | null;
  language: string | null;
  culture: string | null;
  books: SeriesBook[];
}

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function createSeries(s: SeriesInput): Promise<string> {
  const { data, error } = await rpc().rpc("polished_create_series", {
    p_title: s.title, p_premise: s.premise ?? null, p_setting: s.setting ?? null,
    p_objective: s.objective ?? null, p_language: s.language ?? null, p_culture: s.culture ?? null,
  });
  if (error) throw new Error(error.message || "Could not create the series.");
  return data as string;
}

export async function listSeries(): Promise<SeriesSummary[]> {
  const { data, error } = await rpc().rpc("polished_list_series");
  if (error) throw new Error(error.message || "Could not load your series.");
  return (Array.isArray(data) ? data : []) as SeriesSummary[];
}

export async function getSeries(id: string): Promise<SeriesDetail | null> {
  const { data, error } = await rpc().rpc("polished_get_series", { p_id: id });
  if (error) throw new Error(error.message || "Could not load the series.");
  return (data as SeriesDetail | null) ?? null;
}

export async function deleteSeries(id: string): Promise<void> {
  const { error } = await rpc().rpc("polished_delete_series", { p_id: id });
  if (error) throw new Error(error.message || "Could not delete the series.");
}

export async function setDocumentSeries(documentId: string, seriesId: string | null, index?: number | null): Promise<void> {
  const { error } = await rpc().rpc("polished_set_document_series", { p_document_id: documentId, p_series_id: seriesId, p_index: index ?? null });
  if (error) throw new Error(error.message || "Could not update the series.");
}

// Publish (or unpublish) a series as a public page. Returns the share token.
export async function setSeriesPublic(id: string, isPublic: boolean): Promise<string | null> {
  const { data, error } = await rpc().rpc("polished_set_series_public", { p_id: id, p_public: isPublic });
  if (error) throw new Error(error.message || "Could not update sharing.");
  return (data as string) ?? null;
}

// Public read of a published series by token (no auth required).
export async function getPublicSeries(token: string): Promise<PublicSeries | null> {
  const { data, error } = await rpc().rpc("polished_get_public_series", { p_token: token });
  if (error) throw new Error(error.message || "Could not load the series.");
  return (data as PublicSeries | null) ?? null;
}
