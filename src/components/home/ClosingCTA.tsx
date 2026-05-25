import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ClosingCTA: React.FC = () => (
  <section className="relative overflow-hidden">
    {/* planetary infrastructure atmosphere */}
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(0,194,255,0.18), transparent 60%), radial-gradient(ellipse 50% 60% at 50% 130%, rgba(124,77,255,0.16), transparent 55%)' }} />
    <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.6), rgba(124,77,255,0.5), transparent)' }} />
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at 50% 100%, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 100%, black, transparent 70%)' }} />

    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-40 sm:py-52 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-9">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign infrastructure · operational
      </div>
      <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.98] mb-10">
        <span className="block text-white">The operating layer for</span>
        <span className="block text-gradient-cyan">deployable civilization.</span>
      </h2>
      <div className="flex justify-center">
        <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 48px rgba(0,194,255,0.32)' }}>
          Launch the ecosystem <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  </section>
);

export default ClosingCTA;
