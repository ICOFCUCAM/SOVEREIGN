import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { TOOLS } from "@/lib/tools";

// The studio home. First thing a signed-in user sees: their plan/usage at a
// glance, one-click entry to every tool, and what's worth trying next. Replaces
// dropping users straight into a single generator with no sense of the whole.
const Dashboard = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);

  const isPro = status?.plan === "pro";
  const used = status?.used ?? 0;
  const lim = status?.lim ?? 0;
  const pct = lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Your studio</h1>
        <p className="mt-1 text-muted-foreground font-sans">Create recruiter-grade documents — pick a tool to begin.</p>
      </motion.div>

      {/* Plan / usage */}
      <Card className="mt-6 border-border">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isPro ? <Crown className="h-4 w-4 text-gold" /> : <Zap className="h-4 w-4 text-primary" />}
              <span className="font-sans text-sm font-semibold">{isPro ? "Pro plan" : "Free plan"}</span>
            </div>
            {!isPro && status && (
              <div className="mt-3 max-w-md">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans">
                  <span>{used} of {lim} generations used this month</span>
                  <span>{lim - used} left</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            )}
            {isPro && <p className="mt-1 text-sm text-muted-foreground font-sans">Unlimited generations. Thank you for being a Pro member.</p>}
          </div>
          {!isPro && (
            <Button variant="hero" onClick={() => startUpgrade().catch(() => {})}>
              <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tools */}
      <h2 className="mt-10 font-serif text-lg font-semibold">Tools</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {TOOLS.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={t.path} className="group block h-full">
              <Card className="h-full border-border transition-all hover:border-primary/50 hover:shadow-premium">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <t.icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="font-serif text-lg font-semibold">{t.name}</span>
                    {t.badge && (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">{t.badge}</span>
                    )}
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground font-sans">{t.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary font-sans">
                    {t.action} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* What's new */}
      <h2 className="mt-10 font-serif text-lg font-semibold">What's new</h2>
      <Card className="mt-4 border-border bg-gradient-to-br from-muted/40 to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-sans text-sm font-semibold">Sovereign Executive — the new flagship template</p>
              <p className="mt-0.5 text-sm text-muted-foreground font-sans">Board-grade, Nordic-restrained, ATS-safe. Now the default in the CV Builder.</p>
            </div>
          </div>
          <Button asChild variant="heroOutline" size="sm" className="shrink-0">
            <Link to="/cv">Open CV Builder</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
