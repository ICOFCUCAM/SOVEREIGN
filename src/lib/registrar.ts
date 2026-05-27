import { supabase } from '@/lib/supabase';

// ── Registrar discovery client ────────────────────────────────────────
// Read-only domain discovery (availability + pricing + suggestions) backed by
// the domain-search edge function. No transactional registration is exposed.

export interface DomainResult {
  domain: string;
  available: boolean;
  premium: boolean;
  price: number | null;
  currency: string | null;
  status: string;
  source: 'cache' | 'live';
}
export interface SearchResponse {
  query: string;
  exact: DomainResult[];
  suggestions: DomainResult[];
}

export async function searchDomains(query: string, tlds?: string[]): Promise<SearchResponse> {
  const { data, error } = await supabase.functions.invoke('domain-search', { body: { action: 'search', query, tlds } });
  if (error) throw new Error(error.message || 'Search failed');
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as SearchResponse;
}

export async function checkDomains(domains: string[]): Promise<DomainResult[]> {
  const { data, error } = await supabase.functions.invoke('domain-search', { body: { action: 'check', domains } });
  if (error) throw new Error(error.message || 'Check failed');
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return (data as { results: DomainResult[] }).results;
}

export function formatPrice(price: number | null, currency: string | null): string {
  if (price == null) return '—';
  const cur = currency || 'USD';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}
