import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Globe, Shield, Zap } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [domainCount, setDomainCount] = useState(0);
  const [valueLocked, setValueLocked] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setDomainCount(c => Math.min(c + 7, 1247)), 20);
    const t2 = setInterval(() => setValueLocked(v => Math.min(v + 137000, 24800000)), 15);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Status pill */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ring" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">Sovereign Mode Online</span>
            </div>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-xs text-white/60 font-mono">v3.0 · EDGE</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-6">
          <span className="text-white">The operating system</span>
          <br />
          <span className="text-gradient-cyan">for digital civilization.</span>
        </h1>

        <p className="text-center text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
          Sovereign-grade domain intelligence, AI-native deployment infrastructure, and autonomous venture creation.
          Every domain becomes a deployable institution, a monetizable brand, an AI-analyzed investment.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link to="/marketplace" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:shadow-xl hover:shadow-cyan-500/40 transition-all">
            Explore Marketplace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/valuation" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition-all">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Run AI Valuation
          </Link>
        </div>

        {/* Metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: 'Premium Domains', value: domainCount.toLocaleString(), suffix: '', icon: Globe, color: 'from-cyan-400 to-blue-500' },
            { label: 'Value Locked', value: `$${(valueLocked / 1000000).toFixed(1)}`, suffix: 'M', icon: Zap, color: 'from-purple-400 to-pink-500' },
            { label: 'Edge Nodes', value: '47', suffix: '', icon: Shield, color: 'from-emerald-400 to-cyan-500' },
            { label: 'AI Valuations', value: '12,400', suffix: '+', icon: Sparkles, color: 'from-amber-400 to-orange-500' },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="glass rounded-xl p-4 group hover:glass-strong transition">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center opacity-90`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">
                  {m.value}<span className="text-cyan-400">{m.suffix}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
