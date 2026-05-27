import React from 'react';
import { Link } from 'react-router-dom';
import type { EcosystemProduct } from '@/lib/types';
import HudCorners from '@/components/HudCorners';
import { Clock, Layers } from 'lucide-react';

const TIER_COLOR: Record<string, string> = {
  Core: '#3B82F6', Professional: '#14B8A6', Elite: '#7C4DFF', Strategic: '#F59E0B', Prime: '#E8C572',
};

const SystemTiers: React.FC<{ p: EcosystemProduct; selected?: string }> = ({ p, selected }) => {
  const tiers = p.tiers || [];
  if (tiers.length === 0) return null;
  return (
    <section id="tiers" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-px bg-cyan-300/50" />
            <h2 className="font-display text-2xl font-bold tracking-cinematic text-white">Acquisition tiers</h2>
          </div>
          <span className="kicker text-white/35" style={{ fontSize: '10px' }}>{tiers.length} deployment tiers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tiers.map((t) => {
            const c = TIER_COLOR[t.tier] || p.accent || '#00C2FF';
            const active = selected?.toLowerCase() === t.tier.toLowerCase();
            return (
              <Link key={t.tier} to={`/systems/${p.slug}?tier=${t.tier.toLowerCase()}`} className={`group relative block rounded-2xl border bg-white/[0.015] p-5 overflow-hidden ease-cinematic transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_36px_80px_-44px_rgba(0,0,0,0.9)] ${active ? 'border-white/30' : 'border-white/10 hover:border-white/25'}`} style={active ? { boxShadow: `0 0 30px ${c}33` } : undefined}>
                <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: active ? 1 : 0.6 }} />
                <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: c }} />
                <HudCorners color={c} className="opacity-30" />
                <div className="relative">
                  <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded mb-4" style={{ background: `${c}1f`, color: c }}>{t.tier}</span>
                  <div className="text-2xl font-bold text-white tabular-nums leading-none">{t.price}</div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-2">Starting deployment</div>
                  {(t.scope || t.timeline) && (
                    <div className="space-y-2 mt-5 pt-4 border-t border-white/5">
                      {t.scope && <div className="flex items-center gap-2 text-xs text-white/60"><Layers className="w-3.5 h-3.5 shrink-0" style={{ color: c }} /> {t.scope}</div>}
                      {t.timeline && <div className="flex items-center gap-2 text-xs text-white/60"><Clock className="w-3.5 h-3.5 shrink-0" style={{ color: c }} /> {t.timeline}</div>}
                    </div>
                  )}
                  {t.label && <div className="text-[11px] font-mono uppercase tracking-[0.12em] mt-4" style={{ color: c }}>{t.label}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SystemTiers;
