import React, { useMemo, useState } from "react";
import { fmtMoney } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { Link } from "react-router-dom";
import { PageHeader, Section, Metric, Chip, Provenance } from "../components/xo";
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

      <section aria-label="Demo seat summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Matched opportunities" emphasis value={String(PORTAL_STATS.opportunities)} sub="fit the demo seat's mandate" provenance="demo" /></div>
        <div className="bg-xo-panel"><Metric label="Watchlist" value={String(watch.length)} sub="tracked targets" /></div>
        <div className="bg-xo-panel"><Metric label="Data-room access" value={String(PORTAL_STATS.inDiligence)} sub={`${PORTAL_STATS.diligencePackages} packages/room`} /></div>
        <div className="bg-xo-panel"><Metric label="Active negotiations" emphasis value={String(PORTAL_STATS.negotiations)} sub="offers in motion" /></div>
      </section>

      <MarketTape items={tape} />

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
                <dd className="mt-2 text-[12px] text-xo-muted">Ranked #{SEAT.rank} of {PORTAL_STATS.competingMatches} mandates matched to the live listing.</dd>
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
                    <span className="font-mono text-[12px] font-semibold text-xo-verified">{o.fit}% fit</span>
                  </div>
                  <div className="text-[12px] text-xo-muted">{o.sector} · {o.region} · readiness {o.readiness}/100</div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-xo-line pt-2 text-[12px]">
                    <div><dt className="text-xo-muted">Revenue</dt><dd className="font-mono">{o.revenue != null ? fmtMoney(o.revenue) : "NDA-gated"}</dd></div>
                    <div><dt className="text-xo-muted">Ask</dt><dd className="font-mono">{fmtMoney(o.ask)}</dd></div>
                    <div><dt className="text-xo-muted">Stage</dt><dd className="capitalize">{o.stage}</dd></div>
                  </dl>
                  <div className="mt-2 flex gap-2">
                    <button type="button" aria-pressed={watch.includes(o.code)} onClick={() => toggle(o.code)} className={BTN_GHOST}>{watch.includes(o.code) ? "★ Watching" : "☆ Watch"}</button>
                    <button type="button" className={BTN}>{o.hasDataRoom ? "Open data room" : "Request access"}</button>
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
                    <div className="text-[12px] text-xo-muted">{o.sector} · {o.hasDataRoom ? `data room granted · ${PORTAL_STATS.diligencePackages} packages` : "identity and packages unlock on NDA"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {o.hasDataRoom
                      ? <><span className="text-[12px] font-semibold text-xo-verified">Active</span><button type="button" className={BTN_GHOST}>Open</button></>
                      : <button type="button" className={BTN}>Request NDA</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tab === "negotiations" && (
            <ul>
              {PORTAL_NEGOTIATIONS.length === 0 && <li className="py-6 text-center text-[13px] text-xo-muted">No offers in motion. Submit an offer from an opportunity to open a negotiation.</li>}
              {PORTAL_NEGOTIATIONS.map((n) => (
                <li key={n.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-xo-line py-2 last:border-0">
                  <div>
                    <h3 className="font-mono text-[13px] font-semibold">{n.code}</h3>
                    <div className="text-[12px] text-xo-muted">Offer {fmtMoney(n.offer)} · {n.premiumPct >= 0 ? "+" : ""}{n.premiumPct}% vs strategic mid</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] capitalize">{n.stage}</span>
                    <span className="text-[12px] text-xo-muted">{n.status}</span>
                    <button type="button" className={BTN}>Respond</button>
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
