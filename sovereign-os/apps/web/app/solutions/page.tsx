import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { Landmark, Building2, Megaphone, Tv2, BookOpen, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Solutions — Emergency AI' };

const SOLUTIONS = [
  {
    icon: Landmark,
    label: 'Government & public institutions',
    body: 'Cinematic public-information campaigns, ministerial briefings, and emergency communications at sovereign scale. Single-tenant deployments available.',
    cta: { label: 'See institutional plan', href: '/pricing' },
  },
  {
    icon: Megaphone,
    label: 'Political operations',
    body: 'Multi-channel campaign fan-out (LinkedIn, YouTube, X) with audit-trailed dispatch and rapid response cycles measured in minutes.',
    cta: { label: 'Try the studio', href: '/console' },
  },
  {
    icon: Building2,
    label: 'Agencies & studios',
    body: 'White-labelled production capacity. Render at every aspect ratio, deliver under your own brand, and bill per-seat through a unified console.',
    cta: { label: 'Talk to sales', href: 'mailto:sales@emergency.ai' },
  },
  {
    icon: Tv2,
    label: 'Brands & enterprise marketing',
    body: 'From product launches to internal communications — orchestrate, render, and distribute cinematic media without an in-house production stack.',
    cta: { label: 'See pricing', href: '/pricing' },
  },
  {
    icon: BookOpen,
    label: 'Newsrooms & publishers',
    body: 'Turn editorial briefs into broadcast-quality short films and social cuts in one pass. Narration in your house voice, distribution under your handles.',
    cta: { label: 'Read the docs', href: '/docs' },
  },
  {
    icon: ShieldCheck,
    label: 'Crisis & emergency response',
    body: 'Sub-five-minute production-to-publish for time-critical communications. Templated narrative shapes you can reuse across an incident.',
    cta: { label: 'Get in touch', href: 'mailto:institutional@emergency.ai' },
  },
];

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">SOLUTIONS</div>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
            One platform. <span className="wordmark-cream italic">Many missions.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-emrg-mute">
            How institutions, agencies, and operators deploy Emergency AI in production.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-emrg-edge bg-emrg-panel/50 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim">
              <s.icon className="h-6 w-6 text-emrg-gold" />
              <h2 className="mt-5 font-serif text-2xl text-emrg-ink">{s.label}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-emrg-mute">{s.body}</p>
              <Link
                href={s.cta.href}
                className="mt-5 inline-flex items-center gap-1.5 text-[12px] tracking-wide text-emrg-cream transition hover:gap-2.5"
              >
                {s.cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
