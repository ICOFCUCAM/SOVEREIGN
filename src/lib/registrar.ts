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

export interface AiSuggestion extends DomainResult { why?: string }

// AI-generated sovereign names, enriched with live availability + retail price.
// `context` (optional) biases naming toward a deployment archetype, e.g. the
// chosen deployment type from the orchestrator.
export async function aiSuggestDomains(prompt: string, context?: string): Promise<AiSuggestion[]> {
  const { suggestions } = await invokeFunction<{ suggestions: Array<{ label: string; tld: string; why?: string }> }>('domain-suggest', { prompt, context });
  if (!suggestions.length) return [];
  const why = new Map(suggestions.map((s) => [`${s.label}.${s.tld}`.toLowerCase(), s.why]));
  const results = await checkDomains(suggestions.map((s) => `${s.label}.${s.tld}`));
  return results
    .map((r) => ({ ...r, why: why.get(r.domain.toLowerCase()) }))
    .sort((a, b) => Number(b.available) - Number(a.available));
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
