import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MarketingChrome, Arrow } from "../components/MarketingChrome";
import { CommandBoard } from "./Landing";
import { MARKET_FMT, HISTORY_FMT } from "../lib/market-stats";
import { MARKET_INDEX_FMT } from "../lib/market-index";
import { useI18n } from "../lib/i18n";

// HERO LAB — development-only preview of four hero concepts for the owner to
// choose from (/hero-lab?v=1…4; not routed in production builds). The board
// is the homepage's own `CommandBoard` with the same bezel and ribbon markup;
// only its staging differs. Nothing here replaces the live homepage.

const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";
const NAVY = "linear-gradient(135deg,#06182E 0%,#0A1F3A 60%,#0B2547 100%)";
const BTN = "inline-flex items-center gap-5 px-5 py-3.5 text-[12px] font-semibold transition";
const DATA_AS_OF = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const heroLines = (s: string): string[] =>
  s.split("\n").map((l, i) => (l === l.toUpperCase() ? (i === 0 ? l.charAt(0) + l.slice(1).toLowerCase() : l.toLowerCase()) : l));

const KEYFRAMES = `
  @keyframes exTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes exScan{0%{transform:translateY(-100%);opacity:0}8%{opacity:1}50%{opacity:.5}92%{opacity:1}100%{transform:translateY(2000%);opacity:0}}
  @keyframes exFlash{0%,100%{background:transparent}50%{background:rgba(96,165,250,.10)}}
`;

