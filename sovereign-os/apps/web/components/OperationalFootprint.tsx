import { Reveal } from './Reveal';

// Operational Footprint — institutional scope and posture, surfaced
// typographically. No cards: a header column and a definition-list of
// scope rows, each separated by a hairline.

const ROWS: Array<{ value: string; label: string; detail: string }> = [
  { value: '7',                 label: 'Operational regions',    detail: 'Carried across four sovereign edge meshes.' },
  { value: '24 / 7',            label: 'Continuous audit',       detail: 'Generation · Distribution · Intelligence — under one log.' },
  { value: '99.99%',            label: 'Continuity SLA',         detail: 'Operational continuity, not advertised uptime.' },
  { value: 'Sovereign',         label: 'Jurisdiction posture',   detail: 'Default by mandate; tenant-configurable on request.' },
  { value: 'Tenant-isolated',   label: 'Compliance posture',     detail: 'Row-level by default; dedicated databases on mandate.' },
  { value: 'Chain-of-custody',  label: 'Provenance',             detail: 'Recorded on every artefact, defensible end to end.' },
];

export function OperationalFootprint() {
  return (
    <section id="footprint" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">OPERATIONAL FOOTPRINT</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Where the institutional voice carries.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Emergency AI runs across seven sovereign regions under continuous audit posture. Tenancy is institutional; provenance is non-negotiable; the platform is configured to respect sovereignty by default and re-configured against it only on explicit mandate.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {ROWS.map((r) => (
            <div key={r.label} className="grid grid-cols-1 items-baseline gap-3 py-7 sm:grid-cols-[180px_220px_1fr] sm:gap-10">
              <dt className="font-serif text-[28px] font-medium leading-none tracking-[-0.015em] text-emrg-cream">
                {r.value}
              </dt>
              <dd className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
                {r.label}
              </dd>
              <dd className="text-[15px] leading-[1.7] text-emrg-ink">
                {r.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
