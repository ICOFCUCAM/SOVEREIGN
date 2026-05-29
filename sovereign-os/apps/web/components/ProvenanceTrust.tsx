// Trust & Integrity — six cards framing the platform as institutional
// infrastructure. Each maps to a real platform property documented in
// /security and /docs/security.

import { ShieldCheck, Activity, KeyRound, Server, RefreshCw, Globe } from 'lucide-react';

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Provenance baked in',
    body: 'Every artefact carries a chain-of-custody log from generation through distribution. Watermarking is on the roadmap; the audit trail ships today.',
  },
  {
    icon: Activity,
    title: 'Audited operations',
    body: 'Generation, distribution and intelligence calls all write to the audit log. Who · what · when · diff — recoverable for every event.',
  },
  {
    icon: KeyRound,
    title: 'Owned pipeline',
    body: 'No per-call middleman, no rented grid, no surprise quotas. You pay an institutional subscription and operate the substrate.',
  },
  {
    icon: Server,
    title: 'Owner-scoped tenancy',
    body: 'Row-level security at every layer of the stack. Institutional plans isolate to dedicated databases on request.',
  },
  {
    icon: RefreshCw,
    title: 'Queued · retried',
    body: 'A production-grade async pipeline with exponential backoff. Failures surface in the console — they don\'t disappear.',
  },
  {
    icon: Globe,
    title: 'Sovereign jurisdiction',
    body: 'Routed via your chosen edge mesh and operational region. The platform respects your jurisdictional posture by default.',
  },
];

export function ProvenanceTrust() {
  return (
    <section id="trust" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">TRUST & INTEGRITY</div>
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
