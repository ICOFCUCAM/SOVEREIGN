import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import PageSubNav from '@/components/PageSubNav';
import BriefingModal from '@/components/BriefingModal';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Play, ArrowRight, ArrowUpRight, Film, Activity, Landmark, ShieldAlert, Linkedin, Youtube, FileText } from 'lucide-react';

interface Episode { title: string; meta: string; len: string }
interface Channel {
  id: string; cls: string; kicker: string; title: string; desc: string; accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  feature: string; featureSlug: string; episodes: Episode[];
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

const FilmTile: React.FC<{ ch: Channel }> = ({ ch }) => (
  <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#06091a]" style={{ aspectRatio: '16 / 9' }}>
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
    <button className="absolute inset-0 flex items-center justify-center" aria-label={`Play ${ch.feature}`}>
      <span className="w-16 h-16 rounded-full flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform" style={{ boxShadow: `0 0 40px ${ch.accent}55` }}>
        <Play className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" />
      </span>
    </button>
    <div className="absolute bottom-4 inset-x-4">
      <div className="text-white font-semibold leading-tight">{ch.feature}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45 mt-1">Featured · {ch.kicker}</div>
    </div>
  </div>
);

const ChannelPage: React.FC = () => {
  useDocumentTitle('Channel', 'The Sovereign Channel — cinematic, operational, strategic and crisis-response media from the sovereign operating layer.');
  const [brief, setBrief] = useState(false);

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <PageSubNav label="Channel" items={[
        { id: 'cinematic', label: 'Cinematic' }, { id: 'operational', label: 'Operational' },
        { id: 'strategic', label: 'Strategic' }, { id: 'crisis', label: 'Crisis' }, { id: 'briefing', label: 'Briefing' },
      ]} />

      <main>
        {/* hero */}
        <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-36 pb-20">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] max-w-[1000px] h-[40vw] rounded-full blur-[140px] opacity-[0.08]" style={{ background: '#00C2FF' }} />
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.28em] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> The sovereign channel
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.94] max-w-3xl mb-7">
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
          return (
            <section key={ch.id} id={ch.id} className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <Reveal>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div className={flip ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ch.accent}1a`, border: `1px solid ${ch.accent}33` }}><Icon className="w-5 h-5" style={{ color: ch.accent }} /></span>
                      <span className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: ch.accent }}>{ch.cls} · {ch.kicker}</span>
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-5">{ch.title}</h2>
                    <p className="text-white/55 text-lg leading-relaxed max-w-md mb-8">{ch.desc}</p>
                    <div className="space-y-px rounded-xl overflow-hidden border border-white/8">
                      {ch.episodes.map((ep) => (
                        <div key={ep.title} className="group flex items-center justify-between gap-4 px-4 py-3.5 bg-white/[0.012] hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <div className="flex items-center gap-3 min-w-0">
                            <Play className="w-3.5 h-3.5 shrink-0 text-white/30 group-hover:text-white transition-colors" fill="currentColor" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{ep.title}</div>
                              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">{ep.meta}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-white/40 shrink-0">{ep.len}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={flip ? 'lg:order-1' : ''}>
                    <FilmTile ch={ch} />
                  </div>
                </div>
              </Reveal>
            </section>
          );
        })}

        {/* distribution architecture */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">Distribution architecture</span>
              <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {DISTRIBUTION.map((d) => { const Icon = d.icon; return (
                <div key={d.label} className="rounded-2xl border border-white/10 bg-white/[0.012] p-6">
                  <Icon className="w-5 h-5 text-cyan-300/70 mb-4" />
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
      {brief && <BriefingModal systemName="SOVEREIGN CHANNEL" slug="channel" accent="#00C2FF" onClose={() => setBrief(false)} />}
    </div>
  );
};

export default ChannelPage;
