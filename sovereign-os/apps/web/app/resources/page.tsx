import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { FileText, PlayCircle, GraduationCap, Code2 } from 'lucide-react';

export const metadata = { title: 'Resources — Emergency AI' };

const SECTIONS = [
  {
    icon: FileText,
    title: 'Briefings',
    body: 'Short editorials on what Emergency AI changes about media operations — from production economics to publishing latency.',
    href: '/docs',
    cta: 'Read briefings',
  },
  {
    icon: PlayCircle,
    title: 'Showcase',
    body: 'Films, ads, and campaigns produced through the platform. Updated as new tenants ship.',
    href: '/docs/video-formats',
    cta: 'See the formats',
  },
  {
    icon: GraduationCap,
    title: 'Operator playbooks',
    body: 'Step-by-step runbooks for high-impact scenarios — product launches, ministerial briefings, crisis response.',
    href: '/docs/getting-started',
    cta: 'Open the playbook',
  },
  {
    icon: Code2,
    title: 'Developer API',
    body: 'Authenticated edge-function surface for programmatic production and distribution. API-key issuance through the sovereign Developer Portal.',
    href: '/docs/developer-api',
    cta: 'Build with the API',
  },
];

export default function ResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">RESOURCES</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
          Build the <span className="wordmark-cream italic">muscle.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emrg-mute">
          Briefings, playbooks, and showcase — everything you need to operate Emergency AI at scale.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group rounded-2xl border border-emrg-edge bg-emrg-panel/50 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim"
            >
              <s.icon className="h-6 w-6 text-emrg-gold" />
              <h2 className="mt-5 font-serif text-2xl text-emrg-ink">{s.title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-emrg-mute">{s.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] tracking-wide text-emrg-cream transition group-hover:gap-2.5">
                {s.cta} →
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
