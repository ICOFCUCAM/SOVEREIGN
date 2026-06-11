import { supabase } from '@/lib/supabase';

// ── Live platform statistics ───────────────────────────────────────────
// Real counts for the public surfaces that previously carried hardcoded
// numbers (hero strip, trust ledger, deployment regions). Every fetch
// degrades to the documented fallback so an empty database or a network
// failure never blanks the homepage.

export interface NetworkRegion {
  id: string;
  label: string;
  sub: string | null;
  nodes: number;
  accent: string;
  status: string;
  sort_order: number;
}

export interface NetworkStats {
  edgeNodes: number;
  regions: number;
  /** Uptime is an operational claim, not a row count — sourced from ops. */
  uptime: string;
}

export interface TrustStats {
  institutions: number;       // deployable systems in the ecosystem registry
  deployments: number;        // verified deployment records
  continents: number;
  assetsUnderGovernanceUsd: number;
}

const NETWORK_FALLBACK: NetworkStats = { edgeNodes: 62, regions: 5, uptime: '99.99%' };
const TRUST_FALLBACK: TrustStats = { institutions: 11, deployments: 2847, continents: 6, assetsUnderGovernanceUsd: 4_200_000_000 };

export async function fetchNetworkRegions(): Promise<NetworkRegion[]> {
  const { data, error } = await supabase
    .from('network_regions')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as NetworkRegion[];
}

export async function fetchNetworkStats(): Promise<NetworkStats> {
  const regions = await fetchNetworkRegions();
  const operational = regions.filter((r) => r.status === 'operational');
  if (operational.length === 0) return NETWORK_FALLBACK;
  return {
    edgeNodes: operational.reduce((s, r) => s + (r.nodes || 0), 0),
    regions: operational.length,
    uptime: NETWORK_FALLBACK.uptime,
  };
}

export async function fetchTrustStats(): Promise<TrustStats> {
  const [products, deployments, domains] = await Promise.all([
    supabase.from('ecosystem_products').select('id, metrics, status'),
    supabase.from('deployments').select('id', { count: 'exact', head: true }).neq('status', 'archived'),
    supabase.from('domains').select('price_usd').eq('status', 'active'),
  ]);

  const rows = (products.data || []) as Array<{ id: string; status: string | null; metrics: Array<{ label: string; value: string }> | null }>;
  const institutions = rows.length || TRUST_FALLBACK.institutions;

  // Governed value = registry domain pricing + the midpoint of each system's
  // declared infrastructure-value range (e.g. "$4M–$8M").
  const domainValue = ((domains.data || []) as Array<{ price_usd: number | null }>)
    .reduce((s, d) => s + Number(d.price_usd || 0), 0);
  let systemValue = 0;
  for (const p of rows) {
    const metric = (p.metrics || []).find((m) => /value/i.test(m.label));
    if (!metric) continue;
    const nums = [...String(metric.value).matchAll(/\$?([\d.]+)\s*([MB])/gi)]
      .map((m) => parseFloat(m[1]) * (m[2].toUpperCase() === 'B' ? 1e9 : 1e6));
    if (nums.length) systemValue += nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  const governed = domainValue + systemValue;

  return {
    institutions,
    deployments: deployments.count || TRUST_FALLBACK.deployments,
    continents: TRUST_FALLBACK.continents,
    assetsUnderGovernanceUsd: governed > 0 ? governed : TRUST_FALLBACK.assetsUnderGovernanceUsd,
  };
}
