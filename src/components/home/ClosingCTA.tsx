import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

const ClosingCTA: React.FC = () => (
  <section className="relative overflow-hidden">
    {/* planetary atmosphere rising off the earth */}
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 118%, rgba(0,194,255,0.2), transparent 58%), radial-gradient(ellipse 55% 55% at 50% 128%, rgba(124,77,255,0.16), transparent 55%)' }} />
    {/* sovereign grid floor */}
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at 50% 100%, black, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 100%, black, transparent 70%)' }} />

    {/* photoreal earth — grounded horizon curving up from the bottom */}
    <div aria-hidden className="absolute left-1/2 -translate-x-1/2 bottom-[-42%] sm:bottom-[-76%] lg:bottom-[-86%] w-[185%] sm:w-[118%] lg:w-[100%] max-w-[1500px] aspect-square pointer-events-none">
      <img src="/hero-globe.webp" alt="" decoding="async" className="w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0 -10px 90px rgba(0,150,255,0.25))' }} />
    </div>
    {/* scrim so the headline always reads above the horizon */}
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 32%, rgba(5,8,22,0.55), transparent 60%)' }} />
    {/* atmospheric rim glow along the horizon */}
    <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 90% at 50% 100%, rgba(0,180,255,0.1), transparent 60%)' }} />
    <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.6), rgba(124,77,255,0.5), transparent)' }} />

    <HudCorners color="#00C2FF" className="opacity-25 max-w-7xl mx-auto inset-x-4 sm:inset-x-8" />

    {/* content sits above the horizon, with deep room beneath for the earth */}
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-40 pb-[26vh] sm:pb-[32vh] text-center">
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
