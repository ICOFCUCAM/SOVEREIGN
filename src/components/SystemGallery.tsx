import React, { useEffect, useState } from 'react';
import { useEscape } from '@/hooks/useEscape';
import { X, ChevronLeft, ChevronRight, ExternalLink, ImageIcon } from 'lucide-react';

interface Props { slug: string; systemName: string; url?: string | null; accent?: string; onClose: () => void }

// Probes /systems/<slug>-1.jpg … -6.jpg and presents whatever exists as a
// cinematic slideshow. Drop screenshots into /public/systems to populate it.
const SystemGallery: React.FC<Props> = ({ slug, systemName, url, accent = '#00C2FF', onClose }) => {
  const [images, setImages] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [i, setI] = useState(0);
  useEscape(onClose);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cancelled = false;
    const probe = (n: number) => new Promise<string | null>((res) => {
      const img = new Image();
      img.onload = () => res(`/systems/${slug}-${n}.jpg`);
      img.onerror = () => res(null);
      img.src = `/systems/${slug}-${n}.jpg`;
    });
    Promise.all([1, 2, 3, 4, 5, 6].map(probe)).then((r) => {
      if (cancelled) return;
      setImages(r.filter(Boolean) as string[]);
      setReady(true);
    });
    return () => { cancelled = true; document.body.style.overflow = ''; };
  }, [slug]);

  const has = images.length > 0;
  const go = (d: number) => setI((p) => (p + d + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${systemName} preview`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl animate-stage-in">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/60">{systemName} · preview</div>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A1024]" style={{ aspectRatio: '16 / 9' }}>
          <span className="absolute inset-x-0 top-0 h-px z-20" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          {has ? (
            <>
              <img src={images[i]} alt={`${systemName} preview ${i + 1}`} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition"><ChevronRight className="w-5 h-5" /></button>
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
                    {images.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className="w-2 h-2 rounded-full transition" style={{ background: k === i ? accent : 'rgba(255,255,255,0.3)' }} />)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <ImageIcon className="w-10 h-10 text-white/20 mb-3" />
              <div className="text-white/70 font-semibold">{ready ? 'Preview imagery coming soon' : 'Loading preview…'}</div>
              <div className="text-white/40 text-sm mt-1">Operational screenshots are being prepared for {systemName}.</div>
            </div>
          )}
        </div>

        {url && (
          <div className="mt-3 text-center">
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition">
              <ExternalLink className="w-4 h-4" style={{ color: accent }} /> Open the live build
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemGallery;
