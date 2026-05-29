import { Reveal } from './Reveal';

// Institutional Applications — applied surfaces inside the four sectors.
// Each entry pairs an institutional surface name with a one-line operating
// description. Typographic only (definition list, no cards) matching the
// Operational Footprint and Deployment Surfaces pattern.

const APPLICATIONS: Array<{ sector: string; name: string; body: string }> = [
  {
    sector: 'GOVERNMENT',
    name: 'National Communications Office',
    body: 'The institutional information operating layer for a government voice — coordinated dispatch under one audit log.',
  },
  {
    sector: 'GOVERNMENT',
    name: 'Ministerial Briefing Operations',
    body: 'Decision-ready briefings assembled from open-source signal and internal posture, delivered to the principals who must act.',
  },
  {
    sector: 'FINANCE',
    name: 'Investor Relations Operations',
    body: 'Earnings, results and investor-facing dispatch coordinated under a single defensible institutional posture.',
  },
  {
    sector: 'FINANCE',
    name: 'Regulatory Engagement Desk',
    body: 'Supervisory engagement and regulatory voice carried with provenance, audit trail intact across every artefact.',
  },
  {
    sector: 'MEDIA',
    name: 'Editorial Production & Distribution',
    body: 'Editorial cadence orchestrated end to end — production, format coverage and channel dispatch under one console.',
  },
  {
    sector: 'MEDIA',
    name: 'Newsroom Coordination',
    body: 'Cross-desk coordination for breaking, sustained and crisis cycles. Continuity of voice across every output.',
  },
  {
    sector: 'ENTERPRISE',
    name: 'Corporate Affairs Command',
    body: 'Product, corporate, executive and crisis surfaces operated from a single institutional doctrine — never improvised.',
  },
  {
    sector: 'ENTERPRISE',
    name: 'Stakeholder Intelligence Desk',
    body: 'Stakeholder posture, relationship intelligence and revenue analysis surfaced as a first-class governance layer.',
  },
];

export function InstitutionalApplications() {
  return (
    <section id="applications" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">INSTITUTIONAL APPLICATIONS</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Applied institutional surfaces.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Eight institutional surfaces — two per sector — describing where the substrate is deployed in production. Representative, not exhaustive; scoped on engagement.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {APPLICATIONS.map((a) => (
            <div key={a.name} className="grid grid-cols-1 items-baseline gap-3 py-8 sm:grid-cols-[90px_280px_1fr] sm:gap-10">
              <dt className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
                {a.sector}
              </dt>
              <dd className="font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                {a.name}
              </dd>
              <dd className="text-[15px] leading-[1.75] text-emrg-ink">
                {a.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
