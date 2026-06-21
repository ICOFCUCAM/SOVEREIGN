import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Headphones, Loader2, Download, Crown, Check, Play, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchPlanStatus, type PlanStatus } from "@/lib/session";
import { planAtLeast, planDisplayName } from "@/lib/plans";
import { narrate, NARRATION_VOICES } from "@/lib/audiobook";

const sanitize = (s: string) => s.replace(/[^\w\d -]+/g, "").trim().slice(0, 60) || "chapter";
const download = (dataUrl: string, name: string) => { const a = document.createElement("a"); a.href = dataUrl; a.download = name; a.click(); };

// Turn a finished book into a narrated audiobook (one MP3 per chapter), preview
// it in the browser and download the files. Audiobooks are an Enterprise
// capability — the gate is enforced server-side too in generate-narration.
const AudiobookPanel = ({ chapters, bookTitle }: { chapters: { title: string; content: string }[]; bookTitle: string }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [voice, setVoice] = useState<string>(NARRATION_VOICES[0].id);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [tracks, setTracks] = useState<Record<number, string>>({});

  useEffect(() => { fetchPlanStatus().then(setStatus); }, []);
  const isEnterprise = planAtLeast(status?.plan, "enterprise");

  const narrateOne = async (i: number) => {
    setBusy(true);
    try {
      const audio = await narrate(chapters[i].content, voice);
      setTracks((t) => ({ ...t, [i]: audio }));
    } catch (e) {
      toast({ title: `Chapter ${i + 1} narration failed`, description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const generateAll = async () => {
    setBusy(true);
    setProgress({ done: 0, total: chapters.length });
    setTracks({});
    for (let i = 0; i < chapters.length; i++) {
      try {
        const audio = await narrate(chapters[i].content, voice);
        setTracks((t) => ({ ...t, [i]: audio }));
      } catch (e) {
        toast({ title: `Chapter ${i + 1} narration failed`, description: e instanceof Error ? e.message : "", variant: "destructive" });
      }
      setProgress({ done: i + 1, total: chapters.length });
    }
    setBusy(false);
    setProgress(null);
  };

  const downloadAll = () => {
    chapters.forEach((c, i) => { const t = tracks[i]; if (t) download(t, `${String(i + 1).padStart(2, "0")} - ${sanitize(c.title)}.mp3`); });
  };

  const made = Object.keys(tracks).length;

  // Enterprise gate.
  if (status && !isEnterprise) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-2"><Headphones className="h-5 w-5 text-gold" /><h3 className="font-serif text-lg font-bold">Audiobooks are an Enterprise feature</h3></div>
          <p className="mt-2 text-sm text-muted-foreground font-sans">Narrate your book into a downloadable audiobook — natural AI voices, chapter by chapter. Available on the Enterprise plan{status?.plan ? ` (you're on ${planDisplayName(status.plan)})` : ""}.</p>
          <ul className="mt-3 space-y-1.5">
            {["Studio-quality narration in six voices", "One MP3 per chapter, preview before you download", "Localize first, then narrate any language edition"].map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm font-sans"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}</li>
            ))}
          </ul>
          <Button asChild variant="hero" className="mt-4"><Link to="/pricing"><Crown className="mr-2 h-4 w-4" /> Talk to us about Enterprise</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card className="border-border"><CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Narrator voice</Label>
            <select value={voice} onChange={(e) => { setVoice(e.target.value); setTracks({}); }} disabled={busy} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              {NARRATION_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label} — {v.hint}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            {progress ? (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs font-sans text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Narrating…</span>
                  <span>{progress.done}/{progress.total} chapters</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} /></div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="hero" size="sm" disabled={busy || chapters.length === 0} onClick={generateAll}>
                  <Headphones className="mr-2 h-4 w-4" /> {made > 0 ? "Re-narrate book" : "Narrate book"}
                </Button>
                {made > 0 && <Button variant="heroOutline" size="sm" disabled={busy} onClick={downloadAll}><Download className="mr-1.5 h-4 w-4" /> Download all</Button>}
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans">Each chapter is narrated by OpenAI’s speech model and returned as an MP3 you can preview and download. Generate a language edition first to narrate it in that language.</p>
      </CardContent></Card>

      {chapters.length > 0 && (
        <div className="mt-6 space-y-2">
          {chapters.map((c, i) => (
            <Card key={i} className="border-border"><CardContent className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium">{c.title}</span>
              {tracks[i] ? (
                <>
                  <audio controls preload="none" src={tracks[i]} className="h-9 max-w-[260px]" />
                  <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={busy} onClick={() => narrateOne(i)} title="Re-narrate this chapter"><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="heroOutline" size="sm" onClick={() => download(tracks[i], `${String(i + 1).padStart(2, "0")} - ${sanitize(c.title)}.mp3`)}><Download className="h-3.5 w-3.5" /></Button>
                </>
              ) : (
                <Button variant="heroOutline" size="sm" disabled={busy} onClick={() => narrateOne(i)}><Play className="mr-1 h-3.5 w-3.5" /> Narrate</Button>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudiobookPanel;
