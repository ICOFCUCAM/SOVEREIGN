import { ShieldCheck, Activity, KeyRound, Server, RefreshCw, Globe } from 'lucide-react';
import { Reveal } from './Reveal';

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Provenance baked in',
    body: 'Every artefact carries a chain-of-custody record from generation through distribution — auditable end to end for institutional compliance.',
  },
  {
    icon: Activity,
    title: 'Auditable operations',
    body: 'Generation, distribution and intelligence calls all write to a unified audit log. Who, what, when, diff — recoverable for every event.',
  },
  {
    icon: KeyRound,
    title: 'Sovereign operating posture',
    body: 'Owned pipeline, owned substrate, owned tenancy. Pricing is institutional and predictable; the platform is governed by you, not metered against you.',
  },
  {
    icon: Server,
    title: 'Owner-scoped tenancy',
    body: 'Row-level isolation by default at every layer of the stack. Institutional deployments move to dedicated databases and compute on request.',
  },
  {
    icon: RefreshCw,
    title: 'Production-grade queue',
    body: 'Queued, audited, retried with exponential backoff. Pipeline failures surface in the console — they never disappear silently.',
  },
  {
    icon: Globe,
    title: 'Jurisdictional control',
    body: 'Routed through your chosen edge mesh and operational region. The platform respects your institutional posture by default.',
  },
];

export function ProvenanceTrust() {
  return (
    <section id="trust" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">TRUST & GOVERNANCE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Sovereign-grade by construction.
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
