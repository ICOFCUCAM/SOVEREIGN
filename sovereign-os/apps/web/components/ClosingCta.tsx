const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

const INVITATIONS = [
  { label: 'Platform deployment',      sub: 'Choose your plan and launch.',                  href: '#pricing' },
  { label: 'Enterprise onboarding',    sub: 'Talk to our institutional team.',               href: 'mailto:sales@sovereign.example?subject=Enterprise%20plan' },
  { label: 'Infrastructure consultation', sub: 'Schedule a strategic briefing.',             href: 'mailto:briefing@sovereign.example?subject=Sovereign%20briefing' },
  { label: 'Developer access',         sub: 'Open the developer console.',                   href: PORTAL, external: true },
];

export function ClosingCta() {
  return (
    <section className="border-t border-sov-edge/30">
      <div className="mx-auto max-w-6xl px-6 py-40">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-4xl font-semibold leading-[1.0] tracking-tight sm:text-7xl">
            <span className="wordmark">Begin.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base text-sov-mute sm:text-lg">
            A single decision. A continuous operating layer.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-sov-edge/40 bg-sov-edge/40 sm:grid-cols-2">
          {INVITATIONS.map((inv) => (
            <a
              key={inv.label}
              href={inv.href}
              target={inv.external ? '_blank' : undefined}
              rel={inv.external ? 'noreferrer' : undefined}
              className="group flex items-center gap-4 bg-[#06090e] p-7 transition hover:bg-sov-panel/40"
            >
              <div className="flex-1">
                <div className="text-base font-semibold text-[#e8f6fb]">{inv.label}</div>
                <div className="mt-1 text-sm text-sov-mute">{inv.sub}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-sov-mute transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sov-cyan"
              >
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
