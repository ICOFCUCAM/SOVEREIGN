import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MapNode } from '@/components/WorldMap';
import PlatformNav from '@/components/PlatformNav';

const WorldMap = lazy(() => import('@/components/WorldMap'));
const EDGE_NODES: MapNode[] = [
  { lon: -74, lat: 40.7, hub: true }, { lon: -46.6, lat: -23.5 }, { lon: -0.1, lat: 51.5, hub: true },
  { lon: 8.7, lat: 50.1 }, { lon: 3.4, lat: 6.5 }, { lon: 36.8, lat: -1.3 }, { lon: 55.3, lat: 25.2, hub: true },
  { lon: 72.8, lat: 19 }, { lon: 103.8, lat: 1.3, hub: true }, { lon: 139.7, lat: 35.7, hub: true },
  { lon: 151.2, lat: -33.9 }, { lon: -118, lat: 34 }, { lon: 28, lat: -26.2 },
];
const EDGE_ARCS: Array<[number, number, number]> = [
  [0, 2, 0], [2, 6, 0.5], [6, 8, 1], [8, 9, 0.4], [0, 11, 1.2], [6, 7, 0.3], [8, 10, 0.9], [2, 4, 1.4], [0, 1, 1.1],
];
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  ShoppingCart, Sparkles, Boxes, Wand2, Rocket, Globe, CheckCircle2, ArrowRight,
  LayoutDashboard, Cpu, Banknote, Landmark, Truck, Briefcase,
} from 'lucide-react';

const STAGES = [
  { label: 'Acquire', sub: 'Secure the domain & institution', icon: ShoppingCart },
  { label: 'Generate', sub: 'AI architecture & brand identity', icon: Sparkles },
  { label: 'Provision', sub: 'Database, auth, infrastructure', icon: Boxes },
  { label: 'Inject branding', sub: 'Palette, copy, UI system', icon: Wand2 },
  { label: 'Deploy', sub: 'CI/CD to sovereign edge', icon: Rocket },
  { label: 'Live', sub: 'DNS + SSL · globally resolved', icon: Globe },
];

const STACKS = [
  { label: 'Government runtime', icon: Landmark },
  { label: 'Financial system', icon: Banknote },
  { label: 'Intelligence platform', icon: Cpu },
  { label: 'Logistics network', icon: Truck },
  { label: 'Sovereign marketplace', icon: ShoppingCart },
  { label: 'Operations command', icon: LayoutDashboard },
  { label: 'Institutional console', icon: Briefcase },
  { label: 'National portal', icon: Globe },
];

const INTEGRATIONS = ['Vercel', 'Supabase', 'Stripe', 'Cloudflare', 'Email', 'Redis'];

const DeployPage: React.FC = () => {
  useDocumentTitle('Deployment Engine', 'Sovereign provisioning infrastructure — from acquisition to live institution across a global edge mesh in seconds.');
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/45 text-[11px] font-mono uppercase tracking-[0.28em] mb-6">
              The deployment engine
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tighter leading-[0.95] mb-5">
              From acquisition to <span className="text-gradient-cyan">live institution.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Acquire an institution and the engine provisions its full stack — architecture, branding, database, auth, payments, and edge deployment — and brings it live on sovereign infrastructure.
            </p>
          </div>

          {/* Pipeline */}
          <Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {STAGES.map((s, i) => {
                const Icon = s.icon;
                const on = i <= active;
                return (
                  <div key={s.label} className="relative">
                    <div className={`glass rounded-2xl p-5 h-full transition-all duration-500 ${i === active ? 'glass-strong' : ''}`} style={i === active ? { boxShadow: '0 0 40px rgba(0,217,255,0.15)' } : undefined}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all"
                        style={{ background: on ? 'linear-gradient(135deg,#00D9FF,#7C3AED)' : 'rgba(255,255,255,0.05)' }}>
                        <Icon className={`w-5 h-5 ${on ? 'text-white' : 'text-white/40'}`} />
                      </div>
                      <div className="text-[9px] font-mono text-white/30 mb-1">{String(i + 1).padStart(2, '0')}</div>
                      <div className={`font-semibold text-sm ${on ? 'text-white' : 'text-white/50'}`}>{s.label}</div>
                      <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-[10px] font-mono uppercase tracking-widest text-amber-300/70 flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Pipeline preview · provisioning integrations are activation-ready
            </div>
          </Reveal>

          {/* Global orchestration */}
          <Reveal>
            <div className="mt-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-cyan-300/70 mb-4">Global orchestration</div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tighter text-white">Deployed across a sovereign edge mesh.</h2>
              </div>
              <div className="relative" style={{ aspectRatio: '2 / 1' }}>
                <div className="absolute -inset-10 blur-[100px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, #00D9FF, transparent 70%)' }} />
                <Suspense fallback={<div className="w-full h-full" />}>
                  <WorldMap accent="#00D9FF" nodes={EDGE_NODES} arcs={EDGE_ARCS} className="w-full h-full" />
                </Suspense>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 mt-8 text-sm font-mono text-white/45">
                <span><span className="text-white">47</span> edge nodes</span>
                <span><span className="text-white">23</span> regions</span>
                <span><span className="text-white">87s</span> avg deploy</span>
                <span><span className="text-white">99.99%</span> uptime</span>
              </div>
            </div>
          </Reveal>

          {/* Supported stacks */}
          <Reveal>
            <div className="mt-24">
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tighter text-center mb-10">Generate any institution.</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STACKS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="glass rounded-xl p-5 flex items-center gap-3 hover:glass-strong transition">
                      <Icon className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span className="text-sm text-white/80">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Integrations */}
          <Reveal>
            <div className="mt-24 glass-strong rounded-2xl p-8 text-center">
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40 mb-5">Provisioning fabric</div>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                {INTEGRATIONS.map((i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {i}
                  </span>
                ))}
              </div>
              <Link to="/ecosystem" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition">
                Explore deployable systems <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default DeployPage;
