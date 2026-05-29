import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { supabase } from '@/lib/supabase';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import {
  Sparkles, Film, ImageIcon, Mic, Newspaper, Boxes, Cpu, Radar, Brain, Network, Globe, Megaphone,
  ShieldCheck, BadgeCheck, FileText, Lock, Activity, Code2, Terminal, Compass, Wand2, Layers,
  Youtube, Instagram, Music, Twitter, Facebook, Linkedin, MessageCircle, Send as TelegramIcon,
  ArrowRight, ChevronDown, Loader2, Copy, Crown, Cloud, Server, Zap,
} from 'lucide-react';

// ── Hero metrics ────────────────────────────────────────────────────────────
const METRICS = [
  { v: '11', l: 'distribution platforms' },
  { v: '4', l: 'media classes' },
  { v: '7', l: 'intelligence agents' },
  { v: '3', l: 'sovereign layers' },
];

// ── Three sovereign layers (one pipeline, end-to-end) ──────────────────────
const LAYERS = [
  {
    label: 'Generate',
    icon: Wand2,
    headline: 'Cinematic media on a sovereign substrate.',
    body: 'Films, images, narration and editorial — composed end-to-end through one owned pipeline. No per-call middleman. No rented grid. No content moderation lottery.',
    bullets: ['Cinematic film scripts + assembly', 'Image generation + visual narrative', 'Narration & voiceover synthesis', 'Editorial dispatches & long-form'],
  },
  {
    label: 'Distribute',
    icon: Megaphone,
    headline: 'Eleven platforms. One sovereign API.',
    body: 'Schedule, post and orchestrate across every consumer surface from one command. Provenance preserved, attribution sovereign.',
    bullets: ['Cross-platform scheduling', 'Strategic campaign sequencing', 'Provenance + watermark continuity', 'Owner-scoped publishing rights'],
  },
  {
    label: 'Intelligence',
    icon: Radar,
    headline: 'Seven strategic agents. Always on.',
    body: 'Lead analysis, scenario modeling, market mapping, narrative tracking — an institutional intelligence layer beneath every piece of media.',
    bullets: ['Lead & opportunity analysis', 'Crisis & scenario simulation', 'Narrative drift detection', 'Strategic dispatch synthesis'],
  },
];

// ── Media classes ──────────────────────────────────────────────────────────
const MEDIA_CLASSES = [
  { icon: Film, name: 'Cinematic film', d: 'Scripts → scene plan → assembly → rendered video.' },
  { icon: ImageIcon, name: 'Image', d: 'Editorial, campaign and product imagery on demand.' },
  { icon: Mic, name: 'Narration', d: 'Voiceover synthesis for film, briefings and announcements.' },
  { icon: Newspaper, name: 'Editorial', d: 'Dispatches, campaigns, scenarios and long-form copy.' },
];

// ── Eleven distribution platforms (canonical brand icons where possible) ──
const PLATFORMS = [
  { icon: Youtube, name: 'YouTube' },
  { icon: Instagram, name: 'Instagram' },
  { icon: Music, name: 'TikTok' },
  { icon: Twitter, name: 'X / Twitter' },
  { icon: Facebook, name: 'Facebook' },
  { icon: Linkedin, name: 'LinkedIn' },
  { icon: MessageCircle, name: 'WhatsApp' },
  { icon: TelegramIcon, name: 'Telegram' },
  { icon: Megaphone, name: 'Threads' },
  { icon: Globe, name: 'Web & RSS' },
  { icon: Mic, name: 'Podcast / Audio' },
];

// ── Seven intelligence agents ──────────────────────────────────────────────
const AGENTS = [
  { icon: Brain, name: 'Strategos', role: 'Strategic dispatch & briefing synthesis.' },
  { icon: Radar, name: 'Sentinel', role: 'Narrative drift, threat & propagation tracking.' },
  { icon: Compass, name: 'Cartographer', role: 'Market & opportunity mapping.' },
  { icon: Activity, name: 'Pulse', role: 'Sentiment, reach & resonance analytics.' },
  { icon: Layers, name: 'Architect', role: 'Multi-step scenario & crisis modelling.' },
  { icon: Network, name: 'Liaison', role: 'Lead qualification & relationship analysis.' },
  { icon: Cpu, name: 'Forge', role: 'Continuous media synthesis & orchestration.' },
];

