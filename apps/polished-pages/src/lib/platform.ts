import { supabase } from "@/integrations/supabase/client";

// Real, public platform stats (never fabricated). Surfaced only when meaningful.
export interface PlatformStats {
  resources: number;
  creators: number;
  downloads: number;
  views: number;
  categories: number;
  languages: number;
}

interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

export async function platformStats(): Promise<PlatformStats | null> {
  const { data, error } = await (supabase as unknown as RpcClient).rpc("polished_platform_stats");
  if (error || !data) return null;
  return data as PlatformStats;
}
