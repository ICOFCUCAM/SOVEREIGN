import React, { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section, Metric, Empty } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { subscribe, allDealEvents, dealFlowFunnel, subjectsAtStage, clearDealEvents, type DealEvent } from "../lib/deal-events";
import { networkStats } from "../lib/network-stats";
import { listingDestination } from "../lib/exit-api";
import { useAuth } from "../lib/auth";

// DEAL ACTIVITY — the record of deal-flow actions taken in ExitOS by this
// user. Events persist in this browser, or in the signed-in account's own
// event stream when the exchange backend is connected. The rates below are
// computed from these events only; nothing is aggregated across users.

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
  const stored = useSyncExternalStore(subscribe, allDealEvents, allDealEvents);
  const { session } = useAuth();
  const isBuyer = session?.role === "buyer";
  // a buyer sees only buyer-side actions — never founder actions recorded
  // in the same browser when roles are switched
  const events = useMemo(() => (isBuyer ? stored.filter((e) => e.actorRole === "buyer") : stored), [stored, isBuyer]);
  const funnel = dealFlowFunnel(events);
  const recent = [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  const max = Math.max(...funnel.map((f) => f.count), 1);
  // a buyer's tape omits the "your activity" entries, which come from all stored events
  const tape = useMemo(() => buildMarketTape().filter((t) => !isBuyer || t.kind !== "MANDATE"), [isBuyer]);
  const net = networkStats(events);
  const rate = (v: number | null): string => (v == null ? "—" : `${v}%`);
  const [confirming, setConfirming] = useState(false);
  const clearRef = useRef<HTMLButtonElement>(null);
  const keep = (): void => { setConfirming(false); requestAnimationFrame(() => clearRef.current?.focus()); };
  const where = listingDestination() === "exchange" ? "your account's stored events" : "this browser";

  return (
    <div data-page="deal-activity" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Exchange · Telemetry" title="Deal Activity"
        badge={<span className="text-[12px] text-xo-muted">{events.length} stored events</span>}
        description={`${isBuyer ? "Buyer-side deal-flow actions" : "Deal-flow actions"} you have taken in ExitOS (views, interest, NDA requests …), as recorded in ${where}. Counts and rates come from these events only.${isBuyer ? " Founder actions are not shown." : ""}`} />

      <section aria-label="Activity summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Stored events" emphasis value={String(events.length)} sub="all recorded" /></div>
        <div className="bg-xo-panel"><Metric label="Buyers viewed" value={String(subjectsAtStage("viewed_buyer", events).length)} sub="distinct" /></div>
        <div className="bg-xo-panel"><Metric label="Interest expressed" value={String(subjectsAtStage("expressed_interest", events).length)} sub="distinct buyers" /></div>
        <div className="bg-xo-panel"><Metric label="NDAs in motion" value={String(subjectsAtStage("nda_requested", events).length)} sub="requested" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Your rates · from recorded events" className="border border-xo-line"
        foot="Computed from your own recorded events only — not across other users. A rate shows — until the events to measure it exist; nothing is modelled.">
        <dl className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-3 lg:grid-cols-6">
          {[
            { k: "Recorded actions", v: String(net.actions), sub: "all stored" },
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
        <Section title="Deal-flow funnel · recorded" className="lg:col-span-5"
          right={!isBuyer && events.length > 0 && !confirming ? <button ref={clearRef} type="button" onClick={() => setConfirming(true)} className="rounded-sm border border-xo-line px-2 py-1 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Clear history…</button> : undefined}
          foot="Distinct buyers or listings that reached each stage in your recorded events.">
          {!isBuyer && confirming && events.length > 0 && (
            <div role="alert" className="border-b border-xo-line bg-xo-raise px-4 py-3 text-[12px]">
              <p className="font-semibold text-xo-risk">Erase all {events.length} stored events?</p>
              <p className="mt-1 text-xo-muted">This permanently deletes the deal-activity record held in {where}{where === "this browser" ? "" : " in the backend"}. Funnel counts and rates on this page, and buyer activity on other pages, reset to zero. It cannot be undone.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => { clearDealEvents(); setConfirming(false); }} className="rounded-sm border border-xo-risk px-2 py-1 font-semibold text-xo-risk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Erase {events.length} events</button>
                <button type="button" autoFocus onClick={keep} className="rounded-sm border border-xo-line px-2 py-1 font-medium text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Keep history</button>
              </div>
            </div>
          )}
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
          ) : <Empty title="No activity recorded yet.">Opening buyer profiles, expressing interest or requesting NDAs adds events here.</Empty>}
        </Section>
      </div>
    </div>
  );
};

export default DealActivity;
