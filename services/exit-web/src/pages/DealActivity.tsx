import React, { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import { subscribe, allDealEvents, dealFlowFunnel, subjectsAtStage, clearDealEvents, type DealEvent } from "../lib/deal-events";
import { networkStats } from "../lib/network-stats";

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
  const recent = [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  const max = Math.max(...funnel.map((f) => f.count), 1);
  const net = networkStats(events);
  const rate = (v: number | null): string => (v == null ? "—" : `${v}%`);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Exchange · Telemetry"
        title="Deal Activity"
        tag="Capture spine"
        status={`${events.length} events`}
        metrics={[
          { k: "Events captured", v: String(events.length), accent: true, sub: "this session" },
          { k: "Buyers viewed", v: String(subjectsAtStage("viewed_buyer", events).length), sub: "distinct" },
          { k: "Interest expressed", v: String(subjectsAtStage("expressed_interest", events).length), sub: "distinct buyers" },
          { k: "NDAs in motion", v: String(subjectsAtStage("nda_requested", events).length), accent: true, sub: "requested" },
        ]}
      />


      {/* network effects — what the platform has learned from real transactions */}
      <Frame>
        <Panel title="Network effects · learned from captured transactions" className="lg:col-span-12"
          foot="Every completed action improves these rates — the response/close-rate moat no banker or database has. A rate stays null until the network produces the events to measure it; nothing is modelled.">
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { k: "Captured actions", v: String(net.actions), sub: "all-time" },
              { k: "Response rate", v: rate(net.responseRatePct), sub: "NDA signed / requested" },
              { k: "Meeting rate", v: rate(net.meetingRatePct), sub: "meetings / NDAs" },
              { k: "Close rate", v: rate(net.closeRatePct), sub: "closed / offers" },
              { k: "Offers seen", v: String(net.offers), sub: "IOI / LOI" },
              { k: "Closed", v: String(net.closed), sub: "definitive" },
            ].map((c) => (
              <div key={c.k} className="bg-ink-900 px-3 py-2">
                <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/40">{c.k}</div>
                <div className="mt-0.5 font-mono text-[16px] font-bold tabular-nums text-deal-300">{c.v}</div>
                <div className="text-[9px] text-white/35">{c.sub}</div>
              </div>
            ))}
          </div>
        </Panel>
      </Frame>

      <Frame>
        <Panel title="Deal-flow funnel · captured" className="lg:col-span-5"
          right={events.length > 0 ? <button onClick={clearDealEvents} className="rounded bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10 hover:text-white">Clear</button> : undefined}
          foot="With the exit-api, every event persists per account, network-wide — feeding response history and engagement for all participants.">
          <div className="space-y-2 p-3">
            {funnel.map((s) => (
              <div key={s.kind}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-white">{s.label}</span>
                  <span className="font-mono tabular-nums text-white/70">{s.count}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-deal-500" style={{ width: `${(s.count / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Activity feed" className="lg:col-span-7">
          {recent.length ? (
            <ul>
              {recent.map((e: DealEvent) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 px-3 py-1.5 text-[12px] last:border-0">
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
          ) : <div className="px-3 py-8 text-center text-[12px] text-white/45">No activity captured yet. Open a few buyer profiles or express interest to see the capture spine in action.</div>}
        </Panel>
      </Frame>
    </div>
  );
};

export default DealActivity;
