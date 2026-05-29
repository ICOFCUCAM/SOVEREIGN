import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight, Play, Volume2, VolumeX } from 'lucide-react';

// Right-column visual — a click-to-play video player using a conventional
// video-poster design: cinematic background + typographic title overlay +
// dark gradient + centered play button. Source defaults to
// /systems/<slug>.mp4 (drop the file into public/systems/ to enable);
// until then the conventional poster sits in place and the player
// gracefully waits for the asset.
const SystemVisual: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const start = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = muted;
      await v.play();
      setPlaying(true);
    } catch {
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
      <div className="relative mx-auto w-full max-w-[480px] aspect-video sm:aspect-square">
        {/* the player frame */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] bg-[#05071A]">

          {/* conventional video poster — cinematic background, dark scrim, title overlay */}
          {!playing && (
            <>
              {/* cinematic background — accent-tinted starfield */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    `radial-gradient(ellipse 70% 60% at 70% 35%, ${p.accent}40, transparent 65%),` +
                    `radial-gradient(ellipse 80% 70% at 30% 85%, ${p.accent}1f, transparent 70%),` +
                    'radial-gradient(ellipse 100% 100% at 50% 50%, #0c1d42 0%, #070f28 55%, #03060f 100%)',
                }}
              />
              {/* depth grid */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage:
                    `linear-gradient(${p.accent}30 1px, transparent 1px), ` +
                    `linear-gradient(90deg, ${p.accent}30 1px, transparent 1px)`,
                  backgroundSize: '52px 52px',
                  maskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, #000 25%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, #000 25%, transparent 80%)',
                }}
              />
              {/* glow halo behind the play button */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle 200px at 50% 45%, ${p.accent}33, transparent 70%)` }}
              />
              {/* dark scrim — keeps title + play button legible */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(5,7,15,0.45) 0%, rgba(5,7,15,0.0) 35%, rgba(5,7,15,0.0) 65%, rgba(5,7,15,0.7) 100%)',
                }}
              />
              {/* category kicker — top-left */}
              <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em]" style={{ color: p.accent }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: p.accent }} />
                  {p.category}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Dispatch</span>
              </div>
              {/* title overlay — bottom-left */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-[1.05]">
                  {p.name}
                </div>
                <div className="mt-2 text-[11px] font-mono uppercase tracking-[0.24em] text-white/55">
                  Play feature dispatch
                </div>
              </div>

              {/* centered play button */}
              <button
                type="button"
                onClick={start}
                aria-label={`Play ${p.name} dispatch`}
                className="absolute inset-0 flex items-center justify-center group/play"
              >
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
              </button>
            </>
          )}

          {/* the video — sits above the poster when playing */}
          <video
            ref={videoRef}
            src={`/systems/${p.slug}.mp4`}
            preload="metadata"
            playsInline
            controls={playing}
            onEnded={() => setPlaying(false)}
            className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />

          {/* mute control while playing */}
          {playing && (
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean; index: number; total: number }> = ({ p, flip, index, total }) => {
  const metrics = (p.metrics || []).slice(0, 3);
  const caps = (p.capabilities || []).slice(0, 4);
  return (
    <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      {/* cinematic video — single elegant click-to-play in an accent light-field */}
      <SystemVisual p={p} flip={flip} />

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
