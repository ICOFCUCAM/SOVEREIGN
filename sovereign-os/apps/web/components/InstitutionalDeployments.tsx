import { Reveal } from './Reveal';

// Institutional Deployments — applied surfaces. Helps the visitor imagine
// real-world institutional context. Typographic only (definition list,
// no cards). Each row pairs an institutional surface with a one-line
// description of what the platform does in that context.

const DEPLOYMENTS: Array<{ surface: string; context: string }> = [
  {
    surface: 'National Communications Office',
    context: 'The information operating layer for a government voice. Coordinated dispatch under one audit log; provenance retained across every artefact.',
  },
  {
    surface: 'Ministerial Briefing Operations',
    context: 'Decision-ready briefings assembled from open-source signal and internal posture, delivered to the principals who must act.',
  },
  {
    surface: 'Election Information Infrastructure',
    context: 'Authoritative voice carried across every public surface during electoral cycles, with chain-of-custody on every dispatch.',
  },
  {
    surface: 'Crisis Communication Command',
    context: 'Sub-five-minute production-to-publish for incident response. Templated narrative shapes reusable across the duration of a crisis.',
  },
  {
    surface: 'Government Media Coordination',
    context: 'Cross-ministry coordination of public information operations, with one shared audit trail across agencies.',
  },
  {
    surface: 'Public Health Information Networks',
    context: 'Continuous narrative monitoring and decision support for population-scale health communications, governance-aligned throughout.',
  },
];

export function InstitutionalDeployments() {
  return (
    <section id="deployments" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">INSTITUTIONAL DEPLOYMENTS</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Where the platform operates.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              The platform is deployed across institutional contexts where the voice must hold under scrutiny, audit and pressure. Six representative surfaces — none exhaustive, all applied.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {DEPLOYMENTS.map((d) => (
            <div key={d.surface} className="grid grid-cols-1 items-baseline gap-3 py-8 sm:grid-cols-[1fr_2fr] sm:gap-12">
              <dt className="font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                {d.surface}
              </dt>
              <dd className="text-[15px] leading-[1.75] text-emrg-ink">
                {d.context}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
          Representative surfaces · institutional engagements scoped on mandate
        </p>
      </div>
    </section>
  );
}
