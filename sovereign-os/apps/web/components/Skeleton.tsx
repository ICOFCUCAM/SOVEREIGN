// Animated skeleton placeholder for loading states.
// Style matches emrg-panel borders; subtle pulse to suggest activity.

interface Props { className?: string }

export function Skeleton({ className = '' }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-emrg-edge/60 bg-emrg-surface/40 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-emrg-edge/40 to-transparent" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
