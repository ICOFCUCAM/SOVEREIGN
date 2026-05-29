import Link from 'next/link';
import { SiteHeader } from '../../components/SiteHeader';
import { Footer } from '../../components/Footer';
import { PlanCompare } from '../../components/PlanCompare';
import { PLANS } from '../../lib/plans';

export const metadata = { title: 'Pricing — Emergency AI' };

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-28 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">PRICING</div>
          <h1 className="mt-4 font-serif text-5xl font-medium leading-tight text-emrg-ink sm:text-6xl">
            One platform. <span className="wordmark-cream italic">Three tiers.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-emrg-mute">
            Transparent pricing for operators, agencies, and institutions. Switch tiers or cancel at any time.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-emrg-panel/60 p-7 ${p.highlight ? 'border-emrg-dim shadow-[0_30px_70px_-30px_rgba(212,168,106,0.4)]' : 'border-emrg-edge'}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-emrg-gold px-3 py-1 text-[10px] font-medium tracking-[0.22em] text-emrg-bg">
                  {p.highlight.toUpperCase()}
                </span>
              )}
              <div className="text-[10px] tracking-[0.32em] text-emrg-gold">{p.name.toUpperCase()}</div>
              <h3 className="mt-3 font-serif text-3xl text-emrg-ink">{p.name}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{p.tagline}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-emrg-ink">
                  ${p.monthlyPrice.toLocaleString()}
                </span>
                <span className="text-sm text-emrg-mute">/ month</span>
              </div>

              <Link
                href={p.monthlyPrice === 0 ? '/sign-in?mode=signup' : `/console/billing?plan=${p.id}`}
                className={`mt-7 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition ${p.highlight ? 'bg-emrg-gold text-emrg-bg hover:-translate-y-0.5 hover:bg-emrg-cream' : 'border border-emrg-edgeStrong text-emrg-ink hover:border-emrg-dim hover:text-emrg-cream'}`}
                style={p.highlight ? { boxShadow: '0 14px 40px -12px rgba(212,168,106,0.55)' } : undefined}
              >
                {p.monthlyPrice === 0 ? 'Start free' : 'Choose plan'}
              </Link>

              <ul className="mt-7 space-y-3 border-t border-emrg-edge pt-6 text-[13px] text-emrg-ink">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emrg-gold" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <PlanCompare />

        <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-8 text-center">
          <h3 className="font-serif text-2xl text-emrg-ink">Need a sovereign deployment?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-emrg-mute">
            Single-tenant isolation, dedicated compute, custom voice models, and on-prem agents.
            Talk to our institutional team.
          </p>
          <Link
            href="mailto:institutional@emergency.ai"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-emrg-edgeStrong px-5 py-2.5 text-sm text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream"
          >
            Contact institutional sales
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
