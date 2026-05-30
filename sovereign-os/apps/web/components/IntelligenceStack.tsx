import { Reveal } from './Reveal';
import Link from 'next/link';

// Strategic Intelligence Stack — the seven-tier intelligence architecture
// that sits above Emergency AI's media and publishing pipeline. Each tier
// is presented as an editorial register with the engines that compose it,
// the questions it answers and the institutional readership it serves.

type Engine = { name: string; body: string; answers?: string };

type Tier = {
  n: string;
  posture: 'OBSERVE' | 'UNDERSTAND' | 'PREDICT' | 'ADVISE' | 'COORDINATE';
  title: string;
  thesis: string;
  engines: Engine[];
};

const TIERS: Tier[] = [
  {
    n: '01',
    posture: 'OBSERVE',
    title: 'Intelligence Acquisition Layer',
    thesis: 'Foundation tier. The substrate continuously ingests open-source signal — news, government releases, social, blogs, public databases, financial reports, competitor estate — and resolves it into entities, events and relationships.',
    engines: [
      {
        name: 'OSINT Engine',
        body: 'Continuous open-source acquisition across news, government, social, blogs, public databases, financial filings and competitor surfaces.',
        answers: 'What just changed in the world?',
      },
      {
        name: 'Media Monitoring Engine',
        body: 'Tracks mentions, narratives, sentiment, propagation velocity and influence campaigns across every relevant channel.',
        answers: 'Who is talking? What are they saying? How fast is it spreading?',
      },
      {
        name: 'Stakeholder Monitoring Engine',
        body: 'Tracks investors, regulators, partners, customers, journalists and ministers under one institutional view.',
        answers: 'Who matters? Who shifted position? Who became hostile?',
      },
    ],
  },
  {
    n: '02',
    posture: 'UNDERSTAND',
    title: 'Intelligence Processing Layer',
    thesis: 'Signal becomes intelligence. Narrative geometry, competitive geometry and the weak-signal frontier are surfaced as first-class objects the institution can read.',
    engines: [
      {
        name: 'Narrative Intelligence Engine',
        body: 'Builds narrative maps, influence maps and conversation clusters across the public record.',
        answers: 'Which narratives are growing? Which are dying? Who is driving them?',
      },
      {
        name: 'Competitive Intelligence Engine',
        body: 'Watches competitor products, acquisitions, hiring, patents and partnerships under one continuous feed.',
        answers: 'What are competitors doing? What is changing?',
      },
      {
        name: 'Strategic Signal Engine',
        body: 'Surfaces weak signals, emerging threats and emerging opportunities before they reach the institutional eye.',
        answers: 'What is forming that we have not yet noticed?',
      },
    ],
  },
  {
    n: '03',
    posture: 'ADVISE',
    title: 'Executive Intelligence Layer',
    thesis: 'The most valuable tier. Briefings, risk geometry and decision support written for the principals who must act — not the analysts who must research.',
    engines: [
      {
        name: 'Executive Briefing Engine',
        body: 'Every morning: what happened, why it matters, what leadership should know. Produces CEO, minister and executive briefings on schedule.',
        answers: 'What does the principal need to know before the day begins?',
      },
      {
        name: 'Risk Intelligence Engine',
        body: 'Continuous monitoring of operational, financial, political and reputational risk — with score, impact forecast and response options.',
        answers: 'Where is exposure changing? What is the impact? What are the response options?',
      },
      {
        name: 'Decision Support Engine',
        body: 'Leadership asks: should we do X? The system returns Option A · Option B · Option C — each carrying benefits, risks, probability and cost.',
        answers: 'Of the available options, which carries the institutional advantage?',
      },
    ],
  },
  {
    n: '04',
    posture: 'PREDICT',
    title: 'Forecasting Layer',
    thesis: 'AI becomes strategic. Scenario engines and forecasting engines extend institutional reasoning across markets, sentiment, regulation and operational impact.',
    engines: [
      {
        name: 'Scenario Planning Engine',
        body: 'What if oil rises 40%? What if a critical supplier fails? What if a cyber-attack lands tomorrow? Returns projected outcomes and mitigation plans.',
        answers: 'How does the institution behave under stress?',
      },
      {
        name: 'Strategic Forecasting Engine',
        body: 'Forecasts markets, public sentiment, regulatory direction and operational impact across the institutional horizon.',
        answers: 'Where is the world heading and how does the institution position?',
      },
    ],
  },
  {
    n: '05',
    posture: 'UNDERSTAND',
    title: 'Institutional Memory Layer',
    thesis: 'The tier most often overlooked. Past campaigns, crises, decisions and outcomes resolved into a knowledge graph the institution can interrogate.',
    engines: [
      {
        name: 'Institutional Knowledge Graph',
        body: 'Stores campaigns, crises, decisions and outcomes — every artefact addressable, every relationship preserved.',
        answers: 'What happened last time? What worked? What failed?',
      },
      {
        name: 'Lessons Learned Engine',
        body: 'Automatically composes postmortems and recommendations; carries institutional memory forward into the next campaign.',
        answers: 'What lessons did the last cycle leave us with?',
      },
    ],
  },
  {
    n: '06',
    posture: 'COORDINATE',
    title: 'Crisis Command Layer',
    thesis: 'Where governments and enterprises commit serious capital. Cyber, media, disinformation, operational incidents and reputational threats resolved into a defensible institutional response.',
    engines: [
      {
        name: 'Crisis Detection Engine',
        body: 'Continuous detection of cyber attack, media attack, disinformation, operational incidents and reputational threats — each surfaced with provenance.',
        answers: 'What is happening to us right now, and how do we know?',
      },
      {
        name: 'Crisis Response Engine',
        body: 'Automatically prepares the executive briefing, the press response, the stakeholder update and the action plan — every artefact under audit.',
        answers: 'What is the institutional response, and is it defensible?',
      },
    ],
  },
  {
    n: '07',
    posture: 'COORDINATE',
    title: 'Strategic Coordination Layer',
    thesis: 'The integrating tier. Threats, opportunities, stakeholders, markets, operations and narratives consolidated under one institutional console.',
    engines: [
      {
        name: 'Mission Control Dashboard',
        body: 'Leadership sees threats, opportunities, stakeholders, markets, operations and narratives in one defensible institutional view.',
        answers: 'What is the institutional posture, right now, across every relevant axis?',
      },
    ],
  },
];

