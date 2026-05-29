import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';

export const metadata = { title: 'Company — Emergency AI' };

export default function CompanyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">COMPANY</div>
        <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
          Cinematic intelligence,<br /><span className="wordmark-cream italic">institutionalised.</span>
        </h1>

        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-emrg-ink/90">
          <p>
            Emergency AI is the cinematic intelligence layer of SOVEREIGN. We build the
            production, orchestration, and distribution infrastructure institutions use
            to own their narrative in moments that matter.
          </p>
          <p>
            Where conventional media stacks are stitched together from siloed tools,
            Emergency AI delivers a single sovereign platform: a brief becomes a film,
            a film becomes a campaign, and a campaign reaches every relevant surface —
            all under one console, one audit trail, one billing line.
          </p>
          <p>
            We work with governments, agencies, brands, and newsrooms whose mandate
            requires both speed and gravity. The platform is institutional by default
            and operator-friendly by design.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
            <div className="text-[10px] tracking-[0.28em] text-emrg-mute">FOUNDED</div>
            <div className="mt-2 font-serif text-3xl text-emrg-ink">2025</div>
            <p className="mt-2 text-[13px] text-emrg-mute">Spun out of the SOVEREIGN sovereign-infrastructure platform.</p>
          </div>
          <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
            <div className="text-[10px] tracking-[0.28em] text-emrg-mute">DEPLOYMENT</div>
            <div className="mt-2 font-serif text-3xl text-emrg-ink">Global</div>
            <p className="mt-2 text-[13px] text-emrg-mute">Single-tenant institutional deployments available on request.</p>
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-8">
          <h2 className="font-serif text-2xl text-emrg-ink">Contact</h2>
          <div className="mt-5 space-y-3 text-[14px] text-emrg-ink">
            <div><span className="text-emrg-mute">General</span> &nbsp;·&nbsp; <a href="mailto:hello@emergency.ai" className="text-emrg-cream hover:underline">hello@emergency.ai</a></div>
            <div><span className="text-emrg-mute">Sales</span> &nbsp;·&nbsp; <a href="mailto:sales@emergency.ai" className="text-emrg-cream hover:underline">sales@emergency.ai</a></div>
            <div><span className="text-emrg-mute">Institutional</span> &nbsp;·&nbsp; <a href="mailto:institutional@emergency.ai" className="text-emrg-cream hover:underline">institutional@emergency.ai</a></div>
            <div><span className="text-emrg-mute">Press</span> &nbsp;·&nbsp; <a href="mailto:press@emergency.ai" className="text-emrg-cream hover:underline">press@emergency.ai</a></div>
            <div><span className="text-emrg-mute">Security</span> &nbsp;·&nbsp; <a href="mailto:security@emergency.ai" className="text-emrg-cream hover:underline">security@emergency.ai</a></div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 text-[13px]">
          <Link href="/pricing" className="rounded-md bg-emrg-gold px-4 py-2 text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream">See pricing</Link>
          <Link href="/docs" className="rounded-md border border-emrg-edgeStrong px-4 py-2 text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream">Read the docs</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
