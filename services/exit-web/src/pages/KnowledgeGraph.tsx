import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, inputCls } from "../lib/ui";
import { fmtUsd } from "../lib/market-intel";
import { queryAcquisitions, type AcquisitionIndex, type GraphQuery, type Region } from "@exit/engines";
// The full queryable event index (~83 KB gzip) loads only on this route.
import indexFile from "../../../exit-engines/data/acquisition_index.json";

const INDEX = indexFile as unknown as AcquisitionIndex;
const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];

// EXITOS KNOWLEDGE GRAPH (Phase 3) — relationship query over verified deal
// data: sector × geography × value × time × buyer. "Show me every buyer
// that acquired freight-tech in Europe between $10M and $500M in the last
// 5 years." Every row is a source-tagged registry event; nothing invented.

const PRESETS: ReadonlyArray<{ label: string; q: GraphQuery }> = [
  { label: "Freight-tech · Europe · $10–500M · since 2020", q: { sector: "freight", region: "Europe", minUsd: 10e6, maxUsd: 500e6, sinceYear: 2020 } },
  { label: "AI · any region · since 2021", q: { sector: "artificial intelligence", sinceYear: 2021 } },
  { label: "Security software · North America", q: { sector: "security", region: "North America" } },
  { label: "$1B+ deals · since 2020", q: { minUsd: 1e9, sinceYear: 2020 } },
];

const KnowledgeGraph: React.FC = () => {
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [minUsd, setMinUsd] = useState("");
  const [maxUsd, setMaxUsd] = useState("");
  const [sinceYear, setSinceYear] = useState("");

  const apply = (q: GraphQuery): void => {
    setSector(q.sector ?? "");
    setRegion(q.region ?? "");
    setMinUsd(q.minUsd != null ? String(q.minUsd / 1e6) : "");
    setMaxUsd(q.maxUsd != null ? String(q.maxUsd / 1e6) : "");
    setSinceYear(q.sinceYear != null ? String(q.sinceYear) : "");
  };

  const result = useMemo(() => {
    const q: GraphQuery = {
      ...(sector.trim() ? { sector: sector.trim() } : {}),
      ...(region ? { region } : {}),
      ...(minUsd ? { minUsd: Number(minUsd) * 1e6 } : {}),
      ...(maxUsd ? { maxUsd: Number(maxUsd) * 1e6 } : {}),
      ...(sinceYear ? { sinceYear: Number(sinceYear) } : {}),
      limit: 150,
    };
    return queryAcquisitions(INDEX, q);
  }, [sector, region, minUsd, maxUsd, sinceYear]);

  return (
    <div>
      <SectionHeader
        kicker="Market Intelligence · The moat"
        title="ExitOS Knowledge Graph"
        description={`Query the relationships in ${INDEX.count.toLocaleString()} verified acquisitions — buyer × sector × geography × value × time. Every result traces to a source-tagged registry event.`}
      />

      {/* query bar */}
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Sector / technology">
            <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="freight, ai, security…" className={inputCls} />
          </Field>
          <Field label="Region">
            <select value={region} onChange={(e) => setRegion(e.target.value as Region | "")} className={inputCls}>
              <option value="">Any</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Min value ($M)">
            <input value={minUsd} onChange={(e) => setMinUsd(e.target.value)} inputMode="numeric" placeholder="10" className={inputCls} />
          </Field>
          <Field label="Max value ($M)">
            <input value={maxUsd} onChange={(e) => setMaxUsd(e.target.value)} inputMode="numeric" placeholder="500" className={inputCls} />
          </Field>
          <Field label="Since year">
            <input value={sinceYear} onChange={(e) => setSinceYear(e.target.value)} inputMode="numeric" placeholder="2020" className={inputCls} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => apply(p.q)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/65 transition hover:bg-white/5 hover:text-white">
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Matching deals" value={result.totalMatched.toLocaleString()} accent="#34d399" />
        <Kpi label="Distinct buyers" value={String(result.buyers.length)} />
        <Kpi label="Disclosed value" value={fmtUsd(result.disclosedUsd)} sub="of matched deals" />
        <Kpi label="Showing" value={String(result.events.length)} sub="top matches" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* buyers that match */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Buyers ({result.buyers.length})</div>
          <div className="max-h-[560px] overflow-auto">
            {result.buyers.length ? result.buyers.slice(0, 60).map((b) => (
              <Link key={b.buyer_id} to={`/console/buyer/${b.buyer_id}`} className="flex items-baseline justify-between gap-2 border-b border-white/5 px-5 py-2 text-[12.5px] last:border-0 hover:bg-white/[0.03]">
                <span className="min-w-0 truncate font-medium text-white hover:text-deal-300">{b.name}</span>
                <span className="shrink-0 font-mono tabular-nums text-white/55">{b.deals}{b.disclosedUsd > 0 ? ` · ${fmtUsd(b.disclosedUsd)}` : ""}</span>
              </Link>
            )) : <div className="px-5 py-4 text-[12px] text-white/45">No buyer matches that query.</div>}
          </div>
        </Card>

        {/* matching events */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acquisitions</span>
            <span className="text-[10px] uppercase tracking-wide text-white/35">{result.note}</span>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-ink-950 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-2.5">Target</th><th className="px-5 py-2.5">Buyer</th>
                  <th className="px-5 py-2.5">Region</th><th className="px-5 py-2.5 text-right">Date</th>
                  <th className="px-5 py-2.5 text-right">Value</th><th className="px-5 py-2.5">Source</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((e, i) => (
                  <tr key={`${e.bid}-${e.t}-${i}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-2 font-medium text-white">{e.t}<div className="text-[10px] text-white/35">{e.i ?? ""}</div></td>
                    <td className="px-5 py-2"><Link to={`/console/buyer/${e.bid}`} className="text-white/75 hover:text-deal-300">{e.b}</Link></td>
                    <td className="px-5 py-2 text-white/50">{e.c ?? e.r}</td>
                    <td className="px-5 py-2 text-right font-mono tabular-nums text-white/55">{e.d?.slice(0, 7) ?? "—"}</td>
                    <td className="px-5 py-2 text-right font-mono tabular-nums text-deal-300">{e.v != null ? fmtUsd(e.v) : "—"}</td>
                    <td className="px-5 py-2"><span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/40">{e.s.replace("_", " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{label}</span>
    {children}
  </label>
);

export default KnowledgeGraph;
