import React, { useEffect, useState } from "react";
import { fmtMoney, timeAgo, ConfidenceChip } from "../lib/ui";
import { PageHeader, Section, Metric, ScrollRegion } from "../components/xo";
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
  if (pct == null) return "text-xo-muted";
  const abs = Math.abs(pct);
  if (abs < 0.05) return "text-xo-verified";    // < 5% error
  if (abs < 0.15) return "text-xo-action";      // < 15%
  if (abs < 0.30) return "text-xo-caution";     // < 30%
  return "text-xo-risk";
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

  const TABLE_HEAD = "text-left text-[11px] text-xo-muted";
  return (
    <div data-page="calibration" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="Internal · Engine Calibration" title="Predicted vs realized"
        description="The valuation engine learns from every close. JOINs exit_runs.valuation_mid_usd against exit_close_events.final_price_usd; aggregates the spread by sector and buyer type so future predictions correct against measured error." />

      {loading && <p role="status" className="border border-xo-line bg-xo-panel p-6 text-center text-[13px] text-xo-muted">Loading calibration data…</p>}

      {error && (
        <div role="alert" className="border border-xo-risk/50 bg-xo-panel p-4 text-[13px]">
          <div className="font-semibold text-xo-risk">Calibration fetch failed</div>
          <div className="mt-1 text-[12px] text-xo-muted">{error}</div>
          <div className="mt-2 text-[12px] text-xo-muted">The exit-calibration edge function may be unreachable from this environment.</div>
        </div>
      )}

      {summary && (
        <>
          <section aria-label="Calibration summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-xo-panel"><Metric label="Predictions made" value={String(summary.totalRuns)} sub="completed exit runs" /></div>
            <div className="bg-xo-panel"><Metric label="Closes recorded" emphasis value={String(summary.totalCloses)} sub="basis for calibration" /></div>
            <div className="bg-xo-panel"><Metric label="Mean error" value={PCT(summary.meanErrorPct, true)} sub={summary.totalCloses === 0 ? "no closes yet" : "predicted vs realized"} /></div>
            <div className="bg-xo-panel"><Metric label="Median |error|" value={summary.mae == null ? "—" : PCT(summary.mae)} sub={summary.totalCloses === 0 ? "no closes yet" : "absolute deviation"} /></div>
          </section>

          {summary.totalCloses === 0 && (
            <Section title="Calibration begins on the first close." eyebrow="No close events yet" className="border border-xo-line">
              <div className="space-y-3 px-4 py-4 text-[13px] leading-relaxed text-xo-muted">
                <p className="max-w-[75ch]">
                  Every One-Click Exit run writes a prediction snapshot (strategic mid valuation, readiness score,
                  qualified buyer count) to <code className="rounded-sm bg-xo-ink px-1.5 py-0.5 text-[12px] text-xo-text">exit_runs</code>.
                  When a deal closes, the realized price lands in <code className="rounded-sm bg-xo-ink px-1.5 py-0.5 text-[12px] text-xo-text">exit_close_events</code> and
                  this dashboard surfaces the spread. Until then this page is intentionally empty — the engine has
                  not yet learned anything from itself.
                </p>
                <p className="max-w-[75ch]">
                  As real exits accrue, the by-sector and by-buyer-type breakdowns below populate and the valuation
                  engine's sector multipliers can be re-calibrated against measured error rather than priors.
                </p>
              </div>
            </Section>
          )}

          {summary.totalCloses > 0 && (
            <>
              <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
                <Section title="By sector">
                  <ScrollRegion label="Error by sector">
                    <table className="w-full min-w-[320px] text-[13px]">
                      <thead className={TABLE_HEAD}><tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Sector</th><th scope="col" className="px-2 py-2 text-right font-medium">n</th><th scope="col" className="px-4 py-2 text-right font-medium">Mean error</th></tr></thead>
                      <tbody>
                        {summary.bySector.map((s) => (
                          <tr key={s.sector} className="border-b border-xo-line last:border-0">
                            <th scope="row" className="px-4 py-2 text-left font-normal capitalize">{SECTOR_LABEL(s.sector)}</th>
                            <td className="px-2 py-2 text-right"><ConfidenceChip tier={tier(s.n)} sample={s.n} compact /></td>
                            <td className={`px-4 py-2 text-right font-mono tabular-nums ${errorTone(s.meanErrorPct)}`}>{PCT(s.meanErrorPct, true)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollRegion>
                </Section>
                <Section title="By buyer type">
                  <ScrollRegion label="Error by buyer type">
                    <table className="w-full min-w-[320px] text-[13px]">
                      <thead className={TABLE_HEAD}><tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Buyer type</th><th scope="col" className="px-2 py-2 text-right font-medium">n</th><th scope="col" className="px-4 py-2 text-right font-medium">Mean error</th></tr></thead>
                      <tbody>
                        {summary.byBuyerType.map((b) => (
                          <tr key={b.buyerType} className="border-b border-xo-line last:border-0">
                            <th scope="row" className="px-4 py-2 text-left font-normal capitalize">{b.buyerType.replace(/_/g, " ")}</th>
                            <td className="px-2 py-2 text-right"><ConfidenceChip tier={tier(b.n)} sample={b.n} compact /></td>
                            <td className={`px-4 py-2 text-right font-mono tabular-nums ${errorTone(b.meanErrorPct)}`}>{PCT(b.meanErrorPct, true)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollRegion>
                </Section>
              </div>

              <Section title="Recent closes" className="border border-xo-line">
                <ScrollRegion label="Recent closes table">
                  <table className="w-full min-w-[640px] text-[13px]">
                    <thead className={TABLE_HEAD}>
                      <tr className="border-b border-xo-line">
                        <th scope="col" className="px-4 py-2 font-medium">Predicted</th>
                        <th scope="col" className="px-2 py-2 font-medium">Realized</th>
                        <th scope="col" className="px-2 py-2 font-medium">Error</th>
                        <th scope="col" className="px-2 py-2 font-medium">Outcome</th>
                        <th scope="col" className="px-2 py-2 font-medium">Days</th>
                        <th scope="col" className="px-4 py-2 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent.map((r) => (
                        <tr key={r.runId} className="border-b border-xo-line last:border-0">
                          <td className="px-4 py-2 font-mono tabular-nums text-xo-muted">{fmtMoney(r.predictedMidUsd ?? undefined)}</td>
                          <td className="px-2 py-2 font-mono tabular-nums">{fmtMoney(r.realizedPriceUsd ?? undefined)}</td>
                          <td className={`px-2 py-2 font-mono tabular-nums ${errorTone(r.errorPct)}`}>{PCT(r.errorPct, true)}</td>
                          <td className="px-2 py-2 text-[12px] capitalize text-xo-muted">{r.outcome?.replace(/_/g, " ")}</td>
                          <td className="px-2 py-2 font-mono tabular-nums text-xo-muted">{r.daysFromRunStart ?? "—"}</td>
                          <td className="px-4 py-2 text-[12px] text-xo-muted">{timeAgo(r.realizedAt ?? undefined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollRegion>
              </Section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Calibration;
