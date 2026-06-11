import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader, StageBadge, fmtMoney } from "../lib/ui";

// Buyer Portal — the acquirer's side of the exchange. Founders run a sale;
// buyers run a buy. This surface gives an acquirer their own dashboard:
// watchlist, live opportunities (anonymized until NDA), diligence access and
// active negotiations. Illustrative data — wires to the listing/marketplace
// engines once buyer auth is in place.

type Tab = "dashboard" | "watchlist" | "opportunities" | "diligence" | "negotiations";

const OPPS = [
  { code: "Project Cipher", sector: "Logistics / Freight", revenue: 62_000_000, ask: 132_000_000, fit: 94, region: "North America", stage: "engaged" as const },
  { code: "Project Atlas", sector: "Healthcare SaaS", revenue: 41_000_000, ask: 220_000_000, fit: 88, region: "Europe", stage: "diligence" as const },
  { code: "Project Vega", sector: "Cybersecurity", revenue: 33_000_000, ask: 340_000_000, fit: 81, region: "Global", stage: "sourcing" as const },
  { code: "Project Nova", sector: "AI Automation", revenue: 27_000_000, ask: 195_000_000, fit: 90, region: "Asia-Pacific", stage: "loi" as const },
];
const NEGOTIATIONS = [
  { code: "Project Cipher", offer: 132_000_000, status: "Counter received", premium: "+24%", stage: "engaged" as const },
  { code: "Project Nova", offer: 195_000_000, status: "LOI drafted", premium: "+18%", stage: "loi" as const },
];

const BuyerPortal: React.FC = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [watch, setWatch] = useState<string[]>(["Project Cipher", "Project Nova"]);
  const toggle = (c: string) => setWatch((w) => (w.includes(c) ? w.filter((x) => x !== c) : [...w, c]));

  return (
    <div>
      <SectionHeader
        kicker="Buyer Console"
        title="Buyer Portal"
        description="The acquirer's side of the exchange — watchlists, live opportunities, diligence access and active negotiations. Founders run a sale; buyers run a buy, on the same infrastructure."
        actions={<Button>Set acquisition mandate</Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Matched opportunities" value={String(OPPS.length)} sub="fit your mandate" accent="#34d399" />
        <Kpi label="Watchlist" value={String(watch.length)} sub="tracked targets" />
        <Kpi label="In diligence" value={String(OPPS.filter((o) => o.stage === "diligence").length)} sub="data-room access" />
        <Kpi label="Active negotiations" value={String(NEGOTIATIONS.length)} sub="offers in motion" accent="#fbbf24" />
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
              <div className="mt-2 text-sm text-white/80">Enterprise software & logistics · check $50M–$2B · North America + Europe</div>
              <div className="mt-3 text-[12px] text-white/50">12 new targets indexed this week matching your mandate.</div>
            </Card>
            <Card className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Pipeline by stage</div>
              <div className="mt-3 space-y-2">
                {(["sourcing","engaged","diligence","loi"] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <StageBadge stage={s} />
                    <span className="font-mono text-sm text-white/80">{OPPS.filter((o) => o.stage === s).length}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {(tab === "opportunities" || tab === "watchlist") && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(tab === "watchlist" ? OPPS.filter((o) => watch.includes(o.code)) : OPPS).map((o) => (
              <Card key={o.code} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">{o.code}</div>
                  <span className="font-mono text-[13px] font-bold text-deal-300">{o.fit}% fit</span>
                </div>
                <div className="text-[11px] text-white/45">{o.sector} · {o.region}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[12px]">
                  <div><div className="text-white/40">Revenue</div><div className="font-mono text-white/85">{fmtMoney(o.revenue)}</div></div>
                  <div><div className="text-white/40">Ask</div><div className="font-mono text-white/85">{fmtMoney(o.ask)}</div></div>
                  <div><div className="text-white/40">Stage</div><div className="mt-0.5"><StageBadge stage={o.stage} /></div></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" className="text-[12px]" onClick={() => toggle(o.code)}>{watch.includes(o.code) ? "★ Watching" : "☆ Watch"}</Button>
                  <Button className="text-[12px]">Request access</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "diligence" && (
          <div className="space-y-2">
            {OPPS.filter((o) => o.stage === "diligence" || o.stage === "loi").map((o) => (
              <Card key={o.code} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">{o.code}</div>
                  <div className="text-[11px] text-white/45">{o.sector} · data room granted</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-deal-300"><span className="h-1.5 w-1.5 rounded-full bg-deal-400" /> Access active</span>
                  <Button variant="ghost" className="text-[12px]">Open data room</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "negotiations" && (
          <div className="space-y-2">
            {NEGOTIATIONS.map((n) => (
              <Card key={n.code} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-white">{n.code}</div>
                  <div className="text-[11px] text-white/45">Offer {fmtMoney(n.offer)} · {n.premium} premium</div>
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
