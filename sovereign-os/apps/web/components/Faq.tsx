'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const ITEMS = [
  {
    q: 'How does this fit our institutional posture?',
    a: 'Emergency AI is strategic communications infrastructure, not a SaaS tool. Subscriptions are predictable, tenancy is owner-scoped, every dispatch is audited. Institutional mandates carry single-tenant deployments with isolated compute and bring-your-own keys.',
  },
  {
    q: 'Which surfaces are live today?',
    a: 'LinkedIn, YouTube and X are operational under real publishers. Instagram, Facebook and TikTok are activating; Threads and Telegram are coming online; WhatsApp, Pinterest and Bluesky are rolling out. The infrastructure never claims false coverage — non-operational surfaces return a status-tagged error when invoked.',
  },
  {
    q: 'What does the Strategic Intelligence Layer actually deliver?',
    a: 'Executive briefings, narrative monitoring, opportunity discovery, scenario and crisis modelling, relationship and operational coordination — delivered as institutional dispatches inside the console rather than as a metered consumer API.',
  },
  {
    q: 'Who does the infrastructure serve?',
    a: 'Governments, financial institutions, media networks and enterprise organizations whose voice must hold under audit, scrutiny and pressure. The Institutional mandate carries single-tenant deployments with isolated compute and bring-your-own credentials.',
  },
  {
    q: 'How does it relate to SOVEREIGN and Sovereign Domains?',
    a: 'Emergency AI is the public-information operating layer of the SOVEREIGN platform. It runs on the same substrate, the same audit log, and the same institutional posture — and integrates with Sovereign Domains for institutional identity and tenant routing.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-4xl px-6 py-28 sm:py-32">
        <div className="mb-16 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">FREQUENTLY ASKED</div>
          <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
            Institutional questions.
          </h2>
        </div>

        <div className="divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-8 py-8 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-[22px] font-medium text-emrg-ink leading-snug">{it.q}</span>
                  <span className="shrink-0 text-emrg-gold/80">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-8 pr-12 text-[15px] leading-[1.75] text-emrg-mute">{it.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
