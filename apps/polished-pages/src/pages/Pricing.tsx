import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, MARKETPLACE_FEE_PCT, type Plan } from "@/lib/plans";
import { startUpgrade } from "@/lib/session";
import { BRAND } from "@/lib/tools";

// Public pricing page rendering the full plan ladder from the plans config.
const Pricing = () => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const choose = async (plan: Plan) => {
    if (plan.checkout === "contact") {
      window.location.href = `mailto:?subject=${encodeURIComponent(`${BRAND} — ${plan.name} enquiry`)}`;
      return;
    }
    if (plan.id === "free") {
      const { data } = await supabase.auth.getSession();
      window.location.href = data.session ? "/dashboard" : "/auth";
      return;
    }
    setBusy(plan.id);
    try {
      await startUpgrade(plan.id);
    } catch (e) {
      toast({ title: "Could not start checkout", description: e instanceof Error ? e.message : "", variant: "destructive" });
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold" /><span className="font-serif text-base font-bold">{BRAND}</span></Link>
          <Link to="/dashboard" className="text-sm text-primary hover:underline font-sans">Open the studio</Link>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">Plans for every <span className="text-gradient-gold italic">creator and publisher</span></h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground font-sans">
            From a first CV to a multi-language publishing house. Text is unlimited on every paid plan; image credits scale with how much you create.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={`relative flex h-full flex-col border-border ${plan.highlight ? "border-primary/60 shadow-premium" : ""}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground font-sans">Most popular</span>
              )}
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-center gap-2">
                  {plan.highlight && <Crown className="h-4 w-4 text-gold" />}
                  <h3 className="font-serif text-lg font-bold">{plan.name}</h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground font-sans">{plan.target}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold">{plan.priceLabel}</span>
                  {plan.cadence && <span className="text-sm text-muted-foreground font-sans">{plan.cadence}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-sans">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "hero" : "heroOutline"}
                  className="mt-5 w-full"
                  disabled={busy === plan.id}
                  onClick={() => choose(plan)}
                >
                  {busy === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {plan.checkout === "contact" ? "Contact sales" : plan.id === "free" ? "Get started" : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground font-sans">
          Creators keep {100 - MARKETPLACE_FEE_PCT}% of marketplace sales. Need extra images on any plan? Buy image-credit packs from your{" "}
          <Link to="/account" className="text-primary hover:underline">account</Link>.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
