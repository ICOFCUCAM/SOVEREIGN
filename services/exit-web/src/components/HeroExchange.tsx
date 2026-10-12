import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { Arrow } from "./MarketingChrome";
import { Dial, INSTRUMENT_CSS, OutcomeIndicator, PolarMap } from "./HeroInstrument";

// 01 · THE HERO (owner brief HX1; final colour, signature and benchmark HX2).
// Built to the owner's benchmark image: warm porcelain on the left falling
// through neutral warm greys into mineral graphite on the right, with no
// seam; the ExitOS insignia opened into a full instrument — dotted bezel,
// graduated ring, market rings, a lit aperture wedge, registration orbs and
// the ice-white transaction node — centred at three-quarters across; the
// ivory wordmark beneath it; a charcoal capability rail with bronze-ringed
// icons. Geometry is measured from the benchmark (outer bezel = 245 units).
// The orbs and points are decoration, not data. Phones stack the two halves.
// HX6: the instrument (HeroInstrument.tsx) is composed at first paint and
// moves only slowly — turning rings, a faint sweep, a signal sequence, the
// outcome indicator and the polar map behind the signature.

// line icons for the capability rail, drawn inside bronze rings (benchmark)
const ICONS: ReadonlyArray<React.ReactNode> = [
  <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="12" cy="12" r=".9" fill="currentColor" /><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5" /></>,
  <><circle cx="12" cy="6.5" r="2.4" /><circle cx="6" cy="17" r="2.4" /><circle cx="18" cy="17" r="2.4" /><path d="M10.9 8.6 7.2 14.9M13.1 8.6l3.7 6.3M8.4 17h7.2" /></>,
  <><path d="M6 3h8.5L18 6.5V21H6z" /><path d="M14 3v4h4M8.5 11h7M8.5 14h7M8.5 17h4.5" /></>,
  <><path d="M5 20h14" /><path d="M6.5 19v-5h3v5zM10.5 19v-8h3v8zM14.5 19V6h3v13z" /></>,
  <><path d="M6.5 21V3.5" /><path d="M6.5 4.5h11l-2.8 3.8 2.8 3.8h-11" /></>,
];

