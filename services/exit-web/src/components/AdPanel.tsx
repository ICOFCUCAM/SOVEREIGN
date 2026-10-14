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
        className={`overflow-hidden rounded-[16px] bg-desk-rail text-desk-ivory ${className}`}>
        <LinkOrDiv c={c} onClick={() => click(c.id)} className="flex">
          {(current.image || current.video) && <div className="relative min-h-[104px] w-[34%] shrink-0"><SlideMedia slide={current} here still={reduced.current} /></div>}
          <div className="min-w-0 flex-1 px-4 py-3.5" aria-live={playing && !held ? "off" : "polite"}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-desk-ivory/50">Promotion{c.eyebrow ? <span className="text-desk-champagne"> · {c.eyebrow}</span> : null}</p>
            <p className="mt-1 font-display text-[19px] leading-[1.15] text-desk-ivory">{c.headline}</p>
            {c.cta_url && c.cta_label && <span aria-hidden className="mt-2 inline-flex min-h-[28px] items-center gap-1 text-[12.5px] font-semibold text-desk-champagne">{c.cta_label} <span aria-hidden>↗</span></span>}
          </div>
        </LinkOrDiv>
        {list.length > 1 && <Dots n={list.length} i={i} onPick={setAt} className="justify-end px-3 pb-2.5" />}
      </section>
    );
  }

  return (
    <section ref={box} aria-roledescription="carousel" aria-label={current ? "Promotions" : "About the listing desk"} {...hold}
      className={`group/ad relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden text-desk-ivory ${className}`}>
      {/* the pictures, stacked; only the current one is visible and exposed */}
      {current ? list.map((s, k) => (
        <div key={s.campaign.id} aria-hidden={k !== i || undefined} className={`absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] ${fade} ${k === i ? "opacity-100" : "opacity-0"}`}>
          <SlideMedia slide={s} here={k === i} still={reduced.current} />
        </div>
      )) : (
        <img src={waterfrontSkyline} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[40%_60%] [mask-image:linear-gradient(180deg,transparent_0%,#000_30%)] [-webkit-mask-image:linear-gradient(180deg,transparent_0%,#000_30%)]" />
      )}
      {/* legibility: the rail's black melts into the picture at the top; the words sit on a deep fade */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(16,14,11,0)_16%,rgba(16,14,11,0.6)_36%,rgba(16,14,11,0.9)_54%,#100E0B_100%)]" />

      {/* the whole slide is the link: picture and words open the campaign's destination */}
      {current?.campaign.cta_url && (
        <a key={current.campaign.id} href={current.campaign.cta_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => click(current.campaign.id)}
          aria-label={`${current.campaign.headline}${current.campaign.cta_label ? ` · ${current.campaign.cta_label}` : ""} (promotion, opens in a new tab)`}
          className="peer absolute inset-0 z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-desk-champagne/70" />
      )}
      <div className="pointer-events-none relative z-[2] px-7 pb-6 pt-24">
        {current ? (
          <div className="grid">
            {list.map((s, k) => {
              const c = s.campaign, here = k === i;
              return (
                <div key={c.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${list.length}`} aria-hidden={!here || undefined}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inert is a valid attribute React 18 does not type
                  {...({ inert: here ? undefined : "" } as any)}
                  className={`col-start-1 row-start-1 ${fade} ${here ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-desk-ivory/55 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
                    Promotion{c.eyebrow ? <span className="text-desk-champagne"> · {c.eyebrow}</span> : null}
                  </p>
                  <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.1] text-desk-ivory [text-shadow:0_2px_18px_rgba(0,0,0,0.55)] [text-wrap:balance]">{c.headline}</h2>
                  {c.body && <p className="mt-3 text-[13px] leading-[1.6] text-desk-ivory/70">{c.body}</p>}
                  {c.cta_url && c.cta_label && (
                    <span aria-hidden className="mt-5 inline-flex min-h-[38px] items-center gap-2 rounded-full border border-desk-ivory/25 px-4 text-[12.5px] font-semibold text-desk-ivory transition peer-hover:border-desk-champagne/70 group-hover/ad:border-desk-champagne/70 group-hover/ad:text-desk-champagne">
                      {c.cta_label} <span aria-hidden>↗</span>
                    </span>
                  )}
                  {c.attribution && <p className="mt-4 text-[11px] text-desk-ivory/45">{c.attribution}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-desk-champagne/80">ExitOS · Listing desk</p>
            <p className="mt-3 font-display text-[27px] font-medium leading-[1.12] text-desk-ivory">Prepared in private. Shown to buyers on your terms.</p>
            <p className="mt-3 text-[13px] leading-[1.6] text-desk-ivory/65">Buyers see an anonymised listing. Your company's name stays undisclosed until the NDA and disclosure conditions are met.</p>
          </div>
        )}

        {list.length > 1 && (
          <div className="pointer-events-auto mt-6 flex items-center gap-3">
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

/** A slide's picture, or its video: muted, looping, playing only while its slide is on screen, and never for
 *  visitors who prefer reduced motion (they see the cover image). */
const SlideMedia: React.FC<{ slide: Slide; here: boolean; still: boolean }> = ({ slide, here, still }) => {
  const v = useRef<HTMLVideoElement>(null);
  const c = slide.campaign, pos = { objectPosition: `${c.focal_x}% ${c.focal_y}%` };
  useEffect(() => {
    const el = v.current; if (!el) return;
    if (here) void el.play().catch(() => undefined); else el.pause();
  }, [here]);
  if (slide.video && !still) return (
    <video ref={v} src={slide.video} poster={slide.image ?? undefined} muted loop playsInline preload={here ? "auto" : "metadata"}
      aria-label={here ? c.image_alt ?? undefined : undefined} className="absolute inset-0 h-full w-full object-cover saturate-[0.85]" style={pos} />
  );
  if (slide.image) return <img src={slide.image} alt={here ? c.image_alt ?? "" : ""} loading={here ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover saturate-[0.85]" style={pos} />;
  return <div className="absolute inset-0 bg-desk-rail" />;
};

/** The compact card: one link for picture and words when the campaign has a destination. */
const LinkOrDiv: React.FC<{ c: Slide["campaign"]; onClick: () => void; className: string; children: React.ReactNode }> = ({ c, onClick, className, children }) => c.cta_url
  ? <a href={c.cta_url} target="_blank" rel="noopener noreferrer sponsored" onClick={onClick} aria-label={`${c.headline}${c.cta_label ? ` · ${c.cta_label}` : ""} (promotion, opens in a new tab)`}
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-desk-champagne/70`}>{children}</a>
  : <div className={className}>{children}</div>;

const Dots: React.FC<{ n: number; i: number; onPick: (k: number) => void; className?: string }> = ({ n, i, onPick, className = "" }) => (
  <span className={`flex items-center gap-1.5 ${className}`}>
    {Array.from({ length: n }, (_, k) => (
      <button key={k} type="button" onClick={() => onPick(k)} aria-label={`Show promotion ${k + 1} of ${n}`} aria-current={k === i || undefined}
        className="grid h-6 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-champagne/70">
        <span aria-hidden className={`block h-[2px] rounded-full transition-all ${k === i ? "w-6 bg-desk-champagne" : "w-2.5 bg-white/30 hover:bg-white/55"}`} />
      </button>
    ))}
  </span>
);

const Ctl: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className="grid h-8 w-8 place-items-center rounded-full text-desk-ivory/55 transition hover:bg-white/10 hover:text-desk-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-champagne/70">
    <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  </button>
);
