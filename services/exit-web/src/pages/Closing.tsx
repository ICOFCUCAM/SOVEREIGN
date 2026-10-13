import React, { useMemo, useState } from "react";
import { Button, Modal, downloadText, notify } from "../lib/ui";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { loadActiveCompany } from "../lib/active-company";
import { runDueDiligence } from "@exit/engines";

// Deal Closing Center. A closing-checklist template whose statuses the
// user sets (saved in this browser); the diligence engine surfaces
// pre-close critical questions and red flags.

type ItemStatus = "done" | "in_progress" | "blocked" | "pending";
interface TemplateItem { id: string; title: string; owner: "Founder" | "Counsel" | "Buyer" | "Banker" }
interface ChecklistItem extends TemplateItem { status: ItemStatus }

// A closing-checklist template. No deal has reached closing on ExitOS, so
// nothing here has a status until the user sets one.
const TEMPLATE: readonly TemplateItem[] = [
  { id: "c-01", title: "SPA execution + signature pages",         owner: "Counsel" },
  { id: "c-02", title: "Disclosure schedule final review",        owner: "Counsel" },
  { id: "c-03", title: "Shareholder consent — at the threshold your documents require", owner: "Founder" },
  { id: "c-04", title: "Bring-down certificate",                  owner: "Founder" },
  { id: "c-05", title: "Escrow agent engagement",                 owner: "Banker" },
  { id: "c-06", title: "Wire instructions — buyer side",          owner: "Buyer" },
  { id: "c-07", title: "Closing escrow funding confirmation",     owner: "Banker" },
  { id: "c-08", title: "Cap-table snapshot at closing",           owner: "Founder" },
  { id: "c-09", title: "Regulatory and tax filings — as counsel advises", owner: "Counsel" },
  { id: "c-10", title: "Press / employee announcement coordination", owner: "Founder" },
  { id: "c-11", title: "Buyer side board approval",               owner: "Buyer" },
  { id: "c-12", title: "Closing call — agenda + dial-ins",        owner: "Banker" },
];

const STATUS_STYLE: Record<ChecklistItem["status"], string> = {
  done:        "border-xo-verified/50 text-xo-verified",
  in_progress: "border-xo-caution/50 text-xo-caution",
  pending:     "border-xo-line text-xo-muted",
  blocked:     "border-xo-risk/50 text-xo-risk",
};

const OWNER_STYLE: Record<ChecklistItem["owner"], string> = {
  Founder: "text-xo-verified",
  Counsel: "text-xo-caution",
  Buyer:   "text-xo-action",
  Banker:  "text-xo-muted",
};

// Closing Risk Meter — a checklist-readiness rule (not a probability) and
// the risks standing between the deal and the wire. Readiness starts from
// checklist completion (done = full weight, in-progress = partial), then takes a penalty
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

const STATUS_LABEL: Record<ItemStatus, string> = { pending: "Not started", in_progress: "In progress", done: "Done", blocked: "Blocked" };
const STATUS_KEY = "exitos.closing.v1";
const loadStatuses = (): Record<string, ItemStatus> => {
  try { return JSON.parse(globalThis.localStorage?.getItem(STATUS_KEY) ?? "{}") as Record<string, ItemStatus>; } catch { return {}; }
};

