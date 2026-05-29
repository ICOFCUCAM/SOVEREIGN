import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Sovereign Infrastructure Stack — the canonical seven flagships in
// dependency-tier order: Foundational → Producers → Operating → Terminal.
// Typographic only — no card chrome. Matches the institutional editorial
// pattern. Each row carries the official positioning verbatim.

interface Row {
  n: string;
  slug: string;
  name: string;
  position: string;
  scale: 'INSTITUTIONAL' | 'ENTERPRISE' | 'NATIONAL' | 'CIVILIZATION';
  body: string;
  beneficiaries: string;
  composes: string;
}

const STACK: Row[] = [
  {
    n: '01',
    slug: 'veritas-os',
    name: 'Veritas OS',
    position: 'Knowledge & Organizational Intelligence Infrastructure',
    scale: 'INSTITUTIONAL',
    body: 'The knowledge substrate of the Sovereign ecosystem — organisational memory, institutional knowledge, search, reference systems and knowledge governance. Feeds every other infrastructure with retrieval-ready signal.',
    beneficiaries: 'Institutions with knowledge capital · Researchers · Editorial staff · Decision-support functions',
    composes: 'Consumed by every other infrastructure in the stack',
  },
  {
    n: '02',
    slug: 'emergency-ai-platform',
    name: 'Emergency AI',
    position: 'Strategic Intelligence Infrastructure',
    scale: 'INSTITUTIONAL',
    body: 'Intelligence acquisition, strategic analysis, media acquisition, communications and distribution orchestration. Produces institutional intelligence — briefings, situation reports, strategic assessments and intelligence packages.',
    beneficiaries: 'Governments · Financial institutions · Media networks · Enterprise organisations',
    composes: 'Consumes Veritas OS · Publishes through Sovereign Dispatch',
  },
  {
    n: '03',
    slug: 'elecpro',
    name: 'ELECPRO',
    position: 'Sovereign Electoral Infrastructure',
    scale: 'NATIONAL',
    body: 'The electoral substrate — registration, ballot, tabulation, observation and electoral-cycle dispatch operated under sovereign jurisdiction and continuous audit posture.',
    beneficiaries: 'Electoral commissions · Election authorities · Civic-integrity organs',
    composes: 'Composes with Civicos at full national integration · Pairs with Emergency AI for electoral intelligence',
  },
  {
    n: '04',
    slug: 'veritas-banking',
    name: 'Veritas Financial Sovereign Stack',
    position: 'Financial Infrastructure for Civilizations',
    scale: 'CIVILIZATION',
    body: 'The sovereign financial layer — treasury, monetary, settlement, banking and reserve infrastructure operated at civilisation scale. Carries sovereign financial integrity across the substrate.',
    beneficiaries: 'Nations · Central banks · Treasuries · Sovereign wealth funds · Finance ministries',
    composes: 'Pairs with Civicos at nation scale · Embeds with Veritas Operations for enterprise treasury',
  },
  {
    n: '05',
    slug: 'civicos',
    name: 'Civicos',
    position: 'Sovereign Operating Infrastructure',
    scale: 'NATIONAL',
    body: 'The operating layer for sovereign institutions — councils, municipalities, ministries, agencies and public administration. Composes the other six infrastructures into a unified national runtime.',
    beneficiaries: 'Nations · Ministries · Agencies · Councils · Municipalities',
    composes: 'Orchestrates every other infrastructure in the stack at sovereign scale',
  },
  {
    n: '06',
    slug: 'veritas-operations',
    name: 'Veritas Operations',
    position: 'Autonomous Company Operations Infrastructure',
    scale: 'ENTERPRISE',
    body: 'Operational management, workflow orchestration, accounting intelligence, compliance and business administration — a digital operations layer for enterprises running autonomously at scale.',
    beneficiaries: 'Enterprises · Corporate offices · Operational divisions',
    composes: 'Consumes Veritas OS · Pairs with Veritas Financial for enterprise treasury · Publishes through Sovereign Dispatch',
  },
  {
    n: '07',
    slug: 'sovereign-dispatch',
    name: 'Sovereign Dispatch',
    position: 'Institutional Publication Infrastructure',
    scale: 'INSTITUTIONAL',
    body: 'Receives structured payloads from every producer in the stack and renders the institutional artifact — PDF, DOCX, PPTX, briefing packages, board reports, policy documents and regulatory submissions.',
    beneficiaries: 'Every producer in the stack · Institutional secretariats',
    composes: 'Terminal publication endpoint for every upstream infrastructure',
  },
];

const SCALE_STYLE: Record<Row['scale'], string> = {
  INSTITUTIONAL: 'text-cyan-300/80',
  ENTERPRISE:    'text-emerald-300/80',
  NATIONAL:      'text-amber-300/80',
  CIVILIZATION:  'text-purple-300/80',
};

const SovereignInfrastructureStack: React.FC = () => {
  return (
    <section id="stack" className="relative px-4 sm:px-6 lg:px-8 py-28 sm:py-36 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <div className="kicker text-cyan-300/70" style={{ letterSpacing: '0.32em' }}>SOVEREIGN INFRASTRUCTURE STACK</div>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96]">
              Seven infrastructures. <span className="text-gradient-cyan">One sovereign substrate.</span>
            </h2>
          </div>
          <p className="text-white/55 text-base sm:text-lg leading-relaxed lg:pt-3 max-w-xl">
            The Sovereign substrate is composed of seven institutional-grade infrastructures, each operating independently and composing into larger sovereign deployments.
          </p>
        </div>

        {/* The seven — typographic dl */}
        <dl className="divide-y divide-white/8 border-y border-white/8">
          {STACK.map((r) => (
            <div key={r.slug} className="grid grid-cols-1 gap-y-6 py-10 sm:gap-y-7 lg:grid-cols-[60px_280px_1fr] lg:gap-x-10">
              <dt className="font-mono text-[12px] tracking-[0.28em] text-white/30 tabular-nums">{r.n}</dt>
              <div>
                <Link to={`/systems/${r.slug}`} className="group inline-flex items-baseline gap-2 hover:text-white">
                  <span className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">{r.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-cyan-300 transition-colors" />
                </Link>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300/70">{r.position}</div>
                <div className={`mt-2 text-[10px] font-mono uppercase tracking-[0.28em] ${SCALE_STYLE[r.scale]}`}>{r.scale}</div>
              </div>
              <dd>
                <p className="text-white/75 text-[15px] leading-[1.75]">{r.body}</p>
                <dl className="mt-6 grid grid-cols-1 gap-3 text-[12px] text-white/45 sm:grid-cols-[120px_1fr] sm:gap-x-6 sm:gap-y-2">
                  <dt className="font-mono uppercase tracking-[0.22em]">Beneficiaries</dt>
                  <dd className="text-white/70 leading-[1.6]">{r.beneficiaries}</dd>
                  <dt className="font-mono uppercase tracking-[0.22em]">Composes with</dt>
                  <dd className="text-white/70 leading-[1.6]">{r.composes}</dd>
                </dl>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-14 text-center text-[10px] font-mono uppercase tracking-[0.32em] text-white/35">
          One ecosystem · one audit posture · one sovereign jurisdiction
        </p>
      </div>
    </section>
  );
};

export default SovereignInfrastructureStack;
