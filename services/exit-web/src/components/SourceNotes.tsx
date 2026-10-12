import React, { useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { MARKET_FMT, HISTORY_FMT, LEDGER_PRICED, LEDGER_TIERS, DEAL_INTEL, DEAL_INTEL_FMT } from "../lib/market-stats";
import { MARKET_INDEX_FMT } from "../lib/market-index";

// Numbered source notes for the homepage's figures: a superscript beside a
// figure links to its entry in "Sources & method" above the footer, and each
// entry links back to where it is first cited.

export type SourceId = 1 | 2 | 3 | 4 | 5 | 6;

/** A superscript note. Mark the first citation of a source with `first`. */
export const Note: React.FC<{ n: SourceId; first?: boolean; dark?: boolean }> = ({ n, first, dark }) => (
  <sup className="ml-0.5 align-super text-[0.62em] font-semibold leading-none">
    <a href={`#source-${n}`} id={first ? `cite-${n}` : undefined} aria-label={`Source ${n}`}
      className={`rounded-sm px-0.5 underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-2 ${dark ? "text-blue-300 focus-visible:ring-blue-300" : "text-blue-700 focus-visible:ring-blue-600"}`}>{n}</a>
  </sup>
);

const tiers = Object.entries(LEDGER_TIERS).map(([k, v]) => `${v} ${k}`).join(", ");

const SOURCES: ReadonlyArray<{ n: SourceId; title: string; body: string }> = [
  { n: 1, title: "Market index", body: `${MARKET_INDEX_FMT.events} acquisition events by ${MARKET_INDEX_FMT.buyers} buyers, ingested from Wikipedia, Wikidata and SEC EDGAR; generated ${MARKET_INDEX_FMT.asOf}. A bundled snapshot — not a live feed.` },
  { n: 2, title: "Acquirer registry", body: `${MARKET_FMT.buyers} curated acquirer mandates (${MARKET_FMT.strategic} strategic, ${MARKET_FMT.privateEquity} private equity) across ${MARKET_FMT.geographies} jurisdictions and ${MARKET_FMT.sectors} sectors, with check sizes, focus sectors, appetite and activity scores as curated. Bundled with this build; mandates are curated, not independently verified.` },
  { n: 3, title: "Disclosed-deal history", body: `${HISTORY_FMT.events} recorded deals, ${LEDGER_PRICED} with a disclosed price (${HISTORY_FMT.disclosedValue} in total), each citing SEC 8-K / 10-K filings, Wikidata or press releases as listed in the ledger. Record tier: ${tiers} — not re-checked against the primary filing in this build.` },
  { n: 4, title: "Deal medians", body: `Median premium over reference ${DEAL_INTEL_FMT.medianPremium} (from ${DEAL_INTEL.measuredPremiums} deals with a reference price) and median announce-to-close ${DEAL_INTEL_FMT.medianClose} (from ${DEAL_INTEL.measuredCloses} deals with both dates), computed over the deal history above.` },
  { n: 5, title: "Valuation", body: "The institutional valuation framework the console uses — deterministic: the same inputs always give the same answer. The homepage estimate fills every input other than sector, revenue and growth with typical values, listed beside the result." },
  { n: 6, title: "Typical timeline", body: "The weeks shown for each lifecycle stage are ExitOS's planning assumptions for a run process, not measurements." },
];

export const SourcesSection: React.FC<{ only?: readonly SourceId[] }> = ({ only }) => {
  const { t } = useI18n();
  const list = only ? SOURCES.filter((s) => only.includes(s.n)) : SOURCES;
  // The back-link targets the first citation on this page; a page whose
  // notes are not marked `first` gets the id on its first note here.
  useEffect(() => {
    for (const s of list) {
      if (document.getElementById(`cite-${s.n}`)) continue;
      const a = document.querySelector(`sup a[href="#source-${s.n}"]`);
      if (a) a.id = `cite-${s.n}`;
    }
  }, [list]);
  return (
    <section aria-labelledby="sources-h" className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1480px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
          <h2 id="sources-h" className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-blue-600">{t("src.title")}</h2>
          <ol className="border-t border-ink-900">
            {list.map((s) => (
              <li key={s.n} id={`source-${s.n}`} className="grid scroll-mt-28 grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-slate-200 py-4 target:bg-blue-50/60">
                <span className="font-mono text-[12px] font-semibold text-blue-700">{s.n}</span>
                <div>
                  <h3 className="font-editorial text-[18px] font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{s.body}</p>
                  <a href={`#cite-${s.n}`} className="mt-1 inline-block rounded-sm font-mono text-[11px] text-blue-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label={`Back to where source ${s.n} is first cited`}>↩ back</a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
