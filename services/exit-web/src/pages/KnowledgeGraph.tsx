import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, ScrollRegion, XO_INPUT, XO_LABEL } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { fmtUsd } from "../lib/market-intel";
import { parseNumber } from "../lib/intake-fields";
import { queryAcquisitions, type AcquisitionIndex, type GraphQuery, type Region } from "@exit/engines";
// The full queryable event index (~83 KB gzip) loads only on this route.
import indexFile from "../../../exit-engines/data/acquisition_index.json";

const INDEX = indexFile as unknown as AcquisitionIndex;
const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];

// EXITOS KNOWLEDGE GRAPH (Phase 3) — relationship query over the source-cited
// acquisition index: sector × geography × value × time × buyer. "Show me every buyer
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

  // Numeric filters are validated; an invalid field is flagged and left out
  // of the query instead of silently changing the result.
  const thisYear = new Date().getFullYear();
  const minP = minUsd.trim() ? parseNumber(minUsd, { min: 0, max: 10_000_000, scale: 1e6 }) : null;
  const maxP = maxUsd.trim() ? parseNumber(maxUsd, { min: 0, max: 10_000_000, scale: 1e6 }) : null;
  const yearP = sinceYear.trim() ? parseNumber(sinceYear, { min: 1900, max: thisYear, integer: true }) : null;
  const rangeError = minP?.ok && maxP?.ok && minP.value > maxP.value ? "Min is above max — max ignored." : undefined;
  const minQ = minP?.ok ? minP.value : undefined;
  const maxQ = maxP?.ok && !rangeError ? maxP.value : undefined;
  const yearQ = yearP?.ok ? yearP.value : undefined;

  const result = useMemo(() => {
    const q: GraphQuery = {
      ...(sector.trim() ? { sector: sector.trim() } : {}),
      ...(region ? { region } : {}),
      ...(minQ != null ? { minUsd: minQ } : {}),
      ...(maxQ != null ? { maxUsd: maxQ } : {}),
      ...(yearQ != null ? { sinceYear: yearQ } : {}),
      limit: 150,
    };
    return queryAcquisitions(INDEX, q);
  }, [sector, region, minQ, maxQ, yearQ]);
  const errMin = minP && !minP.ok ? `${minP.error} Ignored.` : undefined;
  const errMax = maxP && !maxP.ok ? `${maxP.error} Ignored.` : rangeError;
  const errYear = yearP && !yearP.ok ? `Enter a year from 1900 to ${thisYear}, e.g. 2020. Ignored.` : undefined;

  return (
    <div data-page="knowledge-graph" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Market Intelligence" title="Knowledge Graph"
        badge={<span className="text-[12px] text-xo-muted">Query the registry · index as of {INDEX.as_of.slice(0, 10)} · {INDEX.count.toLocaleString()} events</span>}
        description="Every row comes from a source-cited registry entry (Wikipedia acquisition lists or Wikidata, shown in the Source column). Rows are not individually verified here; values are as disclosed in those sources." />

      <section aria-label="Query result summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Matching deals" emphasis value={result.totalMatched.toLocaleString()} sub="for this query" /></div>
        <div className="bg-xo-panel"><Metric label="Distinct buyers" value={String(result.buyers.length)} sub="in the result" /></div>
        <div className="bg-xo-panel"><Metric label="Disclosed value" value={fmtUsd(result.disclosedUsd)} sub="of matched deals" /></div>
        <div className="bg-xo-panel"><Metric label="Showing" value={String(result.events.length)} sub="top matches" /></div>
      </section>

      <MarketTape items={buildMarketTape()} />

      <Section title="Query" className="border border-xo-line">
        <div className="px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field id="kg-sector" label="Sector / technology"><input id="kg-sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="freight, ai, security…" className={XO_INPUT} /></Field>
            <Field id="kg-region" label="Region">
              <select id="kg-region" value={region} onChange={(e) => setRegion(e.target.value as Region | "")} className={XO_INPUT}>
                <option value="">Any</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field id="kg-min" label="Min value ($M)" error={errMin}><input id="kg-min" aria-invalid={errMin ? true : undefined} aria-describedby={errMin ? "kg-min-err" : undefined} value={minUsd} onChange={(e) => setMinUsd(e.target.value)} inputMode="numeric" placeholder="10" className={XO_INPUT} /></Field>
            <Field id="kg-max" label="Max value ($M)" error={errMax}><input id="kg-max" aria-invalid={errMax ? true : undefined} aria-describedby={errMax ? "kg-max-err" : undefined} value={maxUsd} onChange={(e) => setMaxUsd(e.target.value)} inputMode="numeric" placeholder="500" className={XO_INPUT} /></Field>
            <Field id="kg-year" label="Since year" error={errYear}><input id="kg-year" aria-invalid={errYear ? true : undefined} aria-describedby={errYear ? "kg-year-err" : undefined} value={sinceYear} onChange={(e) => setSinceYear(e.target.value)} inputMode="numeric" placeholder="2020" className={XO_INPUT} /></Field>
          </div>
          <div role="group" aria-label="Preset queries" className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => apply(p.q)} className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{p.label}</button>
            ))}
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[320px_1fr]">
        <Section title={`Buyers (${result.buyers.length})`}>
          <ScrollRegion label="Matching buyers" className="max-h-[560px] overflow-y-auto">
            {result.buyers.length ? (
              <ul>
                {result.buyers.slice(0, 60).map((b) => (
                  <li key={b.buyer_id} className="border-b border-xo-line last:border-0">
                    <Link to={`/console/buyer/${b.buyer_id}`} className="flex items-baseline justify-between gap-2 px-4 py-2 text-[12px] hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
                      <span className="min-w-0 truncate font-medium">{b.name}</span>
                      <span className="shrink-0 font-mono tabular-nums text-xo-muted">{b.deals}{b.disclosedUsd > 0 ? ` · ${fmtUsd(b.disclosedUsd)}` : ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-3 text-[12px] text-xo-muted">No buyer matches that query.</p>}
          </ScrollRegion>
        </Section>

        <Section title="Acquisitions" right={<span className="text-[11px] text-xo-faint">{result.note}</span>}>
          <ScrollRegion label="Matching acquisitions table" className="max-h-[560px] overflow-y-auto">
            <table className="w-full min-w-[720px] text-[12px]">
              <thead className="sticky top-0 bg-xo-panel text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-4 py-2 font-medium">Target</th><th scope="col" className="px-4 py-2 font-medium">Buyer</th>
                  <th scope="col" className="px-4 py-2 font-medium">Region</th><th scope="col" className="px-4 py-2 text-right font-medium">Date</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Value</th><th scope="col" className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((e, i) => (
                  <tr key={`${e.bid}-${e.t}-${i}`} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-medium">{e.t}<div className="text-[11px] font-normal text-xo-faint">{e.i ?? ""}</div></th>
                    <td className="px-4 py-2"><Link to={`/console/buyer/${e.bid}`} className="text-xo-muted hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{e.b}</Link></td>
                    <td className="px-4 py-2 text-xo-muted">{e.c ?? e.r}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-muted">{e.d?.slice(0, 7) ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-verified">{e.v != null ? fmtUsd(e.v) : "—"}</td>
                    <td className="px-4 py-2 text-[11px] capitalize text-xo-faint">{e.s.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>
    </div>
  );
};

const Field: React.FC<{ id: string; label: string; children: React.ReactNode; error?: string }> = ({ id, label, children, error }) => (
  <div>
    <label htmlFor={id} className={XO_LABEL}>{label}</label>
    {children}
    {error && <p id={`${id}-err`} className="mt-1 text-[12px] text-xo-risk">{error}</p>}
  </div>
);

export default KnowledgeGraph;
