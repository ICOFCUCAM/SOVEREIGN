import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authHeader } from "@/lib/session";
import { logAiActivity } from "@/lib/ai-activity-log";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, PenTool, Download, Repeat, Eye, Package, Image as ImageIcon, Check, Loader2, HardDrive, Languages, Headphones, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookChapter, BookOutline, BookMode, BookDepth, BookView, ImprovementType } from "@/types/book";
import { useDraftAutosave, readDraft } from "@/hooks/use-draft-autosave";
import LocalizePanel from "@/components/app/LocalizePanel";
import AudiobookPanel from "@/components/book/AudiobookPanel";
import ProductionPanel, { type BookMeta } from "@/components/book/ProductionPanel";
import { localizeMarkdown, markdownEdition } from "@/lib/localize";
import BookSetup from "@/components/book/BookSetup";
import BookOutlineEditor from "@/components/book/BookOutlineEditor";
import BookWritingPanel from "@/components/book/BookWritingPanel";
import BookContentViewer from "@/components/book/BookContentViewer";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import BookRepurposePanel from "@/components/book/BookRepurposePanel";
import BookPublishingPackage from "@/components/book/BookPublishingPackage";
import CoverGenerator from "@/components/book/CoverGenerator";

// One book workspace = one auto-saved draft. The whole working state is mirrored
// to localStorage on every change and checkpointed into the library, so a
// refresh, crash, lost connection or logout never loses a generated book.
const DRAFT_KEY = "book.workspace";

interface BookDraft {
  bookTitle: string; genre: string; targetAudience: string;
  depth: BookDepth; mode: BookMode; existingContent: string;
  view: BookView; outline: BookOutline | null; chapters: BookChapter[];
  editedBook: string | null;
  meta: BookMeta; coverDone: boolean;
}

// Assemble the publishable markdown from a draft (same shape the reader/export
// and the marketplace expect).
const assembleBook = (d: BookDraft): string => {
  const gen = d.chapters.filter((ch) => ch.content);
  if (gen.length === 0) return "";
  return `# ${d.outline?.title || d.bookTitle}\n\n${d.outline?.subtitle ? `*${d.outline.subtitle}*\n\n` : ""}${d.outline?.frontMatter ? `---\n\n${d.outline.frontMatter}\n\n---\n\n` : ""}${gen.map((ch) => ch.content).join("\n\n---\n\n")}${d.outline?.backMatter ? `\n\n---\n\n${d.outline.backMatter}` : ""}`;
};

