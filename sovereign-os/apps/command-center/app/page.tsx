import { MediaClassBar } from '../components/MediaClassBar';
import { PipelineMonitor } from '../components/PipelineMonitor';
import { DistributionGrid } from '../components/DistributionGrid';
import { IntelligencePanel } from '../components/IntelligencePanel';
import { ApiKeysPanel } from '../components/ApiKeysPanel';

export default function CommandOverview() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sov-cyan">Executive Command Overview</h1>
        <p className="mt-1 text-xs text-sov-mute">
          Media acquisition · autonomous distribution · strategic intelligence — one sovereign pipeline.
        </p>
      </div>

      <MediaClassBar />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PipelineMonitor />
        <div className="space-y-6">
          <DistributionGrid />
          <IntelligencePanel />
        </div>
      </div>

      <ApiKeysPanel />
    </div>
  );
}
