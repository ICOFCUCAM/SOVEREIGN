import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Download, Loader2, ArrowLeft, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { elementToPdf } from "@/lib/export-pdf";
import { pictureBookToEpub } from "@/lib/export-epub";
import { generateStorybook, generateIllustration, type Storybook, type StoryInput, type StoryType } from "@/lib/storybook";
import PictureBookView from "@/components/children/PictureBookView";
import SavePictureBookButton from "@/components/children/SavePictureBookButton";
import { LANGUAGE_NAMES, isoFor } from "@/lib/languages";
import CountryDatalist from "@/components/app/CountryDatalist";
import CharacterLibrary from "@/components/children/CharacterLibrary";
import DedicationNotes from "@/components/children/DedicationNotes";
import { getSeries } from "@/lib/series";
import { translateLocalize } from "@/lib/translate";
import { usePersistentState } from "@/hooks/use-persistent-state";
import LocalizePanel from "@/components/app/LocalizePanel";
import { localizeStrings } from "@/lib/localize";
import { savePictureBook } from "@/lib/picture-book-save";
import { getDocument } from "@/lib/documents";
import type { PictureBookData } from "@/components/children/PictureBookView";
import KnowledgeSelect from "@/components/book/KnowledgeSelect";
import type { BookKnowledge } from "@/components/book/KnowledgePanel";

// Auto-save the story text + illustration prompts (NOT the base64 images, which
// would blow the localStorage quota) so a refresh or crash never loses a
// generated story. Pages can be re-illustrated from the saved prompts; an
// explicit Save uploads and durably preserves the illustrations server-side.
const STORY_DRAFT_KEY = "pp:draft:storybook.book";
const stripImages = (b: Storybook): Storybook => ({ ...b, coverImage: null, pages: b.pages.map((p) => ({ ...p, image: null })) });
const readStoryDraft = (): Storybook | null => { try { const s = localStorage.getItem(STORY_DRAFT_KEY); return s ? (JSON.parse(s) as Storybook) : null; } catch { return null; } };
const clearStoryDraft = () => { try { localStorage.removeItem(STORY_DRAFT_KEY); } catch { /* ignore */ } };

const READING_LEVELS = [
  "Pre-reader (ages 2–4)",
  "Early reader (ages 4–6)",
  "Developing reader (ages 6–8)",
  "Confident reader (ages 8–10)",
];

// Reading-level engine: one click sets the age, reading level and length, which
// the engine uses to tune vocabulary, sentence complexity and story structure.
const AGE_BANDS: { label: string; age: string; level: string; pages: number }[] = [
  { label: "Ages 3–5", age: "4", level: READING_LEVELS[0], pages: 8 },
  { label: "Ages 6–8", age: "7", level: READING_LEVELS[2], pages: 12 },
  { label: "Ages 9–12", age: "10", level: READING_LEVELS[3], pages: 16 },
];

const STORY_TYPES: { id: StoryType; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "bedtime", label: "Bedtime" },
  { id: "adventure", label: "Adventure" },
  { id: "cartoon", label: "Cartoon" },
  { id: "educational", label: "Educational" },
  { id: "moral", label: "Moral lesson" },
  { id: "folktale", label: "Folktale" },
  { id: "legend", label: "Legend / heritage" },
  { id: "historical", label: "Historical" },
  { id: "cultural", label: "Cultural" },
  { id: "science", label: "Science" },
  { id: "faith", label: "Faith-based" },
];

