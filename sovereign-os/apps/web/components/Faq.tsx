'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const ITEMS = [
  {
    q: 'How is this different from a per-call AI API?',
    a: 'Per-call APIs sell tokens. Emergency AI ships an owned pipeline — generation, distribution and intelligence as one institutional substrate, billed as a subscription rather than metered by call.',
  },
  {
    q: 'Does it really publish to all 11 platforms?',
    a: 'Three publishers are live today (LinkedIn UGC posts, YouTube resumable upload, X v2 tweets). The remaining eight (Instagram, Facebook, TikTok, Threads, Telegram, WhatsApp, Pinterest, Bluesky) are scaffolded in the studio with status badges (ACTIVATING / COMING ONLINE / ROLLING OUT) and graceful dormant errors until institutional credentials are configured. No fake functionality.',
  },
  {
    q: 'What do the seven intelligence agents actually do?',
    a: 'They are named roles in the strategic intelligence layer — Strategos (briefings), Sentinel (narrative drift), Cartographer (market mapping), Pulse (resonance analytics), Architect (scenario modelling), Liaison (relationship + revenue), Forge (cross-layer orchestration). They route through the same pipeline_jobs queue as production and emerge as console modules.',
  },
  {
    q: 'Who is it for?',
    a: 'Institutions, agencies, brands and newsrooms that need cinematic media + multi-channel distribution under a single auditable console. The Institutional tier supports single-tenant deployments with isolated compute and bring-your-own keys.',
  },
  {
    q: 'How does it relate to Sovereign and Sovereign Domains?',
    a: 'Emergency AI is the cinematic intelligence layer of the SOVEREIGN platform. It shares the same Supabase backend, the same edge functions, and the same audit log — and it integrates with Sovereign Domains for institutional identity and tenant routing.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">FREQUENTLY ASKED</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Institutional <span className="wordmark-cream italic">questions.</span>
          </h2>
        </div>

        <div className="mt-12 divide-y divide-emrg-edge/60 border-y border-emrg-edge/60">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-xl text-emrg-ink">{it.q}</span>
                  <span className="shrink-0 text-emrg-gold">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-6 text-[14px] leading-relaxed text-emrg-mute">{it.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
