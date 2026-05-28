import { PLAN_CATALOG } from '@sovereign/api-platform/billing';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';
const POPULAR = 'pro';

const BLURB: Record<string, string> = {
  free: 'Evaluate the platform.',
  basic: 'For solo operators and small brands.',
  pro: 'For teams running active campaigns.',
  enterprise: 'White-label, custom quota, dedicated support.',
};

function priceLabel(id: string, price: number): string {
  if (id === 'enterprise') return 'Custom';
  if (price === 0) return '$0';
  return `$${price}`;
}

function ctaLabel(id: string): string {
  if (id === 'enterprise') return 'Contact sales';
  if (id === 'free') return 'Start free';
  return `Choose ${id}`;
}

function ctaHref(id: string): string {
  if (id === 'enterprise') return 'mailto:sales@sovereign.example?subject=Enterprise%20plan';
  return `${PORTAL}/?plan=${id}`;
}

export function Pricing() {
  const plans = Object.entries(PLAN_CATALOG);
  return (
    <section id="pricing" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">PRICING</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Choose your plan</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-sov-mute">
            Every plan includes the full creative, distribution and intelligence platform — plans set scope and scale.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(([id, spec]) => {
            const popular = id === POPULAR;
            return (
              <div key={id} className={`relative flex flex-col rounded-xl border bg-sov-panel/50 p-6 ${popular ? 'border-sov-cyan shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]' : 'border-sov-edge'}`}>
                {popular ? (
                  <div className="absolute -top-2.5 left-6 rounded bg-sov-cyan px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sov-bg">MOST POPULAR</div>
                ) : null}
                <div className="text-sm font-semibold text-sov-cyan">{spec.label}</div>
                <p className="mt-1 text-[11px] text-sov-mute">{BLURB[id]}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-semibold">{priceLabel(id, spec.priceUsdMonthly)}</span>
                  {id !== 'enterprise' && spec.priceUsdMonthly > 0 ? <span className="mb-1 text-xs text-sov-mute">/mo</span> : null}
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-xs text-sov-mute">
                  <li className="flex items-center gap-2"><span className="text-sov-teal">▸</span>{spec.quotaPerMonth.toLocaleString()} operations / month</li>
                  <li className="flex items-center gap-2"><span className="text-sov-teal">▸</span>{spec.maxConnections.toLocaleString()} connected accounts</li>
                  <li className="flex items-center gap-2"><span className="text-sov-teal">▸</span>{spec.scopes.includes('*') ? 'Full capability access' : `${spec.scopes.length} capabilities`}</li>
                  <li className="flex items-center gap-2"><span className="text-sov-teal">▸</span>Global distribution</li>
                </ul>

                <a href={ctaHref(id)} className={`mt-6 rounded px-4 py-2.5 text-center text-sm font-semibold ${popular ? 'bg-sov-cyan text-sov-bg hover:bg-sov-cyan/90' : 'border border-sov-edge text-sov-cyan hover:border-sov-cyan'}`}>
                  {ctaLabel(id)}
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[11px] text-sov-mute">
          Paid plans are billed via Stripe. Choosing a plan takes you to the developer console to
          create your API key.
        </p>
      </div>
    </section>
  );
}
