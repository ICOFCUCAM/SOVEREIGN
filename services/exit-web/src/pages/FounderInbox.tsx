import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { loadActiveCompany } from "../lib/active-company";
import { listingFromCompany, allListings } from "../lib/listings";
import {
  eventsForSubject, ndaRequestsForListing, signNda, offersForListing, resolveOffer,
  dealsForListing, advanceDeal, DEAL_STAGES, dealStageIndex, allMandates,
  listingDestination, type NdaRequest, type Offer, type Deal, type DealStage, type Mandate,
} from "../lib/exit-api";
import { matchCompanyToCriteria } from "../lib/acquirer";
import { captureDealEvent, subscribe, type DealEvent } from "../lib/deal-events";
import type { Region } from "@exit/engines";

const DEMO_LISTING_ID = "lst-demo-helios";
const usdShort = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${Math.round(n / 1e6)}M`);

// FOUNDER INBOX — the demand side as the founder sees it. Buyers express
// interest, request NDAs and submit offers against the founder's anonymized
// listing. NDA requests and offers are records (not just telemetry): the
// founder marks an NDA executed and accepts/declines offers. Marking an NDA
// executed changes the record only — no document is signed and nothing
// reveals the company to the buyer. Nothing is fabricated; the inbox shows
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
  listing_viewed: { verb: "viewed your listing", tone: "text-xo-muted" },
  expressed_interest: { verb: "expressed interest", tone: "text-xo-action" },
  nda_requested: { verb: "requested an NDA", tone: "text-xo-caution" },
  nda_signed: { verb: "marked the NDA executed", tone: "text-xo-verified" },
  loi_issued: { verb: "submitted an offer", tone: "text-xo-action" },
  meeting_scheduled: { verb: "moved the deal to management meeting", tone: "text-xo-action" },
  diligence_started: { verb: "moved the deal to due diligence", tone: "text-xo-action" },
  closed: { verb: "marked the deal closed", tone: "text-xo-verified" },
  walked_away: { verb: "withdrew the deal", tone: "text-xo-muted" },
};
const OFFER_TONE: Record<string, string> = {
  submitted: "text-xo-action", accepted: "text-xo-verified", rejected: "text-xo-risk", withdrawn: "text-xo-muted",
};

type Pending = { kind: "nda" | "accept" | "decline" | "withdraw"; id: string } | null;

/** Inline confirmation for a record change that cannot be undone here. */
const Confirm: React.FC<{ text: React.ReactNode; confirm: string; onConfirm: () => void; onCancel: () => void }> = ({ text, confirm, onConfirm, onCancel }) => (
  <div role="group" aria-label="Confirm action" className="mt-2 w-full border border-xo-caution/50 bg-xo-ink px-3 py-2 text-[12px]">
    <p className="text-xo-text">{text}</p>
    <div className="mt-2 flex gap-2">
      <button type="button" onClick={onConfirm} className="rounded-sm bg-deal-700 px-3 py-1 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{confirm}</button>
      <button type="button" autoFocus onClick={onCancel} className="rounded-sm border border-xo-line px-3 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Cancel</button>
    </div>
  </div>
);

const FounderInbox: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  // the founder's own listing id is deterministic from their company; the
  // inbox tracks interest landing on it whether or not it's listed yet. With
  // no intake the demo company is the exchange's seeded demo listing.
  const listing = useMemo(() => listingFromCompany(company, fromIntake ? undefined : DEMO_LISTING_ID), [company, fromIntake]);
  const isLive = useMemo(() => allListings().some((l) => l.id === listing.id), [listing.id]);

  const [events, setEvents] = useState<DealEvent[]>([]);
  const [ndas, setNdas] = useState<NdaRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [matched, setMatched] = useState<{ m: Mandate; score: number; qualified: boolean }[]>([]);

  const refresh = useCallback(() => {
    void eventsForSubject(listing.id).then((e) => setEvents([...e].sort((a, b) => b.at.localeCompare(a.at))));
    void ndaRequestsForListing(listing.id).then((r) => setNdas([...r].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))));
    void offersForListing(listing.id).then((o) => setOffers([...o].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
    void dealsForListing(listing.id).then((d) => setDeals([...d].sort((a, b) => dealStageIndex(b.stage) - dealStageIndex(a.stage))));
    // liquidity: which published buyer mandates match THIS listing
    void allMandates().then((ms) => setMatched(ms
      .map((m) => {
        const r = matchCompanyToCriteria(listing.profile, { sectors: [...m.sectors], minRevUsd: m.minCheckUsd, maxRevUsd: m.maxCheckUsd, regions: [...m.regions] as Region[], minGrowthPct: m.minGrowthPct });
        return { m, score: r.score, qualified: r.qualified };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)));
  }, [listing.id]);

  const [pending, setPending] = useState<Pending>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const ask = (p: NonNullable<Pending>) => (e: React.MouseEvent<HTMLButtonElement>): void => { trigger.current = e.currentTarget; setPending(p); };
  const cancel = (): void => { setPending(null); requestAnimationFrame(() => trigger.current?.focus()); };
  const isPending = (kind: NonNullable<Pending>["kind"], id: string): boolean => pending?.kind === kind && pending.id === id;

  const advance = (deal: Deal, stage: DealStage): void => {
    void advanceDeal(deal, stage, "founder", listing.code).then(refresh);
  };

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

  const BTN = "rounded-sm bg-deal-700 px-3 py-1 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="inbox" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Founder · Demand · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Inbox"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className={`rounded-sm border px-1.5 py-px text-[11px] font-semibold ${isLive ? "border-xo-verified/50 text-xo-verified" : "border-xo-caution/50 text-xo-caution"}`}>{isLive ? "Listed" : "Draft"}</span></>}
        description={<>Listing <span className="font-mono">{listing.code}</span> · {listing.publicView.sector} · {listing.publicView.region} · revenue {usd(listing.publicView.revenueUsd)}. {fromIntake
          ? "Your company's listing, from your saved intake."
          : <>No intake saved, so this shows the demo company's listing on the exchange — requests and offers here come from anyone using the demo. <Link to="/console/intake" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Save an intake</Link> to see your own.</>}</>} />

      <section aria-label="Inbox summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 xl:grid-cols-6">
        <div className="bg-xo-panel"><Metric label="Qualified buyers" emphasis value={String(matched.filter((x) => x.qualified).length)} sub={`of ${matched.length} matching mandates`} /></div>
        <div className="bg-xo-panel"><Metric label="Open deals" value={String(deals.length)} sub={`${deals.filter((d) => d.stage === "closed").length} closed`} /></div>
        <div className="bg-xo-panel"><Metric label="Interest expressed" value={String(interested)} sub="from buyers" /></div>
        <div className="bg-xo-panel"><Metric label="NDA requests" value={String(ndas.length)} sub={`${pendingNdas.length} awaiting · ${executedNdas.length} done`} /></div>
        <div className="bg-xo-panel"><Metric label="NDAs executed" value={String(executedNdas.length)} sub="marked signed" /></div>
        <div className="bg-xo-panel"><Metric label="Offers" value={String(offers.length)} sub={`${openOffers.length} open`} /></div>
      </section>

      <MarketTape items={tape} />

      {!isLive && (
        <p role="note" className="border border-xo-caution/40 bg-xo-panel px-4 py-2.5 text-[12px] text-xo-muted">
          <span className="font-semibold text-xo-caution">Not listed yet.</span> Your company isn’t on the exchange, so buyers can’t discover it.{" "}
          <Link to="/console/intake" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">List on the exchange</Link> to start receiving interest — the panels below populate as soon as buyers act on <span className="font-mono text-xo-text">{listing.code}</span>.
        </p>
      )}

      {/* marketplace liquidity — qualified buyer mandates matching this listing */}
      <Section title="Qualified buyers · mandates matching your listing" className="border border-xo-line"
        foot="Buyers who published an acquisition mandate that matches your sector, geography, check size and growth. Buyers are shown anonymously — this is your demand, before you run a process.">
        {matched.length ? (
          <ul>
            {matched.map(({ m, score, qualified }) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-xo-line px-4 py-2 text-[12px] last:border-0">
                <div className="min-w-0">
                  <span className="font-semibold">Buyer mandate</span>
                  {qualified && <span className="ml-2 rounded-sm border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">Qualified</span>}
                  <div className="mt-0.5 text-[11px] text-xo-muted">{m.sectors.slice(0, 4).join(" · ") || "any sector"} · {usdShort(m.minCheckUsd)}–{usdShort(m.maxCheckUsd)} check · {m.regions.slice(0, 3).join(", ") || "any region"}{m.strategicThemes.length ? ` · themes: ${m.strategicThemes.slice(0, 2).join(", ")}` : ""}</div>
                </div>
                <span className="shrink-0 font-mono text-[15px] font-semibold tabular-nums">{score}%</span>
              </li>
            ))}
          </ul>
        ) : <p className="px-4 py-6 text-center text-[12px] text-xo-muted">No published mandates match yet. As buyers publish acquisition mandates on the radar, qualified demand appears here before you ever run a process.</p>}
      </Section>

      {/* deal pipeline — advance each transaction through the lifecycle */}
      <Section title="Deal pipeline · advance each transaction" className="border border-xo-line"
        foot="One deal per buyer. Advancing a stage updates the deal record and adds an event to your Deal Activity record; it does not change any model. Buyers are shown anonymously.">
        {deals.length ? (
          <ul>
            {deals.map((d) => {
              const idx = dealStageIndex(d.stage);
              const next = DEAL_STAGES[idx + 1];
              const isClosed = d.stage === "closed";
              const isWithdrawn = d.stage === "withdrawn";
              return (
                <li key={d.id} className="border-b border-xo-line px-4 py-2.5 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="font-mono text-[11px] text-xo-faint">{idx >= 0 ? `Stage ${idx + 1} of ${DEAL_STAGES.length}` : "—"}</span>
                      <span className="font-semibold">A buyer</span>
                      <span className={`rounded-sm border px-1.5 py-px text-[11px] font-semibold ${isClosed ? "border-xo-verified/50 text-xo-verified" : isWithdrawn ? "border-xo-line text-xo-muted" : "border-xo-action/50 text-xo-action"}`}>{DEAL_STAGES[idx]?.label ?? (isWithdrawn ? "Withdrawn" : d.stage)}</span>
                      <span className="font-mono text-[11px] text-xo-faint">{timeAgo(d.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {next && !isWithdrawn && <button type="button" onClick={() => advance(d, next.stage)} className={BTN}>Advance → {next.label}</button>}
                      {!isClosed && !isWithdrawn && <button type="button" onClick={ask({ kind: "withdraw", id: d.id })} aria-expanded={isPending("withdraw", d.id)} className={BTN_GHOST}>Withdraw…</button>}
                    </div>
                  </div>
                  {isPending("withdraw", d.id) && (
                    <Confirm text="Withdraw this deal? It moves to Withdrawn and a “walked away” event is recorded. This cannot be undone here."
                      confirm="Withdraw deal" onConfirm={() => { setPending(null); advance(d, "withdrawn"); }} onCancel={cancel} />
                  )}
                  {/* stage track */}
                  <div aria-hidden className="mt-2 flex gap-0.5">
                    {DEAL_STAGES.map((s, i) => (
                      <span key={s.stage} className={`h-1 flex-1 rounded-sm ${i <= idx && !isWithdrawn ? "bg-xo-action" : "bg-xo-line"}`} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="px-4 py-6 text-center text-[12px] text-xo-muted">No open deals yet. A deal opens when a buyer requests an NDA or submits an offer on {listing.code}.</p>}
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
        {/* pending NDA requests — first-class records to resolve */}
        <Section title="NDA requests · awaiting you"
          foot="Execute NDA marks the request signed; the buyer sees “NDA signed”. ExitOS does not send or sign an NDA document and does not reveal your company to the buyer — share it yourself once the NDA is in place. Buyers are shown anonymously.">
          {pendingNdas.length ? (
            <ul>
              {pendingNdas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-xo-line px-4 py-2 last:border-0">
                  <div className="text-[12px]">
                    <span className="font-semibold">A buyer</span> <span className="text-xo-muted">requested an NDA</span>
                    <span className="ml-2 font-mono text-[11px] text-xo-faint">{timeAgo(r.requestedAt)}</span>
                  </div>
                  <button type="button" onClick={ask({ kind: "nda", id: r.id })} aria-expanded={isPending("nda", r.id)} className={BTN}>Execute NDA…</button>
                  {isPending("nda", r.id) && (
                    <Confirm text="Mark this NDA request as executed? The buyer will see “NDA signed”. No document is sent or signed, and your company is not revealed. This cannot be undone here."
                      confirm="Mark executed" onConfirm={() => { setPending(null); execute(r); }} onCancel={cancel} />
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-6 text-center text-[12px] text-xo-muted">No NDA requests awaiting you.</p>}
        </Section>

        {/* offers — first-class records to accept / decline */}
        <Section title="Offers">
          {offers.length ? (
            <ul>
              {offers.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-xo-line px-4 py-2 last:border-0">
                  <div className="text-[12px]">
                    <span className="font-mono text-[15px] font-semibold tabular-nums">{usd(o.amountUsd)}</span>
                    <span className={`ml-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${OFFER_TONE[o.status] ?? "text-xo-muted"}`}>{o.status}</span>
                    <span className="ml-2 font-mono text-[11px] text-xo-faint">{timeAgo(o.createdAt)}</span>
                  </div>
                  {o.status === "submitted" && (
                    <div className="flex gap-2">
                      <button type="button" onClick={ask({ kind: "accept", id: o.id })} aria-expanded={isPending("accept", o.id)} className={BTN}>Accept…</button>
                      <button type="button" onClick={ask({ kind: "decline", id: o.id })} aria-expanded={isPending("decline", o.id)} className={BTN_GHOST}>Decline…</button>
                    </div>
                  )}
                  {(isPending("accept", o.id) || isPending("decline", o.id)) && (
                    <Confirm text={isPending("accept", o.id)
                      ? `Accept this ${usd(o.amountUsd)} indicative offer? The offer record changes to accepted. It is not a binding agreement, and it cannot be undone here.`
                      : `Decline this ${usd(o.amountUsd)} offer? The offer record changes to rejected. This cannot be undone here.`}
                      confirm={isPending("accept", o.id) ? "Accept offer" : "Decline offer"}
                      onConfirm={() => { const st = isPending("accept", o.id) ? "accepted" : "rejected"; setPending(null); decide(o, st); }} onCancel={cancel} />
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-6 text-center text-[12px] text-xo-muted">No offers yet.</p>}
        </Section>
      </div>

      {/* incoming activity feed */}
      <Section title={`Incoming activity · ${listing.code}`} className="border border-xo-line"
        foot={`Buyers are shown anonymously — you see the interest and the request, never scraped contact data. NDA requests and offers are records ${listingDestination() === "exchange" ? "on the exchange backend" : "stored in this browser"}.`}>
        {events.length ? (
          <ul>
            {events.map((e) => {
              // a founder advancing to IOI/LOI records loi_issued too — not an offer they made
              const d = e.actorRole === "founder" && e.kind === "loi_issued" ? { verb: "moved the deal to an offer stage (IOI/LOI)", tone: "text-xo-action" } : INCOMING[e.kind] ?? { verb: e.kind, tone: "text-xo-muted" };
              return (
                <li key={e.id} className="flex items-baseline justify-between gap-3 border-b border-xo-line px-4 py-1.5 text-[12px] last:border-0">
                  <span className="min-w-0">
                    <span className="text-xo-muted">{e.actorRole === "founder" ? "You" : "A buyer"}</span>{" "}
                    <span className={d.tone}>{d.verb}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-xo-faint">{timeAgo(e.at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-[12px] text-xo-muted">
            No interest yet. When a buyer on the <Link to="/console/acquisition-radar" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Acquisition Radar</Link> expresses interest in {listing.code}, it lands here.
          </p>
        )}
      </Section>
    </div>
  );
};

export default FounderInbox;
