import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Shield, TrendingUp, Sparkles, Gauge } from 'lucide-react';
import type { Domain } from '@/lib/types';
import type { Confidence } from '@/lib/investor';

interface Props {
  domain: Domain;
  /** Investor-mode extras — when provided, the card renders ranked + signal-rich. */
  rank?: number;
  opportunity?: number;
  confidence?: Confidence;
  momentum?: number;
}

const DomainCard: React.FC<Props> = ({ domain, rank, opportunity, confidence, momentum }) => {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const investor = rank !== undefined;
  const scope = typeof domain.metadata?.scope === 'string' ? (domain.metadata.scope as string) : null;

  return (
    <Link to={`/d/${encodeURIComponent(domain.domain_name)}`}
      className="group relative block overflow-hidden rounded-2xl glass hover:glass-strong transition-all duration-500 hover:-translate-y-1 hover:glow-cyan">
      {/* Top glow gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {investor && (
        <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center">
          <span className="text-[11px] font-mono font-bold text-cyan-300">#{rank}</span>
        </div>
      )}

      {/* Background accent */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20 blur-3xl transition-all group-hover:opacity-40"
        style={{ background: `radial-gradient(circle, ${domain.brand_color}, transparent)` }} />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {domain.is_premium && (
              <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Premium</span>
              </div>
            )}
            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">{domain.category}</span>
            </div>
            {scope && (
              <div className="px-2 py-0.5 rounded-md border" style={{ background: `${domain.brand_color}14`, borderColor: `${domain.brand_color}33` }}>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: domain.brand_color }}>{scope}</span>
              </div>
            )}
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-cyan-400 group-hover:rotate-45 transition-all" />
        </div>

        {/* Domain name */}
        <div className="mb-3">
          <div className="text-2xl font-bold tracking-tight text-white group-hover:text-gradient-cyan transition-all">
            {domain.domain_name}
          </div>
          <p className="text-sm text-white/50 mt-1 line-clamp-2 min-h-[2.5rem]">
            {domain.tagline}
          </p>
        </div>

        {/* Valuation ring */}
        <div className="flex items-center justify-between mb-5">
          <div className="relative">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="url(#g1)" strokeWidth="3"
                strokeDasharray={`${(domain.valuation_score / 100) * 150.8} 150.8`} strokeLinecap="round" />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{domain.valuation_score}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono mb-0.5">Asking</div>
            <div className="text-xl font-bold text-white">{fmt.format(domain.price_usd)}</div>
          </div>
        </div>

        {/* Investor signal row */}
        {investor && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1"><Gauge className="w-3 h-3 text-cyan-400" /> Opportunity</div>
              <div className="text-lg font-bold text-white tabular-nums">{opportunity}<span className="text-xs text-white/30">/100</span></div>
            </div>
            <div className="rounded-lg px-3 py-2 border" style={{ background: `${confidence?.color}12`, borderColor: `${confidence?.color}33` }}>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">Confidence</div>
              <div className="text-sm font-bold" style={{ color: confidence?.color }}>{confidence?.level}</div>
            </div>
          </div>
        )}

        {/* Footer trust signals */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <Shield className="w-3 h-3" />
            SSL
          </div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
            <Sparkles className="w-3 h-3" />
            AI-RATED
          </div>
          <div className="flex items-center gap-1 text-[10px] text-purple-400 font-mono ml-auto">
            <TrendingUp className="w-3 h-3" />
            {investor && momentum ? `${momentum} this week` : `${domain.view_count} views`}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DomainCard;
