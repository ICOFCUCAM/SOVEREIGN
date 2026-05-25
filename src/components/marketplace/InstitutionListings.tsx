import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import { ArrowUpRight, Clock, Layers } from 'lucide-react';

const TIER_COLOR: Record<string, string> = {
  Core: '#3B82F6', Professional: '#14B8A6', Elite: '#7C4DFF', Strategic: '#F59E0B', Prime: '#E8C572',
};

// ── CIVICOS sovereign acquisition tiers (resemble the premium domain panels) ──
const CivicosTierCard: React.FC<{ t: NonNullable<EcosystemProduct['tiers']>[number] }> = ({ t }) => {
  const c = TIER_COLOR[t.tier] || '#00C2FF';
  return (
    <Link to="/systems/civicos" className="group relative block overflow-hidden rounded-2xl glass hover:glass-strong transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all" style={{ background: c }} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded" style={{ background: `${c}1f`, color: c }}>{t.tier}</span>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="font-display text-xl font-bold text-white tracking-tight">CIVICOS {t.tier}</div>
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] mt-1.5 mb-6" style={{ color: c }}>{t.label}</div>

        <div className="text-3xl font-bold text-white tabular-nums leading-none">{t.price}</div>
        <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-2 mb-5">Starting deployment</div>

        <div className="space-y-2 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/60"><Layers className="w-3.5 h-3.5 shrink-0" style={{ color: c }} /> {t.scope}</div>
          <div className="flex items-center gap-2 text-xs text-white/60"><Clock className="w-3.5 h-3.5 shrink-0" style={{ color: c }} /> {t.timeline}</div>
        </div>
      </div>
    </Link>
  );
};

// ── Ministry systems — deployable ministry-by-ministry ──
const MinistryCard: React.FC<{ p: EcosystemProduct }> = ({ p }) => {
  const accent = p.accent || '#00C2FF';
  const tiers = p.tiers || [];
  const start = tiers[0]?.price;
  return (
    <Link to={`/systems/${p.slug}`} className="group relative block overflow-hidden rounded-2xl glass hover:glass-strong transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-all" style={{ background: accent }} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/45">Ministry runtime</span>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="font-display text-xl font-bold text-white tracking-tight">{p.name}</div>
        <div className="text-sm text-white/45 line-clamp-1 mb-5">{p.tagline}</div>

        {start && (
          <div className="mb-5">
            <div className="text-2xl font-bold text-white tabular-nums leading-none">From {start}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1.5">Core deployment</div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
          {tiers.map((t) => (
            <span key={t.tier} className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-md border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: TIER_COLOR[t.tier] || accent }} />
              <span className="text-white/60">{t.tier}</span>
              <span className="text-white/40 tabular-nums">{t.price}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

const MINISTRY_ORDER = ['civicos-treasury', 'civicos-health', 'civicos-justice', 'civicos-education', 'civicos-transport', 'civicos-emergency', 'civicos-police', 'civicos-coordination-engine', 'civicos-anti-corruption'];

const InstitutionListings: React.FC = () => {
  const [civicos, setCivicos] = useState<EcosystemProduct | null>(null);
  const [ministries, setMinistries] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').like('slug', 'civicos%');
      const rows = (data || []) as EcosystemProduct[];
      setCivicos(rows.find((r) => r.slug === 'civicos') || null);
      const byOrder = MINISTRY_ORDER.map((s) => rows.find((r) => r.slug === s)).filter(Boolean) as EcosystemProduct[];
      setMinistries(byOrder);
    })();
  }, []);

  if (!civicos && ministries.length === 0) return null;

  return (
    <div className="mt-16 space-y-16">
      {/* CIVICOS sovereign capability acquisition */}
      {civicos?.tiers && civicos.tiers.length > 0 && (
        <div>
          <div className="mb-7">
            <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-cyan-300/70 mb-2">Sovereign capability acquisition</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">CIVICOS — deployable government operating system.</h2>
            <p className="text-white/50 mt-2 max-w-2xl">Acquire by capability tier — from a foundational government stack to civilization-scale sovereign infrastructure.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {civicos.tiers.map((t) => <CivicosTierCard key={t.tier} t={t} />)}
          </div>
        </div>
      )}

      {/* deploy ministry by ministry */}
      {ministries.length > 0 && (
        <div>
          <div className="mb-7">
            <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-cyan-300/70 mb-2">Deploy by ministry</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Acquire ministry runtimes independently.</h2>
            <p className="text-white/50 mt-2 max-w-2xl">Governments deploy the full stack — or modernize ministry by ministry, each tiered Core to Strategic.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ministries.map((p) => <MinistryCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionListings;
