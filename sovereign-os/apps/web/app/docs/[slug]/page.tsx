import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '../../../components/SiteHeader';
import { Footer } from '../../../components/Footer';
import { DOCS, docBySlug } from '../_docs';

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const d = docBySlug(params.slug);
  return { title: d ? `${d.title} — Emergency AI Docs` : 'Documentation — Emergency AI' };
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const d = docBySlug(params.slug);
  if (!d) return notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-28 sm:pt-28 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">DOCS</div>
          <nav className="mt-4 space-y-1">
            {DOCS.map((entry) => {
              const active = entry.slug === d.slug;
              return (
                <Link
                  key={entry.slug}
                  href={`/docs/${entry.slug}`}
                  className={`block rounded-md px-3 py-1.5 text-[13px] transition ${active ? 'bg-emrg-surface text-emrg-cream' : 'text-emrg-mute hover:text-emrg-cream'}`}
                >
                  {entry.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <article className="max-w-3xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">{d.section.toUpperCase()}</div>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">{d.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-emrg-mute">{d.summary}</p>
          <div className="mt-10 space-y-10 border-t border-emrg-edge pt-10">
            {d.body.map((block, i) => (
              <section key={i}>
                {block.heading && <h2 className="font-serif text-2xl text-emrg-ink">{block.heading}</h2>}
                {block.paragraphs.map((p, j) => (
                  <p key={j} className="mt-4 text-[15px] leading-relaxed text-emrg-ink/90">{p}</p>
                ))}
                {block.code && (
                  <pre className="mt-5 overflow-x-auto rounded-xl border border-emrg-edge bg-emrg-bg/80 p-4 font-mono text-[12px] text-emrg-ink">
                    <code>{block.code}</code>
                  </pre>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
