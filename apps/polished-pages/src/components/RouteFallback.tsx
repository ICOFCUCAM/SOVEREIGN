import SpineMark from "@/components/brand/SpineMark";

// On-brand fallback shown while a lazily-loaded route chunk is fetched. Pairs
// the real Polished Pages mark with the signature spine loader, so even the
// loading moment is unmistakably the brand.
const RouteFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background" role="status" aria-label="Loading">
    <img src="/logo-mark.png" alt="Polished Pages" className="h-11 w-auto" width={65} height={44} />
    <SpineMark size="sm" animated />
  </div>
);

export default RouteFallback;