const Closing: React.FC = () => {
  // statuses are the user's own, saved in this browser
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(loadStatuses);
  const setStatus = (id: string, st: ItemStatus): void => {
    setStatuses((cur) => {
      const next = { ...cur, [id]: st };
      try { globalThis.localStorage?.setItem(STATUS_KEY, JSON.stringify(next)); } catch { /* in-memory only */ }
      return next;
    });
  };
  const CLOSING: readonly ChecklistItem[] = TEMPLATE.map((t) => ({ ...t, status: statuses[t.id] ?? "pending" }));
  const done       = CLOSING.filter((c) => c.status === "done").length;
  const inProgress = CLOSING.filter((c) => c.status === "in_progress").length;
  const blocked    = CLOSING.filter((c) => c.status === "blocked").length;
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const DILIGENCE = useMemo(() => runDueDiligence(company), [company]);
  const criticalQs = DILIGENCE.criticalQuestions;
  const redFlags = DILIGENCE.redFlags;
  const prob = closeProbability(done, inProgress, CLOSING.length, blocked, redFlags.length);
  const risks = openRisks(CLOSING);
  const topRisk = risks[0];

  // Closing call — agenda built from the open gating items + diligence flags,
  // plus a downloadable calendar invite.
  const [callOpen, setCallOpen] = useState(false);
  // the invite is for the day after tomorrow, 08:00 local time
  const inviteAt = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(8, 0, 0, 0); return d; }, []);
  const inviteLabel = inviteAt.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const agenda: string[] = [
    "Confirm escrow funding and wire instructions (both sides)",
    ...risks.slice(0, 5).map((r) => `${r.severity === "high" ? "[gate] " : ""}${r.title} — owner ${r.owner}`),
    ...(redFlags.length ? [`Resolve ${redFlags.length} open diligence flag${redFlags.length === 1 ? "" : "s"}`] : []),
    "Walk the signature sequence and confirm timing to the wire",
  ];
  const downloadInvite = (): void => {
    const dt = inviteAt;
    const end = new Date(dt.getTime() + 60 * 60 * 1000);
    const z = (d: Date): string => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ExitOS//Closing//EN", "BEGIN:VEVENT",
      `UID:closing-${Date.now()}@exitos`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(dt)}`, `DTEND:${z(end)}`,
      `SUMMARY:Closing call — ${company.name} transaction`,
      `DESCRIPTION:${agenda.map((a) => "• " + a).join("\\n")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    downloadText("closing-call.ics", ics);
    notify("Closing call invite downloaded");
  };

  const probTone = prob >= 0.8 ? "text-xo-verified" : prob >= 0.6 ? "text-xo-caution" : "text-xo-risk";
  const BTN = "rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="closing" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Operator · Closing · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Deal Closing Center"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Sign · escrow · file · <span className={probTone}>checklist readiness {Math.round(prob * 100)}%</span></span></>}
        actions={<>
          <button type="button" onClick={() => window.print()} className={BTN_GHOST}>Print checklist</button>
          <button type="button" onClick={() => setCallOpen(true)} className={BTN}>Closing call</button>
        </>} />

      <p role="note" className="border border-xo-line bg-xo-panel px-4 py-2.5 text-[12px] text-xo-muted">No deal has reached closing on ExitOS. This is a closing checklist template: set each item's status yourself as your counsel and the buyer report progress. Statuses are saved in this browser only.</p>

      <section aria-label="Closing summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Checklist" emphasis value={`${CLOSING.length} items`} sub="template · statuses set by you" /></div>
        <div className="bg-xo-panel"><Metric label="Done" emphasis value={`${done} / ${CLOSING.length}`} sub="signed off" /></div>
        <div className="bg-xo-panel"><Metric label="In progress" value={String(inProgress)} sub="active workstreams" /></div>
        <div className="bg-xo-panel"><Metric label="Blockers" value={String(blocked + redFlags.length)} sub="checklist + red flags" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      {/* ── Closing call ──────────────────────────────────────────── */}
      <Modal open={callOpen} onClose={() => setCallOpen(false)} title="Closing call" subtitle={`Invite for ${inviteLabel} · checklist readiness ${Math.round(prob * 100)}%`}
        footer={<><Button variant="ghost" onClick={() => setCallOpen(false)}>Close</Button><Button onClick={downloadInvite}>Download invite (.ics)</Button></>}>
        <div className="space-y-4">
          <p className="rounded-sm border border-xo-line bg-xo-ink p-3 text-[12px] text-xo-muted">
            Suggested participants: Founder · Counsel · Banker · Buyer. ExitOS does not send invitations or create a dial-in: download the invite, add a meeting link in your calendar and invite the participants yourself.
          </p>
          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-xo-muted">Agenda — gated on the open items</h3>
            <ol className="space-y-1.5">
              {agenda.map((a, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13px] text-xo-text">
                  <span className="font-mono text-[11px] text-xo-faint">{i + 1}.</span> {a}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Modal>

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className={`font-mono text-[13px] font-semibold tabular-nums ${probTone}`}>readiness {Math.round(prob * 100)}%</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{topRisk ? <>Clear <span className="font-semibold">{topRisk.title}</span> ({topRisk.owner}) — the top {topRisk.severity}-risk item gating the wire.</> : "Confirm escrow funding and hold the closing call."}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="Today">No deal in closing — the checklist is a template. {done}/{CLOSING.length} items done, checklist readiness <span className={probTone}>{Math.round(prob * 100)}%</span> (a rule, not a probability).</TakeCell>
            <TakeCell k="If you wait">{risks.length} item{risks.length === 1 ? "" : "s"} and {redFlags.length} diligence flag{redFlags.length === 1 ? "" : "s"} still open — each unsigned consent pushes the close date and risks a re-trade.</TakeCell>
            <TakeCell k="Next">Work the gating items with counsel. ExitOS does not draft closing documents yet; counsel prepares the SPA, schedules, consents and certificates.</TakeCell>
            <TakeCell k="What ExitOS does">Keeps this checklist and builds the call agenda. It does not track signatures, escrow or filings, and sends no reminders.</TakeCell>
          </dl>
        </div>
      </Section>

      {/* Closing Risk Meter — checklist readiness + the risks gating the wire */}
      <div id="escrow" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Checklist readiness (rule)" className="lg:col-span-4"
          foot="(Done + ½ × In progress) ÷ 12 items, minus 8 points per blocked item and 4 per diligence red flag; floor 5 %, cap 99 %. Built from the statuses you set — a progress rule, not a probability of closing.">
          <div className="flex flex-col items-center px-4 py-4">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg aria-hidden viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-xo-line" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className={probTone} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - prob)}`} />
              </svg>
              <div className="absolute text-center">
                <div className={`font-mono text-3xl font-semibold ${probTone}`}>{Math.round(prob * 100)}%</div>
                <div className="text-[11px] text-xo-muted">readiness</div>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-xo-muted">{done}/{CLOSING.length} items signed off</p>
          </div>
        </Section>
        <Section title="Risks gating the close" className="lg:col-span-8"
          foot={redFlags.length > 0 ? <span className="text-xo-risk">+ {redFlags.length} diligence red flag{redFlags.length === 1 ? "" : "s"} weighing on the close.</span> : undefined}>
          <ul className="grid gap-px bg-xo-line sm:grid-cols-2">
            {risks.slice(0, 6).map((r) => (
              <li key={r.title} className="flex items-start gap-2.5 bg-xo-panel px-4 py-3">
                <span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.severity === "high" ? "bg-xo-risk" : "bg-xo-caution"}`} />
                <div>
                  <div className="text-[13px] leading-snug">{r.title}</div>
                  <div className="text-[11px] text-xo-muted">{r.owner} · <span className={r.severity === "high" ? "text-xo-risk" : "text-xo-caution"}>{r.severity} risk</span></div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Closing checklist (template)" className="lg:col-span-8">
          <div id="signatures" />
          <ScrollRegion label="Closing checklist">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="text-left text-[11px] text-xo-muted">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="w-12 px-4 py-2 font-medium">#</th>
                  <th scope="col" className="px-2 py-2 font-medium">Item</th>
                  <th scope="col" className="px-2 py-2 font-medium">Owner</th>
                  <th scope="col" className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {CLOSING.map((c, i) => (
                  <tr key={c.id} className="border-b border-xo-line last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-xo-faint">{(i + 1).toString().padStart(2, "0")}</td>
                    <th scope="row" className="px-2 py-2.5 text-left font-normal">{c.title}</th>
                    <td className={`px-2 py-2.5 text-[12px] font-semibold ${OWNER_STYLE[c.owner]}`}>{c.owner}</td>
                    <td className="px-4 py-2.5">
                      <select aria-label={`Status of ${c.title}`} value={c.status} onChange={(e) => setStatus(c.id, e.target.value as ItemStatus)}
                        className={`rounded-sm border bg-xo-ink px-1.5 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${STATUS_STYLE[c.status]}`}>
                        {(Object.keys(STATUS_LABEL) as ItemStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>

        <Section title="From diligence" eyebrow={`Diligence engine · ${company.name}`} className="lg:col-span-4"
          foot={fromIntake ? "From the diligence engine on your saved intake." : "From the diligence engine on the demo company; save an intake to run it on yours."}>
          <div className="space-y-4 px-4 py-3">
            {redFlags.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-xo-risk">Red flags</h3>
                <ul className="mt-2 space-y-2 text-[13px]">
                  {redFlags.map((f) => <li key={f} className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-xo-risk" /> {f}</li>)}
                </ul>
              </div>
            )}
            {criticalQs.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-xo-caution">Critical questions</h3>
                <ul className="mt-2 space-y-2 text-[13px]">
                  {criticalQs.map((q) => <li key={q} className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-xo-caution" /> {q}</li>)}
                </ul>
              </div>
            )}
            {redFlags.length === 0 && criticalQs.length === 0 && (
              <p className="text-[13px] text-xo-muted">No diligence red flags or critical questions — clean buyer-facing posture.</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Closing;
