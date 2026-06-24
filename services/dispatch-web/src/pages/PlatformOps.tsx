import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getPlatformOverview, getPlatformTrends, type PlatformOverview, type PlatformTrends, DispatchError, humanError } from "../lib/api";

// PRODUCT 4 — Platform Operations. The platform OPERATOR's domain, on its own
// surface and chrome (slate/cyan — deliberately unlike the tenant console's seal
// blue and the marketing gold). It answers "how is the platform performing?" and
// is structurally unable to answer "what is institution X publishing?": it reads
// ONLY cross-tenant aggregates (counts, rates, distributions, trends) returned by
// SECURITY DEFINER functions, never tenant content. Gated solely on the
// dispatch:platform scope; any other credential gets the locked state. Every
// query is audited server-side.

const pct = (num: number, den: number): string => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");
const fmt = (n: number | undefined): string => (n == null ? "·" : n.toLocaleString());

const Stat: React.FC<{ label: string; value: string | number; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5">
    <div className="font-mono text-3xl font-bold tabular-nums text-white">{value}</div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">{label}</div>
    {sub && <div className="mt-1 text-[11px] text-white/40">{sub}</div>}
  </div>
);

// A labelled bar relative to a max — used for the funnel and the distributions.
const Bar: React.FC<{ label: string; n: number; max: number; prev?: number; tone?: string }> = ({ label, n, max, prev, tone = "bg-cyan-400/70" }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-white/80">{label}</span>
      <span className="flex items-baseline gap-2">
        {prev !== undefined && <span className="font-mono text-[11px] tabular-nums text-white/35">{pct(n, prev)}</span>}
        <span className="font-mono tabular-nums font-semibold text-white">{n.toLocaleString()}</span>
      </span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/[0.07]">
      <div className={`h-full ${tone} transition-all`} style={{ width: `${max > 0 ? Math.min(100, (n / max) * 100) : 0}%` }} />
    </div>
  </div>
);

// Minimal daily trend sparkline (counts only).
const Spark: React.FC<{ title: string; series: { day: string; n: number }[] }> = ({ title, series }) => {
  const max = Math.max(1, ...series.map((d) => d.n));
  const total = series.reduce((a, d) => a + d.n, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">{title}</div>
        <div className="font-mono text-[11px] tabular-nums text-white/40">{total.toLocaleString()} total</div>
      </div>
      <div className="mt-3 flex h-16 items-end gap-[3px]">
        {series.length === 0
          ? <div className="self-center text-[12px] text-white/30">No activity in this window yet.</div>
          : series.map((d, i) => (
            <div key={i} className="flex-1 rounded-sm bg-cyan-400/50" style={{ height: `${Math.max(3, (d.n / max) * 100)}%` }} title={`${d.day}: ${d.n}`} />
          ))}
      </div>
    </div>
  );
};

const Panel: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
  <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-6">
    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{title}</div>
    {children}
    {note && <p className="mt-4 text-[11px] leading-relaxed text-white/35">{note}</p>}
  </div>
);

