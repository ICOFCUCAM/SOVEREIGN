import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import type { Domain, AnalyticsEvent } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import DomainCard from '@/components/DomainCard';
import FeaturedAcquisition from '@/components/marketplace/FeaturedAcquisition';
import InstitutionListings from '@/components/marketplace/InstitutionListings';
import { momentumMap, opportunityScore, acquisitionConfidence } from '@/lib/investor';
import { Search, SlidersHorizontal, Briefcase, Flame, DollarSign, Layers, Gauge } from 'lucide-react';

const CATEGORIES = ['all', 'fintech', 'ai', 'infra', 'govtech', 'saas', 'logistics'];
type Sort = 'opportunity' | 'trending' | 'score' | 'price_low' | 'price_high';

const MarketplacePage: React.FC = () => {
  useDocumentTitle('Marketplace', 'Acquire premium domains and deployable sovereign institutions — AI-scored, tier-priced, deployment-ready.');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<Sort>('opportunity');
  const [tier, setTier] = useState<'all' | 'premium'>('all');
  const [investorMode, setInvestorMode] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, ev] = await Promise.all([
        supabase.from('domains').select('*').order('valuation_score', { ascending: false }),
        supabase.from('analytics_events').select('domain_id,event_type,created_at').order('created_at', { ascending: false }).limit(2000),
      ]);
      setDomains((d.data || []) as Domain[]);
      setEvents((ev.data || []) as AnalyticsEvent[]);
      setLoading(false);
    })();
  }, []);

  const momentum = useMemo(() => momentumMap(events), [events]);

  const enriched = useMemo(() => domains.map((d) => ({
    domain: d,
    momentum: momentum[d.id] || 0,
    opportunity: opportunityScore(d, momentum[d.id] || 0),
    confidence: acquisitionConfidence(d),
  })), [domains, momentum]);

  const filtered = useMemo(() => {
    const list = enriched.filter(({ domain: d }) =>
      (cat === 'all' || d.category === cat) &&
      (tier === 'all' || d.is_premium) &&
      (q === '' || d.domain_name.toLowerCase().includes(q.toLowerCase()) || (d.tagline || '').toLowerCase().includes(q.toLowerCase())),
    );
    const by: Record<Sort, (a: typeof list[0], b: typeof list[0]) => number> = {
      opportunity: (a, b) => b.opportunity - a.opportunity,
      trending: (a, b) => b.momentum - a.momentum || b.opportunity - a.opportunity,
      score: (a, b) => b.domain.valuation_score - a.domain.valuation_score,
      price_low: (a, b) => a.domain.price_usd - b.domain.price_usd,
      price_high: (a, b) => b.domain.price_usd - a.domain.price_usd,
    };
    return [...list].sort(by[sort]);
  }, [enriched, q, cat, sort, tier]);

  const portfolio = useMemo(() => {
    const value = enriched.reduce((s, e) => s + Number(e.domain.price_usd || 0), 0);
    const avgOpp = enriched.length ? Math.round(enriched.reduce((s, e) => s + e.opportunity, 0) / enriched.length) : 0;
    const avgScore = enriched.length ? Math.round(enriched.reduce((s, e) => s + e.domain.valuation_score, 0) / enriched.length) : 0;
    const demand = enriched.reduce((s, e) => s + (e.domain.view_count || 0) + (e.domain.inquiry_count || 0), 0);
    const top = [...enriched].sort((a, b) => b.opportunity - a.opportunity)[0];
    return { value, avgOpp, avgScore, demand, top };
  }, [enriched]);

  const trending = useMemo(() => [...enriched].filter((e) => e.momentum > 0).sort((a, b) => b.momentum - a.momentum).slice(0, 3), [enriched]);

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="inline-block px-3 py-1 rounded-full glass mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">{investorMode ? 'Investor Intelligence' : 'Sovereign Marketplace'}</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
                {investorMode ? <>The sovereign opportunity <span className="text-gradient-cyan">index.</span></> : <>Sovereign capability <span className="text-gradient-cyan">acquisition.</span></>}
              </h1>
              <p className="text-white/50 max-w-2xl">
                {investorMode ? `${domains.length} curated domains · AI-scored · ranked by opportunity intelligence` : `Domains, deployable institutions and national runtimes — AI-scored and procurement-ready.`}
              </p>
            </div>
            <button onClick={() => { setInvestorMode(!investorMode); if (!investorMode) setSort('opportunity'); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                investorMode ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' : 'glass text-white/80 hover:glass-strong'
              }`}>
              <Briefcase className="w-4 h-4" /> Investor Mode {investorMode ? 'On' : 'Off'}
            </button>
          </div>

          {/* Investor portfolio thesis */}
          {investorMode && !loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {[
                { icon: DollarSign, label: 'Portfolio Value', val: portfolio.value >= 1e6 ? `$${(portfolio.value / 1e6).toFixed(1)}M` : `$${(portfolio.value / 1e3).toFixed(0)}k`, color: '#10B981' },
                { icon: Gauge, label: 'Avg Opportunity', val: `${portfolio.avgOpp}/100`, color: '#00D9FF' },
                { icon: Layers, label: 'Avg Intelligence', val: `${portfolio.avgScore}/100`, color: '#7C3AED' },
                { icon: Flame, label: 'Total Demand', val: portfolio.demand.toLocaleString(), color: '#F59E0B' },
                { icon: Briefcase, label: 'Top Opportunity', val: portfolio.top?.domain.domain_name || '—', color: '#00D9FF', small: true },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="glass-strong rounded-xl p-4">
                    <Icon className="w-4 h-4 mb-2" style={{ color: m.color }} />
                    <div className={`font-bold text-white tabular-nums ${m.small ? 'text-sm truncate' : 'text-2xl'}`}>{m.val}</div>
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-1">{m.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Featured cinematic acquisition — top opportunity as a deployable institution */}
          {!loading && !investorMode && q === '' && cat === 'all' && portfolio.top && (
            <FeaturedAcquisition domain={portfolio.top.domain} opportunity={portfolio.top.opportunity} confidence={portfolio.top.confidence} />
          )}

          {/* Trending strip */}
          {!loading && trending.length > 0 && (
            <div className="glass rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3"><Flame className="w-4 h-4 text-amber-400" /><span className="text-sm font-semibold text-white">Trending now</span><span className="text-[10px] text-white/40 font-mono">7-day momentum</span></div>
              <div className="grid sm:grid-cols-3 gap-3">
                {trending.map((e, i) => (
                  <Link key={e.domain.id} to={`/d/${encodeURIComponent(e.domain.domain_name)}`} className="flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 transition px-3 py-2.5">
                    <span className="text-lg font-mono font-bold text-amber-400">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{e.domain.domain_name}</div>
                      <div className="text-[10px] text-white/40 font-mono">{e.momentum} events · opp {e.opportunity}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="glass-strong rounded-2xl p-4 mb-8 sticky top-20 z-20">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search domains, tags, narratives..."
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCat(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition whitespace-nowrap ${
                      cat === c ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}>{c}</button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setTier(tier === 'all' ? 'premium' : 'all')}
                  className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${
                    tier === 'premium' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}>
                  <SlidersHorizontal className="w-3 h-3" /> Premium
                </button>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                  className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-white/5 text-white/80 border border-white/10 focus:border-cyan-400/50 focus:outline-none">
                  <option value="opportunity">Sort: Opportunity</option>
                  <option value="trending">Sort: Trending</option>
                  <option value="score">Sort: Score</option>
                  <option value="price_high">Sort: Price ↓</option>
                  <option value="price_low">Sort: Price ↑</option>
                </select>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/40 font-mono">{filtered.length} of {domains.length} assets · filtered</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE INVENTORY</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="glass rounded-2xl h-64 animate-pulse" />))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <div className="text-white font-semibold">No assets match those filters</div>
              <div className="text-white/40 text-sm mt-1">Adjust filters or run an AI valuation on a custom domain.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((e, i) => (
                <DomainCard key={e.domain.id} domain={e.domain}
                  {...(investorMode ? { rank: i + 1, opportunity: e.opportunity, confidence: e.confidence, momentum: e.momentum } : {})} />
              ))}
            </div>
          )}

          {/* Deployable institutions — sovereign systems with deployment price ranges */}
          {!investorMode && <InstitutionListings />}
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default MarketplacePage;
