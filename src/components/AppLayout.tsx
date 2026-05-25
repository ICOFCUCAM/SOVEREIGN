import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Sparkles, Wand2, BarChart3, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import CinematicHero from '@/components/home/CinematicHero';
import TransformationFlow from '@/components/home/TransformationFlow';
import CompanyShowcase from '@/components/home/CompanyShowcase';

/** Minimal, real scale signals — no fabricated metrics. */
const ScaleStrip: React.FC = () => {
  const [stats, setStats] = useState({ domains: 0, value: 0, identities: 0 });

  useEffect(() => {
    (async () => {
      const [d, b] = await Promise.all([
        supabase.from('domains').select('price_usd').eq('status', 'active'),
        supabase.from('brand_profiles').select('id', { count: 'exact', head: true }),
      ]);
      const rows = (d.data || []) as Pick<Domain, 'price_usd'>[];
      setStats({
        domains: rows.length,
        value: rows.reduce((s, r) => s + Number(r.price_usd || 0), 0),
        identities: b.count || 0,
      });
    })();
  }, []);

  const items = [
    { label: 'Premium domains', value: stats.domains.toLocaleString() },
    { label: 'Portfolio value', value: `$${(stats.value / 1000).toFixed(0)}k` },
    { label: 'AI identities generated', value: stats.identities.toLocaleString() },
    { label: 'Intelligence dimensions', value: '12' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-white/5">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 text-center">
        {items.map((m) => (
          <div key={m.label}>
            <div className="text-4xl sm:text-5xl font-bold tracking-tighter text-white tabular-nums">{m.value}</div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 mt-2">{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const VisionStatement: React.FC = () => (
  <section className="py-32 sm:py-44 px-4">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter leading-tight text-white/90">
        We are building the operating layer for{' '}
        <span className="text-gradient-cyan">deployable digital institutions.</span>
      </h2>
    </div>
  </section>
);

const EntryGrid: React.FC = () => {
  const entries = [
    { to: '/marketplace', label: 'Marketplace', desc: 'Browse the sovereign domain inventory.', icon: LayoutGrid },
    { to: '/valuation', label: 'AI Valuation', desc: 'Score any domain in seconds.', icon: Sparkles },
    { to: '/studio', label: 'Branding Studio', desc: 'Turn a domain into a brand identity.', icon: Wand2 },
    { to: '/admin', label: 'Command Center', desc: 'Operate the platform.', icon: BarChart3 },
  ];
  return (
    <section className="pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {entries.map((e) => {
            const Icon = e.icon;
            return (
              <Link key={e.to} to={e.to}
                className="group rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03] hover:border-white/20 transition-all">
                <Icon className="w-5 h-5 text-cyan-400 mb-4" />
                <div className="text-white font-semibold mb-1 flex items-center gap-1.5">
                  {e.label}
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:translate-x-1 group-hover:text-white/60 transition-all" />
                </div>
                <div className="text-white/45 text-sm leading-relaxed">{e.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative">
        <CinematicHero />
        <TransformationFlow />
        <ScaleStrip />
        <CompanyShowcase />
        <VisionStatement />
        <EntryGrid />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
