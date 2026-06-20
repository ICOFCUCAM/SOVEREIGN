import { supabase } from "@/integrations/supabase/client";

const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Authorization header for edge-function calls. Polished Pages generation is
// metered per signed-in user, so we send the user's access token — the
// server-side gate rejects anonymous calls. Falls back to the anon key only so
// the ungated export endpoints keep working if a session is briefly absent.
export async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return `Bearer ${data.session?.access_token ?? ANON}`;
}

// Start a Stripe Checkout to upgrade to Pro and redirect the browser to it.
export async function startUpgrade(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polished-create-checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ANON}` },
    body: "{}",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) throw new Error(j.error || "Could not start checkout.");
  window.location.href = j.url as string;
}

// Start a one-time Stripe Checkout for an image-credit pack and redirect to it.
export async function buyCredits(quantity = 1): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polished-create-checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ANON}` },
    body: JSON.stringify({ kind: "credits", quantity }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) throw new Error(j.error || "Could not start checkout.");
  window.location.href = j.url as string;
}

// Canonical Pro price (USD/month). The matching Stripe price must be set as
// STRIPE_PRICE_ID for checkout; this is the number shown across the UI.
export const PRO_PRICE_USD = 18;
// Image credits granted per purchased pack. Must match STRIPE_CREDITS_PER_PACK
// (and the credits the STRIPE_CREDITS_PRICE_ID price represents).
export const CREDITS_PER_PACK = 100;

export interface PlanStatus { plan: string; used: number; lim: number; imagesUsed: number; imagesLim: number; bonusImages: number }

// The signed-in user's plan and monthly usage (text + image credits).
export async function fetchPlanStatus(): Promise<PlanStatus | null> {
  // Cast: the generated Database types don't know about the polished_* RPCs.
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>;
  }).rpc("polished_my_status");
  if (error || !data) return null;
  const row = (Array.isArray(data) ? data[0] : data) as { plan: string; used: number; lim: number; images_used?: number; images_lim?: number; bonus_images?: number } | undefined;
  if (!row) return null;
  return { plan: row.plan, used: row.used, lim: row.lim, imagesUsed: row.images_used ?? 0, imagesLim: row.images_lim ?? 0, bonusImages: row.bonus_images ?? 0 };
}
