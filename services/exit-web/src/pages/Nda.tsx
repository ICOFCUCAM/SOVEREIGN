import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo } from "../lib/ui";
import { SAMPLE_NDAS, NDA_ROSTER } from "../lib/engines";
import { evaluateNdaStatus, generateBreachNotice, templateById, type NdaInstance, type NdaState } from "@exit/engines";

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

const SHAPE_LABEL: Record<string, string> = {
  bilateral: "Bilateral", one_way_disclosure: "One-way", one_way_receipt: "One-way",
  mutual_with_cure: "Mutual + cure",
};

const Nda: React.FC = () => {
  const roster = NDA_ROSTER;
  const ndas = SAMPLE_NDAS;
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
        title="NDA Automation"
        description="Bilateral, one-way and mutual NDAs issued at first contact. Tracked per buyer with revocation, breach-notice generation and audit."
        actions={<><Button variant="ghost">Templates</Button><Button>Issue NDA</Button></>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active NDAs"    value={String(roster.active)}   sub="bound counterparties" accent="#34d399" />
        <Kpi label="Pending"        value={String(roster.pending)}  sub="awaiting countersignature" accent="#fbbf24" />
        <Kpi label="Expiring ≤ 90d" value={String(roster.upcomingExpirations.length)} sub="renewal window" />
        <Kpi label="Breaches"       value={String(roster.breached)} sub="open enforcement" accent={roster.breached > 0 ? "#f87171" : undefined} />
      </div>

      <div className="mt-10">
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Counterparty</th>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3">Executed</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ndas.map((n) => {
                const status = evaluateNdaStatus(n);
                const tpl = templateById(n.templateId);
                return (
                  <tr key={n.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-white">{n.receiving.name}</td>
                    <td className="px-5 py-3.5 text-white/65">{tpl ? SHAPE_LABEL[tpl.shape] ?? tpl.shape : "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-white/55">{timeAgo(n.issuedAt)}</td>
                    <td className="px-5 py-3.5 text-xs text-white/55">{n.executedAt ? timeAgo(n.executedAt) : "—"}</td>
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

      {openNda && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      )}
    </div>
  );
};

export default Nda;
