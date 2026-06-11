import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import HudCorners from '@/components/HudCorners';
import { fetchLatestFilm, formatDuration, type MediaRow } from '@/lib/media';

// Cinematic video showcase — plays the newest published render from the
// media pipeline. When nothing has been published yet (and no explicit src
// is passed) the section renders nothing: the homepage never shows a
// placeholder player.

interface Props {
  /** Explicit source override; when omitted the latest published film is used. */
  src?: string;
  /** Poster shown before playback. */
  poster?: string;
  /** Optional caption shown below the poster while idle. */
  caption?: string;
}

const HomeVideo: React.FC<Props> = ({ src: srcProp, poster: posterProp, caption: captionProp }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [film, setFilm] = useState<MediaRow | null>(null);
  const [loaded, setLoaded] = useState(Boolean(srcProp));

  useEffect(() => {
    if (srcProp) return;
    (async () => {
      setFilm(await fetchLatestFilm());
      setLoaded(true);
    })();
  }, [srcProp]);

  const src = srcProp || film?.video_url || undefined;
  const poster = posterProp || film?.poster_url || '/hero-globe.webp';
  const caption = captionProp || (film ? `${film.title}${film.meta ? ` — ${film.meta}` : ''}` : 'A sovereign-infrastructure dispatch from the media pipeline.');
  const durationLabel = film ? formatDuration(film.duration_seconds, film.length) : '';

  const start = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = muted;
      await v.play();
      setPlaying(true);
    } catch {
      // autoplay denied → at least surface controls
      setPlaying(true);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    const target = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (target.requestFullscreen) target.requestFullscreen();
    else if (target.webkitEnterFullscreen) target.webkitEnterFullscreen();
  };

  // No published film and no explicit source — the section stays off the page.
  if (!loaded || !src) return null;

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-28 sm:py-36 overflow-hidden">
      {/* subtle dark grid wash to match the rest of the homepage */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{
        backgroundImage: 'linear-gradient(rgba(120,160,220,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, #000 25%, transparent 88%)',
        WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, #000 25%, transparent 88%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 45%, rgba(0,160,255,0.05), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Editorial kicker strip — institutional chrome */}
        <div className="flex items-center gap-4 mb-12">
          <span className="kicker text-white/45" style={{ letterSpacing: '0.3em' }}>Sovereign feature dispatch</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          <span className="kicker text-white/30 hidden sm:inline" style={{ fontSize: '10px', letterSpacing: '0.2em' }}>{durationLabel ? `${durationLabel} · ` : ''}cinematic · audit-ready</span>
        </div>

        {/* The player */}
        <div className="group/player relative rounded-[1.6rem] border border-white/12 bg-gradient-to-b from-white/[0.03] to-white/[0.01] overflow-hidden transition-colors hover:border-white/22">
          <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00D9FF, transparent)' }} />
          <span className="absolute -left-32 -top-32 w-[28rem] h-[28rem] rounded-full blur-[110px] opacity-[0.10] group-hover/player:opacity-20 transition-opacity duration-700" style={{ background: '#00D9FF' }} />
          <HudCorners color="#00D9FF" className="opacity-30 group-hover/player:opacity-60 transition-opacity" />

          <div className="relative aspect-video bg-black">
            {/* The video element — receives clicks through to start() when idle */}
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              preload="metadata"
              playsInline
              controls={playing}
              onEnded={() => setPlaying(false)}
              onError={() => setFailed(true)}
              className={`w-full h-full object-cover ${playing ? 'opacity-100' : 'opacity-95'}`}
            />

            {/* Atmospheric overlay on the poster (idle only) */}
            {!playing && (
              <>
                <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(5,7,15,0.55) 90%)',
                }} />
                <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(180deg, rgba(5,7,15,0.45) 0%, transparent 35%, transparent 65%, rgba(5,7,15,0.55) 100%)',
                }} />

                {/* Centered play affordance */}
                <button
                  type="button"
                  onClick={start}
                  aria-label="Play feature dispatch"
                  className="absolute inset-0 flex flex-col items-center justify-center group/play"
                >
                  <span className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-md transition-all duration-500 group-hover/play:scale-105"
                        style={{ background: 'linear-gradient(135deg, rgba(0,194,255,0.18), rgba(124,77,255,0.18))', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 30px 80px -30px rgba(0,194,255,0.5)' }}>
                    <span aria-hidden className="absolute inset-0 rounded-full animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.18), transparent 70%)' }} />
                    <Play className="relative w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_18px_rgba(0,217,255,0.6)] ml-1" strokeWidth={1.5} fill="white" />
                  </span>
                  <span className="mt-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.32em] text-white/80">Play feature dispatch</span>
                </button>

                {/* Bottom editorial caption strip */}
                <div className="absolute bottom-0 inset-x-0 px-6 sm:px-10 py-6">
                  <div className="flex flex-wrap items-end justify-between gap-4 max-w-4xl">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign infrastructure universe
                      </div>
                      <p className="mt-3 text-white/75 text-sm sm:text-base leading-relaxed max-w-2xl">{caption}</p>
                    </div>
                    {durationLabel && <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45 hidden sm:block">{durationLabel} · audit-grade</div>}
                  </div>
                </div>
              </>
            )}

            {/* Inline overlay controls when playing */}
            {playing && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="w-9 h-9 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button type="button" onClick={goFullscreen} aria-label="Fullscreen" className="w-9 h-9 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Graceful state — the source file isn't published yet */}
            {failed && !playing && (
              <div className="absolute bottom-24 inset-x-0 text-center pointer-events-none">
                <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90 bg-black/40 px-3 py-1.5 rounded">
                  Feature dispatch arriving shortly · check back
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Below the player — operator credits / dispatch line */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">
          <span>Sovereign infrastructure dispatch · institutional broadcast</span>
          <span>Recorded under continuous audit</span>
        </div>
      </div>
    </section>
  );
};

export default HomeVideo;
