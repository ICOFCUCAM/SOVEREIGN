import { Sparkles } from "lucide-react";

// Lightweight, on-brand fallback shown while a lazily-loaded route chunk is
// fetched. Intentionally minimal so it appears instantly.
const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Sparkles className="h-6 w-6 animate-pulse text-primary" aria-label="Loading" />
  </div>
);

export default RouteFallback;
