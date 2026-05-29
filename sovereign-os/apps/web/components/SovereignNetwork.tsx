import { Reveal } from './Reveal';

// Sovereign Infrastructure Network — ecosystem context. Emergency AI
// operates independently or composes as a layer within other Sovereign
// deployments. Typographic only: editorial intro + a list of the
// sibling systems.

const SIBLINGS: Array<{ name: string; role: string }> = [
  { name: 'CIVICOS · National Shell',  role: 'Sovereign government runtime.' },
  { name: 'TreasuryOS',                role: 'Sovereign financial operating system.' },
  { name: 'JusticeOS',                 role: 'Judicial and integrity infrastructure.' },
  { name: 'EducationOS',               role: 'National learning and credentialing substrate.' },
  { name: 'HealthOS',                  role: 'Population-scale health information infrastructure.' },
  { name: 'Veritas Operations',        role: 'Sovereign operations command surface.' },
];

export function SovereignNetwork() {
  return (
    <section id="network" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">SOVEREIGN INFRASTRUCTURE NETWORK</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Part of a larger institutional substrate.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Emergency AI operates independently as institutional infrastructure, or composes as a layer within broader Sovereign deployments. Each sibling system carries the same audit posture, the same sovereign jurisdiction and the same institutional tenancy model.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {SIBLINGS.map((s) => (
            <div key={s.name} className="grid grid-cols-1 items-baseline gap-3 py-7 sm:grid-cols-[1fr_1.6fr] sm:gap-12">
              <dt className="font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                {s.name}
              </dt>
              <dd className="text-[15px] leading-[1.75] text-emrg-ink">
                {s.role}
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
