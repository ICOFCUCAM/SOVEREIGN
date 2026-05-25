import React from 'react';

type Kind = 'deploy' | 'valuation' | 'acquisition' | 'region' | 'negotiation' | 'live' | 'settlement' | 'demand';
const COLOR: Record<Kind, string> = {
  deploy: '#10B981', valuation: '#00D9FF', acquisition: '#7C4DFF', region: '#22D3EE',
  negotiation: '#FFB547', live: '#10B981', settlement: '#00E599', demand: '#FFB547',
};

const EVENTS: Array<[Kind, string]> = [
  ['deploy', 'govmesh.ai deployed · us-east · 84s'],
  ['valuation', 'AI valuation · sovereignpay.io · 94/100'],
  ['acquisition', 'flyttgo.no acquired · $180K'],
  ['region', 'ap-south scaling · +3 edge nodes'],
  ['settlement', 'Mobile Pay · $4.2M settled / 24h'],
  ['negotiation', 'active negotiation · civicmesh.gov'],
  ['live', 'ELECPRO · 11/45 districts reporting'],
  ['demand', 'inquiry surge · veritas.ai · +38%'],
  ['deploy', 'edupro.app provisioned · sa-east · 79s'],
  ['valuation', 'AI valuation · ledgerstate.io · 91/100'],
  ['region', 'eu-west · 23 regions online'],
  ['acquisition', 'mobilepay.io reserved · escrow open'],
  ['settlement', 'Veritas Financial · $184.6B cleared'],
  ['demand', 'ACT oversight · 12 anomalies traced'],
];

const Item: React.FC<{ kind: Kind; text: string }> = ({ kind, text }) => (
  <span className="inline-flex items-center gap-2 px-5 shrink-0">
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR[kind], boxShadow: `0 0 6px ${COLOR[kind]}` }} />
    <span className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: COLOR[kind] }}>{kind}</span>
    <span className="text-xs text-white/65 font-mono whitespace-nowrap">{text}</span>
    <span className="text-white/15 ml-3">/</span>
  </span>
);

const LiveActivityStrip: React.FC = () => {
  const stream = [...EVENTS, ...EVENTS];
  return (
    <div className="relative border-y border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
      <div className="flex items-stretch">
        <div className="shrink-0 flex flex-col justify-center px-4 sm:px-6 border-r border-white/10 bg-gradient-to-r from-cyan-500/10 to-transparent">
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Ecosystem pulse</span>
          <span className="hidden sm:block text-[9px] font-mono text-white/35 mt-1">Live activity across the sovereign network</span>
        </div>
        <div className="relative flex-1 overflow-hidden ticker-track">
          <div className="flex items-center py-2.5 animate-ticker w-max">
            {stream.map(([k, t], i) => <Item key={i} kind={k} text={t} />)}
          </div>
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16" style={{ background: 'linear-gradient(90deg, #050816, transparent)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16" style={{ background: 'linear-gradient(270deg, #050816, transparent)' }} />
        </div>
      </div>
    </div>
  );
};

export default LiveActivityStrip;
