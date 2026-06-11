import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import VideoModal from '@/components/VideoModal';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { fetchFilmLibrary, fetchRenderingJobs, type MediaRow, type RenderingJob, formatDuration } from '@/lib/media';
import { Play, Film, ArrowRight, Clapperboard, Loader2, Activity, Landmark, ShieldAlert } from 'lucide-react';

// Sovereign Films — the public cinema for everything the media pipeline has
// produced. Entirely DB-driven: the library is published media rows with real
// assets, and the production feed is the live render queue. With an empty
// database the page presents the cinema shell and routes to the Channel.

const CLASS_META: Record<string, { label: string; cls: string; accent: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  cinematic:   { label: 'Cinematic',     cls: 'Class I',   accent: '#00C2FF', icon: Film },
  operational: { label: 'Operational',   cls: 'Class II',  accent: '#10E5A0', icon: Activity },
  strategic:   { label: 'Strategic',     cls: 'Class III', accent: '#7C4DFF', icon: Landmark },
  crisis:      { label: 'Crisis',        cls: 'Class IV',  accent: '#FF5470', icon: ShieldAlert },
};
const metaFor = (cls: string | null) => CLASS_META[cls || ''] || CLASS_META.cinematic;

const FilmCard: React.FC<{ m: MediaRow; onPlay: () => void }> = ({ m, onPlay }) => {
  const meta = metaFor(m.media_class);
  const poster = m.poster_url || (m.youtube_id ? `https://i.ytimg.com/vi/${m.youtube_id}/hqdefault.jpg` : null);
  const len = formatDuration(m.duration_seconds, m.length);
  return (
    <button onClick={onPlay} aria-label={`Play ${m.title}`}
      className="group relative text-left rounded-2xl overflow-hidden border border-white/10 bg-[#06091a] ease-cinematic transition-all duration-500 hover:border-white/25 hover:-translate-y-1.5 hover:shadow-[0_40px_90px_-46px_rgba(0,0,0,0.9)]">
      <div className="relative" style={{ aspectRatio: '16 / 9' }}>
        {poster && <img src={poster} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700" />}
        <span className="absolute -top-12 -right-10 w-44 h-44 rounded-full blur-[80px] opacity-20" style={{ background: meta.accent }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(4,6,15,0.9) 100%)' }} />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm ease-cinematic transition-all duration-500 group-hover:scale-110" style={{ boxShadow: `0 0 30px ${meta.accent}44` }}>
            <Play className="w-4.5 h-4.5 text-white translate-x-px" fill="currentColor" />
          </span>
        </span>
        {len && <span className="absolute bottom-3 right-3 text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-black/55 text-white/80">{len}</span>}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: meta.accent }}>
          <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: meta.accent }} /> {meta.cls}
        </span>
      </div>
      <div className="p-4">
        <div className="text-white font-semibold leading-tight truncate">{m.title}</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35 mt-1.5">{m.meta || meta.label}{m.kind === 'feature' ? ' · feature' : ''}</div>
      </div>
    </button>
  );
};

