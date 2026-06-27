import React from "react";
import { PublicHeader, Chevron } from "../components/brand";
import { useMarketing3Copy } from "../lib/messages";
import type { ArchBlock } from "../lib/messages/marketing3";

// Architecture Overview — the authoritative technical reference, rendered as a
// clean light document so browser Print → Save as PDF produces a faithful,
// procurement-grade artefact. The page IS the source of truth; a committed PDF
// can later be generated from this same content through the render pipeline.
// Screen chrome (.no-print) is excluded from the printed output.

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  html, body, #root { background: #fff !important; }
  .arch-doc { box-shadow: none !important; }
  @page { margin: 16mm; }
}
.arch-doc { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

const FlowRow: React.FC<{ nodes: string[]; accentFirst?: boolean }> = ({ nodes, accentFirst }) => (
  <div className="my-5 flex flex-wrap items-center gap-2">
    {nodes.map((n, i, a) => (
      <React.Fragment key={n}>
        <span className={`rounded-md border px-3.5 py-2 text-[13px] font-semibold ${accentFirst && i === 0 ? "border-gold-600/50 bg-gold-50 text-zinc-900" : "border-zinc-300 bg-zinc-50 text-zinc-700"}`}>{n}</span>
        {i < a.length - 1 && <Chevron className="h-3.5 w-3.5 text-gold-600/60" />}
      </React.Fragment>
    ))}
  </div>
);

const Architecture: React.FC = () => {
  const c = useMarketing3Copy().architecture;
  return (
    <div className="min-h-full bg-[#ececec]">
      <style>{PRINT_CSS}</style>
      <div className="no-print"><PublicHeader actions={
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded border border-white/25 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/45 hover:bg-white/5">
          {c.downloadBtn}
        </button>
      } /></div>

      {/* the document */}
      <div className="arch-doc mx-auto my-0 max-w-[860px] bg-white px-10 py-12 text-zinc-800 shadow-2xl sm:my-8 sm:px-14 print:my-0">
        {/* cover header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700">Sovereign Dispatch</div>
            <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-zinc-900">{c.docTitle}</h1>
            <p className="mt-2 text-[13px] text-zinc-500">{c.docSub}</p>
          </div>
          <div className="hidden text-right text-[11px] leading-relaxed text-zinc-500 sm:block">
            <div>{c.versionLine}</div>
            <div>{c.classificationLabel} <span className="font-semibold text-zinc-700">{c.classificationValue}</span></div>
            <div>{c.distributionLabel} {c.distributionValue}</div>
          </div>
        </div>

        <button onClick={() => window.print()}
          className="no-print mt-6 inline-flex items-center gap-2 rounded bg-zinc-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-zinc-700">
          {c.downloadDocBtn} <Chevron className="h-3.5 w-3.5" />
        </button>

        <Doc />
      </div>

      <div className="no-print py-10 text-center text-[12px] text-zinc-500">{c.printHint}</div>
    </div>
  );
};

const S: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="mt-9 break-inside-avoid">
    <h2 className="border-b border-zinc-200 pb-2 font-serif text-[22px] font-bold text-zinc-900">
      <span className="mr-3 font-mono text-[15px] font-bold text-gold-700">{n}</span>{title}
    </h2>
    <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-zinc-700">{children}</div>
  </section>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((t) => (
      <li key={t} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-600" /><span>{t}</span></li>
    ))}
  </ul>
);

const ArchBlockView: React.FC<{ block: ArchBlock; idx: number }> = ({ block, idx }) => {
  if ("p" in block) return <p>{block.p}</p>;
  if ("flow" in block) return <FlowRow accentFirst={idx === 1} nodes={block.flow} />;
  if ("bullets" in block) return <Bullets items={block.bullets} />;
  return (
    <pre className="my-3 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-[12px] leading-relaxed text-zinc-700">{block.code}</pre>
  );
};

const Doc: React.FC = () => {
  const c = useMarketing3Copy().architecture;
  return (
    <>
      {c.sections.map((s, si) => (
        <S key={si} n={String(si + 1)} title={s.title}>
          {s.blocks.map((b, bi) => <ArchBlockView key={bi} block={b} idx={si} />)}
        </S>
      ))}
      <p className="mt-10 border-t border-zinc-200 pt-5 text-[11px] leading-relaxed text-zinc-400">{c.footer}</p>
    </>
  );
};

export default Architecture;
