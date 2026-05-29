import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain, EcosystemProduct } from '@/lib/types';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);

// Featured sovereign infrastructure assets surfaced in the live ticker
const FEATURED_SLUGS = ['relocation-us', 'civicos-treasury', 'veritas-operations', 'civicos-national-shell', 'civicos-emergency'];

const deployValueOf = (p: EcosystemProduct): string | null => {
  const m = (p.metrics || []).find((x) => /value|valuation|infrastructure|deployment|price/i.test(x.label)) || p.metrics?.[0];
  return m?.value || null;
};

const InfraCard: React.FC<{ p: EcosystemProduct }> = ({ p }) => {
  const accent = p.accent || '#00D9FF';
  const val = deployValueOf(p);
  return (
    <Link
      to={`/systems/${p.slug}`}
      className="group relative shrink-0 w-[320px] sm:w-[340px] rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-5 py-5 overflow-hidden hover:border-white/25 ease-cinematic transition-all duration-500"
    >
      <span className="absolute inset-x-0 bottom-0 h-px opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-14 -right-14 w-32 h-32 rounded-full blur-[60px] opacity-[0.14] group-hover:opacity-30 transition-opacity" style={{ background: accent }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.22em]" style={{ color: accent }}>
            <span className="w-1 h-1 rounded-full animate-node" style={{ background: accent }} /> Infrastructure
          </span>
          <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/35">Acquisition</span>
        </div>
        <div className="font-display text-[17px] font-bold text-white tracking-tight leading-tight truncate">{p.name}</div>
        <p className="text-[12px] text-white/50 mt-1.5 leading-relaxed line-clamp-2 min-h-[2.4rem]">{p.tagline}</p>
        <div className="flex items-end justify-between mt-4 pt-3 border-t border-white/8">
          <div className="leading-none">
            <div className="text-[15px] font-semibold text-white tabular-nums tracking-tight">{val || '—'}</div>
            <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/35 mt-1.5">Deployment value</div>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/35 group-hover:text-white/70 transition-colors">acquire →</span>
        </div>
      </div>
    </Link>
  );
};

const DomainCard: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  return (
    <Link
      to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative shrink-0 w-[248px] rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 hover:border-white/25 hover:bg-white/[0.045] ease-cinematic transition-all duration-500 overflow-hidden"
    >
      <span className="absolute inset-x-0 bottom-0 h-px opacity-40 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <span className="kicker text-[9px]" style={{ color: accent }}>{d.category || 'sovereign'}</span>
        <span className="text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded text-white/55" style={{ background: `${accent}1a` }}>AI {d.valuation_score}</span>
      </div>
      <div className="font-display text-lg font-bold text-white tracking-tight truncate">{d.domain_name}</div>
      <div className="flex items-baseline justify-between mt-1.5">
        <span className="text-[15px] font-semibold text-white tabular-nums tracking-tight">{price(Number(d.price_usd || 0))}</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/30 group-hover:text-white/50 transition-colors">acquire →</span>
      </div>
    </Link>
  );
};

const MarketplaceTeaser: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [infra, setInfra] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: e }] = await Promise.all([
        supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(10),
        supabase.from('ecosystem_products').select('*').in('slug', FEATURED_SLUGS),
      ]);
      setDomains((d || []) as Domain[]);
      if (e) {
        const order = new Map(FEATURED_SLUGS.map((s, i) => [s, i]));
        setInfra([...(e as EcosystemProduct[])].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)));
      }
    })();
  }, []);

  if (infra.length === 0 && domains.length === 0) return null;

  // Interleave infrastructure (every 2 domains, one infra) — infra leads if present
  const merged: Array<{ kind: 'infra'; p: EcosystemProduct } | { kind: 'domain'; d: Domain }> = [];
  let di = 0;
  for (let i = 0; i < Math.max(infra.length, 1); i++) {
    if (infra[i]) merged.push({ kind: 'infra', p: infra[i] });
    for (let k = 0; k < 2 && di < domains.length; k++, di++) merged.push({ kind: 'domain', d: domains[di] });
  }
  while (di < domains.length) { merged.push({ kind: 'domain', d: domains[di] }); di++; }

  const stream = [...merged, ...merged];
  const liveCount = infra.length + domains.length;

  return (
    <section className="relative py-7 border-y border-white/10 bg-black/20 overflow-hidden">
      {/* Original header — tone preserved on the left, link preserved on the right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-5">
        <span className="inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70">
          <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Featured sovereign assets</span>
          <span className="text-white/30">·</span>
          <span className="text-white/40 tabular-nums">{liveCount} live</span>
        </span>
        <Link to="/marketplace" className="text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">Marketplace →</Link>
      </div>
      <div className="relative ticker-track">
        <div className="flex gap-4 px-4 animate-ticker w-max items-stretch">
          {stream.map((item, i) =>
            item.kind === 'infra'
              ? <InfraCard key={`i-${item.p.id}-${i}`} p={item.p} />
              : <DomainCard key={`d-${item.d.id}-${i}`} d={item.d} />
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32" style={{ background: 'linear-gradient(90deg, #050816 10%, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32" style={{ background: 'linear-gradient(270deg, #050816 10%, transparent)' }} />
      </div>
    </section>
  );
};

export default MarketplaceTeaser;
