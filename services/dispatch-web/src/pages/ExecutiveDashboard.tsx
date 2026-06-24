import React, { useEffect, useState } from "react";
import { getPlatformExecutive, type PlatformOverview, DispatchError, humanError } from "../lib/api";
import { Card } from "../lib/ui";

// Executive Overview (Launch Phase 1) — the OPERATOR's instrument, not a
// customer surface. It crosses the tenant boundary the rest of the platform
// enforces, so it returns ONLY aggregate counts (no record contents) and is
// gated to a server-side operator allowlist; any other credential gets a clear
// locked state. Every number here is a real count — never fabricated, never
// simulated. Where there is nothing yet, it reads zero, honestly.

const pct = (num: number, den: number): string => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");

const Metric: React.FC<{ label: string; value: number | string; sub?: string }> = ({ label, value, sub }) => (
  <Card className="p-5">
    <div className="text-3xl font-bold tabular-nums text-white">{value}</div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</div>
    {sub && <div className="mt-1 text-[11px] text-white/35">{sub}</div>}
  </Card>
);

// One rung of the adoption funnel: a labelled count with the conversion from the
// previous rung, and a bar relative to the funnel's widest rung.
const Rung: React.FC<{ label: string; n: number; top: number; prev?: number; note?: string }> = ({ label, n, top, prev, note }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-medium text-white/80">{label}</span>
      <span className="flex items-baseline gap-2">
        {prev !== undefined && <span className="text-[11px] tabular-nums text-white/40">{pct(n, prev)} of prior</span>}
        <span className="tabular-nums font-semibold text-white">{n}</span>
      </span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
      <div className="h-full bg-seal-light transition-all" style={{ width: `${top > 0 ? Math.min(100, (n / top) * 100) : 0}%` }} />
    </div>
    {note && <div className="mt-1 text-[11px] text-white/35">{note}</div>}
  </div>
);

const ExecutiveDashboard: React.FC = () => {
  const [ov, setOv] = useState<PlatformOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    getPlatformExecutive().then(setOv).catch((e) => {
      if (e instanceof DispatchError && (e.status === 403 || e.code === "NOT_PLATFORM_OPERATOR")) setLocked(true);
      else setErr(humanError(e, "Could not load the executive overview."));
    });
  }, []);

  if (locked) {
    return (
      <div>
        <header className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Platform</div>
          <h1 className="mt-1 text-2xl font-bold text-white">Executive Overview</h1>
        </header>
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/50">◴</div>
          <div className="text-lg font-semibold text-white">Operator credentials required</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            This overview reports adoption across <span className="text-white/80">all institutions</span> and is reserved
            to the platform operator. It is not part of any institution's console — a tenant only ever sees its own records
            and governance.
          </p>
        </Card>
      </div>
    );
  }

  const ev = ov?.events ?? {};
  const get = (k: string): number => ev[k] ?? 0;
  // Funnel widest rung anchors the bars; homepage visits are the natural top.
  const top = Math.max(get("page.home"), get("page.procurement"), get("page.trust"), 1);

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Platform</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Executive Overview</h1>
        <p className="text-sm text-white/50">Real-world adoption across every institution — operator-only, aggregate counts. Every figure is a live count; nothing here is simulated.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* institutional totals — authoritative, read live from the record tables */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Institutions" value={ov?.institutions ?? "·"} sub="Tenants created" />
        <Metric label="Paying institutions" value={ov?.activeSubscriptions ?? "·"} sub={ov ? `${pct(ov.activeSubscriptions, ov.institutions)} conversion` : ""} />
        <Metric label="Official records" value={ov?.records ?? "·"} sub="Created across the platform" />
        <Metric label="Governed publications" value={ov?.governed ?? "·"} sub="Carry a governance certificate" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Published" value={ov?.published ?? "·"} sub="Released to the record" />
        <Metric label="Preserved" value={ov?.archived ?? "·"} sub="Sealed (archived)" />
        <Metric label="Visit → account" value={ov ? pct(get("signup.completed"), get("page.home")) : "·"} sub="Homepage to created account" />
        <Metric label="Account → paying" value={ov ? pct(ov.activeSubscriptions, ov.institutions) : "·"} sub="Created to subscribed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* adoption funnel — behavioural signal from real visitors */}
        <Card className="p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Adoption funnel</div>
          <div className="space-y-4">
            <Rung label="Homepage visits" n={get("page.home")} top={top} />
            <Rung label="Procurement page" n={get("page.procurement")} top={top} prev={get("page.home")} />
            <Rung label="Trust page" n={get("page.trust")} top={top} prev={get("page.home")} />
            <Rung label="Signups started" n={get("signup.started")} top={top} prev={get("page.home")} />
            <Rung label="Accounts created" n={get("signup.completed")} top={top} prev={get("signup.started")} />
            <Rung label="First record created" n={get("record.created")} top={top} prev={get("signup.completed")} />
            <Rung label="Published" n={ov?.published ?? 0} top={top} prev={get("record.created")} />
            <Rung label="Preserved" n={ov?.archived ?? 0} top={top} prev={ov?.published ?? 0} />
          </div>
          <p className="mt-4 text-[11px] text-white/35">Behavioural rungs (visits, signups) come from anonymous beacons; lifecycle rungs (published, preserved) are authoritative record counts.</p>
        </Card>

        {/* friction — where adoption stalls */}
        <Card className="p-6">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Friction</div>
          <div className="space-y-3">
            {[
              ["Abandoned signups", get("signup.abandoned"), "Left before creating an account"],
              ["Abandoned record creation", get("record.create.abandoned"), "Left the create form unsubmitted"],
              ["Paywall reached", get("paywall.viewed"), "Hit a quota or download paywall"],
              ["Governance refusals", get("governance.failed"), "Publish/decision blocked by policy"],
            ].map(([label, n, sub]) => (
              <div key={label as string} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium text-white/80">{label}</div>
                  <div className="text-[11px] text-white/35">{sub}</div>
                </div>
                <div className="tabular-nums text-xl font-bold text-white">{n as number}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-white/35">A governance refusal is not necessarily a defect — enforcement working is the product. Watch the trend, not the single event.</p>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
