import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import { DILIGENCE, VALUATION_STRATEGIC } from "../lib/engines";
import BankerTake from "../components/BankerTake";

// Due Diligence AI — inspects the diligence package and surfaces risks before
// buyers find them. Bound to runDueDiligence (@exit/engines): red flags become
// scored findings; each diligence document spec becomes a reviewable category
// with its critical questions and required evidence.

// classify each engine red-flag into a risk category + severity heuristically
type Sev = "high" | "medium" | "low";
function classify(flag: string): { cat: string; sev: Sev } {
  const f = flag.toLowerCase();
  if (f.includes("concentration")) return { cat: "Customer concentration", sev: "high" };
  if (f.includes("regulat") || f.includes("compliance")) return { cat: "Compliance", sev: "high" };
  if (f.includes("margin") || f.includes("revenue") || f.includes("retention") || f.includes("cash")) return { cat: "Financial", sev: "medium" };
  if (f.includes("ip") || f.includes("patent") || f.includes("legal") || f.includes("contract")) return { cat: "Legal", sev: "medium" };
  return { cat: "Operational", sev: "low" };
}
const SEV_STYLE: Record<Sev, string> = {
  high: "bg-red-500/15 text-red-300 ring-red-400/40",
  medium: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  low: "bg-white/5 text-white/50 ring-white/15",
};

const DiligenceAI: React.FC = () => {
  const findings = DILIGENCE.redFlags.map((f) => ({ flag: f, ...classify(f) }));
  const high = findings.filter((f) => f.sev === "high").length;
  const [open, setOpen] = useState<string | null>(DILIGENCE.documents[0]?.kind ?? null);

  return (
    <div>
      <SectionHeader
        kicker="Module · Operator"
        title="Due Diligence AI"
        description="Inspects the diligence package and flags legal, financial, customer-concentration and compliance risks before a buyer discovers them — with the critical questions each acquirer will ask."
        actions={<Button>Re-scan package</Button>}
      />

      <BankerTake
        next={high > 0
          ? <>Resolve the <span className="text-white">{high} high-severity finding{high === 1 ? "" : "s"}</span> before you grant any buyer data-room access.</>
          : <>No high-severity risks — package is clean enough to open to buyers.</>}
        stake={<>A <span className="font-mono font-bold text-deal-300">{fmtMoney(VALUATION_STRATEGIC.headline.mid)}</span> valuation is what unresolved risk discounts.</>}
        inaction={<>Buyers who find these in diligence retrade or walk — surfacing them first protects the price.</>}
        buyer={<>Clear the high-severity findings — they're the gaps a buyer's analyst attacks first.</>}
        automate={<>ExitOS scans the package like a hostile analyst and classifies every risk by severity and category.</>}
        cta={{ label: "Open the data room", to: "/console/data-room" }}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Risks detected" value={String(findings.length)} sub="across the package" accent={high ? "#f87171" : "#34d399"} />
        <Kpi label="High severity" value={String(high)} sub="resolve before buyer access" accent="#f87171" />
        <Kpi label="Critical questions" value={String(DILIGENCE.criticalQuestions.length)} sub="acquirers will ask" />
        <Kpi label="Document categories" value={String(DILIGENCE.documents.length)} sub="diligence packages" />
      </div>

      {/* risk findings */}
      <h2 className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Risk findings</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {findings.map((f) => (
          <Card key={f.flag} className="flex items-start gap-3 p-4">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${SEV_STYLE[f.sev]}`}>{f.sev}</span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{f.cat}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-white/80">{f.flag}</div>
            </div>
          </Card>
        ))}
        {findings.length === 0 && <Card className="p-4 text-sm text-white/50">No material red flags detected.</Card>}
      </div>

      {/* document categories */}
      <h2 className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Diligence categories</h2>
      <div className="space-y-2">
        {DILIGENCE.documents.map((d) => (
          <Card key={d.kind} className="overflow-hidden">
            <button onClick={() => setOpen(open === d.kind ? null : d.kind)} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/[0.03]">
              <div>
                <div className="text-sm font-bold text-white">{d.title}</div>
                <div className="text-[11px] text-white/45">{d.sections.length} sections · classification: {d.classification}</div>
              </div>
              <span className="text-white/40">{open === d.kind ? "–" : "+"}</span>
            </button>
            {open === d.kind && (
              <div className="space-y-4 border-t border-white/10 px-5 py-4">
                {d.sections.map((s) => (
                  <div key={s.heading}>
                    <div className="text-[12px] font-semibold text-deal-300">{s.heading}</div>
                    <ul className="mt-1.5 space-y-1 text-[12px] text-white/65">
                      {s.questions.map((q) => (
                        <li key={q} className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-white/30" />{q}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DiligenceAI;
