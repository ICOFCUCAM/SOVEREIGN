import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, ArrowLeft, ClipboardList, Check, ChevronRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSchoolContent, NEEDS_SOURCE, SOURCE_TYPES, type SchoolDocType, type SchoolInput } from "@/lib/school";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import SaveToLibrary from "@/components/app/SaveToLibrary";
import CountryDatalist from "@/components/app/CountryDatalist";
import LanguageDatalist from "@/components/app/LanguageDatalist";
import LocalizePanel from "@/components/app/LocalizePanel";
import { localizeMarkdown, markdownEdition } from "@/lib/localize";
import { saveDocument } from "@/lib/documents";
import { saveAssessment } from "@/lib/assessment-bank";
import { logAiActivity } from "@/lib/ai-activity-log";

// Document types that belong in the reusable Assessment Bank.
const BANKABLE = new Set<SchoolDocType>(["quiz", "exam", "assessment", "worksheet", "answer-key", "marking-guide", "homework-pack", "revision", "exam-prep"]);

// Auto-save the studio's inputs + generated documents to localStorage (text
// only — no images here) so a refresh, crash or accidental close never loses
// generated curriculum/packs. One draft per studio (keyed by badge).
interface SchoolDraft { vals: Record<string, string>; multi: Record<string, string[]>; docs: Record<string, string> | null; tab: SchoolDocType }
const draftKey = (badge: string) => `pp:draft:school:${badge}`;
const readSchoolDraft = (badge: string): Partial<SchoolDraft> | null => {
  try { const s = localStorage.getItem(draftKey(badge)); return s ? (JSON.parse(s) as Partial<SchoolDraft>) : null; } catch { return null; }
};

export interface SchoolField {
  key: keyof SchoolInput;
  label: string;
  placeholder?: string;
  type?: "text" | "select" | "multiselect";
  options?: string[];
  required?: boolean;
  list?: string; // datalist id for free-text suggestions (e.g. "country-options")
}
export interface SchoolPart { type: SchoolDocType; label: string }

export interface SchoolStudioConfig {
  badge: string;
  icon: LucideIcon;
  heading: ReactNode;
  blurb: string;
  fields: SchoolField[];
  parts: SchoolPart[];
  // "pack" generates every part in sequence; "single" lets the user pick one.
  mode: "pack" | "single";
  previewLabel: string;
}

