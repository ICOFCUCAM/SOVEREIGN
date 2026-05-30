import Link from 'next/link';
import { Reveal } from './Reveal';

const CAPABILITIES = [
  { title: 'Executive Briefings',      body: 'Decision-ready dispatches assembled from open-source signal and institutional posture — delivered to the principals who must act.' },
  { title: 'Crisis Command',           body: 'Cyber, media, disinformation, operational and reputational threats resolved into a defensible institutional response.' },
  { title: 'Narrative Intelligence',   body: 'Narrative maps, influence maps and conversation geometry across the public record.' },
  { title: 'Risk & Decision Support',  body: 'Operational, financial, political and reputational risk — with score, impact forecast and the options leadership must choose between.' },
  { title: 'Scenario & Forecasting',   body: 'Multi-step scenario, contingency and strategic forecasting — institutional doctrine across days, not posts.' },
  { title: 'Institutional Memory',     body: 'Past campaigns, crises, decisions and outcomes — addressable through one institutional knowledge graph.' },
];

export function IntelligenceAgents() {
  return (
    <section id="intelligence" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">STRATEGIC INTELLIGENCE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              The intelligence that reads the room around the dispatch.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-emrg-mute">
              Six executive capabilities sit above the media pipeline. The full architecture — seven tiers from open-source acquisition through mission control — is reserved for the institutional briefing.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl bg-emrg-panel/40 p-8 transition duration-500 hover:bg-emrg-panel/60">
              <h3 className="font-serif text-[20px] font-medium text-emrg-ink">{c.title}</h3>
              <p className="mt-5 text-[15px] leading-[1.7] text-emrg-mute">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
          <p className="text-[12px] uppercase tracking-[0.28em] text-emrg-mute">
            Delivered as institutional briefings, not a metered API
          </p>
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-2 rounded-full border border-emrg-edgeStrong px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-emrg-cream transition hover:border-emrg-gold/60 hover:text-emrg-ink"
          >
            Read the seven tiers →
          </Link>
        </div>
      </div>
    </section>
  );
}
