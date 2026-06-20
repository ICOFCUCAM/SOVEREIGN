import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Image as ImageIcon, Download, Loader2, ArrowLeft, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { elementToPdf } from "@/lib/export-pdf";
import { generateStorybook, generateIllustration, type Storybook, type StoryInput } from "@/lib/storybook";

const READING_LEVELS = [
  "Pre-reader (ages 2–4)",
  "Early reader (ages 4–6)",
  "Developing reader (ages 6–8)",
  "Confident reader (ages 8–10)",
];

const StorybookCreator = () => {
  const { toast } = useToast();
  const bookRef = useRef<HTMLDivElement>(null);

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [readingLevel, setReadingLevel] = useState(READING_LEVELS[1]);
  const [theme, setTheme] = useState("");
  const [moralLesson, setMoralLesson] = useState("");
  const [characters, setCharacters] = useState("");
  const [pageCount, setPageCount] = useState(12);

  const [creating, setCreating] = useState(false);
  const [book, setBook] = useState<Storybook | null>(null);
  const [illustrating, setIllustrating] = useState<{ done: number; total: number } | null>(null);
  const [pdf, setPdf] = useState(false);

  const canCreate = theme.trim().length > 3 && !creating;

  const create = async () => {
    setCreating(true);
    try {
      const input: StoryInput = { childName, childAge, readingLevel, theme, moralLesson, characters, pageCount };
      setBook(await generateStorybook(input));
    } catch (e) {
      toast({ title: "Could not create story", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setCreating(false);
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

  // ── Result ──
  if (book) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{book.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setBook(null)} className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> New
              </Button>
              <Button variant="heroOutline" size="sm" disabled={!!illustrating} onClick={illustrateAll}>
                {illustrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {illustrating ? `Illustrating ${illustrating.done}/${illustrating.total}` : "Illustrate all"}
              </Button>
              <Button variant="hero" size="sm" disabled={pdf} onClick={exportPdf}>
                {pdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <div ref={bookRef} className="space-y-6 rounded-xl bg-white p-4 sm:p-8">
            {/* Cover */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="relative flex aspect-[3/4] items-center justify-center bg-muted/40">
                {book.coverImage ? (
                  <img src={book.coverImage} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <Button variant="heroOutline" size="sm" onClick={illustrateCover}><Sparkles className="w-4 h-4 mr-1" /> Illustrate cover</Button>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                  <div className="font-serif text-2xl font-bold text-white drop-shadow">{book.title}</div>
                  {book.dedication && <div className="mt-1 text-sm text-white/85 font-sans">{book.dedication}</div>}
                </div>
              </div>
            </div>

            {/* Pages */}
            {book.pages.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <div className="flex aspect-[16/9] items-center justify-center bg-muted/40">
                  {p.image ? (
                    <img src={p.image} alt={`Page ${i + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <Button variant="heroOutline" size="sm" onClick={() => illustratePage(i)}><ImageIcon className="w-4 h-4 mr-1" /> Illustrate page {i + 1}</Button>
                  )}
                </div>
                <div className="p-5">
                  <p className="font-serif text-lg leading-relaxed text-foreground">{p.text}</p>
                  <div className="mt-2 text-right text-xs text-muted-foreground font-sans">{i + 1}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground font-sans">
            Illustrations are generated by OpenAI’s image model in your story’s art style. Each illustration counts toward your plan.
          </p>
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
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
            <BookHeart className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold-light font-medium font-sans">Storybook Creator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Create an <span className="text-gradient-gold italic">illustrated storybook</span></h1>
          <p className="text-muted-foreground font-sans">A complete picture book — story, illustrations, cover and a printable PDF — tuned to a child’s age and reading level.</p>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card/50">
            <CardHeader><CardTitle className="font-serif text-lg">The child & reading level</CardTitle><CardDescription className="font-sans">Used to pitch the vocabulary and pacing.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <Label className="font-sans text-xs">Theme or idea *</Label>
                <Textarea value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. A shy little fox who learns to make friends in a glowing forest." rows={3} maxLength={400} className="resize-none" />
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
              </div>
            </CardContent>
          </Card>

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
