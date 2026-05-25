import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct, Domain } from '@/lib/types';
import { institutionBlueprint } from '@/lib/institution';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import SystemTelemetry from '@/components/SystemTelemetry';
import { ArrowLeft, ExternalLink, DollarSign, CheckCircle2, Activity, Globe, Layers, ChevronRight, ArrowUpRight } from 'lucide-react';

const SLUG_BLUEPRINT: Record<string, string> = {
  act: 'govtech', civicos: 'govtech', elecpro: 'govtech',
  'veritas-banking': 'fintech', 'mobile-pay': 'fintech',
  'veritas-os': 'ai', 'veritas-operations': 'general',
  flyttgo: 'logistics', edupro: 'education',
  'deployment-engine': 'general', 'marketplace-infra': 'general',
};
const STATUS_COLOR: Record<string, string> = { live: '#10B981', arming: '#F59E0B', staged: '#00D9FF' };

const SystemPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<EcosystemProduct | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [related, setRelated] = useState<EcosystemProduct[]>([]);
  const [modules, setModules] = useState<EcosystemProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(product?.name);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('ecosystem_products').select('*').eq('slug', slug).maybeSingle();
      setProduct((data as EcosystemProduct) || null);
      const { data: dom } = await supabase.from('domains').select('*').contains('metadata', { ecosystem_slug: slug }).maybeSingle();
      setDomain((dom as Domain) || null);
      const { data: mod } = await supabase.from('ecosystem_products').select('*').like('slug', `${slug}-%`).order('sort_order', { ascending: true });
      setModules((mod || []) as EcosystemProduct[]);
      const { data: rel } = await supabase.from('ecosystem_products').select('*').neq('slug', slug).not('slug', 'like', `${slug}-%`).order('sort_order', { ascending: true }).limit(4);
      setRelated((rel || []) as EcosystemProduct[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <AnimatedBackground intensity="low" />
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" />
        <PlatformNav />
        <div className="pt-32 px-4 max-w-2xl mx-auto text-center">
          <div className="glass-strong rounded-2xl p-12">
            <div className="text-2xl font-bold mb-2">System not found</div>
            <Link to="/ecosystem" className="inline-flex items-center gap-2 mt-4 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to the ecosystem
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accent = product.accent || '#00D9FF';
  const caps = Array.isArray(product.capabilities) ? product.capabilities : [];
  const metrics = Array.isArray(product.metrics) ? product.metrics : [];
  const bp = institutionBlueprint(product.name, SLUG_BLUEPRINT[product.slug] || 'general');

  // Prefer the system's own real data; fall back to the category blueprint.
  const kpis = metrics.length ? metrics.slice(0, 4) : bp.kpis;
  const subsystems = caps.length
    ? caps.slice(0, 6).map((c, i) => ({
        name: c,
        status: (['live', 'live', 'arming', 'staged'] as const)[i % 4],
        value: ['Online', 'Online', 'Arming', 'Staged'][i % 4],
      }))
    : bp.systems.map((s) => ({ name: s.name, status: s.status, value: s.metricValue }));

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      {/* Hero */}
      <section className="relative pt-28 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-x-0 top-16 flex justify-center pointer-events-none">
          <div className="w-[760px] h-[760px] rounded-full opacity-25 blur-[150px]" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <Link to="/ecosystem" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 font-mono mb-6 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> ECOSYSTEM
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* identity */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-3" style={{ color: accent }}>{product.category}</div>
              <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter mb-4">{product.name}</h1>
              <p className="text-2xl text-white/70 font-light max-w-2xl mb-5">{product.tagline}</p>
              <p className="text-white/50 max-w-2xl leading-relaxed mb-7">{product.description}</p>

              <div className="flex flex-wrap items-center gap-2 mb-7">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1.5" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}33` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: accent }} /> Deployable · preview build
                </span>
              </div>

              {metrics.length > 0 && (
                <div className="flex flex-wrap rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] max-w-xl mb-8">
                  {metrics.slice(0, 3).map((m) => (
                    <div key={m.label} className="flex-1 min-w-[110px] px-4 py-3 border-r border-white/5 last:border-r-0">
                      <div className="flex items-center gap-1.5 mb-1.5"><span className="w-1 h-1 rounded-full" style={{ background: accent }} /><span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 truncate">{m.label}</span></div>
                      <div className="text-lg font-mono font-semibold tabular-nums" style={{ color: accent }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {product.url && (
                  <a href={product.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all"
                    style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED)`, boxShadow: `0 0 40px ${accent}30` }}>
                    <ExternalLink className="w-4 h-4" /> View live preview
                  </a>
                )}
                {domain ? (
                  <Link to={`/d/${encodeURIComponent(domain.domain_name)}`} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                    <DollarSign className="w-4 h-4 text-cyan-400" /> Acquire institution · ${Number(domain.price_usd).toLocaleString()}
                  </Link>
                ) : (
                  <Link to="/marketplace" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                    <DollarSign className="w-4 h-4 text-cyan-400" /> Explore acquisition <ChevronRight className="w-4 h-4 text-white/40" />
                  </Link>
                )}
              </div>
            </div>

            {/* live operational environment */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-[2rem] blur-[70px] opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
              <div className="relative" style={{ aspectRatio: '16 / 12' }}>
                <SystemTelemetry category={product.category} accent={accent} className="h-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reveal>
      {/* Capabilities */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Capabilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {caps.map((c) => (
              <div key={c} className="glass rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span className="text-sm text-white/85">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational command plane */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: accent }} /><span className="text-white font-semibold text-sm">{product.name} · Command Plane</span></div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Operational preview · simulated</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{k.value}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mt-1">{k.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Operational throughput · 24h</div>
                  <div className="flex items-end gap-1.5 h-32">
                    {[42, 55, 48, 62, 70, 58, 75, 82, 71, 88, 79, 94, 86, 100].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, ${accent}, #7C3AED)`, opacity: 0.55 + i / 28 }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Systems online</div>
                  <div className="space-y-2.5">
                    {subsystems.map((s) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[s.status], boxShadow: `0 0 6px ${STATUS_COLOR[s.status]}` }} />
                          <span className="text-sm text-white/80 truncate">{s.name}</span>
                        </div>
                        <span className="text-[10px] text-white/45 font-mono uppercase shrink-0">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment + architecture */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4" style={{ color: accent }} /><span className="text-white font-semibold text-sm">Deployment zones</span></div>
            <div className="space-y-2.5">
              {bp.zones.map((z, i) => (
                <div key={z} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? '#10B981' : accent, boxShadow: `0 0 8px ${i === 0 ? '#10B981' : accent}` }} />
                  <span className="text-sm text-white/80">{z}</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-mono uppercase" style={{ color: i === 0 ? '#10B981' : accent }}>{i === 0 ? 'primary' : 'ready'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Layers className="w-4 h-4" style={{ color: accent }} /><span className="text-white font-semibold text-sm">Architecture</span></div>
            <div className="space-y-2">
              {bp.architecture.map((layer, i) => (
                <div key={layer} className="rounded-lg border border-white/10 px-4 py-2.5 flex items-center gap-3" style={{ background: `linear-gradient(90deg, ${accent}${(18 - i * 3).toString(16).padStart(2, '0')}, transparent)` }}>
                  <span className="text-[10px] font-mono text-white/30">L{bp.architecture.length - i}</span>
                  <span className="text-sm text-white/80">{layer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Module suite */}
      {modules.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-7">
              <h2 className="text-2xl font-bold text-white">Deployable modules</h2>
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">{modules.length} systems</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {modules.map((m) => {
                const dep = (m.metrics || []).find((x) => /deployment/i.test(x.label));
                return (
                  <Link key={m.id} to={`/systems/${m.slug}`} className="group rounded-2xl border border-white/10 p-5 hover:border-white/25 hover:bg-white/[0.02] transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-2 h-2 rounded-full" style={{ background: m.accent }} />
                      {dep && <span className="text-[11px] font-mono tabular-nums" style={{ color: m.accent }}>{dep.value}</span>}
                    </div>
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      {m.name}
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-sm text-white/45 line-clamp-1 mt-1">{m.tagline}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Acquisition */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto glass-strong rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full blur-[120px] opacity-20" style={{ background: accent }} />
          <div className="relative grid lg:grid-cols-[1fr_320px] gap-8 items-center">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-3" style={{ color: accent }}>Acquisition</div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter mb-4">Acquire {product.name}.</h2>
              <p className="text-white/55 max-w-xl mb-6 leading-relaxed">A deployable institution — preview the build today; on acquisition it ships in full on sovereign infrastructure. The transfer includes the complete platform and its expansion framework.</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-w-lg">
                {['Platform infrastructure', 'Operational architecture', 'Expansion automation', 'Brand & IP assets', 'Subscription ecosystem', 'Deployment framework'].map((x) => (
                  <div key={x} className="flex items-center gap-2 text-sm text-white/70"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />{x}</div>
                ))}
              </div>
            </div>
            <div className="lg:text-right">
              {domain && (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Valuation</div>
                  <div className="font-display text-4xl font-bold text-white mb-5 tabular-nums">${Number(domain.price_usd).toLocaleString()}</div>
                </>
              )}
              <div className="flex flex-col gap-2 lg:items-end">
                {domain ? (
                  <Link to={`/d/${encodeURIComponent(domain.domain_name)}`} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold w-full lg:w-auto" style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED)` }}>
                    <DollarSign className="w-4 h-4" /> Acquire the institution
                  </Link>
                ) : (
                  <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold w-full lg:w-auto" style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED)` }}>
                    <DollarSign className="w-4 h-4" /> Explore acquisition
                  </Link>
                )}
                <span className="text-[11px] font-mono text-white/35">Strategic partnership & investment welcomed</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {related.length > 0 && (
        <Reveal>
          <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40 mb-6">More in the ecosystem</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {related.map((r) => (
                  <Link key={r.id} to={`/systems/${r.slug}`} className="group rounded-xl border border-white/10 p-5 hover:border-white/25 hover:bg-white/[0.02] transition">
                    <div className="w-1.5 h-1.5 rounded-full mb-3" style={{ background: r.accent }} />
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5 truncate">{r.category}</div>
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      {r.name}
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <PlatformFooter />
    </div>
  );
};

export default SystemPage;
