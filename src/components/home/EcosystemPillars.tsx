import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Server } from 'lucide-react';

interface Pillar { label: string; desc: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent: string }
const PILLARS: Pillar[] = [
  { label: 'Governance', desc: 'Civic & electoral systems', icon: Scale, accent: '#6366F1' },
  { label: 'Finance', desc: 'Sovereign banking rails', icon: Banknote, accent: '#10B981' },
  { label: 'Mobility', desc: 'Logistics & transport', icon: Truck, accent: '#F59E0B' },
  { label: 'Intelligence', desc: 'AI cognition & knowledge', icon: Cpu, accent: '#7C4DFF' },
  { label: 'Education', desc: 'Learning & credentials', icon: GraduationCap, accent: '#22D3EE' },
  { label: 'Commerce', desc: 'Markets & acquisition', icon: ShoppingCart, accent: '#00C2FF' },
  { label: 'Infrastructure', desc: 'Sovereign cloud & edge', icon: Server, accent: '#00E599' },
];

const EcosystemPillars: React.FC = () => (
  <section className="py-32 sm:py-44 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">The sovereign ecosystem</div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98]">
          One operating layer. Seven domains.
        </h2>
      </div>

      <div className="relative">
        {/* glowing infrastructure route connecting the pillars */}
        <div className="absolute hidden md:block left-0 right-0 top-[34px] h-px bg-white/10" />
        <div className="absolute hidden md:block left-0 right-0 top-[34px] h-px overflow-hidden">
          <div className="h-px w-[40%] animate-ticker" style={{ background: 'linear-gradient(90deg, transparent, #00D9FF, transparent)' }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-y-12 gap-x-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} to="/ecosystem" className="group flex flex-col items-center text-center">
                {/* node */}
                <span className="relative z-10 w-[68px] h-[68px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity" style={{ background: p.accent }} />
                  <Icon className="relative w-6 h-6" style={{ color: p.accent }} />
                </span>
                {/* vertical light beam */}
                <span className="w-px h-12 mt-3" style={{ background: `linear-gradient(to bottom, ${p.accent}66, transparent)` }} />
                <div className="text-sm font-semibold text-white mt-3">{p.label}</div>
                <div className="text-[11px] text-white/40 mt-1 leading-snug max-w-[130px]">{p.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default EcosystemPillars;