const SchoolStudioPage = ({ config }: { config: SchoolStudioConfig }) => {
  const { toast } = useToast();
  // Restore any saved draft synchronously (no empty-flash, no clobber).
  const restored = useRef(readSchoolDraft(config.badge)).current;
  const [vals, setVals] = useState<Record<string, string>>(() =>
    restored?.vals ?? Object.fromEntries(config.fields.filter((f) => f.type === "select").map((f) => [f.key as string, f.options?.[0] ?? ""])));
  const [multi, setMulti] = useState<Record<string, string[]>>(restored?.multi ?? {});
  const [pick, setPick] = useState<SchoolDocType>(config.parts[0].type);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, string> | null>(restored?.docs ?? null);
  const [tab, setTab] = useState<SchoolDocType>(restored?.tab && config.parts.some((p) => p.type === restored.tab) ? restored.tab : config.parts[0].type);

  // Persist inputs + generated docs (debounced) for crash/refresh recovery.
  useEffect(() => {
    const t = window.setTimeout(() => {
      try { localStorage.setItem(draftKey(config.badge), JSON.stringify({ vals, multi, docs, tab })); } catch { /* quota / private mode */ }
    }, 500);
    return () => window.clearTimeout(t);
  }, [vals, multi, docs, tab, config.badge]);

  useEffect(() => {
    if (restored?.docs && Object.keys(restored.docs).length > 0) {
      toast({ title: "Recovered your work", description: `Your ${config.badge} draft was restored — pick up where you left off.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [banking, setBanking] = useState(false);
  const [bankedTab, setBankedTab] = useState<SchoolDocType | null>(null);
  // Saved library doc id per generated document (tab) — the parent that language
  // editions link to. Ref mirror so the localize flow reads it synchronously.
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});
  const savedIdsRef = useRef<Record<string, string>>({});
  const markDocSaved = (t: string, id: string) => { savedIdsRef.current[t] = id; setSavedIds((m) => ({ ...m, [t]: id })); };

  const addToBank = async (content: string, docType: SchoolDocType, title: string) => {
    setBanking(true);
    try {
      await saveAssessment({ subject: vals.subject, grade: vals.grade, topic: vals.topic, docType, title, content });
      setBankedTab(docType);
      toast({ title: "Added to Assessment Bank", description: "Reuse it from the bank, filtered by subject and grade." });
    } catch (e) {
      toast({ title: "Could not add to bank", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBanking(false); }
  };

  const required = config.fields.filter((f) => f.required);
  const canRun = required.every((f) => (vals[f.key as string] ?? "").trim().length > 0) && !progress;
  const titleBase = `${vals.subject || vals.topic || config.badge}${vals.grade ? ` (${vals.grade})` : ""}`;

  const baseInput = (): Omit<SchoolInput, "docType"> => ({
    grade: vals.grade, subject: vals.subject, topic: vals.topic, country: vals.country,
    term: vals.term, year: vals.year, language: vals.language,
    exerciseTypes: multi.exerciseTypes,
  });

  const run = async () => {
    setGenError(null);
    savedIdsRef.current = {}; setSavedIds({});
    const parts = config.mode === "single" ? config.parts.filter((p) => p.type === pick) : config.parts;
    setProgress({ done: 0, total: parts.length });
    const out: Record<string, string> = {};
    try {
      for (let i = 0; i < parts.length; i++) {
        const t = parts[i].type;
        const sourceContent = NEEDS_SOURCE.includes(t)
          ? SOURCE_TYPES.map((s) => out[s]).filter(Boolean).join("\n\n")
          : undefined;
        const doc = await generateSchoolContent({ ...baseInput(), docType: t, sourceContent });
        out[t] = doc.content;
        setProgress({ done: i + 1, total: parts.length });
      }
      setDocs(out);
      setTab(parts[0].type);
      logAiActivity({ tool: config.badge, description: `${vals.subject || vals.topic || ""} ${vals.grade || ""}`.trim(), status: "ok" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      logAiActivity({ tool: config.badge, description: `${vals.subject || vals.topic || ""} ${vals.grade || ""}`.trim(), status: "error" });
      setGenError(msg);
    } finally {
      setProgress(null);
    }
  };

  if (docs) {
    const present = config.parts.filter((p) => docs[p.type] != null);
    const current = docs[tab] ?? "";
    const docTitle = `${titleBase} — ${config.parts.find((p) => p.type === tab)?.label}`;
    const docPreview = `${config.previewLabel} · ${vals.subject ?? ""} ${vals.grade ?? ""}`.trim();

    // Persist the current document on demand so its language editions link to it.
    const ensureDocSaved = async (): Promise<string | null> => {
      const existing = savedIdsRef.current[tab];
      if (existing) return existing;
      const id = await saveDocument({ kind: "book", title: docTitle, payload: { markdown: current, title: docTitle }, preview: docPreview });
      markDocSaved(tab, id);
      return id;
    };
    const buildDocEdition = async ({ language, mode, culture, onProgress }: { language: string; mode: "translate" | "localize"; culture?: string; onProgress?: (done: number, total: number) => void }) => {
      const body = await localizeMarkdown(current, { language, mode, culture, onProgress });
      return markdownEdition(docTitle, body, language, mode, culture);
    };
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex flex-wrap items-center justify-between gap-2 py-2 px-6">
            <div className="flex max-w-full overflow-x-auto rounded-lg border border-border bg-card p-1">
              {present.map((p) => (
                <button key={p.type} onClick={() => setTab(p.type)}
                  className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium font-sans transition ${tab === p.type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SaveToLibrary key={tab} kind="book" title={docTitle} payload={{ markdown: current, title: docTitle }} preview={docPreview}
                onSaved={(id) => markDocSaved(tab, id)} savedExternally={!!savedIds[tab]} externalId={savedIds[tab] ?? null} />
              {BANKABLE.has(tab) && (
                <Button variant="heroOutline" size="sm" disabled={banking || bankedTab === tab} onClick={() => addToBank(current, tab, docTitle)}>
                  {bankedTab === tab ? <Check className="w-4 h-4 mr-1 text-green-600" /> : banking ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-1" />}
                  {bankedTab === tab ? "In bank" : "Save to bank"}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDocs(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> New</Button>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          <BookExportPanel bookTitle={docTitle} fullContent={current} chapterCount={0} />
          <div className="mt-6"><BookReader content={current} title={docTitle} onContentChange={(s) => setDocs((d) => (d ? { ...d, [tab]: s } : d))} /></div>

          <div className="mt-10 border-t border-border/60 pt-8">
            <h2 className="font-serif text-xl font-bold mb-1">Localize this {config.previewLabel.toLowerCase()}</h2>
            <p className="text-sm text-muted-foreground font-sans mb-5">Translate or culturally adapt the open document into other languages for your classrooms — each edition links to it and lands in your Library.</p>
            <LocalizePanel
              parentId={savedIds[tab] ?? null}
              ensureSaved={ensureDocSaved}
              kind="book"
              sourceTitle={docTitle}
              hasContent={!!current.trim()}
              buildEdition={buildDocEdition}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1 text-xs text-muted-foreground font-sans">
          <Link to="/children" className="hover:text-foreground transition-colors">Educational Studio</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">{config.badge}</span>
        </nav>
        <div className="inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
          <config.icon className="w-4 h-4 text-educational" />
          <span className="text-sm text-educational font-medium font-sans">{config.badge}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">{config.heading}</h1>
        <p className="text-muted-foreground font-sans mb-8">{config.blurb}</p>

        <Card className="border-border bg-card/50">
          <CardHeader><CardTitle className="font-serif text-lg">Details</CardTitle><CardDescription className="font-sans">Fill in the lesson details to generate classroom-ready materials.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <CountryDatalist />
            <LanguageDatalist />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.key as string} className={`space-y-1.5 ${f.type === "multiselect" ? "sm:col-span-2" : ""}`}>
                  <Label className="font-sans text-xs">{f.label}{f.required ? " *" : ""}</Label>
                  {f.type === "select" ? (
                    <select value={vals[f.key as string] ?? f.options?.[0] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "multiselect" ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {f.options?.map((o) => {
                          const on = (multi[f.key as string] ?? []).includes(o);
                          return (
                            <button key={o} type="button" onClick={() => setMulti((m) => { const cur = m[f.key as string] ?? []; return { ...m, [f.key]: on ? cur.filter((x) => x !== o) : [...cur, o] }; })}
                              className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                              {o}
                            </button>
                          );
                        })}
                      </div>
                      {(multi[f.key as string] ?? []).length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-primary font-sans">{(multi[f.key as string] ?? []).length} selected</span>
                          <button type="button" onClick={() => setMulti((m) => ({ ...m, [f.key]: [] }))} className="text-[11px] text-muted-foreground hover:text-foreground font-sans underline">Clear</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input value={vals[f.key as string] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} maxLength={200} list={f.list} />
                  )}
                </div>
              ))}
            </div>

            {config.mode === "single" && (
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Type</Label>
                <select value={pick} onChange={(e) => setPick(e.target.value as SchoolDocType)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {config.parts.map((p) => <option key={p.type} value={p.type}>{p.label}</option>)}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {config.mode === "pack" && (
          <p className="mt-3 text-xs text-muted-foreground font-sans">Generates {config.parts.length} documents: {config.parts.map((p) => p.label).join(", ")}.</p>
        )}

        {genError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium font-sans text-destructive">Generation failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground font-sans">{genError}</p>
            <Button variant="heroOutline" size="sm" className="mt-3" onClick={run} disabled={!canRun}>
              <Sparkles className="w-4 h-4 mr-1" /> Try again
            </Button>
          </div>
        )}
        {progress ? (
          <div className="mt-6 rounded-xl border border-border bg-card/50 p-5">
            <div className="mb-2 flex items-center justify-between text-sm font-sans">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Generating…</span>
              <span className="text-muted-foreground">{progress.done}/{progress.total}</span>
            </div>
            <Progress value={Math.round((progress.done / progress.total) * 100)} className="h-2" />
          </div>
        ) : !genError ? (
          <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={run} disabled={!canRun}>
            <Sparkles className="w-5 h-5 mr-2" /> Generate
          </Button>
        ) : null}
        {!canRun && !progress && !genError && <p className="mt-2 text-center text-xs text-muted-foreground font-sans">Complete the required fields to continue.</p>}
      </div>
    </div>
  );
};

export default SchoolStudioPage;
