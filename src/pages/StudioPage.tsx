import React, { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { ValuationReport } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ValuationRing from '@/components/ValuationRing';
import { toast } from 'sonner';
import {
  Sparkles, Search, Brain, Palette, Type, Layout, Rocket, Layers, TrendingUp,
  DollarSign, Save, Building2, Megaphone, AlertCircle, Wand2, ExternalLink,
} from 'lucide-react';

interface Edits {
  slogan: string;
  brand_tone: string;
  primary: string;
  accent: string;
  headline: string;
  subhead: string;
  cta: string;
}

const monogram = (name: string) => name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();

const StudioPage: React.FC = () => {
  useDocumentTitle('Branding Studio', 'AI-native venture creation — generate sovereign brand identity, narrative and deployable UI from a single domain.');
  const { domain: routeDomain } = useParams<{ domain: string }>();
  const [domain, setDomain] = useState(routeDomain ? decodeURIComponent(routeDomain) : '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationReport | null>(null);
  const [analyzedDomain, setAnalyzedDomain] = useState('');
  const [error, setError] = useState('');
  const [edits, setEdits] = useState<Edits | null>(null);
  const [saving, setSaving] = useState(false);

  const analyze = async (raw?: string) => {
    const input = (raw ?? domain).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!input) return;
    if (!input.includes('.')) { setError('Include the TLD (e.g., yourname.ai)'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const { data, error: e } = await supabase.functions.invoke('ai-valuation', { body: { domain: input } });
      if (e) throw e;
      const r = data as ValuationReport;
      setResult(r);
      setAnalyzedDomain(input);
      setEdits({
        slogan: r.slogan || '',
        brand_tone: r.brand_tone || '',
        primary: r.brand_palette?.primary || '#00D9FF',
        accent: r.brand_palette?.accent || '#7C3AED',
        headline: r.landing_copy?.headline || '',
        subhead: r.landing_copy?.subhead || '',
        cta: r.landing_copy?.cta || `Acquire ${input}`,
      });
      trackEvent({ eventType: 'cta_click', metadata: { surface: 'studio', domain: input } });
    } catch {
      setError('Intelligence engine timed out. Try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (routeDomain) analyze(decodeURIComponent(routeDomain));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDomain]);

  const saveProfile = async () => {
    if (!result || !edits) return;
    setSaving(true);
    const { data: dom } = await supabase.from('domains').select('id').eq('domain_name', analyzedDomain).maybeSingle();
    const { error: e } = await supabase.from('brand_profiles').insert({
      domain_id: dom?.id ?? null,
      domain_name: analyzedDomain,
      overall_score: result.overall_score,
      slogan: edits.slogan,
      brand_tone: edits.brand_tone,
      typography_direction: result.typography_direction ?? null,
      ui_style: result.ui_style ?? null,
      logo_concept: result.logo_concept ?? null,
      market_positioning: result.market_positioning ?? null,
      elevator_pitch: result.elevator_pitch ?? null,
      investor_narrative: result.investor_narrative ?? null,
      primary_color: edits.primary,
      accent_color: edits.accent,
      neutral_color: result.brand_palette?.neutral ?? '#0A0E27',
      monetization: result.monetization ?? [],
      startup_concepts: result.startup_concepts ?? [],
      landing_copy: { headline: edits.headline, subhead: edits.subhead, cta: edits.cta },
      industry_category: result.industry_category,
      model_used: result.model_used ?? null,
    });
    setSaving(false);
    if (e) { toast.error(e.message); return; }
    toast.success('Brand profile saved to the registry');
  };

  const applyToDomain = async () => {
    if (!edits) return;
    const { data: dom } = await supabase.from('domains').select('id').eq('domain_name', analyzedDomain).maybeSingle();
    if (!dom) { toast.error(`${analyzedDomain} is not in the registry — save the profile or register it first`); return; }
    const { error: e } = await supabase.from('domains')
      .update({ brand_color: edits.primary, accent_color: edits.accent, tagline: edits.slogan })
      .eq('id', dom.id);
    if (e) { toast.error(e.message); return; }
    toast.success('Branding applied to the live domain');
  };

  const primary = edits?.primary || '#00D9FF';
  const accent = edits?.accent || '#7C3AED';

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] mb-5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
              <span className="kicker text-cyan-300/80">AI venture foundry</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-cinematic text-balance text-white mb-4">
              Every domain is <span className="text-gradient-cyan">an institution waiting to deploy.</span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              The intelligence engine scores the asset, then generates a complete sovereign identity — tone, palette, typography, narrative, venture concepts and monetization — ready to deploy.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); analyze(); }} className="glass-strong rounded-2xl p-2 mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., govmesh.ai"
                  className="w-full pl-12 pr-3 py-4 bg-transparent text-white placeholder:text-white/30 text-lg focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 flex items-center gap-2">
                {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating</> : <><Sparkles className="w-4 h-4" /> Generate brand</>}
              </button>
            </div>
          </form>

          {error && (
            <div className="max-w-2xl mx-auto mb-6 glass rounded-xl p-4 flex items-start gap-3 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {['govmesh.ai', 'payvera.ai', 'neuralforge.io'].map((s) => (
                <button key={s} onClick={() => { setDomain(s); analyze(s); }} className="glass rounded-xl px-4 py-3 text-left hover:glass-strong transition">
                  <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Try</div>
                  <div className="text-white font-medium">{s}</div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
                <Brain className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-white font-semibold text-lg mb-2">Synthesizing brand identity…</div>
              <div className="space-y-1.5 max-w-md mx-auto text-xs font-mono text-white/40">
                <div>→ scoring 12 intelligence dimensions</div>
                <div>→ deriving palette · typography · tone</div>
                <div>→ generating concepts · monetization · pitch</div>
              </div>
            </div>
          )}

          {result && edits && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Identity hero */}
              <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] opacity-30 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)` }} />
                <div className="grid lg:grid-cols-[auto_1fr_180px] gap-8 items-center relative">
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, boxShadow: `0 0 50px ${primary}40` }}>
                    {monogram(analyzedDomain)}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Generated identity</div>
                    <div className="text-4xl font-bold text-white mb-2">{analyzedDomain}</div>
                    <input value={edits.slogan} onChange={(e) => setEdits({ ...edits, slogan: e.target.value })}
                      className="w-full bg-transparent text-xl text-white/80 font-light mb-3 border-b border-transparent hover:border-white/10 focus:border-cyan-400/40 focus:outline-none transition" />
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase">{result.industry_category}</span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase">{result.confidence_score}% confidence</span>
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase">
                        ${(result.estimated_value_low / 1000).toFixed(0)}k - ${(result.estimated_value_high / 1000).toFixed(0)}k
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/60 text-xs font-mono">{result.model_used}</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ValuationRing score={result.overall_score} size={160} label="OVERALL" gradient={[primary, accent]} />
                  </div>
                </div>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {([
                  { label: 'Brand', val: result.brand_strength },
                  { label: 'Memorability', val: result.memorability },
                  { label: 'SEO', val: result.seo_potential },
                  { label: 'AI Relevance', val: result.ai_relevance },
                  { label: 'Market', val: result.market_alignment },
                  { label: 'Startup', val: result.startup_viability },
                  { label: 'Sovereign', val: result.sovereign_potential },
                  { label: 'Trend', val: result.market_trend_alignment ?? 0 },
                  { label: 'Enterprise', val: result.enterprise_suitability ?? 0 },
                ] as Array<{ label: string; val: number }>).map((m) => (
                  <div key={m.label} className="glass rounded-xl p-3 flex flex-col items-center">
                    <ValuationRing score={m.val} size={66} label={m.label} gradient={[primary, accent]} />
                  </div>
                ))}
              </div>

              {/* Brand system + editable studio controls */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="glass-strong rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-cyan-400" /><div className="text-white font-semibold">Brand System</div></div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Palette</div>
                    <div className="flex gap-3">
                      {([['Primary', 'primary'], ['Accent', 'accent']] as Array<[string, 'primary' | 'accent']>).map(([label, key]) => (
                        <div key={key} className="flex-1">
                          <div className="h-14 rounded-lg border border-white/10 mb-1.5 relative overflow-hidden" style={{ background: edits[key] }}>
                            <input type="color" value={edits[key]} onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40 font-mono uppercase">{label}</span>
                            <span className="text-[10px] text-white/60 font-mono">{edits[key]}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex-1">
                        <div className="h-14 rounded-lg border border-white/10 mb-1.5" style={{ background: result.brand_palette?.neutral || '#0A0E27' }} />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/40 font-mono uppercase">Surface</span>
                          <span className="text-[10px] text-white/60 font-mono">{result.brand_palette?.neutral}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5 flex items-center gap-1.5">Brand tone</div>
                    <input value={edits.brand_tone} onChange={(e) => setEdits({ ...edits, brand_tone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="glass rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1.5"><Type className="w-3 h-3" /> Typography</div>
                      <div className="text-sm text-white/80">{result.typography_direction}</div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1.5"><Layout className="w-3 h-3" /> UI direction</div>
                      <div className="text-sm text-white/80">{result.ui_style}</div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Logo concept</div>
                      <div className="text-sm text-white/80">{result.logo_concept}</div>
                    </div>
                  </div>
                </div>

                {/* Landing preview — templated mockup using the live brand colors */}
                <div className="glass-strong rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4"><Layout className="w-4 h-4 text-cyan-400" /><div className="text-white font-semibold">Landing Preview</div></div>
                  <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: result.brand_palette?.neutral || '#0A0E27' }}>
                    <div className="px-5 py-3 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>{monogram(analyzedDomain)}</div>
                        <span className="text-white text-xs font-semibold">{analyzedDomain}</span>
                      </div>
                      <div className="px-2 py-1 rounded text-[9px] font-mono text-white" style={{ background: primary }}>{edits.cta}</div>
                    </div>
                    <div className="px-5 py-10 text-center relative overflow-hidden">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full blur-[90px] opacity-40" style={{ background: primary }} />
                      <input value={edits.headline} onChange={(e) => setEdits({ ...edits, headline: e.target.value })}
                        className="relative w-full text-center bg-transparent text-2xl font-bold text-white mb-2 focus:outline-none" />
                      <input value={edits.subhead} onChange={(e) => setEdits({ ...edits, subhead: e.target.value })}
                        className="relative w-full text-center bg-transparent text-sm text-white/60 mb-5 focus:outline-none" />
                      <div className="relative inline-flex gap-2">
                        <input value={edits.cta} onChange={(e) => setEdits({ ...edits, cta: e.target.value })}
                          className="px-4 py-2 rounded-lg text-white text-sm font-semibold text-center focus:outline-none" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, width: `${Math.max(8, edits.cta.length)}ch` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/30 font-mono mt-2 text-center">Live preview · fields are editable</div>
                </div>
              </div>

              {/* Market positioning + investor narrative */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="glass-strong rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-cyan-400" /><div className="text-white font-semibold">Market Positioning</div></div>
                  <p className="text-white/75 leading-relaxed text-sm">{result.market_positioning}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">Elevator pitch</div>
                    <p className="text-white/70 leading-relaxed text-sm italic">{result.elevator_pitch}</p>
                  </div>
                </div>
                <div className="glass-strong rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-400" /><div className="text-white font-semibold">Investor Narrative</div></div>
                  <p className="text-white/75 leading-relaxed text-sm">{result.investor_narrative}</p>
                </div>
              </div>

              {/* Monetization */}
              {result.monetization && result.monetization.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-emerald-400" /><h3 className="text-xl font-bold text-white">Monetization Model</h3></div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {result.monetization.map((m, i) => (
                      <div key={i} className="glass rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)`, border: `1px solid ${primary}40` }}>
                          <DollarSign className="w-4 h-4" style={{ color: primary }} />
                        </div>
                        <div className="text-white font-bold mb-1">{m.model}</div>
                        <div className="text-white/50 text-sm leading-relaxed">{m.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Startup concepts */}
              <div>
                <div className="flex items-center gap-2 mb-4"><Rocket className="w-5 h-5 text-amber-400" /><h3 className="text-xl font-bold text-white">Startup Concepts</h3></div>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.startup_concepts.map((c, i) => (
                    <div key={i} className="glass rounded-xl p-5 hover:glass-strong transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)`, border: `1px solid ${primary}40` }}>
                          <Layers className="w-4 h-4" style={{ color: primary }} />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 px-2 py-0.5 rounded bg-white/5">{c.category}</span>
                      </div>
                      <div className="text-white font-bold text-lg mb-1">{c.title}</div>
                      <div className="text-white/50 text-sm leading-relaxed">{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save bar */}
              <div className="glass-strong rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 sticky bottom-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${primary}20`, border: `1px solid ${primary}40` }}>
                    <Megaphone className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Brand identity for <span style={{ color: primary }}>{analyzedDomain}</span></div>
                    <div className="text-xs text-white/50">Save the package, or apply the palette + slogan to the live registry domain.</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { window.location.href = '/deploy'; }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:glass-strong text-white font-semibold text-sm">
                    <Building2 className="w-4 h-4 text-cyan-400" /> Deploy
                  </button>
                  <button onClick={applyToDomain} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:glass-strong text-white font-semibold text-sm">
                    <ExternalLink className="w-4 h-4" /> Apply to domain
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-50">
                    {saving ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving</> : <><Save className="w-4 h-4" /> Save brand profile</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default StudioPage;
