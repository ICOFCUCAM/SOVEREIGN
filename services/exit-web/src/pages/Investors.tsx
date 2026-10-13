import React, { useMemo, useState } from "react";
import { DemoExample } from "../components/DemoExample";
import { Button, Modal, Field, inputCls, notify } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { SAMPLE_COMPANY } from "../lib/profile";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketTape } from "../lib/market-tape";
import { plural } from "../lib/labels";
import {
  CAPTABLE_ANALYSIS, CAPTABLE_SIGNATORY, CAPTABLE_DRAGALONG,
  SAMPLE_CAPTABLE, OFFER_WATERFALLS, SAMPLE_OFFERS, fmt,
} from "../lib/engines";

const ROLE_STYLE: Record<string, string> = {
  founder:        "text-xo-verified",
  lead_investor:  "text-xo-caution",
  investor:       "text-xo-action",
  board_director: "text-xo-action",
  board_observer: "text-xo-muted",
  executive:      "text-xo-muted",
  advisor:        "text-xo-muted",
  employee:       "text-xo-muted",
  other:          "text-xo-faint",
};

const ROLE_LABEL: Record<string, string> = {
  founder: "Founder", lead_investor: "Lead", investor: "Investor",
  board_director: "Board", board_observer: "Observer",
  executive: "Executive", advisor: "Advisor", employee: "Employee", other: "Other",
};

