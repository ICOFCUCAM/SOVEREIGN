import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Modal, SectionHeader, fmtMoney } from "../lib/ui";
import { VALUATION_STRATEGIC, BUYERS, NEGOTIATION_STATE, OFFER_COMPARISON } from "../lib/engines";
import { discoverFindings, buildSellerReport } from "../lib/diligence-intel";
import { briefMarkdown, buyerListCsv, sendDeliverable, downloadDeliverable } from "../lib/deliverables";
import { emitTelemetry } from "../lib/telemetry";
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

// Compact buyer row used in the Buyer Discovery work product.
const BuyerRow: React.FC<{ b: BuyerCandidate; n: number; excluded?: boolean; onToggle?: () => void }> = ({ b, n, excluded, onToggle }) => (
  <div className={`flex items-center gap-3 rounded-lg border p-3 ${excluded ? "border-white/10 bg-ink-900/20 opacity-50" : "border-white/10 bg-ink-900/40"}`}>
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[11px] text-white/50">{n}</span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-[13px] font-semibold text-white">{b.buyer.name}</span>
        <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/45 ring-1 ring-white/10">{b.buyer.buyerType.replace(/_/g, " ")}</span>
      </div>
      <div className="mt-0.5 truncate text-[11px] text-white/45">{b.rationale}</div>
    </div>
    <div className="shrink-0 text-right">
      <div className="font-mono text-[13px] font-bold text-deal-300">{Math.round(b.probability * 100)}%</div>
      <div className="text-[10px] text-white/40">{fmtMoney(b.estimatedCheck.low)}–{fmtMoney(b.estimatedCheck.high)}</div>
    </div>
    {onToggle && (
      <button onClick={onToggle} className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 transition ${excluded ? "text-white/50 ring-white/15 hover:bg-white/5" : "text-deal-300 ring-deal-400/40 hover:bg-deal-600/10"}`}>
        {excluded ? "Add" : "Remove"}
      </button>
    )}
  </div>
);

const Autopilot: React.FC = () => {
  const mid = VALUATION_STRATEGIC.headline.mid;
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
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const AGENTS: AgentDef[] = [
    {
      id: "valuation", name: "Valuation Agent", role: "Prices the company across methodologies.",
      work: <>Ran standard, strategic and asset-replacement models → strategic mid <span className="font-mono text-white">{fmtMoney(mid)}</span> (band {fmtMoney(VALUATION_STRATEGIC.headline.low)}–{fmtMoney(VALUATION_STRATEGIC.headline.high)}).</>,
      detail: (
        <div className="space-y-1.5">
          {VALUATION_STRATEGIC.methodologies.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-md border border-white/10 bg-ink-900/40 px-3 py-2 text-[12px]">
              <span className="text-white/75">{m.name}</span>
              <span className="font-mono text-white/85">{fmtMoney(m.band.low)}–{fmtMoney(m.band.high)} · {Math.round(m.weight * 100)}%</span>
            </div>
          ))}
        </div>
      ),
      decision: `Set the asking range anchored at ${fmtMoney(mid)} strategic mid?`, approveLabel: "Approve the ask",
      deliverable: { filename: "valuation-summary.md", build: () => briefMarkdown(
        `Valuation summary — ${fmtMoney(mid)} strategic mid`,
        VALUATION_STRATEGIC.methodologies.map((m) => [m.name, `${fmtMoney(m.band.low)}–${fmtMoney(m.band.high)} (${Math.round(m.weight * 100)}% weight)`] as [string, string]),
        `Strategic band ${fmtMoney(VALUATION_STRATEGIC.headline.low)}–${fmtMoney(VALUATION_STRATEGIC.headline.high)}, mid ${fmtMoney(mid)}.`,
      ) },
    },
    {
      id: "discovery", name: "Buyer Discovery Agent", role: "Finds and ranks acquirers.",
      work: <>Scanned the buyer universe → <span className="font-mono text-white">{allBuyers.length}</span> qualified, shortlisted the top <span className="font-mono text-white">{shortlist.length}</span> by fit and outcome.</>,
      detail: (
        <div className="space-y-2">
          {shortlist.map((b, i) => <BuyerRow key={b.buyer.name} b={b} n={i + 1} />)}
          {shortlist.length === 0 && <div className="text-[12px] text-white/45">No buyers selected — add at least one in Adjust.</div>}
        </div>
      ),
      decision: `Approve the ${shortlist.length}-buyer target list?`, approveLabel: "Approve the list",
      deliverable: { filename: "buyer-shortlist.csv", build: () => buyerListCsv(shortlist) },
    },
    {
      id: "outreach", name: "Outreach Agent", role: "Drafts and runs the approach.",
      work: <>Wrote the anonymized teaser and a six-step outreach sequence; intros personalized per buyer.</>,
      decision: `Send the anonymized teaser to the ${shortlist.length} shortlisted buyers?`, approveLabel: "Send outreach",
      deliverable: { filename: "outreach-plan.md", build: () => briefMarkdown("Outreach plan — Project Cipher", [
        ["Teaser", "anonymized, issued pre-NDA"],
        ["Sequence", "6 steps: target list → teaser → NDA → management presentations → IOIs → LOI"],
        ["Targets", `${shortlist.length} shortlisted buyers`],
        ["Personalization", "intro letter per buyer from its match rationale"],
      ]) },
    },
    {
      id: "dataroom", name: "Data Room Agent", role: "Provisions and gates diligence.",
      work: <>Provisioned seven rooms and wired access behind signed NDAs + the Buyer Trust score.</>,
      decision: "Auto-grant data-room access to verified, NDA-signed buyers?", approveLabel: "Approve gating",
      deliverable: { filename: "data-room-gating.md", build: () => briefMarkdown("Data-room gating policy", [
        ["Access control", "NDA-gated + Buyer Trust score ≥ Verified"],
        ["Rooms", "7 staged packages"],
        ["Trust gates", "NDA signed · identity · acquisition history · funds verified"],
      ]) },
    },
    {
      id: "diligence", name: "Diligence Agent", role: "Finds the risks before buyers do.",
      work: <>Ran the intelligence engine → <span className="font-mono text-white">{findings.length}</span> risks ({high} high-severity). Seller report drafted; ~{fmtMoney(sellerReport.totalImpactUsd)} of value to protect.</>,
      detail: (
        <div className="space-y-1.5">
          {sellerReport.points.map((p) => (
            <div key={p.title} className="rounded-md border border-white/10 bg-ink-900/40 px-3 py-2">
              <div className="text-[12px] font-semibold text-white">{p.title}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/55">{p.body}</div>
            </div>
          ))}
        </div>
      ),
      decision: "Approve the pre-market remediation plan and disclosure schedule?", approveLabel: "Approve the plan",
      deliverable: { filename: "seller-diligence-report.md", build: () => briefMarkdown(
        sellerReport.title,
        sellerReport.points.map((p) => [p.title, p.body] as [string, string]),
        `${sellerReport.headline}\n\nRecommendation: ${sellerReport.recommendation}`,
      ) },
    },
    {
      id: "negotiation", name: "Negotiation Agent", role: "Scores offers and counters.",
      work: <>Scoring <span className="font-mono text-white">{NEGOTIATION_STATE.activeOffers}</span> offers; leverage <span className="text-white">{NEGOTIATION_STATE.leverage}</span>{leaderName ? <> · <span className="text-white">{leaderName}</span> leads</> : null}.</>,
      decision: leaderName ? `Approve the counter and drive ${leaderName} to a signed LOI?` : "Approve the counter strategy and drive to LOI?", approveLabel: "Approve the counter",
      deliverable: { filename: "offer-comparison.md", build: () => briefMarkdown("Offer comparison", [
        ["Active offers", String(NEGOTIATION_STATE.activeOffers)],
        ["Leverage", String(NEGOTIATION_STATE.leverage)],
        ["Leader", leaderName ?? "—"],
        ...OFFER_COMPARISON.delta.map((d) => [d.term, d.notes] as [string, string]),
      ], OFFER_COMPARISON.summary) },
    },
    {
      id: "closing", name: "Closing Agent", role: "Orchestrates signatures and escrow.",
      work: <>Assembled the closing checklist; tracking signatures, escrow funding and regulatory filings to the wire.</>,
      decision: "Approve proceeding to signing and funding the escrow?", approveLabel: "Approve close",
      deliverable: { filename: "closing-checklist.md", build: () => briefMarkdown("Closing checklist", [
        ["Signatures", "SPA + disclosure schedules — tracked per party"],
        ["Escrow", "funding instructions issued; ≤8% / 12-month release"],
        ["Filings", "regulatory + corporate filings to the wire"],
      ]) },
    },
    {
      id: "wealth", name: "Wealth Agent", role: "Manages the proceeds after the wire.",
      work: <>Modeled proceeds through tax, scheduled the liquidity and drafted the diversification plan in WealthOS.</>,
      decision: "Approve the wealth transition plan?", approveLabel: "Approve & finish",
      deliverable: { filename: "wealth-transition-plan.md", build: () => briefMarkdown("Wealth transition plan", [
        ["Proceeds", `${fmtMoney(mid)} headline → modeled through tax`],
        ["Liquidity", "staged schedule post-close"],
        ["Diversification", "concentrated position → durable portfolio"],
      ]) },
    },
  ];

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
    setStatuses((prev) => prev.map((s, idx) => {
      if (idx === i) return "done";
      if (idx === i + 1) return "working";
      return s;
    }));
  };

  const send = (a: AgentDef): void => {
    sendDeliverable(a.deliverable.filename, a.deliverable.build());
    setSent((prev) => new Set(prev).add(a.id));
  };

  const doneCount = statuses.filter((s) => s === "done").length;
  const awaitingIndex = statuses.findIndex((s) => s === "awaiting");
  const allDone = doneCount === AGENTS.length;
  const progressPct = Math.round((doneCount / AGENTS.length) * 100);
  const reviewAgent = reviewIdx != null ? AGENTS[reviewIdx] : null;

  return (
    <div>
      <SectionHeader
        kicker="Phase 3 · Autonomous"
        title="Autonomous Exit"
        description="You uploaded revenue, financials and a cap table. ExitOS does the rest — value, readiness, buyers, data room, documents, outreach, negotiation, closing and wealth. Your job is three words: approve, approve, approve."
      />

      {/* ── Review / Adjust modal ─────────────────────────────────── */}
      <Modal open={!!reviewAgent} onClose={() => setReviewIdx(null)} title={reviewAgent ? reviewAgent.name : ""} subtitle={reviewAgent?.role} size="lg"
        footer={reviewAgent ? <>
          <Button variant="ghost" onClick={() => downloadDeliverable(reviewAgent.deliverable.filename, reviewAgent.deliverable.build())}>Download deliverable</Button>
          <Button onClick={() => { send(reviewAgent); }}>{sent.has(reviewAgent.id) ? "Sent ✓ · resend" : "Send deliverable"}</Button>
        </> : null}>
        {reviewAgent && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5 text-[13px] leading-snug text-white/75">{reviewAgent.work}</div>
            {reviewAgent.id === "discovery" ? (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Shortlist · {shortlist.length} of {proposed.length} — remove any before approving</div>
                <div className="space-y-2">
                  {proposed.map((b, i) => <BuyerRow key={b.buyer.name} b={b} n={i + 1} excluded={excluded.has(b.buyer.name)} onToggle={() => toggle(b.buyer.name)} />)}
                </div>
              </div>
            ) : reviewAgent.detail}
            <div className="rounded-md border border-deal-500/30 bg-deal-600/[0.07] p-3 text-[12px] text-white/70">
              Deliverable: <span className="font-mono text-deal-300">{reviewAgent.deliverable.filename}</span> — download to review, or send to attach it to the process.
            </div>
          </div>
        )}
      </Modal>

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

                  {/* Inline work product — show the buyer list right on the discovery row */}
                  {revealed && a.id === "discovery" && (
                    <div className="mt-3 space-y-2">{shortlist.map((b, n) => <BuyerRow key={b.buyer.name} b={b} n={n + 1} />)}</div>
                  )}

                  {status === "awaiting" && (
                    <div className="mt-3 rounded-lg border border-deal-500/30 bg-deal-600/[0.07] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Your decision</div>
                      <p className="mt-1 text-[13.5px] text-white/85">{a.decision}</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        <Button onClick={() => approve(i)}>{a.approveLabel}</Button>
                        <Button variant="ghost" onClick={() => setReviewIdx(i)}>Adjust / review</Button>
                      </div>
                    </div>
                  )}

                  {status === "done" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-deal-300">✓ Approved</span>
                      <span className="text-white/20">·</span>
                      <button className="text-[11px] font-semibold uppercase tracking-wide text-white/55 hover:text-white" onClick={() => setReviewIdx(i)}>Review</button>
                      <button className="text-[11px] font-semibold uppercase tracking-wide text-white/55 hover:text-white" onClick={() => downloadDeliverable(a.deliverable.filename, a.deliverable.build())}>Download</button>
                      <button className="text-[11px] font-semibold uppercase tracking-wide text-deal-300 hover:text-deal-200" onClick={() => send(a)}>{sent.has(a.id) ? "Sent ✓" : "Send"}</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Deliverables produced ────────────────────────────────── */}
      {doneCount > 0 && (
        <Card className="mt-8 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Deliverables produced</div>
          <div className="mt-4 space-y-2">
            {AGENTS.filter((_, i) => statuses[i] === "done").map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white">{a.name}</div>
                  <div className="font-mono text-[11px] text-white/45">{a.deliverable.filename}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" className="text-[12px]" onClick={() => downloadDeliverable(a.deliverable.filename, a.deliverable.build())}>Download</Button>
                  <Button className="text-[12px]" onClick={() => send(a)}>{sent.has(a.id) ? "Sent ✓ · resend" : "Send"}</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
              <Button variant="ghost" onClick={() => { setStarted(false); setStatuses(AGENTS.map(() => "queued")); setSent(new Set()); }}>Run again</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Autopilot;
