import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Crown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPlanStatus, startUpgrade } from "@/lib/session";
import { planAllows, planById, FEATURE_MIN_PLAN, type StudioFeature } from "@/lib/plans";

// Wraps a studio route: if the signed-in user's plan is below the tier the
// studio requires, show an upgrade panel instead of the studio. The server
// enforces the same gate (requirePlanOrThrow) — this is the matching UX so a
// locked studio never just errors at generation time.
const RequirePlan = ({ feature, children }: { feature: StudioFeature; children: React.ReactNode }) => {
  const [plan, setPlan] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetchPlanStatus().then((s) => setPlan(s?.plan ?? "free")).catch(() => setPlan("free"));
  }, []);

  if (plan === undefined) {
    return <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-16 text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  if (planAllows(plan, feature)) return <>{children}</>;

  const required = planById(FEATURE_MIN_PLAN[feature]);
  const canSelfServe = required?.checkout === "subscription";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-background shadow-e3">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gold-gradient opacity-80" />
        <CardContent className="p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary font-sans">Included from {required?.name ?? "Professional"}</p>
          <h1 className="mt-1 font-serif text-2xl font-bold">Unlock this studio</h1>
          <div className="mt-3 inline-flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-primary">{required?.priceLabel}</span>
            <span className="text-sm text-muted-foreground font-sans">{required?.cadence}</span>
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground font-sans text-pretty">
            Upgrade to the {required?.name ?? "Professional"} plan to unlock it — your existing work and every other tool stay exactly as they are.
          </p>
          {required && (
            <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
              {required.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-sans">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {canSelfServe && required ? (
              <Button variant="hero" onClick={() => startUpgrade(required.id).catch(() => {})}>
                <Crown className="mr-2 h-4 w-4" /> Upgrade to {required.name}
              </Button>
            ) : (
              <Button asChild variant="hero"><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> See plans</Link></Button>
            )}
            <Button asChild variant="heroOutline"><Link to="/pricing">Compare all plans</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequirePlan;
