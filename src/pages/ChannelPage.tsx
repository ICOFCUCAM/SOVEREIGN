import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import PageSubNav from '@/components/PageSubNav';
import SovereignBriefing from '@/components/SovereignBriefing';
import VideoModal from '@/components/VideoModal';
import CrisisSimulation from '@/components/CrisisSimulation';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEscape } from '@/hooks/useEscape';
import { Play, ArrowRight, ArrowUpRight, Film, Activity, Landmark, ShieldAlert, Linkedin, Youtube, FileText, X, BookOpen, Radio, CalendarClock } from 'lucide-react';

interface Episode { title: string; meta: string; len: string }
interface Channel {
  id: string; cls: string; kicker: string; title: string; desc: string; accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  feature: string; featureSlug: string; episodes: Episode[]; video?: string;
}

const CHANNELS: Channel[] = [
  {
    id: 'cinematic', cls: 'Class I', kicker: 'Cinematic', title: 'The future of civilization.', accent: '#00C2FF', icon: Film,
    desc: 'Civilization-scale storytelling — the emotional case for sovereign digital infrastructure, rendered as cinema.',
    feature: 'GENESIS — The operating layer for civilization', featureSlug: 'cinematic',
    episodes: [
      { title: 'Planetary Scale', meta: 'Sovereign vision', len: '2:40' },
      { title: 'The Deployable Nation', meta: 'Civilization film', len: '3:15' },
      { title: 'One Operating Layer', meta: 'Architecture reveal', len: '1:55' },
    ],
  },
  {
    id: 'operational', cls: 'Class II', kicker: 'Operational', title: 'Deployment, orchestrated.', accent: '#10E5A0', icon: Activity,
    desc: 'How sovereign systems actually deploy — edge mesh, routing intelligence, ministry orchestration, in real operational time.',
    feature: 'CIVICOS — National deployment in 90 days', featureSlug: 'operational',
    episodes: [
      { title: 'Edge Mesh Activation', meta: 'Infrastructure demo', len: '2:10' },
      { title: 'Ministry Interoperability', meta: 'Orchestration', len: '2:48' },
      { title: 'Sovereign Routing', meta: 'Signal intelligence', len: '1:42' },
    ],
  },
  {
    id: 'strategic', cls: 'Class III', kicker: 'Strategic', title: 'Government, modernized.', accent: '#7C4DFF', icon: Landmark,
    desc: 'Government modernization narratives — the strategic transformation of institutions into a single sovereign operating layer.',
    feature: 'TRANSFORMATION — From legacy state to sovereign OS', featureSlug: 'strategic',
    episodes: [
      { title: 'The Modernization Mandate', meta: 'Executive brief', len: '4:05' },
      { title: 'Treasury → Sovereign Finance', meta: 'Ministry case', len: '3:30' },
      { title: 'National Coordination', meta: 'Whole-of-government', len: '2:55' },
    ],
  },
  {
    id: 'crisis', cls: 'Class IV', kicker: 'Crisis response', title: 'Resilience under pressure.', accent: '#FF5470', icon: ShieldAlert,
    desc: 'Emergency and resilience simulations — how a sovereign operating layer absorbs shocks and coordinates national response.',
    feature: 'SIMULATION — National grid failure, contained in 38 minutes', featureSlug: 'crisis',
    episodes: [
      { title: 'Cyber-Attack Scenario', meta: 'Resilience sim', len: '3:20' },
      { title: 'Healthcare Surge', meta: 'Coordination drill', len: '2:38' },
      { title: 'Continuity of Government', meta: 'Failover', len: '2:12' },
    ],
  },
];

const DISTRIBUTION = [
  { icon: FileText, label: 'Executive briefings', note: 'Sovereign acquisition funnel' },
  { icon: Linkedin, label: 'Institutional channels', note: 'Strategic distribution' },
  { icon: Youtube, label: 'Cinematic library', note: 'Public narrative' },
];

