import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { DOCS } from './_docs';

export const metadata = { title: 'Documentation — Emergency AI' };

export default function DocsIndex() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">DOCUMENTATION</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink">
          Build with <span className="wordmark-cream italic">Emergency AI.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emrg-mute">
          Reference, guides, and operational runbooks for the platform.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {DOCS.map((d) => (
            <Link
              key={d.slug}
              href={`/docs/${d.slug}`}
              className="block rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6 transition hover:-translate-y-0.5 hover:border-emrg-dim"
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-emrg-gold">{d.section}</div>
              <h3 className="mt-2 font-serif text-2xl text-emrg-ink">{d.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{d.summary}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
