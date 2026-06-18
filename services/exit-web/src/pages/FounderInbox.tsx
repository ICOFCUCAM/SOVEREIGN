import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, Button } from "../lib/ui";
import { loadActiveCompany } from "../lib/active-company";
import { listingFromCompany, allListings } from "../lib/listings";
import { eventsForSubject } from "../lib/exit-api";
import { captureDealEvent, subscribe, type DealEvent } from "../lib/deal-events";

// FOUNDER INBOX — the demand side as the founder sees it. Buyers on the
// network express interest and request NDAs against the founder's anonymized
// listing; those events land here (queried across ALL actors via the
// exit-api), and the founder executes the NDA to release identity. This is
// the first real two-sided loop: a buyer action on one side becomes a founder
// decision on the other, every step captured. Nothing is fabricated — the
// inbox shows only the interest that actually arrived.

const timeAgo = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const INCOMING: Record<string, { verb: string; tone: string }> = {
  listing_viewed: { verb: "viewed your listing", tone: "text-white/55" },
  expressed_interest: { verb: "expressed interest", tone: "text-deal-300" },
  nda_requested: { verb: "requested an NDA", tone: "text-amber-300" },
  nda_signed: { verb: "— NDA executed, identity released", tone: "text-emerald-300" },
};

const FounderInbox: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  // the founder's own listing id is deterministic from their company; the
  // inbox tracks interest landing on it whether or not it's listed yet.
  const listing = useMemo(() => listingFromCompany(company), [company]);
  const isLive = useMemo(() => allListings().some((l) => l.id === listing.id), [listing.id]);

  const [events, setEvents] = useState<DealEvent[]>([]);
  const refresh = useCallback(() => {
    void eventsForSubject(listing.id).then((e) =>
      setEvents([...e].sort((a, b) => b.at.localeCompare(a.at))),
    );
  }, [listing.id]);

  // re-query on mount and whenever any deal event is captured (e.g. the
  // founder executes an NDA, or — with a shared backend — a buyer acts).
  useEffect(() => { refresh(); return subscribe(refresh); }, [refresh]);

  const count = (k: string): number => events.filter((e) => e.kind === k).length;
  const interested = count("expressed_interest");
  const ndaRequested = count("nda_requested");
  const ndaExecuted = count("nda_signed");
  const pending = Math.max(0, ndaRequested - ndaExecuted);

  const executeNda = (): void => {
    captureDealEvent({
      actorRole: "founder", kind: "nda_signed",
      subjectType: "listing", subjectId: listing.id, subjectName: listing.code,
    });
    // subscribe() fires → refresh() re-queries automatically
  };

  return (
    <div>
      <SectionHeader
        kicker="Founder · Demand"
        title="Inbox"
        description="Buyer interest and NDA requests landing on your anonymized listing, across the whole network. Execute an NDA to release your identity to a requesting buyer and move them into diligence."
      />

      {!isLive && (
        <Card className="mb-6 border-amber-400/30 bg-amber-500/[0.04] p-4 text-[12.5px] text-white/70">
          <span className="font-semibold text-amber-300">Not listed yet.</span> Your company isn’t on the exchange, so buyers can’t discover it.{" "}
          <Link to="/console/intake" className="text-deal-300 hover:text-deal-200">List on the exchange</Link> to start receiving interest. The inbox below will populate as soon as buyers act on <span className="font-mono text-white/80">{listing.code}</span>.
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Listing" value={listing.code} sub={`${listing.publicView.sector} · ${listing.publicView.region}`} />
        <Kpi label="Interest expressed" value={String(interested)} sub="from buyers" accent="#34d399" />
        <Kpi label="NDA requests" value={String(ndaRequested)} sub={`${pending} awaiting you`} accent="#fbbf24" />
        <Kpi label="NDAs executed" value={String(ndaExecuted)} sub="identity released" accent="#34d399" />
      </div>

      {pending > 0 && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-deal-400/30 p-5">
          <div>
            <div className="text-[13px] font-semibold text-white">{pending} buyer{pending > 1 ? "s are" : " is"} waiting on an NDA</div>
            <div className="mt-0.5 text-[11.5px] text-white/55">Executing the NDA releases your identity to the requesting buyer and opens diligence. Counterparties stay anonymous to you until they sign.</div>
          </div>
          <Button onClick={executeNda}>Execute NDA</Button>
        </Card>
      )}

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Incoming activity · {listing.code}</div>
        {events.length ? (
          <ul>
            {events.map((e) => {
              const d = INCOMING[e.kind] ?? { verb: e.kind, tone: "text-white/55" };
              return (
                <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 px-5 py-2.5 text-[12.5px] last:border-0">
                  <span className="min-w-0">
                    <span className="text-white/50">{e.actorRole === "founder" ? "You" : "A buyer"}</span>{" "}
                    <span className={d.tone}>{d.verb}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-white/35">{timeAgo(e.at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center text-[12px] text-white/45">
            No interest yet. When a buyer on the <Link to="/console/acquisition-radar" className="text-deal-300 hover:text-deal-200">Acquisition Radar</Link> expresses interest in {listing.code}, it lands here.
          </div>
        )}
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
          Buyer identities stay withheld until they sign — you see the interest and the request, never scraped contact data. Every action here is captured through the exit-api and improves future buyer recommendations.
        </div>
      </Card>
    </div>
  );
};

export default FounderInbox;