const draftPreview = (full: string): string =>
  full.replace(/^#[^\n]*\n/, "").replace(/[#*_>`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);

const relTime = (ts: number | null): string => {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const BookCreator = () => {
  const { toast } = useToast();

  // Restore any saved draft synchronously, so there's no empty-flash and the
  // first persisted value equals what we restored (no clobber on mount).
  const restored = useRef(readDraft<BookDraft>(DRAFT_KEY)).current;
  const init = restored?.data;

  // Book metadata
  const [bookTitle, setBookTitle] = useState(init?.bookTitle ?? "");
  const [genre, setGenre] = useState(init?.genre ?? "");
  const [targetAudience, setTargetAudience] = useState(init?.targetAudience ?? "");
  const [depth, setDepth] = useState<BookDepth>(init?.depth ?? "standard");
  const [mode, setMode] = useState<BookMode>(init?.mode ?? "guided");
  const [existingContent, setExistingContent] = useState(init?.existingContent ?? "");

  // State
  const [view, setView] = useState<BookView>(init?.view ?? "setup");
  const [outline, setOutline] = useState<BookOutline | null>(init?.outline ?? null);
  // Drop any transient "generating" flags that were saved mid-run.
  const [chapters, setChapters] = useState<BookChapter[]>(
    (init?.chapters ?? []).map((c) => ({ ...c, isGenerating: false, status: c.content ? (c.status === "generating" ? "complete" : c.status) : "pending" }))
  );
  const [viewingChapter, setViewingChapter] = useState<number | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  // Final-copy edits made in the preview override the assembled content for
  // preview, export and publish (the author's last pass before exporting).
  const [editedBook, setEditedBook] = useState<string | null>(init?.editedBook ?? null);

  // Publishing metadata + production signals (Book Production Center).
  const [meta, setMeta] = useState<BookMeta>(init?.meta ?? {});
  const [coverDone, setCoverDone] = useState<boolean>(init?.coverDone ?? false);

  const draft: BookDraft = useMemo(
    () => ({ bookTitle, genre, targetAudience, depth, mode, existingContent, view, outline, chapters, editedBook, meta, coverDone }),
    [bookTitle, genre, targetAudience, depth, mode, existingContent, view, outline, chapters, editedBook, meta, coverDone]
  );

  const autosave = useDraftAutosave<BookDraft>({
    storageKey: DRAFT_KEY,
    data: draft,
    initialDocId: restored?.docId ?? null,
    hasContent: (d) => !!d.outline || d.chapters.some((c) => c.content),
    toDocument: (d) => {
      const full = d.editedBook ?? assembleBook(d);
      if (!full && !d.outline) return null;
      return { kind: "book", title: d.outline?.title || d.bookTitle || "Untitled book", payload: { markdown: full, draft: d }, preview: draftPreview(full) };
    },
  });

  // Let the author know their work came back.
  useEffect(() => {
    if (restored && (restored.data.outline || restored.data.chapters.some((c) => c.content))) {
      toast({ title: "Recovered your draft", description: "Picking up where you left off — this book auto-saves as you work." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatedChapters = chapters.filter((ch) => ch.content);
  const fullContent = assembleBook(draft);
  const effectiveContent = editedBook ?? fullContent;

  // Start a fresh book — checkpoint the current one to the library first so it's
  // safely under Drafts, then clear the local workspace and reset.
  const newBook = async () => {
    await autosave.flush().catch(() => {});
    autosave.discard();
    setBookTitle(""); setGenre(""); setTargetAudience(""); setDepth("standard"); setMode("guided"); setExistingContent("");
    setOutline(null); setChapters([]); setEditedBook(null); setViewingChapter(null); setView("setup");
    setMeta({}); setCoverDone(false);
  };

  // Generate outline
  const handleGenerateOutline = async () => {
    if (!bookTitle.trim()) return;
    setIsGeneratingOutline(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-outline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: await authHeader(),
          },
          body: JSON.stringify({ bookTitle, genre, targetAudience, depth, mode, existingContent }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Outline generation failed");
      }

      const data = await response.json();
      const ol: BookOutline = data.outline;
      setOutline(ol);
      setBookTitle(ol.title || bookTitle);

      const newChapters: BookChapter[] = ol.chapters.map((ch, i) => ({
        id: crypto.randomUUID(),
        title: ch.title,
        summary: ch.summary,
        notes: "",
        keyPoints: ch.keyPoints || [],
        hook: ch.hook || "",
        status: "pending" as const,
      }));
      setChapters(newChapters);
      logAiActivity({ tool: "Book Creator", description: bookTitle, status: "ok" });

      if (mode === "quick") {
        setView("writing");
        // Auto-generate all chapters in quick mode
        setTimeout(() => handleGenerateAll(newChapters), 100);
      } else {
        setView("outline");
      }
    } catch (error) {
      logAiActivity({ tool: "Book Creator", description: bookTitle, status: "error" });
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Generate single chapter
  const handleGenerateChapter = async (index: number, chaptersRef?: BookChapter[]) => {
    const currentChapters = chaptersRef || chapters;
    const ch = currentChapters[index];
    if (!ch?.title.trim()) return;

    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, isGenerating: true, status: "generating" } : c)));

    try {
      // Collect previous chapter summaries for anti-repetition
      const previousChapters = currentChapters.slice(0, index).filter((c) => c.content).map((c) => c.content!.substring(0, 600));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-chapter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: await authHeader(),
          },
          body: JSON.stringify({
            bookTitle: outline?.title || bookTitle,
            genre,
            targetAudience,
            chapters: currentChapters.map((c) => ({ title: c.title, summary: c.summary, notes: c.notes, keyPoints: c.keyPoints, hook: c.hook })),
            chapterIndex: index,
            depth,
            previousChapters,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }

      const data = await response.json();
      setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, content: data.chapter, isGenerating: false, status: "complete" } : c)));
    } catch (error) {
      setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, isGenerating: false, status: "pending" } : c)));
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  // Generate all chapters sequentially
  const handleGenerateAll = async (chaptersRef?: BookChapter[]) => {
    const currentChapters = chaptersRef || chapters;
    for (let i = 0; i < currentChapters.length; i++) {
      if (!currentChapters[i].title.trim() || currentChapters[i].content) continue;
      await handleGenerateChapter(i, currentChapters);
    }
  };

  // Improve chapter
  const handleImproveChapter = async (index: number, type: ImprovementType) => {
    const ch = chapters[index];
    if (!ch?.content) return;

    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, isGenerating: true } : c)));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/improve-book-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: await authHeader(),
          },
          body: JSON.stringify({
            content: ch.content,
            improvementType: type,
            bookContext: `Book: ${outline?.title || bookTitle}, Genre: ${genre}, Audience: ${targetAudience}`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Improvement failed");
      }

      const data = await response.json();
      setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, content: data.content, isGenerating: false, status: "improved" } : c)));
      toast({ title: "Chapter Improved", description: `Applied "${type}" enhancement` });
    } catch (error) {
      setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, isGenerating: false } : c)));
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed", variant: "destructive" });
    }
  };

  const isAnyGenerating = chapters.some((ch) => ch.isGenerating);

  // Navigation tabs for post-outline views
  const tabs: { id: BookView; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "outline", label: "Outline", icon: <BookOpen className="w-3.5 h-3.5" />, show: !!outline },
    { id: "writing", label: "Write", icon: <PenTool className="w-3.5 h-3.5" />, show: !!outline },
    { id: "preview", label: "Preview", icon: <Eye className="w-3.5 h-3.5" />, show: generatedChapters.length > 0 },
    { id: "export", label: "Export", icon: <Download className="w-3.5 h-3.5" />, show: generatedChapters.length > 0 },
    { id: "repurpose", label: "Repurpose", icon: <Repeat className="w-3.5 h-3.5" />, show: generatedChapters.length > 0 },
    { id: "localize", label: "Localize", icon: <Languages className="w-3.5 h-3.5" />, show: generatedChapters.length > 0 },
    { id: "audiobook", label: "Audiobook", icon: <Headphones className="w-3.5 h-3.5" />, show: generatedChapters.length > 0 },
    { id: "cover", label: "Cover", icon: <ImageIcon className="w-3.5 h-3.5" />, show: !!outline },
    { id: "production", label: "Production", icon: <ClipboardCheck className="w-3.5 h-3.5" />, show: !!outline },
    { id: "publish", label: "Publish", icon: <Package className="w-3.5 h-3.5" />, show: !!outline },
  ];

  // Discreet auto-save indicator, shown once there's something to keep.
  const showStatus = autosave.status !== "idle";
  const SaveStatus = () => (
    <span className="hidden items-center gap-1.5 text-xs font-sans text-muted-foreground sm:inline-flex" title={autosave.lastSavedAt ? `Last saved ${relTime(autosave.lastSavedAt)}` : undefined}>
      {autosave.status === "saving" ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
      ) : autosave.status === "local" ? (
        <><HardDrive className="h-3.5 w-3.5" /> Saved on this device</>
      ) : (
        <><Check className="h-3.5 w-3.5 text-green-600" /> Saved{autosave.lastSavedAt ? ` · ${relTime(autosave.lastSavedAt)}` : ""}</>
      )}
    </span>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-14 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-12 px-6">
          {/* Tabs */}
          {view !== "setup" && (
            <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {tabs.filter((t) => t.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setView(tab.id); setViewingChapter(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {showStatus && <SaveStatus />}
            {view !== "setup" && (
              <Button variant="ghost" size="sm" onClick={() => { void newBook(); }}>
                <ArrowLeft className="w-4 h-4 mr-1" /> New Book
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewingChapter !== null ? `ch-${viewingChapter}` : view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Chapter preview */}
            {viewingChapter !== null && chapters[viewingChapter]?.content ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setViewingChapter(null)} className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <BookContentViewer content={chapters[viewingChapter].content!} title={chapters[viewingChapter].title} />
              </div>
            ) : view === "setup" ? (
              <div>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-publishing/20 bg-publishing/5 px-4 py-1.5 mb-4">
                    <BookOpen className="w-4 h-4 text-publishing" />
                    <span className="text-sm text-publishing font-medium font-sans">Book Creator</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">
                    Create your <span className="text-gradient-gold italic">book</span>
                  </h1>
                  <p className="text-muted-foreground font-sans">Full-length books with structured chapters — outline, write, refine, and export to EPUB, PDF, or print.</p>
                </div>
                <BookSetup
                  bookTitle={bookTitle} setBookTitle={setBookTitle}
                  genre={genre} setGenre={setGenre}
                  targetAudience={targetAudience} setTargetAudience={setTargetAudience}
                  depth={depth} setDepth={setDepth}
                  mode={mode} setMode={setMode}
                  existingContent={existingContent} setExistingContent={setExistingContent}
                  onGenerateOutline={handleGenerateOutline}
                  isGenerating={isGeneratingOutline}
                />
              </div>
            ) : view === "outline" && outline ? (
              <BookOutlineEditor
                outline={outline}
                chapters={chapters}
                setChapters={setChapters}
                onStartWriting={() => setView("writing")}
              />
            ) : view === "writing" ? (
              <BookWritingPanel
                chapters={chapters}
                bookTitle={outline?.title || bookTitle}
                onGenerateChapter={(i) => handleGenerateChapter(i)}
                onGenerateAll={() => handleGenerateAll()}
                onImproveChapter={handleImproveChapter}
                onViewChapter={(i) => setViewingChapter(i)}
                isAnyGenerating={isAnyGenerating}
              />
            ) : view === "preview" ? (
              <BookReader content={effectiveContent} title={outline?.title || bookTitle} onContentChange={setEditedBook} />
            ) : view === "export" ? (
              <BookExportPanel
                bookTitle={outline?.title || bookTitle}
                fullContent={effectiveContent}
                chapterCount={generatedChapters.length}
              />
            ) : view === "repurpose" ? (
              <BookRepurposePanel
                bookTitle={outline?.title || bookTitle}
                fullContent={effectiveContent}
              />
            ) : view === "localize" ? (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1">Localize your book</h2>
                <p className="text-sm text-muted-foreground font-sans mb-5">Create faithful translations or culturally adapted editions — each one stays linked to this book and lands in your Library, ready to publish.</p>
                <LocalizePanel
                  parentId={autosave.docId}
                  ensureSaved={() => autosave.flush()}
                  kind="book"
                  sourceTitle={outline?.title || bookTitle || "Untitled book"}
                  hasContent={generatedChapters.length > 0}
                  buildEdition={async ({ language, mode, culture, onProgress }) => {
                    const body = await localizeMarkdown(effectiveContent, { language, mode, culture, onProgress });
                    return markdownEdition(outline?.title || bookTitle || "Untitled book", body, language, mode, culture);
                  }}
                />
              </div>
            ) : view === "audiobook" ? (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1">Audiobook</h2>
                <p className="text-sm text-muted-foreground font-sans mb-5">Narrate your book chapter by chapter with a natural AI voice, preview it, and download the MP3 files. Localize first to narrate a language edition.</p>
                <AudiobookPanel chapters={generatedChapters.map((c) => ({ title: c.title, content: c.content! }))} bookTitle={outline?.title || bookTitle || "Untitled book"} parentId={autosave.docId} ensureSaved={() => autosave.flush()} />
              </div>
            ) : view === "cover" ? (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1">Cover design</h2>
                <p className="text-sm text-muted-foreground font-sans mb-5">Generate a front and back cover with AI, guided by your art direction. ISBN &amp; publisher (set under Production) shape the barcode and imprint.</p>
                <CoverGenerator title={outline?.title || bookTitle} subtitle={outline?.subtitle || meta.subtitle} isbn={meta.isbn} publisher={meta.publisher} pageCount={meta.pageCount} paper={meta.paper} trimSize={meta.trimSize} onGenerated={() => setCoverDone(true)} />
              </div>
            ) : view === "production" ? (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1">Production center</h2>
                <p className="text-sm text-muted-foreground font-sans mb-5">Everything that turns this manuscript into a distributable book — metadata, ISBN, print specs, and how ready it is to publish.</p>
                <ProductionPanel
                  meta={meta}
                  setMeta={setMeta}
                  bookTitle={outline?.title || bookTitle}
                  manuscriptComplete={chapters.length > 0 && generatedChapters.length === chapters.length}
                  coverDone={coverDone}
                  parentId={autosave.docId}
                />
              </div>
            ) : view === "publish" && outline ? (
              <BookPublishingPackage outline={outline} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookCreator;
