import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Kpi, SectionHeader, fmtMoney, timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";
import {
  VALUATION_STANDARD, VALUATION_STRATEGIC, VALUATION_REPLACEMENT,
  READINESS, READINESS_ANALYSIS, BUYERS, DILIGENCE,
} from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import ExitProcessModal from "../components/ExitProcessModal";
import BankerTake from "../components/BankerTake";
import JourneyMap from "../components/JourneyMap";
import { loadRun, clearRun, type ExitRun } from "../lib/exit-process";
import { emitTelemetry } from "../lib/telemetry";

// Founder dashboard — wired to @exit/engines. The deterministic
// engines (valuation, readiness, buyer discovery, diligence) all run
// on module load against SAMPLE_COMPANY; the dashboard summarises the
// run and links into the deep surfaces for each engine.

const BAND_LABEL: Record<typeof READINESS["band"], string> = {
  not_ready:              "Not ready",
  seed_acquisition:       "Seed acquisition",
  growth_acquisition:     "Growth acquisition",
  strategic_acquisition:  "Strategic acquisition",
};

const BAND_STYLE: Record<typeof READINESS["band"], string> = {
  not_ready:              "text-white/60 bg-white/5 ring-white/15",
  seed_acquisition:       "text-loi-300 bg-loi-500/15 ring-loi-400/40",
  growth_acquisition:     "text-stage-engaged bg-stage-engaged/15 ring-stage-engaged/40",
  strategic_acquisition:  "text-deal-300 bg-deal-600/20 ring-deal-400/40",
};

