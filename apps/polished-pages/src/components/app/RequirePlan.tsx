import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Crown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPlanStatus } from "@/lib/session";
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
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </span>
          <h1 className="font-serif text-2xl font-bold">A {required?.name ?? "Professional"} studio</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground font-sans">
            This studio is included from the {required?.name ?? "Professional"} plan ({required?.priceLabel}{required?.cadence}). Upgrade to unlock it — your existing work and other tools stay exactly as they are.
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
            <Button asChild variant="hero"><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> See plans</Link></Button>
            <Button asChild variant="heroOutline"><Link to="/dashboard">Back to dashboard</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequirePlan;
