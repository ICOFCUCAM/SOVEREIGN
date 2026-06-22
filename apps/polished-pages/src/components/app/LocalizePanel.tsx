import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Loader2, Plus, Check, ArrowRight, Crown, Languages } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { listEditions, saveEdition, recordBatchOp, type Edition } from "@/lib/editions";
import { localizationLimit, isUnlimitedLocalization, planDisplayName } from "@/lib/plans";
import { LANGUAGE_NAMES, isoFor } from "@/lib/languages";
import CountryDatalist from "@/components/app/CountryDatalist";
import type { LocalizeMode } from "@/lib/localize";

export interface BuildEditionArgs { language: string; mode: LocalizeMode; culture?: string; onProgress?: (done: number, total: number) => void }
export interface BuiltEdition { title: string; payload: unknown; preview?: string }

// In-studio localization: turn the current project into linked language
// editions without leaving the creator. Same engine as the standalone Edition
// Manager / Translation Studio; the plan's language allowance is enforced both
// here (for UX) and server-side in polished_save_edition. Each studio supplies
// how to translate its own payload (buildEdition) and how to obtain the saved
// parent document (ensureSaved), since editions link to a parent.
const LocalizePanel = ({
  parentId, ensureSaved, kind, sourceTitle, buildEdition, hasContent = true,
}: {
  parentId: string | null;
  ensureSaved?: () => Promise<string | null>;
  kind: string;
  sourceTitle: string;
  buildEdition: (args: BuildEditionArgs) => Promise<BuiltEdition>;
  hasContent?: boolean;
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [pid, setPid] = useState<string | null>(parentId);
  const [editions, setEditions] = useState<Edition[] | null>(null);
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState<LocalizeMode>("translate");
  const [culture, setCulture] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  useEffect(() => { setPid(parentId); }, [parentId]);
  useEffect(() => {
    if (pid) listEditions(pid).then(setEditions).catch(() => setEditions([]));
    else setEditions([]);
  }, [pid]);

  const limit = localizationLimit(status?.plan);
  const unlimited = isUnlimitedLocalization(limit);
  const usedLangs = new Set((editions ?? []).filter((e) => !e.is_source).map((e) => (e.edition_language ?? "").toLowerCase()));
  const alreadyHas = !!language.trim() && usedLangs.has(language.trim().toLowerCase());
  const remaining = unlimited ? Infinity : Math.max(0, limit - usedLangs.size);
  const atLimit = !unlimited && !alreadyHas && remaining <= 0;

  const add = async () => {
    if (!language.trim()) { toast({ title: "Pick a language" }); return; }
    setBusy(true);
    try {
      let parent = pid;
      if (!parent && ensureSaved) { parent = await ensureSaved(); setPid(parent); }
      if (!parent) throw new Error("Save your work first, then localize it.");
      setProgress({ done: 0, total: 1 });
      const ed = await buildEdition({ language: language.trim(), mode, culture: mode === "localize" ? culture.trim() || undefined : undefined, onProgress: (done, total) => setProgress({ done, total }) });
      await saveEdition({ parent, language: language.trim(), kind, title: ed.title, payload: ed.payload, preview: ed.preview, culture: mode === "localize" ? culture.trim() : undefined });
      recordBatchOp(progress?.total ?? 1);
      setLanguage(""); setCulture("");
      setEditions(await listEditions(parent));
      toast({ title: "Edition created", description: `${ed.title} saved to this project and your Library.` });
    } catch (e) {
      toast({ title: "Could not localize", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally { setBusy(false); setProgress(null); }
  };

  // Free plan: localization isn't included.
  if (status && limit === 0) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-2"><Languages className="h-5 w-5 text-gold" /><h3 className="font-serif text-lg font-bold">Reach more readers in their language</h3></div>
          <p className="mt-2 text-sm text-muted-foreground font-sans">Localization isn’t included on the Free plan. Creator adds 1 language, Professional 2, Business 10, and Enterprise unlimited — every edition stays linked to this project.</p>
          <Button asChild variant="hero" className="mt-4"><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> Upgrade to localize</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-publishing/20 bg-publishing/5 px-4 py-1.5">
          <Globe className="w-4 h-4 text-publishing" /><span className="text-sm text-publishing font-medium font-sans">Localize this project</span>
        </div>
        {status && (
          <span className="text-xs text-muted-foreground font-sans">
            {unlimited ? "Unlimited languages" : `${usedLangs.size} of ${limit} language${limit === 1 ? "" : "s"} used`}
            <span className="text-muted-foreground/60"> · {planDisplayName(status.plan)}</span>
          </span>
        )}
      </div>

      <Card className="border-border"><CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">New edition language</Label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. French" list="localize-langs" maxLength={40} disabled={busy} />
            <datalist id="localize-langs">{LANGUAGE_NAMES.map((l) => <option key={l} value={l} />)}</datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Mode</Label>
            <select value={mode} onChange={(e) => setMode(e.target.value as LocalizeMode)} disabled={busy} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              <option value="translate">Faithful translation</option>
              <option value="localize">Cultural localization</option>
            </select>
          </div>
        </div>
        {mode === "localize" && (
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Culture / country</Label>
            <Input value={culture} onChange={(e) => setCulture(e.target.value)} placeholder="e.g. Japan, Cameroon, Brazil, Norway" maxLength={120} list="country-options" disabled={busy} />
            <CountryDatalist />
            <p className="text-[11px] text-muted-foreground font-sans">A culture-native edition: names, places, food, festivals, idioms and units adapted to feel written from within that culture.</p>
          </div>
        )}
        {alreadyHas && <p className="text-xs text-gold font-sans">An edition in {language.trim()} already exists — creating another will replace nothing; it adds a second.</p>}
        {atLimit && (
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
            <p className="text-xs text-foreground font-sans">You’ve used all {limit} language{limit === 1 ? "" : "s"} on the {planDisplayName(status?.plan)} plan.</p>
            <Button asChild variant="hero" size="sm" className="mt-2"><Link to="/pricing"><Crown className="mr-1.5 h-3.5 w-3.5" /> Upgrade for more languages</Link></Button>
          </div>
        )}
        {progress ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-sans text-muted-foreground">
              <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Translating…</span>
              <span>{progress.done}/{progress.total} sections</span>
            </div>
            <Progress value={Math.round((progress.done / Math.max(1, progress.total)) * 100)} className="h-1.5" />
          </div>
        ) : (
          <Button variant="hero" size="sm" disabled={busy || atLimit || !hasContent || !language.trim()} onClick={add}>
            <Plus className="mr-2 h-4 w-4" /> {hasContent ? "Create edition" : "Generate content first"}
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground font-sans">Each edition is a real AI translation, linked to this project and saved to your Library — ready to export or publish.</p>
      </CardContent></Card>

      {/* Existing editions for this project */}
      {editions && editions.filter((e) => !e.is_source).length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-base font-semibold">Language editions</h3>
            <span className="text-xs text-muted-foreground font-sans">{usedLangs.size} language{usedLangs.size === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-2 space-y-2">
            {editions.filter((e) => !e.is_source).map((e) => {
              const iso = e.edition_language ? isoFor(e.edition_language) : null;
              return (
                <Card key={e.id} className="border-border"><CardContent className="flex items-center justify-between gap-3 p-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold font-sans">
                      {iso && iso !== "en" && <span className="mr-0.5 uppercase">{iso} · </span>}{e.edition_language}{e.edition_culture ? ` · ${e.edition_culture}` : ""}
                    </span>
                    <span className="truncate font-sans text-sm">{e.title}</span>
                    {e.listed && <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-emerald-600 font-sans"><Check className="h-3 w-3" /> Published</span>}
                  </div>
                  <Button asChild variant="heroOutline" size="sm"><Link to={`/library?open=${e.id}`}>Open <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                </CardContent></Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalizePanel;
