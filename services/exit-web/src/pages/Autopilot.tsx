import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, LockIcon, Modal, fmtMoney, notify } from "../lib/ui";
import { PageHeader } from "../components/xo";

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <div className={`border border-xo-line bg-xo-panel ${className}`}>{children}</div>
);
import { NEGOTIATION_STATE, OFFER_COMPARISON } from "../lib/engines";
import { runInstitutionalValuation, strategicBuyerReport, runBuyerDiscovery, runDueDiligence } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { discoverFindings, buildSellerReport } from "../lib/diligence-intel";
import {
  institutionalValuationMemo, buyerShortlistMemo, riskReportDoc,
  outreachPlanDoc, dataRoomGatingDoc, offerComparisonDoc, closingChecklistDoc, wealthPlanDoc,
  downloadDeliverable,
} from "../lib/deliverables";
import { emitTelemetry } from "../lib/telemetry";
import { useAuth } from "../lib/auth";
import { needsUpgrade, PLAN_LABEL } from "../lib/access";
import { label } from "../lib/labels";
import type { BuyerCandidate } from "@exit/engines";

// Autonomous Exit Mode — "Sell my company," not "manage the sale." Seven
// specialist agents run the process end to end; the founder only approves
// decisions at each gate. Each agent's work product is engine-derived
// (valuation, buyer discovery, listing, diligence intelligence, negotiation)
// and produces a real, downloadable deliverable. "Adjust" opens the work
// product for review — and, for the buyer list, lets you edit the shortlist
// before approving.

type AgentStatus = "queued" | "working" | "awaiting" | "done";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  work: React.ReactNode;        // headline of what the agent produced
  detail?: React.ReactNode;     // richer review content (e.g. the buyer list)
  decision: string;            // the single decision the founder approves
  approveLabel: string;
  deliverable: { filename: string; build: () => string };
  reportPath?: string;          // institutional A4 PDF document, where one exists
  detailNote?: string;          // which inputs are still demo fixtures
}

const STATUS_STYLE: Record<AgentStatus, string> = {
  queued:   "bg-xo-raise text-xo-faint ring-xo-line",
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

// Buyer row used in the Buyer Discovery work product — surfaces the engine's
// real signals: probability, expected offer/close, premium, sectors/geography
// and confidence, not just a name and a percentage.
const Sig: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <div className="min-w-0">
    <div className="font-mono text-[12px] font-bold leading-none" style={{ color: accent ?? "#cbd5e1" }}>{value}</div>
    <div className="mt-0.5 text-[9px] uppercase tracking-wide text-xo-faint">{label}</div>
  </div>
);

