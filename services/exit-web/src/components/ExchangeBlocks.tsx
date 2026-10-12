import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Glyph, Mark, Chapter, Editorial } from "./MarketingChrome";
import { MARKET_FMT, HISTORY_FMT, SECTOR_DEMAND, REGISTRY_CARDS, TOP_JURISDICTIONS } from "../lib/market-stats";
import { useI18n } from "../lib/i18n";
import { Note, type SourceId } from "./SourceNotes";

// Exchange blocks — the sections repositioned from the homepage to Platform
// and Modules (HOMEPAGE.md, Phase 4 V1). Content, i18n keys, links and source
// notes are carried over unchanged; only the chapter number is a prop.

const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";
// dark blocks on the exchange ink (EE27)
const NAVY = "var(--ex-field)";
const H2 = "font-editorial text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]";

const ECOSYSTEM = [
  { icon: "shield", label: "ms.strategic", meta: "ms.strategic.meta", n: MARKET_FMT.strategic },
  { icon: "spark", label: "ms.pe", meta: "ms.pe.meta", n: MARKET_FMT.privateEquity },
  { icon: "users", label: "ms.fo", meta: "ms.fo.meta", n: "" },
  { icon: "chart", label: "ms.advisors", meta: "ms.advisors.meta", n: "" },
  { icon: "doc", label: "ms.corpdev", meta: "ms.corpdev.meta", n: "" },
];

// founder → exit workflow chain
const EXCHANGE_FLOW = [
  { icon: "users", title: "Founder", sub: "lists the company" },
  { icon: "chart", title: "Acquisition Intelligence", sub: "valuation & positioning" },
  { icon: "globe", title: "Buyer Network", sub: "matched acquirers" },
  { icon: "spark", title: "Negotiation", sub: "scored terms" },
  { icon: "lock", title: "Closing", sub: "signature & escrow" },
  { icon: "check", title: "Exit", sub: "funds transferred" },
];

const PROVENANCE_PIPELINE = [
  { stage: "Public record", detail: "SEC EDGAR 8-K · Wikidata · press disclosures" },
  { stage: "Curated registry", detail: `${MARKET_FMT.buyers} curated acquirer mandates` },
  { stage: "Deterministic pricing", detail: "same inputs, same answer — reproducible" },
  { stage: "The exchange", detail: "every figure on this page traces to the record" },
];

// Governance band — the controls a counterparty must clear and the controls
// that protect the founder. Stated as conditions, not features.
const GOVERNANCE = [
  { icon: "lock", title: "gov.nda.t", body: "gov.nda.b" },
  { icon: "shield", title: "gov.verify.t", body: "gov.verify.b" },
  { icon: "check", title: "gov.audit.t", body: "gov.audit.b" },
  { icon: "users", title: "gov.control.t", body: "gov.control.b" },
  { icon: "doc", title: "gov.soc.t", body: "gov.soc.b" },
];

