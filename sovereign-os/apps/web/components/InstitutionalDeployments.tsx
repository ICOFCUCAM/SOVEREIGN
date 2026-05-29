import { Reveal } from './Reveal';

// Deployment Surfaces — the four institutional sectors the platform serves.
// Typographic only (definition list, no cards). Surface name + one-line
// operating posture description per sector.

const SURFACES: Array<{ name: string; body: string }> = [
  {
    name: 'National Governments',
    body: 'Coordinate public information, crisis communication and executive messaging.',
  },
  {
    name: 'Financial Institutions',
    body: 'Maintain narrative consistency across regulatory, investor and public channels.',
  },
  {
    name: 'Media Networks',
    body: 'Operate production, distribution and monitoring from a unified command surface.',
  },
  {
    name: 'Enterprise Organizations',
    body: 'Coordinate communications, stakeholder relations and intelligence under one doctrine.',
  },
];

export function InstitutionalDeployments() {
  return (
    <section id="deployments" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">DEPLOYMENT SURFACES</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Where the institution deploys it.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Four institutional sectors operate Emergency AI as their public-information and strategic-communications substrate. The platform is engagement-scoped; institutional mandates are confirmed on briefing.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {SURFACES.map((s) => (
            <div key={s.name} className="grid grid-cols-1 items-baseline gap-3 py-10 sm:grid-cols-[1fr_2fr] sm:gap-12">
              <dt className="font-serif text-[24px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                {s.name}
              </dt>
              <dd className="text-[15px] leading-[1.75] text-emrg-ink">
                {s.body}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
          Engagement-scoped · briefing-led · institutional mandate confirmed on review
        </p>
      </div>
    </section>
  );
}
