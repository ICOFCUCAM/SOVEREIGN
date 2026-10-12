import React, { useMemo, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
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
  const tape = useMemo(() => buildMarketTape(), [events.length]);
  const net = networkStats(events);
  const rate = (v: number | null): string => (v == null ? "—" : `${v}%`);

  return (
    <div data-page="deal-activity" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Exchange · Telemetry" title="Deal Activity"
        badge={<span className="text-[12px] text-xo-muted">Capture spine · {events.length} events</span>} />

      <section aria-label="Activity summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Events captured" emphasis value={String(events.length)} sub="this session" /></div>
        <div className="bg-xo-panel"><Metric label="Buyers viewed" value={String(subjectsAtStage("viewed_buyer", events).length)} sub="distinct" /></div>
        <div className="bg-xo-panel"><Metric label="Interest expressed" value={String(subjectsAtStage("expressed_interest", events).length)} sub="distinct buyers" /></div>
        <div className="bg-xo-panel"><Metric label="NDAs in motion" value={String(subjectsAtStage("nda_requested", events).length)} sub="requested" /></div>
      </section>

      <MarketTape items={tape} />

      <Section title="Network effects · learned from captured transactions" className="border border-xo-line"
        foot="Every completed action improves these rates — the response/close-rate moat no banker or database has. A rate stays null until the network produces the events to measure it; nothing is modelled.">
        <dl className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-3 lg:grid-cols-6">
          {[
            { k: "Captured actions", v: String(net.actions), sub: "all-time" },
            { k: "Response rate", v: rate(net.responseRatePct), sub: "NDA signed / requested" },
            { k: "Meeting rate", v: rate(net.meetingRatePct), sub: "meetings / NDAs" },
            { k: "Close rate", v: rate(net.closeRatePct), sub: "closed / offers" },
            { k: "Offers seen", v: String(net.offers), sub: "IOI / LOI" },
            { k: "Closed", v: String(net.closed), sub: "definitive" },
          ].map((c) => (
            <div key={c.k} className="bg-xo-panel px-3 py-2">
              <dt className="text-[11px] text-xo-faint">{c.k}</dt>
              <dd className="mt-0.5 font-mono text-[16px] font-semibold tabular-nums">{c.v}</dd>
              <dd className="text-[11px] text-xo-faint">{c.sub}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Deal-flow funnel · captured" className="lg:col-span-5"
          right={events.length > 0 ? <button type="button" onClick={clearDealEvents} className="rounded-sm border border-xo-line px-2 py-1 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Clear</button> : undefined}
          foot="With the exit-api, every event persists per account, network-wide — feeding response history and engagement for all participants.">
          <ol className="space-y-2 px-4 py-3">
            {funnel.map((s) => (
              <li key={s.kind}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold">{s.label}</span>
                  <span className="font-mono tabular-nums text-xo-muted">{s.count}</span>
                </div>
                <div aria-hidden className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-xo-line"><span className="block h-full rounded-full bg-xo-action" style={{ width: `${(s.count / max) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Activity feed" className="lg:col-span-7">
          {recent.length ? (
            <ul>
              {recent.map((e: DealEvent) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-xo-line px-4 py-1.5 text-[12px] last:border-0">
                  <span className="min-w-0">
                    <span className="text-xo-faint">{e.actorRole}</span> <span className="text-xo-muted">{KIND_LABEL[e.kind] ?? e.kind}</span>{" "}
                    {e.subjectType === "buyer"
                      ? <Link to={`/console/buyer/${e.subjectId}`} className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{e.subjectName}</Link>
                      : <span className="font-semibold">{e.subjectName}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-xo-faint">{timeAgo(e.at)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-8 text-center text-[12px] text-xo-muted">No activity captured yet. Open a few buyer profiles or express interest to see the capture spine in action.</p>}
        </Section>
      </div>
    </div>
  );
};

export default DealActivity;
