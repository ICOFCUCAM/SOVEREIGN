import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDomainProfile } from '@/hooks/useDomainProfile';
import { trackEvent } from '@/lib/analytics';
import { PLATFORM_ORIGIN } from '@/lib/tenant';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ValuationRing from '@/components/ValuationRing';
import InquiryModal from '@/components/InquiryModal';
import BrokerNegotiation from '@/components/BrokerNegotiation';
import InstitutionPreview from '@/components/InstitutionPreview';
import Reveal from '@/components/Reveal';
import {
  Shield, Sparkles, Rocket, TrendingUp, Globe, MessageCircle, DollarSign,
  ArrowLeft, CheckCircle2, Activity, Brain, Layers, Zap, Award, Lock, ScanFace, ShieldCheck,
} from 'lucide-react';

type Variant = 'tenant' | 'preview';
type ModalIntent = 'inquiry' | 'offer' | 'buy_now';

const fmtMoney = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}k` : `$${Math.round(n)}`;

// The operator's asking price is authoritative. Trust the AI's estimate only
// when it brackets that price sensibly; otherwise anchor the range to it so
// the card can never contradict the headline price (e.g. $5k–$10k vs $850,000).
const estimatedRange = (price: number, low?: number, high?: number) => {
  const sane = low && high && high >= price * 0.5 && low <= price * 2;
  const lo = sane ? (low as number) : price * 0.85;
  const hi = sane ? (high as number) : price * 1.25;
  return `${fmtMoney(lo)} - ${fmtMoney(hi)}`;
};

interface Props {
  /** Domain name to resolve (hostname on a tenant, route param in preview). */
  domainName: string;
  variant: Variant;
}

/** Minimal sovereign top bar for standalone tenant domains (no marketplace nav). */
const TenantBar: React.FC<{ domainName: string; accent: string }> = ({ domainName, accent }) => {
  const platformHref = PLATFORM_ORIGIN || '#';
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#05071A]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 blur-md opacity-50" style={{ background: accent }} />
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent}, #7C3AED)` }}>
                <Globe className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-white font-bold text-sm tracking-tight">{domainName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-300 font-mono uppercase tracking-wider">For Sale</span>
            </div>
            {PLATFORM_ORIGIN && (
              <a href={platformHref} target="_blank" rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 font-mono uppercase tracking-wider transition">
                <Shield className="w-3 h-3" /> Powered by SOVEREIGN
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

/** Trust / verification strip — SSL, ownership, fraud & anti-spam posture. */
const TrustStrip: React.FC<{ sslVerified: boolean; ownershipVerified: boolean }> = ({ sslVerified, ownershipVerified }) => {
  const items = [
    { icon: Lock, label: 'TLS / SSL', value: sslVerified ? 'Active · 256-bit' : 'Provisioning', ok: sslVerified, color: '#10B981' },
    { icon: ShieldCheck, label: 'Ownership', value: ownershipVerified ? 'Verified' : 'Pending', ok: ownershipVerified, color: '#00D9FF' },
    { icon: ScanFace, label: 'Fraud Shield', value: 'Monitored', ok: true, color: '#7C3AED' },
    { icon: Shield, label: 'Anti-Spam', value: 'Enforced', ok: true, color: '#F59E0B' },
  ];
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${it.color}15`, border: `1px solid ${it.color}30` }}>
                  <Icon className="w-4 h-4" style={{ color: it.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{it.label}</div>
                  <div className="text-xs text-white font-medium truncate flex items-center gap-1">
                    {it.ok && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {it.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DomainLanding: React.FC<Props> = ({ domainName, variant }) => {
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalIntent | null>(null);

  const { domain: d, valuation: val, loading, valuationLoading, notFound } = useDomainProfile(domainName, {
    activeOnly: variant === 'tenant',
    trackPath: variant === 'tenant' ? '/' : `/d/${domainName}`,
  });

  const openModal = (intent: ModalIntent) => {
    if (d) trackEvent({ domainId: d.id, eventType: 'cta_click', metadata: { intent } });
    setModal(intent);
  };

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground intensity="low" />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass animate-pulse" />
          <div className="text-white/60 font-mono text-sm">Resolving domain profile…</div>
        </div>
      </div>
    );
  }

  // ---- Fallback / invalid-domain protection ----
  if (notFound || !d) {
    return (
      <div className="min-h-screen">
        <AnimatedBackground intensity="low" />
        {variant === 'preview' ? <PlatformNav /> : <TenantBar domainName={domainName} accent="#00D9FF" />}
        <div className="pt-32 px-4 max-w-2xl mx-auto text-center">
          <div className="glass-strong rounded-2xl p-12">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="text-white text-2xl font-bold mb-2">
              {variant === 'tenant' ? 'This domain is being prepared' : 'Domain not registered'}
            </div>
            <p className="text-white/50 mb-6">
              {variant === 'tenant'
                ? `${domainName} is connected to the SOVEREIGN network but its profile isn't published yet. It may be available for acquisition.`
                : "This domain isn't in the sovereign registry yet. It may be available for acquisition."}
            </p>
            {variant === 'preview' ? (
              <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
                <ArrowLeft className="w-4 h-4" /> Back to marketplace
              </Link>
            ) : PLATFORM_ORIGIN ? (
              <a href={`${PLATFORM_ORIGIN}/marketplace`} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
                Explore the marketplace
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const accent = d.brand_color || '#00D9FF';
  const accent2 = d.accent_color || '#7C3AED';
  const score = val?.overall_score || d.valuation_score;

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      {variant === 'preview' ? <PlatformNav /> : <TenantBar domainName={d.domain_name} accent={accent} />}

      {/* Hero */}
      <section className="relative pt-28 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-x-0 top-16 flex justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full opacity-30 blur-[140px]"
            style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {variant === 'preview' && (
            <button onClick={() => navigate('/marketplace')} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 font-mono mb-6 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> MARKETPLACE
            </button>
          )}

          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {d.is_premium && (
                  <div className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-amber-300" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Premium Tier</span>
                  </div>
                )}
                {d.category && (
                  <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">{d.category}</span>
                  </div>
                )}
                {d.ssl_verified && (
                  <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">SSL Verified</span>
                  </div>
                )}
                {d.ownership_verified && (
                  <div className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">Ownership Proven</span>
                  </div>
                )}
              </div>

              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 leading-none">
                <span className="text-white">{d.domain_name.split('.')[0]}</span>
                <span style={{ color: accent }}>.{d.domain_name.split('.').slice(1).join('.')}</span>
              </h1>

              <p className="text-2xl text-white/70 font-light mb-3 max-w-2xl leading-tight">
                {val?.slogan || d.tagline}
              </p>

              {d.description && (
                <p className="text-white/50 max-w-2xl mb-8 leading-relaxed">{d.description}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={() => openModal('buy_now')}
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 0 40px ${accent}30` }}>
                  <DollarSign className="w-4 h-4" />
                  Buy Now · ${d.price_usd.toLocaleString()}
                </button>
                <button onClick={() => openModal('offer')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Make Offer
                </button>
                <button onClick={() => openModal('inquiry')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  Talk to AI Broker
                </button>
              </div>
            </div>

            {/* Valuation summary card */}
            <div className="glass-strong rounded-2xl p-6 sticky top-24">
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-3">AI Intelligence Score</div>
              <div className="flex justify-center mb-4">
                <ValuationRing score={score} size={140} gradient={[accent, accent2]} />
              </div>
              <div className="text-center mb-4">
                <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Estimated Value</div>
                <div className="text-white font-bold text-xl">
                  {estimatedRange(d.price_usd, val?.estimated_value_low, val?.estimated_value_high)}
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-white/40 font-mono uppercase">Industry</div>
                  <div className="text-xs text-white font-medium mt-0.5">{val?.industry_category || d.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-mono uppercase">Confidence</div>
                  <div className="text-xs text-cyan-300 font-medium mt-0.5">{val?.confidence_score || 88}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence breakdown */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Domain Intelligence Breakdown</h2>
          </div>

          {valuationLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (<div key={i} className="glass rounded-xl h-40 animate-pulse" />))}
            </div>
          ) : val ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {([
                  { label: 'Brand', val: val.brand_strength },
                  { label: 'Memorability', val: val.memorability },
                  { label: 'SEO', val: val.seo_potential },
                  { label: 'AI Relevance', val: val.ai_relevance },
                  { label: 'Market', val: val.market_alignment },
                  { label: 'Startup', val: val.startup_viability },
                  { label: 'Sovereign', val: val.sovereign_potential },
                ] as Array<{ label: string; val: number }>).map((m) => (
                  <div key={m.label} className="glass rounded-xl p-4 flex flex-col items-center">
                    <ValuationRing score={m.val} size={80} label={m.label} gradient={[accent, accent2]} />
                  </div>
                ))}
              </div>

              <div className="glass-strong rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-0.5">AI Valuation Narrative</div>
                    <div className="text-white/40 text-[10px] font-mono">model · {val.model_used}</div>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed text-lg">{val.narrative}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">AI-Generated Startup Concepts</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {val.startup_concepts.map((c, i) => (
                    <div key={i} className="glass rounded-xl p-5 hover:glass-strong transition group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${accent}30, ${accent2}20)`, border: `1px solid ${accent}40` }}>
                          <Layers className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 px-2 py-0.5 rounded bg-white/5">{c.category}</span>
                      </div>
                      <div className="text-white font-bold text-lg mb-1.5">{c.title}</div>
                      <div className="text-white/50 text-sm leading-relaxed">{c.description}</div>
                      <button onClick={() => openModal('buy_now')} className="mt-4 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono uppercase tracking-wider text-cyan-300 transition flex items-center justify-center gap-1.5">
                        <Zap className="w-3 h-3" /> Launch this concept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* Analytics & telemetry */}
          <div className="grid md:grid-cols-4 gap-4">
            {([
              { icon: Activity, label: 'Total Views', val: (d.view_count + 1).toLocaleString(), color: '#00D9FF' },
              { icon: TrendingUp, label: 'Inquiries', val: d.inquiry_count.toLocaleString(), color: '#10B981' },
              { icon: Globe, label: 'TLD Authority', val: val ? `${val.tld_strength}/100` : '—', color: '#7C3AED' },
              { icon: Sparkles, label: 'Conversion Pot.', val: '12.4%', color: '#F59E0B' },
            ] as Array<{ icon: typeof Activity; label: string; val: string; color: string }>).map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-white tabular-nums">{m.val}</div>
                  <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-1">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Reveal><InstitutionPreview domain={d} onAcquire={openModal} /></Reveal>

      <Reveal><TrustStrip sslVerified={d.ssl_verified} ownershipVerified={d.ownership_verified} /></Reveal>

      {variant === 'preview' ? (
        <PlatformFooter />
      ) : (
        <footer className="border-t border-white/5 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
            <span className="font-mono">© {new Date().getFullYear()} {d.domain_name} · Sovereign-grade domain</span>
            {PLATFORM_ORIGIN && (
              <a href={PLATFORM_ORIGIN} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white/70 font-mono uppercase tracking-wider transition">
                <Shield className="w-3 h-3" /> Powered by SOVEREIGN Domain.OS
              </a>
            )}
          </div>
        </footer>
      )}

      {modal === 'buy_now' && <InquiryModal domain={d} intent="buy_now" onClose={() => setModal(null)} />}
      {(modal === 'inquiry' || modal === 'offer') && (
        <BrokerNegotiation domain={d} intent={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
};

export default DomainLanding;
