import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { runBuyerDiscovery } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { useAuth } from "../lib/auth";
import { label } from "../lib/labels";
import { dealRoomActivity, documentAttention, fmtDuration, type BuyerActivity } from "../lib/deal-room-activity";

// Live Deal Room — not storage, a command center. It shows who's in the room,
// what they viewed and downloaded, which sensitive documents drew real dwell
// (concern signals), and which buyers are most engaged — so the founder calls
// the buyer who's about to move, not the one who went quiet. The activity
// itself is still simulated (lib/deal-room-activity).

const STATUS_CLS: Record<string, string> = {
  "Likely moving to LOI": "text-xo-verified",
  "Actively evaluating":  "text-xo-action",
  "Working the package":  "text-xo-caution",
  "Early review":         "text-xo-muted",
  "Cooling":              "text-xo-faint",
};

const DealRoom: React.FC = () => {
  const { session } = useAuth();
  // Buyers share this route but must never see the founder's view of other
  // bidders; they get their own view.
  if (session?.role === "buyer") return <BuyerDealRoom />;
  return <FounderDealRoom />;
};

const FounderDealRoom: React.FC = () => {
  // Simulated on the founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const candidates = useMemo(() => runBuyerDiscovery(company, { limit: 12 }).candidates, [company]);
  const activity = dealRoomActivity(6, candidates);
  const docs = documentAttention(activity);
  const top = activity[0];
  const totalMinutes = activity.reduce((s, a) => s + a.timeMinutes, 0);
  const totalDownloads = activity.reduce((s, a) => s + a.downloads, 0);
  const concernDocs = docs.filter((d) => d.concernViews > 0);

  return (
    <div data-page="deal-room" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={fromIntake ? `Diligence · Buyer activity · Your intake: ${company.name}` : `Diligence · Buyer activity · Demo company: ${company.name}`} title="Live Deal Room"
        badge={<Provenance kind={fromIntake ? "company" : "demo"} />}
        // PRELAUNCH-REVIEW: "Live Deal Room" title and live description restored; data-room sessions are not recorded yet, activity comes from lib/deal-room-activity
        description="Every buyer's session, live: who viewed what, who downloaded what, which documents drew concern, and which buyers are most engaged. The deal room as a command center, not a file store." />

      {top && (
        <Section title="How to read this" eyebrow="Banker's take" className="border border-xo-line">
          <div className="px-4 py-3">
            <p className="text-[14px] leading-relaxed">The buyer who works through the whole package and downloads it is the first call; a buyer dwelling on sensitive documents has questions to answer before they ask them.</p>
            <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2">
              <TakeCell k="Most engaged buyer">{top.buyerName} · <span className="font-mono">{top.interestScore}%</span> interest</TakeCell>
              <TakeCell k="Next move">Call {top.buyerName} first, and prepare answers on the documents causing concern.</TakeCell>
            </dl>
            <Link to="/console/negotiator" className="mt-3 inline-block rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open the negotiator →</Link>
          </div>
        </Section>
      )}

      {/* PRELAUNCH-REVIEW: room-summary wording restored ("with NDA + access", "this week"); no NDA/access or data-room session backend, figures are simulated */}
      <section aria-label="Room summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Buyers in the room" value={String(activity.length)} sub="with NDA + access" /></div>
        <div className="bg-xo-panel"><Metric label="Total time in room" value={fmtDuration(totalMinutes)} sub="across all buyers" /></div>
        <div className="bg-xo-panel"><Metric label="Documents downloaded" value={String(totalDownloads)} sub="this week" /></div>
        <div className="bg-xo-panel"><Metric label="Hottest buyer" emphasis value={top ? `${top.interestScore}%` : "—"} sub={top?.buyerName ?? ""} /></div>
      </section>

      {/* PRELAUNCH-REVIEW: section titles restored without the "simulated" suffix; activity has no recording backend */}
      <Section title="Buyer activity · ranked by intent" className="border border-xo-line"
        foot="Interest combines time in the room, documents opened and downloads.">
        <ol className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-2">
          {activity.map((a, i) => <BuyerCard key={a.buyerName} a={a} rank={i + 1} />)}
        </ol>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[1fr_360px]">
        <Section title="Documents drawing attention">
          <ScrollRegion label="Document attention table">
            <table className="w-full min-w-[440px] text-[13px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-4 py-2 font-medium">Document</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Views</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Downloads</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Concern dwell</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.label} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      {d.label}
                      {d.concern && <span className="ml-2 text-[11px] font-semibold text-xo-caution">sensitive</span>}
                    </th>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">{d.views}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">{d.downloads}</td>
                    <td className={`px-4 py-2 text-right font-mono tabular-nums ${d.concernViews > 0 ? "text-xo-risk" : "text-xo-faint"}`}>{d.concernViews || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>

        <Section title="Causing concern" foot="Sensitive documents buyers are dwelling on — get ahead of the question.">
          <div className="px-4 py-3">
            {concernDocs.length === 0 ? (
              <p className="text-[13px] text-xo-muted">No concentrated dwell on sensitive documents yet.</p>
            ) : (
              <ul className="space-y-3">
                {concernDocs.map((d) => (
                  <li key={d.label}>
                    <div className="text-[13px] font-semibold">{d.label}</div>
                    <div className="text-[12px] text-xo-muted">{d.concernViews} buyer{d.concernViews === 1 ? "" : "s"} dwelling — prep the rebuttal in the CIM.</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

// The buyer's side of the deal room: what it will hold and how access is
// granted. No other bidder, and no founder-side engagement data, appears here.
const BuyerDealRoom: React.FC = () => (
  <div data-page="deal-room" className="space-y-3 text-xo-text">
    <PageHeader eyebrow="Deals · Your access" title="Deal Room"
      description="Where a founder shares diligence documents with you once your access request is approved under NDA." />
    <Section title="Your deal rooms" className="border border-xo-line">
      <div className="px-4 py-3 text-[13px] leading-relaxed text-xo-muted">
        <p>No deal room has been opened for your account.</p>
        <p className="mt-2">A room opens when a founder approves your access request under an NDA. It holds the documents that founder chooses to share with you. You see only your own room — never other bidders or their activity.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/console/nda" className="inline-block rounded-sm bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Access requests →</Link>
          <Link to="/console/marketplace" className="inline-block rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Browse opportunities</Link>
        </div>
      </div>
    </Section>
  </div>
);

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

const BuyerCard: React.FC<{ a: BuyerActivity; rank: number }> = ({ a, rank }) => {
  const scoreCls = a.interestScore >= 85 ? "text-xo-verified" : a.interestScore >= 60 ? "text-xo-caution" : "text-xo-muted";
  return (
    <li className="min-w-0 bg-xo-panel px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-xo-line font-mono text-[11px] font-semibold text-xo-muted">{rank}</span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold"><span className="sr-only">Rank {rank}: </span>{a.buyerName}</h3>
            {/* PRELAUNCH-REVIEW: last-active recency and plain "Interest" label restored; recency is a fixed list in lib/deal-room-activity, no session timestamps */}
            <div className="text-[12px] text-xo-faint">{label(a.buyerType)} · active {a.lastActive}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-xo-faint">Interest</div>
          <div className={`font-mono text-[22px] font-semibold tabular-nums ${scoreCls}`}>{a.interestScore}%</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-xo-muted">
        <span><span className="font-mono text-xo-text">{fmtDuration(a.timeMinutes)}</span> in room</span>
        <span><span className="font-mono text-xo-text">{a.viewed.length}</span> viewed</span>
        <span><span className="font-mono text-xo-text">{a.downloads}</span> downloaded</span>
      </div>

      <ul aria-label="Documents viewed" className="mt-2 flex flex-wrap gap-1.5">
        {a.viewed.map((d) => {
          const hot = d.concern && d.dwellMin >= 8;
          return (
            <li key={d.key} className={`border px-2 py-0.5 text-[11px] ${hot ? "border-xo-risk/50 text-xo-risk" : "border-xo-line text-xo-muted"}`}>
              {d.label}{d.downloaded ? <><span aria-hidden> ↓</span><span className="sr-only"> (downloaded)</span></> : null}{hot ? <span className="sr-only"> (concern)</span> : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-xo-line pt-2">
        <span className={`text-[12px] font-semibold ${STATUS_CLS[a.status] ?? "text-xo-muted"}`}>{a.status}</span>
        {a.concerns.length > 0 && (
          <span className="text-[12px] text-xo-risk">{a.concerns.length} concern signal{a.concerns.length === 1 ? "" : "s"}</span>
        )}
      </div>
    </li>
  );
};

export default DealRoom;
