import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight, Landmark, Vote, ShieldAlert, Banknote, Truck, Cpu, GraduationCap, Boxes, Play, Volume2, VolumeX } from 'lucide-react';

// Slugs whose right-column visual upgrades from a static image to an
// inline click-to-play video. Source defaults to /systems/<slug>.mp4
// (drop the file into public/systems/ to enable); falls back to the
// existing poster image when no video is published yet.
const VIDEO_SLUGS = new Set(['civicos']);

function emblemFor(category: string): React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number | string }> {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return Vote;
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return ShieldAlert;
  if (/govern|civic|govtech|operating infrastructure|government runtime/.test(c)) return Landmark;
  if (/pay|bank|financ|settle|fintech|treasury/.test(c)) return Banknote;
  if (/logistic|transport|mobility/.test(c)) return Truck;
  if (/educat|credential/.test(c)) return GraduationCap;
  if (/knowledge|intellig|\bai\b|learn/.test(c)) return Cpu;
  return Boxes;
}

// Click-to-play video player layered over the existing poster image.
// Used for slugs in VIDEO_SLUGS.
const SystemPlayer: React.FC<{ p: EcosystemProduct; posterSrc: string }> = ({ p, posterSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const start = async () => {
    const v = videoRef.current; if (!v) return;
    try { v.muted = muted; await v.play(); setPlaying(true); }
    catch { setPlaying(true); }
  };
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };

  return (
    <>
      {/* the video */}
      <video
        ref={videoRef}
        src={`/systems/${p.slug}.mp4`}
        poster={posterSrc}
        preload="metadata"
        playsInline
        controls={playing}
        onEnded={() => setPlaying(false)}
        className={`absolute inset-[4%] w-[92%] h-[92%] object-cover rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {/* idle play overlay */}
      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label={`Play ${p.name} dispatch`}
          className="absolute inset-[4%] w-[92%] h-[92%] flex flex-col items-center justify-center group/play rounded-2xl"
        >
          <span aria-hidden className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, transparent 50%, rgba(5,7,15,0.55) 100%)',
          }} />
          <span
            className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-md transition-all duration-500 group-hover/play:scale-105"
            style={{
              background: `linear-gradient(135deg, ${p.accent}33, rgba(255,255,255,0.08))`,
              border: `1px solid ${p.accent}66`,
              boxShadow: `0 24px 60px -28px ${p.accent}aa`,
            }}
          >
            <span aria-hidden className="absolute inset-0 rounded-full animate-pulse-slow" style={{ background: `radial-gradient(circle, ${p.accent}33, transparent 70%)` }} />
            <Play className="relative w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" strokeWidth={1.5} fill="white" style={{ filter: `drop-shadow(0 0 14px ${p.accent})` }} />
          </span>
          <span className="relative mt-5 text-[10px] font-mono uppercase tracking-[0.28em] text-white/80">Play dispatch</span>
        </button>
      )}
      {/* mute toggle while playing */}
      {playing && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute top-[8%] right-[8%] w-9 h-9 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </>
  );
};

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean; index: number; total: number }> = ({ p, flip, index, total }) => {
  const Emblem = emblemFor(p.category);
  const metrics = (p.metrics || []).slice(0, 3);
  const caps = (p.capabilities || []).slice(0, 4);
  return (
    <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      {/* cinematic emblem — a single elegant mark in an accent light-field */}
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        <div className="relative mx-auto w-full max-w-[480px] aspect-square flex items-center justify-center">
          <span aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display font-bold tracking-tighter text-white/[0.035] whitespace-nowrap select-none" style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}>{p.name}</span>
          <div className="absolute inset-[12%] rounded-full blur-[80px] opacity-40" style={{ background: `radial-gradient(circle, ${p.accent}, transparent 70%)` }} />
          <div className="absolute inset-[6%] rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[22%] rounded-full border border-white/[0.04]" />
          <Emblem className="relative w-28 h-28 sm:w-36 sm:h-36" strokeWidth={0.9} style={{ color: p.accent }} />
          {/* cinematic system visual — framed product capture; tries <slug>.jpg then <slug>-1.jpg, hides if absent */}
          <img src={`/systems/${p.slug}.jpg`} alt="" aria-hidden loading="lazy" decoding="async"
            className="absolute inset-[4%] w-[92%] h-[92%] object-cover rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.alt) { img.dataset.alt = '1'; img.src = `/systems/${p.slug}-1.jpg`; }
              else { img.style.display = 'none'; }
            }} />
          {VIDEO_SLUGS.has(p.slug) && (
            <SystemPlayer p={p} posterSrc={`/systems/${p.slug}.jpg`} />
          )}
        </div>
      </div>

      {/* editorial statement */}
      <div className={flip ? 'lg:order-1' : ''}>
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[11px] tabular-nums text-white/30">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.26em]" style={{ color: p.accent }}>{p.category}</span>
        </div>
        <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic text-white leading-[0.96] text-balance mb-6">{p.name}</h3>
        <p className="text-xl text-white/55 max-w-md leading-relaxed mb-9">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-10 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2.5 text-[15px] text-white/65">
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="mb-10">
            <div className="hairline max-w-md mb-5" />
            <div className="flex flex-wrap gap-x-12 gap-y-5">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2" style={{ textShadow: `0 0 30px ${p.accent}33` }}>{m.value}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {p.tiers && p.tiers.length > 0 && (
          <div className="text-sm text-white/45 mb-6">From <span className="text-white font-semibold tabular-nums">{p.tiers[0].price}</span> · {p.tiers.length} deployment tiers</div>
        )}
        <Link to={`/systems/${p.slug}`} className="group inline-flex items-center gap-2.5 pl-5 pr-4 py-3 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold ease-cinematic transition-all duration-500 hover:bg-white/[0.06] hover:-translate-y-0.5" style={{ ['--a' as string]: p.accent }}>
          Explore {p.name} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: p.accent }} />
        </Link>
      </div>
    </div>
  );
};

const FLAGSHIP = ['veritas-os', 'civicos', 'veritas-banking', 'elecpro', 'flyttgo', 'mobile-pay'];

const EcosystemSectors: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      const rows = (data || []) as EcosystemProduct[];
      const pick = FLAGSHIP.map((s) => rows.find((r) => r.slug === s)).filter(Boolean) as EcosystemProduct[];
      const chosen = pick.length >= 3 ? pick : (rows.filter((r) => r.is_featured).length ? rows.filter((r) => r.is_featured) : rows).slice(0, 6);
      setProducts(chosen.slice(0, 6));
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="relative py-24 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[12%] -left-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-a" style={{ background: 'rgba(0,194,255,0.05)' }} />
        <div className="absolute bottom-[10%] -right-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-b" style={{ background: 'rgba(124,77,255,0.05)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-2xl mb-20">
          <div className="kicker text-cyan-300/70 mb-5" style={{ letterSpacing: '0.3em' }}>Featured institutions</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic text-white leading-[0.98] text-balance">
            Sovereign systems, ready to deploy.
          </h2>
        </div>

        <div className="space-y-28 sm:space-y-40">
          {products.map((p, i) => (
            <Reveal key={p.id} y={40}><SectorPanel p={p} flip={i % 2 === 1} index={i} total={products.length} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSectors;
