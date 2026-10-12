import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fmtMoney } from "../lib/ui";
import { Link } from "react-router-dom";
import { myNdaRequests, dealsForBuyer, myMandate, DEAL_STAGES, type NdaRequest, type Deal, type Mandate } from "../lib/exit-api";
import { allListings } from "../lib/listings";
import { subscribe } from "../lib/deal-events";
import { PageHeader, Section, Metric, Chip, Provenance } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import StartHere from "../components/StartHere";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import {
  SEAT, SEAT_MANDATE, PORTAL_OPPORTUNITIES, PORTAL_NEGOTIATIONS, PORTAL_STATS,
} from "../lib/buyer-portal";

// Buyer Home — the acquirer's side of the exchange. The workstation shows a
// labelled DEMO seat: the registry buyer the matching engine ranks highest
// for the demo listing, so it mirrors the founder console's demo deal from
// the other chair. It is not the signed-in buyer's account. Figures come
// from lib/buyer-portal.ts (demo listing, matches and sample offers).

type Tab = "dashboard" | "watchlist" | "opportunities" | "diligence" | "negotiations";

const REQ_LABEL: Record<NdaRequest["status"], string> = { requested: "Awaiting the founder", signed: "NDA signed", rejected: "Declined" };
const usdM = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${Math.round(n / 1e6)}M`);

/** The signed-in buyer's own records from the exchange backend. */
const YourActivity: React.FC = () => {
  const [reqs, setReqs] = useState<NdaRequest[] | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const refresh = useCallback(() => {
    void myNdaRequests().then(setReqs).catch(() => setReqs([]));
    void dealsForBuyer().then(setDeals).catch(() => setDeals([]));
    void myMandate().then(setMandate).catch(() => setMandate(null));
  }, []);
  // re-query on mount and when the account's backend connects (it emits a
  // deal-event change) or an action is recorded
  useEffect(() => { refresh(); return subscribe(refresh); }, [refresh]);
  const name = (listingId: string): string => allListings().find((l) => l.id === listingId)?.code ?? listingId;
  const stage = (st: Deal["stage"]): string => DEAL_STAGES.find((d) => d.stage === st)?.label ?? (st === "withdrawn" ? "Withdrawn" : st);
  const LINK = "font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  return (
    <Section title="Your activity" eyebrow="Your account" className="border border-xo-line"
      foot={<>Your own records on the exchange. Request NDAs and make offers on the <Link to="/console/acquisition-radar" className={LINK}>Acquisition Radar</Link>; follow the requests on <Link to="/console/nda" className={LINK}>Access Requests</Link>.</>}>
      <div className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-3">
        <div className="bg-xo-panel px-4 py-3">
          <h3 className="text-[12px] font-semibold text-xo-muted">Your NDA requests</h3>
          {reqs == null ? <p className="mt-2 text-[13px] text-xo-muted">Loading…</p> : reqs.length === 0
            ? <p className="mt-2 text-[13px] text-xo-muted">None yet.</p>
            : <ul className="mt-2 space-y-1.5 text-[13px]">{reqs.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2"><span className="font-mono">{name(r.listingId)}</span><span className={r.status === "signed" ? "text-xo-verified" : r.status === "rejected" ? "text-xo-risk" : "text-xo-caution"}>{REQ_LABEL[r.status]}</span></li>))}</ul>}
        </div>
        <div className="bg-xo-panel px-4 py-3">
          <h3 className="text-[12px] font-semibold text-xo-muted">Your deals</h3>
          {deals.length === 0
            ? <p className="mt-2 text-[13px] text-xo-muted">None yet — a deal opens when you request an NDA or make an offer.</p>
            : <ul className="mt-2 space-y-1.5 text-[13px]">{deals.map((d) => (
                <li key={d.id} className="flex flex-wrap justify-between gap-2"><span className="font-mono">{name(d.listingId)}</span><span>{stage(d.stage)}</span></li>))}</ul>}
        </div>
        <div className="bg-xo-panel px-4 py-3">
          <h3 className="text-[12px] font-semibold text-xo-muted">Your mandate</h3>
          {mandate
            ? <p className="mt-2 text-[13px]">{mandate.sectors.slice(0, 4).join(" · ") || "any sector"} · target revenue {usdM(mandate.minCheckUsd)}–{usdM(mandate.maxCheckUsd)} · {mandate.regions.slice(0, 3).join(", ") || "any region"}</p>
            : <p className="mt-2 text-[13px] text-xo-muted">Not saved — save one on the <Link to="/console/acquisition-radar" className={LINK}>Acquisition Radar</Link> so founders' listings can be matched to it.</p>}
        </div>
      </div>
    </Section>
  );
};

const BuyerPortal: React.FC = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [watch, setWatch] = useState<string[]>(PORTAL_OPPORTUNITIES.map((o) => o.code));
  const toggle = (c: string) => setWatch((w) => (w.includes(c) ? w.filter((x) => x !== c) : [...w, c]));
  const tape = useMemo(() => buildMarketTape(), []);
  const TABS: [Tab, string][] = [["dashboard", "Dashboard"], ["watchlist", "Watchlist"], ["opportunities", "Opportunities"], ["diligence", "Diligence"], ["negotiations", "Negotiations"]];

  const BTN = "rounded-sm bg-deal-700 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

  return (
    <div data-page="buyer-portal" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Buyer Console" title="Buyer Home"
        badge={<Provenance kind="demo">Demo seat</Provenance>}
        description={<>The workstation below shows a <span className="font-semibold text-xo-text">demo seat — {SEAT.entry?.name ?? "a registry buyer"}</span>, the registry buyer the matching engine ranks #{SEAT.rank} for the demo listing. It is not your account. Your own NDA requests are on <Link to="/console/nda" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Access Requests</Link>.</>} />

      <StartHere />

      <YourActivity />

      <section aria-label="Demo seat summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Matched opportunities" emphasis value={String(PORTAL_STATS.opportunities)} sub="fit the demo seat's mandate" provenance="demo" /></div>
        <div className="bg-xo-panel"><Metric label="Watchlist" value={String(watch.length)} sub="this visit only — not saved" /></div>
        <div className="bg-xo-panel"><Metric label="Data-room access" value={String(PORTAL_STATS.inDiligence)} sub={`${PORTAL_STATS.diligencePackages} packages/room`} /></div>
        <div className="bg-xo-panel"><Metric label="Active negotiations" emphasis value={String(PORTAL_STATS.negotiations)} sub="offers in motion" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title={`Demo seat workstation · ${SEAT.entry?.name ?? "registry buyer"}`} className="border border-xo-line"
        right={<div role="group" aria-label="Workstation view" className="flex flex-wrap gap-1">
          {TABS.map(([k, l]) => <Chip key={k} pressed={tab === k} onToggle={() => setTab(k)}>{l}</Chip>)}
        </div>}>
        <div className="px-4 py-3">
          {tab === "dashboard" && (
            <dl className="grid gap-px bg-xo-line lg:grid-cols-2">
              <div className="bg-xo-panel p-3">
                <dt className="text-[12px] font-semibold text-xo-muted">Mandate</dt>
                <dd className="mt-1.5 text-[13px]">{SEAT_MANDATE}</dd>
                <dd className="mt-2 text-[12px] text-xo-muted">Ranked #{SEAT.rank} of {PORTAL_STATS.competingMatches} mandates matched to the demo listing.</dd>
              </div>
              <div className="bg-xo-panel p-3">
                <dt className="text-[12px] font-semibold text-xo-muted">Pipeline by stage</dt>
                <dd className="mt-2 space-y-1.5">
                  {(["sourcing", "engaged", "diligence", "loi"] as const).map((st) => (
                    <div key={st} className="flex items-center justify-between"><span className="text-[12px] capitalize">{st}</span><span className="font-mono text-[12px]">{PORTAL_OPPORTUNITIES.filter((o) => o.stage === st).length}</span></div>
                  ))}
                </dd>
              </div>
            </dl>
          )}

          {(tab === "opportunities" || tab === "watchlist") && (
            <ul className="grid gap-px bg-xo-line sm:grid-cols-2">
              {(tab === "watchlist" ? PORTAL_OPPORTUNITIES.filter((o) => watch.includes(o.code)) : PORTAL_OPPORTUNITIES).map((o) => (
                <li key={o.code} className="bg-xo-panel p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-mono text-[13px] font-semibold">{o.code}</h3>
                    <span className="font-mono text-[12px] font-semibold text-xo-verified">fit score {o.fit}/100</span>
                  </div>
                  <div className="text-[12px] text-xo-muted">{o.sector} · {o.region} · readiness {o.readiness}/100</div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-xo-line pt-2 text-[12px]">
                    <div><dt className="text-xo-muted">Revenue</dt><dd className="font-mono">{o.revenue != null ? fmtMoney(o.revenue) : "NDA-gated"}</dd></div>
                    <div><dt className="text-xo-muted">Value (canonical midpoint)</dt><dd className="font-mono">{fmtMoney(o.ask)}</dd></div>
                    <div><dt className="text-xo-muted">Stage</dt><dd className="capitalize">{o.stage}</dd></div>
                  </dl>
                  <div className="mt-2 flex gap-2">
                    <button type="button" aria-pressed={watch.includes(o.code)} onClick={() => toggle(o.code)} className={BTN_GHOST}>{watch.includes(o.code) ? "★ Watching" : "☆ Watch"}</button>
                    <Link to="/console/acquisition-radar" className={BTN}>Open on the Acquisition Radar →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "diligence" && (
            <ul>
              {PORTAL_OPPORTUNITIES.map((o) => (
                <li key={o.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-xo-line py-2 last:border-0">
                  <div>
                    <h3 className="font-mono text-[13px] font-semibold">{o.code}</h3>
                    <div className="text-[12px] text-xo-muted">{o.sector} · {o.hasDataRoom ? `the demo seat's NDA is active · ${PORTAL_STATS.diligencePackages} diligence packages in the demo` : "the demo seat has no NDA on this listing — nothing is shared automatically"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {o.hasDataRoom && <span className="text-[12px] font-semibold text-xo-verified">NDA active</span>}
                    <Link to="/console/acquisition-radar" className={BTN_GHOST}>Request your own NDA on the Radar →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "negotiations" && (
            <ul>
              {PORTAL_NEGOTIATIONS.length === 0 && <li className="py-6 text-center text-[13px] text-xo-muted">The demo seat has no offers. Make your own indicative offers on the <Link to="/console/acquisition-radar" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Acquisition Radar</Link>.</li>}
              {PORTAL_NEGOTIATIONS.map((n) => (
                <li key={n.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-xo-line py-2 last:border-0">
                  <div>
                    <h3 className="font-mono text-[13px] font-semibold">{n.code}</h3>
                    <div className="text-[12px] text-xo-muted">Offer {fmtMoney(n.offer)} · {n.premiumPct >= 0 ? "+" : ""}{n.premiumPct}% vs the canonical midpoint</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] capitalize">{n.stage}</span>
                    <span className="text-[12px] text-xo-muted">{n.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
};

export default BuyerPortal;
