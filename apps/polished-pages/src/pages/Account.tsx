import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, LogOut, Zap, Check, UserCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlanStatus, startUpgrade, type PlanStatus } from "@/lib/session";
import { getMyProfile, upsertProfile } from "@/lib/profiles";
import { BRAND } from "@/lib/tools";

const PRO_PERKS = [
  "Unlimited CV, cover-letter and book generations",
  "Every premium template family, including the flagship",
  "Job tailoring with cover letter and fit analysis",
  "Priority generation",
];

const Account = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [email, setEmail] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchPlanStatus().then(setStatus);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    getMyProfile()
      .then((p) => { if (p) { setDisplayName(p.display_name); setBio(p.bio ?? ""); } })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  const saveProfile = async () => {
    if (!displayName.trim()) { toast({ title: "Display name required", variant: "destructive" }); return; }
    setSavingProfile(true);
    try {
      await upsertProfile(displayName.trim(), bio);
      toast({ title: "Profile saved", description: "It appears on your public author page." });
    } catch (e) {
      toast({ title: "Could not save profile", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-base"><UserCircle className="h-4 w-4 text-primary" /> Creator profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground font-sans">
            Your public author page shows this name and bio next to everything you publish to the catalog. Use the same display name when you publish so readers can find all your work.
          </p>
          {!profileLoaded ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="max-w-lg space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground font-sans">Display name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Maria Okonkwo" maxLength={80} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground font-sans">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A sentence or two about the kind of books and learning materials you create." rows={3} maxLength={600} />
              </div>
              <Button variant="hero" size="sm" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
