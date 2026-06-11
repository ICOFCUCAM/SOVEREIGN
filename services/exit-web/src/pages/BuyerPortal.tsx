import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader, StageBadge, fmtMoney } from "../lib/ui";
import {
  SEAT, SEAT_MANDATE, PORTAL_OPPORTUNITIES, PORTAL_NEGOTIATIONS, PORTAL_STATS,
} from "../lib/buyer-portal";

// Buyer Portal — the acquirer's side of the exchange. Founders run a sale;
// buyers run a buy. The demo seat is the registry mandate the matching
// engine ranks highest for the live listing, so this surface shows the same
// deal the founder console shows — from the other chair. All figures come
// from lib/buyer-portal.ts, derived from the live engine runs.

type Tab = "dashboard" | "watchlist" | "opportunities" | "diligence" | "negotiations";

const BuyerPortal: React.FC = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [watch, setWatch] = useState<string[]>(PORTAL_OPPORTUNITIES.map((o) => o.code));
  const toggle = (c: string) => setWatch((w) => (w.includes(c) ? w.filter((x) => x !== c) : [...w, c]));

  return (
    <div>
      <SectionHeader
        kicker="Buyer Console"
        title={SEAT.entry?.name ?? "Buyer Portal"}
        description="The acquirer's side of the exchange — watchlists, live opportunities, diligence access and active negotiations. Founders run a sale; buyers run a buy, on the same infrastructure."
        actions={<Button>Set acquisition mandate</Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Matched opportunities" value={String(PORTAL_STATS.opportunities)} sub="fit your mandate" accent="#34d399" />
        <Kpi label="Watchlist" value={String(watch.length)} sub="tracked targets" />
        <Kpi label="Data-room access" value={String(PORTAL_STATS.inDiligence)} sub={`${PORTAL_STATS.diligencePackages} packages per room`} />
        <Kpi label="Active negotiations" value={String(PORTAL_STATS.negotiations)} sub="offers in motion" accent="#fbbf24" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {([["dashboard","Dashboard"],["watchlist","Watchlist"],["opportunities","Opportunities"],["diligence","Diligence"],["negotiations","Negotiations"]] as [Tab,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3.5 py-2 text-[13px] font-semibold transition ${tab === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && (
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Mandate</div>
              <div className="mt-2 text-sm text-white/80">{SEAT_MANDATE}</div>
              <div className="mt-3 text-[12px] text-white/50">
                Ranked #{SEAT.rank} of {PORTAL_STATS.competingMatches} mandates the engine matched to the live listing.
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Pipeline by stage</div>
              <div className="mt-3 space-y-2">
                {(["sourcing","engaged","diligence","loi"] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <StageBadge stage={s} />
                    <span className="font-mono text-sm text-white/80">{PORTAL_OPPORTUNITIES.filter((o) => o.stage === s).length}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {(tab === "opportunities" || tab === "watchlist") && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(tab === "watchlist" ? PORTAL_OPPORTUNITIES.filter((o) => watch.includes(o.code)) : PORTAL_OPPORTUNITIES).map((o) => (
              <Card key={o.code} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">{o.code}</div>
                  <span className="font-mono text-[13px] font-bold text-deal-300">{o.fit}% fit</span>
                </div>
                <div className="text-[11px] text-white/45">{o.sector} · {o.region} · readiness {o.readiness}/100</div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[12px]">
                  <div><div className="text-white/40">Revenue</div><div className="font-mono text-white/85">{o.revenue != null ? fmtMoney(o.revenue) : "NDA-gated"}</div></div>
                  <div><div className="text-white/40">Ask (mid)</div><div className="font-mono text-white/85">{fmtMoney(o.ask)}</div></div>
                  <div><div className="text-white/40">Stage</div><div className="mt-0.5"><StageBadge stage={o.stage} /></div></div>
                </div>
                {o.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-[11.5px] text-white/55">
                    {o.highlights.slice(0, 2).map((h) => <li key={h}>· {h}</li>)}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" className="text-[12px]" onClick={() => toggle(o.code)}>{watch.includes(o.code) ? "★ Watching" : "☆ Watch"}</Button>
                  <Button className="text-[12px]">{o.hasDataRoom ? "Open data room" : "Request access"}</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "diligence" && (
          <div className="space-y-2">
            {PORTAL_OPPORTUNITIES.map((o) => (
              <Card key={o.code} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">{o.code}</div>
                  <div className="text-[11px] text-white/45">
                    {o.sector} · {o.hasDataRoom ? `data room granted · ${PORTAL_STATS.diligencePackages} packages` : "identity and packages unlock on NDA"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {o.hasDataRoom ? (
                    <>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-deal-300"><span className="h-1.5 w-1.5 rounded-full bg-deal-400" /> Access active</span>
                      <Button variant="ghost" className="text-[12px]">Open data room</Button>
                    </>
                  ) : (
                    <Button className="text-[12px]">Request NDA</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "negotiations" && (
          <div className="space-y-2">
            {PORTAL_NEGOTIATIONS.length === 0 && (
              <Card className="p-5 text-[13px] text-white/55">No offers in motion. Submit an offer from an opportunity to open a negotiation.</Card>
            )}
            {PORTAL_NEGOTIATIONS.map((n) => (
              <Card key={n.code} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">{n.code}</div>
                  <div className="text-[11px] text-white/45">Offer {fmtMoney(n.offer)} · {n.premiumPct >= 0 ? "+" : ""}{n.premiumPct}% vs strategic mid</div>
                </div>
                <div className="flex items-center gap-3">
                  <StageBadge stage={n.stage} />
                  <span className="text-[12px] text-white/70">{n.status}</span>
                  <Button className="text-[12px]">Respond</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerPortal;
