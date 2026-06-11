import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, SectionHeader, fmtMoney, preview } from "../lib/ui";
import { VALUATION_STRATEGIC, BUYERS, NEGOTIATION_STATE, OFFER_COMPARISON } from "../lib/engines";
import { discoverFindings, buildSellerReport } from "../lib/diligence-intel";
import { emitTelemetry } from "../lib/telemetry";

// Autonomous Exit Mode — "Sell my company," not "manage the sale." Seven
// specialist agents run the process end to end; the founder only approves
// decisions at each gate. Each agent's work product is engine-derived
// (valuation, buyer discovery, listing, diligence intelligence, negotiation).

type AgentStatus = "queued" | "working" | "awaiting" | "done";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  work: React.ReactNode;        // what the agent produced
  decision: string;            // the single decision the founder approves
  approveLabel: string;
}

const STATUS_STYLE: Record<AgentStatus, string> = {
  queued:   "bg-white/5 text-white/45 ring-white/15",
  working:  "bg-loi-500/15 text-loi-200 ring-loi-400/40",
  awaiting: "bg-deal-600/20 text-deal-200 ring-deal-400/50",
  done:     "bg-deal-600/25 text-deal-200 ring-deal-400/50",
};
const STATUS_LABEL: Record<AgentStatus, string> = {
  queued: "Queued", working: "Working", awaiting: "Needs approval", done: "Approved",
};

const Spinner: React.FC = () => (
  <span className="block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-loi-300/40 border-t-loi-200" />
);