const STEPS = [
  { icon: "chart", title: "Company Analysis", body: "Valuation across weighted methodologies, market positioning, and a priced readiness score." },
  { icon: "users", title: "Buyer Discovery", body: `Engine-ranked matching across ${MARKET_FMT.buyers} curated strategic and financial mandates.` },
  { icon: "doc", title: "Data Room", body: "The diligence document checklist, with completeness by package." },
  { icon: "spark", title: "Negotiation Engine", body: "Offer scoring, counters and scenario modeling against your reservation lines." },
  { icon: "check", title: "LOI Received", body: "Manage terms, track milestones, and reduce deal risk." },
  { icon: "lock", title: "Closing & Payout", body: "Streamline closing, documents, and funds transfer." },
];
const BUYERS = REGISTRY_CARDS;
const COMMAND_FEATURES = [
  { icon: "chart", src: 3 as SourceId, value: HISTORY_FMT.events, title: "Disclosed Deals Indexed", body: "EDGAR + Wikidata sourced" },
  { icon: "users", src: 2 as SourceId, value: MARKET_FMT.buyers, title: "Buyer Mandates", body: "intent monitoring" },
  { icon: "spark", src: 2 as SourceId, value: MARKET_FMT.activeMandates, title: "Actively Deploying", body: "appetite flagged in the registry" },
  { icon: "fire", src: 2 as SourceId, value: SECTOR_DEMAND[0]?.[1] ?? "—", title: "Market Heat", body: `top sector: ${SECTOR_DEMAND[0]?.[0] ?? "—"}` },
  { icon: "globe", src: 2 as SourceId, value: MARKET_FMT.appetite, title: "Acquisition Demand", body: "check capacity indexed" },
  { icon: "doc", src: 2 as SourceId, value: MARKET_FMT.sectors, title: "Sectors Covered", body: "across the registry" },
];
const DATA_ROOMS = [
  { icon: "chart", title: "Financial Statements" },
  { icon: "doc", title: "Legal Documents" },
  { icon: "shield", title: "Contracts & IP" },
  { icon: "users", title: "Customer Data" },
  { icon: "spark", title: "Technical Due Diligence" },
  { icon: "lock", title: "Compliance & Risk" },
];
const NEGOTIATION_FEATURES = [
  { icon: "spark", title: "Offer optimization", body: "Maximise value and certainty." },
  { icon: "shield", title: "Risk analysis", body: "Understand downside scenarios." },
  { icon: "doc", title: "Term sheet generation", body: "Create investor-grade documents." },
];
// Anonymized listing-protocol cards. Codenames and banded figures only —
// identity, exact financials and the asking range unlock on a signed NDA.
// Sector/region framing mirrors the registry's real coverage.
const OPPORTUNITIES = [
  { sector: "Logistics / Freight", name: "Project Meridian", rev: "$50–75M", ebitda: "$15–20M", stage: "Teaser issued", region: "North America" },
  { sector: "Vertical SaaS", name: "Project Basalt", rev: "$100–150M", ebitda: "$30–40M", stage: "In diligence", region: "Europe" },
  { sector: "Cybersecurity", name: "Project Aurelia", rev: "$75–125M", ebitda: "$25–35M", stage: "NDA stage", region: "Global" },
  { sector: "AI Infrastructure", name: "Project Caldera", rev: "$75–100M", ebitda: "$20–30M", stage: "Management meetings", region: "Asia-Pacific" },
];
const GLOBAL_STATS = [
  { value: MARKET_FMT.geographies, label: "Jurisdictions" },
  { value: MARKET_FMT.buyers, label: "Acquirer Mandates" },
  { value: MARKET_FMT.appetite, label: "Check Capacity" },
  { value: MARKET_FMT.sectors, label: "Sectors Covered" },
];


