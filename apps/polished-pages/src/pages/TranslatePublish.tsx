import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Sparkles, Loader2, ArrowLeft, Upload, FileText, Save, ChevronRight, Languages, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractFileText, CV_ACCEPT, CV_MIME } from "@/lib/extract-file-text";
import { splitBook } from "@/lib/book-split";
import { useMemo } from "react";
import { translateLocalize } from "@/lib/translate";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { LANGUAGE_NAMES, isoFor, isRtlLanguage } from "@/lib/languages";
import { markdownToEpub } from "@/lib/export-epub";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import SaveToLibrary from "@/components/app/SaveToLibrary";
import CountryDatalist from "@/components/app/CountryDatalist";
import { saveDocument } from "@/lib/documents";

const TranslatePublish = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = usePersistentState("translate.source", "");
  const [title, setTitle] = usePersistentState("translate.title", "");
  const [mode, setMode] = useState<"translate" | "localize">("translate");
  const [culture, setCulture] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [editions, setEditions] = useState<Record<string, string> | null>(null);
  const [tab, setTab] = useState("");
  const [savingAll, setSavingAll] = useState(false);

  const canRun = (file || source.trim().length > 60) && targets.length > 0 && !progress;

  const sectionEstimate = useMemo(() => {
    if (!source.trim()) return 0;
    return splitBook(source.trim()).length;
  }, [source]);

  const totalCalls = sectionEstimate * targets.length;
  const estMinutes = Math.ceil(totalCalls * 8 / 60); // ~8s per section call

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!CV_MIME.includes(f.type)) { toast({ title: "Unsupported format", description: "Upload a PDF, DOCX, or TXT.", variant: "destructive" }); return; }
    if (f.size > 15 * 1024 * 1024) { toast({ title: "File too large", description: "Maximum 15MB.", variant: "destructive" }); return; }
    setFile(f);
  };

  const toggle = (l: string) => setTargets((t) => (t.includes(l) ? t.filter((x) => x !== l) : [...t, l]));

  const run = async () => {
    try {
      let text = source.trim();
      if (file) text = await extractFileText(file);
      const sections = splitBook(text);
      const total = targets.length * sections.length;
      let done = 0;
      const out: Record<string, string> = {};
      for (const lang of targets) {
        const parts: string[] = [];
        for (let i = 0; i < sections.length; i++) {
          setProgress({ label: `${lang} — section ${i + 1}/${sections.length}`, done, total });
          parts.push(await translateLocalize({ content: sections[i], targetLanguage: lang, culture, mode }));
          done += 1;
        }
        out[lang] = parts.join("\n\n");
      }
      setEditions(out);
      setTab(targets[0]);
    } catch (e) {
      toast({ title: "Translation failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setProgress(null);
    }
  };

  const saveAll = async () => {
    if (!editions) return;
    setSavingAll(true);
    try {
      const base = title || "Document";
      for (const [lang, md] of Object.entries(editions)) {
        await saveDocument({ kind: "book", title: `${base} — ${lang}`, payload: { markdown: md, title: `${base} — ${lang}` }, preview: `${mode === "localize" ? "Localized" : "Translated"} edition · ${lang}` });
      }
      toast({ title: "Saved to library", description: `${Object.keys(editions).length} editions saved.` });
    } catch (e) {
      toast({ title: "Could not save all", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setSavingAll(false);
    }
  };

  if (editions) {
    const langs = Object.keys(editions);
    const current = editions[tab] ?? "";
    const editionTitle = `${title || "Document"} — ${tab}`;
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex flex-wrap items-center justify-between gap-2 py-2 px-6">
            <div className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
              {langs.map((l) => (
                <button key={l} onClick={() => setTab(l)}
                  className={`rounded-md px-3 py-1 text-xs font-medium font-sans transition ${tab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="heroOutline" size="sm" onClick={() => markdownToEpub(current, { title: editionTitle, language: isoFor(tab) }, editionTitle).catch(() => {})}>EPUB</Button>
              <SaveToLibrary kind="book" title={editionTitle} payload={{ markdown: current, title: editionTitle }} preview={`${mode === "localize" ? "Localized" : "Translated"} · ${tab}`} />
              <Button variant="hero" size="sm" disabled={savingAll} onClick={saveAll}>
                {savingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save all {langs.length}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditions(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> New</Button>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16" dir={isRtlLanguage(tab) ? "rtl" : undefined}>
          <BookExportPanel bookTitle={editionTitle} fullContent={current} chapterCount={0} />
          <div className="mt-6"><BookReader content={current} title={editionTitle} onContentChange={(s) => setEditions((e) => (e ? { ...e, [tab]: s } : e))} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
        <nav className="mb-5 flex items-center gap-1 text-xs text-muted-foreground font-sans">
          <Link to="/children" className="hover:text-foreground transition-colors">Educational Studio</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">Translate &amp; Localize</span>
        </nav>
        <div className="inline-flex items-center gap-2 rounded-full border border-publishing/20 bg-publishing/5 px-4 py-1.5 mb-4">
          <Globe className="w-4 h-4 text-publishing" />
          <span className="text-sm text-publishing font-medium font-sans">Translate &amp; Localize</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Publish in <span className="text-gradient-gold italic">every language</span></h1>
        <p className="text-muted-foreground font-sans mb-8">Create once, then produce editions in many languages — a faithful translation, or a culturally localized version with names, settings and examples adapted to each culture.</p>

        <div className="space-y-6">
          <Card className="border-border bg-card/50">
            <CardHeader><CardTitle className="font-serif text-lg">1 · Your document</CardTitle><CardDescription className="font-sans">A book, story, reader or any text — upload or paste.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <input ref={inputRef} type="file" accept={CV_ACCEPT} className="hidden" onChange={onFile} />
              <div className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => inputRef.current?.click()}>
                {file ? (
                  <div className="flex items-center justify-center gap-3"><FileText className="w-6 h-6 text-primary" /><span className="font-sans text-sm">{file.name}</span></div>
                ) : (
                  <><Upload className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" /><p className="font-sans text-sm text-muted-foreground">Click to upload (PDF, DOCX, TXT)</p></>
                )}
              </div>
              <div className="text-center text-xs text-muted-foreground font-sans">or paste</div>
              <Textarea value={source} onChange={(e) => { setSource(e.target.value); if (file) setFile(null); }} rows={6} maxLength={300000} placeholder="Paste your document text…" className="resize-none" disabled={!!file} />
              {source.trim().length > 0 && (
                <p className="text-[11px] text-muted-foreground font-sans">
                  {source.trim().split(/\s+/).length.toLocaleString()} words
                </p>
              )}
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={200} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader><CardTitle className="font-serif text-lg">2 · How &amp; where</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode("translate")} className={`rounded-lg border p-4 text-left transition ${mode === "translate" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"}`}>
                  <Languages className={`mb-2 h-5 w-5 ${mode === "translate" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-semibold font-sans">Translate</div>
                  <div className="mt-0.5 text-xs text-muted-foreground font-sans">Faithful — same story, every word.</div>
                </button>
                <button type="button" onClick={() => setMode("localize")} className={`rounded-lg border p-4 text-left transition ${mode === "localize" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"}`}>
                  <Wand2 className={`mb-2 h-5 w-5 ${mode === "localize" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-semibold font-sans">Culturally localize</div>
                  <div className="mt-0.5 text-xs text-muted-foreground font-sans">Adapt names, settings &amp; examples.</div>
                </button>
              </div>
              {mode === "localize" && (
                <div className="space-y-1.5">
                  <Label className="font-sans text-xs">Culture / country per edition (optional)</Label>
                  <Input value={culture} onChange={(e) => setCulture(e.target.value)} placeholder="e.g. United States, Japan, Brazil — applied to each edition" maxLength={120} list="country-options" />
                  <CountryDatalist />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Target languages ({targets.length} selected)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_NAMES.map((l) => {
                    const on = targets.includes(l);
                    return (
                      <button key={l} type="button" onClick={() => toggle(l)} className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {progress ? (
            <div className="rounded-xl border border-border bg-card/50 p-5">
              <div className="mb-2 flex items-center justify-between text-sm font-sans">
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /> {mode === "localize" ? "Localizing" : "Translating"}…</span>
                <span className="text-muted-foreground">{progress.label}</span>
              </div>
              <Progress value={progress.total ? Math.round((progress.done / progress.total) * 100) : 0} className="h-2" />
            </div>
          ) : (
            <Button variant="hero" size="lg" className="w-full py-6" onClick={run} disabled={!canRun}>
              <Sparkles className="w-5 h-5 mr-2" /> Create {targets.length || ""} edition{targets.length === 1 ? "" : "s"}
            </Button>
          )}
          {!canRun && !progress && <p className="text-center text-xs text-muted-foreground font-sans">Add your document and pick at least one target language.</p>}
          {canRun && !progress && totalCalls > 1 && (
            <p className="text-center text-xs text-muted-foreground font-sans">
              {sectionEstimate} section{sectionEstimate > 1 ? "s" : ""} × {targets.length} language{targets.length > 1 ? "s" : ""} = {totalCalls} AI calls · estimated {estMinutes < 2 ? "~1 minute" : `~${estMinutes} minutes`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslatePublish;
