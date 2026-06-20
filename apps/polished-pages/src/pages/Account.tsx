import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, LogOut, Zap, Check, UserCircle, Loader2, ImagePlus, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { fetchPlanStatus, startUpgrade, buyCredits, CREDITS_PER_PACK, type PlanStatus } from "@/lib/session";
import { getMyProfile, upsertProfile } from "@/lib/profiles";
import { getBatchUsage } from "@/lib/editions";
import { planDisplayName } from "@/lib/plans";
import { BRAND } from "@/lib/tools";

// Soft, informational threshold for the heavy-usage advisory. Not a limit —
// it only changes the copy shown, never blocks anything.
const HEAVY_USAGE_NOTICE = 500;

const PRO_PERKS = [
  "Unlimited everyday documents — CVs, letters, single chapters & lessons",
  "From 250 image credits / month for storybooks, covers and colouring pages",
  "Full commercial rights — sell on the marketplace and publish to KDP / IngramSpark",
  "Library, version history, collections and premium templates",
  "Higher tiers add the publishing studios, multi-language and priority",
];

const Account = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [email, setEmail] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [batchUnits, setBatchUnits] = useState<number | null>(null);

  useEffect(() => {
    getBatchUsage().then(setBatchUnits).catch(() => setBatchUnits(0));
    fetchPlanStatus().then(setStatus);
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    getMyProfile()
      .then((p) => { if (p) { setDisplayName(p.display_name); setBio(p.bio ?? ""); } })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits") === "1") {
      toast({ title: "Image credits added", description: "Your purchased credits are now on your account." });
      window.history.replaceState({}, "", "/account");
    }
  }, [toast]);

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

  const isPaid = !!status && status.plan !== "free";
  const isPro = isPaid; // unlimited text on any paid tier
  const used = status?.used ?? 0;
  const lim = status?.lim ?? 0;
  const pct = lim > 0 ? Math.min(100, Math.round((used / lim) * 100)) : 0;
  const imgUsed = status?.imagesUsed ?? 0;
  const imgLim = status?.imagesLim ?? 0;
  const imgPct = imgLim > 0 ? Math.min(100, Math.round((imgUsed / imgLim) * 100)) : 0;
  const bonus = status?.bonusImages ?? 0;

  const upgrade = async (plan?: string) => {
    setUpgrading(true);
    try { await startUpgrade(plan); } catch (e) { alert(e instanceof Error ? e.message : "Upgrade failed"); setUpgrading(false); }
  };

  const purchaseCredits = async () => {
    setBuyingCredits(true);
    try { await buyCredits(1); }
    catch (e) { toast({ title: "Could not start checkout", description: e instanceof Error ? e.message : "", variant: "destructive" }); setBuyingCredits(false); }
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
            {isPaid ? <Crown className="h-4 w-4 text-gold" /> : <Zap className="h-4 w-4 text-primary" />}
            {planDisplayName(status?.plan)} plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPro && status && (
            <div className="max-w-md space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans">
                  <span>{used} of {lim} text generations this month</span>
                  <span>{Math.max(0, lim - used)} left</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground font-sans">
                  <span>{imgUsed} of {imgLim} image credits this month</span>
                  <span>{Math.max(0, imgLim - imgUsed)} left</span>
                </div>
                <Progress value={imgPct} className="h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground font-sans">
                  Each storybook page, cover and colouring page uses one image credit.{bonus > 0 ? ` You also have ${bonus} purchased credit${bonus === 1 ? "" : "s"}.` : ""}
                </p>
              </div>
            </div>
          )}
          {isPro && (
            <p className="text-sm text-muted-foreground font-sans">
              Unlimited everyday documents · {imgUsed} of {imgLim} image credits used this month{bonus > 0 ? ` · ${bonus} purchased credit${bonus === 1 ? "" : "s"} in reserve` : ""}.
            </p>
          )}
          {batchUnits != null && batchUnits > 0 && (
            <p className="mt-3 text-xs text-muted-foreground font-sans">
              Heavy operations this month: <span className="font-semibold text-foreground">{batchUnits.toLocaleString()}</span> units across bulk translation and multi-language editions.
            </p>
          )}
          {batchUnits != null && batchUnits >= HEAVY_USAGE_NOTICE && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground font-sans">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>You’re making heavy use of bulk publishing — these multi-language operations are the most resource-intensive on the platform. No limits today; we’ll always tell you before anything changes.</span>
            </div>
          )}
          {!status && <p className="text-sm text-muted-foreground font-sans">Loading plan…</p>}
          {status && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button variant="heroOutline" size="sm" onClick={purchaseCredits} disabled={buyingCredits}>
                {buyingCredits ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                Buy {CREDITS_PER_PACK} image credits
              </Button>
              <span className="text-xs text-muted-foreground font-sans">Top-ups never expire and stack on top of your monthly credits.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {!isPaid && (
        <Card className="mt-5 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Upgrade your plan</CardTitle>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground font-sans">From</span>
              <span className="font-serif text-3xl font-bold">$19</span>
              <span className="text-sm text-muted-foreground font-sans">/ month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PRO_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm font-sans">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="hero" onClick={() => upgrade("creator")} disabled={upgrading}>
                <Crown className="mr-2 h-4 w-4" /> {upgrading ? "Starting checkout…" : "Get Creator"}
              </Button>
              <Button asChild variant="heroOutline">
                <Link to="/pricing">Compare all plans</Link>
              </Button>
            </div>
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
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Alex Morgan" maxLength={80} />
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
