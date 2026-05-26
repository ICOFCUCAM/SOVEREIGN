import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import type { ValuationReport } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ValuationRing from '@/components/ValuationRing';
import { Sparkles, Search, Brain, Rocket, Layers, Zap, TrendingUp, AlertCircle } from 'lucide-react';

const ValuationPage: React.FC = () => {
  useDocumentTitle('AI Valuation', 'Institutional-grade AI valuation for any domain — intelligence scoring, market positioning and sovereign readiness in seconds.');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationReport | null>(null);
  const [analyzedDomain, setAnalyzedDomain] = useState('');
  const [error, setError] = useState('');

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!normalized) return;
    if (!normalized.includes('.')) { setError('Include the TLD (e.g., yourname.ai)'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const { data, error: e } = await supabase.functions.invoke('ai-valuation', { body: { domain: normalized } });
      if (e) throw e;
      setResult(data as ValuationReport);
      setAnalyzedDomain(normalized);
    } catch (err) {
      setError('Engine timed out. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 rounded-full glass mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">AI Intelligence Engine</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter text-white mb-4">
              Value any domain in <span className="text-gradient-cyan">seconds.</span>
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              Our scoring kernel evaluates 12 dimensions — brandability, memorability, SEO, AI relevance, market alignment, sovereign potential — then synthesizes an investor-grade narrative.
            </p>
          </div>

          <form onSubmit={analyze} className="glass-strong rounded-2xl p-2 mb-8 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type="text" value={domain} onChange={e => setDomain(e.target.value)}
                  placeholder="e.g., quantumledger.ai"
                  className="w-full pl-12 pr-3 py-4 bg-transparent text-white placeholder:text-white/30 text-lg focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 flex items-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analyzing</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Analyze</>
                )}
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
              {['payvera.ai', 'govmesh.ai', 'sovereign.cloud'].map(s => (
                <button key={s} onClick={() => setDomain(s)} className="glass rounded-xl px-4 py-3 text-left hover:glass-strong transition">
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
              <div className="text-white font-semibold text-lg mb-2">Running intelligence kernels...</div>
              <div className="space-y-1.5 max-w-md mx-auto text-xs font-mono text-white/40">
                <div>→ lexical analysis · vowel ratio · keyword density</div>
                <div>→ TLD authority scoring · market category mapping</div>
                <div>→ sovereign-potential modeling · AI relevance fusion</div>
                <div>→ synthesizing investor-grade narrative</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="glass-strong rounded-2xl p-8">
                <div className="grid lg:grid-cols-[200px_1fr] gap-8 items-center">
                  <ValuationRing score={result.overall_score} size={180} label="OVERALL" />
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Analyzed</div>
                    <div className="text-4xl font-bold text-white mb-2">{analyzedDomain}</div>
                    <div className="text-xl text-white/70 mb-4 font-light">{result.slogan}</div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase">{result.industry_category}</div>
                      <div className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase">{result.confidence_score}% confidence</div>
                      <div className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase">
                        ${(result.estimated_value_low/1000).toFixed(0)}k - ${(result.estimated_value_high/1000).toFixed(0)}k
                      </div>
                    </div>
                    <p className="text-white/70 leading-relaxed">{result.narrative}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Brand', val: result.brand_strength },
                  { label: 'Memorability', val: result.memorability },
                  { label: 'SEO', val: result.seo_potential },
                  { label: 'AI Relevance', val: result.ai_relevance },
                  { label: 'Market', val: result.market_alignment },
                  { label: 'Startup', val: result.startup_viability },
                  { label: 'Sovereign', val: result.sovereign_potential },
                ].map(m => (
                  <div key={m.label} className="glass rounded-xl p-4 flex flex-col items-center">
                    <ValuationRing score={m.val} size={80} label={m.label} />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="w-5 h-5 text-amber-400" />
                  <h3 className="text-2xl font-bold text-white">Startup concepts auto-generated</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.startup_concepts.map((c, i) => (
                    <div key={i} className="glass rounded-xl p-5 hover:glass-strong transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40 flex items-center justify-center">
                          <Layers className="w-4 h-4 text-cyan-300" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 px-2 py-0.5 rounded bg-white/5">{c.category}</span>
                      </div>
                      <div className="text-white font-bold text-lg mb-1">{c.title}</div>
                      <div className="text-white/50 text-sm leading-relaxed">{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Ready to acquire <span className="text-cyan-400">{analyzedDomain}</span>?</div>
                    <div className="text-xs text-white/50">List it in the sovereign marketplace or deploy a startup directly.</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                  <button onClick={() => window.location.href = `/studio/${encodeURIComponent(analyzedDomain)}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
                    <Sparkles className="w-4 h-4" /> Build in Studio
                  </button>
                  <button onClick={() => window.location.href = '/marketplace'} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl glass hover:glass-strong text-white font-semibold">
                    <Zap className="w-4 h-4 text-cyan-400" /> Explore marketplace
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

export default ValuationPage;
