import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader } from "../lib/ui";
import {
  CAPTABLE_ANALYSIS, CAPTABLE_SIGNATORY, CAPTABLE_DRAGALONG,
  SAMPLE_CAPTABLE, OFFER_WATERFALLS, SAMPLE_OFFERS, fmt,
} from "../lib/engines";

const ROLE_STYLE: Record<string, string> = {
  founder:        "text-deal-300",
  lead_investor:  "text-loi-300",
  investor:       "text-stage-engaged",
  board_director: "text-stage-engaged",
  board_observer: "text-white/55",
  executive:      "text-white/70",
  advisor:        "text-white/55",
  employee:       "text-white/55",
  other:          "text-white/40",
};

const ROLE_LABEL: Record<string, string> = {
  founder: "Founder", lead_investor: "Lead", investor: "Investor",
  board_director: "Board", board_observer: "Observer",
  executive: "Executive", advisor: "Advisor", employee: "Employee", other: "Other",
};

const Investors: React.FC = () => {
  const analysis = CAPTABLE_ANALYSIS;
  const signatory = CAPTABLE_SIGNATORY;
  const drag = CAPTABLE_DRAGALONG;

  const [selectedOfferId, setSelectedOfferId] = useState<string>(SAMPLE_OFFERS[0].offerId);
  const selectedWf = useMemo(
    () => OFFER_WATERFALLS.find((w) => w.offerId === selectedOfferId) ?? OFFER_WATERFALLS[0],
    [selectedOfferId],
  );
  const selectedOffer = SAMPLE_OFFERS.find((o) => o.offerId === selectedOfferId)!;

  return (
    <div>
      <SectionHeader
        kicker="Module 04 · Workspace"
        title="Investor CRM · Cap-table"
        description="Cap-table-aware relationship graph. Board, leads, observers, signatories, drag-along holdouts and per-offer founder waterfall — all in one stack."
        actions={<Button>Add stakeholder</Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label="Fully diluted"
          value={analysis.fullyDilutedShares.toLocaleString()}
          sub={`${analysis.ownershipByStakeholder.length} stakeholders`}
        />
        <Kpi
          label="Founder ownership"
          value={`${(analysis.ownershipByRole.founder * 100).toFixed(1)}%`}
          sub="of fully-diluted"
          accent={analysis.ownershipByRole.founder >= 0.30 ? "#34d399" : "#fbbf24"}
        />
        <Kpi
          label="Signatory coverage"
          value={`${Math.round(signatory.coverageOfShares * 100)}%`}
          sub={signatory.meetsThreshold ? "meets 95% threshold" : "below 95% threshold"}
          accent={signatory.meetsThreshold ? "#34d399" : "#fbbf24"}
        />
        <Kpi
          label="Drag-along"
          value={drag.meets ? "Met" : "Short"}
          sub={`${Math.round(drag.committedPct * 100)}% committed · ${drag.holdouts.length} holdouts`}
          accent={drag.meets ? "#34d399" : "#fbbf24"}
        />
      </div>

      {analysis.warnings.length > 0 && (
        <div className="mt-8 rounded-md border border-loi-500/30 bg-loi-500/5 p-4 text-sm text-loi-200">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-loi-300">Cap-table warnings</div>
          <ul className="mt-2 space-y-1">
            {analysis.warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Stakeholder</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Shares (FD)</th>
                <th className="px-5 py-3 text-right">Ownership</th>
                <th className="px-5 py-3">Signatory</th>
                <th className="px-5 py-3">Seat</th>
              </tr>
            </thead>
            <tbody>
              {analysis.ownershipByStakeholder.map((row) => {
                const sh = SAMPLE_CAPTABLE.stakeholders.find((s) => s.id === row.stakeholderId)!;
                return (
                  <tr key={row.stakeholderId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-white">{row.name}</td>
                    <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${ROLE_STYLE[row.role] ?? "text-white/55"}`}>
                      {ROLE_LABEL[row.role] ?? row.role}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/75">{row.fullyDilutedShares.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{(row.fullyDilutedPct * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3.5 text-xs">
                      {sh.signatoryRequired
                        ? <span className="text-deal-300">Required</span>
                        : <span className="text-white/40">Info-only</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/55">{sh.seatOnBoard ? "Board" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Liquidation waterfall</div>
              <div className="text-lg font-semibold text-white">Per-offer founder net</div>
            </div>
            <select
              value={selectedOfferId}
              onChange={(e) => setSelectedOfferId(e.target.value)}
              className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/85 focus:border-deal-400 focus:outline-none"
            >
              {SAMPLE_OFFERS.map((o) => (
                <option key={o.offerId} value={o.offerId}>{o.buyerName} · {fmt(o.headlinePriceUsd)}</option>
              ))}
            </select>
          </div>

          {/* What the founder actually walks away with — the question founders
              really ask. Cascade from headline → founder gross → after
              preferences (NPV) → after tax. Tax is an illustrative blended
              long-term capital-gains estimate; the engine has no tax model. */}
          {(() => {
            const TAX = 0.238; // blended LTCG + NIIT estimate
            const founderGross = selectedWf.waterfall.distributions.filter((d) => d.role === "founder").reduce((s, d) => s + d.grossProceedsUsd, 0);
            const afterPref = selectedWf.waterfall.netToFoundersUsd; // NPV after preference stack
            const afterTax = afterPref * (1 - TAX);
            const steps = [
              { label: "Offer headline", value: selectedOffer.headlinePriceUsd, color: "text-white", note: selectedOffer.buyerName },
              { label: "Your gross proceeds", value: founderGross, color: "text-white/85", note: `${(analysis.ownershipByRole.founder * 100).toFixed(1)}% founder stake` },
              { label: "After preferences", value: afterPref, color: "text-loi-300", note: `pref stack ${fmt(selectedWf.waterfall.preferenceTotalUsd)}` },
              { label: "After taxes", value: afterTax, color: "text-deal-300", note: `~${(TAX * 100).toFixed(1)}% est. capital gains` },
            ];
            return (
              <div className="mt-5 rounded-lg border border-deal-500/20 bg-deal-600/5 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">What you walk away with</div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {steps.map((s, i) => (
                    <div key={s.label} className="relative">
                      {i > 0 && <span className="absolute -left-2 top-3 hidden text-white/20 sm:block">→</span>}
                      <div className="text-[10px] uppercase tracking-wide text-white/40">{s.label}</div>
                      <div className={`mt-1 font-mono text-xl font-bold ${s.color}`}>{fmt(s.value)}</div>
                      <div className="mt-0.5 text-[10px] text-white/40">{s.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Headline</div>
              <div className="mt-1 font-mono text-white">{fmt(selectedOffer.headlinePriceUsd)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Preference stack</div>
              <div className="mt-1 font-mono text-white/85">{fmt(selectedWf.waterfall.preferenceTotalUsd)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Common pool</div>
              <div className="mt-1 font-mono text-white/85">{fmt(selectedWf.waterfall.commonPoolUsd)}</div>
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-2 py-2">Stakeholder</th>
                <th className="px-2 py-2 text-right">Preference</th>
                <th className="px-2 py-2 text-right">Common</th>
                <th className="px-2 py-2 text-right">Gross</th>
                <th className="px-2 py-2 text-right">NPV</th>
              </tr>
            </thead>
            <tbody>
              {selectedWf.waterfall.distributions.slice(0, 8).map((d) => (
                <tr key={d.stakeholderId} className="border-b border-white/5 last:border-0">
                  <td className="px-2 py-2 text-white/85">{d.name}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-white/75">{fmt(d.preferenceUsd)}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-white/75">{fmt(d.commonProceedsUsd)}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-white/85">{fmt(d.grossProceedsUsd)}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-deal-300">{fmt(d.netPresentValueUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedWf.waterfall.notes.length > 0 && (
            <div className="mt-3 text-xs text-loi-300">{selectedWf.waterfall.notes.join(" · ")}</div>
          )}
        </Card>

        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Signatory roster</div>
          <div className="mt-1 text-lg font-semibold text-white">{signatory.required.length} required · {signatory.recommended.length} recommended</div>
          <div className="mt-4 space-y-2 text-sm">
            {signatory.required.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-white/85">{s.name}</span>
                <span className="text-[11px] uppercase tracking-wide text-deal-300">Required</span>
              </div>
            ))}
            <div className="my-3 border-t border-white/5"></div>
            {signatory.recommended.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-white/55">{s.name}</span>
                <span className="text-[11px] uppercase tracking-wide text-white/35">Info-only</span>
              </div>
            ))}
          </div>

          {drag.holdouts.length > 0 && (
            <div className="mt-6 rounded-md border border-white/10 bg-white/[0.02] p-3 text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Drag-along holdouts</div>
              <div className="mt-2 text-white/65">
                {drag.holdouts.map((h) => h.name).join(", ")}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Investors;
