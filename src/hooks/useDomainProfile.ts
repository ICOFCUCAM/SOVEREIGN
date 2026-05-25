import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Domain, ValuationReport } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';

export interface DomainProfileState {
  domain: Domain | null;
  valuation: ValuationReport | null;
  loading: boolean;
  valuationLoading: boolean;
  notFound: boolean;
}

const INITIAL: DomainProfileState = {
  domain: null,
  valuation: null,
  loading: true,
  valuationLoading: true,
  notFound: false,
};

interface Options {
  /** Tenant isolation: only resolve domains with status='active'. */
  activeOnly?: boolean;
  /** Path recorded against the view event. */
  trackPath?: string;
}

/**
 * Resolves a domain profile by name and runs the AI valuation engine.
 * Side effects (view-count bump, analytics, valuation persistence) are
 * fire-and-forget so they never block render. Safe against unmount /
 * fast domain switches via a `cancelled` guard.
 */
export function useDomainProfile(domainName: string | undefined, opts: Options = {}): DomainProfileState {
  const [state, setState] = useState<DomainProfileState>(INITIAL);

  useEffect(() => {
    if (!domainName) {
      setState({ ...INITIAL, loading: false, valuationLoading: false, notFound: true });
      return;
    }

    let cancelled = false;
    const normalized = domainName.toLowerCase().trim();
    setState(INITIAL);

    (async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain_name', normalized)
        .maybeSingle();

      if (cancelled) return;

      const dom = data as Domain | null;
      const blocked = !dom || error || (opts.activeOnly && dom.status !== 'active');
      if (blocked) {
        setState({ domain: null, valuation: null, loading: false, valuationLoading: false, notFound: true });
        return;
      }

      setState((s) => ({ ...s, domain: dom, loading: false }));

      // Fire-and-forget: view count + telemetry.
      supabase
        .from('domains')
        .update({ view_count: (dom.view_count || 0) + 1 })
        .eq('id', dom.id)
        .then(() => {});
      trackEvent({
        domainId: dom.id,
        eventType: 'view',
        path: opts.trackPath ?? `/d/${normalized}`,
      });

      // AI valuation (graceful: UI still works if this fails).
      try {
        const { data: vd } = await supabase.functions.invoke('ai-valuation', {
          body: { domain: normalized },
        });
        if (cancelled) return;
        if (vd) {
          const v = vd as ValuationReport;
          setState((s) => ({ ...s, valuation: v, valuationLoading: false }));
          supabase
            .from('valuation_reports')
            .insert({
              domain_id: dom.id,
              overall_score: v.overall_score,
              brand_strength: v.brand_strength,
              memorability: v.memorability,
              seo_potential: v.seo_potential,
              ai_relevance: v.ai_relevance,
              market_alignment: v.market_alignment,
              startup_viability: v.startup_viability,
              sovereign_potential: v.sovereign_potential,
              estimated_value_low: v.estimated_value_low,
              estimated_value_high: v.estimated_value_high,
              narrative: v.narrative,
              slogan: v.slogan,
              industry_category: v.industry_category,
              confidence_score: v.confidence_score,
              startup_concepts: v.startup_concepts,
              model_used: v.model_used,
            })
            .then(() => {});
        } else {
          setState((s) => ({ ...s, valuationLoading: false }));
        }
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, valuationLoading: false }));
        if (import.meta.env.DEV) console.warn('[valuation] failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domainName, opts.activeOnly, opts.trackPath]);

  return state;
}
