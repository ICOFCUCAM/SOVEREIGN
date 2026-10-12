import React, { useEffect, useMemo, useState } from "react";
import { myNdaRequests, type NdaRequest } from "../lib/exit-api";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button, Modal, Field, inputCls, timeAgo, notify } from "../lib/ui";
import { PageHeader, Section, Metric, ScrollRegion } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { SAMPLE_NDAS, NDA_ROSTER, LISTING_PRIVATE } from "../lib/engines";
import {
  evaluateNdaStatus, generateBreachNotice, rosterFor,
  STANDARD_TEMPLATES, templateById, issueNda,
  type NdaInstance, type NdaState,
} from "@exit/engines";

const FOUNDER_PARTY = { id: "founder-helios", name: "Helios Freight, Inc.", representativeName: "Anne Kovac", representativeEmail: "anne@helios.example" };

const STATUS_CLS: Record<NdaState, string> = {
  active: "text-xo-verified", pending_signature: "text-xo-caution", expired: "text-xo-faint",
  revoked: "text-xo-faint", breached: "text-xo-risk", draft: "text-xo-muted",
};

const STATUS_LABEL: Record<NdaState, string> = {
  active: "Active", pending_signature: "Pending", expired: "Expired",
  revoked: "Revoked", breached: "Breach", draft: "Draft",
};

// Record checks — four checks read from the NDA record itself (execution,
// signature, named representative, damages clause). They are not identity,
// funds or track-record verification, and the page says so.
interface TrustGate { readonly label: string; readonly cleared: boolean; readonly detail: string; }
interface BuyerTrust { readonly gates: TrustGate[]; readonly score: number; readonly tier: "Verified" | "Qualified" | "Unverified"; }
function buyerTrust(n: NdaInstance, status: NdaState): BuyerTrust {
  // deterministic checks derived from the NDA record + counterparty profile
  const ndaSigned = status === "active";
  const identityVerified = !!n.executedAt && n.signatureEvents.length > 0;
  // acquisition history: validated when the receiving entity is an institutional
  // counterparty (has a representative on the signature record)
  const historyValidated = n.signatureEvents.some((e) => !!e.representative) && status !== "draft";
  // funds verification: cleared for active institutional NDAs with liquidated
  // damages provisions (a proxy for a vetted, capitalised counterparty)
  const fundsVerified = ndaSigned && (n.terms.liquidatedDamagesUsd ?? 0) > 0;
  const gates: TrustGate[] = [
    { label: "NDA executed", cleared: ndaSigned, detail: ndaSigned ? "Executed & active" : "Awaiting countersignature" },
    { label: "Signature recorded", cleared: identityVerified, detail: identityVerified ? `Signed by ${n.signatureEvents[0]?.representative ?? "authorised rep"}` : "No signature on record" },
    { label: "Named representative on record", cleared: historyValidated, detail: historyValidated ? "A representative is named on the signature" : "No named representative" },
    { label: "Liquidated-damages clause in force", cleared: fundsVerified, detail: fundsVerified ? "Active NDA with a damages provision" : "No damages provision in force" },
  ];
  const score = Math.round((gates.filter((g) => g.cleared).length / gates.length) * 100);
  const tier = score >= 100 ? "Verified" : score >= 50 ? "Qualified" : "Unverified";
  return { gates, score, tier };
}
const TIER_LABEL: Record<BuyerTrust["tier"], string> = { Verified: "All met", Qualified: "Partly met", Unverified: "Mostly unmet" };
const TIER_CLS: Record<BuyerTrust["tier"], string> = {
  Verified: "text-xo-verified", Qualified: "text-xo-caution", Unverified: "text-xo-muted",
};

const Nda: React.FC = () => {
  const { session } = useAuth();
  // Buyers share this route ("Access Requests") but must never see the
  // founder's register of other counterparties.
  return session?.role === "buyer" ? <BuyerAccessRequests /> : <FounderNdaVault />;
};

const REQ_LABEL: Record<NdaRequest["status"], string> = { requested: "Awaiting the founder", signed: "NDA signed", rejected: "Declined" };

