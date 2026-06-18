import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, Button } from "../lib/ui";
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
    <div>
      <SectionHeader
        kicker="Founder · Demand"
        title="Inbox"
        description="Buyer interest, NDA requests and offers landing on your anonymized listing, across the whole network. Execute an NDA to release your identity; accept or decline offers to drive the process."
      />

      {!isLive && (
        <Card className="mb-6 border-amber-400/30 bg-amber-500/[0.04] p-4 text-[12.5px] text-white/70">
          <span className="font-semibold text-amber-300">Not listed yet.</span> Your company isn’t on the exchange, so buyers can’t discover it.{" "}
          <Link to="/console/intake" className="text-deal-300 hover:text-deal-200">List on the exchange</Link> to start receiving interest. The inbox below populates as soon as buyers act on <span className="font-mono text-white/80">{listing.code}</span>.
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Listing" value={listing.code} sub={`${listing.publicView.sector} · ${listing.publicView.region}`} />
        <Kpi label="Interest expressed" value={String(interested)} sub="from buyers" accent="#34d399" />
        <Kpi label="NDA requests" value={String(ndas.length)} sub={`${pendingNdas.length} awaiting · ${executedNdas.length} executed`} accent="#fbbf24" />
        <Kpi label="Offers" value={String(offers.length)} sub={`${openOffers.length} open`} accent="#34d399" />
      </div>

      {/* pending NDA requests — first-class records to resolve */}
      {pendingNdas.length > 0 && (
        <Card className="mt-6 overflow-hidden border-deal-400/30 p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">NDA requests · awaiting you</div>
          <ul>
            {pendingNdas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3 last:border-0">
                <div className="text-[12.5px]">
                  <span className="font-semibold text-white">A buyer</span> <span className="text-white/55">requested an NDA</span>
                  <span className="ml-2 font-mono text-[10px] text-white/35">{timeAgo(r.requestedAt)}</span>
                </div>
                <Button onClick={() => execute(r)}>Execute NDA</Button>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Executing releases your identity to the requesting buyer and opens diligence. Counterparties stay anonymous to you until they sign.</div>
        </Card>
      )}

      {/* offers — first-class records to accept / decline */}
      {offers.length > 0 && (
        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Offers · {listing.code}</div>
          <ul>
            {offers.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3 last:border-0">
                <div className="text-[12.5px]">
                  <span className="font-mono text-[15px] font-bold tabular-nums text-white">{usd(o.amountUsd)}</span>
                  <span className={`ml-3 text-[11px] font-semibold uppercase tracking-wide ${OFFER_TONE[o.status] ?? "text-white/50"}`}>{o.status}</span>
                  <span className="ml-2 font-mono text-[10px] text-white/35">{timeAgo(o.createdAt)}</span>
                </div>
                {o.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button onClick={() => decide(o, "accepted")}>Accept</Button>
                    <Button variant="ghost" onClick={() => decide(o, "rejected")}>Decline</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* incoming activity feed */}
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
          Buyer identities stay withheld until they sign — you see the interest and the request, never scraped contact data. Every NDA and offer is a record resolved through the exit-api under owner-scoped security.
        </div>
      </Card>
    </div>
  );
};

export default FounderInbox;