const Autopilot: React.FC = () => {
  const mid = VALUATION_STRATEGIC.headline.mid;
  const nBuyers = BUYERS.candidates.length;
  const shortlist = Math.min(7, nBuyers);
  const findings = useMemo(() => discoverFindings(), []);
  const high = findings.filter((f) => f.severity === "high").length;
  const sellerReport = useMemo(() => buildSellerReport(findings), [findings]);
  const leader = OFFER_COMPARISON.leader;

  const AGENTS: AgentDef[] = [
    {
      id: "valuation", name: "Valuation Agent", role: "Prices the company across methodologies.",
      work: <>Ran standard, strategic and asset-replacement models → strategic mid <span className="font-mono text-white">{fmtMoney(mid)}</span> (band {fmtMoney(VALUATION_STRATEGIC.headline.low)}–{fmtMoney(VALUATION_STRATEGIC.headline.high)}).</>,
      decision: `Set the asking range anchored at ${fmtMoney(mid)} strategic mid?`, approveLabel: "Approve the ask",
    },
    {
      id: "discovery", name: "Buyer Discovery Agent", role: "Finds and ranks acquirers.",
      work: <>Scanned the buyer universe → <span className="font-mono text-white">{nBuyers}</span> qualified, shortlisted the top <span className="font-mono text-white">{shortlist}</span> by fit and outcome.</>,
      decision: `Approve the ${shortlist}-buyer target list?`, approveLabel: "Approve the list",
    },
    {
      id: "outreach", name: "Outreach Agent", role: "Drafts and runs the approach.",
      work: <>Wrote the anonymized teaser and a six-step outreach sequence; intros personalized per buyer.</>,
      decision: `Send the anonymized teaser to the ${shortlist} shortlisted buyers?`, approveLabel: "Send outreach",
    },
    {
      id: "dataroom", name: "Data Room Agent", role: "Provisions and gates diligence.",
      work: <>Provisioned seven rooms and wired access behind signed NDAs + the Buyer Trust score.</>,
      decision: "Auto-grant data-room access to verified, NDA-signed buyers?", approveLabel: "Approve gating",
    },
    {
      id: "diligence", name: "Diligence Agent", role: "Finds the risks before buyers do.",
      work: <>Ran the intelligence engine → <span className="font-mono text-white">{findings.length}</span> risks ({high} high-severity). Seller report drafted; ~{fmtMoney(sellerReport.totalImpactUsd)} of value to protect.</>,
      decision: "Approve the pre-market remediation plan and disclosure schedule?", approveLabel: "Approve the plan",
    },
    {
      id: "negotiation", name: "Negotiation Agent", role: "Scores offers and counters.",
      work: <>Scoring <span className="font-mono text-white">{NEGOTIATION_STATE.activeOffers}</span> offers; leverage <span className="text-white">{NEGOTIATION_STATE.leverage}</span>{leader ? <> · <span className="text-white">{leader}</span> leads</> : null}.</>,
      decision: leader ? `Approve the counter and drive ${leader} to a signed LOI?` : "Approve the counter strategy and drive to LOI?", approveLabel: "Approve the counter",
    },
    {
      id: "closing", name: "Closing Agent", role: "Orchestrates signatures and escrow.",
      work: <>Assembled the closing checklist; tracking signatures, escrow funding and regulatory filings to the wire.</>,
      decision: "Approve proceeding to signing and funding the escrow?", approveLabel: "Approve close",
    },
    {
      id: "wealth", name: "Wealth Agent", role: "Manages the proceeds after the wire.",
      work: <>Modeled proceeds through tax, scheduled the liquidity and drafted the diversification plan in WealthOS.</>,
      decision: "Approve the wealth transition plan?", approveLabel: "Approve & finish",
    },
  ];

  const [started, setStarted] = useState(false);
  const [statuses, setStatuses] = useState<AgentStatus[]>(() => AGENTS.map(() => "queued"));

  // A working agent finishes its work after a short beat, then waits for approval.
  useEffect(() => {
    const i = statuses.findIndex((s) => s === "working");
    if (i === -1) return;
    const t = setTimeout(() => {
      setStatuses((prev) => prev.map((s, idx) => (idx === i && s === "working" ? "awaiting" : s)));
    }, 1100);
    return () => clearTimeout(t);
  }, [statuses]);

  const start = (): void => {
    emitTelemetry("autopilot_started", undefined, "/console/autopilot");
    setStarted(true);
    setStatuses((prev) => prev.map((_, idx) => (idx === 0 ? "working" : "queued")));
  };

  const approve = (i: number): void => {
    emitTelemetry("autopilot_approved", { agent: AGENTS[i].id, step: i }, "/console/autopilot");
    setStatuses((prev) => prev.map((s, idx) => {
      if (idx === i) return "done";
      if (idx === i + 1) return "working";
      return s;
    }));
  };

  const doneCount = statuses.filter((s) => s === "done").length;
  const awaitingIndex = statuses.findIndex((s) => s === "awaiting");
  const allDone = doneCount === AGENTS.length;
  const progressPct = Math.round((doneCount / AGENTS.length) * 100);

  return (
    <div>
      <SectionHeader
        kicker="Phase 3 · Autonomous"
        title="Autonomous Exit"
        description="You uploaded revenue, financials and a cap table. ExitOS does the rest — value, readiness, buyers, data room, documents, outreach, negotiation, closing and wealth. Your job is three words: approve, approve, approve."
      />

      {/* ── Mission control ──────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">One instruction</div>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-white">"Sell my company."</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/65">
              ExitOS launches {AGENTS.length} agents — valuation, buyer discovery, outreach, data room, diligence,
              negotiation, closing and wealth — and runs them autonomously. Each pauses only to put one decision in
              front of you. Approve. Approve. Approve. Money arrives.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["revenue", "financials", "cap table"].map((u) => (
                <span key={u} className="rounded-full bg-deal-600/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/30">✓ {u}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!started && <Button onClick={start}>Start Exit Process →</Button>}
              {started && !allDone && (
                <span className="inline-flex items-center gap-2 rounded-md bg-loi-500/15 px-3 py-2 text-[12px] font-semibold text-loi-200 ring-1 ring-loi-400/40">
                  ● Running · {awaitingIndex >= 0 ? `${AGENTS[awaitingIndex].name} needs you` : "agents working"}
                </span>
              )}
              {allDone && (
                <span className="inline-flex items-center gap-2 rounded-md bg-deal-600/20 px-3 py-2 text-[12px] font-semibold text-deal-200 ring-1 ring-deal-500/40">
                  ✓ Deal closed · you approved {AGENTS.length} decisions
                </span>
              )}
            </div>
          </div>
          <div className="bg-ink-900/40 p-7">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Process progress</div>
              <div className="font-mono text-[11px] text-white/45">{doneCount}/{AGENTS.length}</div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-deal-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-white/10 bg-ink-800/60 p-3">
                <div className="font-mono text-2xl font-bold text-deal-300">{started ? doneCount : "—"}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">Decisions approved</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-ink-800/60 p-3">
                <div className="font-mono text-2xl font-bold text-loi-300">{started && !allDone ? (awaitingIndex >= 0 ? 1 : 0) : 0}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">Awaiting you</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Agent pipeline ───────────────────────────────────────── */}
      <div className="mt-8 space-y-3">
        {AGENTS.map((a, i) => {
          const status = statuses[i];
          const revealed = status !== "queued";
          return (
            <Card key={a.id} className={`p-5 transition ${status === "awaiting" ? "ring-1 ring-deal-400/40" : ""}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold ring-1 ${STATUS_STYLE[status]}`}>
                    {status === "done" ? "✓" : status === "working" ? <Spinner /> : i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-white">{a.name}</span>
                      <span className="ml-2 text-[12px] text-white/45">{a.role}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[status]}`}>
                      {status === "working" ? "Working…" : STATUS_LABEL[status]}
                    </span>
                  </div>

                  {revealed && (
                    <div className="mt-2 text-[13px] leading-snug text-white/75">{a.work}</div>
                  )}

                  {status === "awaiting" && (
                    <div className="mt-3 rounded-lg border border-deal-500/30 bg-deal-600/[0.07] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Your decision</div>
                      <p className="mt-1 text-[13.5px] text-white/85">{a.decision}</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        <Button onClick={() => approve(i)}>{a.approveLabel}</Button>
                        <Button variant="ghost" onClick={preview}>Adjust</Button>
                      </div>
                    </div>
                  )}

                  {status === "done" && (
                    <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-deal-300">✓ Approved — agent handed off to the next stage</div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {allDone && (
        <Card className="mt-8 overflow-hidden p-0">
          <div className="border-b border-white/10 bg-gradient-to-r from-deal-600/20 to-transparent px-6 py-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Money arrives</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-deal-300">{fmtMoney(VALUATION_STRATEGIC.headline.mid)}</span>
              <span className="text-[13px] text-white/60">wired to escrow → your account</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-serif text-xl font-bold text-white">ExitOS ran your exit end to end.</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
              {AGENTS.length} agents took the company from your uploads to money in the bank. You made {AGENTS.length} approval
              decisions — the platform did the rest. Now WealthOS takes it from here.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/console/wealth" className="rounded-md bg-deal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-deal-500">Open WealthOS →</Link>
              <Button variant="ghost" onClick={() => { setStarted(false); setStatuses(AGENTS.map(() => "queued")); }}>Run again</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Autopilot;
