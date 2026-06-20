import { useState } from "react";
import { Link } from "react-router-dom";
import { NotebookPen, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CountryDatalist from "@/components/app/CountryDatalist";
import { generateSchoolContent, type SchoolDocType } from "@/lib/school";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import SaveToLibrary from "@/components/app/SaveToLibrary";

const PARTS: { type: SchoolDocType; label: string }[] = [
  { type: "student-book", label: "Student book" },
  { type: "workbook", label: "Workbook" },
  { type: "teacher-guide", label: "Teacher guide" },
  { type: "quiz", label: "Quiz" },
  { type: "answer-key", label: "Answer key" },
];

const ClassroomPacks = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState("Grade 4");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("");

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [docs, setDocs] = useState<Record<string, string> | null>(null);
  const [tab, setTab] = useState<SchoolDocType>("student-book");

  const packTitle = `${subject}${topic ? ` — ${topic}` : ""} (${grade})`;
  const canRun = subject.trim().length > 1 && topic.trim().length > 1 && !progress;

  const run = async () => {
    setProgress({ done: 0, total: PARTS.length });
    const out: Record<string, string> = {};
    try {
      for (let i = 0; i < PARTS.length; i++) {
        const { type } = PARTS[i];
        const sourceContent = type === "answer-key" ? `${out["workbook"] ?? ""}\n\n${out["quiz"] ?? ""}` : undefined;
        const doc = await generateSchoolContent({ docType: type, grade, subject, topic, country, sourceContent });
        out[type] = doc.content;
        setProgress({ done: i + 1, total: PARTS.length });
      }
      setDocs(out);
      setTab("student-book");
    } catch (e) {
      toast({ title: "Pack generation failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setProgress(null);
    }
  };

  if (docs) {
    const current = docs[tab] ?? "";
    const docTitle = `${packTitle} — ${PARTS.find((p) => p.type === tab)?.label}`;
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex flex-wrap items-center justify-between gap-2 h-auto py-2 px-6">
            <div className="inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
              {PARTS.map((p) => (
                <button key={p.type} onClick={() => setTab(p.type)}
                  className={`rounded-md px-3 py-1 text-xs font-medium font-sans transition ${tab === p.type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SaveToLibrary kind="book" title={docTitle} payload={{ markdown: current, title: docTitle }} preview={`Classroom pack · ${subject} · ${grade}`} />
              <Button variant="ghost" size="sm" onClick={() => setDocs(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> New pack</Button>
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          <BookExportPanel bookTitle={docTitle} fullContent={current} chapterCount={0} />
          <div className="mt-6">
            <BookReader content={current} title={docTitle} onContentChange={(s) => setDocs((d) => (d ? { ...d, [tab]: s } : d))} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-16">
        <Link to="/children" className="text-xs text-muted-foreground hover:text-foreground font-sans">← Children’s Publishing Studio</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
          <NotebookPen className="w-4 h-4 text-educational" />
          <span className="text-sm text-educational font-medium font-sans">Classroom Packs</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Build a <span className="text-gradient-gold italic">classroom pack</span></h1>
        <p className="text-muted-foreground font-sans mb-8">One topic becomes a full teaching set — student book, workbook, teacher guide, quiz and a matching answer key.</p>

        <Card className="border-border bg-card/50">
          <CardHeader><CardTitle className="font-serif text-lg">The lesson</CardTitle><CardDescription className="font-sans">The answer key is generated against the actual workbook and quiz, so it always matches.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="font-sans text-xs">Grade / level *</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 4" maxLength={60} /></div>
              <div className="space-y-1.5"><Label className="font-sans text-xs">Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Science" maxLength={80} /></div>
            </div>
            <div className="space-y-1.5"><Label className="font-sans text-xs">Topic *</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The life cycle of plants" maxLength={200} /></div>
            <div className="space-y-1.5"><Label className="font-sans text-xs">Curriculum / country (optional)</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. US Common Core" maxLength={80} list="country-options" /><CountryDatalist /></div>
          </CardContent>
        </Card>

        {progress ? (
          <div className="mt-6 rounded-xl border border-border bg-card/50 p-5">
            <div className="mb-2 flex items-center justify-between text-sm font-sans">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Building your pack…</span>
              <span className="text-muted-foreground">{PARTS[Math.min(progress.done, PARTS.length - 1)].label} · {progress.done}/{progress.total}</span>
            </div>
            <Progress value={Math.round((progress.done / progress.total) * 100)} className="h-2" />
          </div>
        ) : (
          <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={run} disabled={!canRun}>
            <Sparkles className="w-5 h-5 mr-2" /> Generate classroom pack
          </Button>
        )}
        {!canRun && !progress && <p className="mt-2 text-center text-xs text-muted-foreground font-sans">Add a grade, subject and topic to continue.</p>}
      </div>
    </div>
  );
};

export default ClassroomPacks;
