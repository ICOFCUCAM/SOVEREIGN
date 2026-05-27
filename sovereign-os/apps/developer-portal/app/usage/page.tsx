import { UsageSummary } from '../../components/UsageSummary';

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sov-cyan">Usage</h1>
        <p className="mt-1 text-xs text-sov-mute">
          API consumption metered from `api_usage`, the same counter that enforces monthly quotas.
        </p>
      </div>
      <UsageSummary />
    </div>
  );
}
