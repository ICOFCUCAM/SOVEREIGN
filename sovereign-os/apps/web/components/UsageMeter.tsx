'use client';
import Link from 'next/link';

// Usage meter for the console overview — shows monthly job consumption against
// the plan's quota. Quotas are advisory (enforcement happens server-side).

interface Props {
  used: number;
  limit: number | null;     // null = unlimited
  label: string;
}

export function UsageMeter({ used, limit, label }: Props) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const danger = !unlimited && pct >= 90;
  const warn   = !unlimited && pct >= 70 && pct < 90;
  const over   = !unlimited && used >= (limit ?? 0);
  const color  = danger ? '#ef4444' : warn ? '#d4a86a' : '#7bd9c2';
  return (
    <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[9px] uppercase tracking-[0.24em] text-emrg-mute">{label}</div>
        <div className="font-mono text-[12px] text-emrg-ink tabular-nums">
          {used}{unlimited ? '' : ` / ${limit}`}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emrg-bg/70">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: unlimited ? '100%' : `${pct}%`, background: unlimited ? 'linear-gradient(90deg,#7bd9c2,#d4a86a)' : color }}
        />
      </div>
      <div className="mt-2 text-[10px] text-emrg-mute">
        {unlimited ? 'Unlimited on this plan'
          : over    ? <span className="text-rose-300/80">Over plan limit — <Link href="/console/billing" className="underline-offset-2 hover:underline">upgrade</Link></span>
          : danger  ? <span className="text-amber-300/80">Approaching plan limit — <Link href="/console/billing" className="underline-offset-2 hover:underline">upgrade</Link></span>
          : warn    ? 'Above 70%'
          : 'Well within limits'}
      </div>
    </div>
  );
}