// ── Comparison vs. leading AI media stacks ─────────────────────────────────
const COMPARISON_ROWS: Array<{ feature: string; sovereign: string; others: string }> = [
  { feature: 'API ownership', sovereign: 'Owned end-to-end', others: 'Rented per-call' },
  { feature: 'Distribution', sovereign: 'Native to 11 platforms', others: 'Generation only' },
  { feature: 'Intelligence agents', sovereign: '7 strategic agents on every output', others: 'Generic chat' },
  { feature: 'Pipeline integrity', sovereign: 'Queued · audited · retried · rate-limited', others: 'Stateless calls' },
  { feature: 'Provenance', sovereign: 'Cryptographic watermark + audit log', others: 'None' },
  { feature: 'Governance', sovereign: 'Sovereign jurisdiction, RLS-isolated', others: 'Provider-side policy' },
  { feature: 'Pricing model', sovereign: 'Institutional subscription', others: 'Token-meter unpredictability' },
  { feature: 'Aesthetic intent', sovereign: 'Cinematic / institutional by design', others: 'Consumer / generic' },
];

const TIERS = [
  {
    name: 'Foundation',
    sub: 'For analysts & creators.',
    features: ['1 media class', 'Single-platform distribution', '1 intelligence agent', 'Standard rate-limit'],
    accent: false,
  },
  {
    name: 'Sovereign',
    sub: 'For institutions & operators.',
    features: ['All 4 media classes', '11-platform distribution', 'All 7 intelligence agents', 'Priority queue & retries', 'Provenance + audit export', 'Owner-scoped tenancy'],
    accent: true,
  },
  {
    name: 'Civilization',
    sub: 'For ministries & nation-state operators.',
    features: ['Isolated tenancy', 'Vanity domains + nameservers', 'Dedicated edge mesh', 'Custom intelligence agents', 'White-glove operations', 'Sovereign jurisdiction'],
    accent: false,
  },
];

const TRUST = [
  { icon: ShieldCheck, t: 'Provenance baked in', d: 'Every artefact watermarked and chain-of-custody logged.' },
  { icon: FileText, t: 'Audited operations', d: 'Generation → distribution → intelligence — all in the audit log.' },
  { icon: BadgeCheck, t: 'Owned pipeline', d: 'No per-call middleman, no rented grid, no surprise quotas.' },
  { icon: Lock, t: 'Owner-scoped tenancy', d: 'RLS-isolated by default at every layer of the stack.' },
  { icon: Activity, t: 'Queued · retried', d: 'Production-grade async pipeline with exponential backoff.' },
  { icon: Globe, t: 'Sovereign jurisdiction', d: 'Routed via your chosen edge mesh and operational region.' },
];

const FAQ = [
  { q: 'How is this different from a per-call AI API?', a: 'Emergency AI is the entire pipeline — generation, distribution and intelligence — owned and operated as one sovereign system. You aren\'t renting tokens; you\'re running the substrate.' },
  { q: 'Does it really publish to all 11 platforms?', a: 'Yes — the distribution layer schedules, posts and orchestrates across the consumer surface set from a single sovereign API, with provenance preserved.' },
  { q: 'What do the 7 intelligence agents actually do?', a: 'They run beneath every output: strategic dispatch synthesis, narrative-drift detection, market mapping, sentiment analytics, scenario modelling, lead analysis and continuous media synthesis.' },
  { q: 'Who is it for?', a: 'Governments, ministries, banks, broadcasters, brands, and institutional operators who treat media + intelligence as infrastructure rather than ad-spend.' },
  { q: 'How does it relate to Sovereign and Sovereign Domains?', a: 'Same backend, same identity layer, different surface. Emergency AI is the media + intelligence layer; Sovereign Domains is the registrar layer; Sovereign is the operating platform across all of it.' },
];

