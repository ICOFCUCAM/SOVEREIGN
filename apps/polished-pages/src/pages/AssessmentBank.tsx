import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Loader2, Plus, Trash2, FileDown, Eye, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CountryDatalist from "@/components/app/CountryDatalist";
import { generateSchoolContent, type SchoolDocType } from "@/lib/school";
import { saveAssessment, listAssessments, getAssessment, deleteAssessment, type AssessmentSummary, type AssessmentFull } from "@/lib/assessment-bank";
import { markdownToPrintPdf } from "@/lib/export-print-pdf";
import { getTrim } from "@/lib/print-sizes";

const TYPES: { id: SchoolDocType; label: string }[] = [
  { id: "quiz", label: "Quiz" },
  { id: "exam", label: "Exam" },
  { id: "worksheet", label: "Worksheet" },
  { id: "assessment", label: "Assessment + rubric" },
  { id: "homework-pack", label: "Homework pack" },
  { id: "revision", label: "Revision" },
];

const AssessmentBank = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AssessmentSummary[] | null>(null);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("");
  const [docType, setDocType] = useState<SchoolDocType>("quiz");
  const [busy, setBusy] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [viewing, setViewing] = useState<AssessmentFull | null>(null);

  const load = () => { listAssessments(filterSubject || undefined, filterGrade || undefined).then(setItems).catch(() => setItems([])); };
  useEffect(load, [filterSubject, filterGrade]);

  const generate = async () => {
    if (!topic.trim() && !subject.trim()) { toast({ title: "Add a subject or topic" }); return; }
    setBusy(true);
    try {
      const doc = await generateSchoolContent({ docType, grade, subject, topic, country });
      await saveAssessment({ subject, grade, topic, docType, title: doc.title ? `${doc.title}: ${topic || subject}` : (topic || subject), content: doc.content });
      setTopic("");
      load();
      toast({ title: "Saved to your bank", description: "Reuse it any time, filtered by subject and grade." });
    } catch (e) {
      toast({ title: "Could not generate", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const view = async (id: string) => { try { setViewing(await getAssessment(id)); } catch { /* ignore */ } };
  const remove = async (id: string) => {
    setItems((prev) => prev?.filter((x) => x.id !== id) ?? null);
    try { await deleteAssessment(id); } catch { load(); }
  };
  const exportPdf = async (a: AssessmentFull) => {
    try { await markdownToPrintPdf(a.content, { title: a.title, trim: getTrim("8.5x11") }, a.title); }
    catch (e) { toast({ title: "Export failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const subjects = Array.from(new Set((items ?? []).map((i) => i.subject).filter(Boolean))) as string[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-educational/20 bg-educational/5 px-4 py-1.5 mb-4">
          <ClipboardList className="w-4 h-4 text-educational" /><span className="text-sm text-educational font-medium font-sans">Assessment bank</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Your <span className="text-gradient-gold italic">assessment bank</span></h1>
        <p className="mt-2 text-muted-foreground font-sans">Build a reusable library of quizzes, exams and worksheets — organized by subject and grade, ready to reuse and adapt across terms.</p>
      </motion.div>

      <Card className="mt-6 border-border"><CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label className="font-sans text-xs">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" maxLength={80} /></div>
          <div className="space-y-1.5"><Label className="font-sans text-xs">Grade / level</Label><Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 5" maxLength={60} /></div>
          <div className="space-y-1.5"><Label className="font-sans text-xs">Type</Label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as SchoolDocType)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans">
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="font-sans text-xs">Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fractions" maxLength={200} /></div>
          <div className="space-y-1.5"><Label className="font-sans text-xs">Curriculum / country (optional)</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" maxLength={80} list="country-options" /><CountryDatalist /></div>
        </div>
        <Button variant="hero" size="sm" onClick={generate} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Generate &amp; add to bank</Button>
      </CardContent></Card>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold">Saved items</h2>
        <div className="flex gap-2">
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-sans">
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Input value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} placeholder="Filter grade…" className="h-8 w-32 text-xs" />
        </div>
      </div>

      {items === null && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {items && items.length === 0 && <p className="mt-4 text-sm text-muted-foreground font-sans">Nothing in your bank yet — generate your first assessment above.</p>}
      {items && items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((a) => (
            <Card key={a.id} className="border-border"><CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-sans text-sm font-medium">{a.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground font-sans">
                  {a.subject && <span>{a.subject}</span>}{a.grade && <span>· {a.grade}</span>}{a.doc_type && <span>· {a.doc_type}</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => view(a.id)} title="View"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(a.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{viewing?.title}</DialogTitle></DialogHeader>
          {viewing && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="heroOutline" size="sm" onClick={() => exportPdf(viewing)}><FileDown className="mr-1 h-4 w-4" /> Export PDF</Button>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(viewing.content).catch(() => {}); toast({ title: "Copied" }); }}>Copy</Button>
                <Button variant="ghost" size="sm" onClick={() => setViewing(null)}><X className="mr-1 h-4 w-4" /> Close</Button>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-card/50 p-3 text-sm font-sans">{viewing.content}</pre>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentBank;
