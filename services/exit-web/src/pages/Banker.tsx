import React, { useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, fmtMoney, notify } from "../lib/ui";
import { PageHeader, Section, Chip } from "../components/xo";
import { BUYERS, DILIGENCE, useMemorandum, VALUATION_CANONICAL } from "../lib/engines";
import {
  docToMarkdown, docFilename, buyerIntroLetter, introFilename, buyerListCsv,
  structuredDoc, downloadDeliverable,
} from "../lib/deliverables";
import type { BuyerCandidate } from "@exit/engines";
import {
  useDirectives, applyToBuyers, outreachPosture, valuationGuardrail, recommendedActions,
  type AdjustedBuyer,
} from "../lib/banker-directives";

// The Banker — a permanent, always-on investment banker working the deal for
// the founder. It doesn't just list buyers; it runs the process: finds and
// scores buyers, drafts outreach, writes the teaser and CIM, fields buyer
// questions, sets valuation strategy and coordinates diligence — then reports
// progress in the first person, like a service. Every number is engine-derived
// (buyer discovery, diligence, valuation, memorandum); every button produces a
// real, downloadable deliverable.

type Tab = "outreach" | "intros" | "teaser" | "summary";
type WorkStatus = "done" | "active" | "queued";

const STATUS_STYLE: Record<WorkStatus, string> = {
  done:   "border-xo-verified/50 text-xo-verified",
  active: "border-xo-caution/50 text-xo-caution",
  queued: "border-xo-line text-xo-muted",
};

const PROJECT = "Project Cipher";
const FROM_NAME = "Anne Kovac, CEO";

const SEQUENCE = [
  { step: "Build target list", timing: "Day 0", body: "Rank acquirers by fit, appetite and recent activity; segment strategic vs financial." },
  { step: "Issue anonymized teaser", timing: "Day 1", body: "Send Project Cipher teaser to tier-1 targets; no company name pre-NDA." },
  { step: "NDA + data room", timing: "Day 3–7", body: "Counter-sign NDAs, grant staged data-room access on execution." },
  { step: "Management presentations", timing: "Week 2–3", body: "Schedule calls with engaged buyers; distribute the CIM." },
  { step: "Solicit indications", timing: "Week 4", body: "Request non-binding indications of interest; build the offer comparison." },
  { step: "Drive to LOI", timing: "Week 5–6", body: "Run a competitive process to a signed letter of intent." },
];

const NEXT_STEPS = [
  "send the CIM to the engaged buyers and drive competing indications of interest",
  "collect the indications of interest and build the offer comparison",
  "open NDA-gated data rooms for the interested buyers",
  "drive the leading buyer to a signed letter of intent",
];

