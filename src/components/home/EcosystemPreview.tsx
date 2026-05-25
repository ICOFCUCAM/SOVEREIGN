import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const SECTORS = [
  { n: '01', label: 'Governance & Integrity', systems: 'CivicOS · ACT · ELECPRO', accent: '#6366F1' },
  { n: '02', label: 'Finance & Banking', systems: 'Veritas Financial · Mobile Pay', accent: '#3B82F6' },
  { n: '03', label: 'Knowledge & Intelligence', systems: 'VeritasOS · EduPro', accent: '#22D3EE' },
  { n: '04', label: 'Logistics & Mobility', systems: 'FlyttGo Global · FlyttGo Norway', accent: '#10B981' },
  { n: '05', label: 'Commerce & Deployment', systems: 'Marketplace · Deployment Engine', accent: '#F59E0B' },
];

const EcosystemPreview: React.FC = () => {
  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">The ecosystem</div>
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tighter leading-[0.95] max-w-2xl">
              Sovereign infrastructure, organized by sector.
            </h2>
          </div>
          <Link to="/ecosystem" className="group inline-flex items-center gap-2 text-white font-semibold self-start lg:self-end shrink-0">
            Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
          </Link>
        </div>

        {/* Editorial rows */}
        <div className="border-t border-white/10">
          {SECTORS.map((s) => (
            <Link key={s.n} to="/ecosystem"
              className="group relative flex items-center gap-6 sm:gap-10 py-7 sm:py-9 border-b border-white/10 transition-colors hover:bg-white/[0.02]">
              <div className="absolute left-0 top-0 bottom-0 w-px transition-all duration-500 group-hover:w-1" style={{ background: s.accent }} />
              <span className="font-mono text-sm text-white/30 w-8 shrink-0 pl-3 sm:pl-4">{s.n}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-white/85 group-hover:text-white transition-colors">
                  {s.label}
                </div>
              </div>
              <div className="hidden sm:block text-sm font-mono text-white/40 text-right max-w-[40%] truncate">{s.systems}</div>
              <ArrowUpRight className="w-5 h-5 shrink-0 mr-1 text-white/20 group-hover:text-white transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemPreview;
