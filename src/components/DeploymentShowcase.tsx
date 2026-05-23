import React, { useState } from 'react';
import { Rocket, Code2, Database, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

const stages = [
  { name: 'Concept Generation', desc: 'AI synthesizes startup concept from domain identity', duration: '~3s' },
  { name: 'Brand Package', desc: 'Logo direction, color system, typography, slogans', duration: '~12s' },
  { name: 'Architecture Scaffold', desc: 'Next.js + Supabase + Stripe + auth provisioned', duration: '~28s' },
  { name: 'Database Schema', desc: 'Migrations, RLS policies, seed data injected', duration: '~8s' },
  { name: 'DNS Configuration', desc: 'Cloudflare wildcard + SSL + propagation', duration: '~14s' },
  { name: 'Production Deploy', desc: 'Edge build · global CDN · health checks', duration: '~22s' },
];

const DeploymentShowcase: React.FC = () => {
  const [active, setActive] = useState(2);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 rounded-full glass mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">Deployment Engine</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
              From domain to deployed startup in <span className="text-gradient-cyan">87 seconds.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              The Instant Startup Foundry orchestrates concept synthesis, brand generation, infrastructure provisioning, and global deployment in a single autonomous pipeline. Vercel ships sites — we ship companies.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Next.js application + dashboard + auth',
                'Database + RLS + Stripe billing wired',
                'Cloudflare DNS + wildcard SSL automatic',
                'Email infrastructure + analytics + CMS',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition">
              <Rocket className="w-4 h-4" />
              Launch a Startup
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Pipeline Status</div>
                <div className="text-white font-semibold text-lg mt-0.5">payvera.ai → deploy</div>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">In Progress</span>
              </div>
            </div>

            <div className="space-y-2">
              {stages.map((s, i) => {
                const done = i < active;
                const current = i === active;
                return (
                  <div key={s.name}
                    onClick={() => setActive(i)}
                    className={`relative p-3 rounded-xl cursor-pointer transition-all ${
                      current ? 'bg-cyan-500/10 border border-cyan-500/30' :
                      done ? 'bg-emerald-500/5 border border-emerald-500/20' :
                      'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono ${
                        done ? 'bg-emerald-500/20 text-emerald-300' :
                        current ? 'bg-cyan-500/20 text-cyan-300' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${current ? 'text-white' : done ? 'text-white/80' : 'text-white/50'}`}>{s.name}</div>
                        <div className="text-[11px] text-white/40 truncate">{s.desc}</div>
                      </div>
                      <div className="text-[10px] font-mono text-white/40">{s.duration}</div>
                    </div>
                    {current && (
                      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-purple-500 animate-shimmer" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Runtime</div>
                <div className="text-white text-sm font-semibold">Edge · Vercel</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Region</div>
                <div className="text-white text-sm font-semibold">Multi · AFR</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">SSL</div>
                <div className="text-emerald-300 text-sm font-semibold">Wildcard ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeploymentShowcase;
