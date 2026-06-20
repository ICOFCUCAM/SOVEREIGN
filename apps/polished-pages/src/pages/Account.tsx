import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, LogOut, Zap, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { BRAND } from "@/lib/tools";

const PRO_PERKS = [
  "Unlimited CV, cover-letter and book generations",
  "Every premium template family, including the flagship",
  "Job tailoring with cover letter and fit analysis",
  "Priority generation",
];

const Account = () => {
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [email, setEmail] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchPlanStatus().then(setStatus);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const isPro = status?.plan === "pro";
  const used = status?.used ?? 0;
  const lim = status?.lim ?? 0;
  const pct = lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;

  const upgrade = async () => {
    setUpgrading(true);
    try { await startUpgrade(); } catch (e) { alert(e instanceof Error ? e.message : "Upgrade failed"); setUpgrading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Account &amp; billing</h1>
        <p className="mt-1 text-muted-foreground font-sans">Manage your {BRAND} plan and session.</p>
      </motion.div>

      <Card className="mt-6 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            {isPro ? <Crown className="h-4 w-4 text-gold" /> : <Zap className="h-4 w-4 text-primary" />}
            {isPro ? "Pro plan" : "Free plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPro && status && (
            <div className="max-w-md">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans">
                <span>{used} of {lim} generations used this month</span>
                <span>{lim - used} left</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
          {isPro && <p className="text-sm text-muted-foreground font-sans">You have unlimited generations.</p>}
          {!status && <p className="text-sm text-muted-foreground font-sans">Loading plan…</p>}
        </CardContent>
      </Card>

      {!isPro && (
        <Card className="mt-5 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Upgrade to Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PRO_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm font-sans">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}
                </li>
              ))}
            </ul>
            <Button variant="hero" className="mt-5" onClick={upgrade} disabled={upgrading}>
              <Crown className="mr-2 h-4 w-4" /> {upgrading ? "Starting checkout…" : "Upgrade to Pro"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-5 border-border">
        <CardHeader><CardTitle className="font-serif text-base">Session</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm font-sans">
            <div className="text-muted-foreground">Signed in as</div>
            <div className="font-medium">{email || "…"}</div>
          </div>
          <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
