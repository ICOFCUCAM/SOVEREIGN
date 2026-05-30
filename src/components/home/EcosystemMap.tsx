import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Vote, Plus } from 'lucide-react';

// Institutional functions Sovereign delivers infrastructure for. The named
// systems are EXAMPLES of deployable infrastructure available through Sovereign
// (hence "e.g."), not a fixed or exhaustive internal portfolio.
interface Sector { label: string; systems: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent: string }
const SECTORS: Sector[] = [
  { label: 'Governance', systems: 'e.g. CivicOS', icon: Scale, accent: '#6366F1' },
  { label: 'Finance', systems: 'e.g. Veritas Financial', icon: Banknote, accent: '#10B981' },
  { label: 'Mobility', systems: 'e.g. FlyttGo', icon: Truck, accent: '#F59E0B' },
  { label: 'Intelligence', systems: 'e.g. VeritasOS', icon: Cpu, accent: '#7C4DFF' },
  { label: 'Education', systems: 'e.g. EduPro', icon: GraduationCap, accent: '#22D3EE' },
  { label: 'Commerce', systems: 'e.g. Marketplace', icon: ShoppingCart, accent: '#00C2FF' },
  { label: 'Elections', systems: 'e.g. ELECPRO', icon: Vote, accent: '#06B6D4' },
  { label: 'And more', systems: 'an open catalog', icon: Plus, accent: '#00E599' },
];

// radial geometry — angle per sector, starting at top, clockwise.
const positioned = SECTORS.map((s, i) => {
  const a = (-90 + i * 45) * (Math.PI / 180);
  return { ...s, left: 50 + Math.cos(a) * 39, top: 50 + Math.sin(a) * 39, sx: 100 + Math.cos(a) * 78, sy: 100 + Math.sin(a) * 78 };
});

const EcosystemMap: React.FC = () => (
  <section id="network" className="scroll-mt-28 py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="kicker text-cyan-300/70 mb-5" style={{ letterSpacing: '0.3em' }}>Infrastructure for institutions</div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic text-balance text-white leading-[0.98]">
          Infrastructure for every institutional function.
        </h2>
        <p className="text-white/55 mt-5 max-w-xl mx-auto leading-relaxed">
          Whatever your institution operates, Sovereign delivers the infrastructure to run it. The systems below are examples available through Sovereign — the catalog is open and always growing.
        </p>
      </div>

      {/* radial constellation (md+) */}
      <div className="relative mx-auto hidden md:block" style={{ width: 'min(100%, 680px)', aspectRatio: '1 / 1' }}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(0,194,255,0.12)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(124,77,255,0.12)" strokeWidth="0.4" />
          {positioned.map((s, i) => (
            <g key={i}>
              <line x1="100" y1="100" x2={s.sx} y2={s.sy} stroke={s.accent} strokeOpacity="0.22" strokeWidth="0.5" />
              <line x1="100" y1="100" x2={s.sx} y2={s.sy} stroke="#fff" strokeWidth="1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.4}s` }} />
            </g>
          ))}
          <circle cx="100" cy="100" r="9" fill="none" stroke="#00D9FF" strokeWidth="0.7" className="animate-ring" style={{ transformOrigin: '100px 100px' }} />
        </svg>

        {/* core — the customer institution is the operator at the centre;
            infrastructures are delivered to it. Sovereign is the provider, not
            the consuming core. */}
        <Link to="/deploy" className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 z-10">
          <div className="glass-strong rounded-2xl border border-cyan-400/30 px-5 py-4 text-center shadow-2xl" style={{ boxShadow: '0 0 40px rgba(0,194,255,0.25)' }}>
            <div className="font-display text-white font-bold tracking-tight leading-none">YOUR INSTITUTION</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-cyan-300/70 mt-1.5">Deploys through Sovereign</div>
          </div>
        </Link>

        {/* sector nodes */}
        {positioned.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={`/ecosystem#${s.label.toLowerCase()}`} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${s.left}%`, top: `${s.top}%` }}>
              <div className="glass rounded-xl border border-white/10 px-3.5 py-2.5 flex items-center gap-2.5 hover:border-white/30 hover:bg-white/[0.04] transition-all whitespace-nowrap">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.accent}1f`, border: `1px solid ${s.accent}40` }}>
                  <Icon className="w-4 h-4" style={{ color: s.accent }} />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white">{s.label}</div>
                  <div className="text-[9px] font-mono text-white/45">{s.systems}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* grid fallback (mobile) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {SECTORS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={`/ecosystem#${s.label.toLowerCase()}`} className="glass rounded-xl border border-white/10 p-4">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.accent}1f`, border: `1px solid ${s.accent}40` }}>
                <Icon className="w-4 h-4" style={{ color: s.accent }} />
              </span>
              <div className="text-sm font-semibold text-white">{s.label}</div>
              <div className="text-[10px] font-mono text-white/45 mt-0.5">{s.systems}</div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

export default EcosystemMap;
