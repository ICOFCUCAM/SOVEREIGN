import { invokeFunction } from '@/lib/invoke';

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
  return invokeFunction<SearchResponse>('domain-search', { action: 'search', query, tlds });
}

export interface TldPrice { tld: string; price: number | null; currency: string | null }

export async function getTldPricing(): Promise<TldPrice[]> {
  const { pricing } = await invokeFunction<{ pricing: TldPrice[] }>('domain-search', { action: 'tld-pricing' });
  return pricing;
}

export async function checkDomains(domains: string[]): Promise<DomainResult[]> {
  const { results } = await invokeFunction<{ results: DomainResult[] }>('domain-search', { action: 'check', domains });
  return results;
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