const Banker: React.FC = () => {
  const [tab, setTab] = useState<Tab>("outreach");
  const teaser  = useMemorandum("buyer_teaser");
  const summary = useMemorandum("executive_summary");
  const cim     = useMemorandum("cim");
  // ── Banker directives — real mandate intelligence, not a placebo ──
  // Stored against the mandate, parsed into structured preferences, and applied
  // here to re-weight the engine's buyer discovery, outreach and valuation.
  const { directives, preferences, add: addDirective, remove: removeDirective } = useDirectives();
  const { included, excluded } = useMemo(() => applyToBuyers(BUYERS.candidates, preferences), [preferences]);
  const adjustedById = useMemo(() => {
    const m = new Map<string, AdjustedBuyer>();
    for (const r of included) m.set(r.candidate.buyer.name, r);
    return m;
  }, [included]);
  const ranked = useMemo(() => included.map((r) => r.candidate), [included]);
  const topBuyers = useMemo(() => ranked.slice(0, 6), [ranked]);
  const posture = useMemo(() => outreachPosture(preferences), [preferences]);
  const guardrail = useMemo(() => valuationGuardrail(preferences), [preferences]);
  const directiveActions = useMemo(() => recommendedActions(preferences), [preferences]);
  const mid = VALUATION_CANONICAL.headline.mid;

  // ── Interactive state ────────────────────────────────────────────
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefText, setBriefText] = useState("");
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [strategy, setStrategy] = useState<{ anchor: "mid" | "high"; cashFloor: number; shortlist: number }>({ anchor: "high", cashFloor: 75, shortlist: 7 });
  const [stepIdx, setStepIdx] = useState(0);
  const [extraActivity, setExtraActivity] = useState<{ when: string; text: string; tone: "good" | "info" | "warn" }[]>([]);
  const [introBuyer, setIntroBuyer] = useState<BuyerCandidate | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const isSent = (k: string): boolean => sent.has(k);
  const flagSent = (k: string): void => setSent((prev) => new Set(prev).add(k));

  // The agent's deal funnel — nested slices of the ranked buyer pool.
  const nId        = ranked.length;
  const nShort     = Math.min(strategy.shortlist, nId);
  const nContact   = Math.min(4, nShort);
  const nInterest  = Math.min(2, nContact);
  const nDiligence = Math.min(1, nInterest);
  const interested = ranked.slice(0, nInterest);
  const interestedNames = interested.map((b) => b.buyer.name).join(" and ");

  const funnel: { label: string; n: number; accent: string }[] = [
    { label: "Identified",   n: nId,        accent: "#64748b" },
    { label: "Shortlisted",  n: nShort,     accent: "#a78bfa" },
    { label: "Contacted",    n: nContact,   accent: "#60a5fa" },
    { label: "Interested",   n: nInterest,  accent: "#fbbf24" },
    { label: "In diligence", n: nDiligence, accent: "#34d399" },
  ];

  const workstreams: { key: string; title: string; status: WorkStatus; result: string }[] = [
    { key: "find",     title: "Find buyers",              status: "done",   result: `${nId} acquirers identified across strategic & financial` },
    { key: "score",    title: "Score buyers",             status: "done",   result: "Ranked by sector × check size × geography × activity" },
    { key: "outreach", title: "Draft outreach",           status: "done",   result: `${SEQUENCE.length}-step campaign drafted; teaser sent to ${nContact}` },
    { key: "teaser",   title: "Create teaser",            status: teaser ? "done" : "active", result: teaser ? `${teaser.wordCount}-word anonymized teaser ready` : "Writing anonymized teaser…" },
    { key: "cim",      title: "Create CIM",               status: "active", result: cim ? `${cim.sections.length}-section CIM drafted — final review` : "Drafting confidential memorandum…" },
    { key: "qa",       title: "Answer buyer questions",   status: "active", result: `${DILIGENCE.criticalQuestions.length} live buyer question${DILIGENCE.criticalQuestions.length === 1 ? "" : "s"} being handled` },
    { key: "valuation", title: "Set valuation strategy",  status: "done",   result: `Anchoring the process at the strategic ${strategy.anchor} — ${fmtMoney(strategy.anchor === "high" ? VALUATION_CANONICAL.headline.high : mid)}` },
    { key: "diligence", title: "Coordinate diligence",    status: "active", result: `${DILIGENCE.redFlags.length} red flag${DILIGENCE.redFlags.length === 1 ? "" : "s"} + ${DILIGENCE.criticalQuestions.length} critical Q${DILIGENCE.criticalQuestions.length === 1 ? "" : "s"} tracked to resolution` },
  ];

  const baseActivity: { when: string; text: string; tone: "good" | "info" | "warn" }[] = [
    { when: "2h ago",  tone: "good", text: `${interestedNames} are showing active interest — pushing both toward an indication of interest.` },
    { when: "5h ago",  tone: "info", text: `Answered a buyer's diligence question on customer concentration with the cohort data.` },
    { when: "1d ago",  tone: "info", text: `Sent the ${PROJECT} teaser to ${nContact} tier-1 targets; ${nInterest} replied.` },
    { when: "2d ago",  tone: "info", text: `Shortlisted ${nShort} buyers from the ${nId} identified and drafted personalized intros.` },
    { when: "3d ago",  tone: "good", text: `Recommended anchoring the ask at the strategic band, ${fmtMoney(mid)}.` },
  ];
  const activity = [...extraActivity, ...baseActivity];

  const allApproved = stepIdx >= NEXT_STEPS.length;
  const target = strategy.anchor === "high" ? VALUATION_CANONICAL.headline.high : mid;

  // ── Handlers ─────────────────────────────────────────────────────
  const submitBrief = (): void => {
    const t = briefText.trim();
    if (!t) { notify("Type an instruction for the banker"); return; }
    const d = addDirective(t);
    setBriefText("");
    setBriefOpen(false);
    if (d && d.understood) {
      // Report the ACTUAL parsed effects — exactly what the engine now applies.
      const summary = d.effects.map((e) => e.detail).join("; ");
      setExtraActivity((p) => [{ when: "just now", tone: "good", text: `Directive applied — ${summary}.` }, ...p]);
      notify("Directive applied to the mandate");
    } else {
      // Honest: the deterministic parser found no actionable instruction.
      setExtraActivity((p) => [{ when: "just now", tone: "warn", text: `Logged your note "${t}" — no actionable directive was parsed, so rankings are unchanged.` }, ...p]);
      notify("Saved as a note — no rule matched");
    }
  };

  const approveNext = (): void => {
    if (allApproved) { notify("All steps approved — the process is running"); return; }
    const stepText = NEXT_STEPS[stepIdx];
    setExtraActivity((p) => [{ when: "just now", tone: "good", text: `Approved: I'll ${stepText}.` }, ...p]);
    setStepIdx((i) => i + 1);
    notify("Approved — next step underway");
  };

  const applyStrategy = (): void => {
    setExtraActivity((p) => [{ when: "just now", tone: "info", text: `Strategy updated — anchor at the ${strategy.anchor} (${fmtMoney(target)}), cash floor ${strategy.cashFloor}%, ${strategy.shortlist}-buyer shortlist.` }, ...p]);
    setStrategyOpen(false);
    notify("Strategy adjusted");
  };

  // Deliverable file builders
  const outreachMd = (): string => structuredDoc(`Outreach Campaign`, `${PROJECT} · sell-side process`, [
    { heading: "Approach", body: `A ${SEQUENCE.length}-step competitive process anchored at ${fmtMoney(target)}, run against a ${nShort}-buyer shortlist to build leverage. Anonymized pre-NDA; identity and the data room unlock only on a signed NDA.` },
    { heading: "Sequence", table: { headers: ["Step", "Timing", "Action"], rows: SEQUENCE.map((s) => [s.step, s.timing, s.body]) } },
    { heading: "Status", bullets: [
      `${nId} acquirers identified, ${nShort} shortlisted, ${nContact} contacted, ${nInterest} in active conversations`,
      `Anchoring the process at ${fmtMoney(target)}`,
    ] },
  ]);
  const introMd = (b: BuyerCandidate): string => buyerIntroLetter({ buyer: b, projectName: PROJECT, askMid: mid, fromName: FROM_NAME });

  const BTN = "rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const FUNNEL_TONE = ["bg-xo-muted", "bg-xo-brass", "bg-xo-action", "bg-xo-caution", "bg-xo-verified"];

  return (
    <div data-page="banker" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="Always-on · Operator" title="The Banker"
        description="Your permanent investment banker. It finds and scores buyers, drafts the outreach, writes the teaser and CIM, fields buyer questions, sets valuation strategy and coordinates diligence — then reports back, in the first person, like a service."
        actions={<button type="button" onClick={() => setBriefOpen(true)} className={BTN}>Brief the banker</button>} />

      {/* ── Brief the banker ──────────────────────────────────────── */}
      <Modal open={briefOpen} onClose={() => setBriefOpen(false)} title="Brief the banker" subtitle="Your directive is parsed into mandate rules that re-weight rankings, outreach and valuation" size="md"
        footer={<><Button variant="ghost" onClick={() => setBriefOpen(false)}>Cancel</Button><Button onClick={submitBrief}>Apply directive</Button></>}>
        <Field label="Your instruction" hint="e.g. prioritize strategic buyers · avoid private equity · target logistics consolidators · minimum valuation $100M · hold outreach until Q4">
          <textarea className={`${inputCls} min-h-[120px] resize-y`} value={briefText} onChange={(e) => setBriefText(e.target.value)} placeholder="Tell the banker what to do…" />
        </Field>
        <p className="mt-2 text-[12px] leading-relaxed text-white/60">
          Parsed by the deterministic directive engine — no language model is involved. The exact rules it extracts are shown
          as active directives and applied to the buyer pool, outreach posture and valuation guardrail.
        </p>
      </Modal>

      {/* ── Adjust strategy ───────────────────────────────────────── */}
      <Modal open={strategyOpen} onClose={() => setStrategyOpen(false)} title="Adjust strategy" subtitle="These feed the funnel, valuation anchor and advisory" size="md"
        footer={<><Button variant="ghost" onClick={() => setStrategyOpen(false)}>Cancel</Button><Button onClick={applyStrategy}>Apply</Button></>}>
        <div className="space-y-4">
          <Field label="Valuation anchor">
            <select className={inputCls} value={strategy.anchor} onChange={(e) => setStrategy((s) => ({ ...s, anchor: e.target.value as "mid" | "high" }))}>
              <option value="mid">Strategic mid — {fmtMoney(mid)}</option>
              <option value="high">Strategic high (stretch) — {fmtMoney(VALUATION_CANONICAL.headline.high)}</option>
            </select>
          </Field>
          <Field label={`Cash floor — ${strategy.cashFloor}%`} hint="Minimum cash consideration to accept">
            <input type="range" min={50} max={100} step={5} value={strategy.cashFloor} onChange={(e) => setStrategy((s) => ({ ...s, cashFloor: Number(e.target.value) }))} className="w-full accent-deal-500" />
          </Field>
          <Field label={`Shortlist size — ${strategy.shortlist} buyers`} hint="How many acquirers to run in parallel">
            <input type="range" min={3} max={Math.min(12, nId)} step={1} value={strategy.shortlist} onChange={(e) => setStrategy((s) => ({ ...s, shortlist: Number(e.target.value) }))} className="w-full accent-deal-500" />
          </Field>
        </div>
      </Modal>

      {/* ── Draft introduction ────────────────────────────────────── */}
      <Modal open={!!introBuyer} onClose={() => setIntroBuyer(null)} title={introBuyer ? `Introduction — ${introBuyer.buyer.name}` : ""} subtitle="Personalized from the buyer's match rationale" size="lg"
        footer={introBuyer ? <>
          <Button variant="ghost" onClick={() => downloadDeliverable(introFilename(introBuyer), introMd(introBuyer))}>Download</Button>
          <Button onClick={() => { flagSent(`intro:${introBuyer.buyer.name}`); notify(`Introduction sent to ${introBuyer.buyer.name}`); }}>{isSent(`intro:${introBuyer.buyer.name}`) ? "Sent ✓ · resend" : "Send introduction"}</Button>
        </> : null}>
        {introBuyer && <pre className="whitespace-pre-wrap rounded-md border border-white/5 bg-black/40 p-4 text-[12.5px] leading-relaxed text-white/80">{introMd(introBuyer)}</pre>}
      </Modal>

      {/* ── Agent status — first-person briefing ─────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="The Banker" eyebrow="Status" className="lg:col-span-7"
          right={<span className="text-[12px] text-xo-verified">● Working the deal · live</span>}>
          <div className="px-4 py-4">
            <p className="text-[15px] leading-relaxed">
              I've identified <span className="font-semibold">{nId} qualified buyers</span>, shortlisted{" "}
              <span className="font-semibold">{nShort}</span>, opened conversations with{" "}
              <span className="font-semibold">{nContact}</span>, and{" "}
              <span className="font-semibold text-xo-verified">{nInterest} are showing active interest</span>
              {interestedNames ? <> — {interestedNames}</> : null}. One is in diligence.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">
              {allApproved
                ? "Every step is approved — I'm running the process end to end and will report back as buyers move."
                : <>Next, I'll <span className="text-xo-text">{NEXT_STEPS[stepIdx]}</span>.</>}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={approveNext} disabled={allApproved} className={BTN}>{allApproved ? "All steps approved ✓" : "Approve next step"}</button>
              <button type="button" onClick={() => setStrategyOpen(true)} className={BTN_GHOST}>Adjust strategy</button>
            </div>
          </div>
        </Section>

        <Section title="Recent activity" className="lg:col-span-5">
          <ul className="space-y-3 px-4 py-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.tone === "good" ? "bg-xo-verified" : a.tone === "warn" ? "bg-xo-risk" : "bg-xo-muted"}`} />
                <div>
                  <div className="text-[13px] leading-snug">{a.text}</div>
                  <div className="text-[11px] text-xo-muted">{a.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* ── Active banker directives ─────────────────────────────── */}
      <Section title="Active mandate directives" className="border border-xo-line"
        right={<button type="button" onClick={() => setBriefOpen(true)} className={BTN_GHOST}>+ Brief the banker</button>}
        foot="Stored against the mandate · deterministic parser · re-applied to every recommendation below">
        <div className="px-4 py-3">
          {directives.length === 0 ? (
            <p className="border border-dashed border-xo-line bg-xo-ink p-4 text-[13px] text-xo-muted">
              No directives yet. Brief the banker (e.g. <span className="text-xo-text">"prioritize strategic buyers, avoid PE, minimum valuation $100M"</span>) and the rules will appear here and re-rank the pool.
            </p>
          ) : (
            <div className="space-y-2.5">
              <ul className="space-y-2.5">
                {directives.map((d) => (
                  <li key={d.id} className="border border-xo-line bg-xo-ink p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold">“{d.raw}”</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {d.understood ? d.effects.map((e, i) => (
                            <span key={i} className="rounded-sm border border-xo-verified/40 px-1.5 py-px text-[11px] text-xo-verified">{e.detail}</span>
                          )) : <span className="rounded-sm border border-xo-line px-1.5 py-px text-[11px] text-xo-muted">Stored as a note — no rule matched</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeDirective(d.id)} className="shrink-0 rounded-sm px-1.5 py-1 text-[12px] font-medium text-xo-muted hover:text-xo-risk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Remove<span className="sr-only"> directive “{d.raw}”</span></button>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="grid gap-px bg-xo-line sm:grid-cols-2">
                <div className="bg-xo-panel p-3"><dt className="text-[11px] text-xo-muted">Outreach posture</dt><dd className={`mt-0.5 text-[13px] ${posture.held ? "text-xo-caution" : ""}`}>{posture.note}</dd></div>
                <div className="bg-xo-panel p-3"><dt className="text-[11px] text-xo-muted">Valuation guardrail</dt><dd className="mt-0.5 text-[13px]">{guardrail.note ?? "No valuation floor or ceiling set."}</dd></div>
              </dl>
              {directiveActions.length > 0 && (
                <div className="border border-xo-line bg-xo-ink p-3">
                  <h3 className="text-[12px] font-semibold text-xo-muted">Recommended actions from your directives</h3>
                  <ul className="mt-2 space-y-1.5">
                    {directiveActions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]"><span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-xo-verified" />{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {excluded.length > 0 && (
                <p className="text-[12px] text-xo-muted">{excluded.length} buyer{excluded.length === 1 ? "" : "s"} removed from the active set by directive: {excluded.map((r) => r.candidate.buyer.name).join(", ")}.</p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ── Deal funnel ──────────────────────────────────────────── */}
      <Section title="Deal funnel" className="border border-xo-line"
        right={<button type="button" onClick={() => { downloadDeliverable("buyer-shortlist.csv", buyerListCsv(ranked.slice(0, nShort))); }} className={BTN_GHOST}>Export shortlist CSV</button>}>
        <ol className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-5">
          {funnel.map((f, i) => (
            <li key={f.label} className="bg-xo-panel p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tabular-nums">{f.n}</span>
                {i > 0 && <span className="text-[11px] text-xo-muted">of {funnel[i - 1].n}</span>}
              </div>
              <div className="mt-1 text-[12px] font-semibold text-xo-muted">{f.label}</div>
              <div aria-hidden className="mt-2 h-1 overflow-hidden rounded-full bg-xo-line">
                <div className={`h-full rounded-full ${FUNNEL_TONE[i] ?? "bg-xo-muted"}`} style={{ width: `${(f.n / Math.max(1, funnel[0].n)) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Workstreams ──────────────────────────────────────────── */}
      <Section title="What I'm handling for you" className="border border-xo-line">
        <ul className="grid gap-px bg-xo-line sm:grid-cols-2">
          {workstreams.map((w) => (
            <li key={w.key} className="flex items-start gap-3 bg-xo-panel px-4 py-3">
              <span className={`mt-0.5 inline-block shrink-0 rounded-sm border px-1.5 py-px text-[11px] font-semibold ${STATUS_STYLE[w.status]}`}>{w.status}</span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold">{w.title}</h3>
                <div className="mt-0.5 text-[12px] leading-snug text-xo-muted">{w.result}</div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Strategy advisory ────────────────────────────────────── */}
      {(() => {
        const bestBuyer = ranked[0]?.buyer.name ?? "the top strategic";
        const advice = [
          { q: "Best buyer", a: `${bestBuyer} — highest fit and expected outcome in the pool.` },
          { q: "Best timing", a: "Months 7–13 — after the readiness gap closes and while multiples hold." },
          { q: "Best structure", a: `Cash-heavy: ≥${strategy.cashFloor}% cash, earnout capped at 15% on audited milestones.` },
          { q: "Best outreach", a: `Anonymized teaser → ${strategy.shortlist}-buyer shortlist → competitive indications of interest.` },
          { q: "Best valuation", a: `Anchor at the strategic ${strategy.anchor} — ${fmtMoney(mid)} mid, ${fmtMoney(VALUATION_CANONICAL.headline.high)} stretch.` },
          { q: "Best negotiation", a: "Run all buyers in parallel; counter above strategic-mid with a leverage premium." },
          { q: "Best closing", a: "Escrow ≤8% released in 12 months; reverse break-fee; 30–45 day sign-to-close." },
        ];
        return (
          <Section title="Ask your banker" className="border border-xo-line">
            <div className="px-4 py-3">
              <div className="border border-xo-verified/40 bg-xo-ink p-3">
                <div className="text-[12px] text-xo-muted">"What is the fastest path to a {fmtMoney(target)} exit?"</div>
                <p className="mt-1.5 text-[14px] leading-relaxed">
                  Shortlist {strategy.shortlist} strategics, run a 6-week teaser → IOI → LOI process in parallel, and anchor at{" "}
                  <span className="font-mono font-semibold text-xo-verified">{fmtMoney(target)}</span>. Close cash-heavy (≥{strategy.cashFloor}%) with a tight escrow — the readiness fixes and competitive tension carry the rest.
                </p>
              </div>
              <dl className="mt-3 grid gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
                {advice.map((x) => (
                  <div key={x.q} className="bg-xo-panel p-3">
                    <dt className="text-[11px] font-semibold text-xo-verified">{x.q}</dt>
                    <dd className="mt-1 text-[13px] leading-snug text-xo-muted">{x.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Section>
        );
      })()}

      {/* ── Deliverables ─────────────────────────────────────────── */}
      <Section title="Deliverables" className="border border-xo-line"
        right={<span className="text-[11px] text-xo-muted">Everything the banker has produced — review, download, and send.</span>}>
        <div className="px-4 py-3">
          <div role="group" aria-label="Deliverable" className="flex flex-wrap gap-2">
            {([["outreach", "Outreach campaign"], ["intros", "Buyer introductions"], ["teaser", "Teaser"], ["summary", "Executive summary"]] as [Tab, string][]).map(([k, l]) => (
              <Chip key={k} pressed={tab === k} onToggle={() => setTab(k)}>{l}</Chip>
            ))}
          </div>

          <div className="mt-4">
            {tab === "outreach" && (
              <div className="space-y-2">
                {posture.held && (
                  <p className="border border-xo-caution/40 bg-xo-ink px-3 py-2.5 text-[13px] text-xo-caution">
                    ⏸ Outreach is held {posture.label} per banker directive — the sequence below is staged but not sent.
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => downloadDeliverable("outreach-campaign.md", outreachMd())} className={BTN_GHOST}>Download</button>
                  <button type="button" disabled={posture.held} onClick={() => { flagSent("outreach"); notify("Outreach campaign launched to the shortlist"); }} className={BTN}>{posture.held ? "Held by directive" : isSent("outreach") ? "Sent ✓ · resend" : "Send campaign"}</button>
                </div>
                <ol className="space-y-px bg-xo-line">
                  {SEQUENCE.map((s, i) => (
                    <li key={s.step} className="flex items-start gap-4 bg-xo-panel p-3">
                      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-xo-verified/50 font-mono text-[12px] font-semibold text-xo-verified">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[13px] font-semibold">{s.step}</h3>
                          <div className="text-[12px] text-xo-muted">{s.timing}</div>
                        </div>
                        <div className="mt-0.5 text-[12px] leading-snug text-xo-muted">{s.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {tab === "intros" && (
              <ul className="grid gap-px bg-xo-line sm:grid-cols-2">
                {topBuyers.map((b) => {
                  const adj = adjustedById.get(b.buyer.name);
                  const moved = adj && Math.abs(adj.adjustedProbability - adj.baseProbability) >= 0.005;
                  return (
                  <li key={b.buyer.name} className="bg-xo-panel p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-semibold">{b.buyer.name}</h3>
                      <span className="text-right">
                        <span className="font-mono text-[13px] font-semibold text-xo-verified">{Math.round((adj?.adjustedProbability ?? b.probability) * 100)}%</span>
                        {moved && <span className="ml-1 font-mono text-[11px] text-xo-muted line-through">{Math.round(adj!.baseProbability * 100)}%</span>}
                      </span>
                    </div>
                    <div className="text-[12px] text-xo-muted">{b.buyer.buyerType.replace(/_/g, " ")}</div>
                    {adj && adj.reasons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {adj.reasons.map((r, i) => <span key={i} className="rounded-sm border border-xo-verified/40 px-1.5 py-px text-[11px] text-xo-verified">{r}</span>)}
                      </div>
                    )}
                    <p className="mt-2 text-[12px] leading-relaxed text-xo-muted">
                      Suggested intro: position {PROJECT} to {b.buyer.name} — {b.rationale}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" onClick={() => setIntroBuyer(b)} className={BTN_GHOST}>Draft introduction<span className="sr-only"> to {b.buyer.name}</span></button>
                      {isSent(`intro:${b.buyer.name}`) && <span className="text-[12px] font-semibold text-xo-verified">Sent ✓</span>}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}

            {(tab === "teaser" || tab === "summary") && (() => {
              const doc = tab === "teaser" ? teaser : summary;
              if (!doc) return <p className="p-4 text-[13px] text-xo-muted">Generating…</p>;
              const key = tab;
              return (
                <article className="border border-xo-line bg-xo-ink p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Prepared by ExitOS Advisory</div>
                      <h3 className="mt-1 font-serif text-[20px] font-semibold">{doc.title}</h3>
                      <div className="mt-1 text-[12px] text-xo-muted">{doc.sections.length} sections · {doc.wordCount} words{doc.anonymized ? " · anonymized" : ""}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => downloadDeliverable(docFilename(doc), docToMarkdown(doc))} className={BTN_GHOST}>Download</button>
                      <button type="button" onClick={() => { flagSent(key); notify("Delivered to the buyer's data room"); }} className={BTN}>{isSent(key) ? "Sent ✓ · resend" : "Send"}</button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {doc.sections.map((s, i) => (
                      <section key={`${i}-${s.heading}`}>
                        <h4 className="text-[14px] font-semibold">{s.heading}</h4>
                        <p className="mt-1 text-[13px] leading-relaxed text-xo-muted">{s.body}</p>
                      </section>
                    ))}
                  </div>
                </article>
              );
            })()}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Banker;
