import React, { useEffect, useState } from "react";
import { getGovernanceOverview, type GovOverview, humanError } from "../lib/api";
import { Card } from "../lib/ui";

// Audit & Compliance Dashboard — the executive/regulator view. Can we prove
// compliance? Publication, preservation, the compliance rate, governance
// exceptions, and authority expiration — the institution's governance posture.
const ComplianceDashboard: React.FC = () => {
  const [ov, setOv] = useState<GovOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getGovernanceOverview().then(setOv).catch((e) => setErr(humanError(e, "Could not load the compliance dashboard."))); }, []);
  const c = ov?.compliance;
  const rate = c?.complianceRate ?? 100;
  // A compliance rate over zero governed publications is meaningless — and
  // reporting "100% compliant" before anything has been governed reads as a
  // fabricated metric. Until the first governed publication exists, the posture
  // is "not yet established," not perfect.
  const established = !!c && c.governed > 0;

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Compliance</div>
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Audit &amp; Compliance</h1>
        <p className="text-sm text-white/50">Proof of governance — how records were published, preserved, and whether every publication was compliant with its policy.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* compliance rate — the headline */}
      <Card className="mb-6 p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Policy compliance rate</div>
            <div className="mt-1 text-5xl font-bold tabular-nums text-white">{!c ? "·" : established ? `${rate}%` : "—"}</div>
            <div className="mt-1 text-[12px] text-white/45">{!c ? "" : established ? `${c.compliant} of ${c.governed} governed publications carry a COMPLIANT certificate` : "No governed publications yet — a compliance rate is established once records are published under an enforced policy."}</div>
          </div>
          {established
            ? <div className={`rounded-full px-3 py-1 text-sm font-semibold ${rate >= 100 ? "bg-emerald-500/15 text-emerald-300" : rate >= 90 ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>{rate >= 100 ? "Fully compliant" : rate >= 90 ? "Mostly compliant" : "Attention needed"}</div>
            : c && <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/55">Not yet established</div>}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-white/10"><div className={`h-full transition-all ${!established ? "bg-white/20" : rate >= 100 ? "bg-emerald-400" : rate >= 90 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: established ? `${rate}%` : "0%" }} /></div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          ["Records published", c?.published, "Released to the institutional record"],
          ["Records preserved", c?.preserved, "Sealed with a preservation certificate"],
          ["Governed publications", c?.governed, "Published under an enforced policy"],
          ["Governance exceptions", c?.exceptions, "Approvals made under delegation"],
          ["Expired authorities", c?.expiredAuthorities, "Delegations past their window"],
          ["Compliant certificates", c?.compliant, "Provably satisfied the governing policy"],
        ].map(([label, val, sub]) => (
          <Card key={label as string} className="p-5">
            <div className="text-3xl font-bold tabular-nums text-white">{val === undefined ? "·" : (val as number)}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</div>
            <div className="mt-1 text-[11px] text-white/35">{sub}</div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-white/35">Every governed publication carries a Governance Certificate proving the policy's chain was satisfied in order; open any published record to inspect it.</p>
    </div>
  );
};

export default ComplianceDashboard;
