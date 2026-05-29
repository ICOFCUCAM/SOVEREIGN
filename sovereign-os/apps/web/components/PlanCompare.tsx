import { Check, X } from 'lucide-react';

interface Row { label: string; values: [string | boolean, string | boolean, string | boolean] }

const ROWS: Row[] = [
  { label: 'Production jobs / month',     values: ['5', 'Unlimited', 'Unlimited + dedicated'] },
  { label: 'Operator seats',              values: ['1', '5', 'Unlimited'] },
  { label: 'Cinematic exports',           values: ['Watermarked', 'Full HD', 'Full HD + custom shapes'] },
  { label: 'Aspect ratios',               values: ['16:9 only', '16:9 · 9:16 · 1:1', 'All + custom'] },
  { label: 'Channel distribution',        values: [false, 'LinkedIn · YouTube · X', 'All channels + custom'] },
  { label: 'Compute priority',            values: ['Community queue', 'Priority queue', 'Dedicated capacity'] },
  { label: 'Voice cloning',               values: [false, false, true] },
  { label: 'Brand intelligence',          values: [false, false, true] },
  { label: 'Single-tenant isolation',     values: [false, false, true] },
  { label: 'Support response',            values: ['Community', '24h email', '1h · named lead'] },
  { label: 'API access',                  values: ['Read-only', 'Full', 'Full + dedicated'] },
];

const COLS = ['Evaluator', 'Operator', 'Institutional'];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-emerald-300" />;
  if (v === false) return <X className="mx-auto h-4 w-4 text-emrg-mute/60" />;
  return <span className="text-emrg-ink">{v}</span>;
}

export function PlanCompare() {
  return (
    <section className="mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">COMPARE</div>
        <h2 className="mt-3 font-serif text-3xl text-emrg-ink sm:text-4xl">All capabilities, side by side.</h2>
      </div>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-emrg-edge bg-emrg-panel/40">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-emrg-edge text-left">
              <th className="px-5 py-4 text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Capability</th>
              {COLS.map((c) => (
                <th key={c} className="px-5 py-4 text-center text-[10px] uppercase tracking-[0.22em] text-emrg-gold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-emrg-edge/50 last:border-0">
                <td className="px-5 py-3.5 text-emrg-ink">{r.label}</td>
                {r.values.map((v, i) => (
                  <td key={i} className="px-5 py-3.5 text-center text-emrg-mute"><Cell v={v} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
