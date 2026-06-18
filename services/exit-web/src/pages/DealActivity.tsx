import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, Button } from "../lib/ui";
import { subscribe, allDealEvents, dealFlowFunnel, subjectsAtStage, clearDealEvents, type DealEvent } from "../lib/deal-events";

// DEAL ACTIVITY — the live capture feed. Every deal-flow action on the
// platform is recorded here, forever: the behavioral + transaction data
// that becomes ExitOS's proprietary moat. Today it persists to this browser;
// behind a backend adapter it persists across the network, per account.

const timeAgo = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};
const KIND_LABEL: Record<string, string> = {
  listing_viewed: "viewed listing", viewed_buyer: "viewed", expressed_interest: "expressed interest in",
  added_to_outreach: "added to outreach", nda_requested: "requested NDA with", nda_signed: "signed NDA with",
  cim_viewed: "viewed CIM of", meeting_scheduled: "scheduled meeting with", loi_issued: "received LOI from",
  diligence_started: "opened diligence with", closed: "closed with", walked_away: "walked from", retraded: "retraded with",
};

const DealActivity: React.FC = () => {
  const events = useSyncExternalStore(subscribe, allDealEvents, allDealEvents);
  const funnel = dealFlowFunnel(events);
  const recent = [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  const max = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div>
      <SectionHeader
        kicker="Exchange · Telemetry"
        title="Deal Activity"
        description="Every deal-flow action captured forever — the behavioral and transaction data only ExitOS can generate. As real mandates run, this stream becomes the proprietary moat behind buyer probability, response history and engagement."
        actions={events.length > 0 ? <Button variant="ghost" onClick={clearDealEvents}>Clear (demo)</Button> : undefined}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Events captured" value={String(events.length)} sub="this session" accent="#34d399" />
        <Kpi label="Buyers viewed" value={String(subjectsAtStage("viewed_buyer", events).length)} sub="distinct" />
        <Kpi label="Interest expressed" value={String(subjectsAtStage("expressed_interest", events).length)} sub="distinct buyers" accent="#fbbf24" />
        <Kpi label="NDAs in motion" value={String(subjectsAtStage("nda_requested", events).length)} sub="requested" />
      </div>

      {/* funnel */}
      <Card className="mt-8 p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Deal-flow funnel · captured</div>
        <div className="mt-4 space-y-2.5">
          {funnel.map((s) => (
            <div key={s.kind}>
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="font-semibold text-white">{s.label}</span>
                <span className="font-mono tabular-nums text-white/70">{s.count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-deal-500" style={{ width: `${(s.count / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[10px] text-white/35">Browse the Buyer Graph and open buyer profiles to generate captured activity. With the exit-api, every event persists per account, network-wide — feeding response history and engagement for all participants.</div>
      </Card>

      {/* feed */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Activity feed</div>
        {recent.length ? (
          <ul>
            {recent.map((e: DealEvent) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 px-5 py-2.5 text-[12.5px] last:border-0">
                <span className="min-w-0">
                  <span className="text-white/50">{e.actorRole}</span> <span className="text-white/70">{KIND_LABEL[e.kind] ?? e.kind}</span>{" "}
                  {e.subjectType === "buyer"
                    ? <Link to={`/console/buyer/${e.subjectId}`} className="font-semibold text-white hover:text-deal-300">{e.subjectName}</Link>
                    : <span className="font-semibold text-white">{e.subjectName}</span>}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-white/35">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        ) : <div className="px-5 py-6 text-center text-[12px] text-white/45">No activity captured yet. Open a few buyer profiles or express interest to see the capture spine in action.</div>}
      </Card>
    </div>
  );
};

export default DealActivity;
