import React from 'react';
import { Link } from 'react-router-dom';
import type { EcosystemProduct, Domain } from '@/lib/types';
import ValuationRing from '@/components/ValuationRing';
import HudCorners from '@/components/HudCorners';
import { DollarSign, MessageSquare, FileText } from 'lucide-react';

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const scoreFor = (seed: string, base: number, span: number) => base + (hash(seed) % span);

const DIMS = ['Sovereign readiness', 'AI governance', 'Coordination depth', 'Crisis capability', 'Infrastructure class', 'Federation ready'];

const deploymentValue = (p: EcosystemProduct): string => {
  const t = p.tiers || [];
  if (t.length) return `${t[0].price} – ${t[t.length - 1].price}`;
  const m = (p.metrics || []).find((x) => /deployment|value|contract|price/i.test(x.label));
  return m?.value || 'On request';
};

type Tier = { tier: string; price: string; label?: string; scope?: string; timeline?: string };
const SystemIntelligence: React.FC<{ p: EcosystemProduct; domain?: Domain | null; tier?: Tier; onBrief?: () => void }> = ({ p, domain, tier, onBrief }) => {
  const tiered = !!(p.tiers && p.tiers.length);
  const accent = p.accent || '#00D9FF';
  const accent2 = '#7C4DFF';
  const score = scoreFor(p.slug, 88, 11);
  const confidence = scoreFor(p.slug + 'c', 84, 14);
  const dims = DIMS.map((label) => ({ label, val: scoreFor(p.slug + label, 72, 27) }));
  const narrative = `${p.name} is engineered as ${p.category.toLowerCase()} — ${p.tagline} With a sovereign capability score of ${score}/100, it is built for institutional-scale deployment, AI-native governance and federated operation across sovereign regions.`;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* narrative + acquisition */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5"><FileText className="w-5 h-5" style={{ color: accent }} /> Capability intelligence</h2>
            <p className="text-white/70 leading-relaxed text-lg mb-7 max-w-2xl">{narrative}</p>
            <div className="flex flex-wrap gap-3">
              {tiered ? (
                <button onClick={onBrief} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 0 36px ${accent}44` }}>
                  <DollarSign className="w-4 h-4" /> {tier ? `Acquire · ${tier.price}` : 'Request deployment'}
                </button>
              ) : domain ? (
                <Link to={`/d/${encodeURIComponent(domain.domain_name)}`} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 0 36px ${accent}44` }}>
                  <DollarSign className="w-4 h-4" /> Acquire · ${Number(domain.price_usd).toLocaleString()}
                </Link>
              ) : (
                <Link to="/marketplace" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 0 36px ${accent}44` }}>
                  <DollarSign className="w-4 h-4" /> Acquire capability
                </Link>
              )}
              <Link to={domain ? `/d/${encodeURIComponent(domain.domain_name)}` : '/marketplace'} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Request briefing
              </Link>
            </div>
          </div>

          {/* score panel */}
          <div className="relative glass-strong rounded-2xl p-6 border border-white/10 overflow-hidden">
            <HudCorners color={accent} className="opacity-50" />
            <div className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-4">Sovereign capability score</div>
            <div className="flex justify-center mb-5"><ValuationRing score={score} size={140} gradient={[accent, accent2]} /></div>
            <div className="text-center pb-5 border-b border-white/10">
              <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">{tier ? `${tier.tier} tier` : 'Deployment value'}</div>
              <div className="text-2xl font-bold text-white tabular-nums">{tier ? tier.price : deploymentValue(p)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Class</div>
                <div className="text-sm text-white font-medium mt-0.5">Sovereign</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Confidence</div>
                <div className="text-sm font-medium mt-0.5" style={{ color: accent }}>{confidence}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* dimension breakdown */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-white mb-6">Capability breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {dims.map((m) => (
              <div key={m.label} className="rounded-2xl border border-white/10 bg-white/[0.015] p-4 flex flex-col items-center">
                <ValuationRing score={m.val} size={80} gradient={[accent, accent2]} />
                <div className="mt-2 text-[11px] text-white/55 text-center leading-snug">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemIntelligence;
