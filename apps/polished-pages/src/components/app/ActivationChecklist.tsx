import { Link } from "react-router-dom";
import { Check, Circle, ArrowRight, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Real-progress activation checklist. Each milestone is derived from the user's
// actual library state — no fake "todo" items. Shown once a user has started
// but not yet completed the create → share → list → reach-a-reader journey, so
// there's always one clear next step toward their first real outcome.
export interface ActivationState {
  created: boolean;   // has any saved work
  shared: boolean;    // has shared at least one publicly
  listed: boolean;    // has listed at least one on the marketplace
  hasReader: boolean; // a listed work has at least one view
}

const STEPS: { key: keyof ActivationState; label: string; hint: string; to: string; cta: string }[] = [
  { key: "created", label: "Create your first work", hint: "A CV, a book, a storybook — anything.", to: "/dashboard", cta: "Start creating" },
  { key: "shared", label: "Share it with a link", hint: "Send your work to anyone, instantly.", to: "/library", cta: "Open library" },
  { key: "listed", label: "List it on the marketplace", hint: "Reach readers, parents and schools.", to: "/library", cta: "Publish a work" },
  { key: "hasReader", label: "Reach your first reader", hint: "Share your marketplace link to get discovered.", to: "/catalog", cta: "Browse marketplace" },
];

const ActivationChecklist = ({ state }: { state: ActivationState }) => {
  const done = STEPS.filter((s) => state[s.key]).length;
  const next = STEPS.find((s) => !state[s.key]);
  if (done >= STEPS.length) return null; // fully activated — get out of the way

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <section className="mt-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.05] to-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-bold">Get set up</h2>
            </div>
            <span className="text-xs font-medium text-muted-foreground font-sans">{done} of {STEPS.length} done</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>

          <ul className="mt-4 space-y-1">
            {STEPS.map((s) => {
              const complete = state[s.key];
              const isNext = next?.key === s.key;
              return (
                <li key={s.key} className={`flex items-center gap-3 rounded-lg px-2 py-2 ${isNext ? "bg-primary/[0.06]" : ""}`}>
                  {complete
                    ? <Check className="h-4 w-4 shrink-0 text-primary" />
                    : <Circle className={`h-4 w-4 shrink-0 ${isNext ? "text-primary" : "text-muted-foreground/40"}`} />}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-sans ${complete ? "text-muted-foreground line-through" : "font-medium text-foreground"}`}>{s.label}</div>
                    {isNext && <div className="text-xs text-muted-foreground font-sans">{s.hint}</div>}
                  </div>
                  {isNext && (
                    <Button asChild size="sm" variant="hero" className="shrink-0">
                      <Link to={s.to}>{s.cta} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
};

export default ActivationChecklist;
