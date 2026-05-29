import React from 'react';

// Ecosystem Flow Diagram — typographic / monospace, no SVG, no animation.
// Reads as an institutional architecture document: producers carry signal
// and operations; Dispatch carries the rendered output.

const InfrastructureFlow: React.FC = () => {
  return (
    <section id="flow" className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <div className="kicker text-cyan-300/70" style={{ letterSpacing: '0.32em' }}>ECOSYSTEM FLOW</div>
          <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold tracking-cinematic leading-[0.98]">
            Signal · Operations · Publication.
          </h2>
          <p className="mt-5 text-white/55 text-base leading-relaxed">
            Four substrate producers feed two operating layers; operations run internally or hand off to Sovereign Dispatch for institutional publication.
          </p>
        </div>

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

        <p className="mt-8 text-center text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
          Producers carry intelligence and operations · Dispatch carries the rendered output
        </p>
      </div>
    </section>
  );
};

export default InfrastructureFlow;
