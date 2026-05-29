// Route-segment fallback while a server component streams.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <svg viewBox="0 0 32 32" className="h-8 w-8 animate-pulse" aria-hidden>
        <defs>
          <linearGradient id="ld" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#efd9b3" />
            <stop offset="100%" stopColor="#d4a86a" />
          </linearGradient>
        </defs>
        <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#ld)" strokeWidth="1.4" />
        <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#ld)" opacity="0.85" />
      </svg>
      <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-emrg-mute">EMERGENCY AI · ROUTING</div>
    </div>
  );
}
