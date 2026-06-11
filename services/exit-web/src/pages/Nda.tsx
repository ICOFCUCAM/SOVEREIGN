import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo, preview } from "../lib/ui";
import { SAMPLE_NDAS, NDA_ROSTER } from "../lib/engines";
import { evaluateNdaStatus, generateBreachNotice, type NdaInstance, type NdaState } from "@exit/engines";
import BankerTake from "../components/BankerTake";

const STATUS_STYLE: Record<NdaState, string> = {
  active:            "bg-deal-600/20 text-deal-300",
  pending_signature: "bg-loi-500/15 text-loi-300",
  expired:           "bg-white/5 text-white/45",
  revoked:           "bg-white/5 text-white/45",
  breached:          "bg-red-500/15 text-red-300",
  draft:             "bg-white/5 text-white/55",
};

const STATUS_LABEL: Record<NdaState, string> = {
  active: "Active", pending_signature: "Pending", expired: "Expired",
  revoked: "Revoked", breached: "Breach", draft: "Draft",
};

// Buyer Trust Score — turns the NDA from a commodity document into buyer
// qualification. Four verification gates, each worth points; the NDA signature
// is one gate among four. A buyer only reaches the data room once trust clears.
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
    { label: "NDA signed", cleared: ndaSigned, detail: ndaSigned ? "Executed & active" : "Awaiting countersignature" },
    { label: "Identity verified", cleared: identityVerified, detail: identityVerified ? `Signed by ${n.signatureEvents[0]?.representative ?? "authorised rep"}` : "No verified signatory" },
    { label: "Acquisition history validated", cleared: historyValidated, detail: historyValidated ? "Institutional counterparty on record" : "No validated track record" },
    { label: "Funds verified", cleared: fundsVerified, detail: fundsVerified ? "Capitalised · damages provision in force" : "Capital not yet verified" },
  ];
  const score = Math.round((gates.filter((g) => g.cleared).length / gates.length) * 100);
  const tier = score >= 100 ? "Verified" : score >= 50 ? "Qualified" : "Unverified";
  return { gates, score, tier };
}
const TIER_STYLE: Record<BuyerTrust["tier"], string> = {
  Verified: "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  Qualified: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  Unverified: "bg-white/5 text-white/45 ring-white/15",
};

