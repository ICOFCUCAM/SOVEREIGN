import React, { useMemo, useState } from "react";
import { Button, Card, SectionHeader, fmtMoney, preview } from "../lib/ui";
import { BUYERS, DILIGENCE, VALUATION_STRATEGIC, useMemorandum } from "../lib/engines";

// AI Banker Agent — a permanent, always-on investment banker working the
// deal for the founder. It doesn't just list buyers; it runs the process:
// finds and scores buyers, drafts outreach, writes the teaser and CIM,
// fields buyer questions, sets valuation strategy and coordinates diligence
// — then reports progress in the first person, like a service. Every number
// is engine-derived (buyer discovery, diligence, valuation, memorandum).

type Tab = "outreach" | "intros" | "teaser" | "summary";

type WorkStatus = "done" | "active" | "queued";

const STATUS_STYLE: Record<WorkStatus, string> = {
  done:   "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  active: "bg-loi-500/15 text-loi-200 ring-loi-400/40",
  queued: "bg-white/5 text-white/55 ring-white/15",
};

const Banker: React.FC = () => {
  const [tab, setTab] = useState<Tab>("outreach");
  const teaser  = useMemorandum("buyer_teaser");
  const summary = useMemorandum("executive_summary");
  const cim     = useMemorandum("cim");
  const ranked  = useMemo(() => BUYERS.candidates, []);
  const topBuyers = useMemo(() => ranked.slice(0, 6), [ranked]);

  // The agent's deal funnel — nested slices of the ranked buyer pool, the
  // way a banker actually narrows a process.
  const nId        = ranked.length;
  const nShort     = Math.min(7, nId);
  const nContact   = Math.min(4, nShort);
  const nInterest  = Math.min(2, nContact);
  const nDiligence = Math.min(1, nInterest);
  const interested = ranked.slice(0, nInterest);

  const funnel: { label: string; n: number; accent: string }[] = [
    { label: "Identified",   n: nId,        accent: "#64748b" },
    { label: "Shortlisted",  n: nShort,     accent: "#a78bfa" },
    { label: "Contacted",    n: nContact,   accent: "#60a5fa" },
    { label: "Interested",   n: nInterest,  accent: "#fbbf24" },
    { label: "In diligence", n: nDiligence, accent: "#34d399" },
  ];

  const interestedNames = interested.map((b) => b.buyer.name).join(" and ");

  const workstreams: { key: string; title: string; status: WorkStatus; result: string }[] = [
    { key: "find",     title: "Find buyers",              status: "done",   result: `${nId} acquirers identified across strategic & financial` },
    { key: "score",    title: "Score buyers",             status: "done",   result: "Ranked by sector × check size × geography × activity" },
    { key: "outreach", title: "Draft outreach",           status: "done",   result: `${SEQUENCE.length}-step campaign drafted; teaser sent to ${nContact}` },
    { key: "teaser",   title: "Create teaser",            status: teaser ? "done" : "active", result: teaser ? `${teaser.wordCount}-word anonymized teaser ready` : "Writing anonymized teaser…" },
    { key: "cim",      title: "Create CIM",               status: cim ? "active" : "active", result: cim ? `${cim.sections.length}-section CIM drafted — final review` : "Drafting confidential memorandum…" },
    { key: "qa",       title: "Answer buyer questions",   status: "active", result: `${DILIGENCE.criticalQuestions.length} live buyer question${DILIGENCE.criticalQuestions.length === 1 ? "" : "s"} being handled` },
    { key: "valuation", title: "Set valuation strategy",  status: "done",   result: `Anchoring the process at the strategic band — ${fmtMoney(VALUATION_STRATEGIC.headline.mid)}` },
    { key: "diligence", title: "Coordinate diligence",    status: "active", result: `${DILIGENCE.redFlags.length} red flag${DILIGENCE.redFlags.length === 1 ? "" : "s"} + ${DILIGENCE.criticalQuestions.length} critical Q${DILIGENCE.criticalQuestions.length === 1 ? "" : "s"} tracked to resolution` },
  ];

  const activity: { when: string; text: string; tone: "good" | "info" | "warn" }[] = [
    { when: "2h ago",  tone: "good", text: `${interestedNames} are showing active interest — pushing both toward an indication of interest.` },
    { when: "5h ago",  tone: "info", text: `Answered a buyer's diligence question on customer concentration with the cohort data.` },
    { when: "1d ago",  tone: "info", text: `Sent the Project Cipher teaser to ${nContact} tier-1 targets; ${nInterest} replied.` },
    { when: "2d ago",  tone: "info", text: `Shortlisted ${nShort} buyers from the ${nId} identified and drafted personalized intros.` },
    { when: "3d ago",  tone: "good", text: `Recommended anchoring the ask at the strategic band, ${fmtMoney(VALUATION_STRATEGIC.headline.mid)}.` },
  ];

  return (
    <div>
      <SectionHeader
        kicker="Always-on · Operator"
        title="AI Banker"
        description="Your permanent investment banker. It finds and scores buyers, drafts the outreach, writes the teaser and CIM, fields buyer questions, sets valuation strategy and coordinates diligence — then reports back, in the first person, like a service."
        actions={<Button onClick={preview}>Brief the banker</Button>}
      />

      {/* ── Agent status — first-person briefing ─────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-deal-600/30 text-[13px] font-bold text-deal-200 ring-1 ring-deal-400/40">
                AB
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-800 bg-deal-400" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">Your AI Banker</div>
                <div className="text-[11px] text-deal-300">● Working the deal · live</div>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/85">
              I've identified <span className="font-semibold text-white">{nId} qualified buyers</span>, shortlisted{" "}
              <span className="font-semibold text-white">{nShort}</span>, opened conversations with{" "}
              <span className="font-semibold text-white">{nContact}</span>, and{" "}
              <span className="font-semibold text-deal-300">{nInterest} are showing active interest</span>
              {interestedNames ? <> — {interestedNames}</> : null}. One is in diligence.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              Next, I'll send the CIM to the two engaged buyers and drive them to competing indications of interest to build leverage.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button onClick={preview}>Approve next step</Button>
              <Button variant="ghost" onClick={preview}>Adjust strategy</Button>
            </div>
          </div>

          {/* working-on-now log */}
          <div className="bg-ink-900/40 p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Recent activity</div>
            <ul className="mt-3 space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.tone === "good" ? "bg-deal-400" : a.tone === "warn" ? "bg-red-400" : "bg-white/40"}`} />
                  <div>
                    <div className="text-[12.5px] leading-snug text-white/80">{a.text}</div>
                    <div className="text-[10px] uppercase tracking-wide text-white/35">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* ── Deal funnel ──────────────────────────────────────────── */}
      <Card className="mt-6 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Deal funnel</div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-5">
          {funnel.map((f, i) => (
            <div key={f.label} className="bg-ink-800/95 p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: f.accent }}>{f.n}</span>
                {i > 0 && <span className="text-[10px] text-white/35">of {funnel[i - 1].n}</span>}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">{f.label}</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${(f.n / funnel[0].n) * 100}%`, background: f.accent }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Workstreams — the eight things the banker does ───────── */}
      <Card className="mt-6 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">What I'm handling for you</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {workstreams.map((w) => (
            <div key={w.key} className="flex items-start gap-3 rounded-lg border border-white/10 bg-ink-900/40 p-3.5">
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[w.status]}`}>{w.status}</span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white">{w.title}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-white/55">{w.result}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── AI Banker · Strategy advisory ────────────────────────── */}
      {(() => {
        const target = VALUATION_STRATEGIC.headline.high;
        const bestBuyer = ranked[0]?.buyer.name ?? "the top strategic";
        const advice = [
          { q: "Best buyer", a: `${bestBuyer} — highest fit and expected outcome in the pool.` },
          { q: "Best timing", a: "Months 7–13 — after the readiness gap closes and while multiples hold." },
          { q: "Best structure", a: "Cash-heavy: ≥75% cash, earnout capped at 15% on audited milestones." },
          { q: "Best outreach", a: "Anonymized teaser → 7-buyer shortlist → competitive indications of interest." },
          { q: "Best valuation", a: `Anchor at the strategic band — ${fmtMoney(VALUATION_STRATEGIC.headline.mid)} mid, ${fmtMoney(target)} stretch.` },
          { q: "Best negotiation", a: "Run all buyers in parallel; counter above strategic-mid with a leverage premium." },
          { q: "Best closing", a: "Escrow ≤8% released in 12 months; reverse break-fee; 30–45 day sign-to-close." },
        ];
        return (
          <Card className="mb-8 p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-deal-600/30 text-[10px] font-bold text-deal-200 ring-1 ring-deal-400/40">AI</span>
              <h2 className="font-serif text-base font-bold text-white">Ask your banker</h2>
            </div>
            <div className="mt-3 rounded-lg border border-deal-500/30 bg-deal-600/[0.07] p-4">
              <div className="text-[12px] text-white/55">"What is the fastest path to a {fmtMoney(target)} exit?"</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/85">
                Shortlist 7 strategics, run a 6-week teaser → IOI → LOI process in parallel, and anchor at{" "}
                <span className="font-mono font-semibold text-deal-300">{fmtMoney(target)}</span>. Close cash-heavy with a tight escrow — the readiness fixes and competitive tension carry the rest.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {advice.map((x) => (
                <div key={x.q} className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-deal-300">{x.q}</div>
                  <div className="mt-1 text-[12.5px] leading-snug text-white/75">{x.a}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* ── Deliverables ─────────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-white">Deliverables</h2>
        <p className="text-xs text-white/45">Everything the banker has produced — ready for you to review and send.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([["outreach", "Outreach campaign"], ["intros", "Buyer introductions"], ["teaser", "Teaser"], ["summary", "Executive summary"]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3.5 py-2 text-[13px] font-semibold transition ${tab === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>{l}</button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "outreach" && (
            <div className="space-y-2">
              {SEQUENCE.map((s, i) => (
                <Card key={s.step} className="flex items-start gap-4 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-deal-600/20 font-mono text-[12px] font-bold text-deal-200 ring-1 ring-deal-400/40">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white">{s.step}</div>
                      <div className="text-[11px] text-white/40">{s.timing}</div>
                    </div>
                    <div className="mt-0.5 text-[12px] leading-snug text-white/60">{s.body}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "intros" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {topBuyers.map((b) => (
                <Card key={b.buyer.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">{b.buyer.name}</div>
                    <span className="font-mono text-[13px] font-bold text-deal-300">{Math.round(b.probability * 100)}%</span>
                  </div>
                  <div className="text-[11px] text-white/45">{b.buyer.buyerType.replace(/_/g, " ")}</div>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/70">
                    Suggested intro: position {teaser ? "Project Cipher" : "the company"} to {b.buyer.name} — {b.rationale}
                  </p>
                  <Button variant="ghost" className="mt-3 text-[12px]" onClick={preview}>Draft introduction</Button>
                </Card>
              ))}
            </div>
          )}

          {(tab === "teaser" || tab === "summary") && (() => {
            const doc = tab === "teaser" ? teaser : summary;
            if (!doc) return <Card className="p-6 text-sm text-white/40">Generating…</Card>;
            return (
              <Card className="p-7">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">Generated by {doc.producedBy}</div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white">{doc.title}</h2>
                <div className="mt-1 text-[11px] text-white/45">{doc.sections.length} sections · {doc.wordCount} words{doc.anonymized ? " · anonymized" : ""}</div>
                <div className="mt-5 space-y-5">
                  {doc.sections.map((s, i) => (
                    <section key={`${i}-${s.heading}`}>
                      <h3 className="font-serif text-base font-bold text-white">{s.heading}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{s.body}</p>
                    </section>
                  ))}
                </div>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

const SEQUENCE = [
  { step: "Build target list", timing: "Day 0", body: "Rank acquirers by fit, appetite and recent activity; segment strategic vs financial." },
  { step: "Issue anonymized teaser", timing: "Day 1", body: "Send Project Cipher teaser to tier-1 targets; no company name pre-NDA." },
  { step: "NDA + data room", timing: "Day 3–7", body: "Counter-sign NDAs, grant staged data-room access on execution." },
  { step: "Management presentations", timing: "Week 2–3", body: "Schedule calls with engaged buyers; distribute the CIM." },
  { step: "Solicit indications", timing: "Week 4", body: "Request non-binding indications of interest; build the offer comparison." },
  { step: "Drive to LOI", timing: "Week 5–6", body: "Run a competitive process to a signed letter of intent." },
];

export default Banker;