const POSTURE_STYLE: Record<Tier['posture'], string> = {
  OBSERVE:     'text-cyan-300/80',
  UNDERSTAND:  'text-amber-300/80',
  PREDICT:     'text-purple-300/80',
  ADVISE:      'text-emerald-300/80',
  COORDINATE:  'text-rose-300/80',
};

export function IntelligenceStack() {
  return (
    <section id="intelligence-stack" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">STRATEGIC INTELLIGENCE STACK</div>
              <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
                Observe. Understand. Predict. Advise. Coordinate.
              </h2>
            </div>
            <p className="text-[15px] leading-[1.75] text-emrg-mute lg:pt-2">
              Seven tiers sit above the media and publishing pipeline — the substrate that turns open-source signal into institutional decision. Most platforms ship media tools, social tools, publishing tools. Emergency AI ships the intelligence stack that reads the room around the dispatch.
            </p>
          </div>
        </Reveal>

        <dl className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {TIERS.map((tier) => (
            <div key={tier.n} className="grid grid-cols-1 gap-y-7 py-12 lg:grid-cols-[80px_320px_1fr] lg:gap-x-12">
              <dt className="font-mono text-[12px] tracking-[0.28em] text-emrg-mute/80 tabular-nums">{tier.n}</dt>
              <div>
                <div className={`text-[10px] font-mono uppercase tracking-[0.32em] ${POSTURE_STYLE[tier.posture]}`}>{tier.posture}</div>
                <h3 className="mt-3 font-serif text-[22px] font-medium leading-[1.2] tracking-[-0.01em] text-emrg-ink">
                  {tier.title}
                </h3>
                <p className="mt-5 text-[14px] leading-[1.7] text-emrg-mute max-w-md">{tier.thesis}</p>
              </div>
              <dd>
                <ul className="space-y-7">
                  {tier.engines.map((e) => (
                    <li key={e.name} className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr] sm:gap-x-8">
                      <div className="text-[13px] font-serif text-emrg-cream leading-snug">{e.name}</div>
                      <div>
                        <p className="text-[14px] leading-[1.7] text-emrg-mute">{e.body}</p>
                        {e.answers && (
                          <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-emrg-cream/55">
                            Answers · {e.answers}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
          <p className="text-[12px] uppercase tracking-[0.28em] text-emrg-mute max-w-2xl">
            Most platforms ship media · social · publishing. Emergency AI ships OSINT + Narrative Intelligence + Executive Briefings + Decision Support + Forecasting + Institutional Memory + Crisis Command.
          </p>
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-2 rounded-full border border-emrg-edgeStrong px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-emrg-cream transition hover:border-emrg-gold/60 hover:text-emrg-ink"
          >
            Open intelligence architecture →
          </Link>
        </div>
      </div>
    </section>
  );
}
