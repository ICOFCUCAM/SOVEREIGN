import Link from 'next/link';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">404</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
          Off the <span className="wordmark-cream italic">grid.</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-emrg-mute">
          We can't find this page. The route may have moved, or it may never have existed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[13px]">
          <Link href="/" className="rounded-md bg-emrg-gold px-5 py-2.5 font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream">Take me home</Link>
          <Link href="/docs" className="rounded-md border border-emrg-edgeStrong px-5 py-2.5 text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream">Read the docs</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
