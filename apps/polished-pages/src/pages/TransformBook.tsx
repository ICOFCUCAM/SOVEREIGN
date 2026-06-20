import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Upload, FileText, Loader2, Wand2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authHeader } from "@/lib/session";
import { extractFileText, CV_ACCEPT, CV_MIME } from "@/lib/extract-file-text";
import { splitBook } from "@/lib/book-split";
import { Progress } from "@/components/ui/progress";
import BookContentViewer from "@/components/book/BookContentViewer";
import BookExportPanel from "@/components/book/BookExportPanel";
import CoverGenerator from "@/components/book/CoverGenerator";
import SaveToLibrary from "@/components/app/SaveToLibrary";

const TransformBook = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [bookText, setBookText] = useState("");
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [tab, setTab] = useState<"book" | "cover">("book");

  const canRun = (file || bookText.trim().length > 200) && instruction.trim().length > 4 && !progress;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!CV_MIME.includes(f.type)) { toast({ title: "Unsupported format", description: "Upload a PDF, DOCX, or TXT.", variant: "destructive" }); return; }
    if (f.size > 15 * 1024 * 1024) { toast({ title: "File too large", description: "Maximum 15MB.", variant: "destructive" }); return; }
    setFile(f);
  };

  const run = async () => {
    try {
      let text = bookText.trim();
      if (file) text = await extractFileText(file);
      if (text.length < 200) throw new Error("That book looks too short to transform.");

      const sections = splitBook(text);
      setProgress({ done: 0, total: sections.length });
      const out: string[] = [];
      for (let i = 0; i < sections.length; i++) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transform-book`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: await authHeader() },
          body: JSON.stringify({ section: sections[i], instruction, bookTitle: title, sectionIndex: i + 1, total: sections.length }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed on section ${i + 1}`);
        }
        const data = await res.json();
        out.push((data.content as string).trim());
        setProgress({ done: i + 1, total: sections.length });
      }
      setResult(out.join("\n\n"));
      setTab("book");
    } catch (e) {
      toast({ title: "Transform failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setProgress(null);
    }
  };

  // ── Result view ──
  if (result) {
    const displayTitle = title.trim() || "Transformed book";
    const wordCount = result.split(/\s+/).filter(Boolean).length;
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {([["book", "New book"], ["cover", "Cover design"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`rounded-md px-3 py-1 text-sm font-medium font-sans transition ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setResult(null); }} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> New transform
            </Button>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          {tab === "book" ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground font-sans">{wordCount.toLocaleString()} words</div>
                <SaveToLibrary kind="book" title={displayTitle} payload={{ markdown: result, title: displayTitle }} preview={instruction.slice(0, 160)} />
              </div>
              <BookExportPanel bookTitle={displayTitle} fullContent={result} chapterCount={0} />
              <div className="mt-6"><BookContentViewer content={result} title={displayTitle} /></div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <CoverGenerator title={displayTitle} />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── Input view ──
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-4">
            <Wand2 className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold-light font-medium font-sans">Transform a Book</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">
            Revise an entire <span className="text-gradient-gold italic">book</span>
          </h1>
          <p className="text-muted-foreground font-sans">
            Upload a book of any length, describe what to change, and get a new version — then design its cover. Long books are processed chapter by chapter so nothing is lost.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="font-serif text-lg">1 · Your book</CardTitle>
              <CardDescription className="font-sans">Upload a PDF, DOCX or TXT — or paste the text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input ref={inputRef} type="file" accept={CV_ACCEPT} className="hidden" onChange={onFile} />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => inputRef.current?.click()}>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-7 h-7 text-primary" />
                    <div className="text-left">
                      <p className="font-sans font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-sans text-sm text-muted-foreground">Click to upload (PDF, DOCX, TXT — up to 15MB)</p>
                  </>
                )}
              </div>
              <div className="text-center text-xs text-muted-foreground font-sans">or paste</div>
              <Textarea placeholder="Paste your full book text here…" value={bookText} onChange={(e) => { setBookText(e.target.value); if (file) setFile(null); }} rows={6} maxLength={400000} className="resize-none" disabled={!!file} />
              <Input placeholder="Book title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="font-serif text-lg">2 · What to change</CardTitle>
              <CardDescription className="font-sans">Describe the change to apply across the whole book.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={"e.g. Change the protagonist's name from Mark to Daniel everywhere.\nRewrite it in a warmer, first-person voice.\nUpdate all statistics and dates to 2026.\nMake the examples about healthcare instead of finance."}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={12}
                maxLength={4000}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {progress ? (
          <div className="mt-6 rounded-xl border border-border bg-card/50 p-5">
            <div className="mb-2 flex items-center justify-between text-sm font-sans">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Transforming your book…</span>
              <span className="text-muted-foreground">Section {progress.done} of {progress.total}</span>
            </div>
            <Progress value={progress.total ? Math.round((progress.done / progress.total) * 100) : 0} className="h-2" />
          </div>
        ) : (
          <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={run} disabled={!canRun}>
            <BookOpen className="w-5 h-5 mr-2" /> Transform book
          </Button>
        )}
        {!canRun && !progress && <p className="mt-2 text-center text-xs text-muted-foreground font-sans">Add your book (upload or paste) and describe the change to continue.</p>}
      </div>
    </div>
  );
};

export default TransformBook;