/** The exchange display exactly as on the homepage: bezel, ribbon, board. */
const Display: React.FC<{ mount?: "3d" | "flat"; reflection?: boolean }> = ({ mount = "flat", reflection = true }) => (
  <div style={mount === "3d" ? { perspective: "2000px" } : undefined}>
    <div className="relative">
      <div className={`${mount === "3d" ? "ex-bezel " : ""}relative rounded-[20px] p-2.5`}
        style={{ background: "linear-gradient(145deg,#1c2c44,#0a1626)", boxShadow: "0 28px 48px -30px rgba(8,20,40,0.32), 0 10px 22px -18px rgba(8,20,40,0.26), inset 0 1px 0 rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="mb-1.5 flex items-center justify-between gap-3 rounded-md bg-black/25 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">ExitOS Acquisition Exchange</span>
            <span className="hidden items-center gap-1 rounded-sm bg-emerald-400/15 px-1.5 py-0.5 sm:inline-flex">
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live Market</span>
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:inline">{MARKET_FMT.activeMandates} mandates deploying · {MARKET_FMT.appetite} capacity · data as of {DATA_AS_OF}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/40">System Status</span>
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live</span>
          </div>
        </div>
        <CommandBoard />
      </div>
      {reflection && (
        <div aria-hidden className={`${mount === "3d" ? "ex-reflection " : ""}pointer-events-none absolute inset-x-0 top-full hidden h-28 overflow-hidden lg:block`}
          style={{ opacity: 0.07, filter: "blur(4px)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)", background: "linear-gradient(180deg,#0a1626,#08203B)", transform: mount === "flat" ? "scaleY(-1)" : undefined }} />
      )}
    </div>
  </div>
);

const useHero = () => {
  const { t } = useI18n();
  const nav = useNavigate();
  const proof: Array<[string, string]> = [
    [MARKET_INDEX_FMT.events, t("ribbon.deals")], [MARKET_FMT.buyers, t("ribbon.mandates")],
    [HISTORY_FMT.disclosedValue, t("ribbon.value")], [MARKET_FMT.activeMandates, t("ribbon.deploying")],
  ];
  return { t, nav, h1: heroLines(t("hero.h1")), proof };
};

/* ── 1 · THE TRADING HALL — the board mounted in the exchange hall ─────── */
const HeroHall: React.FC = () => {
  const { t, nav, h1, proof } = useHero();
  return (
    <section className="relative overflow-hidden border-b border-slate-200">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/command-center.png)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 from-10% via-white/60 via-40% to-white/0" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef2f7] via-[#eef2f7]/70 to-transparent" />
      <div className={`${WRAP} relative grid min-h-[820px] items-center gap-10 py-16 lg:grid-cols-[0.85fr_1.35fr]`}>
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-slate-600">{t("hero.eyebrow")}</div>
          <h1 className="mt-6 font-editorial text-[clamp(3.2rem,5.6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-ink-900">
            {h1.map((l, i) => <span key={i} className={`block ${i === h1.length - 1 ? "italic text-blue-600" : ""}`}>{l}</span>)}
          </h1>
          <p className="mt-8 max-w-md font-editorial text-[21px] leading-snug text-ink-900">{t("hero.sub")}</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white hover:bg-ink-800`}>{t("nav.access")} <Arrow /></button>
            <button onClick={() => nav("/pricing")} className={`${BTN} border border-ink-900 bg-white/70 text-ink-900`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
          </div>
        </div>
        <div className="min-w-0 lg:translate-x-16"><Display mount="3d" /></div>
      </div>
      <div className={`${WRAP} relative flex flex-wrap gap-x-10 gap-y-3 border-t border-slate-300/80 py-5`}>
        {proof.map(([v, l]) => <div key={l} className="flex items-baseline gap-2"><span className="font-mono text-[16px] font-bold text-ink-900">{v}</span><span className="text-[12px] text-slate-600">{l}</span></div>)}
      </div>
    </section>
  );
};

/* ── 2 · NIGHT EXCHANGE — centre stage, the board as the lit instrument ── */
const HeroNight: React.FC = () => {
  const { t, nav, h1, proof } = useHero();
  return (
    <section className="relative overflow-hidden text-white" style={{ background: NAVY }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(120,170,255,0.6) 0 1px, transparent 1px 120px), repeating-linear-gradient(0deg, rgba(120,170,255,0.4) 0 1px, transparent 1px 120px)", maskImage: "radial-gradient(ellipse at 50% 30%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, #000, transparent 75%)" }} />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[52%] h-[420px] w-[80%] -translate-x-1/2 rounded-[50%] opacity-40 blur-[120px]" style={{ background: "radial-gradient(ellipse at center, rgba(56,130,246,0.45), transparent 70%)" }} />
      <div className={`${WRAP} relative pb-28 pt-16 text-center lg:pt-20`}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-blue-300">{t("hero.eyebrow")}</div>
        <h1 className="mx-auto mt-6 max-w-[14ch] font-editorial text-[clamp(3rem,6.6vw,7rem)] font-semibold leading-[0.9] tracking-[-0.045em]">
          {h1.map((l, i) => <span key={i} className={i === h1.length - 1 ? "italic text-blue-300" : ""}>{l}{i < h1.length - 1 ? " " : ""}</span>)}
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-blue-100/80">{t("hero.sub")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <button onClick={() => nav("/console")} className={`${BTN} bg-white text-ink-900 hover:bg-blue-50`}>{t("nav.access")} <Arrow /></button>
          <button onClick={() => nav("/pricing")} className={`${BTN} border border-white/60 text-white hover:bg-white hover:text-ink-900`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
        </div>
        <div className="mx-auto mt-16 max-w-[1180px] text-left"><Display mount="flat" /></div>
        <div className="mx-auto mt-20 grid max-w-[1180px] grid-cols-2 border-t border-white/15 pt-6 text-left sm:grid-cols-4">
          {proof.map(([v, l]) => <div key={l} className="py-2"><div className="font-editorial text-[2rem] font-semibold leading-none">{v}</div><div className="mt-2 text-[12px] text-blue-100/70">{l}</div></div>)}
        </div>
      </div>
    </section>
  );
};

/* ── 3 · FRONT PAGE — the board as the broadsheet's plate ─────────────── */
const HeroFrontPage: React.FC = () => {
  const { t, nav, h1, proof } = useHero();
  return (
    <section className="border-b border-slate-200 bg-[#f6f8fb]">
      <div className={`${WRAP} pb-16 pt-8`}>
        <div className="border-t-4 border-double border-ink-900 pt-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-900 pb-2 font-mono text-[11px] text-slate-600">
            <span>{t("hero.eyebrow")}</span>
            <span className="font-editorial text-[22px] font-semibold uppercase tracking-[0.08em] text-ink-900">The ExitOS Ledger</span>
            <span>Registry edition · {MARKET_INDEX_FMT.asOf}</span>
          </div>
        </div>
        <h1 className="mt-8 font-editorial text-[clamp(3.2rem,8.4vw,9rem)] font-semibold leading-[0.86] tracking-[-0.05em] text-ink-900">
          {h1.map((l, i) => <span key={i} className={`${i === h1.length - 1 ? "italic text-blue-600" : ""}`}>{l}{i < h1.length - 1 ? " " : ""}</span>)}
        </h1>
        <div className="mt-10 grid gap-10 border-t border-ink-900 pt-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2.25fr)]">
          <div className="min-w-0 lg:border-r lg:border-slate-300 lg:pr-8">
            <p className="text-[17px] leading-relaxed text-ink-800 first-letter:float-left first-letter:mr-2 first-letter:font-editorial first-letter:text-[4rem] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-blue-700">{t("hero.sub")} {t("hero.body")}</p>
            <dl className="mt-8 border-t border-slate-300">
              {proof.map(([v, l]) => <div key={l} className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-2.5"><dt className="text-[12.5px] text-slate-600">{l}</dt><dd className="font-mono text-[15px] font-bold text-ink-900">{v}</dd></div>)}
            </dl>
            <div className="mt-8 flex flex-col gap-2.5">
              <button onClick={() => nav("/console")} className={`${BTN} justify-between bg-ink-900 text-white`}>{t("nav.access")} <Arrow /></button>
              <button onClick={() => nav("/pricing")} className={`${BTN} justify-between border border-ink-900 text-ink-900`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
            </div>
          </div>
          <figure className="min-w-0">
            <Display mount="flat" reflection={false} />
            <figcaption className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-300 pt-3 text-[12.5px] text-slate-600">
              <span><span className="font-semibold text-ink-900">Fig. 1</span> — The acquisition exchange: strategic buyers, disclosed transactions and sector demand.</span>
              <span className="font-mono">Registry snapshot · {MARKET_INDEX_FMT.asOf}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

/* ── 4 · THE MONOLITH — split page, the board crossing the divide ─────── */
const HeroMonolith: React.FC = () => {
  const { t, nav, h1, proof } = useHero();
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[52%] lg:block" style={{ background: NAVY }}>
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-luminosity" style={{ backgroundImage: "url(/command-center.png)" }} />
      </div>
      <div className={`${WRAP} relative grid min-h-[820px] items-center gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div className="min-w-0 lg:pr-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-blue-600">{t("hero.eyebrow")}</div>
          <h1 className="mt-6 font-editorial text-[clamp(3.2rem,5.4vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-ink-900">
            {h1.map((l, i) => <span key={i} className={`block ${i === h1.length - 1 ? "italic text-blue-600" : ""}`}>{l}</span>)}
          </h1>
          <p className="mt-8 max-w-md text-[16px] leading-relaxed text-ink-800">{t("hero.sub")}</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <button onClick={() => nav("/console")} className={`${BTN} bg-ink-900 text-white`}>{t("nav.access")} <Arrow /></button>
            <button onClick={() => nav("/pricing")} className={`${BTN} border border-ink-900 text-ink-900`}>{t("hero.deploy")} <span aria-hidden>↗</span></button>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-px border-y border-ink-900 bg-slate-200">
            {proof.map(([v, l]) => <div key={l} className="bg-white py-4 pr-3"><dd className="font-editorial text-[1.9rem] font-semibold leading-none text-ink-900">{v}</dd><dt className="mt-1.5 text-[12px] text-slate-600">{l}</dt></div>)}
          </dl>
        </div>
        <div className="relative min-w-0 lg:-ml-20"><Display mount="3d" reflection={false} /></div>
      </div>
    </section>
  );
};

const VARIANTS: Record<string, React.FC> = { "1": HeroHall, "2": HeroNight, "3": HeroFrontPage, "4": HeroMonolith };

const HeroLab: React.FC = () => {
  const [params] = useSearchParams();
  const V = VARIANTS[params.get("v") ?? "1"] ?? HeroHall;
  return (
    <MarketingChrome active="home">
      <style>{KEYFRAMES}</style>
      <V />
    </MarketingChrome>
  );
};

export default HeroLab;