const PlatformOps: React.FC = () => {
  const { has, signOut } = useAuth();
  const nav = useNavigate();
  const [ov, setOv] = useState<PlatformOverview | null>(null);
  const [tr, setTr] = useState<PlatformTrends | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [locked, setLocked] = useState(!has("dispatch:platform"));

  useEffect(() => {
    if (!has("dispatch:platform")) { setLocked(true); return; }
    getPlatformOverview().then(setOv).catch((e) => {
      if (e instanceof DispatchError && e.status === 403) setLocked(true);
      else setErr(humanError(e, "Could not load the platform overview."));
    });
    getPlatformTrends(30).then(setTr).catch(() => { /* trends are non-fatal */ });
  }, [has]);

  const Chrome: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-full bg-[#0a0c10] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0a0c10]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-cyan-500/15 font-mono text-[13px] font-bold text-cyan-300 ring-1 ring-cyan-400/30">P</span>
            <div>
              <div className="text-[13px] font-bold tracking-tight">PLATFORM OPERATIONS</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Operator domain · aggregates only</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <button onClick={() => nav("/")} className="text-white/50 transition hover:text-white">Exit</button>
            <button onClick={() => { signOut(); nav("/"); }} className="text-white/50 transition hover:text-white">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
    </div>
  );

  if (locked) {
    return (
      <Chrome>
        <div className="mx-auto mt-16 max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/50">◴</div>
          <div className="text-lg font-semibold">Platform operator credentials required</div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
            This is the platform operator domain. It requires the privileged
            <span className="mx-1 font-mono text-cyan-300/80">dispatch:platform</span>scope, which no tenant
            credential carries and which cannot be issued through any account. A tenant_admin signs in to the
            console or administration — not here.
          </p>
          <button onClick={() => nav("/")} className="mt-6 rounded border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/[0.07]">Return home</button>
        </div>
      </Chrome>
    );
  }

  const ev = ov?.events ?? {};
  const get = (k: string): number => ev[k] ?? 0;
  const funnelTop = Math.max(get("page.home"), get("page.procurement"), get("page.trust"), 1);
  const editions = Object.entries(ov?.editionDistribution ?? {});
  const editionMax = Math.max(1, ...editions.map(([, n]) => n));

  return (
    <Chrome>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">How is the platform performing?</h1>
        <p className="mt-1 text-sm text-white/50">Cross-tenant aggregates, rates and trends. Every figure is a live count — never simulated, never tenant content.</p>
      </div>
      {err && <div className="mb-5 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* health headline */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Institutions" value={fmt(ov?.institutions)} sub="Created" />
        <Stat label="Active institutions" value={fmt(ov?.activeInstitutions)} sub="Have created ≥1 record" />
        <Stat label="Records created" value={fmt(ov?.records)} />
        <Stat label="Published" value={fmt(ov?.published)} />
        <Stat label="Preserved" value={fmt(ov?.preserved)} />
      </div>

      {/* conversion + adoption rates */}
      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Signup conversion" value={ov ? pct(get("signup.completed"), get("page.home")) : "·"} sub="Homepage → account" />
        <Stat label="Subscription conversion" value={ov ? pct(ov.activeSubscriptions, ov.institutions) : "·"} sub="Institution → paying" />
        <Stat label="Active subscriptions" value={fmt(ov?.activeSubscriptions)} />
        <Stat label="Governance policy adoption" value={ov ? pct(ov.policyInstitutions, ov.institutions) : "·"} sub={ov ? `${ov.policyInstitutions} of ${ov.institutions} configured a policy` : ""} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Adoption funnel" note="Behavioural rungs are anonymous beacons; lifecycle rungs are authoritative record counts. No identities, no content.">
          <div className="space-y-3.5">
            <Bar label="Homepage visits" n={get("page.home")} max={funnelTop} />
            <Bar label="Procurement page" n={get("page.procurement")} max={funnelTop} prev={get("page.home")} />
            <Bar label="Trust page" n={get("page.trust")} max={funnelTop} prev={get("page.home")} />
            <Bar label="Signups started" n={get("signup.started")} max={funnelTop} prev={get("page.home")} />
            <Bar label="Accounts created" n={get("signup.completed")} max={funnelTop} prev={get("signup.started")} />
            <Bar label="First record created" n={get("record.created")} max={funnelTop} prev={get("signup.completed")} />
            <Bar label="Published" n={ov?.published ?? 0} max={funnelTop} prev={get("record.created")} />
            <Bar label="Preserved" n={ov?.preserved ?? 0} max={funnelTop} prev={ov?.published ?? 0} />
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Friction" note="A governance refusal is enforcement working — watch the trend, not the single event.">
            <div className="space-y-3">
              {[
                ["Abandoned signups", get("signup.abandoned")],
                ["Abandoned record creation", get("record.create.abandoned")],
                ["Paywall reached", get("paywall.viewed")],
                ["Governance refusals", get("governance.failed")],
              ].map(([label, n]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-white/[0.05] pb-2.5 last:border-0 last:pb-0">
                  <span className="text-sm text-white/75">{label}</span>
                  <span className="font-mono tabular-nums text-lg font-bold text-white">{(n as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Edition distribution" note="Institutional edition (standard / government / enterprise) — the real per-tenant deployment class. No deployment-model telemetry is fabricated.">
            <div className="space-y-3">
              {editions.length === 0
                ? <div className="text-[12px] text-white/30">No institutions yet.</div>
                : editions.map(([edition, n]) => <Bar key={edition} label={edition} n={n} max={editionMax} tone="bg-indigo-400/60" />)}
            </div>
          </Panel>
        </div>
      </div>

      {/* trends */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Panel title={`New institutions · last ${tr?.days ?? 30} days`}><Spark title="Per day" series={tr?.institutions ?? []} /></Panel>
        <Panel title={`New records · last ${tr?.days ?? 30} days`}><Spark title="Per day" series={tr?.records ?? []} /></Panel>
      </div>

      <p className="mt-8 border-t border-white/[0.06] pt-5 text-[11px] leading-relaxed text-white/35">
        Counts and trends only. This domain cannot access record bodies, rendered outputs, certificates, governance
        decisions, audit events, credentials, or any tenant-owned content — all platform metrics are produced through
        dedicated aggregate functions that cross the isolation boundary in one direction only. Every query you run here is
        recorded to the platform audit trail.
      </p>
    </Chrome>
  );
};

export default PlatformOps;