const InvestorsDemo: React.FC = () => {
  // The cap table and offers are the demo company's samples; an intake holds
  // neither, so this page stays on demo data and says so.
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);
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
    notify(`Added ${name} to this session's contact list (not saved)`);
  };

  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="cap-table" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Workspace · Cap-table · Investor CRM · Demo company: ${SAMPLE_COMPANY.name}`} title="Cap Table"
        badge={<><Provenance kind="demo" /><span className="text-[12px] text-xo-muted">Ownership · waterfall · {signatory.meetsThreshold ? "Coverage met" : "Coverage short"}</span></>}
        description={<>The sample cap table and sample offers of the demo company ({SAMPLE_COMPANY.name}).{fromIntake ? " Your intake has no cap table or offers, so these figures are not yours." : ""}</>} />

      <section aria-label="Cap-table summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-5">
        <div className="bg-xo-panel"><Metric label="Fully diluted" value={analysis.fullyDilutedShares.toLocaleString()} sub={plural(analysis.ownershipByStakeholder.length, "stakeholder")} /></div>
        <div className="bg-xo-panel"><Metric label="Founder ownership" value={`${(analysis.ownershipByRole.founder * 100).toFixed(1)}%`} sub="of fully-diluted" /></div>
        <div className="bg-xo-panel"><Metric label="Signatory coverage" value={<span className={signatory.meetsThreshold ? "text-xo-verified" : "text-xo-caution"}>{Math.round(signatory.coverageOfShares * 100)}%</span>} sub={signatory.meetsThreshold ? "meets 95%" : "below 95%"} /></div>
        <div className="bg-xo-panel"><Metric label="Drag-along" value={drag.meets ? "Met" : "Short"} sub={`${Math.round(drag.committedPct * 100)}% · ${plural(drag.holdouts.length, "holdout")}`} /></div>
        <div className="bg-xo-panel"><Metric label="Founders' risk-adjusted value" emphasis value={<span className="text-xo-verified">{fmt(selectedWf.waterfall.netToFoundersUsd)}</span>} sub={`${selectedOffer.buyerName} · engine NPV (stock −15%, earnout −45%)`} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add stakeholder" subtitle="Adds a contact to this session's list. It is not saved and does not change the cap table, signatories or waterfall." size="md"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={submitAdd}>Add to list</Button></>}>
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
        <Section title={`Contacts added this session · ${added.length}`} className="border border-xo-line" foot="Kept only until you leave or reload this page; not part of the cap table or any calculation.">
          <ul className="divide-y divide-xo-line">
            {added.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px]">
                <span className="font-medium">{s.name}</span>
                <span className={`text-[12px] font-semibold ${ROLE_STYLE[s.role] ?? "text-xo-muted"}`}>{ROLE_LABEL[s.role] ?? s.role}{s.email ? ` · ${s.email}` : ""}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmt(selectedWf.waterfall.netToFoundersUsd)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{signatory.meetsThreshold
            ? <>Keep signatory coverage locked and pre-clear the drag-along before signing.</>
            : <>Secure the <span className="font-semibold">{drag.holdouts.length} drag-along holdout{drag.holdouts.length === 1 ? "" : "s"}</span> to clear the {Math.round(signatory.coverageOfShares * 100)}% threshold.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmt(selectedWf.waterfall.netToFoundersUsd)}</span> risk-adjusted value to the founder group on the {selectedOffer.buyerName} offer (after the preference stack, stock and earnout discounted).</TakeCell>
            <TakeCell k="If you wait">Holdouts and missing signatures can block or delay the close after terms are agreed.</TakeCell>
            <TakeCell k="Who">{drag.holdouts.length > 0 ? <>Chase the holdouts: <span className="text-xo-text">{drag.holdouts.map((h) => h.name).join(", ")}</span>.</> : <>Coverage met — every required signatory is aligned.</>}</TakeCell>
            <TakeCell k="ExitOS does it">ExitOS runs the waterfall per offer, tracks signatory coverage and flags drag-along gaps automatically.</TakeCell>
          </dl>
        </div>
      </Section>

      {analysis.warnings.length > 0 && (
        <section aria-labelledby="ct-warn" className="border border-xo-caution/50 bg-xo-panel px-4 py-3 text-[12px]">
          <h2 id="ct-warn" className="text-[12px] font-semibold text-xo-caution">Cap-table warnings</h2>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xo-muted">
            {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>
      )}

      <Section title="Cap table · fully-diluted ownership" className="border border-xo-line"
        right={<button type="button" onClick={() => setAddOpen(true)} className="rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-semibold text-xo-action hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">+ Stakeholder</button>}>
        <ScrollRegion label="Cap table">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead className="text-left text-[11px] text-xo-faint">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-3 py-2 font-medium">Stakeholder</th>
                <th scope="col" className="px-2 py-2 font-medium">Role</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Shares (FD)</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Ownership</th>
                <th scope="col" className="px-2 py-2 font-medium">Signatory</th>
                <th scope="col" className="px-3 py-2 font-medium">Seat</th>
              </tr>
            </thead>
            <tbody>
              {analysis.ownershipByStakeholder.map((row) => {
                const sh = SAMPLE_CAPTABLE.stakeholders.find((s) => s.id === row.stakeholderId)!;
                return (
                  <tr key={row.stakeholderId} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-3 py-1.5 text-left font-medium">{row.name}</th>
                    <td className={`px-2 py-1.5 text-[12px] font-semibold ${ROLE_STYLE[row.role] ?? "text-xo-muted"}`}>{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{row.fullyDilutedShares.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{(row.fullyDilutedPct * 100).toFixed(2)}%</td>
                    <td className="px-2 py-1.5 text-[12px]">{sh.signatoryRequired ? <span className="text-xo-verified">Required</span> : <span className="text-xo-faint">Info-only</span>}</td>
                    <td className="px-3 py-1.5 text-[12px] text-xo-muted">{sh.seatOnBoard ? "Board" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Liquidation waterfall · per-offer founder net" className="lg:col-span-8"
          right={<><label htmlFor="ct-offer" className="sr-only">Offer</label><select id="ct-offer" value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)} className="rounded-sm border border-xo-line bg-xo-ink px-2 py-1 text-[12px] text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
            {SAMPLE_OFFERS.map((o) => <option key={o.offerId} value={o.offerId}>{o.buyerName} · {fmt(o.headlinePriceUsd)}</option>)}
          </select></>}
          foot={selectedWf.waterfall.notes.length > 0 ? selectedWf.waterfall.notes.join(" · ") : undefined}>
          <div className="px-4 py-3">
            {(() => {
              // Same reading as Liquidity & Transition: nominal amounts for the
              // founder group; the engine's risk-adjusted value shown apart.
              const TAX = 0.238; // flat assumption: US federal LTCG 20% + NIIT 3.8%
              const founders = selectedWf.waterfall.distributions.filter((d) => d.role === "founder");
              const founderGross = founders.reduce((s, d) => s + d.grossProceedsUsd, 0);
              const afterTax = founderGross * (1 - TAX);
              const steps = [
                { label: "Offer headline", value: selectedOffer.headlinePriceUsd, note: selectedOffer.buyerName },
                { label: "Preference stack", value: selectedWf.waterfall.preferenceTotalUsd, note: "paid to preferred holders first" },
                { label: "Founders' gross", value: founderGross, note: `${founders.length} founder holders · ${(analysis.ownershipByRole.founder * 100).toFixed(1)}% founder stake` },
                { label: "After taxes", value: afterTax, note: `flat ${(TAX * 100).toFixed(1)}% tax assumption` },
              ];
              return (
                <div className="border border-xo-line">
                  <h3 className="border-b border-xo-line px-3 py-2 text-[12px] font-semibold text-xo-muted">What you walk away with</h3>
                  <ol className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
                    {steps.map((s, i) => (
                      <li key={s.label} className="bg-xo-panel px-3 py-2">
                        <div className="text-[11px] text-xo-faint"><span aria-hidden>{i > 0 ? "→ " : ""}</span>{s.label}</div>
                        <div className={`mt-1 font-mono text-[18px] font-semibold tabular-nums ${i === steps.length - 1 ? "text-xo-verified" : ""}`}>{fmt(s.value)}</div>
                        <div className="mt-0.5 text-[11px] text-xo-faint">{s.note}</div>
                      </li>
                    ))}
                  </ol>
                  <p className="border-t border-xo-line px-3 py-2 text-[12px] text-xo-muted">Risk-adjusted value (engine): <span className="font-mono font-semibold text-xo-text">{fmt(selectedWf.waterfall.netToFoundersUsd)}</span> before tax — stock discounted 15% and earnout 45%. The steps above assume every tranche pays in full. Tax: a flat {(TAX * 100).toFixed(1)}% (US federal long-term capital gains + NIIT) on the whole amount — no cost basis, state tax or QSBS; ExitOS has no tax model.</p>
                </div>
              );
            })()}

            <dl className="mt-4 grid grid-cols-3 gap-4 text-[13px]">
              <div><dt className="text-[11px] text-xo-faint">Headline</dt><dd className="mt-1 font-mono">{fmt(selectedOffer.headlinePriceUsd)}</dd></div>
              <div><dt className="text-[11px] text-xo-faint">Preference stack</dt><dd className="mt-1 font-mono">{fmt(selectedWf.waterfall.preferenceTotalUsd)}</dd></div>
              <div><dt className="text-[11px] text-xo-faint">Common pool</dt><dd className="mt-1 font-mono">{fmt(selectedWf.waterfall.commonPoolUsd)}</dd></div>
            </dl>

            <ScrollRegion label="Waterfall by stakeholder" className="mt-4">
              <table className="w-full min-w-[520px] text-[12px]">
                <thead className="text-left text-[11px] text-xo-faint">
                  <tr className="border-b border-xo-line">
                    <th scope="col" className="px-2 py-2 font-medium">Stakeholder</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Preference</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Common</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Gross</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">NPV</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWf.waterfall.distributions.slice(0, 8).map((d) => (
                    <tr key={d.stakeholderId} className="border-b border-xo-line last:border-0">
                      <th scope="row" className="px-2 py-2 text-left font-normal">{d.name}</th>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{fmt(d.preferenceUsd)}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{fmt(d.commonProceedsUsd)}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt(d.grossProceedsUsd)}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-verified">{fmt(d.netPresentValueUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          </div>
        </Section>

        <Section title="Signatory roster" className="lg:col-span-4"
          right={<span className="font-mono text-[11px] text-xo-faint">{signatory.required.length} req · {signatory.recommended.length} rec</span>}>
          <div className="px-4 py-3 text-[12px]">
            <ul className="space-y-1">
              {signatory.required.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2"><span>{s.name}</span><span className="text-[11px] text-xo-verified">Required</span></li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 border-t border-xo-line pt-2">
              {signatory.recommended.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2"><span className="text-xo-muted">{s.name}</span><span className="text-[11px] text-xo-faint">Info-only</span></li>
              ))}
            </ul>
            {drag.holdouts.length > 0 && (
              <div className="mt-3 border border-xo-line px-2.5 py-2 text-[12px]">
                <h3 className="text-[11px] font-semibold text-xo-faint">Drag-along holdouts</h3>
                <p className="mt-1 text-xo-muted">{drag.holdouts.map((h) => h.name).join(", ")}</p>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

// With a saved intake the founder's own records are shown (none yet), and the
// demo company's example only on request.
const Investors: React.FC = () => {
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);
  return (
    <DemoExample fromIntake={fromIntake} page={{ id: "cap-table", eyebrow: "◉ Founder · Cap table", title: "Cap Table" }}
      title="No cap table recorded for your company" demo={<InvestorsDemo />}>
      <>ExitOS does not yet hold your cap table, so it cannot show stakeholders, signatories or a waterfall for your company. Entering and importing a cap table is part of the closing workflow.</>
    </DemoExample>
  );
};

export default Investors;
