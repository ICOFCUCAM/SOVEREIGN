import React, { useState } from "react";
import { Button, Card, Modal, fmtMoney, downloadText, notify } from "../lib/ui";
import { CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { DILIGENCE, OFFER_EVALUATIONS } from "../lib/engines";
import BankerTake from "../components/BankerTake";

// Deal Closing Center. The static closing checklist drives day-of
// orchestration; the diligence engine surfaces pre-close critical
// questions and red flags that the closing committee tracks.

interface ChecklistItem { id: string; title: string; owner: "Founder" | "Counsel" | "Buyer" | "Banker"; status: "done" | "in_progress" | "blocked" | "pending"; due?: string }

const CLOSING: readonly ChecklistItem[] = [
  { id: "c-01", title: "SPA execution + signature pages",         owner: "Counsel",  status: "in_progress", due: "Fri" },
  { id: "c-02", title: "Disclosure schedule final review",        owner: "Counsel",  status: "in_progress", due: "Thu" },
  { id: "c-03", title: "Shareholder consent — 95% threshold",     owner: "Founder",  status: "in_progress", due: "Mon" },
  { id: "c-04", title: "Bring-down certificate",                  owner: "Founder",  status: "pending",     due: "Tue (close)" },
  { id: "c-05", title: "Escrow agent engagement",                 owner: "Banker",   status: "done" },
  { id: "c-06", title: "Wire instructions — buyer side",          owner: "Buyer",    status: "done" },
  { id: "c-07", title: "Closing escrow funding confirmation",     owner: "Banker",   status: "pending",     due: "Tue 9am" },
  { id: "c-08", title: "Cap-table snapshot at closing",           owner: "Founder",  status: "pending",     due: "Tue (close)" },
  { id: "c-09", title: "Regulatory filings — Form 8023 / NJ-1054", owner: "Counsel", status: "in_progress", due: "Tue" },
  { id: "c-10", title: "Press / employee announcement coordination", owner: "Founder", status: "pending",   due: "Wed" },
  { id: "c-11", title: "Buyer side board approval",               owner: "Buyer",    status: "in_progress", due: "Mon" },
  { id: "c-12", title: "Closing call — agenda + dial-ins",        owner: "Banker",   status: "in_progress", due: "Tue 8am" },
];

const STATUS_STYLE: Record<ChecklistItem["status"], string> = {
  done:        "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  in_progress: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  pending:     "bg-white/5 text-white/60 ring-white/15",
  blocked:     "bg-red-500/15 text-red-300 ring-red-400/40",
};

const OWNER_STYLE: Record<ChecklistItem["owner"], string> = {
  Founder: "text-deal-300",
  Counsel: "text-loi-300",
  Buyer:   "text-stage-engaged",
  Banker:  "text-white/70",
};

// Closing Risk Meter — a computed close probability and the live risks
// standing between the deal and the wire. Probability starts from checklist
// completion (done = full weight, in-progress = partial), then takes a penalty
// for each blocker and each open diligence red flag. The outstanding-risk list
// is the set of not-done checklist items that gate the close.
function closeProbability(done: number, inProgress: number, total: number, blocked: number, redFlags: number): number {
  const base = total === 0 ? 1 : (done + inProgress * 0.5) / total; // 0..1 progress
  const penalty = blocked * 0.08 + redFlags * 0.04;
  return Math.max(0.05, Math.min(0.99, base - penalty));
}
function openRisks(items: readonly ChecklistItem[]): { title: string; owner: string; severity: "high" | "medium" }[] {
  return items
    .filter((c) => c.status !== "done")
    .map((c) => ({
      title: c.title,
      owner: c.owner,
      // consent, escrow funding, regulatory and board approvals are hard gates
      severity: (/consent|escrow|regulatory|board approval|bring-down/i.test(c.title) ? "high" : "medium") as "high" | "medium",
    }))
    .sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1));
}

