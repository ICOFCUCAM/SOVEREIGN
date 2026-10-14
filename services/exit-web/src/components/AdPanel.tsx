import React, { useEffect, useRef, useState } from "react";
import type { Remote } from "../lib/documents/store";
import { loadSlides, recordAd, local, DEFAULT_SETTINGS, type AdSettings, type AdStage, type Slide } from "../lib/ads";
import waterfrontSkyline from "../assets/desk/waterfront-skyline-720.webp";

// ── PROMOTIONS PANEL ────────────────────────────────────────────────
// The listing desk's sidebar canvas: a slow crossfading slideshow of the operator's live campaigns
// (their own products, such as Sovereign Dispatch). It never takes focus on its own, never blocks
// the form, pauses while a pointer or keyboard is on it, stays still for reduced motion, and counts
// an impression only when a slide is actually on screen. With no live campaign it shows the desk's
// own quiet panel — never an empty box, never invented content.

type Variant = "rail" | "compact";

/** Live slides for a stage, loaded once; failures resolve to none. */
export function useAdSlides(remote: Remote | undefined, stage: AdStage, mobile = false): { slides: Slide[] | null; settings: AdSettings } {
  const [state, setState] = useState<{ slides: Slide[] | null; settings: AdSettings }>({ slides: null, settings: DEFAULT_SETTINGS });
  const key = `${remote?.url ?? "local"}|${remote?.accessToken ?? ""}|${stage}|${mobile}`;
  useEffect(() => {
    let live = true;
    void loadSlides(remote, stage, mobile).then((x) => { if (live) setState(x); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key covers remote, stage and placement
  }, [key]);
  return state;
}

const prefersReducedMotion = (): boolean => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

interface Props {
  readonly slides: Slide[] | null;            // null while loading
  readonly settings: AdSettings;
  readonly variant?: Variant;
  readonly remote?: Remote;                   // where impressions and clicks are counted
  readonly preview?: boolean;                 // the admin preview: counts nothing
  readonly className?: string;
}

export const AdPanel: React.FC<Props> = ({ slides, settings, variant = "rail", remote, preview = false, className = "" }) => {
  const list = slides ?? [];
  const [at, setAt] = useState(0);
  const reduced = useRef(prefersReducedMotion());
  const [playing, setPlaying] = useState(!reduced.current);
  const [held, setHeld] = useState(false);            // pointer over it or focus inside it
  const [onScreen, setOnScreen] = useState(false);
  const box = useRef<HTMLElement>(null);
  const counted = useRef(new Set<string>());
  const i = list.length ? at % list.length : 0;
  const current = list[i];

  // a new set of slides starts at the first
  const ids = list.map((s) => s.campaign.id).join(",");
  useEffect(() => { setAt(0); }, [ids]);

  // rotation: only with more than one slide, while playing and not held
  useEffect(() => {
    if (list.length < 2 || !playing || held) return;
    const t = window.setInterval(() => setAt((x) => x + 1), Math.max(4, settings.rotation_seconds) * 1000);
    return () => window.clearInterval(t);
  }, [list.length, playing, held, settings.rotation_seconds]);

  // visible = at least half on screen (a panel hidden on small screens is never counted)
  useEffect(() => {
    const el = box.current; if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e && e.isIntersecting && e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el); return () => io.disconnect();
  }, [list.length]);

  // one impression per campaign per visit, when it is really shown
  useEffect(() => {
    if (preview || !current || !onScreen || document.visibilityState !== "visible") return;
    const id = current.campaign.id; if (counted.current.has(id)) return;
    counted.current.add(id);
    if (remote) recordAd(remote, id, "impression"); else local.record(id, "impression");
  }, [current, onScreen, preview, remote]);

  const click = (id: string): void => { if (!preview) { if (remote) recordAd(remote, id, "click"); else local.record(id, "click"); } };
  const go = (d: number): void => setAt((x) => (x + d + list.length) % list.length);
  const hold = {
    onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false),
    onFocus: () => setHeld(true), onBlur: (e: React.FocusEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false); },
  };
  const fade = reduced.current ? "" : "transition-opacity duration-[1100ms] ease-out";

  if (variant === "compact") {
    if (!current) return null;   // small screens: no house panel, nothing above or between the form
    const c = current.campaign;
    return (
      <section ref={box} aria-roledescription="carousel" aria-label="Promotions" {...hold}
        className={`overflow-hidden rounded-[16px] border border-[#E6D9C2] bg-[#14120E] text-ex-ivory shadow-[0_20px_40px_-28px_rgba(40,30,10,0.7)] ${className}`}>
        <div className="flex">
          {current.image && <img src={current.image} alt={c.image_alt ?? ""} className="h-auto w-[34%] shrink-0 object-cover" style={{ objectPosition: `${c.focal_x}% ${c.focal_y}%` }} />}
          <div className="min-w-0 flex-1 px-4 py-3.5" aria-live={playing && !held ? "off" : "polite"}>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#D9B676]">{c.eyebrow ?? "Promotion"}</p>
            <p className="mt-1 font-display text-[19px] leading-[1.15] text-white">{c.headline}</p>
            {c.cta_url && c.cta_label && <a href={c.cta_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => click(c.id)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#E2C07F] underline-offset-4 hover:underline">{c.cta_label} <span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
          </div>
        </div>
        {list.length > 1 && <Dots n={list.length} i={i} onPick={setAt} className="justify-end px-3 pb-2.5" />}
      </section>
    );
  }

  return (
    <section ref={box} aria-roledescription="carousel" aria-label={current ? "Promotions" : "About the listing desk"} {...hold}
      className={`relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden text-ex-ivory ${className}`}>
      {/* the pictures, stacked; only the current one is visible and exposed */}
      {current ? list.map((s, k) => (
        <div key={s.campaign.id} aria-hidden={k !== i || undefined} className={`absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] ${fade} ${k === i ? "opacity-100" : "opacity-0"}`}>
          {s.image
            ? <img src={s.image} alt={k === i ? s.campaign.image_alt ?? "" : ""} loading={k === i ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" style={{ objectPosition: `${s.campaign.focal_x}% ${s.campaign.focal_y}%` }} />
            : <div className="h-full w-full bg-[radial-gradient(120%_80%_at_70%_20%,#3A2F1C_0%,#0B0A08_70%)]" />}
        </div>
      )) : (
        <img src={waterfrontSkyline} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[40%_60%] [mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_30%)]" />
      )}
      {/* legibility: the rail's black melts into the picture at the top; the words sit on a deep fade */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,10,8,0)_16%,rgba(11,10,8,0.6)_36%,rgba(11,10,8,0.9)_54%,#0B0A08_100%)]" />

      <div className="px-7 pb-6 pt-24">
        {current ? (
          <div className="grid">
            {list.map((s, k) => {
              const c = s.campaign, here = k === i;
              return (
                <div key={c.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${list.length}`} aria-hidden={!here || undefined}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inert is a valid attribute React 18 does not type
                  {...({ inert: here ? undefined : "" } as any)}
                  className={`col-start-1 row-start-1 ${fade} ${here ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#E2C07F] [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
                    <span>{c.eyebrow ?? "From the portfolio"}</span>
                  </p>
                  <h2 className="mt-3 font-display text-[31px] font-medium leading-[1.08] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)] [text-wrap:balance]">{c.headline}</h2>
                  {c.body && <p className="mt-3 text-[13px] leading-[1.6] text-ex-ivory/70">{c.body}</p>}
                  {c.cta_url && c.cta_label && (
                    <a href={c.cta_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => click(c.id)} tabIndex={here ? undefined : -1}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#C9A86A]/60 bg-white/[0.04] px-4 py-2 text-[12.5px] font-semibold text-[#F1DDB0] backdrop-blur transition hover:border-[#E2C07F] hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2C07F]">
                      {c.cta_label} <span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  <p className="mt-4 text-[10.5px] text-ex-ivory/40">Promotion{c.attribution ? ` · ${c.attribution}` : ""}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D9B676]">ExitOS · Listing desk</p>
            <p className="mt-3 font-display text-[29px] font-medium leading-[1.1] text-white">Prepared in private. Shown to buyers on your terms.</p>
            <p className="mt-3 text-[13px] leading-[1.6] text-ex-ivory/65">Buyers see an anonymised listing. Your company's name stays undisclosed until the NDA and disclosure conditions are met.</p>
          </div>
        )}

        {list.length > 1 && (
          <div className="mt-6 flex items-center gap-3">
            <Dots n={list.length} i={i} onPick={setAt} />
            <span className="ml-auto flex items-center gap-1">
              <Ctl label="Previous promotion" onClick={() => go(-1)}><path d="M7.5 2.5 4 6l3.5 3.5" /></Ctl>
              <Ctl label={playing ? "Pause the slideshow" : "Play the slideshow"} onClick={() => setPlaying((p) => !p)}>
                {playing ? <path d="M4.5 3v6M7.5 3v6" /> : <path d="M4 2.5v7L9.5 6 4 2.5Z" />}
              </Ctl>
              <Ctl label="Next promotion" onClick={() => go(1)}><path d="M4.5 2.5 8 6 4.5 9.5" /></Ctl>
            </span>
          </div>
        )}
        <p className="sr-only" aria-live={playing && !held ? "off" : "polite"}>{current ? `Promotion ${i + 1} of ${list.length}: ${current.campaign.headline}` : ""}</p>
      </div>
    </section>
  );
};

const Dots: React.FC<{ n: number; i: number; onPick: (k: number) => void; className?: string }> = ({ n, i, onPick, className = "" }) => (
  <span className={`flex items-center gap-1.5 ${className}`}>
    {Array.from({ length: n }, (_, k) => (
      <button key={k} type="button" onClick={() => onPick(k)} aria-label={`Show promotion ${k + 1} of ${n}`} aria-current={k === i || undefined}
        className="grid h-6 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2C07F]">
        <span aria-hidden className={`block h-[3px] rounded-full transition-all ${k === i ? "w-6 bg-[#E2C07F]" : "w-2.5 bg-white/30 hover:bg-white/55"}`} />
      </button>
    ))}
  </span>
);

const Ctl: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className="grid h-7 w-7 place-items-center rounded-full text-ex-ivory/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2C07F]">
    <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  </button>
);
