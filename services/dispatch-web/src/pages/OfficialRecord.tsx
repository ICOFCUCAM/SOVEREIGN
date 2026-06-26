import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, SectionHead, useReveal } from "../components/brand";

// "What is an Official Record?" — the page that makes Dispatch's core distinction
// unmissable: an Official Record is not a file, it is the institution's
// authoritative, governed, certified, tamper-evident, permanently verifiable
// version of a decision. A PDF can be copied; the institutional proof cannot.

const ORDINARY = ["Edited", "Copied", "Renamed", "Replaced", "Deleted", "Disputed"];
const OFFICIAL = [
  "A verified approval chain", "A permanent institutional identity", "A Governance Certificate",
  "A Preservation Certificate", "A cryptographic integrity proof", "A complete evidence history", "Public verification, always",
];
const MATRIX: [string, boolean][] = [
  ["Unique institutional identity", true], ["Verified approval chain", true], ["Named publication authority", true],
  ["Complete evidence history", true], ["Cryptographic integrity verification", true], ["Governance Certificate", true],
  ["Preservation Certificate", true], ["Permanent record identifier", true], ["Revocation status", true], ["Public verification", true],
];

const OfficialRecord: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* ── Definition ── */}
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">What is an Official Record?</div>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.08] tracking-tight sm:text-[3rem]">An Official Record is more than a document.</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/65">
              It is the institution's <span className="text-white">authoritative version</span> of a decision — governed through an approved process, certified by the responsible authority, preserved against tampering, and permanently traceable through an evidence chain.
            </p>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/45">
              A file can always be copied. A PDF, a Word document, even a printed page can be photocopied. The file is never what makes a record official — the institutional proof is. Think of a passport: a photocopy is not another passport, because the authority behind it cannot be duplicated. Dispatch works the same way.
            </p>
          </div>
        </section>

        {/* ── Ordinary vs Official ── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-20 lg:px-12">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">An ordinary document can be</div>
              <ul className="mt-5 space-y-3">
                {ORDINARY.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/55">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/40">○</span>{t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[12.5px] text-white/35">Nothing about the file proves where it came from, or whether it is current.</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">An Official Record has</div>
              <ul className="mt-5 space-y-3">
                {OFFICIAL.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] text-emerald-300">✓</span>{t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[12.5px] text-emerald-200/50">The proof travels with the record — and can be checked by anyone, at any time.</div>
            </div>
          </div>
        </section>

        {/* ── Authority belongs to the office ── */}
        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="01" kicker="Institutional authority" title="Issued by the office — not the individual."
              sub="An Official Record is issued under the authority of an OFFICE: 'Communications Office, Ministry of Finance'. If the director retires tomorrow, the record remains valid, because it belongs to the office, not the person who held it. That is what makes the authority durable — and impossible to forge by editing a file." />
          </div>
        </section>

        {/* ── Trust matrix ── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <SectionHead index="02" kicker="The difference, in full" title="Ordinary document vs. Official Record." />
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                <span>Capability</span><span className="w-20 text-center">Ordinary</span><span className="w-20 text-center">Official</span>
              </div>
              {MATRIX.map(([cap], i) => (
                <div key={cap} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-2.5 text-[13.5px] ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                  <span className="text-white/80">{cap}</span>
                  <span className="w-20 text-center text-red-400/60">✕</span>
                  <span className="w-20 text-center text-emerald-300">✓</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => nav("/verify")} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">Verify a record →</button>
              <button onClick={() => nav("/developers")} className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40">For developers</button>
              <button onClick={() => nav("/console")} className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40">Launch Dispatch</button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default OfficialRecord;
