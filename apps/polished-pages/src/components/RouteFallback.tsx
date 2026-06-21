import SpineMark from "@/components/brand/SpineMark";

// On-brand fallback shown while a lazily-loaded route chunk is fetched. Uses the
// signature spine mark so even the loading moment is unmistakably Polished Pages.
const RouteFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background" role="status" aria-label="Loading">
    <SpineMark size="md" animated />
    <span className="eyebrow text-muted-foreground/70">Polished Pages</span>
  </div>
);

export default RouteFallback;