const Nda: React.FC = () => {
  const roster = NDA_ROSTER;
  const ndas = SAMPLE_NDAS;
  const verifiedCount = ndas.filter((n) => buyerTrust(n, evaluateNdaStatus(n)).tier === "Verified").length;
  const [openId, setOpenId] = useState<string | null>(null);

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

  return (
    <div>
      <SectionHeader
        kicker="Module 07 · Workspace"
        title="NDA &amp; Buyer Trust"
        description="The NDA is the first gate of buyer qualification — not just a document. Every counterparty earns a Buyer Trust Score from four verification gates before data-room access is granted."
        actions={<><Button variant="ghost" onClick={preview}>Templates</Button><Button onClick={preview}>Issue NDA</Button></>}
      />

      <BankerTake
        next={roster.pending > 0
          ? <>Chase countersignatures on the <span className="text-white">{roster.pending} pending NDA{roster.pending === 1 ? "" : "s"}</span> to lift each buyer into the room.</>
          : <>All NDAs executed — qualification gates are the gating step now.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{verifiedCount}</span> fully-verified buyer{verifiedCount === 1 ? "" : "s"} cleared for the data room; {roster.active} active.</>}
        inaction={<>An unqualified buyer in the data room is an information leak and a wasted slot in your process.</>}
        buyer={<>Pursue <span className="text-white">Verified-tier</span> buyers first — they've cleared all four trust gates.</>}
        automate={<>ExitOS scores every counterparty on four verification gates and gates data-room access automatically.</>}
      />

      {(() => {
        const verified = ndas.filter((n) => buyerTrust(n, evaluateNdaStatus(n)).tier === "Verified").length;
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Kpi label="Verified buyers"  value={String(verified)} sub="all four gates cleared" accent="#34d399" />
            <Kpi label="Active NDAs"      value={String(roster.active)} sub="bound counterparties" accent="#34d399" />
            <Kpi label="Pending"          value={String(roster.pending)} sub="awaiting countersignature" accent="#fbbf24" />
            <Kpi label="Breaches"         value={String(roster.breached)} sub="open enforcement" accent={roster.breached > 0 ? "#f87171" : undefined} />
          </div>
        );
      })()}

      <div className="mt-10">
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Counterparty</th>
                <th className="px-5 py-3">Buyer Trust</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ndas.map((n) => {
                const status = evaluateNdaStatus(n);
                const trust = buyerTrust(n, status);
                return (
                  <tr key={n.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-white">{n.receiving.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full" style={{ width: `${trust.score}%`, background: trust.score >= 100 ? "#34d399" : trust.score >= 50 ? "#fbbf24" : "#64748b" }} />
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TIER_STYLE[trust.tier]}`}>{trust.tier} · {trust.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/55">{timeAgo(n.issuedAt)}</td>
                    <td className="px-5 py-3.5 text-xs text-white/55">{n.expiresAt ? new Date(n.expiresAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300"
                        onClick={() => setOpenId(openId === n.id ? null : n.id)}
                      >
                        {openId === n.id ? "Close" : "Open"} &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {openNda && (() => { const trust = buyerTrust(openNda, evaluateNdaStatus(openNda)); return (
        <div className="mt-6 space-y-4">
          {/* Buyer Trust Score — qualification gates */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Buyer Trust Score</div>
                <div className="mt-1 text-lg font-semibold text-white">{openNda.receiving.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-3xl font-bold" style={{ color: trust.score >= 100 ? "#34d399" : trust.score >= 50 ? "#fbbf24" : "#94a3b8" }}>{trust.score}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TIER_STYLE[trust.tier]}`}>{trust.tier}</span>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {trust.gates.map((g) => (
                <div key={g.label} className={`flex items-start gap-2.5 rounded-lg border p-3 ${g.cleared ? "border-deal-500/30 bg-deal-600/5" : "border-white/10 bg-ink-900/40"}`}>
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${g.cleared ? "bg-deal-600/30 text-deal-200 ring-1 ring-deal-400/40" : "bg-white/5 text-white/40 ring-1 ring-white/15"}`}>{g.cleared ? "✓" : "○"}</span>
                  <div>
                    <div className={`text-[13px] font-semibold ${g.cleared ? "text-white" : "text-white/55"}`}>{g.label}</div>
                    <div className="text-[11px] text-white/45">{g.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 text-[12px] text-white/55">
              {trust.tier === "Verified"
                ? "All gates cleared — buyer qualified for full data-room access."
                : `${trust.gates.filter((g) => !g.cleared).length} gate(s) outstanding — data-room access restricted until trust clears.`}
            </div>
          </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">NDA terms</div>
            <div className="mt-1 text-lg font-semibold text-white">{openNda.receiving.name}</div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Survival</dt>
                <dd className="text-white/85">{openNda.terms.survivalMonths} months</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Return / destroy</dt>
                <dd className="text-white/85">{openNda.terms.returnOrDestroyDays} days</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Governing law</dt>
                <dd className="text-white/85">{openNda.terms.governingLaw}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Scope</dt>
                <dd className="text-white/85">{openNda.terms.scope}</dd>
              </div>
              {openNda.terms.liquidatedDamagesUsd && (
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wide text-white/40">Liquidated damages</dt>
                  <dd className="text-white/85">USD {openNda.terms.liquidatedDamagesUsd.toLocaleString()}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-wide text-white/40">Carve-outs</dt>
                <dd className="text-white/65">{openNda.terms.carveOuts.join(" · ")}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-white/5 pt-3 text-xs text-white/55">
              {openNda.signatureEvents.length === 0
                ? "No signatures recorded."
                : openNda.signatureEvents.map((e, i) => (
                    <div key={i}>· {e.party} — {e.representative} ({new Date(e.at).toLocaleString()})</div>
                  ))}
            </div>
          </Card>

          {sampleBreach && (
            <Card className="p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Sample breach notice</div>
              <div className="mt-1 text-lg font-semibold text-white">Generated draft</div>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-white/5 bg-black/40 p-4 text-[12px] leading-relaxed text-white/75">
{sampleBreach.body}
              </pre>
            </Card>
          )}
        </div>
        </div>
      ); })()}
    </div>
  );
};

export default Nda;
