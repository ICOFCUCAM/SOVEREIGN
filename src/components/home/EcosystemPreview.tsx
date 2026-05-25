import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Banknote, Cpu, Truck, ShoppingCart, ArrowRight } from 'lucide-react';

// High-level sectors — the homepage previews the ecosystem; the hub holds the systems.
const SECTORS = [
  { label: 'Governance & Integrity', systems: 'CivicOS · ACT · ELECPRO', icon: Landmark, accent: '#6366F1' },
  { label: 'Finance & Banking', systems: 'Veritas Financial · Mobile Pay', icon: Banknote, accent: '#3B82F6' },
  { label: 'Knowledge & Intelligence', systems: 'VeritasOS · EduPro', icon: Cpu, accent: '#22D3EE' },
  { label: 'Logistics & Mobility', systems: 'FlyttGo', icon: Truck, accent: '#10B981' },
  { label: 'Commerce & Deployment', systems: 'Marketplace · Deployment Engine', icon: ShoppingCart, accent: '#F59E0B' },
];

const EcosystemPreview: React.FC = () => {
  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-4">The ecosystem</div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tighter leading-[0.95]">Sovereign infrastructure,<br />by sector.</h2>
            <p className="text-white/50 mt-4 max-w-md leading-relaxed">Deployable institutions spanning governance, finance, intelligence, logistics, and commerce — explore the full network.</p>
          </div>
          <Link to="/ecosystem" className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#05071A] font-semibold text-sm self-start">
            Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to="/ecosystem"
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-500 p-6">
                <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full blur-[90px] opacity-20 group-hover:opacity-35 transition-opacity" style={{ background: s.accent }} />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}33` }}>
                    <Icon className="w-5 h-5" style={{ color: s.accent }} />
                  </div>
                  <div className="text-lg font-bold text-white mb-1">{s.label}</div>
                  <div className="text-sm text-white/45 font-mono">{s.systems}</div>
                  <ArrowRight className="w-4 h-4 mt-5 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EcosystemPreview;