const FilmsPage: React.FC = () => {
  useDocumentTitle('Sovereign Films', 'The cinema of the sovereign operating layer — generated films, operational dispatches and crisis simulations, produced by the media pipeline.');
  const [films, setFilms] = useState<MediaRow[]>([]);
  const [rendering, setRendering] = useState<RenderingJob[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<MediaRow | null>(null);

  useEffect(() => {
    (async () => {
      const [lib, jobs] = await Promise.all([fetchFilmLibrary(), fetchRenderingJobs()]);
      setFilms(lib);
      setRendering(jobs);
      setLoading(false);
    })();
  }, []);

  // Structured data — a VideoObject per published film, rebuilt as the library loads.
  useEffect(() => {
    if (films.length === 0) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: films.slice(0, 24).map((f, i) => ({
        '@type': 'VideoObject',
        position: i + 1,
        name: f.title,
        description: f.meta || metaFor(f.media_class).label,
        uploadDate: f.created_at,
        ...(f.poster_url ? { thumbnailUrl: f.poster_url } : {}),
        ...(f.video_url ? { contentUrl: f.video_url } : {}),
        ...(f.youtube_id ? { embedUrl: `https://www.youtube.com/embed/${f.youtube_id}` } : {}),
      })),
    });
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, [films]);

  const classes = useMemo(() => {
    const present = new Set(films.map((f) => f.media_class));
    return Object.keys(CLASS_META).filter((c) => present.has(c));
  }, [films]);
  const shown = filter === 'all' ? films : films.filter((f) => f.media_class === filter);
  const feature = films.find((f) => f.kind === 'feature' && f.video_url) || films[0];

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* hero */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 kicker mb-7" style={{ letterSpacing: '0.28em' }}>
              <Clapperboard className="w-3.5 h-3.5" /> Sovereign films
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-cinematic leading-[0.94] text-balance mb-6">
              Every frame, <span className="text-gradient-cyan">produced by the substrate.</span>
            </h1>
            <p className="text-lg text-white/55 leading-relaxed max-w-2xl">
              Films generated by the sovereign media pipeline — scene planning, frame synthesis, motion and narration —
              published here the moment they finish rendering.
            </p>
          </div>

          {/* live production feed — the render queue, in public */}
          {rendering.length > 0 && (
            <Reveal>
              <div className="relative rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-5 mb-12 overflow-hidden">
                <HudCorners color="#00C2FF" className="opacity-25" />
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.26em] text-cyan-300/80">Now rendering · {rendering.length} in the pipeline</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {rendering.map((j) => {
                    const meta = metaFor(j.media_class);
                    return (
                      <span key={j.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-white/75">
                        <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: meta.accent }} />
                        {j.title || 'Untitled production'} <span className="text-white/35 font-mono uppercase text-[9px]">{j.kind}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}

          {/* filter rail */}
          {films.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <button onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${filter === 'all' ? 'bg-white/10 text-white border border-white/25' : 'border border-white/10 text-white/50 hover:text-white'}`}>
                All · {films.length}
              </button>
              {classes.map((c) => {
                const meta = CLASS_META[c];
                const n = films.filter((f) => f.media_class === c).length;
                return (
                  <button key={c} onClick={() => setFilter(c)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition border ${filter === c ? 'text-white' : 'text-white/50 hover:text-white border-white/10'}`}
                    style={filter === c ? { borderColor: `${meta.accent}66`, background: `${meta.accent}1a` } : undefined}>
                    {meta.label} · {n}
                  </button>
                );
              })}
            </div>
          )}

          {/* library */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.015] animate-pulse" style={{ aspectRatio: '16 / 11' }} />
              ))}
            </div>
          ) : shown.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map((m) => <FilmCard key={m.id} m={m} onPlay={() => setPlaying(m)} />)}
            </div>
          ) : (
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.014] px-8 py-20 text-center overflow-hidden">
              <span className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[110px] opacity-15" style={{ background: '#00C2FF' }} />
              <Film className="w-10 h-10 text-cyan-300/70 mx-auto mb-5" />
              <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-3">The first production is on its way.</h2>
              <p className="text-white/50 max-w-md mx-auto mb-8">The media pipeline publishes films here the moment they finish rendering. Until then, the Channel carries the programme.</p>
              <Link to="/channel" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm ease-cinematic transition-all duration-500 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 12px 36px -12px rgba(0,194,255,0.5)' }}>
                Enter the channel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* feature strip → channel */}
          {feature && (
            <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.014] p-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70 mb-1.5">Latest production</div>
                <div className="text-white font-semibold">{feature.title}</div>
              </div>
              <Link to="/channel" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white transition shrink-0">
                Full programme on the Channel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
      <PlatformFooter />
      {playing && (
        <VideoModal title={playing.title} kicker={metaFor(playing.media_class).label} accent={metaFor(playing.media_class).accent}
          videoId={playing.youtube_id} videoUrl={playing.video_url} posterUrl={playing.poster_url}
          onClose={() => setPlaying(null)} />
      )}
    </div>
  );
};

export default FilmsPage;
