import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { EcosystemProduct } from '@/lib/types';

// Country-coded products (e.g. `relocation-us`) surface a flag emoji.
export function flagForSlug(slug: string): string | null {
  const m = slug.match(/-([a-z]{2})$/i);
  if (!m) return null;
  const cc = m[1].toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  try {
    const codes = cc.split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codes);
  } catch { return null; }
}

const STATUS_BADGES = ['LIVE MARKET', 'ENTERPRISE READY', 'ACQUISITION READY'] as const;

interface Props { p: EcosystemProduct; compact?: boolean }

// Sovereign-grade infrastructure asset listing — institutional acquisition card.
export const RelocationMarketplaceCard: React.FC<Props> = ({ p, compact }) => {
  const accent = p.accent || '#10B981';
  const flag = flagForSlug(p.slug);
  const cities = (p.capabilities || []) as string[];
  const metrics = p.metrics || [];
  const estimated = metrics.find((m) => /infrastructure value|valuation/i.test(m.label));
  const featured = metrics.find((m) => /featured|acquisition opportunity/i.test(m.label));

  return (
    <Link
      to={`/systems/${p.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/8 bg-white/[0.012] p-7 ease-cinematic transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_44px_96px_-46px_rgba(0,0,0,0.92)]"
    >
      {/* faint accent edges */}
      <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[120px] opacity-[0.08] group-hover:opacity-[0.18] transition-opacity" style={{ background: accent }} />
      {featured && (
        <span className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full blur-[120px] opacity-[0.06] group-hover:opacity-[0.14] transition-opacity" style={{ background: '#d4a86a' }} />
      )}

      <div className="relative">
        {/* top label */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.28em]" style={{ color: accent }}>
            TRANSPORT &amp; LOGISTICS INFRASTRUCTURE
          </span>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        {/* title + flag */}
        <div className="flex items-start gap-3">
          {flag && (
            <span aria-hidden className="text-3xl leading-none mt-1 shrink-0" style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.6))' }}>
              {flag}
            </span>
          )}
          <h3 className="font-display text-2xl font-bold text-white tracking-tight leading-[1.1]">{p.name}</h3>
        </div>

        {/* description */}
        {!compact && p.description && (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 line-clamp-3">{p.description}</p>
        )}

        {/* coverage */}
        {cities.length > 0 && (
          <div className="mt-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35 mb-2">Coverage</div>
            <div className="text-[13px] text-white/75 leading-snug">{cities.join(' · ')}</div>
          </div>
        )}

        {/* status badges */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {STATUS_BADGES.map((b) => (
            <span
              key={b}
              className="text-[9px] font-mono uppercase tracking-[0.22em] px-2 py-1 rounded border"
              style={{ borderColor: `${accent}33`, color: `${accent}cc`, background: `${accent}0d` }}
            >
              {b}
            </span>
          ))}
        </div>

        {/* valuation */}
        <div className="mt-7 pt-5 border-t border-white/8">
          {estimated && (
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Estimated Infrastructure Value</div>
                <div className="font-display text-3xl font-bold text-white tabular-nums leading-none mt-2">{estimated.value}</div>
              </div>
            </div>
          )}
          {featured && (
            <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/90">Featured Acquisition Opportunity</div>
                <div className="font-display text-lg font-bold text-white tabular-nums">{featured.value}</div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/80 hidden sm:inline">ACQUISITION READY</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
