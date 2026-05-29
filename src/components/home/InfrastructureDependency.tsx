import React from 'react';

// Infrastructure Dependency Map — tier classification with arrows. Reads as
// a procurement / integration planning document. Typographic only.

interface Tier { name: string; role: string; members: string[]; }

const TIERS: Tier[] = [
  {
    name: 'Foundational',
    role: 'Knowledge substrate consumed by every other infrastructure.',
    members: ['Veritas OS'],
  },
  {
    name: 'Producers',
    role: 'Synthesise signal in their domain. Hand off to operations and publication.',
    members: ['Emergency AI', 'ELECPRO', 'Veritas Financial Sovereign Stack'],
  },
  {
    name: 'Operating',
    role: 'Run the institution. Sovereign scale or enterprise scale; composes producers.',
    members: ['Civicos', 'Veritas Operations'],
  },
  {
    name: 'Terminal',
    role: 'Publication endpoint for every upstream producer.',
    members: ['Sovereign Dispatch'],
  },
];

const InfrastructureDependency: React.FC = () => {
  return (
    <section id="dependency" className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <div className="kicker text-cyan-300/70" style={{ letterSpacing: '0.32em' }}>INFRASTRUCTURE DEPENDENCY</div>
          <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold tracking-cinematic leading-[0.98]">
            Foundational to terminal.
          </h2>
          <p className="mt-5 text-white/55 text-base leading-relaxed">
            Every infrastructure can stand alone. Recommended compositions are documented; nothing is required by default.
          </p>
        </div>

        <dl className="divide-y divide-white/8 border-y border-white/8">
          {TIERS.map((t, i) => (
            <div key={t.name} className="grid grid-cols-1 gap-y-4 py-8 sm:gap-y-5 lg:grid-cols-[140px_240px_1fr] lg:gap-x-10">
              <dt className="font-mono text-[12px] uppercase tracking-[0.32em] text-white/40 tabular-nums">
                Tier {String(i + 1).padStart(2, '0')}
              </dt>
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-white">{t.name}</div>
                <div className="mt-2 text-[13px] text-white/55 leading-[1.55]">{t.role}</div>
              </div>
              <dd className="flex flex-wrap gap-2.5">
                {t.members.map((m) => (
                  <span key={m} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] font-mono uppercase tracking-[0.18em] text-white/75">
                    <span className="w-1 h-1 rounded-full bg-cyan-300/70" />
                    {m}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-center text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
          Tier descending — foundational substrate above; publication terminal below
        </p>
      </div>
    </section>
  );
};

export default InfrastructureDependency;
