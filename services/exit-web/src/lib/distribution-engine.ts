import React from "react";
import type { SocialChannel, SocialPost } from "./social-publish";

// ── EXITOS DISTRIBUTION ENGINE ──────────────────────────────────────
// ExitOS's own social distribution engine — not a third-party aggregator. The
// browser sends composed posts to our Supabase edge function
// (exit-social-dispatch), which holds the platform tokens as secrets and posts
// to each channel's real API, returning a per-channel result. Honest by
// construction: connection status is read from the engine; posting reports the
// real outcome per channel; nothing is ever faked.

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

export const ENGINE_ENDPOINT = `${SUPABASE_URL}/functions/v1/exit-social-dispatch`;
const HEADERS = { "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" };

export interface DispatchResult { channel: SocialChannel; status: "done" | "failed"; url?: string; remote_id?: string; error?: string }

/** Which channels the engine has credentials for (real status, never assumed). */
export async function fetchConnectedChannels(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(ENGINE_ENDPOINT, { method: "GET", headers: HEADERS });
    if (!res.ok) return {};
    const j = await res.json().catch(() => ({}));
    return (j?.connected ?? {}) as Record<string, boolean>;
  } catch { return {}; }
}

/** Publish a post to the engine; returns the real per-channel outcome. */
export async function dispatch(post: SocialPost, channels: SocialChannel[]): Promise<DispatchResult[]> {
  try {
    const res = await fetch(ENGINE_ENDPOINT, {
      method: "POST", headers: HEADERS,
      body: JSON.stringify({ title: post.title, body: post.body, url: post.url, channels, hashtags: post.hashtags }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (j?.error as string) ?? `Engine returned ${res.status}`;
      return channels.map((c) => ({ channel: c, status: "failed" as const, error }));
    }
    const results = (j?.results ?? []) as DispatchResult[];
    recordPublish(results, post);
    return results;
  } catch (e) {
    return channels.map((c) => ({ channel: c, status: "failed" as const, error: e instanceof Error ? e.message : "Engine unreachable" }));
  }
}

// ── Publish history (real audit of what was posted) ─────────────────
export interface PublishRecord { at: string; title: string; channel: SocialChannel; status: "done" | "failed"; url?: string; error?: string }
const HKEY = "exitos.social.history.v1";

export function loadPublishHistory(): PublishRecord[] {
  try { const r = localStorage.getItem(HKEY); if (r) return JSON.parse(r) as PublishRecord[]; } catch { /* ignore */ }
  return [];
}
function recordPublish(results: DispatchResult[], post: SocialPost): void {
  const rows: PublishRecord[] = results.map((r) => ({ at: new Date().toISOString(), title: post.title, channel: r.channel, status: r.status, url: r.url, error: r.error }));
  try { localStorage.setItem(HKEY, JSON.stringify([...rows, ...loadPublishHistory()].slice(0, 100))); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("exitos:social-history"));
}

/** React hook: the engine's live connection status per channel. */
export function useEngineStatus(): { connected: Record<string, boolean>; anyConnected: boolean; loading: boolean } {
  const [connected, setConnected] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    fetchConnectedChannels().then((c) => { if (alive) { setConnected(c); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  return { connected, anyConnected: Object.values(connected).some(Boolean), loading };
}

/** React hook: live publish history. */
export function usePublishHistory(): PublishRecord[] {
  const [hist, setHist] = React.useState<PublishRecord[]>(() => loadPublishHistory());
  React.useEffect(() => {
    const sync = (): void => setHist(loadPublishHistory());
    window.addEventListener("exitos:social-history", sync);
    return () => window.removeEventListener("exitos:social-history", sync);
  }, []);
  return hist;
}
