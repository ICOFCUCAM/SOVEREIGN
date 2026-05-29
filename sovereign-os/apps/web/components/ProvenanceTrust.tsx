// Trust & Governance — institutional copy. Drops startup framing ("no
// rented grid", "no surprise quotas") and lifts compliance / mission-critical
// language. Six cards mapped to real platform properties documented under
// /security and /docs/security.

import { ShieldCheck, Activity, KeyRound, Server, RefreshCw, Globe } from 'lucide-react';

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Provenance baked in',
    body: 'Every artefact carries a chain-of-custody record from generation through distribution — auditable end to end for institutional compliance.',
  },
  {
    icon: Activity,
    title: 'Auditable operations',
    body: 'Generation, distribution and intelligence calls all write to a unified audit log. Who · what · when · diff — recoverable for every event.',
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
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-mute">TRUST & GOVERNANCE</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Sovereign-grade <span className="wordmark-cream italic">by construction.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
              <t.icon className="h-5 w-5 text-emrg-gold" />
              <h3 className="mt-4 font-serif text-xl text-emrg-ink">{t.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