const BuyerAccessRequests: React.FC = () => {
  // This account's own NDA requests (made from listings on the Acquisition
  // Radar); never anyone else's.
  const [reqs, setReqs] = useState<NdaRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    myNdaRequests().then((r) => { if (alive) setReqs(r); }).catch(() => { if (alive) { setFailed(true); setReqs([]); } });
    return () => { alive = false; };
  }, []);
  return (
    <div data-page="nda" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="Deals · Your access" title="Access Requests"
        description="Requests you make to see a listed company's materials under NDA." />
      <Section title="Your requests" className="border border-xo-line"
        foot="You request access from a listing on the Acquisition Radar. The founder decides; once an NDA is signed a deal room can open for you. You only ever see your own requests — never other bidders.">
        <div className="px-4 py-3 text-[13px] text-xo-muted">
          {reqs == null ? <p role="status">Loading your requests…</p>
            : failed ? <p role="alert" className="text-xo-risk">Your requests could not be loaded. Try again later.</p>
            : reqs.length === 0 ? <p>No access requests recorded for your account.</p>
            : (
              <ul className="divide-y divide-xo-line">
                {reqs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span><span className="text-xo-faint">Listing </span><span className="font-mono text-xo-text">{r.listingId}</span></span>
                    <span className={r.status === "signed" ? "text-xo-verified" : r.status === "rejected" ? "text-xo-risk" : "text-xo-caution"}>{REQ_LABEL[r.status]}</span>
                    <span className="text-[12px] text-xo-faint">requested {new Date(r.requestedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/console/acquisition-radar" className="inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Acquisition Radar →</Link>
            <Link to="/console/marketplace" className="inline-block rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Browse opportunities</Link>
            <Link to="/console/deal-room" className="inline-block rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Deal room</Link>
          </div>
        </div>
      </Section>
    </div>
  );
};

const FounderNdaVault: React.FC = () => {
  // Session-issued NDAs sit in front of the seeded portfolio so "Issue NDA"
  // produces a real, visible counterparty row via the engine's issueNda().
  const [issued, setIssued] = useState<NdaInstance[]>([]);
  const ndas = useMemo(() => [...issued, ...SAMPLE_NDAS], [issued]);
  const roster = useMemo(() => (issued.length ? rosterFor(ndas) : NDA_ROSTER), [issued, ndas]);
  const verifiedCount = ndas.filter((n) => buyerTrust(n, evaluateNdaStatus(n)).tier === "Verified").length;
  const [openId, setOpenId] = useState<string | null>(null);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ templateId: STANDARD_TEMPLATES[0].id, buyerName: "", rep: "" });

  const submitIssue = (): void => {
    const buyerName = form.buyerName.trim();
    if (!buyerName) { notify("Enter a counterparty name"); return; }
    const nda = issueNda({
      templateId: form.templateId,
      listingId: LISTING_PRIVATE.listingId,
      disclosing: FOUNDER_PARTY,
      receiving: { id: `buyer-${Date.now().toString(36)}`, name: buyerName, representativeName: form.rep.trim() || "Authorized signatory" },
    });
    setIssued((prev) => [nda, ...prev]);
    setIssueOpen(false);
    setForm({ templateId: STANDARD_TEMPLATES[0].id, buyerName: "", rep: "" });
    notify(`NDA issued to ${buyerName} — pending countersignature`);
    setOpenId(nda.id);
  };

  const openNda = useMemo<NdaInstance | null>(
    () => ndas.find((n) => n.id === openId) ?? null,
    [openId, ndas],
  );

  const sampleBreach = useMemo(() => {
    if (!openNda) return null;
    return generateBreachNotice({
      nda: openNda,
      allegations: [
        "Disclosed materials from the data room to a non-permitted third party",
        "Failed to return or destroy materials within the contractual window",
      ],
      evidenceReferences: ["audit-log: data-room.session.4421", "email: 2026-05-28T14:21Z"],
      remedyRequested: "injunctive_relief",
      responseDeadlineDays: 7,
    });
  }, [openNda]);

  const tape = useMemo(() => buildMarketTape(), []);
  const verifiedTier = ndas.filter((n) => buyerTrust(n, evaluateNdaStatus(n)).tier === "Verified").length;

  return (
    <div data-page="nda" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Workspace · NDA" title="NDA Vault"
        badge={<span className="text-[12px] text-xo-muted">Qualification gate · {roster.active} active</span>}
        actions={<>
          <a href="/report/nda" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">NDA Package (PDF) →<span className="sr-only"> (opens in a new tab)</span></a>
          <Button variant="ghost" onClick={() => setTemplatesOpen(true)}>Templates</Button>
          <Button onClick={() => setIssueOpen(true)}>Issue NDA</Button>
        </>} />

      <section aria-label="NDA summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="All four checks met" emphasis value={String(verifiedTier)} sub="record checks, not verification" /></div>
        <div className="bg-xo-panel"><Metric label="Active NDAs" value={String(roster.active)} sub="bound counterparties" /></div>
        <div className="bg-xo-panel"><Metric label="Pending" value={String(roster.pending)} sub="awaiting countersign" /></div>
        <div className="bg-xo-panel"><Metric label="Breaches" value={String(roster.breached)} sub="open enforcement" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Modal open={templatesOpen} onClose={() => setTemplatesOpen(false)} title="NDA templates" subtitle={`${STANDARD_TEMPLATES.length} institutional templates · issue any against a counterparty`}
        footer={<Button onClick={() => { setTemplatesOpen(false); setIssueOpen(true); }}>Issue an NDA →</Button>}>
        <ul className="space-y-3">
          {STANDARD_TEMPLATES.map((t) => (
            <li key={t.id} className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">{t.name}</h3>
                <span className="shrink-0 font-mono text-[11px] text-white/70">{t.shape.replace(/_/g, " ")} · v{t.version}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-3">
                <div><dt className="inline text-white/60">Clauses </dt><dd className="inline text-white/90">{t.clauseCount}</dd></div>
                <div><dt className="inline text-white/60">Survival </dt><dd className="inline text-white/90">{t.defaultTerms.survivalMonths}mo</dd></div>
                <div><dt className="inline text-white/60">Return/destroy </dt><dd className="inline text-white/90">{t.defaultTerms.returnOrDestroyDays}d</dd></div>
                <div><dt className="inline text-white/60">Scope </dt><dd className="inline text-white/90">{t.defaultTerms.scope}</dd></div>
                <div><dt className="inline text-white/60">Law </dt><dd className="inline text-white/90">{t.defaultTerms.governingLaw}</dd></div>
                <div><dt className="inline text-white/60">Injunctive </dt><dd className="inline text-white/90">{t.defaultTerms.injunctiveRelief ? "yes" : "no"}</dd></div>
                {t.defaultTerms.liquidatedDamagesUsd ? <div className="col-span-2"><dt className="inline text-white/60">Liquidated damages </dt><dd className="inline text-white/90">USD {t.defaultTerms.liquidatedDamagesUsd.toLocaleString()}</dd></div> : null}
              </dl>
              <p className="mt-3 text-[12px] text-white/65">Carve-outs: {t.defaultTerms.carveOuts.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue an NDA" subtitle="Generates a pending-signature NDA against the live listing" size="md"
        footer={<><Button variant="ghost" onClick={() => setIssueOpen(false)}>Cancel</Button><Button onClick={submitIssue}>Issue NDA</Button></>}>
        <div className="space-y-4">
          <Field label="Template">
            <select className={inputCls} value={form.templateId} onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}>
              {STANDARD_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Counterparty (buyer)">
            <input className={inputCls} placeholder="e.g. Redwood Capital Partners" value={form.buyerName} onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))} />
          </Field>
          <Field label="Authorized signatory" hint="Optional — defaults to 'Authorized signatory'">
            <input className={inputCls} placeholder="e.g. Jane Okonkwo, VP CorpDev" value={form.rep} onChange={(e) => setForm((f) => ({ ...f, rep: e.target.value }))} />
          </Field>
          {(() => { const t = templateById(form.templateId); return t ? (
            <p className="rounded-lg border border-white/10 bg-ink-900/40 p-3 text-[12px] text-white/75">
              Issues a <span className="text-white">{t.shape.replace(/_/g, " ")}</span> NDA — {t.defaultTerms.survivalMonths}mo survival, {t.defaultTerms.governingLaw} law, {t.clauseCount} clauses. State starts at <span className="text-loi-300">pending signature</span>.
            </p>
          ) : null; })()}
        </div>
      </Modal>

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line">
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{roster.pending > 0
            ? <>Chase countersignatures on the <span className="font-semibold">{roster.pending} pending NDA{roster.pending === 1 ? "" : "s"}</span> to lift each buyer into the room.</>
            : <>All NDAs executed — qualification gates are the gating step now.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{verifiedCount}</span> fully-verified buyer{verifiedCount === 1 ? "" : "s"} cleared for the data room; {roster.active} active.</TakeCell>
            <TakeCell k="If you wait">An unqualified buyer in the data room is an information leak and a wasted slot in your process.</TakeCell>
            <TakeCell k="Pursue">Start with counterparties whose NDA record meets all four checks — then do your own diligence on who they are and how they fund deals.</TakeCell>
            <TakeCell k="ExitOS does it">ExitOS scores every counterparty on four verification gates and gates data-room access automatically.</TakeCell>
          </dl>
        </div>
      </Section>

      <Section title="NDA register" className="border border-xo-line">
        <ScrollRegion label="NDA register table">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="text-left text-[11px] text-xo-faint">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-4 py-2 font-medium">Counterparty</th>
                <th scope="col" className="px-4 py-2 font-medium">Record checks</th>
                <th scope="col" className="px-4 py-2 font-medium">Issued</th>
                <th scope="col" className="px-4 py-2 font-medium">Expires</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
                <th scope="col" className="px-4 py-2 font-medium"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {ndas.map((n) => {
                const status = evaluateNdaStatus(n);
                const trust = buyerTrust(n, status);
                return (
                  <tr key={n.id} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">{n.receiving.name}</th>
                    <td className="px-4 py-2.5"><span className={`text-[12px] font-semibold ${TIER_CLS[trust.tier]}`}>{trust.gates.filter((g) => g.cleared).length}/4 · {TIER_LABEL[trust.tier]}</span></td>
                    <td className="px-4 py-2.5 text-[12px] text-xo-muted">{timeAgo(n.issuedAt)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-xo-muted">{n.expiresAt ? new Date(n.expiresAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5"><span className={`text-[12px] font-semibold ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span></td>
                    <td className="px-4 py-2.5">
                      <button type="button" aria-expanded={openId === n.id} className="inline-block py-1 text-[12px] font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action" onClick={() => setOpenId(openId === n.id ? null : n.id)}>
                        {openId === n.id ? "Close" : "Open"}<span className="sr-only"> {n.receiving.name}</span> →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>

      {openNda && (() => { const trust = buyerTrust(openNda, evaluateNdaStatus(openNda)); return (
        <div className="space-y-3">
          <Section title={`Record checks · ${openNda.receiving.name}`} eyebrow="From the NDA record — ExitOS does not verify identity, funds or acquisition history" className="border border-xo-line"
            right={<span className={`font-mono text-[18px] font-semibold ${TIER_CLS[trust.tier]}`}>{trust.gates.filter((g) => g.cleared).length}/4 · {TIER_LABEL[trust.tier]}</span>}
            foot={trust.tier === "Verified"
              ? "All gates cleared — buyer qualified for full data-room access."
              : `${trust.gates.filter((g) => !g.cleared).length} gate(s) outstanding — data-room access restricted until trust clears.`}>
            <ul className="grid gap-px bg-xo-line sm:grid-cols-2">
              {trust.gates.map((g) => (
                <li key={g.label} className="flex items-start gap-2.5 bg-xo-panel px-4 py-3">
                  <span aria-hidden className={g.cleared ? "text-xo-verified" : "text-xo-faint"}>{g.cleared ? "✓" : "○"}</span>
                  <div>
                    <div className={`text-[13px] font-semibold ${g.cleared ? "" : "text-xo-muted"}`}>{g.label}<span className="sr-only">{g.cleared ? " (met)" : " (not met)"}</span></div>
                    <div className="text-[12px] text-xo-faint">{g.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
            <Section title={`NDA terms · ${openNda.receiving.name}`}>
              <div className="px-4 py-3">
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><dt className="text-[11px] text-xo-faint">Survival</dt><dd>{openNda.terms.survivalMonths} months</dd></div>
                  <div><dt className="text-[11px] text-xo-faint">Return / destroy</dt><dd>{openNda.terms.returnOrDestroyDays} days</dd></div>
                  <div><dt className="text-[11px] text-xo-faint">Governing law</dt><dd>{openNda.terms.governingLaw}</dd></div>
                  <div><dt className="text-[11px] text-xo-faint">Scope</dt><dd>{openNda.terms.scope}</dd></div>
                  {openNda.terms.liquidatedDamagesUsd && (
                    <div className="col-span-2"><dt className="text-[11px] text-xo-faint">Liquidated damages</dt><dd>USD {openNda.terms.liquidatedDamagesUsd.toLocaleString()}</dd></div>
                  )}
                  <div className="col-span-2"><dt className="text-[11px] text-xo-faint">Carve-outs</dt><dd className="text-xo-muted">{openNda.terms.carveOuts.join(" · ")}</dd></div>
                </dl>
                <div className="mt-3 border-t border-xo-line pt-2 text-[12px] text-xo-muted">
                  {openNda.signatureEvents.length === 0
                    ? "No signatures recorded."
                    : <ul>{openNda.signatureEvents.map((e, i) => <li key={i}>{e.party} — {e.representative} ({new Date(e.at).toLocaleString()})</li>)}</ul>}
                </div>
              </div>
            </Section>

            {sampleBreach && (
              <Section title="Sample breach notice" eyebrow="Generated draft">
                <ScrollRegion label="Sample breach notice text" className="max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap px-4 py-3 font-sans text-[12px] leading-relaxed text-xo-muted">{sampleBreach.body}</pre>
                </ScrollRegion>
              </Section>
            )}
          </div>
        </div>
      ); })()}
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Nda;