// porcelain → graphite, measured from the benchmark: neutral warm greys, no tan, no seam
const FALL = "linear-gradient(90deg, #F8F4EE 0%, #F4EFE8 24%, #EDE6DD 31%, #DDD4CA 37%, #C9C0B6 40.5%, #B0A89F 43.5%, #958F86 46.9%, #7C7770 50%, #63605A 53%, #4E4C47 56%, #3F3D3A 59%, #33322F 62.5%, #2A2927 65.6%, #242422 68.75%, #1F1F1D 72%, #1A1A18 80%, #161614 100%)";
const FALL_Y = "radial-gradient(circle at 50% 42%, rgba(160,136,100,0.08), transparent 40%), linear-gradient(180deg, #F8F4EE 0, #E2D8CE 30px, #AEA59A 70px, #6D6964 110px, #2A2927 160px, #1C1C1A 220px, #161614 100%)";
// the warm haze around the dial and the light leak at lower left of the dark (desktop)
const HAZE = "radial-gradient(circle at 74.5% 41%, rgba(166,142,104,0.05), transparent 22%), radial-gradient(ellipse 18% 22% at 59% 82%, rgba(214,196,168,0.09), transparent 70%), radial-gradient(ellipse 60% 70% at 8% 10%, #FCFAF6, transparent 70%)";
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const HeroExchange: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  const [cap, setCap] = React.useState<number | null>(null);
  // depth on pointer (HX4): the dial's layers shift a few pixels against each other as the pointer moves over
  // the hero — desktop pointers only, never under reduced motion; written as CSS variables, no re-render
  const hero = React.useRef<HTMLElement>(null);
  const raf = React.useRef(0);
  const depth = React.useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches, []);
  const onMove = (e: React.PointerEvent): void => {
    const el = hero.current; if (!depth || !el) return;
    const r = el.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width * 0.745)) / (r.width * 0.3)));
    const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (r.height * 0.5)));
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => { el.style.setProperty("--px", px.toFixed(3)); el.style.setProperty("--py", py.toFixed(3)); });
  };
  const onLeave = (): void => { const el = hero.current; if (!el) return; cancelAnimationFrame(raf.current); el.style.setProperty("--px", "0"); el.style.setProperty("--py", "0"); };
  // the instrument rests while the page is hidden or the hero is scrolled away (a data attribute, no re-render)
  React.useEffect(() => {
    const el = hero.current; if (!el) return;
    let seen = true;
    const sync = (): void => { if (document.hidden || !seen) el.setAttribute("data-hx-paused", ""); else el.removeAttribute("data-hx-paused"); };
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); });
    io?.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io?.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);
  const labels = [1, 2, 3, 4, 5].map((k) => t(`hx.s${k}`));
  return (
    <section ref={hero} onPointerMove={onMove} onPointerLeave={onLeave} id="ch-01" aria-labelledby="hx-h" className="relative isolate flex flex-col overflow-hidden bg-[#F8F4EE]">
      <div className="hx-grid relative grid lg:min-h-[max(560px,min(41.25vw,780px))] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]">
        {/* the field (desktop) is this grid's own background (.hx-grid): one fall-off across the hero, the
            dial's warm haze, a light leak at lower left; a fine grain over the dark */}
        <span aria-hidden className="absolute inset-0 -z-10 hidden opacity-[0.03] mix-blend-screen lg:block" style={{ backgroundImage: GRAIN, maskImage: "linear-gradient(90deg, transparent 45%, #000 62%)", WebkitMaskImage: "linear-gradient(90deg, transparent 45%, #000 62%)" }} />

        {/* the editorial page */}
        <div className="relative z-10 flex items-center">
          <div className="w-full px-5 py-12 sm:px-8 sm:py-20 lg:py-14 lg:pl-[max(4.5rem,calc((100vw-1480px)/2+3.5rem))] lg:pr-[clamp(1.5rem,3vw,3.5rem)]">
            <p className="flex items-center gap-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1F1F1E] sm:text-[11.5px] xl:tracking-[0.28em]">
              <span aria-hidden className="h-px w-10 bg-ex-bronze" />{t("hx.eyebrow")}
            </p>
            <h1 id="hx-h" className="mt-8 max-w-[9.4em] font-editorial text-[clamp(2.7rem,4.6vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.032em] text-[#15171A] [font-feature-settings:'kern','liga','calt'] [font-kerning:normal] [text-wrap:balance] lg:-ml-[0.04em]">
              {t("hx.h1")}{" "}
              <em className="mt-[0.04em] block font-medium italic tracking-[-0.025em] text-[#9A7E56]">{t("hx.h1em")}</em>
            </h1>
            <p className="mt-8 max-w-[36rem] text-[16px] leading-[1.65] text-[#3D3F41] sm:text-[17px]">{t("hx.body")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3.5">
              <button onClick={() => nav("/platform")}
                className="group inline-flex items-center gap-6 rounded-[3px] bg-[#15181C] px-7 py-[17px] text-[14.5px] font-medium text-white transition duration-300 hover:bg-[#2A2D30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F4EE] motion-reduce:transition-none">
                {t("hx.explore")} <Arrow />
              </button>
              <a href="#ch-04" className="group inline-flex items-center gap-6 rounded-[3px] border border-[#CFC8BD] bg-white/40 px-6 py-[16px] text-[14.5px] font-medium text-[#1B1B1B] transition-colors duration-300 hover:border-[#9C8058] hover:bg-white/70 motion-reduce:transition-none">
                {t("bar.value")} <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none">↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* the signature: the insignia's instrument and the wordmark */}
        <div aria-hidden className="hx-sig relative flex flex-col items-center justify-center pb-12 pt-20 sm:pb-16 lg:pb-[3.5%] lg:pt-[1.5%]">
          <div className="relative flex flex-col items-center">
            <div className="h-[min(78vw,330px)] w-[min(78vw,330px)] sm:h-[420px] sm:w-[420px] lg:h-[min(29.4vw,540px)] lg:w-[min(29.4vw,540px)]"><Dial active={cap} onPoint={setCap} labels={labels} /></div>
            {/* the signature, over the polar map */}
            <div className="relative flex flex-col items-center" style={{ fontSize: "clamp(3rem, 5.4vw, 6rem)" }}>
              <PolarMap className="left-1/2 top-[42%] h-[3.1em] w-[3.1em] -translate-x-1/2 -translate-y-1/2" />
              <div className="relative mt-[0.05em] font-editorial font-medium leading-none tracking-[-0.025em] text-transparent"
                style={{ backgroundImage: "linear-gradient(180deg, #F2E9DA 0%, #DCCDB3 50%, #B39E7E 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", filter: "drop-shadow(0 0 22px rgba(232,220,200,0.14))" }}>
                Exit<span className="italic">OS</span>
              </div>
              <div className="relative mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ECE5D8] sm:text-[11px]">
                <span className="h-px w-12 bg-[#E3DCCF]/55 sm:w-16" />The acquisition exchange<span className="h-px w-12 bg-[#E3DCCF]/55 sm:w-16" />
              </div>
            </div>
          </div>

          {/* the vertical note and the outcome indicator beside it */}
          <div className="absolute bottom-[16%] right-[84px] hidden items-stretch gap-5 xl:flex">
            <OutcomeIndicator />
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#E3DCCF]/70" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("hx.note")}</span>
          </div>
        </div>
      </div>

      {/* the capability rail: charcoal, bronze-ringed icons */}
      <div className="relative border-t border-white/[0.06] text-[#EDE7DC]" style={{ backgroundImage: "linear-gradient(180deg, #1B1B19, #151614)" }}>
        <ul aria-label={t("hx.strip")} className="mx-auto grid w-full max-w-[1640px] px-5 sm:px-8 lg:grid-cols-5 lg:px-[max(1.5rem,calc((100vw-1640px)/2+1.5rem))] xl:px-[max(4.5rem,calc((100vw-1640px)/2+2rem))]">
          {[1, 2, 3, 4, 5].map((k, i) => (
            <li key={k} onMouseEnter={() => setCap(i)} onMouseLeave={() => setCap(null)} className={`group relative flex items-center gap-4 py-3.5 lg:items-start lg:py-7 lg:pr-4 ${i ? "border-t border-white/[0.07] lg:border-l lg:border-t-0 lg:pl-5 xl:pl-6" : "lg:pl-0"}`}>
              <span aria-hidden className={`absolute inset-x-0 top-0 hidden h-px origin-left bg-ex-bronze transition-transform duration-500 motion-reduce:transition-none lg:block ${cap === i ? "scale-x-100" : "scale-x-0"}`} />
              <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-ex-bronze transition-[border-color,box-shadow] duration-300 lg:h-14 lg:w-14 ${cap === i ? "border-ex-bronze shadow-[0_0_18px_rgba(180,154,117,0.35)]" : "border-ex-bronze/60"}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-7 lg:w-7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{ICONS[i]}</svg>
              </span>
              <span className="flex min-w-0 items-baseline gap-3 lg:block">
                <span className="font-mono text-[10.5px] tracking-[0.45em] text-[#EDE7DC]/75 lg:block">{String(k).padStart(2, "0")}</span>
                <span className="block font-editorial text-[16.5px] font-medium leading-snug lg:mt-1.5 lg:text-[16px] min-[1500px]:text-[18.5px]">{t(`hx.s${k}`)}</span>
                <span className="sr-only max-w-[26ch] text-[13.5px] leading-[1.5] text-[#B3ADA4] xl:not-sr-only xl:mt-2 xl:block">{t(`hx.s${k}d`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .hx-sig{background:${FALL_Y}}
        @media (min-width:1024px){
          .hx-grid{background:${HAZE}, ${FALL}}
          .hx-sig{background:none}
        }
        ${INSTRUMENT_CSS}
      `}</style>
    </section>
  );
};

export default HeroExchange;
