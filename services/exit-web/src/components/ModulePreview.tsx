import React from "react";
import { MODULE_PREVIEW as M } from "../lib/module-stats";

// The inside of a module, drawn from the engine's own structure: the
// readiness dimensions and their weights, the valuation methodologies, the
// generated formats, the diligence packages. No sample company's scores.

const ModulePreview: React.FC<{ id: string }> = ({ id }) => {
  if (id === "readiness") {
    const max = Math.max(...M.readiness.map((d) => d.weight));
    return (
      <ul className="grid gap-3">
        {M.readiness.map((d) => (
          <li key={d.name} className="grid grid-cols-[minmax(0,180px)_1fr_44px] items-center gap-4 text-[13.5px]">
            <span className="text-ink-800">{d.name}</span>
            <span className="h-2.5 rounded-full bg-slate-200"><span className="block h-full rounded-full bg-gradient-to-r from-[#9A7E56] to-[#C9B08A]" style={{ width: `${(d.weight / max) * 100}%` }} /></span>
            <span className="text-right font-mono tabular-nums text-ink-900">{Math.round(d.weight * 100)}%</span>
          </li>
        ))}
      </ul>
    );
  }
  if (id === "valuation") {
    return (
      <ul className="flex flex-wrap gap-3">
        {M.valuation.map((m, i) => (
          <li key={m} className="flex items-center gap-3 rounded-ex-sm border border-slate-300 bg-white px-4 py-3 text-[14px] text-ink-900">
            <span className="font-mono text-[11px] text-[#7A6344]">0{i + 1}</span>{m}
            <svg aria-hidden viewBox="0 0 60 12" className="h-3 w-14"><line x1="2" y1="6" x2="58" y2="6" stroke="#cbd5e1" strokeWidth="2" /><line x1="14" y1="6" x2="46" y2="6" stroke="#9A7E56" strokeWidth="4" strokeLinecap="round" /><circle cx="28" cy="6" r="4" fill="#0a1018" /></svg>
          </li>
        ))}
      </ul>
    );
  }
  if (id === "documents") {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {M.documents.map((d) => (
          <li key={d} className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-ex-xs border border-slate-300 bg-white p-3 shadow-ex-2">
            <span aria-hidden className="absolute inset-x-3 top-3 grid gap-1.5">{[100, 80, 92, 60].map((w, i) => <span key={i} className="h-1 rounded bg-slate-200" style={{ width: `${w}%` }} />)}</span>
            <span aria-hidden className="absolute right-0 top-0 h-5 w-5 bg-gradient-to-bl from-slate-200 to-white" />
            <span className="font-editorial text-[13.5px] font-semibold leading-tight text-ink-900">{d}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {M.dataRoom.map((p) => (
        <li key={p.name} className="flex items-center justify-between gap-4 rounded-ex-xs border border-slate-200 bg-white px-4 py-2.5 text-[13.5px]">
          <span className="text-ink-800">{p.name}</span>
          <span className="flex items-center gap-1" aria-label={`${p.artifacts} artifacts`}>{Array.from({ length: p.artifacts }, (_, i) => <span key={i} className="h-2 w-2 rounded-sm bg-[#9A7E56]" />)}</span>
        </li>
      ))}
    </ul>
  );
};

export default ModulePreview;
