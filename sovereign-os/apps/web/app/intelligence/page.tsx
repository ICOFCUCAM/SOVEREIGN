import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { Reveal } from '../../components/Reveal';
import { IntelligenceStack } from '../../components/IntelligenceStack';

export const metadata: Metadata = {
  title: 'Strategic Intelligence Architecture · Emergency AI',
  description:
    'Seven tiers of strategic intelligence sit above the Emergency AI media and publishing pipeline. OSINT, narrative intelligence, executive briefings, decision support, forecasting, institutional memory and crisis command — under one institutional console.',
};

// /intelligence — the institutional architecture page for the Strategic
// Intelligence Stack. Layout: editorial hero · the seven-tier register ·
// "what makes Emergency AI different" closing strip · CTA to console.

const DIFFERENTIATORS: Array<{ ours: string; theirs: string }> = [
  { ours: 'OSINT acquisition',                theirs: 'Stock-photo libraries' },
  { ours: 'Narrative & influence intelligence', theirs: 'Generic social listening' },
  { ours: 'Executive briefings on schedule',  theirs: 'Newsletter templates' },
  { ours: 'Decision support with options',    theirs: 'Workflow automations' },
  { ours: 'Scenario & strategic forecasting', theirs: 'Trend dashboards' },
  { ours: 'Institutional memory graph',       theirs: 'Cloud document storage' },
  { ours: 'Crisis detection & response',      theirs: 'Status pages' },
  { ours: 'Mission control consolidation',    theirs: 'Tab-switching across vendors' },
];

const READERSHIP: Array<{ who: string; what: string }> = [
  { who: 'Heads of state · ministers',           what: 'Daily ministerial briefing · crisis command' },
  { who: 'CEOs · executive committees',          what: 'Decision-support packs · strategic forecasting' },
  { who: 'Boards · risk committees',             what: 'Risk intelligence · scenario planning' },
  { who: 'Communications & strategic affairs',   what: 'Narrative intelligence · stakeholder posture' },
  { who: 'Sovereign wealth · institutional capital', what: 'Market intelligence · competitive geometry' },
  { who: 'National security & resilience',       what: 'Crisis detection · institutional memory' },
];

