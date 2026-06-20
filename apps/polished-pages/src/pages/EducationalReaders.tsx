import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSchoolContent } from "@/lib/school";
import BookReader from "@/components/book/BookReader";
import BookExportPanel from "@/components/book/BookExportPanel";
import SaveToLibrary from "@/components/app/SaveToLibrary";

const AGE_BANDS = ["Ages 4–6", "Ages 7–9", "Ages 10–12"];
const SUBJECTS = ["Reading", "Vocabulary", "Mathematics", "English", "French", "Science", "Geography", "History", "First Science", "First Geography"];

const EducationalReaders = () => {
  const { toast } = useToast();
  const [grade, setGrade] = useState(AGE_BANDS[1]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const title = `${subject}${topic ? ` — ${topic}` : ""} (${grade})`;

  const create = async () => {
    setLoading(true);
    try {
      const doc = await generateSchoolContent({ docType: "reader", grade, subject, topic });
      setContent(doc.content);
    } catch (e) {
      toast({ title: "Could not create reader", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (content !== null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-12 px-6">
            <span className="truncate text-sm font-medium text-muted-foreground font-sans">{title}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setContent(null)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-1" /> New</Button>
              <SaveToLibrary kind="book" title={title} payload={{ markdown: content, title }} preview={`Educational reader · ${subject} · ${grade}`} />
            </div>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-6 pt-8 pb-16">
          <BookExportPanel bookTitle={title} fullContent={content} chapterCount={0} />
          <div className="mt-6"><BookReader content={content} title={title} onContentChange={setContent} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-6 pt-8 pb-16">
        <Link to="/children" className="text-xs text-muted-foreground hover:text-foreground font-sans">← Children’s Publishing Studio</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
          <BookOpenCheck className="w-4 h-4 text-educational" />
          <span className="text-sm text-educational font-medium font-sans">Educational Readers</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Create an <span className="text-gradient-gold italic">educational reader</span></h1>
        <p className="text-muted-foreground font-sans mb-8">A leveled reader that teaches a topic through clear explanation, examples and review questions — choose a designed interior and export to print or EPUB.</p>

        <Card className="border-border bg-card/50">
          <CardHeader><CardTitle className="font-serif text-lg">The reader</CardTitle><CardDescription className="font-sans">Pick the age band and subject; add a specific topic to focus it.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Age band</Label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Subject</Label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-xs">Topic (optional)</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The water cycle" maxLength={200} />
            </div>
          </CardContent>
        </Card>

        <Button variant="hero" size="lg" className="mt-6 w-full py-6" onClick={create} disabled={loading}>
          {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Writing the reader…</> : <><Sparkles className="w-5 h-5 mr-2" /> Create reader</>}
        </Button>
      </div>
    </div>
  );
};

export default EducationalReaders;