const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const topBuyers = BUYERS.candidates.slice(0, 5);
  const criticalQs = DILIGENCE.criticalQuestions;
  const redFlags = DILIGENCE.redFlags;
  const arrM = SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd / 1_000_000;

  const topMove = READINESS_ANALYSIS.weaknesses[0];
  const valGap = READINESS_ANALYSIS.projectedStrategicMid - READINESS_ANALYSIS.currentStrategicMid;
  const topBuyer = topBuyers[0];

  const [run, setRun] = useState<ExitRun | null>(() => loadRun());
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) setRun(loadRun());
  }, [modalOpen]);

  useEffect(() => {
    emitTelemetry("dashboard_viewed", undefined, "/console");
  }, []);

  const startExit = (): void => {
    emitTelemetry("exit_process_clicked", undefined, "/console");
    setModalOpen(true);
  };
  const resetExit = (): void => {
    emitTelemetry("exit_process_reset", undefined, "/console");
    clearRun();
    setRun(null);
  };

  return (
    <div>
      <SectionHeader
        kicker="Founder Dashboard"
        title={`Good morning, ${session?.founderId ?? "founder"}.`}
        description={`${SAMPLE_COMPANY.name} · ${SAMPLE_COMPANY.sector.replace(/_/g, " ")} · ${arrM.toFixed(1)}M ARR · ${SAMPLE_COMPANY.jurisdiction}`}
        actions={
          run?.status === "complete" ? (
            <>
              <Button variant="ghost" onClick={resetExit}>Reset</Button>
              <Button onClick={startExit}>Re-run exit process</Button>
            </>
          ) : (
            <Button onClick={startExit}>Start Exit Process →</Button>
          )
        }
      />

      <JourneyMap current={run?.status === "complete" ? "run" : "monitor"} />

      <BankerTake
        next={topMove ? topMove.recommendation : "Posture is strong — run the process now."}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(VALUATION_STRATEGIC.headline.mid)}</span> strategic mid · band {fmtMoney(VALUATION_STRATEGIC.headline.low)}–{fmtMoney(VALUATION_STRATEGIC.headline.high)}.</>}
        inaction={topMove
          ? <>Leaving <span className="text-white">{topMove.dimension}</span> unaddressed forgoes <span className="font-mono text-red-300">+{fmtMoney(valGap)}</span> of value buyers would otherwise pay.</>
          : <>Multiple windows compress over time — every quarter idle risks the bid.</>}
        buyer={topBuyer
          ? <><span className="text-white">{topBuyer.buyer.name}</span> — {(topBuyer.probability * 100).toFixed(0)}% fit, {topBuyer.buyer.buyerType.replace(/_/g, " ")}.</>
          : "No qualified buyers yet — widen the search."}
        automate={<>One click runs the exit: ExitOS drafts the CIM, issues NDAs and sequences buyer outreach for you.</>}
        impact={topMove ? <>+{fmtMoney(valGap)}</> : undefined}
        cta={{ label: run?.status === "complete" ? "Re-run exit process" : "Start Exit Process", onClick: startExit }}
      />

      {run?.status === "complete" && (
        <Card className="mb-8 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-deal-600/20 text-deal-300 ring-1 ring-deal-400/40">✓</span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-400">Exit process active</div>
                <div className="text-sm font-medium text-white">
                  Initialized {timeAgo(run.startedAt)} · {run.steps.filter((s) => s.status === "done").length}/{run.steps.length} engines complete
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {run.artifacts.cim && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-white/65 ring-1 ring-white/10">CIM · {run.artifacts.cim.wordCount.toLocaleString()} words</span>}
              {run.artifacts.teaser && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-white/65 ring-1 ring-white/10">Teaser ready</span>}
              {run.artifacts.ndasIssued && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-white/65 ring-1 ring-white/10">{run.artifacts.ndasIssued.length} NDAs pre-issued</span>}
              {run.artifacts.listing && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-white/65 ring-1 ring-white/10">Listing {run.artifacts.listing.private.listingId.slice(0, 18)}…</span>}
              {run.artifacts.offerLeaderName && <span className="rounded-full bg-deal-600/20 px-2.5 py-0.5 text-deal-300 ring-1 ring-deal-400/40">Leader: {run.artifacts.offerLeaderName}</span>}
            </div>
          </div>
        </Card>
      )}

      <ExitProcessModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* AI Chief Exit Officer — action-first morning briefing. The single
          recommended next move + its expected valuation uplift come from the
          readiness-analysis engine; the activity line summarises buyer/diligence
          signals. Founders open this daily for "what should I do next?". */}
      {(() => {
        const move = READINESS_ANALYSIS.weaknesses[0];
        const requested = DILIGENCE.criticalQuestions.length;
        const viewing = Math.min(BUYERS.candidates.length, 3);
        return (
          <Card className="mb-8 overflow-hidden p-0">
            <div className="border-b border-white/10 bg-deal-600/10 px-6 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-deal-600/30 text-[12px] text-deal-200 ring-1 ring-deal-400/40">★</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deal-300">AI Chief Exit Officer · morning briefing</span>
              </div>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
              {/* recommended next move */}
              <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Recommended next move</div>
                {move ? (
                  <>
                    <p className="mt-2 text-lg font-semibold leading-snug text-white">{move.recommendation}</p>
                    <p className="mt-1 text-[13px] text-white/55">{move.weakness}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-white/40">Expected value increase</div>
                        <div className="font-mono text-2xl font-bold text-deal-300">+{fmtMoney(move.valuationUpliftUsd)}</div>
                      </div>
                      <Link to="/console/data-room" className="rounded-md bg-deal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-deal-500">Take action →</Link>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-lg font-semibold text-white">Posture is strong — run the process. No high-impact fixes outstanding.</p>
                )}
              </div>
              {/* activity feed */}
              <div className="p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Since yesterday</div>
                <ul className="mt-3 space-y-2.5 text-[13px] text-white/75">
                  <li className="flex items-baseline gap-2.5"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-deal-400" />{viewing} buyers viewed your profile</li>
                  <li className="flex items-baseline gap-2.5"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-loi-400" />1 buyer requested diligence access</li>
                  <li className="flex items-baseline gap-2.5"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-stage-engaged" />{requested} critical diligence question{requested === 1 ? "" : "s"} to resolve</li>
                </ul>
              </div>
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label="Strategic valuation (mid)"
          value={fmtMoney(VALUATION_STRATEGIC.headline.mid)}
          sub={`band ${fmtMoney(VALUATION_STRATEGIC.headline.low)} – ${fmtMoney(VALUATION_STRATEGIC.headline.high)}`}
          accent="#34d399"
        />
        <Kpi
          label="Readiness"
          value={`${READINESS.overallScore.toFixed(0)}/100`}
          sub={BAND_LABEL[READINESS.band]}
          accent="#fbbf24"
        />
        <Kpi
          label="Qualifying buyers"
          value={String(BUYERS.candidates.length)}
          sub={`${BUYERS.byType.strategic} strategic · ${BUYERS.byType.pe} PE · ${BUYERS.byType.family_office} family office`}
        />
        <Kpi
          label="Implied price"
          value={fmtMoney(BUYERS.companyHeadlineUsd)}
          sub="ranking basis"
          accent="#10b981"
        />
      </div>

      <div id="readiness" className="mt-10 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Top buyers · ranked</h2>
              <p className="text-xs text-white/45">Probability scored by sector × check × geography × activity.</p>
            </div>
            <Link to="/console/intelligence" className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">
              Open intelligence →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="py-3">Acquirer</th>
                <th className="py-3">Type</th>
                <th className="py-3 text-right">Check size</th>
                <th className="py-3 text-right">Probability</th>
              </tr>
            </thead>
            <tbody>
              {topBuyers.map((c) => (
                <tr key={c.buyer.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-3.5 font-medium text-white">{c.buyer.name}</td>
                  <td className="py-3.5 text-xs uppercase tracking-wide text-white/55">{c.buyer.buyerType.replace(/_/g, " ")}</td>
                  <td className="py-3.5 text-right font-mono tabular-nums text-white/85">{fmtMoney(c.estimatedCheck.low)} – {fmtMoney(c.estimatedCheck.high)}</td>
                  <td className="py-3.5 text-right font-mono tabular-nums text-deal-300">{(c.probability * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white">Readiness</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${BAND_STYLE[READINESS.band]}`}>
              {BAND_LABEL[READINESS.band]}
            </span>
          </div>
          <div className="space-y-3">
            {READINESS.dimensions.map((d) => (
              <div key={d.name}>
                <div className="mb-1 flex items-baseline justify-between text-[12px]">
                  <span className="text-white/70">{d.name}</span>
                  <span className="font-mono text-white/85">{d.score.toFixed(0)}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${Math.max(2, d.score)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {READINESS_ANALYSIS.weaknesses.length > 0 && (
        <Card className="mt-8 p-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Readiness analysis · improvement plan</h2>
              <p className="text-xs text-white/45">{READINESS_ANALYSIS.headline}</p>
            </div>
            <div className="text-right text-[11px]">
              <div className="text-white/40 uppercase tracking-[0.2em]">Projected mid</div>
              <div className="font-mono text-lg text-deal-300">{fmtMoney(READINESS_ANALYSIS.projectedStrategicMid)}</div>
              <div className="text-[10px] text-white/40">vs current {fmtMoney(READINESS_ANALYSIS.currentStrategicMid)}</div>
            </div>
          </div>
          <div className="space-y-3">
            {READINESS_ANALYSIS.weaknesses.slice(0, 4).map((w) => (
              <div key={w.dimension} className="rounded border border-white/10 bg-ink-900/40 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{w.dimension}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                      w.severity === 'high' ? 'bg-red-500/15 text-red-300 ring-red-400/40' :
                      w.severity === 'medium' ? 'bg-loi-500/15 text-loi-300 ring-loi-400/40' :
                      'bg-white/5 text-white/65 ring-white/15'
                    }`}>{w.severity}</span>
                  </div>
                  <div className="font-mono text-[12px] text-deal-300">+{fmtMoney(w.valuationUpliftUsd)} <span className="text-white/40">· {w.effort}</span></div>
                </div>
                <p className="mt-1 text-[13px] text-white/70">{w.weakness}</p>
                <p className="mt-1 text-[12px] text-white/55">→ {w.recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Valuation reports</div>
          <div className="mt-4 space-y-3 text-[13px]">
            <ValRow label="Standard"        v={VALUATION_STANDARD.headline} />
            <ValRow label="Strategic buyer" v={VALUATION_STRATEGIC.headline} />
            <ValRow label="Asset replacement" v={VALUATION_REPLACEMENT.headline} />
          </div>
          <p className="mt-4 text-[11px] text-white/45">Country adjustment for {SAMPLE_COMPANY.jurisdiction}: {(VALUATION_STRATEGIC.countryAdjustment * 100).toFixed(0)}%.</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-white">Critical diligence questions</h3>
          {criticalQs.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">No critical questions surfaced — clean diligence posture.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {criticalQs.map((q) => (
                <li key={q} className="flex items-baseline gap-3">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-loi-400" /> {q}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-white">Red flags</h3>
          {redFlags.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">No red flags. Buyer-facing posture is defensible.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {redFlags.map((f) => (
                <li key={f} className="flex items-baseline gap-3">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> {f}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

const ValRow: React.FC<{ label: string; v: { low: number; mid: number; high: number } }> = ({ label, v }) => (
  <div className="flex items-baseline justify-between">
    <span className="text-white/55">{label}</span>
    <span className="font-mono text-white/85">{fmtMoney(v.low)} · {fmtMoney(v.mid)} · {fmtMoney(v.high)}</span>
  </div>
);

export default Dashboard;