const Closing: React.FC = () => {
  const done       = CLOSING.filter((c) => c.status === "done").length;
  const inProgress = CLOSING.filter((c) => c.status === "in_progress").length;
  const blocked    = CLOSING.filter((c) => c.status === "blocked").length;
  const criticalQs = DILIGENCE.criticalQuestions;
  const redFlags = DILIGENCE.redFlags;
  const prob = closeProbability(done, inProgress, CLOSING.length, blocked, redFlags.length);
  const risks = openRisks(CLOSING);
  const probColor = prob >= 0.8 ? "#34d399" : prob >= 0.6 ? "#fbbf24" : "#f87171";
  const dealValue = Math.max(0, ...OFFER_EVALUATIONS.map((e) => e.offer.headlinePriceUsd));
  const topRisk = risks[0];

  // Closing call — agenda built from the open gating items + diligence flags,
  // plus a downloadable calendar invite.
  const [callOpen, setCallOpen] = useState(false);
  const agenda: string[] = [
    "Confirm escrow funding and wire instructions (both sides)",
    ...risks.slice(0, 5).map((r) => `${r.severity === "high" ? "[gate] " : ""}${r.title} — owner ${r.owner}`),
    ...(redFlags.length ? [`Resolve ${redFlags.length} open diligence flag${redFlags.length === 1 ? "" : "s"}`] : []),
    "Walk the signature sequence and confirm timing to the wire",
  ];
  const downloadInvite = (): void => {
    const dt = new Date(); dt.setDate(dt.getDate() + 2); dt.setHours(8, 0, 0, 0);
    const end = new Date(dt.getTime() + 60 * 60 * 1000);
    const z = (d: Date): string => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ExitOS//Closing//EN", "BEGIN:VEVENT",
      `UID:closing-${Date.now()}@exitos`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(dt)}`, `DTEND:${z(end)}`,
      "SUMMARY:Closing call — Helios Freight transaction",
      `DESCRIPTION:${agenda.map((a) => "• " + a).join("\\n")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    downloadText("closing-call.ics", ics);
    notify("Closing call invite downloaded");
  };

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Operator · Closing"
        title="Deal Closing Center"
        tag="Sign · escrow · file"
        status={`${Math.round(prob * 100)}% close prob`}
        metrics={[
          { k: "Closing in", v: "6 days", accent: true, sub: "Sentinel Holdings" },
          { k: "Done", v: `${done} / ${CLOSING.length}`, accent: true, sub: "signed off" },
          { k: "In progress", v: String(inProgress), sub: "active workstreams" },
          { k: "Blockers", v: String(blocked + redFlags.length), sub: "checklist + red flags" },
        ]}
      />

      <MarketTape items={buildMarketTape()} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => window.print()}>Print checklist</Button>
        <Button onClick={() => setCallOpen(true)}>Closing call</Button>
      </div>

      {/* ── Closing call ──────────────────────────────────────────── */}
      <Modal open={callOpen} onClose={() => setCallOpen(false)} title="Closing call" subtitle={`Tuesday 08:00 · ${Math.round(prob * 100)}% modeled close probability`}
        footer={<><Button variant="ghost" onClick={downloadInvite}>Download invite (.ics)</Button><Button onClick={() => { setCallOpen(false); notify("Closing call scheduled"); }}>Schedule</Button></>}>
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3 text-[12px] text-white/60">
            Participants: Founder · Counsel · Banker · Buyer. Dial-in issued with the calendar invite.
          </div>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Agenda — gated on the open items</div>
            <ol className="space-y-1.5">
              {agenda.map((a, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13px] text-white/75">
                  <span className="font-mono text-[11px] text-white/40">{i + 1}.</span> {a}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Modal>

      <BankerTake
        next={topRisk ? <>Clear <span className="text-white">{topRisk.title}</span> ({topRisk.owner}) — the top {topRisk.severity}-risk item gating the wire.</> : "Confirm escrow funding and hold the closing call."}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(dealValue)}</span> transaction · <span style={{ color: probColor }}>{Math.round(prob * 100)}%</span> modeled close probability.</>}
        inaction={<>{risks.length} item{risks.length === 1 ? "" : "s"} and {redFlags.length} diligence flag{redFlags.length === 1 ? "" : "s"} still open — each unsigned consent pushes the close date and risks a re-trade.</>}
        buyer={<><span className="text-white">Sentinel Holdings</span> — in signing, 6 days to close.</>}
        automate={<>ExitOS tracks every signature, escrow movement and filing, and nudges the owner before each due date.</>}
        impact={<span style={{ color: probColor }}>{Math.round(prob * 100)}%</span>}
        cta={{ label: "Generate closing docs", to: "/console/documents" }}
      />


      {/* Closing Risk Meter — close probability + the risks gating the wire */}
      <Card className="mt-8 p-6" id="escrow">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col items-center justify-center border-b border-white/10 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Current close probability</div>
            <div className="relative mt-3 flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={probColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - prob)}`} />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-3xl font-bold" style={{ color: probColor }}>{Math.round(prob * 100)}%</div>
                <div className="text-[9px] uppercase tracking-wide text-white/40">to close</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-white/45">{done}/{CLOSING.length} items signed off</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Risks gating the close</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {risks.slice(0, 6).map((r) => (
                <div key={r.title} className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-ink-900/40 p-3">
                  <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.severity === "high" ? "bg-red-400" : "bg-loi-400"}`} />
                  <div>
                    <div className="text-[12.5px] leading-snug text-white/85">{r.title}</div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">{r.owner} · {r.severity} risk</div>
                  </div>
                </div>
              ))}
            </div>
            {redFlags.length > 0 && (
              <div className="mt-3 text-[12px] text-red-300/80">+ {redFlags.length} diligence red flag{redFlags.length === 1 ? "" : "s"} weighing on the close.</div>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div id="signatures">
          <h2 className="mb-3 font-serif text-lg font-bold">Closing checklist — Sentinel Holdings</h2>
          <Card>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {CLOSING.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-white/40">{(i + 1).toString().padStart(2, "0")}</td>
                    <td className="px-5 py-3.5 text-white">{c.title}</td>
                    <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${OWNER_STYLE[c.owner]}`}>{c.owner}</td>
                    <td className="px-5 py-3.5 text-xs text-white/60">{c.due ?? "—"}</td>
                    <td className="px-5 py-3.5"><span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLE[c.status]}`}>{c.status.replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="font-serif text-base font-bold text-white">From diligence</h3>
            <p className="mt-1 text-[11px] text-white/45">Surfaced by @exit/engines · runDueDiligence</p>
            {redFlags.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300">Red flags</div>
                <ul className="mt-2 space-y-2 text-[13px] text-white/75">
                  {redFlags.map((f) => (
                    <li key={f} className="flex items-baseline gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {criticalQs.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-loi-300">Critical questions</div>
                <ul className="mt-2 space-y-2 text-[13px] text-white/75">
                  {criticalQs.map((q) => (
                    <li key={q} className="flex items-baseline gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-loi-400" /> {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {redFlags.length === 0 && criticalQs.length === 0 && (
              <p className="mt-3 text-sm text-white/55">No diligence red flags or critical questions — clean buyer-facing posture.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Closing;
