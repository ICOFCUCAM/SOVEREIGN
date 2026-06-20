import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2, Crown, CreditCard, ShieldCheck, XCircle, Copyright, ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PLAN_RANK, MARKETPLACE_FEE_PCT, type Plan } from "@/lib/plans";
import { startUpgrade } from "@/lib/session";
import { BRAND } from "@/lib/tools";

// Growth-story caption for each rung, so the page reads as a journey
// (start → grow → publish → organisation → institution) rather than a row of
// equal boxes.
const STAGE: Record<string, string> = {
  creator: "Start here",
  professional: "Grow here",
  publisher: "Build a publishing business",
  business: "Run an organization",
  school: "Equip an institution",
  enterprise: "Power a programme",
};

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

  // Three pricing zones, so the page reads as an ascending ladder rather than a
  // flat row of equal boxes: a slim free lead-in, the self-serve ladder
  // (Creator → Professional → Publisher Pro → Business), and a custom-tier band
  // for schools / NGOs / ministries.
  const free = PLANS.find((p) => p.id === "free");
  const ladder = PLANS.filter((p) => ["creator", "professional", "publisher", "business"].includes(p.id));
  const orgs = PLANS.filter((p) => p.checkout === "contact");

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
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">A plan for every <span className="text-gradient-gold italic">stage of your journey</span></h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground font-sans">
            From your first CV to a multi-language publishing catalog to a national programme — each plan is built for a different stage, and grows with you as you scale.
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

        {/* Zone 1 — Free lead-in. De-emphasised so it reads as the entry rung,
            not a peer of the paid ladder. */}
        {free && (
          <Card className="mt-10 border-border bg-card/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold">{free.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground font-sans">Start here</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground font-sans">{free.target} · 20 text generations &amp; 15 image credits / month · 1 published project</p>
              </div>
              <Button variant="heroOutline" size="sm" className="shrink-0" disabled={busy === free.id} onClick={() => choose(free)}>Get started free</Button>
            </CardContent>
          </Card>
        )}

        {/* Progression rail — the whole growth story in one line (Creator →
            Professional → Publisher Pro → Business → Enterprise), so the value
            hierarchy is legible before the eye even reaches the cards. */}
        <div className="mt-12 hidden flex-wrap items-end justify-center gap-x-1 gap-y-2 md:flex">
          {[...ladder, PLANS.find((p) => p.id === "enterprise")].filter(Boolean).map((p, i, arr) => (
            <span key={p!.id} className="flex items-end gap-1">
              <span className="flex flex-col items-center">
                <span className={`text-sm font-medium font-sans ${p!.highlight ? "text-primary" : "text-foreground/80"}`}>{p!.name}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-sans">{STAGE[p!.id]}</span>
              </span>
              {i < arr.length - 1 && <ArrowRight className="mb-3.5 h-3.5 w-3.5 text-muted-foreground/50" />}
            </span>
          ))}
        </div>

        {/* Zone 2 — the self-serve ladder. Each rung escalates in visual weight:
            rank pips, a top accent bar that brightens with tier, and distinct
            treatments for the recommended (Professional) and top (Business) rungs. */}
        <div className="mt-5 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ladder.map((plan, idx) => {
            const rank = PLAN_RANK[plan.id] ?? 1; // 1..4 across the ladder
            const featured = plan.highlight;       // Professional
            const isGold = plan.id === "publisher";
            const isTop = plan.id === "business";
            const cardTone = featured
              ? "border-primary/60 shadow-premium ring-1 ring-primary/20 bg-gradient-to-b from-primary/[0.05] to-card"
              : isGold
                ? "border-gold/30 bg-gradient-to-b from-gold/[0.04] to-card"
                : isTop
                  ? "border-foreground/25 shadow-premium bg-gradient-to-b from-foreground/[0.05] to-card"
                  : "border-border";
            const pipColor = isTop ? "bg-foreground" : isGold ? "bg-gold" : "bg-primary";
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`relative ${featured ? "lg:-mt-2" : ""}`}
              >
                {featured && (
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-gold/20 opacity-60 blur-xl" />
                )}
                <Card className={`relative flex h-full flex-col overflow-hidden ${cardTone}`}>
                  {/* escalating top accent bar */}
                  <div className="h-1 w-full bg-gold-gradient" style={{ opacity: 0.25 + rank * 0.18 }} />
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-primary px-4 py-0.5 text-xs font-semibold text-primary-foreground font-sans shadow-sm">Most popular</span>
                  )}
                  {isTop && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-0.5 text-xs font-semibold text-background font-sans">Most powerful</span>
                  )}
                  <CardContent className="flex h-full flex-col p-5">
                    {/* rank pips — fills 1→4 up the ladder */}
                    <div className="flex gap-1" aria-hidden>
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={`h-1 w-5 rounded-full ${n <= rank ? pipColor : "bg-border"}`} />
                      ))}
                    </div>
                    <p className={`mt-3 text-[11px] font-semibold uppercase tracking-wide font-sans ${isGold ? "text-gold" : isTop ? "text-foreground/70" : "text-primary"}`}>{STAGE[plan.id]}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {featured && <Crown className="h-4 w-4 text-gold" />}
                      {isGold && <Crown className="h-4 w-4 fill-gold text-gold" />}
                      {isTop && <Building2 className="h-4 w-4 text-foreground" />}
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
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isGold ? "text-gold" : isTop ? "text-foreground" : "text-primary"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={featured || isGold || isTop ? "hero" : "heroOutline"}
                      className={`mt-5 w-full ${isGold ? "border-0 bg-gradient-to-r from-gold/90 to-amber-500 text-white hover:from-gold hover:to-amber-400" : isTop ? "border-0 bg-foreground text-background hover:bg-foreground/90" : ""}`}
                      disabled={busy === plan.id}
                      onClick={() => choose(plan)}
                    >
                      {busy === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {`Choose ${plan.name}`}
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

        {/* Zone 3 — organizations band: the apex of the growth story. Richest,
            most premium treatment on the page so schools, NGOs and ministries
            read as the top of the ladder, not a sidecar. */}
        {orgs.length > 0 && (
          <div className="mt-16">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold font-sans">The top of the ladder</p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">…and when you’re running an institution</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground font-sans">Annual licensing, teacher and student accounts, custom curriculum support and dedicated onboarding — priced to your programme.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {orgs.map((plan) => {
                const isApex = plan.id === "enterprise";
                return (
                <Card key={plan.id} className={`relative flex h-full flex-col overflow-hidden shadow-premium ${isApex ? "border-gold/40 bg-gradient-to-br from-foreground/[0.07] via-card to-gold/[0.05]" : "border-foreground/15 bg-gradient-to-br from-secondary/60 to-card"}`}>
                  <div className="h-1 w-full bg-gold-gradient" />
                  <CardContent className="flex h-full flex-col p-5">
                    <p className={`text-[11px] font-semibold uppercase tracking-wide font-sans ${isApex ? "text-gold" : "text-foreground/70"}`}>{STAGE[plan.id]}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {isApex ? <Crown className="h-4 w-4 fill-gold text-gold" /> : <Building2 className="h-4 w-4 text-foreground" />}
                      <h3 className="font-serif text-lg font-bold">{plan.name}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground font-sans">{plan.target}</p>
                    <div className="mt-3 font-serif text-2xl font-bold">{plan.priceLabel}<span className="ml-1 text-sm font-normal text-muted-foreground font-sans">{plan.cadence}</span></div>
                    <ul className="mt-4 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm font-sans">
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isApex ? "text-gold" : "text-foreground"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="hero" className={`mt-5 w-full sm:w-auto ${isApex ? "border-0 bg-gradient-to-r from-gold/90 to-amber-500 text-white hover:from-gold hover:to-amber-400" : ""}`} disabled={busy === plan.id} onClick={() => choose(plan)}>
                      Talk to us <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        )}

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
  { q: "What is an image credit?", a: "One credit generates one AI image — a book cover, a storybook illustration or a coloring page. Everyday text generation (CVs, letters, single chapters) isn’t capped on paid plans; image generation is metered with monthly credits that scale by tier." },
  { q: "Do I own what I create?", a: "Yes. Everything you make is yours, with full commercial rights on paid plans — export to KDP and IngramSpark and sell it without restriction." },
  { q: "How much do I keep from sales?", a: `Creators keep ${100 - MARKETPLACE_FEE_PCT}% of every paid marketplace sale. There are no listing fees, and free resources stay free.` },
  { q: "Can I cancel or change plans?", a: "Anytime, from your account. Upgrades take effect immediately; if you cancel you keep access through the period you've paid for." },
  { q: "Need extra images?", a: "Buy image-credit packs from your account on any plan — they never expire and stack on top of your monthly allowance." },
];

export default Pricing;
