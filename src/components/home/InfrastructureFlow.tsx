import React from 'react';
import { Landmark, Users, Building2 } from 'lucide-react';

// Ecosystem Flow Diagram — customer-led framing. Government · Organizations ·
// Companies are positioned ABOVE the diagram; the seven infrastructures are
// shown as substrates these institutions deploy. Typographic / monospace.

const InfrastructureFlow: React.FC = () => {
  return (
    <section id="flow" className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto">

        {/* Customer-led header — institutions on top */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center justify-center gap-8 mb-7">
            <span className="inline-flex items-center gap-2.5 text-white/70">
              <Landmark className="w-5 h-5 text-cyan-300/70" />
              <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Government</span>
            </span>
            <span className="inline-flex items-center gap-2.5 text-white/70">
              <Users className="w-5 h-5 text-purple-300/70" />
              <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Organizations</span>
            </span>
            <span className="inline-flex items-center gap-2.5 text-white/70">
              <Building2 className="w-5 h-5 text-emerald-300/70" />
              <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Companies</span>
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-cinematic leading-[0.98] mb-5">
            Run everything. <span className="text-gradient-cyan">Sovereign scale or enterprise scale.</span>
          </h2>
          <p className="text-white/55 text-base sm:text-lg leading-relaxed">
            Any institution can run all critical functions on sovereign infrastructures — independently, securely and at any scale.
          </p>
        </div>

        {/* The flow diagram itself */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-10 overflow-x-auto">
          <pre className="font-mono text-[11px] sm:text-[13px] leading-[1.7] text-white/70 whitespace-pre min-w-[680px]">
{`  KNOWLEDGE             INTELLIGENCE          ELECTORAL              FINANCIAL
  Veritas OS            Emergency AI          ELECPRO                Veritas Financial
       │                     │                     │                       │
       │                     │                     │                       │
       └─────────────────────┴─────────────────────┴───────────────────────┘
                                       │
                                       ▼
                              OPERATIONAL LAYER
                ┌─────────────────────┬─────────────────────┐
                ▼                     ▼                     ▼
        Veritas Operations         Civicos              (composed)
        Enterprise                 Sovereign
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
                  SOVEREIGN DISPATCH
                  Publication Layer
                           │
   ┌───────────────┬───────┴───────┬─────────────────┬────────────────┐
   ▼               ▼               ▼                 ▼                ▼
 Publications    Reports     Briefing Packages   Institutional    Sovereign
                                                  Artifacts       Filings
`}
          </pre>
        </div>

        <p className="mt-10 text-center text-[10px] font-mono uppercase tracking-[0.32em] text-white/35">
          Independent infrastructures · Composable · Secure · Sovereign
        </p>
      </div>
    </section>
  );
};

export default InfrastructureFlow;