export const TrustStrip: React.FC = () => {
  const { t } = useI18n();
  const heroTrust = [
    { icon: "globe", metric: t("trust.network.m", { n: MARKET_FMT.buyers }), title: t("trust.network.t"), sub: t("trust.network.s", { g: MARKET_FMT.geographies, s: MARKET_FMT.sectors }) },
    { icon: "lock", metric: "NDA", title: t("trust.soc.t"), sub: t("trust.soc.s") },
    { icon: "users", metric: "100%", title: t("trust.control.t"), sub: t("trust.control.s") },
    { icon: "check", metric: t("trust.audit.m"), title: t("trust.audit.t"), sub: t("trust.audit.s") },
  ];
  return (
      <section aria-label="What the exchange is built on" className="border-b border-slate-200 bg-white">
        <div>
          <div className={`${WRAP} grid grid-cols-2 lg:grid-cols-4`}>
            {heroTrust.map((c, i) => (
              <div key={c.title} className={`flex items-center gap-3.5 py-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-6" : ""} ${i % 2 ? "border-l border-slate-200 pl-5 lg:pl-6" : ""}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#7A6344] ring-1 ring-slate-200"><Glyph name={c.icon} /></span>
                <div className="min-w-0">
                  <div className="font-editorial text-[22px] font-semibold leading-none text-ink-900">{c.metric}{c.icon === "globe" && <Note n={2} />}</div>
                  <div className="mt-1 text-[12.5px] font-semibold leading-tight text-ink-800">{c.title}</div>
                  <div className="text-[11px] leading-snug text-slate-600">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
};

export const ExchangeSystem: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 03 · THE SYSTEM — founder → exit workflow ===== */}
      <section id="platform" className="border-b border-slate-200">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <Chapter n={n}>{t("wf.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("wf.h2")} /></h2>
            </div>
          </div>
          <ol className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((st, i) => (
              <li key={st.title} className="bg-[#F8F4EE] py-6 sm:px-6">
                <span className="font-mono text-[10.5px] text-[#7A6344]">{String(i + 1).padStart(2, "0")} /</span>
                <div className="mt-5 text-[#7A6344]"><Glyph name={st.icon} size={34} /></div>
                <h3 className="mt-4 font-editorial text-[24px] font-semibold leading-tight text-ink-900">{st.title}</h3>
                <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-slate-600">{st.body}</p>
              </li>
            ))}
          </ol>
          {/* Founder → Exit — the flow in one mono line */}
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">
            {EXCHANGE_FLOW.map((s, i) => (
              <React.Fragment key={s.title}>
                <div className="flex items-center gap-2">
                  <span className="text-[#7A6344]"><Glyph name={s.icon} small /></span>
                  <span className="text-[13px] font-semibold text-ink-800">{s.title}</span>
                </div>
                {i < EXCHANGE_FLOW.length - 1 && <span className="text-[#7A6344]" aria-hidden>→</span>}
              </React.Fragment>
            ))}
          </div>
          {/* market structure — the counterparties on the exchange */}
          <div id="solutions" className="mt-16">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t("ms.eyebrow")}<Note n={2} /></div>
            <div className="mt-4 grid grid-cols-2 border-t border-slate-300 sm:grid-cols-3 lg:grid-cols-5">
              {ECOSYSTEM.map((e, i) => (
                <div key={e.label} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""}`}>
                  <span className="text-[#7A6344]"><Glyph name={e.icon} /></span>
                  <div className="mt-3 text-[13px] font-semibold text-ink-900">{t(e.label)}</div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-slate-600">{t(e.meta, { n: e.n })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export const BuyerIntelligence: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 04 · BUYER INTELLIGENCE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n={n}>{t("bi.eyebrow")}<Note n={2} /></Chapter>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className={`${H2} text-ink-900`}><Editorial text={t("bi.h2")} /></h2>
              <Link to="/console" className="border-b border-[#9A7E56] pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-900">{t("bi.link")} ↗</Link>
            </div>
          </div>
          <div className="mt-12 grid border-y border-ink-900 sm:grid-cols-2 lg:grid-cols-5">
            {BUYERS.map((b, i) => (
              <div key={b.name} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""} border-b border-slate-200 last:border-b-0 lg:border-b-0`}>
                <div className="flex items-center gap-2.5">
                  <Mark name={b.name} />
                  <div>
                    <div className="text-sm font-bold leading-tight text-ink-900">{b.name}</div>
                    <div className="text-[10.5px] text-slate-600">{b.kind}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-600">Acquisition Appetite</span>
                    <span className="font-semibold text-[#7A6344]">{b.appetite >= 90 ? "Very High" : "High"}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden bg-slate-100">
                    <div className="h-full bg-[#9A7E56]" style={{ width: `${b.appetite}%` }} />
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-[11px]">
                  {b.rows.map((r) => (
                    <div key={r[0]} className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                      <dt className="text-slate-600">{r[0]}</dt>
                      <dd className="text-right font-semibold text-ink-800">{r[1]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export const DataProvenance: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 05 · DATA PROVENANCE ===== */}
      <section className="border-b border-slate-200">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid items-start gap-12">
            <div>
              <Chapter n={n}>{t("prov.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("prov.h2")} /></h2>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate-600">{t("prov.body")}</p>
              <ol className="mt-8 border-t border-slate-300">
                {PROVENANCE_PIPELINE.map((p, i) => (
                  <li key={p.stage} className="flex items-baseline gap-4 border-b border-slate-200 py-3">
                    <span className="font-mono text-[10.5px] text-[#7A6344]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[13px] font-semibold text-ink-900">{p.stage}</span>
                    <span className="ml-auto text-right text-[11.5px] text-slate-600">{p.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {/* signal tiles — one hairline row */}
          <div className="mt-14 grid grid-cols-2 border-y border-slate-300 sm:grid-cols-3 lg:grid-cols-6">
            {COMMAND_FEATURES.map((f, i) => (
              <div key={f.title} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-4" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[#7A6344]"><Glyph name={f.icon} small /></span>
                  <span className="font-mono text-[15px] font-bold text-ink-900">{f.value}<Note n={f.src} /></span>
                </div>
                <div className="mt-3 text-[12px] font-bold leading-tight text-ink-900">{f.title}</div>
                <div className="text-[10.5px] leading-snug text-slate-600">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export const NegotiationDesk: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 07–08 · THE WORKING ENVIRONMENT (dark) — negotiation desk + data rooms ===== */}
      <section data-ink className="ex-seam relative text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-[6vw]">
            <div>
              <Chapter n={n} dark>{t("neg.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-white`}><Editorial text={t("neg.h2")} dark /></h2>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed text-[#E8E0D2]/70">{t("neg.body")}</p>
              <Link to="/modules" className="mt-6 inline-block border-b border-[#C9B08A] pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">{t("neg.link")} ↗</Link>
              <ul className="mt-8 border-t border-white/15">
                {NEGOTIATION_FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-3 border-b border-white/10 py-4">
                    <span className="mt-0.5 text-[#C9B08A]"><Glyph name={f.icon} small /></span>
                    <div>
                      <div className="text-sm font-bold text-white">{f.title}</div>
                      <div className="text-[12px] text-[#E8E0D2]/60">{f.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* the desk — a framed instrument */}
            <div className="border border-white/15 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#E8E0D2]/60">
                <span>ExitOS / Negotiation desk</span><span className="text-loi-300">Illustrative figures</span>
              </div>
              <div className="mt-4"><OfferTable /></div>
            </div>
          </div>

        </div>
      </section>

    </>
  );
};

export const DataRooms: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      <section data-ink className="ex-seam relative text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          {/* data rooms */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-[6vw]">
            <div>
              <Chapter n={n} dark>{t("dr.eyebrow")}</Chapter>
              <h2 className={`${H2} mt-4 text-white`}><Editorial text={t("dr.h2")} dark /></h2>
              <p className="mt-6 max-w-lg text-[14px] leading-relaxed text-[#E8E0D2]/70">{t("dr.body")}</p>
              <Link to="/platform" className="mt-6 inline-block border-b border-[#C9B08A] pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">{t("dr.link")} ↗</Link>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] text-[#E8E0D2]/70">
                {[["doc", "Document checklist by package"], ["check", "Completeness per package"], ["shield", "Who can see uploads, stated"]].map(([ic, l]) => (
                  <span key={l} className="flex items-center gap-1.5"><span className="text-[#C9B08A]"><Glyph name={ic} small /></span>{l}</span>
                ))}
              </div>
            </div>
            <div className="flex h-40 items-center justify-center border border-white/15"><Vault /></div>
          </div>
          <div className="mt-10 grid grid-cols-2 border-y border-white/15 sm:grid-cols-3 lg:grid-cols-6">
            {DATA_ROOMS.map((d, i) => (
              <div key={d.title} className={`py-5 pr-4 ${i > 0 ? "lg:border-l lg:border-white/10 lg:pl-4" : ""}`}>
                <span className="text-[#C9B08A]"><Glyph name={d.icon} small /></span>
                <div className="mt-3 text-[12.5px] font-semibold leading-tight text-white">{d.title}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#E8E0D2]/70">
                  <span>Required for diligence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export const ExampleListings: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 09 · THE MARKETPLACE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${WRAP} py-14 sm:py-20 lg:py-24`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n={n}>{t("mp.eyebrow")}</Chapter>
            <div>
              <h2 className={`${H2} text-ink-900`}><Editorial text={t("mp.h2")} /></h2>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
                <p className="max-w-md text-[14px] leading-relaxed text-slate-600">{t("mp.body")}</p>
                <Link to="/console/marketplace" className="border-b border-[#9A7E56] pb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-900">{t("mp.link")} ↗</Link>
              </div>
            </div>
          </div>
          <p className="mt-12 text-[13px] font-medium text-slate-700">Example listings — illustrative, not companies on the market</p>
          <div className="mt-3 grid border-y border-ink-900 sm:grid-cols-2 lg:grid-cols-4">
            {OPPORTUNITIES.map((o, i) => (
              <div key={o.name} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-slate-200 lg:pl-5" : ""} border-b border-slate-200 last:border-b-0 lg:border-b-0`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[#7A6344]">{o.sector}</span>
                  <span className="font-mono text-[9.5px] uppercase tracking-wide text-slate-600">{o.stage}</span>
                </div>
                <div className="mt-4 font-editorial text-[22px] font-semibold text-ink-900">{o.name}</div>
                <div className="mt-1 text-[10.5px] text-slate-600">Example listing &middot; {o.region}</div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-[11px]">
                  <div><div className="text-slate-600">Revenue band</div><div className="font-mono font-semibold text-ink-800">{o.rev}</div></div>
                  <div className="text-right"><div className="text-slate-600">EBITDA band</div><div className="font-mono font-semibold text-ink-800">{o.ebitda}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600"><Glyph name="lock" small /> Identity &amp; ask under NDA</span>
                  <a href="/console" className="text-[12px] font-semibold text-[#7A6344] hover:text-[#6A5539]">Request NDA &rarr;</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export const GlobalReach: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 10 · COVERAGE — global reach ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="grid items-stretch lg:grid-cols-[1.05fr_1.35fr]">
          <div className="relative flex items-center overflow-hidden px-5 py-12 sm:px-8 lg:px-12 lg:py-16" style={{ background: "linear-gradient(135deg,#0a2a52 0%,#05182f 60%,#081f3a 100%)" }}>
            <div aria-hidden className="w-full"><WorldDots /></div>
          </div>
          <div className="px-5 py-16 sm:px-8 lg:px-14 lg:py-20">
            <Chapter n={n}>{t("cov.eyebrow")}</Chapter>
            <h2 className={`${H2} mt-4 text-ink-900`}><Editorial text={t("cov.h2")} /></h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate-600">{t("cov.body", { g: MARKET_FMT.geographies })}<Note n={2} /></p>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {TOP_JURISDICTIONS.map(([code, n]) => (
                <span key={code} className="inline-flex items-baseline gap-1.5 border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-800">
                  {code} <span className="text-[9.5px] font-medium text-slate-600">{n} mandates</span>
                </span>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-slate-300 pt-8 sm:grid-cols-4">
              {GLOBAL_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-editorial text-[2.2rem] font-semibold leading-none tabular-nums text-ink-900">{s.value}</div>
                  <div className="mt-2 text-[12px] text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export const Governance: React.FC<{ n: string }> = ({ n }) => {
  const { t } = useI18n();
  return (
    <>
      {/* ===== 11 · GOVERNANCE & CONTROLS ===== */}
      <section data-ink className="ex-seam relative text-white" style={{ background: NAVY }}>
        <div className={`${WRAP} py-16`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Chapter n={n} dark>{t("gov.eyebrow")}</Chapter>
            <div className="text-[11.5px] text-[#E8E0D2]/60">{t("gov.note")}</div>
          </div>
          <div className="mt-8 grid grid-cols-1 border-y border-white/15 sm:grid-cols-2 lg:grid-cols-5">
            {GOVERNANCE.map((g, i) => (
              <div key={g.title} className={`py-6 pr-5 ${i > 0 ? "lg:border-l lg:border-white/10 lg:pl-5" : ""}`}>
                <span className="text-[#C9B08A]"><Glyph name={g.icon} /></span>
                <h3 className="mt-4 font-editorial text-[19px] font-semibold text-white">{t(g.title)}</h3>
                <p className="mt-1.5 text-[11.5px] leading-snug text-[#E8E0D2]/60">{t(g.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

// Cross-bid comparison instrument. Figures are an internally-consistent
// illustration of the desk's scoring; on a live process the same table runs
// against the founder's actual offers and reservation lines.
const OfferTable: React.FC = () => (
  <div className="overflow-hidden rounded-lg p-4 text-white" style={{ background: "linear-gradient(180deg, var(--ex-2), var(--ex-1))" }}>
    <div className="flex items-center justify-between">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Cross-Bid Comparison</div>
      <div className="text-[9px] uppercase tracking-wide text-white/35">scored vs reservation lines</div>
    </div>
    <table className="mt-3 w-full text-left text-[12px]">
      <thead className="text-white/45">
        <tr>{["Measure", "Buyer A", "Buyer B", "Buyer C"].map((h, i) => <th key={h} scope="col" className={`pb-2 font-semibold ${i === 0 ? "sr-only" : ""}`}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {[
          ["Upfront Cash", "$172M", "$190M", "$140M"],
          ["Earnout", "$22M", "—", "$31M"],
          ["Rollover", "$18M", "$25M", "—"],
          ["Total", "$212M", "$215M", "$171M"],
          ["Certainty-weighted", "$198M", "$209M", "$152M"],
          ["Desk score", "84 / 100", "91 / 100", "66 / 100"],
        ].map((r) => (
          <tr key={r[0]} className={"border-t border-white/5 " + (r[0] === "Total" || r[0] === "Desk score" ? "font-bold" : "")}>
            <td className="py-2 text-white/50">{r[0]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[1]}</td>
            <td className="py-2" style={r[0] === "Total" || r[0] === "Desk score" ? { color: "#7CFF9F" } : undefined}>{r[2]}</td>
            <td className="py-2" style={r[0] === "Total" ? { color: "#7CFF9F" } : undefined}>{r[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/40">
      Headline ≠ outcome. Every bid is weighted by structure, certainty and counterparty record — B leads on certainty despite A&rsquo;s earnout package.
    </div>
  </div>
);

const Vault: React.FC = () => (
  <svg viewBox="0 0 140 120" className="h-24 w-28">
    <rect x="34" y="22" width="72" height="76" rx="8" fill="#13355f" stroke="#58C6FF" strokeOpacity="0.5" />
    <rect x="42" y="30" width="56" height="60" rx="5" fill="#0c244a" />
    <circle cx="70" cy="60" r="16" fill="none" stroke="#58C6FF" strokeWidth="2.5" />
    <path d="M63 60l5 5 10-10" fill="none" stroke="#5AD1FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g stroke="#58C6FF" strokeOpacity="0.6" strokeWidth="2"><line x1="70" y1="40" x2="70" y2="46" /><line x1="70" y1="74" x2="70" y2="80" /><line x1="50" y1="60" x2="56" y2="60" /><line x1="84" y1="60" x2="90" y2="60" /></g>
  </svg>
);

// Global acquisition network — dot map with named regional hubs and animated
// acquisition-flow arcs connecting the regions.
// Equirectangular geomap: a dot grid masked to coarse continent polygons so all
// continents read (like a network world-map). [lon,lat] → SVG via project().
const MAP_W = 960, MAP_H = 480;
const project = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * MAP_W, ((90 - lat) / 180) * MAP_H];
const LANDMASS: [number, number][][] = [
  // North America
  [[-168,66],[-150,70],[-120,70],[-95,69],[-80,73],[-60,83],[-55,60],[-66,49],[-72,46],[-76,38],[-81,31],[-81,25],[-90,29],[-97,26],[-105,22],[-114,30],[-124,40],[-124,48],[-130,55],[-140,60],[-155,58],[-166,55]],
  // Greenland
  [[-46,60],[-22,70],[-30,82],[-50,82],[-58,76],[-54,68]],
  // South America
  [[-78,8],[-66,11],[-55,5],[-50,0],[-44,-3],[-40,-12],[-38,-23],[-48,-27],[-58,-35],[-66,-46],[-73,-53],[-75,-46],[-71,-33],[-76,-14],[-81,-5],[-80,2]],
  // Africa
  [[-16,15],[-6,24],[10,31],[20,33],[32,31],[44,11],[51,12],[43,-2],[40,-12],[33,-26],[25,-34],[18,-35],[12,-17],[9,4],[-8,5],[-16,15]],
  // Europe
  [[-10,43],[-5,38],[5,38],[12,38],[18,40],[26,40],[28,45],[42,46],[40,55],[30,60],[24,66],[12,64],[6,58],[2,51],[-5,49]],
  // Asia
  [[26,40],[30,46],[42,48],[48,52],[60,66],[80,73],[105,76],[140,73],[170,68],[180,64],[165,60],[155,52],[140,48],[130,42],[122,38],[120,30],[110,21],[105,9],[95,6],[88,21],[78,8],[72,18],[60,25],[50,30],[44,38],[36,36],[28,37]],
  // Australia
  [[114,-22],[124,-17],[133,-12],[142,-11],[146,-18],[150,-25],[153,-31],[148,-38],[138,-37],[129,-32],[118,-35],[114,-30]],
  // misc
  [[130,31],[140,38],[142,44],[138,40],[133,34]], // Japan
  [[166,-46],[174,-41],[178,-38],[172,-45]],        // NZ
  [[43,-25],[50,-15],[50,-22],[46,-26]],            // Madagascar
  [[95,2],[110,0],[120,-2],[120,-8],[105,-8],[98,-3]], // Indonesia
];
const inPoly = (x: number, y: number, poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const isLandLL = (lon: number, lat: number) => LANDMASS.some((p) => inPoly(lon, lat, p));
// regional hubs at real coordinates
const HUBS: { name: string; lon: number; lat: number }[] = [
  { name: "na", lon: -98, lat: 39 }, { name: "eu", lon: 9, lat: 50 }, { name: "me", lon: 45, lat: 26 },
  { name: "asia", lon: 110, lat: 30 }, { name: "sa", lon: -58, lat: -15 }, { name: "au", lon: 134, lat: -25 },
];
const FLOWS: [string, string][] = [
  ["na", "eu"], ["eu", "me"], ["me", "asia"], ["na", "asia"], ["eu", "asia"], ["sa", "na"], ["asia", "au"], ["na", "sa"],
];
// True when the visitor asked for reduced motion (OS setting); updates live.
const useReducedMotion = (): boolean => {
  const q = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = (): void => setReduce(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
};

const WorldDots: React.FC = () => {
  const reduce = useReducedMotion();
  const dots = React.useMemo(() => {
    const out: [number, number][] = [];
    for (let lat = 78; lat >= -56; lat -= 2.6) {
      for (let lon = -178; lon <= 180; lon += 2.6) {
        if (isLandLL(lon, lat)) { const [x, y] = project(lon, lat); out.push([x, y]); }
      }
    }
    return out;
  }, []);
  const hub = (n: string) => { const h = HUBS.find((x) => x.name === n)!; return project(h.lon, h.lat); };
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full">
      {dots.map(([x, y], i) => <rect key={i} x={x - 0.9} y={y - 0.9} width={1.8} height={1.8} fill="#5AD1FF" opacity={0.5} />)}
      {/* acquisition-flow arcs with travelling pulses */}
      {FLOWS.map(([a, b], i) => {
        const [x1, y1] = hub(a), [x2, y2] = hub(b);
        const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.16 - 24;
        const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#2E8BD6" strokeWidth="1.1" opacity="0.5" />
            {!reduce && <circle r="2.8" fill="#A8FFFF"><animateMotion dur={`${4 + (i % 4)}s`} repeatCount="indefinite" path={d} /></circle>}
          </g>
        );
      })}
      {HUBS.map((h, i) => { const [x, y] = project(h.lon, h.lat); return (
        <g key={i}><circle cx={x} cy={y} r="10" fill="#2E8BD6" opacity="0.22" /><circle cx={x} cy={y} r="3.4" fill="#A8FFFF" /></g>
      ); })}
    </svg>
  );
};

