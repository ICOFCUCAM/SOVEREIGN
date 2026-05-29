import { Reveal } from './Reveal';

// "Why this infrastructure exists" — editorial-only section. Frames the
// fragmentation problem and the unification thesis. No cards, no
// visual chrome — a single column of institutional argument.

export function WhyInfrastructure() {
  return (
    <section id="why" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-4xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">WHY THIS INFRASTRUCTURE EXISTS</div>
          <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
            The fragmentation problem.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-7 text-[16px] leading-[1.8] text-emrg-ink/90">
          <p>
            Modern institutions operate across fragmented intelligence tools, fragmented media systems, fragmented distribution networks and fragmented coordination platforms — each owned by a different vendor, audited by no one, and governed by terms set against the institution.
          </p>
          <p>
            The result: voice without provenance, dispatch without audit, decisions without recoverable signal — and a procurement surface that grows wider, more brittle and less defensible every year.
          </p>
          <p>
            Emergency AI exists to consolidate the institutional intelligence layer. Acquisition, analysis and generation unified under one auditable substrate — sovereign by mandate, engagement-scoped to institutional doctrine. Publications are routed to Sovereign Dispatch.
          </p>
        </div>

        <p className="mt-12 text-[11px] uppercase tracking-[0.28em] text-emrg-mute">
          One layer · One audit · One institutional mandate
        </p>
      </div>
    </section>
  );
}
