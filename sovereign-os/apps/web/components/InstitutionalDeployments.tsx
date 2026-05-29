import { Reveal } from './Reveal';

// Deployment Surfaces — four institutional sectors operating Emergency AI as
// their strategic-communications infrastructure. Each sector receives a
// fuller narrative paragraph describing how the institution typically
// deploys the substrate. Typographic only (definition list, no cards).

const SURFACES: Array<{ name: string; lead: string; body: string }> = [
  {
    name: 'National Governments',
    lead: 'Coordinate public information, crisis communication and executive messaging.',
    body: 'From electoral cycles through sovereign crises, the infrastructure carries the authoritative voice across ministries, agencies and regions. Provenance is retained on every artefact; the audit trail is institutional; jurisdictional posture is respected by default.',
  },
  {
    name: 'Financial Institutions',
    lead: 'Maintain narrative consistency across regulatory, investor and public channels.',
    body: 'Earnings cycles, supervisory engagement and reputational exposure operate under one doctrine — never improvised under pressure. The substrate coordinates investor relations, regulatory dispatch and executive voice with a single defensible audit posture.',
  },
  {
    name: 'Media Networks',
    lead: 'Operate production, distribution and monitoring from a unified command surface.',
    body: 'Editorial cadence, format presets and channel orchestration unified end to end. House voice and narrative continuity carried through every output. Newsroom coordination treated as institutional infrastructure rather than improvised workflow.',
  },
  {
    name: 'Enterprise Organizations',
    lead: 'Coordinate communications, stakeholder relations and intelligence under one doctrine.',
    body: 'Product launches, corporate affairs, crisis posture and executive surfaces operated under the same audit log. Stakeholder intelligence and revenue posture treated as first-class institutional layers — not as marketing tooling.',
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
              Four institutional sectors operate Emergency AI as their strategic communications infrastructure. The engagement is institutional; the mandate is confirmed on briefing.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {SURFACES.map((s) => (
            <div key={s.name} className="grid grid-cols-1 gap-6 py-12 sm:grid-cols-[260px_1fr] sm:gap-14">
              <dt>
                <div className="font-serif text-[24px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                  {s.name}
                </div>
                <p className="mt-3 text-[13px] leading-[1.65] text-emrg-mute">
                  {s.lead}
                </p>
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
