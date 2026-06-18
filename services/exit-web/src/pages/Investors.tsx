import React, { useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, notify } from "../lib/ui";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import {
  CAPTABLE_ANALYSIS, CAPTABLE_SIGNATORY, CAPTABLE_DRAGALONG,
  SAMPLE_CAPTABLE, OFFER_WATERFALLS, SAMPLE_OFFERS, fmt,
} from "../lib/engines";
import BankerTake from "../components/BankerTake";

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

  const [addOpen, setAddOpen] = useState(false);
  const [added, setAdded] = useState<{ name: string; role: string; email: string }[]>([]);
  const [draft, setDraft] = useState({ name: "", role: "investor", email: "" });
  const submitAdd = (): void => {
    const name = draft.name.trim();
    if (!name) { notify("Enter a name"); return; }
    setAdded((prev) => [{ name, role: draft.role, email: draft.email.trim() }, ...prev]);
    setDraft({ name: "", role: "investor", email: "" });
    setAddOpen(false);
    notify(`Added ${name} to the cap-table CRM`);
  };


  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Workspace · Cap-table"
        title="Investor CRM"
        tag="Ownership · waterfall"
        status={signatory.meetsThreshold ? "Coverage met" : "Coverage short"}
        metrics={[
          { k: "Fully diluted", v: analysis.fullyDilutedShares.toLocaleString(), sub: `${analysis.ownershipByStakeholder.length} stakeholders` },
          { k: "Founder ownership", v: `${(analysis.ownershipByRole.founder * 100).toFixed(1)}%`, accent: analysis.ownershipByRole.founder >= 0.3, sub: "of fully-diluted" },
          { k: "Signatory coverage", v: `${Math.round(signatory.coverageOfShares * 100)}%`, accent: signatory.meetsThreshold, sub: signatory.meetsThreshold ? "meets 95%" : "below 95%" },
          { k: "Drag-along", v: drag.meets ? "Met" : "Short", sub: `${Math.round(drag.committedPct * 100)}% · ${drag.holdouts.length} holdouts` },
          { k: "Net to founders", v: fmt(selectedWf.waterfall.netToFoundersUsd), accent: true, sub: selectedOffer.buyerName },
        ]}
      />


      {/* ── Add stakeholder ───────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add stakeholder" subtitle="Adds a contact to the cap-table CRM roster" size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={submitAdd}>Add to CRM</Button></>}>
        <div className="space-y-4">
          <Field label="Name"><input className={inputCls} placeholder="e.g. Dana Reyes" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /></Field>
          <Field label="Role">
            <select className={inputCls} value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Email" hint="Optional"><input className={inputCls} placeholder="dana@fund.example" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} /></Field>
        </div>
      </Modal>

      {added.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-ink-900 p-3">
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Added to CRM · {added.length}</div>
          <div className="mt-2 space-y-1.5">
            {added.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-white/10 bg-ink-800/40 px-3 py-1.5 text-[12px]">
                <span className="font-medium text-white">{s.name}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${ROLE_STYLE[s.role] ?? "text-white/50"}`}>{ROLE_LABEL[s.role] ?? s.role}{s.email ? ` · ${s.email}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BankerTake
        next={signatory.meetsThreshold
          ? <>Keep signatory coverage locked and pre-clear the drag-along before signing.</>
          : <>Secure the <span className="text-white">{drag.holdouts.length} drag-along holdout{drag.holdouts.length === 1 ? "" : "s"}</span> to clear the {Math.round(signatory.coverageOfShares * 100)}% threshold.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmt(selectedWf.waterfall.netToFoundersUsd)}</span> net to founders on the {selectedOffer.buyerName} offer (after the preference stack).</>}
        inaction={<>Holdouts and missing signatures can block or delay the close after terms are agreed.</>}
        buyer={drag.holdouts.length > 0
          ? <>Chase the holdouts: <span className="text-white">{drag.holdouts.map((h) => h.name).join(", ")}</span>.</>
          : <>Coverage met — every required signatory is aligned.</>}
        automate={<>ExitOS runs the waterfall per offer, tracks signatory coverage and flags drag-along gaps automatically.</>}
        impact={<>{fmt(selectedWf.waterfall.netToFoundersUsd)}</>}
      />

      {analysis.warnings.length > 0 && (
        <div className="rounded-lg border border-loi-500/30 bg-loi-500/5 p-3 text-[12px] text-loi-200">
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-loi-300">Cap-table warnings</div>
          <ul className="mt-1.5 space-y-0.5">
            {analysis.warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </div>
      )}

      <Frame>
        <Panel title="Cap table · fully-diluted ownership" className="lg:col-span-12"
          right={<button onClick={() => setAddOpen(true)} className="rounded bg-deal-600/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white ring-1 ring-deal-400/40 hover:bg-deal-500">+ Stakeholder</button>}>
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Stakeholder</th>
                <th className="px-2 py-1.5">Role</th>
                <th className="px-2 py-1.5 text-right">Shares (FD)</th>
                <th className="px-2 py-1.5 text-right">Ownership</th>
                <th className="px-2 py-1.5">Signatory</th>
                <th className="px-3 py-1.5">Seat</th>
              </tr>
            </thead>
            <tbody>
              {analysis.ownershipByStakeholder.map((row) => {
                const sh = SAMPLE_CAPTABLE.stakeholders.find((s) => s.id === row.stakeholderId)!;
                return (
                  <tr key={row.stakeholderId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium text-white">{row.name}</td>
                    <td className={`px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${ROLE_STYLE[row.role] ?? "text-white/55"}`}>{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/75">{row.fullyDilutedShares.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/85">{(row.fullyDilutedPct * 100).toFixed(2)}%</td>
                    <td className="px-2 py-1.5 text-[11px]">{sh.signatoryRequired ? <span className="text-deal-300">Required</span> : <span className="text-white/40">Info-only</span>}</td>
                    <td className="px-3 py-1.5 text-[11px] text-white/55">{sh.seatOnBoard ? "Board" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </Frame>

      <Frame>
        <Panel title="Liquidation waterfall · per-offer founder net" className="lg:col-span-8"
          right={
            <select value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)}
              className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-white/85 focus:border-deal-400 focus:outline-none">
              {SAMPLE_OFFERS.map((o) => <option key={o.offerId} value={o.offerId}>{o.buyerName} · {fmt(o.headlinePriceUsd)}</option>)}
            </select>
          }
          foot={selectedWf.waterfall.notes.length > 0 ? selectedWf.waterfall.notes.join(" · ") : undefined}>
          <div className="p-3">
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

          </div>
        </Panel>

        <Panel title="Signatory roster" className="lg:col-span-4"
          right={<span className="font-mono text-[9px] text-white/35">{signatory.required.length} req · {signatory.recommended.length} rec</span>}>
          <div className="p-3 text-[12px]">
            <div className="space-y-1">
              {signatory.required.map((s) => (
                <div key={s.id} className="flex items-center justify-between"><span className="text-white/85">{s.name}</span><span className="text-[10px] uppercase tracking-wide text-deal-300">Required</span></div>
              ))}
              <div className="my-2 border-t border-white/5" />
              {signatory.recommended.map((s) => (
                <div key={s.id} className="flex items-center justify-between"><span className="text-white/55">{s.name}</span><span className="text-[10px] uppercase tracking-wide text-white/35">Info-only</span></div>
              ))}
            </div>
            {drag.holdouts.length > 0 && (
              <div className="mt-3 rounded border border-white/10 bg-white/[0.02] p-2.5 text-[11px]">
                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Drag-along holdouts</div>
                <div className="mt-1 text-white/65">{drag.holdouts.map((h) => h.name).join(", ")}</div>
              </div>
            )}
          </div>
        </Panel>
      </Frame>
    </div>
  );
};

export default Investors;