const BuyerRow: React.FC<{ b: BuyerCandidate; n: number; excluded?: boolean; onToggle?: () => void }> = ({ b, n, excluded, onToggle }) => {
  const eo = b.expectedOutcome;
  return (
    <div className={`rounded-sm border p-3.5 ${excluded ? "border-xo-line bg-xo-ink opacity-50" : "border-xo-line bg-xo-ink"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-xo-raise font-mono text-[11px] text-xo-muted">{n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-xo-text">{b.buyer.name}</span>
            <span className="shrink-0 rounded-full bg-xo-raise px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-xo-faint ring-1 ring-xo-line">{label(b.buyer.buyerType)}</span>
            <span className="shrink-0 text-[9px] uppercase tracking-wide text-xo-faint">{eo.overallConfidence.tier} conf.</span>
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-xo-faint">{b.rationale}</div>
          <div className="mt-1 truncate text-[10px] text-xo-faint">{b.buyer.sectorsActive.slice(0, 3).map((s) => s.replace(/_/g, " ")).join(" · ")} · {b.buyer.geographyPreferred.length ? b.buyer.geographyPreferred.slice(0, 4).join(" ") : "Global"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[14px] font-bold text-deal-300">{Math.round(b.probability * 100)}%</div>
          <div className="text-[10px] text-xo-faint">fit</div>
        </div>
        {onToggle && (
          <button onClick={onToggle} className={`shrink-0 self-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 transition ${excluded ? "text-xo-muted ring-xo-line hover:bg-xo-raise" : "text-deal-300 ring-deal-400/40 hover:bg-deal-600/10"}`}>
            {excluded ? "Add" : "Remove"}
          </button>
        )}
      </div>
      {/* engine signals */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-xo-line pt-2.5 sm:grid-cols-4">
        <Sig label="Expected offer" value={fmtMoney(eo.expectedHeadlineUsd)} accent="#7CFF9F" />
        <Sig label="Expected net" value={fmtMoney(eo.expectedClosingUsd)} />
        <Sig label="Days to close" value={`~${Math.round(eo.expectedDaysToCash)}d`} />
        <Sig label="Check range" value={`${fmtMoney(b.estimatedCheck.low)}–${fmtMoney(b.estimatedCheck.high)}`} />
      </div>
    </div>
  );
};

const Autopilot: React.FC = () => {
  // Valuation and buyer discovery run on the founder's company (or the demo
  // company); diligence findings and offers are still demo fixtures.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const { VALUATION_INSTITUTIONAL, VALUATION_STRATEGIC, VALUATION_CANONICAL, BUYERS, DILIGENCE } = useMemo(() => {
    const inst = runInstitutionalValuation(company);
    const strategic = strategicBuyerReport(company);
    return {
      VALUATION_INSTITUTIONAL: inst, VALUATION_STRATEGIC: strategic,
      VALUATION_CANONICAL: canonicalValuationFor(company, inst, strategic),
      BUYERS: runBuyerDiscovery(company, { limit: 12 }), DILIGENCE: runDueDiligence(company),
    };
  }, [company]);
  const mid = VALUATION_CANONICAL.headline.mid;
  const allBuyers = BUYERS.candidates;
  const findings = useMemo(() => discoverFindings(), []);
  const high = findings.filter((f) => f.severity === "high").length;
  const sellerReport = useMemo(() => buildSellerReport(findings), [findings]);
  const leaderName = OFFER_COMPARISON.offers[0]?.offer.buyerName;

  // Editable shortlist — the Buyer Discovery agent proposes the top 7; the
  // founder can remove names in the Adjust modal before approving.
  const proposed = useMemo(() => allBuyers.slice(0, Math.min(7, allBuyers.length)), [allBuyers]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const shortlist = useMemo(() => proposed.filter((b) => !excluded.has(b.buyer.name)), [proposed, excluded]);
  const toggle = (name: string): void => setExcluded((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const AGENTS: AgentDef[] = [
    {
      id: "valuation", name: "Valuation Agent", role: "Prices the company across methodologies.",
      work: <>Ran standard, strategic and asset-replacement models; console value (institutional framework) <span className="font-mono text-xo-text">{fmtMoney(mid)}</span> (band {fmtMoney(VALUATION_CANONICAL.headline.low)}–{fmtMoney(VALUATION_CANONICAL.headline.high)}).</>,
      detail: (
        <div className="space-y-1.5">
          {VALUATION_STRATEGIC.methodologies.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-md border border-xo-line bg-xo-ink px-3 py-2 text-[12px]">
              <span className="text-xo-text">{m.name}</span>
              <span className="font-mono text-xo-text">{fmtMoney(m.band.low)}–{fmtMoney(m.band.high)} · {Math.round(m.weight * 100)}%</span>
            </div>
          ))}
        </div>
      ),
      decision: `Set the asking range anchored at ${fmtMoney(mid)} strategic mid?`, approveLabel: "Approve the ask",
      deliverable: { filename: "institutional-valuation.md", build: () => institutionalValuationMemo(VALUATION_INSTITUTIONAL) },
      reportPath: "/report/valuation",
    },
    {
      id: "discovery", name: "Buyer Discovery Agent", role: "Finds and ranks acquirers.",
      work: <>Scanned the buyer universe → <span className="font-mono text-xo-text">{allBuyers.length}</span> qualified, shortlisted the top <span className="font-mono text-xo-text">{shortlist.length}</span> by fit and outcome.</>,
      detail: (
        <div className="space-y-2">
          {shortlist.map((b, i) => <BuyerRow key={b.buyer.name} b={b} n={i + 1} />)}
          {shortlist.length === 0 && <div className="text-[12px] text-xo-faint">No buyers selected — add at least one in Adjust.</div>}
        </div>
      ),
      decision: `Approve the ${shortlist.length}-buyer target list?`, approveLabel: "Approve the list",
      deliverable: { filename: "buyer-target-list.md", build: () => buyerShortlistMemo(shortlist, "Project Cipher") },
      reportPath: "/report/buyers",
    },
    {
      id: "outreach", name: "Outreach Agent", role: "Drafts and runs the approach.",
      work: <>Wrote the anonymized teaser and a six-step outreach sequence; intros personalized per buyer.</>,
      decision: `Send the anonymized teaser to the ${shortlist.length} shortlisted buyers?`, approveLabel: "Send outreach",
      deliverable: { filename: "outreach-plan.md", build: () => outreachPlanDoc({ projectName: "Project Cipher", shortlistCount: shortlist.length, anchor: fmtMoney(mid) }) },
    },
    {
      id: "dataroom", name: "Data Room Agent", role: "Provisions and gates diligence.",
      work: <>Provisioned seven rooms and wired access behind signed NDAs + the Buyer Trust score.</>,
      decision: "Auto-grant data-room access to verified, NDA-signed buyers?", approveLabel: "Approve gating",
      deliverable: { filename: "data-room-gating.md", build: () => dataRoomGatingDoc(DILIGENCE.documents.length) },
    },
    {
      id: "diligence", name: "Diligence Agent", role: "Finds the risks before buyers do.",
      work: <>Ran the intelligence engine → <span className="font-mono text-xo-text">{findings.length}</span> risks ({high} high-severity). Seller report drafted; ~{fmtMoney(sellerReport.totalImpactUsd)} of value to protect.</>,
      detail: (
        <div className="space-y-1.5">
          {sellerReport.points.map((p) => (
            <div key={p.title} className="rounded-md border border-xo-line bg-xo-ink px-3 py-2">
              <div className="text-[12px] font-semibold text-xo-text">{p.title}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-xo-muted">{p.body}</div>
            </div>
          ))}
        </div>
      ),
      ...(fromIntake ? { detailNote: "Diligence findings use the demo company's sample data." } : {}),
      decision: "Approve the pre-market remediation plan and disclosure schedule?", approveLabel: "Approve the plan",
      deliverable: { filename: "seller-diligence-report.md", build: () => riskReportDoc(sellerReport) },
      reportPath: "/report/readiness",
    },
    {
      id: "negotiation", name: "Negotiation Agent", role: "Scores offers and counters.",
      work: <>Scoring <span className="font-mono text-xo-text">{NEGOTIATION_STATE.activeOffers}</span> sample offers (demo data); leverage <span className="text-xo-text">{NEGOTIATION_STATE.leverage}</span>{leaderName ? <> · <span className="text-xo-text">{leaderName}</span> leads</> : null}.</>,
      decision: leaderName ? `Approve the counter and drive ${leaderName} to a signed LOI?` : "Approve the counter strategy and drive to LOI?", approveLabel: "Approve the counter",
      deliverable: { filename: "offer-comparison.md", build: () => offerComparisonDoc({
        summary: OFFER_COMPARISON.summary,
        offers: OFFER_COMPARISON.offers.map((e) => ({
          buyer: e.offer.buyerName, type: e.offer.buyerType, score: `${e.score.toFixed(0)}/100`,
          headline: fmtMoney(e.offer.headlinePriceUsd), net: fmtMoney(e.impliedNetToFoundersUsd),
        })),
        dynamics: OFFER_COMPARISON.delta.map((d) => [d.term, d.notes] as [string, string]),
        posture: [
          `Active offers: ${NEGOTIATION_STATE.activeOffers}`,
          `Leverage: ${NEGOTIATION_STATE.leverage}`,
          `Leading bid: ${leaderName ?? "—"}`,
          `Next move: ${NEGOTIATION_STATE.nextMove}`,
        ],
      }) },
    },
    {
      id: "closing", name: "Closing Agent", role: "Orchestrates signatures and escrow.",
      work: <>Assembled the closing checklist; tracking signatures, escrow funding and regulatory filings to the wire.</>,
      decision: "Approve proceeding to signing and funding the escrow?", approveLabel: "Approve close",
      deliverable: { filename: "closing-checklist.md", build: closingChecklistDoc },
    },
    {
      id: "wealth", name: "Wealth Agent", role: "Manages the proceeds after the wire.",
      work: <>Modeled proceeds through tax, scheduled the liquidity and drafted the diversification plan in WealthOS.</>,
      decision: "Approve the wealth transition plan?", approveLabel: "Approve & finish",
      deliverable: { filename: "wealth-transition-plan.md", build: () => wealthPlanDoc(fmtMoney(mid)) },
    },
  ];

  const { session, upgradeTo } = useAuth();
  // Before an Active Mandate, the agents run only as far as "buyers found" —
  // the Buyer Discovery gate — then the founder upgrades to engage. Read from
  // the access policy: outreach is an Active Mandate surface, so any plan that
  // still needs an upgrade for it (Preparation, the retired Starter key) stops here.
  const isStarter = needsUpgrade("/console/banker", session?.role ?? "founder", session?.plan ?? "free");
  const GATE = AGENTS.findIndex((a) => a.id === "discovery");

  const [started, setStarted] = useState(false);
  const [statuses, setStatuses] = useState<AgentStatus[]>(() => AGENTS.map(() => "queued"));
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

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
    // Starter plan: approving the Buyer Discovery step finds the buyers and then
    // pauses — the remaining agents are Pro-gated.
    if (isStarter && i === GATE) {
      setStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      return;
    }
    setStatuses((prev) => prev.map((s, idx) => {
      if (idx === i) return "done";
      if (idx === i + 1) return "working";
      return s;
    }));
  };

  // Buyers have been found and the founder is on Starter — unlock Pro and let
  // the rest of the process run.
  const unlockAndContinue = (): void => {
    upgradeTo("pro");
    setStatuses((prev) => prev.map((s, idx) => (idx === GATE + 1 && s === "queued" ? "working" : s)));
  };
  const starterGated = isStarter && statuses[GATE] === "done";

  // "Mark ready" records that the founder has signed off a deliverable. In
  // this simulation nothing is delivered anywhere, and the toast says so.
  const send = (a: AgentDef): void => {
    setSent((prev) => new Set(prev).add(a.id));
    notify(`${a.name} deliverable marked ready — in this simulation nothing leaves ExitOS`);
  };

  const doneCount = statuses.filter((s) => s === "done").length;
  const awaitingIndex = statuses.findIndex((s) => s === "awaiting");
  const allDone = doneCount === AGENTS.length;
  const progressPct = Math.round((doneCount / AGENTS.length) * 100);
  const reviewAgent = reviewIdx != null ? AGENTS[reviewIdx] : null;

  return (
    <div data-page="autonomous-exit" className="space-y-3 text-xo-text">
      <PageHeader
        eyebrow={`Phase 3 · Autonomous · Guided simulation · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`}
        title="Autonomous Exit"
        description={isStarter
          ? `On ${PLAN_LABEL[session?.plan ?? "prep"]}, the agents take you through valuation and buyer discovery — and stop the moment buyers are found. An ${PLAN_LABEL.pro} runs outreach, negotiation, closing and wealth.`
          : "A walkthrough of how the agents would run an exit on the figures ExitOS holds — value, buyers, data room, documents, outreach, negotiation, closing and wealth. Each step waits for your approval."}
      />

      <div className="mt-2 flex items-start gap-2 rounded-sm border border-loi-400/30 bg-loi-500/[0.07] px-4 py-2.5 text-[12px] text-loi-100/90">
        <span className="mt-0.5 shrink-0 rounded bg-loi-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-loi-200 ring-1 ring-loi-400/40">Simulated</span>
        <span>This is a guided walkthrough of the orchestration. Each step is illustrative and advances on your approval — no live outreach, escrow or wires are executed. The valuations, buyer lists and deliverables shown are real engine output.</span>
      </div>

      {/* ── Review / Adjust modal ─────────────────────────────────── */}
      <Modal open={!!reviewAgent} onClose={() => setReviewIdx(null)} title={reviewAgent ? reviewAgent.name : ""} subtitle={reviewAgent?.role} size="lg"
        footer={reviewAgent ? <>
          {reviewAgent.reportPath
            ? <a href={reviewAgent.reportPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md bg-deal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-deal-800">Open board-ready PDF →</a>
            : <Button variant="ghost" onClick={() => downloadDeliverable(reviewAgent.deliverable.filename, reviewAgent.deliverable.build())}>Download draft (.md)</Button>}
          <Button onClick={() => { send(reviewAgent); }}>{sent.has(reviewAgent.id) ? "✓ Marked ready" : "Mark ready"}</Button>
        </> : null}>
        {reviewAgent && (
          <div className="space-y-4">
            <div className="rounded-sm border border-xo-line bg-xo-ink p-3.5 text-[13px] leading-snug text-xo-text">{reviewAgent.work}</div>
            {reviewAgent.id === "discovery" ? (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-xo-faint">Shortlist · {shortlist.length} of {proposed.length} — remove any before approving</div>
                <div className="space-y-2">
                  {proposed.map((b, i) => <BuyerRow key={b.buyer.name} b={b} n={i + 1} excluded={excluded.has(b.buyer.name)} onToggle={() => toggle(b.buyer.name)} />)}
                </div>
              </div>
            ) : reviewAgent.detail}
            <div className="rounded-md border border-deal-500/30 bg-deal-600/[0.07] p-3 text-[12px] text-xo-text">
              Deliverable: <span className="font-mono text-deal-300">{reviewAgent.deliverable.filename}</span> — download to review, or mark it ready. Nothing is sent from this simulation.
            </div>
          </div>
        )}
      </Modal>

      {/* ── Mission control ──────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-xo-line p-7 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">One instruction</div>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-xo-text">"Sell my company."</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-xo-muted">
              ExitOS lays out {AGENTS.length} agents — valuation, buyer discovery, outreach, data room, diligence,
              negotiation, closing and wealth — in sequence. Each pauses to put one decision in front of you. In this
              simulation nothing is sent, signed or wired.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!started && <Button onClick={start}>Start Exit Process →</Button>}
              {started && !allDone && (
                <span className="inline-flex items-center gap-2 rounded-md bg-loi-500/15 px-3 py-2 text-[12px] font-semibold text-loi-200 ring-1 ring-loi-400/40">
                  ● {starterGated ? "Buyers found · upgrade to continue" : `Running · ${awaitingIndex >= 0 ? `${AGENTS[awaitingIndex].name} needs you` : "agents working"}`}
                </span>
              )}
              {allDone && (
                <span className="inline-flex items-center gap-2 rounded-md bg-deal-600/20 px-3 py-2 text-[12px] font-semibold text-deal-200 ring-1 ring-deal-500/40">
                  ✓ Simulation complete · you approved {AGENTS.length} decisions
                </span>
              )}
            </div>
          </div>
          <div className="bg-xo-ink p-7">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-xo-faint">Process progress</div>
              <div className="font-mono text-[11px] text-xo-faint">{doneCount}/{AGENTS.length}</div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-deal-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-sm border border-xo-line bg-xo-ink p-3">
                <div className="font-mono text-2xl font-bold text-deal-300">{started ? doneCount : "—"}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-xo-faint">Decisions approved</div>
              </div>
              <div className="rounded-sm border border-xo-line bg-xo-ink p-3">
                <div className="font-mono text-2xl font-bold text-loi-300">{started && !allDone ? (awaitingIndex >= 0 ? 1 : 0) : 0}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-xo-faint">Awaiting you</div>
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
          const locked = isStarter && i > GATE;
          return (
            <Card key={a.id} className={`p-5 transition ${status === "awaiting" ? "ring-1 ring-deal-400/40" : ""} ${locked ? "opacity-55" : ""}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-sm text-[13px] font-bold ring-1 ${STATUS_STYLE[status]}`}>
                    {locked ? <LockIcon size={12} /> : status === "done" ? "✓" : status === "working" ? <Spinner /> : i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-xo-text">{a.name}</span>
                      <span className="ml-2 text-[12px] text-xo-faint">{a.role}</span>
                    </div>
                    {locked
                      ? <span className="rounded-full bg-loi-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-loi-300 ring-1 ring-loi-400/40">Requires {PLAN_LABEL.pro}</span>
                      : <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[status]}`}>
                          {status === "working" ? "Working…" : STATUS_LABEL[status]}
                        </span>}
                  </div>

                  {revealed && (
                    <div className="mt-2 text-[13px] leading-snug text-xo-text">{a.work}</div>
                  )}
                  {revealed && a.detailNote && <div className="mt-1 text-[12px] text-loi-300">{a.detailNote}</div>}

                  {/* Inline work product — show the buyer list right on the discovery row */}
                  {revealed && a.id === "discovery" && (
                    <div className="mt-3 space-y-2">{shortlist.map((b, n) => <BuyerRow key={b.buyer.name} b={b} n={n + 1} />)}</div>
                  )}

                  {status === "awaiting" && (
                    <div className="mt-3 rounded-sm border border-deal-500/30 bg-deal-600/[0.07] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Your decision · simulated</div>
                      <p className="mt-1 text-[13.5px] text-xo-text">{a.decision}</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        <Button onClick={() => approve(i)}>{a.approveLabel}</Button>
                        <Button variant="ghost" onClick={() => setReviewIdx(i)}>Adjust / review</Button>
                      </div>
                    </div>
                  )}

                  {status === "done" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-deal-300">✓ Approved</span>
                      <span className="text-xo-faint">·</span>
                      <button className="text-[11px] font-semibold uppercase tracking-wide text-xo-muted hover:text-xo-text" onClick={() => setReviewIdx(i)}>Review</button>
                      {a.reportPath
                        ? <a className="text-[11px] font-semibold uppercase tracking-wide text-xo-muted hover:text-xo-text" href={a.reportPath} target="_blank" rel="noopener noreferrer">PDF →</a>
                        : <button className="text-[11px] font-semibold uppercase tracking-wide text-xo-muted hover:text-xo-text" onClick={() => downloadDeliverable(a.deliverable.filename, a.deliverable.build())}>Download .md</button>}
                      <button className="text-[11px] font-semibold uppercase tracking-wide text-deal-300 hover:text-deal-200" onClick={() => send(a)}>{sent.has(a.id) ? "✓ Ready" : "Mark ready"}</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Starter gate — buyers found, upgrade to continue ─────── */}
      {starterGated && (
        <Card className="mt-8 overflow-hidden p-0 ring-1 ring-deal-400/40">
          <div className="border-b border-xo-line bg-gradient-to-r from-deal-600/20 to-transparent px-6 py-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Buyers found</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-deal-300">{shortlist.length} matched acquirers</span>
              <span className="text-[13px] text-xo-muted">are ready to engage your listing</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-serif text-xl font-bold text-xo-text">This is where listing ends — and the deal begins.</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-xo-muted">
              ExitOS priced the company and matched {shortlist.length} buyers. To open
              conversations, run outreach, negotiate offers and close — and let the remaining agents finish the job —
              launch an Active Mandate.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button onClick={unlockAndContinue}>Launch a mandate & continue →</Button>
              <span className="basis-full text-[12px] text-xo-muted">Demo: this switches your session to {PLAN_LABEL.pro} instantly — no payment is taken.</span>
              <Link to="/pricing" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-xo-text ring-1 ring-xo-line transition hover:bg-xo-raise">See pricing</Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Deliverables produced ────────────────────────────────── */}
      {doneCount > 0 && (
        <Card className="mt-8 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-xo-faint">Deliverables produced</div>
          <div className="mt-4 space-y-2">
            {AGENTS.filter((_, i) => statuses[i] === "done").map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-sm border border-xo-line bg-xo-ink px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-xo-text">{a.name}</div>
                  <div className="font-mono text-[11px] text-xo-faint">{a.deliverable.filename}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" className="text-[12px]" onClick={() => downloadDeliverable(a.deliverable.filename, a.deliverable.build())}>Download</Button>
                  <Button className="text-[12px]" onClick={() => send(a)}>{sent.has(a.id) ? "✓ Marked ready" : "Mark ready"}</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {allDone && (
        <Card className="mt-8 overflow-hidden p-0">
          <div className="border-b border-xo-line bg-gradient-to-r from-deal-600/20 to-transparent px-6 py-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Simulation complete</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-deal-300">{fmtMoney(VALUATION_CANONICAL.headline.mid)}</span>
              <span className="text-[13px] text-xo-muted">enterprise value used in this walkthrough — no money moves</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-serif text-xl font-bold text-xo-text">That is the whole process, end to end.</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-xo-muted">
              You approved {AGENTS.length} simulated decisions. In a live mandate these steps run with real buyers, documents
              and escrow; here each step was simulated on engine output. WealthOS covers what happens after a real close.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/console/wealth" className="rounded-md bg-deal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-deal-800">Open WealthOS →</Link>
              <Button variant="ghost" onClick={() => { setStarted(false); setStatuses(AGENTS.map(() => "queued")); setSent(new Set()); }}>Run again</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Autopilot;