const FilmTile: React.FC<{ ch: Channel; feature: string; onPlay: () => void }> = ({ ch, feature, onPlay }) => (
  <button onClick={onPlay} aria-label={`Play ${feature}`}
    className="group relative block w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-[#06091a]" style={{ aspectRatio: '16 / 9' }}>
    <span className="absolute -top-16 -right-12 w-56 h-56 rounded-full blur-[90px] opacity-25" style={{ background: ch.accent }} />
    {/* drop-in cinematic still at /channel/<slug>.jpg; hides gracefully */}
    <img src={`/channel/${ch.featureSlug}.jpg`} alt="" aria-hidden loading="lazy" decoding="async"
      className="absolute inset-0 w-full h-full object-cover opacity-80"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, rgba(4,6,15,0.85) 100%)` }} />
    <HudCorners color={ch.accent} className="opacity-30" />
    <div className="absolute top-4 left-4 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: ch.accent }}>
      <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: ch.accent }} /> {ch.cls} · {ch.kicker}
    </div>
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="relative w-16 h-16 rounded-full flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm ease-cinematic transition-all duration-500 group-hover:scale-110 group-hover:bg-white/15" style={{ boxShadow: `0 0 40px ${ch.accent}55` }}>
        <span className="absolute inset-0 rounded-full border opacity-0 group-hover:opacity-100 animate-ring" style={{ borderColor: `${ch.accent}99` }} />
        <Play className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" />
      </span>
    </span>
    <span className="absolute bottom-4 inset-x-4 block">
      <span className="block text-white font-semibold leading-tight">{feature}</span>
      <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/45 mt-1">Featured · {ch.kicker}</span>
    </span>
  </button>
);

interface Narrative { id: string; kind: string; media_class: string | null; title: string; subtitle: string | null; body: string; read_time: string | null; cover_image_url: string | null }
interface Campaign { id: string; name: string; media_class: string | null; channel: string; status: string; scheduled_at: string | null }

const CHANNEL_LABEL: Record<string, string> = { executive: 'Executive briefing', linkedin: 'LinkedIn', youtube: 'YouTube', public: 'Public broadcast' };

const KIND_LABEL: Record<string, string> = { manifesto: 'Manifesto', whitepaper: 'Whitepaper', ad_script: 'Film script', dispatch: 'Dispatch' };

const NarrativeReader: React.FC<{ n: Narrative; onClose: () => void }> = ({ n, onClose }) => {
  useEscape(onClose);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={n.title}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl my-10 rounded-2xl border border-white/12 bg-[#070b1c] overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: 'linear-gradient(90deg, transparent, #00C2FF, transparent)' }} />
        <HudCorners color="#00C2FF" className="opacity-25" />
        {n.cover_image_url && (
          <div className="relative h-44 sm:h-52 overflow-hidden">
            <img src={n.cover_image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b1c] via-[#070b1c]/30 to-transparent" />
          </div>
        )}
        <div className="relative p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70">{KIND_LABEL[n.kind] || 'Dispatch'}{n.read_time ? ` · ${n.read_time}` : ''}</span>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-white leading-[0.98] mb-3">{n.title}</h2>
          {n.subtitle && <p className="text-white/55 text-lg leading-relaxed mb-7">{n.subtitle}</p>}
          <div className="text-white/70 leading-relaxed whitespace-pre-line text-[15px]">{n.body}</div>
        </div>
      </div>
    </div>
  );
};

const ChannelPage: React.FC = () => {
  useDocumentTitle('Channel', 'The Sovereign Channel — cinematic, operational, strategic and crisis-response media from the sovereign operating layer.');
  const [brief, setBrief] = useState(false);
  const [playing, setPlaying] = useState<{ title: string; kicker: string; accent: string; video?: string } | null>(null);
  const [media, setMedia] = useState<Record<string, { feature?: { title: string; video?: string }; episodes: Array<{ title: string; meta: string; len: string; video?: string }> }>>({});
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [reading, setReading] = useState<Narrative | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
      const { data: nar } = await supabase.from('narratives').select('*').eq('published', true).order('sort_order', { ascending: true });
      setNarratives((nar || []) as Narrative[]);
      const { data: camp } = await supabase
        .from('campaigns')
        .select('id, name, media_class, channel, status, scheduled_at')
        .in('status', ['live', 'scheduled'])
        .order('scheduled_at', { ascending: true, nullsFirst: false });
      setCampaigns((camp || []) as Campaign[]);
      const { data } = await supabase.from('media').select('*').order('sort_order', { ascending: true });
      if (!data) return;
      const map: Record<string, { feature?: { title: string; video?: string }; episodes: Array<{ title: string; meta: string; len: string; video?: string }> }> = {};
      for (const r of data as Array<{ media_class: string; kind: string; title: string; meta: string | null; length: string | null; youtube_id: string | null }>) {
        (map[r.media_class] ||= { episodes: [] });
        if (r.kind === 'feature') map[r.media_class].feature = { title: r.title, video: r.youtube_id || undefined };
        else map[r.media_class].episodes.push({ title: r.title, meta: r.meta || '', len: r.length || '', video: r.youtube_id || undefined });
      }
      setMedia(map);
    })();
  }, []);

  const contentFor = (ch: Channel) => {
    const m = media[ch.id];
    return {
      feature: m?.feature?.title || ch.feature,
      featureVideo: m?.feature?.video || ch.video,
      episodes: m && m.episodes.length ? m.episodes : ch.episodes.map((e) => ({ title: e.title, meta: e.meta, len: e.len, video: undefined as string | undefined })),
    };
  };

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <PageSubNav label="Channel" items={[
        { id: 'cinematic', label: 'Cinematic' }, { id: 'operational', label: 'Operational' },
        { id: 'strategic', label: 'Strategic' }, { id: 'crisis', label: 'Crisis' }, { id: 'simulation', label: 'Simulation' }, { id: 'dispatches', label: 'Dispatches' }, { id: 'schedule', label: 'Schedule' }, { id: 'briefing', label: 'Briefing' },
      ]} />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-36 pb-20">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[1000px] h-[40vw] rounded-full blur-[140px] opacity-[0.08]" style={{ background: '#00C2FF' }} />
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 kicker mb-8" style={{ letterSpacing: '0.28em' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> The sovereign channel
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-cinematic text-balance leading-[0.92] max-w-3xl mb-7">
              The operating mythology of <span className="text-gradient-cyan">sovereign civilization.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/55 max-w-2xl leading-relaxed mb-10">
              Four classes of civilization-scale media — cinematic, operational, strategic and crisis-response — produced from the sovereign operating layer and routed to the institutions that deploy it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setBrief(true)} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
                Request executive briefing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#cinematic" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] text-white font-semibold hover:bg-white/8 transition-all">
                Enter the channel
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-[11px] font-mono text-white/45">
              {CHANNELS.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} /> {c.cls} · {c.kicker}</span>
              ))}
            </div>
          </div>
        </section>

        {/* channels */}
        {CHANNELS.map((ch, i) => {
          const Icon = ch.icon;
          const flip = i % 2 === 1;
          const c = contentFor(ch);
          return (
            <section key={ch.id} id={ch.id} className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <Reveal>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className={flip ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ch.accent}1a`, border: `1px solid ${ch.accent}33` }}><Icon className="w-5 h-5" style={{ color: ch.accent }} /></span>
                      <span className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: ch.accent }}>{ch.cls} · {ch.kicker}</span>
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic text-balance text-white leading-[0.96] mb-5">{ch.title}</h2>
                    <p className="text-white/55 text-lg leading-relaxed max-w-md mb-8">{ch.desc}</p>
                    <div className="space-y-px rounded-xl overflow-hidden border border-white/8">
                      {c.episodes.map((ep) => (
                        <button key={ep.title} onClick={() => setPlaying({ title: ep.title, kicker: `${ch.cls} · ${ch.kicker}`, accent: ch.accent, video: ep.video })} className="group w-full text-left flex items-center justify-between gap-4 px-4 py-3.5 bg-white/[0.012] hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <div className="flex items-center gap-3 min-w-0">
                            <Play className="w-3.5 h-3.5 shrink-0 text-white/30 group-hover:text-white transition-colors" fill="currentColor" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{ep.title}</div>
                              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">{ep.meta}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-white/40 shrink-0">{ep.len}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={flip ? 'lg:order-1' : ''}>
                    <FilmTile ch={ch} feature={c.feature} onPlay={() => setPlaying({ title: c.feature, kicker: `${ch.cls} · ${ch.kicker}`, accent: ch.accent, video: c.featureVideo })} />
                  </div>
                </div>
              </Reveal>
            </section>
          );
        })}

        {/* interactive crisis simulation */}
        <section id="simulation" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Reveal>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between gap-6 mb-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,84,112,0.12)', border: '1px solid rgba(255,84,112,0.3)' }}><ShieldAlert className="w-5 h-5" style={{ color: '#FF5470' }} /></span>
                    <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#FF8FA3]">Interactive · crisis response</span>
                  </div>
                  <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic text-balance text-white leading-[0.96]">Run a national crisis.</h2>
                  <p className="text-white/55 text-lg leading-relaxed mt-4">Live simulations of national crises cascading across ministries — and the sovereign operating layer containing them. Choose a scenario, play it, or step through each phase.</p>
                </div>
              </div>
              <CrisisSimulation />
            </div>
          </Reveal>
        </section>

        {/* sovereign dispatches — narrative engine (DB-driven) */}
        {narratives.length > 0 && (
          <section id="dispatches" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <Reveal>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <span className="kicker text-cyan-300/70" style={{ letterSpacing: "0.3em" }}>Sovereign dispatches</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Narrative engine</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {narratives.map((n) => (
                    <button key={n.id} onClick={() => setReading(n)} className="group relative text-left rounded-2xl border border-white/10 bg-white/[0.014] overflow-hidden ease-cinematic transition-all duration-500 hover:border-white/25 hover:-translate-y-1.5 hover:shadow-[0_40px_90px_-46px_rgba(0,0,0,0.9)] flex flex-col">
                      <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ background: 'linear-gradient(90deg, transparent, #00C2FF, transparent)' }} />
                      {n.cover_image_url && (
                        <div className="relative h-32 overflow-hidden">
                          <img src={n.cover_image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-transparent to-transparent" />
                        </div>
                      )}
                      <div className="p-6">
                      {!n.cover_image_url && <BookOpen className="w-5 h-5 text-cyan-300/70 mb-5" />}
                      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">{KIND_LABEL[n.kind] || 'Dispatch'}{n.read_time ? ` · ${n.read_time}` : ''}</div>
                      <div className="font-display text-lg font-bold text-white tracking-tight leading-tight mt-1.5">{n.title}</div>
                      {n.subtitle && <p className="text-[12px] text-white/45 leading-snug mt-2 line-clamp-3">{n.subtitle}</p>}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-white/45 group-hover:text-white mt-5 transition-colors">Read <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* broadcast schedule — live + upcoming programming (DB-driven) */}
        {campaigns.length > 0 && (
          <section id="schedule" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <Reveal>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <span className="kicker text-cyan-300/70" style={{ letterSpacing: "0.3em" }}>Broadcast schedule</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">{campaigns.filter((c) => c.status === 'live').length} live · {campaigns.filter((c) => c.status === 'scheduled').length} upcoming</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((c) => {
                    const live = c.status === 'live';
                    return (
                      <div key={c.id} className={`relative rounded-2xl border p-6 overflow-hidden ease-cinematic transition-all duration-500 hover:-translate-y-1 ${live ? 'border-emerald-400/30 bg-emerald-400/[0.04] hover:shadow-[0_36px_80px_-44px_rgba(16,229,160,0.35)]' : 'border-white/10 bg-white/[0.014] hover:border-white/25 hover:shadow-[0_36px_80px_-44px_rgba(0,0,0,0.9)]'}`}>
                        {live && <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #10E5A0, transparent)' }} />}
                        <div className="flex items-center gap-2 mb-4">
                          {live ? <Radio className="w-4 h-4 text-emerald-300" /> : <CalendarClock className="w-4 h-4 text-cyan-300/70" />}
                          <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${live ? 'text-emerald-300' : 'text-cyan-300/70'}`}>
                            {live ? 'On air' : c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}
                          </span>
                        </div>
                        <div className="font-display text-lg font-bold text-white tracking-tight leading-tight">{c.name}</div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/40 mt-2">{CHANNEL_LABEL[c.channel] || c.channel}{c.media_class ? ` · ${c.media_class}` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* distribution architecture */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="kicker text-cyan-300/70" style={{ letterSpacing: "0.3em" }}>Distribution architecture</span>
              <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {DISTRIBUTION.map((d) => { const Icon = d.icon; return (
                <div key={d.label} className="group rounded-2xl border border-white/10 bg-white/[0.012] p-6 ease-cinematic transition-all duration-500 hover:border-white/25 hover:-translate-y-1 hover:bg-white/[0.025]">
                  <Icon className="w-5 h-5 text-cyan-300/70 mb-4 group-hover:scale-110 transition-transform duration-500" />
                  <div className="text-white font-semibold">{d.label}</div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">{d.note}</div>
                </div>
              ); })}
            </div>
          </div>
        </section>

        {/* executive briefing funnel */}
        <section id="briefing" className="scroll-mt-28 relative overflow-hidden px-4 sm:px-6 lg:px-8 py-28 sm:py-36">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 120%, rgba(0,194,255,0.16), transparent 60%)' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-6">Executive acquisition funnel</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-6">Convene a sovereign briefing.</h2>
            <p className="text-white/55 text-lg leading-relaxed mb-9">Every film, simulation and narrative routes here — to a private executive briefing with sovereign-systems specialists, from national strategy to deployment package.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setBrief(true)} className="group inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 48px rgba(0,194,255,0.32)' }}>
                Request executive briefing <ArrowUpRight className="w-5 h-5" />
              </button>
              <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold text-lg hover:bg-white/5 transition-all">
                Enter the exchange
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PlatformFooter />
      {reading && <NarrativeReader n={reading} onClose={() => setReading(null)} />}
      {playing && <VideoModal title={playing.title} kicker={playing.kicker} accent={playing.accent} videoId={playing.video} onClose={() => setPlaying(null)} onBrief={() => { setPlaying(null); setBrief(true); }} />}
      {brief && <SovereignBriefing accent="#00C2FF" onClose={() => setBrief(false)} />}
    </div>
  );
};

export default ChannelPage;
