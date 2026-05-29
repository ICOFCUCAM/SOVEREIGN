import { ShieldCheck, Activity, KeyRound, Server, RefreshCw, Globe } from 'lucide-react';
import { Reveal } from './Reveal';

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Provenance baked in',
    body: 'Chain-of-custody recorded from generation to dispatch. Every artefact attributable to the institution behind it — defensible under any review.',
  },
  {
    icon: Activity,
    title: 'Auditable operations',
    body: 'A unified audit log spans every layer. Who, what, when, diff — recoverable for every event, defensible for every institutional decision.',
  },
  {
    icon: KeyRound,
    title: 'Sovereign operating posture',
    body: 'Pipeline owned, substrate owned, tenancy owned. Institutional pricing, predictable governance — never metered against the institution.',
  },
  {
    icon: Server,
    title: 'Owner-scoped tenancy',
    body: 'Row-level isolation at every layer. Institutional deployments move to dedicated databases and compute on explicit mandate.',
  },
  {
    icon: RefreshCw,
    title: 'Operational continuity',
    body: 'Queued, audited, retried under backoff. The institutional voice never falls silent under pressure — failures surface, not disappear.',
  },
  {
    icon: Globe,
    title: 'Jurisdictional control',
    body: 'Routed through the institution\'s chosen edge mesh and operational region. The platform respects sovereign posture by default.',
  },
];

export function ProvenanceTrust() {
  return (
    <section id="trust" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">INSTITUTIONAL POSTURE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Governance-grade by construction.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-2xl bg-emrg-panel/40 p-8 transition duration-500 hover:bg-emrg-panel/60">
              <t.icon className="h-5 w-5 text-emrg-gold/80" strokeWidth={1.2} />
              <h3 className="mt-7 font-serif text-[20px] font-medium text-emrg-ink">{t.title}</h3>
              <p className="mt-5 text-[15px] leading-[1.7] text-emrg-mute">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