// ── Live demo: cinematic dispatch generator via generate-content ───────────
const DispatchDemo: React.FC = () => {
  const [brief, setBrief] = useState('A sovereign ministry releases its first national digital identity.');
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const out = useRef<HTMLDivElement>(null);

  const run = async () => {
    setBusy(true); setErr(null); setText('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', { body: { type: 'dispatch', brief } });
      if (error) throw new Error(error.message || 'Generation failed');
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setText((data as { text: string }).text || '');
      setTimeout(() => out.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="relative glass-strong rounded-2xl p-6 overflow-hidden">
      <HudCorners color="#00D9FF" className="opacity-25" />
      <div className="relative">
        <div className="flex items-center gap-2 kicker text-cyan-300/80 mb-3"><Sparkles className="w-3.5 h-3.5" /> Live · sovereign dispatch synthesis</div>
        <p className="text-white/55 text-sm mb-4 leading-relaxed">Describe a moment. The dispatch engine returns a cinematic institutional briefing — straight from the sovereign substrate.</p>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} aria-label="Dispatch brief"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-none" />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={run} disabled={busy || brief.trim().length < 5} aria-busy={busy}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate dispatch
          </button>
          {text && <button onClick={() => { navigator.clipboard?.writeText(text); toast.success('Copied'); }} className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"><Copy className="w-3.5 h-3.5" /> Copy</button>}
          <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-white/35">model · claude opus 4.7</span>
        </div>
        {err && <div className="mt-4 text-sm text-rose-300/85">{err}</div>}
        {text && (
          <div ref={out} className="mt-5 rounded-xl border border-white/10 bg-black/40 p-5 text-white/85 text-[14px] leading-relaxed whitespace-pre-wrap font-mono">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

const EmergencyAILanding: React.FC = () => {
  useDocumentTitle('Emergency AI', 'Emergency AI — sovereign AI media, distribution and intelligence infrastructure, owned end-to-end.');

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* ── HERO ── */}
          <div className="text-center max-w-4xl mx-auto mb-14 relative">
            <div className="absolute -inset-x-20 -top-10 -bottom-10 blur-[120px] opacity-25 pointer-events-none -z-10" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, #00D9FF, transparent 70%)' }} />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-cyan-300/80 kicker mb-6" style={{ letterSpacing: '0.28em' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign AI · Media · Distribution · Intelligence
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-cinematic text-balance leading-[0.96] mb-6">
              <span className="text-gradient-cyan">Emergency AI.</span><br />
              AI media & acquisition, owned end-to-end.
            </h1>
            <p className="text-white/60 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              Generate cinematic media, distribute it across every major platform, and run strategic intelligence — through one sovereign API <em className="not-italic text-white">you own</em>. No per-call middleman. No rented grid.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <a href="#demo" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
                Try the dispatch engine <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/25 transition">See pricing <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {METRICS.map((m) => (
                <div key={m.l} className="rounded-2xl border border-white/8 bg-white/[0.015] px-4 py-4">
                  <div className="font-display text-3xl font-bold text-white">{m.v}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── THREE SOVEREIGN LAYERS ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Three sovereign layers</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">One pipeline, end to end.</h2>
              </div>
              <div className="grid lg:grid-cols-3 gap-3">
                {LAYERS.map((l) => (
                  <div key={l.label} className="relative rounded-2xl border border-white/8 bg-white/[0.015] p-7 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-cyan-400/30 overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 blur-[80px] opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle,#00D9FF,transparent 70%)' }} />
                    <div className="relative">
                      <l.icon className="w-6 h-6 text-cyan-300/85 mb-4" />
                      <div className="kicker text-cyan-300/70 mb-2" style={{ letterSpacing: '0.22em' }}>{l.label}</div>
                      <h3 className="font-display text-xl font-bold text-white mb-3 leading-tight">{l.headline}</h3>
                      <p className="text-sm text-white/55 leading-relaxed mb-4">{l.body}</p>
                      <ul className="space-y-1.5 text-sm text-white/65">
                        {l.bullets.map((b) => <li key={b} className="flex items-start gap-2"><BadgeCheck className="w-3.5 h-3.5 text-cyan-300/80 shrink-0 mt-1" /><span>{b}</span></li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── LIVE DEMO ── */}
          <Reveal>
            <div id="demo" className="scroll-mt-28 mb-24">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Live · dispatch engine</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">Run the substrate.</h2>
              </div>
              <DispatchDemo />
            </div>
          </Reveal>

          {/* ── MEDIA CLASSES ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Four media classes</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">Cinematic across every form.</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MEDIA_CLASSES.map((m) => (
                  <div key={m.name} className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <m.icon className="w-5 h-5 text-cyan-300/85 mb-3" />
                    <div className="font-display font-semibold text-white mb-1">{m.name}</div>
                    <div className="text-sm text-white/55 leading-relaxed">{m.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── DISTRIBUTION PLATFORMS ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Eleven platforms</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">One command. Every surface.</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {PLATFORMS.map((p) => (
                  <div key={p.name} className="rounded-xl border border-white/8 bg-white/[0.015] px-4 py-4 flex items-center gap-3 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <p.icon className="w-4 h-4 text-cyan-300/85 shrink-0" />
                    <span className="text-sm text-white/80 truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── INTELLIGENCE AGENTS ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Seven intelligence agents</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">An institutional intelligence layer.</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AGENTS.map((a) => (
                  <div key={a.name} className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00D9FF,#7C3AED)' }}><a.icon className="w-4 h-4 text-white" /></span>
                      <span className="font-display font-bold text-white">{a.name}</span>
                    </div>
                    <div className="text-sm text-white/55 leading-relaxed">{a.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── COMPARISON ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Why it surpasses</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">Built to outlast the per-call era.</h2>
                <p className="text-white/55 mt-3">Generic AI APIs sell tokens. Emergency AI ships an owned, integrated pipeline — generation, distribution and intelligence as one civilizational layer.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
                <div className="grid grid-cols-[1.2fr_1.4fr_1fr] text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 px-5 py-3 border-b border-white/8">
                  <span>Capability</span><span className="text-cyan-300/80">Emergency AI</span><span>Leading AI APIs</span>
                </div>
                {COMPARISON_ROWS.map((row, i) => (
                  <div key={row.feature} className={`grid grid-cols-[1.2fr_1.4fr_1fr] px-5 py-3.5 items-center text-sm ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
                    <span className="text-white/70">{row.feature}</span>
                    <span className="text-white flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-300 shrink-0" />{row.sovereign}</span>
                    <span className="text-white/40">{row.others}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── ARCHITECTURE ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Architecture</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">One pipeline. Sovereign substrate.</h2>
              </div>
              <div className="relative glass-strong rounded-3xl p-8 overflow-hidden">
                <HudCorners color="#00D9FF" className="opacity-25" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
                  {[
                    { icon: Terminal, label: 'Sovereign API', sub: 'one entrypoint' },
                    { icon: Wand2, label: 'Generation', sub: 'film · image · audio · text' },
                    { icon: Brain, label: 'Intelligence', sub: '7 agents on every output' },
                    { icon: Megaphone, label: 'Distribution', sub: '11 platforms' },
                    { icon: ShieldCheck, label: 'Provenance', sub: 'audit + watermark' },
                  ].map((s, i, a) => (
                    <React.Fragment key={s.label}>
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 text-center">
                        <s.icon className="w-5 h-5 text-cyan-300 mx-auto mb-3" />
                        <div className="font-display font-bold text-white">{s.label}</div>
                        <div className="text-[11px] font-mono text-white/40 mt-1">{s.sub}</div>
                      </div>
                      {i < a.length - 1 && <div className="hidden md:flex items-center justify-center text-cyan-300/40"><ArrowRight className="w-5 h-5" /></div>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-center mt-6 text-[10px] font-mono uppercase tracking-widest text-white/35">queued · audited · retried · rate-limited · owner-scoped tenancy</div>
              </div>
            </div>
          </Reveal>

          {/* ── TIERS ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Operating tiers</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">From foundation to civilization.</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {TIERS.map((tier) => (
                  <div key={tier.name} className={`relative rounded-2xl border p-6 h-full overflow-hidden transition-all duration-500 ease-cinematic hover:-translate-y-1 ${tier.accent ? 'border-cyan-400/40 bg-cyan-400/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}>
                    {tier.accent && <div className="absolute -top-12 -right-12 w-48 h-48 blur-[80px] opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle,#00D9FF,transparent 70%)' }} />}
                    <div className="relative">
                      <div className="kicker text-cyan-300/70 mb-2" style={{ letterSpacing: '0.22em' }}>{tier.accent ? 'Recommended' : 'Tier'}</div>
                      <div className="font-display text-2xl font-bold text-white mb-1">{tier.name}</div>
                      <div className="text-sm text-white/55 mb-5">{tier.sub}</div>
                      <ul className="space-y-2 mb-6 text-sm text-white/70">
                        {tier.features.map((f) => <li key={f} className="flex items-start gap-2"><BadgeCheck className="w-4 h-4 text-cyan-300/80 shrink-0 mt-0.5" /><span>{f}</span></li>)}
                      </ul>
                      <a href="#demo" className={`inline-flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500 ease-cinematic hover:-translate-y-0.5 ${tier.accent ? 'text-white' : 'border border-white/15 text-white/80 hover:text-white hover:border-white/25'}`}
                        style={tier.accent ? { background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' } : undefined}>
                        Begin {tier.name} <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── TRUST ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Trust & integrity</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">Sovereign-grade by construction.</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRUST.map((t) => (
                  <div key={t.t} className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
                    <t.icon className="w-5 h-5 text-cyan-300/85 mb-3" />
                    <div className="font-display font-semibold text-white mb-1">{t.t}</div>
                    <div className="text-sm text-white/55 leading-relaxed">{t.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── FAQ ── */}
          <Reveal>
            <div className="mb-24">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Frequently asked</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance">Institutional questions.</h2>
              </div>
              <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-white/[0.015] divide-y divide-white/5 overflow-hidden">
                {FAQ.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <span className="flex-1 font-display font-semibold text-white">{item.q}</span>
                      <ChevronDown className="w-4 h-4 text-cyan-300/70 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-white/65 leading-relaxed">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── CLOSING CTA ── */}
          <Reveal>
            <div className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden">
              <div className="absolute -inset-10 blur-[140px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #00D9FF, transparent 70%)' }} />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.28em' }}><Crown className="w-3.5 h-3.5" /> Begin</div>
                <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-cinematic text-balance leading-tight mb-5">
                  Own the substrate.
                </h2>
                <p className="text-white/60 max-w-xl mx-auto mb-8 text-lg">Generation, distribution and intelligence — sovereign by design, institutional by intent.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a href="#demo" className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
                    Run the dispatch engine <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link to="/sovereign-domains" className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/25 transition">
                    Acquire your namespace <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default EmergencyAILanding;
