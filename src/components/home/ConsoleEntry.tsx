import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Boxes, LayoutGrid, Sparkles, Wand2, Rocket, BarChart3 } from 'lucide-react';

interface Access { to: string; code: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
const ACCESS: Access[] = [
  { to: '/ecosystem', code: 'ECO', label: 'Ecosystem', desc: 'Infrastructure atlas', icon: Boxes },
  { to: '/marketplace', code: 'MKT', label: 'Marketplace', desc: 'Sovereign inventory', icon: LayoutGrid },
  { to: '/valuation', code: 'VAL', label: 'AI Valuation', desc: 'Asset intelligence', icon: Sparkles },
  { to: '/studio', code: 'BRD', label: 'Branding Studio', desc: 'Identity generation', icon: Wand2 },
  { to: '/deploy', code: 'DPL', label: 'Deployment Engine', desc: 'Provision & launch', icon: Rocket },
  { to: '/admin', code: 'CMD', label: 'Command Center', desc: 'Operate the platform', icon: BarChart3 },
];

const ConsoleEntry: React.FC = () => (
  <section className="py-28 sm:py-40 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="relative rounded-3xl border border-white/10 overflow-hidden">
        <div className="absolute -inset-10 blur-[90px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 25% 20%, #00C2FF, transparent 55%), radial-gradient(circle at 80% 90%, #7C4DFF, transparent 55%)' }} />
        <div className="relative grid lg:grid-cols-2">
          {/* vision */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Access · operating layer
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.7rem] font-bold tracking-tight leading-[1.05] mb-5">
              <span className="text-white">The operating layer for </span>
              <span className="text-gradient-cyan">deployable digital institutions.</span>
            </h2>
            <p className="text-white/55 leading-relaxed max-w-md mb-8">
              Domains become institutions. Institutions become operational systems. Systems become economies — deployed sovereign, at civilization scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 36px rgba(0,194,255,0.28)' }}>
                Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold hover:bg-white/5 transition-all">
                Explore Marketplace
              </Link>
            </div>
          </div>

          {/* access console */}
          <div className="relative border-t lg:border-t-0 lg:border-l border-white/10 bg-black/20">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">sovereign://access</span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> 6 layers</span>
            </div>
            <div className="divide-y divide-white/5">
              {ACCESS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to} className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                    <span className="text-[10px] font-mono text-cyan-300/60 w-9 shrink-0">{a.code}</span>
                    <span className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-cyan-400/40 transition-colors">
                      <Icon className="w-4 h-4 text-cyan-300" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{a.label}</div>
                      <div className="text-[11px] font-mono text-white/40">{a.desc}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ConsoleEntry;
