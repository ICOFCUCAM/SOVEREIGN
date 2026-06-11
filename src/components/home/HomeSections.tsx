import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchNetworkRegions } from '@/lib/stats';
import type { EcosystemProduct } from '@/lib/types';
import {
  Landmark, Banknote, Truck, Cpu, Film, GraduationCap, ArrowRight, ArrowUpRight,
  Globe, Network, Shield, Fingerprint, Rocket, Activity, Eye, FileText, BarChart3,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Section 2 — "What would you like to deploy?"
// ──────────────────────────────────────────────────────────────────────────────
const DEPLOY_TYPES = [
  { icon: Landmark, label: 'Government', desc: 'National runtimes, ministries, civic continuity.', to: '/deploy', accent: '#00C2FF' },
  { icon: Banknote, label: 'Finance', desc: 'Treasury, payments, banking, settlement rails.', to: '/deploy', accent: '#7C4DFF' },
  { icon: Truck, label: 'Logistics', desc: 'Relocation, transport, supply chain marketplaces.', to: '/marketplace', accent: '#10B981' },
  { icon: Cpu, label: 'Intelligence', desc: 'AI-native decision fabric, observability, agents.', to: '/valuation', accent: '#F59E0B' },
  { icon: Film, label: 'Media', desc: 'Generation, distribution, strategic communications.', to: '/studio', accent: '#EC4899' },
  { icon: GraduationCap, label: 'Education', desc: 'National learning systems, credentialing.', to: '/deploy', accent: '#06B6D4' },
];

export const DeploymentTypes: React.FC = () => (
  <section className="relative py-28 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.3em' }}>Begin</div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance leading-[1.05]">
          What would you like to <span className="text-gradient-cyan">deploy?</span>
        </h2>
        <p className="text-white/55 mt-5 max-w-xl mx-auto">Choose a sovereign domain. The deployment orchestrator does the rest — provisioning, identity, and operational continuity included.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEPLOY_TYPES.map((d) => (
          <Link key={d.label} to={d.to} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015] p-6 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_70px_-40px_rgba(0,0,0,0.8)]">
            <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${d.accent}, transparent)` }} />
            <span className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[80px] opacity-[0.10] group-hover:opacity-[0.22] transition-opacity" style={{ background: d.accent }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${d.accent}1a`, border: `1px solid ${d.accent}33` }}>
                  <d.icon className="w-5 h-5" style={{ color: d.accent }} />
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="font-display font-bold text-white text-xl tracking-tight">{d.label}</div>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{d.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// ──────────────────────────────────────────────────────────────────────────────
// Section 3 — Featured Infrastructure Assets
// ──────────────────────────────────────────────────────────────────────────────
const FEATURED_SLUGS = ['relocation-us', 'civicos-treasury', 'veritas-operations', 'civicos-national-shell', 'civicos-emergency'];

export const FeaturedInfrastructure: React.FC = () => {
  const [items, setItems] = useState<EcosystemProduct[]>([]);
  useEffect(() => {
    supabase.from('ecosystem_products').select('*').in('slug', FEATURED_SLUGS).then(({ data }) => {
      if (!data) return;
      // preserve declared order
      const order = new Map(FEATURED_SLUGS.map((s, i) => [s, i]));
      setItems([...data].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)));
    });
  }, []);

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
          <div>
            <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.3em' }}>Featured</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic">
              Infrastructure <span className="text-gradient-cyan">assets.</span>
            </h2>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-white transition">View all <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {items.map((p) => {
            const accent = p.accent || '#00D9FF';
            const m = (p.metrics || []).find((x) => /value|valuation|infrastructure|deployment|price/i.test(x.label)) || p.metrics?.[0];
            return (
              <Link key={p.id} to={`/systems/${p.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.012] p-5 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/25">
                <span className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[60px] opacity-[0.10] group-hover:opacity-[0.25] transition-opacity" style={{ background: accent }} />
                <div className="relative">
                  <div className="text-[9px] font-mono uppercase tracking-[0.2em] mb-3 truncate" style={{ color: accent }}>{p.category}</div>
                  <div className="font-display font-bold text-white text-lg leading-tight">{p.name}</div>
                  <p className="text-xs text-white/45 mt-2 line-clamp-2 min-h-[2rem]">{p.tagline}</p>
                  {m && (
                    <div className="mt-4 pt-3 border-t border-white/8">
                      <div className="text-base font-bold text-white tabular-nums">{m.value}</div>
                      <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1">{m.label}</div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Section 4 — Operational Infrastructure (DNS hidden behind Network/Identity)
// ──────────────────────────────────────────────────────────────────────────────
const OPS_TILES = [
  { icon: Globe, label: 'Domains', desc: 'Sovereign namespace, registration, lifecycle.', to: '/sovereign-domains', accent: '#00C2FF' },
  { icon: Network, label: 'Network', desc: 'Authoritative DNS, routing, propagation.', to: '/dns', accent: '#10B981' },
  { icon: Fingerprint, label: 'Identity', desc: 'Registrant identities, customer handles.', to: '/registrants', accent: '#7C4DFF' },
  { icon: Shield, label: 'Security', desc: 'SSL, DNSSEC, isolation, controls.', to: '/dns', accent: '#F59E0B' },
  { icon: Rocket, label: 'Deployment', desc: 'Orchestration, edge mesh, continuity.', to: '/deploy', accent: '#EC4899' },
];

export const OperationalInfrastructure: React.FC = () => (
  <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.3em' }}>Layer</div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">
          Operational <span className="text-gradient-cyan">infrastructure.</span>
        </h2>
        <p className="text-white/55 mt-5">The substrate every sovereign deployment runs on — one console, every capability.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {OPS_TILES.map((t) => (
          <Link key={t.label} to={t.to} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015] p-6 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/25">
            <span className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[70px] opacity-[0.10] group-hover:opacity-[0.22] transition-opacity" style={{ background: t.accent }} />
            <div className="relative">
              <t.icon className="w-5 h-5 mb-4" style={{ color: t.accent }} />
              <div className="font-display font-bold text-white text-lg tracking-tight">{t.label}</div>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{t.desc}</p>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/35 mt-4 inline-flex items-center gap-1.5 group-hover:text-cyan-300/80 transition-colors">Open <ArrowRight className="w-3 h-3" /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// ──────────────────────────────────────────────────────────────────────────────
// Section 5 — Deployment Regions (live from network_regions; seed values mirror
// the original hardcoded mesh so the section never renders empty)
// ──────────────────────────────────────────────────────────────────────────────
const REGION_FALLBACK = [
  { label: 'North America', sub: 'United States · Canada', nodes: 12, accent: '#00C2FF', status: 'operational' },
  { label: 'Europe', sub: 'EU · UK · EFTA', nodes: 24, accent: '#7C4DFF', status: 'operational' },
  { label: 'Africa', sub: 'West · East · Southern', nodes: 7, accent: '#10B981', status: 'operational' },
  { label: 'Middle East', sub: 'GCC · Levant', nodes: 4, accent: '#F59E0B', status: 'operational' },
  { label: 'Asia-Pacific', sub: 'East · South · Oceania', nodes: 15, accent: '#EC4899', status: 'operational' },
];

export const DeploymentRegions: React.FC = () => {
  const [regions, setRegions] = useState<Array<{ label: string; sub: string | null; nodes: number; accent: string; status: string }>>(REGION_FALLBACK);
  useEffect(() => {
    fetchNetworkRegions().then((rows) => { if (rows.length) setRegions(rows); });
  }, []);
  return <DeploymentRegionsView regions={regions} />;
};

const DeploymentRegionsView: React.FC<{ regions: Array<{ label: string; sub: string | null; nodes: number; accent: string; status: string }> }> = ({ regions: REGIONS }) => (
  <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.3em' }}>Reach</div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">
          Deployment <span className="text-gradient-cyan">regions.</span>
        </h2>
        <p className="text-white/55 mt-5">A sovereign edge mesh spanning five operational zones with continuous capacity.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {REGIONS.map((r) => (
          <div key={r.label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.012] p-6 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/25">
            <span className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[70px] opacity-[0.10] group-hover:opacity-[0.22] transition-opacity" style={{ background: r.accent }} />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] mb-4" style={{ color: r.accent }}>
                <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: r.accent }} /> {r.status}
              </div>
              <div className="font-display font-bold text-white text-lg tracking-tight">{r.label}</div>
              <div className="text-xs text-white/50 mt-1">{r.sub}</div>
              <div className="mt-5 pt-4 border-t border-white/8 flex items-end justify-between">
                <span className="text-2xl font-bold text-white tabular-nums">{r.nodes}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">edge nodes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ──────────────────────────────────────────────────────────────────────────────
// Section 6 — Institutional Intelligence
// ──────────────────────────────────────────────────────────────────────────────
const INTEL = [
  { icon: BarChart3, label: 'Strategic Analysis', desc: 'Cross-domain situational synthesis for executives.', accent: '#00C2FF' },
  { icon: Eye, label: 'Forecasting', desc: 'Scenario modelling and propagation simulation.', accent: '#7C4DFF' },
  { icon: Activity, label: 'Monitoring', desc: 'Continuous signal capture across the operational layer.', accent: '#10B981' },
  { icon: FileText, label: 'Executive Briefings', desc: 'Cinematic dispatches synthesised for decision-makers.', accent: '#F59E0B' },
];

export const InstitutionalIntelligence: React.FC = () => (
  <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.3em' }}>Insight</div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">
          Institutional <span className="text-gradient-cyan">intelligence.</span>
        </h2>
        <p className="text-white/55 mt-5">A strategic intelligence layer beneath every sovereign deployment.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {INTEL.map((i) => (
          <div key={i.label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015] p-6 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/25">
            <span className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[70px] opacity-[0.10] group-hover:opacity-[0.22] transition-opacity" style={{ background: i.accent }} />
            <div className="relative">
              <i.icon className="w-5 h-5 mb-4" style={{ color: i.accent }} />
              <div className="font-display font-bold text-white text-lg tracking-tight">{i.label}</div>
              <p className="text-sm text-white/55 mt-2 leading-relaxed">{i.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to="/valuation" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white transition">Open the intelligence layer <ArrowRight className="w-4 h-4" /></Link>
      </div>
    </div>
  </section>
);
