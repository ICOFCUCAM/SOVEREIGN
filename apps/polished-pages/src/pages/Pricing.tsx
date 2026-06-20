import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2, Crown, CreditCard, ShieldCheck, XCircle, Copyright } from "lucide-react";
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

        {/* Risk-reduction strip: answers the objections that stall the upgrade
            decision, right above the plan grid where the choice is made. */}
        <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-sans">
          <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-primary" /> Start free — no card required</span>
          <span className="inline-flex items-center gap-1.5"><XCircle className="h-4 w-4 text-primary" /> Cancel anytime</span>
          <span className="inline-flex items-center gap-1.5"><Copyright className="h-4 w-4 text-primary" /> You own what you create</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Keep {100 - MARKETPLACE_FEE_PCT}% of sales</span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
          {PLANS.map((plan, idx) => {
            const isGold = plan.id === "publisher";
            const featured = plan.highlight;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`relative ${featured ? "md:-mt-3 md:scale-[1.02]" : ""}`}
              >
                {featured && (
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-gold/20 blur-xl opacity-60" />
                )}
                <Card className={`relative flex h-full flex-col ${featured ? "border-primary/60 shadow-premium ring-1 ring-primary/20 bg-gradient-to-b from-primary/[0.04] to-card" : isGold ? "border-gold/30 bg-gradient-to-b from-gold/[0.03] to-card" : "border-border"}`}>
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-primary px-4 py-0.5 text-xs font-semibold text-primary-foreground font-sans shadow-sm">Most popular</span>
                  )}
                  {isGold && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold/80 to-amber-400 px-4 py-0.5 text-xs font-semibold text-white font-sans">Publisher Pro</span>
                  )}
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-2">
                      {featured && <Crown className="h-4 w-4 text-gold" />}
                      {isGold && <Crown className="h-4 w-4 text-gold fill-gold" />}
                      <h3 className="font-serif text-lg font-bold">{plan.name}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground font-sans">{plan.target}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`font-serif text-3xl font-bold ${isGold ? "text-gold" : featured ? "text-primary" : ""}`}>{plan.priceLabel}</span>
                      {plan.cadence && <span className="text-sm text-muted-foreground font-sans">{plan.cadence}</span>}
                    </div>
                    <ul className="mt-4 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm font-sans">
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isGold ? "text-gold" : "text-primary"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={featured || isGold ? "hero" : "heroOutline"}
                      className={`mt-5 w-full ${isGold ? "bg-gradient-to-r from-gold/90 to-amber-500 text-white border-0 hover:from-gold hover:to-amber-400" : ""}`}
                      disabled={busy === plan.id}
                      onClick={() => choose(plan)}
                    >
                      {busy === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {plan.checkout === "contact" ? "Contact sales" : plan.id === "free" ? "Get started" : `Choose ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground font-sans">
          Creators keep {100 - MARKETPLACE_FEE_PCT}% of marketplace sales. Need extra images on any plan? Buy image-credit packs from your{" "}
          <Link to="/account" className="text-primary hover:underline">account</Link>.
        </p>

        {/* Objection-handling FAQ — honest answers to the questions that keep
            people from upgrading. Plain copy, no marketing inflation. */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center font-serif text-2xl font-bold tracking-tight">Questions, answered</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card/50 p-4">
                <h3 className="font-sans text-sm font-semibold text-foreground">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground font-sans">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const FAQS: { q: string; a: string }[] = [
  { q: "What does the free plan include?", a: "20 text generations and 15 image credits a month, plus one published project — enough to make a real CV, a short storybook or a sample, with no card required." },
  { q: "What is an image credit?", a: "One credit generates one AI image — a book cover, a storybook illustration or a coloring page. Text generation is unlimited on every paid plan; only images are metered." },
  { q: "Do I own what I create?", a: "Yes. Everything you make is yours, with full commercial rights on paid plans — export to KDP and IngramSpark and sell it without restriction." },
  { q: "How much do I keep from sales?", a: `Creators keep ${100 - MARKETPLACE_FEE_PCT}% of every paid marketplace sale. There are no listing fees, and free resources stay free.` },
  { q: "Can I cancel or change plans?", a: "Anytime, from your account. Upgrades take effect immediately; if you cancel you keep access through the period you've paid for." },
  { q: "Need extra images?", a: "Buy image-credit packs from your account on any plan — they never expire and stack on top of your monthly allowance." },
];

export default Pricing;
