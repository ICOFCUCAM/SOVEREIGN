import React, { useState } from "react";
import { Button, StageBadge, fmtMoney } from "../lib/ui";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
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
  const TABS: [Tab, string][] = [["dashboard", "Dashboard"], ["watchlist", "Watchlist"], ["opportunities", "Opportunities"], ["diligence", "Diligence"], ["negotiations", "Negotiations"]];

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Buyer Console"
        title={SEAT.entry?.name ?? "Buyer Portal"}
        tag="Acquirer seat"
        status={`Rank #${SEAT.rank}`}
        metrics={[
          { k: "Matched opportunities", v: String(PORTAL_STATS.opportunities), accent: true, sub: "fit your mandate" },
          { k: "Watchlist", v: String(watch.length), sub: "tracked targets" },
          { k: "Data-room access", v: String(PORTAL_STATS.inDiligence), sub: `${PORTAL_STATS.diligencePackages} packages/room` },
          { k: "Active negotiations", v: String(PORTAL_STATS.negotiations), accent: true, sub: "offers in motion" },
        ]}
      />


      <Frame>
        <Panel title="Buyer workstation" className="lg:col-span-12"
          right={
            <div className="flex flex-wrap gap-1">
              {TABS.map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition ${tab === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/45 hover:text-white"}`}>{l}</button>
              ))}
            </div>
          }>
          <div className="p-3">
            {tab === "dashboard" && (
              <div className="grid gap-px overflow-hidden rounded-md bg-white/10 lg:grid-cols-2">
                <div className="bg-ink-900 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Mandate</div>
                  <div className="mt-1.5 text-[12.5px] text-white/80">{SEAT_MANDATE}</div>
                  <div className="mt-2 text-[11px] text-white/50">Ranked #{SEAT.rank} of {PORTAL_STATS.competingMatches} mandates matched to the live listing.</div>
                </div>
                <div className="bg-ink-900 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Pipeline by stage</div>
                  <div className="mt-2 space-y-1.5">
                    {(["sourcing", "engaged", "diligence", "loi"] as const).map((s) => (
                      <div key={s} className="flex items-center justify-between"><StageBadge stage={s} /><span className="font-mono text-[12px] text-white/80">{PORTAL_OPPORTUNITIES.filter((o) => o.stage === s).length}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(tab === "opportunities" || tab === "watchlist") && (
              <div className="grid gap-px overflow-hidden rounded-md bg-white/10 sm:grid-cols-2">
                {(tab === "watchlist" ? PORTAL_OPPORTUNITIES.filter((o) => watch.includes(o.code)) : PORTAL_OPPORTUNITIES).map((o) => (
                  <div key={o.code} className="bg-ink-900 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[13px] font-bold text-white">{o.code}</div>
                      <span className="font-mono text-[12px] font-bold text-deal-300">{o.fit}% fit</span>
                    </div>
                    <div className="text-[10px] text-white/45">{o.sector} · {o.region} · readiness {o.readiness}/100</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-white/10 pt-2 text-[11px]">
                      <div><div className="text-white/40">Revenue</div><div className="font-mono text-white/85">{o.revenue != null ? fmtMoney(o.revenue) : "NDA-gated"}</div></div>
                      <div><div className="text-white/40">Ask</div><div className="font-mono text-white/85">{fmtMoney(o.ask)}</div></div>
                      <div><div className="text-white/40">Stage</div><div className="mt-0.5"><StageBadge stage={o.stage} /></div></div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" className="!px-2 !py-1 !text-[11px]" onClick={() => toggle(o.code)}>{watch.includes(o.code) ? "★ Watching" : "☆ Watch"}</Button>
                      <Button className="!px-2 !py-1 !text-[11px]">{o.hasDataRoom ? "Open data room" : "Request access"}</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "diligence" && (
              <div className="divide-y divide-white/5">
                {PORTAL_OPPORTUNITIES.map((o) => (
                  <div key={o.code} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-mono text-[13px] font-bold text-white">{o.code}</div>
                      <div className="text-[10px] text-white/45">{o.sector} · {o.hasDataRoom ? `data room granted · ${PORTAL_STATS.diligencePackages} packages` : "identity and packages unlock on NDA"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {o.hasDataRoom
                        ? <><span className="flex items-center gap-1.5 text-[10px] font-semibold text-deal-300"><span className="h-1.5 w-1.5 rounded-full bg-deal-400" /> Active</span><Button variant="ghost" className="!px-2 !py-1 !text-[11px]">Open</Button></>
                        : <Button className="!px-2 !py-1 !text-[11px]">Request NDA</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "negotiations" && (
              <div className="divide-y divide-white/5">
                {PORTAL_NEGOTIATIONS.length === 0 && <div className="py-6 text-center text-[12px] text-white/55">No offers in motion. Submit an offer from an opportunity to open a negotiation.</div>}
                {PORTAL_NEGOTIATIONS.map((n) => (
                  <div key={n.code} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-mono text-[13px] font-bold text-white">{n.code}</div>
                      <div className="text-[10px] text-white/45">Offer {fmtMoney(n.offer)} · {n.premiumPct >= 0 ? "+" : ""}{n.premiumPct}% vs strategic mid</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StageBadge stage={n.stage} />
                      <span className="text-[11px] text-white/70">{n.status}</span>
                      <Button className="!px-2 !py-1 !text-[11px]">Respond</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </Frame>
    </div>
  );
};

export default BuyerPortal;
