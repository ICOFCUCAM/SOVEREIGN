import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Palette, Sparkles, Wand2, Download, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { elementToPdf } from "@/lib/export-pdf";
import { generateColoringBook, generateIllustration, type ColoringBook } from "@/lib/storybook";
import PictureBookView, { type PictureBookData } from "@/components/children/PictureBookView";

const ColoringBookCreator = () => {
  const { toast } = useToast();
  const bookRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState("");
  const [age, setAge] = useState("5");
  const [pageCount, setPageCount] = useState(12);

  const [creating, setCreating] = useState(false);
  const [book, setBook] = useState<ColoringBook | null>(null);
  const [illustrating, setIllustrating] = useState<{ done: number; total: number } | null>(null);
  const [pdf, setPdf] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      setBook(await generateColoringBook({ theme, age, pageCount }));
    } catch (e) {
      toast({ title: "Could not create", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const lineArt = (prompt: string) => generateIllustration({ prompt, lineArt: true, orientation: "portrait" });

  const illustrateCover = async () => {
    if (!book) return;
    try {
      const image = await lineArt(`Title cover scene for a children's colouring book about ${theme}`);
      setBook((b) => (b ? { ...b, coverImage: image } : b));
    } catch (e) { toast({ title: "Cover failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };
  const illustratePage = async (i: number) => {
    if (!book) return;
    try {
      const image = await lineArt(book.pages[i].illustrationPrompt);
      setBook((b) => (b ? { ...b, pages: b.pages.map((p, j) => (j === i ? { ...p, image } : p)) } : b));
    } catch (e) { toast({ title: `Page ${i + 1} failed`, description: e instanceof Error ? e.message : "", variant: "destructive" }); throw e; }
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
    } catch { /* stop batch on error */ } finally { setIllustrating(null); }
  };
  const exportPdf = async () => {
    if (!bookRef.current) return;
    setPdf(true);
    try { await elementToPdf(bookRef.current, `${book?.title || "coloring-book"}.pdf`, "#ffffff"); }
    catch (e) { toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setPdf(false); }
  };

  if (book) {
    const view: PictureBookData = { title: book.title, coverImage: book.coverImage, pages: book.pages.map((p) => ({ image: p.image, illustrationPrompt: p.illustrationPrompt })) };
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{book.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setBook(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> New</Button>
              <Button variant="heroOutline" size="sm" disabled={!!illustrating} onClick={illustrateAll}>
                {illustrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {illustrating ? `Drawing ${illustrating.done}/${illustrating.total}` : "Draw all pages"}
              </Button>
              <Button variant="hero" size="sm" disabled={pdf} onClick={exportPdf}>
                {pdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
          <PictureBookView book={view} innerRef={bookRef} pageAspect="3/4" showText={false} onIllustrateCover={illustrateCover} onIllustratePage={illustratePage} />
          <p className="mt-4 text-center text-xs text-muted-foreground font-sans">Pages are line art ready to print and colour. Each page counts toward your plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-16">
        <Link to="/children" className="text-xs text-muted-foreground hover:text-foreground font-sans">← Children’s Publishing Studio</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
          <Palette className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold-light font-medium font-sans">Coloring Book Creator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Make a <span className="text-gradient-gold italic">coloring book</span></h1>
        <p className="text-muted-foreground font-sans mb-8">Pick a theme and we’ll design printable black-and-white line-art pages to colour in.</p>

        <Card className="border-border bg-card/50">
          <CardHeader><CardTitle className="font-serif text-lg">Your coloring book</CardTitle><CardDescription className="font-sans">A clear theme works best — animals, vehicles, dinosaurs, fairy tales, the ocean…</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Theme *</Label>
              <Textarea value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Friendly jungle animals" rows={2} maxLength={200} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="font-sans text-xs">Age</Label><Input value={age} onChange={(e) => setAge(e.target.value)} maxLength={20} /></div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Pages</Label>
                <select value={pageCount} onChange={(e) => setPageCount(parseInt(e.target.value, 10))} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {[8, 12, 16, 20, 24, 30].map((n) => <option key={n} value={n}>{n} pages</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={create} disabled={theme.trim().length < 3 || creating}>
          {creating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Planning pages…</> : <><Sparkles className="w-5 h-5 mr-2" /> Create coloring book</>}
        </Button>
      </div>
    </div>
  );
};

export default ColoringBookCreator;
