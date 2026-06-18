import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../lib/ui";
import { Panel, Frame, CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { loadActiveCompany } from "../lib/active-company";
import { listingFromCompany, allListings } from "../lib/listings";
import {
  eventsForSubject, ndaRequestsForListing, signNda, offersForListing, resolveOffer,
  type NdaRequest, type Offer,
} from "../lib/exit-api";
import { captureDealEvent, subscribe, type DealEvent } from "../lib/deal-events";

// FOUNDER INBOX — the demand side as the founder sees it. Buyers on the
// network express interest, request NDAs and submit offers against the
// founder's anonymized listing. NDA requests and offers are FIRST-CLASS
// records (not just telemetry): the founder executes an NDA to release
// identity, and accepts/declines offers — every action attributed and
// resolved under owner-scoped RLS. Nothing is fabricated; the inbox shows
// only what actually arrived.

const timeAgo = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
};
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

const INCOMING: Record<string, { verb: string; tone: string }> = {
  listing_viewed: { verb: "viewed your listing", tone: "text-white/55" },
  expressed_interest: { verb: "expressed interest", tone: "text-deal-300" },
  nda_requested: { verb: "requested an NDA", tone: "text-amber-300" },
  nda_signed: { verb: "— NDA executed, identity released", tone: "text-emerald-300" },
  loi_issued: { verb: "submitted an offer", tone: "text-deal-300" },
};
const OFFER_TONE: Record<string, string> = {
  submitted: "text-deal-300", accepted: "text-emerald-300", rejected: "text-red-300", withdrawn: "text-white/40",
};

const FounderInbox: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  // the founder's own listing id is deterministic from their company; the
  // inbox tracks interest landing on it whether or not it's listed yet.
  const listing = useMemo(() => listingFromCompany(company), [company]);
  const isLive = useMemo(() => allListings().some((l) => l.id === listing.id), [listing.id]);

  const [events, setEvents] = useState<DealEvent[]>([]);
  const [ndas, setNdas] = useState<NdaRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const refresh = useCallback(() => {
    void eventsForSubject(listing.id).then((e) => setEvents([...e].sort((a, b) => b.at.localeCompare(a.at))));
    void ndaRequestsForListing(listing.id).then((r) => setNdas([...r].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))));
    void offersForListing(listing.id).then((o) => setOffers([...o].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
  }, [listing.id]);

  // re-query on mount and whenever any deal event is captured (buyer interest,
  // founder executing an NDA) — keeps the inbox live.
  useEffect(() => { refresh(); return subscribe(refresh); }, [refresh]);

  const interested = events.filter((e) => e.kind === "expressed_interest").length;
  const pendingNdas = ndas.filter((r) => r.status === "requested");
  const executedNdas = ndas.filter((r) => r.status === "signed");
  const openOffers = offers.filter((o) => o.status === "submitted");

  const execute = (req: NdaRequest): void => {
    void signNda(req.id).then(refresh);
    // capture the telemetry too (feeds the funnel + engagement analytics)
    captureDealEvent({ actorRole: "founder", kind: "nda_signed", subjectType: "listing", subjectId: listing.id, subjectName: listing.code });
  };
  const decide = (offer: Offer, status: "accepted" | "rejected"): void => {
    void resolveOffer(offer.id, status).then(refresh);
  };

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Founder · Demand"
        title={company.name}
        tag={listing.publicView.sector}
        status={isLive ? "Listed" : "Draft"}
        meta={[
          { k: "CODE", v: listing.code },
          { k: "REGION", v: listing.publicView.region },
          { k: "REV", v: usd(listing.publicView.revenueUsd) },
        ]}
        metrics={[
          { k: "Interest expressed", v: String(interested), accent: true, sub: "from buyers" },
          { k: "NDA requests", v: String(ndas.length), sub: `${pendingNdas.length} awaiting · ${executedNdas.length} done` },
          { k: "NDAs executed", v: String(executedNdas.length), accent: true, sub: "identity released" },
          { k: "Offers", v: String(offers.length), sub: `${openOffers.length} open` },
        ]}
      />

      <MarketTape items={useMemo(() => buildMarketTape(), [])} />

      {!isLive && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/[0.04] px-4 py-2.5 text-[12px] text-white/70">
          <span className="font-semibold text-amber-300">Not listed yet.</span> Your company isn’t on the exchange, so buyers can’t discover it.{" "}
          <Link to="/console/intake" className="text-deal-300 hover:text-deal-200">List on the exchange</Link> to start receiving interest — the panels below populate as soon as buyers act on <span className="font-mono text-white/80">{listing.code}</span>.
        </div>
      )}

      <Frame>
        {/* pending NDA requests — first-class records to resolve */}
        <Panel title="NDA requests · awaiting you" className="lg:col-span-6"
          foot="Executing releases your identity to the requesting buyer and opens diligence. Counterparties stay anonymous to you until they sign.">
          {pendingNdas.length ? (
            <ul>
              {pendingNdas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-3 py-2 last:border-0">
                  <div className="text-[12px]">
                    <span className="font-semibold text-white">A buyer</span> <span className="text-white/55">requested an NDA</span>
                    <span className="ml-2 font-mono text-[10px] text-white/35">{timeAgo(r.requestedAt)}</span>
                  </div>
                  <Button onClick={() => execute(r)} className="!px-3 !py-1 !text-[11px]">Execute NDA</Button>
                </li>
              ))}
            </ul>
          ) : <div className="px-3 py-6 text-center text-[12px] text-white/40">No NDA requests awaiting you.</div>}
        </Panel>

        {/* offers — first-class records to accept / decline */}
        <Panel title="Offers" className="lg:col-span-6">
          {offers.length ? (
            <ul>
              {offers.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-3 py-2 last:border-0">
                  <div className="text-[12px]">
                    <span className="font-mono text-[15px] font-bold tabular-nums text-white">{usd(o.amountUsd)}</span>
                    <span className={`ml-3 text-[10px] font-semibold uppercase tracking-wide ${OFFER_TONE[o.status] ?? "text-white/50"}`}>{o.status}</span>
                    <span className="ml-2 font-mono text-[10px] text-white/35">{timeAgo(o.createdAt)}</span>
                  </div>
                  {o.status === "submitted" && (
                    <div className="flex gap-2">
                      <Button onClick={() => decide(o, "accepted")} className="!px-3 !py-1 !text-[11px]">Accept</Button>
                      <Button variant="ghost" onClick={() => decide(o, "rejected")} className="!px-3 !py-1 !text-[11px]">Decline</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : <div className="px-3 py-6 text-center text-[12px] text-white/40">No offers yet.</div>}
        </Panel>

        {/* incoming activity feed */}
        <Panel title={`Incoming activity · ${listing.code}`} className="lg:col-span-12"
          foot="Buyer identities stay withheld until they sign — you see the interest and the request, never scraped contact data. Every NDA and offer is a record resolved through the exit-api under owner-scoped security.">
          {events.length ? (
            <ul>
              {events.map((e) => {
                const d = INCOMING[e.kind] ?? { verb: e.kind, tone: "text-white/55" };
                return (
                  <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 px-3 py-1.5 text-[12px] last:border-0">
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
            <div className="px-3 py-8 text-center text-[12px] text-white/45">
              No interest yet. When a buyer on the <Link to="/console/acquisition-radar" className="text-deal-300 hover:text-deal-200">Acquisition Radar</Link> expresses interest in {listing.code}, it lands here.
            </div>
          )}
        </Panel>
      </Frame>
    </div>
  );
};

export default FounderInbox;
