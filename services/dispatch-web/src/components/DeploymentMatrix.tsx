import React from "react";

// Capability-by-deployment matrix. Truthful: a ✓ means the capability is present
// in that model; residency is described per model (Shared / Dedicated / National
// / Local). Used on both the Landing deployment section and the procurement page.
const COLS = ["Cloud", "Private", "Sovereign", "On-Prem"] as const;
const ROWS: { cap: string; cells: (boolean | string)[] }[] = [
  { cap: "Governance pipeline", cells: [true, true, true, true] },
  { cap: "Append-only audit trail", cells: [true, true, true, true] },
  { cap: "REST API access", cells: [true, true, true, true] },
  { cap: "Tenant isolation (RLS)", cells: [true, true, true, true] },
  { cap: "Encryption (AES-256)", cells: [true, true, true, true] },
  { cap: "Data residency", cells: ["Shared region", "Dedicated", "National / regional", "Local"] },
];

const Check: React.FC = () => (
  <svg viewBox="0 0 16 16" className="mx-auto h-4 w-4 text-emerald-400" fill="none"><path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const DeploymentMatrix: React.FC = () => (
  <div className="overflow-x-auto rounded-lg border border-white/10">
    <table className="w-full min-w-[560px] text-sm">
      <thead>
        <tr className="border-b border-white/10 bg-white/[0.03] text-left">
          <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-white/50">Capability</th>
          {COLS.map((c) => (
            <th key={c} className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-white/70">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {ROWS.map((r) => (
          <tr key={r.cap} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 font-medium text-white/80">{r.cap}</td>
            {r.cells.map((cell, i) => (
              <td key={i} className="px-4 py-3 text-center">
                {cell === true ? <Check /> : <span className="text-[12.5px] text-white/55">{cell}</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
