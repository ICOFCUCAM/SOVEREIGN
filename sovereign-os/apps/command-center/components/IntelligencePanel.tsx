import { Panel } from './Panel';

// Mirrors the layer-3 agent registry. analyze-lead is the live acquisition seed; the
// seven strategic agents are typed seams until inference is wired.
const AGENTS: { id: string; label: string; live?: boolean }[] = [
  { id: 'content', label: 'Content' },
  { id: 'viral', label: 'Viral' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'brand-guardian', label: 'Brand Guardian' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'crisis-intelligence', label: 'Crisis Intelligence' },
  { id: 'executive-briefing', label: 'Executive Briefing' },
];

export function IntelligencePanel() {
  return (
    <Panel title="STRATEGIC INTELLIGENCE ENGINE" hint="Layer 3 · 7 agents">
      <div className="space-y-1.5">
        {AGENTS.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
            <span>{a.label} Agent</span>
            <span className="text-sov-mute">{a.live ? 'LIVE' : 'seam'}</span>
          </div>
        ))}
        <div className="pt-1 text-[10px] text-sov-mute">acquisition scoring (analyze-lead) operational</div>
      </div>
    </Panel>
  );
}