const StorybookCreator = () => {
  const { toast } = useToast();
  const bookRef = useRef<HTMLDivElement>(null);

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[1]);
  const [theme, setTheme] = usePersistentState("storybook.theme", "");
  const [moralLesson, setMoralLesson] = useState("");
  const [characters, setCharacters] = usePersistentState("storybook.characters", "");
  const [pageCount, setPageCount] = useState(12);
  const [storyType, setStoryType] = useState<StoryType>("classic");
  const [language, setLanguage] = useState("");
  const [educationalObjective, setEducationalObjective] = useState("");
  const [culturalSetting, setCulturalSetting] = useState("");
  const [knowledge, setKnowledge] = useState<BookKnowledge | null>(null);

  const [seriesName, setSeriesName] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const sid = searchParams.get("series");
    if (!sid) return;
    getSeries(sid).then((s) => {
      if (!s) return;
      setSeriesName(s.title);
      if (s.culture) setCulturalSetting(s.culture);
      if (s.educational_objective) setEducationalObjective(s.educational_objective);
      if (s.language) setLanguage(s.language);
    }).catch(() => {});
  }, [searchParams]);

  const restoredBook = useRef(readStoryDraft()).current;
  const [creating, setCreating] = useState(false);
  const [book, setBook] = useState<Storybook | null>(restoredBook);
  const [illustrating, setIllustrating] = useState<{ done: number; total: number } | null>(null);
  const [pdf, setPdf] = useState(false);

  // Persist the current story (text + prompts only) for crash/refresh recovery.
  useEffect(() => {
    if (!book) { clearStoryDraft(); return; }
    const t = window.setTimeout(() => { try { localStorage.setItem(STORY_DRAFT_KEY, JSON.stringify(stripImages(book))); } catch { /* quota */ } }, 500);
    return () => window.clearTimeout(t);
  }, [book]);
  useEffect(() => {
    if (restoredBook) toast({ title: "Recovered your story", description: "Your story text is back — re-illustrate any pages you like; the prompts were saved." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The saved parent document id, once this storybook is in the Library — the
  // anchor that language editions link to. Kept in a ref too so the localize
  // flow can read it synchronously right after an on-demand save.
  const [savedId, setSavedId] = useState<string | null>(null);
  const savedIdRef = useRef<string | null>(null);
  const markSaved = (id: string) => { savedIdRef.current = id; setSavedId(id); };

  // Per-edition localization: the base (original) book and a cache of translated
  // editions that reuse the same illustrations.
  const baseBook = useRef<Storybook | null>(restoredBook);
  const editionCache = useRef<Record<string, Storybook>>({});
  const [editionLang, setEditionLang] = useState("");
  const [translating, setTranslating] = useState<{ done: number; total: number } | null>(null);

  const canCreate = theme.trim().length > 3 && !creating;

  const create = async () => {
    setCreating(true);
    try {
      const input: StoryInput = { childName, childAge, readingLevel, theme, moralLesson, characters, pageCount, storyType, language, educationalObjective, culturalSetting, knowledge };
      const b = await generateStorybook(input);
      baseBook.current = b;
      editionCache.current = {};
      setEditionLang("");
      savedIdRef.current = null; setSavedId(null);
      setBook(b);
    } catch (e) {
      toast({ title: "Could not create story", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Switch to a language edition (translating page text + title, keeping images).
  const selectEdition = async (lang: string) => {
    const base = baseBook.current;
    if (!base) return;
    if (lang === "") { setEditionLang(""); setBook(base); return; }
    if (editionCache.current[lang]) { setEditionLang(lang); setBook(editionCache.current[lang]); return; }
    const texts = [base.title, base.dedication ?? "", ...base.pages.map((p) => p.text ?? "")];
    setTranslating({ done: 0, total: texts.length });
    try {
      const out: string[] = [];
      for (let i = 0; i < texts.length; i++) {
        out.push(texts[i].trim() ? await translateLocalize({ content: texts[i], targetLanguage: lang, mode: "translate" }) : "");
        setTranslating({ done: i + 1, total: texts.length });
      }
      const edition: Storybook = {
        ...base,
        title: out[0],
        dedication: out[1] || undefined,
        pages: base.pages.map((p, i) => ({ ...p, text: out[i + 2] })),
      };
      editionCache.current[lang] = edition;
      setEditionLang(lang);
      setBook(edition);
    } catch (e) {
      toast({ title: "Translation failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setTranslating(null);
    }
  };

  const illustrateCover = async () => {
    if (!book) return;
    try {
      const image = await generateIllustration({ prompt: book.coverPrompt, artStyle: book.artStyle, orientation: "portrait" });
      setBook((b) => (b ? { ...b, coverImage: image } : b));
    } catch (e) {
      toast({ title: "Cover failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  const illustratePage = async (i: number) => {
    if (!book) return;
    try {
      const image = await generateIllustration({ prompt: book.pages[i].illustrationPrompt, artStyle: book.artStyle, orientation: "landscape" });
      setBook((b) => (b ? { ...b, pages: b.pages.map((p, j) => (j === i ? { ...p, image } : p)) } : b));
    } catch (e) {
      toast({ title: `Page ${i + 1} failed`, description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
      throw e;
    }
  };

  const illustrateAll = async () => {
    if (!book) return;
    const total = book.pages.length + 1;
    setIllustrating({ done: 0, total });
    try {
      if (!book.coverImage) await illustrateCover();
      setIllustrating({ done: 1, total });
      for (let i = 0; i < book.pages.length; i++) {
        if (!book.pages[i].image) await illustratePage(i);
        setIllustrating({ done: i + 2, total });
      }
    } catch {
      /* per-page errors already toasted; stop the batch */
    } finally {
      setIllustrating(null);
    }
  };

  const exportPdf = async () => {
    if (!bookRef.current) return;
    setPdf(true);
    try {
      await elementToPdf(bookRef.current, `${book?.title || "storybook"}.pdf`, "#ffffff");
    } catch (e) {
      toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setPdf(false);
    }
  };

  const [epub, setEpub] = useState(false);
  const exportEpub = async () => {
    if (!book) return;
    setEpub(true);
    try {
      await pictureBookToEpub(
        { title: book.title, dedication: book.dedication, coverImage: book.coverImage, pages: book.pages.map((p) => ({ text: p.text, image: p.image })) },
        { title: book.title, language: editionLang ? isoFor(editionLang) : (language ? isoFor(language) : "en") }, book.title || "storybook",
      );
    } catch (e) {
      toast({ title: "EPUB export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setEpub(false);
    }
  };

  // Persist the storybook on demand (if not already saved) so language editions
  // have a parent to link to. Reuses the same upload+save path as the Save button.
  const ensureSaved = async (): Promise<string | null> => {
    if (savedIdRef.current) return savedIdRef.current;
    if (!book) return null;
    const id = await savePictureBook(
      { title: book.title, dedication: book.dedication, coverImage: book.coverImage, pages: book.pages.map((p) => ({ text: p.text, image: p.image })) },
      { variant: "storybook", pageAspect: "16/9", showText: true },
    );
    markSaved(id);
    return id;
  };

  // Build a linked language edition: translate the saved parent's text fields and
  // reuse its already-uploaded illustration URLs (so the edition row stays small).
  const buildStorybookEdition = async ({ language, mode, culture, onProgress }: { language: string; mode: "translate" | "localize"; culture?: string; onProgress?: (done: number, total: number) => void }) => {
    const pid = savedIdRef.current;
    if (!pid) throw new Error("Save your storybook first, then localize it.");
    const parent = await getDocument(pid);
    const pb = ((parent?.payload as Record<string, unknown>)?.book ?? {}) as PictureBookData;
    const texts = [pb.title ?? "", pb.dedication ?? "", ...pb.pages.map((p) => p.text ?? "")];
    const out = await localizeStrings(texts, { language, mode, culture, onProgress });
    const edBook: PictureBookData = {
      title: out[0] || (pb.title ?? ""),
      dedication: out[1] || undefined,
      coverImage: pb.coverImage,
      pages: pb.pages.map((p, i) => ({ text: out[i + 2] ?? p.text, image: p.image })),
    };
    const edTitle = `${pb.title ?? book?.title ?? "Storybook"} (${language}${mode === "localize" && culture ? ` · ${culture}` : ""})`;
    return { title: edTitle, payload: { variant: "storybook", pageAspect: "16/9", showText: true, book: edBook }, preview: "Illustrated storybook" };
  };

  // ── Result ──
  if (book) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{book.title}</span>
            <div className="flex items-center gap-2">
              <select
                value={editionLang}
                disabled={!!translating}
                onChange={(e) => selectEdition(e.target.value)}
                title="Language edition (illustrations preserved)"
                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-sans"
              >
                <option value="">Original</option>
                {LANGUAGE_NAMES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {translating && <span className="text-xs text-muted-foreground font-sans"><Loader2 className="inline h-3.5 w-3.5 animate-spin" /> {translating.done}/{translating.total}</span>}
              <Button variant="ghost" size="sm" onClick={() => { setBook(null); savedIdRef.current = null; setSavedId(null); clearStoryDraft(); }} className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> New
              </Button>
              <Button variant="heroOutline" size="sm" disabled={!!illustrating} onClick={illustrateAll}>
                {illustrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {illustrating ? `Illustrating ${illustrating.done}/${illustrating.total}` : "Illustrate all"}
              </Button>
              <SavePictureBookButton
                build={() => ({ book: { title: book.title, dedication: book.dedication, coverImage: book.coverImage, pages: book.pages.map((p) => ({ text: p.text, image: p.image })) }, variant: "storybook", pageAspect: "16/9", showText: true })}
                onSaved={markSaved}
                savedExternally={!!savedId}
              />
              <Button variant="heroOutline" size="sm" disabled={epub} onClick={exportEpub}>
                {epub ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} EPUB
              </Button>
              <Button variant="hero" size="sm" disabled={pdf} onClick={exportPdf}>
                {pdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <PictureBookView book={book} innerRef={bookRef} pageAspect="16/9" onIllustrateCover={illustrateCover} onIllustratePage={illustratePage} />
          <p className="mt-4 text-center text-xs text-muted-foreground font-sans">
            Illustrations are generated by OpenAI’s image model in your story’s art style. Each illustration counts toward your plan.
          </p>
          <DedicationNotes title={book.title} childName={childName} theme={theme} objective={educationalObjective} />

          <div className="mt-10 border-t border-border/60 pt-8">
            <h2 className="font-serif text-xl font-bold mb-1">Language editions</h2>
            <p className="text-sm text-muted-foreground font-sans mb-5">Save translated or culturally-adapted editions of this storybook — the illustrations are reused, so only the words change. Each edition links to this project and lands in your Library.</p>
            <LocalizePanel
              parentId={savedId}
              ensureSaved={ensureSaved}
              kind="storybook"
              sourceTitle={book.title}
              hasContent={!!book}
              buildEdition={buildStorybookEdition}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Input ──
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <Link to="/children" className="text-xs text-muted-foreground hover:text-foreground font-sans">← Children’s Publishing Studio</Link>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
            <BookHeart className="w-4 h-4 text-educational" />
            <span className="text-sm text-educational font-medium font-sans">Storybook Creator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Create an <span className="text-gradient-gold italic">illustrated storybook</span></h1>
          <p className="text-muted-foreground font-sans">A complete picture book — story, illustrations, cover and a printable PDF — tuned to a child’s age and reading level.</p>
          {seriesName && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
              <BookHeart className="h-4 w-4 text-primary" />
              <span className="text-sm font-sans">Part of the series <span className="font-semibold">{seriesName}</span> — setting and objective are prefilled. <Link to="/series" className="text-primary hover:underline">Manage series</Link></span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card/50">
            <CardHeader><CardTitle className="font-serif text-lg">The child & reading level</CardTitle><CardDescription className="font-sans">Used to pitch the vocabulary and pacing.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="font-sans text-xs">Reading level</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_BANDS.map((band) => {
                    const active = childAge === band.age && readingLevel === band.level;
                    return (
                      <button key={band.label} type="button" onClick={() => { setChildAge(band.age); setReadingLevel(band.level); setPageCount(band.pages); }}
                        className={`rounded-full border px-3 py-1 text-xs font-sans transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {band.label}
                      </button>
                    );
                  })}
                  <span className="self-center text-[11px] text-muted-foreground font-sans">tunes vocabulary, sentence length & story length</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Child’s name (optional — makes them the hero)</Label>
                <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. James" maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Age</Label>
                <Input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="5" maxLength={20} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Reading level</Label>
                <select value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {READING_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader><CardTitle className="font-serif text-lg">The story</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Story type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STORY_TYPES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setStoryType(s.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-sans transition ${storyType === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Theme or idea *</Label>
                <Textarea value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. A shy little fox who learns to make friends in a glowing forest." rows={3} maxLength={400} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="font-sans text-xs">Language (optional)</Label>
                  <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. English, French, Spanish" maxLength={40} list="story-langs" />
                  <datalist id="story-langs">{LANGUAGE_NAMES.map((l) => <option key={l} value={l} />)}</datalist>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-xs">Cultural setting (optional)</Label>
                  <Input value={culturalSetting} onChange={(e) => setCulturalSetting(e.target.value)} placeholder="e.g. United States, Japan, France" maxLength={120} list="country-options" />
                  <CountryDatalist />
                </div>
                {storyType === "educational" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="font-sans text-xs">Educational objective</Label>
                    <Input value={educationalObjective} onChange={(e) => setEducationalObjective(e.target.value)} placeholder="e.g. Counting to ten" maxLength={200} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="font-sans text-xs">Moral / lesson (optional)</Label>
                  <Input value={moralLesson} onChange={(e) => setMoralLesson(e.target.value)} placeholder="e.g. Kindness and courage" maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-xs">Pages</Label>
                  <select value={pageCount} onChange={(e) => setPageCount(parseInt(e.target.value, 10))} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                    {[8, 10, 12, 16, 20, 24].map((n) => <option key={n} value={n}>{n} pages</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Characters (optional)</Label>
                <Textarea value={characters} onChange={(e) => setCharacters(e.target.value)} placeholder="e.g. Pip the fox; Luma the firefly; Old Oak the wise tree." rows={2} maxLength={600} className="resize-none" />
                <CharacterLibrary onInsert={(brief) => setCharacters(`${characters ? characters.replace(/\s*;?\s*$/, ". ") : ""}${brief}`.slice(0, 600))} />
              </div>
            </CardContent>
          </Card>

          <KnowledgeSelect onChange={setKnowledge} />
          <Button variant="hero" size="lg" className="w-full py-6" onClick={create} disabled={!canCreate}>
            {creating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Writing the story…</> : <><Sparkles className="w-5 h-5 mr-2" /> Create story</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground font-sans">First the story is written, then you illustrate the pages and cover. Story text is one generation; each illustration counts separately.</p>
        </div>
      </div>
    </div>
  );
};

export default StorybookCreator;
