import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { ShieldCheck, Lock, KeyRound, FileLock, Server, Network } from 'lucide-react';

export const metadata = { title: 'Security — Emergency AI' };

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Isolation by tenant',
    body: 'Per-tenant row-level security on every data table. Institutional plans can move to dedicated databases with isolated compute and storage.',
  },
  {
    icon: Lock,
    title: 'Encryption end-to-end',
    body: 'TLS 1.3 in transit; AES-256 at rest. Generated media is stored behind signed URLs; nothing leaves your tenant unless you publish it.',
  },
  {
    icon: KeyRound,
    title: 'Secrets stay server-side',
    body: 'Provider keys (Stripe, Runway, OpenAI, LinkedIn, YouTube, X) live as edge-function secrets — never in the database and never in the client bundle.',
  },
  {
    icon: FileLock,
    title: 'Webhook integrity',
    body: 'Stripe webhooks are verified with HMAC signature comparison in constant time, with a strict timestamp tolerance to defeat replays.',
  },
  {
    icon: Server,
    title: 'Audit logs',
    body: 'Every billing event, subscription transition, and admin action is written to audit_logs with actor, action, resource, and a JSON diff.',
  },
  {
    icon: Network,
    title: 'Sovereign deployment',
    body: 'Institutional tenants can run inside their own region with isolated networking and the option to bring their own provider keys.',
  },
];

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">SECURITY</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
          Sovereign-grade <span className="wordmark-cream italic">by default.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emrg-mute">
          What you get without configuring anything — and what changes when you go institutional.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
              <p.icon className="h-5 w-5 text-emrg-gold" />
              <h2 className="mt-4 font-serif text-xl text-emrg-ink">{p.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-7">
          <h2 className="font-serif text-2xl text-emrg-ink">Vulnerability disclosure</h2>
          <p className="mt-3 text-sm leading-relaxed text-emrg-mute">
            Report security issues to{' '}
            <a className="text-emrg-cream hover:underline" href="mailto:security@emergency.ai">security@emergency.ai</a>.
            We acknowledge within 48 hours and prefer encrypted reports — PGP key on request.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
            <Link href="/docs/security" className="rounded-md border border-emrg-edgeStrong px-4 py-2 text-emrg-ink hover:border-emrg-dim hover:text-emrg-cream">Read the security doc</Link>
            <Link href="/legal/privacy" className="rounded-md border border-emrg-edgeStrong px-4 py-2 text-emrg-ink hover:border-emrg-dim hover:text-emrg-cream">Privacy policy</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