export default function IntelligencePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative border-b border-emrg-edge/60">
          <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.32em] text-emrg-mute">
                    Strategic Intelligence Architecture
                  </div>
                  <h1 className="mt-7 font-serif text-[44px] sm:text-[56px] font-medium tracking-[-0.02em] leading-[1.02] text-emrg-ink">
                    The intelligence stack that reads the room around the dispatch.
                  </h1>
                  <p className="mt-8 text-[16px] leading-[1.75] text-emrg-mute max-w-xl">
                    Beneath every artefact Emergency AI publishes, seven tiers of strategic intelligence resolve open-source signal into institutional decision. Acquisition, processing, executive briefings, forecasting, institutional memory, crisis command and strategic coordination — composed as one defensible substrate.
                  </p>
                  <div className="mt-10 flex flex-wrap gap-3">
                    <Link
                      href="#intelligence-stack"
                      className="inline-flex items-center gap-2 rounded-full bg-emrg-cream px-6 py-3 text-[12px] uppercase tracking-[0.22em] text-emrg-bg transition hover:bg-emrg-gold"
                    >
                      Read the seven tiers →
                    </Link>
                    <Link
                      href="/console"
                      className="inline-flex items-center gap-2 rounded-full border border-emrg-edgeStrong px-6 py-3 text-[12px] uppercase tracking-[0.22em] text-emrg-cream transition hover:border-emrg-gold/60"
                    >
                      Open console
                    </Link>
                  </div>
                </div>

                {/* Posture register */}
                <div className="lg:border-l lg:border-emrg-edge/60 lg:pl-12">
                  <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-emrg-mute mb-8">Operating Posture</div>
                  <dl className="space-y-7">
                    {[
                      ['OBSERVE', 'Continuous open-source acquisition across the public record.'],
                      ['UNDERSTAND', 'Narrative, competitive and weak-signal geometry.'],
                      ['ADVISE', 'Executive briefings, risk intelligence, decision support.'],
                      ['PREDICT', 'Scenario planning and strategic forecasting.'],
                      ['COORDINATE', 'Crisis detection, response and mission control.'],
                    ].map(([posture, body]) => (
                      <div key={posture} className="grid grid-cols-[130px_1fr] gap-6 items-baseline">
                        <dt className="font-mono text-[11px] tracking-[0.28em] text-emrg-gold/80">{posture}</dt>
                        <dd className="text-[14px] leading-[1.7] text-emrg-mute">{body}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* The seven tiers */}
        <IntelligenceStack />

        {/* What makes Emergency AI different */}
        <section className="relative border-t border-emrg-edge/60">
          <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
            <Reveal>
              <div className="mb-14 max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">DIFFERENCE OF KIND</div>
                <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                  Most platforms ship tools. Emergency AI ships intelligence.
                </h2>
                <p className="mt-6 text-[15px] leading-[1.75] text-emrg-mute">
                  The market is saturated with media tools, social tools and publishing tools. Strategic intelligence — the layer that decides what is worth publishing in the first place — is what very few platforms ship.
                </p>
              </div>
            </Reveal>

            <div className="overflow-hidden rounded-2xl border border-emrg-edge/60">
              <div className="grid grid-cols-[1fr_1fr] border-b border-emrg-edge/60 bg-emrg-panel/40 text-[10px] font-mono uppercase tracking-[0.28em] text-emrg-mute">
                <div className="px-6 py-4 border-r border-emrg-edge/60">Emergency AI ships</div>
                <div className="px-6 py-4">Most platforms ship</div>
              </div>
              {DIFFERENTIATORS.map((d, i) => (
                <div key={d.ours} className={`grid grid-cols-[1fr_1fr] text-[14px] ${i % 2 === 0 ? 'bg-emrg-panel/15' : ''}`}>
                  <div className="px-6 py-5 border-r border-emrg-edge/60 text-emrg-ink">{d.ours}</div>
                  <div className="px-6 py-5 text-emrg-mute">{d.theirs}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Readership — who this is for */}
        <section className="relative border-t border-emrg-edge/60">
          <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
            <Reveal>
              <div className="mb-14 max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">READERSHIP</div>
                <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                  Written for the principals who must decide.
                </h2>
                <p className="mt-6 text-[15px] leading-[1.7] text-emrg-mute">
                  Every artefact lands at executive altitude. The substrate composes decision-ready briefings — not analyst raw output.
                </p>
              </div>
            </Reveal>

            <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
              {READERSHIP.map((r) => (
                <div key={r.who} className="grid grid-cols-1 items-baseline gap-3 py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-12">
                  <dt className="font-serif text-[20px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-cream">
                    {r.who}
                  </dt>
                  <dd className="text-[14px] leading-[1.7] text-emrg-mute">{r.what}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative border-t border-emrg-edge/60">
          <div className="mx-auto max-w-5xl px-6 py-28 sm:py-32 text-center">
            <div className="text-[11px] uppercase tracking-[0.32em] text-emrg-mute">Strategic intelligence infrastructure</div>
            <h2 className="mt-7 font-serif text-[40px] sm:text-[52px] font-medium tracking-[-0.02em] leading-[1.05] text-emrg-ink">
              Read the room. Hold the line. Brief the principal.
            </h2>
            <p className="mt-7 text-[16px] leading-[1.75] text-emrg-mute max-w-2xl mx-auto">
              The intelligence stack is part of the Emergency AI institutional console. Single-tenant deployments scoped on briefing; every artefact carries sovereign jurisdiction, continuous audit posture and one defensible record.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/console"
                className="inline-flex items-center gap-2 rounded-full bg-emrg-cream px-7 py-3.5 text-[12px] uppercase tracking-[0.22em] text-emrg-bg transition hover:bg-emrg-gold"
              >
                Open the console →
              </Link>
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 rounded-full border border-emrg-edgeStrong px-7 py-3.5 text-[12px] uppercase tracking-[0.22em] text-emrg-cream transition hover:border-emrg-gold/60"
              >
                Request institutional briefing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
