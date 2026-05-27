import React, { useEffect } from 'react';
import { useEscape } from '@/hooks/useEscape';
import HudCorners from '@/components/HudCorners';
import { X, Film, ArrowUpRight } from 'lucide-react';

interface Props {
  title: string;
  kicker?: string;
  videoId?: string | null;     // YouTube ID — when present, plays inline
  accent?: string;
  onClose: () => void;
  onBrief?: () => void;        // fallback CTA when the film is still in production
}

// Lightweight cinematic player. Plays a YouTube embed when an id is supplied;
// otherwise presents a sovereign "in production" state with the briefing route.
const VideoModal: React.FC<Props> = ({ title, kicker, videoId, accent = '#00C2FF', onClose, onBrief }) => {
  useEscape(onClose);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl animate-stage-in">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/60">{kicker ? `${kicker} · ` : ''}{title}</div>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#04060f]" style={{ aspectRatio: '16 / 9' }}>
          <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          <HudCorners color={accent} className="opacity-40 z-10" />
          {videoId ? (
            <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <span className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-[90px] opacity-25" style={{ background: accent }} />
              <Film className="w-10 h-10 mb-4" style={{ color: accent }} />
              <div className="text-white font-semibold text-lg">{title}</div>
              <div className="text-white/45 text-sm mt-2 max-w-md">This sovereign production is in the cinematic pipeline. Request an executive briefing for a private screening and deployment walkthrough.</div>
              {onBrief && (
                <button onClick={onBrief} className="group inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-white text-sm font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 12px 34px -10px ${accent}66` }}>
                  Request executive briefing <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
