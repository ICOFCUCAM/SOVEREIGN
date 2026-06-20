import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/tools";

// Conversion surface for high-intent, often logged-out visitors arriving on
// public pages (a shared resource, the marketplace). They've just seen real
// output — this turns that intent into a free signup instead of a dead end.
const CreateCtaBand = ({ heading, sub, cta = "Start free", to = "/dashboard" }: { heading: string; sub: string; cta?: string; to?: string }) => (
  <section className="mt-12 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-background p-6 text-center sm:p-8">
    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-medium text-primary font-sans">Made with {BRAND}</span>
    </div>
    <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight">{heading}</h2>
    <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground font-sans">{sub}</p>
    <Link to={to} className="mt-5 inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 font-sans">
      {cta} <ArrowRight className="h-4 w-4" />
    </Link>
    <p className="mt-2 text-xs text-muted-foreground font-sans">No card required · You own what you create</p>
  </section>
);

export default CreateCtaBand;
