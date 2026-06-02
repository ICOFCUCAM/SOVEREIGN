import React from "react";
import { Button, Card, Kpi, SectionHeader } from "../lib/ui";
import { DILIGENCE } from "../lib/engines";

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

const Closing: React.FC = () => {
  const done       = CLOSING.filter((c) => c.status === "done").length;
  const inProgress = CLOSING.filter((c) => c.status === "in_progress").length;
  const blocked    = CLOSING.filter((c) => c.status === "blocked").length;
  const criticalQs = DILIGENCE.criticalQuestions;
  const redFlags = DILIGENCE.redFlags;

  return (
    <div>
      <SectionHeader
        kicker="Module 10 · Operator"
        title="Deal Closing Center"
        description="Signature orchestration, escrow choreography, regulatory filings, share-transfer mechanics — the closing checklist that doesn't drop."
        actions={<><Button variant="ghost">Print checklist</Button><Button>Closing call</Button></>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Closing in"   value="6 days"         sub="Sentinel Holdings"     accent="#34d399" />
        <Kpi label="Done"         value={`${done} / ${CLOSING.length}`} sub="signed off" accent="#34d399" />
        <Kpi label="In progress"  value={String(inProgress)} sub="active workstreams" accent="#fbbf24" />
        <Kpi label="Blockers"     value={String(blocked + redFlags.length)} sub="checklist + diligence red flags" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
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
