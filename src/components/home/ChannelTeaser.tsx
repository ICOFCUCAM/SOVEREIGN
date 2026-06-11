import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Film, Activity, Landmark, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CLASSES = [
  { id: 'cinematic', cls: 'Class I', label: 'Cinematic', icon: Film, accent: '#00C2FF' },
  { id: 'operational', cls: 'Class II', label: 'Operational', icon: Activity, accent: '#10E5A0' },
  { id: 'strategic', cls: 'Class III', label: 'Strategic', icon: Landmark, accent: '#7C4DFF' },
  { id: 'crisis', cls: 'Class IV', label: 'Crisis response', icon: ShieldAlert, accent: '#FF5470' },
];

const ChannelTeaser: React.FC = () => {
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      // Posters from published renders take precedence; narrative covers fill gaps.
      const [med, nar] = await Promise.all([
        supabase.from('media').select('media_class, poster_url, video_url, youtube_id').order('created_at', { ascending: false }),
        supabase.from('narratives').select('media_class, cover_image_url').eq('published', true).not('cover_image_url', 'is', null).order('sort_order', { ascending: true }),
      ]);
      const map: Record<string, string> = {};
      const n: Record<string, number> = {};
      for (const r of (med.data || []) as Array<{ media_class: string; poster_url: string | null; video_url: string | null; youtube_id: string | null }>) {
        if (r.video_url || r.youtube_id) n[r.media_class] = (n[r.media_class] || 0) + 1;
        if (r.poster_url && !map[r.media_class]) map[r.media_class] = r.poster_url;
      }
      for (const r of (nar.data || []) as Array<{ media_class: string | null; cover_image_url: string | null }>) {
        if (r.media_class && r.cover_image_url && !map[r.media_class]) map[r.media_class] = r.cover_image_url;
      }
      setCovers(map);
      setCounts(n);
    })();
  }, []);

  return (
  <section className="relative px-4 sm:px-6 lg:px-8 py-28 sm:py-36 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <div className="absolute top-1/2 left-[-8%] -translate-y-1/2 w-[42vw] max-w-[640px] h-[42vw] rounded-full blur-[130px] opacity-[0.07]" style={{ background: '#00C2FF' }} />
    </div>
    <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
      {/* editorial */}
      <div>
        <div className="kicker text-cyan-300/70 mb-6" style={{ letterSpacing: '0.3em' }}>The sovereign channel</div>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic text-balance text-white leading-[0.94] mb-6">
          Civilization,<br /><span className="text-gradient-cyan">on film.</span>
        </h2>
        <p className="text-lg text-white/55 leading-relaxed max-w-md mb-9">
          Four classes of civilization-scale media — cinematic, operational, strategic and crisis-response — and an interactive national-crisis simulation, all routing to a sovereign executive briefing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/channel" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
            <Play className="w-4 h-4" fill="currentColor" /> Enter the channel
          </Link>
          <Link to="/films" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] text-white font-semibold hover:bg-white/8 transition-all">
            <Film className="w-4 h-4 text-cyan-300" /> Film library
          </Link>
        </div>
      </div>

      {/* media class matrix */}
      <div className="grid grid-cols-2 gap-4">
        {CLASSES.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.id} to={`/channel#${c.id}`} className="group relative rounded-2xl border border-white/10 bg-white/[0.014] p-6 overflow-hidden hover:border-white/25 hover:-translate-y-1 transition-all">
              {covers[c.id] && (
                <span className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity" aria-hidden>
                  <img src={covers[c.id]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, #0A0E27cc, #0A0E27ee)` }} />
                </span>
              )}
              <span className="absolute -top-14 -right-12 w-40 h-40 rounded-full blur-[80px] opacity-[0.12] group-hover:opacity-30 transition-opacity" style={{ background: c.accent }} />
              <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />
              <div className="relative">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${c.accent}1a`, border: `1px solid ${c.accent}33` }}>
                  <Icon className="w-5 h-5" style={{ color: c.accent }} />
                </span>
                <div className="text-[9px] font-mono uppercase tracking-[0.22em]" style={{ color: c.accent }}>{c.cls}{counts[c.id] ? ` · ${counts[c.id]} ${counts[c.id] === 1 ? 'film' : 'films'}` : ''}</div>
                <div className="font-display text-xl font-bold text-white tracking-tight mt-1">{c.label}</div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all mt-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
  );
};

export default ChannelTeaser;
