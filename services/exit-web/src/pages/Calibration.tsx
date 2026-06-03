import React, { useEffect, useState } from "react";
import { Card, Kpi, SectionHeader, fmtMoney, timeAgo, ConfidenceChip } from "../lib/ui";
import { fetchCalibration, type CalibrationSummary } from "../lib/calibration";

// Calibration Dashboard — internal. Reads the exit_calibration view
// via the service-role edge function. The point isn't to look pretty
// today (the view is empty until close events accrue); the point is
// to build the muscle the engine eventually self-corrects against.
//
// Empty state is intentional: "no closes yet — calibration begins on
// the first close event". The shape of the page is the artifact.

const PCT = (n: number | null | undefined, signed = false): string => {
  if (n == null) return "—";
  const v = n * 100;
  return `${signed && v > 0 ? "+" : ""}${v.toFixed(1)}%`;
};

const SECTOR_LABEL = (s: string): string => s.replace(/_/g, " ");

function errorTone(pct: number | null | undefined): string {
  if (pct == null) return "text-white/40";
  const abs = Math.abs(pct);
  if (abs < 0.05) return "text-deal-300";       // < 5% error
  if (abs < 0.15) return "text-stage-engaged";  // < 15%
  if (abs < 0.30) return "text-loi-300";        // < 30%
  return "text-red-300";
}

const Calibration: React.FC = () => {
  const [summary, setSummary] = useState<CalibrationSummary | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCalibration()
      .then((s) => { if (alive) { setSummary(s); setError(null); } })
      .catch((e) => { if (alive) setError((e as Error).message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const tier = (n: number): "experimental" | "low" | "medium" | "high" =>
    n === 0 ? "experimental" : n <= 2 ? "low" : n <= 9 ? "medium" : "high";

  return (
    <div>
      <SectionHeader
        kicker="Internal · Engine Calibration"
        title="Predicted vs realized"
        description="The valuation engine learns from every close. JOINs exit_runs.valuation_mid_usd against exit_close_events.final_price_usd; aggregates the spread by sector and buyer type so future predictions correct against measured error."
      />

      {loading && (
        <Card className="p-8 text-center text-sm text-white/55">Loading calibration data…</Card>
      )}

      {error && (
        <Card className="p-6 text-sm text-red-300">
          <div className="font-semibold">Calibration fetch failed</div>
          <div className="mt-1 text-xs text-red-300/80">{error}</div>
          <div className="mt-3 text-xs text-white/40">
            The exit-calibration edge function may be unreachable from this environment.
          </div>
        </Card>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Kpi label="Predictions made" value={String(summary.totalRuns)} sub="completed exit runs" />
            <Kpi label="Closes recorded"  value={String(summary.totalCloses)} sub="basis for calibration" accent={summary.totalCloses > 0 ? "#34d399" : undefined} />
            <Kpi label="Mean error"
                 value={PCT(summary.meanErrorPct, true)}
                 sub={summary.totalCloses === 0 ? "no closes yet" : "predicted vs realized"} />
            <Kpi label="Median |error|"
                 value={summary.mae == null ? "—" : PCT(summary.mae)}
                 sub={summary.totalCloses === 0 ? "no closes yet" : "absolute deviation"}
                 accent={summary.mae != null && summary.mae < 0.10 ? "#34d399" : undefined} />
          </div>

          {summary.totalCloses === 0 && (
            <Card className="mt-8 p-8">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">No close events yet</div>
              <div className="mt-2 font-serif text-lg text-white">Calibration begins on the first close.</div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                Every One-Click Exit run writes a prediction snapshot (strategic mid valuation, readiness score,
                qualified buyer count) to <code className="rounded bg-ink-900/60 px-1.5 py-0.5 text-[12px] text-white/75">exit_runs</code>.
                When a deal closes, the realized price lands in <code className="rounded bg-ink-900/60 px-1.5 py-0.5 text-[12px] text-white/75">exit_close_events</code> and
                this dashboard surfaces the spread. Until then this page is intentionally empty — the engine has
                not yet learned anything from itself.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                As real exits accrue, the by-sector and by-buyer-type breakdowns below populate and the valuation
                engine's sector multipliers can be re-calibrated against measured error rather than priors.
              </p>
            </Card>
          )}

          {summary.totalCloses > 0 && (
            <>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <Card className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">By sector</div>
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      <tr className="border-b border-white/10">
                        <th className="py-2">Sector</th>
                        <th className="py-2 text-right">n</th>
                        <th className="py-2 text-right">Mean error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.bySector.map((s) => (
                        <tr key={s.sector} className="border-b border-white/5 last:border-0">
                          <td className="py-2 text-white/85">{SECTOR_LABEL(s.sector)}</td>
                          <td className="py-2 text-right font-mono tabular-nums text-white/75">
                            <ConfidenceChip tier={tier(s.n)} sample={s.n} compact />
                          </td>
                          <td className={`py-2 text-right font-mono tabular-nums ${errorTone(s.meanErrorPct)}`}>{PCT(s.meanErrorPct, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">By buyer type</div>
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      <tr className="border-b border-white/10">
                        <th className="py-2">Buyer type</th>
                        <th className="py-2 text-right">n</th>
                        <th className="py-2 text-right">Mean error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byBuyerType.map((b) => (
                        <tr key={b.buyerType} className="border-b border-white/5 last:border-0">
                          <td className="py-2 text-white/85">{b.buyerType.replace(/_/g, " ")}</td>
                          <td className="py-2 text-right">
                            <ConfidenceChip tier={tier(b.n)} sample={b.n} compact />
                          </td>
                          <td className={`py-2 text-right font-mono tabular-nums ${errorTone(b.meanErrorPct)}`}>{PCT(b.meanErrorPct, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              <div className="mt-8">
                <Card className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Recent closes</div>
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      <tr className="border-b border-white/10">
                        <th className="py-2">Predicted</th>
                        <th className="py-2">Realized</th>
                        <th className="py-2">Error</th>
                        <th className="py-2">Outcome</th>
                        <th className="py-2">Days</th>
                        <th className="py-2">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent.map((r) => (
                        <tr key={r.runId} className="border-b border-white/5 last:border-0">
                          <td className="py-2 font-mono tabular-nums text-white/75">{fmtMoney(r.predictedMidUsd ?? undefined)}</td>
                          <td className="py-2 font-mono tabular-nums text-white">{fmtMoney(r.realizedPriceUsd ?? undefined)}</td>
                          <td className={`py-2 font-mono tabular-nums ${errorTone(r.errorPct)}`}>{PCT(r.errorPct, true)}</td>
                          <td className="py-2 text-xs uppercase tracking-wide text-white/55">{r.outcome?.replace(/_/g, " ")}</td>
                          <td className="py-2 font-mono tabular-nums text-white/55">{r.daysFromRunStart ?? "—"}</td>
                          <td className="py-2 text-xs text-white/45">{timeAgo(r.realizedAt ?? undefined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Calibration;
