import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const CinematicHero: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      {/* Single restrained aura — atmosphere, not noise */}
      <div className="pointer-events-none absolute top-[22%] left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full bg-cyan-500/10 blur-[170px]" />

      <div className="relative max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/45 text-[11px] font-mono uppercase tracking-[0.28em] mb-9">
          Sovereign infrastructure
        </div>

        <h1 className="text-[2.75rem] sm:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.94] mb-7">
          Build sovereign digital
          <br />
          companies in <span className="text-gradient-cyan">minutes.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/55 max-w-xl mx-auto mb-11 leading-relaxed">
          Premium domains, analyzed by AI and transformed into deployable businesses.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/marketplace"
            className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition-all">
            Explore Domains
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/studio"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-all">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Launch Platform
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
};

export default CinematicHero;
