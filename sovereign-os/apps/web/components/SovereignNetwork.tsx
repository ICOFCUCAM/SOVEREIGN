import { Reveal } from './Reveal';

// Sovereign Infrastructure Network — Emergency AI's reference to the
// canonical seven flagships of the Sovereign substrate. Each row uses the
// official positioning verbatim. No cards — typographic definition list.

const STACK: Array<{ name: string; position: string }> = [
  { name: 'Veritas OS',                          position: 'Knowledge & Organizational Intelligence Infrastructure' },
  { name: 'Emergency AI',                        position: 'Strategic Intelligence Infrastructure' },
  { name: 'ELECPRO',                             position: 'Sovereign Electoral Infrastructure' },
  { name: 'Veritas Financial Sovereign Stack',   position: 'Financial Infrastructure for Civilizations' },
  { name: 'Civicos',                             position: 'Sovereign Operating Infrastructure' },
  { name: 'Veritas Operations',                  position: 'Autonomous Company Operations Infrastructure' },
  { name: 'Sovereign Dispatch',                  position: 'Institutional Publication Infrastructure' },
];

export function SovereignNetwork() {
  return (
    <section id="network" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">SOVEREIGN INFRASTRUCTURE STACK</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Seven infrastructures. One sovereign substrate.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Emergency AI is one of seven flagship infrastructures in the Sovereign substrate. Each operates independently and composes into broader sovereign deployments. Every artifact carries the same audit posture, the same sovereign jurisdiction and the same institutional tenancy model.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {STACK.map((s) => (
            <div key={s.name} className="grid grid-cols-1 items-baseline gap-3 py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-12">
              <dt className="font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                {s.name}
              </dt>
              <dd className="text-[11px] uppercase tracking-[0.28em] text-emrg-cream/75">
                {s.position}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
          One ecosystem · one audit posture · one sovereign jurisdiction
        </p>
      </div>
    </section>
  );
}
