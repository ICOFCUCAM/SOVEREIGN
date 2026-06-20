import { supabase } from "@/integrations/supabase/client";

// Marketplace ratings & reviews. Public read; authenticated submit (one per
// user per item; not your own work). Reached through public.polished_* RPCs.
export interface Review {
  rating: number;
  body: string | null;
  reviewer: string;
  created_at: string;
  avg_rating: number | null;
  review_count: number;
}

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}
const rpc = () => supabase as unknown as RpcClient;

export async function listReviews(token: string): Promise<Review[]> {
  const { data, error } = await rpc().rpc("polished_list_reviews", { p_token: token });
  if (error) throw new Error(error.message || "Could not load reviews.");
  return (Array.isArray(data) ? data : []) as Review[];
}

export async function submitReview(token: string, rating: number, body: string): Promise<void> {
  const { error } = await rpc().rpc("polished_submit_review", { p_token: token, p_rating: rating, p_body: body });
  if (error) throw new Error(error.message || "Could not submit your review.");
}
