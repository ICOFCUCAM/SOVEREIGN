import React from "react";
import { PROOF, hasProof, type Proof } from "../lib/proof";
import { useI18n } from "../lib/i18n";

// "In confidence" — real client proof, shown only when it exists (CC4). With
// the registry empty this renders nothing at all: no placeholders, no
// invented logos or quotes.

const ProofSection: React.FC<{ proof?: Proof }> = ({ proof = PROOF }) => {
  const { t } = useI18n();
  if (!hasProof(proof)) return null;
  const q = proof.quotes[0];
  return (
    <section aria-labelledby="proof-h" className="ex-light bg-ex-paper text-ink-900">
      <div className="mx-auto w-full max-w-[1480px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="border-t-4 border-double border-ink-900 pt-8">
          <h2 id="proof-h" className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-blue-600">{t("proof.eyebrow")}</h2>
          {q && (
            <figure className="mt-8 max-w-4xl">
              <blockquote className="font-editorial text-[clamp(1.8rem,3.6vw,3.2rem)] font-semibold leading-[1.12] tracking-[-0.02em]">“{q.quote}”</blockquote>
              <figcaption className="mt-5 text-[14px] text-slate-600"><span className="font-semibold text-ink-900">{q.name}</span> · {q.role}{q.company ? `, ${q.company}` : ""}</figcaption>
            </figure>
          )}
          {proof.clients.length > 0 && (
            <ul className="mt-12 grid grid-cols-2 gap-px border-y border-slate-300 bg-slate-300 sm:grid-cols-4">
              {proof.clients.map((c) => (
                <li key={c.name} className="bg-[#f6f8fb] px-5 py-6"><span className="font-editorial text-[1.25rem] font-semibold">{c.name}</span>{c.sector && <span className="mt-1 block text-[12.5px] text-slate-600">{c.sector}</span>}</li>
              ))}
            </ul>
          )}
          {proof.press.length > 0 && (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {proof.press.map((p) => (
                <li key={p.url}><a href={p.url} target="_blank" rel="noopener noreferrer" className="group block border-t border-ink-900 pt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600">{p.outlet} · {p.date}</span>
                  <span className="mt-1 block font-editorial text-[1.2rem] font-semibold group-hover:text-blue-700">{p.title} <span aria-hidden>↗</span></span>
                </a></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProofSection;
