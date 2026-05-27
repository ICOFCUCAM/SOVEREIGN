import type { DistributionPlatform } from '@sovereign/core/types';
import { Panel } from './Panel';

// LinkedIn + YouTube have live publish paths in layer-2/post-campaign; the rest are seams.
const LIVE: DistributionPlatform[] = ['linkedin', 'youtube'];
const PLATFORMS: { id: DistributionPlatform; label: string }[] = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'threads', label: 'Threads' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'bluesky', label: 'Bluesky' },
];

export function DistributionGrid() {
  return (
    <Panel title="SOVEREIGN DISTRIBUTION GRID" hint="Layer 2 · 11 platforms">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PLATFORMS.map((p) => {
          const live = LIVE.includes(p.id);
          return (
            <div key={p.id} className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
              <span>{p.label}</span>
              <span className={live ? 'text-sov-teal' : 'text-sov-mute'}>{live ? 'LIVE' : 'seam'}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
